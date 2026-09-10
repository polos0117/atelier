"""Run: python3 tests/style-registration.py"""
import contextlib
import copy
import importlib.util
import io
from pathlib import Path
import sys
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
spec = importlib.util.spec_from_file_location('register_images', Path(__file__).resolve().parents[1] / 'register-images.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def run(files, images, fail=False):
    doc = {'img': copy.deepcopy(images)}
    with patch.object(m.roster, 'read', return_value=doc), patch.object(m, 'card_index', return_value={'Card': 'Card'}), patch.object(m.roster, 'styles', return_value={'painterly': '회화'}), patch.object(m.os, 'listdir', return_value=files), patch.object(m.roster, 'write') as write, patch.object(sys, 'argv', ['register-images.py']), contextlib.redirect_stdout(io.StringIO()):
        try:
            m.main()
        except SystemExit as e:
            assert fail and e.code == 1
            write.assert_not_called()
        else:
            assert not fail
            write.assert_called_once()
    return doc['img']

legacy = {'Card': {'f': 'Card_f.webp'}}
assert run(['Card_f.webp'], legacy) == legacy
run(['Card_m.webp'], {}, fail=True)
run(['Card_painterli_f.webp'], {}, fail=True)
run(['Card_painterly_f.webp', 'Card_PAINTERLY_f.webp'], {}, fail=True)
run(['Card_painterly_f_casual0.webp'], {}, fail=True)
run(['Card_painterly_f_casual1.webp', 'Card_painterly_f_casual01.webp'], {}, fail=True)
# 압축된 기존 배열의 3번 컷을 1번 슬롯으로 오인하지 않는다.
a = 'Card_painterly_f_casual3.webp'
b = 'Card_painterly_f_casual1.webp'
result = run([a,b], {'Card': {'byStyle': {'painterly': {'casual': {'f': [a]}}}}})
assert result['Card']['byStyle']['painterly']['casual']['f'] == [b,a]
result = run(['Card_f.webp', 'Card_painterly_f.webp'], legacy)
assert result['Card']['f'] == 'Card_f.webp'
assert result['Card']['byStyle']['painterly']['f'] == 'Card_painterly_f.webp'
print('PASS: legacy preservation, missing/invalid style, portrait/cut collisions, positive cut numbers, sparse cut numbering')
