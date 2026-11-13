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
   const d=new Date(),today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),prior=new Date(d);prior.setDate(prior.getDate()-1);const yesterday=prior.getFullYear()+'-'+String(prior.getMonth()+1).padStart(2,'0')+'-'+String(prior.getDate()).padStart(2,'0');
   const machine={id:'E1',name:'External navigation machine',maker:'サントリー',code:'M-EXT',address:'愛知県一宮市',lat:35.31,lng:136.81,days:['日','月','火','水','木','金','土'],cycle:'毎日',last:yesterday,temporaryVisitCycles:[{periodId:'FULL',cycle:'1ヶ月に1回',days:['日','月','火','水','木','金','土']}],visited:false,skip:null,force:null,order:null,memo:'',sales:'',taskDone:{}};
   const office={id:'OFF-E',name:'External navigation office',address:'愛知県一宮市',lat:35.33,lng:136.83};
   const site={id:'DL-E',name:'External navigation delivery',code:'D-001',address:'愛知県一宮市',lat:35.32,lng:136.82,memo:'',createdAt:Date.now()};
   const request={id:'REQ-E',siteId:'DL-E',siteName:site.name,siteCode:site.code,status:'pending',createdAt:Date.now(),completedAt:null,scheduledDate:today,items:[{name:'お茶',quantity:'2',unit:'ケース',sellPrice:'130円／本'}],memo:''};
   if(!localStorage.getItem('externalGateSeeded')){localStorage.setItem('vendrive2_v7_data',JSON.stringify({machines:[machine],offices:[office],deliverySites:[site],deliveryRequests:[request],temporaryVisitPeriods:[{id:'FULL',name:'通年',start:'01-01',end:'12-31'}],history:[],tasks:[],taskHistory:[],makers:['サントリー'],restDays:[]}));localStorage.setItem('vendrive2_last_day',today);localStorage.setItem('externalGateSeeded','yes')}
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
    for(const id of ['manageVisitPeriods','visitPeriodsModal','addTemporaryCycle','temporaryCycleList','addNewTemporaryCycle','newTemporaryCycleList','temporaryCycleModal','temporaryPeriodSelectModal'])assert.equal(await page.locator('#'+id).count(),0,'retired temporary-cycle UI must be removed: '+id);
    const archive=await page.evaluate(()=>JSON.parse(localStorage.getItem('vendrive2_v7_data')));
    assert.equal(archive.temporaryVisitPeriods.length,1,'archived season/period must remain on local state');
    assert.equal(archive.machines[0].temporaryVisitCycles[0].cycle,'1ヶ月に1回','historical monthly override must not be deleted');
    assert.equal(await page.locator('#todayList .swipeRow[data-machine-id="E1"]').count(),1,'daily normal visit must win against archived monthly override');
  };
  const external=async fragment=>{
   await page.waitForURL(/google\.com\/maps\/dir\/\?/,{timeout:10000});
   const url=page.url();assert.ok(decodeURIComponent(url).includes(fragment),'external nav must point to '+fragment+' rather than '+url);
  };
  await open();await checkRetired();
  assert.equal(network.routeCalls,0,'browser must not request HGV route on app open');
  assert.equal(network.routeScript,0,'legacy route module must not load');
  assert.equal(await page.locator('#todayDeliverySection').count(),0,'separate Today delivery section must be removed');
  assert.equal(await page.locator('#todayList .swipeRow[data-delivery-id]').count(),1,'delivery card must appear in same Today list');
  assert.equal(await page.locator('#todayList .swipeRow').count(),2,'one machine plus one delivery share a list');
  assert.equal(await page.locator('#todayList .deliverySwipeCard .todayCardActions').count(),1,'delivery card uses machine layout');
  assert.equal(await page.locator('#heroTotal').innerText(),'2','one machine plus one delivery must remain');
  const quickMachine=page.locator('#todayList .todayExternalNav').first();
  const quickDelivery=page.locator('#todayList .deliverySwipeCard .deliveryQuickNav').first();
  assert.equal(await quickMachine.count(),1,'Today vending card needs one-tap external navigation');
  assert.equal(await quickDelivery.count(),1,'Today delivery card needs one-tap external navigation');
  assert.match(await page.locator('#todayNavSafety').innerText(),/車高・車幅・重量条件/,'Today shortcut must warn about missing truck constraints');
  // Touch starting on the navigation button must not trigger the card's swipe gesture.
  await quickMachine.evaluate(el=>{
   const p=(type,x)=>new PointerEvent(type,{bubbles:true,pointerId:77,pointerType:'touch',clientX:x,clientY:220,isPrimary:true});
   el.dispatchEvent(p('pointerdown',180));el.dispatchEvent(p('pointermove',50));el.dispatchEvent(p('pointerup',50));
  });
  assert.equal(await page.locator('#todayList .swipeRow.revealComplete').count(),0,'nav touch must not reveal swipe completion');
  assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('vendrive2_v7_data')))).machines[0].visited,false,'nav touch must not complete machine');
  await quickMachine.click();await external('destination=35.31,136.81');
  await open();
  assert.equal(await page.locator('#machineModal.open').count(),0,'Today shortcut must skip machine details');
  await page.locator('#todayList .swipeCard .makerChip').first().click();
  await page.locator('#machineModal.open').waitFor({state:'visible'});
  await page.locator('#closeMachine').click();
  await page.locator('#todayList .deliverySwipeCard .deliveryCardMain').click();
  await page.locator('#deliverySiteDetail.open').waitFor({state:'visible'});
  await page.locator('#deliveryDetailClose').click();
  assert.equal(await page.locator('#todayList .deliverySwipeCard [data-action="edit"]').count(),0,'Today delivery uses single swipe card, no edit button');
  assert.equal(await page.locator('#deliveryPendingList [data-action="edit"]').count(),1,'delivery tab edit action must remain');
  assert.equal(await page.locator('#todayList .deliverySwipeCard [data-action="complete"]').count(),0,'Today delivery completes by swipe');
  assert.equal(await page.locator('#deliveryPendingList [data-action="complete"]').count(),1,'delivery management explicit completion remains');
  await page.locator('#todayList .deliverySwipeCard .deliveryQuickNav').first().click();await external('destination=35.32,136.82');
  await open();
  const afterShortcuts=await page.evaluate(()=>JSON.parse(localStorage.getItem('vendrive2_v7_data')));
  assert.equal(afterShortcuts.machines[0].visited,false,'navigation must not mark machine visited');
  assert.equal(afterShortcuts.deliveryRequests[0].status,'pending','navigation must not complete delivery');
  assert.equal(await page.locator('#heroTotal').innerText(),'2','shortcuts must not modify Today count');
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
  await page.locator('.tabs button[data-page="todayPage"]').click();
  const deliveryRow=page.locator('#todayList .swipeRow[data-delivery-id]').first();
  const swipe=async dir=>{
   await deliveryRow.locator('.swipeCard').evaluate((el,direction)=>{
    const start=200,end=direction==='left'?90:310,pid=430;
    const send=(type,x)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:pid,pointerType:'touch',clientX:x,clientY:200,isPrimary:true}));
    send('pointerdown',start);send('pointermove',end);send('pointerup',end);
   },dir);
  };
  await swipe('right');
  assert.equal(await page.locator('#todayList .swipeRow[data-delivery-id].revealSkip').count(),0,'right swipe cannot skip delivery');
  assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('vendrive2_v7_data')))).deliveryRequests[0].status,'pending','right swipe must not change delivery');
  await swipe('left');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('vendrive2_v7_data')).deliveryRequests[0].status==='done');
  assert.equal(await page.locator('#heroDone').innerText(),'1','delivery swipe increments progress exactly once');
  assert.equal(await page.locator('#heroTotal').innerText(),'2','delivery swipe retains combined total');
  assert.equal(await page.locator('#todayList .swipeRow[data-delivery-id] .swipeCard.done').count(),1,'completed delivery stays in unified Today list');
  assert.equal(await page.locator('#deliveryHistoryList').innerText().then(t=>t.includes('130円／本')),true,'swiped completion preserves history and price');
  assert.equal(network.routeCalls,0,'NO backend route requests anywhere in user flow');
  assert.equal(network.routeScript,0,'NO retired in-app route module download');
  assert.equal(errors.length,0,errors.join('\n'));
  evidence.push({width,status:'PASS',gates:['unified Today machine+delivery cards','left delivery swipe completes and appears in history','right delivery swipe no-op','direct Today machine+delivery nav','normal tap opens delivery details','no accidental detail/swipe/complete','Today truck constraint warning','no route client loaded','no route API','no vehicle/highway/route controls','machine Google Maps destination','office Google Maps destination','delivery Google Maps destination','2t external nav caution','Today mixed tally','delivery+machine map pins','fullscreen map without route','delivery pin editor survives','data preservation','no page errors']});
  console.log('PASS external-navigation-only real Edge '+width+'px');
 }finally{await context.close();await rm(profile,{recursive:true,force:true})}
}
console.log(JSON.stringify({status:'PASS',evidence},null,2));
