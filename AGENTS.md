# Atelier 작업 안내

이미지 생성·변환·업로드·이름 변경·도감 등록 작업을 시작하기 전에 반드시 [IMAGE_UPLOAD_RULES.md](IMAGE_UPLOAD_RULES.md)를 먼저 읽는다. 파일명만 수정하는 작업과 중단된 업로드를 재개하는 작업에도 적용한다.

화풍 키와 등록 동작은 `data/style.json` 및 `register-images.py`의 현재 내용을 확인한다. 과거 대화나 브라우저 선택값만으로 이미지 화풍을 확정하지 않는다.

다른 작업 지침과 충돌하거나 문서와 코드가 다르면 차이를 보고하고, 추측으로 데이터 또는 검증 규칙을 바꾸지 않는다.

`prompt.html`을 사용한 이미지 생성부터 업로드까지의 작업 전에는 [PROMPT_IMAGE_WORKFLOW.md](PROMPT_IMAGE_WORKFLOW.md)도 반드시 읽는다.

기체별 설정·생성 이력은 [generation/README.md](generation/README.md)를 따른다. 기본 기록 내보내기는 한 기체의 `settings.json`이며, 완료한 `runs/` 기록은 보존한다. 신규 작업에서 공용 JSON 전체를 다시 올리는 방식을 기본으로 사용하지 않는다.

즐겨찾기 `lib/favorites.js` 는 공방 모음(polos0117.github.io)의 `favorites.js` 를 글자 하나 다르지 않게 복사한 공용 모듈이다(열쇠 `atelier_favorites_v1`, 약속은 그쪽 README 「즐겨찾기」절). 고치면 다섯 저장소를 같이 고치고, `node tests/dex-favorites.cjs` 가 원본과 견준다.

도트 재생기 `lib/sprite-actor.js`·`lib/sprite-actor.css` 도 공방 모음의 `sprite-actor.js`·`.css` 를 글자 하나 다르지 않게 복사한 공용 모듈이다(판 v1, 약속 — `data/sprites.json` 꼴·API — 은 그쪽 README 「도트 재생기」절, 인물의 그림은 공방 모음의 도트 공방 `dot.html` 에서 만든다). 고치면 원본과 다섯 저장소를 같이, `node tests/sprite-actor-copy.cjs` 가 원본과 견준다. 아직 이 공방에서 부르는 화면은 없다 — 도트 인물이 생기면 `data/sprites.json` 을 두고 화면이 `AtelierSprite.create` 로 세운다.
