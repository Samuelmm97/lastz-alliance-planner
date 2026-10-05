export const appVersion=typeof __APP_VERSION__==='undefined'?'development':__APP_VERSION__;
export const diagnosticKinds=['page_loaded','files_selected','files_rejected','reading_started','reading_completed','reading_failed','reading_cancelled','reading_timeout','level_corrected','report_issue','plan_submitted','plan_submit_failed','data_load_failed','image_preview_failed'];
const metricKeys=['files','bytes','width','height','cards','knownLevels','missingLevels','rows','elapsedMs','corrected','replaced','failedFiles'];
export function safeDiagnostic(kind,details={},context={}){
 if(!diagnosticKinds.includes(kind))throw Error('Unknown diagnostic kind');
 const metrics={};for(const key of metricKeys)if(Number.isFinite(details[key]))metrics[key]=Math.max(0,Math.min(1e9,Math.round(details[key])));
 const mode=['grid','text','mixed','manual'].includes(details.mode)?details.mode:undefined;
 const stage=['selection','worker_init','decode','detect_grid','read_cards','review','submit','data','cancel','timeout'].includes(details.stage)?details.stage:undefined;
 return {kind,version:/^(development|[a-f0-9]{7,40})$/.test(context.version||'')?context.version:appVersion,code:context.code,browser:['Safari','Firefox','Chromium'].includes(context.browser)?context.browser:'Other',platform:['iOS','Android','Windows','macOS'].includes(context.platform)?context.platform:'Other',details:{...metrics,...(mode?{mode}:{}),...(stage?{stage}:{} )}};
}
export function clientEnvironment(ua){return {browser:/Firefox/i.test(ua)?'Firefox':/Chrome|Chromium|CriOS|Edg/i.test(ua)?'Chromium':/Safari/i.test(ua)?'Safari':'Other',platform:/iPhone|iPad|iPod/i.test(ua)?'iOS':/Android/i.test(ua)?'Android':/Windows/i.test(ua)?'Windows':/Mac/i.test(ua)?'macOS':'Other'};}
export function createDiagnostics(apiBase){
 let history=[],queue=[],sending=false;
 const code=crypto.randomUUID().replaceAll('-','').slice(0,16),context={code,...clientEnvironment(navigator.userAgent)};
 try{queue=JSON.parse(localStorage.getItem('lastz-diagnostic-queue')||'[]').slice(-50).filter(e=>/^[a-f0-9]{16}$/.test(e.code)).map(e=>safeDiagnostic(e.kind,e.details,{code:e.code,browser:e.browser,platform:e.platform,version:e.version}));}catch{}
 const remember=()=>{try{localStorage.setItem('lastz-diagnostic-queue',JSON.stringify(queue.slice(-50)));}catch{}};
 async function flush(){
  if(sending||!queue.length||!apiBase)return false;sending=true;let success=false;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000),batch=queue.slice(0,20);
  try{const response=await fetch(apiBase+'/api/diagnostics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:batch}),signal:controller.signal});if(response.ok&&(await response.json()).saved===true){queue.splice(0,batch.length);remember();success=true;}}
  catch{}finally{clearTimeout(timer);sending=false;}
  if(success&&queue.length)void flush();return success;
 }
 function record(kind,details={}){const event=safeDiagnostic(kind,details,context);history.push(event);history=history.slice(-50);queue.push(event);queue=queue.slice(-50);remember();void flush();return event;}
 async function report(details){record('report_issue',details);for(let i=0;i<12&&sending;i++)await new Promise(r=>setTimeout(r,500));if(queue.some(e=>e.kind==='report_issue'&&e.code===code))return flush();return true;}
 return {code,record,report,export:()=>JSON.stringify({code,version:appVersion,events:history},null,2)};
}
