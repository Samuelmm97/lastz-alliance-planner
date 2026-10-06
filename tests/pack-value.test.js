import test from 'node:test';
import assert from 'node:assert/strict';
import {valuePack,rankPacks,mountPackValue} from '../src/pack-value.js';
test('mixed pack contents add to gem replacement value and rank per gold bar',()=>{
 const p={goldBars:10,contents:[{item:'gems',quantity:100},{item:'construction',quantity:5},{item:'shards',quantity:2}]};
 const value=valuePack(p,{construction:60,shards:200});
 assert.equal(value.gemValue,800);assert.equal(value.gemsPerBar,80);
 assert.equal(rankPacks([{...p,name:'A'},{name:'B',goldBars:20,contents:[{item:'gems',quantity:1000}]}],{construction:60,shards:200})[0].name,'A');
});
test('gem comparison renders its contents, baseline and incomplete-state guidance',()=>{
 const results={innerHTML:''},container={innerHTML:'',querySelector:()=>results};
 mountPackValue(container);
 assert.match(container.innerHTML,/Gold-bar cost/);
 assert.match(container.innerHTML,/Regular shop gem prices/);
 assert.match(container.innerHTML,/Add item/);
 assert.match(results.innerHTML,/Needs details/);
 assert.doesNotMatch(results.innerHTML,/Best gem value|NaN|Infinity/);
});
test('unknown prices and invalid gold bars never produce a winning estimate',()=>{
 const p={goldBars:10,contents:[{item:'core',quantity:5}]};
 assert.equal(valuePack(p,{}).complete,false);assert.equal(rankPacks([p],{}).length,0);
 for(const goldBars of ['',0,-1,Infinity])assert.equal(valuePack({...p,goldBars},{core:20}).complete,false);
 assert.equal(valuePack(p,{core:0}).gemValue,0);
});
test('blank rows are ignored, custom item prices work and invalid quantities are incomplete',()=>{
 const p={goldBars:5,contents:[{item:'gems',quantity:''},{item:'other',quantity:3,gemRate:50}]};
 assert.equal(valuePack(p,{}).gemsPerBar,30);
 assert.equal(valuePack({...p,contents:[{item:'gems',quantity:-3}]},{}).complete,false);
 assert.equal(valuePack({...p,contents:[]},{}).complete,false);
});
