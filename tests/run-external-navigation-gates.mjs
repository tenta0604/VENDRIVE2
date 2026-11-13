import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const {chromium}=await import('playwright');
const base=process.env.VENDRIVE_TEST_BASE_URL||'http://127.0.0.1:8000';
const leafletJs=process.env.VENDRIVE_TEST_LEAFLET_JS?await readFile(process.env.VENDRIVE_TEST_LEAFLET_JS):null;
const leafletCss=process.env.VENDRIVE_TEST_LEAFLET_CSS?await readFile(process.env.VENDRIVE_TEST_LEAFLET_CSS):null;
const evidence=[];
for(const width of [320,390]){
 const profile=await mkdtemp(join(tmpdir(),'vendrive-external-only-edge-'));
 const context=await chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.VENDRIVE_EDGE_PATH,channel:process.env.VENDRIVE_EDGE_PATH?undefined:'msedge',viewport:{width,height:932},args:['--no-sandbox']});
 try{
  const page=await context.newPage(),errors=[],network={routeCalls:0,routeScript:0,external:[]};
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
   const d=new Date(),today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
   const machine={id:'E1',name:'External navigation machine',maker:'サントリー',code:'M-EXT',address:'愛知県一宮市',lat:35.31,lng:136.81,days:['日','月','火','水','木','金','土'],cycle:'毎日',last:null,visited:false,skip:null,force:null,order:null,memo:'',sales:'',taskDone:{}};
   const office={id:'OFF-E',name:'External navigation office',address:'愛知県一宮市',lat:35.33,lng:136.83};
   const site={id:'DL-E',name:'External navigation delivery',code:'D-001',address:'愛知県一宮市',lat:35.32,lng:136.82,memo:'',createdAt:Date.now()};
   const request={id:'REQ-E',siteId:'DL-E',siteName:site.name,siteCode:site.code,status:'pending',createdAt:Date.now(),completedAt:null,scheduledDate:today,items:[{name:'お茶',quantity:'2',unit:'ケース',sellPrice:'130円／本'}],memo:''};
   if(!localStorage.getItem('externalGateSeeded')){localStorage.setItem('vendrive2_v7_data',JSON.stringify({machines:[machine],offices:[office],deliverySites:[site],deliveryRequests:[request],history:[],tasks:[],taskHistory:[],makers:['サントリー'],restDays:[]}));localStorage.setItem('vendrive2_last_day',today);localStorage.setItem('externalGateSeeded','yes')}
   const position={coords:{latitude:35.3,longitude:136.8,accuracy:8,heading:90}};
   Object.defineProperty(navigator,'geolocation',{value:{watchPosition(fn){window.__gps=fn;setTimeout(()=>fn(position),0);return 1},clearWatch(){},getCurrentPosition(fn){setTimeout(()=>fn(position),0)}}});
  });
  await page.route('**/*',async route=>{
    const url=route.request().url();
    if(url.includes('/api/route')){network.routeCalls++;await route.fulfill({status:503,body:'in-app route is retired'});return}
    if(url.includes('truck-routing.js')){network.routeScript++;await route.fulfill({status:503,body:'in-app route engine must not load'});return}
    if(url.startsWith('https://www.google.com/maps/')){network.external.push(url);await route.fulfill({status:200,contentType:'text/html',body:'<html><body>EXTERNAL NAV TEST</body></html>'});return}
    if(url.includes('unpkg.com/leaflet')&&url.includes('leaflet.js')&&leafletJs){await route.fulfill({body:leafletJs,contentType:'application/javascript'});return}
    if(url.includes('unpkg.com/leaflet')&&url.includes('leaflet.css')&&leafletCss){await route.fulfill({body:leafletCss,contentType:'text/css'});return}
    if(url.includes('cyberjapandata.gsi.go.jp')){await route.fulfill({status:404,body:''});return}
    await route.continue();
  });
  const open=async()=>{
   await page.goto(base+'/index.html?externalGate='+Date.now(),{waitUntil:'domcontentloaded'});
   await page.locator('#deliveryNav').waitFor({state:'attached'});
   await page.waitForFunction(()=>document.getElementById('heroTotal')?.textContent==='2');
  };
  const checkRetired=async()=>{
   const result=await page.evaluate(()=>({oldScript:!!document.querySelector('script[src*="truck-routing.js"]'),oldGlobal:!!window.VENDRIVETruckRouting,routePanel:!!document.getElementById('truckRoutePanel'),vehicle:!!document.getElementById('truckVehicleModal'),truckSettings:!!document.getElementById('truckVehicleSettings'),highway:!!document.getElementById('mapHighwayToggle'),machineRoute:!!document.getElementById('machineRoute'),deliveryRoute:!!document.getElementById('deliveryDetailRoute'),machineNav:!!document.getElementById('machineExternalNav'),siteNav:!!document.getElementById('deliveryDetailExternal'),today:document.getElementById('heroTotal').textContent}));
   for(const k of ['oldScript','oldGlobal','routePanel','vehicle','truckSettings','highway','machineRoute','deliveryRoute'])assert.equal(result[k],false,k+' must be retired');
   assert.equal(result.machineNav,true);assert.equal(result.siteNav,true);assert.equal(result.today,'2');
  };
  const external=async fragment=>{
   await page.waitForURL(/google\.com\/maps\/dir\/\?/,{timeout:10000});
   const url=page.url();assert.ok(decodeURIComponent(url).includes(fragment),'external nav must point to '+fragment+' rather than '+url);
  };
  await open();await checkRetired();
  assert.equal(network.routeCalls,0,'browser must not request HGV route on app open');
  assert.equal(network.routeScript,0,'legacy route module must not load');
  assert.equal(await page.locator('#todayDeliveryList .item').count(),1,'delivery Today remains active');
  assert.equal(await page.locator('#heroTotal').innerText(),'2','one machine plus one delivery must remain');
  await page.locator('.tabs button[data-page="machinesPage"]').click();
  await page.locator('#machineSearch').fill('M-EXT');
  await page.locator('#machineResults .result').first().click();
  await page.locator('#machineModal.open').waitFor({state:'visible'});
  assert.equal(await page.locator('#machineExternalNav').count(),1);
  await page.locator('#machineExternalNav').click();await external('destination=35.31,136.81');
  await open();
  await page.locator('.tabs button[data-page="mapPage"]').click();
  assert.equal(await page.locator('#externalNavSafety').count(),1,'warn external navigation does not inherit 2t vehicle limits');
  assert.match(await page.locator('#externalNavSafety').innerText(),/車高|車幅|重量/);
  await page.locator('#officeList button').first().click();await external('destination=35.33,136.83');
  await open();
  await page.locator('.tabs button[data-page="deliveryPage"]').click();
  await page.locator('#deliverySitesList [data-action="details"]').click();
  await page.locator('#deliverySiteDetail.open').waitFor({state:'visible'});
  assert.equal(await page.locator('#deliveryDetailRoute').count(),0);
  await page.locator('#deliveryDetailExternal').click();await external('destination=35.32,136.82');
  await open();
  await page.locator('.tabs button[data-page="mapPage"]').click();
  await page.locator('.vendrive-delivery-pin').first().waitFor({state:'visible'});
  await page.locator('.vendrive-machine-pin').first().waitFor({state:'visible'});
  assert.equal(await page.locator('#mapCrosshair').isVisible(),false);
  await page.locator('#mapFullscreen').click();
  assert.equal(await page.evaluate(()=>document.body.classList.contains('mapFullscreen')),true);
  await page.locator('#mapFullscreen').click();
  await page.locator('.tabs button[data-page="deliveryPage"]').click();
  await page.locator('#deliverySitesList [data-action="details"]').click();
  await page.locator('#deliveryDetailEdit').click();
  await page.locator('#deliverySitePickPin').click();
  await page.locator('#mapPositionBar').waitFor({state:'visible'});
  await page.locator('#mapPositionCancel').click();
  await page.locator('#deliverySiteEditor.open').waitFor({state:'visible'});
  await page.locator('#deliverySiteEditorCancel').click();
  const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('vendrive2_v7_data')));
  assert.equal(data.machines.length,1);assert.equal(data.offices.length,1);assert.equal(data.deliverySites.length,1);assert.equal(data.deliveryRequests.length,1);
  assert.equal(data.deliveryRequests[0].items[0].sellPrice,'130円／本','price-as-memo history unchanged');
  assert.equal(network.routeCalls,0,'NO backend route requests anywhere in user flow');
  assert.equal(network.routeScript,0,'NO retired in-app route module download');
  assert.equal(errors.length,0,errors.join('\n'));
  evidence.push({width,status:'PASS',gates:['no route client loaded','no route API','no vehicle/highway/route controls','machine Google Maps destination','office Google Maps destination','delivery Google Maps destination','2t external nav caution','Today mixed tally','delivery+machine map pins','fullscreen map without route','delivery pin editor survives','data preservation','no page errors']});
  console.log('PASS external-navigation-only real Edge '+width+'px');
 }finally{await context.close();await rm(profile,{recursive:true,force:true})}
}
console.log(JSON.stringify({status:'PASS',evidence},null,2));
