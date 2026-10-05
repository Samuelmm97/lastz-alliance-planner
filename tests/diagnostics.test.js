import test from 'node:test';
import assert from 'node:assert/strict';
import {safeDiagnostic,clientEnvironment} from '../src/diagnostics.js';
import {buildingArtwork} from '../src/building-assets.js';
test('diagnostics exclude screenshots, OCR, names and secrets',()=>{
 const e=safeDiagnostic('reading_completed',{cards:8,knownLevels:5,missingLevels:3,width:589,height:1280,mode:'grid',filename:'private.jpg',text:'Account name',leaderKey:'secret',screenshot:'base64'}, {code:'a'.repeat(16),browser:'Safari',platform:'iOS'});
 assert.deepEqual(e.details,{width:589,height:1280,cards:8,knownLevels:5,missingLevels:3,mode:'grid'});
 assert.doesNotMatch(JSON.stringify(e),/private|Account|secret|base64/);
 assert.throws(()=>safeDiagnostic('arbitrary_event'));
});
test('diagnostics retain offline event versions and use broad browser categories',()=>{
 assert.deepEqual(clientEnvironment('Mozilla iPhone Version Safari'),{browser:'Safari',platform:'iOS'});
 assert.deepEqual(clientEnvironment('Mozilla Android Chrome Safari'),{browser:'Chromium',platform:'Android'});
 assert.equal(safeDiagnostic('reading_failed',{stage:'decode'}, {version:'123abcd',code:'a'.repeat(16)}).version,'123abcd');
});
test('building artwork uses the matching real card and never substitutes an unrelated icon',()=>{
 const hq=buildingArtwork('Headquarters'),walls=buildingArtwork('City Walls'),lab=buildingArtwork('Laboratory');
 assert.equal(hq.url,'./examples/building-list-shelter-end.jpg');
 assert.equal(hq.y,walls.y);assert.equal(walls.x-hq.x,136);assert.equal(lab.x-walls.x,136);
 assert.notDeepEqual(buildingArtwork('Farmhouse'),buildingArtwork('Warehouse'));
 assert.equal(buildingArtwork('Unknown building'),null);
});
