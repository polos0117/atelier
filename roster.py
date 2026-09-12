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

# 초상 규격. 2:3 세로 한 벌이고, 장변이 1536 이다.
# 720×1080 으로 만들던 것을 올렸다 — 확대 창이 보통 폰에서 1074 화소를 먹는데
# 720 은 거기서 삼분의 일이 모자랐다. 용량은 재 보니 q78 기준 1.43 배다.
ART_SIZE = (1024, 1536)
# 이 판까지 들어온 것은 옛 규격 그대로 둔다. 다시 구우면 git 이 옛 판도
# 영영 들고 있어 저장소만 불어나고, 눈에 띄는 자리는 확대 하나뿐이다.
# 7d8d9b8 은 규격을 정하기 직전의 main 이다. 그 뒤로 들어온 것부터 본다.
ART_SINCE = "7d8d9b8"


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


def missing_art():
    """img.json 이 가리키는데 저장소에 없는 그림 파일.

    이름을 고치면 카드·인연·그림 파일이 함께 움직여야 하는데, 한 군데만
    빠뜨려도 아무 소리 없이 초상만 안 뜬다. 판이 도는 데는 지장이 없으니
    더 안 보인다. 그래서 여기서 센다.

    img.json 은 img/ 를 뺀 이름만 들고 있다. 처음 이 함수를 쓸 때는 그림이
    저장소 뿌리에 있어서 이름 그대로 찾으면 됐는데, img/ 로 옮긴 뒤로는
    하나도 못 찾아 1238 장을 전부 없다고 외치고 있었다. 늘 켜진 경고는
    아무도 안 보므로, 이 함수는 그동안 있으나 마나 했다."""
    import re
    s = open(path("img"), encoding="utf-8").read()
    return sorted({n for n in re.findall(r'"([^"]+\.webp)"', s)
                   if not os.path.exists(os.path.join("img", n))})


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


def _webp_size(p):
    """WebP 머리만 읽어 (가로, 세로). 못 읽으면 None.

    바깥 꾸러미를 들이지 않으려고 직접 읽는다. 이 저장소의 스크립트는
    파이썬에 딸려 오는 것만 쓴다 — 그림 세 바이트 보자고 Pillow 를 받게
    하면 워크플로가 그만큼 느려지고 깨질 자리도 는다."""
    try:
        with open(p, "rb") as f:
            d = f.read(30)
    except OSError:
        return None
    if len(d) < 30 or d[:4] != b"RIFF" or d[8:12] != b"WEBP":
        return None
    c = d[12:16]
    if c == b"VP8X":       # 확장 — 크기가 24 바이트째부터 3+3 바이트
        return (1 + int.from_bytes(d[24:27], "little"),
                1 + int.from_bytes(d[27:30], "little"))
    if c == b"VP8L":       # 무손실 — 14 비트씩 붙어 있다
        b = int.from_bytes(d[21:25], "little")
        return ((b & 0x3FFF) + 1, ((b >> 14) & 0x3FFF) + 1)
    if c == b"VP8 ":       # 손실 — 위 두 비트는 크기가 아니다
        return (int.from_bytes(d[26:28], "little") & 0x3FFF,
                int.from_bytes(d[28:30], "little") & 0x3FFF)
    return None


def new_art():
    """ART_SINCE 뒤로 img/ 에 들어온 그림 이름들. git 을 못 쓰면 빈 목록.

    지금 있는 것까지 규격으로 걸면 경고가 늘 켜져 있게 되고, 늘 켜진 경고는
    아무도 안 본다. 그래서 새로 들어온 것만 센다. 아직 커밋하지 않은 것도
    챙긴다 — 올리기 전에 걸러야 쓸모가 있다."""
    import subprocess
    out = set()

    def git(*a):
        # quotePath 를 끄지 않으면 한글 이름이 "img/\\352\\261\\264…" 로 나온다.
        # 그러면 파일이 있는지 물어볼 때마다 없다고 나와 조용히 다 빠진다
        try:
            r = subprocess.run(("git", "-c", "core.quotePath=false") + a,
                               capture_output=True, text=True, timeout=20)
        except (OSError, subprocess.SubprocessError):
            return None
        return r.stdout if r.returncode == 0 else None

    added = git("log", "--diff-filter=A", "--name-only", "--format=",
                ART_SINCE + "..HEAD", "--", "img")
    if added:
        out |= {l.strip() for l in added.splitlines() if l.strip()}
    live = git("status", "--porcelain", "--", "img")
    if live:
        out |= {l[3:].strip() for l in live.splitlines()}
    return sorted(n for n in out
                  if n.endswith(".webp") and os.path.exists(n))


def art_size():
    """[(이름, 가로, 세로)…] — 새로 들어왔는데 ART_SIZE 가 아닌 그림.

    2:3 초상 이야기다. 함선(3:2)이나 삼국 쪽(1:1)처럼 일부러 다른 꼴로 뽑는
    자리가 있으므로 여기서 서지는 않는다. 크기를 적어 낼 뿐이고, 일부러
    그런 것인지는 사람이 본다."""
    bad = []
    for n in new_art():
        s = _webp_size(n)
        if s and s != ART_SIZE:
            bad.append((n, s[0], s[1]))
    return bad
