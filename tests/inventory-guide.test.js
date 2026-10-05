import test from 'node:test';
import assert from 'node:assert/strict';
import {guideForWindow} from '../src/inventory-guide.js';
import {timelineAdvice} from '../src/timeline.js';

test('highlighted inventory follows eligible spending, not just the event theme',()=>{
 for(const theme of ['Shelter','Science','Troops','Heroes','Vehicle']){
  for(const duel of ['Shelter','Science','Troops','Heroes','Vehicle','Balanced','Rest']){
   const w={theme,duel,...timelineAdvice({theme,duel})},guide=guideForWindow(w);
   if(theme==='Heroes'){assert.equal(guide.asset,'heroExp');assert.equal(guide.regions.length,1);assert.match(guide.regions[0].label,/Hero EXP/);}
   else if(!w.double||theme==='Vehicle')assert.equal(guide,null,`${theme}/${duel} must not highlight consumables`);
   else assert.ok(guide.regions.length,`${theme}/${duel} should highlight matching speedups`);
  }
 }
});
