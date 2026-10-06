import test from 'node:test';
import assert from 'node:assert/strict';
import {regularGemPrice,verifiedGemPrices} from '../src/shop-prices.js';
import {catalogValue} from '../src/pack-catalog.js';
test('discount is reversed rather than added to the sale price',()=>{assert.ok(Math.abs(regularGemPrice(15,85)-100)<1e-9);assert.equal(regularGemPrice(200,50),400);assert.equal(regularGemPrice(40,60),100);});
test('bundle quantity is accounted for after discount',()=>{assert.equal(regularGemPrice(10,0,10),1);assert.ok(Math.abs(regularGemPrice(4,40,20)-1/3)<1e-9);});
test('speedup durations retain actual shop pricing',()=>{assert.equal(verifiedGemPrices['200203'],120);assert.equal(verifiedGemPrices['200201'],10);assert.equal(verifiedGemPrices['200205'],810);});
test('screenshots automatically increase known catalog value',()=>{const p={contents:[{id:'230111',quantity:'10K'},{id:'210931',quantity:'100'}]};const v=catalogValue(p,{},5000);assert.equal(v.gems,60000);assert.equal(v.ratio,12);});
test('impossible discounts or quantities are rejected',()=>{assert.throws(()=>regularGemPrice(20,100));assert.throws(()=>regularGemPrice(20,20,0));});
