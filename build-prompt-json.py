#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
image-list.html → data/prompt.json

카드별 이미지 생성 문구(prompt)와 비고(memo) 를 한 자리로 모은다.
도감(dex.html)과 툴킷(prompt.html)이 실행할 때 이 파일을 읽는다.

카드 이름이 바뀐 것은 data/rename.json 의 표로 옮긴다 — image-list.html 은
손으로 적는 파일이라 옛 이름이 남아 있고, 그대로 두면 그 카드의 문구가
화면에서 영영 안 붙는다.

    python3 build-prompt-json.py            # 다시 만든다
    python3 build-prompt-json.py --check    # 커밋된 것과 어긋나는지만 본다

예전에는 이 일을 build-dex.py 가 도감 HTML 을 통째로 찍어내면서 곁들여
했는데, 도감이 Preact 로 바뀌어 손으로 쓰는 파일이 되면서 그쪽은 없앴다.
"""
import json, os, re, sys

LIST = "image-list.html"
RENAME = "data/rename.json"
DEST = "data/prompt.json"
ROSTERS = ("mech", "pilot", "ship", "crew")
NOTE = ("카드별 이미지 생성용 문구(prompt)와 비고(memo). "
        "image-list.html 의 DATA 에서 build-prompt-json.py 가 뽑는다. "
        "카드 이름은 data/rename.json 으로 지금 이름에 맞춘다.")


def rename_map(path=RENAME):
    if not os.path.exists(path):
        return {}
    return json.load(open(path, encoding="utf-8")).get("map") or {}


def tables(path=LIST, ren=None):
    """이미지 목록에서 문구와 비고만 뽑는다.
    진행 현황(f/m/c/e)은 화면이 data/img.json 으로 실시간 계산하므로 안 가져온다."""
    src = open(path, encoding="utf-8").read()
    m = re.search(r"var DATA=(\[.*?\]);", src, re.S)
    if not m:
        raise SystemExit(f"[실패] {path} 에서 DATA 를 찾지 못했다.")
    ren = ren or {}
    P, N = {}, {}
    for ser in json.loads(m.group(1)):
        for grp in ser["groups"]:
            for row in grp["rows"]:
                name = ren.get(row["name"], row["name"])
                P[name] = row.get("prompt", "")
                if row.get("note"):
                    N[name] = row["note"]
    return P, N


def known_cards():
    """네 로스터에 실제로 있는 이름. 없는 이름은 화면에 못 붙는다."""
    out = set()
    for kind in ROSTERS:
        path = f"data/{kind}.json"
        if os.path.exists(path):
            out |= {c["name"] for c in json.load(open(path, encoding="utf-8"))["cards"]}
    return out


def build():
    P, N = tables(ren=rename_map())
    return {"version": 1, "note": NOTE, "count": len(P), "prompt": P, "memo": N}


def dumps(obj):
    return json.dumps(obj, ensure_ascii=False, indent=1) + "\n"


def main():
    check = "--check" in sys.argv[1:]
    out = build()

    cards = known_cards()
    ghost = sorted(k for k in list(out["prompt"]) + list(out["memo"]) if k not in cards)
    if ghost:
        print(f"[경고] 어느 로스터에도 없는 이름 {len(ghost)} — {', '.join(ghost[:8])}")
        print("       data/rename.json 에 줄을 더하거나 image-list.html 을 고칠 것")

    text = dumps(out)
    old = open(DEST, encoding="utf-8").read() if os.path.exists(DEST) else ""
    if check:
        if text == old:
            print(f"{DEST} 최신 (문구 {out['count']} · 비고 {len(out['memo'])})")
            return 0
        print(f"[어긋남] {DEST} 이 {LIST} 와 다르다 — python3 build-prompt-json.py 로 다시 만들 것")
        a, b = json.loads(old or "{}").get("prompt", {}), out["prompt"]
        for lab, keys in (("없어진 이름", sorted(set(a) - set(b))),
                          ("새 이름", sorted(set(b) - set(a))),
                          ("문구가 바뀐 것", sorted(k for k in set(a) & set(b) if a[k] != b[k]))):
            if keys:
                print(f"  {lab} {len(keys)} — {', '.join(keys[:8])}")
        return 1

    open(DEST, "w", encoding="utf-8").write(text)
    print(f"생성: {DEST}  (문구 {out['count']} · 비고 {len(out['memo'])})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
