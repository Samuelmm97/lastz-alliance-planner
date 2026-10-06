import {themeArt,itemArt,icon} from './visuals.js';
export const packTargets={
 construction:{label:'Build',theme:'Shelter',items:{construction:['Construction speedups','hours'],universal:['Universal speedups','hours']}},
 heroes:{label:'Heroes',theme:'Heroes',items:{shards:['Orange universal shards','shards'],books:['Orange skill books','books'],core:['Power cores','cores'],alloy:['Enhancement alloys','alloys'],recruit:['Prime recruit tickets','tickets']}},
 research:{label:'Research',theme:'Science',items:{research:['Research speedups','hours'],universal:['Universal speedups','hours']}}
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function rankPacks(offers){
 return offers.filter(p=>Number.isFinite(p.price)&&p.price>0&&Number.isFinite(p.quantity)&&p.quantity>0).map(p=>({...p,perPrice:p.quantity/p.price,costPerItem:p.price/p.quantity})).sort((a,b)=>b.perPrice-a.perPrice);
}
export function mountPackValue(container){
 let saved={target:'construction',item:'construction',offers:[{name:'',price:'',quantity:''},{name:'',price:'',quantity:''}]};
 try{const data=JSON.parse(localStorage.getItem('lastz-pack-comparison'));if(data&&packTargets[data.target]?.items[data.item]&&Array.isArray(data.offers)&&data.offers.length>=2&&data.offers.length<=6)saved={target:data.target,item:data.item,offers:data.offers.map(p=>({name:String(p.name??''),price:String(p.price??''),quantity:String(p.quantity??'')}))};}catch{}
 function persist(){try{localStorage.setItem('lastz-pack-comparison',JSON.stringify(saved));}catch{}}
 function results(){
  const unit=packTargets[saved.target].items[saved.item][1],ranked=rankPacks(saved.offers.map((p,i)=>({...p,name:p.name.trim()||`Pack ${i+1}`,price:Number(p.price),quantity:Number(p.quantity)})));
  const out=container.querySelector('[data-pack-results]');
  if(ranked.length<2){out.innerHTML='<p class="notice">Add a price and useful quantity for at least two packs to compare.</p>';return;}
  const best=ranked[0].perPrice;
  out.innerHTML=`<h3>Value for your chosen item</h3>${ranked.map((p,i)=>`<article class="pack-result"><div><strong>${esc(p.name)}</strong><span class="badge">${Math.abs(p.perPrice-best)<best*1e-10?'Best item value':`${Math.round((1-p.perPrice/best)*100)}% fewer per 1 spent`}</span></div><div class="pack-bar" aria-hidden="true"><span style="width:${p.perPrice/best*100}%"></span></div><p><strong>${p.perPrice.toLocaleString(undefined,{maximumFractionDigits:2})} ${unit}</strong> per 1 spent · ${p.price.toLocaleString()} total</p></article>`).join('')}${ranked.length<saved.offers.length?'<p class="muted">Incomplete packs are left out of this comparison.</p>':''}`;
 }
 function render(){
  const goal=packTargets[saved.target];
  container.innerHTML=`<div class="cardhead"><h2>Which pack goes further?</h2><span class="badge">Try it</span></div><p>Compare the items you need. No purchase required.</p><div class="pack-goals" aria-label="Pack goal">${Object.entries(packTargets).map(([key,g])=>`<button data-pack-goal="${key}" aria-pressed="${saved.target===key}">${themeArt(g.theme)}${g.label}</button>`).join('')}</div><label class="pack-item-select">What do you need?<select data-pack-item>${Object.entries(goal.items).map(([key,[label]])=>`<option value="${key}" ${saved.item===key?'selected':''}>${label}</option>`).join('')}</select></label><div class="visual-heading pack-unit">${itemArt(saved.item)}<strong>${goal.items[saved.item][0]}</strong><span class="badge">Count in ${goal.items[saved.item][1]}</span></div><div class="pack-offers">${saved.offers.map((p,i)=>`<fieldset class="pack-offer"><legend>Pack ${i+1}</legend><label>Name (optional)<input data-pack-field="name" data-offer="${i}" maxlength="80" value="${esc(p.name)}" placeholder="e.g. Daily offer"></label><div class="fields"><label>Price<input data-pack-field="price" data-offer="${i}" type="number" min="0.01" step="any" inputmode="decimal" value="${esc(p.price)}" placeholder="4.99"></label><label>Useful ${goal.items[saved.item][1]}<input data-pack-field="quantity" data-offer="${i}" type="number" min="0.01" step="any" inputmode="decimal" value="${esc(p.quantity)}" placeholder="Quantity"></label></div></fieldset>`).join('')}</div><div class="actions"><button data-pack-add ${saved.offers.length>=6?'disabled':''}>+ Add a pack</button><button data-pack-clear>Clear comparison</button></div><div data-pack-results aria-live="polite"></div><details class="compact-help"><summary>${icon('help')}How to compare fairly</summary><p>Use current prices from your game, in the same currency. Count only the selected item you will actually use. For speedups, convert everything to hours: 60 minutes = 1 hour; 24 hours = 1 day.</p><p>This compares one item at a time. Other contents, purchase limits and multi-day rewards are not valued. Universal speedups can count toward building or research; don’t count the same speedups twice. A pack with the best item value may still cost more overall.</p><p>Your comparison stays on this device. Check the Timeline for when to use the items.</p></details>`;
  results();
 }
 container.onclick=e=>{const goal=e.target.closest('[data-pack-goal]');if(goal){saved.target=goal.dataset.packGoal;saved.item=Object.keys(packTargets[saved.target].items)[0];saved.offers=saved.offers.map(p=>({...p,quantity:''}));persist();render();}else if(e.target.closest('[data-pack-add]')&&saved.offers.length<6){saved.offers.push({name:'',price:'',quantity:''});persist();render();}else if(e.target.closest('[data-pack-clear]')){saved.offers=[{name:'',price:'',quantity:''},{name:'',price:'',quantity:''}];persist();render();}};
 container.onchange=e=>{if(e.target.matches('[data-pack-item]')){saved.item=e.target.value;saved.offers=saved.offers.map(p=>({...p,quantity:''}));persist();render();}};
 container.oninput=e=>{const field=e.target.dataset.packField;if(!field)return;saved.offers[Number(e.target.dataset.offer)][field]=e.target.value;persist();results();};
 render();
}
