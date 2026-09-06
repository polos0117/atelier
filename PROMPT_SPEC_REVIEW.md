# 체형 · 외모 설정 패치안 검토

제안서 두 건을 툴킷(`prompt.html`) 실제 코드에 맞춰 본 결과다.

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
COMMON 에 한 줄 넣으면 11 개 화풍 전부에 걸린다. **비용 대비 값이 가장 크다.**

**§12 `[REFERENCE ROLE]` 은 아예 없다.** 얼굴 크롭과 전신을 같이 붙였을 때
어느 쪽이 얼굴 앵커인지 정하는 규칙이 없다.

---

# 4. 가장 중요한 충돌 — 인상이 위인가 구조가 위인가

얼굴 제안서 §9 의 핵심 주장은 이것이다.

> `facial impression` 은 주도권이 아니라 **보조 태그**로 내린다.
> 인상은 얼굴 구조를 덮어쓰지 못한다.

**현재 코드는 정확히 그 반대로 되어 있다.**

1. `face shape` · `eye shape` · `eye color` · `expression` 이 전부
   `sub: 'facial character'` 로 **인상의 하위**에 달려 있다.
2. §1.5 의 자동 문장이 **부모가 이긴다**고 명시한다 —
   *"facial character defines the overall direction; the other, finer entries …
   must not override or contradict it."*

즉 지금은 "인상이 방향을 정하고 눈매·얼굴형이 그 안에서 미세 조정" 이다.
제안서는 "구조가 먼저고 인상은 그 위에 얹히는 보조 레이어" 를 요구한다.

**이건 문장 하나 넣는 문제가 아니라 위계를 뒤집는 문제다.** 세 가지 선택지가 있다.

| 안 | 내용 | 대가 |
|---|---|---|
| **A** 그대로 둔다 | 인상이 부모 | 제안서 §9 의 핵심을 포기 |
| **B** 문장만 바꾼다 | 위계는 두고, 얼굴에 한해 자동 문장을 "구조가 우선" 으로 뒤집는다 | UI 의 부모·자식 배치와 프롬프트의 우선순위가 어긋나 보인다 |
| **C** 위계를 뒤집는다 | `face shape` 등을 최상위로 올리고 `facial character` 를 그 하위로 | 기존 프롬프트가 바뀐다. 화풍 기준선 재검증 필요 |

**B 를 권한다.** 사용자 눈에는 "인상을 먼저 고르고 세부를 잡는" 흐름이 자연스럽고,
모델에게는 "구조가 먼저" 라고 말하는 편이 제안서가 지적한 과장 문제를 막는다.
UI 흐름과 모델 지시는 원래 같을 필요가 없다.

---

# 5. 권고안

## 5.1 1단계 — 문장 넷 (파라미터를 안 늘린다)

프롬프트 구조를 안 건드리고, 값이 비어 있으면 아무것도 안 바뀐다.

1. **§10 보호 문장**을 COMMON 에 —
   *선택된 화풍은 렌더링 언어와 양식화 정도를 바꿀 수 있으나, 인물의 기초
   얼굴 구조와 정체성을 재설계해서는 안 된다.*
2. **§9 인상 종속 문구** — `facial character` 를 골랐을 때 자동 문장을 얼굴에
   한해 뒤집는다(§4 의 B 안).
3. **§12 `[REFERENCE ROLE]`** — 참조 이미지가 둘 이상일 때만 출력.
4. **체형 §6 우선순위 교정** — 현재 `carryBlock` 은 *"명확히 어긋나면 이미지를
   따른다"* 로 끝난다. 포즈 · 원근 · 장갑 때문에 **애매할 때는 스펙이 이긴다**는
   경우를 못 가린다. 한 문장 추가.

## 5.2 2단계 — 하위 파라미터 열둘 + 자유 입력 한 칸

전부 기존 부모 밑 **하위로만** 들어간다. 최상위 15 는 그대로다.

| 부모 | 새 하위 |
|---|---|
| `facial character` | `face length` · `jaw & chin` · `eye size` · `eye tilt` · `nose character` · `lips` |
| `hairstyle` | `hair texture` · `hair volume` · `parting` |
| `torso / chest build` | `torso length` |
| `leg proportion` | `lower-body build` |
| `body type` | `body measurements (B/W/H)` — 자유 입력 |

`face length` 등을 `face shape` 밑에 달고 싶지만 **중첩이 한 단만 되므로**
(§1.3) `facial character` 하위로 평평하게 붙인다.

B/W/H 는 숫자를 넣었을 때만 짧은 가드 블록이 따라 붙는다.

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
| 권고안 적용 후 | 15 | 27 | 42 |
| 두 제안서를 항목대로 다 넣으면 | 15 | 40+ | 55~60 |

권고안은 **최상위를 하나도 안 늘린다.** 늘어나는 열둘이 전부 기존 부모 밑으로
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

# 7. 결정이 필요한 것

1. **1단계만 먼저 할지, 2단계까지 한 번에 할지.**
   1단계는 파라미터를 안 늘리고 문장 넷만 넣으므로 되돌리기 쉽다.
2. **§4 의 위계 문제를 A · B · C 중 어느 것으로 갈지.** 권고는 B.
3. **`prompt.html` 을 다른 작업이 동시에 고치고 있지 않은지.**
   최근까지 v9.5 까지 개정되고 있었다. 같은 파일을 동시에 고치면 충돌한다.
