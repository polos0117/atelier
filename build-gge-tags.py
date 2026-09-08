#!/usr/bin/env python3
"""G 제네레이션 이터널의 공식 태그로 mech.json 의 gundam 표를 다시 찍는다.

여태 이 표는 사람이 손으로 붙였다. 이름에 건담이 없어도 건담인 기체를 위한
것이었는데, 지온 계열 에이스기까지 섞여 들어가 사자비가 "건담이라는 이름"
인연에 들었다.

그런데 공식 자료에 이미 답이 있다. GGE API 의 유닛마다 tags 가 붙어 있고
그 가운데 id 1003 이 "건담" 이다. 482 기에 붙어 있다.

  gundam: true   이름에 건담이 없는데 공식이 건담이라 하는 기체
  gundam: false  이름에 건담이 들었는데 공식이 아니라 하는 기체
  (없음)         이름 규칙에 맡긴다

짝지어지지 않은 기체(GGE 에 없는 것)는 건드리지 않는다. 손으로 붙인 표가
있으면 그대로 둔다 — 공식 자료가 없는 것을 지울 근거가 없다.

  python3 build-gge-tags.py            무엇이 달라지는지 보기만 한다
  python3 build-gge-tags.py --write    실제로 고친다
"""
import json
import os
import sys

import roster

CACHE = ".cache/soshage/unit.json"
IDMAP = "id-map.json"
TAG = "건담"


def official():
    """카드 이름 → 공식이 건담이라 하는가. 짝이 없으면 빠진다."""
    if not os.path.exists(CACHE):
        raise SystemExit(
            "[실패] %s 가 없다. build-idmap.py 를 먼저 돌려 캐시를 받아라." % CACHE)
    units = {u["id"]: u for u in json.load(open(CACHE, encoding="utf-8"))}
    idmap = json.load(open(IDMAP, encoding="utf-8"))["mech"]
    out = {}
    for row in idmap:
        seen = False
        found = False
        for i in row["ids"]:
            u = units.get(i)
            if not u:
                continue
            seen = True
            for t in (u.get("tags") or []):
                if ((t.get("tag") or {}).get("name")) == TAG:
                    found = True
        if seen:
            out[row["dex"]] = found
    return out


def main():
    write = "--write" in sys.argv
    off = official()
    cards = roster.cards("mech")

    add, drop, redundant, wrong, untouched = [], [], [], [], 0
    for c in cards:
        n = c["name"]
        named = TAG in n
        if n not in off:
            untouched += 1
            continue
        want = off[n]
        if want and not named:
            if c.get("gundam") is not True:
                add.append(n)
            c["gundam"] = True
        elif not want and named:
            if c.get("gundam") is not False:
                drop.append(n)
            c["gundam"] = False
        else:
            # 이름과 공식이 서로 맞는다. 손으로 붙인 표는 필요 없다.
            if "gundam" in c:
                (redundant if want else wrong).append(n)
                del c["gundam"]

    print("GGE 와 짝지어진 기체 %d 기 / 전체 %d 기 (짝 없어 그대로 둔 것 %d 기)"
          % (len(cards) - untouched, len(cards), untouched))
    for title, rows in (
            ("표를 새로 붙인다 — 공식은 건담인데 이름에 없어 여태 놓쳤다", add),
            ("아니라고 못박는다 — 이름에 건담이 들었으나 공식은 아니다", drop),
            ("표를 뗀다 — 손으로 붙였으나 공식은 건담이 아니라 한다", wrong),
            ("표를 뗀다 — 이름만으로 이미 붙으므로 군더더기다", redundant)):
        print("\n%s — %d 기" % (title, len(rows)))
        for i in range(0, len(rows), 5):
            print("   " + " · ".join(rows[i:i + 5]))

    left = [c["name"] for c in cards
            if c.get("gundam") is True and c["name"] not in off]
    if left:
        print("\n손으로 붙인 표가 남은 %d 기 (GGE 에 짝이 없다) — 사람이 볼 몫이다"
              % len(left))
        for i in range(0, len(left), 5):
            print("   " + " · ".join(left[i:i + 5]))

    if write:
        roster.put_cards("mech", cards)
        print("\n[적음] data/mech.json")
    else:
        print("\n(보기만 했다. 실제로 고치려면 --write)")


if __name__ == "__main__":
    main()
