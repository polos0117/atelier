# Atelier 작업 안내

이미지 생성·변환·업로드·이름 변경·도감 등록 작업을 시작하기 전에 반드시 [IMAGE_UPLOAD_RULES.md](IMAGE_UPLOAD_RULES.md)를 먼저 읽는다. 파일명만 수정하는 작업과 중단된 업로드를 재개하는 작업에도 적용한다.

화풍 키와 등록 동작은 `data/style.json` 및 `register-images.py`의 현재 내용을 확인한다. 과거 대화나 브라우저 선택값만으로 이미지 화풍을 확정하지 않는다.

다른 작업 지침과 충돌하거나 문서와 코드가 다르면 차이를 보고하고, 추측으로 데이터 또는 검증 규칙을 바꾸지 않는다.

`prompt.html`을 사용한 이미지 생성부터 업로드까지의 작업 전에는 [PROMPT_IMAGE_WORKFLOW.md](PROMPT_IMAGE_WORKFLOW.md)도 반드시 읽는다.

기체별 설정·생성 이력은 [generation/README.md](generation/README.md)를 따른다. 기본 기록 내보내기는 한 기체의 `settings.json`이며, 완료한 `runs/` 기록은 보존한다. 신규 작업에서 공용 JSON 전체를 다시 올리는 방식을 기본으로 사용하지 않는다.

즐겨찾기 `lib/favorites.js` 는 공방 모음(polos0117.github.io)의 `favorites.js` 를 글자 하나 다르지 않게 복사한 공용 모듈이다(열쇠 `atelier_favorites_v1`, 약속은 그쪽 README 「즐겨찾기」절). 고치면 다섯 저장소를 같이 고치고, `node tests/dex-favorites.cjs` 가 원본과 견준다.

첫 화면(격납고)의 **도트 데크**(`index.html` `.hangar-dots` · `gundam/hangar-dots.js`)와 도감 상세의 도트 줄(그림 바로 아래)은 `data/sprites.json` 의 도트 기체가 거니는 자리다 — 배경은 `backgrounds/hangar.webp`(도트 공방과 같은 열쇠로 받은 픽셀아트 격납고, 기록 `records/backgrounds/hangar.json`, 원본 PNG 는 안 올린다). 도트가 없으면 데크째 없다. 목록 칸의 「도트」 표에는 정지 도트 작은 그림이 붙는다.

도트 재생기 `lib/sprite-actor.js`·`lib/sprite-actor.css` 도 공방 모음의 `sprite-actor.js`·`.css` 를 글자 하나 다르지 않게 복사한 공용 모듈이다(판 v1, 약속 — `data/sprites.json` 꼴·API — 은 그쪽 README 「도트 재생기」절, 인물의 그림은 공방 모음의 도트 공방 `dot.html` 에서 만든다). 고치면 원본과 다섯 저장소를 같이, `node tests/sprite-actor-copy.cjs` 가 원본과 견준다. 부르는 곳: 격납고(`index.html` · `gundam/hangar-dots.js` — 메인 메뉴 위 바닥 띠, 이동 스틱 자리는 비운다, 누르면 그 기체의 도감)·도감(상세 시트의 도트 줄, 목록 칸의 「도트」 표). 인물은 `data/sprites.json` 의 `actors` 에 도트 공방의 「인물 칸 복사」를 넣는다(card = 기체 이름), 그림은 이 저장소의 `sprites/`. 검사 `node tests/dot-screen.cjs`(시험 자료).
