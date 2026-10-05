import test from 'node:test';
import assert from 'node:assert/strict';
import {timelineState,timelineAdvice,trainingSchedule} from '../src/timeline.js';
test('timeline advances at boundaries and matches each use to its theme',()=>{
 const before=timelineState(new Date('2026-10-06T13:59:59Z'),-120);
 const after=timelineState(new Date('2026-10-06T14:00:00Z'),-120);
 assert.equal(before.slots[0].theme,'Shelter');assert.equal(before.slots[0].double,true);assert.ok(before.progress>.99);
 assert.equal(after.slots[0].theme,'Troops');assert.equal(after.progress,0);assert.equal(after.remaining,14400000);
 assert.match(before.slots[0].use,/Construction speedups/);assert.match(after.slots[0].use,/Save training/);
 assert.equal(after.slots.length,42);assert.ok(after.slots.every(w=>w.title&&w.use&&w.action));
});

test('shared consumables are recommended only for a matching Duel window',()=>{
 for(const theme of ['Shelter','Science','Vehicle','Troops']){
  assert.equal(timelineAdvice({theme,duel:'Rest'}).double,false);
  assert.match(timelineAdvice({theme,duel:'Rest'}).use,/Save/);
  assert.equal(timelineAdvice({theme,duel:theme}).double,true);
  assert.equal(timelineAdvice({theme,duel:'Balanced'}).double,true);
 }
 for(const duel of ['Vehicle','Heroes','Balanced','Rest']){
  const advice=timelineAdvice({theme:'Heroes',duel});
  assert.equal(advice.double,false);assert.match(advice.use,/Hero EXP/);assert.match(advice.use,/Full Preparedness only/);
  assert.doesNotMatch(advice.use,/shards|skill|equipment/);
 }
});
test('natural training starts early enough for the next FP training window without waiting for Duel',()=>{
 const now=new Date('2026-10-05T14:00:00Z');
 const state=timelineState(now,-120,[{name:'T8 riders',minutes:60}]);
 const t=state.training[0];
 assert.equal(t.start,new Date('2026-10-05T17:01:00Z').getTime());
 assert.equal(t.finish,new Date('2026-10-05T18:01:00Z').getTime());
 assert.equal(t.finish-t.start,3600000);assert.equal(t.double,false);
 assert.equal(state.slots[0].trainingStarts[0].name,'T8 riders');
 assert.equal(state.slots[1].trainingFinishes[0].name,'T8 riders');
});
test('training skips missed finishes, keeps exact boundaries inside the next window and supports long batches',()=>{
 const now=new Date('2026-10-05T21:00:00Z');
 for(const minutes of [60,120,1440,10080]){
  const t=trainingSchedule([{name:'Units',minutes}],now,0)[0];
  assert.ok(t.start>=now.getTime());assert.equal(t.finish-t.start,minutes*60000);
  assert.ok(t.finish>=t.window.start&&t.finish<t.window.end);assert.equal(t.window.theme,'Troops');
 }
 assert.deepEqual(trainingSchedule([{minutes:0},{minutes:NaN},{minutes:60,active:true}],now),[]);
});

test('a natural Friday training finish also labels the Duel overlap',()=>{
 const t=trainingSchedule([{name:'T8',minutes:60}],new Date('2026-10-09T08:00:00Z'),-120)[0];
 assert.equal(t.double,true);assert.equal(t.window.duel,'Balanced');
});
