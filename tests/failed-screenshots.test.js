import test from 'node:test';
import assert from 'node:assert/strict';
import {createFailedScreenshots,nextRetentionDelay} from '../src/failed-screenshots.js';

function storage(){const store=new Map();globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};}
const clear=()=>new Promise(resolve=>setTimeout(resolve,10));

test('retention keeps retrying a transient upload failure instead of losing the original',async()=>{
 storage();const messages=[];let calls=0;
 globalThis.fetch=async()=>{calls++;if(calls<3)throw Error('transient network failure');return {ok:true,json:async()=>({saved:true})};};
 const api=createFailedScreenshots('https://example.test','a'.repeat(16),'development',m=>messages.push(m),()=>Promise.resolve());
 await api.retainAll([{type:'image/jpeg'}]);
 await clear();
 assert.equal(calls,3);
 assert.match(messages.at(-1),/saved privately/);
});

test('retention gives up after bounded attempts and tells the member to keep the original',async()=>{
 storage();const messages=[];let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('persistent network failure');};
 const api=createFailedScreenshots('https://example.test','b'.repeat(16),'development',m=>messages.push(m),()=>Promise.resolve());
 await api.retainAll([{type:'image/jpeg'}]);
 await clear();
 assert.equal(calls,5);
 assert.match(messages.at(-1),/Keep the original/);
});

test('retention deduplicates an already-saved original and ignores a missing API base',async()=>{
 storage();let calls=0;
 globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({saved:true})};};
 const api=createFailedScreenshots('https://example.test','c'.repeat(16),'development',()=>{},()=>Promise.resolve());
 const file={type:'image/jpeg'};await api.retainAll([file,file]);await clear();
 assert.equal(calls,1);
 const none=createFailedScreenshots('','d'.repeat(16),'development',()=>{},()=>Promise.resolve());
 await none.retainAll([{type:'image/jpeg'}]);
 assert.equal(calls,1);
});

test('retention backoff is bounded',()=>{
 assert.equal(nextRetentionDelay(0),null);
 assert.equal(nextRetentionDelay(5),null);
 assert.equal(nextRetentionDelay(99),null);
 assert.deepEqual([1,2,3,4].map(r=>nextRetentionDelay(r)),[1000,2000,4000,8000]);
});
