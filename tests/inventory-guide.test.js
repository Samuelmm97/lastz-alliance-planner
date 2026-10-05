import test from 'node:test';
import assert from 'node:assert/strict';
import {guideForWindow,heroDuelItems,mountInventoryGuide} from '../src/inventory-guide.js';
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
test('Thursday materials are visible in every Thursday window, separate from EXP',()=>{
 const container={innerHTML:''},guide=mountInventoryGuide(container);
 for(const theme of ['Shelter','Science','Troops','Heroes','Vehicle']){
  guide.show({theme,duel:'Heroes',...timelineAdvice({theme,duel:'Heroes'})});
  assert.equal(heroDuelItems({theme,duel:'Heroes'}).length,8);
  assert.match(container.innerHTML,/Thursday · Hero Duel/);
  assert.match(container.innerHTML,/Duel only/);
  assert.match(container.innerHTML,/Power cores/);
  assert.doesNotMatch(container.innerHTML,/undefined|NaN|Double dip/);
  assert.equal(container.innerHTML.includes('Items to use in this window'),theme==='Heroes');
 }
 guide.show({theme:'Heroes',duel:'Science'});
 assert.match(container.innerHTML,/Hero EXP/);
 assert.doesNotMatch(container.innerHTML,/Thursday · Hero Duel|Power cores/);
 assert.deepEqual(heroDuelItems({duel:'Balanced'}),[]);
});
