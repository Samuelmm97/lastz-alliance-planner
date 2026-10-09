export function nextRetentionDelay(retry,maxRetries=4){if(!Number.isInteger(retry)||retry<1||retry>maxRetries)return null;return Math.min(8000,1000*2**(retry-1));}
export function createFailedScreenshots(apiBase,code,version,onStatus=()=>{},wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))){
 const saved=new Set(),active=new Set();
 function memberToken(){let token=localStorage.getItem('lastz-member-token');if(!token){token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem('lastz-member-token',token);}return token;}
 async function send(file){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);try{const response=await fetch(apiBase+'/api/failed-screenshots?code='+encodeURIComponent(code)+'&version='+encodeURIComponent(version),{method:'POST',headers:{Authorization:'Bearer '+memberToken(),'Content-Type':file.type},body:file,signal:controller.signal});if(!response.ok||(await response.json()).saved!==true)throw Error('Failed screenshot was not saved');}finally{clearTimeout(timer);}}
 const stored=()=>onStatus('Failed screenshot saved privately for 7 days for leader and automated support.');
 // A single transient failure used to discard the only copy of the original the recovery flow depends on; keep retrying it.
 async function retry(file){
  for(let attempt=1;;attempt++){const delay=nextRetentionDelay(attempt);if(delay===null)break;await wait(delay);try{await send(file);saved.add(file);active.delete(file);stored();return;}catch{}}
  active.delete(file);onStatus('Could not save the failed screenshot. Keep the original and use Report screenshot issue to retry.');
 }
 async function retain(file){
  if(!file||saved.has(file)||active.has(file)||!apiBase)return;active.add(file);onStatus('Saving failed screenshot privately for 7 days...');
  try{await send(file);saved.add(file);active.delete(file);stored();}
  catch{onStatus('Retrying the failed screenshot save in the background.');void retry(file);}
 }
 return {retain,retainAll:files=>Promise.all([...files].map(retain))};
}
