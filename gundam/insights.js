"use strict";
/* Read-only explanations of the existing scoring rules. */
var SCORE_PARTS=[['base','기본 출격'],['sync','궁합·지형'],['loss','정원 손실'],['solo','미편성 대기'],['ship','모함'],['command','지휘관'],['faction','소속 결속'],['pledge','연대·혈연·악연'],['mission','작전 목표'],['rounding','반올림 보정']];
function scoreParts(team){
  var units=assign(team),cap=capOf(team),parts={base:0,sync:0,loss:0,solo:0,ship:team.함.length?sp(team.함[0])*.55:-60,command:0,faction:synergy(team).total*.35,pledge:0,mission:objectiveScore(team)},paired=0;
  units.forEach(function(u){if(u.m&&u.p){var base=mp(u.m)*pp(u.p)/100;parts.base+=base;parts.sync+=u.s-base;if(paired++>=cap)parts.loss-=u.s*.40}else parts.solo+=u.s});
  team.지휘관.forEach(function(c){parts.command+=cp(c)*.42});pledges(team).forEach(function(p){parts.pledge+=Math.round(p.v*PLEDGE_MUL)});
  var total=evaluate(team).total,sum=0;Object.keys(parts).forEach(function(k){parts[k]=Math.round(parts[k]);sum+=parts[k]});parts.rounding=total-sum;
  return {parts:parts,total:total,units:units};
}
function signedScore(n){return (n>0?'+':'')+n}
function infoLine(parent,text,cls){var row=el('p',cls||'insight-line');row.textContent=text;parent.appendChild(row);return row}
function scoreTable(a,b,deltaOnly){
  var table=el('table','score-table'),head=document.createElement('thead'),tr=document.createElement('tr');
  (deltaOnly?['항목','변화']:['항목','아군','상대','차이']).forEach(function(x){var th=document.createElement('th');th.textContent=x;tr.appendChild(th)});head.appendChild(tr);table.appendChild(head);
  var body=document.createElement('tbody');SCORE_PARTS.concat([['total','합계']]).forEach(function(entry){var k=entry[0],av=k==='total'?a.total:a.parts[k],bv=k==='total'?b.total:b.parts[k],d=av-bv;if(k!=='total'&&(deltaOnly?d===0:av===0&&bv===0))return;
    var row=document.createElement('tr'),label=document.createElement('th');label.textContent=entry[1];label.scope='row';row.appendChild(label);
    (deltaOnly?[signedScore(d)]:[av,bv,signedScore(d)]).forEach(function(value,i,list){var td=document.createElement('td');td.textContent=value;if(i===list.length-1)td.className=d<0?'loss':'gain';row.appendChild(td)});body.appendChild(row)});table.appendChild(body);return table;
}
function pairingMap(units){var map={};units.forEach(function(u){if(u.m)map[u.m[0]]=u.p?u.p[0]:null});return map}
function pickPreview(team,card,type){
  var copy={};['함','기체','파일럿','지휘관'].forEach(function(k){copy[k]=team[k].slice()});copy[type].push(card);
  var before=scoreParts(team),after=scoreParts(copy),old=pairingMap(before.units),next=pairingMap(after.units),changes=[];
  Object.keys(next).forEach(function(name){if(!(name in old)||old[name]!==next[name])changes.push({name:name,before:name in old?(old[name]||'파일럿 대기'):'미보유',after:next[name]||'파일럿 대기'})});
  var beforeSolo=before.units.filter(function(u){return !u.m&&u.p}).map(function(u){return u.p[0]});
  after.units.filter(function(u){return !u.m&&u.p}).forEach(function(u){if(beforeSolo.indexOf(u.p[0])<0)changes.push({name:u.p[0],before:team.파일럿.indexOf(u.p)>=0?'기존 조 편성':'미보유',after:'기체 대기'})});
  return {before:before,after:after,changes:changes};
}
function renderPickPreview(team,card,type){
  var data=pickPreview(team,card,type),box=el('details','pick-preview insight-box'),summary=el('summary');box.open=true;
  summary.textContent='지명 후 변화 · '+signedScore(data.after.total-data.before.total)+'점';box.appendChild(summary);
  data.changes.forEach(function(c){infoLine(box,c.name+' : '+c.before+' → '+c.after)});
  if(!data.changes.length)infoLine(box,'기체·파일럿 짝 변화 없음');
  box.appendChild(scoreTable(data.after,data.before,true));infoLine(box,'현재 보유 카드 기준 자동 편성 예상입니다.','insight-note');return box;
}
function nearPledges(team){
  var names={},counts={},out=[];[].concat(team.함,team.기체,team.파일럿,team.지휘관).forEach(function(c){names[c[0]]=true});
  team.기체.forEach(function(c){tagsOf(c).forEach(function(tag){counts[tag]=(counts[tag]||0)+1})});
  function nextTier(tiers,hit){var current=0,bk=0;Object.keys(tiers).forEach(function(k){if(+k<=hit&&+k>=bk){bk=+k;current=tiers[k]}});var next=tiers[hit+1];return next>current&&next>0?Math.round(next*PLEDGE_MUL)-Math.round(current*PLEDGE_MUL):0}
  COMBO.forEach(function(c){var missing=c.m.filter(function(n){return !names[n]}),hit=c.m.length-missing.length,gain=nextTier(c.t,hit);if(hit>0&&gain>0&&missing.length)out.push({name:c.n,rule:missing.join(' / ')+' 중 1명',gain:gain})});
  TCOMBO.forEach(function(c){var hit=counts[c.g]||0,gain=nextTier(c.t,hit);if(hit>0&&gain>0)out.push({name:c.n,rule:c.g+' 태그 기체 1기',gain:gain})});
  return out.sort(function(a,b){return b.gain-a.gain});
}
function openProgress(){
  if(!teams)return;var d=dialogBase('연대 · 작전 진행판'),team=teams[0],active=pledges(team),positive=active.filter(function(p){return p.v>0}),negative=active.filter(function(p){return p.v<0});
  var title=el('h3');title.textContent='공개 작전';d.appendChild(title);
  if(OBJECTIVE)infoLine(d,OBJECTIVE.name+' · '+Math.min(OBJECTIVE.target,objectiveCount(team,OBJECTIVE))+'/'+OBJECTIVE.target+' · '+objectiveScore(team)+'/'+OBJECTIVE.max+'점 · '+OBJECTIVE.rule);else infoLine(d,'공개 작전 목표 꺼짐');
  function section(label,list,format){var h=el('h3');h.textContent=label+' · '+list.length;d.appendChild(h);if(!list.length)infoLine(d,'해당 없음');list.forEach(function(x){infoLine(d,format(x))})}
  section('활성 연대·혈연',positive,function(p){return p.n+' · '+signedScore(Math.round(p.v*PLEDGE_MUL))+'점 · '+p.got.join(', ')});
  section('발생한 악연',negative,function(p){return p.n+' · '+signedScore(Math.round(p.v*PLEDGE_MUL))+'점 · '+p.got.join(', ')});
  if(hintOn)section('한 장 더 모으면 강화',nearPledges(team),function(p){return p.name+' · '+p.rule+' · 추가 '+signedScore(p.gain)+'점'});
  infoLine(d,'한 장 조건은 현재 편성 기준이며, 해당 카드가 다음 보급에 나온다는 뜻은 아닙니다.','insight-note');d.showModal();
}
function renderResultAnalysis(){
  var box=el('section','insight-box result-analysis'),title=el('h3'),controls=el('div','analysis-controls'),content=el('div');title.textContent='승패 분석 · 상대와 점수 비교';box.appendChild(title);
  var select=el('select');select.setAttribute('aria-label','분석할 상대');[1,2].forEach(function(i){var option=document.createElement('option');option.value=i;option.textContent=seatName(i);select.appendChild(option)});
  select.value=evaluate(teams[1]).total>=evaluate(teams[2]).total?'1':'2';controls.appendChild(select);box.appendChild(controls);box.appendChild(content);
  function draw(){content.innerHTML='';var a=scoreParts(teams[0]),b=scoreParts(teams[+select.value]),gap=a.total-b.total;
    infoLine(content,seatName(+select.value)+' 대비 '+(gap>0?gap+'점 우세':gap<0?(-gap)+'점 열세':'동점'));
    var diffs=SCORE_PARTS.filter(function(x){return x[0]!=='rounding'}).map(function(x){return {label:x[1],v:a.parts[x[0]]-b.parts[x[0]]}}).sort(function(x,y){return y.v-x.v});
    if(diffs[0].v>0)infoLine(content,'가장 앞선 항목: '+diffs[0].label+' '+signedScore(diffs[0].v)+'점');var last=diffs[diffs.length-1];if(last.v<0)infoLine(content,'가장 뒤진 항목: '+last.label+' '+signedScore(last.v)+'점');
    content.appendChild(scoreTable(a,b,false));infoLine(content,'궁합·지형은 기본 출격 대비 보정값, 정원 손실은 초과 조의 감점입니다. 항목별 정수 합계는 반올림 보정으로 최종 점수와 맞춥니다.','insight-note');
  }select.onchange=draw;draw();return box;
}
