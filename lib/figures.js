/* 체형·머리 도식 — 고른 값이 어떤 실루엣인지 선으로 보여 준다.
   사진을 끌어올 수도, 250장 넘는 삽화를 그려 둘 수도 없어서 이렇게 한다.
   윤곽으로 갈리는 것(체형·머리)에만 쓸모가 있고, 인상·색 같은 것은
   실제로 그 값으로 뽑은 기체의 초상을 보여 주는 편이 정확하다.

   prompt.html 에 있던 것을 그대로 옮기고 성별만 인자로 받게 고쳤다.
   자료(BODY_FIG·HAIR_FIG)는 lib/toolkit-spec.js 에 있다. */
(function (root) {
  'use strict';
  var S = root.AtelierSpec;

  function bodySVG(k, gender){
    const f=S.BODY_FIG[k];if(!f)return'';
    let sh=f[0],bu=f[1],wa=f[2],hi=f[3];const ht=f[4],th=f[5];
    if(gender==='male'){
      sh=sh*1.14+2;               // 어깨를 넓힌다
      bu=Math.min(bu,sh*.88);     // 가슴 굴곡을 누른다
      wa=wa+(sh-wa)*.30;          // 허리를 덜 잘록하게
      hi=Math.min(hi*.86,sh*.92); // 골반을 좁힌다
    }
    const cx=45,top=14,H=150*ht,sy=top+22*ht;
    const yB=sy+20*ht,yW=sy+40*ht,yH=sy+58*ht,yE=top+H-10;
    const P=(x,y)=>x.toFixed(1)+','+y.toFixed(1);
    const R=[P(cx+sh,sy),P(cx+bu,yB),P(cx+wa,yW),P(cx+hi,yH),P(cx+hi*.72*th,yE)];
    const L=[P(cx-hi*.72*th,yE),P(cx-hi,yH),P(cx-wa,yW),P(cx-bu,yB),P(cx-sh,sy)];
    return '<svg width="82" height="173" viewBox="0 0 90 190" aria-hidden="true">'+
      '<circle cx="'+cx+'" cy="'+top+'" r="10.5" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".85"/>'+
      '<path d="M'+R.join(' L')+' L'+L.join(' L')+' Z" fill="currentColor" fill-opacity=".13" '+
      'stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" opacity=".85"/>'+
      '<line x1="'+(cx-wa-4)+'" y1="'+yW+'" x2="'+(cx+wa+4)+'" y2="'+yW+
      '" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3" opacity=".45"/></svg>';
  }

  function hairSVG(k){
    const f=S.HAIR_FIG[k];if(!f)return'';
    const len=f[0],tex=f[1],vol=f[2],tie=f[3],fr=f[4];
    const cx=45,hy=42,rx=20,ry=24, out=rx+vol;
    /* 묶거나 올린 머리는 덩어리를 머리에 붙여 짧게 잡아야
       꼬리·번이 실루엣에 묻히지 않는다 */
    const GATHER={mid:1,high:1,sidetail:1,twin:1,topbun:1,midbun:1,lowbun:1,twinbun:1,crown:1};
    const bot=GATHER[tie]?hy+ry-2:hy+ry+len*17;
    // 옆선: 질감에 따라 흔들림을 준다
    const amp={straight:0,flat:0,wavy:3.5,curly:5,coily:7,ringlet:4.5,locs:2.5,braid:0,fwave:2.5,wind:3,asym:0,shave:0}[tex]||0;
    const step={coily:9,curly:11,ringlet:9,fwave:8}[tex]||14;
    const L=(tex==='asym')?bot-24:bot, Rr=(tex==='shave')?hy+6:bot;
    // 좌우 옆선 좌표를 만들어 하나의 닫힌 경로로 잇는다
    let y=hy-6,i=0;const pts=[];
    while(y<Rr){y=Math.min(y+step,Rr);const w=out+(amp?Math.sin(i*1.5)*amp:0);pts.push([cx+w,y]);i++;}
    y=hy-6;i=0;const ptsL=[];
    while(y<L){y=Math.min(y+step,L);const w=out+(amp?Math.sin(i*1.5)*amp:0);ptsL.push([cx-w,y]);i++;}
    const path='M'+(cx-out)+','+(hy-4)+' Q'+cx+','+(hy-ry-10)+' '+(cx+out)+','+(hy-4)+
      pts.map(p=>' L'+p[0].toFixed(1)+','+p[1].toFixed(1)).join('')+
      ' L'+cx+','+(Math.max(L,Rr)+4)+
      ptsL.slice().reverse().map(p=>' L'+p[0].toFixed(1)+','+p[1].toFixed(1)).join('')+' Z';
    let extra='';
    const bun=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="1.7"/>';
    const knot=(x,y)=>'<circle cx="'+x+'" cy="'+y+'" r="2.8" fill="currentColor" opacity=".85"/>';
    /* 꼬리는 머리 실루엣 바깥에서 시작해야 보인다 */
    const tail=(x,y,dx,l)=>'<path d="M'+x+','+y+' q'+dx+','+(l*.45)+' '+(dx*.6)+','+l+
      '" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" opacity=".55"/>';
    const TL=18+len*13;
    if(tie==='mid')extra=tail(cx,hy+ry-4,7,TL)+knot(cx,hy+ry-5);
    if(tie==='high')extra=tail(cx+3,hy-ry+2,13,TL+6)+knot(cx,hy-ry+2);
    if(tie==='sidetail')extra=tail(cx+out-4,hy+10,11,TL)+knot(cx+out-5,hy+9);
    if(tie==='twin')extra=tail(cx-out+3,hy-2,-11,TL)+tail(cx+out-3,hy-2,11,TL)+
      knot(cx-out+3,hy-3)+knot(cx+out-3,hy-3);
    if(tie==='half')extra=knot(cx,hy+6);
    if(tie==='topbun')extra=bun(cx,hy-ry-6,9)+knot(cx,hy-ry+2);
    if(tie==='midbun')extra=bun(cx,hy-ry-3,10.5)+knot(cx,hy-ry+4);
    if(tie==='lowbun')extra=bun(cx,hy+ry+7,9.5)+knot(cx,hy+ry-1);
    if(tie==='twinbun')extra=bun(cx-out-3,hy-10,7.5)+bun(cx+out+3,hy-10,7.5);
    if(tie==='crown')extra='<path d="M'+(cx-out)+','+(hy-6)+' Q'+cx+','+(hy-ry-12)+' '+(cx+out)+','+(hy-6)+
      '" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="5 3" opacity=".85"/>';
    if(tex==='shave')extra+='<path d="M'+(cx+4)+','+(hy-10)+' L'+(cx+rx+2)+','+(hy+10)+
      '" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity=".5"/>';
    if(tex==='braid'&&tie&&tie!=='crown')extra+='<path d="M'+cx+','+(hy+ry)+' l0,30" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3" opacity=".5" fill="none"/>';
    let fringe='';
    if(fr==='blunt'||fr==='hime')fringe='<path d="M'+(cx-rx+1)+','+(hy-6)+' L'+(cx+rx-1)+','+(hy-6)+
      '" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".55"/>';
    if(fr==='side')fringe='<path d="M'+(cx-rx+1)+','+(hy-8)+' Q'+cx+','+(hy+2)+' '+(cx+rx-2)+','+(hy-10)+
      '" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".55"/>';
    if(fr==='wispy')fringe='<path d="M'+(cx-12)+','+(hy-8)+' l-3,9 M'+cx+','+(hy-10)+' l2,9 M'+(cx+12)+','+(hy-8)+
      ' l3,8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".55"/>';
    return '<svg width="90" height="140" viewBox="0 0 90 140" aria-hidden="true">'+
      '<path d="'+path+'" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" opacity=".9"/>'+
      '<ellipse cx="'+cx+'" cy="'+hy+'" rx="'+rx+'" ry="'+ry+'" fill="var(--card)" stroke="currentColor" stroke-width="1.6" opacity=".9"/>'+
      fringe+extra+
      '<path d="M'+(cx-13)+','+(hy+ry+2)+' q13,9 26,0 l7,6 -40,0 Z" fill="currentColor" fill-opacity=".13" stroke="currentColor" stroke-width="1.4" opacity=".7"/></svg>';
  }

  root.AtelierFigures = {
    bodySVG: bodySVG, hairSVG: hairSVG,
    /* 도식이 있는 항목만 알려 준다 */
    forKey: function (key, value, gender) {
      if (key === 'body type') return bodySVG(value, gender);
      if (key === 'hairstyle') return hairSVG(value);
      return '';
    }
  };
})(window);
