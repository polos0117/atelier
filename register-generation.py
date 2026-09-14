#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""기체별 settings.json 을 generation/index.json 에 안전하게 등록한다.

새 기체 폴더는 추가하고, 같은 폴더 ID의 카드 이름이 바뀌면 기존 이름을
교체한다. 인덱스가 가리키는 폴더가 사라졌거나 카드 이름이 충돌하면 기존
항목을 임의로 지우지 않고 실패한다.
"""
import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
GEN_DIR = ROOT / "generation"
INDEX_PATH = GEN_DIR / "index.json"
ID_RE = re.compile(r"^m-[a-f0-9]{16}$")


def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        raise ValueError(f"{path.relative_to(ROOT)} 를 읽을 수 없다: {e}") from e


def card_folders():
    found = {}
    for folder in sorted(GEN_DIR.glob("m-*")):
        if not folder.is_dir():
            continue
        mech_id = folder.name
        if not ID_RE.fullmatch(mech_id):
            raise ValueError(f"잘못된 기체 폴더 ID: generation/{mech_id}")
        settings_path = folder / "settings.json"
        images_path = folder / "images.json"
        if not settings_path.is_file() or not images_path.is_file():
            raise ValueError(f"generation/{mech_id} 에 settings.json 또는 images.json 이 없다")
        settings = read_json(settings_path)
        card = settings.get("card") if isinstance(settings, dict) else None
        if not isinstance(card, str) or not card.strip() or card != card.strip():
            raise ValueError(f"generation/{mech_id}/settings.json 의 card가 올바르지 않다")
        if card in found:
            raise ValueError(f"기체 이름 중복: {card} ({found[card]}, {mech_id})")
        found[card] = mech_id
    return found


def update_index(check=False):
    doc = read_json(INDEX_PATH)
    if not isinstance(doc, dict) or doc.get("version") != 1 or not isinstance(doc.get("cards"), dict):
        raise ValueError("generation/index.json 형식이 올바르지 않다")

    cards = dict(doc["cards"])
    folders = card_folders()
    folder_ids = set(folders.values())
    missing = [(card, mech_id) for card, mech_id in cards.items() if mech_id not in folder_ids]
    if missing:
        card, mech_id = missing[0]
        raise ValueError(f"인덱스가 없는 폴더를 가리킨다: {card} -> {mech_id}")

    added, renamed = [], []
    for card, mech_id in folders.items():
        old_names = [name for name, old_id in cards.items() if old_id == mech_id and name != card]
        owner = cards.get(card)
        if owner and owner != mech_id:
            raise ValueError(f"기체 이름 충돌: {card} -> {owner}, {mech_id}")
        for old_name in old_names:
            del cards[old_name]
            renamed.append((old_name, card, mech_id))
        if card not in cards:
            cards[card] = mech_id
            if not old_names:
                added.append((card, mech_id))

    doc["cards"] = cards
    rendered = json.dumps(doc, ensure_ascii=False, indent=2) + "\n"
    before = INDEX_PATH.read_text(encoding="utf-8")
    changed = rendered != before
    if changed and not check:
        INDEX_PATH.write_text(rendered, encoding="utf-8")

    state = "대조" if check else "완료"
    print(f"[{state}] generation/index.json · 기체 {len(cards)} · 추가 {len(added)} · 이름 변경 {len(renamed)}")
    for card, mech_id in added:
        print(f"  추가 {card} -> {mech_id}")
    for old_name, card, mech_id in renamed:
        print(f"  이름 변경 {old_name} -> {card} ({mech_id})")
    return changed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="파일을 쓰지 않고 변경 여부만 확인한다")
    args = parser.parse_args()
    try:
        update_index(check=args.check)
    except ValueError as e:
        print(f"[검증 실패·저장 안 함] {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
