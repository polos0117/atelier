"use strict";
/* Read the same casual/byStyle schema as dex.html. Never borrow another gender. */
function dailyShots(card,gender){
  var root=IMG[card[0]],out=[],seen={};if(!root)return out;
  var selected=artBucket(card[0]),buckets=[];
  function add(bucket,label){if(bucket&&buckets.every(function(x){return x.b!==bucket}))buckets.push({b:bucket,label:label})}
  var styles=root.byStyle||{},selectedLabel='기본 화풍';
  Object.keys(styles).forEach(function(k){if(styles[k]===selected)selectedLabel=k});
  add(selected,selectedLabel);add(root,'기본 화풍');Object.keys(styles).forEach(function(k){add(styles[k],k)});
  buckets.forEach(function(x){var box=x.b.casual,shots=Array.isArray(box)?(gender==='f'?box:[]):box&&box[gender]||[];
    shots.forEach(function(path){if(typeof path==='string'&&!seen[path]){seen[path]=true;out.push({path:path,style:x.label})}})});
  return out;
}
function createCardGallery(card,type,partner,preferDaily){
  var gender=variantOf(card,partner),shots=dailyShots(card,gender),daily=!!preferDaily&&shots.length>0,index=0;
  var root=el('div','card-gallery'),tabs=el('div','gallery-tabs'),basic=el('button'),casual=el('button'),art=el('div','pick-art'),nav=el('div','gallery-nav'),prev=el('button'),next=el('button'),caption=el('span','gallery-caption'),status=el('div','gallery-status');
  basic.textContent='기본';casual.textContent='일상컷 '+shots.length;casual.disabled=!shots.length;
  prev.textContent='이전';next.textContent='다음';prev.setAttribute('aria-label','이전 일상컷');next.setAttribute('aria-label','다음 일상컷');
  [basic,casual,prev,next].forEach(function(b){b.type='button'});
  tabs.appendChild(basic);tabs.appendChild(casual);nav.appendChild(prev);nav.appendChild(caption);nav.appendChild(next);
  status.setAttribute('role','status');root.appendChild(tabs);root.appendChild(art);root.appendChild(nav);root.appendChild(status);
  function draw(){
    art.innerHTML='';basic.setAttribute('aria-pressed',String(!daily));casual.setAttribute('aria-pressed',String(daily));nav.hidden=!daily;
    status.textContent=shots.length?'':(gender==='f'?'여성':'남성')+' 일상컷이 아직 없습니다.';
    if(daily){var photo=document.createElement('img');photo.alt=card[0]+' 일상컷 '+(index+1);photo.src=imgURL(shots[index].path);photo.decoding='async';
      photo.onerror=function(){if(!art.contains(photo))return;photo.remove();art.innerHTML=placeholder(card,gender);status.textContent='이미지를 불러오지 못했습니다. 다른 컷을 선택해 주세요.'};art.appendChild(photo);
      caption.textContent=(index+1)+' / '+shots.length+' · '+shots[index].style;prev.disabled=next.disabled=shots.length<2;
    }else{art.innerHTML=avHTML(card,type,partner);var img=art.querySelector('img');if(img){img.alt=card[0];img.loading='eager'}}
  }
  basic.onclick=function(){daily=false;draw()};casual.onclick=function(){if(shots.length){daily=true;draw()}};
  prev.onclick=function(){index=(index+shots.length-1)%shots.length;draw()};next.onclick=function(){index=(index+1)%shots.length;draw()};draw();return root;
}
function renderMVP(team){
  var pairs=assign(team).filter(function(u){return u.m&&u.p}),cap=capOf(team),best=null;
  pairs.forEach(function(u,i){var score=u.s*(i>=cap?.60:1);if(!best||score>best.score)best={u:u,score:score,over:i>=cap}});
  if(!best)return null;
  var root=el('section','mvp-card'),layout=el('div','mvp-layout'),info=el('div'),title=el('h3'),names=el('p'),score=el('p'),members=el('div','mvp-members'),host=el('div');
  title.textContent='아군 MVP · 최고의 출격 조';names.textContent=best.u.m[0]+' × '+best.u.p[0];
  score.textContent='출격 기여 '+Math.round(best.score)+'점'+(best.over?' · 정원 초과 감점 반영':'')+' · 연대·작전 보너스 제외';
  info.appendChild(title);info.appendChild(names);info.appendChild(score);info.appendChild(members);
  var options=[{c:best.u.m,t:'기체',p:best.u.p},{c:best.u.p,t:'파일럿',p:null}],buttons=[];
  function show(i){host.innerHTML='';host.appendChild(createCardGallery(options[i].c,options[i].t,options[i].p,true));buttons.forEach(function(b,j){b.setAttribute('aria-pressed',String(i===j))})}
  options.forEach(function(o,i){var b=el('button');b.type='button';b.textContent=o.t+' · '+o.c[0];b.onclick=function(){show(i)};members.appendChild(b);buttons.push(b)});
  layout.appendChild(info);layout.appendChild(host);root.appendChild(layout);
  show(dailyShots(options[0].c,variantOf(options[0].c,options[0].p)).length?0:dailyShots(options[1].c,variantOf(options[1].c)).length?1:0);return root;
}
