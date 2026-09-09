# 체형 · 외모 설정 패치안 검토

제안서 두 건을 툴킷(`prompt.html`) 실제 코드에 맞춰 본 결과다.
반론(`PROMPT_SPEC_REVIEW_FINAL_RECOMMENDATION.md`)을 받아 §4·§5 를 개정했다.

- `gundam_prompt_body_proportion_spec_patch.md` — 신체 치수 · 체형 비율
- `gundam_prompt_face_appearance_spec_patch.md` — 얼굴 구조 · 인상 · 머리

두 제안서 모두 코드를 보지 않고 쓰인 것으로 보인다. 진단은 대체로 맞지만,
**제안한 것의 상당 부분이 이미 구현되어 있고**, 몇 군데는 현재 구조와 정면으로
부딪힌다. 아래는 먼저 구조를 설명하고, 그 위에서 제안을 항목별로 판정한 것이다.

---

# 1. 먼저 알아야 할 구조

## 1.1 툴킷이 만드는 것

`prompt.html` 은 이미지 생성 모델에 넣을 **텍스트 프롬프트를 조립하는 도구**다.
출력이 세 갈래다.

| 모드 | 무엇을 만드나 | 조립 함수 |
|---|---|---|
| **의인화(ANTHRO)** | 기체를 사람으로 옮긴 한 장 | `buildAnthroPrompt()` |
| **콜라주(LIFESTYLE)** | 같은 인물의 일상컷 6 분할 | `buildCollagePrompt()` |
| **단일컷(LIFESTYLE)** | 일상컷 한 장 | `buildSinglePrompt()` |

제안서가 말한 `buildLifestylePrompt()` 는 없다. 생활컷은 콜라주와 단일컷 둘로
나뉘어 있고, 둘이 블록을 상당 부분 공유한다.

## 1.2 파라미터는 데이터다 — `PARAM_DEFS`

사용자가 고르는 설정은 UI 에 하드코딩되어 있지 않다. `PARAM_DEFS` 라는 배열
하나가 전부이고, 화면은 그걸 보고 그려진다. 항목 하나는 이렇게 생겼다.

```js
{
  key: 'eye shape',            // 프롬프트에 나갈 이름
  label: 'Eye Shape',
  ko: '눈매',
  options: [['', 'AUTO — 자동 결정'],
            ['almond', 'Almond — 아몬드형 눈'],
            ['upturned', 'Upturned — 끝이 올라간 눈'],
            ['__custom__', '직접 입력…']],
  group: 'face',               // 접이식 묶음
  sub: 'facial character'      // 이 항목의 부모
}
```

**항목을 추가하려면 이 배열에 한 덩이를 더하면 된다.** UI 코드도 저장 코드도
프롬프트 조립 코드도 건드릴 필요가 없다.

## 1.3 화면은 이미 2 단으로 접혀 있다

제안서들이 "항목이 너무 많아지지 않게 하라"고 걱정한 부분은 이미 해결되어 있다.

- `group` 이 여섯 개의 접이식 묶음을 만든다 — 기본 · 체형 · 얼굴 · 머리 ·
  장갑/의장(기본 닫힘) · 연출(기본 닫힘)
- `sub` 를 달면 부모 카드 밑에 *"위 **Body Type** 안에서 조정"* 으로 들어간다

지금 30 개 중 15 개가 이미 하위 항목이다.

```
body type ─┬ height impression        facial character ─┬ face shape
           ├ shoulder build                             ├ eye shape
           ├ torso / chest build                        ├ eye color
           ├ waist / hip silhouette                     ├ second eye color
           └ leg proportion                             └ expression

hairstyle ─┬ hair length              armor coverage ─┬ lower-body treatment
           ├ bangs                                    └ head crest integration
           └ hair accent
```

**여섯 묶음 안에 최상위 15 · 하위 15 로 나뉜다.** 하위는 부모 카드 안에 들어가
있고, 장갑 · 연출 두 묶음은 아예 닫힌 채로 시작한다. 그래서 하위 항목을 하나 더
다는 UI 비용은 거의 없다 — 최상위를 늘리는 것과는 무게가 다르다.

| 묶음 | 최상위 | 하위 |
|---|---|---|
| 기본 | 3 | 0 |
| 체형 | 1 (`body type`) | 5 |
| 얼굴 | 3 | 5 |
| 머리 | 2 | 3 |
| 장갑 · 의장 (닫힘) | 1 | 2 |
| 연출 (닫힘) | 5 | 0 |
| **합** | **15** | **15** |

> 다만 **중첩은 한 단만 지원한다.** 렌더러가 `subs.filter(x => x.sub === d.key)`
> 로 한 번만 파기 때문에, `face shape` 밑에 또 하위를 달면 화면에 안 나온다.

## 1.4 값이 프롬프트로 가는 길

고른 값들은 `getParamValues()` 가 모아 의인화 프롬프트의 `PARAMETERS` 목록이
된다. **비운 항목은 아예 안 나간다.**

```
PARAMETERS = [
gender: female,
mobile suit name: 건담 데스사이즈,
series: 건담 W,
body type: slender,
eye shape: almond,
...
]
```

## 1.5 부모·자식 우선순위 문장이 자동으로 붙는다 ← 중요

부모와 그 하위를 **둘 다** 골랐을 때, 코드가 문장을 하나 자동으로 덧붙인다.

```
parameter precedence: body type, facial character define the overall direction;
the other, finer entries in this list adjust within that direction and
must not override or contradict it. Where a finer entry appears to conflict,
keep the overall direction and apply the finer entry only as a mild adjustment
```

**부모가 이기고 자식은 미세 조정**이라는 규칙이다. 이 문장이 얼굴 제안서와
정면으로 부딪힌다(§4 에서 다룬다).

## 1.6 모드 사이로 정체성을 넘기는 장치 — `CARRY_FACE` / `CARRY_BODY`

의인화에서 잡은 얼굴·체형 설정을 생활컷으로 넘기는 기능이 이미 있다.
체크박스 두 개(얼굴 넘기기 / 체형 넘기기)로 켜면 `carryBlock()` 이
`[CHARACTER IDENTITY SPEC]` 블록을 만들어 콜라주·단일컷 프롬프트에 끼워 넣는다.

- `CARRY_FACE` 12 개 — ethnicity, apparent age, facial impression, face shape,
  eye shape, eye color, skin tone, hair color, hair length, hairstyle, bangs, facial hair
- `CARRY_BODY` 6 개 — body type, height impression, torso/chest build,
  waist/hip silhouette, leg proportion, shoulder build

블록 안에는 참조 이미지와의 우선순위 문장도 이미 들어 있다.

> The attached image remains the primary reference. … including body proportions
> that the mobile-suit armor in the reference image may obscure … Where the image
> and this list clearly disagree, **follow the image**.

## 1.7 지켜야 하는 제약

- `QA_BASELINE.md` 가 **11 개 화풍의 현재 출력을 회귀 기준선으로 못 박아** 두었다.
  "잘 나오는 화풍은 건드리지 않는다. COMMON 은 마지막 수단이다" 가 명시된 원칙이다.
- 두 제안서 모두 **기존 사용자가 아무것도 안 바꾸면 결과가 그대로여야 한다**고
  요구한다(체형안 §12·§13-A). 새 항목을 비웠을 때 프롬프트가 한 글자도 안 바뀌어야
  한다는 뜻이다.

---

# 2. 체형 제안서 판정

## 2.1 이미 있는 것

제안서의 "필수 유지" 일곱 가지는 전부 있다. 다만 이름과 쪼갠 방식이 다르다.

| 제안서 | 실제 파라미터 | 선택지 |
|---|---|---|
| Height | `height impression` | short · average · tall · very tall |
| Physique | `body type` | slender · athletic · curvy · glamorous · hourglass … 24 |
| Shoulder Width | `shoulder build` | narrow · average · broad |
| Bust | `torso / chest build` | slim · balanced · full · v-taper · full bust |
| Waist + Hips | `waist / hip silhouette` | straight · hourglass · curvy · narrow-hipped … |
| Leg Proportion | `leg proportion` | balanced · long · very long · powerful |

§5(책임 분리)와 §6·§10(참조 이미지 우선순위, 생활컷 전달)도 `CARRY_BODY` +
`carryBlock()` 으로 이미 구현되어 있다. 이름만 `[BODY PROPORTION SPEC]` 이 아니라
`[CHARACTER IDENTITY SPEC]` 이다.

§11.3(화풍에 체형 규칙을 넣지 말 것)도 이미 지켜지고 있다. 11 개 화풍 프로파일을
훑어 체형 규칙이 들어간 곳은 없다.

## 2.2 진짜 새로운 것 — 셋

- **Lower-body Build**(허벅지 · 하체 굵기). `lower-body treatment` 가 있지만
  그건 *장갑 구조*라 다른 축이다.
- **B/W/H cm** 자유 입력.
- **숫자를 절대 치수로 읽지 말라는 가드 문구.**

## 2.3 이름 충돌

제안서의 `Torso Proportion`(몸통 **길이**)은 기존 `torso / chest build`
(흉곽 **인상**)와 이름이 겹친다. 축이 다르므로 `torso length` 로 부르는 게 낫다.

## 2.4 제안서 안에서 서로 부딪히는 곳

§3·§9 는 체형 파라미터 여섯을 `PARAMETERS` 에서 **빼내** 별도
`[BODY PROPORTION SPEC]` 블록으로 옮기라고 한다. 그런데 §12·§13-A 는
**기존 프롬프트가 바뀌면 안 된다**고 한다.

여섯을 옮기면 기존 의인화 프롬프트가 전부 바뀐다. `QA_BASELINE.md` 의 화풍
기준선도 같이 무효가 된다. 두 요구를 동시에 만족할 수 없다.

---

# 3. 얼굴 제안서 판정

## 3.1 진단은 맞다

| 제안서 진단 | 확인 |
|---|---|
| §1-1 `facial impression` 권한이 크다 | **맞음.** `facial character` 24 개가 elegant · cute · innocent · doll-like 같은 인상어인데, 구조 항목의 **부모**로 앉아 있다 |
| §1-2 `face shape` 가 뭉뚱그려짐 | **맞음.** oval · angular · heart-shaped · softly rounded 등 9 개뿐. 길이인지 폭인지 턱인지 구분이 없다 |
| §1-3 `eye shape` 책임 불명확 | **맞음.** narrow · almond · large · sharp · drooping · upturned 8 개 |

## 3.2 사실과 다른 것

**§1-5 "hair 가 한 덩어리" 는 아니다.** 이미 다섯으로 나뉘어 있다 —
`hair color`(21) · `hairstyle`(43) · `hair length`(7) · `bangs`(11) ·
`hair accent`(7). 제안서의 HAIR SPEC 9 항목 중 다섯은 이미 있고, 새로운 것은
`hair texture` · `hair volume` · `parting` · `secondary hair color` ·
`face-framing` 정도다.

**§11 "일상컷에서 효과가 크다" 의 통로도 이미 있다.** `CARRY_FACE` 가 얼굴
파라미터 12 개를 생활컷으로 넘긴다.

## 3.3 진짜 구멍 — 둘

**§10 보호 문장이 반쪽만 있다.** 현재 COMMON 에는 한 방향만 있다.

> Common instructions … **must not introduce a different rendering language.**
> — 다른 지시가 화풍을 침범하지 말라

그 반대 방향, 즉 **화풍이 얼굴 구조를 재설계하지 말라**는 규칙은 일부 화풍에만
산발적으로 있다(`Retain the individual facial identity specified by PARAMETERS.`).
**비용 대비 값이 가장 크다.** 어디에 넣을지는 §5.1② 에서 정한다 — COMMON 도
`[IDENTITY LOCK]` 도 아니고 `[STYLE LOCK]` 이다.

**§12 `[REFERENCE ROLE]` 은 아예 없다.** 얼굴 크롭과 전신을 같이 붙였을 때
어느 쪽이 얼굴 앵커인지 정하는 규칙이 없다.

---

# 4. 가장 중요한 충돌 — `sub` 가 두 가지 일을 겸한다

## 4.1 문제

얼굴 제안서 §9 의 핵심 주장은 "인상은 얼굴 구조를 덮어쓰지 못한다" 인데,
현재 코드는 정확히 반대로 되어 있다.

1. `face shape` · `eye shape` · `eye color` · `second eye color` · `expression`
   이 전부 `sub: 'facial character'` 로 **인상의 하위**에 달려 있다.
2. §1.5 의 자동 문장이 **부모가 이긴다**고 명시한다.

원인은 `sub` 하나가 두 가지를 동시에 맡고 있기 때문이다.

```
sub = ① 화면에서 어느 카드 밑에 놓을지
    + ② 프롬프트에서 누가 우선인지
```

①은 지금 배치가 자연스럽다 — 인상을 먼저 고르고 세부를 잡는 흐름. ②는 아니다.
특히 **`eye color` 까지 인상의 하위 의미로 취급하는 것은 말이 안 된다.**
"인상이 방향을 정하니 눈동자 색은 그것과 모순되면 안 된다" 는 문장이 지금
자동으로 붙고 있다.

## 4.2 해법 — 둘을 떼어 놓는다

UI 계층은 그대로 두고, **얼굴 구조에 한해서만** 의미 우선순위를 분리한다.
메타데이터를 바꿀 것 없이 열쇠 목록 하나면 된다.

```js
const FACE_GEOMETRY_KEYS = [
  'face shape', 'face length', 'face width', 'jaw & chin',
  'eye shape', 'eye size', 'eye tilt', 'nose character', 'lips'
];
```

- 이 열쇠들은 자동 precedence 문장에서 "미세 조정" 쪽으로 묶지 않는다.
  대신 **구조가 인상보다 우선**이라는 문장을 따로 붙인다.
- `eye color` · `second eye color` · `expression` 은 여기 **넣지 않는다.**
  구조가 아니라 색 · 표정 축이라 인상과 우열을 다툴 것이 없다. 지금처럼
  묶어서 "인상을 거스르지 말라"고 말하는 쪽이 오히려 틀렸으므로, 이들은
  precedence 문장 자체에서 빼는 편이 낫다.
- **얼굴 밖(체형 · 머리 · 장갑)의 부모·자식 우선순위는 건드리지 않는다.**
  `body type` 이 방향을 정하고 세부가 조정하는 것은 지금이 맞다.

## 4.3 얼굴 의미 우선순위

```
참조 이미지
  ↓
명시된 얼굴 구조 (FACE_GEOMETRY_KEYS)
  ↓
나이 · 피부 · 개별 특징
  ↓
민족 · 지역 외모
  ↓
얼굴 인상 (facial character)
  ↓
표정 · 메이크업
  ↓
화풍 렌더링
```

`facial ethnicity` 는 지금 최상위이고 그대로 두되, **넓은 인상 단서**로만
작동하도록 문장을 붙인다 — 참조 정체성이나 명시된 구조를 덮지 않고,
지역 특징을 과장하지 않는다.

# 5. 권고안

## 5.1 1단계 — 문장 넷 (파라미터를 안 늘린다)

프롬프트 구조를 안 건드리고, 값이 비어 있으면 아무것도 안 바뀐다.

### ① 얼굴 구조 우선 (§4.2)

`FACE_GEOMETRY_KEYS` 를 두고, 얼굴에 한해 자동 precedence 문장을
"구조 > 인상" 으로 바꾼다. 얼굴 밖은 그대로.

### ② 화풍이 얼굴을 재설계하지 못하게 — **`[STYLE LOCK]` 에 넣는다**

반론은 이 문장을 `[IDENTITY LOCK]` 에 두자고 했으나, **코드에서는 안 맞는다.**

- `[IDENTITY LOCK]` 은 **생활컷 두 모드에만 있다.** 의인화 프롬프트는
  `[ART STYLE]` + `[ANTHRO STYLE EXTENSION]` + `[STYLE LOCK]` +
  `[SOURCE MORPHOLOGY ADAPTER]` + `[TRANSLATION PROFILE]` + `PARAMETERS` 로
  짜여 있고 identity 블록이 없다. **얼굴을 처음 설계하는 곳이 바로 의인화다.**
- 더구나 의인화의 `[STYLE LOCK]` 은 지금 이렇게 말한다 —
  *"The selected ART STYLE controls the rendering language of the entire image
  **without exception: facial construction**, skin, hair, armor …"*
  얼굴 구조에 대한 화풍의 권한을 **명시적으로 선언**해 두었고 반대 추는 없다.

보호 문장을 다른 블록에 두면 두 블록이 서로 모순되고, 모델은 둘 중 하나를
고른다. 그러므로 **선언한 자리에서 한계를 함께 긋는 것**이 맞다.

```
… without exception: facial construction, skin, hair, armor, …
+ It governs how the face is rendered, not who the face is:
+ it must not redesign the underlying facial geometry, proportions, or identity
+ specified in PARAMETERS.
```

생활컷 쪽 `LIFESTYLE_STYLE_LOCK` 에도 같은 취지의 절을 맞춘다(그쪽은 이미
*"governs HOW the scene is rendered only"* 가 있어 한 줄이면 된다).

COMMON 으로 올리지 않는다 — `QA_BASELINE.md` 의 "COMMON 은 마지막 수단"
원칙과 반론 §18.3 에 맞춘다.

### ③ `[REFERENCE ROLE]` — 참조가 여럿일 때

*"If multiple reference images of the same character are attached: 얼굴
클로즈업이 얼굴 정체성의 앵커, 전신이 체형·머리·장비의 권위, 나머지는 불명확한
부분을 푸는 데만, 여러 장을 평균 내지 말 것, 모두 같은 인물임."*

조건문이라 한 장만 붙였을 때는 발동하지 않으므로 이미지 개수를 감지하는 UI 가
필요 없다.

### ④ 체형 참조 우선순위 교정

현재 `carryBlock` 은 *"명확히 어긋나면 이미지를 따른다"* 로 끝난다. 장갑 ·
포즈 · 원근 때문에 **애매할 때**를 못 가린다.

```
체형이 참조에서 뚜렷이 보이면      → 참조가 권위
장갑·포즈·단축·가림으로 애매하면   → 명시된 체형값으로 푼다
```

## 5.2 2단계 — 하위 파라미터 열셋

전부 기존 부모 밑 **하위로만** 들어간다. 최상위 15 는 그대로다.

| 부모 | 새 하위 |
|---|---|
| `facial character` | `face length` · `face width` · `jaw & chin` · `eye size` · `eye tilt` · `nose character` · `lips` |
| `hairstyle` | `hair texture` · `hair volume` · `parting` |
| `torso / chest build` | `torso length` |
| `leg proportion` | `lower-body build` |
| `body type` | `body measurements (B/W/H)` — 자유 입력 |

`face width` 는 반론 §9 를 받아 넣었다. `face shape + face length + jaw & chin`
만으로는 "길고 좁은 얼굴 / 길고 넓은 얼굴" 이 안 갈린다.

`face length` 등을 `face shape` 밑에 달고 싶지만 **중첩이 한 단만 되므로**
(§1.3) `facial character` 하위로 평평하게 붙인다.

### 같이 고쳐야 하는 것 — `CARRY_FACE` / `CARRY_BODY`

**`PARAM_DEFS` 에만 넣으면 절반만 한 것이다.** 새 항목이 생활컷으로 안 넘어가
의인화에서 잡은 얼굴이 일상컷에서 풀린다. 두 배열을 같이 늘린다.

```js
CARRY_FACE  += face length, face width, jaw & chin, eye size, eye tilt,
               nose character, lips, hair texture, hair volume, parting
CARRY_BODY  += torso length, lower-body build, body measurements (B/W/H)
```

배열이 `[['key','표시 이름'], …]` 쌍 꼴이므로 그 형태로 넣는다.

### B/W/H 가드 블록

숫자를 넣었을 때만 따라 붙고, 비우면 흔적도 남기지 않는다.

```
[BODY MEASUREMENT NOTE]

Approximate body measurements (bust / waist / hips): 94 / 61 / 95 cm.

Use these together with the descriptive proportion parameters above;
the descriptive cues define how the measurements should read visually.
Treat them as visual proportion and relative body-balance guidance,
not as literal CAD-like dimensions. Do not exaggerate any body part
solely because a numeric value is present.
```

## 5.3 하지 않을 것

- **블록 신설과 재배치** — 체형안 §3·§9, 얼굴안 §4·§5·§6·§8.
  기존 프롬프트가 전부 바뀌고 화풍 기준선이 무효가 된다. 하위 목록으로 넣으면
  값은 어차피 `PARAMETERS` 로 흘러가므로 얻는 것이 적다.
- **미세 항목** — `cheekbone prominence` · `cheek fullness` · `eye spacing` ·
  `eyelid character` · `brow shape` · `secondary hair color`.
  모델이 이 정도 지시는 잘 안 지키고, 안 지키는 항목이 늘면 나머지 지시의
  무게까지 희석된다. 체형안 §11.1 이 스스로 경고한 지점이다.
- **세부 센티미터** — 팔뚝 · 종아리 · 인심 · 목둘레. 체형안 §11.1 과 같은 판단.

## 5.4 규모

| | 최상위 | 하위 | 합 |
|---|---|---|---|
| 지금 | 15 | 15 | 30 |
| 권고안 적용 후 | 15 | 28 | 43 |
| 두 제안서를 항목대로 다 넣으면 | 15 | 40+ | 55~60 |

권고안은 **최상위를 하나도 안 늘린다.** 늘어나는 열셋이 전부 기존 부모 밑으로
접혀 들어가므로, 처음 여는 사람이 보는 화면은 지금과 같다.

전부 `prompt.html` 한 파일이고, 대부분 `PARAM_DEFS` 에 항목을 더하는 일이다.

---

# 6. 검증 방법

새 항목을 **비운 상태**에서 프롬프트 출력이 바뀌기 전과 **바이트 단위로 같은지**
확인한다. 지금도 헤드리스 브라우저로 프롬프트 길이를 재고 있어 그대로 쓸 수 있다.

```
?mech=RX-78-2 건담 → recMeta "시작기 · 기동 82"
프롬프트 길이 [11190, 7516, 21505]
```

1단계는 문장을 더하므로 길이가 늘어난다. 늘어난 만큼이 의도한 문장 길이와
맞는지 본다. 2단계는 비운 상태에서 길이가 그대로여야 한다.

---

# 7. 구현 결과

1·2 단계를 모두 적용했다. 손댄 파일은 `prompt.html` 하나다.

| | 한 일 |
|---|---|
| 1단계 ① | `FACE_GEOMETRY` 목록을 두고 `facial character` 를 부모 우선순위 목록에서 뺐다. 대신 `facial precedence` 문장이 붙는다 — *구조가 실제 얼굴이고 인상은 그 얼굴이 어떻게 읽혀야 하는지를 말하는 보조 단서* |
| 1단계 ② | `ANTHRO_STYLE_LOCK` · `LIFESTYLE_STYLE_LOCK` 양쪽에 얼굴 구조 보호 절. 11 개 화풍 전부에서 확인 |
| 1단계 ③ | `LIFESTYLE_REFERENCE_LOCK` 에 다중 참조 역할 문장 |
| 1단계 ④ | `carryBlock` 우선순위를 *뚜렷이 보이면 이미지 · 애매하면 목록* 으로 갈랐다 |
| 1단계 ⑤ | `ethnicity scope` 문장 |
| 2단계 | 파라미터 13 개 추가(전부 하위) · B/W/H 자유 입력과 조건부 가드 블록 · `CARRY_FACE` +10 · `CARRY_BODY` +3 |

`eye color` · `second eye color` · `expression` 은 예정대로 우선순위 문장에서
빠졌다. 이제 인상과 우열을 다투지 않는다.

## 7.1 눈금은 셋으로

처음에는 `face length` 를 짧은/살짝 짧은/균형/살짝 긴/긴 다섯 단계로 냈다가
셋으로 줄였다. 실제로 돌려 보니 차이가 또렷하지 않았고, 이유가 분명하다 —
`medium` 과 `medium-large` 는 모델 안에서 거의 같은 자리에 떨어진다. 붙어 있는
눈금은 잡음보다 작아서 고르는 뜻이 없고, 안 읽히는 값이 늘면 나머지 지시의
무게까지 희석된다.

눈금이 있는 열하나를 **상 · 중 · 하 셋**으로 맞췄다. `parting`(가르마 위치)과
B/W/H 는 단계가 아니라 그대로 뒀다.

**기존 항목은 건드리지 않았다.** `height impression` 의 `very tall` 이 기록에서
다섯 번, `leg proportion` 의 `very long` 이 여섯 번 쓰이고 있다. 목록에서 빼면
저장된 기록이 조용히 AUTO 로 풀린다. 새 항목은 아직 쓰인 적이 없어 자유롭게
바꿀 수 있었다.

## 7.1.1 정정 — 눈금과 모양을 같이 뭉갰다

7.1 의 판단은 절반만 맞았다. `medium` 과 `medium-large` 가 같은 자리에 떨어진다는
것은 맞다. 그런데 셋으로 맞추면서 **눈금이 아닌 것까지 눈금으로 만들었다.**

  뺀 값 가운데 눈금 — slightly short · slightly long · medium-large ·
                     slightly upturned · narrow-to-medium
  뺀 값 가운데 모양 — aquiline · broad low bridge · square chin ·
                     fuller lower lip · wide mouth · small mouth · 매부리코 계열

`aquiline` 은 `prominent defined nose` 를 조금 더 크게 한 것이 아니다. 콧대가
볼록한 다른 코다. `wide mouth` 는 `full lips` 의 정도가 아니라 다른 축이다.
이것들을 상·중·하 한 줄에 접으면 세 값 안에서만 고르게 되고, 스물한 기를 그리면
비둘기집 원리로 반드시 겹친다.

실제 설정 21 기 38 벌로 견주니 그대로 보인다.

| 항목 | 성격 | 보기 | 쓰인 값 |
|---|---|---|---|
| face shape | 모양 | 7 | 11 벌에 4 종 |
| eye shape | 모양 | 6 | 9 벌에 4 종 |
| jaw & chin | 눈금으로 접힘 | 3 | 15 벌에 3 종 (60% 가 한 값) |
| lips | 눈금으로 접힘 | 3 | **4 벌 모두 같은 값** |

**모양은 퍼지고 눈금은 몰린다.** 그래서 눈금 축(face length · face width ·
eye size · eye tilt)은 셋 그대로 두고, 잘못 접힌 모양 축 셋만 되살렸다 —
jaw & chin 8 · nose character 9 · lips 8. 되살린 값은 전부 정도가 아니라
생김새를 가리키는 말이라 서로 다른 자리에 떨어진다.

`slightly` 계열은 되살리지 않았다. 그쪽은 7.1 이 옳다.

값을 **더하기만 했고 빼지 않았다** — 7.1 이 경고한 대로, 목록에서 빼면 저장된
기록이 조용히 AUTO 로 풀린다.

남은 것 하나: `wide mouth` 와 `small mouth` 는 사실 `lips`(도톰함)와 다른 축이라
한 목록에 있으면 "넓고 얇은 입" 을 못 적는다. `mouth width` 를 따로 내는 것이
옳지만, 그것은 항목을 더하는 일이라 이번 범위 밖에 두었다.

## 7.2 하다가 찾은 것 둘

**`carryValues()` 가 직접 입력한 값을 흘렸다.** 기록은 고른 값(`sel`)과 직접
입력한 글(`cus`)을 따로 담는데, carry 는 `sel` 만 읽어서 '직접 입력' 을 고른
항목이 프롬프트에 `__custom__` 이라는 표로 그대로 실려 나갔다. B/W/H 가 자유
입력 전용이라 매번 걸려서 드러났지만, **원래 모든 직접 입력 항목에 있던 버그**다.
같이 고쳤다.

**2 단 중첩 함정에 스스로 걸렸다.** §1.3 에 "중첩은 한 단만 된다"고 적어 놓고
`torso length` 를 `torso / chest build` 밑에, `lower-body build` 를
`leg proportion` 밑에 달았다. 둘 다 그 자체가 하위라 화면에서 부모 밖으로
밀려났다. UI 검사에서 잡아 `body type` 하위로 올렸다.

## 7.3 검증

| 확인 | 결과 |
|---|---|
| 새 항목을 비우면 1단계 출력과 같은가 | **세 모드 모두 바이트 단위로 동일** |
| 11 개 화풍에 얼굴 보호 문장이 걸리는가 | 의인화 · 생활컷 **11/11** |
| 새 파라미터가 PARAMETERS 에 실리는가 | 13/13 |
| 새 파라미터가 생활컷으로 넘어가는가 | `- face length: slightly long` 등 확인 |
| B/W/H 가드가 숫자를 넣을 때만 붙는가 | 확인 |
| 화면에서 최상위가 안 늘었는가 | 최상위 카드 그대로, 총 카드 29 → 42 |
| 콘솔 오류 | 0 |

1단계는 문장을 더하므로 길이가 는다 — 의인화 +450 · 생활컷 +647 자.
늘어난 것이 의도한 문장뿐이고 지워진 줄이 없음을 diff 로 확인했다.

---

# 부록 A. 남은 결정

- **미세 항목 여섯**(`cheekbone prominence` · `cheek fullness` · `eye spacing` ·
  `eyelid character` · `brow shape` · `secondary hair color`)은 그대로 보류했다.
  실제 출력에서 특정 문제가 반복되면 그때 국소적으로 넣는다.
- **거대 블록 신설과 재배치**는 하지 않았다(§5.3).
- 실제 이미지로 A-B 를 돌려 봐야 확인되는 것 — 얼굴 구조가 인상보다 실제로
  우선하는지, B/W/H 가 과장 없이 비율 힌트로만 작동하는지.

---

# 부록 B. 반론에서 받아들인 것과 고친 것

`PROMPT_SPEC_REVIEW_FINAL_RECOMMENDATION.md` 에 대한 답이다.

**받아들였다**

- §2 `sub` 가 UI 배치와 의미 우선순위를 겸한다는 진단. 1 차 검토의 "위계를
  뒤집을까 말까(A/B/C)" 보다 정확한 문제 정의라, §4 를 이 틀로 다시 썼다.
- §3 `FACE_GEOMETRY_KEYS` 화이트리스트 방식. 메타데이터를 안 바꿔도 된다.
- §2 `eye color` 를 인상의 하위 의미로 두는 것이 말이 안 된다는 지적. 색 ·
  표정은 precedence 문장에서 빼기로 했다.
- §9 `face width` 추가. 1 차에서 뺐으나 "길고 좁은 / 길고 넓은" 구분 논거가
  타당하다. 열둘 → 열셋.
- §13 `CARRY_FACE` / `CARRY_BODY` 동시 확장을 필수로 못 박은 것.
- §14 `facial ethnicity` 의 의미 권한을 낮추는 것.
- §18.3 COMMON 을 마지막 수단으로 유지하는 것.

**고쳤다 — §5 보호 문장의 위치**

반론은 `[IDENTITY LOCK]` 에 두자고 했으나 코드에서 성립하지 않는다.
`[IDENTITY LOCK]` 은 생활컷 두 모드에만 있고 **의인화에는 없다.** 얼굴을 처음
설계하는 곳이 의인화이므로 정작 필요한 자리가 빈다. 게다가 의인화
`[STYLE LOCK]` 이 *"without exception: facial construction"* 으로 화풍의 권한을
명시해 두어, 다른 블록에서 반대말을 하면 두 블록이 충돌한다.
**선언한 자리에서 한계를 함께 긋는다**(§5.1②).

**그대로 둔 판단**

- 거대 블록 신설과 재배치는 하지 않는다(반론 §18.1 과 같은 결론).
- 미세 항목 여섯은 보류한다(반론 §15 와 같은 목록).
