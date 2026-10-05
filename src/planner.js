export const duel = ['Vehicle','Shelter','Science','Heroes','Balanced','Combat','Rest'];
export const fp = [
 ['Shelter','Science','Vehicle','Heroes','Troops','Vehicle'],
 ['Science','Heroes','Shelter','Troops','Vehicle','Shelter'],
 ['Heroes','Troops','Science','Vehicle','Shelter','Science'],
 ['Troops','Vehicle','Heroes','Shelter','Science','Heroes'],
 ['Vehicle','Shelter','Troops','Science','Heroes','Troops'],
 ['Science','Vehicle','Heroes','Shelter','Troops','Heroes'],
 ['Vehicle','Shelter','Troops','Science','Heroes','Troops']
];
export function effectiveSeconds(base, speed) {
 if (!Number.isFinite(base)||base<0||!Number.isFinite(speed)||speed<0) throw Error('Invalid duration or speed');
 return Math.ceil(base/(1+speed/100));
}
export function duration(seconds) {
 if (!Number.isFinite(seconds)) return 'Unknown';
 const minutes=Math.ceil(Math.max(0,seconds)/60), days=Math.floor(minutes/1440), hours=Math.floor(minutes%1440/60), mins=minutes%60;
 return [days&&`${days}d`,hours&&`${hours}h`,(mins||!minutes)&&`${mins}m`].filter(Boolean).join(' ');
}
export function windows(now=new Date(), offset=-120, days=15) {
 const shifted=new Date(now.getTime()+offset*60000); shifted.setUTCHours(0,0,0,0);
 const out=[];
 for(let d=0;d<days;d++) {
  const day=new Date(shifted.getTime()+d*86400000), index=(day.getUTCDay()+6)%7;
  for(let b=0;b<6;b++) {
   const start=day.getTime()+b*14400000-offset*60000, end=start+14400000;
   if(end>now.getTime()) out.push({start,end,theme:fp[index][b],duel:duel[index],overlap:fp[index][b]==='Shelter'&&['Shelter','Balanced'].includes(duel[index])});
  }
 }
 return out;
}
export function parseScreens(text,names) {
 const lines=text.split(/\r?\n/), found=[];
 const aliases={'Headquarters':['Headquarters','Headquarter','HQ'],'City Walls':['City Walls','City Wall']};
 for(let i=0;i<lines.length;i++) for(const name of names) {
  const opts=aliases[name]||[name];
  if(!opts.some(n=>new RegExp('\\b'+n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(lines[i]))) continue;
  const nearby=/(?:Lv\.?|Level)\s*[:.]?\s*\d|\d\s*(?:→|->|»|›|≫|>)/i.test(lines[i])?lines[i]:lines[i]+' '+(lines[i+1]||'');
  const pair=nearby.match(/(?:Lv\.?\s*|Level\s*)?(\d{1,2})\s*(?:→|->|»|›|≫|>)\s*(?:Lv\.?\s*|Level\s*)?(\d{1,2})/i);
  const lv=pair?Number(pair[1]):Number(nearby.match(/(?:Lv\.?|Level)\s*[:.]?\s*(\d{1,2})/i)?.[1]||(lines[i-1]||'').match(/(?:Lv\.?|Level)\s*[:.]?\s*(\d{1,2})/i)?.[1]);
  found.push({id:crypto.randomUUID(),name,level:lv>=1&&lv<=35?lv:null,active:/upgrading/i.test(nearby)});
 }
 const speed=Number(text.match(/(?:Construction Speed|Building Speed)[^\n%]*?(\d+(?:[.,]\d+)?)\s*%/i)?.[1]?.replace(',','.'));
 return {buildings:found,speed:Number.isFinite(speed)?speed:null};
}
export function recommend(buildings,catalog,speed,now=new Date(),offset=-120,speedups=0) {
 const hq=buildings.find(b=>b.name==='Headquarters'), next=hq&&catalog.find(r=>r.building==='Headquarters'&&r.from_level===hq.level);
 const targetNames=new Set((next?.prerequisites||[]).filter(p=>!buildings.some(b=>b.name===p.building&&b.level>=p.level)).map(p=>p.building));
 return buildings.filter(b=>!b.active).flatMap(b=> {
  const row=catalog.find(r=>r.building===b.name&&r.from_level===b.level); if(!row) return [];
  const missing=row.prerequisites.filter(p=>!buildings.some(x=>x.name===p.building&&x.level>=p.level));
  const seconds=effectiveSeconds(row.base_duration_seconds,speed), finish=now.getTime()+seconds*1000;
  const earliest=Math.max(now.getTime(),finish-Math.max(0,speedups)*60000);
  const available=windows(new Date(earliest),offset,Math.max(15,Math.ceil(seconds/86400)+15));
  const target=available.find(w=>w.overlap&&w.end>earliest);
  const completeAt=target?Math.max(earliest,target.start+60000):null;
  const startAt=completeAt===null?null:Math.max(now.getTime(),completeAt-seconds*1000);
  const used=completeAt===null?0:Math.max(0,Math.ceil((startAt+seconds*1000-completeAt)/60000));
  const priority=targetNames.has(b.name)?0:b.name==='Headquarters'?1:2;
  return [{...row,instance:b.id,missing,priority,seconds,finish,startAt,completeAt,speedups:used,window:target}];
 }).sort((a,b)=>a.priority-b.priority||a.seconds-b.seconds);
}
