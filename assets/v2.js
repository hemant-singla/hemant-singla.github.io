/* Portfolio v2 interactions. Vanilla JS, no libraries. */
(function(){
const doc=document.documentElement,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const css=n=>getComputedStyle(doc).getPropertyValue(n).trim();

/* Theme toggle: night by default */
$('.theme')?.addEventListener('click',()=>{const next=doc.getAttribute('data-theme')==='light'?'dark':'light';doc.setAttribute('data-theme',next);try{localStorage.setItem('theme',next)}catch(e){}});

/* Top bar, progress, active link */
const top=$('.top'),bar=$('.progress i'),navA=$$('.links a');
const secs=navA.map(a=>$(a.getAttribute('href')));
function onScroll(){const y=scrollY,h=doc.scrollHeight-innerHeight;top.classList.toggle('scrolled',y>30);bar.style.transform=`scaleX(${h>0?y/h:0})`;
  let cur=-1;secs.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<innerHeight*.4)cur=i;});navA.forEach((a,i)=>a.classList.toggle('on',i===cur));}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* Headline: words rise in one after another */
$$('.headline .ln').forEach((ln,li)=>{const nodes=[...ln.childNodes];ln.textContent='';let k=0;
  nodes.forEach(n=>{if(n.nodeType===3){n.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t)){ln.append(' ');return;}const s=document.createElement('span');s.className='w';s.textContent=t;s.style.transitionDelay=(li*120+k++*60)+'ms';ln.append(s);});}
    else{const s=document.createElement('span');s.className='w';s.style.transitionDelay=(li*120+k++*60)+'ms';s.append(n);ln.append(s);}});});
requestAnimationFrame(()=>requestAnimationFrame(()=>doc.classList.add('ready')));
if(matchMedia('(pointer: coarse)').matches){const h=$('.hint');if(h)h.textContent='Touch the map to light it up. Every arc is a move I made.';}

/* Reveal on scroll */
$$('.sec-head,.case,.transit,.spec,.certs,.c-row,.tally li').forEach(e=>e.setAttribute('data-in',''));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -12% 0px'});
$$('[data-in]').forEach(e=>io.observe(e));

/* HERO: a dot field that ripples under the cursor, with the route between real places drawn on top */
(function(){
  const cv=$('.net');if(!cv)return;const ctx=cv.getContext('2d');let W,H,dpr,dots=[],nodes=[],arcs=[],parts=[],mx=-999,my=-999,run=true,t0=performance.now();
  const P=[ // lon, lat, label
    [76.53,31.71,'Hamirpur · NIT','Hamirpur',-1],[77.21,28.61,'Delhi · Samsung R&D','Delhi',1],[8.54,47.37,'Zurich · bank client (DXC)','Zurich',-1],[86.18,22.80,'Jamshedpur · XLRI','Jamshedpur',1],[-74.45,40.49,'New Brunswick · Rutgers','New Brunswick',-1]];
  const R=[[0,2],[2,1],[1,3],[3,4]];
  function proj(lon,lat){const x0=-80,x1=92,y0=50,y1=21;const m=W<700;
    const bx=m?[.1,.9]:[.5,.95],by=m?[.12,.24]:[.16,.42];
    return [W*(bx[0]+(lon-x0)/(x1-x0)*(bx[1]-bx[0])),H*(by[0]+(y0-lat)/(y0-y1)*(by[1]-by[0]))];}
  function size(){dpr=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    const g=W<700?22:26;dots=[];for(let y=g/2;y<H;y+=g)for(let x=g/2;x<W;x+=g)dots.push({x,y,o:0});
    nodes=P.map(p=>{const [x,y]=proj(p[0],p[1]);return {x,y,l:W<700?p[3]:p[2],up:p[4]};});
    arcs=R.map(([a,b])=>{const A=nodes[a],B=nodes[b];const dx=B.x-A.x;const c={x:(A.x+B.x)/2,y:Math.min(A.y,B.y)-Math.abs(dx)*.28-30};return {A,B,c};});
    parts=[];arcs.forEach((a,i)=>{for(let k=0;k<(W<700?6:10);k++)parts.push({a:i,t:Math.random(),s:.05+Math.random()*.08});});}
  const q=(a,t)=>{const u=1-t;return [u*u*a.A.x+2*u*t*a.c.x+t*t*a.B.x,u*u*a.A.y+2*u*t*a.c.y+t*t*a.B.y];};
  function draw(now){
    const ink=css('--ink'),sig=css('--sig'),cy=css('--cy'),light=doc.getAttribute('data-theme')==='light';
    const el=(now-t0)/1000;ctx.clearRect(0,0,W,H);
    // dots
    for(const d of dots){const dx=d.x-mx,dy=d.y-my,dist=Math.sqrt(dx*dx+dy*dy);
      const wave=Math.sin(d.x*.012+d.y*.01-el*1.2)*.5+.5;let tgt=.06+wave*.06;let r=1;
      if(dist<180){const k=1-dist/180;tgt+=k*.7;r+=k*1.8;}
      d.o+=(tgt-d.o)*.12;ctx.globalAlpha=d.o;ctx.fillStyle=dist<180?sig:ink;ctx.beginPath();ctx.arc(d.x,d.y,r,0,6.283);ctx.fill();}
    // arcs, drawn in over the first 2.5s
    const grow=RM?1:clamp(el/2.5,0,1);
    arcs.forEach((a,i)=>{const g=clamp(grow*arcs.length-i,0,1);if(g<=0)return;ctx.globalAlpha=.55;ctx.strokeStyle=i===arcs.length-1?sig:cy;ctx.lineWidth=1.4;ctx.setLineDash([4,6]);ctx.lineDashOffset=-el*14;
      ctx.beginPath();ctx.moveTo(a.A.x,a.A.y);for(let t=0;t<=g+1e-6;t+=.02){const [x,y]=q(a,Math.min(t,g));ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);});
    // parcels moving along arcs
    if(grow>=1)for(const p of parts){if(!RM)p.t+=p.s*.016;if(p.t>1)p.t-=1;const a=arcs[p.a];const [x,y]=q(a,p.t);
      ctx.globalAlpha=Math.sin(p.t*Math.PI)*.95;ctx.fillStyle=p.a===arcs.length-1?sig:cy;ctx.fillRect(x-2.5,y-2.5,5,5);}
    // nodes and labels
    nodes.forEach((n,i)=>{const near=Math.hypot(n.x-mx,n.y-my)<90;const pulse=(el*.6+i*.2)%1;
      ctx.globalAlpha=(1-pulse)*.5;ctx.strokeStyle=i===4?sig:cy;ctx.lineWidth=1;ctx.beginPath();ctx.arc(n.x,n.y,4+pulse*18,0,6.283);ctx.stroke();
      ctx.globalAlpha=1;ctx.fillStyle=i===4?sig:(light?'#11151b':'#eef1f4');ctx.beginPath();ctx.arc(n.x,n.y,near?6:4,0,6.283);ctx.fill();
      ctx.font=`500 ${W<700?10:11}px "JetBrains Mono",monospace`;ctx.globalAlpha=near?1:.7;ctx.fillStyle=ink;
      const right=n.x<W*.8;ctx.textAlign=right?'left':'right';ctx.fillText(n.l.toUpperCase(),n.x+(right?12:-12),n.y+(n.up<0?-8:16));});
    ctx.globalAlpha=1;
  }
  function loop(now){if(run){draw(now);requestAnimationFrame(loop);}}
  size();addEventListener('resize',size);
  addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;},{passive:true});
  cv.parentElement.addEventListener('pointerleave',()=>{mx=my=-999;});
  new IntersectionObserver(es=>{const v=es[0].isIntersecting;if(v&&!run){run=true;requestAnimationFrame(loop);}run=v;}).observe(cv);
  requestAnimationFrame(loop);
})();

/* Split-flap status board + New Jersey clock */
const CH=' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·+.-→/%~';
function flapTo(cells,text,stagger=28){[...cells].forEach((c,i)=>{const want=text[i]||' ';if(RM){c.textContent=want;return;}let n=4+(i%5)+Math.floor(Math.random()*4);
  setTimeout(function tick(){c.classList.remove('f');void c.offsetWidth;c.classList.add('f');c.textContent=n--<=0?want:CH[Math.floor(Math.random()*CH.length)];if(n>=0)setTimeout(tick,55);},i*stagger);});}
(function(){const f=$('.flap');if(!f)return;const rows=JSON.parse(f.dataset.rows);const n=Math.max(...rows.map(r=>r.length));
  for(let i=0;i<n;i++)f.append(document.createElement('i'));let k=0;const go=()=>{flapTo(f.children,rows[k].padEnd(n));k=(k+1)%rows.length;};go();setInterval(go,4200);
  const clk=$('.board-clock');const tick=()=>{try{clk.textContent='NJ '+new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/New_York'});}catch(e){}};tick();setInterval(tick,20000);})();

/* ROUTE: the parcel follows scroll on a spring along a path through every stop */
(function(){
  const map=$('.route-map');if(!map)return;const svg=$('.route-svg'),base=$('.route-base'),done=$('.route-done'),pkg=$('.route-pkg'),stops=$$('.stop');
  let L=0,stopAt=[],pos=0,vel=0,target=0;
  function build(){const mr=map.getBoundingClientRect();const pts=stops.map(s=>{const p=s.querySelector('.stop-pin').getBoundingClientRect();return [p.left+p.width/2-mr.left,p.top+p.height/2-mr.top];});
    const narrow=innerWidth<=700;let d=`M${pts[0][0]},${pts[0][1]-80}`;let prev=[pts[0][0],pts[0][1]-80];
    pts.forEach((p,i)=>{const sway=narrow?0:(i%2?-1:1)*Math.min(160,mr.width*.12);const my=(prev[1]+p[1])/2;d+=` C${prev[0]+sway},${my} ${p[0]-sway},${my} ${p[0]},${p[1]}`;prev=p;});
    d+=` L${prev[0]},${prev[1]+120}`;base.setAttribute('d',d);done.setAttribute('d',d);L=done.getTotalLength();done.style.strokeDasharray=L;
    stopAt=pts.map(p=>{let best=0,bd=1e9;for(let l=0;l<=L;l+=6){const q=done.getPointAtLength(l);const dd=Math.abs(q.y-p[1])+Math.abs(q.x-p[0]);if(dd<bd){bd=dd;best=l;}}return best;});}
  function want(){const mr=map.getBoundingClientRect();const line=innerHeight*.55;// point of the path at the viewport's 55% line
    const yLocal=line-mr.top;let lo=0,hi=L;for(let k=0;k<22;k++){const m=(lo+hi)/2;if(done.getPointAtLength(m).y<yLocal)lo=m;else hi=m;}return lo;}
  let last=performance.now();
  function step(now){const dt=Math.min(.033,(now-last)/1000);last=now;target=want();
    if(RM){pos=target;vel=0;}else{vel+=(36*(target-pos)-9*vel)*dt;pos+=vel*dt;}pos=clamp(pos,0,L);
    const p=done.getPointAtLength(pos),p2=done.getPointAtLength(Math.min(L,pos+2));const ang=Math.atan2(p2.y-p.y,p2.x-p.x)*57.3-90;
    pkg.setAttribute('transform',`translate(${p.x},${p.y}) rotate(${clamp(ang,-35,35)+clamp(vel*.02,-12,12)})`);done.style.strokeDashoffset=L-pos;
    stops.forEach((s,i)=>s.classList.toggle('on',pos>=stopAt[i]-30));requestAnimationFrame(step);}
  const ro=new ResizeObserver(build);ro.observe(map);build();requestAnimationFrame(step);
})();

/* CASES: the page takes on each case's colour while it is in view */
(function(){const cases=$$('.case');const ob=new IntersectionObserver(es=>{es.forEach(e=>{e.target.classList.toggle('on',e.isIntersecting);});
  const on=cases.find(c=>c.classList.contains('on'));document.body.classList.toggle('case-on',!!on);if(on)document.body.style.setProperty('--case',on.dataset.themeC);},{rootMargin:'-40% 0px -40% 0px'});
  cases.forEach(c=>{c.style.setProperty('--c',c.dataset.themeC);ob.observe(c);});})();

/* Walmart holdout replay: drag across to read any day */
(function(){
  const D=[[468,448.8],[396,425.4],[451,404.3],[402,411.4],[524,462.9],[707,590.9],[754,672.9],[469,496.9],[511,476.9],[419,436.3],[405,452.5],[537,524.5],[702,680.7],[611,620.5],[534,509.9],[477,456.9],[441,436.5],[397,443.9],[553,497.9],[662,623.6],[790,677.8],[576,465.9],[483,439.5],[449,419.1],[391,425.4],[493,477.6],[636,622.1],[767,663.0]];
  const toy=$('.chart-toy');if(!toy)return;const svg=$('.ct-svg',toy),read=$('.ct-read',toy);const NS='http://www.w3.org/2000/svg';
  const w=600,h=240,pl=6,pr=6,pt=14,pb=14,lo=350,hi=820;const X=i=>pl+i*(w-pl-pr)/(D.length-1),Y=v=>pt+(hi-v)/(hi-lo)*(h-pt-pb);
  const start=new Date(Date.UTC(2016,3,25));
  const mk=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);svg.append(e);return e;};
  for(let i=0;i<D.length;i++){const d=new Date(start.getTime()+i*864e5).getUTCDay();if(d===6)mk('rect',{class:'we',x:X(i)-6,y:0,width:X(1)-X(0)+12,height:h});}
  [450,600,750].forEach(v=>mk('line',{class:'grid',x1:0,x2:w,y1:Y(v),y2:Y(v)}));
  const pa=D.map((d,i)=>`${X(i)},${Y(d[0])}`),pf=D.map((d,i)=>`${X(i)},${Y(d[1])}`);
  mk('polygon',{class:'gap',points:pa.concat(pf.slice().reverse()).join(' ')});
  const act=mk('polyline',{class:'act',points:pa.join(' ')}),fc=mk('polyline',{class:'fc',points:pf.join(' ')});
  const cur=mk('line',{class:'cur',y1:0,y2:h});const da=mk('circle',{class:'ct-dot',r:4,stroke:'currentColor'}),df=mk('circle',{class:'ct-dot',r:4});
  da.style.stroke='var(--ink)';df.style.stroke='var(--c)';
  let idx=D.length-1;
  function set(i){idx=clamp(Math.round(i),0,D.length-1);const [a,f]=D[idx];cur.setAttribute('x1',X(idx));cur.setAttribute('x2',X(idx));
    da.setAttribute('cx',X(idx));da.setAttribute('cy',Y(a));df.setAttribute('cx',X(idx));df.setAttribute('cy',Y(f));
    const dt=new Date(start.getTime()+idx*864e5);const lab=dt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'});
    const err=Math.abs(f-a)/a*100;read.textContent=`Day ${idx+1} · ${lab} · actual ${a} · forecast ${Math.round(f)} · off ${err.toFixed(1)}%`;toy.setAttribute('aria-valuenow',idx+1);}
  const fromX=e=>{const r=svg.getBoundingClientRect();return (e.clientX-r.left)/r.width*w;};
  const pick=e=>{const x=fromX(e);set((x-pl)/((w-pl-pr)/(D.length-1)));};
  let down=false;toy.addEventListener('pointerdown',e=>{down=true;pick(e);});addEventListener('pointerup',()=>down=false);
  toy.addEventListener('pointermove',e=>{if(down||e.pointerType==='mouse')pick(e);});
  toy.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){set(idx-1);e.preventDefault();}if(e.key==='ArrowRight'){set(idx+1);e.preventDefault();}});
  // draw the lines in when the chart first appears, then sweep the cursor across
  [act,fc].forEach(p=>{const l=p.getTotalLength?p.getTotalLength():2000;p.style.strokeDasharray=p.classList.contains('fc')?'':l;p.style.strokeDashoffset=p.classList.contains('fc')?0:l;});
  set(0);
  new IntersectionObserver((es,o)=>{if(!es[0].isIntersecting)return;o.disconnect();act.style.transition=RM?'':'stroke-dashoffset 1.8s ease';act.style.strokeDashoffset=0;
    if(RM){set(27);return;}let i=0;const sw=setInterval(()=>{set(i++);if(i>=D.length)clearInterval(sw);},70);},{threshold:.4}).observe(toy);
})();

/* J&J before/after bars */
(function(){const ul=$('.bt');if(!ul)return;const rows=$$('li',ul),note=$('.bt-note'),kind=$('.bt-kind');const max=Math.max(...rows.map(r=>+r.dataset.b));
  const sel=r=>{rows.forEach(x=>x.classList.toggle('sel',x===r));note.textContent=r.dataset.note.replace(/&amp;/g,'&');kind.textContent=r.dataset.kind;};
  rows.forEach(r=>{r.tabIndex=0;r.addEventListener('click',()=>sel(r));r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sel(r);}});});sel(rows[0]);
  new IntersectionObserver((es,o)=>{if(!es[0].isIntersecting)return;o.disconnect();rows.forEach((r,i)=>{const s=+r.dataset.b/max;setTimeout(()=>{
    // each row is drawn on its own scale so small and large bases are both readable
    $('.b',r).style.width='100%';$('.a',r).style.width=(+r.dataset.a/+r.dataset.b*100)+'%';},i*220);});},{threshold:.4}).observe(ul);})();

/* LaunchReady scenario */
(function(){const tabs=$$('.lr-tabs button');if(!tabs.length)return;const chain=$('.lr-chain'),txt=$('.lr-text'),ver=$('.lr-verdict');
  $$('span',chain).forEach((s,i)=>s.style.setProperty('--i',i));
  const S=[{v:'GO',c:'go',k:'',t:'USB controllers arrive on time, so test boards are ready and <b>testing starts 12 Nov</b>. Software and supply both say the launch is on track.'},
           {v:'AT RISK',c:'risk',k:'hit',t:'The USB controller supplier slips. Fewer test boards means <b>testing moves from 12 Nov to 8 Dec</b>, and software lands <b>8–15 Jan against an 11 Jan cutoff</b>.'},
           {v:'GO',c:'go',k:'fixed',t:'Recovery: <b>re-pegging 20 controllers</b> from another program’s order restores the launch. In the app, a person approves or rejects each recovery option.'}];
  function set(i){tabs.forEach((b,j)=>b.setAttribute('aria-selected',String(i===j)));const s=S[i];chain.className='lr-chain '+s.k;txt.innerHTML=s.t;ver.textContent=s.v;ver.className='lr-verdict '+s.c;void ver.offsetWidth;ver.classList.add('bump');}
  tabs.forEach((b,i)=>b.addEventListener('click',()=>set(i)));set(0);})();

/* Tally: numbers flap into place */
(function(){const ob=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;ob.unobserve(e.target);const b=e.target,v=b.dataset.v;b.textContent='';
  const cells=[...v].map(()=>{const s=document.createElement('span');s.className='ch';b.append(s);return s;});flapTo(cells,v,70);}),{threshold:.6});
  $$('.flapnum').forEach(b=>ob.observe(b));})();

/* Habits deck: throw the top card; it keeps the speed and angle you threw it with, then goes to the back */
(function(){const deck=$('.deck');if(!deck)return;let cards=$$('.card',deck);
  function lay(){cards.forEach((c,i)=>{c.style.zIndex=cards.length-i;if(c._fly)return;const r=i===0?0:(i%2?2.5:-2.5)*i*.6;c.style.transition='transform .6s cubic-bezier(.3,1.4,.5,1)';
    c.style.transform=`translate(${i*6}px,${i*10}px) rotate(${r}deg) scale(${1-i*.03})`;c.setAttribute('aria-hidden',String(i!==0));});}
  function throwTop(vx,vy){const c=cards[0];c._fly=true;let x=c._x||0,y=c._y||0,rot=c._r||0,vr=vx*.04;c.style.transition='none';let last=performance.now();
    (function f(now){const dt=Math.min(.033,(now-last)/1000);last=now;x+=vx*dt;y+=vy*dt;vy+=1400*dt;rot+=vr*dt;c.style.transform=`translate(${x}px,${y}px) rotate(${rot}deg)`;
      if(Math.abs(x)<innerWidth&&y<innerHeight*1.2)requestAnimationFrame(f);else{c._fly=false;c._x=c._y=c._r=0;cards.push(cards.shift());c.style.transition='none';
        c.style.transform=`translate(0,40px) scale(.9)`;c.style.opacity='0';requestAnimationFrame(()=>{c.style.opacity='';lay();});}})(last);
    lay();}
  let drag=null;
  deck.addEventListener('pointerdown',e=>{const c=e.target.closest('.card');if(c!==cards[0])return;c.setPointerCapture(e.pointerId);c.classList.add('drag');c.style.transition='none';drag={c,sx:e.clientX,sy:e.clientY,t:performance.now(),px:e.clientX,py:e.clientY,vx:0,vy:0};});
  deck.addEventListener('pointermove',e=>{if(!drag)return;const now=performance.now(),dt=Math.max(.001,(now-drag.t)/1000);drag.vx=(e.clientX-drag.px)/dt*.6+drag.vx*.4;drag.vy=(e.clientY-drag.py)/dt*.6+drag.vy*.4;drag.px=e.clientX;drag.py=e.clientY;drag.t=now;
    const c=drag.c;c._x=e.clientX-drag.sx;c._y=e.clientY-drag.sy;c._r=c._x*.06;c.style.transform=`translate(${c._x}px,${c._y}px) rotate(${c._r}deg)`;});
  const up=()=>{if(!drag)return;const {c,vx,vy}=drag;drag=null;c.classList.remove('drag');
    if(Math.hypot(vx,vy)>500||Math.abs(c._x||0)>140)throwTop(clamp(vx,-3000,3000)||(c._x>0?1400:-1400),clamp(vy,-2000,2000));else{c._x=c._y=c._r=0;lay();}};
  deck.addEventListener('pointerup',up);deck.addEventListener('pointercancel',up);
  $('.deck-next')?.addEventListener('click',()=>{if(cards[0]._fly)return;if(RM){cards.push(cards.shift());lay();return;}throwTop(1500,-300);});
  lay();})();

/* Copy email with a spring toast */
(function(){const b=$('.c-email'),t=$('.toast');if(!b)return;b.addEventListener('click',async()=>{let ok=true;try{await navigator.clipboard.writeText(b.dataset.email);}catch(e){ok=false;}
  t.textContent=ok?'Email copied. Talk soon.':'Couldn’t copy. Use the Email button instead.';t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2200);});})();
})();
