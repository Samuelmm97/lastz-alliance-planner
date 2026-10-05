import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eventTarget,researchCandidates,activityPlan} from '../src/activities.js';
test('research OCR keeps level zero and requires a tree for ambiguous names',()=>{
 const rows=[{technology:'Mobile Defense',technology_id:'mobile-defense',tree_id:'elite',research_tree:'Elite Troops'},{technology:'Mobile Defense',technology_id:'mobile-defense',tree_id:'army',research_tree:'Army Building'}];
 assert.equal(researchCandidates('Mobile Defense\nLv.0 -> Lv.1',rows)[0].level,0);
 assert.equal(researchCandidates('Mobile Defense\nLv.0 -> Lv.1',rows)[0].tree,'');
 assert.equal(researchCandidates('Elite Troops\nMobile Defense\nLv.0 -> Lv.1',rows)[0].tree,'elite');
});
test('each category targets its matching preparedness and duel windows',()=>{
 for(const [category,theme] of [['research','Science'],['heroes','Heroes'],['vehicles','Vehicle'],['troops','Troops']]){
 const t=eventTarget(category,3600,new Date('2026-10-05T10:00:00Z'));
 assert.equal(t.theme,theme);assert.ok(t.duel===theme||t.duel==='Balanced');assert.ok(t.finish-t.start>=3600000);
 }
});
test('research uses its bonus and flags unknown prerequisites; training timer is not adjusted again',()=>{
 const research={category:'research',tree:'a',technology:'b',name:'Test',level:0,speed:100};
 const result=activityPlan(research,[{tree_id:'a',technology_id:'b',from_level:0,base_duration_seconds:7200,required_laboratory_level:20,prerequisites:[{id:'c',requiredLevel:2}],costs:{wood:null}}],[],[],new Date(),-120);
 assert.equal(result.seconds,3600);assert.ok(result.notes.some(n=>n.includes('Laboratory')));assert.ok(result.notes.some(n=>n.includes('prerequisite')));
 assert.equal(activityPlan({category:'troops',minutes:60,name:'Tier 8'},[],[],[],new Date(),-120).seconds,3600);
});
