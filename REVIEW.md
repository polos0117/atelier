# 검토자에게 — 이 저장소에서 무엇을 어떻게 볼 것인가

작업은 Claude 가 하고, 이 문서를 읽는 쪽은 **검토만** 한다.

## 역할

**쓰지 않는다.** 커밋 · 푸시 · 파일 수정을 하지 않는다. 같은 파일을 둘이 건드리면
충돌이 예외가 아니라 기본값이 된다 — `prompt.html` 만 413KB 한 덩어리이고 최근
60 커밋 중 56 번 바뀌었다. 읽고 지적만 하면 충돌이 0 이다.

주고받는 길은 git 뿐이다. 서로 말을 걸 수 없으므로, 지적할 때는 **재현하는 방법**을
같이 적어야 상대가 확인할 수 있다.

## 먼저 읽을 것

```
ROSTER_CHECK.md   자료가 어디 있고 무엇이 무엇을 만드나 · 소유권 · 규칙
QA_BASELINE.md    11 개 화풍의 정상 상태 기준선. 회귀 확인용
TRY_SAMGUK.md     주제를 갈아 끼워 본 기록. 어디가 주제에 묶여 있는지
```

## 실제로 났던 사고들 — 같은 것을 찾는다

아래는 전부 이 저장소에서 실제로 난 것이다. 지어낸 목록이 아니다.

**한쪽 성별·한쪽 주제가 문장에 박힘**
- 남성으로 바꿔도 일상컷 프롬프트가 `clearly adult woman` 이라고 지시했다. 여덟 달 몰랐다
- 태그 인연이 이름에 `"자쿠"` · `"건담"` 이 들어가는지 봤다. 주제가 바뀌면 154 점짜리 축이 통째로 죽는다
- 화풍 문구가 `anime-informed` · `a refined small nose` 라 애니화를 직접 요구하고 있었다

**자료가 모자라면 터짐**
- 카드가 동나자 빈 자리가 편성에 들어가 화면을 그릴 때 터졌다. 기체가 765 장이라 안 드러났다
- 기본 몫이 비고 화풍 몫에만 그림이 있는 기체가 도감에서 빈칸으로 떴다

**같은 값이 두 군데**
- 능력치 이름표가 `data/*.json` 과 화면 두 곳에 있었다
- `데스티니 건담 SpecII`(알파벳 I 두 개)와 `임펄스 SpecⅡ`(U+2161)가 갈려 있었다
- 인피니트 저스티스가 `이식`과 `TypeⅡ` 로 두 장이었다 (弐式 = TypeⅡ)

**방금 만든 버그**
- `mergeRepoFiles` 에서 성별을 이미 떼어낸 뒤에 검사해 남성 파일이 여성 칸으로 갔다
- 패널 하나에만 표정을 지정했는데 전역 모드가 "다양하게 하라" 고 그 위에서 지시했다

**빠뜨림**
- `prompt.html` 을 열 번 고치고 판 번호와 패치 노트를 한 번도 안 올렸다

## 볼 때 던질 질문

```
1. 성별·주제·기체 이름이 코드 문장에 박혀 있나
2. 자료가 0 개일 때 · 한쪽만 있을 때 터지지 않나
3. 이 값이 이미 다른 곳에 있지 않나
4. 고친 뒤에 "안 고친 쪽은 그대로"를 실제로 재 봤나 (바이트 비교가 있나)
5. prompt.html 을 고쳤는데 판 번호 · 패치 노트가 같이 올라갔나
6. 새 카드: 형식번호가 겹치나 · 이름 표기가 기존과 갈리나 · 계열이 사실과 맞나
   (주역기가 양산으로 들어간 적이 있다)
```

## 손으로 돌려 볼 수 있는 것

```bash
# 문법 — 세 화면 다
node -e 'const h=require("fs").readFileSync("prompt.html","utf8");
  for(const b of h.match(/<script>[\s\S]*?<\/script>/g)) new Function(b.slice(8,-9));
  console.log("ok")'

python3 register-images.py --check   # 초상 자료와 파일이 어긋나나
python3 build-data.py --check        # 바깥 자료와 카드가 어긋나나
python3 build-data.py --report       # 두 출처가 엇갈리는 자리 전부
python3 build-dex.py play.html       # 도감이 다시 만들어지나 (dex.html 은 생성물이다)

# 화면은 fetch 로 자료를 읽으므로 서버가 필요하다
python3 -m http.server 8765
#   play.html · dex.html · prompt.html
#   play.html?set=samguk 으로 다른 주제 자료도 얹힌다
```

**자료 무결성**

```python
import roster
ms={c['name'] for c in roster.cards('mech')}
ps={c['name'] for c in roster.cards('pilot')}
# 전용기가 없는 카드를 가리키나
print([k for k in roster.bonds()
       if k.partition('|')[2] not in ms or k.partition('|')[0] not in ps])
# 이름 중복
n=[c['name'] for k in roster.KINDS for c in roster.cards(k)]
print([x for x in set(n) if n.count(x)>1])
```

## 지적하는 방식

지적 하나에 이 셋을 같이 적는다.

```
어디   파일과 줄, 또는 함수 이름
무엇   무엇이 잘못됐나 — 추측이면 추측이라고 적는다
재현   어떤 조건에서 어떻게 확인했나. 못 돌려봤으면 그렇게 적는다
```

돌려보지 않은 짐작과 실제로 확인한 것을 섞지 않는다. 이 저장소에서는 재 보면
반대 결과가 나온 적이 여러 번 있다 — 태그가 죽는다는 것도, 화풍이 밀린다는 것도
문구를 실제로 읽고 나서야 원인이 잡혔다.
