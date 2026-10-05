// Real game artwork, displayed from owner-approved examples without altering the screenshots.
const locations={
 'Trade Center':['building-list',0,0], 'Wanderer Camp':['building-list',1,0],
 'Smelting Plant':['building-list',2,0], 'Warehouse':['building-list',0,1],
 'Training Ground':['building-list',0,2], 'Residence':['building-list',2,2],
 'Lumberyard':['building-list',1,3], 'Farmhouse':['building-list',2,3],
 'Radar':['building-list-military',0,0], 'Formation':['building-list-military',1,0],
 'Restaurant':['building-list-military',3,0], 'Dawn Tower':['building-list-military',1,1],
 'Order Hall':['building-list-military',2,1], 'Toxic Garden':['building-list-military',0,2],
 'Hospital':['building-list-military',1,2], 'Rally Square':['building-list-military',2,2],
 'Assaulter Camp':['building-list-military',0,3], 'Shooter Camp':['building-list-military',1,3],
 'Rider Camp':['building-list-military',2,3], 'Lab No.2':['building-list-shelter-end',1,0],
 'Villa':['building-list-shelter-end',2,0], 'Alliance Center':['building-list-shelter-end',3,0],
 'Military Center':['building-list-shelter-end',0,1], 'Headquarters':['building-list-shelter-end',1,1],
 'City Walls':['building-list-shelter-end',2,1], 'Laboratory':['building-list-shelter-end',3,1],
 'Wind Turbine':['building-list-shelter-middle',2,1], 'Bookstore':['building-list-shelter-middle',0,3],
 'Production Center':['building-list-shelter-middle',3,3]
};
export function buildingArtwork(name){
 const location=locations[name];if(!location)return null;
 const [file,col,row]=location,x=29+col*136,y=(file.endsWith('middle')?228:237)+row*204;
 return {url:`./examples/${file}.jpg`,x,y,width:123,height:106};
}
export function buildingIcon(name){
 const art=buildingArtwork(name);
 if(!art)return '<span class="building-art fallback" aria-hidden="true">'+(name.match(/[A-Z]/g)||['?']).slice(0,2).join('')+'</span>';
 return `<span class="building-art" aria-hidden="true" style="background-image:url('${art.url}');background-size:${589/art.width*100}% ${1280/art.height*100}%;background-position:${art.x/(589-art.width)*100}% ${art.y/(1280-art.height)*100}%"></span>`;
}
