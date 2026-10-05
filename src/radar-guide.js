import {buildingIcon} from './building-assets.js';
import {icon} from './visuals.js';

// Duel days follow the game's reset, rather than the viewer's local midnight.
export function radarAdvice(w){
 if(!['Heroes','Rest'].includes(w.duel))return null;
 return {collectDay:w.duel==='Heroes'?'Friday':'Monday',openSlots:8};
}
export function radarVisuals(w){
 const advice=radarAdvice(w);if(!advice)return '';
 return `<section class="radar-guide" aria-label="Save radar events"><div class="visual-heading">${buildingIcon('Radar')}<strong>Save radar rewards</strong><span class="badge">${icon('save')}Collect ${advice.collectDay}</span></div><details class="compact-help"><summary>${icon('help')}Radar details</summary><div class="radar-capacity" role="img" aria-label="Keep eight radar event slots open">${Array.from({length:8},()=>'<span>+</span>').join('')}<strong>8 slots open</strong></div><p>Save completed radar rewards on Thursday and Sunday. Collect them after the next game reset, on ${advice.collectDay}, for Alliance Duel points.</p><p>Keep at least 8 radar event slots open before new events arrive. If your radar is capped, collect enough rewards to free those slots so you don’t lose incoming events. Keeping room for new events takes priority over saving every reward.</p></details></section>`;
}
