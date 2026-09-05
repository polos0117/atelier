# -*- coding: utf-8 -*-
"""이름 대조 공용 규칙.

저장소·soshage API·건담 공식 사이트가 같은 기체를 저마다 다르게 적는다.
세 곳을 대조하는 스크립트가 같은 규칙을 쓰도록 여기 모아 둔다.
"""
import difflib
import re
import unicodedata

# 표기 치환. 양쪽 문자열에 똑같이 적용하므로 방향은 상관없다.
TRANSLIT = {
    "ν": "뉴", "Ξ": "크시", "∀": "턴에이", "α": "알파", "β": "베타", "θ": "세타",
    "the o": "디오",
    # 같은 대상의 음역만 다른 것들. 확인한 것만 넣는다.
    "어스트레이": "아스트레이", "압사라스": "아프사라스", "거베라": "가베라",
    "바체": "버체", "어헤드": "아헤드", "켈딤": "캘딤",
    "쓰로네": "스로네", "내러티브": "나라티브", "듀얼": "듀엘",
    "제피란서스": "제피랜서스", "제피랜더스": "제피랜서스",
    "아지르": "아질",
}

TAIL = "건담"

PAREN = re.compile(r"[(（][^)）]*[)）]")
# (EX) 만 떼는 용도. 통상판과 (EX) 판은 같은 기체지만,
# (에우고 사양)/(티탄즈 사양) 이나 (디스트로이 모드) 는 저장소가 따로 세는 별개 카드다.
EX_MARK = re.compile(r"\s*[(（]\s*EX\s*[)）]\s*", re.I)
EW = re.compile(r"[(（]\s*EW\s*Ver\.?[^)）]*[)）]", re.I)

# 공식 사이트는 함선을 기체와 같은 페이지에 섞어 싣는다. ROSTER_CHECK 규칙상
# 함선은 기체 로스터에서 빼고 SHIP 으로 돌려야 해서 따로 가른다.
# '함마 함마' 처럼 이름에 우연히 '함' 이 든 기체가 있으므로 낱글자로는 못 가른다.
SHIP_SUFFIX = re.compile(r"(급\s|급$|우주\s*(순양함|전함)|공격항모|모함|수송함)")
SHIP_NAMES = {
    "화이트 베이스", "아가마", "래디시", "아우둠라", "그완반", "그와단",
    "도고스 기어", "알렉산드리아", "라 카이람", "레우룰라", "알비온",
    "무사이", "그와진", "릴리 마를렌", "살라미스 개량형", "건페리",
    "잔지발급 케르게렌", "메가 라이더", "아 바오아 쿠", "넬 아가마",
}
# 기체 로스터에서 빼는 것들 — 마스코트, 차량, 시설
EXCLUDE_NAMES = {"하로", "붉은 하로", "HARO", "호버 트럭", "미데아", "학원함",
                 "트로이아 스테이션", "전투 바이크", "카미온", "콘치"}

# 장비·사양 배리에이션. ROSTER_CHECK 은 원칙적으로 제외하되 공식 사이트가
# 독립 항목으로 취급하면 넣는다 했으니, 자동으로 버리지 않고 따로 모아 둔다.
VARIANT = re.compile(
    r"(전용기?\b|전용\s|사양|컬러|장비|지휘관|양산형|개량형|커스텀|"
    r"우주형|지상전|육전|고기동|중무장|타입|형태|Ver\.|\bSP\b|"
    r"[(（][^)）]*[)）]|\[[^\]]*\])")


def is_variant(name):
    return bool(VARIANT.search(name))


# 공식 사이트는 일부 시리즈(SEED FREEDOM 등)를 영문 이름으로 싣는다.
# 저장소는 한글이라 낱말 단위로 옮겨 붙여야 대조가 된다.
EN_TOKENS = {
    "gundam": "건담", "freedom": "프리덤", "justice": "저스티스",
    "strike": "스트라이크", "rising": "라이징", "immortal": "이모탈",
    "mighty": "마이티", "destiny": "데스티니", "impulse": "임펄스",
    "force": "포스", "sword": "소드", "blast": "블래스트",
    "infinite": "인피니트", "duel": "듀엘", "blitz": "블리츠",
    "lightning": "라이트닝", "buster": "버스터", "akatsuki": "아카츠키",
    "murasame": "무라사메", "rouge": "루즈", "black": "블랙",
    "knight": "나이트", "squad": "스쿼드", "gelgoog": "겔구그",
    "gyan": "걍", "zgok": "즈고크", "proud": "프라우드",
    "defender": "디펜더", "zeus": "제우스", "silhouette": "실루엣",
    "ginn": "진", "dinn": "딘", "kai": "카이", "menace": "메나스",
    "strom": "슈트롬", "kusanagi": "쿠사나기", "archangel": "아크엔젤",
    "eternal": "이터널", "minerva": "미네르바", "izumo": "이즈모",
}
EN_WORD = re.compile(r"[A-Za-z][A-Za-z']*")


def romaji(s):
    """영문 낱말을 아는 만큼 한글로 옮긴다. 모르는 낱말은 그대로 둔다."""
    if not EN_WORD.search(s):
        return s
    return EN_WORD.sub(lambda m: EN_TOKENS.get(m.group(0).lower(), m.group(0)), s)


def _sub(s):
    for a, b in TRANSLIT.items():
        s = s.replace(a, b)
    return s


def norm(s, keep_paren=False):
    """대조용 정규화. 구두점·공백을 버리고 표기를 통일한다.
    전각 로마숫자(Ⅱ)는 NFKC 가 II 로 펴준다."""
    s = unicodedata.normalize("NFKC", s or "")
    if not keep_paren:
        s = PAREN.sub("", s)
    s = _sub(romaji(s).lower())
    return re.sub(r"[^0-9a-z가-힣]", "", s)


def affixes(q):
    """'건담' 을 떼거나 앞뒤로 붙인 형들."""
    out = {q}
    if q.endswith(TAIL) and len(q) > len(TAIL):
        out.add(q[: -len(TAIL)])
    if q.startswith(TAIL) and len(q) > len(TAIL):
        out.add(q[len(TAIL):])
    out.add(q + TAIL)
    out.add(TAIL + q)
    return {x for x in out if x}


def is_ship(name):
    return name in SHIP_NAMES or bool(SHIP_SUFFIX.search(name))


def is_excluded(name):
    return name in EXCLUDE_NAMES


def close(q, pool, n=3, cutoff=0.60):
    """비슷한 이름 후보. 자동 채택용이 아니라 사람이 볼 목록을 만드는 데 쓴다."""
    near = difflib.get_close_matches(q, list(pool), n=n, cutoff=cutoff)
    return [(x, round(difflib.SequenceMatcher(None, q, x).ratio(), 3)) for x in near]
