import {parseScreens} from './planner.js';
const normalized=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
export function gridRows(data,names,width,height,allowWithoutTitle=false){
 if((!allowWithoutTitle&&!/building\s*list/i.test(data.text))||width/height<.38||width/height>.55)return [];
 const lines=(data.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[])).sort((a,b)=>a.bbox.y0-b.bbox.y0);
 const rows=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i],y=line.bbox.y0;if(y<height*.25||y>height*.88)continue;
  const text=normalized(line.text),next=lines[i+1]&&lines[i+1].bbox.y0-y<height*.04?normalized(lines[i+1].text):'';
  const match=names.some(name=>{const expected=normalized(name),first=normalized(name.split(' ')[0]);return text.includes(expected)||(first.length>=4&&text.includes(first)&&(text+next).includes(expected));});
  if(match&&!rows.some(r=>Math.abs(r-y)<height*.055))rows.push(y);
 }
 return rows;
}
export function levelFromCard(text){
 if(/max\s*level/i.test(text))return null;
 // The outlined digit 1 can appear as a closing bracket in this border-free crop.
 const corrected=text.trim().replace(/^(Lv\.?\s*[.:]?\s*[1-3])\s*[\]|]$/i,(_,prefix)=>prefix+'1');
 const matches=[...corrected.matchAll(/\d+/g)];
 if(matches.length!==1)return null;
 const level=Number(matches[0][0]);return level>=1&&level<=35?level:null;
}
export function gridLevelTop(data,nameTop,width){
 const scale=width/589,lines=(data.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[]));
 const above=lines.filter(l=>l.bbox.y0>=nameTop-55*scale&&l.bbox.y0<=nameTop-15*scale&&l.bbox.y1-l.bbox.y0<36*scale&&l.bbox.x1-l.bbox.x0<100*scale&&/[\d£v]/i.test(l.text));
 return above.length?above.map(l=>l.bbox.y0).sort((a,b)=>a-b)[Math.floor(above.length/2)]:nameTop-28*scale;
}
// Separate white lettering from its dark outline using the card's own background.
export function cleanLevelPixels(image){
 const hist=new Uint32Array(256),gray=new Uint8Array(image.data.length/4);
 for(let i=0;i<gray.length;i++){const p=i*4;gray[i]=Math.round(image.data[p]*.299+image.data[p+1]*.587+image.data[p+2]*.114);hist[gray[i]]++;}
 let median=0,count=0;for(;median<255;median++){count+=hist[median];if(count>=gray.length/2)break;}
 for(let i=0;i<gray.length;i++){const p=i*4,value=255-Math.min(255,Math.max(0,Math.round((gray[i]-median)*255/Math.max(1,255-median))));image.data[p]=image.data[p+1]=image.data[p+2]=value;image.data[p+3]=255;}
 return image;
}
function crop(source,x,y,width,height,clean=false){
 const small=document.createElement('canvas');small.width=Math.ceil(width);small.height=Math.ceil(height);const ctx=small.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,x,y,width,height,0,0,small.width,small.height);
 if(clean)ctx.putImageData(cleanLevelPixels(ctx.getImageData(0,0,small.width,small.height)),0,0);
 const out=document.createElement('canvas');out.width=small.width*6+40;out.height=small.height*6+40;const dest=out.getContext('2d',{willReadFrequently:!!clean});dest.fillStyle='white';dest.fillRect(0,0,out.width,out.height);dest.imageSmoothingEnabled=true;dest.imageSmoothingQuality='high';dest.drawImage(small,20,20,small.width*6,small.height*6);
 return out;
}
// A confident digits-only pass repairs outline artifacts; weak guesses never override the label.
export function chooseLevel(label,...digits){
 const displayed=levelFromCard(label.text);
 for(const reading of digits){
  const numeric=levelFromCard(reading.text);
  if(numeric!==null&&reading.confidence>=90&&(displayed===null||String(numeric).length===String(displayed).length))return numeric;
 }
 // A conflicting numeric read is evidence that the outlined label is ambiguous.
 if(digits.some(r=>r.confidence>=85&&levelFromCard(r.text)!==null&&levelFromCard(r.text)!==displayed&&String(levelFromCard(r.text)).length===String(displayed).length))return null;
 return label.confidence>=40?displayed:null;
}
export async function decodeScreenshot(file){
 if(typeof createImageBitmap==='function')try{return await createImageBitmap(file);}catch{}
 const url=URL.createObjectURL(file),image=new Image();
 try{image.src=url;await image.decode();return {source:image,width:image.naturalWidth,height:image.naturalHeight,close:()=>URL.revokeObjectURL(url)};}
 catch(error){URL.revokeObjectURL(url);throw error;}
}
export function hasUpgradeBar(image){
 let rows=0;
 for(let y=0;y<image.height;y++){let green=0;for(let x=0;x<image.width;x++){const p=(y*image.width+x)*4,r=image.data[p],g=image.data[p+1],b=image.data[p+2];if(g>120&&g>r*1.35&&g>b*1.3)green++;}if(green>image.width*.55)rows++;}
 return rows>=Math.max(2,image.height*.08);
}
export async function readBuildingScreenshot(worker,file,names,onCard=()=>{},onStage=()=>{}){
 onStage('decode');
 const decoded=await decodeScreenshot(file);
 try{
  // Keep card OCR at the same tested resolution on Retina phones and desktops.
  const image=document.createElement('canvas');image.width=Math.min(589,decoded.width);image.height=Math.round(decoded.height*image.width/decoded.width);
  const context=image.getContext('2d');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(decoded.source||decoded,0,0,image.width,image.height);
  onStage('detect_grid');
  const {data}=await worker.recognize(image,{}, {text:true,blocks:true});
  const ordinary=parseScreens(data.text,names);
  let rows=gridRows(data,names,image.width,image.height),layout=data;
  if(/building\s*list/i.test(data.text)||ordinary.buildings.length>=4){
   await worker.setParameters({tessedit_pageseg_mode:'11'});
   const sparse=(await worker.recognize(image,{}, {text:true,blocks:true})).data;
   const candidate=gridRows(sparse,names,image.width,image.height,true);
   // A missing OCR heading must not disable card reading. Require repeated
   // card rows and horizontal evidence before accepting an untitled grid.
   const lines=(sparse.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[]));
   const columns=lines.filter(l=>candidate.some(y=>Math.abs(l.bbox.y0-y)<image.height*.04)&&l.bbox.x0>image.width*.4);
   if(/building\s*list/i.test(data.text)||(candidate.length>=2&&columns.length>=2)){
    layout=sparse;if(candidate.length>=rows.length)rows=candidate;
   }
  }
  if(!rows.length)return {...ordinary,diagnostics:{mode:'text',width:decoded.width,height:decoded.height,rows:0}};
  onStage('read_cards');
  const cardSource=decoded.source||decoded,scale=decoded.width/589,found=[];
  for(let r=0;r<rows.length;r++)for(let c=0;c<4;c++){
   onCard(r*4+c+1,rows.length*4);
   await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:''});
   const top=gridLevelTop(layout,rows[r],image.width)*decoded.width/image.width;
   const label=await worker.recognize(crop(cardSource,(28+c*136)*scale,top+25*scale,128*scale,46*scale));
   const parsed=parseScreens(label.data.text.replace(/\n/g,' '),names).buildings;
   if(parsed.length!==1)continue;
   await worker.setParameters({tessedit_pageseg_mode:'7'});
   const level=await worker.recognize(crop(cardSource,(42+c*136)*scale,top-4*scale,96*scale,28*scale,true));
   await worker.setParameters({tessedit_char_whitelist:'0123456789'});
   const digits=await worker.recognize(crop(cardSource,(94+c*136)*scale,top-5*scale,30*scale,29*scale));
   const widerDigits=await worker.recognize(crop(cardSource,(90+c*136)*scale,top-5*scale,34*scale,29*scale));
   const value=chooseLevel(level.data,digits.data,widerDigits.data);
   const confirmed=parseScreens(`Lv.${value??'?'}\n${parsed[0].name}`,names,1,35,{isolatedCard:true}).buildings[0];
   // Read the timer in the same card; never borrow another building's timer.
   const timerCanvas=document.createElement('canvas');timerCanvas.width=Math.ceil(121*scale);timerCanvas.height=Math.ceil(42*scale);const timerContext=timerCanvas.getContext('2d',{willReadFrequently:true});timerContext.drawImage(cardSource,(29+c*136)*scale,top-68*scale,121*scale,42*scale,0,0,timerCanvas.width,timerCanvas.height);
   confirmed.active=hasUpgradeBar(timerContext.getImageData(0,0,timerCanvas.width,timerCanvas.height));
   confirmed.ocr={mode:'grid',confidence:Math.max(level.data.confidence,digits.data.confidence,widerDigits.data.confidence)};
   found.push(confirmed);
  }
  return {buildings:found.length?found:ordinary.buildings,speed:ordinary.speed,diagnostics:{mode:found.length?'grid':'text',width:decoded.width,height:decoded.height,rows:rows.length}};
 }finally{decoded.close?.();await worker.setParameters({tessedit_pageseg_mode:'3',tessedit_char_whitelist:''});}
}

