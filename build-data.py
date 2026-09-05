#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""기체 카드에 형식번호(models)와 G 제네레이션 이터널 id(gge)를 붙인다.

카드 자료는 data/*.json 에 있다. 이 스크립트는 거기에 바깥 자료를 얹는
일만 한다 — 능력치나 이름은 건드리지 않는다.

형식번호가 왜 필요한가. 예전에는 카드를 이름으로만 구분해서, 표기가 한 글자
갈리면 같은 기체가 두 장이 됐다. 건담 칼리번/캘리번, 건담 DX/더블 엑스,
V건담/빅토리 건담 처럼 열 장이 그렇게 생겼다. 형식번호가 있으면 이름이
아무리 달라도 LM312V04 하나로 같은 기체임이 드러난다.

출처는 둘이다.
  공식 사이트 상세 (official/pilot/relations.json)  — 배리에이션까지 구분해 적는다
  소샤지 G 제네레이션 API (id-map.json)             — 수록 범위가 넓다
둘이 엇갈리면 공식을 따른다. 공식이 여러 카드를 한 항목에 몰아 적은 자리에서는
소샤지가 더 정확하므로, 그런 자리는 data-overrides.json 에 사람이 적어 둔다.

사용법:
    python3 build-data.py            # data/mech.json · pilot.json 을 고친다
    python3 build-data.py --check    # 쓰지 않고 달라지는 것만 보여준다
    python3 build-data.py --report   # 두 출처가 엇갈리는 자리를 전부 찍는다
"""
import argparse
import importlib.util
import json
import os

import roster
from gundam_match import norm, affixes

OVERRIDES = "data-overrides.json"
IDMAP = "id-map.json"
REL = "official/pilot/relations.json"


def index(names):
    """이름 → 카드 이름. build-bond 와 같은 규칙을 쓴다."""
    idx = {}
    for n in names:
        idx.setdefault(norm(n), n)
    for n in names:
        for v in affixes(norm(n)):
            idx.setdefault(v, n)
    return idx


def clean(m):
    """소샤지는 형식번호가 없는 기체에 '-' 를 넣어 둔다. 그건 값이 아니다."""
    m = (m or "").strip()
    return m if m.strip("-—–·. ") else ""


def from_soshage():
    if not os.path.exists(IDMAP):
        return {}, {}, {}
    d = json.load(open(IDMAP, encoding="utf-8"))
    return ({e["dex"]: clean(e.get("models")) for e in d["mech"] if clean(e.get("models"))},
            {e["dex"]: e["ids"] for e in d["mech"] if e.get("ids")},
            {e["dex"]: e["ids"] for e in d["pilot"] if e.get("ids")})


def from_official(idx):
    """공식 상세의 형식번호를 카드 이름으로 옮긴다."""
    if not os.path.exists(REL):
        return {}
    spec = importlib.util.spec_from_file_location("_bb", "build-bond.py")
    bb = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bb)
    out = {}
    for ms in json.load(open(REL, encoding="utf-8")).values():
        for oname, e in ms.items():
            if not clean(e.get("models")):
                continue
            d = bb.find_mech(oname, idx)
            if d:
                out.setdefault(d, clean(e["models"]))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--report", action="store_true")
    a = ap.parse_args()

    mech, pilot = roster.cards("mech"), roster.cards("pilot")
    ov = json.load(open(OVERRIDES, encoding="utf-8")) if os.path.exists(OVERRIDES) else {}
    ov_models = ov.get("models", {})

    idx = index([c["name"] for c in mech])
    soshage, gge_m, gge_p = from_soshage()
    official = from_official(idx)

    clash = []
    for n in sorted(set(soshage) & set(official)):
        if soshage[n].replace(" ", "").lower() != official[n].replace(" ", "").lower():
            clash.append((n, official[n], soshage[n], n in ov_models))

    def model_of(n):
        return ov_models.get(n) or official.get(n) or soshage.get(n) or ""

    moved = []
    for c in mech:
        for key, val in (("models", model_of(c["name"])), ("gge", gge_m.get(c["name"]))):
            if val:
                if c.get(key) != val:
                    moved.append((c["name"], key, c.get(key), val))
                c[key] = val
            elif key in c:
                moved.append((c["name"], key, c[key], None))
                del c[key]
    for c in pilot:
        v = gge_p.get(c["name"])
        if v:
            if c.get("gge") != v:
                moved.append((c["name"], "gge", c.get("gge"), v))
            c["gge"] = v
        elif "gge" in c:
            moved.append((c["name"], "gge", c["gge"], None))
            del c["gge"]

    # 자리 차례를 지킨다 — name, models, gge 가 앞에 오게
    order = ["name", "models", "gge", "factions", "stats", "temper",
             "system", "psy", "series", "line", "weight", "color", "role", "gundam", "lore"]
    key = lambda k: (order.index(k) if k in order else len(order))   # noqa: E731
    mech = [{k: c[k] for k in sorted(c, key=key)} for c in mech]
    pilot = [{k: c[k] for k in sorted(c, key=key)} for c in pilot]

    if not a.check:
        roster.put_cards("mech", mech)
        roster.put_cards("pilot", pilot)

    have = sum(1 for c in mech if c.get("models"))
    print("[%s] 형식번호 %d/%d (%.0f%%) · G제네 id 기체 %d · 인물 %d"
          % ("대조" if a.check else "완료", have, len(mech), 100 * have / len(mech),
             sum(1 for c in mech if "gge" in c), sum(1 for c in pilot if "gge" in c)))
    print("  바뀐 항목 %d" % len(moved))
    for n, k, was, now in moved[:20] if a.report else []:
        print("     %-28s %-6s %s → %s" % (n, k, was, now))

    left = [c for c in clash if not c[3]]
    print("  두 출처가 엇갈린 것 %d (사람이 정한 %d 제외하면 %d — 전부 공식을 따랐다)"
          % (len(clash), len(clash) - len(left), len(left)))
    if a.report:
        for n, o, s, fixed in clash:
            print("     %-30s 공식 %-18s 소샤지 %-24s %s"
                  % (n, o, s, "← " + ov_models[n] if fixed else ""))


if __name__ == "__main__":
    main()
