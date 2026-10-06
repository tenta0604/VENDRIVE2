import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium } = await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/playwright/index.mjs` : 'playwright');
const base=process.env.VENDRIVE_TEST_BASE_URL||'http://127.0.0.1:8000';
const leafletJs=process.env.VENDRIVE_TEST_LEAFLET_JS?await readFile(process.env.VENDRIVE_TEST_LEAFLET_JS):null;
const leafletCss=process.env.VENDRIVE_TEST_LEAFLET_CSS?await readFile(process.env.VENDRIVE_TEST_LEAFLET_CSS):null;
const route={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.805,35.3],[136.805,35.305],[136.805,35.31],[136.81,35.31]]},summary:{distance:1800,duration:280},waycategory:[[0,4,0]],tollways:[[0,1,0],[1,3,1],[3,4,0]]};
const surfaceRoute={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.804,35.303],[136.807,35.306],[136.81,35.31]]},summary:{distance:1900,duration:310},waycategory:[[0,3,0]],tollways:[[0,3,0]]};
const appVersion=JSON.parse(await readFile(new URL('../version.json',import.meta.url),'utf8')).version;
const evidence=[];
for(const width of [320,390]){
  const profile=await mkdtemp(join(tmpdir(),'vendrive-truck-edge-'));
  const context=await chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.VENDRIVE_EDGE_PATH,channel:process.env.VENDRIVE_EDGE_PATH?undefined:'msedge',viewport:{width,height:932},args:['--no-sandbox']});
  try{
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.addInitScript(()=>{
      const now=new Date(),today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
      const machine=(id,name,lat,lng)=>({id,name,maker:'サントリー',code:id,address:'愛知県一宮市',lat,lng,days:['日','月','火','水','木','金','土'],cycle:'毎日',last:null,visited:false,skip:null,force:null,order:null,memo:'',sales:'',taskDone:{}});
      const seed={machines:[machine('T1','Route test machine',35.31,136.81),machine('T2','No location',null,null)],offices:[],tasks:[],taskHistory:[],history:[],makers:['サントリー'],restDays:[]};
      if(!localStorage.getItem('truckGateSeeded')){localStorage.setItem('vendrive2_v7_data',JSON.stringify(seed));localStorage.setItem('vendrive2_last_day',today);localStorage.setItem('truckGateSeeded','yes');}
      const position={coords:{latitude:35.3,longitude:136.8,accuracy:8,heading:90}};
      Object.defineProperty(navigator,'geolocation',{value:{watchPosition(fn){window.__gpsSuccess=fn;setTimeout(()=>fn(position),0);return 1;},clearWatch(){},getCurrentPosition(fn){setTimeout(()=>fn(position),0);}}});
    });
    let count=0,mode='success',heldResolve,heldStarted,heldDone;
    await page.route('**/*',async request=>{
      const url=request.request().url();
      if(url.includes('/api/route')){
        count++;
        const payload=request.request().postDataJSON();assert.equal(payload.vehicle.weight,4.8);assert.equal(payload.vehicle.height,2.85);
        if(mode==='held'){
          heldStarted();await new Promise(resolve=>heldResolve=resolve);
          try{await request.fulfill({json:{ok:true,route}});}catch{}heldDone();return;
        }
        if(mode==='error'){await request.fulfill({status:429,json:{ok:false,message:'無料枠の取得上限です'}});return;}
        if(mode==='bad'){await request.fulfill({json:{ok:true,route:{...route,geometry:{type:'LineString',coordinates:[]}}}});return;}
        await request.fulfill({json:{ok:true,route:payload.vehicle.avoidTolls?surfaceRoute:route}});return;
      }
      if(url.includes('unpkg.com/leaflet')&&url.includes('leaflet.js')&&leafletJs){await request.fulfill({body:leafletJs,contentType:'application/javascript'});return;}
      if(url.includes('unpkg.com/leaflet')&&url.includes('leaflet.css')&&leafletCss){await request.fulfill({body:leafletCss,contentType:'text/css'});return;}
      if(url.startsWith(base)){await request.continue();return;}
      if(url.includes('unpkg.com/leaflet')){await request.continue();return;}
      await request.abort();
    });
    const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('vendrive2_v7_data')));
    async function openMachine(code){await page.locator('.tabs button[data-page="machinesPage"]').click();await page.locator('#machineSearch').fill(code);await page.locator('#machineResults .result').first().click();await page.locator('#machineModal.open').waitFor();}
    async function waitText(text){await page.waitForFunction(t=>document.getElementById('truckRouteSummary').textContent.includes(t),text);}
    const paths=()=>page.locator('#map path[stroke="#2563eb"], #map path[stroke="#dc2626"], #map path[fill="#2563eb"]').count();
    const roadPathCount=color=>page.locator(`#map path[stroke="${color}"]`).count();
    await page.goto(base+'/index.html',{waitUntil:'load'});
    await page.waitForFunction(()=>window.L&&document.querySelector('#machineSearch').oninput);
    const assetInfo=await page.evaluate(()=>{var script=document.querySelector('script[src^="truck-routing.js"]');var url=new URL(script.src);return {query:url.searchParams.get('v'),runtime:window.VENDRIVETruckRouting&&window.VENDRIVETruckRouting.assetVersion};});
    assert.equal(assetInfo.query,appVersion,'truck-routing.js cache-buster must match app version');assert.equal(assetInfo.runtime,appVersion,'loaded truck-routing.js must match app version');
    await openMachine('T1');await page.locator('#machineRoute').click();
    await page.locator('#truckVehicleModal.open').waitFor();
    assert.equal(await page.locator('#truckVehicle_weight').inputValue(),'');assert.equal(count,0);
    await page.locator('#truckVehicleSave').click();assert.match(await page.locator('#truckVehicleError').innerText(),/全高/);assert.equal(count,0);
    for(const [field,value] of Object.entries({height:'285',width:'189',length:'520',weight:'4800'}))await page.locator('#truckVehicle_'+field).fill(value);
    await page.locator('#truckVehicleAvoidTolls').check();
    await page.locator('#truckVehicleSave').click();await waitText('1.8km');
    assert.equal(count,1);assert.equal((await stored()).routeVehicle.weight,4.8);assert.equal((await stored()).routeVehicle.axleload,undefined);assert.equal((await stored()).routeVehicle.avoidTolls,false);assert.ok(await paths()>=3);assert.match(await page.locator('#mapHighwayToggle').innerText(),/ON/);assert.equal(await page.locator('#mapHighwayToggle').getAttribute('aria-pressed'),'true');
    assert.ok(await roadPathCount('#2563eb')>=1);assert.ok(await roadPathCount('#dc2626')>=1);
    await page.evaluate(()=>{var original=window.VENDRIVETruckRouting.routeSections;window.__routeSectionsCurrent=original;window.VENDRIVETruckRouting.routeSections=function(value){return original(value).map(function(section){return {motorway:section.motorway,tollway:section.tollway,coordinates:section.coordinates};});};});
    await page.locator('#allRoutes').click();assert.ok(await roadPathCount('#dc2626')>=1,'legacy section objects without highlight must still render priority spans red');
    await page.evaluate(()=>{window.VENDRIVETruckRouting.routeSections=window.__routeSectionsCurrent;delete window.__routeSectionsCurrent;});
    await page.locator('#allRoutes').click();
    assert.match(await page.locator('#truckRouteSummary').innerText(),/有料区間あり/);assert.match(await page.locator('#truckRouteSummary').innerText(),/高速優先ON/);
    await page.locator('#mapHighwayToggle').click();await waitText('高速利用OFF');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);assert.equal(count,2);assert.equal((await stored()).routeVehicle.avoidTolls,true);assert.equal(await page.locator('#mapHighwayToggle').getAttribute('aria-pressed'),'false');assert.equal(await roadPathCount('#dc2626'),0);assert.ok(await roadPathCount('#2563eb')>=1);
    await page.locator('#mapHighwayToggle').click();await waitText('高速優先ON');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);assert.equal(count,3);assert.equal((await stored()).routeVehicle.avoidTolls,false);assert.equal(await page.locator('#mapHighwayToggle').getAttribute('aria-pressed'),'true');assert.ok(await roadPathCount('#dc2626')>=1);
    const routePathBefore=await page.locator('#map path[stroke="#2563eb"], #map path[stroke="#dc2626"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('d')).join('|'));
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.3,longitude:136.804,accuracy:8,heading:90}}));await page.waitForTimeout(120);
    const routePathAfter=await page.locator('#map path[stroke="#2563eb"], #map path[stroke="#dc2626"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('d')).join('|'));
    assert.notEqual(routePathAfter,routePathBefore,'travelled route geometry should disappear from the displayed line');
    await page.waitForFunction(()=>document.querySelector('.vendrive-current-position')?.dataset.heading==='90.0');
    const startDisplay=await page.evaluate(()=>({lat:Number(document.querySelector('.vendrive-current-position').dataset.lat),lng:Number(document.querySelector('.vendrive-current-position').dataset.lng)}));
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.304,longitude:136.802,accuracy:8,heading:null}}));
    await page.waitForTimeout(80);
    const midDisplay=await page.evaluate(()=>({lat:Number(document.querySelector('.vendrive-current-position').dataset.lat),lng:Number(document.querySelector('.vendrive-current-position').dataset.lng),heading:Number(document.querySelector('.vendrive-current-position').dataset.heading)}));
    assert.ok(midDisplay.lat>startDisplay.lat&&midDisplay.lat<35.304,'current location should animate between GPS points');assert.ok(Number.isFinite(midDisplay.heading));
    await page.waitForFunction(()=>Math.abs(Number(document.querySelector('.vendrive-current-position').dataset.lat)-35.304)<0.000001);
    const settled=await page.evaluate(()=>({lat:Number(document.querySelector('.vendrive-current-position').dataset.lat),lng:Number(document.querySelector('.vendrive-current-position').dataset.lng)}));
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.33,longitude:136.83,accuracy:250,heading:45}}));await page.waitForTimeout(1300);
    const afterPoor=await page.evaluate(()=>({lat:Number(document.querySelector('.vendrive-current-position').dataset.lat),lng:Number(document.querySelector('.vendrive-current-position').dataset.lng)}));assert.ok(Math.abs(afterPoor.lat-35.304)<0.00001&&Math.abs(afterPoor.lng-136.802)<0.00001,'poor-accuracy GPS must not move the displayed marker');
    const afterSave=await stored();
    await page.locator('#allRoutes').click();await page.locator('#zoomIn').click();
    assert.equal(count,3);assert.ok(await paths()>=2);assert.deepEqual(await stored(),afterSave);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'horizontal overflow');
    await page.locator('#truckRouteRecalculate').click();await waitText('1.8km');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);assert.equal(count,4);
    mode='error';await page.locator('#truckRouteRecalculate').click();await waitText('無料枠');assert.equal(await paths(),0);
    mode='bad';await page.locator('#truckRouteRecalculate').click();await waitText('経路データ');assert.equal(await paths(),0);
    mode='success';await page.locator('#truckRouteRecalculate').click();await waitText('1.8km');
    await page.locator('#truckRouteVehicleSettings').click();await page.locator('#truckVehicleModal.open').waitFor();assert.equal(await page.locator('#truckVehicle_weight').inputValue(),'4800');
    await page.locator('#truckVehicleCancel').click();assert.ok(await paths()>=2);
    const beforeAutoReroute=count;
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.36,longitude:136.86,accuracy:8,heading:45}}));
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.3601,longitude:136.8601,accuracy:8,heading:45}}));
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.3602,longitude:136.8602,accuracy:8,heading:45}}));
    await page.waitForFunction(n=>window.__autoCountReady=(n),beforeAutoReroute).catch(()=>{});
    await page.waitForTimeout(250);assert.equal(count,beforeAutoReroute+1,'three sustained off-route fixes should trigger one automatic reroute');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);
    // A cancelled in-flight response must never restore a cleared route.
    mode='held';const began=new Promise(resolve=>heldStarted=resolve),done=new Promise(resolve=>heldDone=resolve);
    await page.locator('#truckRouteRecalculate').click();await began;await page.locator('#truckRouteEnd').click();heldResolve();await done;
    assert.equal(await page.locator('#truckRoutePanel').isVisible(),false);assert.equal(await paths(),0);
    const beforeMissing=count;await openMachine('T2');await page.locator('#machineRoute').click();assert.equal(count,beforeMissing);await page.locator('#closeMachine').click();
    // Persisted profile survives app reopen; no route request runs by itself.
    await page.reload({waitUntil:'load'});await page.waitForFunction(()=>window.L&&document.querySelector('#machineSearch').oninput);
    await page.locator('.tabs button[data-page="mapPage"]').click();assert.match(await page.locator('#truckVehicleSummary').innerText(),/4.8t/);assert.equal(count,beforeMissing);
    await page.locator('#truckVehicleSettings').click();assert.equal(await page.locator('#truckVehicle_height').inputValue(),'285');assert.equal(await page.locator('#truckVehicleAvoidTolls').isChecked(),true);await page.locator('#truckVehicleCancel').click();
    // Non-map mobile landscape is portrait-guarded, while MAP remains landscape-capable and has a fullscreen fallback.
    await page.evaluate(()=>document.body.classList.add('touchDevice'));await page.setViewportSize({width:932,height:430});await page.locator('.tabs button[data-page="todayPage"]').click();assert.equal(await page.locator('#portraitGuard').isVisible(),true);
    await page.locator('#portraitOpenMap').click();assert.equal(await page.locator('#portraitGuard').isVisible(),false);await page.locator('#allRoutes').click();await page.waitForTimeout(120);
    await page.locator('#mapFullscreen').click();await page.waitForFunction(()=>document.body.classList.contains('mapFullscreen'));var fullBox=await page.locator('#map').boundingBox();assert.ok(fullBox&&fullBox.width>=920&&fullBox.height>=420,'map fullscreen should fill landscape viewport');
    const mapPin=page.locator('.machineMapPinBody').first();await mapPin.waitFor({state:'visible'});await mapPin.click();await page.locator('#machineModal.open').waitFor({state:'visible'});assert.equal(await page.locator('#machineModal.open').isVisible(),true);assert.equal(await page.evaluate(()=>document.body.classList.contains('mapFullscreen')),true);await page.locator('#closeMachine').click();
    await page.locator('#mapFullscreen').click();await page.waitForFunction(()=>!document.body.classList.contains('mapFullscreen'));await page.setViewportSize({width,height:932});
    // The existing explicit external-navigation path remains separate.
    let externalUrl='';await page.route('https://www.google.com/maps/**',async request=>{externalUrl=request.request().url();await request.fulfill({body:'External navigation test',contentType:'text/html'});});
    await openMachine('T1');await page.locator('#machineExternalNav').click();await page.waitForURL('https://www.google.com/maps/**');
    assert.ok(externalUrl.includes('destination=35.31,136.81'));assert.equal(errors.length,0,errors.join('\n'));
    evidence.push({width,browser:context.browser()?.version(),gates:['blank-profile-blocking','exact-unit-conversion','routing-asset-version-match','stale-section-compatibility','dedicated-tollways-extra-red-segmentation','map-highway-toggle','highway-off-avoidance','highway-on-longer-expressway-preference','route-highway-status','portrait-nonmap-guard','landscape-map-fullscreen','fullscreen-pin-machine-modal','heading-arrow','smooth-GPS-animation','travelled-line-disappears','off-route-auto-reroute','poor-accuracy-display-suppression','road-geometry','marker-only-GPS','route-survives-map-rerender','recalculate','quota-and-malformed-errors','late-response-cancellation','missing-destination','persistence','external-navigation','no-horizontal-overflow','no-page-errors'],status:'PASS'});
    console.log(`PASS truck route browser ${width}px`);
  }finally{await context.close();await rm(profile,{recursive:true,force:true});}
}
console.log(JSON.stringify({status:'PASS',evidence},null,2));

