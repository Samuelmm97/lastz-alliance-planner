import test from 'node:test';
import assert from 'node:assert/strict';
import {buildingInputs,activityIssue} from '../src/partial-plan.js';
import {recommend} from '../src/planner.js';
import {activityPlan} from '../src/activities.js';
test('partial buildings retain valid recommendations and prerequisite evidence',()=>{
 const catalog=[{building:'Warehouse',from_level:19,to_level:20,base_duration_seconds:3600,prerequisites:[{building:'Headquarters',level:20}],costs:{}}];
 const buildings=[{name:'Warehouse',level:19},{name:'Residence',level:null},{name:'Headquarters',level:20,active:true}];
 const input=buildingInputs(buildings,['Warehouse','Residence','Headquarters'],catalog);
 const plan=recommend(input.known,catalog,0,new Date('2026-10-05T12:00:00Z'));
 assert.equal(plan.length,1);assert.equal(plan[0].building,'Warehouse');assert.deepEqual(plan[0].missing,[]);
 assert.equal(input.notes.length,2);assert.match(input.notes[0],/Residence.*level/);
});
test('empty, unknown-level and unsupported building inputs explain omissions',()=>{
 assert.deepEqual(buildingInputs([],[],[]),{usable:[],known:[],notes:[]});
 const input=buildingInputs([{name:'Warehouse',level:null},{name:'Warehouse',level:35}],['Warehouse'],[]);
 assert.equal(input.usable.length,0);assert.equal(input.notes.length,2);
});
test('unfinished optional goals explain their missing fields without invalidating others',()=>{
 assert.match(activityIssue({category:'research',tree:'',technology:'',level:null,speed:0}),/research tree, technology, current level/);
 assert.match(activityIssue({category:'troops',name:'Tier 8',minutes:null}),/full batch duration/);
 assert.equal(activityIssue({category:'heroes',name:'Evelyn',goal:'Level 98',scoring:'exp'}),null);
 assert.equal(activityIssue({category:'research',active:true}),null);
 const active=activityPlan({category:'research',active:true},[],[],[],new Date(),-120);
 assert.equal(active.target,null);assert.match(active.notes[0],/Already in progress/);
});
