const names={news:'新闻动态',notices:'通知公告',higher:'高教信息',planning:'发展规划',policy:'政策法规',reference:'规划参考'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function row(item){let d=item.publishDate;return `<a class="article-row" title="${esc(item.title)}" href="${esc(item.url)}" ${/^https?:/.test(item.url)?'target="_blank" rel="noopener"':''}>${d?`<time datetime="${d}" aria-label="发布时间：${d}" title="发布时间：${d}"><b>${d.slice(8)}</b><span>${d.slice(0,7).replace('-','.')}</span></time>`:`<span class="date-pending">日期<br>待核实</span>`}<div><h3>${esc(item.title)}</h3></div></a>`}
if(document.querySelector('#news-list'))document.querySelector('#news-list').innerHTML=siteContent.news.map(row).join('')+'<a class="news-bottom" href="https://www.sztu.edu.cn/" target="_blank" rel="noopener">关注学校发展动态 <span>访问学校官网 ↗</span></a>';
document.querySelectorAll('[data-list]').forEach(el=>el.innerHTML=siteContent[el.dataset.list].map(row).join(''));
const dialog=document.querySelector('dialog'),form=document.querySelector('#search-form'),results=document.querySelector('#dialog-results'),query=document.querySelector('#query');
function openDialog(title,search=false){document.querySelector('#dialog-title').textContent=title;form.hidden=!search;if(!dialog.open)dialog.showModal();}
function search(){let q=query.value.trim();let all=Object.values(siteContent).flat();all=all.filter((x,i)=>all.findIndex(y=>y.url===x.url&&y.title===x.title)===i);let found=q?all.filter(x=>x.title.includes(q)||x.source.includes(q)):all;results.innerHTML=`<p class="result-count">${q?'搜索结果':'全部内容'} · ${found.length} 条</p>`+found.map(row).join('')+(found.length?'':'<p class="empty">未找到相关内容，请尝试其他关键词。</p>');}
document.querySelector('#search-open').onclick=()=>{openDialog('站内搜索',true);query.value='';search();query.focus();};form.onsubmit=e=>{e.preventDefault();search();};
function route(){if(location.hash.startsWith('#list/')){const k=location.hash.slice(6);if(siteContent[k]){location.replace(k+'.html');return;}}const current=document.body.dataset.page;document.querySelectorAll('nav a').forEach(a=>{const key=a.getAttribute('href').replace('.html','');const active=key===(current==='home'?'index':current==='reference'?'planning':current);a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});const count=document.querySelector('#item-count');if(count)count.textContent='共 '+(siteContent[document.querySelector('.page-content [data-list]')?.dataset.list||current]?.length||0)+' 条';}
function close(){dialog.close();if(location.hash.startsWith('#list/'))history.replaceState(null,'',location.pathname+location.search+'#'+location.hash.slice(6));}
document.querySelector('.close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}};
window.addEventListener('hashchange',route);route();
const menu=document.querySelector('.mobile-toggle'),nav=document.querySelector('nav');menu.onclick=()=>{const state=nav.classList.toggle('open');menu.setAttribute('aria-expanded',state);};nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}));

// Campus carousel: pause on hover, focus, hidden tabs and reduced motion.
const carousel=document.querySelector('.hero-slides');
if(carousel){
 const host=carousel.closest('.hero'),slides=[...carousel.children],dots=[...host.querySelectorAll('.hero-dots button')],motion=matchMedia('(prefers-reduced-motion: reduce)');
 let index=0,timer=null,paused=motion.matches;
 function show(next){index=(next+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===index);slide.setAttribute('aria-hidden',i!==index);dots[i].classList.toggle('is-active',i===index);dots[i].setAttribute('aria-pressed',i===index);});}
 function stop(){clearInterval(timer);timer=null;}
 function start(){stop();if(!paused&&!document.hidden&&!host.matches(':hover')&&!host.contains(document.activeElement))timer=setInterval(()=>show(index+1),5500);}
 host.querySelector('.hero-prev').onclick=()=>{show(index-1);start();};host.querySelector('.hero-next').onclick=()=>{show(index+1);start();};
 dots.forEach((dot,i)=>dot.onclick=()=>{show(i);start();});
 host.addEventListener('mouseenter',stop);host.addEventListener('mouseleave',start);host.addEventListener('focusin',stop);host.addEventListener('focusout',()=>setTimeout(start,0));
 host.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));}});
 document.addEventListener('visibilitychange',start);motion.addEventListener('change',e=>{paused=e.matches;start();});start();
}

// Switch the child category within the existing planning list.
const categoryButtons=[...document.querySelectorAll('.column-nav [data-category]')];
if(categoryButtons.length){
 const panel=document.querySelector('#planning-results'),list=panel.querySelector('[data-list]');
 categoryButtons.forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.category,items=siteContent[key];
  if(!items||list.dataset.list===key)return;
  list.dataset.list=key;
  list.innerHTML=items.map(row).join('');
  panel.querySelector('.page-list-heading h2').textContent=names[key];
  panel.querySelector('#item-count').textContent='共 '+items.length+' 条';
  categoryButtons.forEach(item=>{const selected=item===button;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));});
 }));
}
