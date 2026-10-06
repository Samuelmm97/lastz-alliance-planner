import test from 'node:test';
import assert from 'node:assert/strict';
import {rankPacks} from '../src/pack-value.js';
test('pack comparison uses useful quantity per price, not largest contents',()=>{
 const ranked=rankPacks([{name:'Small',price:5,quantity:20},{name:'Large',price:20,quantity:60}]);
 assert.equal(ranked[0].name,'Small');assert.equal(ranked[0].perPrice,4);assert.equal(ranked[0].costPerItem,.25);
});
test('incomplete, zero and invalid offers cannot become best value',()=>{
 assert.equal(rankPacks([{price:0,quantity:100},{price:NaN,quantity:10},{price:3,quantity:Infinity},{price:3,quantity:-1},{price:5,quantity:10}]).length,1);
 assert.equal(rankPacks([{price:5,quantity:10},{price:10,quantity:20}])[1].perPrice,2);
});
