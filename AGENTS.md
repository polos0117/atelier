# Atelier 작업 안내

이미지 생성·변환·업로드·이름 변경·도감 등록 작업을 시작하기 전에 반드시 [IMAGE_UPLOAD_RULES.md](IMAGE_UPLOAD_RULES.md)를 먼저 읽는다. 파일명만 수정하는 작업과 중단된 업로드를 재개하는 작업에도 적용한다.

화풍 키와 등록 동작은 `data/style.json` 및 `register-images.py`의 현재 내용을 확인한다. 과거 대화나 브라우저 선택값만으로 이미지 화풍을 확정하지 않는다.

다른 작업 지침과 충돌하거나 문서와 코드가 다르면 차이를 보고하고, 추측으로 데이터 또는 검증 규칙을 바꾸지 않는다.

`prompt.html`을 사용한 이미지 생성부터 업로드까지의 작업 전에는 [PROMPT_IMAGE_WORKFLOW.md](PROMPT_IMAGE_WORKFLOW.md)도 반드시 읽는다.

기체별 설정·생성 이력은 [generation/README.md](generation/README.md)를 따른다. 기본 기록 내보내기는 한 기체의 `settings.json`이며, 완료한 `runs/` 기록은 보존한다. 신규 작업에서 공용 JSON 전체를 다시 올리는 방식을 기본으로 사용하지 않는다.
