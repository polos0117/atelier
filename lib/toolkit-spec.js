/* 툴킷 자료 표 — prompt.html 안에 상수로 박혀 있던 것을 옮겼다.

   옮긴 이유는 도감에서 화풍 이름표를 뺀 것과 같다. 표가 코드 안에 있으면
   그 파일을 읽는 화면만 쓸 수 있고, 같은 표를 다른 화면이 또 들고 있게 된다.
   여기 있는 것은 전부 고정 자료다 — 설정 항목, 카테고리, 예시, 화풍·형태 문구.
   사람이 고른 값이나 기록은 여기 없다 (그쪽은 toolkit-data.json 과 localStorage).

   lib/img.js 와 같은 방식으로 window.AtelierSpec 하나만 붙인다. 빌드 없음.
   일반 <script> 라 prompt.html 본문보다 먼저 실행된다.
   선언 차례는 원본 그대로 두었다 — STYLE_PROFILES 가 STYLE_CORES 와
   확장 표를, MORPHOLOGY_PROFILES 가 위쪽 문자열 상수들을 참조하기 때문이다. */
(function (root) {
  'use strict';

  const PARAM_DEFS = [{"key": "apparent age", "label": "Apparent Age", "ko": "외관상 나이", "options": [["", "AUTO — 기체 이미지에 맞춰 자동 결정"], ["20s", "20s — 20대 성인"], ["30s", "30s — 30대 성인"], ["40s", "40s — 40대 성인"], ["mature adult", "Mature Adult — 성숙하고 연륜 있는 성인"], ["youthful adult", "Youthful — 동안 (성인이되 어려 보이는 얼굴)"], ["__custom__", "직접 입력… — 원하는 나이 인상 직접 작성"]], "group": "base"}, {"key": "facial ethnicity", "label": "Facial Ethnicity", "ko": "얼굴 계통", "options": [["", "AUTO — 지정 안 함 (모델 기본값 = 서구권으로 쏠리기 쉬움)"], ["East Asian", "East Asian — 동아시아 계열"], ["Korean", "Korean — 한국계"], ["Japanese", "Japanese — 일본계"], ["Chinese", "Chinese — 중국계"], ["Southeast Asian", "Southeast Asian — 동남아 계열"], ["Central Asian", "Central Asian — 중앙아시아 계열"], ["South Asian", "South Asian — 남아시아 계열"], ["Middle Eastern", "Middle Eastern — 중동 계열"], ["European", "European — 유럽 계열"], ["Nordic", "Nordic — 북유럽 계열"], ["Mediterranean", "Mediterranean — 지중해 계열"], ["Slavic", "Slavic — 슬라브 계열"], ["Latin American", "Latin American — 라틴 계열"], ["African", "African — 아프리카 계열"], ["mixed East Asian and European", "Mixed (EA×EU) — 동아시아·유럽 혼혈"], ["__custom__", "직접 입력… — 원하는 계통 직접 작성"]], "group": "base"}, {"key": "human-mechanical balance", "label": "Human ↔ Mechanical Balance", "ko": "인간/기계 비율", "options": [["", "AUTO — 기체에 맞춰 자동 결정"], ["more human", "More Human — 인간 신체 비중을 더 높임"], ["balanced", "Balanced — 인간과 기계 요소를 균형 있게"], ["more mechanical", "More Mechanical — 기계 장갑 비중을 더 높임"], ["very mechanical", "Very Mechanical — 원기체 구조를 매우 강하게 유지"], ["__custom__", "직접 입력… — 원하는 비율 직접 작성"]], "group": "base"}, {"key": "body type", "label": "Body Type", "ko": "체형", "options": [["", "AUTO — 기체 실루엣에서 자동 추론"], ["slender", "Slender — 가늘고 슬림한 체형"], ["athletic", "Athletic — 탄탄한 운동형 체형"], ["curvy", "Curvy — 허리와 골반 곡선이 강조된 체형"], ["glamorous", "Glamorous — 풍만하고 화려한 체형"], ["muscular", "Muscular — 근육이 뚜렷한 체형"], ["heavy-built", "Heavy-built — 중후하고 묵직한 체형"], ["tall and lean", "Tall & Lean — 장신의 길고 슬림한 체형"], ["petite", "Petite — 작고 아담한 체형"], ["hourglass", "Hourglass — 허리가 잘록한 모래시계형"], ["voluptuous", "Voluptuous — 굴곡이 크고 육감적인 체형"], ["toned", "Toned — 군살 없이 잔근육이 잡힌 체형"], ["wiry", "Wiry — 가늘지만 단단한 체형"], ["soft-figured", "Soft-figured — 부드럽고 살집 있는 체형"], ["pear-shaped", "Pear-shaped — 하체에 무게가 실린 체형"], ["inverted triangle", "Inverted Triangle — 어깨가 넓고 하체가 좁은 역삼각형"], ["stocky", "Stocky — 짧고 다부진 체형"], ["statuesque", "Statuesque — 크고 당당한 조각상 같은 체형"], ["broad-shouldered", "Broad-shouldered — 어깨가 특히 넓은 체형"], ["burly", "Burly — 크고 두꺼운 거구"], ["lanky", "Lanky — 키만 크고 마른 체형"], ["barrel-chested", "Barrel-chested — 흉곽이 통처럼 두꺼운 체형"], ["rangy", "Rangy — 길고 유연한 근육질"], ["__custom__", "직접 입력… — 원하는 체형 직접 작성"]], "group": "build"}, {"key": "height impression", "label": "Height Impression", "ko": "키 인상", "options": [["", "AUTO — 전체 비율에서 자동 결정"], ["short", "Short — 비교적 작은 키 인상"], ["average", "Average — 평균적인 키 인상"], ["tall", "Tall — 장신 인상"], ["very tall", "Very Tall — 매우 큰 키 인상"], ["__custom__", "직접 입력… — 원하는 키/비율 직접 작성"]], "group": "build", "sub": "body type"}, {"key": "shoulder build", "label": "Shoulder Build", "ko": "어깨 체형", "options": [["", "AUTO — 자동 결정"], ["narrow", "Narrow — 좁은 어깨"], ["average", "Average — 평균적인 어깨"], ["broad", "Broad — 넓은 어깨"], ["__custom__", "직접 입력…"]], "group": "build", "sub": "body type"}, {"key": "torso / chest build", "label": "Torso / Chest Build", "ko": "상체/흉곽 인상", "options": [["", "AUTO — 자동 결정"], ["slim", "Slim — 얇고 가벼운 상체"], ["balanced", "Balanced — 균형 잡힌 상체"], ["full", "Full — 풍만한 상체"], ["powerful", "Powerful — 넓고 강한 흉곽"], ["v-taper", "V-taper — 어깨에서 허리로 급히 좁아지는 상체"], ["full bust", "Full Bust — 가슴 볼륨이 뚜렷한 상체"], ["__custom__", "직접 입력…"]], "group": "build", "sub": "body type"}, {"key": "torso length", "label": "Torso Length", "ko": "몸통 길이", "options": [["", "AUTO — 자동 결정"], ["short", "Short — 짧은 몸통"], ["balanced", "Balanced — 보통"], ["long", "Long — 긴 몸통"], ["__custom__", "직접 입력…"]], "group": "build", "sub": "body type"}, {"key": "waist / hip silhouette", "label": "Waist / Hip Silhouette", "ko": "허리/골반 실루엣", "options": [["", "AUTO — 자동 결정"], ["straight", "Straight — 직선적인 실루엣"], ["athletic", "Athletic — 운동형 허리/골반"], ["balanced", "Balanced — 균형형"], ["hourglass", "Hourglass — 허리가 잘록한 모래시계형"], ["curvy", "Curvy — 골반 곡선이 강조된 형태"], ["narrow-hipped", "Narrow-hipped — 골반이 좁은 형태"], ["broad-hipped", "Broad-hipped — 골반이 넓게 벌어진 형태"], ["__custom__", "직접 입력…"]], "group": "build", "sub": "body type"}, {"key": "leg proportion", "label": "Leg Proportion", "ko": "다리 비율", "options": [["", "AUTO — 자동 결정"], ["balanced", "Balanced — 균형형"], ["long", "Long — 긴 다리"], ["very long", "Very Long — 매우 긴 다리"], ["powerful", "Powerful — 굵고 힘 있는 다리"], ["__custom__", "직접 입력…"]], "group": "build", "sub": "body type"}, {"key": "lower-body build", "label": "Lower-body Build", "ko": "하체 굵기", "options": [["", "AUTO — 자동 결정"], ["slender", "Slender — 가는 하체"], ["balanced", "Balanced — 보통"], ["full", "Full — 굵은 하체"], ["__custom__", "직접 입력…"]], "group": "build", "sub": "body type"}, {"key": "body measurements (B/W/H)", "label": "Body Measurements", "ko": "신체 치수 B/W/H", "options": [["", "AUTO — 자동 결정"], ["__custom__", "직접 입력…"]], "group": "build", "sub": "body type", "ph": "94 / 61 / 95"}, {"key": "facial character", "label": "Facial Character", "ko": "얼굴 인상", "options": [["", "AUTO — 기체 성격에 맞춰 자동 결정"], ["elegant", "Elegant — 우아하고 정제된 인상"], ["cool", "Cool — 차갑고 세련된 인상"], ["sharp", "Sharp — 예리하고 공격적인 인상"], ["mature", "Mature — 성숙하고 안정된 인상"], ["soft", "Soft — 부드럽고 온화한 인상"], ["glamorous", "Glamorous — 화려하고 매력적인 인상"], ["rugged", "Rugged — 거칠고 강인한 인상"], ["stoic", "Stoic — 무표정하고 절제된 인상"], ["weathered", "Weathered — 풍상을 겪은 거친 인상"], ["boyish", "Boyish — 앳되고 장난기 있는 인상"], ["regal", "Regal — 위엄 있고 고압적인 인상"], ["cute", "Cute — 귀엽고 사랑스러운 인상"], ["doll-like", "Doll-like — 인형처럼 정제된 인상"], ["cheerful", "Cheerful — 밝고 명랑한 인상"], ["innocent", "Innocent — 맑고 순수해 보이는 인상"], ["friendly", "Friendly — 다가가기 쉬운 인상"], ["sleepy-eyed", "Sleepy-eyed — 나른한 인상"], ["refined", "Refined — 단정하고 세련된 인상"], ["fierce", "Fierce — 사납고 거센 인상"], ["exotic", "Exotic — 이국적인 인상"], ["androgynous", "Androgynous — 중성적인 인상"], ["melancholic", "Melancholic — 어딘가 쓸쓸한 인상"], ["__custom__", "직접 입력… — 원하는 얼굴 인상 직접 작성"]], "group": "face"}, {"key": "facial hair", "label": "Facial Hair", "ko": "수염", "sex": "male", "options": [["", "AUTO — 기체 인상에 맞춰 자동 결정"], ["clean-shaven", "Clean-shaven — 수염 없이 매끈하게"], ["light stubble", "Light Stubble — 하루이틀 자란 옅은 수염"], ["heavy stubble", "Heavy Stubble — 짙게 자란 무정수염"], ["mustache", "Mustache — 콧수염만"], ["goatee", "Goatee — 턱 끝만 좁게 기른 염소수염"], ["short beard", "Short Beard — 짧게 다듬은 턱수염"], ["full beard", "Full Beard — 풍성한 전체 수염"], ["chinstrap beard", "Chinstrap — 턱선을 따라 가늘게 두른 수염"], ["sideburns", "Sideburns — 구레나룻 강조"], ["__custom__", "직접 입력… — 원하는 수염 형태 직접 작성"]], "group": "face"}, {"key": "skin tone", "label": "Skin Tone", "ko": "피부 톤", "options": [["", "AUTO — 자동 결정"], ["pale", "Pale — 매우 밝은 피부"], ["light", "Light — 밝은 피부"], ["medium", "Medium — 중간 피부톤"], ["tan", "Tan — 태닝된 피부"], ["deep", "Deep — 짙은 피부톤"], ["__custom__", "직접 입력…"]], "group": "face"}, {"key": "face shape", "label": "Face Shape", "ko": "얼굴형", "options": [["", "AUTO — 기체 디자인에서 자동 추론"], ["oval", "Oval — 균형 잡힌 타원형"], ["angular", "Angular — 각지고 선명한 얼굴형"], ["heart-shaped", "Heart-shaped — 이마가 넓고 턱이 가는 하트형"], ["elongated", "Elongated — 길고 세련된 얼굴형"], ["compact", "Compact — 짧고 응축된 얼굴형"], ["softly rounded", "Softly Rounded — 부드럽고 둥근 얼굴형"], ["sharp", "Sharp — 턱선과 골격이 날카로운 얼굴형"], ["__custom__", "직접 입력… — 얼굴형 직접 작성"]], "group": "face", "sub": "facial character"}, {"key": "eye shape", "label": "Eye Shape", "ko": "눈매", "options": [["", "AUTO — 자동 결정"], ["narrow", "Narrow — 가늘고 날카로운 눈"], ["almond", "Almond — 아몬드형 눈"], ["large", "Large — 큰 눈"], ["sharp", "Sharp — 강하게 치켜올라간 눈"], ["drooping", "Drooping — 살짝 처진 부드러운 눈"], ["upturned", "Upturned — 끝이 올라간 눈"], ["__custom__", "직접 입력…"]], "group": "face", "sub": "facial character"}, {"key": "eye color", "label": "Eye Color", "ko": "눈동자 색 · 오른쪽", "options": [["", "AUTO — 센서/기체색에서 자동 결정"], ["red", "Red — 적색"], ["crimson", "Crimson — 진홍색"], ["amber", "Amber — 호박색"], ["gold", "Gold — 금색"], ["orange", "Orange — 주황색"], ["green", "Green — 녹색"], ["teal", "Teal — 청록색"], ["pale blue", "Pale Blue — 옅은 하늘색"], ["blue", "Blue — 청색"], ["navy", "Navy — 짙은 남색"], ["purple", "Purple — 보라색"], ["lavender", "Lavender — 연보라"], ["pink", "Pink — 분홍색"], ["gray", "Gray — 회색"], ["silver", "Silver — 은색"], ["brown", "Brown — 갈색"], ["black", "Black — 검은색"], ["__custom__", "직접 입력…"]], "group": "face", "sub": "facial character"}, {"key": "second eye color", "label": "Second Eye Color", "ko": "오드아이 · 왼쪽 눈", "group": "face", "sub": "facial character", "options": [["", "사용 안 함 — 양쪽 같은 색"], ["red", "Red — 적색"], ["crimson", "Crimson — 진홍색"], ["amber", "Amber — 호박색"], ["gold", "Gold — 금색"], ["orange", "Orange — 주황색"], ["green", "Green — 녹색"], ["teal", "Teal — 청록색"], ["pale blue", "Pale Blue — 옅은 하늘색"], ["blue", "Blue — 청색"], ["navy", "Navy — 짙은 남색"], ["purple", "Purple — 보라색"], ["lavender", "Lavender — 연보라"], ["pink", "Pink — 분홍색"], ["gray", "Gray — 회색"], ["silver", "Silver — 은색"], ["brown", "Brown — 갈색"], ["black", "Black — 검은색"], ["__custom__", "직접 입력… — 원하는 색 직접 작성"]]}, {"key": "expression", "label": "Expression", "ko": "표정", "options": [["", "AUTO — 기체 성격에 맞춰 자동 결정"], ["calm", "Calm — 차분함"], ["serious", "Serious — 진지함"], ["confident", "Confident — 자신감"], ["cold", "Cold — 차갑고 냉정함"], ["gentle", "Gentle — 부드러움"], ["smirk", "Smirk — 옅은 비웃음/미소"], ["fierce", "Fierce — 강렬하고 사나움"], ["stoic", "Stoic — 감정을 절제한 무표정"], ["__custom__", "직접 입력…"]], "group": "face", "sub": "facial character"}, {"key": "face length", "label": "Face Length", "ko": "얼굴 길이", "options": [["", "AUTO — 자동 결정"], ["short", "Short — 짧은 얼굴"], ["balanced", "Balanced — 보통"], ["long", "Long — 긴 얼굴"], ["__custom__", "직접 입력…"]], "group": "face", "sub": "facial character"}, {"key": "face width", "label": "Face Width", "ko": "얼굴 폭", "options": [["", "AUTO — 자동 결정"], ["narrow", "Narrow — 좁은 얼굴"], ["medium", "Medium — 보통"], ["wide", "Wide — 넓은 얼굴"], ["__custom__", "직접 입력…"]], "group": "face", "sub": "facial character"}, {"key": "jaw & chin", "label": "Jaw & Chin", "ko": "턱선 · 턱끝", "options": [["", "AUTO — 자동 결정"], ["soft rounded jaw", "Soft — 부드럽고 둥근 턱"], ["balanced jawline", "Balanced — 보통"], ["angular defined jaw", "Angular — 각지고 또렷한 턱"], ["square broad jaw", "Square — 넓고 각진 사각 턱"], ["narrow tapered chin", "Tapered — 아래로 갈수록 좁아지는 턱끝"], ["wide heavy chin", "Heavy — 넓고 묵직한 턱끝"], ["long chin with defined jaw", "Long — 턱끝이 길고 턱선이 또렷한"], ["receding soft chin", "Receding — 턱끝이 뒤로 물러난"], ["__custom__", "직접 입력…"]], "group": "face", "sub": "facial character"}, {"key": "eye size", "label": "Eye Size", "ko": "눈 크기", "options": [["", "AUTO — 자동 결정"], ["small", "Small — 작은 눈"], ["medium", "Medium — 보통"], ["large", "Large — 큰 눈"], ["__custom__", "직접 입력…"]], "group": "face", "sub": "facial character"}, {"key": "eye tilt", "label": "Eye Tilt", "ko": "눈꼬리 각도", "options": [["", "AUTO — 자동 결정"], ["downturned outer corners", "Downturned — 처진 눈꼬리"], ["level outer corners", "Level — 수평"], ["upturned outer corners", "Upturned — 올라간 눈꼬리"], ["__custom__", "직접 입력…"]], "group": "face", "sub": "facial character"}, {"key": "nose character", "label": "Nose Character", "ko": "코", "options": [["", "AUTO — 자동 결정"], ["small delicate nose", "Delicate — 작고 여린 코"], ["balanced nose", "Balanced — 보통"], ["prominent defined nose", "Prominent — 크고 또렷한 코"], ["straight slender bridge", "Straight — 곧고 가는 콧대"], ["aquiline nose with convex bridge", "Aquiline — 콧대가 볼록한 매부리코"], ["rounded soft tip", "Rounded Tip — 코끝이 둥근"], ["broad low bridge", "Broad Low — 콧대가 낮고 넓은"], ["short nose with upturned tip", "Upturned — 짧고 코끝이 들린"], ["long nose with low tip", "Long — 길고 코끝이 내려온"], ["__custom__", "직접 입력…"]], "group": "face", "sub": "facial character"}, {"key": "lips", "label": "Lips", "ko": "입술", "options": [["", "AUTO — 자동 결정"], ["thin lips", "Thin — 얇은 입술"], ["medium lips", "Medium — 보통"], ["full lips", "Full — 도톰한 입술"], ["fuller lower lip", "Fuller Lower — 아랫입술이 더 도톰한"], ["bow-shaped upper lip", "Bow — 윗입술이 활 모양인"], ["straight even lips", "Even — 굴곡 없이 곧은"], ["wide mouth", "Wide — 입이 넓은"], ["small mouth", "Small — 입이 작은"], ["__custom__", "직접 입력…"]], "group": "face", "sub": "facial character"}, {"key": "hair color", "label": "Hair Color", "ko": "머리색", "options": [["", "AUTO — 기체 색상에 맞춰 자동 결정"], ["white", "White — 흰색"], ["platinum", "Platinum — 백금색"], ["silver", "Silver — 은색"], ["ash blonde", "Ash Blonde — 애시 블론드"], ["blonde", "Blonde — 금발"], ["gold", "Gold — 금색"], ["orange", "Orange — 주황색"], ["red", "Red — 붉은색"], ["crimson", "Crimson — 진홍색"], ["pink", "Pink — 분홍색"], ["purple", "Purple — 보라색"], ["lavender", "Lavender — 연보라"], ["navy", "Navy — 짙은 남색"], ["blue", "Blue — 파란색"], ["teal", "Teal — 청록색"], ["mint", "Mint — 민트색"], ["green", "Green — 녹색"], ["brown", "Brown — 갈색"], ["black", "Black — 검은색"], ["__custom__", "직접 입력… — 원하는 색 직접 작성"]], "group": "hair"}, {"key": "hairstyle", "label": "Hairstyle", "ko": "헤어스타일", "options": [["", "AUTO — 기체 디자인에 맞춰 자동 결정"], ["bob", "Bob — 단정한 보브컷"], ["pixie cut", "Pixie Cut — 짧고 가벼운 픽시컷"], ["layered", "Layered — 층을 살린 레이어드"], ["ponytail", "Ponytail — 포니테일"], ["twin tail", "Twin Tail — 트윈테일"], ["wolf cut", "Wolf Cut — 층감이 강한 울프컷"], ["slicked back", "Slicked Back — 뒤로 넘긴 스타일"], ["wavy", "Wavy — 웨이브 헤어"], ["straight", "Straight — 곧은 생머리"], ["side ponytail", "Side Ponytail — 사이드 포니테일"], ["high ponytail", "High Ponytail — 높이 묶은 포니테일"], ["braid", "Single Braid — 한 갈래 땋은 머리"], ["twin braids", "Twin Braids — 양갈래 땋은 머리"], ["crown braid", "Crown Braid — 머리를 둘러 땋은 왕관형"], ["chignon", "Chignon — 단정하게 말아 올린 시뇽"], ["messy bun", "Messy Bun — 흐트러진 번"], ["top knot", "Top Knot — 정수리에 묶어 올린 번"], ["low bun", "Low Bun — 목덜미 낮은 번"], ["half-up", "Half-up — 반묶음"], ["space buns", "Space Buns — 양쪽 동그란 번"], ["hime cut", "Hime Cut — 히메컷"], ["asymmetric cut", "Asymmetric Cut — 좌우 길이가 다른 비대칭컷"], ["undercut", "Undercut — 옆/뒤를 밀어낸 언더컷"], ["side-shaved long hair", "Side-shaved Long — 한쪽만 밀고 나머지는 긴 머리"], ["curly", "Curly — 굵은 곱슬"], ["tight curls", "Tight Curls — 잔곱슬 / 아프로"], ["locs", "Locs — 로크스 / 드레드풍"], ["ringlet curls", "Ringlet Curls — 세로로 말린 드릴 컬"], ["finger waves", "Finger Waves — 레트로 웨이브"], ["feathered", "Feathered — 끝을 가볍게 친 페더컷"], ["blunt cut", "Blunt Cut — 끝을 일자로 자른 컷"], ["wet-look slick", "Wet-look Slick — 젖은 듯 넘긴 스타일"], ["windswept", "Windswept — 바람에 날린 듯한 스타일"], ["buzz cut", "Buzz Cut — 아주 짧게 민 머리"], ["crew cut", "Crew Cut — 짧고 단정한 크루컷"], ["side part", "Side Part — 가르마를 탄 단정한 컷"], ["fade", "Fade — 옆을 그라데이션으로 짧게 친 컷"], ["man bun", "Man Bun — 뒤로 묶어 올린 번"], ["swept back", "Swept Back — 뒤로 넘긴 볼륨 있는 스타일"], ["shaggy", "Shaggy — 덥수룩하게 흐트러진 컷"], ["mullet", "Mullet — 앞은 짧고 뒤만 긴 컷"], ["__custom__", "직접 입력… — 헤어스타일 직접 작성"]], "group": "hair"}, {"key": "hair length", "label": "Hair Length", "ko": "머리 길이", "options": [["", "AUTO — 기체 실루엣에 맞춰 자동 결정"], ["very short", "Very Short — 매우 짧은 머리"], ["short", "Short — 짧은 머리"], ["medium", "Medium — 중간 길이"], ["long", "Long — 긴 머리"], ["very long", "Very Long — 매우 긴 머리"], ["__custom__", "직접 입력… — 길이 직접 작성"]], "group": "hair", "sub": "hairstyle"}, {"key": "bangs", "label": "Bangs", "ko": "앞머리", "options": [["", "AUTO — 자동 결정"], ["none", "None — 앞머리 없음"], ["straight bangs", "Straight Bangs — 일자 앞머리"], ["side-swept bangs", "Side-swept Bangs — 옆으로 넘긴 앞머리"], ["curtain bangs", "Curtain Bangs — 커튼뱅"], ["long side bangs", "Long Side Bangs — 긴 사이드뱅"], ["long side bangs covering one eye", "One-eye Cover — 한쪽 눈을 덮는 긴 사이드뱅"], ["asymmetric bangs", "Asymmetric Bangs — 좌우 길이가 다른 앞머리"], ["parted bangs", "Parted Bangs — 가운데를 가른 앞머리"], ["choppy bangs", "Choppy Bangs — 끝을 불규칙하게 친 앞머리"], ["__custom__", "직접 입력…"]], "group": "hair", "sub": "hairstyle"}, {"key": "hair accent", "label": "Hair Accent", "ko": "머리 삐침 · 잔머리", "group": "hair", "sub": "hairstyle", "options": [["", "AUTO — 지정 안 함"], ["a single antenna strand standing up", "Antenna Strand — 안테나 헤어 한 가닥"], ["two antenna strands standing up", "Twin Antennae — 안테나 헤어 두 가닥"], ["a prominent cowlick", "Cowlick — 크게 뻗친 가마머리"], ["loose stray strands framing the face", "Stray Strands — 얼굴 옆 잔머리"], ["neatly kept, no stray strands", "Neat — 삐침 없이 정돈"], ["__custom__", "직접 입력… — 원하는 형태 직접 작성"]]}, {"key": "hair texture", "label": "Hair Texture", "ko": "머릿결", "options": [["", "AUTO — 자동 결정"], ["fine", "Fine — 가늘고 매끄러운"], ["medium", "Medium — 보통"], ["thick", "Thick — 굵고 뻣뻣한"], ["__custom__", "직접 입력…"]], "group": "hair", "sub": "hairstyle"}, {"key": "hair volume", "label": "Hair Volume", "ko": "머리 볼륨", "options": [["", "AUTO — 자동 결정"], ["flat", "Flat — 납작한"], ["moderate", "Moderate — 보통"], ["full", "Full — 풍성한"], ["__custom__", "직접 입력…"]], "group": "hair", "sub": "hairstyle"}, {"key": "parting", "label": "Parting", "ko": "가르마", "options": [["", "AUTO — 자동 결정"], ["center part", "Center — 가운데 가르마"], ["slight off-center part", "Slight off-center — 살짝 비낀 가르마"], ["deep side part", "Deep side — 깊은 옆 가르마"], ["no visible part", "None — 가르마 없음"], ["swept back", "Swept back — 뒤로 넘긴"], ["__custom__", "직접 입력…"]], "group": "hair", "sub": "hairstyle"}, {"key": "armor coverage", "label": "Armor Coverage", "ko": "장갑 커버리지", "options": [["", "AUTO — 기체 구조에서 자동 결정"], ["full", "Full — 거의 전신 장갑"], ["high", "High — 장갑 비중이 높은 편"], ["balanced", "Balanced — 피부와 장갑의 균형"], ["open", "Open — 일부 피부 노출이 더 많은 구조"], ["__custom__", "직접 입력… — 커버리지 직접 작성"]], "group": "armor"}, {"key": "lower-body treatment", "label": "Lower-body Treatment", "ko": "하체 장갑 구조", "options": [["", "AUTO — 원기체 실루엣에 맞춰 자동 결정"], ["armored skirt", "Armored Skirt — 스커트형 장갑"], ["split armored skirt", "Split Armored Skirt — 좌우 분할 스커트 장갑"], ["robe-like armor", "Robe-like Armor — 로브형 장갑"], ["mantle-like armor", "Mantle-like Armor — 망토/드레이프형 장갑"], ["pants armor", "Pants Armor — 바지처럼 이어지는 장갑 구조"], ["layered plates", "Layered Plates — 여러 겹 판넬형 하체 장갑"], ["__custom__", "직접 입력… — 하체 구조 직접 작성"]], "group": "armor", "sub": "armor coverage"}, {"key": "head crest integration", "label": "Head Crest Integration", "ko": "헤드 크레스트 표현", "options": [["", "AUTO — 원기체에 맞춰 자동 결정"], ["mechanical crest", "Mechanical Crest — 기계식 크레스트 유지"], ["headband-like", "Headband-like — 헤드밴드처럼 통합"], ["hair ornament", "Hair Ornament — 헤어 장식처럼 통합"], ["helmet-like", "Helmet-like — 헬멧 구조로 통합"], ["sensor ornament", "Sensor Ornament — 센서 장식으로 표현"], ["__custom__", "직접 입력…"]], "group": "armor", "sub": "armor coverage"}, {"key": "silhouette character", "label": "Silhouette Character", "ko": "전체 실루엣 성격", "options": [["", "AUTO — 자동 결정"], ["aerodynamic", "Aerodynamic — 공기역학적이고 날렵함"], ["elegant", "Elegant — 우아하고 유려함"], ["aggressive", "Aggressive — 공격적이고 뾰족함"], ["heavy", "Heavy — 중장갑형의 묵직함"], ["tactical", "Tactical — 실전적이고 전술적"], ["regal", "Regal — 위엄 있고 장식적인 인상"], ["experimental", "Experimental — 실험기다운 이질적 형태"], ["minimal", "Minimal — 간결하고 절제된 형태"], ["__custom__", "직접 입력…"]], "group": "shot"}, {"key": "equipment emphasis", "label": "Equipment Emphasis", "ko": "장비 강조", "options": [["", "AUTO — 기체 대표 장비를 자동 우선"], ["balanced", "Balanced — 장비를 균형 있게"], ["backpack", "Backpack — 백팩 구조 강조"], ["wings / binders", "Wings / Binders — 날개/바인더 강조"], ["main weapon", "Main Weapon — 주무장 강조"], ["shield", "Shield — 방패 강조"], ["remote weapons", "Remote Weapons — 판넬/비트/드론 강조"], ["transformation system", "Transformation System — 변형기구 강조"], ["__custom__", "직접 입력…"]], "group": "shot"}, {"key": "equipment state", "label": "Equipment State", "ko": "장비 상태", "options": [["", "AUTO — 자동 결정"], ["fully mounted", "Fully Mounted — 장비 전부 장착"], ["main weapon held", "Main Weapon Held — 주무장을 손에 듦"], ["weapons stowed", "Weapons Stowed — 무장 수납 상태"], ["equipment deployed", "Equipment Deployed — 날개/판넬 등 전개 상태"], ["__custom__", "직접 입력…"]], "group": "shot"}, {"key": "pose character", "label": "Pose Character", "ko": "포즈 성격", "options": [["", "AUTO — 자동 결정"], ["neutral", "Neutral — 정적인 기본 자세"], ["heroic", "Heroic — 영웅적인 자세"], ["confident", "Confident — 자신감 있는 자세"], ["relaxed", "Relaxed — 힘을 뺀 자연스러운 자세"], ["combat-ready", "Combat-ready — 전투 준비 자세"], ["elegant", "Elegant — 우아한 자세"], ["__custom__", "직접 입력…"]], "group": "shot"}, {"key": "view angle", "label": "View Angle", "ko": "시점", "options": [["", "AUTO — 자동 결정"], ["front", "Front — 정면"], ["front three-quarter", "Front 3/4 — 정면 45도"], ["side", "Side — 측면"], ["rear three-quarter", "Rear 3/4 — 후면 45도"], ["__custom__", "직접 입력…"]], "group": "shot"}];

  const CATS = [["auto_random", "AUTO / RANDOM", "자동 / 랜덤", ""], ["adult_roleplay", "ADULT ROLEPLAY / OCCUPATION EVENT FASHION", "성인 역할극 / 직업풍 이벤트 패션", "Create playful adult event fashion inspired by occupation or roleplay motifs. It must read as a costume made for a stage presentation or themed event, not as an authentic workplace uniform. Use original colours and decorative details — no real institutional insignia, no weapons, no tactical gear. Describe the costume by its tailoring, trim, and props, and show a believable styling or preparation action.", "f"], ["occupation_basic", "MODERN OCCUPATION — BASIC", "현대 직업컷 — 기본", "Create ONE believable modern occupation scene. First derive a specific modern profession from a distinctive SOURCE MOBILE SUIT lore anchor whenever possible. The workplace, clothing, action, and tools should make the occupation understandable without text. Keep styling attractive but grounded, practical, and non-costume-like."], ["occupation_sensual", "MODERN OCCUPATION — SENSUAL", "현대 직업컷 — 섹시", "Create ONE believable modern occupation scene with the same clearly adult character. The styling may be glamorous and fashion-forward, but the clothing must stay practical and credible for the job. The profession must remain immediately recognizable through the workplace, the tools, and the task actually in progress — name the equipment and the action. Use confident professional posture and cinematic workplace lighting. This is a real modern occupation interpretation, NOT roleplay costume fashion."], ["everyday_basic", "EVERYDAY LIFE — BASIC", "일상컷 — 기본", "Create candid ordinary personal-life moments. The scene should feel lived-in, believable, and visually specific rather than staged. Use normal contemporary clothing with clear character personality. Avoid glamour-shoot posing, professional work, and costume styling."], ["everyday_sensual", "EVERYDAY LIFE — SENSUAL", "일상컷 — 섹시", "Create a sensual but non-explicit everyday lifestyle moment with the same clearly adult character. The situation must read as believable ordinary life, so specify the room, the clothing, and a concrete action already in progress rather than a posed shoot. Use natural household or street lighting and eye-level framing; fabric drape, movement, and light carry the mood. Avoid turning the scene into a lingerie catalogue or a deliberate glamour shoot."], ["swimwear", "SWIMWEAR LIFESTYLE", "수영복 라이프스타일", "This pair is always swimwear-focused. Use modern swimwear that is fully lined and stays secure during movement, described by its construction — neckline, straps, panels, leg line, fabric. Prioritize a memorable swimwear scene with real action and water context over static posing. Keep the setting a public or resort one: poolside, shoreline, deck, or open water.", "f"], ["active", "ACTIVE / MOVEMENT FASHION", "액티브 / 무브먼트 패션", "Show real movement with fashion-forward activewear or movement-oriented clothing. Avoid generic gym snapshots. Prioritize dynamic motion, readable silhouette, waist and hip lines, fabric movement, and varied action."], ["source_editorial", "SOURCE-INSPIRED EDITORIAL FASHION", "SOURCE 영감 에디토리얼 패션", "This pair should reinterpret the source mobile suit as human editorial fashion. Translate source-specific colors, geometry, silhouette logic, crest language, and equipment symbolism into couture or themed fashion. No literal armor, no pilot suit, no mechanical body, no weapons."], ["homewear", "FASHION HOMEWEAR / LOUNGE LIFE", "패션 홈웨어 / 라운지 라이프", "Create designed, fashion-forward homewear or lounge-life scenes. Avoid plain pajamas and bland static sofa poses. Use believable home-life actions, stylish home fashion silhouettes, and a sensual but natural private-life atmosphere.", "f"], ["private_evening", "PRIVATE EVENING FASHION", "프라이빗 이브닝 패션", "Create mature private evening fashion scenes with intimate but non-explicit atmosphere. Use elegant, attractive, clearly adult styling, confident body language, and believable private-life context.", "f"], ["lingerie", "LINGERIE-INSPIRED FASHION", "란제리풍 패션", "Use tasteful adult lingerie-inspired evening fashion with full intimate coverage. Describe the garment by its construction — cut, fabric, trim, straps, closures, layers — rather than by mood words. The garments are securely fitted and fully opaque, and the look is suitable for a mainstream evening-fashion editorial. Build the image through framing, silhouette, posture, and lighting rather than exposure.", "f"], ["everyday", "EVERYDAY LIFESTYLE", "일상 라이프스타일", "Depict ordinary personal-life moments rather than occupation, costume, or formal editorial shoots. Keep them candid, believable, visually varied, and attractive without becoming too plain."], ["traditional", "TRADITIONAL / HERITAGE FASHION", "전통 의상 / 헤리티지 패션", "This cut is built around traditional dress drawn from the character's own ethnic background. Use either authentic formal traditional clothing or a modernised everyday interpretation of it, as specified by the example. Keep the garment structure, layering logic, fastening, and silhouette faithful to that tradition rather than generic orientalism or costume-shop pastiche. Colours may follow the source mobile suit, but the construction must remain true to the tradition. Place the character in a setting where such clothing is plausibly worn."], ["wildcard", "WILDCARD", "와일드카드", "Invent a fresh mature category not already used by the other pairs. It should remain stylish, sensual, cinematic, and non-explicit while contributing strong novelty."], ["__custom__", "CUSTOM", "직접 입력", ""]];

  const PRESETS = {"free": {"label": "자유 설정", "pairs": ["adult_roleplay", "swimwear", "homewear"], "advanced": {}}, "A": {"label": "코스튬 · 수영복 · 홈웨어", "pairs": ["adult_roleplay", "swimwear", "homewear"], "advanced": {"overall_intensity": "sensual", "pair_gap": "medium", "outfit_variety": "high", "scene_variety": "high", "source_influence": "subtle"}}, "B": {"label": "액티브 · SOURCE · 프라이빗", "pairs": ["active", "source_editorial", "private_evening"], "advanced": {"overall_intensity": "sensual", "pair_gap": "medium", "outfit_variety": "high", "scene_variety": "high", "source_influence": "balanced"}}, "random_variety": {"label": "랜덤 다양성 강화", "pairs": ["wildcard", "wildcard", "wildcard"], "advanced": {"overall_intensity": "sensual", "pair_gap": "medium", "outfit_variety": "extreme", "scene_variety": "extreme", "pose_variety": "extreme", "camera_variety": "extreme", "unexpected_cuts": "3"}}, "outfit_focus": {"label": "의상 중심", "pairs": ["adult_roleplay", "source_editorial", "lingerie"], "advanced": {"overall_intensity": "bold", "pair_gap": "medium", "outfit_variety": "extreme", "scene_variety": "high", "source_influence": "balanced"}}, "scene_focus": {"label": "장면 중심", "pairs": ["everyday", "swimwear", "wildcard"], "advanced": {"overall_intensity": "sensual", "pair_gap": "medium", "scene_variety": "extreme", "camera_variety": "high", "pose_variety": "high"}}, "strong_fashion": {"label": "강한 패션 중심", "pairs": ["adult_roleplay", "source_editorial", "lingerie"], "advanced": {"overall_intensity": "strong", "pair_gap": "strong", "skin_exposure": "bold", "outfit_variety": "high", "source_influence": "balanced"}}, "stable": {"label": "안정형", "pairs": ["adult_roleplay", "swimwear", "private_evening"], "advanced": {"overall_intensity": "restrained", "pair_gap": "small", "outfit_variety": "normal", "scene_variety": "normal", "pose_variety": "normal"}}, "worklife": {"label": "직업 · 일상 믹스", "pairs": ["occupation_basic", "everyday_basic", "everyday_sensual"], "advanced": {"overall_intensity": "sensual", "pair_gap": "medium", "scene_variety": "high", "pose_variety": "high"}}, "worklife_bold": {"label": "직업 · 일상 강한 버전", "pairs": ["occupation_sensual", "everyday_sensual", "private_evening"], "advanced": {"overall_intensity": "bold", "pair_gap": "medium", "outfit_variety": "high", "scene_variety": "high", "skin_exposure": "moderate"}}};

  const ADVANCED_OPTIONS = {"overall_intensity": ["AUTO", "restrained", "sensual", "bold", "strong"], "pair_gap": ["AUTO", "small", "medium", "strong", "extreme"], "outfit_variety": ["AUTO", "normal", "high", "extreme"], "scene_variety": ["AUTO", "normal", "high", "extreme"], "pose_variety": ["AUTO", "normal", "high", "extreme"], "camera_variety": ["AUTO", "normal", "high", "extreme"], "skin_exposure": ["AUTO", "low", "moderate", "bold"], "separates_preference": ["AUTO", "balanced", "prefer separates", "strongly prefer separates"], "action_level": ["AUTO", "mostly posed", "balanced", "mostly active"], "direct_gaze_limit": ["AUTO", "0", "1", "2"], "smile_limit": ["AUTO", "0", "1", "2"], "unexpected_cuts": ["AUTO", "1", "2", "3"], "source_influence": ["AUTO", "subtle", "balanced", "strong"]};

  const ADVANCED_LABELS = {"overall_intensity": ["Overall Intensity", "전체 강도"], "pair_gap": ["Pair Gap", "약한 컷↔강한 컷 차이"], "outfit_variety": ["Outfit Variety", "의상 다양성"], "scene_variety": ["Scene Variety", "장면 다양성"], "pose_variety": ["Pose Variety", "포즈 다양성"], "camera_variety": ["Camera Variety", "카메라 다양성"], "skin_exposure": ["Skin Exposure", "피부 노출 정도"], "separates_preference": ["Separates Preference", "분리형 의상 선호"], "action_level": ["Action Level", "액션 비중"], "direct_gaze_limit": ["Direct Gaze Limit", "정면 시선 최대"], "smile_limit": ["Smile Limit", "미소 최대"], "unexpected_cuts": ["Unexpected Cuts", "예상 밖 컷 수"], "source_influence": ["Source Influence", "SOURCE 영향도"]};

  const RANDOM_POOL = ["adult_roleplay", "occupation_basic", "occupation_sensual", "swimwear", "active", "source_editorial", "homewear", "private_evening", "lingerie", "everyday_basic", "everyday_sensual", "wildcard", "traditional"];

  const EXAMPLE_MAP = {"auto_random": [["", "AUTO", "자동", "basic"], ["seasonal_night", "Seasonal Night Mood", "계절감 있는 야간 무드", "basic"], ["travel_cut", "Travel / Resort Vibe", "여행 / 리조트 무드", "popular"], ["festival_night", "Night Festival", "야간 페스티벌", "popular"], ["unexpected_contrast", "Unexpected Contrast Concept", "예상 밖 대비 콘셉트", "special"], ["retro_future", "Retro-Future Lifestyle", "레트로 퓨처 라이프", "special"], ["rainy_city", "Rainy City Evening", "비 오는 도시의 저녁", "popular"], ["weekend_market", "Weekend Market Stroll", "주말 시장 산책", "popular"], ["late_studio", "Late-night Studio", "심야 작업실", "popular"], ["rooftop_wind", "Windy Rooftop", "바람 부는 옥상", "popular"], ["seaside_offseason", "Off-season Seaside", "비수기 바닷가", "special"], ["neon_alley", "Neon Backstreet", "네온 뒷골목", "special"], ["snow_evening", "Snowy Evening", "눈 내리는 저녁", "special"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "adult_roleplay": [["", "AUTO", "자동", "basic"], ["event_staff", "Adult Event Staff Costume", "성인 이벤트 스태프 코스튬", "basic", "f", "an event staff costume with a fitted vest, name-tag ribbon, and lanyard, at a themed venue"], ["uniform_inspired", "Stylized Uniform-inspired Look", "스타일화된 유니폼풍 룩", "basic", "f", "a stylized uniform-inspired costume with crisp lapels and decorative epaulettes, no real insignia"], ["adult_police", "Adult Police Costume", "성인 경찰 코스튬", "popular", "f", "a fictional police-inspired costume at a theatrical costume event, using original decorative badges rather than real insignia"], ["adult_nurse", "Adult Nurse Costume", "성인 간호사 코스튬", "popular", "f", "a fictional retro nurse-inspired costume at a theatrical costume event, using original decorative symbols rather than authentic hospital identification"], ["adult_maid", "Adult Maid Costume", "성인 메이드 코스튬", "popular", "f", "a black-and-white maid costume with a structured bodice, puffed sleeves, and a full apron, at a costume event"], ["adult_secretary", "Adult Secretary Costume", "성인 비서 코스튬", "popular", "f", "a retro secretary-inspired costume with a fitted blazer, pencil skirt, and decorative eyewear, at a themed office party"], ["bunny", "Bunny Costume", "바니 코스튬", "popular", "f", "a retro casino bunny costume with a fitted one-piece garment, cuffs, bow-tie collar, and rabbit-ear headband, on a stage floor"], ["flight_attendant", "Flight-attendant-inspired Costume", "승무원풍 코스튬", "popular", "f", "a retro flight-attendant-inspired costume with a fitted jacket, scarf, and original airline-style trim, at a themed event"], ["casino_dealer", "Casino Dealer / Hostess Styling", "카지노 딜러 / 호스티스 스타일", "popular", "f", "a casino dealer costume with a fitted waistcoat, bow tie, and cuffs, at a card table"], ["lab_roleplay", "Laboratory Roleplay Fashion", "연구실 역할극 패션", "special", "f", "a laboratory-themed costume with a crisp white coat over a fitted dress, using original decorative badges"], ["ceremonial_instructor", "Ceremonial Instructor Styling", "세리머니얼 인스트럭터 스타일", "special", "f", "a ceremonial instructor costume with a belted jacket, gloves, and a decorative sash"], ["retro_racer", "Retro Grid / Racing Costume", "레트로 레이싱 코스튬", "special", "f", "a retro racing grid costume with a cropped team jacket, shorts, and boots, beside a track barrier"], ["vinyl_stage", "Vinyl Stage Fashion", "비닐 스테이지 패션", "special", "f", "a vinyl stage costume with a glossy fitted jacket and boots under stage lighting"], ["masquerade", "Masquerade Costume Fashion", "마스커레이드 코스튬 패션", "special", "f", "a masquerade costume with a feathered eye mask, a structured bodice, and a full skirt"], ["adult_teacher", "Adult Teacher Costume", "성인 교사 코스튬", "popular", "f", "a teacher-inspired costume look with a fitted blazer, pleated skirt, reading glasses, and books"], ["adult_librarian", "Adult Librarian Styling", "성인 사서 스타일", "popular", "f", "a librarian-inspired costume with a fitted cardigan, pencil skirt, and glasses, among bookshelves"], ["cheer_costume", "Cheer Squad Costume", "치어 코스튬", "popular", "f", "a varsity cheer costume with a pleated skirt, striped fitted top, and team-colour panels, on a gym floor"], ["cabin_crew_retro", "Retro Cabin Crew", "레트로 객실승무원", "special", "f", "a retro cabin crew costume with a fitted jacket, pillbox hat, and neck scarf"], ["circus_ringmaster", "Circus Ringmaster Fashion", "서커스 링마스터 패션", "special", "f", "a circus ringmaster costume with a tailcoat, high boots, and a top hat, under a tent canopy"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "occupation_basic": [["", "AUTO — source-appropriate profession", "AUTO — 기체에 어울리는 직업 자동", "basic"], ["office_project", "Technical Project Manager", "기술 프로젝트 매니저", "basic"], ["field_surveyor", "Field Surveyor / Recon Specialist", "현장 조사 / 정찰 전문", "basic"], ["industrial_inspector", "Industrial Safety Inspector", "산업 안전 점검관", "basic"], ["drone_operator", "Drone Operator / Remote Systems", "드론 운용 / 원격 시스템", "popular"], ["aviation_control", "Aviation Dispatch / Flight Control", "항공 디스패치 / 비행 관제", "popular"], ["rescue_paramedic", "Rescue Paramedic", "구조 구급대원", "popular"], ["test_engineer", "Experimental Test Engineer", "실험기 테스트 엔지니어", "popular"], ["robotics_researcher", "Robotics Researcher", "로보틱스 연구원", "popular"], ["mobility_tuner", "Mobility Mechanic / Performance Tuner", "모빌리티 정비사 / 퍼포먼스 튜너", "popular"], ["marine_technician", "Marine Systems Technician", "해양 시스템 기술자", "special"], ["observatory_engineer", "Observatory Systems Engineer", "천문 관측 시스템 엔지니어", "special"], ["architecture_engineer", "Structural / Architecture Engineer", "구조 / 건축 엔지니어", "special"], ["renewable_engineer", "High-output Energy Systems Engineer", "고출력 에너지 시스템 엔지니어", "special"], ["stage_rigging", "Stage Rigging / Motion Systems Engineer", "무대 리깅 / 모션 시스템 엔지니어", "special"], ["orbital_logistics", "Orbital Logistics Controller", "궤도 물류 관제", "basic"], ["materials_lab", "Materials Test Researcher", "재료 시험 연구원", "basic"], ["welding_fabricator", "Structural Welder / Fabricator", "구조물 용접 기술자", "basic"], ["crane_operator", "Heavy Crane Operator", "대형 크레인 오퍼레이터", "basic"], ["firefighter", "Fire & Rescue Officer", "소방 구조대원", "popular"], ["hv_battery_tech", "High-voltage Battery Technician", "고전압 배터리 기술자", "popular"], ["wind_turbine_tech", "Wind Turbine Technician", "풍력 발전 정비사", "popular"], ["transit_control", "Metro Operations Controller", "지하철 운행 관제", "popular"], ["port_operations", "Port Cargo Operations", "항만 하역 관리", "popular"], ["surveyor_cartographer", "Surveyor / Cartographer", "측량 · 지도 제작", "popular"], ["sonar_analyst", "Sonar / Acoustic Analyst", "수중 음향 분석", "special"], ["avionics_tech", "Avionics Technician", "항공 전자 정비사", "popular"], ["demolition_planner", "Demolition Planner", "해체 공사 기획", "special"], ["cold_chain", "Cold Chain Logistics Manager", "냉동 물류 관리", "special"], ["satellite_operator", "Satellite Operations Officer", "위성 관제사", "popular"], ["forensic_engineer", "Failure Analysis Engineer", "사고 원인 분석관", "special"], ["hazmat_specialist", "Hazmat Response Specialist", "위험물 처리 전문가", "special"], ["simulator_instructor", "Simulator Instructor", "시뮬레이터 교관", "popular"], ["archive_restorer", "Archive Restoration Technician", "기록물 복원 기술자", "special"], ["agri_drone", "Agricultural Drone Operator", "농업 드론 운용", "special"], ["railway_engineer", "Rolling Stock Engineer", "철도 차량 엔지니어", "special"], ["water_plant", "Water Treatment Engineer", "정수 처리 엔지니어", "special"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "occupation_sensual": [["", "AUTO — source-appropriate profession", "AUTO — 기체에 어울리는 직업 자동", "basic"], ["fashion_project", "Fashion-forward Technical Project Lead", "패션감 있는 기술 프로젝트 리드", "basic"], ["night_lab", "Night-shift Lab Specialist", "야간 근무 연구실 스페셜리스트", "basic"], ["fashion_test_engineer", "Fashion-forward Test Engineer", "패션감 있는 테스트 엔지니어", "popular"], ["flight_supervisor", "Flight Operations Supervisor", "비행 운항 슈퍼바이저", "popular"], ["elite_paramedic", "Elite Rescue Medic", "엘리트 구조 메딕", "popular"], ["drone_director", "Remote Drone Director", "원격 드론 디렉터", "popular"], ["hightech_inspector", "High-tech Systems Inspector", "하이테크 시스템 인스펙터", "popular"], ["prototype_consultant", "Prototype Mobility Consultant", "프로토타입 모빌리티 컨설턴트", "special"], ["luxury_yacht_tech", "Luxury Yacht Tech Specialist", "럭셔리 요트 기술 전문가", "special"], ["night_observatory", "Night Observatory Engineer", "야간 천문대 엔지니어", "special"], ["motion_stage_director", "Kinetic Stage Systems Director", "키네틱 무대 시스템 디렉터", "special"], ["night_dispatch", "Night Dispatch Controller", "야간 배차 관제", "basic"], ["test_pilot_brief", "Test Pilot Briefing Lead", "테스트 파일럿 브리핑", "popular"], ["yacht_captain", "Yacht Captain", "요트 선장", "popular"], ["auction_specialist", "Auction Specialist", "경매 스페셜리스트", "popular"], ["motorsport_engineer", "Motorsport Race Engineer", "모터스포츠 엔지니어", "popular"], ["surgical_tech", "Surgical Technologist", "수술실 테크니션", "popular"], ["stunt_coordinator", "Stunt Coordinator", "스턴트 코디네이터", "special"], ["gallery_curator", "Gallery Curator", "갤러리 큐레이터", "popular"], ["helicopter_pilot", "Helicopter Pilot", "헬기 조종사", "popular"], ["deep_dive_specialist", "Deep Dive Specialist", "심해 잠수 전문가", "special"], ["broadcast_director", "Live Broadcast Director", "생방송 디렉터", "special"], ["perfume_developer", "Perfumer / Fragrance Developer", "조향사", "special"], ["armory_curator", "Historic Armory Curator", "고병기 컬렉션 큐레이터", "special"], ["orbital_hotel", "Orbital Hotel Concierge", "궤도 호텔 컨시어지", "special"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "swimwear": [["", "AUTO", "자동", "basic"], ["classic_bikini", "Classic Bikini", "클래식 비키니", "basic", "f", "a navy high-waisted bikini with a supportive halter top"], ["sport_onepiece", "Sporty One-piece", "스포티 원피스", "basic", "f", "a sporty one-piece swimsuit with a racerback and a high neckline in solid performance fabric"], ["highleg_onepiece", "High-leg One-piece", "하이레그 원피스", "popular", "f", "a high-leg one-piece swimsuit with a high neckline and supportive racerback"], ["monokini", "Monokini", "모노키니", "popular", "f", "a sculptural monokini with asymmetric side cut-outs joined by a solid central panel"], ["triangle_bikini", "Triangle Bikini", "트라이앵글 비키니", "popular", "f", "a triangle bikini with slider cups and tie-side bottoms"], ["bandeau_bikini", "Bandeau Bikini", "반두 비키니", "popular", "f", "a bandeau bikini with a straight strapless top and matching bottoms"], ["halter_bikini", "Halter Bikini", "홀터 비키니", "popular", "f", "a halter bikini with a neck tie and a supportive underbust band"], ["asymmetric_swim", "Asymmetric One-shoulder Swimwear", "비대칭 원숄더 수영복", "popular", "f", "an asymmetric one-shoulder swimsuit with a single wide strap and a clean diagonal neckline"], ["crossstrap_swim", "Cross-strap Swimwear", "크로스 스트랩 수영복", "popular", "f", "a swimsuit with crossed back straps and a scooped front neckline"], ["moonlit_pool", "Moonlit Outdoor Pool", "달빛 야외풀", "special", "f", "in swimwear at an outdoor pool at night, lit by underwater lamps and moonlight"], ["rooftop_infinity_pool", "Rooftop Infinity Pool", "루프탑 인피니티 풀", "special", "f", "in swimwear at a rooftop infinity pool with the city skyline behind her"], ["outdoor_shower", "Outdoor Shower / Rinse-off", "야외 샤워 / 린스오프", "special", "f", "rinsing off at an open-air poolside shower after swimming, still in swimwear"], ["cabana_daybed", "Resort Cabana / Daybed", "리조트 카바나 / 데이베드", "special", "f", "seated at a resort cabana daybed in swimwear with an open cover-up, a book and a cold drink beside her"], ["thermal_spa", "Modern Thermal Spa Pool", "모던 온천 / 스파 풀", "special", "f", "in swimwear at a modern thermal spa pool, steam rising off the water"], ["shoreline_walk", "Wet Shoreline Walk", "젖은 해변 산책", "special", "f", "walking along a wet shoreline in swimwear, wet sand and shallow surf underfoot"], ["boyshort_swim", "Boyshort Swimwear", "보이쇼트 수영복", "popular", "f", "a boyshort swimsuit set with a fitted top and short square-cut bottoms"], ["rashguard_set", "Rashguard Set", "래시가드 세트", "popular", "f", "a long-sleeve rashguard with a zip front over matching swim bottoms"], ["wrap_swim", "Wrap-front Swimwear", "랩 프론트 수영복", "popular", "f", "a wrap-front swimsuit with a crossed bodice and a tie at the waist"], ["swim_coverup", "Swimwear + Cover-up", "수영복 + 커버업", "popular", "f", "swimwear worn under an open gauzy cover-up, tied loosely at the hip"], ["poolside_bar", "Poolside Bar", "풀사이드 바", "special", "f", "in swimwear at a poolside bar, a cold drink on the counter"], ["river_dock", "River Dock / Lake Pier", "강가 데크 / 호수 선착장", "special", "f", "in swimwear on a wooden river dock, feet over the edge above the water"], ["burkini_modest", "Modest Full-cover Swimwear", "부르키니 · 전신형", "popular", "f", "a modest full-cover swimsuit with long sleeves, full-length legs, and a fitted hood"], ["sarong_wrap", "Sarong Wrap over Swimwear", "사롱을 두른 수영복", "popular", "f", "swimwear with a printed sarong knotted at the hip"], ["yukata_poolside", "Yukata over Swimwear", "수영복 위 유카타", "popular", "f", "swimwear with a light yukata worn open over it, poolside"], ["heritage_pattern_swim", "Heritage-pattern Swimwear", "전통 문양 수영복", "special", "f", "a swimsuit in a heritage textile pattern with matching trim"], ["onsen_after", "Hot Spring, After Bath", "온천 후", "special", "f", "at an outdoor hot-spring bathing area after a soak, wrapped in a towel, steam and a stone basin around her"], ["hanbok_coverup", "Hanbok-line Cover-up", "한복 선을 딴 커버업", "special", "f", "swimwear under a hanbok-line cover-up with a high waist and wide flowing skirt"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "active": [["", "AUTO", "자동", "basic"], ["warmup", "Warm-up / Cool-down", "워밍업 / 쿨다운", "basic"], ["stretch", "Mobility Stretch Session", "모빌리티 스트레칭", "basic"], ["dance_transition", "Dance Practice Transition", "댄스 연습 중 전환 동작", "popular"], ["pilates", "Pilates / Core Session", "필라테스 / 코어 세션", "popular"], ["tennis_active", "Tennis-inspired Active Fashion", "테니스풍 액티브 패션", "popular"], ["basketball_jersey", "Loose Basketball Jersey Fashion", "루즈 농구저지 패션", "popular"], ["boxing_fitness", "Boxing Fitness Styling", "복싱 피트니스 스타일", "popular"], ["running_recovery", "Post-run Recovery", "러닝 후 리커버리", "popular"], ["parkour_stairs", "Stair / Parkour Transition", "계단 / 파쿠르 전환 동작", "special"], ["roller_skating", "Roller-skating Fashion", "롤러스케이트 패션", "special"], ["fencing_motion", "Fencing-inspired Movement Fashion", "펜싱풍 무브먼트 패션", "special"], ["climbing_warmup", "Climbing Warm-up", "클라이밍 워밍업", "special"], ["surf_prep", "Surf Preparation", "서핑 준비 장면", "special"], ["yoga_flow", "Yoga Flow", "요가 플로우", "popular"], ["cycling_kit", "Cycling Kit", "사이클링 복장", "popular"], ["track_sprint", "Track Sprint Start", "트랙 스타트 자세", "popular"], ["archery_draw", "Archery Draw", "활 당기는 순간", "special"], ["aerial_silk", "Aerial Silk Practice", "에어리얼 실크 연습", "special"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "source_editorial": [["", "AUTO — strongest source motif", "AUTO — 기체 대표 모티프 자동", "basic"], ["couture_gala", "Couture Gala Look", "쿠튀르 갈라 룩", "basic"], ["runway", "Runway Editorial", "런웨이 에디토리얼", "basic"], ["aerodynamic_couture", "Aerodynamic Layered Couture", "공기역학적 레이어드 쿠튀르", "popular"], ["metallic_asymmetry", "Metallic Asymmetric Tailoring", "메탈릭 비대칭 테일러링", "popular"], ["ceremonial_whitegold", "Ceremonial White / Gold Look", "의전풍 화이트 / 골드 룩", "popular"], ["cyber_street", "Cyber Street Editorial", "사이버 스트리트 에디토리얼", "popular"], ["deconstructed_frame", "Deconstructed Frame-line Couture", "프레임 라인 해체형 쿠튀르", "special"], ["floating_panel", "Floating-panel Inspired Couture", "플로팅 패널 영감 쿠튀르", "special"], ["luminous_circuit", "Luminous Circuit Editorial", "루미너스 서킷 에디토리얼", "special"], ["wing_light", "Wing-light / Kinetic Layer Editorial", "윙 라이트 / 키네틱 레이어 에디토리얼", "special"], ["heavy_architecture", "Heavy Architectural Tailoring", "중량감 있는 아키텍처럴 테일러링", "special"], ["stealth_monochrome", "Stealth Monochrome Editorial", "스텔스 모노크롬 에디토리얼", "special"], ["transformation_drape", "Transforming Drape Construction", "변형 구조 드레이프", "special"], ["orbital_ring", "Orbital Ring / Halo Geometry", "궤도 링 / 헤일로 지오메트리", "special"], ["thruster_flare", "Thruster-flare Hemline", "스러스터 플레어 헴라인", "popular", "f"], ["cockpit_harness", "Cockpit Harness Tailoring", "콕핏 하네스 테일러링", "popular"], ["camo_couture", "Camouflage Couture", "카모 쿠튀르", "special"], ["ceramic_plate", "Ceramic Plate Layering", "세라믹 플레이트 레이어링", "special"], ["heritage_couture", "Heritage × Source Couture", "전통 구조 + 기체색 쿠튀르", "popular"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "homewear": [["", "AUTO", "자동", "basic"], ["soft_tank_shorts", "Soft Tank Top + Shorts", "소프트 탱크탑 + 쇼츠", "basic", "f"], ["satin_lounge", "Satin Lounge Set", "새틴 라운지 세트", "basic", "f"], ["offshoulder_knit", "Off-shoulder Knit Homewear", "오프숄더 니트 홈웨어", "popular", "f"], ["camisole_wrap", "Camisole + Wrap Bottom", "캐미솔 + 랩 바텀", "popular", "f"], ["bralette_cardigan", "Bralette + Open Cardigan", "브라렛 + 오픈 가디건", "popular", "f"], ["one_shoulder_lounge", "One-shoulder Lounge Set", "원숄더 라운지 세트", "popular", "f"], ["backless_lounge", "Backless Lounge Look", "백리스 라운지 룩", "special", "f"], ["after_bath", "After-bath Homewear", "목욕 후 홈웨어", "special", "f"], ["window_vanity", "Window-side Vanity Moment", "창가 화장대 순간", "special", "f"], ["late_night_kitchen", "Late-night Kitchen Homewear", "늦은 밤 주방 홈웨어", "special", "f"], ["laundry_lounge", "Laundry / Bedding Lounge Scene", "빨래 / 침구 정리 라운지 장면", "special", "f"], ["sunroom_lounge", "Sunroom Lounge Fashion", "선룸 라운지 패션", "special", "f"], ["oversized_shirt", "Oversized Shirt Homewear", "오버사이즈 셔츠 홈웨어", "popular", "f"], ["hoodie_shorts", "Cropped Hoodie + Shorts", "크롭 후디 + 쇼츠", "popular", "f"], ["knit_dress_home", "Soft Knit Dress", "소프트 니트 원피스", "popular", "f"], ["robe_morning", "Morning Robe", "아침 로브", "popular", "f"], ["floor_cushion", "Floor Cushion Lounging", "바닥 쿠션에서 뒹굴기", "special", "f"], ["home_workout", "Home Stretch Corner", "집 안 스트레칭 코너", "special", "f"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "private_evening": [["", "AUTO", "자동", "basic"], ["slip_dress", "Slip Dress Evening", "슬립 드레스 이브닝", "basic", "f"], ["cocktail_mini", "Cocktail Mini Dress", "칵테일 미니드레스", "basic", "f"], ["one_shoulder_satin", "One-shoulder Satin Evening", "원숄더 새틴 이브닝", "popular", "f"], ["low_back_evening", "Low-back Evening Dress", "로우백 이브닝 드레스", "popular", "f"], ["after_party", "After-party Styling", "애프터파티 스타일링", "popular", "f"], ["hotel_evening", "Hotel Room Evening", "호텔룸 이브닝", "popular", "f"], ["balcony_night", "Night Balcony Mood", "야간 발코니 무드", "popular", "f"], ["mirror_touchup", "Mirror Touch-up", "거울 앞 메이크업 수정", "special", "f"], ["opera_night", "Opera / Theater Night Styling", "오페라 / 극장 나이트 스타일", "special", "f"], ["penthouse_window", "Penthouse Window Mood", "펜트하우스 창가 무드", "special", "f"], ["silk_robe_evening", "Silk Robe over Evening Base", "이브닝 베이스 위 실크 로브", "special", "f"], ["velvet_evening", "Velvet Evening Dress", "벨벳 이브닝 드레스", "popular", "f"], ["halter_evening", "Halter-neck Evening", "홀터넥 이브닝", "popular", "f"], ["high_slit_gown", "High-slit Gown", "하이슬릿 가운", "popular", "f"], ["wine_bar", "Wine Bar Corner", "와인바 구석 자리", "special", "f"], ["night_drive", "Night Drive Passenger Seat", "야간 드라이브 조수석", "special", "f"], ["heritage_evening", "Traditional Formal Evening", "전통 정장 차림의 저녁", "popular", "f"], ["tea_ceremony_night", "Evening Tea Ceremony", "저녁 다례", "special", "f"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "lingerie": [["", "AUTO", "자동", "basic"], ["lace_set", "Lace Lingerie Set", "레이스 란제리 세트", "basic", "f", "a black lace lingerie set with a longline top, high-waisted bottoms, and geometric lace trim"], ["satin_set", "Satin Lingerie Set", "새틴 란제리 세트", "basic", "f", "a satin lingerie set with a smooth bias-cut top and matching bottoms in a single deep colour"], ["bralette_highwaist", "Bralette + High-waist Bottom", "브라렛 + 하이웨이스트 바텀", "popular", "f", "a soft-cup bralette with wide supportive straps and matching high-waisted lingerie bottoms"], ["bustier_inspired", "Bustier-inspired Lingerie", "뷔스티에풍 란제리", "popular", "f", "a bustier-inspired satin lingerie top with a long structured bodice and vertical seam detailing"], ["bodysuit", "Lingerie Bodysuit", "란제리 보디수트", "popular", "f", "a lingerie bodysuit with a scooped neckline, wide shoulder straps, and lace side panels"], ["garter_set", "Garter-inspired Styling", "가터풍 스타일링", "popular", "f", "a lingerie set with decorative garter straps, worn as styling detail"], ["corset_lingerie", "Corset-inspired Lingerie", "코르셋풍 란제리", "popular", "f", "a corset-inspired lingerie bodice with visible boning seams and a matching high-waisted piece"], ["open_shirt_lingerie", "Open Shirt over Lingerie", "란제리 위 오픈 셔츠", "special", "f", "a tailored oversized shirt worn open over a matching satin lingerie set"], ["night_robe", "Night Robe + Lingerie", "나이트 로브 + 란제리", "special", "f", "a lingerie set worn under an open silk night robe with a tied sash"], ["back_strap", "Back-strap Lingerie", "백스트랩 란제리", "special", "f", "a lingerie set with a decorative strap arrangement across the upper back"], ["asymmetric_lingerie", "Asymmetric Lingerie Set", "비대칭 란제리 세트", "special", "f", "an asymmetric lingerie set with one shoulder strap, a diagonal neckline, and matching high-waisted bottoms"], ["slip_lingerie", "Lingerie Slip", "란제리 슬립", "popular", "f", "a bias-cut satin lingerie slip with narrow straps and a straight hem"], ["babydoll", "Babydoll", "베이비돌", "popular", "f", "a babydoll lingerie slip with narrow shoulder straps, an empire waist, and a softly flared hem"], ["longline_bra", "Longline Bra Set", "롱라인 브라 세트", "popular", "f", "a longline bra set with a wide supportive underband and matching high-waisted bottoms"], ["knit_lingerie", "Knit-blend Lingerie", "니트 혼방 란제리", "special", "f", "a knit-blend lingerie set in soft ribbed jersey with a relaxed cropped top"], ["morning_lingerie", "Morning-light Lingerie", "아침 햇살 란제리", "special", "f", "a simple cotton lingerie set in morning window light, sheets and a mug nearby"], ["juban_inspired", "Juban-inspired Silk Layer", "나가주반 응용 실크 레이어", "popular", "f", "a juban-inspired silk underlayer with a wrapped front and a narrow sash"], ["hanbok_slip", "Hanbok Underlayer-inspired Set", "속적삼·속치마 응용 세트", "popular", "f", "a hanbok underlayer-inspired lingerie set with a short wrapped top and a full high-waisted skirt"], ["qipao_silk_set", "Qipao-inspired Silk Set", "치파오 응용 실크 세트", "popular", "f", "a qipao-inspired silk lingerie set with a mandarin collar and frog-button closures"], ["embroidered_corset", "Folk-embroidered Corset", "민속 자수 코르셋", "special", "f", "a folk-embroidered corset with structured boning and colourful thread work over a matching piece"], ["kebaya_lace", "Kebaya-inspired Lace Top", "크바야 응용 레이스 상의", "special", "f", "a kebaya-inspired sheer lace top with fine floral embroidery over a fitted camisole"], ["sari_blouse_set", "Sari Blouse-inspired Set", "사리 블라우스 응용 세트", "special", "f", "a sari blouse-inspired lingerie set with a short fitted top and a draped lower piece"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "everyday_basic": [["", "AUTO", "자동", "basic"], ["commute_train", "Train / Subway Commute", "지하철 / 기차 통근", "basic"], ["grocery_run", "Grocery Run", "장보기", "basic"], ["simple_cooking", "Simple Cooking", "간단한 요리", "basic"], ["cafe_takeout", "Coffee / Takeout Run", "커피 / 테이크아웃", "popular"], ["laundry", "Laundry / Folding Clothes", "세탁 / 빨래 개기", "popular"], ["rain_walk", "Rainy Day Walk", "비 오는 날 걷기", "popular"], ["station_wait", "Waiting at Station", "역에서 기다리기", "popular"], ["bookstore", "Bookstore Browsing", "서점 구경", "popular"], ["parcel_pickup", "Parcel / Convenience-store Pickup", "택배 / 편의점 픽업", "popular"], ["midnight_laundromat", "Midnight Laundromat", "심야 코인세탁방", "special"], ["greenhouse", "Greenhouse / Plant Shop", "온실 / 식물가게", "special"], ["pottery_class", "Pottery / Craft Class", "도예 / 공예 클래스", "special"], ["record_store", "Vinyl Record Store", "레코드숍", "special"], ["hardware_store", "Hardware / Home-improvement Store", "철물 / 홈센터", "special"], ["hanbok_errand", "Modern Traditional Daily Errand", "생활한복 차림의 외출", "popular"], ["festival_daily", "Local Festival Day", "지역 축제날", "special"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "everyday_sensual": [["", "AUTO", "자동", "basic"], ["morning_stretch", "Morning Stretch", "아침 스트레칭", "basic", "", "stretching her shoulders beside a sunlit window just after opening the curtains"], ["window_light", "Window-light Casual Moment", "창가 자연광 캐주얼 순간", "basic", "", "standing in casual clothes in the light of a large window, one hand on the frame"], ["late_snack", "Late-night Snack / Drink", "늦은 밤 간식 / 음료", "popular", "", "eating a late-night snack at the kitchen counter in loungewear"], ["high_shelf", "Reaching to a High Shelf", "높은 선반 손 뻗기", "popular", "", "reaching for a storage box on a high kitchen shelf, shown from an eye-level three-quarter view"], ["hair_tie", "Tying Hair after Shower", "샤워 후 머리 묶기", "popular", "", "tying her hair up after a shower, wearing a soft robe in a bright bathroom"], ["laundry_soft", "Laundry with Soft Fashion Reveal", "소프트 패션 리빌 세탁 장면", "popular", "", "folding laundry at home in soft loungewear, a cardigan slipping loosely off one shoulder"], ["sunroom_relax", "Sunroom Relaxation", "선룸 휴식", "popular", "", "curled on a sunroom sofa in soft knitwear with a blanket and a book"], ["balcony_plants", "Watering Balcony Plants", "발코니 식물 물주기", "popular", "", "watering balcony plants in a fitted knit dress, morning light across the railing"], ["rainy_return", "Returning Home after Rain", "비 맞고 귀가한 순간", "special", "", "coming in from the rain and slipping off a damp raincoat in the entryway, hair slightly wet"], ["floor_organizing", "Floor-level Closet Organizing", "바닥에 앉아 옷장 정리", "special", "", "kneeling on the floor to sort folded clothes into a low drawer"], ["after_work_change", "Changing Outer Layers after Work", "퇴근 후 겉옷 정리", "special", "", "hanging up a work jacket and changing into home wear just after getting in"], ["fridge_light", "Refrigerator-light Late-night Moment", "냉장고 불빛 늦은 밤 순간", "special", "", "standing at the open refrigerator late at night, lit only by its interior light"], ["shoe_bench", "Sitting to Tie Shoes", "신발 신으려 앉은 순간", "popular", "", "sitting on the entryway bench to tie her shoes before going out"], ["mirror_selfie", "Full-length Mirror Check", "전신거울 앞 옷매무새", "popular", "", "checking her outfit in a full-length mirror, phone raised"], ["window_rain", "Watching Rain from Window", "창밖 비 구경", "popular", "", "watching rain run down the window from an armchair, mug in hand"], ["stair_landing", "Stair Landing Pause", "계단 참에서 잠깐 멈춤", "special", "", "pausing on a stair landing with one hand on the railing"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "traditional": [["auto_traditional", "Auto — Match Ethnicity", "계통에 맞춰 자동 선택", "basic"], ["hanbok_formal", "Hanbok — Formal", "한복(한국) · 정장", "popular"], ["hanbok_daily", "Hanbok — Modern Daily", "생활한복(한국) · 일상형", "popular"], ["kimono_formal", "Kimono — Formal", "기모노(일본) · 정장", "popular"], ["yukata_daily", "Yukata — Summer Casual", "유카타(일본) · 여름 일상", "popular"], ["hanfu_formal", "Hanfu — Formal", "한푸(중국) · 정장", "popular"], ["qipao_daily", "Qipao — Modern Daily", "치파오(중국) · 현대형", "popular", "f"], ["aodai_daily", "Áo Dài", "아오자이(베트남)", "popular", "f"], ["sari_formal", "Sari — Formal", "사리(인도) · 정장", "popular", "f"], ["lehenga_formal", "Lehenga", "레헹가(인도)", "special", "f"], ["salwar_daily", "Salwar Kameez — Daily", "살와르 카미즈(인도·파키스탄) · 일상", "special", "f"], ["abaya_modern", "Modern Abaya", "아바야(아라비아반도) · 현대형", "popular", "f"], ["kaftan_daily", "Kaftan — Resort Daily", "카프탄(북아프리카·중동) · 리조트 일상", "special"], ["thobe_inspired", "Thobe-inspired Dress", "토브(아라비아반도) 응용 드레스", "special"], ["dirndl_modern", "Modern Dirndl", "디른들(독일·오스트리아) 현대형", "special", "f"], ["folk_embroidery", "Folk Embroidery Blouse", "자수 블라우스(동유럽)", "special", "f"], ["kente_modern", "Kente-patterned Modern Dress", "켄테(가나) 무늬 현대 드레스", "popular", "f"], ["boubou_flow", "Flowing Boubou", "부부(서아프리카) · 흐르는 실루엣", "special"], ["huipil_modern", "Modern Huipil", "우이필(중미) 현대형", "special", "f"], ["poncho_andes", "Andean Woven Layer", "안데스(페루·볼리비아) 직조 레이어", "special"], ["kilt_inspired", "Kilt-inspired Skirt", "킬트(스코틀랜드) 응용 스커트", "special"], ["kebaya_daily", "Kebaya — Daily", "크바야(인도네시아) · 일상", "special", "f"], ["barong_inspired", "Barong-inspired Sheer Top", "바롱(필리핀) 응용 시스루 상의", "special"], ["caftan_evening", "Traditional Evening Layering", "전통 이브닝 레이어링(지역은 계통에 따름)", "popular"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "wildcard": [["", "AUTO", "자동", "basic"], ["festival_night", "Night Festival Cut", "야간 페스티벌 컷", "basic"], ["rain_editorial", "Rain Editorial", "비 오는 에디토리얼", "popular"], ["arcade_night", "Night Arcade Styling", "야간 아케이드 스타일", "popular"], ["ferry_deck", "Ferry / Ship Deck Fashion", "페리 / 선박 데크 패션", "popular"], ["retro_motel", "Retro Motel Mood", "레트로 모텔 무드", "special"], ["desert_resort", "Desert Resort Fashion", "사막 리조트 패션", "special"], ["futuristic_spa", "Futuristic Spa", "퓨처리스틱 스파", "special"], ["observatory_night", "Night Observatory", "야간 천문대", "special"], ["greenhouse_afterdark", "Greenhouse after Dark", "심야 온실", "special"], ["rooftop_cinema", "Rooftop Cinema", "루프탑 시네마", "special"], ["winter_lodge", "Winter Lodge Fashion", "겨울 로지 패션", "special"], ["art_studio", "After-hours Art Studio", "영업 종료 후 아트 스튜디오", "special"], ["__custom__", "CUSTOM", "직접 입력", "special"]], "__custom__": [["", "AUTO", "자동", "basic"], ["__custom__", "CUSTOM", "직접 입력", "special"]]};

  const GROUP_LABELS = {"basic": "기본 / Standard", "popular": "대중 / Popular", "special": "특수 / Unusual"};

  const EXPRESSION_DETAIL = {
    calm:'relaxed brow, softly open eyes, lips closed and unstrained, no smile',
    focused:'slightly drawn brow, narrowed steady eyes fixed on one point, mouth firmly closed',
    soft_smile:'faint upward pull at the mouth corners, lips together, warmth reaching the lower eyelids',
    half_smile:'one mouth corner lifted higher than the other, lips closed, gaze slightly to the side',
    playful:'asymmetric grin with teeth just showing, one brow raised, eyes narrowed with amusement',
    confident:'level brow, direct unhurried gaze, chin slightly raised, mouth closed and composed',
    sensual:'heavy-lidded eyes, lips slightly parted and relaxed, brow smooth, chin a little lowered',
    provocative:'direct challenging gaze under lowered lids, one brow raised, mouth corner tugged in a slight smirk',
    sleepy:'heavy drooping eyelids, unfocused gaze, softened slack mouth, brow low and relaxed',
    candid:'caught mid-motion, eyes off camera, mouth in an unposed in-between shape',
    mildly_annoyed:'inner brows drawn together, one eye slightly narrowed, mouth pressed flat to one side',
    surprised:'raised brows, widened eyes with visible upper white, mouth open in a small round shape',
    curious:'one brow raised higher, head tilted, eyes wide and attentive, lips slightly parted',
    serious:'level lowered brow, steady unblinking gaze, mouth closed in a straight line, jaw set',
    amused:'crinkled lower eyelids, closed-lip smile pushing the cheeks up, brows relaxed',
    bored:'lidded half-open eyes looking away, slack mouth, brows flat and unengaged',
    pensive:'gaze angled down and away, slightly furrowed brow, lips lightly pressed or touched',
    smug:'one mouth corner lifted, lids lowered in a knowing look, chin tipped slightly up',
    gentle:'softly lowered brows, warm relaxed eyes, faint closed-lip smile, no tension anywhere',
    determined:'brows pulled down and in, hard forward gaze, jaw clenched, mouth a tight line',
    exhausted:'drooping lids and brows, dull unfocused gaze, mouth slightly open and slack, shoulders of the face fallen',
    nostalgic:'soft distant gaze past the camera, faint wistful half-smile, brows gently raised at the inner ends',
    unimpressed:'flat level brows, half-lidded deadpan stare, mouth in a straight unmoved line',
    flustered:'raised inner brows, darting or averted eyes, mouth slightly open, faint blush across the cheeks and nose',
    proud:'chin lifted, brows level, eyes bright and steady, closed-lip smile with a firm mouth',
    wistful:'gaze softened and directed slightly upward or away, faint sad smile, inner brows raised',
    mischievous:'narrowed sparkling eyes, one brow up, closed-lip grin pushed to one side',
    relieved:'brows released upward and outward, eyes half closed, breath-out mouth slightly open, whole face loosened',
    cold_smile:'mouth smiling while the eyes stay flat and unsmiling, brows level, gaze direct and unwarm',
    laughing:'head tipped back slightly, eyes squeezed nearly shut, mouth open wide with teeth showing, cheeks raised high',
    laughing_open:'mouth open wide in a laugh with teeth showing and cheeks raised, but the eyes stay open and engaged \u2014 lids only slightly narrowed, gaze still readable rather than squeezed shut'
  };

  const EXPRESSION_OPTIONS = [
    ['', 'AUTO — 자동'],
    ['calm', 'calm — 차분함'],
    ['focused', 'focused — 집중'],
    ['soft_smile', 'soft smile — 옅은 미소'],
    ['half_smile', 'half-smile — 은은한 미소'],
    ['playful', 'playful — 장난기'],
    ['confident', 'confident — 자신감'],
    ['sensual', 'sensual — 자연스러운 섹시'],
    ['provocative', 'provocative — 도발적이되 비노출'],
    ['sleepy', 'sleepy — 졸린 느낌'],
    ['candid', 'candid — 생활감'],
    ['mildly_annoyed', 'mildly annoyed — 약간 짜증'],
    ['surprised', 'surprised — 놀람'],
    ['curious', 'curious — 호기심'],
    ['serious', 'serious — 진지함'],
    ['amused', 'amused — 재미있어하는'],
    ['bored', 'bored — 심드렁함'],
    ['pensive', 'pensive — 생각에 잠긴'],
    ['smug', 'smug — 우쭐한'],
    ['gentle', 'gentle — 온화함'],
    ['determined', 'determined — 결의에 찬'],
    ['exhausted', 'exhausted — 지친'],
    ['nostalgic', 'nostalgic — 아련한'],
    ['unimpressed', 'unimpressed — 시큰둥함'],
    ['flustered', 'flustered — 당황한'],
    ['proud', 'proud — 자랑스러운'],
    ['wistful', 'wistful — 그리운 듯한'],
    ['mischievous', 'mischievous — 짓궂은'],
    ['relieved', 'relieved — 안도한'],
    ['cold_smile', 'cold smile — 차가운 미소'],
    ['laughing', 'laughing — 소리내어 웃는 · 눈 감김'],
    ['laughing_open', 'laughing, eyes open — 소리내어 웃는 · 눈 뜬 채']
  ];

  const ORIENTATION_OPTIONS = [
    ['', 'AUTO — 자동'],
    ['front', 'front — 정면'],
    ['front_3q', 'front three-quarter — 앞 3/4'],
    ['side', 'side profile — 측면'],
    ['rear_3q', 'rear three-quarter — 뒤 3/4'],
    ['back', 'back view — 뒷태'],
    ['over_shoulder', 'over shoulder — 뒤돌아보기'],
    ['seated_twist', 'seated twist — 앉은 비틀기'],
    ['walking_away', 'walking away — 멀어지는 방향'],
    ['turning_midmotion', 'turning mid-motion — 움직임 중 회전'],
    ['low_angle', 'low angle — 아래에서 올려다본 각도'],
    ['high_angle', 'high angle — 위에서 내려다본 각도'],
    ['leaning_forward', 'leaning forward — 앞으로 기울인 상체'],
    ['leaning_back', 'leaning back — 뒤로 젖힌 상체'],
    ['crouching', 'crouching — 쪼그린 자세'],
    ['reclining', 'reclining — 기대 누운 자세'],
    ['reaching_up', 'reaching up — 위로 손 뻗기'],
    ['looking_down', 'looking down — 시선을 아래로'],
    ['looking_away', 'looking away — 시선을 밖으로'],
    ['back_to_camera', 'back to camera — 완전히 등진 자세'],
    ['profile_close', 'close profile — 측면 근접'],
    ['three_quarter_back', 'three-quarter back — 뒤 3/4 강조']
  ];

  const POSE_OPTIONS = [
    ['', 'AUTO — 자동'],
    ['standing_relaxed', 'standing relaxed — 편하게 선 자세'],
    ['standing_formal', 'standing formal — 반듯하게 선 자세'],
    ['contrapposto', 'contrapposto — 무게를 한쪽에 실은 자세'],
    ['hand_on_hip', 'hand on hip — 허리에 손'],
    ['arms_crossed', 'arms crossed — 팔짱'],
    ['sitting', 'sitting — 앉은 자세'],
    ['sitting_floor', 'sitting on floor — 바닥에 앉음'],
    ['kneeling', 'kneeling — 무릎 꿇은 자세'],
    ['leaning_wall', 'leaning on a wall — 벽에 기댐'],
    ['leaning_furniture', 'leaning on furniture — 가구에 기댐'],
    ['walking', 'walking — 걷는 중'],
    ['mid_stride', 'mid-stride — 걸음 중간'],
    ['stretching', 'stretching — 기지개'],
    ['bending_over', 'bending over — 허리를 숙임'],
    ['on_tiptoe', 'on tiptoe — 발끝을 세움'],
    ['hands_in_hair', 'hands in hair — 머리를 만지는'],
    ['carrying_something', 'carrying something — 무언가를 든 자세'],
    ['mid_action', 'mid-action — 동작 한가운데']
  ];

  const EX_NOTE={"classic_bikini": "상하의가 나뉜 가장 기본적인 비키니.", "sport_onepiece": "경영복에 가까운 스포티한 원피스 수영복.", "highleg_onepiece": "다리 라인이 골반 위까지 파인 원피스.", "monokini": "원피스인데 옆구리나 배 쪽이 크게 뚫린 형태. 조각이 이어져 있어 비키니는 아니다.", "triangle_bikini": "상의 컵이 삼각형이고 목 뒤로 끈을 묶는 형태.", "bandeau_bikini": "어깨끈 없이 가슴을 가로로 감싸는 튜브형 상의.", "halter_bikini": "목 뒤로 끈을 걸어 어깨선을 드러내는 상의.", "asymmetric_swim": "한쪽 어깨만 덮는 비대칭 구조.", "crossstrap_swim": "등이나 가슴 앞에서 끈이 교차하는 구조.", "boyshort_swim": "하의가 짧은 반바지 형태라 엉덩이를 더 덮는다.", "rashguard_set": "긴팔 또는 반팔 상의로 팔까지 덮는 서핑용 세트.", "wrap_swim": "앞자락을 겹쳐 여미는 랩 구조의 수영복.", "swim_coverup": "수영복 위에 얇은 셔츠나 사롱을 걸친 상태.", "lace_set": "레이스 소재의 브라와 하의 세트.", "satin_set": "광택 있는 새틴 소재 세트.", "bralette_highwaist": "와이어 없는 브라렛에 배꼽 위까지 오는 하의를 맞춘 조합.", "bustier_inspired": "가슴부터 허리까지 이어진 상의. 코르셋보다 짧고 조임이 약하다.", "bodysuit": "상하의가 하나로 붙은 원피스형 란제리.", "garter_set": "허벅지에 두르는 밴드로 스타킹을 고정하는 구성.", "corset_lingerie": "허리를 조여 실루엣을 만드는 뻣뻣한 구조물. 뷔스티에보다 길고 단단하다.", "open_shirt_lingerie": "란제리 위에 셔츠를 걸치고 단추를 잠그지 않은 상태.", "night_robe": "란제리 위에 얇은 가운을 덧입은 구성.", "back_strap": "등 쪽 끈 배치가 장식이 되는 디자인.", "asymmetric_lingerie": "좌우 구조가 다른 비대칭 세트.", "slip_lingerie": "어깨끈이 가는 민소매 원피스형. 잠옷과 속옷의 중간.", "babydoll": "가슴 아래부터 퍼지는 짧고 하늘하늘한 형태.", "longline_bra": "브라 밑단이 갈비뼈 아래까지 내려오는 긴 형태.", "soft_tank_shorts": "민소매 상의에 짧은 하의를 맞춘 가장 기본적인 실내복.", "satin_lounge": "광택 있는 상하의 세트. 파자마보다 격이 있다.", "offshoulder_knit": "어깨가 흘러내리는 니트 상의.", "camisole_wrap": "가는 끈 상의에 감아 입는 하의를 맞춘 조합.", "bralette_cardigan": "브라렛 위에 가디건을 걸치고 여미지 않은 상태.", "one_shoulder_lounge": "한쪽 어깨만 덮는 실내복 세트.", "backless_lounge": "등이 크게 트인 실내복.", "oversized_shirt": "몸보다 큰 셔츠 한 장을 원피스처럼 입은 차림.", "hoodie_shorts": "배가 드러나는 짧은 후디에 쇼츠를 맞춘 조합.", "knit_dress_home": "몸에 붙는 부드러운 니트 원피스.", "robe_morning": "아침에 가운만 걸친 상태.", "slip_dress": "어깨끈이 가늘고 몸을 따라 흐르는 원피스.", "cocktail_mini": "무릎 위로 짧은 정장풍 드레스.", "one_shoulder_satin": "한쪽 어깨만 덮는 새틴 드레스.", "low_back_evening": "앞은 단정하고 등이 크게 파인 드레스.", "velvet_evening": "벨벳 특유의 묵직한 광택이 나는 드레스.", "halter_evening": "목 뒤로 끈을 걸어 어깨와 등을 드러내는 드레스.", "high_slit_gown": "긴 드레스에 다리까지 트임이 들어간 형태.", "event_staff": "행사 진행요원풍 의상. 실제 유니폼이 아니라 이벤트용 해석.", "uniform_inspired": "제복의 요소만 빌린 스타일. 특정 기관을 특정할 수 없게 한다.", "bunny": "몸에 붙는 원피스형에 토끼 귀와 커프스를 더한 고전적 코스튬.", "casino_dealer": "조끼·나비넥타이·소매 밴드 같은 딜러 요소를 쓴 스타일.", "lab_roleplay": "가운과 실험 도구를 소품으로 쓰는 연구실 역할극.", "retro_racer": "70~80년대 레이싱 이벤트풍 의상.", "vinyl_stage": "광택 있는 비닐 소재의 무대 의상.", "masquerade": "가면무도회풍. 가면과 장식이 중심.", "circus_ringmaster": "긴 재킷과 실크햇을 쓴 서커스 단장풍.", "aerodynamic_couture": "공기 흐름을 형상화한 겹겹의 재단.", "metallic_asymmetry": "금속 광택 원단으로 좌우를 다르게 재단한 옷.", "ceremonial_whitegold": "흰색과 금색을 쓴 의전복풍.", "deconstructed_frame": "기체 내부 프레임 선을 옷의 절개선으로 옮긴 형태.", "floating_panel": "기체 판넬처럼 몸에서 살짝 떠 있는 조각들.", "luminous_circuit": "회로 형태의 발광 라인이 들어간 옷.", "wing_light": "날개나 바인더를 빛나는 레이어로 번역한 형태.", "heavy_architecture": "건축물처럼 구조가 무겁고 각진 재단.", "stealth_monochrome": "무광 검정 계열 단색으로 통일한 스타일.", "transformation_drape": "변형기구를 접히고 펼쳐지는 드레이프로 옮긴 형태.", "orbital_ring": "기체의 링·헤일로 구조를 장신구나 실루엣으로 옮긴 형태.", "thruster_flare": "스러스터 분사를 밑단이 퍼지는 형태로 번역.", "cockpit_harness": "조종석 하네스를 벨트 장식으로 옮긴 재단.", "pilates": "매트나 기구 위에서 코어를 쓰는 동작.", "basketball_jersey": "몸보다 큰 농구 유니폼을 헐렁하게 입은 차림.", "parkour_stairs": "계단이나 난간을 넘는 순간의 동작.", "aerial_silk": "천에 매달려 자세를 잡는 공중 동작.", "archery_draw": "활시위를 당겨 정지한 순간.","auto_traditional":"계통 설정을 보고 어울리는 전통 의상을 알아서 고른다.","hanbok_formal":"한국 한복. 저고리와 치마의 비율, 고름 매듭, 배래선을 지킨 정장형.","hanbok_daily":"한국 한복의 구조만 남기고 길이와 소재를 현대화한 생활한복.","kimono_formal":"일본 기모노. 오비를 갖춘 정식 형태로, 옷깃 여밈 방향까지 지킨다.","yukata_daily":"일본의 여름용 홑겹 기모노. 축제·저녁 산책에 어울린다.","hanfu_formal":"중국 한푸. 교령·유군 같은 특유의 여밈과 층 구성.","qipao_daily":"중국 치파오(청삼). 입식 칼라와 옆트임을 살린 현대적 형태.","aodai_daily":"긴 상의에 통 넓은 바지를 받쳐 입는 베트남 전통복.","sari_formal":"인도 사리. 한 장의 천을 감아 두르는 방식과 어깨 드레이프가 핵심.","lehenga_formal":"인도 레헹가. 긴 치마 + 짧은 상의 + 두파타 세 겹 구성.","salwar_daily":"인도·파키스탄 지역의 살와르 카미즈. 통 넓은 바지에 긴 튜닉을 걸친 일상 차림.","abaya_modern":"아라비아반도의 아바야. 몸을 감싸는 긴 겉옷을 현대적으로 재단한 형태.","kaftan_daily":"북아프리카·중동 지역의 카프탄. 품이 넉넉하고 소매가 넓은 원피스형 겉옷.","thobe_inspired":"아라비아반도 토브의 직선 재단과 자수를 응용한 드레스.","dirndl_modern":"독일·오스트리아의 디른들. 보디스 + 앞치마 구조를 현대적으로 다듬은 형태.","folk_embroidery":"동유럽 민속 자수를 살린 블라우스.","kente_modern":"가나 켄테 직조 무늬를 현대 드레스에 옮긴 형태.","boubou_flow":"서아프리카의 넓고 길게 흐르는 겉옷.","huipil_modern":"중미의 사각 재단 상의와 자수 문양.","poncho_andes":"안데스 직조 천을 겹쳐 두른 레이어.","kilt_inspired":"스코틀랜드 킬트의 타탄 주름과 여밈 구조를 응용한 스커트.","kebaya_daily":"인도네시아 크바야. 몸에 붙는 자수 상의 + 사롱 조합.","barong_inspired":"비치는 원단에 자수를 넣은 필리핀풍 상의.","caftan_evening":"전통 겉옷을 이브닝 룩으로 겹쳐 입은 구성.","heritage_couture":"전통 의상의 구조·여밈을 기체 색으로 옮긴 쿠튀르.","hanbok_errand":"생활한복 차림으로 장을 보거나 나들이하는 장면.","heritage_evening":"전통 정장을 갖춰 입고 나선 저녁 자리.","burkini_modest":"머리부터 발목까지 덮는 모디스트 수영복. 노출 없이 물놀이 상황을 만든다.","sarong_wrap":"수영복 위에 전통 사롱 천을 허리에 둘러 묶은 차림.","yukata_poolside":"수영복 위에 유카타를 걸친 온천·여름 축제 분위기.","heritage_pattern_swim":"켄테·이카트·자수 같은 전통 문양을 현대 수영복에 옮긴 형태.","onsen_after":"온천에서 나온 직후. 수건과 유카타, 젖은 머리.","hanbok_coverup":"저고리 깃과 고름 선을 응용한 비치 커버업.","juban_inspired":"기모노 속옷인 나가주반의 여밈과 실루엣을 응용한 실크 레이어.","hanbok_slip":"속적삼과 속치마의 층 구성을 현대 란제리로 옮긴 세트.","qipao_silk_set":"입식 칼라와 매듭 단추를 살린 실크 상하 세트.","embroidered_corset":"동유럽 민속 자수를 얹은 코르셋.","kebaya_lace":"크바야 특유의 몸에 붙는 자수 레이스 상의를 응용.","sari_blouse_set":"사리의 짧은 블라우스와 페티코트 구성을 응용한 세트."};

  const CAT_KO={"auto_random": "카테고리를 지정하지 않고 GPT가 알아서 고른다. 무엇이 나올지 예측이 어려운 대신 매번 다른 결과가 나온다.", "adult_roleplay": "직업을 소재로 한 성인 코스튬 패션. 실제 제복이 아니라 이벤트용 의상처럼 보이게 한다. 실제 계급장·무기·전술장비는 나오지 않는다.", "occupation_basic": "현실감 있는 현대 직업 장면. 기체 설정에서 직업을 끌어내고, 작업복·도구·작업장으로 직업이 글 없이 읽히게 한다. 스타일링은 얌전한 편.", "occupation_sensual": "같은 현대 직업이되 실루엣·재단·자세·조명으로 분위기를 끌어올린다. 코스튬이 아니라 실제 직업 해석이라는 점이 성인 역할극과 다르다.", "everyday_basic": "꾸미지 않은 생활 장면. 연출된 화보가 아니라 우연히 찍힌 순간처럼 보이게 한다. 평범한 현대 옷차림.", "everyday_sensual": "같은 생활 장면에 옷의 드레이프·어깨·허리·조명으로 분위기를 얹는다. 상황 자체는 여전히 평범해야 하고 란제리 화보가 되면 안 된다.", "swimwear": "수영복 전용 쌍. 정적인 포즈보다 물가·수영 후·젖은 머리 같은 상황을 우선한다. 노출은 있되 전부 덮는 현대 수영복.", "active": "실제 움직임이 보이는 액티브웨어. 헬스장 스냅 같은 뻔한 컷을 피하고 동작·천의 흐름·실루엣을 강조한다.", "source_editorial": "기체를 인간 패션으로 번역한 에디토리얼. 기체 색·기하학·크레스트를 쿠튀르로 옮긴다. 갑옷이나 파일럿 슈트를 그대로 입히면 안 된다.", "homewear": "집에서 입는 옷이되 디자인된 홈웨어. 밋밋한 잠옷과 소파에 앉은 정적인 포즈를 피하고 생활 동작을 넣는다.", "private_evening": "성인의 사적인 저녁 시간. 우아하고 세련된 이브닝 스타일링과 호텔·발코니·거울 앞 같은 사적인 맥락.", "lingerie": "란제리풍 패션. 중요 부위는 전부 가린 채로 프레이밍·실루엣·자세·조명으로 분위기를 만든다.", "everyday": "일상 라이프스타일 (구버전 통합 카테고리). 지금은 everyday_basic / everyday_sensual 로 나눠 쓰는 걸 권한다.", "wildcard": "다른 쌍이 쓰지 않은 새 카테고리를 GPT가 즉석에서 만들어낸다. 다양성을 크게 올리는 대신 통제력은 가장 낮다.", "__custom__": "카테고리를 직접 문장으로 적는다. 아래 입력란에 원하는 방향을 그대로 쓰면 된다.",
'traditional':'그 캐릭터의 계통에 맞는 전통 의상. 정장형과 현대화된 일상형 중에서 고른다. 고증을 지키되 색은 기체를 따를 수 있다.'};

  const ADV_AXIS={"overall_intensity": "여섯 컷 전체의 관능 강도 기준선.", "pair_gap": "각 쌍에서 앞 컷과 뒤 컷의 강도 차이.", "outfit_variety": "여섯 컷의 의상이 서로 얼마나 달라야 하는지.", "scene_variety": "장소와 상황이 서로 얼마나 달라야 하는지.", "pose_variety": "자세와 몸의 방향이 서로 얼마나 달라야 하는지.", "camera_variety": "카메라 거리와 각도가 얼마나 달라야 하는지.", "skin_exposure": "가슴·골반을 제외한 부위의 노출 정도.", "separates_preference": "상하의가 나뉜 옷을 얼마나 선호할지. 원피스 쏠림을 막는다.", "action_level": "정적인 포즈와 실제 동작의 비율.", "direct_gaze_limit": "카메라를 정면으로 보는 컷을 최대 몇 개까지 둘지.", "smile_limit": "미소 짓는 컷을 최대 몇 개까지 둘지. 표정이 하나로 수렴하는 걸 막는다.", "unexpected_cuts": "예상 밖 발상의 컷을 몇 개 섞을지.", "source_influence": "원기체의 색·형태가 의상에 얼마나 드러날지."};

  const ADV_VAL={"overall_intensity": {"restrained": "절제", "sensual": "자연스럽게 관능적", "bold": "과감", "strong": "가장 강함"}, "pair_gap": {"small": "차이 거의 없음", "medium": "적당한 차이", "strong": "뚜렷한 차이", "extreme": "극단적 대비"}, "outfit_variety": {"normal": "보통", "high": "많이 다르게", "extreme": "전부 다르게"}, "scene_variety": {"normal": "보통", "high": "많이 다르게", "extreme": "전부 다르게"}, "pose_variety": {"normal": "보통", "high": "많이 다르게", "extreme": "전부 다르게"}, "camera_variety": {"normal": "보통", "high": "많이 다르게", "extreme": "전부 다르게"}, "skin_exposure": {"low": "적게", "moderate": "보통", "bold": "많이"}, "separates_preference": {"balanced": "균형", "prefer separates": "분리형 선호", "strongly prefer separates": "분리형 강하게 선호"}, "action_level": {"mostly posed": "대부분 포즈", "balanced": "절반씩", "mostly active": "대부분 동작"}, "direct_gaze_limit": {"0": "없음", "1": "최대 1컷", "2": "최대 2컷"}, "smile_limit": {"0": "없음", "1": "최대 1컷", "2": "최대 2컷"}, "unexpected_cuts": {"1": "1컷", "2": "2컷", "3": "3컷"}, "source_influence": {"subtle": "은은하게", "balanced": "적당히", "strong": "강하게"}};

  const RANDOM_MODES={
    stable:{ko:'안정형',desc:'실패가 적은 무난한 조합',
      pool:['adult_roleplay','occupation_basic','everyday_basic','homewear','swimwear','private_evening'],
      adv:{overall_intensity:'sensual',pair_gap:'small',outfit_variety:'normal',scene_variety:'normal',pose_variety:'normal'}},
    variety:{ko:'다양성형',desc:'여섯 컷이 서로 최대한 다르게',descOne:'카테고리 전체에서 고르게',
      pool:null,
      adv:{overall_intensity:'sensual',pair_gap:'medium',outfit_variety:'extreme',scene_variety:'extreme',
           pose_variety:'extreme',camera_variety:'extreme',unexpected_cuts:'2'}},
    bold:{ko:'과감형',desc:'강도와 노출을 한 단계 올림',
      pool:['lingerie','private_evening','swimwear','adult_roleplay','occupation_sensual','everyday_sensual'],
      adv:{overall_intensity:'bold',pair_gap:'strong',skin_exposure:'bold',outfit_variety:'high',smile_limit:'1'}},
    experimental:{ko:'실험형',desc:'예상 밖 조합 위주. 통제력은 가장 낮음',
      pool:['wildcard','source_editorial','auto_random','active','occupation_sensual'],
      adv:{overall_intensity:'bold',pair_gap:'extreme',scene_variety:'extreme',camera_variety:'extreme',
           unexpected_cuts:'3',direct_gaze_limit:'1'}},
    source:{ko:'기체친화형',desc:'추천 근거를 그대로 세 Pair 에 적용',
      pool:null,useRec:true,
      adv:{overall_intensity:'sensual',source_influence:'strong',outfit_variety:'high',scene_variety:'high'}},
    life:{ko:'생활형',desc:'직업과 일상 비중을 높임',
      pool:['occupation_basic','occupation_sensual','everyday_basic','everyday_sensual','homewear','active'],
      adv:{overall_intensity:'restrained',pair_gap:'medium',action_level:'balanced',scene_variety:'high'}},
    fashion:{ko:'패션형',desc:'의상과 스타일 중심',
      pool:['source_editorial','adult_roleplay','lingerie','private_evening','homewear'],
      adv:{overall_intensity:'sensual',outfit_variety:'extreme',separates_preference:'prefer separates',
           source_influence:'balanced'}}
  };

  const NAME_RULES=[
    [/스타게이저/,[['occupation_basic','observatory_engineer'],['occupation_sensual','night_observatory'],['occupation_basic','aviation_control'],['occupation_sensual','drone_director']],
      [['source_editorial','orbital_ring'],['source_editorial','luminous_circuit'],['source_editorial','wing_light']],
      [['swimwear','moonlit_pool'],['wildcard','observatory_night'],['private_evening','balcony_night']],'천문 관측기'],
    [/어스트레이/,[['occupation_basic','mobility_tuner'],['occupation_sensual','prototype_consultant'],['occupation_basic','test_engineer'],['occupation_sensual','fashion_test_engineer']],
      [['source_editorial','deconstructed_frame'],['source_editorial','metallic_asymmetry'],['source_editorial','cyber_street']],
      [['active','dance_transition'],['everyday_basic','hardware_store'],['wildcard','arcade_night']],'정비·개조 기체'],
    [/데스사이즈|블리츠/,[['occupation_basic','field_surveyor'],['occupation_basic','drone_operator'],['occupation_sensual','night_lab'],['occupation_sensual','hightech_inspector']],
      [['source_editorial','stealth_monochrome'],['source_editorial','deconstructed_frame'],['source_editorial','cyber_street']],
      [['private_evening','after_party'],['everyday_sensual','fridge_light'],['wildcard','neon_alley']],'은신 기체'],
    [/헤비암즈|버스터|캘러미티|도벤 울프|ZZ/,[['occupation_basic','industrial_inspector'],['occupation_basic','architecture_engineer'],['occupation_basic','stage_rigging'],['occupation_basic','renewable_engineer']],
      [['source_editorial','heavy_architecture'],['source_editorial','ceramic_plate'],['source_editorial','metallic_asymmetry']],
      [['homewear','late_night_kitchen'],['everyday_basic','hardware_store'],['active','boxing_fitness']],'중화력 포격기'],
    [/즈고크|하이곡그|어비스|아그이|갓즈고크/,[['occupation_basic','marine_technician'],['occupation_sensual','luxury_yacht_tech'],['occupation_basic','rescue_paramedic'],['occupation_basic','field_surveyor']],
      [['source_editorial','transformation_drape'],['source_editorial','aerodynamic_couture'],['source_editorial','floating_panel']],
      [['swimwear','shoreline_walk'],['swimwear','outdoor_shower'],['wildcard','ferry_deck']],'수중 운용기'],
    [/V2|V건담/,[['occupation_basic','aviation_control'],['occupation_sensual','flight_supervisor'],['occupation_sensual','drone_director'],['occupation_basic','test_engineer']],
      [['source_editorial','wing_light'],['source_editorial','aerodynamic_couture'],['source_editorial','thruster_flare']],
      [['active','parkour_stairs'],['active','roller_skating'],['everyday_sensual','morning_stretch']],'고기동 소형기'],
    [/나드레|버체|세라비|엑시아|듀나메스|캘딤/,[['occupation_basic','robotics_researcher'],['occupation_basic','test_engineer'],['occupation_sensual','night_lab'],['occupation_sensual','drone_director']],
      [['source_editorial','luminous_circuit'],['source_editorial','orbital_ring'],['source_editorial','floating_panel']],
      [['everyday_sensual','morning_stretch'],['homewear','sunroom_lounge'],['private_evening','hotel_evening']],'GN 드라이브 계열'],
    [/윙|톨기스/,[['occupation_basic','test_engineer'],['occupation_basic','aviation_control'],['occupation_sensual','flight_supervisor'],['occupation_sensual','prototype_consultant']],
      [['source_editorial','aerodynamic_couture'],['source_editorial','wing_light'],['source_editorial','ceremonial_whitegold']],
      [['active','surf_prep'],['active','climbing_warmup'],['wildcard','rooftop_cinema']],'변형 비행 기체'],
    [/자쿠|겔구그|돔|구프|캠퍼|리크|리젤|기라/,[['occupation_basic','mobility_tuner'],['occupation_basic','industrial_inspector'],['occupation_basic','rescue_paramedic'],['occupation_basic','field_surveyor']],
      [['source_editorial','camo_couture'],['source_editorial','heavy_architecture'],['source_editorial','stealth_monochrome']],
      [['everyday_basic','hardware_store'],['everyday_basic','midnight_laundromat'],['homewear','laundry_lounge']],'양산 주력기'],
    [/사이코|퀴베레이|엘메스|지옹|나이팅게일|알파 아질/,[['occupation_basic','robotics_researcher'],['occupation_sensual','drone_director'],['occupation_sensual','night_lab'],['occupation_sensual','hightech_inspector']],
      [['source_editorial','floating_panel'],['source_editorial','luminous_circuit'],['source_editorial','orbital_ring']],
      [['private_evening','penthouse_window'],['private_evening','opera_night'],['wildcard','futuristic_spa']],'사이코뮤 탑재기'],
    [/짐|건캐논|건탱크/,[['occupation_basic','industrial_inspector'],['occupation_basic','architecture_engineer'],['occupation_basic','mobility_tuner'],['occupation_basic','rescue_paramedic']],
      [['source_editorial','ceramic_plate'],['source_editorial','heavy_architecture'],['source_editorial','camo_couture']],
      [['everyday_basic','commute_train'],['everyday_basic','grocery_run'],['homewear','soft_tank_shorts']],'연방 양산기'],
    [/큐베레이|파라스|바우|기라 도가|야크트/,[['occupation_basic','satellite_operator'],['occupation_sensual','night_dispatch'],['occupation_basic','forensic_engineer']],
      [['source_editorial','metallic_asymmetry'],['source_editorial','luminous_circuit'],['source_editorial','cockpit_harness']],
      [['private_evening','hotel_evening'],['everyday_sensual','after_work_change'],['homewear','satin_lounge']],'네오지온 계열'],
    [/구프|돔 트로펜|자쿠 캐논|자쿠 III|드라체/,[['occupation_basic','welding_fabricator'],['occupation_basic','crane_operator'],['occupation_basic','demolition_planner']],
      [['source_editorial','camo_couture'],['source_editorial','heavy_architecture'],['source_editorial','ceramic_plate']],
      [['everyday_basic','hardware_store'],['everyday_basic','pottery_class'],['active','boxing_fitness']],'지상 전투기'],
    [/톨기스|바이아란|메타스|리가지|델타/,[['occupation_basic','avionics_tech'],['occupation_basic','simulator_instructor'],['occupation_sensual','helicopter_pilot']],
      [['source_editorial','aerodynamic_couture'],['source_editorial','transformation_drape'],['source_editorial','wing_light']],
      [['active','warmup'],['active','track_sprint'],['everyday_basic','station_wait']],'가변 · 시험기'],
    [/즈고크|아그이|갓즈고크|즈곡|카프|어비스|고그/,[['occupation_basic','sonar_analyst'],['occupation_sensual','deep_dive_specialist'],['occupation_sensual','yacht_captain']],
      [['source_editorial','transformation_drape'],['source_editorial','floating_panel'],['source_editorial','ceramic_plate']],
      [['swimwear','thermal_spa'],['swimwear','river_dock'],['wildcard','futuristic_spa']],'수중 운용기'],
    [/AGE|가프란|제단|베이건/,[['occupation_basic','materials_lab'],['occupation_basic','forensic_engineer'],['occupation_sensual','test_pilot_brief']],
      [['source_editorial','deconstructed_frame'],['source_editorial','luminous_circuit'],['source_editorial','thruster_flare']],
      [['everyday_basic','bookstore'],['everyday_basic','greenhouse'],['homewear','sunroom_lounge']],'AGE 계열'],
    [/발바토스|키마리스|그레이즈|플라우로스|바엘|바알|구시온/,[['occupation_basic','welding_fabricator'],['occupation_sensual','armory_curator'],['occupation_sensual','motorsport_engineer']],
      [['source_editorial','cockpit_harness'],['source_editorial','heavy_architecture'],['source_editorial','deconstructed_frame']],
      [['active','boxing_fitness'],['everyday_basic','hardware_store'],['wildcard','retro_motel']],'철혈 계열'],
    [/스트라이크|이지스|듀얼|버스터|프리덤|저스티스|임펄스|디스티니/,[['occupation_basic','satellite_operator'],['occupation_basic','simulator_instructor'],['occupation_sensual','broadcast_director']],
      [['source_editorial','ceremonial_whitegold'],['source_editorial','wing_light'],['source_editorial','metallic_asymmetry']],
      [['swimwear','cabana_daybed'],['private_evening','balcony_night'],['active','surf_prep']],'SEED 계열'],
    [/유니콘|밴시|페넥스|시난주|크샤트리야|네오 지옹/,[['occupation_basic','archive_restorer'],['occupation_sensual','auction_specialist'],['occupation_sensual','gallery_curator']],
      [['source_editorial','ceremonial_whitegold'],['source_editorial','luminous_circuit'],['source_editorial','orbital_ring']],
      [['private_evening','opera_night'],['private_evening','velvet_evening'],['homewear','window_vanity']],'UC 후기 계열'],
    [/F91|비기나|헤비건|건담 F/,[['occupation_basic','materials_lab'],['occupation_basic','hv_battery_tech'],['occupation_sensual','perfume_developer']],
      [['source_editorial','deconstructed_frame'],['source_editorial','aerodynamic_couture'],['source_editorial','thruster_flare']],
      [['everyday_basic','cafe_takeout'],['homewear','knit_dress_home'],['everyday_sensual','window_light']],'F91 계열'],
    [/터언|턴에이|∀|나노/,[['occupation_basic','archive_restorer'],['occupation_basic','water_plant'],['occupation_basic','agri_drone']],
      [['source_editorial','ceremonial_whitegold'],['source_editorial','floating_panel'],['source_editorial','camo_couture']],
      [['everyday_basic','greenhouse'],['everyday_basic','pottery_class'],['homewear','laundry_lounge']],'∀ 계열']
  ];

  const ART_STYLES=[
    [
      'cinematic_semi_real',
      '세미리얼 시네마틱',
      '회화적 세미리얼 + 자연스러운 영화 조명. 얼굴과 메카 모두 같은 페인터리 렌더링 언어를 사용하며 CGI·가챠 키아트 쪽으로 튀는 것을 억제한다.',
      [
        'high-end painterly semi-realistic character illustration with naturalistic cinematic lighting and restrained anime-informed facial idealization.',
        'The final image must read first as a sophisticated semi-realistic digital painting, not as an anime illustration, mobile-game key art, 3D character render, or live-action photograph.',

        'FACE: preserve mature adult facial anatomy, believable skull structure, and convincing three-dimensional facial volume.',
        'Anime influence is restrained and limited to subtle idealization: slightly more expressive eyes, refined eye shape, a delicate but anatomically plausible nose, softly shaped lips, and a graceful jaw.',
        'Eye size remains close to believable adult human proportion.',
        'Facial structure specified in PARAMETERS remains authoritative and must not be replaced by a recurring anime beauty template.',
        'Build facial features through painted light, value transitions, and soft form rather than crisp graphic linework.',
        'Eyelids, lash lines, irises, lips, cheeks, nose, and jaw all belong to the same painted surface language.',
        'Avoid graphic eyelashes, oversized irises, simplified triangular noses, tiny doll-like mouths, extreme V-shaped jaws, and separately drawn anime eyes sitting on top of realistic skin.',

        'SKIN: softly painted dimensionality, subtle subsurface warmth, restrained natural texture, and smooth but non-plastic transitions.',
        'Do not render photographic pore noise, but retain believable facial planes and natural variation.',
        'Highlights on skin are painted light rather than glossy CG reflections.',

        'HAIR: construct hair from painterly grouped masses with selected fine strands and flyaways.',
        'Use natural highlight grouping rather than uniformly sharp strand-by-strand photographic rendering.',

        'ARMOR, CLOTHING, AND MECHANICAL SURFACES: preserve convincing material identity and clear mechanical structure, but render metal, composite, fabric, glass, and painted armor through the same painterly visual language as the face.',
        'Reflections and specular highlights are selectively simplified and painted rather than physically perfect PBR reflections.',
        'MECHANICAL PAINTERLY LOCK: mechanical armor may be highly detailed and precisely constructed, but high detail must not change the rendering language into CGI or PBR. Panel geometry, weapons, backpack structures, joints, and hard-surface forms may remain crisp and mechanically legible, while their lighting and material response must still read as painted illustration. Do not use uniform PBR roughness, ray-traced-looking reflections, perfectly smooth metallic gradients, or the polished surface language of a rendered 3D game asset. Mechanical complexity controls WHAT is depicted, not HOW realistically it is rendered.',

        'Selected mechanical focal edges may be somewhat sharper than skin, but the overall armor surface must retain the same painterly edge hierarchy and optical softness as the rest of the illustration; it must never look like a separate 3D render composited onto a painted character.',

        'Even highly polished armor uses painted interpretations of reflection rather than physically exact reflections \u2014 specular highlights may be strong where appropriate, but stay selective, broken, and compositionally designed rather than continuous ray-traced surface response.',

        'LIGHTING: broad cinematic key light, natural reflected bounce, restrained rim illumination, atmospheric shadow colour, realistic falloff, and subtle bloom.',
        'The subject and environment share one coherent lighting system.',

        'EDGE AND DETAIL HIERARCHY: use selective sharpness.',
        'Important mechanical edges, hardware, and a few illuminated hair strands may be crisp while skin, secondary forms, and distant elements remain softer.',
        'Avoid uniformly razor-sharp rendering.',

        'Avoid cel shading, graphic anime linework, airbrushed gacha-game skin, glossy plastic skin, generic Unreal or Octane style CGI, physically perfect PBR reflections, and excessively clean mobile-game character rendering.'
      ].join(' ')
    ],

    [
      'game_keyart',
      '게임 키아트 2.5D',
      '애니 얼굴 + 입체 볼륨감. 평면 애니와 풀 3D CGI 사이 중간지점을 목표로 하는 2.5D 모바일게임 키아트.',
      [
        'premium 2.5D mobile-game character illustration with strongly volumetric painted rendering.',
        'The final image must read as high-end illustrated game key art occupying the visual middle ground between flat anime drawing and full 3D CGI.',
        'Forms are built primarily through smooth gradients, soft ambient occlusion, controlled specular highlights, dimensional light, and carefully modelled volume rather than graphic outlines or flat cel shading.',

        'FACE: use clearly anime-informed facial construction combined with strong soft three-dimensional modelling.',
        'The face must retain visible volumetric form in the forehead, eyelids, eye sockets, nose bridge, cheeks, lips, jaw, and chin, built through smooth painted gradients rather than flat cel shapes or graphic linework.',
        'Eyes may be large and expressive, but they must sit naturally inside a softly modelled three-dimensional face rather than appearing as flat anime eye artwork placed over the skin.',
        'Use restrained eyelid and lash definition, a softly simplified nose, and clean lips, while preserving the face shape, ethnicity, maturity, and individual identity defined in PARAMETERS.',
        'The face should carry less micro-detail than the clothing and mechanical equipment, but it must not become flat.',

        'SKIN: smooth high-end 2.5D game-illustration skin with long airbrushed gradients, soft subsurface-like warmth, rounded form shading, gentle ambient occlusion, and controlled glossy highlights.',
        'Skin must feel volumetric and luminous, not flat, cel-shaded, photographic, or plastic.',
        'Do not use photographic pores, realistic skin grain, or raw 3D shader noise.',

        'HAIR: construct hair from layered grouped locks with clearly modelled volume, broad glossy highlight bands, soft internal shadowing, and a limited number of separated strands and flyaways.',
        'Hair must feel more dimensional than flat anime hair, but remain illustrated rather than photographically strand-rendered.',

        'CLOTHING, ARMOR, AND MECHANICAL SURFACES: use clean but volumetric hard-surface rendering with clear panel separation, rounded light falloff, stylized reflections, ambient occlusion, and controlled glossy highlights.',
        'Edges may be crisp where necessary, but mechanical form must be described primarily through three-dimensional light and material response rather than heavy outlines, flat graphic panel colouring, or simple cel blocks.',
        'Preserve source-specific armor geometry and equipment structure without turning the surfaces into fully realistic PBR assets.',
        'Metal, composite, fabric, glass, painted armor, and other materials should be visibly distinct, but their reflections and specular behaviour remain stylized and art-directed.',

        'REFERENCE FIDELITY: preserve the geometry and equipment established by the source reference or PARAMETERS and render them through this style rather than replacing them; do not copy the reference image\'s own rendering language \u2014 its cel-animation, photographic, or CGI look \u2014 into the final image.',
        'Do not simplify the source mobile suit into generic mobile-game heroine armor \u2014 this style may beautify and polish the rendering, but it must not replace source-specific mechanical geometry with generic fantasy-mecha costume design.',

        'LIGHTING: use bright, controlled dimensional key light, soft fill and bounce, decisive rim separation, selective coloured accent light, and believable but stylized light falloff.',
        'Lighting must create clear three-dimensional form across face, skin, hair, clothing, and mechanical parts.',

        'BACKGROUND: use strong subject isolation with simplified atmospheric space, glow, bokeh, soft environmental shapes, or reduced background detail.',
        'The background may suggest depth and real spatial lighting but must remain subordinate to the character.',

        'RENDERING BALANCE: the result should feel more volumetric than conventional 2D anime illustration but more illustrated and stylized than a fully rendered 3D game character.',
        'Use polished 2.5D modelling and shading without crossing into photorealism.',

        'Avoid flat anime rendering, cel-shaded skin, purely 2D character-sheet rendering, visible comic-style outlines, flat graphic facial construction, uniformly hard-edged shadows, heavy line-art dependence, simple television-anime shading, photographic skin texture, fully photorealistic CGI, raw Unreal or Octane rendering, hyper-real PBR material noise, plastic 3D skin, perfect ray-traced reflections, and generic game-engine asset presentation.'
      ].join(' ')
    ],

    [
      'glossy_kr_game',
      '한국형 글로시 게임 일러스트',
      '강한 광택·채색 림라이트·보석 같은 색감의 고급 한국형 모바일게임 일러스트. 체형과 복식 구조는 PARAMETERS와 원기체를 따르며 화풍이 임의로 바꾸지 않는다.',
      [
        'high-gloss stylised character illustration in the visual language of premium Korean mobile-game key art.',
        'The rendering is strongly stylised, glamorous, saturated, and highly polished, but the character design, body proportions, armor silhouette, and costume structure remain controlled by PARAMETERS and the source mobile suit.',

        'FACE: strongly stylised but clearly adult anime-informed facial rendering.',
        'Use elegant eye shapes, deliberate lash definition, a refined small nose, softly glossy lips, and polished beauty rendering.',
        'The exact eye geometry, face shape, ethnicity, maturity, and facial character must still follow PARAMETERS rather than collapsing into one recurring glamour face.',

        'SKIN: exceptionally smooth airbrushed gradients with bright designed specular highlights and deep saturated shadow colour.',
        'Skin appears polished and luminous rather than photographic.',

        'HAIR: glossy grouped locks with strong highlight ribbons, saturated colour separation, and selected sharp strands.',
        'Hair should feel illustrated and lacquered rather than photographically rendered.',

        'ARMOR, CLOTHING, AND MECHANICAL SURFACES: thick glossy rendering with strong stylized specular highlights, saturated colour, crisp edge accents, and luxurious material separation.',
        'Metal, painted armor, latex-like surfaces, fabric, and glass may each reflect light differently, but all remain part of the same highly stylised illustration.',
        'Do not convert source-specific mechanical design into generic fantasy costume.',

        'DECORATIVE DETAIL: straps, trim, fittings, chains, ribbons, jewellery, or ornamental accents may appear only where the canonical design or explicit PARAMETERS support them.',
        'Do not add generic baroque decoration merely because of the selected art style.',

        'LIGHTING: theatrical key light, strong coloured rim light, deep jewel-toned shadows, controlled bloom, and dramatic contrast.',
        'BACKGROUND: simplified atmospheric glow, bokeh, gradients, or broad decorative light shapes.',

        'Avoid photographic realism, muted colour, flat cel shading, low-gloss rendering, plain unrendered surfaces, unrelated fantasy ornament, and generic baroque redesign of the source mobile suit.'
      ].join(' ')
    ],

    [
      'game_cgi',
      '게임 시네마틱 CGI',
      '고급 게임 컷신형 스타일라이즈드 3D. 피부 SSS와 PBR 메카 재질을 쓰되 실사 인간이나 2D 그림으로 가지 않는다.',
      [
        'high-end stylized 3D character render in the visual language of a premium game cinematic.',
        'The final image must unmistakably read as sophisticated CGI rather than live-action photography, 2D anime illustration, painterly concept art, or mobile-game 2.5D key art.',

        'FACE: preserve clearly adult anatomy and the facial structure defined by PARAMETERS while allowing tasteful game-character idealization.',
        'Use believable three-dimensional eyelids, nose, lips, cheeks, jaw, and eye sockets rather than flat anime line construction.',
        'Eyes may be slightly idealized but remain physically integrated into the modeled face.',

        'SKIN: smooth high-end digital skin shading with controlled subsurface scattering, fine but restrained surface variation, realistic roughness transitions, and carefully shaped specular response.',
        'Avoid waxy skin, porcelain plastic skin, excessive pore detail, and live-action photographic imperfection.',

        'HAIR: modeled strand groups and layered hair cards or groom-like masses with physically coherent highlights.',
        'Avoid flat painted hair bands and avoid hyper-photographic individual-strand noise.',

        'ARMOR AND MECHANICAL SURFACES: clean premium PBR-style material separation with convincing painted metal, exposed metal, composite, rubber, glass, and emissive sensors.',
        'Use controlled reflections, roughness variation, subtle edge wear, and clear mechanical segmentation.',
        'Materials should feel intentionally art-directed rather than like a raw photoreal asset render.',

        'LIGHTING: cinematic studio-quality key, fill, bounce, rim, volumetric separation, controlled bloom, and believable reflected light.',
        'Use physically coherent three-dimensional lighting throughout the character.',

        'Avoid painterly brushwork, flat anime shading, cel outlines, photographic live-action skin, crude plastic surfaces, excessive ray-traced mirror reflections, and generic unlit character-viewer presentation.'
      ].join(' ')
    ],

    [
      'semi_real_paint',
      '세미리얼 유화',
      '붓결이 더 뚜렷한 디지털 유화형 반실사. 세미리얼 시네마틱보다 광학적 영화 느낌은 줄이고 실제 회화 표면감을 더 강하게 남긴다.',
      [
        'semi-realistic digital oil painting with visibly painted surfaces, grounded adult anatomy, and resolved character design.',
        'The image must read as a finished digital painting rather than a photograph, CGI render, anime key visual, or loose unfinished concept sketch.',

        'FACE AND SKIN: realistic adult facial structure with softly idealized beauty, painted through layered colour, subtle brush texture, and believable value transitions.',
        'Retain visible but controlled painterly texture across cheeks, lips, eyelids, neck, and exposed skin.',
        'Do not use photographic pore detail or perfectly airbrushed game skin.',

        'HAIR: painted in coherent masses with visible brush grouping and selected strands.',
        'Highlights should feel brushed into the hair rather than physically ray-traced.',

        'ARMOR, FABRIC, AND MECHANICAL PARTS: preserve convincing material differences and rich surface detail while allowing visible brush texture across painted metal, composite, fabric, and worn surfaces.',
        'Specular highlights and reflections are interpreted through painting and need not be physically perfect.',

        'EDGE HANDLING: most important forms remain resolved and readable, while selected secondary edges may soften into surrounding values.',
        'Do not leave major anatomy or signature mechanical structures vague or unfinished.',

        'LIGHTING: grounded directional illumination with believable volume and colour bounce, interpreted through painterly value and colour rather than photographic optics.',

        'Avoid loose unresolved concept-art brushwork, perfectly clean CGI material rendering, glossy mobile-game airbrushing, flat cel shading, and fully photographic skin.'
      ].join(' ')
    ],

    [
      'photoreal',
      '사진풍',
      '실제 촬영된 성인 인물과 실제 제작된 메카 장비처럼 보이는 사진풍. CGI 렌더가 아니라 카메라로 찍은 결과를 목표로 한다.',
      [
        'high-end photorealistic live-action character photography with believable practical and mechanical materials.',
        'The final image must read as a real photograph captured by a camera, not as digital painting, anime illustration, mobile-game key art, or visible CGI character rendering.',

        'FACE AND SKIN: realistic adult human facial anatomy, natural skin texture, subtle pores, fine tonal variation, believable lips, eyelids, lashes, and eyes.',
        'Beauty styling may be polished and editorial, but do not reshape the face into anime proportions or plastic game-character anatomy.',

        'HAIR: naturally photographed hair with believable strand grouping, flyaways, translucency, and real light interaction.',

        'ARMOR AND MECHANICAL SURFACES: appear as physically fabricated real-world materials with believable scale, seams, joints, painted surfaces, metal, composite, rubber, glass, and practical wear.',
        'Reflections follow the photographed environment rather than stylized illustrated highlight shapes.',

        'LIGHTING: real photographic key, fill, bounce, rim, practical reflections, natural falloff, and physically believable exposure.',
        'Use realistic camera depth of field and lens behaviour only where compositionally appropriate.',

        'Avoid painterly brush texture, anime eye construction, cel shading, game-render skin, Unreal-style CGI appearance, artificial plastic gloss, excessive cinematic bloom, and impossible illustrated reflections.'
      ].join(' ')
    ],

    [
      'anime_illust',
      '애니 일러스트',
      '현대 애니 일러스트. 깨끗한 선, 명확한 애니 얼굴, 2~3단 명암과 부드러운 보조 그라데이션. 실사·CG와 확실히 분리.',
      [
        'polished modern anime character illustration with clean confident linework, clearly anime facial construction, and controlled two-to-three-step shading supported by soft gradients.',
        'The image must read unmistakably as a finished 2D anime illustration rather than photography, 3D CGI, painterly concept art, or glossy 2.5D game rendering.',

        'FACE: clearly anime, with expressive eyes, simplified but elegant nose and mouth construction, clean eyelid definition, and adult facial proportions appropriate to PARAMETERS.',
        'Preserve individual face shape, ethnicity, maturity, and facial character rather than reusing one generic anime face.',

        'SKIN: smooth illustrated colour with clean shadow shapes and restrained soft gradients.',
        'No photographic pores, realistic skin noise, or wet CG-style specular response.',

        'HAIR: defined graphic locks with clean directional flow, selective internal strand lines, and stylized highlight shapes.',

        'ARMOR, COSTUME, AND MECHANICAL PARTS: retain crisp source-specific geometry, clean outlines, controlled cel-like shading, and simplified illustrated highlights.',
        'Mechanical surfaces must remain part of the same 2D drawing and must not become photoreal PBR objects.',

        'LIGHTING: illustrated key and rim lighting expressed through designed colour shapes and gradients rather than physically perfect reflections.',

        'Avoid photographic skin, camera grain, realistic lens blur, 3D-render materials, loose brushwork, thick glossy mobile-game rendering, and completely flat low-detail television animation.'
      ].join(' ')
    ],

    [
      'cel_anime',
      '셀화 애니',
      '굵고 명확한 외곽선 + 단순한 1~2단 셀 명암. 그라데이션과 재질 반사를 최소화한 정통 셀 애니 방식.',
      [
        'flat cel-shaded anime character illustration with bold clean outlines, hard-edged shadow shapes, minimal gradients, and strong poster-like colour blocking.',
        'The entire image must use a consistent cel-animation rendering language.',

        'FACE: clearly adult anime facial construction with simplified eyes, nose, mouth, and clean graphic shapes.',
        'Follow the facial geometry and character identity defined in PARAMETERS without realistic skin rendering.',

        'SKIN: flat local colour with one primary shadow tone and only minimal highlight accents.',
        'No pores, subsurface scattering, glossy airbrushing, or photographic tonal modelling.',

        'HAIR: clean graphic masses separated into major locks with simple highlight shapes and hard colour boundaries.',

        'ARMOR AND MECHANICAL PARTS: preserve canonical geometry through bold outlines, hard shadow blocks, simplified metal colour separation, and minimal reflected-light detail.',
        'Do not introduce realistic PBR reflections or painterly texture.',

        'LIGHTING: communicate form through deliberate cel-shadow shapes and limited rim-colour bands rather than realistic cinematic falloff.',

        'Avoid soft painterly modelling, airbrushed game skin, realistic material reflections, photographic lighting, CGI shading, excessive gradients, and dense micro-detail.'
      ].join(' ')
    ],

    [
      'painterly',
      '회화적 컨셉아트',
      '큰 붓질과 명암 구성이 우선하는 컨셉아트. 주요 실루엣과 기체 식별 요소는 읽히게 남기고 작은 표면 묘사는 과감히 생략.',
      [
        'loose painterly concept-art illustration built from broad visible brushwork, strong value composition, atmospheric colour masses, and selectively unresolved edges.',
        'The image should feel like confident high-level production concept art rather than a polished game render, anime key visual, photograph, or detailed digital oil portrait.',

        'FACE AND FIGURE: maintain readable adult anatomy, expression, and identity, but describe secondary facial detail economically through brush shape and value rather than precise linework.',

        'HAIR, SKIN, FABRIC, AND ARMOR: all materials are interpreted through broad painted masses and selective texture.',
        'Do not individually render every pore, strand, panel scratch, screw, or micro-reflection.',

        'MECHANICAL IDENTITY: where mobile-suit armor, weapons, or mechanical equipment are part of the scene, the major armor silhouette, crest, weapon shape, backpack, binders, shields, and signature source structures remain clearly recognizable even when small surface detail is simplified; this does not require adding such equipment to scenes that do not call for it.',
        'Important silhouette-defining mechanical edges may remain resolved while secondary edges dissolve into painterly atmosphere.',

        'LIGHTING: prioritize large readable light and shadow masses, colour temperature, silhouette separation, and atmosphere over physically exact reflection behaviour.',

        'Avoid photorealistic surface rendering, polished PBR materials, airbrushed mobile-game skin, crisp anime linework, uniformly finished edges, and excessive micro-detail.'
      ].join(' ')
    ],

    [
      'retro_anime',
      '레트로 애니',
      '1980~90년대 손그림 셀 애니. 제한된 셀 명암, 아날로그 색분리, 손그림 배경과 은은한 필름 질감.',
      [
        'authentic late-1980s to mid-1990s hand-drawn cel-animation illustration.',
        'The image should evoke photographed painted cels and hand-painted animation backgrounds rather than modern digital anime, glossy mobile-game art, CGI, or photography.',

        'FACE: period-appropriate adult anime construction with restrained eye size, clean hand-drawn eyelids, simplified nose and mouth, and expressive but not modern moe-style proportions.',
        'Retain the individual facial identity specified by PARAMETERS.',

        'LINEWORK: thin-to-medium hand-inked outlines with slight natural variation rather than perfectly vector-clean digital lines.',

        'SHADING: one or two hard-edged cel shadow tones with very limited gradient use.',
        'Highlights are simple painted shapes rather than glossy modern specular streaks.',

        'COLOUR: slightly muted analogue palette, visible colour separation, gentle film response, and restrained saturation compared with modern game art.',

        'HAIR AND MECHANICAL PARTS: simplified into clear animation-friendly colour regions while preserving the source mobile suit silhouette and signature equipment.',

        'BACKGROUND: hand-painted animation-background feeling with simplified perspective, soft painted atmosphere, and subtle analogue grain.',

        'Avoid modern gacha-game gloss, photoreal materials, PBR reflection, digital bloom overload, modern jewelled irises, hyper-clean vector outlines, and contemporary 3D anime rendering.'
      ].join(' ')
    ],

    [
      'ink_wash',
      '수묵 담채',
      '먹선·번짐·담채·여백이 중심. 기계 구조도 금속 CG가 아니라 붓선과 먹 농담으로 번역한다.',
      [
        'ink-and-wash character illustration combining expressive brush outlines, diluted ink values, translucent restrained colour washes, and generous negative space.',
        'The final image must clearly read as traditional-media-inspired ink painting rather than digital CGI, polished anime key art, photorealism, or oil painting.',

        'FACE AND FIGURE: keep adult anatomy and identity readable using economical brush contours, soft wash modelling, and selective facial detail.',
        'Do not over-render eyes, lips, skin texture, or small facial features.',

        'SKIN AND HAIR: describe form through paper tone, diluted wash, broken brush edges, and selective dark accents rather than smooth airbrushing or realistic specular highlights.',

        'ARMOR AND MECHANICAL STRUCTURE: preserve the essential silhouette, crest, equipment, panel rhythm, and mechanical identity of the mobile suit, but translate material rendering into expressive ink lines, dry-brush texture, diluted wash, and simplified tonal masses.',
        'Metal must not become glossy CGI or physically reflective PBR material.',

        'COLOUR: use restrained translucent accent colours derived from the canonical palette rather than fully saturated opaque local colour.',

        'BACKGROUND: use open paper-like negative space, atmospheric ink blooms, sparse environmental suggestions, and selective calligraphic shadow masses.',
        'Do not force a dark cinematic studio background when it conflicts with this style.',

        'Avoid glossy reflections, photographic skin, CGI lighting, dense mechanical micro-detail, hard digital gradients, game-render bloom, flat modern cel shading, and cluttered fully painted backgrounds.'
      ].join(' ')
    ]
  ];

  const STYLE_CORES = {
    cinematic_semi_real: [
      'high-end painterly semi-realistic character illustration with naturalistic cinematic lighting and restrained anime-informed facial idealization.',
      'The final image must read first as a sophisticated semi-realistic digital painting, not as an anime illustration, mobile-game key art, 3D character render, or live-action photograph.',

      'FACE: preserve mature adult facial anatomy, believable skull structure, and convincing three-dimensional facial volume.',
      'Anime influence is restrained and limited to subtle idealization: slightly more expressive eyes, refined eye shape, a delicate but anatomically plausible nose, softly shaped lips, and a graceful jaw.',
      'Eye size remains close to believable adult human proportion.',
      'Facial structure specified in PARAMETERS remains authoritative and must not be replaced by a recurring anime beauty template.',
      'Build facial features through painted light, value transitions, and soft form rather than crisp graphic linework.',
      'Eyelids, lash lines, irises, lips, cheeks, nose, and jaw all belong to the same painted surface language.',
      'Avoid graphic eyelashes, oversized irises, simplified triangular noses, tiny doll-like mouths, extreme V-shaped jaws, and separately drawn anime eyes sitting on top of realistic skin.',

      'SKIN: softly painted dimensionality, subtle subsurface warmth, restrained natural texture, and smooth but non-plastic transitions.',
      'Do not render photographic pore noise, but retain believable facial planes and natural variation.',
      'Highlights on skin are painted light rather than glossy CG reflections.',

      'HAIR: construct hair from painterly grouped masses with selected fine strands and flyaways.',
      'Use natural highlight grouping rather than uniformly sharp strand-by-strand photographic rendering.',

      'CLOTHING, ACCESSORIES, AND SURFACES: preserve convincing material identity, but render fabric, leather, and other worn surfaces through the same painterly visual language as the face.',
      'Reflections and specular highlights are selectively simplified and painted rather than physically perfect PBR reflections.',

      'LIGHTING: broad cinematic key light, natural reflected bounce, restrained rim illumination, atmospheric shadow colour, realistic falloff, and subtle bloom.',
      'The subject and environment share one coherent lighting system.',

      'EDGE AND DETAIL HIERARCHY: use selective sharpness.',
      'Important focal edges, hardware, and a few illuminated hair strands may be crisp while skin, secondary forms, and distant elements remain softer.',
      'Avoid uniformly razor-sharp rendering.',

      'Avoid cel shading, graphic anime linework, airbrushed gacha-game skin, glossy plastic skin, generic Unreal or Octane style CGI, physically perfect PBR reflections, and excessively clean mobile-game character rendering.'
    ].join(' '),

    game_keyart: [
      'premium 2.5D mobile-game character illustration with strongly volumetric painted rendering.',
      'The final image must read as high-end illustrated game key art occupying the visual middle ground between flat anime drawing and full 3D CGI.',
      'Forms are built primarily through smooth gradients, soft ambient occlusion, controlled specular highlights, dimensional light, and carefully modelled volume rather than graphic outlines or flat cel shading.',

      'FACE: use clearly anime-informed facial construction combined with strong soft three-dimensional modelling.',
      'The face must retain visible volumetric form in the forehead, eyelids, eye sockets, nose bridge, cheeks, lips, jaw, and chin, built through smooth painted gradients rather than flat cel shapes or graphic linework.',
      'Eyes may be large and expressive, but they must sit naturally inside a softly modelled three-dimensional face rather than appearing as flat anime eye artwork placed over the skin.',
      'Use restrained eyelid and lash definition, a softly simplified nose, and clean lips, while preserving the face shape, ethnicity, maturity, and individual identity defined in PARAMETERS.',
      'The face should carry less micro-detail than the clothing and equipment, but it must not become flat.',

      'SKIN: smooth high-end 2.5D game-illustration skin with long airbrushed gradients, soft subsurface-like warmth, rounded form shading, gentle ambient occlusion, and controlled glossy highlights.',
      'Skin must feel volumetric and luminous, not flat, cel-shaded, photographic, or plastic.',
      'Do not use photographic pores, realistic skin grain, or raw 3D shader noise.',

      'HAIR: construct hair from layered grouped locks with clearly modelled volume, broad glossy highlight bands, soft internal shadowing, and a limited number of separated strands and flyaways.',
      'Hair must feel more dimensional than flat anime hair, but remain illustrated rather than photographically strand-rendered.',

      'CLOTHING, ACCESSORIES, AND SURFACES: use clean but volumetric rendering with clear form separation, rounded light falloff, stylized reflections, ambient occlusion, and controlled glossy highlights.',
      'Edges may be crisp where necessary, but form must be described primarily through three-dimensional light and material response rather than heavy outlines, flat graphic colouring, or simple cel blocks.',

      'LIGHTING: use bright, controlled dimensional key light, soft fill and bounce, decisive rim separation, selective coloured accent light, and believable but stylized light falloff.',
      'Lighting must create clear three-dimensional form across face, skin, hair, and clothing.',

      'BACKGROUND: use strong subject isolation with simplified atmospheric space, glow, bokeh, soft environmental shapes, or reduced background detail.',
      'The background may suggest depth and real spatial lighting but must remain subordinate to the character.',

      'RENDERING BALANCE: the result should feel more volumetric than conventional 2D anime illustration but more illustrated and stylized than a fully rendered 3D game character.',
      'Use polished 2.5D modelling and shading without crossing into photorealism.',

      'Avoid flat anime rendering, cel-shaded skin, purely 2D character-sheet rendering, visible comic-style outlines, flat graphic facial construction, uniformly hard-edged shadows, heavy line-art dependence, simple television-anime shading, photographic skin texture, fully photorealistic CGI, raw Unreal or Octane rendering, hyper-real PBR material noise, plastic 3D skin, perfect ray-traced reflections, and generic game-engine asset presentation.'
    ].join(' ')
  };

  const ANTHRO_STYLE_EXTENSIONS = {
    cinematic_semi_real: [
      'ARMOR AND MECHANICAL SURFACES: preserve convincing material identity and clear mechanical structure, but render metal, composite, and painted armor through the same painterly visual language as the face.',
      'MECHANICAL PAINTERLY LOCK: mechanical armor may be highly detailed and precisely constructed, but high detail must not change the rendering language into CGI or PBR. Panel geometry, weapons, backpack structures, joints, and hard-surface forms may remain crisp and mechanically legible, while their lighting and material response must still read as painted illustration. Do not use uniform PBR roughness, ray-traced-looking reflections, perfectly smooth metallic gradients, or the polished surface language of a rendered 3D game asset. Mechanical complexity controls WHAT is depicted, not HOW realistically it is rendered.',
      'Selected mechanical focal edges may be somewhat sharper than skin, but the overall armor surface must retain the same painterly edge hierarchy and optical softness as the rest of the illustration; it must never look like a separate 3D render composited onto a painted character.',
      'Even highly polished armor uses painted interpretations of reflection rather than physically exact reflections \u2014 specular highlights may be strong where appropriate, but stay selective, broken, and compositionally designed rather than continuous ray-traced surface response.'
    ].join(' '),

    game_keyart: [
      'ARMOR AND MECHANICAL SURFACES: use clean but volumetric hard-surface rendering with clear panel separation, rounded light falloff, stylized reflections, ambient occlusion, and controlled glossy highlights.',
      'Preserve source-specific armor geometry and equipment structure without turning the surfaces into fully realistic PBR assets.',
      'Metal, composite, and painted armor should be visibly distinct, but their reflections and specular behaviour remain stylized and art-directed.',
      'REFERENCE FIDELITY: preserve the geometry and equipment established by the source reference or PARAMETERS and render them through this style rather than replacing them; do not copy the reference image\'s own rendering language \u2014 its cel-animation, photographic, or CGI look \u2014 into the final image.',
      'Do not simplify the source mobile suit into generic mobile-game heroine armor \u2014 this style may beautify and polish the rendering, but it must not replace source-specific mechanical geometry with generic fantasy-mecha costume design.'
    ].join(' ')
  };

  const LIFESTYLE_STYLE_EXTENSIONS = {
    cinematic_semi_real: [
      'Clothing, skin, hair, and environment in this scene all follow the semi-real painterly surface logic established above.',
      'Fabrics, leather, denim, knitwear, and other materials retain tactile detail and natural folds, described through the same painterly value language as skin and hair.',
      'Wet skin or swimwear may show localized highlights without turning the entire figure into glossy plastic.',
      'The character must feel embedded in the environment, with consistent light and atmosphere across figure and background.'
    ].join(' '),

    game_keyart: [
      'Fabrics, swimwear, leather, and accessories in this scene retain the same polished 2.5D game-illustration treatment established above \u2014 clear form, rounded light falloff, and controlled glossy highlights.',
      'Skin remains smooth and volumetric rather than flat or photographic.',
      'The environment is simplified and atmospherically blurred, keeping the character as the clear subject.',
      'The scene may be glamorous and glossy, but stays lifestyle-focused \u2014 do not introduce armor, mechanical parts, weapons, or sci-fi hardware into the scene.'
    ].join(' ')
  };

  /* ---- Morphology Mode: Anthro 전용, 사용자 선택형. 자동 분류 없음. ---- */
  const MORPHOLOGY_COMMON =
    'First identify the source mobile suit\'s dominant body morphology and silhouette logic before translating it into humanoid form. ' +
    'Preserve a normal humanoid biological skeleton unless PARAMETERS explicitly request otherwise. ' +
    'Do not reproduce unusual source geometry as extra biological arms, legs, torsos, or duplicate human limbs. ' +
    'When the source contains oversized, elongated, offset, floating-looking, or non-human mechanical structures, preserve their silhouette function by translating them into external armor shells, shoulder frames, elongated forearm armor, backpack assemblies, binders, dorsal fins, external mechanical supports, or other non-biological equipment around the humanoid body. ' +
    'Source geometry controls silhouette identity; humanoid translation controls anatomical integration.';

  const SOURCE_ARM_MAPPING =
    '[SOURCE ARM MAPPING] Each visible source-side arm assembly must map to exactly one humanoid arm. ' +
    'Do not interpret layered shoulder armor, outer arm shells, thruster housings, or elongated side structures as additional limbs. ' +
    'If multiple mechanical masses surround one source arm, merge them around the same single humanoid arm as layered armor, external framing, shoulder-adjacent equipment, or fixed mechanical shells. ' +
    'Do not create a second hand, wrist, elbow, or manipulator to represent secondary mechanical masses around the same source arm.';

  const UPPER_LIMB_TOPOLOGY_LOCK =
    '[UPPER-LIMB TOPOLOGY LOCK] The humanoid character must have exactly one left arm and one right arm, for a total of two arms, unless PARAMETERS explicitly request additional arms. ' +
    'This two-arm limit applies to biological arms, armored arms, robotic arms, prosthetic arms, auxiliary arms, sub-arms, manipulators, articulated shoulder-mounted arms, and detached mechanical arm-like structures. ' +
    'Do not preserve the source silhouette by adding a second articulated arm-like structure beside either human arm. ' +
    'Never create an additional hand, claw, wrist, elbow, or independently articulated arm unless PARAMETERS explicitly request it.';

  const LIMB_OWNERSHIP_LOCK =
    '[LIMB OWNERSHIP LOCK] The source mobile suit\'s left arm assembly becomes the character\'s one and only left arm; the source mobile suit\'s right arm assembly becomes the character\'s one and only right arm. ' +
    'Do not create a separate inner pair of humanoid arms in addition to those source-derived arm assemblies. ' +
    'The hands attached to the source-derived left and right arm assemblies are the character\'s only hands. ' +
    'The final character must contain exactly two shoulders, two arms, two elbows, two wrists, and two hands in total. ' +
    'Do not preserve both a normal humanoid arm and a separate source-mechanical arm on the same side. ' +
    'For each side, choose exactly one arm representation and integrate the source mechanical mass into that same arm rather than treating it as separate external equipment.';

  /* aggressive_restructure 전용: MORPHOLOGY_COMMON을 상속하지 않는다.
     '팔 주변 매스는 외장 장비로' 라는 일반 문구가 arm ownership 지시와 충돌해서
     source arm이 external shell로도, 별도 인간 팔로도 동시에 생기는 4팔 현상을 유발했다.
     그래서 팔은 독자적인 topology-first 규칙으로, 팔이 아닌 부분만 기존 방식(외장 번역)을 쓴다. */
  const AGGRESSIVE_MORPHOLOGY_CORE =
    '[AGGRESSIVE MORPHOLOGY TOPOLOGY] First identify the source mobile suit\'s dominant body morphology and silhouette logic. ' +
    'Preserve a normal humanoid biological skeleton for the torso and legs unless PARAMETERS explicitly request otherwise. ' +
    'For any oversized, elongated, offset, or non-human structure that is NOT part of an arm assembly \u2014 such as dorsal structures, backpack masses, leg armor, or shoulder-adjacent bulk not tied to the arm chain \u2014 translate it into external armor shells, backpack assemblies, binders, dorsal fins, or other non-biological equipment around the humanoid body. ' +
    'Determine arm limb ownership before designing the rest of the humanoid body. ' +
    'Create exactly one left upper-limb chain and one right upper-limb chain. ' +
    'The source mobile suit\'s left arm assembly defines the character\'s complete left arm chain: shoulder joint, upper arm, elbow, forearm, wrist, and hand. ' +
    'The source mobile suit\'s right arm assembly defines the character\'s complete right arm chain: shoulder joint, upper arm, elbow, forearm, wrist, and hand. ' +
    'Do not first create a normal inner humanoid arm and then preserve the source arm as external equipment. ' +
    'There is no second inner arm behind, beneath, beside, or inside either source-derived arm assembly. ' +
    'The source-derived mechanical arm occupies the normal humanoid arm socket directly. ' +
    'For each side, all mechanical masses belonging to that source arm must be integrated into the same single arm chain rather than split into a separate external mechanical arm. ' +
    'The final humanoid must contain exactly two shoulders, two upper arms, two elbows, two forearms, two wrists, and two hands. ' +
    'Large source arm geometry may alter the size, armor mass, and silhouette of that same arm, but must not create an additional articulated limb.';

  const AGGRESSIVE_SHOULDER_GUARD =
    'Keep a believable adult human shoulder span; translate oversized shoulder masses as external or mounted structure without widening the biological clavicle or ribcage, and preserve normal clavicle width and arm-joint placement. ' +
    'Shoulder-adjacent mass may remain externally large, but if it belongs structurally to the source arm assembly, it must remain part of that same single arm chain rather than being detached into a second articulated appendage.';

  /* v2: 위 AGGRESSIVE_SHOULDER_GUARD의 'may remain externally large'가 거대 숄더 포드를 그대로
     남겨도 된다는 허가로 읽혀서, torso-pod-arm 구조가 유지되는 문제가 확인됨.
     그래서 aggressive_restructure 조립에서는 이 상수 대신 아래 세 개를 쓴다. */
  const AGGRESSIVE_SHOULDER_JOINT_ANCHOR =
    '[SHOULDER JOINT ANCHOR] Each arm must originate directly from a compact humanoid shoulder socket located close to the ribcage; the actual shoulder root must remain compact. ' +
    'Do not place a giant mechanical pod, shell, housing, or armored volume between the torso and the upper arm. ' +
    'The upper arm must visibly connect directly to the character\'s shoulder joint. ' +
    'Preserve a normal clavicle span and a readable neck-to-shoulder transition. ' +
    'Do not move the arm socket laterally outward just to preserve the source machine\'s original shoulder width.';

  const AGGRESSIVE_MASS_REDISTRIBUTION =
    '[UPPER-BODY MASS REDISTRIBUTION] Do not preserve oversized source shoulder masses at their original literal size or literal placement when doing so would distort humanoid anatomy. ' +
    'Compress exaggerated shoulder housings into compact shoulder caps. ' +
    'Redistribute the remaining source mass longitudinally and rearward into upper-arm armor, elongated forearm armor, lateral arm shells, rear binders, dorsal structures, backpack masses, or fixed external framing. ' +
    'Source mass may migrate, compress, split, or redistribute across the humanoid armor system when literal placement would damage anatomy.';

  const AGGRESSIVE_SILHOUETTE_FIDELITY =
    'Preserve the source machine\'s silhouette identity, directional emphasis, and overall visual weight, but allow major source masses to migrate, compress, split, or redistribute across the humanoid armor system when literal placement would distort anatomy.';

  const SOURCE_ARM_OWNERSHIP_MAPPING =
    '[SOURCE ARM OWNERSHIP MAPPING] Each source-side arm assembly maps to exactly one humanoid upper limb: the left source arm assembly becomes one left shoulder, upper arm, elbow, forearm, wrist, and hand; the right source arm assembly becomes one right shoulder, upper arm, elbow, forearm, wrist, and hand. ' +
    'If multiple armor masses surround one source arm, merge them into the same arm chain as layered armor or fixed structure. ' +
    'Do not convert those masses into auxiliary arms, sub-arms, manipulators, detached robotic limbs, or second hands.';

  const MORPHOLOGY_PRECEDENCE =
    '[MORPHOLOGY PRECEDENCE] Morphology controls limb count, limb ownership, joint topology, joint anchoring, and mechanical mass placement. ' +
    'The TRANSLATION PROFILE below may adjust humanization, skin exposure, body elegance, armor integration, and proportions, but it must not add, remove, duplicate, or reassign limbs, must not create an inner humanoid arm beside a source-derived arm, and must not widen the anatomical shoulders.';

  const MORPHOLOGY_PROFILES = {
    standard_humanoid:
      MORPHOLOGY_COMMON + ' ' +
      'This source already maps cleanly onto a humanoid body. Avoid unnecessary structural reinterpretation \u2014 translate its recognizable armor language and proportions naturally.',
    silhouette_equipment_emphasis:
      MORPHOLOGY_COMMON + ' ' +
      'This source relies on its silhouette and external equipment \u2014 shoulders, limbs, backpack, wings, or binders \u2014 for identity. ' +
      'Preserve that silhouette\'s mass, direction, and rhythm strongly rather than smoothing it into conventional human proportions; keep rear or lateral equipment as clearly external structure rather than absorbing it into ordinary body armor. ' +
      'Keep a believable adult human shoulder span. Translate oversized shoulder masses as external equipment, not as anatomical shoulder width. Preserve normal clavicle width and arm-joint placement. Keep arm sockets close to the torso. ' +
      SOURCE_ARM_MAPPING,
    aggressive_restructure:
      AGGRESSIVE_MORPHOLOGY_CORE + ' ' + AGGRESSIVE_SHOULDER_JOINT_ANCHOR + ' ' + AGGRESSIVE_MASS_REDISTRIBUTION + ' ' + AGGRESSIVE_SILHOUETTE_FIDELITY + ' ' +
      SOURCE_ARM_OWNERSHIP_MAPPING + ' ' + LIMB_OWNERSHIP_LOCK + ' ' + MORPHOLOGY_PRECEDENCE
  };

  const STYLE_PROFILES = {
    cinematic_semi_real: { core: STYLE_CORES.cinematic_semi_real, anthro: ANTHRO_STYLE_EXTENSIONS.cinematic_semi_real, lifestyle: LIFESTYLE_STYLE_EXTENSIONS.cinematic_semi_real },
    game_keyart: { core: STYLE_CORES.game_keyart, anthro: ANTHRO_STYLE_EXTENSIONS.game_keyart, lifestyle: LIFESTYLE_STYLE_EXTENSIONS.game_keyart },
    glossy_kr_game: {
      core: [
        "high-gloss stylised character illustration in the visual language of premium Korean mobile-game key art.",
        "The rendering is strongly stylised, glamorous, saturated, and highly polished, but the character design, body proportions, armor silhouette, and costume structure remain controlled by PARAMETERS and the source mobile suit.",
        "FACE: strongly stylised but clearly adult facial rendering built on mature semi-real 2.5D modelling.",
        "The face must keep dimensional volume in the cheeks, nose bridge, nose tip, lips, eyelids, and jaw rather than flattening into a modern anime or mecha key-art template.",
        "Use elegant eye shapes, deliberate lash definition, a refined but dimensional nose, softly glossy lips with readable volume, and polished beauty rendering.",
        "The exact eye geometry, face shape, ethnicity, maturity, and facial character must still follow PARAMETERS rather than collapsing into one recurring glamour face.",
        "SKIN: exceptionally smooth airbrushed gradients with bright designed specular highlights and deep saturated shadow colour.",
        "Skin appears polished and luminous rather than photographic, but the facial planes underneath stay dimensional — gradients must not flatten the form into uniform airbrushed shading.",
        "HAIR: glossy grouped locks with strong highlight ribbons, saturated colour separation, and selected sharp strands.",
        "Hair should feel illustrated and lacquered rather than photographically rendered.",
        "DECORATIVE DETAIL: straps, trim, fittings, chains, ribbons, jewellery, or ornamental accents may appear only where the canonical design or explicit PARAMETERS support them.",
        "Do not add generic baroque decoration merely because of the selected art style.",
        "LIGHTING: theatrical key light, strong coloured rim light, deep jewel-toned shadows, controlled bloom, and dramatic contrast.",
        "BACKGROUND: simplified atmospheric glow, bokeh, gradients, or broad decorative light shapes.",
        "Avoid photographic realism, muted colour, flat cel shading, low-gloss rendering, plain unrendered surfaces, unrelated fantasy ornament, and generic baroque redesign of the source mobile suit.",
        /* 화풍이 흔들릴 때 돌아올 자리. 색·재질·장면이 바뀌어도 같은 화풍임을 끝에서 한 번 더 못박는다. */
        "STYLE SIGNATURE: maintain a premium Korean game-illustration finish built on semi-real 2.5D form, mature dimensional facial modelling, refined luminous skin gradients, polished hair rendering, crisp focal detail, and strong material separation.",
        "Do not drift toward flat modern anime rendering, generic mecha key-art facial simplification, or cel-like treatment merely because the subject, armor, palette, or scene becomes more mechanical or saturated.",
        "Colour palette and material gloss may vary by subject, but the underlying rendering language must remain recognisably high-end glossy Korean game character art."
      ].join(' '),
      anthro: [
        "ARMOR, CLOTHING, AND MECHANICAL SURFACES: thick glossy rendering with strong stylized specular highlights, saturated colour, crisp edge accents, and luxurious material separation.",
        "Metal, painted armor, latex-like surfaces, fabric, and glass may each reflect light differently, but all remain part of the same highly stylised illustration.",
        "Do not convert source-specific mechanical design into generic fantasy costume.",
        "Even with highly mechanical silhouettes, saturated armor colour, or strong rim lighting, the exposed human face keeps the same mature semi-real 2.5D rendering — dimensional cheeks, nose bridge, nose tip, lips, eyelids, and jaw — instead of being simplified into a flatter anime or mecha key-art face.",
        "Hard-surface armor keeps a nuanced material response: differentiate painted metal, matte coating, polished edges, dark mechanical joints, and reflective hard surfaces rather than reducing the whole armor system to uniformly clean cel-like highlights.",
        /* 유광 화풍이라고 장갑까지 전부 번쩍여야 하는 건 아니다. 무광은 재질 이야기고 화풍은 그대로다. */
        "A matte, military, pale, dark, or heavily saturated armor palette is still this style: matte describes the material, not the rendering language, which stays premium glossy Korean game illustration rather than concept art or anime key art."
      ].join(' '),
      lifestyle: [
        "Clothing, fabric, and accessories in this scene follow the same high-gloss stylised rendering established above — strong specular highlights, saturated colour, and luxurious material separation.",
        "The face keeps mature semi-real 2.5D construction rather than drifting toward cleaner flat anime beauty: nose, lips, cheeks, eyelids, and jaw stay softly dimensional with refined gradients, and hair keeps layered glossy strand groups with fine secondary detail.",
        /* 광택을 빼는 게 아니라, 온몸이 균일하게 젖어 보이는 것만 막는다. */
        "Use luminous glossy skin highlights selectively and with dimensional falloff — dry skin may still look polished and radiant, but avoid uniformly wet-looking specular coverage unless the scene explicitly involves water or moisture.",
        "Do not introduce armor, mechanical parts, weapons, or other source mobile-suit equipment into this scene."
      ].join(' ')
    },
    game_cgi: {
      core: [
        "high-end stylized 3D character render in the visual language of a premium game cinematic.",
        "The final image must unmistakably read as sophisticated CGI rather than live-action photography, 2D anime illustration, painterly concept art, or mobile-game 2.5D key art.",
        "FACE: preserve clearly adult anatomy and the facial structure defined by PARAMETERS while allowing tasteful game-character idealization.",
        "Use believable three-dimensional eyelids, nose, lips, cheeks, jaw, and eye sockets rather than flat anime line construction.",
        "Eyes may be slightly idealized but remain physically integrated into the modeled face.",
        "SKIN: smooth high-end digital skin shading with controlled subsurface scattering, fine but restrained surface variation, realistic roughness transitions, and carefully shaped specular response.",
        "Avoid waxy skin, porcelain plastic skin, excessive pore detail, and live-action photographic imperfection.",
        "HAIR: modeled strand groups and layered hair cards or groom-like masses with physically coherent highlights.",
        "Avoid flat painted hair bands and avoid hyper-photographic individual-strand noise.",
        "LIGHTING: cinematic studio-quality key, fill, bounce, rim, volumetric separation, controlled bloom, and believable reflected light.",
        "Use physically coherent three-dimensional lighting throughout the character.",
        "Avoid painterly brushwork, flat anime shading, cel outlines, photographic live-action skin, crude plastic surfaces, excessive ray-traced mirror reflections, and generic unlit character-viewer presentation."
      ].join(' '),
      anthro: [
        "ARMOR AND MECHANICAL SURFACES: clean premium PBR-style material separation with convincing painted metal, exposed metal, composite, rubber, glass, and emissive sensors.",
        "Use controlled reflections, roughness variation, subtle edge wear, and clear mechanical segmentation.",
        "Materials should feel intentionally art-directed rather than like a raw photoreal asset render."
      ].join(' '),
      lifestyle: "Clothing, fabric, and accessories in this scene follow the same premium stylized 3D material logic established above. Do not introduce armor, mechanical parts, weapons, or other source mobile-suit equipment into this scene."
    },
    semi_real_paint: {
      core: [
        "semi-realistic digital oil painting with visibly painted surfaces, grounded adult anatomy, and resolved character design.",
        "The image must read as a finished digital painting rather than a photograph, CGI render, anime key visual, or loose unfinished concept sketch.",
        "FACE AND SKIN: realistic adult facial structure with softly idealized beauty, painted through layered colour, subtle brush texture, and believable value transitions.",
        "Retain visible but controlled painterly texture across cheeks, lips, eyelids, neck, and exposed skin.",
        "Do not use photographic pore detail or perfectly airbrushed game skin.",
        "HAIR: painted in coherent masses with visible brush grouping and selected strands.",
        "Highlights should feel brushed into the hair rather than physically ray-traced.",
        "EDGE HANDLING: most important forms remain resolved and readable, while selected secondary edges may soften into surrounding values.",
        "LIGHTING: grounded directional illumination with believable volume and colour bounce, interpreted through painterly value and colour rather than photographic optics.",
        "Avoid loose unresolved concept-art brushwork, perfectly clean CGI material rendering, glossy mobile-game airbrushing, flat cel shading, and fully photographic skin."
      ].join(' '),
      anthro: [
        "ARMOR, FABRIC, AND MECHANICAL PARTS: preserve convincing material differences and rich surface detail while allowing visible brush texture across painted metal, composite, fabric, and worn surfaces.",
        "Specular highlights and reflections are interpreted through painting and need not be physically perfect.",
        "Do not leave major anatomy or signature mechanical structures vague or unfinished."
      ].join(' '),
      lifestyle: "Clothing, fabric, and other worn materials in this scene follow the same semi-realistic painted surface logic established above. Do not introduce armor, mechanical parts, weapons, or other source mobile-suit equipment into this scene."
    },
    photoreal: {
      core: [
        "high-end photorealistic live-action character photography with believable practical and mechanical materials.",
        "The final image must read as a real photograph captured by a camera, not as digital painting, anime illustration, mobile-game key art, or visible CGI character rendering.",
        "FACE AND SKIN: realistic adult human facial anatomy, natural skin texture, subtle pores, fine tonal variation, believable lips, eyelids, lashes, and eyes.",
        "Beauty styling may be polished and editorial, but do not reshape the face into anime proportions or plastic game-character anatomy.",
        "HAIR: naturally photographed hair with believable strand grouping, flyaways, translucency, and real light interaction.",
        "LIGHTING: real photographic key, fill, bounce, rim, practical reflections, natural falloff, and physically believable exposure.",
        "Use realistic camera depth of field and lens behaviour only where compositionally appropriate.",
        "Avoid painterly brush texture, anime eye construction, cel shading, game-render skin, Unreal-style CGI appearance, artificial plastic gloss, excessive cinematic bloom, and impossible illustrated reflections."
      ].join(' '),
      anthro: [
        "ARMOR AND MECHANICAL SURFACES: appear as physically fabricated real-world materials with believable scale, seams, joints, painted surfaces, metal, composite, rubber, glass, and practical wear.",
        "Reflections follow the photographed environment rather than stylized illustrated highlight shapes."
      ].join(' '),
      lifestyle: "Clothing, fabric, and accessories in this scene are photographed with the same practical, real-world material logic established above. Do not introduce armor, mechanical parts, weapons, or other source mobile-suit equipment into this scene."
    },
    anime_illust: {
      core: [
        "polished modern anime character illustration with clean confident linework, clearly anime facial construction, and controlled two-to-three-step shading supported by soft gradients.",
        "The image must read unmistakably as a finished 2D anime illustration rather than photography, 3D CGI, painterly concept art, or glossy 2.5D game rendering.",
        "FACE: clearly anime, with expressive eyes, simplified but elegant nose and mouth construction, clean eyelid definition, and adult facial proportions appropriate to PARAMETERS.",
        "Preserve individual face shape, ethnicity, maturity, and facial character rather than reusing one generic anime face.",
        "SKIN: smooth illustrated colour with clean shadow shapes and restrained soft gradients.",
        "No photographic pores, realistic skin noise, or wet CG-style specular response.",
        "HAIR: defined graphic locks with clean directional flow, selective internal strand lines, and stylized highlight shapes.",
        "LIGHTING: illustrated key and rim lighting expressed through designed colour shapes and gradients rather than physically perfect reflections.",
        "Avoid photographic skin, camera grain, realistic lens blur, 3D-render materials, loose brushwork, thick glossy mobile-game rendering, and completely flat low-detail television animation."
      ].join(' '),
      anthro: [
        "ARMOR, COSTUME, AND MECHANICAL PARTS: retain crisp source-specific geometry, clean outlines, controlled cel-like shading, and simplified illustrated highlights.",
        "Mechanical surfaces must remain part of the same 2D drawing and must not become photoreal PBR objects."
      ].join(' '),
      lifestyle: "Clothing, fabric, and accessories in this scene follow the same clean 2D illustrated rendering established above. Do not introduce armor, mechanical parts, weapons, or other source mobile-suit equipment into this scene."
    },
    cel_anime: {
      core: [
        "flat cel-shaded anime character illustration with bold clean outlines, hard-edged shadow shapes, minimal gradients, and strong poster-like colour blocking.",
        "The entire image must use a consistent cel-animation rendering language.",
        "FACE: clearly adult anime facial construction with simplified eyes, nose, mouth, and clean graphic shapes.",
        "Follow the facial geometry and character identity defined in PARAMETERS without realistic skin rendering.",
        "SKIN: flat local colour with one primary shadow tone and only minimal highlight accents.",
        "No pores, subsurface scattering, glossy airbrushing, or photographic tonal modelling.",
        "HAIR: clean graphic masses separated into major locks with simple highlight shapes and hard colour boundaries.",
        "LIGHTING: communicate form through deliberate cel-shadow shapes and limited rim-colour bands rather than realistic cinematic falloff.",
        "Avoid soft painterly modelling, airbrushed game skin, realistic material reflections, photographic lighting, CGI shading, excessive gradients, and dense micro-detail."
      ].join(' '),
      anthro: [
        "ARMOR AND MECHANICAL PARTS: preserve canonical geometry through bold outlines, hard shadow blocks, simplified metal colour separation, and minimal reflected-light detail.",
        "Do not introduce realistic PBR reflections or painterly texture."
      ].join(' '),
      lifestyle: "Clothing, fabric, and accessories in this scene follow the same flat cel-shaded rendering established above. Do not introduce armor, mechanical parts, weapons, or other source mobile-suit equipment into this scene."
    },
    painterly: {
      core: [
        "loose painterly concept-art illustration built from broad visible brushwork, strong value composition, atmospheric colour masses, and selectively unresolved edges.",
        "The image should feel like confident high-level production concept art rather than a polished game render, anime key visual, photograph, or detailed digital oil portrait.",
        "FACE AND FIGURE: maintain readable adult anatomy, expression, and identity, but describe secondary facial detail economically through brush shape and value rather than precise linework.",
        "HAIR, SKIN, FABRIC, AND ARMOR: all materials are interpreted through broad painted masses and selective texture.",
        "Do not individually render every pore, strand, panel scratch, screw, or micro-reflection.",
        "LIGHTING: prioritize large readable light and shadow masses, colour temperature, silhouette separation, and atmosphere over physically exact reflection behaviour.",
        "Avoid photorealistic surface rendering, polished PBR materials, airbrushed mobile-game skin, crisp anime linework, uniformly finished edges, and excessive micro-detail."
      ].join(' '),
      anthro: [
        "MECHANICAL IDENTITY: where mobile-suit armor, weapons, or mechanical equipment are part of the scene, the major armor silhouette, crest, weapon shape, backpack, binders, shields, and signature source structures remain clearly recognizable even when small surface detail is simplified; this does not require adding such equipment to scenes that do not call for it.",
        "Important silhouette-defining mechanical edges may remain resolved while secondary edges dissolve into painterly atmosphere."
      ].join(' '),
      lifestyle: "Clothing, fabric, and other worn materials in this scene are interpreted through the same broad painterly masses established above. Do not introduce armor, mechanical parts, weapons, or other source mobile-suit equipment into this scene."
    },
    retro_anime: {
      core: [
        "authentic late-1980s to mid-1990s hand-drawn cel-animation illustration.",
        "The image should evoke photographed painted cels and hand-painted animation backgrounds rather than modern digital anime, glossy mobile-game art, CGI, or photography.",
        "FACE: period-appropriate adult anime construction with restrained eye size, clean hand-drawn eyelids, simplified nose and mouth, and expressive but not modern moe-style proportions.",
        "Retain the individual facial identity specified by PARAMETERS.",
        "LINEWORK: thin-to-medium hand-inked outlines with slight natural variation rather than perfectly vector-clean digital lines.",
        "SHADING: one or two hard-edged cel shadow tones with very limited gradient use.",
        "Highlights are simple painted shapes rather than glossy modern specular streaks.",
        "COLOUR: slightly muted analogue palette, visible colour separation, gentle film response, and restrained saturation compared with modern game art.",
        "BACKGROUND: hand-painted animation-background feeling with simplified perspective, soft painted atmosphere, and subtle analogue grain.",
        "Avoid modern gacha-game gloss, photoreal materials, PBR reflection, digital bloom overload, modern jewelled irises, hyper-clean vector outlines, and contemporary 3D anime rendering."
      ].join(' '),
      anthro: [
        "HAIR AND MECHANICAL PARTS: simplified into clear animation-friendly colour regions while preserving the source mobile suit silhouette and signature equipment."
      ].join(' '),
      lifestyle: "Clothing and accessories in this scene follow the same hand-drawn cel-animation colour regions established above. Do not introduce armor, mechanical parts, weapons, or other source mobile-suit equipment into this scene."
    },
    ink_wash: {
      core: [
        "ink-and-wash character illustration combining expressive brush outlines, diluted ink values, translucent restrained colour washes, and generous negative space.",
        "The final image must clearly read as traditional-media-inspired ink painting rather than digital CGI, polished anime key art, photorealism, or oil painting.",
        "FACE AND FIGURE: keep adult anatomy and identity readable using economical brush contours, soft wash modelling, and selective facial detail.",
        "Do not over-render eyes, lips, skin texture, or small facial features.",
        "SKIN AND HAIR: describe form through paper tone, diluted wash, broken brush edges, and selective dark accents rather than smooth airbrushing or realistic specular highlights.",
        "COLOUR: use restrained translucent accent colours derived from the canonical palette rather than fully saturated opaque local colour.",
        "BACKGROUND: use open paper-like negative space, atmospheric ink blooms, sparse environmental suggestions, and selective calligraphic shadow masses.",
        "Do not force a dark cinematic studio background when it conflicts with this style.",
        "Avoid glossy reflections, photographic skin, CGI lighting, dense mechanical micro-detail, hard digital gradients, game-render bloom, flat modern cel shading, and cluttered fully painted backgrounds."
      ].join(' '),
      anthro: [
        "ARMOR AND MECHANICAL STRUCTURE: preserve the essential silhouette, crest, equipment, panel rhythm, and mechanical identity of the mobile suit, but translate material rendering into expressive ink lines, dry-brush texture, diluted wash, and simplified tonal masses.",
        "Metal must not become glossy CGI or physically reflective PBR material."
      ].join(' '),
      lifestyle: "Clothing and other worn materials in this scene are translated into the same expressive ink lines and diluted wash established above. Do not introduce armor, mechanical parts, weapons, or other source mobile-suit equipment into this scene."
    },
  };

  /* 아래 여섯은 의인화 프롬프트를 짜는 데 쓰는 고정 문구다.
     lib/prompt-anthro.js 가 화면 없이도 같은 글을 뽑아야 해서 함께 옮겼다. */
  const templateC = "Full-body anthropomorphization of a Gundam-series mobile suit. Every design decision — armor color scheme, head crest, backpack and weapon attachments, facial design, hair color, and hairstyle — is determined strictly by the PARAMETERS at the bottom. Where the PARAMETERS are silent, follow the mobile suit's canonical design and visual identity.\n\n\nDESIGN PRIORITY — Every visual decision must follow this priority order:\n\n1. Explicit instructions written in PARAMETERS.\n2. Clearly visible equipment and loadout details from any uploaded reference image.\n3. The mobile suit's canonical design from the specified series or work.\n4. The general humanoid styling instructions in this prompt.\n\n\nREFERENCE IMAGE RULE — If one or more original reference images are provided by the user, use them as authoritative visual references for equipment and loadout details.\n\nWhen a reference image is provided, prioritize it especially for:\n\n- weapon type, shape, scale, and proportions\n- shield design, outline, mounted accessories, and surface structure\n- backpack structure, thrusters, binders, funnels, panel containers, and launcher arrangement\n- hardpoint placement, attachment direction, and equipment mounting method\n- visible sub-weapons such as spare magazines, Sturm Fausts, missiles, beam sabers, grenades, or auxiliary equipment\n- distinctive armor geometry and mechanical structures that define the identity of the mobile suit\n\nIf the uploaded reference image clearly shows a specific loadout or equipment arrangement, do not replace it with a generic or alternative interpretation.\n\nPreserve the recognizable structure, proportions, placement, and mechanical logic of the equipment from the reference image as faithfully as possible while translating it into the anthropomorphized humanoid design.\n\n\nREFERENCE IMAGE AUTHORITY — When an original mobile-suit reference image is provided, it is the primary visual design authority for the mobile suit: it controls visible armor geometry, silhouette, proportions, equipment placement, hardpoints, backpack structure, shield shape, weapon shape, and visible loadout state.\n\nDo not reconstruct the mobile suit primarily from its name, genre conventions, or canonical memory when the corresponding feature is clearly visible in the uploaded reference; canonical knowledge is fallback information only for details that are genuinely not visible, cropped, or ambiguous in the reference.\n\nThe reference image controls DESIGN, not RENDERING STYLE — preserve its visible geometry and equipment, but render them using the selected ART STYLE rather than copying the reference image's own cel-animation, photographic, CGI, or other rendering style. The selected ART STYLE controls rendering language only and must not redesign or replace clearly visible source-reference geometry.\n\n\nPARAMETER INTERPRETATION RULE — The PARAMETERS are intentionally minimal and usually contain only gender, mobile suit name, series/work title, body type, and any explicitly requested special characteristics.\n\nBecause of this, all other fitting design details must be inferred and completed from the mobile suit's canonical design and from any uploaded original reference image when provided.\n\nWhen PARAMETERS are minimal, automatically determine and faithfully add the following in a way that best matches the specified mobile suit:\n\n- canonical armor color scheme\n- head crest / antenna / sensor design\n- shoulder, chest, waist, leg, and overall armor silhouette\n- backpack structure and attachment placement\n- funnels, wing binders, panel containers, shields, cannons, rifles, and signature equipment\n- distinctive transformation mechanisms or unusual mechanical structures\n- a distinctive human facial design appropriate for the mobile suit\n- a fitting human hairstyle and hair color that harmonize primarily with the mobile suit's armor colors, silhouette, design language, and overall visual character\n- robe-like, mantle-like, dress-like, skirt-like, or armored lower-body treatment that best matches the mobile suit's silhouette\n- suitable negative constraints to prevent common generation errors that would conflict with the specified mobile suit\n\nDo not leave these unspecified as generic design choices.\n\nThey must be completed in a way that makes the result clearly recognizable as the requested mobile suit rather than as generic Gundam-inspired armor.\n\nDo not introduce robe-like, mantle-like, dress-like, cape-like, or long skirt-like lower-body forms unless they are clearly supported by the uploaded source reference or explicitly requested in PARAMETERS; where the source mobile suit's canonical lower-body is armored legs, a split skirt, or another non-flowing structure, preserve that structure rather than defaulting to a flowing dress-like silhouette.\n\n\nHAIR / PILOT RULE — Do not automatically derive hairstyle, hair color, facial appearance, or character styling from the mobile suit's associated pilot.\n\nPilot-inspired hairstyle, hair color, facial traits, or character styling must only be used when explicitly requested in PARAMETERS.\n\nWhen PARAMETERS explicitly specify hairstyle or hair color, follow those instructions exactly.\n\nWhen PARAMETERS are silent about hair, determine the hairstyle and hair color independently based primarily on:\n\n- the mobile suit's canonical armor colors\n- secondary and accent colors\n- armor silhouette\n- mechanical design language\n- overall visual atmosphere\n- gender and body presentation specified in PARAMETERS\n\nThe resulting hairstyle should visually complement the mobile suit itself rather than imitate or resemble its canonical pilot.\n\nDo not automatically make the anthropomorphized character resemble the pilot.\n\n\nFACE DIVERSITY RULE — Do not reuse a generic or recurring face across different mobile-suit anthropomorphizations.\n\nEvery mobile suit must receive an independently designed and visually distinctive human face.\n\nThe facial identity should harmonize with the mobile suit itself while remaining recognizably different from faces used for other mobile suits.\n\nNaturally vary facial characteristics between different designs, including:\n\n- overall face shape: oval, angular, heart-shaped, elongated, compact, softly rounded, or sharp\n- facial width and length\n- jawline shape and definition\n- chin width, length, and projection\n- cheekbone prominence\n- cheek fullness\n- eye size\n- eye shape\n- eye tilt\n- eye spacing\n- eyelid structure\n- eyebrow shape, angle, and thickness\n- nose bridge height and width\n- nose length and tip shape\n- lip shape and fullness\n- mouth width\n- apparent age within an adult range\n- facial maturity\n- resting expression\n- overall facial temperament\n\nDo not simply change hair while retaining the same underlying face.\n\nThe skull proportions, eyes, nose, lips, jawline, cheek structure, and overall facial geometry should meaningfully vary between different mobile-suit anthropomorphizations.\n\n\nMOBILE SUIT → FACE DESIGN RULE — When PARAMETERS do not explicitly define the face, derive an appropriate facial character primarily from the mobile suit's own visual design.\n\nConsider:\n\n- armor silhouette\n- mechanical design language\n- proportions\n- color palette\n- combat role\n- movement characteristics\n- transformation capability\n- visual aggressiveness or elegance\n- technological or stylistic atmosphere\n\nExamples of interpretation:\n\nAngular, aggressive, close-combat-oriented mobile suits may receive sharper facial geometry, narrower or more intense eyes, stronger eyebrows, and more defined jawlines.\n\nElegant, aerodynamic, or high-mobility mobile suits may receive finer facial structures, cleaner jawlines, elongated eyes, and more refined proportions.\n\nHeavy, rugged, heavily armed mobile suits may receive broader or more mature facial structures, stronger jaws, heavier brows, or more grounded facial proportions.\n\nUnusual transformable mobile suits may receive distinctive, slightly unconventional facial proportions or sharper structural characteristics reflecting their mechanical identity.\n\nThese are interpretive guidelines rather than fixed templates. Do not assign the same facial archetype to every mobile suit belonging to the same category.\n\n\nFACE / PILOT SEPARATION RULE — Facial identity must not automatically resemble the canonical pilot.\n\nDo not reproduce the pilot's:\n\n- face shape\n- eye shape\n- hairstyle\n- hair color\n- expression\n- recognizable facial characteristics\n\nunless explicitly requested in PARAMETERS.\n\nPilot resemblance is permitted only when PARAMETERS specifically request pilot-inspired appearance.\n\nOtherwise, the anthropomorphized character must be an original adult human interpretation of the mobile suit itself.\n\n\nFACE UNIQUENESS RULE — Avoid convergence toward a single conventionally attractive anime face.\n\nBeauty should not require identical facial geometry.\n\nFemale characters may remain glamorous and attractive while having substantially different:\n\n- facial proportions\n- jaw structures\n- eye geometry\n- noses\n- lips\n- cheekbones\n- maturity\n- expressions\n\nMale characters should likewise have distinct facial identities rather than sharing one generic handsome face.\n\nPreserve attractiveness where appropriate while prioritizing individual facial identity.\n\n\nAGE RULE — All anthropomorphized human characters are clearly adults.\n\nDo not generate childlike, adolescent, or ambiguously underage facial proportions.\n\nUse mature adult facial anatomy appropriate to the requested gender presentation and mobile suit design.\n\n\nFANTASY ELEMENT RULE — Do not add unrelated fantasy elements unless they are strongly supported by the mobile suit's canonical design or explicitly requested.\n\nAvoid arbitrary:\n\n- crowns\n- tiaras\n- angel wings\n- feathered wings\n- excessive gold filigree\n- ornamental jewelry\n- bridal styling\n- magical staffs\n- fantasy swords\n- generic fantasy armor\n\nunless such elements genuinely correspond to the source mobile suit.\n\n\nHUMANOID TRANSLATION RULE — The mobile suit's armor silhouette is translated into an elegant but mechanically recognizable humanoid form.\n\nPreserve important mechanical geometry rather than converting the design into generic fantasy clothing.\n\nUse:\n\n- angular armor plates\n- visible mechanical segmentation\n- layered armor construction\n- internal mechanical frames where appropriate\n- glowing sensor accents\n- mechanical joints and hardpoints\n- recognizable weapon mounting structures\n\nThese elements may be integrated into flowing robe-like, mantle-like, skirt-like, or body-contoured forms when appropriate, but the original mobile suit's mechanical identity must remain immediately obvious.\n\nRender exposed skin, hair, armor, fabric, and mechanical materials according to the selected ART STYLE. Do not introduce painterly brushwork unless the selected art style explicitly requests it.\n\n\nFIGURE RULE —\n\nIf the gender parameter is female:\n\n- glamorous adult feminine figure\n- graceful silhouette\n- body proportions may follow additional PARAMETERS\n- slightly revealing armor when appropriate\n- feminine but mechanically integrated armor\n- attractive adult facial appearance\n- expression chosen to fit the mobile suit's individual character\n\nIf the gender parameter is male:\n\n- lean or appropriately built adult masculine figure\n- fully armored unless PARAMETERS specify otherwise\n- heroic mechanical silhouette\n- masculine adult facial structure\n- expression chosen to fit the mobile suit's individual character\n\nGender determines body build and presentation but does not determine a fixed hairstyle, hair color, or recurring facial template.\n\nHair and facial identity follow explicit PARAMETERS first; when unspecified, they are independently inferred from the mobile suit's own visual design rather than from its pilot.\n\n\nCOMPOSITION — vertical 2:3 tall composition.\n\nFull figure centered.\n\nGenerous empty margin on both the left and right sides.\n\nSubject occupying roughly the center 65–70 percent of the width.\n\nEntire figure from crown to feet fully inside the frame.\n\nProvide clear headroom above the highest point of the head crest or hair and visible floor space beneath the feet.\n\nHead positioned in the upper center of the frame.\n\nFace and both eyes clearly visible and unobstructed.\n\nHair must not obscure important facial features.\n\nThe complete silhouette of the character should be readable at a glance.\n\n\nEQUIPMENT FRAMING RULE — Large backpacks, wings, binders, funnels, cannons, shields, rifles, swords, transformation structures, and other major attachments must remain completely inside the frame whenever reasonably possible.\n\nAdjust the relative scale of the character and camera distance as necessary so that important canonical equipment is not cropped.\n\nDo not enlarge the character so much that signature equipment extends outside the image.\n\nWhen a weapon is being held rather than stored, preserve the mechanically logical state of its corresponding storage mount and avoid duplicating the same weapon.\n\n\nLIGHTING / BACKGROUND —\n\nLighting and background treatment must follow the selected ART STYLE first.\n\nWhen the selected ART STYLE supports cinematic character lighting, a deep neutral background, controlled rim separation, and a soft key light may be used.\n\nWhen the selected ART STYLE instead calls for flat cel lighting, hand-painted animation lighting, photographic natural light, loose painterly value masses, paper-like negative space, ink wash, or another distinct treatment, use that treatment instead.\n\nDo not force cinematic rim lighting, dark studio backgrounds, bloom, photographic depth of field, physically based reflections, or PBR-style material response into an ART STYLE that does not call for them.\n\nMechanical parts must remain clearly readable and materially distinct, but reflections, speculars, texture, edge wear, shadow treatment, and micro-detail are expressed through the selected ART STYLE.\n\nKeep the face clearly readable while preserving the mobile suit's immediately recognizable mechanical identity.\n\n\nAVOID —\n\ncropped limbs,\ncut off at edges,\ncropped feet,\ncropped head crest,\ncropped backpack,\ncropped wings,\ncropped binders,\ncropped weapons,\nclose-up,\nportrait crop,\nbust shot,\nwide horizontal composition,\nbright background,\nwhite background,\ncluttered background,\nhair covering face,\nobscured eyes,\ntext,\nwatermark,\nmultiple characters,\nextra limbs,\nextra arms,\nextra legs,\nextra fingers,\nmalformed hands,\nduplicated equipment,\nduplicated weapons,\nfloating equipment,\nincorrect weapon mounting,\ngeneric Gundam armor replacing distinctive canonical structures,\nunrelated fantasy elements,\nautomatic pilot resemblance,\npilot-derived hairstyle unless explicitly requested,\npilot-derived face unless explicitly requested,\nrepeated face design,\nsame face as previous characters,\nrecycled facial identity,\ngeneric anime face,\ngeneric beautiful anime girl face,\ngeneric handsome anime male face,\nidentical facial proportions,\nidentical eye shape across characters,\nidentical nose across characters,\nidentical jawline across characters,\nsame facial geometry with different hair.\n\n\nPARAMETERS = [\ngender,\nmobile suit name,\nseries\n]";
  const ETHNIC_PART=[
    ['facial bone structure',['face shape','face length','face width','jaw & chin']],
    ['eye shape',['eye shape','eye size','eye tilt']],
    ['eyelid form',['eye shape','eye size','eye tilt']],
    ['nose bridge',['nose character']],
    ['lip shape',['lips']]
  ];
  const DEFAULT_STYLE='cinematic_semi_real';
  const MODE = { ANTHRO:'anthro', LIFESTYLE:'lifestyle' };
  const TRANSLATION_PROFILES = {
    more_human:
      'Prioritize adult human anatomy and a graceful, naturally humanized translation of the source mobile suit. ' +
      'Preserve its design language and identity, but adapt visible body armor freely so the figure reads as human first. ' +
      'Avoid literal one-to-one reconstruction of robot-body geometry onto the human form.',
    balanced:
      'Balance recognizable mechanical structure with human anatomy. ' +
      'Preserve more of the source armor language while still integrating it coherently into the humanoid body, ' +
      'so the figure reads as clearly human and clearly the source mobile suit at once.',
    more_mechanical:
      'Keep a stronger source armor presence and more explicit hard-surface structure across the body, ' +
      'while the figure still remains a humanoid anthropomorphization rather than a full robot body.'
  };
  const ANTHRO_STYLE_LOCK =
    '[STYLE LOCK]\n\n' +
    'The selected ART STYLE controls the rendering language of the entire image without exception: ' +
    'facial construction, skin, hair, armor, mechanical components, fabric, weapons, lighting, background treatment, ' +
    'edge handling, shading, reflections, speculars, texture, and detail density. ' +
    /* 위 문장이 얼굴까지 화풍의 권한이라고 선언하므로, 그 한계도 같은 자리에서 긋는다.
       다른 블록에 적으면 두 블록이 서로 다른 말을 하고 모델이 하나를 고른다. */
    'It governs how the face is rendered, not who the face is: it must not redesign the underlying ' +
    'facial geometry, facial proportions, or character identity specified in PARAMETERS. ' +
    'Common instructions elsewhere in this prompt define subject matter, composition, mechanical identity, and equipment structure only; ' +
    'they must not introduce a different rendering language. ' +
    'Mechanical complexity controls WHAT is depicted, not HOW realistically it is rendered. ' +
    'Mechanical parts must not default to CGI or PBR rendering unless the selected ART STYLE itself explicitly calls for it. ' +
    'If any common instruction conflicts with the selected ART STYLE, the selected ART STYLE wins.';

  /* 나이·인상·가슴 장갑 관련 고정 문구. 설정 값 차례를 정하는 쪽에서 쓴다 */
  const CUTE_SET={'cute':1,'doll-like':1,'innocent':1,'cheerful':1};
  const CUTE_LOCK='the {C} impression comes from expression, eye shape, and overall softness, not from youth; '+
    'the character remains a clearly adult woman or man with adult facial proportions and an adult body — '+
    'never a child, teenager, or underage appearance';
  const YOUTHFUL_LOCK='a clearly adult woman or man in their twenties with a youthful, soft-featured baby face; rounder cheeks, larger eyes, and a softer jawline than the standard adult face, while body proportions, height, and overall presence remain unmistakably those of a grown adult; never a child, teenager, or underage appearance';
  const UNDERBOOB_NEG='no fully covered lower breast, no simple abdomen gap, no detached breast cups, no floating armor, no exposed cleavage-only design';
  const UNDERBOOB_POS='the chest armor ends slightly above the natural inframammary fold, revealing a narrow crescent of the lower breast on both sides; the exposed underboob must be directly continuous with the breast contour, not a separate cutout or gap; nipples and areola remain fully covered; the armor hugs the upper and outer breast naturally and transitions smoothly into the sternum sensor and side armor';

  /* ══ 파라미터 도식 ══
     체형은 어깨·가슴·허리·골반 반폭(px)과 키·굵기 배율로,
     헤어는 길이단계·질감·볼륨·묶음코드로 그린다. 손으로 그리지 않아야
     옵션끼리 폭 차이가 그대로 비교된다. */
  const BODY_FIG={
    'slender':[18,16,11,17,1.00,.85,'가늘고 굴곡이 완만한 체형. 어깨와 골반 폭이 비슷하고 전체적으로 얇다.'],
    'athletic':[22,18,14,19,1.00,1.00,'어깨가 적당히 넓고 허리가 단단한 운동형. 굴곡보다 균형이 먼저 보인다.'],
    'curvy':[19,22,13,25,1.00,1.00,'가슴과 골반이 허리보다 확실히 넓은 곡선형.'],
    'glamorous':[20,25,13,26,1.02,1.00,'굴곡이 크고 화려한 체형. curvy보다 상하체 볼륨이 한 단계 더 크다.'],
    'muscular':[26,22,18,22,1.00,1.20,'근육량이 뚜렷해 어깨와 사지가 굵다. 허리도 얇지 않다.'],
    'heavy-built':[26,25,25,26,0.98,1.25,'상하체가 고르게 두껍고 묵직한 중후한 체격.'],
    'tall and lean':[19,16,12,17,1.12,.85,'키가 크면서 폭은 좁다. slender를 세로로 늘린 형태.'],
    'petite':[17,17,12,18,0.86,.95,'키가 작고 전체 비율이 아담하다. 폭은 평균이라 마른 인상은 아니다.'],
    'hourglass':[20,23,12,23,1.00,1.00,'가슴과 골반 폭이 같고 허리만 크게 들어간 모래시계형.'],
    'voluptuous':[20,27,15,28,1.00,1.10,'가슴·골반 볼륨이 가장 큰 육감형. 허리는 상대적으로만 얇다.'],
    'toned':[21,18,13,19,1.00,.95,'군살 없이 잔근육이 잡힌 체형. muscular보다 가늘고 선이 곱다.'],
    'wiry':[18,15,11,15,1.00,.80,'얇지만 단단한 체형. 굴곡이 거의 없고 힘줄이 도드라진다.'],
    'soft-figured':[21,23,22,25,0.98,1.15,'허리 굴곡이 적고 전체적으로 부드럽게 살집이 있다.'],
    'pear-shaped':[17,17,14,26,1.00,1.05,'상체는 좁고 골반·허벅지에 무게가 실린 형태.'],
    'inverted triangle':[26,21,14,17,1.00,1.00,'어깨가 가장 넓고 아래로 갈수록 좁아진다. pear의 반대.'],
    'stocky':[24,22,21,23,0.88,1.20,'키는 작고 폭은 넓은 다부진 체격.'],
    'statuesque':[22,21,14,22,1.15,1.00,'장신에 골격이 당당한 조각상 같은 체형.']
  };
  /* [길이단계, 질감, 볼륨, 묶음코드, 앞머리, 설명] */
  const HAIR_FIG={
    'bob':[1,'straight',2,'','blunt','턱선 근처에서 일자로 떨어지는 단정한 길이.'],
    'pixie cut':[0,'straight',1,'','wispy','귀와 목덜미가 드러나는 아주 짧은 컷.'],
    'layered':[2,'wavy',4,'','side','층을 내 끝으로 갈수록 가벼워지는 컷.'],
    'ponytail':[3,'straight',2,'mid','side','뒤로 모아 한 갈래로 묶은 기본형.'],
    'twin tail':[3,'straight',2,'twin','blunt','좌우 높은 위치에서 두 갈래로 묶는다.'],
    'wolf cut':[2,'wavy',6,'','wispy','윗머리는 짧고 아랫머리는 길어 층감이 강하다.'],
    'slicked back':[1,'flat',0,'','none','이마를 완전히 드러내고 뒤로 붙여 넘긴 스타일.'],
    'wavy':[3,'wavy',4,'','side','전체가 완만한 S자 웨이브.'],
    'straight':[3,'straight',2,'','blunt','굴곡 없이 곧게 떨어지는 생머리.'],
    'side ponytail':[2,'straight',2,'sidetail','side','한쪽 어깨로 넘겨 묶는다.'],
    'high ponytail':[3,'straight',2,'high','wispy','정수리 가까이 높게 묶어 얼굴선이 당겨진다.'],
    'braid':[4,'braid',2,'mid','side','뒤로 한 갈래 땋아 내린다.'],
    'twin braids':[4,'braid',2,'twin','blunt','좌우로 나눠 두 갈래로 땋는다.'],
    'crown braid':[0,'braid',3,'crown','none','머리를 둘러 땋아 왕관처럼 올린다.'],
    'chignon':[0,'straight',2,'lowbun','side','목덜미에 매끈하게 말아 붙인 단정한 번.'],
    'messy bun':[0,'wavy',4,'midbun','wispy','대충 올려 묶어 잔머리가 빠져나온 번.'],
    'top knot':[0,'straight',2,'topbun','none','정수리에 높이 올려 묶은 번.'],
    'low bun':[0,'straight',2,'lowbun','blunt','목덜미 낮은 위치의 번. 시뇽보다 느슨하다.'],
    'half-up':[3,'straight',3,'half','side','윗머리만 묶고 아랫머리는 내린다.'],
    'space buns':[0,'straight',2,'twinbun','blunt','양쪽에 동그란 번을 두 개 만든다.'],
    'hime cut':[4,'straight',3,'','hime','일자 앞머리 + 얼굴 옆 사이드를 턱선에서 자른 형태.'],
    'asymmetric cut':[2,'asym',3,'','side','좌우 길이가 확연히 다른 비대칭컷.'],
    'undercut':[1,'straight',2,'','side','옆과 뒤를 짧게 밀고 윗머리만 남긴다.'],
    'side-shaved long hair':[3,'shave',3,'','side','한쪽만 밀고 나머지는 길게 남긴다.'],
    'curly':[2,'curly',6,'','wispy','굵고 탄력 있는 곱슬. 옆 볼륨이 크다.'],
    'tight curls':[1,'coily',8,'','none','잔곱슬이 둥글게 부풀어 오른 형태.'],
    'locs':[3,'locs',3,'','none','가닥이 굵게 뭉쳐 늘어지는 로크스.'],
    'ringlet curls':[3,'ringlet',4,'','side','세로로 말린 드릴 형태의 컬.'],
    'finger waves':[1,'fwave',2,'','none','머리에 붙은 얕은 물결의 레트로 웨이브.'],
    'feathered':[2,'wavy',4,'','side','끝을 가볍게 쳐서 바깥으로 흐르게 한 컷.'],
    'blunt cut':[2,'straight',2,'','blunt','끝을 층 없이 일자로 자른 컷.'],
    'wet-look slick':[2,'flat',1,'','none','젖은 듯 광이 나게 붙여 넘긴 스타일.'],
    'windswept':[2,'wind',4,'','wispy','한쪽으로 바람에 날린 듯한 흐름.']
  };

  Object.assign(BODY_FIG,{
    'broad-shouldered':[28,22,17,20,1.02,1.05,'어깨가 가장 넓고 아래로 갈수록 좁아진다. 상체 인상이 지배적이다.'],
    'burly':[27,26,24,25,1.05,1.30,'키도 크고 폭도 넓은 거구. heavy-built보다 한 단계 더 크다.'],
    'lanky':[19,17,14,17,1.14,.80,'키는 크고 살은 거의 없다. 팔다리가 유난히 길어 보인다.'],
    'barrel-chested':[25,27,23,23,0.98,1.20,'흉곽이 통처럼 앞뒤로 두껍다. 어깨보다 가슴이 먼저 보인다.'],
    'rangy':[23,20,15,19,1.08,.95,'길고 유연한 근육질. muscular보다 가늘고 움직임이 가벼워 보인다.']
  });
  Object.assign(HAIR_FIG,{
    'buzz cut':[0,'flat',0,'','none','두피가 비칠 만큼 짧게 민 머리.'],
    'crew cut':[0,'straight',1,'','none','윗머리만 조금 남긴 짧고 단정한 컷.'],
    'side part':[1,'straight',2,'','side','가르마를 타 한쪽으로 넘긴 단정한 컷.'],
    'fade':[0,'shave',1,'','none','옆과 뒤를 위로 갈수록 길어지게 친 그라데이션 컷.'],
    'man bun':[0,'straight',2,'lowbun','none','뒤로 모아 작게 묶어 올린 번.'],
    'swept back':[1,'wind',3,'','none','이마를 드러내고 뒤로 넘겨 볼륨을 준 스타일.'],
    'shaggy':[2,'wavy',5,'','wispy','층 없이 덥수룩하게 흐트러진 컷.'],
    'mullet':[2,'asym',2,'','blunt','앞과 옆은 짧고 뒤만 길게 남긴 컷.']
  });

  /* 성별 전용 값(ONLY), 색 표, 설정 묶음 차례. 화면이 항목을 그릴 때 쓴다 */
  const GROUP_META=[["base", "기본", "기체 해석의 큰 방향을 정한다", true], ["build", "체형", "Body Type 이 전체 실루엣을 정하고, 아래 항목이 그 안에서 조정한다", true], ["face", "얼굴", "Facial Character 가 전체 인상을 정하고, 아래 항목이 세부를 잡는다", true], ["hair", "머리", "Hairstyle 이 형태를 정하고, 길이와 앞머리가 그 안에서 조정한다", true], ["armor", "장갑 · 의장", "원기체 구조를 어디까지 인간 형태로 옮길지", false], ["shot", "연출", "포즈 · 시점 · 장비 강조처럼 그림의 찍는 방식", false]];
  const ONLY={
    'facial character':{'glamorous':'female','rugged':'male','weathered':'male','soft':'female'},
    'torso / chest build':{'full':'female','full bust':'female','powerful':'male','v-taper':'male'},
    'waist / hip silhouette':{'hourglass':'female','curvy':'female','broad-hipped':'female','narrow-hipped':'male'},
    'armor coverage':{'open':'female'},
    'lower-body treatment':{'robe-like armor':'female','mantle-like armor':'female'},
    'hair length':{'very long':'female'},
    'body type':{'curvy':'female','glamorous':'female','hourglass':'female','voluptuous':'female',
      'pear-shaped':'female','soft-figured':'female','petite':'female',
      'broad-shouldered':'male','burly':'male','lanky':'male','barrel-chested':'male','rangy':'male'},
    'hairstyle':{'twin tail':'female','twin braids':'female','space buns':'female','hime cut':'female',
      'ringlet curls':'female','crown braid':'female','chignon':'female','finger waves':'female',
      'buzz cut':'male','crew cut':'male','side part':'male','fade':'male','man bun':'male',
      'swept back':'male','shaggy':'male','mullet':'male'}
  };
  const COLOR_HEX={
    white:'#F2F2F2',platinum:'#E4E6EA',silver:'#C8CCD2','ash blonde':'#C9BBA0',blonde:'#E3C574',
    gold:'#D8A72B',amber:'#C87E24',orange:'#D97524',red:'#C0392B',crimson:'#8E1B2B',
    pink:'#E08AA8',purple:'#7E5AA8',lavender:'#B9A6DE','pale blue':'#9EC7E8',blue:'#2F6FD0',
    navy:'#1E3A6E',teal:'#1F8A8A',mint:'#7FD8C0',green:'#2E9E5B',brown:'#7A5230',
    gray:'#8A8F98',black:'#14161A'
  };
  const COLOR_KEYS={'hair color':1,'eye color':1,'second eye color':1};

  /* 일상컷(단일·콜라주)에 쓰는 고정 문구·목록 */
  const LOCAL_AXES=['overall_intensity','skin_exposure','action_level','source_influence','separates_preference'];
  const PAIR_ONLY=['pair_gap'];
  const ADV_EN={
    overall_intensity:'Overall sensual intensity',
    pair_gap:'Pair intensity gap',
    outfit_variety:'Outfit variety',
    scene_variety:'Scene variety',
    pose_variety:'Pose variety',
    camera_variety:'Camera variety',
    skin_exposure:'Visible non-intimate skin exposure',
    separates_preference:'Separates preference',
    action_level:'Action balance',
    direct_gaze_limit:'Maximum direct-camera gazes',
    smile_limit:'Maximum obvious smiles',
    unexpected_cuts:'Minimum unexpected coherent cuts',
    source_influence:'SOURCE influence outside source-editorial panels'
  };
  const TRAD_EX={burkini_modest:1,sarong_wrap:1,yukata_poolside:1,heritage_pattern_swim:1,
    onsen_after:1,hanbok_coverup:1,juban_inspired:1,hanbok_slip:1,qipao_silk_set:1,
    embroidered_corset:1,kebaya_lace:1,sari_blouse_set:1,hanbok_errand:1,festival_daily:1,
    heritage_evening:1,tea_ceremony_night:1,heritage_couture:1};
  const CARRY_FACE=[
    ['facial ethnicity','ethnicity'],
    ['apparent age','apparent age'],
    ['facial character','facial impression'],
    ['face shape','face shape'],
    ['eye shape','eye shape'],
    ['eye color','eye color'],
    ['second eye color','second eye color'],
    ['skin tone','skin tone'],
    ['hair color','hair color'],
    ['hair length','hair length'],
    ['hairstyle','hairstyle'],
    ['bangs','bangs'],
    ['facial hair','facial hair'],
    ['face length','face length'],
    ['face width','face width'],
    ['jaw & chin','jaw & chin'],
    ['eye size','eye size'],
    ['eye tilt','eye tilt'],
    ['nose character','nose character'],
    ['lips','lips'],
    ['hair texture','hair texture'],
    ['hair volume','hair volume'],
    ['parting','parting']
  ];
  const CARRY_BODY=[
    ['body type','body type'],
    ['height impression','height impression'],
    ['torso / chest build','torso / chest build'],
    ['waist / hip silhouette','waist / hip silhouette'],
    ['leg proportion','leg proportion'],
    ['shoulder build','shoulder build'],
    ['torso length','torso length'],
    ['lower-body build','lower-body build'],
    ['body measurements (B/W/H)','body measurements (B/W/H)']
  ];
  const LIFESTYLE_REFERENCE_LOCK_BASE =
    '[LIFESTYLE REFERENCE LOCK]\n\n' +
    'The attached character image is authoritative for the character\'s visible appearance and equipment state in this image. ' +
    'The source mobile suit name above is identity-origin metadata only and must not be used to reconstruct, restore, or invent mobile-suit equipment. ' +
    'Lifestyle may retain small, non-functional, identity-defining accessories from the character reference when they read as wearable ornament rather than active mobile-suit equipment. ' +
    'Do not retain or reconstruct functional armor, weapons, shields, backpacks, binders, thrusters, mechanical limbs, or other combat/mechanical equipment. ' +
    'Canonical mobile-suit equipment that is absent from the attached character reference must remain absent. ' +
    'For civilian, casual, homewear, swimwear, activewear, fashion, and other lifestyle scenes, translate only the character\'s established human identity into the requested scene \u2014 do not revert the character toward {POSS} original mobile-suit form.' +
    /* 얼굴 크롭과 전신을 같이 붙이면 어느 쪽이 얼굴의 기준인지 알려 줘야 한다.
       조건문이라 한 장만 붙였을 때는 발동하지 않는다 — 장수를 세는 UI 가 필요 없다. */
    '\n\nIf multiple reference images of the same character are attached: '+
    'use the clearest face close-up as the primary facial identity anchor; '+
    'use the full-character reference as the primary authority for body proportions, hairstyle, overall appearance, and visible equipment state; '+
    'use any remaining references only to resolve details that are unclear or occluded. '+
    'Do not average the references into a new face. '+
    'All attached references depict the same character and must resolve toward one identity.';
  const LIFESTYLE_STYLE_LOCK =
    '[STYLE LOCK]\n\n' +
    'The selected ART STYLE controls the rendering language of the entire image: ' +
    'facial construction, skin, hair, clothing, fabric, props, lighting, background treatment, ' +
    'edge handling, shading, reflections, speculars, texture, and detail density. ' +
    'It governs HOW the scene is rendered only \u2014 it must not redesign, reconstruct, or reintroduce the source mobile suit\'s armor, weapons, shield, backpack, mechanical limbs, or other canonical equipment. ' +
    'It must not redesign the underlying facial geometry, facial proportions, or character identity established by the attached reference and by this prompt. ' +
    'The attached character reference controls visible character identity and visible equipment state. ' +
    'If any common instruction conflicts with the selected ART STYLE, the selected ART STYLE wins for rendering language only.';

  root.AtelierSpec = {
    PARAM_DEFS: PARAM_DEFS,
    CATS: CATS,
    PRESETS: PRESETS,
    ADVANCED_OPTIONS: ADVANCED_OPTIONS,
    ADVANCED_LABELS: ADVANCED_LABELS,
    RANDOM_POOL: RANDOM_POOL,
    EXAMPLE_MAP: EXAMPLE_MAP,
    GROUP_LABELS: GROUP_LABELS,
    EXPRESSION_DETAIL: EXPRESSION_DETAIL,
    EXPRESSION_OPTIONS: EXPRESSION_OPTIONS,
    ORIENTATION_OPTIONS: ORIENTATION_OPTIONS,
    POSE_OPTIONS: POSE_OPTIONS,
    EX_NOTE: EX_NOTE,
    CAT_KO: CAT_KO,
    ADV_AXIS: ADV_AXIS,
    ADV_VAL: ADV_VAL,
    RANDOM_MODES: RANDOM_MODES,
    NAME_RULES: NAME_RULES,
    ART_STYLES: ART_STYLES,
    STYLE_CORES: STYLE_CORES,
    ANTHRO_STYLE_EXTENSIONS: ANTHRO_STYLE_EXTENSIONS,
    LIFESTYLE_STYLE_EXTENSIONS: LIFESTYLE_STYLE_EXTENSIONS,
    MORPHOLOGY_COMMON: MORPHOLOGY_COMMON,
    SOURCE_ARM_MAPPING: SOURCE_ARM_MAPPING,
    UPPER_LIMB_TOPOLOGY_LOCK: UPPER_LIMB_TOPOLOGY_LOCK,
    LIMB_OWNERSHIP_LOCK: LIMB_OWNERSHIP_LOCK,
    AGGRESSIVE_MORPHOLOGY_CORE: AGGRESSIVE_MORPHOLOGY_CORE,
    AGGRESSIVE_SHOULDER_GUARD: AGGRESSIVE_SHOULDER_GUARD,
    AGGRESSIVE_SHOULDER_JOINT_ANCHOR: AGGRESSIVE_SHOULDER_JOINT_ANCHOR,
    AGGRESSIVE_MASS_REDISTRIBUTION: AGGRESSIVE_MASS_REDISTRIBUTION,
    AGGRESSIVE_SILHOUETTE_FIDELITY: AGGRESSIVE_SILHOUETTE_FIDELITY,
    SOURCE_ARM_OWNERSHIP_MAPPING: SOURCE_ARM_OWNERSHIP_MAPPING,
    MORPHOLOGY_PRECEDENCE: MORPHOLOGY_PRECEDENCE,
    MORPHOLOGY_PROFILES: MORPHOLOGY_PROFILES,
    STYLE_PROFILES: STYLE_PROFILES,
    templateC: templateC,
    ETHNIC_PART: ETHNIC_PART,
    DEFAULT_STYLE: DEFAULT_STYLE,
    MODE: MODE,
    TRANSLATION_PROFILES: TRANSLATION_PROFILES,
    ANTHRO_STYLE_LOCK: ANTHRO_STYLE_LOCK,
    CUTE_SET: CUTE_SET,
    CUTE_LOCK: CUTE_LOCK,
    YOUTHFUL_LOCK: YOUTHFUL_LOCK,
    UNDERBOOB_NEG: UNDERBOOB_NEG,
    UNDERBOOB_POS: UNDERBOOB_POS,
    BODY_FIG: BODY_FIG,
    HAIR_FIG: HAIR_FIG,
    GROUP_META: GROUP_META,
    ONLY: ONLY,
    COLOR_HEX: COLOR_HEX,
    COLOR_KEYS: COLOR_KEYS,
    LOCAL_AXES: LOCAL_AXES,
    PAIR_ONLY: PAIR_ONLY,
    ADV_EN: ADV_EN,
    TRAD_EX: TRAD_EX,
    CARRY_FACE: CARRY_FACE,
    CARRY_BODY: CARRY_BODY,
    LIFESTYLE_REFERENCE_LOCK_BASE: LIFESTYLE_REFERENCE_LOCK_BASE,
    LIFESTYLE_STYLE_LOCK: LIFESTYLE_STYLE_LOCK
  };
})(window);
