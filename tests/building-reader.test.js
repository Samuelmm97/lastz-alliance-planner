import test from 'node:test';
import assert from 'node:assert/strict';
import {gridRows,gridLevelTop,levelFromCard,chooseLevel,hasUpgradeBar,cleanLevelPixels} from '../src/building-reader.js';
test('grid geometry separates multi-column names from their preceding levels',()=>{
 const lines=[
  {text:'Building List',bbox:{y0:89}},
  {text:'(LV220] ve E722] Lv:28',bbox:{y0:349}},
  {text:'Residence | Lab No.2 Villa pat |',bbox:{y0:382}},
  {text:'Lve2B LB EVX26) (IEVX26]',bbox:{y0:552}},
  {text:'Military Center| Headquarters City Walls Laboratory |',bbox:{y0:589}},
  {text:'Task Center Intercity Trade Talent Hub Camper',bbox:{y0:1001}}
 ];
 const data={text:'Building List',blocks:[{paragraphs:[{lines}]}]};
 assert.deepEqual(gridRows(data,['Residence','Lab No.2','Villa','Military Center','Headquarters','City Walls','Laboratory'],589,1280),[382,589]);
 assert.deepEqual(gridRows({...data,text:'Upgrade Headquarters'},['Headquarters'],589,1280),[]);
});
test('single-line and wrapped building labels use the same level row',()=>{
 const data={blocks:[{paragraphs:[{lines:[{text:'Lv.20',bbox:{x0:62,x1:120,y0:354,y1:374}},{text:'Lv.21',bbox:{x0:198,x1:255,y0:354,y1:374}},{text:'Residence',bbox:{x0:32,x1:150,y0:390,y1:404}}]}]}]};
 assert.equal(gridLevelTop(data,390,589),354);
 assert.equal(gridLevelTop(data,382,589),354);
});
test('isolated level OCR accepts label variations but rejects ambiguous and out-of-range numbers',()=>{
 assert.equal(levelFromCard('Lv.2]'),21);
 for(const text of ['Lv.26','lL.v.22','| v.21'])assert.ok(levelFromCard(text)>0);
 for(const text of ['Lv.272','Max Level','Lv.2 6',''])assert.equal(levelFromCard(text),null);
});
test('confident isolated digits repair outlined levels without accepting weak guesses',()=>{
 assert.equal(chooseLevel({text:'Lv.20',confidence:82},{text:'26',confidence:96}),26);
 assert.equal(chooseLevel({text:'Lv.21',confidence:54},{text:'24',confidence:80}),21);
 assert.equal(chooseLevel({text:'Lv.22',confidence:52},{text:'',confidence:0}),22);
 assert.equal(chooseLevel({text:'Lv.206',confidence:39},{text:'26',confidence:96}),26);
 assert.equal(chooseLevel({text:'Lv.21',confidence:80},{text:'2',confidence:96}),21);
 assert.equal(chooseLevel({text:'Lv.27',confidence:60},{text:'',confidence:0},{text:'22',confidence:96}),22);
 assert.equal(chooseLevel({text:'Lv.19',confidence:20},{text:'1',confidence:0}),null);
 assert.equal(chooseLevel({text:'Lv.20',confidence:82},{text:'26',confidence:88}),null);
});
test('a green timer bar marks an upgrade but a small green arrow does not',()=>{
 const make=(length)=>{const data=new Uint8ClampedArray(100*20*4);for(let y=5;y<10;y++)for(let x=0;x<length;x++){const p=(y*100+x)*4;data[p]=70;data[p+1]=200;data[p+2]=50;data[p+3]=255;}return {data,width:100,height:20};};
 assert.equal(hasUpgradeBar(make(80)),true);assert.equal(hasUpgradeBar(make(15)),false);
});
test('level cleanup preserves faint edges instead of turning every pixel black or white',()=>{
 const data=new Uint8ClampedArray([100,100,100,255,100,100,100,255,100,100,100,255,150,150,150,255,255,255,255,255]);
 cleanLevelPixels({data});
 assert.equal(data[0],255);
 assert.ok(data[12]>0&&data[12]<255);
 assert.equal(data[16],0);
});
