import {OFFICERS,BONDS} from './data.js';
export {OFFICERS};
export const ROLES={guard:'수호',warrior:'돌격',archer:'저격',sage:'책략',healer:'지원',leader:'지휘'};
export const UNIQUE={
 '여포':['무쌍','처형',2.5,'가장 약한 적에게 250% 피해. 처치 시 기력 50 회복.'],
 '관우':['일도양단','관통',2.6,'적 전열 한 명에게 방어를 무시하는 260% 피해.'],
 '장비':['장판의 호통','도발',1.2,'모든 적에게 120% 피해. 자신에게 보호막 160, 다음 공격 두 번 유도.'],
 '조운':['단기구원','구원',1.8,'적에게 180% 피해. 가장 위태로운 아군에게 보호막 140.'],
 '제갈량':['팔진도','진법',1.15,'모든 적에게 115% 책략 피해. 다음 행동 한 번 봉쇄.'],
 '조조':['위무지략','지휘',1,'전군 기력 35 회복, 다음 두 차례 공격 25% 강화.'],
 '유비':['인덕','회복',1.3,'전군 체력 회복. 도원결의 편성에서는 회복량 증가.'],
 '주유':['적벽의 화염','화공',1.55,'모든 적에게 155% 책략 피해. 두 차례 화상.'],
 '사마의':['귀모','흡수',2.2,'체력이 낮은 적에게 220% 피해를 주고 자신 회복.'],
 '손권':['강동의 주인','지휘',1,'전군 기력 35 회복, 다음 두 차례 공격 25% 강화.'],
 '손책':['소패왕','돌파',2.3,'적 전열에 230% 피해. 자신에게 보호막 90.'],
 '마초':['서량의 돌격','돌파',2.3,'적 전열에 230% 피해. 자신에게 보호막 90.'],
 '황충':['백보천양','저격',2.5,'적 후열 중 체력이 가장 낮은 적에게 250% 피해.'],
 '태사자':['신궁','저격',2.5,'적 후열 중 체력이 가장 낮은 적에게 250% 피해.'],
 '순욱':['왕좌지재','회복',1.3,'전군의 체력을 회복. 높은 정치가 회복량에 반영.'],
 '화타':['청낭서','회복',1.65,'전군의 체력을 크게 회복.'],
 '방통':['연환계','진법',1.15,'모든 적에게 115% 책략 피해. 다음 행동 한 번 봉쇄.'],
 '곽가':['십승십패','책략',2.6,'지력이 가장 높은 적에게 260% 책략 피해.'],
 '장료':['합비의 위명','도발',1.2,'모든 적에게 120% 피해. 자신에게 보호막 160, 다음 공격 두 번 유도.'],
 '감녕':['백기야습','저격',2.5,'적 후열 중 체력이 가장 낮은 적에게 250% 피해.'],
 '육손':['화소연영','화공',1.55,'모든 적에게 155% 책략 피해. 두 차례 화상.'],
 '전위':['악래','수호',1,'전군에 보호막 100. 자신에게 추가 보호막 100.'],
 '허저':['호치','수호',1,'전군에 보호막 100. 자신에게 추가 보호막 100.']
};
const DEFAULT={guard:['철벽','수호',1,'전군에 보호막 100. 자신에게 추가 보호막 100.'],warrior:['맹공','돌파',1.8,'적 전열에 180% 피해. 자신에게 보호막 90.'],archer:['집중 사격','저격',2,'적 후열 중 체력이 가장 낮은 적에게 200% 피해.'],sage:['교란','책략',2,'지력이 가장 높은 적에게 200% 책략 피해.'],healer:['군량 보급','회복',1,'전군의 체력 회복. 정치에 따라 회복량 증가.'],leader:['진군','지휘',1,'전군 기력 35 회복, 다음 두 차례 공격 25% 강화.']};
export const RELICS=[{id:'blade',name:'청강검',desc:'전군 공격력 +12%',symbol:'劍'},{id:'armor',name:'현철갑',desc:'전군 최대 체력 +15%',symbol:'甲'},{id:'book',name:'병법서',desc:'전투 시작 기력 +25',symbol:'策'},{id:'drum',name:'진군고',desc:'전군 행동 속도 +12%',symbol:'鼓'},{id:'herb',name:'청낭',desc:'전투 승리 후 체력 15% 추가 회복',symbol:'藥'},{id:'jade',name:'옥인',desc:'전군 방어력 +12',symbol:'印'}];
export const CHAPTERS=['황건의 잔불','영천의 기로','양양의 객잔','사수관 돌파','낙양의 밀서','허창의 군영','관도의 풍운','적벽의 전운','호로관 결전'];
export function roleOf(o){if(['전위','허저','장비','조인','주태','학소','왕평','고순'].includes(o.name))return 'guard';if(['황충','태사자','손상향','하후연','감녕','축융'].includes(o.name))return 'archer';if(o.role==='군주')return 'leader';if(o.role==='문관'||['화타','사마휘'].includes(o.name))return 'healer';if(o.role==='책사')return 'sage';return 'warrior';}
export function skillOf(o){return UNIQUE[o.name]||DEFAULT[roleOf(o)];}
export function rarity(o){const sorted=[o.command,o.might,o.intellect,o.politics].sort((a,b)=>b-a);return UNIQUE[o.name]?'전설':sorted[0]>=90?'명장':sorted[0]>=78?'정예':'일반';}
export function rand(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function sample(s,arr,n){const a=[...arr],out=[];while(out.length<n&&a.length)out.push(a.splice(Math.floor(rand(s)*a.length),1)[0]);return out;}
export function officer(name){return OFFICERS.find(o=>o.name===name);}
export function bondsFor(names){return BONDS.filter(b=>b.m.filter(n=>names.includes(n)).length>=2).map(b=>({...b,count:b.m.filter(n=>names.includes(n)).length}));}
export function stats(o,level=1,relics=[]){const r=roleOf(o),magic=['sage','healer'].includes(r),power=magic?o.intellect:o.might,lv=1+(level-1)*.13;
 return {maxHp:Math.round((300+o.command*2.6+(r==='guard'?160:0))*lv*(relics.includes('armor')?1.15:1)),attack:Math.round((30+power*.62+(r==='healer'?o.politics*.16:0))*lv*(relics.includes('blade')?1.12:1)),defense:Math.round(12+o.command*.2+(r==='guard'?13:0)+(relics.includes('jade')?12:0)),speed:(65+(magic?o.intellect:o.might)*.4)*(relics.includes('drum')?1.12:1),magic};}
export function newRun(faction,seed=Date.now()>>>0){const starters={촉:['유비','관우','왕평','마량','요화'],위:['조조','장료','이전','만총','조홍'],오:['손권','주유','정보','한당','감택']};if(!starters[faction])throw Error('진영 오류');return {version:1,seed,faction,stage:0,phase:'map',gold:100,relics:[],roster:starters[faction].map(name=>({name,level:1,hp:1})),lineup:[...starters[faction]],wins:0,log:[],offers:null,selectedNode:null};}
export function nodesFor(s){if(s.stage===8)return [{type:'boss',title:'호로관 · 여포',desc:'여포의 무쌍과 정예 수비대를 격파하십시오.'}];if(s.stage===2||s.stage===5)return [{type:'camp',title:'야영지',desc:'전군 완전 회복 + 장수 한 명 강화'},{type:'recruit',title:'재야의 인재',desc:'장수 3명 중 한 명 무료 영입'}];return [{type:'battle',title:['황건 토벌','보급로 확보','국경 수비'][s.stage%3],desc:'일반 전투 · 금 60 · 보물 선택'},{type:'elite',title:['적장 기습','정예군 돌파','요충지 공략'][s.stage%3],desc:'강적 전투 · 금 100 · 장수 추가 영입'}];}
export function recruitOffers(s){return sample(s,OFFICERS.filter(o=>!s.roster.some(r=>r.name===o.name)&&Math.max(o.command,o.might,o.intellect,o.politics)>=65),3).map(o=>o.name);}
export function recruit(s,name){if(!s.offers?.includes(name)||s.roster.some(r=>r.name===name))return false;s.roster.push({name,level:Math.max(1,Math.floor(s.stage/3)+1),hp:1});s.offers=null;return true;}
export function upgrade(s,name,free=false){const r=s.roster.find(x=>x.name===name);if(!r||r.level>=5||(!free&&s.gold<60))return false;if(!free)s.gold-=60;r.level++;r.hp=Math.min(1,r.hp+.2);return true;}
export function swap(s,slot,name){if(!Number.isInteger(slot)||slot<0||slot>=5||!s.roster.some(r=>r.name===name))return false;const old=s.lineup.indexOf(name);if(old>=0)[s.lineup[old],s.lineup[slot]]=[s.lineup[slot],s.lineup[old]];else s.lineup[slot]=name;return true;}
export function nextStage(s){s.stage++;s.phase=s.stage>=9?'victory':'map';s.offers=null;s.selectedNode=null;}
export function chooseNode(s,type){if(s.phase!=='map'||!nodesFor(s).some(n=>n.type===type))return false;s.selectedNode=type;if(type==='camp'){s.roster.forEach(r=>r.hp=1);s.phase='camp';}else if(type==='recruit'){s.offers=recruitOffers(s);s.phase='recruit';}else s.phase='battle';return true;}
export function unit(o,side,index,level,relics,hp=1){const st=stats(o,level,relics);return {...o,...st,side,index,key:side+'-'+index,level,roleKey:roleOf(o),hp:Math.max(1,Math.round(st.maxHp*hp)),energy:relics.includes('book')?55:30,shield:0,next:index*.025,burn:0,stun:0,buff:0,taunt:0};}
export function makeBattle(s){const elite=s.selectedNode==='elite',boss=s.selectedNode==='boss';let enemies;if(boss)enemies=['여포','고순','장료','진궁','초선'].map(officer);else {const pool=OFFICERS.filter(o=>o.command>=40&&Math.max(o.might,o.intellect)<(elite?100:86));enemies=sample(s,pool,5);enemies.sort((a,b)=>(roleOf(a)==='healer'?1:0)-(roleOf(b)==='healer'?1:0));}
 const level=1+Math.floor(s.stage/3),foeLevel=level+(boss?1:0);const units=s.lineup.map((name,i)=>{const r=s.roster.find(x=>x.name===name);return unit(officer(name),'ally',i,r.level,s.relics,r.hp);}).concat(enemies.map((o,i)=>{const u=unit(o,'enemy',i,foeLevel,[]);u.maxHp=Math.round(u.maxHp*(boss?1:elite?.97:.78));u.hp=u.maxHp;u.attack=Math.round(u.attack*(boss?1:elite?.92:.76));return u;}));
 const bonds=bondsFor(s.lineup);const bonus=Math.min(.15,bonds.length*.03);for(const u of units.filter(u=>u.side==='ally'))u.attack=Math.round(u.attack*(1+bonus));
 return {units,seed:s.seed,turn:0,ended:null,commands:3,guard:0,focus:0,auto:true,queue:[],bonds:bonds.map(b=>b.n)};}
export function living(b,side){return b.units.filter(u=>u.side===side&&u.hp>0);}
export function outcome(b){if(!living(b,'enemy').length)return 'win';if(!living(b,'ally').length)return 'lose';if(b.turn>=250)return 'lose';return null;}
function weakest(arr){return [...arr].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];}
export function command(b,type){if(b.ended||b.commands<=0||!['heal','guard','focus'].includes(type))return null;b.commands--;const events=[];if(type==='heal'){for(const u of living(b,'ally')){const amount=Math.min(u.maxHp-u.hp,Math.round(u.maxHp*.24));u.hp+=amount;events.push({target:u.key,amount,kind:'heal'});}}if(type==='guard'){for(const u of living(b,'ally')){u.shield+=100;events.push({target:u.key,amount:100,kind:'shield'});}}if(type==='focus')b.focus=8;return {skill:true,title:{heal:'軍醫 · 긴급 치유',guard:'固守 · 방어 진형',focus:'集中 · 집중 공격'}[type],events};}
export function queueSkill(b,key){const u=b.units.find(u=>u.key===key);if(!u||u.side!=='ally'||u.hp<=0||u.energy<100||b.ended)return false;if(!b.queue.includes(key))b.queue.push(key);return true;}
export function stepBattle(b){if(b.ended)return null;const alive=b.units.filter(u=>u.hp>0).sort((a,c)=>a.next-c.next);const actor=alive[0];actor.next+=100/actor.speed;b.turn++;
 const ev={actor:actor.key,title:'',skill:false,events:[]};
 if(actor.burn>0){actor.burn--;const damage=Math.min(actor.hp,Math.round(actor.maxHp*.07));actor.hp-=damage;ev.events.push({target:actor.key,amount:damage,kind:'burn'});if(actor.hp<=0){b.ended=outcome(b);return ev;}}
 if(actor.stun>0){actor.stun--;ev.title=actor.name+' · 행동 봉쇄';b.ended=outcome(b);return ev;}
 const friends=living(b,actor.side),foes=living(b,actor.side==='ally'?'enemy':'ally');if(!foes.length){b.ended=outcome(b);return ev;}
 const special=actor.energy>=100&&(actor.side==='enemy'||b.auto||b.queue.includes(actor.key));if(special){actor.energy=0;b.queue=b.queue.filter(k=>k!==actor.key);}else actor.energy=Math.min(100,actor.energy+26);
 const skill=skillOf(actor),type=special?skill[1]:'기본',multi=special?skill[2]:1;ev.skill=special;ev.title=actor.name+' · '+(special?skill[0]:'공격');
 const heal=(u,amount)=>{amount=Math.min(u.maxHp-u.hp,Math.round(amount));u.hp+=amount;ev.events.push({target:u.key,amount,kind:'heal'});};
 const shield=(u,amount)=>{u.shield=Math.min(400,u.shield+amount);ev.events.push({target:u.key,amount,kind:'shield'});};
 if(type==='회복'){for(const u of friends)heal(u,(actor.attack+actor.politics*.65)*multi);}
 else if(type==='수호'){for(const u of friends)shield(u,100);shield(actor,100);}
 else if(type==='지휘'){for(const u of friends){u.energy=Math.min(100,u.energy+35);u.buff=2;ev.events.push({target:u.key,amount:35,kind:'energy'});}}
 else {let targets;const front=foes.filter(u=>u.index<2);const rear=foes.filter(u=>u.index>=2);const taunter=foes.find(u=>u.taunt>0);
  if(['화공','진법','도발'].includes(type))targets=foes;else if(type==='저격')targets=[weakest(rear.length?rear:foes)];else if(['처형','흡수'].includes(type)||actor.side==='ally'&&b.focus>0)targets=[weakest(foes)];else if(type==='책략')targets=[[...foes].sort((a,c)=>c.intellect-a.intellect)[0]];else targets=[taunter||sample(b,front.length?front:foes,1)[0]];
  for(const target of targets){const critical=rand(b)<.13;let raw=Math.max(12,Math.round(actor.attack*multi*(actor.buff?1.25:1)*(critical?1.5:1)-(type==='관통'?0:target.defense*(actor.magic?.65:1))));const absorbed=Math.min(target.shield,raw);target.shield-=absorbed;raw-=absorbed;const damage=Math.min(target.hp,raw);target.hp-=damage;target.energy=Math.min(100,target.energy+10);ev.events.push({target:target.key,amount:damage,kind:'damage',critical,absorbed});if(type==='화공')target.burn=2;if(type==='진법')target.stun=1;if(target.taunt>0)target.taunt--;if(type==='처형'&&target.hp<=0)actor.energy=Math.min(100,actor.energy+50);if(type==='흡수')heal(actor,damage*.7);}
  if(type==='구원')shield(weakest(friends),140);if(type==='돌파')shield(actor,90);if(type==='도발'){shield(actor,160);actor.taunt=2;}
 }
 if(actor.buff>0)actor.buff--;if(actor.side==='ally'&&b.focus>0)b.focus--;b.ended=outcome(b);return ev;
}
export function finishBattle(s,b){if(s.phase!=='battle'||!b.ended)return false;if(b.ended==='lose'){s.phase='defeat';return true;}s.wins++;s.gold+=s.selectedNode==='elite'?100:60;for(const r of s.roster){const u=b.units.find(u=>u.side==='ally'&&u.name===r.name);if(u)r.hp=Math.min(1,Math.max(.1,u.hp/u.maxHp)+.2+(s.relics.includes('herb')?.15:0));}s.seed=b.seed;s.log.push(CHAPTERS[s.stage]);s.phase='reward';s.offers=sample(s,RELICS.filter(r=>!s.relics.includes(r.id)),3).map(r=>r.id);return true;}
export function takeReward(s,id){if(s.phase!=='reward'||(!s.offers.includes(id)&&id!=='gold'))return false;if(id==='gold')s.gold+=70;else s.relics.push(id);if(s.selectedNode==='elite'){s.offers=recruitOffers(s);s.phase='recruit';}else nextStage(s);return true;}
export function validSave(s){return s&&s.version===1&&Number.isInteger(s.seed)&&['촉','위','오'].includes(s.faction)&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=9&&['map','battle','camp','recruit','reward','victory','defeat'].includes(s.phase)&&Array.isArray(s.lineup)&&s.lineup.length===5&&new Set(s.lineup).size===5&&Array.isArray(s.roster)&&s.lineup.every(n=>s.roster.some(r=>r.name===n))&&s.roster.every(r=>officer(r.name)&&Number.isFinite(r.hp)&&r.hp>=0&&r.hp<=1&&Number.isInteger(r.level)&&r.level>=1&&r.level<=5)&&Array.isArray(s.relics)&&s.relics.every(id=>RELICS.some(r=>r.id===id))&&Number.isFinite(s.gold)&&s.gold>=0&&(!['recruit','reward'].includes(s.phase)||Array.isArray(s.offers));}
