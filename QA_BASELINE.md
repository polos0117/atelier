# Gundam Prompt Toolkit v9.1 — 11개 화풍 QA 기준선
## Golden Regression & Style Isolation Checklist

> 목적: v9.1 구조 개편 이후 11개 화풍의 현재 정상 상태를 기준선으로 고정한다.
> 향후 프롬프트 수정 시 이 문서를 regression checklist로 사용한다.
> 원칙: **잘 나오는 화풍은 건드리지 않는다. 한 스타일의 문제는 해당 style profile에서 먼저 해결한다. COMMON은 마지막 수단이다.**

---

# 1. 전체 결론

v9.1의 핵심 구조 개편은 성공적으로 작동하고 있다.

- 화풍별 시각적 차별성이 이전보다 크게 증가
- ANTHRO / LIFESTYLE 모드 분리 정상
- 일상컷에서 메카 문구 누수 대부분 차단
- 의인화에서는 화풍별 메카 표현이 독립적으로 살아남음
- 세미리얼 / 2.5D를 포함한 주요 화풍이 서로 다른 렌더링 축으로 분리됨

```text
얇은 COMMON
   ↓
MODE
   ↓
STYLE PROFILE
   ↓
MODE-SPECIFIC EXTENSION
   ↓
PARAMETERS / TRANSLATION
```

---

# 2. Golden Reference

## cinematic_semi_real

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = GOLDEN / LOCK
```

특징:
- 자연스러운 인간화
- painterly semi-real rendering
- 기계 구조는 읽히되 literal copy 아님
- 피부 / 갑옷 / 배경이 같은 회화 언어로 통합

정책:
- 품질 튜닝 금지
- 회귀 확인용 기준 스타일

## game_keyart

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = GOLDEN / LOCK
```

특징:
- volumetric 2.5D
- flat anime보다 입체적
- full CGI보다 일러스트적
- source-specific armor identity 유지
- generic gacha armor drift 억제

정책:
- 품질 튜닝 금지
- 회귀 확인용 기준 스타일

---

# 3. glossy_kr_game

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = STABLE
```

좋은 점:
- 피부의 designed specular
- 강한 포화색
- 핑크 / 보라 / 블루 rim lighting
- 한국 모바일게임식 glamour
- lifestyle에서 메카 누수 없음

관찰:
- ANTHRO 갑옷 광택이 game_keyart와 약간 가까운 편

향후 조정 후보:
```text
glossy_kr_game.anthro만 소폭 조정 가능

목표:
물리 반사 강화 X
디자인된 광택 강화 O
saturated reflection
highlight ribbon
jewel-toned shadow
lacquered illustrated finish
```

COMMON / TRANSLATION 수정 금지.

---

# 4. game_cgi

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = LOCK
```

특징:
- 3D/PBR 계열 갑옷
- 피부 / 언더슈트 / 갑옷 재질 분리
- CGI 캐릭터 렌더로 명확히 읽힘
- lifestyle에서도 메카 누수 없음

미세 관찰:
- 필요하면 나중에 cinematic lighting만 아주 소폭 강화 가능

현재는 수정 불필요.

---

# 5. semi_real_paint

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = LOCK
```

특징:
- 완성된 디지털 유화
- visible brush texture
- resolved form
- PBR보다 painted surface
- wet scene에서도 회화적 질감 유지

차별성:
- cinematic_semi_real보다 브러시성이 강함
- painterly보다 더 완성형 / resolved

수정 없음.

---

# 6. photoreal

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = LOCK
```

특징:
- 가장 실사 / 촬영 축
- 실재 재질 느낌
- 사진식 피부 / 물기 / 광원
- 갑옷도 practical fabricated material처럼 읽힘

차별성:
- game_cgi보다 촬영 느낌이 강함
- semi_real_paint보다 훨씬 사진적

수정 없음.

---

# 7. anime_illust

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = LOCK
```

특징:
- clean modern 2D anime illustration
- soft gradient 일부 허용
- polished 2D
- photoreal / CGI와 분명히 분리

관찰:
- lifestyle는 pure cel보다 약간 polished anime illustration 쪽

현재 방향 문제 없음.

---

# 8. cel_anime

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = LOCK
```

특징:
- hard-edged cel shadow
- flat local color
- minimal gradients
- bold graphic separation

좋은 점:
- source fidelity를 유지하면서도 realistic rendering으로 안 감
- wet scene에서도 셀화 문법 유지

수정 없음.

---

# 9. painterly

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = STABLE / OBSERVE
```

특징:
- production concept-art 느낌
- broad brush masses
- unresolved edge
- value / silhouette / atmosphere 우선

차별성:
- semi_real_paint보다 더 loose
- 배경과 갑옷이 painterly mass로 통합

관찰 1:
- ANTHRO 샘플에서 배경 typography / unit-name 계열 텍스트 1회 발생

관찰 2:
- LIFESTYLE 샘플에서 작은 mechanical headpiece carry 1회 발생

현재 판단:
```text
둘 다 단발성 생성 편차 가능성이 높음
즉시 공통 패치 금지
```

반복될 경우에만 국소 수정:
- `painterly.anthro`: concept-art execution은 허용하되 poster / design-sheet typography 금지
- `LIFESTYLE_REFERENCE_POLICY`: visible source-derived mechanical accessory carry 반복 시 lifestyle 전용 정책 수정

---

# 10. retro_anime

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = LOCK
```

특징:
- late-1980s ~ mid-1990s cel-animation 느낌
- 시대감 있는 얼굴 / 눈 / 음영
- 빈티지 배경
- 현대 gacha / CGI와 분명히 다름

수정 없음.

---

# 11. ink_wash

```text
ANTHRO      = PASS
LIFESTYLE   = PASS
STATUS      = LOCK
```

특징:
- ink-and-wash
- restrained colour wash
- paper-like negative space
- broken brush edge
- translucent value

좋은 점:
- 기계 구조는 읽히지만 CGI 메카 디테일로 안 감
- wet lifestyle scene도 수묵담채 문법으로 변환
- 메카 누수 없음

수정 없음.

---

# 12. 전체 QA 표

| Style | Anthro | Lifestyle | Status | 비고 |
|---|---|---|---|---|
| cinematic_semi_real | PASS | PASS | GOLDEN / LOCK | 기준 |
| game_keyart | PASS | PASS | GOLDEN / LOCK | 기준 |
| glossy_kr_game | PASS | PASS | STABLE | anthro 광택 소폭 후보 |
| game_cgi | PASS | PASS | LOCK | 수정 없음 |
| semi_real_paint | PASS | PASS | LOCK | 수정 없음 |
| photoreal | PASS | PASS | LOCK | 수정 없음 |
| anime_illust | PASS | PASS | LOCK | 수정 없음 |
| cel_anime | PASS | PASS | LOCK | 수정 없음 |
| painterly | PASS | PASS | OBSERVE | 텍스트/헤드파츠 단발성 관찰 |
| retro_anime | PASS | PASS | LOCK | 수정 없음 |
| ink_wash | PASS | PASS | LOCK | 수정 없음 |

---

# 13. 향후 수정 원칙

한 스타일에서 문제가 발견되면 다음 순서로 본다.

```text
1. 해당 style.core 문제인가?
2. 해당 style.anthro 문제인가?
3. 해당 style.lifestyle 문제인가?
4. 해당 mode reference policy 문제인가?
5. 여러 스타일에서 같은 문제가 반복되는가?
6. 그때만 COMMON 검토
```

금지:
```text
한 스타일 문제
→ 바로 COMMON 수정
```

---

# 14. COMMON 승격 기준

새 문장을 COMMON에 넣으려면 다음 조건을 모두 만족해야 한다.

```text
모든 화풍에서 맞는가?
ANTHRO / LIFESTYLE 모두에서 맞는가?
human-mechanical balance와 무관한가?
갑옷 유무와 무관한가?
scene type과 무관한가?
```

하나라도 NO이면 전용 profile에 둔다.

---

# 15. Regression Checklist

향후 구조 또는 공통 규칙 수정 시 최소 다음을 재확인한다.

## Golden Pair
```text
cinematic_semi_real
game_keyart
```

둘 다 기존 성향 유지 필수.

## Cross-style
최소 다음 5개 축 확인:
```text
photoreal
game_cgi
cel_anime
painterly
ink_wash
```

서로 다시 비슷하게 수렴하지 않는지 확인.

## Lifestyle
```text
메카 갑옷 부활 없음
무기/방패/백팩 부활 없음
source-MS reconstruction 없음
캐릭터 얼굴/헤어/체형 연속성 유지
style-specific rendering 유지
```

---

# 16. Prompt Isolation 원칙

```text
한 스타일 수정
→ 그 스타일만 바뀐다.

anthro 수정
→ lifestyle 안 바뀐다.

lifestyle 수정
→ anthro 안 바뀐다.

glossy_kr_game 수정
→ semi-real / 2.5D 안 바뀐다.

COMMON 수정
→ 정말 모든 경우에 필요한 경우만.
```

---

# 17. 현재 다음 작업

현재 11개 화풍 1차 QA는 완료.

즉시 필요한 대규모 품질 패치는 없음.

다음 단계:
```text
1. 현재 상태 유지
2. 실제 사용 중 반복되는 문제만 기록
3. 같은 문제가 2~3회 이상 재현될 때 국소 패치
4. COMMON은 마지막에만 검토
```

현재 수정 후보:
```text
glossy_kr_game.anthro 광택 차별화 — 선택적
painterly typography hallucination — 반복 시
lifestyle small mechanical accessory carry — 반복 시
```

---

# 18. 최종 결론

v9.1 구조 개편의 가장 큰 성과:

```text
스타일별 차별성 증가
+
mode leakage 감소
+
화풍별 독립 튜닝 가능
+
공통 프롬프트의 과도한 영향 제거
```

현재 상태를 새로운 기준선으로 고정한다.
