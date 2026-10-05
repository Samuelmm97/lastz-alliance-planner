import {mountInventoryGuide} from './inventory-guide.js';
import {windows} from './planner.js';
const titles={Shelter:'Construction',Science:'Research',Heroes:'Heroes',Vehicle:'Vehicles',Troops:'Troop training'};
export function timelineAdvice(w){
 const overlap=w.duel===w.theme||w.duel==='Balanced';
 const double=overlap&&w.theme!=='Heroes';
 const title=titles[w.theme];
 if(w.theme==='Heroes')return {title,double:false,use:'Hero EXP: Full Preparedness only.',action:'Use Hero EXP to level your heroes in this window. Hero EXP does not score in Alliance Duel. Save shards, skill books and equipment materials for their eligible Duel tasks.'};
 if(w.theme==='Troops')return {title,double,use:double?'Training speedups, or universal speedups assigned to training.':'Natural training completion only. Save training and universal speedups.',action:double?'Finish or assemble eligible units here. Speedups are recommended only because this window also matches Alliance Duel.':'Let units finish naturally in this window. Do not spend speedups here; wait for a training Full Preparedness window that also matches Alliance Duel.'};
 const items={Shelter:'Construction speedups, or universal speedups assigned to buildings.',Science:'Research speedups, or universal speedups assigned to research.',Vehicle:'Eligible vehicle upgrade materials.'};
 return {title,double,use:double?items[w.theme]:'Save '+(w.theme==='Vehicle'?'vehicle upgrade materials.':w.theme==='Shelter'?'construction and universal speedups.':'research and universal speedups.'),action:double?'Use only actions rewarded by both Full Preparedness and Alliance Duel in this window.':'Wait for the next matching Full Preparedness + Alliance Duel window before spending these items.'};
}
export function trainingSchedule(goals,now=new Date(),offset=-120){
 return goals.filter(g=>!g.active&&Number.isFinite(g.minutes)&&g.minutes>0&&g.minutes<=1000000).map(g=>{
  const ms=Math.ceil(g.minutes*60)*1000,earliest=now.getTime()+ms;
  const w=windows(new Date(earliest),offset,2).find(w=>w.theme==='Troops');
  const finish=Math.max(earliest,w.start+60000);
  return {name:g.name||'Training batch',start:finish-ms,finish,window:w,double:w.duel==='Troops'||w.duel==='Balanced'};
 });
}
export function timelineState(now=new Date(),offset=-120,goals=[]){
 const training=trainingSchedule(goals,now,offset);
 const slots=windows(now,offset,8).slice(0,42).map(w=>({...w,...timelineAdvice(w),trainingStarts:training.filter(t=>t.start>=w.start&&t.start<w.end),trainingFinishes:training.filter(t=>t.finish>=w.start&&t.finish<w.end)}));
 return {slots,training,progress:Math.max(0,Math.min(1,(now.getTime()-slots[0].start)/(slots[0].end-slots[0].start))),remaining:Math.max(0,slots[0].end-now.getTime())};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountTimeline(container,getOffset,getTrainingGoals=()=>[]){
 container.innerHTML=`<div class="cardhead"><h2>What to use, and when</h2><span class="badge">Live timeline</span></div><p class="muted">Your local time. Spend speedups only in a Full Preparedness + Alliance Duel overlap. Hero EXP can use any Heroes Full Preparedness window.</p><div class="timeline-controls"><button data-move="-1" aria-label="Earlier event windows">Previous</button><button id="timeline-now" class="primary">Back to now</button><button data-move="1" aria-label="Later event windows">Next</button></div><div class="timeline-training"><strong>When should I start training?</strong><p class="muted">Enter the batch timer shown in-game. This plans a natural finish, without speedups. Troop goals entered below are included too. Each batch needs a free training queue.</p><div class="timeline-training-fields"><label>Hours<input id="training-hours" type="number" min="0" max="16666" step="1" placeholder="0"></label><label>Minutes<input id="training-minutes" type="number" min="0" max="59" step="1" placeholder="0"></label></div><div class="training-summary" aria-live="polite"></div></div><div class="timeline-scroll" tabindex="0" aria-label="Upcoming event timeline"><div class="timeline-track"></div></div><div id="inventory-guide"></div><div class="timeline-detail" aria-live="polite"></div><p class="muted">Green windows are candidates for actions that score in both events. Hero EXP is Full Preparedness only. Natural training can finish in any training Full Preparedness window. Confirm both live task lists before spending.</p>`;
 const scroll=container.querySelector('.timeline-scroll'),track=container.querySelector('.timeline-track'),detail=container.querySelector('.timeline-detail');
 const hours=container.querySelector('#training-hours'),minutes=container.querySelector('#training-minutes'),summary=container.querySelector('.training-summary');
 try{const saved=Number(localStorage.getItem('lastz-training-minutes'));if(saved>0&&saved<=1000000){hours.value=Math.floor(saved/60);minutes.value=saved%60;}}catch{}
 const goals=()=>{const h=Number(hours.value),m=Number(minutes.value);return [...getTrainingGoals(),...(Number.isInteger(h)&&h>=0&&h<=16666&&Number.isInteger(m)&&m>=0&&m<60&&h*60+m>0?[{name:'Training batch',minutes:h*60+m}]:[])];};
 const inventory=mountInventoryGuide(container.querySelector('#inventory-guide'));
 let slots=[],selected=null,signature='',follow=true;
 const stamp=n=>new Date(n).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
 const clock=n=>new Date(n).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
 function select(index){selected=slots[index]?.start??slots[0].start;renderDetail();track.querySelectorAll('.timeline-slot').forEach((el,i)=>el.setAttribute('aria-pressed',String(slots[i].start===selected)));}
 function trainingText(t){return `<p><b>${esc(t.name)}</b><br>Start: ${stamp(t.start)}<br>Finish / assemble: ${stamp(t.finish)}<br>${t.double?'Full Preparedness + Alliance Duel':'Full Preparedness only'}. No speedups.</p>`;}
 function renderDetail(){const w=slots.find(w=>w.start===selected)||slots[0],next=slots.find(x=>x.theme===w.theme&&x.double&&x.start>w.start);inventory.show(w.theme);detail.innerHTML=`<div class="timeline-category">${w.title}${w.double?' <span class="badge">Double dip</span>':''}</div><strong>${stamp(w.start)} to ${clock(w.end)}</strong><p><b>${w.double||w.theme==='Heroes'?'Use:':'Plan:'}</b> ${w.use}</p><p>${w.action}</p>${!w.double&&w.theme!=='Heroes'&&next?`<p><b>Next double dip:</b> ${stamp(next.start)} to ${clock(next.end)}</p>`:''}<p class="muted">Full Preparedness: ${w.theme} / Alliance Duel: ${w.duel}</p>${w.trainingStarts.length?`<div class="training-actions"><strong>Start training in this window</strong>${w.trainingStarts.map(trainingText).join('')}</div>`:''}${w.trainingFinishes.length?`<div class="training-actions"><strong>Finish / assemble in this window</strong>${w.trainingFinishes.map(trainingText).join('')}</div>`:''}<div class="timeline-countdown"></div>`;}
 function update(){const state=timelineState(new Date(),getOffset(),goals()),key=state.slots[0].start+':'+getOffset()+':'+JSON.stringify(goals());slots=state.slots;if(key!==signature){signature=key;track.innerHTML=slots.map((w,i)=>`<button class="timeline-slot ${w.double?'matching':''}" data-slot="${i}" aria-pressed="false"><small>${new Date(w.start).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</small><strong>${w.title}</strong><span>${clock(w.start)} - ${clock(w.end)}</span><small>${w.double?'Double dip':w.theme==='Heroes'?'Hero EXP: FP only':'Save speedups / materials'}</small>${w.trainingStarts.map(t=>`<span class="training-tag">Start training ${clock(t.start)}</span>`).join('')}${w.trainingFinishes.map(t=>`<span class="training-tag">Finish training ${clock(t.finish)}</span>`).join('')}${i===0?'<span class="timeline-marker">NOW</span><span class="timeline-progress"></span>':''}</button>`).join('');if(follow||!slots.some(w=>w.start===selected))selected=slots[0].start;select(slots.findIndex(w=>w.start===selected));summary.innerHTML=state.training.length?state.training.map(trainingText).join(''):'<p class="muted">Add a batch duration to see its start and finish times on the timeline.</p>';}
  const percent=state.progress*100;track.querySelector('.timeline-marker').style.left=percent+'%';track.querySelector('.timeline-progress').style.width=percent+'%';const current=selected===slots[0].start;detail.querySelector('.timeline-countdown').textContent=current?'Current window ends in '+[Math.floor(state.remaining/3600000),Math.floor(state.remaining/60000)%60,Math.floor(state.remaining/1000)%60].map(n=>String(n).padStart(2,'0')).join(':'):'Upcoming window. Follow the use / save instructions above.';
  if(follow)scroll.scrollLeft=0;
 }
 track.onclick=e=>{const button=e.target.closest('[data-slot]');if(button){follow=Number(button.dataset.slot)===0;select(Number(button.dataset.slot));update();}};
 container.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{follow=false;scroll.scrollBy({left:Number(b.dataset.move)*scroll.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
 container.querySelector('#timeline-now').onclick=()=>{follow=true;select(0);update();};
 scroll.addEventListener('scroll',()=>{const expected=0;if(Math.abs(scroll.scrollLeft-expected)>3)follow=false;},{passive:true});
 scroll.addEventListener('pointerdown',()=>follow=false);scroll.addEventListener('wheel',()=>follow=false,{passive:true});scroll.addEventListener('keydown',()=>follow=false);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
 hours.oninput=minutes.oninput=()=>{try{if(hours.validity.valid&&minutes.validity.valid)localStorage.setItem('lastz-training-minutes',String(Number(hours.value)*60+Number(minutes.value)));}catch{}update();};
 update();setInterval(update,1000);return {update};
}
