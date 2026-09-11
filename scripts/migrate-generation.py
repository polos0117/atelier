"""Copy published legacy records into per-card files; never overwrite a run.

Run from the repository root. Legacy files remain unchanged for old clients.
"""
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'generation'

def read(path):
    return json.loads(path.read_text())

def write_new(path, data):
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def migrate():
    toolkit = read(ROOT / 'toolkit-data.json')
    records = read(ROOT / 'data/generation.json')
    # This published batch has its own export/manifest but no aggregate entry.
    gunner = ROOT / 'docs/generation/2026-09-11-gunner-zaku'
    if gunner.exists():
        export = read(gunner / 'export-gunner-zaku.json')
        for key in ('mechs', 'used'):
            toolkit[key].update(export.get(key, {}))
        for asset in read(gunner / 'manifest.json')['assets']:
            records.setdefault(asset['file'], dict(asset, manifest=str((gunner / 'manifest.json').relative_to(ROOT))))
    names = set(toolkit['mechs']) | {r['card'] for r in records.values()}
    index_path = DEST / 'index.json'
    index = read(index_path) if index_path.exists() else {'version': 1, 'cards': {}}
    for name in sorted(names):
        ident = index['cards'].setdefault(name, 'm-' + hashlib.sha256(name.encode()).hexdigest()[:16])
        folder = DEST / ident
        write_new(folder / 'settings.json', {
            'version': 1, 'card': name, 'record': toolkit['mechs'].get(name, {}),
            'used': toolkit.get('used', {}).get(name, []),
            'provenance': 'Copied from published legacy records; original values preserved.'})
        per_card = {}
        for filename, source in records.items():
            if source['card'] != name:
                continue
            if hashlib.sha256((ROOT / 'img' / filename).read_bytes()).hexdigest() != source['sha256']:
                raise ValueError('Image hash mismatch: ' + filename)
            original = ROOT / source['manifest']
            run = folder / 'runs' / original.parent.name
            run.mkdir(parents=True, exist_ok=True)
            # Shared legacy batches must not copy other cards into this folder.
            manifest_data = read(original)
            multi = len({a.get('card') for a in manifest_data.get('assets', []) if a.get('card')}) > 1
            allowed = {Path(r['prompt']).name for r in records.values()
                       if r['card'] == name and r['manifest'] == source['manifest'] and r.get('prompt')}
            if multi:
                snapshot = dict(manifest_data)
                snapshot['assets'] = [a for a in manifest_data['assets'] if a.get('card') == name]
                snapshot['legacy_manifest'] = source['manifest']
                write_new(run / 'manifest.json', snapshot)
            # Single-card runs retain their exact intermediate prompt revisions.
            for old in original.parent.iterdir():
                if multi and old.name not in allowed:
                    continue
                if old.is_file() and old.suffix in ('.txt', '.json') and not (run / old.name).exists():
                    shutil.copyfile(old, run / old.name)
            record = {k: source[k] for k in ('card', 'style', 'gender', 'mode', 'sha256', 'prompt')}
            record['manifest'] = str((run / 'manifest.json').relative_to(ROOT))
            if record['prompt']:
                record['prompt'] = str((run / Path(record['prompt']).name).relative_to(ROOT))
            record['legacy_manifest'] = source['manifest']
            per_card[filename] = record
        write_new(folder / 'images.json', per_card)
    DEST.mkdir(exist_ok=True)
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(names)} cards, {len(records)} image records; legacy files unchanged')

if __name__ == '__main__':
    migrate()
