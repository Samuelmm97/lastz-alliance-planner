import {buildingIcon} from './building-assets.js';
const paths={
 gem:'<path d="M3 8 7 3h10l4 5-9 13zM3 8h18M7 3l5 18 5-18M7 3l5 5 5-5"/>',
 target:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
 timeline:'<path d="M4 7h16M4 17h16M7 4v6m10 4v6"/>',
 plan:'<path d="M8 5H5v15h14V5h-3M8 3h8v4H8zM8 12h8m-8 4h5"/>',
 start:'<path d="m8 5 11 7-11 7z"/>',
 finish:'<path d="M5 21V3m0 1h13l-3 5 3 5H5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 save:'<path d="M4 10h16v10H4zM8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
 fp:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
 duel:'<path d="m4 3 14 14m-2 4 5-5M3 4l1 5 5-5zM20 3 6 17m2 4-5-5m18-12-1 5-5-5z"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 1-1 2-1 2m0 3h.01"/>'
};
export function icon(name){return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.help}</svg>`;}
function crop(file,sw,sh,x,y,w,h){return `<span class="game-art" aria-hidden="true" style="background-image:url('./examples/${file}');background-size:${sw/w*100}% ${sh/h*100}%;background-position:${x/(sw-w)*100}% ${y/(sh-h)*100}%"></span>`;}
export function themeArt(theme){
 if(theme==='Boomers')return crop('boomer-danger-lurks.webp',634,1024,155,168,355,355);
 if(theme==='Heroes')return crop('hero-level-exp.png',303,658,48,95,205,175);
 if(theme==='Vehicle')return crop('vehicle-upgrade.png',1154,658,414,189,266,200);
 return buildingIcon({Shelter:'Headquarters',Science:'Laboratory',Troops:'Rider Camp'}[theme]||'Headquarters');
}
export function itemArt(item){
 if(item==='exp')return crop('hero-level-exp.png',303,658,92,525,23,24);
 const hero={books:[35,235,100,85],shards:[35,373,100,85],purpleShards:[174,373,100,85],blueShards:[312,373,100,85],recruit:[452,240,100,85]}[item];
 if(hero)return crop('warehouse-hero.jpg',589,1280,...hero);
 const gear={core:[35,235,100,85],alloy:[174,235,100,85],equipment:[312,235,100,85]}[item];
 if(gear)return crop('warehouse-equipment.jpg',589,1280,...gear);
 const region={construction:[40,680,72,54],research:[180,541,72,54],training:[455,266,72,54],universal:[45,265,72,54]}[item];
 return crop('warehouse-speedups.jpg',589,1280,...region);
}
export function scoringBadge(w){return `<span class="score-badge ${w.double?'both':'single'}">${icon('fp')}${w.double?icon('duel'):''}<span>${w.double?'Double dip':'FP only'}</span></span>`;}
