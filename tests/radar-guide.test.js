import test from 'node:test';
import assert from 'node:assert/strict';
import {radarAdvice,radarVisuals} from '../src/radar-guide.js';
import {windows} from '../src/planner.js';
import {mountInventoryGuide} from '../src/inventory-guide.js';

test('radar saving follows Thursday and Sunday game days across reset',()=>{
 for(const [before,after,duel,day] of [
  ['2026-10-08T01:59:59Z','2026-10-08T02:00:00Z','Heroes','Friday'],
  ['2026-10-11T01:59:59Z','2026-10-11T02:00:00Z','Rest','Monday']
 ]){
  assert.equal(radarAdvice(windows(new Date(before),-120,1)[0]),null);
  const w=windows(new Date(after),-120,1)[0];
  assert.equal(w.duel,duel);
  assert.deepEqual(radarAdvice(w),{collectDay:day,openSlots:8});
 }
});
test('radar visuals coexist with hero and FP guides and disappear on other days',()=>{
 const container={innerHTML:''},guide=mountInventoryGuide(container);
 for(const duel of ['Heroes','Rest'])for(const theme of ['Heroes','Science','Vehicle']){
  guide.show({duel,theme});
  assert.match(container.innerHTML,/Save radar rewards/);
  assert.match(container.innerHTML,/8 radar event slots open/);
  assert.equal((radarVisuals({duel}).match(/<span>\+<\/span>/g)||[]).length,8);
 }
 guide.show({theme:'Heroes',duel:'Vehicle'});
 assert.doesNotMatch(container.innerHTML,/Save radar rewards/);
 assert.match(container.innerHTML,/Hero EXP/);
});
