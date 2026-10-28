"""등록한 날(img.json 의 added) 검사. Run: python3 tests/image-added.py

새로 등록된 파일만 오늘 날짜를 받는다. 이미 적힌 날짜는 그대로, 날짜를 모르는 기존
파일은 비워 둔다(지어내지 않는다). 지운 항목의 날짜는 같이 빠지고, 등록이 실패하면
아무것도 쓰지 않는다. 이력 채우기는 얕은 클론에서 거절한다."""
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

TODAY = '2026-10-21'


def run(files, doc, args=(), fail=False, git=None):
    doc = copy.deepcopy(doc)
    with patch.object(m.roster, 'read', return_value=doc), \
         patch.object(m, 'card_index', return_value={'Card': 'Card'}), \
         patch.object(m.roster, 'styles', return_value={'painterly': '회화'}), \
         patch.object(m.os, 'listdir', return_value=files), \
         patch.object(m, 'today', return_value=TODAY), \
         patch.object(m, 'shallow', return_value=False), \
         patch.object(m, 'git_added', side_effect=git or (lambda f: None)), \
         patch.object(m.roster, 'write') as write, \
         patch.object(sys, 'argv', ['register-images.py', *args]), \
         contextlib.redirect_stdout(io.StringIO()):
        try:
            m.main()
        except SystemExit as e:
            assert fail and e.code == 1, e.code
            write.assert_not_called()
            return None
        assert not fail
        write.assert_called_once()
    return doc


P = 'Card_painterly_f.webp'
C1 = 'Card_painterly_f_casual1.webp'
C2 = 'Card_painterly_f_casual2.webp'
OLD = 'Card_f.webp'

# 새 파일은 오늘, 이미 적힌 날짜는 그대로, 날짜 없던 기존 파일은 비워 둔다
base = {'img': {'Card': {'f': OLD, 'byStyle': {'painterly': {'f': P}}}},
        'added': {P: '2026-09-01'}}
out = run([OLD, P, C1], base)
assert out['added'] == {P: '2026-09-01', C1: TODAY}, out['added']

# 다시 돌려도 날짜가 바뀌지 않는다
again = run([OLD, P, C1], out)
assert again['added'] == out['added']

# 처음 보는 added 칸도 만든다. 날짜 꼴이 아닌 값은 버린다
out = run([OLD, P], {'img': {'Card': {'f': OLD}}, 'added': {OLD: 'yesterday'}})
assert out['added'] == {P: TODAY}, out['added']
out = run([OLD, P], {'img': {'Card': {'f': OLD}}})
assert out['added'] == {P: TODAY}, out['added']

# 파일이 없어진 항목: --prune 이면 날짜도 빠지고, 아니면 항목과 함께 남는다
doc = {'img': {'Card': {'byStyle': {'painterly': {'f': P, 'casual': {'f': [C1]}}}}},
       'added': {P: '2026-09-01', C1: '2026-09-02'}}
assert run([P], doc)['added'] == doc['added']
assert run([P], doc, ['--prune'])['added'] == {P: '2026-09-01'}

# 등록에 실패하면 아무것도 쓰지 않는다 (오늘 날짜도 안 붙는다)
assert run([P, C2, 'Card_m.webp'], {'img': {}}, fail=True) is None

# 이력 채우기: 날짜 없는 것만 git 날짜로, 이미 적힌 날짜는 덮지 않는다, 모르면 비운다
hist = {OLD: '2026-08-20', P: '2000-01-01'}
doc = {'img': {'Card': {'f': OLD, 'byStyle': {'painterly': {'f': P, 'casual': {'f': [C1]}}}}},
       'added': {P: '2026-09-01'}}
out = run([OLD, P, C1], doc, ['--backfill-dates'], git=lambda f: hist.get(f))
assert out['added'] == {OLD: '2026-08-20', P: '2026-09-01'}, out['added']

# 얕은 클론이면 이력 채우기를 거절한다
with patch.object(m, 'shallow', return_value=True), \
     patch.object(sys, 'argv', ['register-images.py', '--backfill-dates']), \
     patch.object(m.roster, 'write') as write:
    try:
        m.main()
    except SystemExit as e:
        assert e.code and e.code != 0
    else:
        raise AssertionError('shallow clone must refuse backfill')
    write.assert_not_called()

# 실제 data/img.json: 날짜는 모두 날짜 꼴이고 등록된 파일만 가리킨다
real = m.roster.read('img')
listed = m.listed_files(real['img'])
bad = [(f, d) for f, d in real.get('added', {}).items() if f not in listed or not m.DATE.match(d)]
assert not bad, bad[:5]
assert list(real['added']) == sorted(real['added'])

print('PASS: new files dated today, existing dates kept, undated stay undated, prune/fail paths, history backfill, shallow refusal, data/img.json added map')
