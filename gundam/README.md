# 건담 드래프트 화면

접속 주소는 기존 `../play.html`을 유지한다. 이 폴더는 해당 화면의 코드와 스타일을 담는다.

- `draft-engine.js`: 화면과 분리한 게임 상태, 데이터 로딩, 드래프트·AI·점수·전적 저장
- `draft-app.js`: Preact + htm 컴포넌트. 설정, 카드 지명, 편성, 전황, 결과, 도감, 기록, 갤러리
- `draft.css`: 폴드 커버·내부 화면에 대응하는 레이아웃. 색상은 `../lib/workspace.css`의 공통 테마 토큰 사용
- `../lib/workspace-theme.js`, `../lib/workspace-ui.js`: 도감·툴킷과 공유하는 테마·밀도 설정
- `../lib/fresh.js`: 새 버전 감지

`../draft.html`은 기존 `play.html`로 연결하는 별칭이다. 씨앗·주제 쿼리와 해시를 보존한다.
기존 `game.js`, `insights.js`, `gallery.js`, `page.js`, `play.css`는 이전 구현을 대조하기 위해 남겨 두며 새 화면에서는 로드하지 않는다.
Preact가 DOM을 소유하고, 엔진은 DOM에 접근하지 않는다. 기존 `gundam_draft_cfg_v1`, `draft_rec_v1:<주제>` 저장 키와 게임 규칙을 유지한다.

`data/`와 `img/`는 도감과 공유하며 복제하지 않는다. 상대 데이터 URL은 문서인 `play.html` 기준으로 해석된다. GitHub Pages 또는 로컬 HTTP 서버로 실행한다.

일상컷은 `data/img.json`의 `img[카드명].casual`과 `byStyle[화풍].casual`을 읽는다. 성별 배열 `{f:[],m:[]}`을 지원하며 기존 배열 형식은 도감과 동일하게 여성으로 취급한다. 선택된 화풍을 우선 표시하고 다른 화풍은 캡션으로 구분한다. 등록된 일상컷이 없으면 기본 이미지로 표시한다.

MVP는 아군 기체·파일럿 조의 출격 점수에 정원 초과 감점을 적용한 값으로 선정한다. 팀 단위 연대·공개 목표 보너스는 배분하지 않는다. 이미지 보유 및 열람은 점수나 게임 기록을 변경하지 않는다.

자산 수정 후 `play.html`의 해당 CSS/JS `?v=` 값을 파일 SHA-256 앞 10자리로 갱신한다. `draft-engine.js`를 바꾸면 먼저 `draft-app.js`의 import 버전을 갱신하고, 그 뒤 `play.html`의 앱 버전을 갱신한다. 기존 문서 새 버전 알림도 유지된다.

검증: `node tests/draft-engine.cjs` (브라우저 없이 실행) · `node tests/fold-layout.cjs` (폴드 두 크기로 실제 렌더링).
옛 `mobile-smoke`·`strategy-smoke`·`gallery-smoke`·`insights-smoke`·`style-smoke` 는 Preact 이관으로 붙잡을 DOM 이 없어져 지웠다. 게임 규칙·점수는 `draft-engine.cjs` 가 브라우저 없이 보고, 화면이 실제로 그려지는지는 `fold-layout.cjs` 가 본다.

판단 정보: 분석은 복사한 편성과 기존 점수 함수를 사용한다. 궁합·지형, 정원 손실은 기본 출격과 중복 합산하지 않으며 표시값의 반올림 차이는 별도 행으로 맞춘다.

## 이미지 화풍 기록

- `img.json`의 기존 기본 자리는 **화풍 미상**이다. 과거 `toolkit-data.json.style`과 브라우저 `style`은 참고 기록으로 보존하며 화면 분류에 사용하지 않는다.
- 신규 파일은 `<카드명>_<화풍key>_<m|f>.webp`, `<카드명>_<화풍key>_<m|f>_casualN.webp` 또는 `_extraN.webp`로 저장한다. 화풍 key는 `data/style.json`을 따른다.
- `python3 register-images.py --check`로 화풍 누락·오타·동일 슬롯 중복을 검증한다. 실패하면 `img.json`을 쓰지 않는다. 기존 기본 자리 파일은 이름을 바꾸거나 재분류하지 않는다.
- 화면은 등록된 `img.json`을 기준으로 표시한다. GitHub 파일 목록만으로 검증 전 이미지를 추가하지 않는다.
- 프롬프트의 화풍 선택은 생성 설정이며 `stylePreferences`에만 기억한다. 기록 내보내기는 저장소의 과거 `style`을 보존하고 브라우저 값으로 덮어쓰지 않는다.

화풍 검증: `python3 tests/style-registration.py`, `node tests/style-logic.cjs`.
화풍 몫 가르기는 `style-logic.cjs` 가 `lib/img.js` 를 직접 돌려 본다. 툴킷 화면의 파일명 안내는 `node tests/toolkit-smoke.cjs` 가 본다.

## Preact 전환 검증

- `node tests/draft-engine.cjs`: 브라우저나 npm 설치 없이 실행. 같은 씨앗 재현, 보급 재요청, 지명 중복 방지, 낡은 AI 타이머, 점수 내역 합계, 전적 1회 저장을 검사한다.
- 전환 시 기존 구현과 세 가지 설정의 전체 판을 비교하여 보급 카드·편성·점수·전적·훈장 일치를 확인했다.
- 화면을 갈아치우면 그 화면에 딸린 브라우저 검사를 **같이 옮긴다.** 안 옮기면 조용히 죽고, 늘 빨간 검사는 진짜 고장까지 덮는다. 옛 `*-smoke.cjs` 다섯 개가 그렇게 이틀 동안 죽어 있었다.
- 자동 DOM 검사에서 설정·테마 전환·지명 확인·점수 미리보기·내 편성·전황·도감·이미지 확대·최종 결과를 확인했다. 실제 브라우저 레이아웃 및 폴드5 실기기 확인은 별도로 수행해야 한다.

도감은 `main` 바깥 문서 스크롤을 잠그고, `.collection-scroll`만 세로로 움직인다. 목록을 내리면 상단 내비·제목·탭을 접어 검색 중심의 얇은 바로 바뀌고, 맨 위로 돌아오면 다시 펼친다. 드래프트도 고정된 상단과 하단 버튼 사이의 `.draft-content`만 스크롤한다.

툴킷과 드래프트의 화면 높이는 `visualViewport`를 우선 사용한다. Galaxy Fold처럼 주소창·시스템 내비게이션이 가시 영역을 바꾸는 환경에서도 하단 작업 버튼은 `--atelier-vh` 안에 남아야 한다.
