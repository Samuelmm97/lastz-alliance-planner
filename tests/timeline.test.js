import test from 'node:test';
import assert from 'node:assert/strict';
import {timelineState} from '../src/timeline.js';
test('timeline advances at boundaries and matches each use to its theme',()=>{
 const before=timelineState(new Date('2026-10-06T13:59:59Z'),-120);
 const after=timelineState(new Date('2026-10-06T14:00:00Z'),-120);
 assert.equal(before.slots[0].theme,'Shelter');assert.equal(before.slots[0].double,true);assert.ok(before.progress>.99);
 assert.equal(after.slots[0].theme,'Troops');assert.equal(after.progress,0);assert.equal(after.remaining,14400000);
 assert.match(before.slots[0].use,/Construction speedups/);assert.match(after.slots[0].use,/Training speedups/);
 assert.equal(after.slots.length,42);assert.ok(after.slots.every(w=>w.title&&w.use&&w.action));
});
