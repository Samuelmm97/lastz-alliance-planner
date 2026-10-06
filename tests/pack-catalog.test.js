import {test} from 'node:test';
import assert from 'node:assert/strict';
import {packQuantity,catalogValue} from '../src/pack-catalog.js';
test('official quantities preserve K and M multipliers',()=>{assert.equal(packQuantity('2.5K'),2500);assert.equal(packQuantity('1.8M'),1800000);assert.equal(packQuantity('bad'),null);});
test('diamond denominations count face value; unpriced items prevent ranking',()=>{const pack={contents:[{id:'200367',quantity:'1'},{id:'230109',quantity:'900'}]};const v=catalogValue(pack,{},5000);assert.equal(v.gems,5000);assert.equal(v.missing,1);assert.equal(v.ratio,null);const full=catalogValue(pack,{'230109':20},5000);assert.equal(full.gems,23000);assert.equal(full.ratio,4.6);});
test('blank price is unknown, explicit zero is allowed',()=>{const p={contents:[{id:'230109',quantity:'1'}]};assert.equal(catalogValue(p,{'230109':''},1).complete,false);assert.equal(catalogValue(p,{'230109':0},1).complete,true);});
