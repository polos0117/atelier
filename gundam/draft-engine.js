/* Game rules extracted unchanged from game.js. Preact owns all DOM rendering. */
"use strict";

/* ═══════ 데이터 ═══════ */
/* 기체: 이름, 소속이력, 출력,화력,장갑,기동, 기질, 계열, 시리즈 */
/* ═══════ 데이터 ═══════
   카드 자료는 이 파일이 아니라 data/*.json 에 있다.

   예전에는 여기 배열로 박아 두었는데, 카드 하나의 정보가 MECH·WEIGHT·LORE·
   TAG_COLOR·TAG_ROLE·GUNDAM_EXTRA 여섯 군데로 흩어져 이름으로만 이어져 있었다.
   그래서 표기가 한 글자 갈리면 같은 기체가 두 장이 됐다 — 그렇게 생긴 열 장을
   걷어냈다. 지금은 카드 하나가 레코드 하나이고, 형식번호(models)가 붙어 있어
   이름이 갈려도 같은 기체인지 대조할 수 있다.

   아래 변수들은 그 레코드를 예전 배열 꼴로 되돌린 것이다. 규칙 쪽 코드가
   자리번호로 읽기 때문에(m[7] 은 계열, p[9] 는 감응 계통) 그쪽은 건드리지 않았다.
   기체 배열만 끝에 형식번호가 한 칸 늘었다. serAll 이 뒤에서부터 배열을 찾으므로
   문자열인 형식번호는 시리즈 자리를 가리지 않는다. */
var MECH=[], PILOT=[], SHIP=[], CREW=[];
var SER_NAME={}, FRANCHISE={}, SER_TAG={}, FAC={};
var LORE={}, BOND={}, IMG={}, COMBO=[];
/* 카드 종류 — 화면 이름과 자료 파일을 잇는 한 자리.
   탭 목록·능력치 이름표가 여기서 갈라져 나온다 */
var KIND=[["함","ship"],["기체","mech"],["파일럿","pilot"],["지휘관","crew"]];
function kindNames(){return KIND.map(function(k){return k[0]})}
/* 능력치 이름표는 data/*.json 머리말이 이미 갖고 있다. 여기 또 적으면 둘이 갈린다 */
var STAT_LABEL={};
/* 화풍 key → 한글 이름. 차례는 data/style.json 이 정한다 */
var ART_NAME={}, ART_ORDER=[];
var WEIGHT={}, TAG_COLOR={}, TAG_ROLE={};
/* 이름 → 그 기체에 붙은 G 제네레이션 이터널 공식 태그. 가변기·모노아이처럼
   우리가 따로 적을 까닭이 없는 갈래는 공식이 이미 나눠 두었으니 그대로 쓴다.
   자료는 build-data.py 가 mech.json 의 tags 칸에 옮겨 적는다 */
var GGE_TAG={};
/* 카드가 참으로 적어 둔 칸들. tag.json 의 flag 가 여기서 찾는다 */
var FLAG={}, NOFLAG={};   /* NOFLAG 는 자료가 "아니다" 라고 못박은 것 */
/* 이름 → G 제네레이션 이터널 유닛·인물 id. 게임 규칙에는 쓰지 않고
   도감에서 보여 주기와 바깥 자료 대조에만 쓴다 */
var GGE={};

/* 시험용 — ?set=이름 을 붙이면 data-이름/ 에서 읽는다. 붙이지 않으면 data/ 다 */
var DATA_DIR=(function(){
  var m=/[?&]set=([A-Za-z0-9_-]+)/.exec(location.search);
  return m?"data-"+m[1]+"/":"data/";
})();
function fetchJSON(n){
  /* 도감·툴킷과 같은 조건으로 받는다. Pages 의 10분 캐시에 걸리면
     새로 올린 화풍 몫이 한동안 안 보인다 */
  return fetch(DATA_DIR+n,{cache:"no-cache"}).then(function(r){
    if(!r.ok)throw new Error(n+" — "+r.status);
    return r.json();
  });
}
/* 배열을 갈아 끼우지 않고 안을 채운다. DEX_POOL 처럼 선언 시점에
   배열을 붙잡아 두는 곳이 있어서, 참조가 바뀌면 그쪽이 빈 채로 남는다 */
function fill(dst,src){ dst.length=0; dst.push.apply(dst,src); return dst }
function fillMap(dst,src){ for(var k in src)dst[k]=src[k]; return dst }

function absorb(cards,row){
  var out=[],i,c;
  for(i=0;i<cards.length;i++){
    c=cards[i];
    out.push(row(c));
    if(c.weight!==undefined&&c.weight!==1)WEIGHT[c.name]=c.weight;
    if(c.lore)LORE[c.name]=c.lore;
    if(c.color)TAG_COLOR[c.name]=c.color;
    if(c.role)TAG_ROLE[c.name]=c.role;
    /* true 는 표를 붙이고, false 는 "아니다" 라고 못박는다. 이름만 보는 규칙이
       잘못 잡는 카드를 자료에서 되돌리기 위한 것이다 — 제스타 건담처럼 이름에
       건담이 들었어도 건담이 아닌 기체가 있다 */
    for(var fk in c){
      if(c[fk]===true)(FLAG[fk]=FLAG[fk]||{})[c.name]=1;
      else if(c[fk]===false)(NOFLAG[fk]=NOFLAG[fk]||{})[c.name]=1;
    }
    if(c.gge)GGE[c.name]=c.gge;
    if(c.tags&&c.tags.length)GGE_TAG[c.name]=c.tags;
  }
  return out;
}
function mechRow(c){
  return [c.name,c.factions,c.stats[0],c.stats[1],c.stats[2],c.stats[3],
          c.temper,c.system,c.series,c.models||"",c.terrain||null];
}
function pilotRow(c){
  return [c.name,c.factions,c.stats[0],c.stats[1],c.stats[2],c.stats[3],
          c.temper,c.psy,c.series,c.line||""];
}
function plainRow(c){
  return [c.name,c.factions,c.stats[0],c.stats[1],c.stats[2],c.stats[3],c.series];
}

/* ═══════ 자료 검사 ═══════
   받아 오기에 실패한 것은 boot() 이 잡지만, 잘 받아 온 자료가 서로 어긋나는 것은
   여태 아무도 보지 않았다. 그러면 판이 한창일 때 엉뚱한 자리에서 터지거나,
   더 나쁘게는 조용히 이상한 점수가 나온다.

   판을 열기 전에 한 번 훑는다. 판을 못 세우는 것은 막고(fatal), 판은 서지만
   무언가 빠진 것은 일러둔다(warning). 주제를 새로 만들 때 어디가 어긋났는지
   화면에서 바로 보라고 두는 것이다. */
var DATA_VER=1;
function validateData(by){
  var F=[],W=[],i,j,k;
  var kinds=KIND.map(function(x){return x[0]}),        /* 함·기체·… */
      keys=KIND.map(function(x){return x[1]});          /* ship·mech·… */

  /* 1. 판(version) — 모르는 판이면 읽는 법이 달라졌을 수 있다 */
  for(k in by)if(by[k]&&by[k].version!==undefined&&by[k].version!==DATA_VER)
    W.push(k+".json 의 판이 "+by[k].version+" 이다. 이 화면은 "+DATA_VER+" 을 안다");

  /* 2. 카드 넷의 뼈대 */
  var seen={},dupIn=[],dupAcross=[];
  for(i=0;i<keys.length;i++){
    var f=by[keys[i]],nm=kinds[i]+"("+keys[i]+".json)";
    if(!f||!f.cards||!f.cards.length){F.push(nm+" 에 카드가 없다");continue}
    if(!f.stats||f.stats.length!==4)
      F.push(nm+" 의 stats 가 넷이 아니다 — 카드는 늘 넷을 읽는다");
    if(f.count!==undefined&&f.count!==f.cards.length)
      W.push(nm+" 의 count 는 "+f.count+" 인데 실제는 "+f.cards.length+" 장이다");
    var here={};
    for(j=0;j<f.cards.length;j++){
      var c=f.cards[j];
      if(!c.name){F.push(nm+" 의 "+(j+1)+"번째 카드에 이름이 없다");continue}
      if(!c.stats||c.stats.length!==4)
        F.push(nm+" · "+c.name+" 의 능력치가 넷이 아니다");
      else for(k=0;k<4;k++)if(typeof c.stats[k]!=="number")
        F.push(nm+" · "+c.name+" 의 "+(k+1)+"번째 능력치가 숫자가 아니다");
      if(c.weight!==undefined&&!(c.weight>0))
        W.push(nm+" · "+c.name+" 의 나올 비율이 "+c.weight+" 다 — 0 이하면 영영 안 나온다");
      if(here[c.name])dupIn.push(nm+" · "+c.name);
      here[c.name]=1;
      if(seen[c.name]&&seen[c.name]!==kinds[i])dupAcross.push(c.name+" ("+seen[c.name]+" · "+kinds[i]+")");
      seen[c.name]=kinds[i];
    }
  }
  if(dupIn.length)W.push("같은 종류 안에 이름이 겹친다 — "+dupIn.slice(0,6).join(", ")+
    (dupIn.length>6?" 외 "+(dupIn.length-6):""));
  if(dupAcross.length)W.push("종류를 건너 이름이 겹친다 — "+dupAcross.slice(0,6).join(", ")+
    (dupAcross.length>6?" 외 "+(dupAcross.length-6):""));

  /* 3. 라운드표 */
  var R=by.rule;
  if(!R||!R.schedule||!R.schedule.length)F.push("rule.json 에 라운드표가 없다");
  else{
    var bad=R.schedule.filter(function(t){return kinds.indexOf(t)<0});
    if(bad.length)F.push("rule.json 의 라운드표에 모르는 종류가 있다 — "+
      bad.filter(function(v,ix,a){return a.indexOf(v)===ix}).join(", "));
  }
  if(!R||!(R.pack>0))F.push("rule.json 의 pack 이 "+(R&&R.pack)+" 이다");
  if(R&&R.cap_from&&kinds.indexOf(R.cap_from)<0)
    W.push("rule.json 의 cap_from 이 '"+R.cap_from+"' 인데 그런 종류가 없다");

  /* 4. 카드가 세 편을 대기에 넉넉한가 — 고를 수 있는 가장 큰 규모로 본다 */
  var sc=(R&&R.scale)||{}, maxN=0;
  if(sc.options&&sc.options.length)for(j=0;j<sc.options.length;j++)if(sc.options[j]>maxN)maxN=sc.options[j];
  if(R&&R.schedule)for(i=0;i<kinds.length;i++){
    var need=0;
    for(j=0;j<R.schedule.length;j++)if(R.schedule[j]===kinds[i])need++;
    if(maxN&&sc.kinds&&sc.kinds.indexOf(kinds[i])>=0)need=maxN;
    need*=3;
    var have=(by[keys[i]]&&by[keys[i]].cards)?by[keys[i]].cards.length:0;
    if(have<need)W.push(kinds[i]+" 가 "+have+" 장인데 세 편이 "+need+" 장을 집는다 — 버림패가 되돌아온다");
  }

  /* 5. 전장과 지형 */
  var FD=by.field;
  if(!FD||!FD.fields||!FD.fields.length)F.push("field.json 에 전장이 없다");
  else{
    var wsum=0;
    for(i=0;i<FD.fields.length;i++){
      var fd=FD.fields[i];
      if(!fd.name)F.push("field.json 의 "+(i+1)+"번째 전장에 이름이 없다");
      if(!(fd.weight>0))F.push("field.json · "+fd.name+" 의 뽑힐 비율이 "+fd.weight+" 다");
      else wsum+=fd.weight;
    }
    if(wsum>0&&Math.abs(wsum-1)>0.01)W.push("전장이 뽑힐 비율의 합이 "+wsum.toFixed(3)+" 다 — 1 이 아니면 마지막 전장이 몫을 더 갖거나 잃는다");
    var grade=FD.grade||{};
    if(by.mech&&by.mech.cards){
      var miss={},badv={};
      for(i=0;i<by.mech.cards.length;i++){
        var t=by.mech.cards[i].terrain;
        if(!t)continue;
        for(j=0;j<FD.fields.length;j++){
          var fn=FD.fields[j].name;
          if(t[fn]===undefined)miss[fn]=(miss[fn]||0)+1;
          else if(grade[t[fn]]===undefined&&grade[String(t[fn])]===undefined)badv[t[fn]]=(badv[t[fn]]||0)+1;
        }
      }
      for(k in miss)W.push("전장 '"+k+"' 의 지형 적성이 없는 기체가 "+miss[k]+" 기다 — 그 판에서는 감점도 이점도 없다");
      for(k in badv)W.push("field.json 의 grade 에 없는 지형 등급 '"+k+"' 이 "+badv[k]+" 번 쓰였다");
    }
  }

  /* 6. 인연이 실재하는 카드를 가리키는가 */
  if(by.bond&&by.bond.bonds){
    var bmiss=[];
    for(k in by.bond.bonds){
      var pr=k.split("|");
      if(pr.length!==2){bmiss.push(k+" (모양이 '파일럿|기체' 가 아니다)");continue}
      if(!seen[pr[0]])bmiss.push(k+" ← "+pr[0]);
      else if(!seen[pr[1]])bmiss.push(k+" ← "+pr[1]);
    }
    if(bmiss.length)W.push("전용기 짝이 없는 카드를 가리킨다 "+bmiss.length+"건 — "+
      bmiss.slice(0,4).join(", ")+(bmiss.length>4?" 외":""));
  }
  if(by.combo&&by.combo.combos){
    var cmiss=[];
    for(i=0;i<by.combo.combos.length;i++){
      var cb=by.combo.combos[i];
      if(!cb.m||!cb.m.length){cmiss.push((cb.n||"이름없는 인연")+" (구성원이 없다)");continue}
      for(j=0;j<cb.m.length;j++)if(!seen[cb.m[j]])cmiss.push(cb.n+" ← "+cb.m[j]);
    }
    if(cmiss.length)W.push("인연이 없는 카드를 가리킨다 "+cmiss.length+"건 — "+
      cmiss.slice(0,4).join(", ")+(cmiss.length>4?" 외":""));
  }

  /* 7. 화풍 */
  if(by.style&&by.style.styles){
    var sk={},sdup=[];
    for(i=0;i<by.style.styles.length;i++){
      var st=by.style.styles[i];
      if(!st.key){W.push("style.json 의 "+(i+1)+"번째 화풍에 key 가 없다");continue}
      if(sk[st.key])sdup.push(st.key);
      sk[st.key]=1;
    }
    if(sdup.length)W.push("화풍 key 가 겹친다 — "+sdup.join(", "));
  }
  return {fatal:F,warn:W};
}
/* 검사 결과를 화면에 내건다. 판을 못 세우면 그 자리에서 멈춘다 */

var DATA_WARN=[];

/* 이사표는 주제마다 있을 수도 없을 수도 있다. 없다고 판이 서지 못하면 안 되므로
   본 자료와 따로, 실패해도 그냥 넘어가게 받는다 */
function loadRenames(){
  return fetchJSON("rename.json").then(function(j){
    if(j&&j.map){fillMap(RENAME_MAP,j.map); RENAME_REN=j.ren||0; migrateNames();}
  },function(){ /* 없으면 옮길 것도 없다 */ });
}

function loadData(){
  /* 카드 넷은 KIND 가 정한다. 그 뒤에 오는 파일만 여기서 이름을 댄다 */
  var MORE=["bond.json","combo.json","img.json","series.json","style.json",
            "field.json","rule.json","tag.json"];
  var files=KIND.map(function(k){return k[1]+".json"}).concat(MORE);
  return Promise.all(files.map(fetchJSON)).then(function(d){
    var by={},n=KIND.length;
    KIND.forEach(function(k,i){by[k[1]]=d[i]; STAT_LABEL[k[0]]=d[i].stats});
    MORE.forEach(function(f,i){by[f.replace(".json","")]=d[n+i]});
    fill(MECH, absorb(by.mech.cards, mechRow));
    fill(PILOT,absorb(by.pilot.cards,pilotRow));
    fill(SHIP, absorb(by.ship.cards, plainRow));
    fill(CREW, absorb(by.crew.cards, plainRow));
    fillMap(BOND,by.bond.bonds);
    fill(COMBO,by.combo.combos);
    fillMap(IMG,by.img.img);
    fillMap(SER_NAME,by.series.name);
    fillMap(FRANCHISE,by.series.franchise);
    fillMap(SER_TAG,by.series.tag);
    fillMap(FAC,by.series.faction_color);
    fill(ART_ORDER,by.style.styles.map(function(x){return x.key}));
    by.style.styles.forEach(function(x){ART_NAME[x.key]=x.name});
    fill(FIELDS,by.field.fields.map(function(f){return [f.name,f.weight]}));
    fillMap(TERR,by.field.grade); fillMap(TERR_WORD,by.field.word);
    fill(TAG_RULE,by.tag.derive); fill(TCOMBO,by.tag.combos);
    fill(BASE_SCHEDULE,by.rule.schedule); PACKN=by.rule.pack;
    var sc=by.rule.scale||{};
    fill(SCALE_KINDS,sc.kinds||[]);
    fill(SCALE_OPTS,(sc.options&&sc.options.length)?sc.options:[0]);
    CAP_FROM=by.rule.cap_from; CAP_BASE=(by.rule.cap_base===undefined?4:by.rule.cap_base);
    /* 고를 수 없는 주제면 원래 라운드표 그대로다 */
    var baseN=0,bi;
    for(bi=0;bi<BASE_SCHEDULE.length;bi++)if(SCALE_KINDS.indexOf(BASE_SCHEDULE[bi])>=0)baseN++;
    baseN=SCALE_KINDS.length?Math.round(baseN/SCALE_KINDS.length):0;
    if(!sc.options||!sc.options.length){fill(SCALE_OPTS,[baseN]);}
    applyScale(sc["default"]!==undefined?sc["default"]:baseN);
    calcExpPair();
    return by;
  });
}
/* 파일럿: 이름, 소속이력, 지휘,조종,전술,정치, 기질, 감응등급, 시리즈, 감응계통 */

/* 모함: 이름, 소속이력, 지휘,방어,색적,정원, 시리즈 */

/* 지휘관: 이름, 소속이력, 지휘,정비,전술,정치, 시리즈 */



/* 대표 시리즈 — 표시와 정규화에 쓴다.
   파일럿만 시리즈 뒤에 감응 계통이 하나 더 붙는다 */
function serAll(c){
  var i;
  for(i=c.length-1;i>=0;i--)if(Object.prototype.toString.call(c[i])==="[object Array]"&&i>1)return c[i];
  return [];
}
function serOf(c){var a=serAll(c);return a.length?a[0]:""}
/* 전력 정규화는 큰 계열 단위로 — 잘게 나누면 소수 기체가 과대평가된다 */

function franOf(c){var x=serOf(c);return FRANCHISE[x]||x}
function serLabel(c){return SER_NAME[serOf(c)]||serOf(c)}
/* 카드에 얹는 짧은 시리즈 딱지 — 긴 코드만 줄여 쓴다 */

function serTag(c){var x=serOf(c);return SER_TAG[x]||x}

function fc(f){return FAC[f]||"#79849A"}

/* ═══════ 열전 — 카드 한 줄 ═══════ */

function loreOf(c){return LORE[c[0]]||""}

/* 전용기 연대 */



/* ═══════ 초상 ═══════
   카드 하나에 남성체(m)·여성체(f) 두 장을 둔다.
   기체는 의인화 성별, 파일럿은 원작 성별과 그 반대.
   비워두면 진영색 자리표시자가 대신 뜬다.
   형식:  "이름":{m:"data:image/webp;base64,...", f:"...", face:[좌,상,폭]}
   prep_images.py --inject 로 자동 생성한다.
*/
/* 이미지 호스팅 주소. 옮길 때 이 한 줄만 고치면 된다. */
/* 초상은 img/ 아래에 있다. 예전에는 저장소 최상위에 쌓았는데, GitHub 의
   파일 목록 API 가 1000개에서 잘려서 그 앞에서 조용히 새 그림이 안 보이게 된다 */
var IMG_BASE="https://polos0117.github.io/atelier/img/";
function imgURL(p){return IMG_BASE+encodeURIComponent(p)}

/* ══ 저장소 파일 목록으로 IMG 자동 보강 ══
   카드명_m / _f / _casualN / _extraN .webp 규칙이면 배열을 손대지 않아도 잡힌다.
   공백은 밑줄로 써도 인식한다. 목록을 못 받아오면 기존 IMG 로만 동작한다.
   단 얼굴 좌표는 파일명에서 알 수 없어 기본값이 쓰인다. */
var GH_=(function(){
  var m=/^https?:\/\/([^.]+)\.github\.io\/([^\/]+)\//.exec(IMG_BASE);
  return m?{u:m[1],r:m[2]}:null;
})();
function mergeRepoFiles(names){
  /* 신규 파일은 register-images.py 검증 후 img.json으로 반영한다. */
  return 0;
}
/* 저장소 파일 목록으로 IMG 를 보강한다. IMG 를 받아 온 뒤에 돌아야 한다 */



var VSEED={};
/* 초상 표시 방식 — "m" · "f" · "r"(무작위) · "x"(짝의 반대, 기체 전용) */
var VIEW_P="r", VIEW_M="x";
function rollVariants(){
  VSEED={};
  var all=[].concat(MECH,PILOT,SHIP,CREW),i;
  for(i=0;i<all.length;i++)VSEED[all[i][0]]=Math.random()<.5?"m":"f";
}
function flip(v){return v==="m"?"f":"m"}
function seedOf(c){return VSEED[c[0]]||"m"}

/* ══ 화풍 몫 ══
   한 카드의 그림은 기본 몫(IMG[이름])과 화풍 몫(IMG[이름].byStyle[화풍])에 나뉘어 있다.
   둘의 속이 같은 꼴이라 어느 쪽을 집든 그리는 쪽 코드는 그대로다.
   화풍 그림은 아직 몇 장 없으니, 있는 것 중에서 판마다 하나를 뽑아 섞는다. */
function artBuckets(name){
  var src=IMG[name]; if(!src)return [];
  var out=[],bs=src.byStyle||{},i,k;
  if(src.m||src.f)out.push({k:"",b:src});
  for(i=0;i<ART_ORDER.length;i++){
    k=ART_ORDER[i];
    if(bs[k]&&(bs[k].m||bs[k].f))out.push({k:k,b:bs[k]});
  }
  /* 목록에 없는 화풍이라도 그림이 있으면 버리지 않는다 */
  for(k in bs)if(ART_ORDER.indexOf(k)<0&&(bs[k].m||bs[k].f))out.push({k:k,b:bs[k]});
  return out;
}
var ASEED={};
/* 판마다 한 번만 굴린다. 패를 다시 그릴 때마다 화풍이 바뀌면 눈이 어지럽다 */
function rollArt(){
  ASEED={};
  for(var n in IMG){
    var bk=artBuckets(n);
    if(bk.length>1)ASEED[n]=bk[Math.floor(Math.random()*bk.length)].k;
  }
}
function artBucket(name){
  var bk=artBuckets(name); if(!bk.length)return null;
  var want=ASEED[name]||"",i;
  for(i=0;i<bk.length;i++)if(bk[i].k===want)return bk[i].b;
  return bk[0].b;
}
function pilotView(c){return VIEW_P==="r"?seedOf(c):VIEW_P}
/* 파일럿은 설정대로, 기체는 설정이 "반대"면 짝의 반대를 따른다 */
function variantOf(card,partner){
  if(partner)return VIEW_M==="x"?flip(pilotView(partner))
            :VIEW_M==="r"?seedOf(card):VIEW_M;
  if(card===undefined)return "m";
  var isPilot=PILOT.indexOf(card)>=0;
  if(isPilot)return pilotView(card);
  var vm=VIEW_M==="x"?"r":VIEW_M;
  return vm==="r"?seedOf(card):vm;
}
function hashOf(s){var h=0,i;for(i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))&0xffff;return h}

/* 이미지 로드 실패 시 자리표시자로 대체 (미리보기·오프라인 대응) */
var FB={},FBN=0;



/* 얼굴 크롭 — [좌측비율, 상단비율, 폭비율].
   face가 배열이면 남녀 공통, {m:[...],f:[...]}면 배리언트별로 쓴다 */
var ASPECT={"기체":1.5,"파일럿":1.5,"지휘관":4/3,"함":9/16};
var FACE_DEF=[.34,.03,.30];
/* 저장된 상자는 폭이 카드마다 제각각이라 확대율이 들쭉날쭉했다.
   그래서 폭은 쓰지 않고 고정 축척으로 자르되, 얼굴 중심만 위치 기준으로 쓴다.
   FACE_W  : 잘라낼 폭 (이미지 폭 대비)
   FACE_TOP: 얼굴 중심이 잘린 상자에서 위에서 몇 지점에 오게 할지 */
var FACE_W=0.40, FACE_TOP=0.38;
/* 화풍 몫에는 얼굴 좌표가 없는 게 보통이라 기본 몫 것을 빌린다.
   같은 인물을 같은 구도로 뽑았다면 대개 맞고, 어긋나면 그 화풍 몫에 face 를 적으면 된다 */
function faceOf(src,v,base){
  var f=(src&&src.face)||(base&&base.face);
  if(!f)return FACE_DEF;
  if(f.length===3&&typeof f[0]==="number")return f;
  return f[v]||f[flip(v)]||FACE_DEF;
}

/* 일상컷·특별컷의 성별 몫. 예전 자료는 배열로 와서 그때는 여성으로 친다 */
function cutsOf(bucket,slot,v){
  var box=bucket&&bucket[slot];
  if(!box)return [];
  if(Object.prototype.toString.call(box)==="[object Array]")return v==="f"?box:[];
  return box[v]||[];
}

var AV_CLS={"기체":"mech","파일럿":"pilot","함":"ship","지휘관":"crew"};

/* ═══════ 시리즈별 정규화 ═══════ */
function mp(m){return m[2]*.20+m[3]*.35+m[4]*.20+m[5]*.25}
function pp(p){return p[2]*.15+p[3]*.60+p[4]*.25}
function sp(s){return s[2]*.50+s[3]*.30+s[4]*.20}
function cp(c){return c[2]*.35+c[3]*.20+c[4]*.30+c[5]*.15}
function normalize(arr,pw,si,i0,i1){
  var by={},i,j,k;
  for(i=0;i<arr.length;i++){var s=franOf(arr[i]);if(!by[s]||pw(arr[i])>by[s])by[s]=pw(arr[i])}
  var T=0;for(k in by)if(by[k]>T)T=by[k];
  for(i=0;i<arr.length;i++){
    var f=T/by[franOf(arr[i])];
    if(f<=1.001)continue;
    for(j=i0;j<=i1;j++)arr[i][j]=Math.min(99,Math.round(arr[i][j]*f));
  }
}
/* 카드를 받아 온 뒤에 한 번 돌린다 */
function normalizeAll(){
  normalize(MECH,mp,8,2,5);
  normalize(PILOT,pp,8,2,5);
  normalize(SHIP,sp,6,2,4);
  normalize(CREW,cp,6,2,5);
}

/* ═══════ 규칙 ═══════ */
var VOL={"폭주":1,"오만":1};
function temper(a,b){
  if((a==="폭주"&&b==="냉정")||(a==="냉정"&&b==="폭주")||
     (a==="오만"&&b==="헌신")||(a==="헌신"&&b==="오만"))return .20;
  if(a===b)return VOL[a]?-.15:.08;
  return 0;
}
/* 특수 계열 기체 ↔ 감응 계통 대응 */
var LINE={"사이코뮤":"뉴타입","핵동력":"코디네이터","GN드라이브":"이노베이터",
  "아르비":"아할리아","GUND":"데이터스톰","제로시스템":"제로내성",
  "모빌트레이스":"명경지수","플래시시스템":"뉴타입","AGE시스템":"X라운더",
  "미노프스키드라이브":"뉴타입","나노스킨":"뉴타입"};
var NTB=[-.20,.10,.18,.25];

/* ═══════ 전장 ═══════
   판마다 전장을 하나 뽑는다. 기체의 지형 적성(m[10])이 여기서 점수가 된다.
   수상은 뽑지 않는다 — 적합한 기체가 788 중 열여섯 뿐이라 판이 안 선다.

   우주와 지상은 아홉 중 아홉이 적합해서 사실상 예전 그대로 굴러가고,
   수중은 넷 중 셋이 '보통' 이라 다 같이 굼뜬 판이 되며, 대기권은 열 중 일곱이
   부적합이라 날 수 있는 기체를 찾는 판이 된다. 어려운 전장을 드물게 둔 것은
   제약이 매 판 오면 제약이 아니라 세금이 되기 때문이다. */
/* ═══════ 씨앗 ═══════
   판 하나를 통째로 되살리기 위한 것이다. 같은 씨앗이면 전장도, 좌석 순서도,
   팩에 오는 카드도, 신참이 헛발질하는 자리까지 그대로 나온다.

   묶는 것은 판을 바꾸는 난수뿐이다 — 초상 표시, 화풍 고르기, 적 함대의 대사는
   승부에 관여하지 않으므로 Math.random 에 남겨 둔다. 그림이 늘어나거나 화풍이
   붙어도 같은 씨앗이 같은 판을 내야 검증에 쓸 수 있다.

   주소에 ?seed=39281741 을 붙이면 그 씨앗으로 첫 판을 연다. 그 뒤의 판은
   새로 굴리되, 판마다 쓴 씨앗을 판정 화면에 적어 둔다. */
var GAME_SEED=0, rngState=1, seedPinned=null;
function mulberry32(){
  rngState=(rngState+0x6D2B79F5)>>>0;
  var t=rngState;
  t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
}
function rng(){return mulberry32()}
function rngInt(n){return Math.floor(rng()*n)}
function newSeed(){
  if(seedPinned!==null){var v=seedPinned;seedPinned=null;return v}
  return (Math.random()*4294967296)>>>0;
}
function rngReset(sd){GAME_SEED=sd>>>0;rngState=(GAME_SEED||1)>>>0}
(function(){
  var m=/[?&]seed=(\d+)/.exec(location.search);
  if(m)seedPinned=(+m[1])>>>0;
})();

var FIELDS=[];          /* [이름, 뽑힐 비율] — data/field.json 에서 채운다 */
var FIELD="";
function rollField(){
  var r=rng(),i;
  for(i=0;i<FIELDS.length;i++){r-=FIELDS[i][1];if(r<=0)return FIELD=FIELDS[i][0]}
  return FIELD=FIELDS[0][0];
}
var TERR={};            /* 지형 등급 → 짝 점수 감점 */
var TERR_WORD={};       /* 지형 등급 → 화면에 쓸 말 */
function terrainOf(m){
  var t=m[10];
  return t&&TERR[t[FIELD]]!==undefined?TERR[t[FIELD]]:0;
}
function terrainWord(m){
  var t=m[10];
  return t?(TERR_WORD[t[FIELD]]||""):"";
}
/* 계통이 맞으면 온전히, 다르면 절반만. 감응이 없으면 특수기를 못 다룬다 */
function ntBonus(p,m){
  var need=LINE[m[7]];
  if(!need)return 0;
  if(p[7]===0)return NTB[0];
  return p[9]===need?NTB[p[7]]:NTB[p[7]]*.5;
}
function overlap(a,b){for(var i=0;i<a.length;i++)if(b.indexOf(a[i])>=0)return true;return false}
function syncParts(m,p){
  var t=temper(m[6],p[6]), n=ntBonus(p,m),
      s=overlap(serAll(m),serAll(p))?.10:0, o=overlap(m[1],p[1])?.05:0,
      b=BOND[p[0]+"|"+m[0]]||0, g=terrainOf(m);
  return {t:t,n:n,s:s,o:o,b:b,g:g,raw:1+t+n+s+o+b+g,
    xline:!!(LINE[m[7]]&&p[7]>0&&p[9]!==LINE[m[7]])};
}
/* 지형은 상한 뒤에 얹는다.
   예전에는 지형까지 한데 더한 뒤 [.70, 1.45] 로 잘랐다. 그러면 다른 보정만으로
   이미 상한을 넘는 전용기 짝은 지형이 아무리 나빠도 결과가 같아, 최강 조합에는
   전장 규칙이 걸리지 않았다.

   이백 판 삼천육백 짝을 재어 보니 상한에 닿은 짝이 8.0%, 지형 감점이 걸린 짝이
   29.3% 였고, 그 가운데 5.4% 는 감점이 통째로 사라졌다. 의도한 감점 96.1 중
   89.5 만 실제로 깎여, 6.9% 가 상한에 먹히고 있었다.

   상한을 지형 앞에서 걸면 잘리는 것은 "타고난 궁합" 뿐이고, 전장은 그 위에서
   따로 값을 치른다. 바닥(0.70)은 그대로 지킨다. */
function sync(m,p){
  var P=syncParts(m,p);
  var base=Math.max(.70,Math.min(1.45,P.raw-P.g));   /* 지형을 뺀 궁합에만 상한 */
  return Math.max(.70,base+P.g);
}
function pairScore(m,p){return (mp(m)/100)*(pp(p)/100)*sync(m,p)*100}

/* 진영 시너지 — 현소속 1.0 / 과거 0.5 */
/* ═══════ 인연 — 연대 · 혈연 · 악연 ═══════
   m: 구성원 (기체·파일럿·함·지휘관 어느 타입이든 이름으로 건다)
   t: 몇 명이 모였을 때 몇 점인지.  k:1 이면 혈연 */

/* 팀에 걸린 인연을 모두 찾는다 */
var justFired=[];    /* 방금 맺어진 인연 — 도크에서 한 번 번쩍인다 */

function pledges(t){
  var all=[].concat(t.함,t.기체,t.파일럿,t.지휘관),names={},i,j;
  for(i=0;i<all.length;i++)names[all[i][0]]=1;
  var out=[];
  for(i=0;i<COMBO.length;i++){
    var cb=COMBO[i],hit=0,got=[];
    for(j=0;j<cb.m.length;j++)if(names[cb.m[j]]){hit++;got.push(cb.m[j])}
    var best=0,bk=0,k;
    for(k in cb.t){if(hit>=+k&&+k>=bk){bk=+k;best=cb.t[k]}}
    if(best)out.push({n:cb.n,v:best,kin:!!cb.k,got:got,need:cb.m});
  }
  return out.concat(tagPledges(t));
}


/* ═══════ 태그 ═══════
   시리즈·진영이 작품 안을 묶는다면, 태그는 작품을 가로질러 묶는다.
   색과 역할만 표로 적고, 계보는 이름과 계열에서 자동으로 뽑는다.
   태그 자체는 능력치에 영향이 없다 — 오로지 아래 TCOMBO 의 걸쇠 노릇만 한다 */



/* 드래프트 팩에 뜨는 비중. 적지 않은 카드는 1 이다.
   도감에는 다 있고 팩에서만 굵기를 달리한다. */

function wOf(c){var w=WEIGHT[c[0]];return w===undefined?1:w}

var MECH_SET=null;
/* 무엇을 태그로 볼지는 data/tag.json 이 정한다. 예전에는 이름에 "자쿠"·"건담" 이
   들어가는지를 여기서 직접 봤는데, 그러면 주제가 바뀌는 순간 태그가 한 장도 안
   붙어 태그 인연이 통째로 죽는다. 규칙은 그대로 두고 무엇을 찾을지만 자료로 뺐다 */
var TAG_RULE=[], TCOMBO=[];
var FIELD_OF={color:TAG_COLOR, role:TAG_ROLE};
function tagsOf(c){
  if(!MECH_SET){MECH_SET={};for(var z=0;z<MECH.length;z++)MECH_SET[MECH[z][0]]=1}
  var n=c[0];
  if(!MECH_SET[n])return [];      /* 태그는 기체에만 붙인다 */
  var out=[],done={},i,r,hit;
  for(i=0;i<TAG_RULE.length;i++){
    r=TAG_RULE[i];
    if(r.group&&done[r.group])continue;
    if(r.tag_from_field){
      var m=FIELD_OF[r.tag_from_field];
      if(m&&m[n])out.push(m[n]);
      continue;
    }
    hit=(r.name_has&&n.indexOf(r.name_has)>=0)||(r.flag&&FLAG[r.flag]&&FLAG[r.flag][n])||
        (r.system&&c[7]===r.system)||
        (r.gge_tag&&(GGE_TAG[n]||[]).indexOf(r.gge_tag)>=0);
    /* 자료가 "아니다" 라고 못박았으면 이름이 무엇이든 붙이지 않는다 */
    if(hit&&r.flag&&NOFLAG[r.flag]&&NOFLAG[r.flag][n])hit=false;
    if(hit){out.push(r.tag); if(r.group)done[r.group]=1}
  }
  return out;
}
/* 태그로 걸리는 연대 — 이름이 아니라 태그 수를 센다. 표는 data/tag.json 에 있다 */
function tagPledges(t){
  var bag={},i,j,out=[];
  for(i=0;i<t.기체.length;i++){
    var tg=tagsOf(t.기체[i]);
    for(j=0;j<tg.length;j++){(bag[tg[j]]=bag[tg[j]]||[]).push(t.기체[i][0])}
  }
  for(i=0;i<TCOMBO.length;i++){
    var tc=TCOMBO[i],got=bag[tc.g]||[],hit=got.length,best=0,bk=0,k;
    for(k in tc.t){if(hit>=+k&&+k>=bk){bk=+k;best=tc.t[k]}}
    if(best)out.push({n:tc.n,v:best,kin:false,got:got,need:got,tag:tc.g});
  }
  return out;
}

var PLEDGE_MUL=.7;   // 인연이 승부를 지나치게 가르지 않도록 눌러 둔다
var SYN={2:10,3:26,4:46,5:70,6:96,7:124,8:154};
function synergy(t){
  var cnt={},k,i,arr=[].concat(t.함,t.기체,t.파일럿,t.지휘관);
  for(i=0;i<arr.length;i++){
    var fs=arr[i][1],j;
    for(j=0;j<fs.length;j++)cnt[fs[j]]=(cnt[fs[j]]||0)+(j===fs.length-1?1:.5);
  }
  var out=[],tot=0;
  for(k in cnt){var n=Math.round(cnt[k]);if(n>=2){var v=SYN[n]||154;out.push([k,n,v]);tot+=v}}
  out.sort(function(a,b){return b[2]-a[2]});
  return {rows:out,total:tot};
}

/* ═══════ 조 배정 ═══════
   예전에는 점수 높은 짝부터 집어 삼키는 탐욕이었다. 그러면 좋은 기체와 좋은
   파일럿이 먼저 서로를 차지해 버려, 남은 것들이 형편없이 붙는 일이 생긴다.
   백 판 삼백 편성을 완전탐색과 견주니 마흔한 편성 중 하나 꼴로 손해가 났고,
   평균은 크지 않았으나(0.53%) 큰 것은 28점이라 승부를 뒤집을 만했다.

   기체와 파일럿이 여섯씩이면 배정하는 경우가 720 뿐이다. 전부 세어 보는 편이
   빠르고 확실하다. 다만 주제가 커져 자리가 늘 수도 있으므로, 경우가 너무
   많아지면 탐욕에서 시작해 두 짝씩 바꿔 보며 더 나아지지 않을 때까지 다듬는다.

   정원 초과까지 함께 본다 — 넘친 조는 60% 라, 짝 점수 총합만 높인다고
   최종 점수가 높아지지 않는다. */
var SEARCH_CAP=5040;          /* 이보다 경우가 많으면 완전탐색을 접는다 */

/* 편성 하나의 값. evaluate() 가 세는 방식과 같아야 한다 —
   짝은 점수 내림차순으로 정원까지 100%, 넘으면 60%. 남은 것은 0.35 */
function crewWorth(vals,unM,unP,cap){
  var v=vals.slice().sort(function(a,b){return b-a}),t=0,i;
  for(i=0;i<v.length;i++)t+=(i<cap?v[i]:v[i]*.60);
  for(i=0;i<unM.length;i++)t+=mp(unM[i])*.35;
  for(i=0;i<unP.length;i++)t+=pp(unP[i])*.35;
  return t;
}
/* 기체마다 파일럿을 하나씩. 짝은 될 수 있는 대로 많이 짓는다 */
function matchExact(S,M,P,cap){
  var nm=M.length,np=P.length,k=Math.min(nm,np);
  var used=[],pick=[],bestV=-1e18,bestPick=null,i;
  for(i=0;i<np;i++)used.push(false);
  /* 남은 기체들이 받을 수 있는 최고값 — 이보다 나아질 수 없으면 가지를 자른다 */
  var rowMax=[];
  for(i=0;i<nm;i++){var mx=0,j;for(j=0;j<np;j++)if(S[i][j]>mx)mx=S[i][j];rowMax[i]=mx}
  var suffix=[];suffix[nm]=0;
  for(i=nm-1;i>=0;i--)suffix[i]=suffix[i+1]+rowMax[i];
  /* 가지를 자를 때 쓰는 한계값에는 대기 점수도 얹어야 한다. 짝 점수만으로 재면
     대기가 많은 가지를 실제보다 낮게 보고 잘라 버린다 */
  var soloMax=0;
  for(i=0;i<nm;i++)soloMax+=mp(M[i])*.35;
  for(i=0;i<np;i++)soloMax+=pp(P[i])*.35;
  function rec(mi,made,sum){
    if(made+(nm-mi)<k)return;                 /* 짝을 다 못 채우면 버린다 */
    if(bestPick&&sum+suffix[mi]+soloMax<bestV-1e-9)return;
    if(mi===nm){
      var vals=[],unM=[],unP=[],a,b;
      for(a=0;a<nm;a++){if(pick[a]<0)unM.push(M[a]);else vals.push(S[a][pick[a]])}
      for(b=0;b<np;b++)if(!used[b])unP.push(P[b]);
      var v=crewWorth(vals,unM,unP,cap);
      if(v>bestV){bestV=v;bestPick=pick.slice()}
      return;
    }
    for(var j=0;j<np;j++)if(!used[j]){
      used[j]=true;pick[mi]=j;rec(mi+1,made+1,sum+S[mi][j]);used[j]=false;
    }
    if(made+(nm-mi-1)>=k){pick[mi]=-1;rec(mi+1,made,sum)}
  }
  rec(0,0,0);
  return bestPick;
}
/* 자리가 많아 다 세지 못할 때 — 탐욕으로 시작해 두 짝씩 맞바꿔 본다 */
function matchLocal(S,M,P,cap){
  var nm=M.length,np=P.length,i,j;
  var cand=[];
  for(i=0;i<nm;i++)for(j=0;j<np;j++)cand.push([S[i][j],i,j]);
  cand.sort(function(a,b){return b[0]-a[0]});
  var pick=[],um={},up={};
  for(i=0;i<nm;i++)pick[i]=-1;
  for(i=0;i<cand.length;i++){
    var mi=cand[i][1],pi=cand[i][2];
    if(um[mi]||up[pi])continue;
    um[mi]=up[pi]=1;pick[mi]=pi;
  }
  function worthOf(pk){
    var vals=[],unM=[],unP=[],taken={},a,b;
    for(a=0;a<nm;a++){if(pk[a]<0)unM.push(M[a]);else{vals.push(S[a][pk[a]]);taken[pk[a]]=1}}
    for(b=0;b<np;b++)if(!taken[b])unP.push(P[b]);
    return crewWorth(vals,unM,unP,cap);
  }
  var cur=worthOf(pick),moved=true,guard=0;
  while(moved&&guard++<40){
    moved=false;
    for(i=0;i<nm;i++)for(j=i+1;j<nm;j++){
      var t=pick[i];pick[i]=pick[j];pick[j]=t;
      var v=worthOf(pick);
      if(v>cur+1e-9){cur=v;moved=true}else{t=pick[i];pick[i]=pick[j];pick[j]=t}
    }
  }
  return pick;
}
function assign(t){
  var M=t.기체,P=t.파일럿,nm=M.length,np=P.length,out=[],i,j;
  if(!nm||!np){
    for(i=0;i<nm;i++)out.push({s:mp(M[i])*.35,m:M[i],p:null});
    for(i=0;i<np;i++)out.push({s:pp(P[i])*.35,m:null,p:P[i]});
    return out;
  }
  var S=[];                                   /* 짝 점수는 한 번만 잰다 */
  for(i=0;i<nm;i++){S[i]=[];for(j=0;j<np;j++)S[i][j]=pairScore(M[i],P[j])}
  var cap=capOf(t);
  var big=Math.max(nm,np),small=Math.min(nm,np),ways=1;
  for(i=0;i<small;i++)ways*=(big-i);
  var pick=(ways<=SEARCH_CAP)?matchExact(S,M,P,cap):matchLocal(S,M,P,cap);
  var taken={};
  for(i=0;i<nm;i++)if(pick[i]>=0){out.push({s:S[i][pick[i]],m:M[i],p:P[pick[i]]});taken[pick[i]]=1}
  out.sort(function(a,b){return b.s-a.s});    /* 정원 초과는 낮은 조부터 — evaluate 가 순서대로 센다 */
  for(i=0;i<nm;i++)if(pick[i]<0)out.push({s:mp(M[i])*.35,m:M[i],p:null});
  for(j=0;j<np;j++)if(!taken[j])out.push({s:pp(P[j])*.35,m:null,p:P[j]});
  return out;
}

/* ═══════ 적장의 눈 ═══════
   인연을 얼마나 셈하는지가 난이도를 가르는 손잡이다. 예전에는 보거나 못 보거나
   둘뿐이었고, 신참과 숙련이 함께 눈을 감았다. 그러면 힌트로 인연을 보고 두는
   사람과 셈하는 것이 아예 달라진다.

   그렇다고 숙련에게 온전히 보여 주면 에이스와 구별이 없어진다. 실제로 재어
   보니 아군 승률이 60.7% 에서 36.0% 로 떨어져 에이스(31.3%)와 붙어 버렸다.
   그래서 보는 정도를 단계로 두었다 — 신참은 못 보고, 숙련은 어렴풋이,
   에이스는 온전히.

   가중치를 반으로 줄여 보았으나 소용이 없었다. 어느 카드를 집을지는 순위로
   정해지므로, 인연 점수를 반으로 깎아도 순위가 거의 그대로였다(32.7%).

   그래서 무게가 아니라 종류로 갈랐다. 이름으로 맺힌 인연 — 아무로와 뉴 건담,
   샤아와 사잔비 같은 것 — 은 연의를 아는 사람이면 누구나 안다. 반면 태그를
   쌓아 만드는 인연 — 건담 여섯, 붉은 기체 넷 — 은 판을 세어 봐야 보인다.
   숙련은 앞의 것만, 에이스는 둘 다 본다.

   0 = 아무것도, 1 = 이름으로 맺힌 것만, 2 = 모두 */
var PLEDGE_SEE=[0,1,2];
function evaluate(t,see){
  if(see===undefined)see=2;   /* 판정과 화면은 늘 온전히 센다 */
  var rows=[],total=0,i,units=assign(t),cap=capOf(t),over=0;
  var paired=units.filter(function(u){return u.m&&u.p});
  for(i=0;i<paired.length;i++){
    var v=paired[i].s;
    if(i>=cap){v*=.60;over++}
    total+=v;
  }
  rows.push(["출격 "+paired.length+"조"+(over?" (정원초과 "+over+"조 60%)":""),Math.round(total)]);
  var solo=units.filter(function(u){return !(u.m&&u.p)});
  if(solo.length){
    var sv=0;for(i=0;i<solo.length;i++)sv+=solo[i].s;
    rows.push(["미편성 "+solo.length+"기 · 대기",Math.round(sv)]);total+=sv;
  }
  if(t.함.length){
    var s=t.함[0],v2=sp(s)*.55;
    rows.push(["모함 "+s[0]+" · 정원 "+(s[5]+CAP_BONUS),Math.round(v2)]);total+=v2;
  }else{rows.push(["모함 부재",-60]);total-=60}
  for(i=0;i<t.지휘관.length;i++){
    var c=t.지휘관[i],v3=cp(c)*.42;
    rows.push(["지휘관 "+c[0],Math.round(v3)]);total+=v3;
  }
  var sy=synergy(t);
  for(i=0;i<sy.rows.length;i++)
    rows.push(["결속 · "+sy.rows[i][0]+" "+sy.rows[i][1],Math.round(sy.rows[i][2]*.35)]);
  total+=sy.total*.35;
  if(see>0){
    var pg=pledges(t);
    if(see<2)pg=pg.filter(function(g){return !g.tag});   /* 태그로 쌓는 것은 못 본다 */
    for(i=0;i<pg.length;i++){
      var pv=Math.round(pg[i].v*PLEDGE_MUL);
      var nm=pg[i].n.replace(/^(혈연|악연) · /,"");
    rows.push([(pg[i].v<0?"악연 · ":pg[i].kin?"혈연 · ":"연대 · ")+nm,pv]);
      total+=pv;
    }
  }
  var mission=objectiveScore(t);
  if(OBJECTIVE){rows.push(['작전 · '+OBJECTIVE.name,mission]);total+=mission}
  return {rows:rows,total:Math.round(total)};
}

/* Public objectives add at most six points per planned pair. No card stats are changed. */
function objectiveCount(t,o){
  if(!o)return 0;
  if(o.id==='mass')return t.기체.filter(function(c){return tagsOf(c).indexOf('양산기')>=0}).length;
  if(o.id==='mixed'){
    var bag={};t.기체.forEach(function(c){var f=c[1];if(f.length)bag[f[f.length-1]]=1});
    return Object.keys(bag).length;
  }
  if(!t.지휘관.length)return 0;
  var f=t.지휘관[0][1],current=f[f.length-1];
  return t.기체.concat(t.파일럿).filter(function(c){return c[1][c[1].length-1]===current}).length;
}
function objectiveScore(t){
  if(!OBJECTIVE)return 0;
  return Math.round(OBJECTIVE.max*Math.min(OBJECTIVE.target,objectiveCount(t,OBJECTIVE))/OBJECTIVE.target);
}
function rollObjective(){
  OBJECTIVE=null;if(!objectiveOn)return;
  var n=futurePairs(),target=Math.max(2,Math.ceil(n/2));if(!n)return;
  var opts=[{id:'command',name:'지휘 계통',rule:'첫 지휘관과 현 소속이 같은 기체·파일럿',target:target}];
  if(MECH.filter(function(c){return tagsOf(c).indexOf('양산기')>=0}).length>=target*3)
    opts.push({id:'mass',name:'양산 전력',rule:'양산기 태그의 기체',target:target});
  var factions={};MECH.forEach(function(c){if(c[1].length)factions[c[1][c[1].length-1]]=1});
  var mixedTarget=Math.max(3,Math.ceil(n/2));
  if(Object.keys(factions).length>=mixedTarget)
    opts.push({id:'mixed',name:'혼성 편대',rule:'기체의 서로 다른 현 소속',target:mixedTarget});
  // Separate deterministic draw so enabling objectives does not reshuffle the draft pool.
  OBJECTIVE=opts[(GAME_SEED>>>0)%opts.length];OBJECTIVE.max=n*6;
}

/* ═══════ 진행 ═══════ */
var SCHEDULE=[];   /* 라운드마다 무엇을 뽑는지 — data/rule.json 에서 채운다 */
/* ═══════ 편성 규모 ═══════
   카드가 765 기까지 늘어 여섯 조는 좁아졌다. 몇 조를 꾸릴지 사람이 고르게 한다.
   무엇이 늘어나는지는 rule.json 의 scale.kinds 가 정한다 — 함과 지휘관은 그대로다.

   자리를 늘려도 정원이 빡빡해지지는 않는다. 웃돈이 자리 수에서 cap_base 를 뺀
   값이라 자리를 따라 함께 커지기 때문이다. 정원을 살리려면 cap_base 를 올려야
   하고, 그것은 별개의 손잡이다. */
var DRAFT_FLOW='cross', objectiveOn=true, OBJECTIVE=null;
var BASE_SCHEDULE=[], SCALE_KINDS=[], SCALE_OPTS=[], SCALE=0, CAP_FROM="", CAP_BASE=4;
function buildSchedule(n){
  var count={},out=[];
  BASE_SCHEDULE.forEach(function(t){count[t]=(count[t]||0)+1});
  SCALE_KINDS.forEach(function(t){if(count[t])count[t]=n});
  function put(t){if(count[t]>0){out.push(t);count[t]--;return true}return false}
  if(DRAFT_FLOW==='classic'){BASE_SCHEDULE.forEach(function(t){while(count[t]>0)put(t)});return out}
  while(put('함')){}                 // A flagship establishes capacity first.
  put('지휘관');                     // One commander gives the early faction/relationship anchor.
  var pairRounds=0;
  while((count['기체']||0)+(count['파일럿']||0)>0){
    put('기체');put('파일럿');pairRounds++;
    if(pairRounds%2===0)put('지휘관');
  }
  BASE_SCHEDULE.forEach(function(t){while(count[t]>0)put(t)});
  return out;
}
/* 규모가 바뀌면 라운드표와 정원 웃돈을 함께 다시 짠다 */
function applyScale(n){
  if(SCALE_OPTS.length&&SCALE_OPTS.indexOf(n)<0)n=SCALE_OPTS[0];
  SCALE=n;
  fill(SCHEDULE,buildSchedule(n));
  CAP_BONUS=Math.max(0,slotsOf(CAP_FROM)-CAP_BASE);
}
/* 편성 규모에 맞춰 정원을 넉넉히 잡는다 — 기체 수에서 함 평균 정원을 뺀 만큼 */
function slotsOf(type){var n=0,i;for(i=0;i<SCHEDULE.length;i++)if(SCHEDULE[i]===type)n++;return n}
var CAP_BONUS=0;   /* 자료를 받은 뒤 정한다 */
function capOf(t){return t.함.length?t.함[0][5]+CAP_BONUS:0}
/* ═══════ 정원의 앞일 ═══════
   모함은 첫 라운드에 고른다. 그때는 기체도 파일럿도 없어 정원이 점수에 잡히지
   않고, sp() 에도 정원이 들어가지 않는다. 그래서 적장은 정원이 모자라 뒷날 한
   조가 60% 로 싸우게 될 것을 첫 수에서 보지 못한다.

   재어 보니 정원을 빡빡하게 만들어도(cap_base 5) 고르는 배의 정원이 4.64 로
   꿈쩍하지 않았다. 앞일을 못 보니 당연한 일이다.

   모자랄 조 하나에 한 조 값의 40% 를 매긴다 — 정원을 넘긴 조는 60% 만 받으므로
   잃는 것이 꼭 그만큼이다. 한 조 값은 로스터에서 한 번만 어림한다. */
var EXP_PAIR=95;
function calcExpPair(){
  if(!MECH.length||!PILOT.length)return;
  var m=MECH.map(mp).sort(function(a,b){return a-b}),
      p=PILOT.map(pp).sort(function(a,b){return a-b});
  EXP_PAIR=(m[m.length>>1]/100)*(p[p.length>>1]/100)*100;
}
function futurePairs(){return Math.min(slotsOf("기체"),slotsOf("파일럿"))}
/* 이 모함을 골랐을 때 뒷날 잃을 값 (음수) */
function capForesight(ship){
  var need=futurePairs(), have=ship[5]+CAP_BONUS;
  var miss=Math.max(0,need-have);
  return miss?-miss*EXP_PAIR*0.40:0;
}
var TYPE_LABEL={"함":"모함 선정","기체":"기체 확보","파일럿":"파일럿 영입","지휘관":"지휘관 배치"};
var SEATS=["아군","적 1","적 2"],PACKN=9;   /* PACKN 은 data/rule.json 이 덮는다 */
var sharedPack=true;   // 한 팩을 셋이 나눠 집는다
var pools,teams,round,seq,si,busy,log,openFoe={};
/* 적 함대의 차례는 타이머로 이어진다. 판이 끝나거나 새로 열리면 그 사이에 걸려
   있던 타이머가 뒤늦게 깨어나 없는 라운드를 집거나 새 판에 끼어들 수 있다.
   판마다 번호를 매겨, 제 판이 아닌 타이머는 조용히 물러나게 한다 */
var gen=0;
function schedStep(){var g=gen;setTimeout(function(){if(g===gen)step()},380)}

/* ═══════ 설정 ═══════ */
var AI_LV=1, AI_NAME=["신참","숙련","에이스"];
var fogOn=false, hintOn=true, exhaustOn=false;
var REROLL_MAX=1, RR_OPT=[0,1,3,5];   // 양편이 한 판에 쓸 수 있는 보급 횟수
var rerolls=0, discard={함:[],기체:[],파일럿:[],지휘관:[]}, shown={};
var aiRR=[0,0,0];
/* 적 함대가 물리는 기준 — 신참은 쓰지 않고, 눈이 높을수록 자주 물린다 */
var RR_K=[-1,.80,.95];
var RR_SAY=["이 보급으론 어림없다","다른 기체를 요청한다","목록을 다시 받겠다","쓸 만한 것이 보이지 않는군"];

/* ═══════ 기록 ═══════ */
/* ═══════ 기록 자리 ═══════
   주제마다 따로 쌓는다. 예전에는 자리가 하나뿐이라 ?set= 으로 다른 주제를 열어도
   전적·도장·훈장·기용 기록이 건담 것에 섞여 들어갔다. 카드 이름부터 다르니
   도장첩과 기용 기록은 아예 말이 안 되는 상태로 뒤섞인다.

   건담은 예전 자리에 쌓아 둔 것이 있으므로, 새 자리가 비어 있을 때 한 번만
   옮겨 온다. 옛 자리는 지우지 않고 그대로 둔다 — 옮기는 데 잘못이 있어도
   되돌릴 수 있게. */
var SET_NAME=(function(){
  var m=/[?&]set=([A-Za-z0-9_-]+)/.exec(location.search);
  return m?m[1]:"gundam";
})();
var REC_KEY="draft_rec_v1:"+SET_NAME;
var REC_KEY_OLD="gundam_draft_rec_v1";   /* 주제를 가르기 전의 자리 */
function blankRec(){
  return {v:1,games:0,first:0,second:0,third:0,best:0,stamps:{},feats:{},lv:{},seen:{},picks:{}};
}
function recLoad(){
  var raw=null;
  try{raw=localStorage.getItem(REC_KEY)}catch(e){}
  if(raw===null&&SET_NAME==="gundam"){
    /* 옛 자리에서 한 번만 옮겨 온다 */
    try{
      var o=localStorage.getItem(REC_KEY_OLD);
      if(o!==null){
        var m=JSON.parse(o);
        if(m&&m.v===1){localStorage.setItem(REC_KEY,o);REC_MOVED=(m.games||0);return m}
      }
    }catch(e){}
  }
  try{var r=JSON.parse(raw);if(r&&r.v===1)return r}catch(e){}
  return blankRec();
}
var REC_MOVED=-1;   /* 0 이상이면 이번에 옮겨 왔다는 뜻 */
function recSave(){try{localStorage.setItem(REC_KEY,JSON.stringify(REC))}catch(e){}}
var REC=recLoad();

/* ═══════ 이름 정규화 이사 ═══════
   옛 이름으로 쌓인 기록을 정식 표기로 옮긴다. 한 번만 돈다 */
/* 이름 이사표는 data/rename.json 에 있다. 예전에는 이 파일 안에 박혀 있었는데,
   그러면 툴킷(prompt.html)이 같은 표를 따로 들고 있어야 하고 한쪽만 고치면
   갈린다. 실제로 툴킷에는 표가 아예 없어서, 이름을 바꾼 카드의 의인화 설정이
   옛 이름에 남아 길을 잃었다. 이제 읽는 곳이 하나다. */
var RENAME_MAP={}, RENAME_REN=0;
function migrateNames(){
  if(!RENAME_REN||REC.ren>=RENAME_REN)return;
  var k,i,keys=["seen","picks"];
  for(i=0;i<keys.length;i++){
    var src=REC[keys[i]]||{},dst={};
    for(k in src){
      var nk=RENAME_MAP[k]||k;
      dst[nk]=(dst[nk]||0)+(typeof src[k]==="number"?src[k]:1);
    }
    REC[keys[i]]=dst;
  }
  REC.ren=RENAME_REN;
  recSave();
}
/* 표를 받아온 뒤에 부른다. REC.seen · REC.picks 를 처음 읽는 곳은 판이
   시작된 뒤라, 자료 받기를 기다려도 늦지 않는다 */


/* ═══════ 설정 저장 ═══════ */
var CFG_KEY="gundam_draft_cfg_v1";
function cfgSave(){
  try{localStorage.setItem(CFG_KEY,JSON.stringify({
    lv:AI_LV, fog:fogOn, hint:hintOn, ex:exhaustOn,
    rr:REROLL_MAX, flow:DRAFT_FLOW, objective:objectiveOn, shared:sharedPack, vp:VIEW_P, vm:VIEW_M, dv:dexVar, sc:SCALE
  }))}catch(e){}
}
function cfgLoad(){
  try{
    var c=JSON.parse(localStorage.getItem(CFG_KEY));
    if(!c)return;
    if(typeof c.lv==="number"&&c.lv>=0&&c.lv<=2)AI_LV=c.lv;
    if(typeof c.fog==="boolean")fogOn=c.fog;
    if(typeof c.hint==="boolean")hintOn=c.hint;
    if(typeof c.ex==="boolean")exhaustOn=c.ex;
    if(RR_OPT.indexOf(c.rr)>=0)REROLL_MAX=c.rr;
    if(typeof c.shared==="boolean")sharedPack=c.shared;
    if("mfr".indexOf(c.vp)>=0&&c.vp)VIEW_P=c.vp;
    if("mfrx".indexOf(c.vm)>=0&&c.vm)VIEW_M=c.vm;
    if("mfr".indexOf(c.dv)>=0&&c.dv)dexVar=c.dv;
    /* 주제마다 고를 수 있는 규모가 다르다. 없는 값이면 그 주제의 기본을 지킨다 */
    if(c.flow==='cross'||c.flow==='classic')DRAFT_FLOW=c.flow;
    if(typeof c.objective==='boolean')objectiveOn=c.objective;
    if(typeof c.sc==="number"&&SCALE_OPTS.indexOf(c.sc)>=0)applyScale(c.sc);
  }catch(e){}
}

var FEATS=[
 {id:"first_win",n:"첫 출격",d:"처음으로 수위에 오르다"},
 {id:"ace_win",n:"에이스를 꺾다",d:"에이스 상대로 수위"},
 {id:"fog_win",n:"관제 두절",d:"적진을 가린 채 수위"},
 {id:"big_win",n:"압도적 전과",d:"3위와 200점 이상 차이"},
 {id:"pledge5",n:"인연의 실타래",d:"한 판에 인연 다섯을 맺다"},
 {id:"kin2",n:"핏줄의 힘",d:"한 판에 혈연 둘을 맺다"},
 {id:"no_feud",d:"악연 없이 수위에 오르다",n:"흠 없는 편대"},
 {id:"full_cap",n:"만재 출격",d:"정원을 남김없이 채워 수위"},
 {id:"sync140",n:"완벽한 동조",d:"싱크 1.40 이상 조를 만들다"},
 {id:"bond3",n:"전용기의 주인",d:"전용기 연대 셋을 한 판에"},
 {id:"one_series",n:"한 시대의 함대",d:"기체·파일럿 전원 같은 시리즈로 수위"},
 {id:"cross_win",n:"시공을 넘어",d:"기체와 파일럿이 모두 다른 시리즈인 조로 수위"},
 {id:"no_reroll",n:"물러섬 없이",d:"보급 요청 없이 수위에 오르다"},
 {id:"vet10",n:"백전노장",d:"열 판을 겨루다"},
 {id:"stamp30",n:"인연 수집가",d:"교신 기록 서른을 남기다"},
 {id:"dex60",n:"함대 사령",d:"예순 장을 기용해 보다"}
];
function checkFeats(rank,ev,gaps){
  var got=[],t=teams[0],i;
  function give(id){if(!REC.feats[id]){REC.feats[id]=1;got.push(id)}}
  var pg=pledges(t),kin=pg.filter(function(x){return x.kin}).length;
  var feud=pg.filter(function(x){return x.v<0}).length;
  var units=assign(t).filter(function(u){return u.m&&u.p});
  var cap=capOf(t);
  var hi=units.filter(function(u){return sync(u.m,u.p)>=1.40}).length;
  var bond=units.filter(function(u){return BOND[u.p[0]+"|"+u.m[0]]}).length;
  var ser=null,cross=0;
  for(i=0;i<units.length;i++){
    var common=serAll(units[i].m).filter(function(x){return serAll(units[i].p).indexOf(x)>=0});
    if(!common.length)cross++;
    var us=serAll(units[i].m).filter(function(x){return serAll(units[i].p).indexOf(x)>=0});
    ser = ser===null ? us.slice()
        : ser.filter(function(x){return us.indexOf(x)>=0});
  }
  ser = ser||[];
  if(rank===0){
    give("first_win");
    if(AI_LV===2)give("ace_win");
    if(fogOn)give("fog_win");
    if(gaps>=200)give("big_win");
    if(!feud)give("no_feud");
    if(cap&&units.length>=cap)give("full_cap");
    if(ser.length)give("one_series");
    if(cross===units.length&&units.length>=3)give("cross_win");
    if(rerolls===REROLL_MAX)give("no_reroll");
  }
  if(pg.length>=5)give("pledge5");
  if(kin>=2)give("kin2");
  if(hi>=1)give("sync140");
  if(bond>=3)give("bond3");
  for(i=0;i<pg.length;i++)if(pg[i].v>0)REC.stamps[pg[i].n]=1;
  var all=[].concat(t.함,t.기체,t.파일럿,t.지휘관);
  if(!REC.picks)REC.picks={};
  for(i=0;i<all.length;i++){REC.seen[all[i][0]]=1;
    REC.picks[all[i][0]]=(REC.picks[all[i][0]]||0)+1}
  if(REC.games>=10)give("vet10");
  if(Object.keys(REC.stamps).length>=30)give("stamp30");
  if(Object.keys(REC.seen).length>=60)give("dex60");
  return got;
}
/* 모함을 뽑으면 그 이름이 곧 부대 이름이 된다 */
function seatName(ti){
  var t=teams[ti];
  if(t&&t.함.length)return t.함[0][0]+(ti===0?" (아군)":"");
  return SEATS[ti];
}

function newTeam(){return {"함":[],"기체":[],"파일럿":[],"지휘관":[]}}
function reset(){
  gen++;                          /* 걸려 있던 옛 타이머를 무효로 만든다 */
  applyScale(SCALE);              /* 규모가 바뀌었으면 라운드표부터 다시 짠다 */
  rngReset(newSeed());            /* 씨앗 먼저 — 아래가 전부 이 씨앗에서 나온다 */
  pools={"함":SHIP.slice(),"기체":MECH.slice(),"파일럿":PILOT.slice(),"지휘관":CREW.slice()};
  teams=[newTeam(),newTeam(),newTeam()];
  round=0;seq=order();si=0;busy=false;log=[];openFoe={};
  rerolls=REROLL_MAX;aiRR=[0,REROLL_MAX,REROLL_MAX];curPack=null;packArr=[];packType=null;discard={함:[],기체:[],파일럿:[],지휘관:[]};shown={};
  rollVariants();
  rollArt();
  rollField();
  rollObjective();
  resultDone=false;
  render();
}
function order(){
  var o=[0,1,2],i,j,t;
  for(i=o.length-1;i>0;i--){j=rngInt(i+1);t=o[i];o[i]=o[j];o[j]=t}
  return o;
}
function turnSeq(){return round%2===0?seq:seq.slice().reverse()}
function drawPack(type){
  var src=pools[type],out=[],i;
  if(src.length<PACKN+2){src=pools[type]=src.concat(discard[type]);discard[type]=[];shown={}}
  var idx=[];for(i=0;i<src.length;i++)if(!(exhaustOn&&shown[src[i][0]]))idx.push(i);
  if(idx.length<PACKN){idx=[];for(i=0;i<src.length;i++)idx.push(i)}
  var key={};for(i=0;i<idx.length;i++)key[idx[i]]=Math.pow(rng(),1/wOf(src[idx[i]]));
  idx.sort(function(a,b){return key[b]-key[a]});
  for(i=0;i<Math.min(PACKN,idx.length);i++){out.push(src[idx[i]]);if(exhaustOn)shown[src[idx[i]][0]]=1}
  return out;
}
function take(type,card,ti){
  /* 카드가 동나면 팩이 비어 온다. 예전에는 그 빈 자리가 편성과 기록에 그대로
     들어가 화면을 그릴 때 터졌다. 판이 못 채워지는 것은 자료가 모자란다는 뜻이지
     터질 일은 아니라, 조용히 건너뛰고 한 번만 일러 둔다 */
  if(!card){
    if(!take.warned){take.warned=1;
      console.warn("["+type+"] 카드가 동났다. "+SCHEDULE.length+
        " 라운드를 세 편이 채우려면 종류마다 "+(slotsOf(type)*3)+" 장이 필요한데 "+
        (pools[type].length+discard[type].length)+" 장뿐이다");}
    return;
  }
  teams[ti][type].push(card);
  var k=pools[type].indexOf(card);
  if(k>=0)pools[type].splice(k,1);
  log.unshift({r:round+1,ti:ti,type:type,c:card,fresh:true});
}
/* 버림패로 보낸다. pools 에서 빼는 것이 핵심이다 —
   drawPack 은 뽑을 때 pools 에서 빼지 않으므로, 안 뺀 채 discard 에만 넣으면
   같은 카드가 양쪽에 남는다. 순환이 끝나 pools 에 합류하는 순간 둘이 된다.
   본편은 카드가 많아 합류 자체가 일어나지 않아 여태 드러나지 않았다. */
function toDiscard(type,card){
  var k=pools[type].indexOf(card);
  if(k>=0)pools[type].splice(k,1);
  discard[type].push(card);
}
function tossPack(type,pack,keep){
  for(var i=0;i<pack.length;i++)if(pack[i]!==keep)toDiscard(type,pack[i]);
}
function aiPick(type,pack,ti,wantGain){
  /* 신참은 가끔 헛발질하고, 에이스는 인연을 내다보며 팩을 물릴 줄 안다 */
  /* 눈을 감는 것은 신참뿐이다. 숙련이 인연이라는 점수축을 통째로 무시하면
     힌트를 보는 사람과 셈하는 것이 달라진다 */
  var see=PLEDGE_SEE[AI_LV], base=evaluate(teams[ti],see).total;
  if(AI_LV===0&&rng()<.35){
    var rc=pack[rngInt(pack.length)];
    return wantGain?{c:rc,gain:0}:rc;
  }
  var best=null,bs=-1e9,i;
  for(i=0;i<pack.length;i++){
    teams[ti][type].push(pack[i]);
    var s=evaluate(teams[ti],see).total;
    if(AI_LV>0&&type==="함")s+=capForesight(pack[i]);   /* 신참은 앞일을 못 본다 */
    if(AI_LV===2)s+=nearBonus(teams[ti],pack[i]);
    teams[ti][type].pop();
    if(s>bs){bs=s;best=pack[i]}
  }
  return wantGain?{c:best,gain:bs-base}:best;
}
/* 이 라운드에서 통상 기대할 만한 이득 — 이보다 못하면 물린다 */
var RR_BAR={"함":105,"기체":32,"파일럿":66,"지휘관":35};   // 타입별 통상 이득
function aiDraw(type,ti){
  if(sharedPack){
    ensurePack(type);
    var open=openSlots();
    if(!open.length){dealPack(type);open=openSlots()}
    var cards=open.map(function(i){return packArr[i].c}),
        res=aiPick(type,cards,ti,true),g=RR_K[AI_LV],guard2=0;
    /* 마지막 라운드가 아니고 팩이 시원치 않으면 남은 자리만 새로 뽑는다 */
    while(g>0&&aiRR[ti]>0&&round<SCHEDULE.length-1&&
          res.gain<RR_BAR[type]*g&&guard2++<3){
      aiRR[ti]--;
      log.unshift({r:round+1,ti:ti,type:type,rr:true,
        say:RR_SAY[Math.floor(Math.random()*RR_SAY.length)],fresh:true});
      var keep=packArr.filter(function(x){return x.by!==null}),n=packArr.length-keep.length,j;
      for(j=0;j<packArr.length;j++)if(packArr[j].by===null)toDiscard(type,packArr[j].c);
      packArr=keep.concat(drawPack(type).slice(0,n).map(function(c){return {c:c,by:null}}));
      open=openSlots();cards=open.map(function(i2){return packArr[i2].c});
      res=aiPick(type,cards,ti,true);
    }
    if(!res.c){dealPack(type);res=aiPick(type,openSlots().map(function(i3){return packArr[i3].c}),ti,true)}
    for(var q=0;q<packArr.length;q++)if(packArr[q].c===res.c&&packArr[q].by===null){packArr[q].by=ti;break}
    return res.c;
  }
  var pack=drawPack(type),r=aiPick(type,pack,ti,true),guard=0,k=RR_K[AI_LV];
  /* 마지막 라운드에서는 아무도 물리지 않는다 */
  while(k>0&&aiRR[ti]>0&&round<SCHEDULE.length-1&&
        r.gain<RR_BAR[type]*k&&guard++<3){
    aiRR[ti]--;
    log.unshift({r:round+1,ti:ti,type:type,rr:true,
      say:RR_SAY[Math.floor(Math.random()*RR_SAY.length)],fresh:true});
    tossPack(type,pack,null);
    pack=drawPack(type);r=aiPick(type,pack,ti,true);
  }
  tossPack(type,pack,r.c);
  return r.c;
}
function nearBonus(t,c){
  var names={},all=[].concat(t.함,t.기체,t.파일럿,t.지휘관),i,j,b=0;
  for(i=0;i<all.length;i++)names[all[i][0]]=1;
  for(i=0;i<COMBO.length;i++){
    var cb=COMBO[i];if(cb.m.indexOf(c[0])<0)continue;
    var hit=0;for(j=0;j<cb.m.length;j++)if(names[cb.m[j]])hit++;
    for(var k in cb.t)if(+k===hit+1&&cb.t[k]>0)b+=cb.t[k]*.12;
  }
  return b;
}

/* ═══════ 그리기 ═══════ */
var curPack=null;      /* 개별 보급일 때 내 팩 */
var packArr=[],packType=null;   /* 공유 팩 — {c:카드, by:좌석|null} */
function dealPack(type){
  packArr=drawPack(type).map(function(c){return {c:c,by:null}});
  packType=type;
}
/* 라운드가 바뀌면 팩 종류도 달라지므로 항상 확인한다 */
function ensurePack(type){
  if(packType!==type||!packArr.length){
    if(packType&&packType!==type&&packArr.length)tossRest(packType);
    dealPack(type);
  }
}
function openSlots(){var r=[],i;for(i=0;i<packArr.length;i++)if(packArr[i].by===null)r.push(i);return r}
/* 공유 팩에서 안 팔린 카드는 버림패로 — 순환이 끝나면 다시 섞인다 */
function tossRest(type){
  for(var i=0;i<packArr.length;i++)if(packArr[i].by===null)toDiscard(type,packArr[i].c);
  packArr=[];packType=null;
}

function choiceReason(c,type,g){
  if(type==='함'){var n=futurePairs(),cap=c[5]+CAP_BONUS;return cap<n?'정원 '+cap+' · '+(n-cap)+'조 전력 감소':'정원 '+cap+' · '+n+'조 모두 출격'}
  if(!hintOn)return '능력치 비교 · 눌러서 상세';
  if(g&&g.fired.length)return g.fired.slice(0,2).map(function(x){return (x.v<0?'악연: ':'연대: ')+x.n}).join(' · ');
  var mission='';
  if(OBJECTIVE){var before=objectiveCount(teams[0],OBJECTIVE);teams[0][type].push(c);var after;try{after=objectiveCount(teams[0],OBJECTIVE)}finally{teams[0][type].pop()}
    if(after>before&&before<OBJECTIVE.target)mission=OBJECTIVE.name+' · '+(after>=OBJECTIVE.target?'목표 달성':(OBJECTIVE.target-after)+'개 남음');}
  if(g&&g.why){var partner=g.why.split(' 조 · ')[0];return partner+(g.why.indexOf('전용기')>=0?' · 전용 조합':' · 자동 편성')+(mission?' / '+mission:'')}
  if(mission)return mission;
  if(g&&g.near.length)return g.near[0]+' · 조합 준비';
  return type==='지휘관'?'소속 결속 · 연대 기반':type==='기체'?'파일럿 확보 후 조합':'기체 확보 후 조합';
}

function delta(c,type){
  var t=teams[0],before=evaluate(t).total,pg0=pledges(t);
  var had={};for(var q=0;q<pg0.length;q++)had[pg0[q].n]=pg0[q].v;
  t[type].push(c);
  var after=evaluate(t).total,u=assign(t),pg1=pledges(t);
  var fired=[],near=[];
  for(q=0;q<pg1.length;q++)if(had[pg1[q].n]===undefined||had[pg1[q].n]!==pg1[q].v)
    fired.push({n:pg1[q].n.replace(/^(혈연|악연) · /,""),v:pg1[q].v,kin:pg1[q].kin});
  /* 한 명만 더 모으면 터지는 인연 */
  var names={},all=[].concat(t.함,t.기체,t.파일럿,t.지휘관),z;
  for(z=0;z<all.length;z++)names[all[z][0]]=1;
  for(z=0;z<COMBO.length;z++){
    var cb=COMBO[z];if(cb.m.indexOf(c[0])<0)continue;
    var hit=0,miss=[];
    for(q=0;q<cb.m.length;q++)names[cb.m[q]]?hit++:miss.push(cb.m[q]);
    var nk=null;for(var kk in cb.t)if(+kk===hit+1&&cb.t[kk]>0)nk=+kk;
    if(nk&&miss.length)near.push(cb.n+"(+"+miss.length+")");
  }
  t[type].pop();
  var why="";
  if(type==="기체"||type==="파일럿"){
    for(var i=0;i<u.length;i++){
      var uu=u[i];
      if(uu.m&&uu.p&&((type==="기체"&&uu.m[0]===c[0])||(type==="파일럿"&&uu.p[0]===c[0]))){
        var sp2=syncParts(uu.m,uu.p),bits=[];
        if(sp2.b)bits.push("전용기");
        if(sp2.t>0)bits.push("기질");else if(sp2.t<0)bits.push("기질충돌");
        if(sp2.n>0)bits.push(sp2.xline?"타계통 절반":LINE[uu.m[7]]);
        else if(sp2.n<0)bits.push("감응 부재");
        if(sp2.s)bits.push("동시리즈");
        if(sp2.o)bits.push("옛소속");
        if(sp2.g<0)bits.push(FIELD+" "+terrainWord(uu.m));
        why=(type==="기체"?uu.p[0]:uu.m[0])+" 조 · 싱크 "+sync(uu.m,uu.p).toFixed(2)+
            (bits.length?" ("+bits.join("·")+")":"");
        break;
      }
    }
  }
  return {v:after-before,why:why,fired:fired,near:near};
}

function pick(c){
  if(busy)return;
  var type=SCHEDULE[round],before={},pg0=pledges(teams[0]),i;
  for(i=0;i<pg0.length;i++)before[pg0[i].n]=pg0[i].v;
  if(sharedPack){
    for(i=0;i<packArr.length;i++)if(packArr[i].c===c&&packArr[i].by===null){packArr[i].by=0;break}
  }else{tossPack(type,curPack,c);curPack=null}
  take(type,c,0);
  var pg1=pledges(teams[0]),fresh=[];
  for(i=0;i<pg1.length;i++)
    if(before[pg1[i].n]===undefined||before[pg1[i].n]!==pg1[i].v)fresh.push(pg1[i]);
  justFired=fresh.map(function(g){return g.n});
  announce(fresh);
  advance();
  showPickFeedback(c);
  setTimeout(function(){justFired=[]},900);
}

function step(){
  if(round>=SCHEDULE.length){busy=false;return}   /* 판이 끝난 뒤 늦게 깨어난 타이머 */
  var type=SCHEDULE[round],who=turnSeq()[si];
  take(type,aiDraw(type,who),who);
  si++;
  if(si>=3){if(sharedPack)tossRest(SCHEDULE[round]);si=0;round++;busy=false;render();return}
  renderHead();renderBoard();renderPack();
  if(turnSeq()[si]!==0){schedStep();return}
  busy=false;renderPack();renderDock();
}

function advance(){
  si++;
  if(si>=3){if(sharedPack)tossRest(SCHEDULE[round]);si=0;round++}
  render();
}

function replayURL(){
  var q=location.search.replace(/[?&]seed=\d+/,'').replace(/^&/,'?');
  if(!q)q='?'; else q+='&';
  return location.origin+location.pathname+q+'seed='+GAME_SEED;
}

function stampRows(){
  var got=[],yet=[],i;
  for(i=0;i<COMBO.length;i++){
    var cb=COMBO[i];
    if(!(cb.t[2]>0||cb.t[3]>0||cb.t[4]>0))continue;   /* 악연은 교신 기록에 넣지 않는다 */
    (REC.stamps[cb.n]?got:yet).push(cb);
  }
  return {got:got,yet:yet};
}

function bondsOf(card,type){
  var out=[],k;
  for(k in BOND){
    var pr=k.split("|");
    if(type==="파일럿"&&pr[0]===card[0])out.push(pr[1]);
    if(type==="기체"&&pr[1]===card[0])out.push(pr[0]);
  }
  return out;
}
var SCORE_PARTS=[['base','기본 출격'],['sync','궁합·지형'],['loss','정원 손실'],['solo','미편성 대기'],['ship','모함'],['command','지휘관'],['faction','소속 결속'],['pledge','연대·혈연·악연'],['mission','작전 목표'],['rounding','반올림 보정']];
function scoreParts(team){
  var units=assign(team),cap=capOf(team),parts={base:0,sync:0,loss:0,solo:0,ship:team.함.length?sp(team.함[0])*.55:-60,command:0,faction:synergy(team).total*.35,pledge:0,mission:objectiveScore(team)},paired=0;
  units.forEach(function(u){if(u.m&&u.p){var base=mp(u.m)*pp(u.p)/100;parts.base+=base;parts.sync+=u.s-base;if(paired++>=cap)parts.loss-=u.s*.40}else parts.solo+=u.s});
  team.지휘관.forEach(function(c){parts.command+=cp(c)*.42});pledges(team).forEach(function(p){parts.pledge+=Math.round(p.v*PLEDGE_MUL)});
  var total=evaluate(team).total,sum=0;Object.keys(parts).forEach(function(k){parts[k]=Math.round(parts[k]);sum+=parts[k]});parts.rounding=total-sum;
  return {parts:parts,total:total,units:units};
}

function signedScore(n){return (n>0?'+':'')+n}

function pairingMap(units){var map={};units.forEach(function(u){if(u.m)map[u.m[0]]=u.p?u.p[0]:null});return map}

function pickPreview(team,card,type){
  var copy={};['함','기체','파일럿','지휘관'].forEach(function(k){copy[k]=team[k].slice()});copy[type].push(card);
  var before=scoreParts(team),after=scoreParts(copy),old=pairingMap(before.units),next=pairingMap(after.units),changes=[];
  Object.keys(next).forEach(function(name){if(!(name in old)||old[name]!==next[name])changes.push({name:name,before:name in old?(old[name]||'파일럿 대기'):'미보유',after:next[name]||'파일럿 대기'})});
  var beforeSolo=before.units.filter(function(u){return !u.m&&u.p}).map(function(u){return u.p[0]});
  after.units.filter(function(u){return !u.m&&u.p}).forEach(function(u){if(beforeSolo.indexOf(u.p[0])<0)changes.push({name:u.p[0],before:team.파일럿.indexOf(u.p)>=0?'기존 조 편성':'미보유',after:'기체 대기'})});
  return {before:before,after:after,changes:changes};
}

function nearPledges(team){
  var names={},counts={},out=[];[].concat(team.함,team.기체,team.파일럿,team.지휘관).forEach(function(c){names[c[0]]=true});
  team.기체.forEach(function(c){tagsOf(c).forEach(function(tag){counts[tag]=(counts[tag]||0)+1})});
  function nextTier(tiers,hit){var current=0,bk=0;Object.keys(tiers).forEach(function(k){if(+k<=hit&&+k>=bk){bk=+k;current=tiers[k]}});var next=tiers[hit+1];return next>current&&next>0?Math.round(next*PLEDGE_MUL)-Math.round(current*PLEDGE_MUL):0}
  COMBO.forEach(function(c){var missing=c.m.filter(function(n){return !names[n]}),hit=c.m.length-missing.length,gain=nextTier(c.t,hit);if(hit>0&&gain>0&&missing.length)out.push({name:c.n,rule:missing.join(' / ')+' 중 1명',gain:gain})});
  TCOMBO.forEach(function(c){var hit=counts[c.g]||0,gain=nextTier(c.t,hit);if(hit>0&&gain>0)out.push({name:c.n,rule:c.g+' 태그 기체 1기',gain:gain})});
  return out.sort(function(a,b){return b.gain-a.gain});
}
function dailyShots(card,gender){
  var root=IMG[card[0]],out=[],seen={};if(!root)return out;
  var selected=artBucket(card[0]),buckets=[];
  function add(bucket,label){if(bucket&&buckets.every(function(x){return x.b!==bucket}))buckets.push({b:bucket,label:label})}
  var styles=root.byStyle||{},selectedLabel='화풍 미상';
  Object.keys(styles).forEach(function(k){if(styles[k]===selected)selectedLabel=k});
  add(selected,selectedLabel);add(root,'화풍 미상');Object.keys(styles).forEach(function(k){add(styles[k],k)});
  buckets.forEach(function(x){var box=x.b.casual,shots=Array.isArray(box)?(gender==='f'?box:[]):box&&box[gender]||[];
    shots.forEach(function(path){if(typeof path==='string'&&!seen[path]){seen[path]=true;out.push({path:path,style:x.label})}})});
  return out;
}

/* Observable engine boundary: only state changes and rule calculations, never DOM. */
var phase='loading',error=null,resultDone=false,dexVar='r',newFeats=[],feedback='',notices=[];
var listeners=new Set(),queued=false,bootPromise=null;
function notify(){
  if(queued)return;queued=true;
  queueMicrotask(function(){queued=false;listeners.forEach(function(fn){fn()})});
}
function subscribe(fn){listeners.add(fn);return function(){listeners.delete(fn)}}
function preparePack(){
  if(!teams||round>=SCHEDULE.length)return;
  if(sharedPack)ensurePack(SCHEDULE[round]);
  else if(turnSeq()[si]===0&&!curPack)curPack=drawPack(SCHEDULE[round]);
}
function finish(){
  if(resultDone)return;
  resultDone=true;
  var evs=[0,1,2].map(function(i){return {i:i,ev:evaluate(teams[i])}});
  var sorted=evs.slice().sort(function(a,b){return b.ev.total-a.ev.total});
  var rank=sorted.findIndex(function(x){return x.i===0});
  REC.games++;REC[['first','second','third'][rank]]++;
  if(evs[0].ev.total>REC.best)REC.best=evs[0].ev.total;
  REC.lv[AI_LV]=(REC.lv[AI_LV]||0)+(rank===0?1:0);
  newFeats=checkFeats(rank,evs[0].ev,sorted[0].ev.total-sorted[2].ev.total);
  recSave();
}
function render(){
  phase=round>=SCHEDULE.length?'done':'running';preparePack();
  if(phase==='done')finish();
  else if(turnSeq()[si]!==0&&!busy){busy=true;schedStep()}
  notify();
}
function renderHead(){notify()}
function renderBoard(){notify()}
function renderDock(){notify()}
function renderPack(){preparePack();notify()}
function announce(list){
  notices=(list||[]).slice(0,3);var stamp=gen;notify();
  setTimeout(function(){if(stamp===gen){notices=[];notify()}},2100);
}
function showPickFeedback(card){
  feedback=card[0];var stamp=gen;notify();
  setTimeout(function(){if(stamp===gen){feedback='';notify()}},1000);
}
function setup(){
  gen++;phase='setup';round=SCHEDULE.length;busy=false;OBJECTIVE=null;
  feedback='';notices=[];notify();
}
function start(){newFeats=[];feedback='';notices=[];reset()}
function configure(key,value){
  if(phase!=='setup')return false;
  switch(key){
    case 'lv':if(![0,1,2].includes(value))return false;AI_LV=value;break;
    case 'sc':if(!SCALE_OPTS.includes(value))return false;applyScale(value);break;
    case 'flow':if(!['cross','classic'].includes(value))return false;DRAFT_FLOW=value;applyScale(SCALE);break;
    case 'rr':if(!RR_OPT.includes(value))return false;REROLL_MAX=value;break;
    case 'vp':if(!['m','f','r'].includes(value))return false;VIEW_P=value;break;
    case 'vm':if(!['m','f','r','x'].includes(value))return false;VIEW_M=value;break;
    case 'objective':objectiveOn=!!value;break;
    case 'shared':sharedPack=!!value;break;
    case 'fog':fogOn=!!value;break;
    case 'hint':hintOn=!!value;break;
    case 'ex':exhaustOn=!!value;break;
    default:return false;
  }
  cfgSave();notify();return true;
}
function turnToken(){return gen+':'+round+':'+si}
function isMine(){return phase==='running'&&!busy&&turnSeq()[si]===0}
function candidates(){
  if(phase!=='running')return [];
  return sharedPack?packArr:turnSeq()[si]===0?(curPack||[]).map(function(c){return {c:c,by:null}}):[];
}
function selectCard(card,token){
  if(!isMine()||token!==turnToken()||!candidates().some(function(x){return x.c===card&&x.by===null}))return false;
  pick(card);return true;
}
function resupply(){
  if(!isMine()||rerolls<1||round>=SCHEDULE.length-1)return false;
  var type=SCHEDULE[round];rerolls--;
  log.unshift({r:round+1,ti:0,type:type,rr:true,say:'보급을 요청한다',fresh:true});
  if(sharedPack){
    var keep=packArr.filter(function(x){return x.by!==null}),n=packArr.length-keep.length;
    packArr.forEach(function(x){if(x.by===null)toDiscard(type,x.c)});
    packArr=keep.concat(drawPack(type).slice(0,n).map(function(c){return {c:c,by:null}}));
  }else{tossPack(type,curPack,null);curPack=null}
  preparePack();notify();return true;
}
function eraseRecords(){REC=blankRec();recSave();notify()}
function boot(){
  if(bootPromise)return bootPromise;
  bootPromise=Promise.all([loadData(),loadRenames()]).then(function(results){
    var report=validateData(results[0]);DATA_WARN=report.warn;
    if(report.fatal.length)throw new Error(report.fatal.join('\n'));
    normalizeAll();cfgLoad();setup();
  }).catch(function(e){error=String(e.message||e);phase='error';notify()});
  return bootPromise;
}
export {
  boot,subscribe,phase,error,DATA_WARN,DATA_DIR,SET_NAME,REC_MOVED,REC,FEATS,newFeats,
  MECH,PILOT,SHIP,CREW,KIND,STAT_LABEL,SER_NAME,ART_NAME,ART_ORDER,IMG,COMBO,BOND,TCOMBO,
  SCHEDULE,SCALE,SCALE_OPTS,CAP_BONUS,AI_LV,AI_NAME,REROLL_MAX,RR_OPT,VIEW_P,VIEW_M,
  DRAFT_FLOW,objectiveOn,sharedPack,fogOn,hintOn,exhaustOn,OBJECTIVE,FIELD,GAME_SEED,
  teams,round,si,busy,log,rerolls,feedback,notices,PLEDGE_MUL,SCORE_PARTS,
  setup,start,configure,turnToken,isMine,candidates,selectCard,resupply,eraseRecords,
  turnSeq,seatName,slotsOf,futurePairs,capOf,evaluate,assign,sync,syncParts,pledges,synergy,
  objectiveCount,objectiveScore,delta,choiceReason,scoreParts,pickPreview,nearPledges,
  variantOf,artBucket,artBuckets,dailyShots,cutsOf,imgURL,faceOf,ASPECT,FACE_W,FACE_TOP,
  flip,fc,hashOf,loreOf,serAll,serLabel,serTag,tagsOf,terrainWord,stampRows,bondsOf,
  replayURL,signedScore,newTeam,mp,pp,sp,cp
};
