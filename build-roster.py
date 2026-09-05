#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""공식 사이트 대조 결과를 play.html 의 로스터에 넣는다.

official-diff.json 이 골라낸 추가 후보(기체·함선)를 카드로 만들어
play.html 의 MECH / SHIP 에 붙이고, 드래프트 등장 비중을 WEIGHT 에 적는다.

카드를 다 넣되 드래프트에서 비중을 두는 방식이다. 도감은 완비되고
팩에 잡히는 체감은 지금과 비슷하게 남는다.

  1.0  기존 272 기 — 주역·라이벌기
  0.4  새로 드는 것 중 건담 타입이거나 soshage 상위 레어도(4~5)인 기체
  0.15 양산기와 장비·사양 배리에이션

스탯은 지어내는 수밖에 없다. soshage 수치를 212 기로 맞춰 봤더니 축끼리
상관이 0.27~0.54 로 낮고 대응도 어긋나 옮겨 쓸 수 없었다. 게임 밸런스용
수치와 원작 인상 기준 수치는 서로 다른 것을 재고 있다.
그래서 기존 카드의 분포를 그대로 따른다. 특성이 가장 잘 갈라서(양산
65/67/65/66, 사이코뮤 90/88/82/78, 핵동력 92/89/83/91) 특성을 먼저 정하고
그 평균에서 이름 해시만큼 흔들어 배정한다. 같은 이름은 늘 같은 값이 나온다.

사람이 고칠 값은 roster-overrides.json 에 적는다. 규칙을 건드리는 것보다
안전하고, 다시 생성해도 남는다.

사용법:
    python3 build-roster.py --dry-run   # 무엇이 들어갈지만 본다
    python3 build-roster.py             # play.html 을 고친다
"""
import argparse
import hashlib
import json
import os
import re
from collections import defaultdict

from gundam_match import norm, affixes

DIFF = "official-diff.json"
TARGET = "play.html"
OVERRIDES = "roster-overrides.json"
SOSHAGE = ".cache/soshage/unit.json"

# 공식 사이트의 소속 표기를 저장소 FAC 키에 잇는다.
# 왼쪽이 없는 것은 세력이 아니라 분류 머리말(건담/모빌슈트/함선)이라 시리즈로 정한다.
FACTION = {
    "지구연방군": "연방", "지구연방": "연방", "지구연방군 / 어로우즈": "어로우즈",
    "지구연방군/기타": "연방", "지구연방군(무어 동포단)": "연방",
    "지구연방군(플리트편)": "연방", "지구연방군(아세무편)": "연방",
    "지구연방군(키오편/3세대편)": "연방",
    "지온 공국군": "지온", "지온 공국군(리빙 데드 사단)": "지온", "지온 잔당군": "지온",
    "에우고": "에우고", "티탄즈": "티탄즈", "액시즈": "네오지온", "네오 지온": "네오지온",
    "카라바": "카라바", "민간": "재야", "기타": "재야", "기타, 함정": "재야",
    "솔레스탈 빙": "소레스탈비잉", "에이전트": "소레스탈비잉",
    "Ribonzu의 사병": "이노베이드", "이노베이터": "이노베이드",
    "왕류밍의 사병": "재야", "유엔군": "연방", "어로우즈": "어로우즈",
    "인류혁신연맹": "인류혁신연맹", "Azadistan 왕국": "아자디스탄",
    "라 이덴라": "재야", "유니온": "유니온", "AEU": "AEU", "PMC": "재야",
    "카타론": "카타론",
    "건담": "철화단", "모빌슈트": "걀라르호른", "모빌워커": "철화단",
    "함선": "철화단", "Carrier": "철화단",
    "건담(2기)": "철화단", "모빌슈트(2기)": "걀라르호른",
    "기타(2기)": "재야", "함선(2기)": "철화단",
    "신세 개발 공사": "오크스어스", "주식회사 건담": "아스티카시아",
    "제타크 기숙사의": "잔토뷔넨", "제타크 헤비 머시너리": "잔토뷔넨",
    "페일 기숙사의": "페일", "페일 테크놀로지스": "페일",
    "글래스레이 기숙사": "그라스레", "그래슬리 디펜스 시스템즈": "그라스레",
    "지구 기숙사": "아스티카시아", "아스티카시아 고등 전문 학원": "아스티카시아",
    "프론트 관리사": "아스티카시아", "브리온 사": "아스티카시아",
    "Dawn of Fold": "재야", "옥스 어스 코퍼레이션": "오크스어스",
    "도미니코스 부대": "셸미라주",
    "네오 재팬": "네오재팬", "네오 홍콩": "네오홍콩", "네오 도이치": "네오재팬",
    "네오 아메리카": "네오아메리카", "네오 차이나": "네오차이나",
    "네오 프랑스": "네오프랑스", "네오 러시아": "네오러시아",
    "네오 스웨덴": "네오재팬", "세계의 건담": "재야",
    "데빌 건담 군단": "재야", "셔플 동맹": "재야",
    "리가 밀리티어": "리가밀리티아", "잔스칼 제국": "잔스칼",
    "잉그렛사 미리샤": "밀리시아", "루자나 미리샤": "밀리시아",
    "디아나 카운터": "문레이스", "깅가남 함대": "문레이스",
    "남양 동맹": "지온", "DSSD": "재야", "지구연합군": "지구연합",
    "크로스본 뱅가드": "크로스본뱅가드",
    "자람(플리트편)": "재야", "에우바(플리트편)": "재야",
    "UE(언노운 에너미)(플리트편)": "베이건", "기타(플리트편)": "재야",
    "베이건(아세무편)": "베이건", "베이건(키오편/3세대편)": "베이건",
    "우주 해적 비시디언(키오편/3세대편)": "재야", "기타(키오편/3세대편)": "재야",
    "전체": None,
}

# 소속을 안 나눠 싣는 시리즈의 기본 세력. FACTION 이 못 정한 자리를 메운다.
SERIES_FAC = {
    "SEED": "자프트", "DESTINY": "자프트", "FREEDOM": "컴퍼스",
    "ASTRAY": "지구연합", "W": "OZ", "EW": "OZ", "X": "프리덴",
    "NT": "연방", "HATHAWAY": "마프티", "GQ": "지온", "TB": "연방",
    "00M": "소레스탈비잉", "V": "리가밀리티아", "G": "네오재팬",
}

# 새로 생기는 세력의 색. FAC 에 없으면 카드 테두리 색이 안 잡힌다.
NEW_FAC = {"어로우즈": "#5F6A8C", "유니온": "#4F7FA8", "AEU": "#6A8C5F",
           "카타론": "#7A6A55", "걀라르호른": "#8C7A4F"}

# 시리즈별로 그 시리즈 건담 타입이 갖는 특성. 없으면 시작기로 둔다.
SERIES_TRAIT = {
    "00": "GN드라이브", "00M": "GN드라이브", "WM": "GUND",
    "IBO": "아르비", "G": "모빌트레이스",
    "SEED": "핵동력", "DESTINY": "핵동력", "FREEDOM": "핵동력",
}
# 사이코뮤 계열로 보는 이름. 판넬·비트를 쓰는 기체들이다.
PSYCO = re.compile(r"(큐베레이|지옹|엘메스|사이코|판넬|비트|아질|네오 지옹|퀸 만사|"
                   r"도벤 울프|게마르크|크샤트리야|시난주|페넥스|밴시|유니콘|나이팅게일)")

# 특성별 4축 평균과 흔들림. 기존 272 기에서 뽑은 값이다.
TRAIT_STAT = {
    "양산":        ((65, 67, 65, 66), (7, 7, 7, 9)),
    "시작기":      ((80, 80, 77, 79), (5, 6, 6, 10)),
    "사이코뮤":    ((90, 88, 82, 78), (5, 6, 8, 15)),
    "GN드라이브":  ((83, 84, 77, 82), (7, 7, 6, 11)),
    "핵동력":      ((92, 89, 83, 91), (3, 3, 3, 4)),
    "아르비":      ((85, 84, 87, 72), (5, 5, 7, 12)),
    "모빌트레이스": ((84, 84, 81, 80), (9, 8, 8, 14)),
    "GUND":        ((86, 81, 78, 87), (4, 3, 2, 3)),
}
TEMPER = ["헌신", "냉정", "오만", "폭주"]      # 기존 분포가 83/82/57/50 으로 고른 편이다
SHIP_STAT = ((72, 70, 73), (9, 11, 8))

W_MAIN, W_SUB, W_MASS = 1.0, 0.4, 0.15


def h(name, salt):
    """이름에서 뽑는 고정 난수. 같은 이름은 늘 같은 값이 나온다."""
    d = hashlib.sha256((salt + "|" + name).encode()).digest()
    return int.from_bytes(d[:4], "big") / 0xFFFFFFFF


def jitter(name, base, sd, axis):
    """평균에서 표준편차만큼 흔든다. 삼각분포라 가운데가 두껍다."""
    v = base + (h(name, f"s{axis}a") + h(name, f"s{axis}b") - 1.0) * sd * 1.7
    return max(30, min(98, int(round(v))))


def trait_of(name, code, variant, top):
    """top 은 soshage 최고 레어도 기체라는 뜻. 이름에 '건담' 이 없어도
    디 오나 퀸 만사처럼 이름값 하는 기체가 있어 그 신호를 같이 본다."""
    if variant:
        return "양산"
    if PSYCO.search(name):
        return "사이코뮤"
    if "건담" in name or top:
        return SERIES_TRAIT.get(code, "시작기")
    return "양산"


def load_soshage():
    if not os.path.exists(SOSHAGE):
        return {}
    idx = {}
    for x in json.load(open(SOSHAGE, encoding="utf-8")):
        for k in filter(None, [x.get("name"), x.get("short_name"), x.get("models")]):
            idx.setdefault(norm(k), x)
    return idx


def rarity(name, sx):
    q = norm(name)
    u = sx.get(q)
    if not u:
        for v in affixes(q):
            if v in sx:
                u = sx[v]
                break
    return u.get("rarity", 0) if u else 0


def collect(diff, sx, ov):
    """시리즈를 넘나드는 중복을 접고 카드 한 장씩으로 만든다."""
    mech, ship = {}, {}
    for code, v in diff["series"].items():
        for kind, rows in (("mech", v["add_mech"]), ("var", v["variants"]),
                           ("ship", v["add_ship"])):
            for r in rows:
                name = r["name"]
                key = norm(name)
                box = ship if kind == "ship" else mech
                if key in box:
                    if code not in box[key]["series"]:
                        box[key]["series"].append(code)
                    continue
                fac = FACTION.get(r["faction"], r["faction"])
                box[key] = {"name": name, "series": [code],
                            "faction": fac, "variant": kind == "var"}
    # 이미 저장소에 다른 이름으로 있는 것은 뺀다. 공식 '건담' 은 저장소의
    # 'RX-78-2 건담' 이고 '건담 AGE-1 노멀' 은 '건담 AGE-1' 이다. 이름이 너무
    # 달라 자동 대조가 못 잡으므로 사람이 적어 준다.
    skip = {norm(x) for x in ov.get("skip", [])}
    mech = {k: v for k, v in mech.items() if k not in skip}
    ship = {k: v for k, v in ship.items() if k not in skip}

    # 사람이 정한 값이 먼저다
    for key, e in mech.items():
        o = ov.get("mech", {}).get(e["name"])
        if o:
            e.update(o)
    return mech, ship


def build_rows(mech, ship, sx, series_fallback):
    mrows, srows, weight = [], [], {}
    for e in sorted(mech.values(), key=lambda x: (x["series"][0], x["name"])):
        n = e["name"]
        code = e["series"][0]
        top = rarity(n, sx) >= 4   # 4 부터가 그 시리즈의 이름값 하는 기체다
        fac = (e.get("faction") or SERIES_FAC.get(code)
               or series_fallback.get(code, "재야"))
        trait = e.get("trait") or trait_of(n, code, e["variant"], top)
        base, sd = TRAIT_STAT[trait]
        stats = [jitter(n, base[i], sd[i], i) for i in range(4)]
        if "stats" in e:
            stats = e["stats"]
        temper = e.get("temper") or TEMPER[int(h(n, "t") * 4) % 4]
        mrows.append([n, [fac], stats[0], stats[1], stats[2], stats[3],
                      temper, trait, e["series"]])
        weight[n] = W_MASS if (e["variant"] or trait == "양산") else W_SUB
    for e in sorted(ship.values(), key=lambda x: (x["series"][0], x["name"])):
        n = e["name"]
        fac = (e.get("faction") or SERIES_FAC.get(e["series"][0])
               or series_fallback.get(e["series"][0], "재야"))
        base, sd = SHIP_STAT
        st = [jitter(n, base[i], sd[i], i) for i in range(3)]
        crew = 3 + int(h(n, "c") * 3)
        srows.append([n, [fac], st[0], st[1], st[2], crew, e["series"]])
        weight[n] = W_SUB
    return mrows, srows, weight


def js_rows(rows):
    return "".join(json.dumps(r, ensure_ascii=False) + ",\n" for r in rows)


def patch(src, mrows, srows, weight):
    """MECH / SHIP 끝에 새 줄을 붙이고 WEIGHT 를 넣는다."""
    def append(block, rows):
        m = re.search(r"(var\s+" + block + r"\s*=\[.*?)(\n\];)", src_holder[0], re.S)
        if not m:
            raise SystemExit(f"[실패] {block} 을 찾지 못했다.")
        # 배열 안에는 주석을 넣지 않는다. build-idmap.py 와 build-official.py 가
        # 이 블록을 json 으로 읽기 때문에 주석이 있으면 파싱이 깨진다.
        src_holder[0] = (src_holder[0][:m.end(1)] + ",\n"
                         + js_rows(rows).rstrip(",\n") + m.group(2)
                         + src_holder[0][m.end(2):])
    src_holder = [src]
    append("MECH", mrows)
    append("SHIP", srows)

    # 새 세력 색
    fac_add = "".join(f'"{k}":"{v}",' for k, v in NEW_FAC.items())
    src_holder[0] = src_holder[0].replace(
        'var FAC={', 'var FAC={' + fac_add, 1)

    # 드래프트 비중. 적지 않은 카드는 1 로 본다.
    w = ("\n/* 드래프트 팩에 뜨는 비중. 적지 않은 카드는 1 이다.\n"
         "   도감에는 다 있고 팩에서만 굵기를 달리한다. */\n"
         "var WEIGHT=" + json.dumps(weight, ensure_ascii=False) + ";\n"
         "function wOf(c){var w=WEIGHT[c[0]];return w===undefined?1:w}\n")
    src_holder[0] = src_holder[0].replace("\nvar MECH_SET=null;", w + "\nvar MECH_SET=null;", 1)

    # 균등 셔플을 가중 추출로 바꾼다.
    # random^(1/w) 를 키로 정렬하면 비복원 가중 추출이 된다(Efraimidis-Spirakis).
    old = ("  for(i=idx.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),"
           "t=idx[i];idx[i]=idx[j];idx[j]=t}")
    new = ("  var key={};for(i=0;i<idx.length;i++)"
           "key[idx[i]]=Math.pow(Math.random(),1/wOf(src[idx[i]]));\n"
           "  idx.sort(function(a,b){return key[b]-key[a]});")
    if old not in src_holder[0]:
        raise SystemExit("[실패] drawPack 의 셔플부를 찾지 못했다.")
    src_holder[0] = src_holder[0].replace(old, new, 1)
    return src_holder[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--target", default=TARGET)
    a = ap.parse_args()

    diff = json.load(open(DIFF, encoding="utf-8"))
    ov = json.load(open(OVERRIDES, encoding="utf-8")) if os.path.exists(OVERRIDES) else {}
    sx = load_soshage()

    src = open(a.target, encoding="utf-8").read()
    # 시리즈별로 가장 흔한 세력을 기본값으로 쓴다(분류 머리말만 있는 시리즈용)
    fallback = {}
    for code, v in diff["series"].items():
        c = defaultdict(int)
        for r in v["add_mech"]:
            f = FACTION.get(r["faction"])
            if f:
                c[f] += 1
        fallback[code] = max(c, key=c.get) if c else "재야"

    mech, ship = collect(diff, sx, ov)
    mrows, srows, weight = build_rows(mech, ship, sx, fallback)

    from collections import Counter
    print(f"기체 +{len(mrows)}  함선 +{len(srows)}")
    print("  특성:", dict(Counter(r[7] for r in mrows)))
    print("  비중:", dict(Counter(weight.values())))
    print("  세력 상위:", Counter(r[1][0] for r in mrows).most_common(8))
    if a.dry_run:
        for r in mrows[:6]:
            print("   ", json.dumps(r, ensure_ascii=False))
        return

    out = patch(src, mrows, srows, weight)
    open(a.target, "w", encoding="utf-8").write(out)
    print(f"[완료] {a.target} 갱신")


if __name__ == "__main__":
    main()
