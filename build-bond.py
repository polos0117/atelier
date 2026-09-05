#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""공식 사이트 탑승 관계에서 인연(BOND) 후보를 뽑는다.

official/pilot/relations.json 이 가진 '이 기체에 누가 탔는가' 를 play.html 의
PILOT / MECH 카드 이름으로 옮겨, BOND 에 아직 없는 짝만 골라낸다.

BOND 는 "파일럿|기체" 를 키로 쓰고 값은 0.12~0.22 의 보정치다. 지금은 손으로
관리하고 있어서, 여기서는 값을 정해 주지 않고 후보와 근거만 내놓는다.
얼마를 줄지는 밸런스 판단이라 사람이 정할 몫이다.

공식 이름과 저장소 이름이 다르다. 인물은 저장소가 성을 생략하고(아무로 레이 →
아무로), 기체는 형식번호를 붙이거나(건담 → RX-78-2 건담) 표기가 갈린다
(제피란서스/제피랜서스). gundam_match 의 규칙을 그대로 쓴다.

결과는 셋으로 나뉜다.
  ready    파일럿·기체 카드가 둘 다 있고 BOND 에 없다 — 바로 넣을 수 있다
  no_pilot 기체는 있는데 파일럿 카드가 없다 — PILOT 로스터에 넣을지가 먼저다
  known    이미 BOND 에 있다 — 공식 자료로 뒷받침된 셈이다

사용법:
    python3 build-bond.py            # bond-candidates.json 을 만든다
    python3 build-bond.py --report   # 사람이 읽을 형태로도 찍는다
"""
import argparse
import json
import os
import re
from collections import defaultdict

from gundam_match import norm, affixes

REL = "official/pilot/relations.json"
TARGET = "play.html"
OUT = "bond-candidates.json"


def block(src, name):
    m = re.search(r"var\s+" + name + r"\s*=(\[.*?\n\]);", src, re.S)
    if not m:
        raise SystemExit(f"[실패] {name} 을 찾지 못했다.")
    return json.loads(m.group(1))


def bond_map(src):
    m = re.search(r"var\s+BOND=\{(.*?)\n?\};", src, re.S)
    if not m:
        raise SystemExit("[실패] BOND 를 찾지 못했다.")
    return {k: float(v) for k, v in re.findall(r'"([^"]+)"\s*:\s*([\d.]+)', m.group(1))}


def index(names):
    """이름 → 카드 이름. 접사 변형도 같은 곳을 가리키게 넣는다."""
    idx = {}
    for n in names:
        idx.setdefault(norm(n), n)
    for n in names:
        for v in affixes(norm(n)):
            idx.setdefault(v, n)
    return idx


MODELISH = re.compile(r"^[a-z0-9\-]*[0-9][a-z0-9\-]*$")

# 공식 이름과 저장소 카드 이름이 너무 달라 규칙으로는 못 잇는 것들.
# roster-overrides.json 의 skip 과 같은 짝이다.
ALIAS_MECH = {
    "건담": "RX-78-2 건담",
    "샤아 전용 자쿠II": "샤아 전용 자쿠",
    "건담 AGE-1 노멀": "건담 AGE-1",
    "건담 AGE-2 노멀": "건담 AGE-2",
    "건담 AGE-3 노멀": "건담 AGE-3",
    "II세컨드 네오 지옹": "세컨드 네오지옹",
    "건담 Mk-Ⅱ 에우고 사양": "건담 Mk-II",
    "건담 Mk-Ⅱ 티탄즈 사양": "건담 Mk-II 티탄즈사양",
    "큐베레이 Mk-Ⅱ": "큐베레이 Mk-II 플기",
}


def find_mech(name, idx):
    if name in ALIAS_MECH:
        return ALIAS_MECH[name]
    q = norm(name)
    if q in idx:
        return idx[q]
    for v in affixes(q):
        if v in idx:
            return idx[v]
    # 저장소가 형식번호를 앞에 붙여 쓰는 경우 — 공식 '건담' ↔ 저장소 'RX-78-2 건담'
    hit = sorted({v for k, v in idx.items()
                  if k.endswith(q) and k != q and len(k) > len(q)
                  and MODELISH.match(k[: -len(q)])})
    return hit[0] if len(hit) == 1 else None


# 인물 이름 음역 차이. 공식과 저장소가 갈리는 것만 적는다.
PERSON = {"람바랄": "란바랄", "화유이리": "파유이리", "케리레즈너": "켈리레즈너",
          "네나트리니티": "넨나트리니티", "아미다아르카": "아미다아루카",
          "샤니앤드러스": "샤니앤드라스", "클로토브엘": "클로토뷰엘",
          "소피플로네": "소피프로네", "버나지링크스": "바나지링크스",
          "졸탄아카넨": "졸탄앗카넨", "대릴로렌츠": "다릴로렌츠",
          "죠르쥬드상드": "죠르쥬드사드", "아르고갈스키": "아르고가르스키",
          "티파아딜": "티파아디르", "윗츠수": "위츠수", "케라수": "케라스",
          "제하트가레트": "제하트갈렛", "안나마리브루제": "안나마리부르제",
          "오르바프로스트": "올바프로스트", "무라쿠모가이": "가이무라쿠모",
          "포무라사메": "포우", "그레미토토": "글레미"}


def find_pilot(name, idx):
    """공식은 성까지 쓰고 저장소는 줄여 쓴다. 뒷부분만 쓰기도 한다
    (팝티머스 시로코 → 시로코). 후보가 하나뿐일 때만 믿는다."""
    # '크와트로 바지나/샤아 아즈나블' 처럼 빗금으로 두 이름을 붙여 놓기도 한다
    for part in [p.strip() for p in re.split(r"[/·]", name) if p.strip()]:
        q = PERSON.get(norm(part), norm(part))
        if q in idx:
            return idx[q]
        cand = sorted({v for k, v in idx.items()
                       if len(k) >= 2 and (k.startswith(q) or q.startswith(k)
                                           or k.endswith(q) or q.endswith(k))})
        if len(cand) == 1:
            return cand[0]
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()

    if not os.path.exists(REL):
        raise SystemExit(f"[실패] {REL} 이 없다.")
    rel = json.load(open(REL, encoding="utf-8"))
    src = open(TARGET, encoding="utf-8").read()
    MECH, PILOT = block(src, "MECH"), block(src, "PILOT")
    BOND = bond_map(src)
    midx, pidx = index([r[0] for r in MECH]), index([r[0] for r in PILOT])

    ready, no_pilot, no_mech, known = [], [], [], []
    seen_pairs = set()
    for code, mechs in sorted(rel.items()):
        for oname, e in sorted(mechs.items()):
            dex_m = find_mech(oname, midx)
            for op in e["pilots"]:
                dex_p = find_pilot(op, pidx)
                row = {"series": code, "official_mech": oname, "official_pilot": op,
                       "mech": dex_m, "pilot": dex_p}
                if not dex_m:
                    no_mech.append(row)
                    continue
                if not dex_p:
                    no_pilot.append(row)
                    continue
                key = dex_p + "|" + dex_m
                if key in seen_pairs:
                    continue
                seen_pairs.add(key)
                row["key"] = key
                if key in BOND:
                    row["weight"] = BOND[key]
                    known.append(row)
                else:
                    ready.append(row)

    # 한 파일럿이 여러 기체를 타는 축 — 인연을 어디에 줄지 가늠하는 데 쓴다
    by_pilot = defaultdict(list)
    for r in ready + known:
        by_pilot[r["pilot"]].append(r["mech"])
    多 = {k: sorted(set(v)) for k, v in by_pilot.items() if len(set(v)) > 1}

    res = {
        "version": 1,
        "note": ("공식 사이트 탑승 관계에서 뽑은 인연 후보다. 값(0.12~0.22)은 "
                 "밸런스 판단이라 비워 둔다. ready 는 파일럿·기체 카드가 둘 다 "
                 "있고 BOND 에 없는 짝, no_pilot 은 파일럿 카드가 없어 먼저 "
                 "로스터 판단이 필요한 짝, known 은 이미 BOND 에 있어 공식 자료로 "
                 "뒷받침된 짝이다."),
        "source": {"relations": REL, "cards": TARGET,
                   "series_done": sorted(rel), "mechs_scanned": sum(len(v) for v in rel.values())},
        "summary": {"ready": len(ready), "no_pilot": len(no_pilot),
                    "no_mech": len(no_mech), "known": len(known),
                    "bond_existing": len(BOND)},
        "ready": ready,
        "no_pilot": no_pilot,
        "no_mech": no_mech,
        "known": known,
        "multi_mech_pilots": 多,
    }
    json.dump(res, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    s = res["summary"]
    print(f"[완료] {a.out}")
    print(f"  바로 넣을 수 있음 {s['ready']} · 파일럿 카드 없음 {s['no_pilot']} · "
          f"기체 카드 없음 {s['no_mech']} · 이미 있음 {s['known']}")
    print(f"  (기존 BOND {s['bond_existing']} 쌍)")

    if a.report:
        print("\n[바로 넣을 수 있는 후보]")
        for r in ready:
            print(f"  {r['pilot']}|{r['mech']}"
                  f"   ← 공식 {r['official_pilot']} / {r['official_mech']}")
        print("\n[파일럿 카드가 없어 보류]")
        for r in no_pilot:
            print(f"  {r['official_pilot']} → {r['mech']}")
        if 多:
            print("\n[여러 기체를 탄 파일럿]")
            for k, v in sorted(多.items(), key=lambda x: -len(x[1])):
                print(f"  {k}: {', '.join(v)}")


if __name__ == "__main__":
    main()
