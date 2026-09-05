#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""prompt.html 의 기체 목록을 data/ 의 로스터에 맞춘다.

툴킷(prompt.html)은 카드 데이터를 자체 사본으로 들고 있다. 원본은 data/ 이고
play.html·dex.html 도 거기서 읽는데, 툴킷만 손으로 관리하고 있어서 로스터가
늘 때마다 뒤처졌다. 그 사본만 갈아끼운다.

바꾸는 블록은 넷뿐이다.
  MECH          [이름, 시리즈[]] — 시리즈 고르개와 기체 고르개가 쓴다
  MECH_META     능력치·세력·성격·특성·형식번호 — 프롬프트 본문에 얹는다
  SER_NAME      시리즈 코드 → 한글 이름
  SERIES_ORDER  고르개에 뜨는 차례

나머지 42 만 바이트(프롬프트 판형·옵션·저장 로직)는 건드리지 않는다.

SERIES_ORDER 는 기존 차례를 지키고 새 코드만 뒤에 붙인다. 고르개 순서는
사람이 정한 것이라 이름 순으로 다시 세우면 쓰던 감각이 어긋난다.

함선은 넣지 않는다. 툴킷은 모빌슈트 의인화가 목적이고 dex.html 도
`if(t==="기체")` 일 때만 툴킷 링크를 건다.

사용법:
    python3 build-prompt.py            # prompt.html 을 고친다
    python3 build-prompt.py --check    # 고치지 않고 차이만 본다
"""
import argparse
import json
import re

import roster

SRC = roster.DIR
TARGET = "prompt.html"


def block(src, pattern, what):
    m = re.search(pattern, src, re.S)
    if not m:
        raise SystemExit(f"[실패] {what} 을 찾지 못했다.")
    return m


def js(v):
    """prompt.html 이 쓰는 표기 그대로. 한글은 펴서 쓰고 쉼표 뒤에 한 칸."""
    return json.dumps(v, ensure_ascii=False, separators=(", ", ": "))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()

    tgt = open(TARGET, encoding="utf-8").read()

    cards = roster.cards("mech")
    ser_name = roster.series()["name"]

    mech = [[c["name"], c["series"]] for c in cards]
    meta = {c["name"]: {"factions": c["factions"],
                        "output": c["stats"][0], "firepower": c["stats"][1],
                        "armor": c["stats"][2], "mobility": c["stats"][3],
                        "temperament": c["temper"], "system": c["system"],
                        "series": c["series"], "models": c.get("models", "")}
            for c in cards}

    m_mech = block(tgt, r"(  const MECH = )(\[.*?\]);\n", "prompt.html 의 MECH")
    m_meta = block(tgt, r"(  const MECH_META = )(\{.*?\});\n", "prompt.html 의 MECH_META")
    m_sn = block(tgt, r"(  const SER_NAME = )(\{.*?\});", "prompt.html 의 SER_NAME")
    m_so = block(tgt, r"(  const SERIES_ORDER = )(\[.*?\]);", "prompt.html 의 SERIES_ORDER")

    old = [r[0] for r in json.loads(m_mech.group(2))]
    order = json.loads(m_so.group(2))
    # 기존 차례를 지키고, play.html 에만 있는 코드를 뒤에 붙인다
    order = [c for c in order if c in ser_name] + [c for c in ser_name if c not in order]

    added = [n for n in [r[0] for r in mech] if n not in set(old)]
    dropped = [n for n in old if n not in {r[0] for r in mech}]

    print(f"[대조] prompt.html {len(old)} → data/ {len(mech)}")
    print(f"  추가 {len(added)} · 삭제 {len(dropped)}")
    if dropped:
        print(f"  삭제되는 것: {', '.join(dropped)}")
    if order != json.loads(m_so.group(2)):
        print(f"  SERIES_ORDER 갱신: {json.loads(m_so.group(2))} → {order}")

    if a.check:
        return

    # 뒤에서 앞으로 갈아끼운다. 앞부터 하면 뒤 블록의 자리가 밀린다.
    for m, v in sorted([(m_mech, mech), (m_meta, meta), (m_sn, ser_name), (m_so, order)],
                       key=lambda x: -x[0].start()):
        tgt = tgt[: m.start()] + m.group(1) + js(v) + tgt[m.end(2):]

    open(TARGET, "w", encoding="utf-8").write(tgt)
    print(f"[완료] {TARGET} · 기체 {len(mech)} · 시리즈 {len(ser_name)}")


if __name__ == "__main__":
    main()
