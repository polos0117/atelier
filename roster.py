#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""data/*.json 을 읽고 쓴다. 로스터를 건드리는 스크립트는 전부 여기를 지난다.

카드 자료는 예전에 play.html 안에 자바스크립트 배열로 박혀 있었다. 그때는
스크립트마다 정규식으로 그 배열을 뜯어 읽었는데, 뜯는 방식이 조금씩 달라
같은 파일을 두고 서로 다른 것을 보는 일이 있었다. 지금은 자료가 data/ 에
있고 읽는 길은 여기 하나다.

레코드 꼴과 자리배열 꼴을 둘 다 낸다. 게임 규칙 쪽 코드는 아직 자리번호로
읽으므로(m[7] 은 계열) rows() 가 그 꼴을 만들어 준다.
"""
import json
import os
import re
import unicodedata

DIR = "data"
KINDS = ["mech", "pilot", "ship", "crew"]
STAT_N = 4


def path(name):
    return os.path.join(DIR, name if name.endswith(".json") else name + ".json")


def read(name):
    with open(path(name), encoding="utf-8") as f:
        return json.load(f)


def cards(kind):
    """레코드 꼴 — 카드 하나가 사전 하나."""
    return read(kind)["cards"]


def row(c, kind):
    """자리배열 꼴 — play.html 이 예전에 들고 있던 그 차례.

    기체만 뒤에 형식번호(9)와 지형 적성(10)이 붙는다. serAll 이 뒤에서부터
    배열을 찾아 시리즈를 잡으므로, 문자열과 사전은 그 자리를 가리지 않는다."""
    r = [c["name"], c["factions"]] + list(c["stats"]) + [c["temper"]]
    if kind == "mech":
        return r + [c["system"], c["series"], c.get("models", ""), c.get("terrain")]
    if kind == "pilot":
        return r + [c["psy"], c["series"], c.get("line", "")]
    return r + [c["series"]]


def rows(kind):
    return [row(c, kind) for c in cards(kind)]


def bonds():
    return read("bond")["bonds"]


def combos():
    return read("combo")["combos"]


def img():
    return read("img")["img"]


def series():
    return read("series")


def styles():
    """화풍 key → 이름. 차례를 지키려고 dict 로 돌려준다(3.7+ 는 넣은 차례를 지킨다)."""
    return {r["key"]: r["name"] for r in read("style")["styles"]}


def weights():
    """이름 → 드래프트 비중. 안 적힌 카드는 1.0 이다."""
    out = {}
    for k in KINDS:
        for c in cards(k):
            if c.get("weight", 1.0) != 1.0:
                out[c["name"]] = c["weight"]
    return out


def lore():
    out = {}
    for k in KINDS:
        for c in cards(k):
            if c.get("lore"):
                out[c["name"]] = c["lore"]
    return out


def one_line(v):
    """줄바꿈 없이 한 줄로. 카드 한 장·항목 하나가 한 줄이면 diff 로 바로 읽힌다."""
    return json.dumps(v, ensure_ascii=False, separators=(", ", ": "))


def _render(obj):
    one = one_line

    def val(v, pad):
        if isinstance(v, list) and v and isinstance(v[0], dict):
            return "[\n" + ",\n".join(pad + " " + one(x) for x in v) + "\n" + pad + "]"
        if isinstance(v, dict) and len(v) > 8:
            return ("{\n" + ",\n".join('%s "%s": %s' % (pad, k, val(x, pad + " "))
                                       for k, x in v.items()) + "\n" + pad + "}")
        return one(v)

    return "{\n" + ",\n".join(' "%s": %s' % (k, val(v, " "))
                              for k, v in obj.items()) + "\n}\n"


def write(name, obj):
    open(path(name), "w", encoding="utf-8").write(_render(obj))


def put_cards(kind, cs):
    """카드 목록만 갈아 끼우고 머리말은 그대로 둔다."""
    d = read(kind)
    d["cards"] = cs
    d["count"] = len(cs)
    write(kind, d)


def _fold(n):
    """같은 기체를 다르게 적은 것을 한 꼴로 모은다.

    "오 건담" 과 "0건담" 이 나란히 실려 있던 적이 있다. 사이띄개가 있고 없고,
    영문 O 와 숫자 0, 로마숫자와 아라비아숫자 — 눈으로는 다른 이름이라
    아무도 못 보고 지나쳤다. 그래서 비교하기 전에 이만큼을 접어 둔다."""
    s = unicodedata.normalize("NFKC", n).lower()
    s = re.sub(r"[\s·・\-–—_.]", "", s)
    s = s.replace("0", "o").replace("오", "o")
    for a, b in (("iii", "3"), ("ii", "2"), ("ⅲ", "3"), ("ⅱ", "2"), ("ⅰ", "1")):
        s = s.replace(a, b)
    return s


def dup_names():
    """({접은꼴: [이름…]} 겹치는 것만, 똑같은 이름이 두 번 실린 것)

    앞의 것은 사람이 볼 몫이다 — 정말 같은 기체일 수도 있고, 아라비아숫자만
    다른 별개의 기체일 수도 있다. 뒤의 것은 그냥 잘못이다."""
    seen, fold, same = set(), {}, []
    for k in KINDS:
        for c in cards(k):
            n = c["name"]
            if n in seen:
                same.append(n)
            seen.add(n)
            fold.setdefault(_fold(n), []).append(n)
    return {k: v for k, v in fold.items() if len(set(v)) > 1}, same


def shared_gge():
    """{(카드 이름들): [겹치는 id…]} — 서로 다른 카드가 같은 공식 유닛에 붙은 것.

    이름을 접어 보는 것보다 이쪽이 훨씬 잘 잡는다. 건담 AGE-1 의 네 장비형이
    모두 "AGE-1 노멀" 한 유닛에 붙어 있던 적이 있는데, 이름은 넷 다 멀쩡히
    달랐으므로 이름만 봐서는 알 길이 없었다. 잘못 붙으면 레어도·지형·태그가
    통째로 남의 것이 되므로, 색과 건담 표까지 따라 틀린다.

    한 카드가 통상판과 (EX) 판 여럿을 갖는 것은 정상이다. 여기서 보는 것은
    반대쪽 — 한 유닛에 카드가 둘 이상 붙은 경우다."""
    import collections
    out = collections.defaultdict(set)
    for k in KINDS:
        bag = collections.defaultdict(list)
        for c in cards(k):
            for i in (c.get("gge") or []):
                bag[i].append(c["name"])
        for i, names in bag.items():
            if len(names) > 1:
                out[tuple(sorted(names))].add(i)
    return {k: sorted(v) for k, v in out.items()}


def index():
    """이름 → (종류, 레코드). 이름은 네 종류를 통틀어 유일하다.

    유일하다고 적어 놓고 조용히 덮어쓰고 있었다. 이제는 걸리면 선다."""
    out = {}
    for k in KINDS:
        for c in cards(k):
            if c["name"] in out:
                raise ValueError(
                    "이름이 겹친다 — %s (%s · %s). data/ 에서 한쪽을 지워라"
                    % (c["name"], out[c["name"]][0], k))
            out[c["name"]] = (k, c)
    return out
