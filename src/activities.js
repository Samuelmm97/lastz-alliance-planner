import {windows,effectiveSeconds,parseScreens,duration} from './planner.js';
export const categories={research:'Research',heroes:'Heroes',vehicles:'Vehicles',troops:'Troop training'};
export function eventTarget(category,seconds,now=new Date(),offset=-120){
 const theme={research:'Science',heroes:'Heroes',vehicles:'Vehicle',troops:'Troops'}[category];
 const earliest=now.getTime()+seconds*1000;
 const target=windows(new Date(earliest),offset,Math.max(15,Math.ceil(seconds/86400)+15)).find(w=>w.theme===theme&&(w.duel===theme||w.duel==='Balanced'));
 if(!target)return null;
 const finish=Math.max(earliest,target.start+60000);
 return {start:Math.max(now.getTime(),finish-seconds*1000),finish,theme,duel:target.duel};
}
export function researchCandidates(text,catalog){
 const detected=parseScreens(text,[...new Set(catalog.map(r=>r.technology))],0,20).buildings;
 return detected.map(b=>{
  const matches=catalog.filter(r=>r.technology===b.name);
  const trees=[...new Set(matches.map(r=>r.tree_id))];
  const visible=trees.filter(t=>text.toLowerCase().includes(matches.find(r=>r.tree_id===t).research_tree.toLowerCase()));
  const tree=visible.length===1?visible[0]:trees.length===1?trees[0]:'';
  const ids=[...new Set(matches.filter(r=>r.tree_id===tree).map(r=>r.technology_id))];
  return {...b,category:'research',tree,technology:ids.length===1?ids[0]:'',speed:0,minutes:0,goal:'',owned:'',needed:''};
 });
}
export function activityPlan(item,catalog,buildings,items,now,offset){
 let seconds=0,notes=[];
 if(item.category==='research'){
  const row=catalog.find(r=>r.tree_id===item.tree&&r.technology_id===item.technology&&r.from_level===item.level);
  if(!row)return {title:item.name,notes:['No next level in the table. Check this research in-game.'],target:null,seconds:0};
  seconds=effectiveSeconds(row.base_duration_seconds,item.speed);
  if(!buildings.some(b=>b.name==='Laboratory'&&b.level>=row.required_laboratory_level))notes.push(`Confirm Laboratory Lv. ${row.required_laboratory_level}.`);
  for(const p of row.prerequisites||[])if(!items.some(x=>x.category==='research'&&x.tree===item.tree&&x.technology===p.id&&x.level>=p.requiredLevel))notes.push(`Confirm prerequisite ${p.id.replaceAll('-',' ')} Lv. ${p.requiredLevel}.`);
  if(row.tree_unlock_requirements?.season)notes.push(`Confirm tree unlock: season ${row.tree_unlock_requirements.season}, day ${row.tree_unlock_requirements.day??'unknown'}.`);
  if(notes.length)notes.push('Timing below assumes all requirements have been met and a research queue is free.');
  notes.push('Estimated costs: '+Object.entries(row.costs).map(([k,v])=>`${k}: ${v===null?'unknown':Number(v).toLocaleString()}`).join(' · '));
 }else if(item.category==='troops')seconds=Math.ceil(item.minutes*60);
 else{
  notes.push(item.goal);
  if(item.owned!==''&&item.needed!=='')notes.push(Number(item.owned)>=Number(item.needed)?'You have enough of the item you entered. Confirm all other costs.':`Save ${Number(item.needed)-Number(item.owned)} more of the item you entered.`);
  else notes.push('Confirm required items and costs in-game.');
 }
 if(item.active)return {title:item.name,notes:['Already in progress. Use the in-game remaining timer; this goal is skipped.'],target:null,seconds};
 notes.push('Each goal is a separate scenario. Shared items and speedups are not reserved. Confirm current event scoring in-game.');
 return {title:item.name+(item.category==='research'?` ${item.level} → ${item.level+1}`:''),seconds,notes,target:eventTarget(item.category,seconds,now,offset)};
}
export function mountActivities(container,onChange){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let items=[],catalog=[],loading;
 try{items=JSON.parse(localStorage.getItem('lastz-activities')||'[]');if(!Array.isArray(items))items=[];}catch{}
 const save=()=>{localStorage.setItem('lastz-activities',JSON.stringify(items));onChange?.();};
 async function load(){if(!loading)loading=fetch(new URL('../research.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Research data could not load.');return r.json();}).then(d=>{catalog=d.upgrades;return catalog;}).catch(e=>{loading=null;throw e;});return loading;}
 const options=(values,current)=>values.map(([v,label])=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(label)}</option>`).join('');
 function render(){container.innerHTML='<h3>Plan other upgrades</h3><p>Open only the sections you need.</p>'+Object.entries(categories).map(([key,label])=>`<details ${items.some(i=>i.category===key)?'open':''}><summary>${label} · ${items.filter(i=>i.category===key).length} goals</summary><p class="muted">${key==='research'?'Choose the tree and technology. Enter your research speed bonus.':key==='troops'?'Enter the batch duration shown in-game. It already includes your training bonus.':'Add the exact name and upgrade you want. For heroes, this can be a level, star, skill or equipment upgrade.'}</p>${items.filter(i=>i.category===key).map(i=>`<div class="activity" data-activity="${i.id}"><div class="fields">${key==='research'?`<label>Research tree<select data-field="tree"><option value="">Choose a tree</option>${options([...new Map(catalog.map(r=>[r.tree_id,r.research_tree])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),i.tree)}</select></label><label>Technology<select data-field="technology"><option value="">Choose ${esc(i.name||'technology')}</option>${options([...new Map(catalog.filter(r=>r.tree_id===i.tree).map(r=>[r.technology_id,r.technology+' ('+r.technology_id+')'])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),i.technology)}</select></label><label>Current level<input data-field="level" type="number" min="0" max="20" value="${i.level??''}"></label><label>Research speed bonus (%)<input data-field="speed" type="number" min="0" max="5000" step="0.01" value="${i.speed}"></label>`:`<label>${key==='heroes'?'Hero name':key==='vehicles'?'Vehicle / part name':'Troop type and tier'}<input data-field="name" maxlength="80" value="${esc(i.name)}" placeholder="Copy the name from the game"></label>${key==='troops'?`<label>Batch duration (minutes)<input data-field="minutes" type="number" min="1" max="1000000" value="${i.minutes||''}"></label>`:`<label>Upgrade goal<input data-field="goal" maxlength="120" value="${esc(i.goal)}" placeholder="e.g. skill 3 to level 4"></label><label>Items owned (optional)<input data-field="owned" type="number" min="0" max="1000000000" value="${i.owned}"></label><label>Items needed (same item)<input data-field="needed" type="number" min="0" max="1000000000" value="${i.needed}"></label>`}`}</div><label class="active"><input data-field="active" type="checkbox" ${i.active?'checked':''}>Already in progress</label><button class="textbutton" data-delete="${i.id}">Remove goal</button></div>`).join('')}<button data-add="${key}" class="textbutton">+ Add ${label.toLowerCase()} goal</button></details>`).join('');}
 container.onchange=e=>{const i=items.find(i=>i.id===e.target.closest('[data-activity]')?.dataset.activity);if(!i)return;const k=e.target.dataset.field;if(!k)return;i[k]=k==='active'?e.target.checked:['speed','minutes','level'].includes(k)?(e.target.value===''?null:Number(e.target.value)):e.target.value;if(k==='tree'){i.technology='';render();}if(k==='technology')i.name=catalog.find(r=>r.tree_id===i.tree&&r.technology_id===i.technology)?.technology||'';save();};
 container.onclick=async e=>{if(e.target.dataset.delete){items=items.filter(i=>i.id!==e.target.dataset.delete);save();render();}const key=e.target.dataset.add;if(!key)return;e.target.disabled=true;try{if(key==='research')await load();items.push({id:crypto.randomUUID(),category:key,name:'',tree:'',technology:'',level:0,speed:0,minutes:0,goal:'',owned:'',needed:'',active:false});save();render();}catch(err){alert(err.message);e.target.disabled=false;}};
 render();if(items.some(i=>i.category==='research'))load().then(render).catch(()=>{});
 return {count:()=>items.length,async read(text,key){if(key==='research'){await load();const found=researchCandidates(text,catalog);const bonus=text.match(/Research Speed[^\n%]*?(\d+(?:[.,]\d+)?)\s*%/i);if(bonus)found.forEach(i=>i.speed=Number(bonus[1].replace(',','.')));items.push(...found);save();render();return found.length;}return 0;},async plan(buildings,now,offset){container.querySelectorAll('[data-activity]').forEach(row=>{const i=items.find(x=>x.id===row.dataset.activity);row.querySelectorAll('[data-field]').forEach(el=>{const k=el.dataset.field;i[k]=k==='active'?el.checked:['speed','minutes','level'].includes(k)?(el.value===''?null:Number(el.value)):el.value;});if(i.category==='research')i.name=catalog.find(r=>r.tree_id===i.tree&&r.technology_id===i.technology)?.technology||i.name;});save();if(items.some(i=>i.category==='research'))await load();for(const i of items){if(i.category==='research'&&(!i.tree||!i.technology||!Number.isInteger(i.level)||i.level<0||i.level>20||!Number.isFinite(i.speed)||i.speed<0||i.speed>5000))throw Error('Choose a research tree, technology, current level and valid research bonus.');if(i.category!=='research'&&(!i.name.trim()||(i.category==='troops'?!(i.minutes>0&&i.minutes<=1000000):!i.goal.trim())))throw Error('Check each goal’s name and upgrade or training duration.');if(['owned','needed'].some(k=>i[k]!==''&&(!Number.isFinite(Number(i[k]))||Number(i[k])<0||Number(i[k])>1e9)))throw Error('Check your item quantities.');}return items.map(i=>activityPlan(i,catalog,buildings,items,now,offset));},text(plans){return plans.map(p=>`${p.title}: ${p.seconds?duration(p.seconds)+'. ':''}${p.target?'Start '+new Date(p.target.start).toLocaleString()+', finish / spend '+new Date(p.target.finish).toLocaleString()+` (${p.target.duel} + ${p.target.theme}). `:''}${p.notes.join(' ')}`).join('\n');},html(plans){return plans.map(p=>`<article class="recommendation"><h3>${esc(p.title)}</h3>${p.seconds?`<p>Estimated duration: ${duration(p.seconds)}</p>`:''}${p.target?`<div class="timing"><div><small>${p.seconds?'Suggested start':'Upgrade / spend during'}</small><strong>${esc(new Date(p.target.start).toLocaleString())}</strong></div><div><small>${esc(p.target.duel)} + ${esc(p.target.theme)}</small><strong>${esc(new Date(p.target.finish).toLocaleString())}</strong></div></div>`:''}${p.notes.map(n=>`<p class="muted">${esc(n)}</p>`).join('')}</article>`).join('');}};
}
