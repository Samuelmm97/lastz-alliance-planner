export function buildingInputs(buildings,names,catalog){
 const usable=[],notes=[];
 for(const b of buildings){
  if(b.active){notes.push(`${b.name}: already upgrading, so no new upgrade is planned.`);continue;}
  if(!names.includes(b.name)){notes.push(`${b.name||'Building'}: choose a recognized building name to estimate its upgrade.`);continue;}
  if(!Number.isInteger(b.level)||b.level<1||b.level>35){notes.push(`${b.name}: enter a whole-number level from 1 to 35 to add its upgrade timing.`);continue;}
  if(!catalog.some(r=>r.building===b.name&&r.from_level===b.level)){notes.push(`${b.name} Lv. ${b.level}: no next upgrade is available in our data. Check its maximum level in-game.`);continue;}
  usable.push(b);
 }
 // Known active buildings still provide prerequisite evidence.
 const known=buildings.filter(b=>names.includes(b.name)&&Number.isInteger(b.level)&&b.level>=1&&b.level<=35);
 return {usable,known,notes};
}
export function activityIssue(i){
 const missing=[];
 if(i.active)return null;
 if(i.category==='research'){
  if(!i.tree)missing.push('research tree');
  if(!i.technology)missing.push('technology');
  if(!Number.isInteger(i.level)||i.level<0||i.level>20)missing.push('current level (0–20)');
  if(!Number.isFinite(i.speed)||i.speed<0||i.speed>5000)missing.push('valid research speed bonus');
 }else{
  if(!i.name?.trim())missing.push('name');
  if(i.category==='troops'){if(!(i.minutes>0&&i.minutes<=1000000))missing.push('full batch duration');}
  else if(!i.goal?.trim())missing.push('upgrade goal');
 }
 if(['owned','needed'].some(k=>i[k]!=null&&i[k]!==''&&(!Number.isFinite(Number(i[k]))||Number(i[k])<0||Number(i[k])>1e9)))missing.push('valid item quantities');
 return missing.length?`Add ${missing.join(', ')} to include this goal. Your other upgrades are still planned.`:null;
}
