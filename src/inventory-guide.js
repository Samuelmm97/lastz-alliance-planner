import {icon,itemArt} from './visuals.js';
const assets={heroExp:'hero-level-exp.png',speed:'warehouse-speedups.jpg',resources:'warehouse-resources.jpg',equipment:'warehouse-equipment.jpg',hero:'warehouse-hero.jpg',items:'warehouse-items.jpg'};
// Coordinates are percentages of the original 589 x 1280 screenshots.
const rect=(x,y,w,h,label)=>({x:x/589*100,y:y/1280*100,w:w/589*100,h:h/1280*100,label});
export const guides={
 Shelter:{title:'Construction speedups',asset:'speed',regions:[rect(27,642,397,122,'Construction speedups: hammer icons'),rect(27,227,397,122,'Universal speedups: plain arrows')],note:'Save hammer speedups for a construction Full Preparedness + Alliance Duel overlap. Plain arrows are universal; reserve them for your chosen goal. The quantities shown here belong to the example account.'},
 Science:{title:'Research speedups',asset:'speed',regions:[rect(166,504,397,121,'Research speedups: flask icons'),rect(27,227,397,122,'Universal speedups: plain arrows')],note:'Save flask speedups for a research Full Preparedness + Alliance Duel overlap. Confirm the research is eligible for the current event before finishing it.'},
 Troops:{title:'Training speedups',asset:'speed',regions:[rect(443,227,121,122,'Training speedups: helmet icon'),rect(27,365,397,122,'More training speedups: helmet icons')],note:'Helmet icons are training speedups. Spend them only in a training Full Preparedness + Alliance Duel overlap; natural training needs no speedups. Green cross icons are healing speedups; keep them separate from training.'},
 Heroes:{title:'Hero EXP',asset:'heroExp',width:303,height:658,regions:[{x:91/303*100,y:520/658*100,w:125/303*100,h:65/658*100,label:'Hero EXP bar and level-up button'}],note:'Use Hero EXP to level up a hero during Heroes Full Preparedness. Skill books, shards and equipment are different items. The quantities shown belong to the example account.'},
 Vehicle:{title:'Vehicle item candidates',asset:'items',regions:[rect(304,748,120,118,'Wrench item: confirm its name and purpose'),rect(27,887,120,118,'Blueprint item: confirm its name and purpose')],note:'Save eligible vehicle materials for a vehicle Full Preparedness + Alliance Duel overlap. These are visual candidates, not confirmed item identities. Tap each icon in-game and confirm the name and event eligibility before spending.'},
 equipment:{title:'Hero equipment',asset:'equipment',regions:[rect(27,227,259,122,'Equipment materials: open the item details'),rect(304,227,260,122,'Equipment and its displayed level')],note:'Check the exact equipment material requirements in-game. Equipment upgrades may not score in every Heroes event.'},
 resources:{title:'Resource supplies',asset:'resources',regions:[rect(27,227,537,398,'Resource chests'),rect(27,642,537,257,'Resource packs and their quantities')],note:'Resources pay upgrade costs. Opening packs is not assumed to earn event points. Open only what your confirmed upgrade needs; chest contents must be checked in-game.'}
};
export function guideForWindow(w){
 if(w.theme==='Heroes')return guides.Heroes;
 const overlap=w.duel===w.theme||w.duel==='Balanced';
 if(!overlap||!['Shelter','Science','Troops'].includes(w.theme))return null;
 return guides[w.theme];
}
export function heroDuelItems(w){return w.duel==='Heroes'?[['shards','Orange shards'],['purpleShards','Purple shards'],['blueShards','Blue shards'],['books','Orange skill books'],['recruit','Prime recruit tickets'],['core','Power cores'],['alloy','Enhancement alloys'],['equipment','Hero equipment']]:[];}
function heroDuelVisuals(w){
 const items=heroDuelItems(w);if(!items.length)return '';
 const shots=[{asset:'hero',title:'Hero shards, books and recruiting',regions:[rect(27,227,121,121,'Orange skill books'),rect(443,227,121,121,'Prime recruit tickets'),rect(27,365,397,121,'Universal hero shards'),rect(27,504,537,536,'Individual hero shards')]},{asset:'equipment',title:'Equipment upgrade materials',regions:[rect(27,227,121,121,'Power cores'),rect(166,227,121,121,'Enhancement alloys')]}];
 return `<section class="hero-duel-guide" aria-label="Thursday Hero Duel items"><h3>${icon('duel')}Thursday · Hero Duel <span class="score-badge single">Duel only</span></h3><div class="eligible-items" aria-label="Items for today’s Alliance Duel">${items.map(([art,label])=>`<div class="item-tile">${itemArt(art)}<strong>${label}</strong></div>`).join('')}</div><p>Recruit → star up heroes → improve skills and equipment. Hero EXP uses the Heroes FP window.</p><details class="screenshot-detail"><summary>${icon('help')}See highlighted hero screenshots</summary>${shots.map(g=>`<div class="inventory-guide"><figure><div class="inventory-image"><img src="./examples/${assets[g.asset]}" alt="${g.title}" width="589" height="1280" loading="lazy">${g.regions.map((r,i)=>`<span class="inventory-highlight" style="left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%" aria-hidden="true"><b>${i+1}</b></span>`).join('')}</div></figure><div><h3>${g.title}</h3><ol>${g.regions.map(r=>`<li>${r.label}</li>`).join('')}</ol></div></div>`).join('')}<p>Use materials for upgrades you need. Keep equipped orange gear; check the live Duel tasks before consuming spare equipment or exclusive equipment fragments.</p></details></section>`;
}
export function mountInventoryGuide(container){
 let selected='';
 function show(w){const key=w.theme+':'+w.duel;if(selected===key)return;selected=key;const guide=guideForWindow(w);
 if(!guide){container.innerHTML=(w.theme==='Vehicle'&&w.double?`<div class="visual-notice">${icon('check')}<span>Vehicle materials: confirm live tasks first.</span></div>`:'')+heroDuelVisuals(w);return;}
 const items=w.theme==='Heroes'?[['exp','Hero EXP']]:w.theme==='Troops'?[['training','Training speedups']]:[[w.theme==='Shelter'?'construction':'research',guide.title],['universal','Universal speedups']];
 container.innerHTML=`<div class="eligible-items" aria-label="Items to use in this window">${items.map(([art,label])=>`<div class="item-tile">${itemArt(art)}<strong>${label}</strong></div>`).join('')}</div><details class="screenshot-detail"><summary>${icon('help')}See highlighted screenshot</summary><div class="inventory-guide"><figure><div class="inventory-image"><img src="./examples/${assets[guide.asset]}" alt="Last Z screenshot highlighting ${guide.title} for the selected time window" width="${guide.width||589}" height="${guide.height||1280}" loading="lazy">${guide.regions.map((r,i)=>`<span class="inventory-highlight" style="left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%" aria-hidden="true"><b>${i+1}</b></span>`).join('')}</div></figure><div><h3>${guide.title}</h3><ol>${guide.regions.map(r=>`<li>${r.label}</li>`).join('')}</ol><p>${guide.note}</p><a href="./examples/${assets[guide.asset]}" target="_blank" rel="noopener">Open original screenshot</a></div></div></details>`;
 container.innerHTML+=heroDuelVisuals(w);
 }
 return {show};
}
