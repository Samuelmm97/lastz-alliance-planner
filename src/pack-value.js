import {verifiedCustomRates} from './shop-prices.js';
import { mountPackCatalog } from './pack-catalog.js';
import {itemArt,icon} from './visuals.js';
export const packItems={gems:['Gems','gems'],construction:['Construction speedups','hours'],research:['Research speedups','hours'],universal:['Universal speedups','hours'],shards:['Orange universal shards','shards'],purpleShards:['Purple universal shards','shards'],blueShards:['Blue universal shards','shards'],books:['Orange skill books','books'],core:['Power cores','cores'],alloy:['Enhancement alloys','alloys'],recruit:['Prime recruit tickets','tickets'],other:['Other item','items']};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const numeric=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;
export function valuePack(pack,rates){
 const cost=numeric(pack.goldBars);let gemValue=0,missing=0,count=0;
 const lines=pack.contents.map(line=>{
  const quantity=numeric(line.quantity),rate=line.item==='gems'?1:numeric(line.item==='other'?line.gemRate:rates[line.item]);
  const empty=line.quantity===''||line.quantity===null||line.quantity===undefined;
  if(empty)return {...line,value:null,empty:true};
  count++;
  if(quantity===null||quantity<0||rate===null||rate<0){missing++;return {...line,value:null};}
  const value=quantity*rate;if(!Number.isFinite(value)){missing++;return {...line,value:null};}
  gemValue+=value;return {...line,value};
 });
 const complete=count>0&&missing===0&&cost!==null&&cost>0&&Number.isFinite(gemValue)&&Number.isFinite(gemValue/cost);
 return {...pack,lines,gemValue,missing,complete,gemsPerBar:complete?gemValue/cost:null};
}
export function rankPacks(packs,rates){return packs.map(p=>valuePack(p,rates)).filter(p=>p.complete).sort((a,b)=>b.gemsPerBar-a.gemsPerBar);}
const emptyPack=()=>({name:'',goldBars:'',contents:[{item:'gems',quantity:'',gemRate:''}]});
const art=key=>key==='gems'?icon('gem'):key==='other'?icon('target'):itemArt(key);
export function mountCustomPackValue(container){
 let saved={version:2,rates:{...verifiedCustomRates},packs:[emptyPack(),emptyPack()]};
 try{const data=JSON.parse(localStorage.getItem('lastz-pack-gem-value'));if(data?.version===2&&data.rates&&Array.isArray(data.packs)&&data.packs.length>=2&&data.packs.length<=6&&data.packs.every(p=>Array.isArray(p.contents)&&p.contents.length<=30&&p.contents.every(l=>packItems[l.item])))saved=data;}catch{}
 saved.rates={...verifiedCustomRates,...saved.rates};
 const fmt=n=>n.toLocaleString(undefined,{maximumFractionDigits:2});
 function persist(){try{localStorage.setItem('lastz-pack-gem-value',JSON.stringify(saved));}catch{}}
 function results(){
  const values=saved.packs.map((p,i)=>valuePack({...p,name:String(p.name).trim()||`Pack ${i+1}`},saved.rates)),ranked=rankPacks(saved.packs,saved.rates),best=ranked[0]?.gemsPerBar;
  container.querySelector('[data-pack-results]').innerHTML=`<h3>Gem value per gold bar</h3>${values.map(p=>`<article class="pack-result"><div><strong>${esc(p.name)}</strong><span class="badge">${!p.complete?'Needs details':ranked.length<2?'Ready to compare':p.gemsPerBar===best?'Best gem value':`${fmt(p.gemsPerBar)} gems / bar`}</span></div>${p.complete?`<div class="pack-bar" aria-hidden="true"><span style="width:${best>0?p.gemsPerBar/best*100:0}%"></span></div><p><strong>${fmt(p.gemsPerBar)} gems / gold bar</strong> Â· ${fmt(p.gemValue)} gems total Ã· ${fmt(Number(p.goldBars))} bars</p>`:`<p>${p.missing?`${p.missing} item(s) need a quantity or gem price. `:''}${!numeric(p.goldBars)||numeric(p.goldBars)<0?'Enter the gold-bar cost. ':''}Add pack contents to calculate its full value.</p>`}<details class="compact-help"><summary>Item value breakdown</summary>${p.lines.filter(l=>!l.empty).map(l=>`<p>${esc(packItems[l.item][0])}: ${esc(l.quantity)} ${packItems[l.item][1]} â†’ ${l.value===null?'gem price needed':fmt(l.value)+' gems'}</p>`).join('')||'<p>No contents entered yet.</p>'}</details></article>`).join('')}`;
 }
 function render(){
  container.innerHTML=`<div class="cardhead"><h2>Get more gem value</h2><span class="badge">Try it</span></div><p>Pack value = all contents priced in gems. Compare gems per gold bar.</p><details class="compact-help pack-rates" open><summary>${icon('gem')}Regular shop gem prices</summary><p>Regular in-game shop prices are the baseline. Screenshot-verified prices are prefilled with discounts reversed. The universal speedup baseline is the 1-hour shop item; longer shop items have different rates. Blank values are not estimated. Gems always count 1:1. You can enter a shop price you have checked.</p><div class="pack-rate-grid">${Object.entries(packItems).filter(([key])=>!['gems','other'].includes(key)).map(([key,[label,unit]])=>`<label>${art(key)}${label}<small>Gems per ${unit==='hours'?'hour':unit.slice(0,-1)}</small><input data-rate="${key}" type="number" min="0" step="any" inputmode="decimal" value="${esc(saved.rates[key]??'')}" placeholder="Gem price"></label>`).join('')}</div></details><div class="pack-offers">${saved.packs.map((p,i)=>`<fieldset class="pack-offer"><legend>Pack ${i+1}</legend><label>Name (optional)<input data-pack-field="name" data-pack="${i}" maxlength="80" value="${esc(p.name)}"></label><label>Gold-bar cost<input data-pack-field="goldBars" data-pack="${i}" type="number" min="0.01" step="any" inputmode="decimal" value="${esc(p.goldBars)}" placeholder="Gold bars"></label><div class="pack-contents">${p.contents.map((l,j)=>`<div class="pack-content"><label>Item<select data-item data-pack="${i}" data-line="${j}">${Object.entries(packItems).map(([key,[label]])=>`<option value="${key}" ${l.item===key?'selected':''}>${label}</option>`).join('')}</select></label><label>Quantity (${packItems[l.item][1]})<input data-line-field="quantity" data-pack="${i}" data-line="${j}" type="number" min="0" step="any" inputmode="decimal" value="${esc(l.quantity)}"></label>${l.item==='other'?`<label>Gems per item<input data-line-field="gemRate" data-pack="${i}" data-line="${j}" type="number" min="0" step="any" inputmode="decimal" value="${esc(l.gemRate??'')}"></label>`:''}<button class="textbutton" data-remove="${i}" data-line="${j}" aria-label="Remove item ${j+1} from pack ${i+1}">Remove</button></div>`).join('')}</div><button data-add-item="${i}" ${p.contents.length>=30?'disabled':''}>+ Add item</button></fieldset>`).join('')}</div><div class="actions"><button data-pack-add ${saved.packs.length>=6?'disabled':''}>+ Add a pack</button><button data-pack-clear>Clear packs</button></div><div data-pack-results aria-live="polite"></div><details class="compact-help"><summary>${icon('help')}How gem value works</summary><p>Add every pack item and its quantity. Total gem value = quantity Ã— gem price, added across all items. Gems per gold bar = total gem value Ã· gold-bar cost. Higher is better.</p><p>Use the same shop price baseline for all packs. Speedups are in hours: 60 minutes = 1 hour. Count each item once. For a choice chest, count only the reward you would select. For multi-day packs, enter only rewards you will actually receive.</p><p>Blank gem prices are unknown, not zero. A pack with unpriced contents stays out of the best-value ranking. This is replacement value, not a promise that you need every item. Gold bars are entered directly; cash prices from the previous experiment are not converted.</p><p>Your prices and comparisons stay on this device.</p></details>`;
  results();
 }
 container.oninput=e=>{const el=e.target;if(el.dataset.rate)saved.rates[el.dataset.rate]=el.value;else if(el.dataset.packField)saved.packs[Number(el.dataset.pack)][el.dataset.packField]=el.value;else if(el.dataset.lineField)saved.packs[Number(el.dataset.pack)].contents[Number(el.dataset.line)][el.dataset.lineField]=el.value;else return;persist();results();};
 container.onchange=e=>{const el=e.target;if(!el.hasAttribute('data-item'))return;const line=saved.packs[Number(el.dataset.pack)].contents[Number(el.dataset.line)];line.item=el.value;line.quantity='';line.gemRate='';persist();render();};
 container.onclick=e=>{const el=e.target.closest('button');if(!el)return;if(el.hasAttribute('data-add-item')){const p=saved.packs[Number(el.dataset.addItem)];if(p.contents.length<30)p.contents.push({item:'construction',quantity:'',gemRate:''});}else if(el.hasAttribute('data-remove'))saved.packs[Number(el.dataset.remove)].contents.splice(Number(el.dataset.line),1);else if(el.hasAttribute('data-pack-add')&&saved.packs.length<6)saved.packs.push(emptyPack());else if(el.hasAttribute('data-pack-clear'))saved.packs=[emptyPack(),emptyPack()];else return;persist();render();};
 render();
}

export function mountPackValue(container){
 container.innerHTML=`<div class="actions"><button data-mode="catalog" aria-pressed="true">In-game packs</button><button data-mode="custom" aria-pressed="false">Custom packs</button></div><div data-pack-body></div>`;
 const body=container.querySelector("[data-pack-body]");mountPackCatalog(body);
 container.querySelectorAll("[data-mode]").forEach(button=>button.onclick=()=>{container.querySelectorAll("[data-mode]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));if(button.dataset.mode==="catalog")mountPackCatalog(body);else mountCustomPackValue(body);});
}

