const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.nav-links');
function closeMenu(){navigation?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');if(toggle)toggle.textContent='Menu';}
toggle?.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!expanded));navigation?.classList.toggle('open',!expanded);toggle.textContent=expanded?'Menu':'Close';});
navigation?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle?.getAttribute('aria-expanded')==='true'){closeMenu();toggle.focus();}});
