import { h, render } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect, useRef } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { AppearanceControls, WorkspaceHeading } from '../lib/workspace-ui.js?v=1';
import * as E from './draft-engine.js?v=00e318f6bf';
const html=htm.bind(h);
const KINDS=['함','기체','파일럿','지휘관'];
const POOLS={함:E.SHIP,기체:E.MECH,파일럿:E.PILOT,지휘관:E.CREW};
const signed=E.signedScore;
function preference(key,fallback){try{return localStorage.getItem(key)??fallback}catch{return fallback}}
function savePreference(key,value){try{localStorage.setItem(key,value)}catch{}}
function useEngine(){const [revision,change]=useState(0);useEffect(()=>{const off=E.subscribe(()=>change(v=>v+1));E.boot();return off},[]);return revision}
async function copy(text){
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
  const field=document.createElement('textarea');field.value=text;field.style.cssText='position:fixed;opacity:0';
  document.body.appendChild(field);field.select();
  try{if(!document.execCommand('copy'))throw Error('copy failed')}finally{field.remove()}
}
function Portrait({card,type,partner,gender,path,face=false,eager=false}){
  const v=gender||E.variantOf(card,partner),bucket=E.artBucket(card[0]);
  const src=path||(bucket&&(bucket[v]||bucket[E.flip(v)]));
  const [failed,setFailed]=useState(null);
  const color=E.fc(card[1][card[1].length-1]);
  if(!src||failed===src)return html`<div class="draft-placeholder" style=${{'--faction':color}} role="img" aria-label=${card[0]+' · 이미지 없음'}>
    <svg viewBox="0 0 90 110" aria-hidden="true"><path d="M45 12 72 28v38L45 87 18 66V28Z"/><path d="M8 93h74M45 5v94"/><circle cx="45" cy="49" r="21"/></svg>
    <b>${card[0].charAt(0)}</b><small>${E.serTag(card)} / ${v.toUpperCase()}</small></div>`;
  if(face){
    const used=bucket?.[v]?v:E.flip(v),f=E.faceOf(bucket,used,E.IMG[card[0]]),ar=E.ASPECT[type]||1.5;
    const fw=E.FACE_W,fh=Math.min(.999,fw/(ar*(34/44))),cx=f[0]+f[2]/2,cy=f[1]+Math.min(.999,f[2]/ar)/2;
    const fx=Math.min(Math.max(cx-fw/2,0),1-fw),fy=Math.min(Math.max(cy-fh*E.FACE_TOP,0),1-fh);
    return html`<span class="face-crop-frame"><img src=${E.imgURL(src)} alt=${card[0]} loading="lazy" decoding="async"
      style=${{width:100/fw+'%',left:-fx/fw*100+'%',top:-fy/fh*100+'%'}} onError=${()=>setFailed(src)}/></span>`;
  }
  return html`<img src=${E.imgURL(src)} alt=${card[0]} loading=${eager?'eager':'lazy'} decoding="async"
    class=${face?'face-crop':''} onError=${()=>setFailed(src)}/>`;
}
function Stats({card,type}){return html`<dl class="draft-stats">${(E.STAT_LABEL[type]||[]).map((label,i)=>html`<div key=${label}><dt>${label}</dt><dd>${card[i+2]}</dd></div>`)}</dl>`}
function ImageZoom({card,gender,path,onClose}){
  const ref=useRef(null);
  useEffect(()=>{const previous=document.activeElement;ref.current.showModal();return ()=>{ref.current?.close();if(previous?.isConnected)previous.focus()}},[]);
  return html`<dialog class="draft-image-zoom" ref=${ref} aria-label=${card[0]+' 이미지 확대'} onCancel=${e=>{e.preventDefault();onClose()}}>
    <button type="button" class="zoom-close" onClick=${onClose}>닫기</button>
    <div><${Portrait} card=${card} gender=${gender} path=${path} eager=${true}/></div>
  </dialog>`;
}
function Gallery({card,type,partner,preferDaily=false,initialGender}){
  const [gender,setGender]=useState(()=>initialGender||E.variantOf(card,partner));
  const daily=E.dailyShots(card,gender),bucket=E.artBucket(card[0]);
  const extra=E.cutsOf(bucket,'extra',gender).map(path=>({path,style:'특별컷'}));
  const [mode,setMode]=useState(preferDaily&&daily.length?'daily':'base'),[index,setIndex]=useState(0),[zoom,setZoom]=useState(false);
  const list=mode==='daily'?daily:mode==='extra'?extra:[];
  const current=list.length?list[index%list.length]:null;
  return html`<section class="draft-gallery" aria-label=${card[0]+' 이미지'}>
    <div class="segmented gallery-tabs">${[['base','기본',true],['daily','일상 '+daily.length,!!daily.length],['extra','특별 '+extra.length,!!extra.length]].map(([key,label,enabled])=>html`
      <button type="button" key=${key} disabled=${!enabled} aria-pressed=${mode===key} onClick=${()=>{setMode(key);setIndex(0)}}>${label}</button>`)}</div>
    <button type="button" class=${'gallery-image '+(type==='함'?'ship-image':'')} aria-label="이미지 크게 보기" onClick=${()=>setZoom(true)}><${Portrait} card=${card} partner=${partner} gender=${gender} path=${current?.path} eager=${true}/></button>
    <div class="gallery-footer">
      <div class="segmented">${[['f','여'],['m','남']].map(([v,label])=>html`<button key=${v} type="button" aria-label=${label+'성 이미지'} aria-pressed=${gender===v} onClick=${()=>{setGender(v);setMode('base');setIndex(0)}}>${label}</button>`)}</div>
      ${mode!=='base'&&html`<div class="gallery-paging"><button type="button" aria-label="이전 이미지" disabled=${list.length<2} onClick=${()=>setIndex(i=>(i+list.length-1)%list.length)}>‹</button><span>${list.length?index%list.length+1:0} / ${list.length}</span><button type="button" aria-label="다음 이미지" disabled=${list.length<2} onClick=${()=>setIndex(i=>(i+1)%list.length)}>›</button></div>`}
    </div>
    ${current&&html`<small class="muted">${E.ART_NAME[current.style]||current.style}</small>`}
    ${!daily.length&&html`<small class="muted">${gender==='f'?'여성':'남성'} 일상컷이 아직 없습니다.</small>`}
    ${zoom&&html`<${ImageZoom} card=${card} gender=${gender} path=${current?.path} onClose=${()=>setZoom(false)}/>`}
  </section>`;
}
function OptionRow({title,description,name,value,options}){return html`<div class="draft-option"><div><b>${title}</b><p>${description}</p></div><div class="segmented" role="group" aria-label=${title}>${options.map(([v,label])=>html`<button key=${String(v)} type="button" aria-pressed=${value===v} onClick=${()=>E.configure(name,v)}>${label}</button>`)}</div></div>`}
function Setup({open}){
  const toggle=(title,description,name,value)=>html`<${OptionRow} title=${title} description=${description} name=${name} value=${value} options=${[[true,'켬'],[false,'끔']]}/>`;
  return html`<section class="draft-setup" id="packArea">
    <div class="setup-intro"><div><span class="eyebrow">OPERATION SETUP</span><h2>당신의 함대를 편성하세요.</h2><p>모함을 고르고, 기체와 파일럿의 조합을 완성하세요.</p></div><span class="setup-rounds"><b>${E.SCHEDULE.length}</b> ROUNDS</span></div>
    ${E.SET_NAME!=='gundam'&&html`<p class="draft-note">주제 ${E.SET_NAME} · 전적은 주제별로 따로 저장됩니다.</p>`}
    ${E.REC_MOVED>=0&&html`<p class="draft-note">이전 전적 ${E.REC_MOVED}판을 건담 기록으로 옮겼습니다. 기존 기록도 보존되어 있습니다.</p>`}
    ${E.DATA_WARN.length>0&&html`<details class="draft-note"><summary>자료 안내 ${E.DATA_WARN.length}건</summary><ul>${E.DATA_WARN.map(w=>html`<li>${w}</li>`)}</ul></details>`}
    <div class="setup-grid">
      <section class="draft-panel"><h3><span>01</span> 작전 계획</h3>
        <${OptionRow} title="적 함대" description="에이스는 점수뿐 아니라 인연까지 노립니다." name="lv" value=${E.AI_LV} options=${E.AI_NAME.map((n,i)=>[i,n])}/>
        ${E.SCALE_OPTS.length>1&&html`<${OptionRow} title="편성 규모" description=${'한 편의 기체·파일럿 조 수 · '+E.SCHEDULE.length+'라운드'} name="sc" value=${E.SCALE} options=${E.SCALE_OPTS.map(n=>[n,n+'조'])}/>`}
        <${OptionRow} title="드래프트 순서" description="교차 방식은 기체와 파일럿을 번갈아 확보합니다." name="flow" value=${E.DRAFT_FLOW} options=${[['cross','교차'],['classic','종류별']]}/>
        ${toggle('공개 작전 목표','세 팀 공통 목표 · 최대 '+E.futurePairs()*6+'점','objective',E.objectiveOn)}
      </section>
      <section class="draft-panel"><h3><span>02</span> 보급 & 정보</h3>
        <${OptionRow} title="보급 방식" description="한 팩을 셋이 나누거나, 각자 받습니다." name="shared" value=${E.sharedPack} options=${[[true,'공유'],[false,'개별']]}/>
        <${OptionRow} title="보급 요청" description="적 함대도 같은 횟수를 사용할 수 있습니다." name="rr" value=${E.REROLL_MAX} options=${E.RR_OPT.map(n=>[n,n?n+'회':'없음'])}/>
        ${toggle('증감 힌트','지명 전 점수 변화와 인연을 표시합니다.','hint',E.hintOn)}
        ${toggle('관제 두절','최종 판정까지 적 편성을 숨깁니다.','fog',E.fogOn)}
        ${toggle('보급 제한','한 번 나온 카드의 재등장을 제한합니다.','ex',E.exhaustOn)}
      </section>
      <section class="draft-panel portrait-options"><h3><span>03</span> 초상 설정</h3>
        <${OptionRow} title="파일럿 초상" description="이번 판에 표시할 이미지 성별" name="vp" value=${E.VIEW_P} options=${[['m','남'],['f','여'],['r','무작위']]}/>
        <${OptionRow} title="기체 초상" description="반대: 짝을 이룬 파일럿과 반대 성별" name="vm" value=${E.VIEW_M} options=${[['m','남'],['f','여'],['r','무작위'],['x','반대']]}/>
      </section>
    </div>
    <div class="setup-bottom"><div><b>${E.REC.games}판</b><span> · 수위 ${E.REC.first} · 최고 ${E.REC.best}점</span><button type="button" class="text-button" onClick=${()=>open({kind:'records'})}>전적·훈장 보기 ↗</button></div><button class="primary launch" type="button" onClick=${E.start}>출격 <span>→</span></button></div>
  </section>`;
}
function Candidate({slot,type,open}){
  const card=slot.c,mine=E.isMine()&&slot.by===null;
  const gain=E.hintOn&&mine?E.delta(card,type):null;
  const reason=slot.by!==null?'지명 완료':mine?E.choiceReason(card,type,gain):'상대 지명 중';
  return html`<button type="button" class=${'draft-card'+(slot.by!==null?' taken':'')} disabled=${!mine}
    aria-label=${card[0]+' · '+reason} style=${{'--faction':E.fc(card[1][card[1].length-1])}}
    onClick=${()=>open({kind:'candidate',card,type,token:E.turnToken()})}>
    <div class="candidate-image"><${Portrait} card=${card}/><span class="candidate-kind">${type}</span><span class="candidate-series">${E.serTag(card)}</span>
      ${slot.by!==null&&html`<span class="taken-label">${slot.by===0?'아군':'적 '+slot.by} 지명</span>`}</div>
    <div class="candidate-info"><small>${card[1][card[1].length-1]||'소속 없음'}</small><b class="candidate-name">${card[0]}</b>
      <${Stats} card=${card} type=${type}/><div class=${'candidate-gain'+(gain?.v<0?' negative':'')}><span>${gain?'선택 시':'상태'}</span><strong>${gain?signed(gain.v):slot.by!==null?'지명됨':mine?'상세 확인':'대기'}</strong></div><p>${reason}</p>
    </div></button>`;
}
function MiniMember({card,type,partner,open}){return card?html`<button type="button" class="mini-member" onClick=${()=>open({kind:'card',card,type,partner})}><span class="member-image"><${Portrait} card=${card} type=${type} partner=${partner} face=${true}/></span><span><b>${card[0]}</b><small>${type==='기체'?card[7]:type==='파일럿'?card[6]:E.serLabel(card)}</small></span></button>`:html`<span class="member-empty">${type} 대기</span>`}
function Team({index=0,open,compact=false}){
  const team=E.teams[index],ev=E.evaluate(team),units=E.assign(team),cap=E.capOf(team),bonds=E.pledges(team);
  if(E.fogOn&&index!==0&&E.phase!=='done')return html`<section class="draft-panel"><h3>적 ${index}</h3><p class="draft-note">관제 두절 · 판정 후 공개됩니다.</p></section>`;
  let paired=0;
  return html`<section class="draft-panel team-panel"><h3><span>${index===0?'ALLY':'ENEMY '+index}</span>${E.seatName(index)}<b class="team-score">${ev.total}</b></h3>
    <div class="team-capacity">정원 ${cap} · 기체 ${team.기체.length}/${E.SCALE} · 파일럿 ${team.파일럿.length}/${E.SCALE}</div>
    ${team.함.map(card=>html`<${MiniMember} key=${card[0]} card=${card} type="함" open=${open}/>`)}
    ${!team.함.length&&html`<p class="muted">모함 미정</p>`}
    <div class="team-units">${units.map((u,i)=>{const over=u.m&&u.p&&paired++>=cap;return html`<div key=${(u.m?.[0]||'')+'|'+(u.p?.[0]||'')} class=${'team-pair'+(over?' over':'')}>
      <span class="pair-number">${String(i+1).padStart(2,'0')}</span><div><${MiniMember} card=${u.m} type="기체" partner=${u.p} open=${open}/><${MiniMember} card=${u.p} type="파일럿" open=${open}/></div>
      <span class="pair-score">${u.m&&u.p?E.sync(u.m,u.p).toFixed(2):'—'}<small>${over?'정원 초과 · 60%':'SYNC'}</small></span></div>`})}</div>
    <div class="commander-list">${team.지휘관.map(card=>html`<${MiniMember} key=${card[0]} card=${card} type="지휘관" open=${open}/>` )}</div>
    ${bonds.length>0&&html`<div class="bond-chips">${bonds.map(p=>html`<span key=${p.n} class=${p.v<0?'negative':''} title=${p.got.join(' · ')}>${p.n} <b>${signed(Math.round(p.v*E.PLEDGE_MUL))}</b></span>`)}</div>`}
    ${!compact&&html`<details class="score-details"><summary>점수 상세</summary><dl>${ev.rows.map(([name,v])=>html`<div key=${name}><dt>${name}</dt><dd class=${v<0?'negative':''}>${signed(v)}</dd></div>`)}</dl></details>`}
  </section>`;
}
function ScoreTable({a,b,deltaOnly=false}){return html`<table class="draft-score-table"><thead><tr><th>항목</th>${!deltaOnly&&html`<th>아군</th><th>상대</th>`}<th>${deltaOnly?'변화':'차이'}</th></tr></thead><tbody>
  ${E.SCORE_PARTS.concat([['total','합계']]).map(([key,label])=>{const av=key==='total'?a.total:a.parts[key],bv=key==='total'?b.total:b.parts[key],d=av-bv;if(key!=='total'&&(deltaOnly?d===0:av===0&&bv===0))return null;return html`<tr key=${key}><th scope="row">${label}</th>${!deltaOnly&&html`<td>${av}</td><td>${bv}</td>`}<td class=${d<0?'negative':'positive'}>${signed(d)}</td></tr>`})}
  </tbody></table>`}
function CandidateDetail({item}){
  const preview=E.hintOn?E.pickPreview(E.teams[0],item.card,item.type):null;
  return html`<div class="candidate-detail"><${Gallery} card=${item.card} type=${item.type}/><div>
    <p class="muted">${item.card[1].join(' → ')}</p><${Stats} card=${item.card} type=${item.type}/>
    <p class="draft-lore">${E.loreOf(item.card)||'카드 능력과 편성 효과를 확인하세요.'}</p>
    ${item.type==='함'&&html`<p class="draft-note">정원 ${item.card[5]+E.CAP_BONUS} / 출격 예정 ${E.futurePairs()}조</p>`}
    ${item.type==='기체'&&html`<p class="draft-note">${E.FIELD} ${E.terrainWord(item.card)} · ${E.tagsOf(item.card).join(' · ')||'태그 없음'}</p>`}
    ${preview&&html`<details class="preview-details" open><summary>지명 후 변화 · ${signed(preview.after.total-preview.before.total)}점</summary>
      ${preview.changes.length?preview.changes.map(c=>html`<p>${c.name} : ${c.before} → ${c.after}</p>`):html`<p>기체·파일럿 짝 변화 없음</p>`}
      <${ScoreTable} a=${preview.after} b=${preview.before} deltaOnly=${true}/><small class="muted">현재 보유 카드 기준 자동 편성 예상입니다.</small></details>`}
    ${E.OBJECTIVE&&html`<p class="draft-note">공개 작전 · ${E.OBJECTIVE.name}<br/>${E.OBJECTIVE.rule}</p>`}
  </div></div>`;
}
function Progress(){
  const team=E.teams[0],active=E.pledges(team),near=E.hintOn?E.nearPledges(team):[];
  return html`<section><h3>공개 작전</h3>${E.OBJECTIVE?html`<p class="draft-note">${E.OBJECTIVE.name} · ${Math.min(E.OBJECTIVE.target,E.objectiveCount(team,E.OBJECTIVE))}/${E.OBJECTIVE.target} · ${E.objectiveScore(team)}/${E.OBJECTIVE.max}점<br/>${E.OBJECTIVE.rule}</p>`:html`<p class="muted">공개 작전 목표 꺼짐</p>`}
    ${[['활성 연대·혈연',active.filter(p=>p.v>0)],['발생한 악연',active.filter(p=>p.v<0)]].map(([label,list])=>html`<h3>${label} · ${list.length}</h3>${list.length?list.map(p=>html`<p class=${p.v<0?'negative':''}>${p.n} · ${signed(Math.round(p.v*E.PLEDGE_MUL))}점<br/><small class="muted">${p.got.join(', ')}</small></p>`):html`<p class="muted">해당 없음</p>`}`)}
    ${E.hintOn&&html`<h3>한 장 더 모으면 강화</h3>${near.length?near.map(p=>html`<p>${p.name} · ${signed(p.gain)}점<br/><small class="muted">${p.rule}</small></p>`):html`<p class="muted">해당 없음</p>`}`}
    <p class="muted">현재 편성 기준의 조건이며, 해당 카드의 다음 보급 등장을 보장하지 않습니다.</p></section>`;
}
function Records(){
  const [armed,setArmed]=useState(false),r=E.REC,st=E.stampRows();
  const seenBySeries={};Object.values(POOLS).flat().forEach(c=>{if(r.seen[c[0]])E.serAll(c).forEach(s=>seenBySeries[s]=(seenBySeries[s]||0)+1)});
  return html`<section class="record-view"><div class="record-summary">${[['출격',r.games],['수위',r.first],['수위율',(r.games?Math.round(r.first/r.games*100):0)+'%'],['최고 점수',r.best]].map(([label,n])=>html`<div><small>${label}</small><b>${n}</b></div>`)}</div>
    <h3>순위 분포</h3><p>수위 ${r.first} · 2위 ${r.second} · 3위 ${r.third}</p>
    <h3>난이도별 수위</h3><p>${E.AI_NAME.map((n,i)=>n+' '+(r.lv[i]||0)+'회').join(' · ')}</p>
    <h3>훈장 ${Object.keys(r.feats).length} / ${E.FEATS.length}</h3><div class="medal-grid">${E.FEATS.map(f=>html`<div key=${f.id} class=${r.feats[f.id]?'earned':''}><b>${r.feats[f.id]?f.n:'미획득'}</b><span>${f.d}</span></div>`)}</div>
    <h3>교신 기록 · ${st.got.length} / ${st.got.length+st.yet.length}</h3><div class="bond-chips">${st.got.map(c=>html`<span title=${c.m.join(' · ')}>${c.n}</span>`)}</div>
    <details><summary>아직 못 맺은 인연 ${st.yet.length}</summary><div class="bond-chips">${st.yet.map(c=>html`<span>？ ${c.m.length}인</span>`)}</div></details>
    <h3>자주 기용한 카드</h3><div class="bond-chips">${Object.entries(r.picks||{}).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([name,n])=>html`<span>${name} <b>${n}</b></span>`)}</div>
    <h3>시리즈별 기용</h3><div class="bond-chips">${Object.entries(seenBySeries).sort((a,b)=>b[1]-a[1]).map(([key,n])=>html`<span>${E.SER_NAME[key]||key} <b>${n}</b></span>`)}</div>
    <button type="button" class="danger-button" onClick=${()=>{if(armed){E.eraseRecords();setArmed(false)}else setArmed(true)}}>${armed?'정말 지울까요? 한 번 더 누르세요':'기록 지우기'}</button>
  </section>`;
}
function Collection({open,item}){
  const [kind,setKind]=useState(item.filter?.kind||'기체'),[query,setQuery]=useState(item.filter?.query||''),[series,setSeries]=useState(item.filter?.series||''),[gender,setGender]=useState(item.filter?.gender||'f');
  useEffect(()=>{item.filter={kind,query,series,gender}},[kind,query,series,gender]);
  const pool=POOLS[kind],seriesKeys=[...new Set(pool.flatMap(E.serAll))];
  const cards=pool.filter(c=>(!series||E.serAll(c).includes(series))&&c[0].toLowerCase().includes(query.trim().toLowerCase()));
  return html`<section><div class="segmented collection-kinds">${KINDS.map(k=>html`<button type="button" aria-pressed=${kind===k} onClick=${()=>{setKind(k);setSeries('')}}>${k}</button>`)}</div>
    <div class="collection-filters"><input aria-label="카드 검색" placeholder="이름으로 찾기" value=${query} onInput=${e=>setQuery(e.target.value)}/><select aria-label="시리즈 필터" value=${series} onChange=${e=>setSeries(e.target.value)}><option value="">시리즈 전체</option>${seriesKeys.map(s=>html`<option value=${s}>${E.SER_NAME[s]||s}</option>`)}</select><select aria-label="도감 이미지 성별" value=${gender} onChange=${e=>setGender(e.target.value)}><option value="f">여성</option><option value="m">남성</option></select></div>
    <p class="muted">${cards.length}개</p><div class="draft-collection">${cards.map(card=>html`<button key=${card[0]} type="button" onClick=${()=>open({kind:'card',card,type:kind,list:cards,gender})}><span><${Portrait} card=${card} gender=${gender}/></span><b>${card[0]}</b></button>`)}</div>
  </section>`;
}
function CardDetail({item,open,replace}){
  const bonds=E.bondsOf(item.card,item.type);
  return html`${item.list?.length>1&&html`<div class="detail-neighbors"><button type="button" onClick=${()=>replace({...item,card:item.list[(item.list.indexOf(item.card)+item.list.length-1)%item.list.length]})}>← 이전 카드</button><button type="button" onClick=${()=>replace({...item,card:item.list[(item.list.indexOf(item.card)+1)%item.list.length]})}>다음 카드 →</button></div>`}<div class="candidate-detail"><${Gallery} card=${item.card} type=${item.type} partner=${item.partner} initialGender=${item.gender}/><div><${Stats} card=${item.card} type=${item.type}/><p>${item.card[1].join(' → ')}</p><p class="draft-lore">${E.loreOf(item.card)}</p>
    ${item.type==='기체'&&html`<p class="muted">${E.tagsOf(item.card).join(' · ')}</p>`}
    ${bonds.length>0&&html`<h3>전용기 연대</h3><div class="bond-chips">${bonds.map(x=>html`<span>${typeof x==='string'?x:x.n||x[0]}</span>`)}</div>`}
    <p class="muted">${E.serAll(item.card).map(s=>E.SER_NAME[s]||s).join(' · ')}</p></div></div>`;
}
function Modal({item,onClose,open,replace}){
  const ref=useRef(null);
  useEffect(()=>{const previous=document.activeElement;const dialog=ref.current;dialog.showModal();return ()=>{dialog.close();if(previous?.isConnected)previous.focus()}},[]);
  const title=item.card?.[0]||({collection:'도감',records:'전적 · 훈장',progress:'연대 · 작전 진행판',team:E.teams?E.seatName(item.index||0):'편성'})[item.kind];
  return html`<dialog class="draft-dialog" ref=${ref} aria-label=${title} onCancel=${e=>{e.preventDefault();onClose()}} onClick=${e=>{if(e.target===e.currentTarget)onClose()}}>
    <div class="dialog-shell"><header class="dialog-head"><strong>${title}</strong><button type="button" onClick=${onClose}>닫기</button></header><div class="dialog-content">
      ${item.kind==='candidate'&&html`<${CandidateDetail} key=${item.card[0]} item=${item}/>`}
      ${item.kind==='card'&&html`<${CardDetail} key=${item.card[0]} item=${item} open=${open} replace=${replace}/>`}
      ${item.kind==='team'&&html`<${Team} index=${item.index} open=${open}/>`}
      ${item.kind==='progress'&&html`<${Progress}/>`}
      ${item.kind==='records'&&html`<${Records}/>`}
      ${item.kind==='collection'&&html`<${Collection} open=${open} item=${item}/>`}
    </div>${item.kind==='candidate'&&html`<footer class="dialog-actions"><button type="button" class="primary" disabled=${!E.isMine()||item.token!==E.turnToken()} onClick=${()=>{E.selectCard(item.card,item.token);onClose()}}>이 카드 지명</button></footer>`}</div></dialog>`;
}
function MVP({open}){
  const pairs=E.assign(E.teams[0]).filter(u=>u.m&&u.p),cap=E.capOf(E.teams[0]);
  const best=pairs.map((u,i)=>({u,score:u.s*(i>=cap?.6:1),over:i>=cap})).sort((a,b)=>b.score-a.score)[0];
  const [member,setMember]=useState(()=>best&&E.dailyShots(best.u.m,E.variantOf(best.u.m,best.u.p)).length?0:best&&E.dailyShots(best.u.p,E.variantOf(best.u.p)).length?1:0);
  if(!best)return null;const card=member?best.u.p:best.u.m,type=member?'파일럿':'기체';
  return html`<section class="draft-panel mvp-panel"><h3><span>MVP</span> 최고의 출격 조</h3><div class="mvp-layout"><div><h2>${best.u.m[0]}<small> × </small>${best.u.p[0]}</h2><p>출격 기여 <b>${Math.round(best.score)}점</b>${best.over?' · 정원 초과 감점 반영':''}</p><p class="muted">연대·작전 보너스 제외</p><div class="segmented">${['기체','파일럿'].map((n,i)=>html`<button aria-pressed=${member===i} onClick=${()=>setMember(i)}>${n}</button>`)}</div></div><${Gallery} key=${card[0]} card=${card} type=${type} partner=${member?null:best.u.p} preferDaily=${true}/></div></section>`;
}
function Results({open}){
  const [opponent,setOpponent]=useState(()=>E.evaluate(E.teams[1]).total>=E.evaluate(E.teams[2]).total?1:2),[copyStatus,setCopyStatus]=useState('같은 판 주소 복사');
  const ranking=[0,1,2].map(i=>({i,total:E.evaluate(E.teams[i]).total})).sort((a,b)=>b.total-a.total);
  const a=E.scoreParts(E.teams[0]),b=E.scoreParts(E.teams[opponent]);
  return html`<section class="results" id="endArea"><div class="rankings">${ranking.map((r,i)=>html`<button type="button" class=${'ranking'+(r.i===0?' ally':'')} onClick=${()=>open({kind:'team',index:r.i})}><span>${i+1}위</span><b>${E.seatName(r.i)}</b><strong>${r.total}</strong></button>`)}</div>
    <${MVP} open=${open}/><section class="draft-panel"><h3>승패 분석 · 상대와 점수 비교</h3><select aria-label="분석할 상대" value=${opponent} onChange=${e=>setOpponent(+e.target.value)}>${[1,2].map(i=>html`<option value=${i}>${E.seatName(i)}</option>`)}</select><p>${E.seatName(opponent)} 대비 ${signed(a.total-b.total)}점</p><${ScoreTable} a=${a} b=${b}/><p class="muted">궁합·지형은 기본 출격 대비 보정값입니다. 정원 초과 감점과 반올림 보정을 포함해 최종 점수와 일치합니다.</p></section>
    <${Team} open=${open}/>
    ${E.newFeats.length>0&&html`<section class="draft-panel"><h3>새 훈장</h3><div class="medal-grid">${E.FEATS.filter(f=>E.newFeats.includes(f.id)).map(f=>html`<div class="earned"><b>${f.n}</b><span>${f.d}</span></div>`)}</div></section>`}
    <section class="draft-panel"><h3>이 판의 씨앗 · ${E.GAME_SEED}</h3><p class="muted">${E.FIELD} · ${E.AI_NAME[E.AI_LV]} · ${E.sharedPack?'공유팩':'개별팩'} · 보급 ${E.REROLL_MAX}</p><button type="button" onClick=${()=>copy(E.replayURL()).then(()=>setCopyStatus('복사했습니다'),()=>setCopyStatus('복사에 실패했습니다'))}>${copyStatus}</button></section>
    <div class="result-actions"><button type="button" class="primary" onClick=${E.start}>다시 출격</button><button type="button" onClick=${E.setup}>설정 변경</button><button type="button" onClick=${()=>open({kind:'records'})}>전적 · 훈장</button></div>
    <details class="draft-panel"><summary>이 판의 규칙</summary><p>조 점수 = 기체력 × 파일럿력 × 싱크. 기질·감응·시리즈·소속·전용기 연대를 반영한 싱크는 0.70~1.45입니다. 정원을 넘긴 조는 60%로 계산합니다.</p><p>소속 결속은 현 소속 1.0, 과거 소속 0.5입니다. 보급 요청은 양편에 같은 횟수가 주어지며 마지막 배치에서는 사용할 수 없습니다.</p></details>
  </section>`;
}
function Board({open}){return html`<section id="boardArea"><div class="enemy-teams">${[1,2].map(index=>html`<${Team} index=${index} open=${open}/>` )}</div><section class="draft-panel"><h3>교신 로그</h3>${E.fogOn&&E.phase!=='done'?html`<p class="draft-note">관제 두절 · 상대의 지명은 숨겨집니다.</p>`:html`<ol class="draft-feed">${E.log.map((l,i)=>html`<li key=${i}><span>R${l.r}</span><b>${E.seatName(l.ti)}</b><span>${l.rr?'보급 요청':l.c?.[0]}</span></li>`)}</ol>`}</section></section>`}
function App(){
  const revision=useEngine(),[pane,setPane]=useState('cards'),[stack,setStack]=useState([]);
  const [large,setLarge]=useState(()=>preference('atelier_play_large_v1','1')!=='0'),[tactical,setTactical]=useState(()=>preference('atelier_tactical_v1','1')!=='0');
  const scroll=useRef(null),previousPhase=useRef('loading');
  const open=item=>setStack([item]),push=item=>setStack(s=>s.concat(item)),close=()=>setStack(s=>s.slice(0,-1));
  useEffect(()=>{document.body.classList.toggle('draft-running',E.phase==='running');if(previousPhase.current!==E.phase){setPane('cards');setStack([]);if(scroll.current)scroll.current.scrollTop=0;previousPhase.current=E.phase}},[revision]);
  useEffect(()=>{window.AtelierFresh?.watch()},[]);
  function switchPane(value){setPane(value);if(scroll.current)scroll.current.scrollTop=0}
  const running=E.phase==='running',done=E.phase==='done';
  return html`<div class=${'draft-shell'+(large?' large-cards':'')+(tactical?' tactical-view':'')}>
    <div class="draft-chrome"><nav class="workspace-nav" aria-label="Atelier 화면 이동"><a href="prompt.html">프롬프트</a><a href="play.html" aria-current="page">드래프트</a><a href="dex.html">도감</a></nav><${AppearanceControls}/>
      <${WorkspaceHeading} title="기동전사 드래프트" code="FLEET COMMAND" subtitle="세 함대의 선택, 하나의 승리."/>
    </div>
    ${(running||done)&&html`<div class="draft-command"><div class="round-line"><div><small id="rdl">ROUND ${String(Math.min(E.round+1,E.SCHEDULE.length)).padStart(2,'0')} / ${E.SCHEDULE.length} <b>${E.FIELD}</b></small><h2 id="rdt">${done?'전과 판정':E.SCHEDULE[E.round]+' 선정'}</h2></div><span id="turn" class=${'turn-state'+(E.isMine()?' my-turn':'')} role="status">${done?'종료':E.isMine()?'내 차례':E.seatName(E.turnSeq()[E.si])+' 지명 중'}</span></div>
      <div class="round-gauge" aria-label=${'진행 '+E.round+'/'+E.SCHEDULE.length}>${E.SCHEDULE.map((s,i)=>html`<i key=${i} class=${i<E.round?'complete':i===E.round?'current':''} title=${(i+1)+' · '+s}></i>`)}</div>
    </div>`}
    <main class="draft-content" aria-label="드래프트 게임" tabindex="0" ref=${scroll}>
      ${E.phase==='loading'&&html`<p class="draft-note" role="status">함대 자료를 불러오는 중입니다…</p>`}
      ${E.phase==='error'&&html`<section class="draft-panel" role="alert"><h2>자료를 불러오지 못했습니다.</h2><p>${E.error}</p><button type="button" onClick=${()=>location.reload()}>다시 열기</button></section>`}
      ${E.phase==='setup'&&html`<${Setup} open=${open}/>`}
      ${running&&html`
        ${E.OBJECTIVE&&html`<button type="button" class="mission-strip" onClick=${()=>open({kind:'progress'})}><span><small>공개 작전</small><b>${E.OBJECTIVE.name}</b></span><span>${Math.min(E.OBJECTIVE.target,E.objectiveCount(E.teams[0],E.OBJECTIVE))} / ${E.OBJECTIVE.target}<small>+${E.objectiveScore(E.teams[0])}점</small></span></button>`}
        ${pane==='cards'&&html`<section id="packArea"><div class="draft-toolbar"><span>다음 · ${E.SCHEDULE[E.round+1]||'최종 판정'}</span><button id="viewMode" type="button" aria-pressed=${tactical} onClick=${()=>setTactical(v=>{savePreference('atelier_tactical_v1',v?'0':'1');return !v})}>${tactical?'일반 보기':'상황판'}</button><button id="playCardSize" type="button" aria-pressed=${large} onClick=${()=>setLarge(v=>{savePreference('atelier_play_large_v1',v?'0':'1');return !v})}>${large?'카드 기본':'카드 크게'}</button></div>
          <div class="draft-battle-layout"><div><div class="candidate-grid">${E.candidates().map(slot=>html`<${Candidate} key=${slot.c[0]} slot=${slot} type=${E.SCHEDULE[E.round]} open=${open}/>` )}</div>
            ${!E.candidates().length&&html`<p class="draft-note" role="status">상대 지명 중 · 곧 내 보급이 도착합니다.</p>`}
            <button class="resupply" type="button" disabled=${!E.isMine()||E.rerolls<1||E.round===E.SCHEDULE.length-1} onClick=${E.resupply}>${E.round===E.SCHEDULE.length-1?'마지막 배치 · 보급 불가':'보급 요청 · '+E.rerolls+' / '+E.REROLL_MAX}</button></div>
            <aside class="battle-side"><${Team} open=${open} compact=${true}/><button type="button" onClick=${()=>open({kind:'progress'})}>연대 · 작전 진행판</button></aside></div>
          <div class="roster-glance"><button type="button" onClick=${()=>switchPane('team')}>내 편성 · 기체 ${E.teams[0].기체.length} / 파일럿 ${E.teams[0].파일럿.length} <span>보기 →</span></button><button type="button" onClick=${()=>open({kind:'progress'})}>연대 · 목표</button></div>
        </section>`}
        ${pane==='team'&&html`<section id="dockArea"><${Team} open=${open}/><button class="wide-button" type="button" onClick=${()=>open({kind:'progress'})}>연대 · 작전 진행판</button></section>`}
        ${pane==='board'&&html`<${Board} open=${open}/>`}
      `}
      ${done&&html`<${Results} open=${open}/>`}
      <footer class="draft-foot"><button type="button" onClick=${()=>open({kind:'collection'})} disabled=${E.phase==='loading'||E.phase==='error'}>도감 열기</button><button type="button" onClick=${()=>open({kind:'records'})}>전적 · 훈장</button></footer>
    </main>
    ${running&&html`<nav class="draft-bottom-nav" aria-label="게임 화면 바로가기">${[['cards','카드'],['team','내 편성'],['board','전황']].map(([value,label])=>html`<button type="button" aria-pressed=${pane===value} onClick=${()=>switchPane(value)}>${label}</button>`)}</nav>`}
    ${stack.length>0&&html`<${Modal} item=${stack[stack.length-1]} onClose=${close} open=${push} replace=${item=>setStack(s=>s.slice(0,-1).concat(item))}/>`}
    ${(E.feedback||E.notices.length>0)&&html`<div class="draft-feedback" role="status">${E.feedback&&html`<b>지명 완료 · ${E.feedback}</b>`}${E.notices.map(n=>html`<span class=${n.v<0?'negative':''}>${n.n} ${signed(Math.round(n.v*E.PLEDGE_MUL))}</span>`)}</div>`}
  </div>`;
}
render(html`<${App}/>`,document.getElementById('app'));
