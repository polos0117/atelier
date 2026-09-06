#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""저장소에 있는 초상 파일을 data/img.json 에 등록한다.

파일 이름이 곧 등록 정보다.
    <카드 이름>_m.webp        남성체 초상
    <카드 이름>_f.webp        여성체 초상
    <카드 이름>_casual3.webp  일상컷 3
    <카드 이름>_extra1.webp   특별컷 1
카드 이름의 공백은 밑줄로 써도 된다(건담_데스사이즈_m.webp).

얼굴 좌표(face)는 파일 이름에서 알 수 없다. 없으면 게임이 기본값
FACE_DEF=[.34,.03,.30] 을 쓰므로 일단 뜨기는 뜨고, 잘라낸 자리가 어색하면
사람이 img.json 에서 손봐야 한다. 그래서 이 스크립트는 없는 것만 더하고
이미 적힌 것은 건드리지 않는다 — 손으로 맞춰 둔 값을 덮지 않기 위해서다.

play.html 은 실행 중에도 GitHub 파일 목록을 받아 같은 규칙으로 IMG 를
보강한다(mergeRepoFiles). 그쪽은 저장소에 안 적혀 있어도 화면에는 뜨게 해
주지만 얼굴 좌표를 못 넣고 목록을 못 받으면 그만이다. 이 스크립트는 그것을
파일로 굳혀 둔다.

사용법:
    python3 register-images.py            # data/img.json 에 없는 것을 더한다
    python3 register-images.py --check    # 쓰지 않고 무엇이 달라지는지만 본다
    python3 register-images.py --prune    # 파일이 사라진 항목도 지운다
"""
import argparse
import os
import re

import roster

PAT = re.compile(r"^(.+?)_(m|f|casual(\d+)|extra(\d+))\.webp$", re.I)
# 툴킷 화풍 견본. 카드 초상이 아니다
SKIP = re.compile(r"^style-")


def card_index():
    """'공백을 밑줄로 바꾼 이름' → 카드 이름."""
    idx = {}
    for kind in roster.KINDS:
        for c in roster.cards(kind):
            idx[c["name"].replace(" ", "_")] = c["name"]
    return idx


def listed_files(img):
    """img.json 이 이미 가리키고 있는 파일 전부. byStyle 안쪽까지 본다."""
    out = set()

    def take(d):
        for k in ("m", "f"):
            if d.get(k):
                out.add(d[k])
        for k in ("casual", "extra"):
            for f in d.get(k) or []:
                out.add(f)

    for v in img.values():
        take(v)
        for b in (v.get("byStyle") or {}).values():
            take(b)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--prune", action="store_true", help="파일이 없어진 항목을 지운다")
    a = ap.parse_args()

    doc = roster.read("img")
    img = doc["img"]
    idx = card_index()
    disk = {f for f in os.listdir(".") if f.lower().endswith(".webp")}
    listed = listed_files(img)

    added, unknown = [], []
    for f in sorted(disk - listed):
        if SKIP.match(f):
            continue
        m = PAT.match(f)
        if not m:
            unknown.append((f, "이름 꼴이 안 맞는다"))
            continue
        card = idx.get(m.group(1).replace(" ", "_"))
        if not card:
            unknown.append((f, "그런 카드가 없다"))
            continue
        e = img.setdefault(card, {})
        kind = m.group(2).lower()
        if kind in ("m", "f"):
            if e.get(kind):
                continue
            e[kind] = f
        else:
            slot = "casual" if kind.startswith("casual") else "extra"
            n = int(m.group(3) or m.group(4))
            lst = e.setdefault(slot, [])
            while len(lst) < n:
                lst.append(None)
            if lst[n - 1]:
                continue
            lst[n - 1] = f
        added.append((card, f))

    # 자리를 메우려고 넣은 빈 칸은 도로 걷어낸다
    for e in img.values():
        for slot in ("casual", "extra"):
            if slot in e:
                e[slot] = [x for x in e[slot] if x]
                if not e[slot]:
                    del e[slot]

    ghosts = sorted(listed_files(img) - disk)
    if a.prune and ghosts:
        gone = set(ghosts)
        for e in img.values():
            for k in ("m", "f"):
                if e.get(k) in gone:
                    del e[k]
            for k in ("casual", "extra"):
                if k in e:
                    e[k] = [x for x in e[k] if x not in gone]
                    if not e[k]:
                        del e[k]

    doc["img"] = dict(sorted(img.items()))
    doc["count"] = len(img)
    if not a.check:
        roster.write("img", doc)

    print("[%s] data/img.json · 카드 %d · 파일 %d"
          % ("대조" if a.check else "완료", len(img), len(listed_files(img))))
    print("  새로 등록 %d" % len(added))
    for card, f in added[:20]:
        print("     %-24s %s" % (card, f))
    if ghosts:
        print("  적혀 있는데 파일이 없는 것 %d%s"
              % (len(ghosts), " (지웠다)" if a.prune and not a.check else " — --prune 으로 지운다"))
        for f in ghosts[:10]:
            print("     %s" % f)
    if unknown:
        print("  등록 못 한 파일 %d" % len(unknown))
        for f, why in unknown[:10]:
            print("     %-40s %s" % (f, why))
    annotate(added, ghosts, unknown, a.prune and not a.check)


def annotate(added, ghosts, unknown, pruned):
    """GitHub Actions 로 돌 때는 실행 화면에도 남긴다.

    등록 못 한 파일이 있어도 이 스크립트는 성공으로 끝난다. 초상 아홉 장 중
    하나가 카드 이름과 안 맞아 빠져도 워크플로는 초록이라, 로그를 안 보면
    모르고 지나간다. 그래서 경고로 띄워 실행 목록에 뜨게 한다."""
    if not os.environ.get("GITHUB_ACTIONS"):
        return
    for f, why in unknown:
        print("::warning file=%s::초상을 등록하지 못했다 — %s" % (f, why))
    for f in ghosts:
        print("::warning::%s 가 img.json 에 적혀 있는데 파일이 없다%s"
              % (f, " (지웠다)" if pruned else " — --prune 으로 지운다"))
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as f:
        f.write("### 초상 등록\n\n")
        f.write("- 새로 등록 **%d**\n" % len(added))
        for card, name in added:
            f.write("  - `%s` ← %s\n" % (card, name))
        if unknown:
            f.write("- 등록 못 한 파일 **%d** — 카드 이름과 파일 이름이 맞는지 본다\n"
                    % len(unknown))
            for name, why in unknown:
                f.write("  - `%s` — %s\n" % (name, why))
        if ghosts:
            f.write("- 적혀 있는데 파일이 없는 것 **%d**\n" % len(ghosts))


if __name__ == "__main__":
    main()
