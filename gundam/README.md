# 건담 드래프트 화면

접속 주소는 기존 `../play.html`을 유지한다. 이 폴더는 해당 화면의 코드와 스타일을 담는다.

- `game.js`: 데이터 로딩, 드래프트, 점수 계산, 게임 화면
- `insights.js`: 지명 전 편성 변화, 연대·작전 진행판, 결과 점수 비교
- `gallery.js`: 도감의 일상컷 조회, 지명 팝업 갤러리, 아군 MVP
- `page.js`: 새 버전 알림, 공통 화면 밀도 설정
- `play.css`: 게임 및 갤러리 스타일

`data/`와 `img/`는 도감과 공유하며 복제하지 않는다. 상대 데이터 URL은 문서인 `play.html` 기준으로 해석된다. GitHub Pages 또는 로컬 HTTP 서버로 실행한다.

일상컷은 `data/img.json`의 `img[카드명].casual`과 `byStyle[화풍].casual`을 읽는다. 성별 배열 `{f:[],m:[]}`을 지원하며 기존 배열 형식은 도감과 동일하게 여성으로 취급한다. 선택된 화풍을 우선 표시하고 다른 화풍은 캡션으로 구분한다. 등록된 일상컷이 없으면 기본 이미지로 표시한다.

MVP는 아군 기체·파일럿 조의 출격 점수에 정원 초과 감점을 적용한 값으로 선정한다. 팀 단위 연대·공개 목표 보너스는 배분하지 않는다. 이미지 보유 및 열람은 점수나 게임 기록을 변경하지 않는다.

자산 수정 후 `play.html`의 해당 CSS/JS `?v=` 값을 파일 SHA-256 앞 10자리로 갱신한다. 기존 문서 새 버전 알림도 유지된다.

검증: `node tests/mobile-smoke.cjs`, `node tests/strategy-smoke.cjs`, `node tests/gallery-smoke.cjs` (저장소 루트에서 실행; Playwright Chromium 필요).

판단 정보 검증: `node tests/insights-smoke.cjs`. 분석은 복사한 편성과 기존 점수 함수를 사용한다. 궁합·지형, 정원 손실은 기본 출격과 중복 합산하지 않으며 표시값의 반올림 차이는 별도 행으로 맞춘다.
