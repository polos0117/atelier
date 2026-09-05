# 탑승 관계 수확 — 남은 목록

공식 사이트 `/mecha/<id>` 상세의 `파일럿 //` 절에서 받는다. 결과는
`official/pilot/relations.json` 에 넣고 `python3 build-bond.py` 로 인연 후보를 다시 뽑는다.

## UC 계열 — 끝났다

| 시리즈 | 기체 | 탑승자 있는 것 |
|---|---|---|
| 0079 | 31 | 18 |
| 08MS | 12 | 8 |
| 0080 | 12 | 5 |
| 0083 | 20 | 17 |
| Z | 31 | 21 |
| ZZ | 24 | 20 |
| CCA | 9 | 7 |
| **합계** | **139** | **96** |

받은 URL 은 `todo.json` 의 `urls` 에 기록으로 남겨 두었다.

## 아직 URL 도 안 받은 시리즈 (21)

`series/<슬러그>/mecha` 목록을 다시 받아 이름→URL 을 `official/url/<코드>.json` 에
넣는 일부터 해야 한다. 슬러그는 `official-slugs.json` 에 있다.

SEED, DESTINY, FREEDOM, 00, 00M, IBO, WM, W, EW, UNICORN, NT, HATHAWAY,
G, X, AGE, F91, V, TB, TA, ASTRAY, GQ

## 받을 때 주의할 것

- 마크다운으로 받는다(1크레딧). JSON 추출은 5크레딧에 키 이름도 들쭉날쭉하다
- `includeTags` 는 쓰지 않는다 — 엔진이 통째로 실패한다
- `excludeTags:["img","picture","source","svg"]` 로 분량을 줄인다
- 간헐적 실패(20% 안팎)는 `proxy:"stealth"` 로 재시도하면 대개 통한다
- 공식 이름과 저장소 이름이 갈리면 `gundam_match.TRANSLIT` 이나
  `build-bond.PERSON` 에 넣는다. 지금까지 나온 것: 포 무라사메→포우,
  그레미 토토→글레미, α 아지르→알파 아질
