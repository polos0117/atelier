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
function showDataReport(r){
  if(r.fatal.length){
    var li=function(a){return a.map(function(x){return '<li>'+x+'</li>'}).join('')};
    document.body.innerHTML=
      '<div style="padding:2rem;font:14px/1.7 system-ui;color:#ddd;background:#14161c;min-height:100vh">'+
      '<h2 style="margin:0 0 .8rem">자료가 어긋나 판을 세울 수 없다</h2>'+
      '<ul style="color:#e8837a;padding-left:1.2em">'+li(r.fatal)+'</ul>'+
      (r.warn.length?'<h3 style="margin:1.4rem 0 .5rem;color:#aaa">그 밖에 일러둘 것</h3>'+
        '<ul style="color:#c9a227;padding-left:1.2em">'+li(r.warn)+'</ul>':'')+
      '<p style="color:#888;margin-top:1.4rem">'+DATA_DIR+' 를 고치고 다시 열어라.</p></div>';
    return false;
  }
  if(r.warn.length){
    for(var i=0;i<r.warn.length;i++)console.warn("[자료] "+r.warn[i]);
    DATA_WARN=r.warn;
  }
  return true;
}
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
function refreshImages(){
  if(!GH_||typeof fetch!=="function")return;
  var K="game_filelist_v1";
  try{
    var c=JSON.parse(localStorage.getItem(K));
    if(c&&Date.now()-c.t<6e5){mergeRepoFiles(c.n);return}
  }catch(e){}
  fetch("https://api.github.com/repos/"+GH_.u+"/"+GH_.r+"/contents/img")
    .then(function(r){if(!r.ok)throw 0;return r.json()})
    .then(function(j){
      var n=j.filter(function(x){return x.type==="file"}).map(function(x){return x.name});
      try{localStorage.setItem(K,JSON.stringify({t:Date.now(),n:n}))}catch(e){}
      mergeRepoFiles(n);
    })
    .catch(function(){});
}


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
function placeholder(card,v){
  var col=fc(card[1][card[1].length-1]),h=hashOf(card[0]),
      a=(h%40)-20, b=((h>>4)%30)+15, ch=card[0].charAt(0);
  return '<svg viewBox="0 0 90 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+
    '<defs><linearGradient id="g'+h+'" x1="0" y1="0" x2="0" y2="1">'+
    '<stop offset="0" stop-color="'+col+'" stop-opacity=".38"/>'+
    '<stop offset="1" stop-color="'+col+'" stop-opacity=".06"/></linearGradient></defs>'+
    '<rect width="90" height="120" fill="#10141A"/>'+
    '<rect width="90" height="120" fill="url(#g'+h+')"/>'+
    '<g stroke="'+col+'" stroke-opacity=".22" stroke-width=".5" fill="none">'+
    '<circle cx="45" cy="'+(46+a/6)+'" r="'+b+'"/>'+
    '<path d="M0 '+(84+a/4)+' L90 '+(72+a/4)+'"/>'+
    '<path d="M'+(20+a/3)+' 0 L'+(20+a/3)+' 120" stroke-dasharray="3 5"/></g>'+
    '<text x="45" y="58" text-anchor="middle" font-family="Gothic A1,sans-serif" '+
    'font-size="30" font-weight="900" fill="'+col+'" fill-opacity=".55">'+ch+'</text>'+
    '<text x="45" y="76" text-anchor="middle" font-family="IBM Plex Mono,monospace" '+
    'font-size="8" fill="'+col+'" fill-opacity=".5">'+(v==="f"?"F":"M")+'</text></svg>';
}
/* 이미지 로드 실패 시 자리표시자로 대체 (미리보기·오프라인 대응) */
var FB={},FBN=0;
function fbReg(card,v){
  var id="fb"+(FBN++);
  FB[id]="data:image/svg+xml;utf8,"+encodeURIComponent(placeholder(card,v));
  return id;
}
function fbSwap(im){
  im.onerror=null;
  var d=FB[im.getAttribute("data-fb")];
  if(d)im.src=d;
}
function avHTML(card,type,partner,force){
  var v=force||variantOf(card,partner),src=artBucket(card[0]);
  if(src){
    var pic=src[v]||src[flip(v)];
    if(pic)return '<img src="'+imgURL(pic)+'" alt="" loading="lazy" decoding="async" data-fb="'+fbReg(card,v)+'" onerror="fbSwap(this)">';
  }
  return placeholder(card,v);
}
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
function faceHTML(card,partner,type){
  var v=variantOf(card,partner),src=artBucket(card[0]);
  if(src){
    var pic=src[v]||src[flip(v)];
    if(pic){
      var used=src[v]?v:flip(v), f=faceOf(src,used,IMG[card[0]]),
          ar=ASPECT[type]||1.5,
          bw=f[2], bh=Math.min(.999,bw/ar),
          cx=f[0]+bw/2, cy=f[1]+bh/2,
          fw=Math.min(1,FACE_W), fh=Math.min(.999,fw/ar),
          fx=Math.min(Math.max(cx-fw/2,0),1-fw),
          fy=Math.min(Math.max(cy-fh*FACE_TOP,0),1-fh);
      var size=(100/fw), px=(fw<1?fx/(1-fw)*100:0), py=(fh<1?fy/(1-fh)*100:0);
      return '<span class="fcp" style="background-color:'+fc(card[1][card[1].length-1])+'33;'+
        'background-image:url(\''+imgURL(pic)+'\');'+
        'background-size:'+size.toFixed(1)+'% auto;'+
        'background-position:'+px.toFixed(1)+'% '+py.toFixed(1)+'%"></span>';
    }
  }
  return placeholder(card,v);
}
/* 일상컷·특별컷의 성별 몫. 예전 자료는 배열로 와서 그때는 여성으로 친다 */
function cutsOf(bucket,slot,v){
  var box=bucket&&bucket[slot];
  if(!box)return [];
  if(Object.prototype.toString.call(box)==="[object Array]")return v==="f"?box:[];
  return box[v]||[];
}
function bigHTML(card,v){
  var src=artBucket(card[0]);
  if(src){var pic=src[v]||src[flip(v)];if(pic)return '<img src="'+imgURL(pic)+'" alt="" loading="lazy" decoding="async" data-fb="'+fbReg(card,v)+'" onerror="fbSwap(this)">'}
  return placeholder(card,v);
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
function announce(list){
  if(!list||!list.length)return;
  var wrap=document.getElementById("toastArea");
  wrap.innerHTML="";
  for(var i=0;i<Math.min(3,list.length);i++){
    (function(g,delay){
      setTimeout(function(){
        var t=el("div","toast"),
            kind=g.v<0?"악연":g.kin?"혈연":"연대",
            col=g.v<0?"var(--alert)":g.kin?"var(--ok)":"var(--amber)",
            glow=g.v<0?"rgba(210,72,60,.4)":g.kin?"rgba(95,168,140,.4)":"rgba(232,161,58,.4)";
        t.style.setProperty("--tc",col);
        t.style.setProperty("--tg",glow);
        t.innerHTML='<u>'+kind+'</u><b>'+g.n+'</b><em>'+(g.v>0?"+":"")+Math.round(g.v*PLEDGE_MUL)+'</em>';
        wrap.appendChild(t);
        setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},1900);
      },delay);
    })(list[i],i*160);
  }
  if(navigator.vibrate)try{navigator.vibrate(list.some(function(g){return g.v<0})?[18,60,18]:22)}catch(e){}
}
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
function el(tag,cls,html){var d=document.createElement(tag);if(cls)d.className=cls;
  if(html!==undefined)d.innerHTML=html;return d}
function facHTML(card){
  var fs=card[1],out=[],i;
  for(i=0;i<fs.length;i++){
    var last=i===fs.length-1;
    out.push('<'+(last?'b':'s')+' style="color:'+fc(fs[i])+(last?'':';opacity:.55')+'">'+fs[i]+'</'+(last?'b':'s')+'>');
  }
  return out.join('<span style="opacity:.4"> › </span>');
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
function choiceCard(c,type,onPick,tactical,by){
  var b=el('button',(tactical?'tac-card':'card')+' choice-card'+(by!=null?' taken':''));b.type='button';b.disabled=!onPick||by!=null;
  var faction=c[1][c[1].length-1]||'소속 없음';b.style.setProperty('--choice-color',fc(faction));
  var head=el('div','choice-head'),art=el('div','choice-art'),name=el('b','choice-name');art.innerHTML=avHTML(c,type);name.textContent=c[0];head.appendChild(art);head.appendChild(name);b.appendChild(head);
  var fac=el('div','choice-faction');fac.textContent=faction;b.appendChild(fac);
  var g=hintOn&&onPick&&by==null?delta(c,type):null,gain=el('div','choice-gain'+(g&&g.v<0?' negative':'')),label=el('small'),value=el('strong');
  label.textContent=by!=null?'지명됨':g?'선택 시':'선택';value.textContent=by!=null?(by===0?'아군':'적 '+by):g?((g.v>=0?'+':'')+g.v):onPick?'확인':'대기';gain.appendChild(label);gain.appendChild(value);b.appendChild(gain);
  var stats=el('div','choice-stats'),max=Math.max.apply(null,c.slice(2,type==='함'?5:6));
  STAT_LABEL[type].forEach(function(label,i){var row=el('div','choice-stat'+(c[i+2]===max?' strong':'')),key=el('i'),value=el('b');key.textContent=label;value.textContent=c[i+2];row.appendChild(key);row.appendChild(value);stats.appendChild(row)});b.appendChild(stats);
  var reason=el('div','choice-reason');reason.textContent=by!=null?'지명 완료':onPick?choiceReason(c,type,g):'상대 지명 중';b.appendChild(reason);
  b.setAttribute('aria-label',c[0]+' · '+reason.textContent);b.title=c[0]+' · '+reason.textContent;if(onPick)b.onclick=function(){onPick(c)};return b;
}
function rosterStrip(){
  var strip=el('section','roster-strip'),head=el('header'),title=el('b'),detail=el('button');title.textContent='내 편성 · 후보와 비교';detail.textContent='전체 보기';detail.type='button';detail.onclick=function(){inspectTeam(0)};head.appendChild(title);var progress=el('button');progress.type='button';progress.textContent='연대·목표';progress.onclick=openProgress;head.appendChild(progress);head.appendChild(detail);strip.appendChild(head);
  ['함','지휘관','기체','파일럿'].forEach(function(k){var row=el('div','roster-line'),label=el('b');label.textContent=k;row.appendChild(label);var list=teams[0][k];if(!list.length){var empty=el('span');empty.textContent='미정';row.appendChild(empty)}list.forEach(function(c){var chip=el('span','roster-chip');chip.textContent=c[0];row.appendChild(chip)});strip.appendChild(row)});return strip;
}

function cardEl(c,type,onPick){
  var b=el("button","card"),i,labels=STAT_LABEL[type],cur=c[1][c[1].length-1];
  b.style.setProperty("--fc",fc(cur));
  var stats="";
  for(i=0;i<4;i++){
    var v=c[2+i],w=type==="함"&&i===3?v*14:v;
    stats+='<div class="st"><span>'+labels[i]+'</span><u><i style="width:'+Math.min(100,w)+'%"></i></u><b>'+v+'</b></div>';
  }
  var tags="";
  if(type==="기체"){
    tags='<span class="tag'+(LINE[c[7]]?" psy":"")+'">'+c[7]+'</span><span class="tag">'+c[6]+'</span>';
  }else if(type==="파일럿"){
    tags=(c[7]>0?'<span class="tag nt">'+c[9]+' '+c[7]+'</span>':"")+'<span class="tag">'+c[6]+'</span>';
  }
  b.innerHTML='<div class="av '+AV_CLS[type]+'">'+avHTML(c,type)+
    '<div class="ty">'+type+'</div>'+
    '<div class="bdg"><span class="vx">'+(variantOf(c)==="f"?"♀":"♂")+'</span>'+
      '<span class="sb">'+serTag(c)+'</span></div>'+
    '<div class="scrim"><b'+(c[0].length>=13?' class="ln3"':c[0].length>=11?' class="ln2"':c[0].length>=9?' class="ln"':'')+'>'+c[0]+'</b></div></div>'+
    '<div class="pd"><div class="fx">'+facHTML(c)+'</div>'+
    (tags?'<div style="margin-bottom:5px">'+tags+'</div>':"")+
    '<div class="stats">'+stats+'</div></div>';
  /* 모함은 첫 라운드에 고르는데, 정원이 모자라면 뒷날 한 조가 60% 로 싸운다.
     그 일은 증감 힌트에 잡히지 않는다 — 그때는 기체도 파일럿도 없기 때문이다.
     그래서 점수를 건드리지 않고 말로만 알려 준다. 적장이 앞일을 보는 만큼
     사람도 보아야 공평하다. */
  if(type==="함"){
    var need=futurePairs(), have=c[5]+CAP_BONUS, miss=Math.max(0,need-have);
    /* 정원이 넉넉한 배가 드물어졌으므로 양쪽을 다 적는다. 한쪽만 적으면
       넉넉한 배를 "빨간 줄이 없는 것" 으로 찾아야 해 읽기가 뒤집힌다 */
    var cn=el("div","dlt"+(miss?" dn":""));
    cn.style.margin="0 6px";
    cn.innerHTML=miss
      ? '▼ 정원 '+have+' <em>'+need+'조 중 '+miss+'조가 60%</em>'
      : '▲ 정원 '+have+' <em>'+need+'조 온전히</em>';
    b.appendChild(cn);
  }
  var d=hintOn?delta(c,type):null;
  if(d){
    var dv=el("div","dlt"+(d.v<0?" dn":""));
    dv.style.margin="0 6px";
    var ex="";
    if(d.fired&&d.fired.length)ex+='<em class="fi">◈ '+d.fired.slice(0,2).map(function(x){return (x.v<0?"악연 ":x.kin?"혈연 ":"연대 ")+x.n}).join(" · ")+'</em>';
    if(d.near&&d.near.length)ex+='<em class="nr">◇ '+d.near.slice(0,2).join(" · ")+'</em>';
    if(d.why)ex+='<em>'+d.why+'</em>';
    dv.innerHTML=(d.v>=0?"▲ +":"▼ ")+d.v+ex;
    b.appendChild(dv);
  }
  b.title=loreOf(c);
  if(onPick)b.onclick=function(){onPick(c)};else b.disabled=true;
  return b;
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

function dockEl(ti){
  var t=teams[ti],d=el("div","dock"),ev=evaluate(t);
  var h=el("div","dh");
  h.innerHTML='<b>'+seatName(ti)+'</b><span class="'+(ti===0?"hi":"")+'">'+ev.total+'</span>';
  d.appendChild(h);
  var b=el("div","db");
  if(t.함.length){
    var s=t.함[0],cur=s[1][s[1].length-1],sh=el("div","ship");
    sh.style.setProperty("--fc",fc(cur));
    sh.innerHTML='<span class="th" data-n="'+s[0]+'" data-t="함" style="width:62px;height:36px">'+avHTML(s,"함")+'</span>'+
      '<b>'+s[0]+'</b><span>정원 '+(s[5]+CAP_BONUS)+'</span>';
    b.appendChild(sh);
  }else b.appendChild(el("div","ship empty","모함 미정"));
  var units=assign(t),cap=capOf(t),i;
  for(i=0;i<units.length;i++){
    var u=units[i],row=el("div","unit"+(u.m&&u.p?"":" solo"));
    var sv=u.m&&u.p?sync(u.m,u.p):0;
    var col=sv>=1.25?"var(--ok)":sv<=.95&&sv>0?"var(--alert)":"var(--dim)";
    var mh=el("div","uh");
    if(u.m){mh.style.setProperty("--mc",fc(u.m[1][u.m[1].length-1]));
      mh.innerHTML='<span class="th" data-n="'+u.m[0]+'" data-t="기체">'+faceHTML(u.m,u.p,"기체")+'</span>'+
        '<span class="tx"><b>'+u.m[0]+'</b><i>'+u.m[7]+'</i></span>'}
    else mh.innerHTML='<span class="tx"><b style="opacity:.35">기체 없음</b><i>—</i></span>';
    var cl=el("div","clamp");
    cl.style.setProperty("--cc",col);
    cl.innerHTML='<em>'+(sv?sv.toFixed(2):"—")+'</em>';
    var ph=el("div","uh p");
    if(u.p){ph.style.setProperty("--pc",fc(u.p[1][u.p[1].length-1]));
      ph.innerHTML='<span class="tx"><b>'+u.p[0]+'</b><i>'+(u.p[7]>0?u.p[9]+" "+u.p[7]+" · ":"")+u.p[6]+'</i></span>'+
        '<span class="th" data-n="'+u.p[0]+'" data-t="파일럿">'+faceHTML(u.p,null,"파일럿")+'</span>'}
    else ph.innerHTML='<span class="tx"><b style="opacity:.35">파일럿 없음</b><i>—</i></span>';
    if(i>=cap&&u.m&&u.p)row.style.opacity=".62";
    row.appendChild(mh);row.appendChild(cl);row.appendChild(ph);
    b.appendChild(row);
  }
  if(t.지휘관.length){
    var cw=el("div","crew");
    for(i=0;i<t.지휘관.length;i++){
      var c=t.지휘관[i],ch=el("span","chip",c[0]);
      ch.style.setProperty("--cc",fc(c[1][c[1].length-1]));
      cw.appendChild(ch);
    }
    b.appendChild(cw);
  }
  var pg=pledges(t);
  if(pg.length){
    var pl=el("div","pledge");
    for(i=0;i<pg.length;i++){
      var g=pg[i],pe=el("span","pg"+(g.v<0?" bad":g.kin?" kin":"")+
        (justFired.indexOf(g.n)>=0?" fresh":""));
      pe.innerHTML=g.n.replace(/^(혈연|악연) · /,"")+
        '<b>'+(g.v>0?"+":"")+g.v+'</b>';
      pe.title=g.got.join(" · ");
      pl.appendChild(pe);
    }
    b.appendChild(pl);
  }
  d.appendChild(b);
  return d;
}
function pillEl(c){
  var s=el("span","pill",c[0]);
  s.style.setProperty("--cc",fc(c[1][c[1].length-1]));
  return s;
}
function foeEl(ti,active){
  var t=teams[ti],ev=evaluate(t),f=el("div","foe"+(openFoe[ti]?" open":"")+(active?" act":""));
  var need={},k;
  SCHEDULE.forEach(function(type){need[type]=(need[type]||0)+1});
  var hd=el("button","fhd"),hidden=fogOn&&round<SCHEDULE.length;
  hd.innerHTML='<u>'+(hidden?"✕":"▸")+'</u><b>'+(hidden?SEATS[ti]:seatName(ti))+
    '</b><em>'+(hidden?"???":ev.total)+'</em>';
  hd.onclick=function(){if(hidden)return;openFoe[ti]=!openFoe[ti];renderBoard()};
  if(hidden){f.appendChild(hd);return f}
  f.appendChild(hd);
  var bd=el("div","fbd");
  for(k in need){
    var row=el("div","frow"),box=el("div");
    row.appendChild(el("u",null,k));
    for(var i=0;i<need[k];i++){
      if(t[k][i])box.appendChild(pillEl(t[k][i]));
      else box.appendChild(el("span","pill dim","—"));
    }
    row.appendChild(box);bd.appendChild(row);
  }
  var u=assign(t).filter(function(x){return x.m&&x.p});
  if(u.length){
    var sr=el("div","frow"),sb=el("div");
    sr.appendChild(el("u",null,"조"));
    for(i=0;i<u.length;i++){
      var p=el("span","pill",u[i].p[0]+" × "+u[i].m[0]+" "+sync(u[i].m,u[i].p).toFixed(2));
      p.style.setProperty("--cc",sync(u[i].m,u[i].p)>=1.25?"var(--ok)":"var(--dim)");
      sb.appendChild(p);
    }
    sr.appendChild(sb);bd.appendChild(sr);
  }
  f.appendChild(bd);
  return f;
}
function feedEl(){
  var d=el("div","feed"),i;
  d.appendChild(el("div","fh","최근 지명"));
  if(!log.length){d.appendChild(el("div","lg",'<u>—</u><b style="border-left-color:var(--plate2);opacity:.45">아직 지명이 없다</b>'));return d}
  for(i=0;i<Math.min(7,log.length);i++){
    var L=log[i],row=el("div","lg"+(L.fresh&&i===0?" new":"")+(L.rr?" rr":""));
    if(L.rr){
      row.innerHTML='<u>R'+L.r+'</u><i class="'+(L.ti===0?"me":"")+'">'+seatName(L.ti)+'</i>'+
        '<b>“'+L.say+'”</b><s>보급</s>';
      d.appendChild(row);continue;
    }
    row.style.setProperty("--cc",fc(L.c[1][L.c[1].length-1]));
    row.innerHTML='<u>R'+L.r+'</u><i class="'+(L.ti===0?"me":"")+'">'+seatName(L.ti)+'</i>'+
      '<b>'+L.c[0]+'</b><s>'+L.type+'</s>';
    d.appendChild(row);
  }
  log.forEach(function(L){L.fresh=false});
  return d;
}

function renderHead(){
  var g=document.getElementById("gauge");g.innerHTML="";
  for(var i=0;i<SCHEDULE.length;i++){
    var b=el("i");
    if(i<round)b.className="done";else if(i===round)b.className="now";
    g.appendChild(b);
  }
  document.getElementById("rdl").innerHTML="ROUND "+String(Math.min(round+1,SCHEDULE.length)).padStart(2,"0")+
    " / "+SCHEDULE.length+'<b class="fld">'+FIELD+"</b>";
  var done=round>=SCHEDULE.length;
  document.getElementById("rdt").innerHTML=done?"전과 <em>판정</em>"
    :TYPE_LABEL[SCHEDULE[round]].replace(/ (.+)$/," <em>$1</em>");
  var tn=document.getElementById("turn"),who=done?-1:turnSeq()[si];
  tn.textContent=done?"종료":(who===0?"내 차례":seatName(who)+" 지명 중");
  tn.className="turn"+(who===0?" mine":"");
}
function renderPack(){
  var a=document.getElementById("packArea");
  if(round>=SCHEDULE.length){a.innerHTML="";return}
  var type=SCHEDULE[round],mine=turnSeq()[si]===0;
  if(!sharedPack&&!mine){a.innerHTML="";return}
  a.innerHTML="";
  var pk=el("div","pack"),i;
  if(sharedPack){
    ensurePack(type);
    for(i=0;i<packArr.length;i++){
      var slot=packArr[i];
      if(slot.by===null){
        var cd=choiceCard(slot.c,type,mine?confirmPick:null,false,null);
        if(!mine)cd.disabled=true;
        pk.appendChild(cd);
      }else pk.appendChild(choiceCard(slot.c,type,null,false,slot.by));
    }
  }else{
    if(!curPack)curPack=drawPack(type);
    for(i=0;i<curPack.length;i++)pk.appendChild(choiceCard(curPack[i],type,confirmPick,false,null));
  }
  a.appendChild(rosterStrip());
  a.appendChild(pk);
  if(!mine)return;
  var rr=el("div","row");
  var rb=el("button","btn sm",REROLL_MAX===0?"보급 없음":"보급 요청  남은 "+rerolls+"회");
  var last=round>=SCHEDULE.length-1;
  rb.disabled=rerolls<1||last;
  if(last)rb.textContent="마지막 배치 — 보급 불가";
  rb.onclick=function(){
    if(rerolls<1||busy||last)return;
    rerolls--;
    log.unshift({r:round+1,ti:0,type:type,rr:true,say:"보급을 요청한다",fresh:true});
    if(sharedPack){
      var keep=packArr.filter(function(x){return x.by!==null}),n=packArr.length-keep.length,j;
      for(j=0;j<packArr.length;j++)if(packArr[j].by===null)toDiscard(type,packArr[j].c);
      var fresh=drawPack(type).slice(0,n);
      packArr=keep.concat(fresh.map(function(c){return {c:c,by:null}}));
    }else{tossPack(type,curPack,null);curPack=null}
    renderPack();renderBoard();
  };
  rr.appendChild(rb);
  a.appendChild(rr);
}
function takenEl(slot,type){
  var d=el("div","card taken"),c=slot.c;
  d.style.setProperty("--fc",fc(c[1][c[1].length-1]));
  d.innerHTML='<div class="av '+AV_CLS[type]+'">'+avHTML(c,type)+
    '<div class="tkv"><u>'+seatName(slot.by).replace(/ \(아군\)$/,"")+'</u><b>지명됨</b></div>'+
    '<div class="scrim"><b'+(c[0].length>=13?' class="ln3"':c[0].length>=11?' class="ln2"':c[0].length>=9?' class="ln"':'')+'>'+c[0]+'</b></div></div>';
  return d;
}
function renderDock(){
  var a=document.getElementById("dockArea");a.innerHTML="";
  a.appendChild(dockEl(0));
  renderTactical();
}
function renderBoard(){
  var a=document.getElementById("boardArea");a.innerHTML="";
  if(!fogOn)a.appendChild(feedEl());
  else a.appendChild(el("div","note","<b>관제 두절</b><br>적 함대의 편성은 판정 때까지 알 수 없다."));
  var who=round<SCHEDULE.length?turnSeq()[si]:-1;
  var fo=el("div","foes");
  fo.appendChild(foeEl(1,who===1));fo.appendChild(foeEl(2,who===2));
  a.appendChild(fo);
  renderTactical();
}
function render(){
  document.body.classList.add("battle-active");
  document.body.classList.toggle("draft-running",round<SCHEDULE.length);
  renderHead();renderPack();renderDock();renderBoard();
  if(round>=SCHEDULE.length){renderResult();return}
  if(turnSeq()[si]!==0&&!busy){busy=true;schedStep()}
}
function confirmPick(c){
  if(busy||round>=SCHEDULE.length||turnSeq()[si]!==0)return;
  inspectCandidate(c,SCHEDULE[round]);
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
/* AI 차례는 전체를 다시 그리지 않고 로그와 명단만 갱신한다 */
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

/* 이 판을 그대로 다시 여는 주소. 밸런스를 볼 때 같은 판을 두 번 돌려야 한다 */
function replayURL(){
  var q=location.search.replace(/[?&]seed=\d+/,'').replace(/^&/,'?');
  if(!q)q='?'; else q+='&';
  return location.origin+location.pathname+q+'seed='+GAME_SEED;
}
function seedRow(){
  var d=el("div","res");
  d.appendChild(el("div","rh",'<b>이 판의 씨앗</b><span style="font-size:12px;opacity:.75">'+
    FIELD+' · '+AI_NAME[AI_LV]+' · '+(sharedPack?"공유팩":"개별팩")+
    ' · 보급 '+REROLL_MAX+'</span>'));
  var l=el("div","rl2");
  l.innerHTML='<div><k>씨앗</k><v style="font-family:ui-monospace,monospace">'+GAME_SEED+'</v></div>';
  d.appendChild(l);
  var b=el("button","btn sm","같은 판 주소 복사");
  b.style.cssText="margin:8px 0 0;width:100%";
  b.onclick=function(){
    var u=replayURL(),self=this,ok=false;
    var ta=document.createElement("textarea");
    ta.value=u;ta.style.cssText="position:fixed;top:-999px";
    document.body.appendChild(ta);ta.select();
    try{ok=document.execCommand("copy")}catch(e){}
    document.body.removeChild(ta);
    if(!ok&&navigator.clipboard){navigator.clipboard.writeText(u).then(function(){
      self.textContent="복사했다";});return}
    self.textContent=ok?"복사했다":u;
  };
  d.appendChild(b);
  return d;
}
var resultDone=false;
function renderResult(){
  var st=document.getElementById("endArea");st.innerHTML="";
  var evs=[0,1,2].map(function(i){return {i:i,ev:evaluate(teams[i])}});
  var srt=evs.slice().sort(function(a,b){return b.ev.total-a.ev.total});
  var myRank=0;for(var z=0;z<srt.length;z++)if(srt[z].i===0)myRank=z;
  var newFeats=[];
  if(!resultDone){
    resultDone=true;
    REC.games++;
    REC[["first","second","third"][myRank]]++;
    if(evs[0].ev.total>REC.best)REC.best=evs[0].ev.total;
    REC.lv[AI_LV]=(REC.lv[AI_LV]||0)+(myRank===0?1:0);
    newFeats=checkFeats(myRank,evs[0].ev,srt[0].ev.total-srt[2].ev.total);
    recSave();
  }
  var sorted=srt;
  for(var r=0;r<sorted.length;r++){
    var e=sorted[r],row=el("div","rank"+(r===0?" win":""));
    row.innerHTML='<em>'+(r+1)+'위</em><b>'+seatName(e.i)+'</b><span>'+e.ev.total+'</span>';
    st.appendChild(row);
  }
  st.appendChild(renderResultAnalysis());
  var mvp=renderMVP(teams[0]);if(mvp)st.appendChild(mvp);
  var my=evs[0].ev;
  var res=el("div","res");
  res.appendChild(el("div","rh",'<b>아군 내역</b><span>'+my.total+'</span>'));
  var lst=el("div","rl2");
  for(var i=0;i<my.rows.length;i++)
    lst.innerHTML+='<div><k>'+my.rows[i][0]+'</k><v'+(my.rows[i][1]<0?' class="dn"':'')+'>'+
      (my.rows[i][1]>=0?"+":"")+my.rows[i][1]+'</v></div>';
  res.appendChild(lst);
  st.appendChild(res);
  st.appendChild(seedRow());
  if(newFeats.length){
    var fb=el("div","feats");
    fb.appendChild(el("div","fh","새 훈장"));
    for(var q=0;q<newFeats.length;q++){
      var ft=null;for(var w=0;w<FEATS.length;w++)if(FEATS[w].id===newFeats[q])ft=FEATS[w];
      if(ft)fb.appendChild(el("div","ft","<b>"+ft.n+"</b><span>"+ft.d+"</span>"));
    }
    st.appendChild(fb);
  }
  st.appendChild(el("div","note",
    "<b>전적</b>  "+REC.games+"판 · 수위 "+REC.first+" · 2위 "+REC.second+" · 3위 "+REC.third+
    "<br>최고 점수 "+REC.best+" · 교신 기록 "+Object.keys(REC.stamps).length+"/"+
    COMBO.filter(function(c){return c.t[2]>0||c.t[3]>0}).length+
    " · 훈장 "+Object.keys(REC.feats).length+"/"+FEATS.length));
  var row2=el("div","row");
  /* 같은 설정으로 바로 다시 — 설정을 바꿀 때만 따로 들어간다 */
  var again=el("button","btn","다시 출격");
  again.onclick=function(){
    resultDone=false;curPack=null;
    document.getElementById("endArea").innerHTML="";
    reset();
  };
  var cfg=el("button","btn sm","설정 변경");
  cfg.style.flex="0 0 34%";
  cfg.onclick=function(){
    resultDone=false;curPack=null;
    document.getElementById("endArea").innerHTML="";
    setup();
  };
  row2.appendChild(again);row2.appendChild(cfg);
  st.appendChild(row2);
  st.appendChild(el("div","note",
    '<b>이 판의 규칙</b><br>'+
    '조 점수 = 기체력 × 파일럿력 × 싱크. 싱크는 기질 상성, 감응 계통 적합, '+
    '동시리즈, 옛 소속 겹침, 전용기 연대를 더해 0.70~1.45로 묶는다.<br>'+
    '특수 계열 기체는 계통이 맞는 감응자가 타면 온전히, 다른 계통이면 절반만 살린다. '+
    '감응이 없는 파일럿이 타면 오히려 깎인다.<br>'+
    '모함 정원을 넘긴 조는 60%만 계산된다. 결속은 현 소속 1.0, 과거 소속 0.5로 센다.<br>'+
    '보급 요청은 양편이 같은 횟수를 쓰며, 마지막 배치에서는 아무도 쓰지 못한다.<br>'+
    '공유 보급에서는 한 팩을 셋이 나눠 집고, 남은 카드는 다시 순환한다.'));
}

/* ═══════ 도감 ═══════ */
var DEX_POOL={"함":SHIP,"기체":MECH,"파일럿":PILOT,"지휘관":CREW};
var dexTab="기체", dexView=null, dexScroll=0, ovlEl=null;
var dexVar="r";   /* 도감에서 볼 초상 — "m" · "f" · "r"(무작위) */
var dexSlide=0;   /* 넘어간 방향 — 밀림 효과에 쓴다 */
var dexSer="";    /* 시리즈 걸러보기 — 빈 값이면 전부 */
/* 지금 탭에서 걸러진 목록 — 격자와 앞뒤 이동이 같은 목록을 본다 */
function dexList(tab){
  var arr=DEX_POOL[tab]||[];
  if(!dexSer)return arr;
  return arr.filter(function(c){return serAll(c).indexOf(dexSer)>=0});
}
/* 그 탭에 실제로 있는 시리즈만 골라 센다 */
function serCounts(tab){
  var arr=DEX_POOL[tab]||[],cnt={},i,j;
  for(i=0;i<arr.length;i++){
    var sl=serAll(arr[i]);
    for(j=0;j<sl.length;j++)cnt[sl[j]]=(cnt[sl[j]]||0)+1;
  }
  return cnt;
}
/* 상세에서 같은 탭의 이웃 카드로. 끝에서는 반대편으로 돈다 */
function dexStep(dir){
  if(!dexView)return;
  var arr=dexList(dexView.t);if(!arr.length)return;
  var i=arr.indexOf(dexView.c);
  if(i<0){arr=DEX_POOL[dexView.t];i=arr.indexOf(dexView.c);if(i<0)return}
  var n=(i+dir+arr.length)%arr.length;
  dexSlide=dir;
  dexView={c:arr[n],t:dexView.t,v:dexView.v};   /* 성별 선택은 이어간다 */
  drawOvl();
}
var zoomEl=null;
function closeZoom(){
  if(zoomEl&&zoomEl.parentNode)zoomEl.parentNode.removeChild(zoomEl);
  zoomEl=null;
}
function openZoom(url){
  closeZoom();
  var z=el("div","zoom");
  z.innerHTML='<img src="'+imgURL(url)+'" alt="">'+
    '<button type="button" class="zx" aria-label="닫기">닫기</button>';
  z.onclick=function(){closeZoom()};
  zoomEl=z;
  document.body.appendChild(z);
}
document.addEventListener("keydown",function(e){
  if(e.key==="Escape"&&zoomEl)closeZoom();
});
function closeOvl(){document.getElementById("ovlArea").innerHTML="";ovlEl=null;dexScroll=0}
function openDex(tab){
  dexTab=tab||dexTab; dexView=null; dexScroll=0; drawOvl();
}
function openDetail(name,type){
  var arr=DEX_POOL[type],i,card=null;
  for(i=0;i<arr.length;i++)if(arr[i][0]===name)card=arr[i];
  if(!card)return;
  dexView={c:card,t:type,v:dexVar==="r"?variantOf(card):dexVar};
  drawOvl();
}
function statRows(c,type){
  var labels=STAT_LABEL[type],out="",i,col=fc(c[1][c[1].length-1]);
  for(i=0;i<4;i++){
    var v=c[2+i],w=(type==="함"&&i===3)?v*14:v;
    out+='<div class="dbar" style="--cc:'+col+'"><span>'+labels[i]+'</span>'+
      '<u><i style="width:'+Math.min(100,w)+'%"></i></u><b>'+v+'</b></div>';
  }
  return out;
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

/* ═══════ 도감 · 기록 · 통계 ═══════ */
function stampRows(){
  var got=[],yet=[],i;
  for(i=0;i<COMBO.length;i++){
    var cb=COMBO[i];
    if(!(cb.t[2]>0||cb.t[3]>0||cb.t[4]>0))continue;   /* 악연은 교신 기록에 넣지 않는다 */
    (REC.stamps[cb.n]?got:yet).push(cb);
  }
  return {got:got,yet:yet};
}
function drawRecord(w){
  var st=stampRows(),i;
  var head=el("div","statbar");
  head.innerHTML='<div><u>'+Object.keys(REC.feats).length+'</u><span>훈장 / '+FEATS.length+'</span></div>'+
    '<div><u>'+st.got.length+'</u><span>교신 기록 / '+(st.got.length+st.yet.length)+'</span></div>'+
    '<div><u>'+Object.keys(REC.seen).length+'</u><span>기용 카드</span></div>';
  w.appendChild(head);

  w.appendChild(el("h3",null,"훈장"));
  var fl=el("div","medals");
  for(i=0;i<FEATS.length;i++){
    var f=FEATS[i],on=!!REC.feats[f.id],m=el("div","medal"+(on?" on":""));
    m.innerHTML='<b>'+(on?f.n:"？？？")+'</b><span>'+f.d+'</span>';
    fl.appendChild(m);
  }
  w.appendChild(fl);

  w.appendChild(el("h3",null,"교신 기록 · 맺은 인연"));
  if(st.got.length){
    var g1=el("div","stamps");
    for(i=0;i<st.got.length;i++){
      var cb=st.got[i],sp=el("span","stamp"+(cb.k?" kin":""));
      sp.textContent=cb.n.replace(/^(혈연|악연) · /,"");
      sp.title=cb.m.join(" · ");
      g1.appendChild(sp);
    }
    w.appendChild(g1);
  }else w.appendChild(el("div","note","아직 맺은 인연이 없다."));
  if(st.yet.length){
    w.appendChild(el("h3",null,"아직 못 맺은 인연 "+st.yet.length));
    var g2=el("div","stamps");
    for(i=0;i<st.yet.length;i++){
      var sp2=el("span","stamp yet");
      sp2.textContent="？ "+st.yet[i].m.length+"인";
      g2.appendChild(sp2);
    }
    w.appendChild(g2);
  }
}
function drawStats(w){
  var i,k;
  var bar=el("div","statbar");
  bar.innerHTML='<div><u>'+REC.games+'</u><span>판</span></div>'+
    '<div><u>'+REC.first+'</u><span>수위</span></div>'+
    '<div><u>'+(REC.games?Math.round(REC.first/REC.games*100):0)+'%</u><span>수위율</span></div>'+
    '<div><u>'+REC.best+'</u><span>최고 점수</span></div>';
  w.appendChild(bar);

  w.appendChild(el("h3",null,"순위 분포"));
  var tot=Math.max(1,REC.games),rk=el("div","dinfo");
  [["수위",REC.first,"var(--amber)"],["2위",REC.second,"var(--dim)"],["3위",REC.third,"var(--alert)"]]
    .forEach(function(r){
      var row=el("div","r");
      row.innerHTML='<u>'+r[0]+'</u><div><div class="dbar" style="--cc:'+r[2]+'">'+
        '<u><i style="width:'+(r[1]/tot*100).toFixed(0)+'%"></i></u><b>'+r[1]+'</b></div></div>';
      rk.appendChild(row);
    });
  w.appendChild(rk);

  w.appendChild(el("h3",null,"적 함대 난이도별 수위"));
  var lv=el("div","dinfo");
  for(i=0;i<AI_NAME.length;i++){
    var row2=el("div","r"),won=REC.lv[i]||0;
    row2.innerHTML='<u>'+AI_NAME[i]+'</u><div><div class="dbar" style="--cc:var(--ok)">'+
      '<u><i style="width:'+Math.min(100,won*10)+'%"></i></u><b>'+won+'</b></div></div>';
    lv.appendChild(row2);
  }
  w.appendChild(lv);

  /* 자주 기용한 카드 */
  var arr=[];
  for(k in (REC.picks||{}))arr.push([k,REC.picks[k]]);
  arr.sort(function(a,b){return b[1]-a[1]});
  w.appendChild(el("h3",null,"자주 기용한 카드"));
  if(arr.length){
    var pk=el("div","stamps");
    for(i=0;i<Math.min(20,arr.length);i++){
      var sp=el("span","stamp");
      sp.innerHTML=arr[i][0]+'<b> '+arr[i][1]+'</b>';
      pk.appendChild(sp);
    }
    w.appendChild(pk);
  }else w.appendChild(el("div","note","아직 기록이 없다."));

  /* 시리즈별 기용 */
  var ser={},all=[].concat(MECH,PILOT,SHIP,CREW);
  for(i=0;i<all.length;i++)if(REC.seen[all[i][0]]){
    var sl=serAll(all[i]);
    for(var si2=0;si2<sl.length;si2++){
      var sn=SER_NAME[sl[si2]]||sl[si2];
      ser[sn]=(ser[sn]||0)+1;
    }
  }
  var sarr=[];for(k in ser)sarr.push([k,ser[k]]);
  sarr.sort(function(a,b){return b[1]-a[1]});
  if(sarr.length){
    w.appendChild(el("h3",null,"시리즈별 기용"));
    var sl=el("div","dinfo"),mx=sarr[0][1];
    for(i=0;i<sarr.length;i++){
      var row3=el("div","r");
      row3.innerHTML='<u>'+sarr[i][0]+'</u><div><div class="dbar" style="--cc:var(--amber)">'+
        '<u><i style="width:'+(sarr[i][1]/mx*100).toFixed(0)+'%"></i></u><b>'+sarr[i][1]+'</b></div></div>';
      sl.appendChild(row3);
    }
    w.appendChild(sl);
  }

  var row4=el("div","row");
  var rb=el("button","btn sm","기록 지우기");
  rb.onclick=function(){
    if(rb.dataset.arm){
      REC={v:1,games:0,first:0,second:0,third:0,best:0,stamps:{},feats:{},lv:{},seen:{},picks:{}};
      recSave();drawOvl();
    }else{rb.dataset.arm="1";rb.textContent="정말 지울까? 한 번 더";}
  };
  row4.appendChild(rb);
  w.appendChild(row4);
}

/* 오버레이 마무리 — 어느 탭이든 같은 방식으로 닫고 스크롤 버튼을 붙인다 */
function finishOvl(ov,w,a,restore){
  ov.appendChild(w);
  ov.onclick=function(e){if(e.target===ov)closeOvl()};
  var jump=el("div","jump");
  var up=el("button","jb","▲");
  up.onclick=function(e){e.stopPropagation();
    ov.scrollTo?ov.scrollTo({top:0,behavior:"smooth"}):ov.scrollTop=0};
  var dn=el("button","jb","▼");
  dn.onclick=function(e){e.stopPropagation();
    var h=ov.scrollHeight||0;
    ov.scrollTo?ov.scrollTo({top:h,behavior:"smooth"}):ov.scrollTop=h};
  jump.appendChild(up);jump.appendChild(dn);
  ov.appendChild(jump);
  a.appendChild(ov);
  ovlEl=ov;
  ov.scrollTop=restore;
}
function drawOvl(){
  var a=document.getElementById("ovlArea");a.innerHTML="";
  var ov=el("div","ovl"),w=el("div","ovlw");
  var hd=el("div","ovlh");
  if(dexView){
    hd.innerHTML='<b>'+dexView.c[0]+'</b>';
    var back=el("button","xbtn","‹");
    back.onclick=function(){dexView=null;drawOvl()};
    hd.appendChild(back);
  }else hd.innerHTML='<b>도감</b>';
  var x=el("button","xbtn","✕");x.onclick=closeOvl;
  hd.appendChild(x);
  w.appendChild(hd);

  if(dexView){
    var c=dexView.c,type=dexView.t,col=fc(c[1][c[1].length-1]);
    if(dexSlide){w.className="ovlw "+(dexSlide>0?"slideL":"slideR");dexSlide=0}
    var cls=type==="함"?"wide":type==="지휘관"?"sq":"tall";
    var big=el("div","big "+cls);
    big.innerHTML=bigHTML(c,dexView.v);
    w.appendChild(big);
    var nav=el("div","dexnav");
    var arr0=dexList(type);
    if(arr0.indexOf(c)<0)arr0=DEX_POOL[type];
    var idx=arr0.indexOf(c)+1;
    var pv=el("button","navb","‹ 이전");
    pv.onclick=function(){dexStep(-1)};
    var nx=el("button","navb","다음 ›");
    nx.onclick=function(){dexStep(1)};
    var cnt=el("span","navc",idx+" / "+arr0.length);
    nav.appendChild(pv);nav.appendChild(cnt);nav.appendChild(nx);
    w.appendChild(nav);
    var tg=el("div","vtog");
    ["m","f"].forEach(function(v){
      var b2=el("button",dexView.v===v?"on":"",v==="m"?"♂ 남성체":"♀ 여성체");
      b2.onclick=function(){dexView.v=v;drawOvl()};
      tg.appendChild(b2);
    });
    w.appendChild(tg);
    var lo=loreOf(c);
    if(lo)w.appendChild(el("div","lore",lo));
    var info=el("div","dinfo");
    var facs=c[1].map(function(f){
      return '<span class="pill" style="--cc:'+fc(f)+'">'+f+'</span>';
    }).join(' ');
    var html='<div class="r"><u>소속이력</u><div style="display:flex;flex-wrap:wrap;gap:4px">'+facs+'</div></div>'+
      '<div class="r"><u>시리즈</u><div>'+serAll(c).map(function(x){
        return '<span class="pill">'+(SER_NAME[x]||x)+'</span>'}).join(" ")+'</div></div>';
    var tgs=tagsOf(c);
    if(tgs.length)html+='<div class="r"><u>태그</u><div>'+tgs.map(function(x){
      return '<span class="pill">'+x+'</span>'}).join(" ")+'</div></div>';
    if(type==="기체")html+='<div class="r"><u>계열</u><div>'+c[7]+
      (LINE[c[7]]?' <span style="color:var(--amber)">· '+LINE[c[7]]+' 적합</span>':'')+
      ' · '+c[6]+'</div></div>';
    /* 형식번호 — 이름이 갈려도 같은 기체인지는 이걸로 가린다.
       공식 사이트에 없고 G 제네레이션에도 안 실린 기체는 비어 있다 */
    if(type==="기체"&&c[9])html+='<div class="r"><u>형식</u><div class="mono">'+c[9]+'</div></div>';
    if(type==="기체"&&c[10]){
      var tw=[],tk;
      for(tk in c[10])tw.push('<span'+(tk===FIELD?' style="color:var(--amber)"':'')+'>'+
        tk+' '+["","부적합","보통","적합"][c[10][tk]]+'</span>');
      html+='<div class="r"><u>지형</u><div class="terr">'+tw.join("")+'</div></div>';
    }
    if(type==="파일럿")html+='<div class="r"><u>감응</u><div>'+
      (c[7]>0?c[9]+' 등급 '+c[7]:'<span style="color:var(--dim)">없음 · 특수기 부적합</span>')+
      ' · '+c[6]+'</div></div>';
    var bd=bondsOf(c,type);
    if(bd.length)html+='<div class="r"><u>전용기</u><div style="color:var(--amber)">'+bd.join(" · ")+'</div></div>';
    html+='<div class="r"><u>능력</u><div>'+statRows(c,type)+'</div></div>';
    info.innerHTML=html;
    w.appendChild(info);
    var srcx=IMG[c[0]];
    function drawGal(list,label){
      if(!list||!list.length)return;
      var g=el("div","gal");
      g.appendChild(el("div","gh",label+" "+list.length+"<span></span>"));
      for(var gi=0;gi<list.length;gi++){
        (function(url){
          var box=el("div","gi");
          box.innerHTML='<img src="'+imgURL(url)+'" alt="" loading="lazy" decoding="async" onerror="this.parentNode.style.display=\'none\'">';
          box.onclick=function(){openZoom(url)};
          g.appendChild(box);
        })(list[gi]);
      }
      w.appendChild(g);
    }
    if(srcx){
      /* 지금 판에서 고른 화풍만 크게 뜨지만, 갖고 있는 그림은 화풍별로 다 보여준다 */
      var bks=artBuckets(c[0]),bi;
      for(bi=0;bi<bks.length;bi++){
        var tail=bks[bi].k?" · "+(ART_NAME[bks[bi].k]||bks[bi].k):"";
        ["f","m"].forEach(function(g){
          var gl=g==="f"?"여":"남";
          drawGal(cutsOf(bks[bi].b,"extra",g),"다른 그림"+tail+
            (cutsOf(bks[bi].b,"extra",flip(g)).length?" · "+gl:""));
          drawGal(cutsOf(bks[bi].b,"casual",g),"일상"+tail+
            (cutsOf(bks[bi].b,"casual",flip(g)).length?" · "+gl:""));
        });
      }
    }
    if(!srcx)w.appendChild(el("div","note",
      '이 카드에는 아직 그림이 없다. <b>IMG["'+c[0]+'"]</b>에 남성체(m)·여성체(f)를 넣으면 여기에 뜬다.'
      +'<br>갤러리용 그림은 <b>extra[]</b>, 일상 버전은 <b>casual[]</b> 에 넣는다.'));
  }else{
    var tabs=el("div","tabs");
    kindNames().concat(["공적","통계"]).forEach(function(t){
      var b3=el("button","tab"+(dexTab===t?" on":""),
        DEX_POOL[t]?t+" "+DEX_POOL[t].length:t);
      b3.onclick=function(){dexTab=t;dexScroll=0;drawOvl()};
      tabs.appendChild(b3);
    });
    w.appendChild(tabs);
    if(DEX_POOL[dexTab]){
      var vr=el("div","dexvar");
      vr.appendChild(el("span",null,"초상"));
      [["남","m"],["여","f"],["무작위","r"]].forEach(function(o){
        var vb=el("button","obtn"+(dexVar===o[1]?" on":""),o[0]);
        vb.onclick=function(){dexVar=o[1];cfgSave();drawOvl()};
        vr.appendChild(vb);
      });
      w.appendChild(vr);
      var cnt2=serCounts(dexTab),order=Object.keys(SER_NAME),k2,opts="";
      opts+='<option value="">전체 '+DEX_POOL[dexTab].length+'</option>';
      for(k2=0;k2<order.length;k2++){
        var code=order[k2];
        if(!cnt2[code])continue;
        opts+='<option value="'+code+'"'+(dexSer===code?" selected":"")+'>'+
          SER_NAME[code]+' '+cnt2[code]+'</option>';
      }
      var fr=el("div","serrow");
      var sel=el("select","selser");
      sel.innerHTML=opts;
      sel.value=dexSer;
      sel.onchange=function(){dexSer=this.value;dexScroll=0;drawOvl()};
      fr.appendChild(sel);
      if(dexSer){
        var cl2=el("button","serclr","전체");
        cl2.onclick=function(){dexSer="";dexScroll=0;drawOvl()};
        fr.appendChild(cl2);
      }
      w.appendChild(fr);
    }
    if(dexTab==="공적"){drawRecord(w);finishOvl(ov,w,a,dexScroll);return}
    if(dexTab==="통계"){drawStats(w);finishOvl(ov,w,a,dexScroll);return}
    var g=el("div","dexg"),arr=dexList(dexTab),i,
        ratio=1/(ASPECT[dexTab]||1.5);   /* ASPECT는 높이÷폭, CSS는 폭÷높이 */
    for(i=0;i<arr.length;i++){
      var c2=arr[i],b4=el("button","dexi");
      b4.style.setProperty("--cc",fc(c2[1][c2[1].length-1]));
      b4.innerHTML='<span class="fw" style="aspect-ratio:'+ratio.toFixed(4)+'">'+
        avHTML(c2,dexTab,null,dexVar==='r'?null:dexVar)+'</span><span>'+c2[0]+'</span>'+
        '<em>'+serLabel(c2)+'</em>';
      (function(n,t){b4.onclick=function(){
        if(ovlEl)dexScroll=ovlEl.scrollTop;
        openDetail(n,t);
      }})(c2[0],dexTab);
      g.appendChild(b4);
    }
    if(!arr.length)w.appendChild(el("div","note","이 시리즈에는 해당하는 카드가 없다."));
    w.appendChild(g);
  }
  /* 상세에서는 좌우로 밀어 이웃 카드로 — 세로 스크롤과 겹치지 않게 판정한다 */
  if(dexView){
    var sx=0,sy=0,st=0,moved=false;
    ov.addEventListener("touchstart",function(e){
      var t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();moved=false;
    },{passive:true});
    ov.addEventListener("touchend",function(e){
      if(moved)return;
      var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
      if(Date.now()-st>700)return;
      if(Math.abs(dx)<40||Math.abs(dx)<Math.abs(dy)*1.5)return;
      moved=true;
      dexStep(dx<0?1:-1);
    },{passive:true});
  }
  /* 목록으로 돌아오면 보던 자리로 */
  finishOvl(ov,w,a,dexView?0:dexScroll);
}
document.getElementById("dexbtn").onclick=function(){openDex()};
/* 도크의 썸네일을 누르면 그 카드의 상세로 */
document.addEventListener("click",function(e){
  var t=e.target.closest?e.target.closest(".th"):null;
  if(t&&t.dataset&&t.dataset.n){e.stopPropagation();openDetail(t.dataset.n,t.dataset.t)}
});
document.addEventListener("keydown",function(e){
  if(e.key==="Escape")closeOvl();
  else if(dexView&&e.key==="ArrowLeft")dexStep(-1);
  else if(dexView&&e.key==="ArrowRight")dexStep(1);
});

/* ═══════ 시작 화면 ═══════ */
function setup(){
  OBJECTIVE=null;document.body.classList.remove("draft-running");
  document.getElementById("missionBanner").hidden=true;
  document.body.classList.remove("battle-active");
  ["packArea","dockArea","boardArea","endArea"].forEach(function(id){
    document.getElementById(id).innerHTML="";});
  document.getElementById("gauge").innerHTML="";
  document.getElementById("rdl").textContent="OPERATION SETUP";
  document.getElementById("rdt").innerHTML="출격 <em>준비</em>";
  var tn=document.getElementById("turn");tn.textContent="설정";tn.className="turn";
  var a=document.getElementById("packArea"),box=el("div","setupbox");

  /* 다른 주제로 열었으면 어느 자리에 쌓이는지 밝혀 둔다 — 건담 전적과 섞이지 않는다 */
  if(SET_NAME!=="gundam"){
    var sb=el("div","note");
    sb.style.cssText="margin:0 0 12px;border:1px solid #2f4a5c;border-radius:8px;"+
      "background:#16222b;color:#9fc4d8;font-size:12px;line-height:1.7;padding:9px 11px";
    sb.innerHTML='주제 <b>'+SET_NAME+'</b> 로 열었다. 전적은 건담과 따로 쌓인다 '+
      '(지금 '+REC.games+'판).';
    a.appendChild(sb);
  }else if(REC_MOVED>=0){
    var mb=el("div","note");
    mb.style.cssText="margin:0 0 12px;border:1px solid #3f5a3a;border-radius:8px;"+
      "background:#18231a;color:#a9cba1;font-size:12px;line-height:1.7;padding:9px 11px";
    mb.innerHTML='주제마다 전적을 따로 쌓게 되어, 여태 쌓인 <b>'+REC_MOVED+
      '판</b>을 건담 자리로 옮겼다. 옛 자리도 그대로 두었다.';
    a.appendChild(mb);
  }
  /* 자료가 어긋난 것이 있으면 설정 화면 위에 접어 둔다. 판은 서지만 알고는 있어야 한다 */
  if(DATA_WARN.length){
    var wb=el("details");
    wb.style.cssText="margin:0 0 12px;border:1px solid #6b5a1f;border-radius:8px;"+
      "background:#241f12;color:#d9c98a;font-size:12px;line-height:1.7;padding:9px 11px";
    wb.innerHTML='<summary style="cursor:pointer;font-weight:700">자료에 일러둘 것 '+
      DATA_WARN.length+'건</summary><ul style="margin:8px 0 0;padding-left:1.1em">'+
      DATA_WARN.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul>';
    a.appendChild(wb);
  }

  function optRow(label,desc,btns){
    var r=el("div","optrow");
    r.appendChild(el("div","optlab","<b>"+label+"</b><span>"+desc+"</span>"));
    var bs=el("div","optbtns");
    btns.forEach(function(b){bs.appendChild(b)});
    r.appendChild(bs);return r;
  }
  var lvBtns=AI_NAME.map(function(n,i){
    var b=el("button","obtn"+(AI_LV===i?" on":""),n);
    b.onclick=function(){AI_LV=i;cfgSave();setup()};return b;
  });
  box.appendChild(optRow("적 함대","신참은 실수하고 에이스는 인연까지 노린다",lvBtns));
  /* 카드가 765 기까지 늘어 여섯 조는 좁아졌다. 몇 조를 꾸릴지 고르게 한다 */
  if(SCALE_OPTS.length>1){
    var scBtns=SCALE_OPTS.map(function(n){
      var b=el("button","obtn"+(SCALE===n?" on":""),n+"조");
      b.onclick=function(){applyScale(n);cfgSave();setup()};return b;
    });
    box.appendChild(optRow("편성 규모",
      "한 편이 몇 조를 꾸릴지 — 지금 "+SCHEDULE.length+"라운드, 셋이 "+
      (slotsOf(CAP_FROM)*3)+"기를 집는다",scBtns));
  }
  function toggle(get,set){
    var b=el("button","obtn"+(get()?" on":""),get()?"켬":"끔");
    b.onclick=function(){set(!get());cfgSave();setup()};return [b];
  }
  function viewRow(label,desc,get,set,opts){
    var bs=opts.map(function(o){
      var b=el("button","obtn"+(get()===o[1]?" on":""),o[0]);
      b.onclick=function(){set(o[1]);cfgSave();setup()};return b;
    });
    return optRow(label,desc,bs);
  }
  box.appendChild(viewRow("드래프트 순서","교차는 모함 → 지휘관 → 기체·파일럿 순으로 조합을 쌓는다",
    function(){return DRAFT_FLOW},function(v){DRAFT_FLOW=v;applyScale(SCALE)},
    [["교차",'cross'],["종류별",'classic']]));
  box.appendChild(optRow("공개 작전 목표","시작할 때 공개 · 세 팀 공통 · 최대 "+(futurePairs()*6)+"점",
    toggle(function(){return objectiveOn},function(v){objectiveOn=v})));
  box.appendChild(viewRow("파일럿 초상","파일럿 카드를 어느 쪽으로 볼지",
    function(){return VIEW_P},function(v){VIEW_P=v},
    [["남",'m'],["여",'f'],["무작위",'r']]));
  box.appendChild(viewRow("기체 초상","기체 카드를 어느 쪽으로 볼지",
    function(){return VIEW_M},function(v){VIEW_M=v},
    [["남",'m'],["여",'f'],["무작위",'r'],["반대",'x']]));
  var spBtns=[["공유",true],["개별",false]].map(function(o){
    var b=el("button","obtn"+(sharedPack===o[1]?" on":""),o[0]);
    b.onclick=function(){sharedPack=o[1];cfgSave();setup()};return b;
  });
  box.appendChild(optRow("보급 방식","한 팩을 나눠 집을지, 각자 받을지",spBtns));
  var rrBtns=RR_OPT.map(function(n){
    var b=el("button","obtn"+(REROLL_MAX===n?" on":""),n===0?"없음":n+"회");
    b.onclick=function(){REROLL_MAX=n;cfgSave();setup()};return b;
  });
  box.appendChild(optRow("보급 요청","팩을 다시 펼치는 횟수 — 적 함대도 같이 쓴다",rrBtns));
  box.appendChild(optRow("증감 힌트","카드마다 점수 변화와 인연을 미리 본다",
    toggle(function(){return hintOn},function(v){hintOn=v})));
  box.appendChild(optRow("관제 두절","적 함대의 편성을 판정 때까지 가린다",
    toggle(function(){return fogOn},function(v){fogOn=v})));
  box.appendChild(optRow("보급 제한","한 번 나온 카드는 한동안 다시 오지 않는다",
    toggle(function(){return exhaustOn},function(v){exhaustOn=v})));
  var go=el("button","btn big","출격");
  go.onclick=function(){reset()};
  var r2=el("div","row");r2.appendChild(go);
  box.appendChild(r2);
  box.appendChild(el("div","note",
    "<b>전적</b>  "+REC.games+"판 · 수위 "+REC.first+" · 2위 "+REC.second+" · 3위 "+REC.third+
    (REC.best?"<br>최고 점수 "+REC.best:"")+
    "<br>교신 기록 "+Object.keys(REC.stamps).length+" · 훈장 "+Object.keys(REC.feats).length+"/"+FEATS.length));
  a.appendChild(box);
}
/* Situation board uses the same candidates, scores and pick() as the standard view. */
var tacticalOn=true;
try{tacticalOn=localStorage.getItem('atelier_tactical_v1')!=='0'}catch(e){}
function setTactical(on){
  tacticalOn=on;document.body.classList.toggle('tactical',on);
  var b=document.getElementById('viewMode');b.textContent=on?'일반 보기':'상황판';b.setAttribute('aria-pressed',String(on));
  if(teams)renderTactical();
}
var pickFeedbackTimer=null;
function showPickFeedback(c){
  clearTimeout(pickFeedbackTimer);
  var previous=document.getElementById('pickFeedback');if(previous)previous.remove();
  var notice=el('div','pick-feedback');notice.id='pickFeedback';notice.setAttribute('role','status');
  var label=el('strong');label.textContent='지명 완료';notice.appendChild(label);notice.appendChild(document.createTextNode(c[0]));document.body.appendChild(notice);
  document.body.classList.remove('pick-flash');void notice.offsetWidth;document.body.classList.add('pick-flash');
  pickFeedbackTimer=setTimeout(function(){notice.remove();document.body.classList.remove('pick-flash')},900);
}
function dialogBase(title){
  var d=document.getElementById('tacticalDialog');if(d.open)d.close();d.innerHTML='';
  var head=el('div','tac-dialog-head'),name=el('strong');name.textContent=title;
  var close=el('button','btn sm','닫기');close.onclick=function(){d.close()};head.appendChild(name);head.appendChild(close);d.appendChild(head);
  return d;
}
function inspectCandidate(c,type){
  var stamp=gen,r=round,slot=si,d=dialogBase(c[0]);
  var content=el('div','pick-content'),details=el('div','pick-details');
  var gallery=createCardGallery(c,type,null,false);
  content.appendChild(gallery);content.appendChild(details);d.appendChild(content);
  var affiliation=el('p','note');affiliation.textContent='소속: '+c[1].join(' → ');details.appendChild(affiliation);
  if(hintOn)details.appendChild(renderPickPreview(teams[0],c,type));
  details.appendChild(el('div','lore',loreOf(c)||'카드 능력과 편성 효과를 확인하세요.'));
  details.appendChild(el('div','dinfo',statRows(c,type)));
  if(type==='기체')details.appendChild(el('p','note','태그: '+(tagsOf(c).join(' · ')||'없음')+' · '+FIELD+' '+terrainWord(c)));
  if(hintOn){var gain=delta(c,type);details.appendChild(el('p','note','선택 시 '+(gain.v>=0?'+':'')+gain.v+'점'+(gain.why?'<br>'+gain.why:'')))}
  if(OBJECTIVE){var before=objectiveScore(teams[0]);teams[0][type].push(c);var after=objectiveScore(teams[0]);teams[0][type].pop();
    details.appendChild(el('p','note','공개 목표: '+OBJECTIVE.name+' · 이 카드로 '+(after>=before?'+':'')+(after-before)+'점'))}
  var confirm=el('button','btn big','이 카드 지명');
  confirm.onclick=function(){
    if(gen!==stamp||round!==r||si!==slot||busy||turnSeq()[si]!==0){d.close();return}
    var available=sharedPack?packArr.some(function(x){return x.c===c&&x.by===null}):curPack&&curPack.indexOf(c)>=0;
    if(!available){d.close();return}d.close();pick(c);
  };var actions=el('div','pick-actions');actions.appendChild(confirm);d.appendChild(actions);d.showModal();
}
function inspectTeam(ti){
  if(fogOn&&ti!==0&&round<SCHEDULE.length)return;
  var d=dialogBase(seatName(ti));d.appendChild(dockEl(ti));
  var score=el('div','note');evaluate(teams[ti]).rows.forEach(function(r){var line=el('div');line.textContent=r[0]+'  '+r[1];score.appendChild(line)});
  d.appendChild(score);d.showModal();
}
function renderTactical(){
  if(!teams)return;
  var area=document.getElementById('tacticalArea'),banner=document.getElementById('missionBanner');
  var done=round>=SCHEDULE.length;
  banner.hidden=!OBJECTIVE;
  if(OBJECTIVE)banner.textContent='공개 작전 · '+OBJECTIVE.name+' | '+OBJECTIVE.rule+' '+OBJECTIVE.target+' · 내 진행 '+
    Math.min(OBJECTIVE.target,objectiveCount(teams[0],OBJECTIVE))+'/'+OBJECTIVE.target+' (+'+objectiveScore(teams[0])+'/'+OBJECTIVE.max+'점)';
  if(!tacticalOn||done){area.innerHTML='';return}
  area.innerHTML='';
  var type=SCHEDULE[round],mine=turnSeq()[si]===0&&!busy;
  var meta=el('div','tac-meta'),next=el('span');
  next.textContent='다음 '+(SCHEDULE[round+1]||'결과')+' · '+(sharedPack?'공유 보급':'개별 보급');meta.appendChild(next);
  var supply=el('button','btn sm','보급 '+rerolls+'/'+REROLL_MAX);supply.disabled=!mine||rerolls<1||round===SCHEDULE.length-1;
  supply.onclick=function(){var b=document.querySelector('#packArea .row button');if(b&&!b.disabled)b.click()};meta.appendChild(supply);area.appendChild(meta);
  var center=el('div','tac-center'),cards=el('div','tac-cards');
  var slots=sharedPack?packArr:(curPack||[]).map(function(c){return {c:c,by:null}});
  if(!sharedPack&&!mine)slots=[];
  if(!slots.length)cards.appendChild(el('p','note','상대 지명 중 · 곧 내 보급이 도착합니다.'));
  slots.forEach(function(x){cards.appendChild(choiceCard(x.c,type,mine&&x.by===null?confirmPick:null,true,x.by))});
  center.appendChild(cards);
  var roster=el('aside','tac-roster'),rh=el('strong');rh.textContent='내 편성';roster.appendChild(rh);var progress=el('button','btn sm');progress.type='button';progress.textContent='연대·목표';progress.onclick=openProgress;roster.appendChild(progress);
  ['함','지휘관'].forEach(function(k){var line=el('p');line.textContent=k+' · '+(teams[0][k].map(function(c){return c[0]}).join(', ')||'미정');roster.appendChild(line)});
  assign(teams[0]).forEach(function(u){var line=el('div','tac-pair');line.textContent=(u.m?u.m[0]:'기체 대기')+' × '+(u.p?u.p[0]:'파일럿 대기');roster.appendChild(line)});
  center.appendChild(roster);area.appendChild(center);area.appendChild(rosterStrip());
  var summary=el('div','tac-teams');
  [0,1,2].forEach(function(ti){var t=teams[ti],hidden=fogOn&&ti!==0;
    var b=el('button','tac-team');b.disabled=hidden;
    b.innerHTML='<b>'+(ti===0?'내 편성':'적 '+ti)+'</b><strong>'+(hidden?'???':evaluate(t).total+'점')+'</strong>';
    var counts=el('span');counts.textContent=hidden?'관제 두절':'기체 '+t.기체.length+'/'+SCALE+' · 파일럿 '+t.파일럿.length+'/'+SCALE;
    b.appendChild(counts);
    var capacity=el('span');capacity.textContent=hidden?'':('정원 '+capOf(t)+' · 지휘관 '+t.지휘관.length+'/'+slotsOf('지휘관'));
    b.appendChild(capacity);b.onclick=function(){inspectTeam(ti)};summary.appendChild(b);
  });area.appendChild(summary);
  var recent=el('div','tac-recent');
  if(!fogOn&&log.length){var l=log[0];recent.textContent='최근 · '+(l.ti===0?'아군':'적 '+l.ti)+' '+(l.c?l.c[0]:'보급 요청')}
  else recent.textContent='편성을 누르면 전체 목록과 점수 내역을 볼 수 있습니다.';
  area.appendChild(recent);
}
document.getElementById('viewMode').onclick=function(){setTactical(!tacticalOn);window.scrollTo(0,0);try{localStorage.setItem('atelier_tactical_v1',tacticalOn?'1':'0')}catch(e){}};
setTactical(tacticalOn);

/* Viewing controls never mutate the draft or advance a turn. */
function setPlayCardSize(large){
  document.body.classList.toggle('large-cards',large);
  var b=document.getElementById('playCardSize');
  b.textContent=large?'카드 기본':'카드 크게';b.setAttribute('aria-pressed',String(large));
}
try{setPlayCardSize(localStorage.getItem('atelier_play_large_v1')!=='0')}catch(e){setPlayCardSize(true)}
document.getElementById('playCardSize').onclick=function(){
  var large=!document.body.classList.contains('large-cards');setPlayCardSize(large);
  try{localStorage.setItem('atelier_play_large_v1',large?'1':'0')}catch(e){}
};
document.querySelectorAll('[data-jump]').forEach(function(b){
  var target=document.getElementById(b.dataset.jump);
  new MutationObserver(function(){b.disabled=!target.children.length}).observe(target,{childList:true});
  b.onclick=function(){target.scrollIntoView({block:'start'})};
});

/* ═══════ 부팅 ═══════
   카드를 받아 와야 시작할 수 있다. 예전에는 자료가 이 파일 안에 있어
   읽어 들이는 즉시 setup() 을 불렀지만, 지금은 data/*.json 을 기다린다.
   file:// 로 열면 브라우저가 fetch 를 막는다 — 그때는 이유를 적어 준다 */
function boot(){
  loadRenames();
  loadData().then(function(by){
    if(!showDataReport(validateData(by)))return;
    normalizeAll();
    refreshImages();
    cfgLoad();
    setup();
  }).catch(function(e){
    var why=(location.protocol==="file:")
      ? "브라우저가 file:// 에서는 data/ 를 읽지 못한다.<br>"+
        "저장소 폴더에서 <code>python3 -m http.server</code> 를 띄우고 "+
        "<code>localhost:8000/play.html</code> 로 열어라."
      : "data/ 를 읽지 못했다. 파일이 함께 올라갔는지 확인해라.";
    document.body.innerHTML=
      '<div style="padding:2rem;font:14px/1.7 system-ui;color:#ddd;background:#14161c;'+
      'min-height:100vh"><h2 style="margin:0 0 .8rem">자료를 못 읽었다</h2>'+
      '<p>'+why+'</p><p style="color:#888">'+String(e&&e.message||e)+'</p></div>';
  });
}
boot();
