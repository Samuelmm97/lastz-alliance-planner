import {mountInventoryGuide} from './inventory-guide.js';
import {windows} from './planner.js';
const advice={
 Shelter:{title:'Construction',use:'Construction speedups, or universal speedups assigned to buildings.',action:'Finish eligible building upgrades in this window. Start long upgrades earlier so they finish here.'},
 Science:{title:'Research',use:'Research speedups, or universal speedups assigned to research.',action:'Finish eligible research in this window. Use your research bonus when planning the start.'},
 Heroes:{title:'Heroes',use:'Hero EXP, shards, skill items or equipment materials that the current event rewards.',action:'Save your hero items for this window. Check which upgrade types earn points before spending.'},
 Vehicle:{title:'Vehicles',use:'Vehicle upgrade items and part materials that the current event rewards.',action:'Upgrade eligible vehicle parts in this window. Check the scoring list before spending.'},
 Troops:{title:'Troop training',use:'Training speedups, or universal speedups assigned to training.',action:'Finish eligible training batches in this window. Start earlier using the duration shown in-game.'}
};
export function timelineState(now=new Date(),offset=-120){
 const slots=windows(now,offset,8).slice(0,42).map(w=>({...w,...advice[w.theme],double:w.duel===w.theme||w.duel==='Balanced'}));
 return {slots,progress:Math.max(0,Math.min(1,(now.getTime()-slots[0].start)/(slots[0].end-slots[0].start))),remaining:Math.max(0,slots[0].end-now.getTime())};
}
export function mountTimeline(container,getOffset){
 container.innerHTML=`<div class="cardhead"><h2>What to use, and when</h2><span class="badge">Live timeline</span></div><p class="muted">Your local time. Swipe the timeline or tap a window to see what to use.</p><div class="timeline-controls"><button data-move="-1" aria-label="Earlier event windows">Previous</button><button id="timeline-now" class="primary">Back to now</button><button data-move="1" aria-label="Later event windows">Next</button></div><div class="timeline-scroll" tabindex="0" aria-label="Upcoming event timeline"><div class="timeline-track"></div></div><div class="timeline-detail" aria-live="polite"></div><div id="inventory-guide"></div><p class="muted">Green windows match Full Preparedness with the Duel theme or Balanced day. Eligibility and rewards depend on the current in-game scoring list. Speedup budgets are shared across upgrades.</p>`;
 const scroll=container.querySelector('.timeline-scroll'),track=container.querySelector('.timeline-track'),detail=container.querySelector('.timeline-detail');
 const inventory=mountInventoryGuide(container.querySelector('#inventory-guide'));
 let slots=[],selected=null,signature='',follow=true;
 const stamp=n=>new Date(n).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
 const clock=n=>new Date(n).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
 function select(index){selected=slots[index]?.start??slots[0].start;renderDetail();track.querySelectorAll('.timeline-slot').forEach((el,i)=>el.setAttribute('aria-pressed',String(slots[i].start===selected)));}
 function renderDetail(){const w=slots.find(w=>w.start===selected)||slots[0];inventory.show(w.theme);detail.innerHTML=`<div class="timeline-category">${w.title}${w.double?' <span class="badge">Matching Duel day</span>':''}</div><strong>${stamp(w.start)} to ${clock(w.end)}</strong><p><b>Use:</b> ${w.use}</p><p>${w.action}</p><p class="muted">Full Preparedness: ${w.theme} / Alliance Duel: ${w.duel}</p><div class="timeline-countdown"></div>`;}
 function update(){const state=timelineState(new Date(),getOffset()),key=state.slots[0].start+':'+getOffset();slots=state.slots;if(key!==signature){signature=key;track.innerHTML=slots.map((w,i)=>`<button class="timeline-slot ${w.double?'matching':''}" data-slot="${i}" aria-pressed="false"><small>${new Date(w.start).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</small><strong>${w.title}</strong><span>${clock(w.start)} - ${clock(w.end)}</span><small>${w.double?'Matching Duel day':'Duel: '+w.duel}</small>${i===0?'<span class="timeline-marker">NOW</span><span class="timeline-progress"></span>':''}</button>`).join('');if(follow||!slots.some(w=>w.start===selected))selected=slots[0].start;select(slots.findIndex(w=>w.start===selected));}
  const percent=state.progress*100;track.querySelector('.timeline-marker').style.left=percent+'%';track.querySelector('.timeline-progress').style.width=percent+'%';const current=selected===slots[0].start;detail.querySelector('.timeline-countdown').textContent=current?'Current window ends in '+[Math.floor(state.remaining/3600000),Math.floor(state.remaining/60000)%60,Math.floor(state.remaining/1000)%60].map(n=>String(n).padStart(2,'0')).join(':'):'Upcoming window. Save these items until the eligible event starts.';
  if(follow)scroll.scrollLeft=Math.max(0,state.progress*240-24);
 }
 track.onclick=e=>{const button=e.target.closest('[data-slot]');if(button){follow=Number(button.dataset.slot)===0;select(Number(button.dataset.slot));update();}};
 container.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{follow=false;scroll.scrollBy({left:Number(b.dataset.move)*scroll.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
 container.querySelector('#timeline-now').onclick=()=>{follow=true;select(0);update();};
 scroll.addEventListener('scroll',()=>{const expected=Math.max(0,timelineState(new Date(),getOffset()).progress*240-24);if(Math.abs(scroll.scrollLeft-expected)>3)follow=false;},{passive:true});
 scroll.addEventListener('pointerdown',()=>follow=false);scroll.addEventListener('wheel',()=>follow=false,{passive:true});scroll.addEventListener('keydown',()=>follow=false);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
 update();setInterval(update,1000);return {update};
}
