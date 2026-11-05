/* The dock: a conveyor belt of parcels. Each parcel is one piece of work with its proof number on the waybill.
   Vanilla JS, no library. Springs and a tipping model, simulated every frame. */
(function(){
const root=document.querySelector('.dock');
if(!root)return;
const stage=root.querySelector('.dock-stage'),world=root.querySelector('.dock-3d'),svg=root.querySelector('.dock-back');
const capEl=root.querySelector('.dock-cap'),countEl=root.querySelector('.dock-count b'),scrubEl=root.querySelector('.dock-scrub i');
const list=root.querySelector('.dock-list');
const NS='http://www.w3.org/2000/svg';

/* Facts come from the portfolio itself. W,H,D are box sizes at scale 1. */
const P=[
 {id:'HS-01',org:'NIT Hamirpur',what:'B.Tech · Electrical',when:'2016–20',num:'₹20 lakh',sub:'festival budget · 5,000+ people',side:'ENGINEERING',href:'#edu-nit',cap:'Ran Hill’ffair 2019: ₹20 lakh budget, 5,000+ attendees, turnout up 40%',tone:0,W:170,H:122,D:120},
 {id:'HS-02',org:'DXC Technology',what:'Linux · Zurich bank',when:'2020–22',num:'50+',sub:'servers deployed · incidents −25%',side:'INFRASTRUCTURE',href:'#exp-dxc',cap:'50+ servers for a Zurich-based bank’s Linux fleet, incidents down 25%',tone:1,W:160,H:140,D:128},
 {id:'HS-03',org:'Samsung R&D',what:'USB · TV software',when:'2022–24',num:'10+',sub:'global TV launches · all on time',side:'LAUNCH',href:'#exp-samsung',cap:'USB software for 10+ global Samsung TV launches, every one on schedule',tone:2,W:196,H:136,D:122,stamp:'ON TIME'},
 {id:'HS-04',org:'Samsung R&D',what:'Shared code · 10+ boards',when:'2022–24',num:'−40%',sub:'regressions after the merge',side:'FRAGILE',href:'#exp-samsung',cap:'Merged code for 10+ hardware variants into shared modules: 40% fewer regressions',tone:0,W:150,H:112,D:112},
 {id:'HS-05',org:'XLRI Jamshedpur',what:'MBA',when:'2025–26',num:'MBA',sub:'finance · strategy · operations',side:'BUSINESS',href:'#edu-xlri',cap:'MBA at XLRI Jamshedpur: finance, strategy and operations',tone:3,W:162,H:126,D:118},
 {id:'HS-06',org:'Walmart study',what:'Demand forecasting',when:'Public data',num:'21%',sub:'more accurate than the baseline',side:'FORECAST',href:'#proj-walmart',cap:'Walmart study: 21% more accurate than week-over-week, 89% inside the 90% ranges',tone:1,W:188,H:146,D:126,stamp:'CHECKED'},
 {id:'HS-07',org:'J&J study',what:'Supplier rationalization',when:'Public data',num:'27→86%',sub:'of suppliers cut · of the value',side:'PROCUREMENT',href:'#proj-jnj',cap:'J&J study: cutting 27% of suppliers captures 86% of the value',tone:2,W:182,H:130,D:124},
 {id:'HS-08',org:'LaunchReady',what:'Launch go/no-go',when:'Fictional data',num:'32',sub:'automated tests · 16 launches',side:'THIS WAY UP',href:'#proj-launchready',cap:'LaunchReady: 16 launches recalculated live, 32 automated tests behind every number',tone:0,W:172,H:138,D:120,stamp:'GO'},
 {id:'HS-09',org:'Rutgers',what:'M.S. Supply Chain Analytics',when:'Now',num:'2027',sub:'expected graduation',side:'NEW JERSEY',href:'#edu-rutgers',cap:'M.S. Supply Chain Analytics at Rutgers, graduating 2027',tone:3,W:166,H:124,D:116},
 {id:'HS-10',org:'Nike study',what:'Inventory & working capital',when:'Up next',num:'Next',sub:'in the pipeline',side:'IN TRANSIT',href:'#work',cap:'Up next: Nike inventory efficiency and working capital, on public financials',tone:1,W:158,H:118,D:110,transit:true}
];
const d=P.length;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),mod=(a,n)=>((a%n)+n)%n;
const reduceQ=matchMedia('(prefers-reduced-motion: reduce)'),coarseQ=matchMedia('(pointer: coarse)');

/* Barcode: fixed widths from the parcel id, so it never changes between visits */
function barcode(seed){let s=0;for(const ch of seed)s=(Math.imul(s,31)+ch.charCodeAt(0))>>>0;let x=0,r='';
  while(x<96){s=(Math.imul(s,1103515245)+12345)>>>0;const w=1+(s>>>16)%3;if(((s>>>8)&1)||x===0)r+=`<rect x="${x}" width="${w}" height="20"/>`;x+=w+1+((s>>>4)&1);}
  return `<svg class="bc" viewBox="0 0 96 20" preserveAspectRatio="none" aria-hidden="true">${r}</svg>`;}

const st={c:null,offset:0,vel:520,glideTo:null,hovered:null,dragging:false,reduced:reduceQ.matches,coarse:coarseQ.matches,running:true,visible:true,
  els:[],motion:[],count:0,lastScan:null,ptr:null,down:null};

function layout(){
  const w=stage.clientWidth,h=stage.clientHeight,s=w<640;
  const u=clamp(Math.min(h/560,w/(s?560:900)),.56,1.12);
  const maxW=Math.max(...P.map(p=>p.W))*u,avgW=P.reduce((a,p)=>a+p.W,0)/d*u;
  const gap=Math.max(avgW*(s?1.32:1.62),(w+2.4*maxW)/d);
  return {w,h,s,u,gap,beltY:h*(s?.76:.74),Db:230*u,persp:s?900:1400,ox:w/2,oy:h*.1};
}
const proj=(c,x,y,z)=>{const k=c.persp/(c.persp-z);return [c.ox+(x-c.ox)*k,c.oy+(y-c.oy)*k];};

function build(){
  const c=st.c=layout();
  world.style.perspective=c.persp+'px';
  world.style.perspectiveOrigin=`${c.ox}px ${c.oy}px`;
  world.innerHTML='';st.els=[];
  P.forEach((p,i)=>{
    const W=p.W*c.u,H=p.H*c.u,D=p.D*c.u;
    const slot=document.createElement('div');slot.className='slot t'+p.tone+(p.transit?' transit':'');
    slot.style.cssText=`--W:${W}px;--H:${H}px;--D:${D}px;--u:${c.u}`;
    slot.innerHTML=`<div class="blob"></div><div class="cube">
      <div class="f back"></div><div class="f left"><span>${p.side}</span></div><div class="f right"><span>${p.side}</span><i class="arrows">↑↑</i></div>
      <div class="f top"><i class="tape"></i></div>
      <div class="f front"><i class="tape-lip"></i><div class="lbl">
        <div class="lbl-top"><b>${p.id}</b><span>${p.when}</span></div>
        <div class="lbl-org">${p.org}</div><div class="lbl-what">${p.what}</div>
        <div class="lbl-num">${p.num}</div><div class="lbl-sub">${p.sub}</div>${barcode(p.id)}
        <i class="laser"></i></div>${p.stamp?`<em class="stamp">${p.stamp}</em>`:''}${p.transit?'<em class="sticker">IN TRANSIT</em>':''}</div>
    </div>`;
    world.appendChild(slot);st.els.push(slot);
    if(!st.motion[i])st.motion[i]={yaw:-24,yawV:0,lift:0,liftV:0,push:0,pushV:0,tilt:(i%2?3:-3),tiltV:0,x:NaN,vx:0,ax:0,scanAt:0};
    st.motion[i].x=NaN;
  });
  drawStatic();
}

/* Belt, frame and scanner, drawn by projecting the same points CSS perspective uses */
let slats=[],fan,led,headG;
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);(parent||svg).appendChild(e);return e;}
function drawStatic(){
  const c=st.c,{w,h,beltY,Db,u}=c;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.innerHTML='';
  const zf=Db/2,zb=-Db/2,L=-200,R=w+200;
  const [fl,fy]=proj(c,L,beltY,zf),[fr]=proj(c,R,beltY,zf),[bl,by]=proj(c,L,beltY,zb),[br]=proj(c,R,beltY,zb);
  const skirt=18*u*c.persp/(c.persp-zf);
  el('ellipse',{class:'floor-shadow',cx:c.ox,cy:fy+skirt+60*u,rx:w*.62,ry:26*u});
  // legs (fixed)
  for(let x=c.ox-Math.ceil(w/2/(260*u))*260*u;x<w+100;x+=260*u){const [lx,ly]=proj(c,x,beltY,zf-6*u);el('rect',{class:'leg',x:lx-5*u,y:ly+skirt-2,width:10*u,height:58*u});}
  el('path',{class:'belt-back',d:`M${bl},${by-8*u}L${br},${by-8*u}L${br},${by}L${bl},${by}Z`});
  el('path',{class:'belt-top',d:`M${bl},${by}L${br},${by}L${fr},${fy}L${fl},${fy}Z`});
  const g=el('g',{class:'slats'});slats=[];
  const n=Math.ceil((R-L)/(46*u))+2;for(let i=0;i<n;i++)slats.push(el('line',{},g));
  el('path',{class:'belt-skirt',d:`M${fl},${fy}L${fr},${fy}L${fr},${fy+skirt}L${fl},${fy+skirt}Z`});
  el('line',{class:'belt-shine',x1:fl,x2:fr,y1:fy+1.5,y2:fy+1.5});
  // scanner head hanging from the ceiling at the centre
  const headW=124*u,headH=34*u,hy=beltY-Math.max(...P.map(p=>p.H))*u*1.36-34*u;
  const [hx,hyy]=proj(c,c.ox,hy,0);
  headG=el('g',{class:'scanner'});
  el('line',{class:'rod',x1:hx-headW*.32,x2:hx-headW*.32,y1:0,y2:hyy-headH},headG);
  el('line',{class:'rod',x1:hx+headW*.32,x2:hx+headW*.32,y1:0,y2:hyy-headH},headG);
  el('rect',{class:'head',x:hx-headW/2,y:hyy-headH,width:headW,height:headH,rx:6*u},headG);
  el('rect',{class:'head-shine',x:hx-headW/2+4*u,y:hyy-headH+3*u,width:headW-8*u,height:4*u,rx:2*u},headG);
  el('rect',{class:'window',x:hx-headW*.3,y:hyy-6*u,width:headW*.6,height:4*u,rx:2*u},headG);
  led=el('circle',{class:'led',cx:hx+headW/2-12*u,cy:hyy-headH/2-1*u,r:3.6*u},headG);
  const t=el('text',{class:'head-txt',x:hx-headW/2+10*u,y:hyy-headH/2+4*u,'font-size':10*u},headG);t.textContent='SCAN · QA';
  const [ax,ay]=proj(c,c.ox-40*u,beltY,0),[bx]=proj(c,c.ox+40*u,beltY,0);
  fan=el('path',{class:'fan',d:`M${hx-headW*.28},${hyy-3*u}L${hx+headW*.28},${hyy-3*u}L${bx},${ay}L${ax},${ay}Z`});
  st.slatGeo={L,R,zf,zb,sp:46*u};
}
function drawSlats(){
  const c=st.c,{L,zf,zb,sp}=st.slatGeo,o=mod(-st.offset,sp);
  for(let i=0;i<slats.length;i++){const x=L+o+(i-1)*sp;const [x1,y1]=proj(c,x,c.beltY,zf),[x2,y2]=proj(c,x,c.beltY,zb);
    const s=slats[i];s.setAttribute('x1',x1.toFixed(1));s.setAttribute('y1',y1.toFixed(1));s.setAttribute('x2',x2.toFixed(1));s.setAttribute('y2',y2.toFixed(1));}
}

function centreIndex(){const c=st.c,ring=d*c.gap,m0=c.ox-ring/2;let best=0,bd=1e9;
  for(let i=0;i<d;i++){const x=mod(i*c.gap-st.offset-m0,ring)+m0;const dd=Math.abs(x-c.ox);if(dd<bd){bd=dd;best=i;}}return best;}
function glide(i){const c=st.c,ring=d*c.gap;const want=i*c.gap-c.ox;const diff=mod(want-st.offset+ring/2,ring)-ring/2;st.glideTo=st.offset+diff;}

function caption(i,mode){
  if(i===null){return;}const p=P[i];
  const short=st.c.s?p.cap.split(':')[0]:p.cap;
  capEl.innerHTML=`<span class="cap-tag">${mode} · ${p.id}</span><span class="cap-txt">${short}</span><a href="${p.href}" class="cap-open">Open</a>`;
}
function scan(i,now){
  const t=st.motion[i];if(now-t.scanAt<700)return;t.scanAt=now;
  const e=st.els[i];e.classList.remove('scan');void e.offsetWidth;e.classList.add('scan');
  st.count++;countEl.textContent=String(st.count).padStart(4,'0');
  const cnt=countEl.parentNode;cnt.classList.remove('bump');void cnt.offsetWidth;cnt.classList.add('bump');
  led.classList.remove('on');void led.getBBox();led.classList.add('on');fan.classList.remove('on');void fan.getBBox();fan.classList.add('on');
  if(st.hovered===null||st.coarse)caption(i,'Scanned');
}

const K=[1,.8,.48,.2];
function step(now,dt){
  const c=st.c,ring=d*c.gap,m0=c.ox-ring/2;
  if(st.dragging){}
  else if(st.glideTo!==null){const e=st.glideTo-st.offset,mv=e*Math.min(1,5.5*dt);st.offset+=mv;st.vel=mv/Math.max(dt,.001);
    if(Math.abs(e)<.4){st.offset=st.glideTo;st.glideTo=null;st.vel=0;}}
  else{const paused=st.reduced||(st.hovered!==null&&!st.coarse);const rate=Math.abs(st.vel)>39?2.4:1.6;
    st.vel+=((paused?0:34)-st.vel)*Math.min(1,dt*rate);st.offset+=st.vel*dt;}
  if(st.coarse&&!st.dragging){const ci=centreIndex();if(ci!==st.hovered){st.hovered=ci;caption(ci,'On the belt');}}
  const hov=st.hovered;
  const b=[];for(let i=0;i<d;i++)b[i]=mod(i*c.gap-st.offset-m0,ring)+m0;
  const j=hov===null?0:Math.max(0,P[hov].W*c.u*.62-.32*c.gap)+.12*c.gap;
  const k=st.reduced?400:120,v=st.reduced?40:15;
  for(let i=0;i<d;i++){
    const t=st.motion[i],p=P[i];let l=0;
    if(hov!==null&&i!==hov){const dn=Math.round((b[i]-b[hov])/c.gap);l=Math.sign(dn)*j*(K[Math.abs(dn)-1]||0);}
    const X=b[i]+t.push;
    const view=57.3*Math.atan2(X-c.ox,c.persp);
    const target=i===hov?-.85*view:clamp(-22-.35*view,-48,-6);
    t.yawV+=(k*(target-t.yaw)-v*t.yawV)*dt;t.yaw+=t.yawV*dt;
    t.pushV+=(140*(l-t.push)-21*t.pushV)*dt;t.push+=t.pushV*dt;
    t.liftV+=(k*((i===hov)-t.lift)-v*t.liftV)*dt;t.lift+=t.liftV*dt;
    const mx=b[i]+t.push;
    if(isFinite(t.x)&&Math.abs(mx-t.x)<ring/2){const vx=(mx-t.x)/dt;t.ax=.55*t.ax+.45*(vx-t.vx)/dt;t.vx=vx;
      if((t.x-c.ox)*(mx-c.ox)<0)scan(i,now);}
    else{t.vx=0;t.ax=0;}
    t.x=mx;
    if(!st.reduced){ // the top lags when the belt speeds up, then the box rocks back onto its base
      const hum=.35*Math.sin(now/170+i*1.9);
      t.tiltV+=(-70*t.tilt-5.5*t.tiltV+clamp(-t.ax/(p.H*c.u)*14,-500,500)+hum)*dt;
      t.tilt=clamp(t.tilt+t.tiltV*dt,-9,9);
    }else t.tilt=0;
    const e=st.els[i];
    e.style.transform=`translate3d(${mx.toFixed(2)}px,${c.beltY.toFixed(1)}px,0)`;
    e.style.zIndex=i===hov?999:500-Math.round(Math.abs(mx-c.ox)/8);
    e.style.setProperty('--yaw',t.yaw.toFixed(2)+'deg');
    e.style.setProperty('--tilt',(t.tilt*(1-t.lift)).toFixed(2)+'deg');
    e.style.setProperty('--lift',t.lift.toFixed(3));
    e.classList.toggle('is-hov',i===hov);
  }
  drawSlats();
  scrubEl.style.transform=`scaleX(${(mod(st.offset+c.ox,ring)/ring).toFixed(4)})`;
}

let last=performance.now(),raf=0;
function frame(now){raf=0;const dt=Math.min(1/30,(now-last)/1000);last=now;step(now,dt);if(st.visible&&!document.hidden)raf=requestAnimationFrame(frame);}
function kick(){if(!raf&&st.visible&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);}}

/* Input: projected hit-test, drag with fling, horizontal wheel, page scroll adds belt speed */
function hit(px,py){const c=st.c;let best=null,bd=1e9;
  for(let i=0;i<d;i++){const t=st.motion[i],p=P[i],W=p.W*c.u,H=p.H*c.u;const half=W*(i===st.hovered?.72:.5);
    const top=c.beltY-H*(1+t.lift*.32)-10,bot=c.beltY+20;
    if(Math.abs(px-t.x)<half&&py>top&&py<bot){const dd=Math.abs(px-t.x)-(i===st.hovered?60:0);if(dd<bd){bd=dd;best=i;}}}
  return best;}
function local(e){const r=stage.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
stage.addEventListener('pointermove',e=>{
  if(st.down){const dx=e.clientX-st.down.x;if(!st.dragging&&Math.abs(dx)>6){st.dragging=true;st.glideTo=null;stage.classList.add('grabbing');}
    if(st.dragging){st.offset=st.down.off-dx;const now=performance.now();st.down.v=(st.down.lx-e.clientX)/Math.max(.001,(now-st.down.t)/1000);st.down.lx=e.clientX;st.down.t=now;}}
  if(e.pointerType==='mouse'&&!st.dragging){const [x,y]=local(e);const h=hit(x,y);if(h!==st.hovered){st.hovered=h;stage.classList.toggle('over',h!==null);if(h!==null)caption(h,'Holding');}}
});
stage.addEventListener('pointerleave',()=>{if(!st.coarse){st.hovered=null;stage.classList.remove('over');}});
stage.addEventListener('pointerdown',e=>{if(e.button)return;st.down={x:e.clientX,off:st.offset,lx:e.clientX,t:performance.now(),v:0};stage.setPointerCapture?.(e.pointerId);});
stage.addEventListener('pointerup',e=>{
  const was=st.dragging,dn=st.down;st.down=null;st.dragging=false;stage.classList.remove('grabbing');
  if(was){st.vel=clamp(dn.v,-1600,1600);return;}
  const [x,y]=local(e);const h=hit(x,y);if(h===null)return;
  if(st.coarse&&h!==centreIndex()){glide(h);caption(h,'Holding');return;}
  open(h);
});
stage.addEventListener('pointercancel',()=>{st.down=null;st.dragging=false;stage.classList.remove('grabbing');});
stage.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){e.preventDefault();st.glideTo=null;st.offset+=e.deltaX;st.vel=clamp(e.deltaX*30,-1200,1200);}},{passive:false});
let lastY=scrollY;addEventListener('scroll',()=>{const dy=scrollY-lastY;lastY=scrollY;if(st.visible&&!st.reduced&&!st.dragging){st.glideTo=null;st.vel=clamp(st.vel+dy*6,-900,900);}},{passive:true});
root.querySelector('.dock-prev').addEventListener('click',()=>{const i=mod(centreIndex()-1,d);glide(i);caption(i,'Holding');});
root.querySelector('.dock-next').addEventListener('click',()=>{const i=mod(centreIndex()+1,d);glide(i);caption(i,'Holding');});
function open(i){const t=document.querySelector(P[i].href);if(!t)return;
  const det=t.querySelector('details');if(det)det.open=true;
  t.scrollIntoView({behavior:st.reduced?'auto':'smooth',block:'start'});history.replaceState(null,'',P[i].href);}

/* A hidden list mirrors the belt for keyboard and screen-reader users */
P.forEach((p,i)=>{const li=document.createElement('li');const a=document.createElement('a');a.href=p.href;a.textContent=`${p.id}, ${p.org}: ${p.cap}`;
  a.addEventListener('focus',()=>{glide(i);st.hovered=i;caption(i,'Holding');});a.addEventListener('blur',()=>{st.hovered=null;});li.appendChild(a);list.appendChild(li);});

if('IntersectionObserver' in window)new IntersectionObserver(es=>{st.visible=es[0].isIntersecting;if(st.visible)kick();}).observe(stage);
document.addEventListener('visibilitychange',kick);
reduceQ.addEventListener?.('change',e=>{st.reduced=e.matches;});
coarseQ.addEventListener?.('change',e=>{st.coarse=e.matches;if(!e.matches)st.hovered=null;});
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{const w=stage.clientWidth;if(w!==st.c.w||Math.abs(stage.clientHeight-st.c.h)>40){build();}},120);});

if(st.reduced)st.vel=0;
build();caption(centreIndex(),'On the belt');
root.classList.add('ready');
st.motion.forEach((t,i)=>{t.tiltV=st.reduced?0:(i%2?-40:40);});
kick();
// test hook for verification scripts
root.__dock=st;
})();
