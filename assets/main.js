(function(){
const doc=document.documentElement;
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Mobile menu */
const toggle=document.querySelector('.menu-toggle');
const navigation=document.querySelector('.nav-links');
function closeMenu(){navigation?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');if(toggle)toggle.textContent='Menu';}
toggle?.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!expanded));navigation?.classList.toggle('open',!expanded);toggle.textContent=expanded?'Menu':'Close';});
navigation?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle?.getAttribute('aria-expanded')==='true'){closeMenu();toggle.focus();}});

/* Light / dark toggle (all pages) */
const nav=document.querySelector('.nav');
if(nav){
  const btn=document.createElement('button');
  btn.type='button';btn.className='theme-toggle';
  btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path class="sun" d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path class="moon" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
  const sys=window.matchMedia('(prefers-color-scheme: dark)');
  const current=()=>doc.getAttribute('data-theme')||(sys.matches?'dark':'light');
  const label=()=>{const d=current()==='dark';btn.setAttribute('aria-pressed',String(d));btn.setAttribute('aria-label',d?'Switch to light theme':'Switch to dark theme');btn.title=btn.getAttribute('aria-label');};
  btn.addEventListener('click',()=>{const next=current()==='dark'?'light':'dark';doc.setAttribute('data-theme',next);try{localStorage.setItem('theme',next)}catch(e){}label();});
  sys.addEventListener?.('change',label);
  label();nav.appendChild(btn);
}

/* Scroll reveals */
const revealEls=document.querySelectorAll('[data-reveal]');
if(!reduce&&'IntersectionObserver' in window){
  doc.classList.add('motion');
  const io=new IntersectionObserver(entries=>{entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}})},{rootMargin:'0px 0px -8% 0px',threshold:0.08});
  revealEls.forEach(el=>io.observe(el));
}

/* Count-up numbers */
const counters=document.querySelectorAll('[data-count]');
if(!reduce&&'IntersectionObserver' in window){
  const run=el=>{const end=+el.dataset.count,pre=el.dataset.prefix||'',suf=el.dataset.suffix||'';const t0=performance.now(),dur=1100;
    const step=t=>{const p=Math.min(1,(t-t0)/dur),v=Math.round(end*(1-Math.pow(1-p,3)));el.textContent=pre+v+suf;if(p<1)requestAnimationFrame(step);};
    el.textContent=pre+'0'+suf;requestAnimationFrame(step);};
  const co=new IntersectionObserver(entries=>{entries.forEach(en=>{if(en.isIntersecting){run(en.target);co.unobserve(en.target);}})},{threshold:0.6});
  counters.forEach(el=>co.observe(el));
}

/* Expandable stories: open by default without JS, collapsed with JS */
const stories=new Map();
document.querySelectorAll('.story-toggle').forEach(btn=>{
  const body=document.getElementById(btn.getAttribute('aria-controls'));if(!body)return;
  const lab=btn.querySelector('.toggle-label');
  const set=open=>{btn.setAttribute('aria-expanded',String(open));body.hidden=!open;btn.closest('.story')?.classList.toggle('open',open);if(lab)lab.textContent=open?'Close the story':'Read the story';};
  set(false);
  btn.addEventListener('click',()=>set(btn.getAttribute('aria-expanded')!=='true'));
  const story=btn.closest('.story');if(story)stories.set(story.id,set);
});

/* Jump links (career path, chain panels): scroll, open story, flash */
function jumpTo(id){
  const el=document.getElementById(id);if(!el)return;
  stories.get(id)?.(true);
  el.classList.add('in');
  el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
  el.setAttribute('tabindex','-1');el.focus({preventScroll:true});
  document.querySelectorAll('.path-track a').forEach(a=>a.classList.toggle('active',a.dataset.jump===id));
}
document.querySelectorAll('[data-jump]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.replaceState(null,'','#'+a.dataset.jump);jumpTo(a.dataset.jump);}));

/* Planning chain tabs */
const tabs=[...document.querySelectorAll('.chain-stages [role=tab]')];
function select(tab,focus){
  tabs.forEach(t=>{const on=t===tab;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!on;});
  if(focus)tab.focus();
}
tabs.forEach((t,i)=>{
  t.addEventListener('click',()=>select(t));
  t.addEventListener('keydown',e=>{let j=null;
    if(e.key==='ArrowRight'||e.key==='ArrowDown')j=(i+1)%tabs.length;
    else if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=(i-1+tabs.length)%tabs.length;
    else if(e.key==='Home')j=0;else if(e.key==='End')j=tabs.length-1;
    if(j!==null){e.preventDefault();select(tabs[j],true);}});
});

/* Architecture diagram: hover, focus or tap a step */
const detail=document.getElementById('pipe-detail');
const steps=[...document.querySelectorAll('.pipe-step')];
const show=s=>{steps.forEach(x=>x.classList.toggle('active',x===s));if(detail)detail.textContent=s.dataset.detail;};
steps.forEach(s=>{['mouseenter','focus','click'].forEach(ev=>s.addEventListener(ev,()=>show(s)));});
if(steps[0]&&detail)show(steps[0]);

/* Journey progress line */
const journey=document.querySelector('.journey');
if(journey){
  const upd=()=>{const r=journey.getBoundingClientRect(),vh=window.innerHeight;const p=Math.max(0,Math.min(1,(vh*0.7-r.top)/r.height));journey.style.setProperty('--progress',p.toFixed(3));};
  if(reduce){journey.style.setProperty('--progress','1');}
  else{upd();window.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);}
}
})();
