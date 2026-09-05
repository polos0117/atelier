#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""건담 공식 사이트 목록 ↔ 저장소 로스터 대조

kr.gundam-official.com 의 `series/<슬러그>/mecha` 목록을 받아 둔 캐시와
play.html 의 MECH / SHIP 을 대조해, 저장소에 없는 것만 골라낸다.
ROSTER_CHECK.md 가 손으로 하던 대조를 그대로 자동화한 것이다.

공식 목록은 기체와 함선을 한 페이지에 섞어 싣고 마스코트(하로)나 차량도
끼워 넣는다. ROSTER_CHECK 규칙에 따라 셋으로 갈라 놓는다.

목록은 Firecrawl 로 받아 official/mecha/<코드>.json 에 넣어 둔다. 이 환경에서
공식 사이트는 직접 접근이 막혀 있고 자바스크립트 렌더링 페이지라 단순 요청으로는
목록이 안 나온다. 받는 일은 이 스크립트가 하지 않는다 — 받아 둔 것을 읽기만 한다.
크레딧을 들여 받은 자료라 캐시가 아니라 저장소에 함께 둔다.
official-slugs.json 이 저장소 시리즈 코드와 공식 사이트 슬러그를 이어 준다.

사용법:
    python3 build-official.py            # 대조해서 official-diff.json 을 만든다
    python3 build-official.py --report   # 사람이 읽을 형태로도 찍는다
"""
import argparse
import json
import os
import re
from datetime import datetime, timezone

from gundam_match import norm, affixes, is_ship, is_excluded, is_variant, close

SOURCES = ["play.html", "dex.html"]
CACHE = "official/mecha"
SLUGS = "official-slugs.json"
OUT = "official-diff.json"


def pick_source():
    for p in SOURCES:
        if os.path.exists(p):
            return p
    raise SystemExit("[실패] 카드 원본을 찾지 못했다: " + " / ".join(SOURCES))


def block(src, name, path):
    m = re.search(r"var\s+" + name + r"\s*=(\[.*?\n\]);", src, re.S)
    if not m:
        raise SystemExit(f"[실패] {path} 에서 {name} 을 찾지 못했다.")
    return json.loads(m.group(1))


def index(rows):
    """이름 → 원본 표기. 접사 변형도 같은 곳을 가리키게 넣어 둔다."""
    idx = {}
    for r in rows:
        idx.setdefault(norm(r[0]), r[0])
    for r in rows:                       # 변형은 나중에 넣어 원형을 덮지 않는다
        for v in affixes(norm(r[0])):
            idx.setdefault(v, r[0])
    return idx


MODELISH = re.compile(r"^[a-z0-9\-]*[0-9][a-z0-9\-]*$")


def lookup(name, idx):
    q = norm(name)
    if q in idx:
        return idx[q]
    for v in affixes(q):
        if v in idx:
            return idx[v]
    # 저장소가 형식번호를 이름에 붙여 쓰는 경우 — 공식 '건담' ↔ 저장소 'RX-78-2 건담'.
    # 앞부분이 형식번호꼴일 때만 인정한다. 아니면 '윙 건담' 까지 걸려든다.
    if len(q) >= 2:
        hit = prefixed(q, idx)
        if len(hit) == 1:
            return hit[0]
    return None


def prefixed(q, idx):
    """저장소 이름이 '<형식번호> <공식이름>' 꼴인 후보들."""
    return sorted({v for k, v in idx.items()
                   if k.endswith(q) and k != q and len(k) > len(q)
                   and MODELISH.match(k[: -len(q)])})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()

    path = pick_source()
    src = open(path, encoding="utf-8").read()
    MECH, SHIP = block(src, "MECH", path), block(src, "SHIP", path)
    midx, sidx = index(MECH), index(SHIP)
    mpool, spool = set(midx), set(sidx)

    slugs = json.load(open(SLUGS, encoding="utf-8")) if os.path.exists(SLUGS) else {}
    out, done = {}, []
    for code in sorted(slugs):
        f = os.path.join(CACHE, code + ".json")
        if not os.path.exists(f):
            continue
        done.append(code)
        off = json.load(open(f, encoding="utf-8"))
        add_m, add_s, var, skip, seen = [], [], [], [], []
        for fac, names in off.items():
            for n in names:
                if is_excluded(n):
                    skip.append(n)
                    continue
                ship = is_ship(n)
                hit = lookup(n, sidx if ship else midx) or lookup(n, midx if ship else sidx)
                if hit:
                    seen.append({"official": n, "dex": hit})
                    continue
                pool = sidx if ship else midx
                cand = [{"dex": d, "score": None} for d in prefixed(norm(n), pool)]
                seen_d = {c["dex"] for c in cand}
                for k, v in close(norm(n), spool if ship else mpool):
                    if pool[k] not in seen_d:   # 색인이 한 카드를 여러 키로 가리켜 중복이 난다
                        cand.append({"dex": pool[k], "score": v})
                        seen_d.add(pool[k])
                row = {"name": n, "faction": fac}
                if cand:
                    row["near"] = cand
                if ship:
                    add_s.append(row)
                elif is_variant(n):
                    var.append(row)      # 배리에이션은 따로 모은다
                else:
                    add_m.append(row)
        out[code] = {
            "official_total": sum(len(v) for v in off.values()),
            "factions": list(off),
            "matched": len(seen),
            "add_mech": add_m,
            "add_ship": add_s,
            "variants": var,
            "excluded": skip,
        }

    res = {
        "version": 1,
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": {"cards": path, "official": "kr.gundam-official.com",
                   "series_done": done, "series_pending":
                   sorted(set(slugs) - set(done))},
        "note": ("공식 사이트 목록에서 저장소에 없는 것만 뽑았다. near 는 표기가 비슷한 "
                 "기존 카드로, 같은 대상인지 사람이 봐야 한다. 함선은 SHIP 으로 "
                 "돌리고 마스코트·차량은 제외했다."),
        "summary": {c: {"공식": v["official_total"], "보유": v["matched"],
                        "기체추가": len(v["add_mech"]), "함선추가": len(v["add_ship"]),
                        "배리에이션": len(v["variants"])}
                    for c, v in out.items()},
        "series": out,
    }
    json.dump(res, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print(f"[완료] {a.out}  (대조 {len(done)} 시리즈 / 남은 {len(res['source']['series_pending'])})")
    tm = sum(len(v["add_mech"]) for v in out.values())
    ts = sum(len(v["add_ship"]) for v in out.values())
    tv = sum(len(v["variants"]) for v in out.values())
    print(f"  기체 추가 후보 {tm} · 함선 추가 후보 {ts} · 배리에이션(보류) {tv}")
    for c, v in res["summary"].items():
        print(f"  {c:9} 공식 {v['공식']:>3}  보유 {v['보유']:>3}  "
              f"기체+{v['기체추가']:<3} 함선+{v['함선추가']:<2} 배리에이션 {v['배리에이션']}")

    if a.report:
        for c, v in out.items():
            if not (v["add_mech"] or v["add_ship"]):
                continue
            print(f"\n[{c}]")
            for r in v["add_mech"]:
                n = ("  ~ " + ", ".join(f"{x['dex']}({x['score']})" for x in r["near"])
                     if "near" in r else "")
                print(f"  기체 + {r['name']} ({r['faction']}){n}")
            for r in v["add_ship"]:
                n = ("  ~ " + ", ".join(f"{x['dex']}({x['score']})" for x in r["near"])
                     if "near" in r else "")
                print(f"  함선 + {r['name']} ({r['faction']}){n}")


if __name__ == "__main__":
    main()
