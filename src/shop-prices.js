export function regularGemPrice(paid,discount=0,quantity=1){if(!Number.isFinite(paid)||paid<0||!Number.isFinite(discount)||discount<0||discount>=100||!Number.isFinite(quantity)||quantity<=0)throw new RangeError('Invalid shop price');return paid/(1-discount/100)/quantity;}
export const screenshotPrices={
 '200002':{paid:2000,photo:1},'210130':{paid:10,quantity:10,photo:2},'210141':{paid:10,quantity:10,photo:2},
 '210931':{paid:40,discount:60,photo:4},'210941':{paid:40,discount:60,photo:4},'210951':{paid:40,discount:60,photo:4},'210961':{paid:40,discount:60,photo:4},
 '230104':{paid:4,discount:40,quantity:20,photo:3},'230111':{paid:2,discount:60,photo:4},'230101':{paid:15,discount:85,photo:4},
 '210318':{paid:40,discount:20,photo:3},'210319':{paid:200,discount:50,photo:3},'210922':{paid:160,discount:80,photo:3},'210923':{paid:480,discount:80,photo:3},
 '230100':{paid:400,photo:2},'200203':{paid:120,photo:2},'200201':{paid:10,photo:2},'200205':{paid:810,photo:2}
};
export const verifiedGemPrices=Object.fromEntries(Object.entries(screenshotPrices).map(([id,p])=>[id,regularGemPrice(p.paid,p.discount??0,p.quantity??1)]));
export const verifiedCustomRates={books:verifiedGemPrices['230101'],purpleShards:verifiedGemPrices['210319'],blueShards:verifiedGemPrices['210318'],universal:verifiedGemPrices['200203'],alloy:verifiedGemPrices['230104'],recruit:verifiedGemPrices['230100']};
