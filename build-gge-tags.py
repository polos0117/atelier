#!/usr/bin/env python3
"""G 제네레이션 이터널의 공식 태그로 mech.json 의 표를 다시 찍는다.

읽는 곳은 카드의 tags 칸이다. 그 칸은 build-data.py 가 소샤지 캐시에서 옮겨
적어 둔 공식 태그의 사본이고, 저장소에 함께 들어 있다. 그래서 이 스크립트는
25MB 짜리 캐시 없이도 갓 받은 저장소에서 그대로 돌아간다.
(캐시와 tags 가 어긋나지 않는지는 build-data.py --check 가 본다.)

찍는 표는 둘이다.

  gundam  — 공식 태그 "건담"(id 1003, 482 기)
              true   이름에 건담이 없는데 공식이 건담이라 하는 기체
              false  이름에 건담이 들었는데 공식이 아니라 하는 기체
              (없음) 이름 규칙에 맡긴다

  color   — 공식 색 태그. 다만 공식은 흰·빨강·검정·금 넷으로만 나눈다.
            녹색과 청색은 공식이 "아니다" 라고 한 것이 아니라 말할 칸이
            아예 없는 것이라, 셋으로 갈라 읽는다.

              공식이 색을 말한다            → 공식을 따른다
              공식은 말이 없고 우리가 녹·청  → 우리 것을 지킨다
              공식은 말이 없고 우리가 4색 중 → 뗀다 (말할 수 있었는데 안 했다)

짝지어지지 않은 기체(GGE 에 없는 것)는 건드리지 않는다. 공식 자료가 없는 것을
지울 근거가 없다.

  python3 build-gge-tags.py            무엇이 달라지는지 보기만 한다
  python3 build-gge-tags.py --write    실제로 고친다
"""
import sys

import roster

TAG = "건담"
# 공식 색 → 우리 색. 공식에는 이 넷뿐이다
COLOR = {"흰색": "백색", "빨간색": "적색", "검은색": "흑색", "금색": "금색"}
# 공식이 말할 수 없는 색. 침묵을 "아니다" 로 읽으면 안 되는 쪽이다
UNSPOKEN = {"녹색", "청색"}


def show(title, rows, fmt=lambda x: x, per=5):
    print("\n%s — %d 기" % (title, len(rows)))
    out = [fmt(r) for r in rows]
    for i in range(0, len(out), per):
        print("   " + " · ".join(out[i:i + per]))


def main():
    write = "--write" in sys.argv
    cards = roster.cards("mech")

    add, drop, redundant, wrong = [], [], [], []
    follow, strip, keep = [], [], []
    untouched = 0

    for c in cards:
        if not c.get("gge"):
            untouched += 1
            continue
        n = c["name"]
        tags = set(c.get("tags") or [])

        # ── 건담 표 ──
        named = TAG in n
        want = TAG in tags
        if want and not named:
            if c.get("gundam") is not True:
                add.append(n)
            c["gundam"] = True
        elif not want and named:
            if c.get("gundam") is not False:
                drop.append(n)
            c["gundam"] = False
        elif "gundam" in c:
            # 이름과 공식이 서로 맞는다. 손으로 붙인 표는 필요 없다
            (redundant if want else wrong).append(n)
            del c["gundam"]

        # ── 색 ──
        off = sorted(COLOR[t] for t in tags if t in COLOR)
        cur = c.get("color")
        if off:
            if cur != off[0]:
                follow.append((n, cur, off[0]))
            c["color"] = off[0]
        elif cur in UNSPOKEN:
            keep.append((n, cur))
        elif cur:
            strip.append((n, cur))
            del c["color"]

    print("GGE 와 짝지어진 기체 %d 기 / 전체 %d 기 (짝 없어 그대로 둔 것 %d 기)"
          % (len(cards) - untouched, len(cards), untouched))

    print("\n■ 건담 표")
    show("표를 새로 붙인다 — 공식은 건담인데 이름에 없어 여태 놓쳤다", add)
    show("아니라고 못박는다 — 이름에 건담이 들었으나 공식은 아니다", drop)
    show("표를 뗀다 — 손으로 붙였으나 공식은 건담이 아니라 한다", wrong)
    show("표를 뗀다 — 이름만으로 이미 붙으므로 군더더기다", redundant)

    left = [c["name"] + ("" if c["gundam"] else "(아니다)") for c in cards
            if "gundam" in c and not c.get("gge")]
    if left:
        show("손으로 붙인 표가 남았다 (GGE 에 짝이 없다) — 사람이 볼 몫이다", left)

    print("\n■ 색")
    fill = [x for x in follow if not x[1]]
    clash = [x for x in follow if x[1]]
    show("빈칸을 공식 색으로 채운다", fill, lambda x: "%s(%s)" % (x[0], x[2]))
    show("공식이 우리와 다르게 말한다 — 공식을 따른다", clash,
         lambda x: "%s %s→%s" % (x[0], x[1], x[2]), per=3)
    show("뗀다 — 공식은 색을 말할 수 있었는데 말하지 않았다", strip,
         lambda x: "%s(%s)" % (x[0], x[1]), per=4)
    print("\n공식이 표현할 수단이 없어 우리 것을 지킨 기체 — %d 기 (녹색·청색)"
          % len(keep))

    tally = {}
    for c in cards:
        if c.get("color"):
            tally[c["color"]] = tally.get(c["color"], 0) + 1
    print("색 분포 — " + " · ".join("%s %d" % kv for kv in sorted(tally.items())))

    if write:
        roster.put_cards("mech", cards)
        print("\n[적음] data/mech.json")
    else:
        print("\n(보기만 했다. 실제로 고치려면 --write)")


if __name__ == "__main__":
    main()
