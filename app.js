const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const newestFirst=(a,b)=>(b.publishDate||'').localeCompare(a.publishDate||'');
Object.values(siteContent).forEach(items=>items.sort(newestFirst));
function row(item){
 const d=item.publishDate;
 const external=/^https?:/.test(item.url)?'target="_blank" rel="noopener"':'';
 const date=d?`<time datetime="${d}" aria-label="发布时间：${d}" title="发布时间：${d}"><b>${d.slice(8)}</b><span>${d.slice(0,7).replace('-','.')}</span></time>`:`<span class="date-pending">日期<br>待核实</span>`;
 if(item.relatedUrl)return `<div class="article-row article-entry">${date}<div><h3><a class="article-title" title="${esc(item.title)}" href="${esc(item.url)}" ${external}>${esc(item.title)}</a> <a class="article-related" href="${esc(item.relatedUrl)}" target="_blank" rel="noopener" aria-label="${esc(item.title)}：活动全文">活动全文</a></h3></div></div>`;
 return `<a class="article-row" title="${esc(item.title)}" href="${esc(item.url)}" ${external}>${date}<div><h3>${esc(item.title)}</h3></div></a>`;
}
const newsList=document.querySelector('#news-list');
if(newsList){
 const featured=document.querySelector('.feature>a');
 const featuredUrl=featured?.getAttribute('href');
 const featuredTitle=featured?.querySelector('h3')?.textContent.trim();
 const items=siteContent.news.filter(item=>item.url!==featuredUrl&&item.title.trim()!==featuredTitle).slice(0,3);
 newsList.innerHTML=items.map(row).join('')+'<a class="news-bottom" href="https://www.sztu.edu.cn/" target="_blank" rel="noopener">关注学校发展动态 <span>访问学校官网 ↗</span></a>';
}
document.querySelectorAll('[data-list]').forEach(el=>{
 const items=siteContent[el.dataset.list];
 if(document.body.dataset.page==='home'){el.innerHTML=items.slice(0,3).map(row).join('');return;}
 const pageSize=Number(el.dataset.pageSize),pager=el.nextElementSibling;
 if(!Number.isInteger(pageSize)||pageSize<1||!pager?.classList.contains('list-pagination')){el.innerHTML=items.map(row).join('');return;}
 const pageCount=Math.max(1,Math.ceil(items.length/pageSize));
 function currentPage(){const value=Number(new URL(location.href).searchParams.get('page'));return Number.isInteger(value)&&value>0?Math.min(value,pageCount):1;}
 function pageUrl(page){const url=new URL(location.href);if(page===1)url.searchParams.delete('page');else url.searchParams.set('page',String(page));url.hash='';return url.pathname+url.search;}
 function pageLink(page,label,aria,current=false){return `<a href="${esc(pageUrl(page))}" data-page="${page}" aria-label="${aria}"${current?' aria-current="page"':''}>${label}</a>`;}
 function render(){
  const page=currentPage();
  el.innerHTML=items.slice((page-1)*pageSize,page*pageSize).map(row).join('');
  pager.hidden=pageCount<=1;
  const numbers=[];
  for(let n=1;n<=pageCount;n++){
   if(pageCount<=7||n===1||n===pageCount||Math.abs(n-page)<=1)numbers.push(pageLink(n,n,`第${n}页`,n===page));
   else if(n===page-2||n===page+2)numbers.push('<span class="pagination-ellipsis" aria-hidden="true">…</span>');
  }
  pager.innerHTML=`<span class="pagination-summary" role="status">第 ${page} / ${pageCount} 页</span><div class="pagination-links">${page>1?pageLink(page-1,'上一页','上一页'):'<span class="pagination-disabled" aria-disabled="true">上一页</span>'}${numbers.join('')}${page<pageCount?pageLink(page+1,'下一页','下一页'):'<span class="pagination-disabled" aria-disabled="true">下一页</span>'}</div>`;
 }
 pager.addEventListener('click',event=>{
  const link=event.target.closest('a[data-page]');
  if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  if(Number(link.dataset.page)===currentPage())return;
  history.pushState(null,'',link.href);render();
  const heading=el.closest('.page-content').querySelector('.page-list-heading');
  heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});
  heading.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 });
 window.addEventListener('popstate',render);
 render();
});
const dialog=document.querySelector('dialog'),form=document.querySelector('#search-form'),results=document.querySelector('#dialog-results'),query=document.querySelector('#query');
function openDialog(title,search=false){document.querySelector('#dialog-title').textContent=title;form.hidden=!search;if(!dialog.open)dialog.showModal();}
function search(){let q=query.value.trim();let all=Object.values(siteContent).flat();all=all.filter((x,i)=>all.findIndex(y=>y.url===x.url&&y.title===x.title)===i).sort(newestFirst);let found=q?all.filter(x=>x.title.includes(q)||(x.source||'').includes(q)):all;results.innerHTML=`<p class="result-count">${q?'搜索结果':'全部内容'} · ${found.length} 条</p>`+found.map(row).join('')+(found.length?'':'<p class="empty">未找到相关内容，请尝试其他关键词。</p>');}
document.querySelector('#search-open').onclick=()=>{openDialog('站内搜索',true);query.value='';search();query.focus();};form.onsubmit=e=>{e.preventDefault();search();};
function route(){if(location.hash.startsWith('#list/')){const k=location.hash.slice(6);if(siteContent[k]){location.replace(k+'.html');return;}}const current=document.body.dataset.page;document.querySelectorAll('nav a').forEach(a=>{const key=a.getAttribute('href').replace('.html','');const active=key===(current==='home'?'index':current);a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});const count=document.querySelector('#item-count');if(count)count.textContent='共 '+(siteContent[document.querySelector('.page-content [data-list]')?.dataset.list||current]?.length||0)+' 条';}
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
