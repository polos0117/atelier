#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
도감 카드 ↔ soshage(G Generation Eternal) ID 매핑표 생성기

게임 파일(play.html)의 MECH / PILOT 이름과 soshage 공개 API 의 unit / character
를 대조해 id-map.json 을 만든다.

매핑은 1:1 이 아니다.
  - 기체: 같은 기체가 통상판과 (EX) 판으로 나뉜다. 식별자는 이름이 아니라 models(형식번호)다.
  - 인물: 같은 인물이 시리즈별 참전분으로 여러 건 존재한다(아무로 레이 8건).
따라서 카드 하나에 API id 목록이 붙는다.

자동 판정은 근거가 분명한 것만 한다. 애매하면 review 로 내보내고 사람이 본다.
사람이 확정한 짝은 id-map.overrides.json 에 적어두면 다음 생성 때 그대로 쓰인다.
자동 규칙을 건드리는 것보다 이쪽이 안전하다.

사용법:
    python3 build-idmap.py                # API 를 받아 캐시에 저장하고 생성
    python3 build-idmap.py --offline      # 캐시만 사용(네트워크 없이 재생성)
    python3 build-idmap.py --report       # 검토·미수록 목록을 자세히 찍는다
    python3 build-idmap.py --source dex.html
"""
import argparse
import difflib
import json
import os
import re
import sys
import unicodedata
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone

API = "https://soshage.com/ggetapi/ko/{}"
ENTITIES = ["unit", "character", "series"]
CACHE = ".cache/soshage"
# 카드 데이터의 원본은 게임 파일이다. dex.html 은 build-dex.py 가 거기서 뽑아낸
# 생성물이라, 게임 파일이 갱신되고 도감을 아직 안 만들었으면 뒤처져 있다.
SOURCES = ["play.html", "dex.html"]
OUT = "id-map.json"
OVERRIDES = "id-map.overrides.json"

from gundam_match import (        # 이름 대조 규칙은 공용 모듈에 모아 두었다
    TRANSLIT, TAIL, PAREN, EX_MARK, EW, norm, affixes,
)

FUZZY_CUTOFF = 0.60   # 이 아래는 후보로도 내놓지 않는다
FUZZY_TOP = 3


# ---------------------------------------------------------------- 입력

def fetch(entity, cache_dir, offline):
    """API 응답을 캐시에 받아둔다. 캐시가 있으면 그대로 쓴다."""
    path = os.path.join(cache_dir, entity + ".json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    if offline:
        raise SystemExit(f"[실패] --offline 인데 캐시가 없다: {path}")
    os.makedirs(cache_dir, exist_ok=True)
    url = API.format(entity)
    print(f"[받는 중] {url}", file=sys.stderr)
    with urllib.request.urlopen(url, timeout=180) as r:
        data = json.load(r)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"  → {len(data)}건, {os.path.getsize(path) / 1e6:.1f}MB", file=sys.stderr)
    return data


def pick_source(explicit):
    """카드 데이터를 읽을 파일을 고른다."""
    for p in ([explicit] if explicit else SOURCES):
        if os.path.exists(p):
            return p
    raise SystemExit(f"[실패] 카드 원본을 찾지 못했다: {explicit or ' / '.join(SOURCES)}")


def dex_block(src, name, path):
    """`var NAME=[...];` 배열을 JSON 으로 읽는다."""
    m = re.search(r"var\s+" + name + r"\s*=(\[.*?\n\]);", src, re.S)
    if not m:
        raise SystemExit(f"[실패] {path} 에서 {name} 을 찾지 못했다.")
    return json.loads(m.group(1))


def load_overrides(path):
    if not os.path.exists(path):
        return {"mech": {}, "pilot": {}}
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    return {"mech": d.get("mech", {}), "pilot": d.get("pilot", {})}


# ---------------------------------------------------------------- 색인

def series_index(series):
    """series_set_id → 시리즈명.
    unit.series 가 가리키는 것은 series_id 가 아니라 series_set_id 다."""
    idx = {}
    for row in series:
        s = row.get("series")
        if isinstance(s, dict):
            idx.setdefault(row["series_set_id"], s.get("name"))
    return idx


def unit_groups(units, sidx):
    """기체를 '(EX) 를 뗀 이름' 으로 묶는다.

    형식번호로 묶으면 너무 거칠다. RX-0 하나에 유니콘·밴시·페넥스가 다 들어가고
    RX-178 에 에우고 사양과 티탄즈 사양이 같이 들어가는데, 저장소는 이들을
    각각 별개 카드로 센다. 반면 통상판과 (EX) 판은 같은 기체이므로 묶는다."""
    g = defaultdict(lambda: {"models": "", "names": set(), "ids": [], "series": set()})
    for u in units:
        e = g[norm(EX_MARK.sub("", u["name"]), keep_paren=True)]
        e["models"] = e["models"] or (u.get("models") or "")
        e["names"].add(u["name"])
        e["ids"].append(u["id"])
        s = sidx.get(u.get("series"))
        if s:
            e["series"].add(s)
    return dict(g)


def char_groups(chars):
    """인물을 이름으로 묶는다. 시리즈별 참전분이 한 묶음이 된다."""
    g = defaultdict(lambda: {"models": "", "names": set(), "ids": [], "series": set()})
    for c in chars:
        e = g[norm(c["name"])]
        e["names"].add(c["name"])
        e["ids"].append(c["id"])
    return dict(g)


def name_index(groups):
    """대조에 쓰는 세 갈래 색인.
    base  : 괄호 주석을 뗀 이름       — '자쿠Ⅱ (선더볼트 Ver.)' → '자쿠ii'
    full  : 괄호 주석까지 살린 이름   — 위 예는 '자쿠ii선더볼트ver'
    ew    : '(EW Ver.)' 를 꼬리 EW 로 옮긴 형 — 저장소 표기가 이 꼴이다
    """
    base, full, ew = defaultdict(set), defaultdict(set), defaultdict(set)
    for k, e in groups.items():
        for n in e["names"]:
            base[norm(n)].add(k)
            full[norm(n, keep_paren=True)].add(k)
            if EW.search(n):
                ew[norm(EW.sub("", n)) + "ew"].add(k)
    return base, full, ew


# ---------------------------------------------------------------- 대조

def pick(cands, q, full):
    """후보가 여럿이면, 괄호까지 포함한 이름이 질의와 정확히 같은 쪽을 고른다.
    '자쿠II' 는 '자쿠Ⅱ' 와 '자쿠Ⅱ (선더볼트 Ver.)' 중 앞쪽이다."""
    cands = set(cands)
    if len(cands) == 1:
        return next(iter(cands))
    exact = cands & full.get(q, set())
    if len(exact) == 1:
        return next(iter(exact))
    return None


def match(card, groups, idx, models, kind):
    """근거가 강한 순서로 본다. (근거, 그룹키, 후보목록, 점수) 를 돌려준다."""
    base, full, ew = idx
    q = norm(card)

    # 형식번호가 이름에 박혀 있는 경우 — 저장소의 'RX-78-2 건담' 같은 표기
    if kind == "mech":
        hits = [(m, ks) for m, ks in models.items() if len(m) >= 3 and m in q]
        if hits:
            longest = max(len(m) for m, _ in hits)
            best = [ks for m, ks in hits if len(m) == longest]
            if len(best) == 1:
                k = pick(best[0], q, full)
                if k:
                    return "model", k, None, None

    if q in full:
        k = pick(full[q], q, full)
        if k:
            return "exact", k, None, None
    if q in base:
        k = pick(base[q], q, full)
        if k:
            return "exact", k, None, None
    if q in ew:
        k = pick(ew[q], q, full)
        if k:
            return "ew", k, None, None

    for v in affixes(q) - {q}:
        for table, how in ((full, "affix"), (base, "affix")):
            if v in table:
                k = pick(table[v], v, full)
                if k:
                    return how, k, None, None

    # 성을 생략한 표기 — '아무로' → '아무로 레이'. 후보가 하나뿐일 때만 믿는다.
    if kind == "pilot":
        cand = {k for n, ks in base.items()
                if len(n) >= 2 and (n.startswith(q) or q.startswith(n)) for k in ks}
        if len(cand) == 1:
            return "prefix", next(iter(cand)), None, None
        if cand:
            return None, None, sorted(cand), None

    # 여기까지 왔으면 자동으로 정하지 않는다. 비슷한 것만 후보로 내놓는다.
    near = difflib.get_close_matches(q, list(base), n=FUZZY_TOP, cutoff=FUZZY_CUTOFF)
    if near:
        cand, score = [], {}
        for n in near:
            for k in sorted(base[n]):   # 집합 순회 순서에 결과가 흔들리지 않게 고정한다
                cand.append(k)
                score[k] = round(difflib.SequenceMatcher(None, q, n).ratio(), 3)
        return None, None, cand, score

    contains = sorted({k for n, ks in base.items()
                       if len(n) >= 3 and (n in q or q in n) for k in ks})
    if contains:
        return None, None, contains[:FUZZY_TOP], None
    return None, None, None, None


# ---------------------------------------------------------------- 조립

def entry(card, how, group, kind, extra=None):
    e = {
        "dex": card,
        "match": how,
        "api_name": sorted(group["names"])[0],
        "ids": sorted(group["ids"]),
    }
    if kind == "mech":
        e["models"] = group["models"]
        e["series"] = sorted(group["series"])
    if extra:
        e.update(extra)
    return e


def build(dex_rows, groups, idx, models, kind, overrides):
    base, full, _ = idx
    rows, review, unmatched, bad = [], [], [], []
    for r in dex_rows:
        card = r[0]

        # 사람이 확정해둔 짝이 먼저다.
        if card in overrides:
            target = overrides[card]
            keys = full.get(norm(target, keep_paren=True)) or base.get(norm(target))
            if keys and len(keys) == 1:
                rows.append(entry(card, "override", groups[next(iter(keys))], kind))
                continue
            bad.append({"dex": card, "target": target,
                        "reason": "API 에 없는 이름" if not keys else "후보가 여럿"})

        how, key, cand, score = match(card, groups, idx, models, kind)
        if how:
            rows.append(entry(card, how, groups[key], kind))
        elif cand:
            review.append({
                "dex": card,
                "candidates": [
                    {"api_name": sorted(groups[k]["names"])[0],
                     "ids": sorted(groups[k]["ids"]),
                     **({"models": groups[k]["models"]} if kind == "mech" else {}),
                     **({"score": score[k]} if score and k in score else {})}
                    for k in dict.fromkeys(cand)
                ],
            })
        else:
            unmatched.append(card)
    return rows, review, unmatched, bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true", help="캐시만 쓰고 네트워크를 타지 않는다")
    ap.add_argument("--cache-dir", default=CACHE)
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--overrides", default=OVERRIDES)
    ap.add_argument("--source", help=f"카드 원본 HTML (기본: {' → '.join(SOURCES)} 순으로 찾는다)")
    ap.add_argument("--report", action="store_true", help="검토·미수록 목록을 자세히 찍는다")
    a = ap.parse_args()

    data = {e: fetch(e, a.cache_dir, a.offline) for e in ENTITIES}
    path = pick_source(a.source)
    src = open(path, encoding="utf-8").read()
    MECH = dex_block(src, "MECH", path)
    PILOT = dex_block(src, "PILOT", path)
    ov = load_overrides(a.overrides)

    sidx = series_index(data["series"])
    ug, cg = unit_groups(data["unit"], sidx), char_groups(data["character"])
    ui, ci = name_index(ug), name_index(cg)

    umodels = defaultdict(set)
    for k, e in ug.items():
        if e["models"]:
            umodels[norm(e["models"])].add(k)

    m_rows, m_rev, m_un, m_bad = build(MECH, ug, ui, umodels, "mech", ov["mech"])
    p_rows, p_rev, p_un, p_bad = build(PILOT, cg, ci, {}, "pilot", ov["pilot"])

    out = {
        "version": 1,
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": {
            "api": API.format("{entity}"),
            "entities": {e: len(data[e]) for e in ENTITIES},
            "cards": {"file": path, "MECH": len(MECH), "PILOT": len(PILOT)},
        },
        "note": (
            "카드 1건에 API id 가 여러 개 붙는다. 기체는 통상판과 (EX) 판, "
            "인물은 시리즈별 참전분이 각각 별개 id 이기 때문이다. "
            "review 는 사람이 확인해 id-map.overrides.json 에 옮겨 적는다."
        ),
        "match_kinds": {
            "override": "id-map.overrides.json 에 사람이 확정해둔 짝",
            "model": "카드 이름에 형식번호가 박혀 있다 (RX-78-2 건담 → RX-78-2)",
            "exact": "정규화한 이름이 그대로 같다",
            "affix": "'건담' 을 붙이거나 떼면 같다 (에피온 → 건담 에피온)",
            "ew": "저장소의 꼬리 EW 가 API 의 (EW Ver.) 에 대응한다",
            "prefix": "카드 쪽이 성을 생략했다 (아무로 → 아무로 레이)",
        },
        "summary": {
            "mech": {"matched": len(m_rows), "review": len(m_rev),
                     "unmatched": len(m_un), "total": len(MECH)},
            "pilot": {"matched": len(p_rows), "review": len(p_rev),
                      "unmatched": len(p_un), "total": len(PILOT)},
        },
        "mech": m_rows,
        "pilot": p_rows,
        "review": {"mech": m_rev, "pilot": p_rev},
        "unmatched": {"mech": m_un, "pilot": p_un},
    }
    if m_bad or p_bad:
        out["bad_overrides"] = {"mech": m_bad, "pilot": p_bad}

    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    s = out["summary"]
    print(f"[완료] {a.out}  (카드 원본: {path})")
    for k in ("mech", "pilot"):
        v = s[k]
        print(f"  {k:6} 매칭 {v['matched']:>3}/{v['total']:<3} "
              f"({100 * v['matched'] // v['total']:>2}%)"
              f"  검토 {v['review']:>3}  미수록 {v['unmatched']:>3}")
    by = defaultdict(int)
    for r in m_rows + p_rows:
        by[r["match"]] += 1
    print("  근거별:", ", ".join(f"{k} {v}" for k, v in sorted(by.items())))
    for kind, bad in (("mech", m_bad), ("pilot", p_bad)):
        for b in bad:
            print(f"  [오버라이드 무효] {kind} {b['dex']} → {b['target']} ({b['reason']})")

    if a.report:
        for k in ("mech", "pilot"):
            if out["review"][k]:
                print(f"\n[{k} 검토 {len(out['review'][k])}]")
                for r in out["review"][k]:
                    c = ", ".join(
                        x["api_name"] + (f"({x['score']})" if "score" in x else "")
                        for x in r["candidates"])
                    print(f"  {r['dex']} → {c}")
            if out["unmatched"][k]:
                print(f"\n[{k} 미수록 {len(out['unmatched'][k])}]")
                print("  " + ", ".join(out["unmatched"][k]))


if __name__ == "__main__":
    main()
