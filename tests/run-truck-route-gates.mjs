import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium } = await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/playwright/index.mjs` : 'playwright');
const base=process.env.VENDRIVE_TEST_BASE_URL||'http://127.0.0.1:8000';
const leafletJs=process.env.VENDRIVE_TEST_LEAFLET_JS?await readFile(process.env.VENDRIVE_TEST_LEAFLET_JS):null;
const leafletCss=process.env.VENDRIVE_TEST_LEAFLET_CSS?await readFile(process.env.VENDRIVE_TEST_LEAFLET_CSS):null;
const route={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.805,35.3],[136.805,35.305],[136.805,35.31],[136.81,35.31]]},summary:{distance:1800,duration:280},waycategory:[[0,4,0]],tollways:[[0,1,0],[1,3,1],[3,4,0]],maneuvers:[{type:11,at:0},{type:1,at:2}]};
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
      const t1=machine('T1','Route test machine',35.31,136.81),t3=machine('T3','Nearby planned machine',35.31025,136.8102),t4=machine('T4','Today swipe skip machine',35.32,136.82),office={id:'OFF1',name:'Route test office',address:'愛知県一宮市営業所',lat:35.33,lng:136.83};t1.order={type:'商品関連',sub:'欠品',detail:'到着テスト',createdAt:Date.now()};const seed={machines:[t1,machine('T2','No location',null,null),t3,t4],offices:[office],tasks:[{id:'TASK-ARRIVAL',text:'到着確認タスク',target:'selected',targetType:'selected',targetMachineIds:['T1'],completionThresholdPercent:100,createdAt:Date.now(),completed:false},{id:'TASK-ARRIVAL-2',text:'二件目の全表示タスク',target:'selected',targetType:'selected',targetMachineIds:['T1'],completionThresholdPercent:100,createdAt:Date.now()+1,completed:false}],taskHistory:[],history:[],makers:['サントリー'],restDays:[]};
      if(!localStorage.getItem('truckGateSeeded')){localStorage.setItem('vendrive2_v7_data',JSON.stringify(seed));localStorage.setItem('vendrive2_last_day',today);localStorage.setItem('truckGateSeeded','yes');}
      const position={coords:{latitude:35.3,longitude:136.8,accuracy:8,heading:90}};
      Object.defineProperty(navigator,'geolocation',{value:{watchPosition(fn){window.__gpsSuccess=fn;setTimeout(()=>fn(position),0);return 1;},clearWatch(){},getCurrentPosition(fn){setTimeout(()=>fn(position),0);}}});
    });
    let count=0,mode='success',heldResolve,heldStarted,heldDone,routePayloads=[];
    await page.route('**/*',async request=>{
      const url=request.request().url();
      if(url.includes('/api/route')){
        count++;
        const payload=request.request().postDataJSON();routePayloads.push(payload);assert.equal(payload.vehicle.weight,4.8);assert.equal(payload.vehicle.height,2.85);
        if(mode==='held'){
          heldStarted();await new Promise(resolve=>heldResolve=resolve);
          try{await request.fulfill({json:{ok:true,route}});}catch{}heldDone();return;
        }
        if(mode==='error'){await request.fulfill({status:429,json:{ok:false,message:'無料枠の取得上限です'}});return;}
        if(mode==='bad'){await request.fulfill({json:{ok:true,route:{...route,geometry:{type:'LineString',coordinates:[]}}}});return;}
        await request.fulfill({json:{ok:true,route:payload.vehicle.avoidTolls?surfaceRoute:route,selection:payload.vehicle.avoidTolls?'highway-avoided':'active-highway-unavailable',usage:{motorwayMeters:0},highwaySearch:{attempted:!payload.vehicle.avoidTolls,junctionQueryStatus:payload.vehicle.avoidTolls?'not-requested':'ok',junctions:payload.vehicle.avoidTolls?0:4,evaluated:payload.vehicle.avoidTolls?0:2,accepted:0,finalEligible:0,viaTimeouts:1,viaProviderRejected:1,viaNoFeature:0,viaLowMotorway:0,viaErrors:0,motorwayTargetMeters:5000,bestExistingMotorwayMeters:0}}});return;
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
    async function swipeRow(locator,direction){const box=await locator.boundingBox();assert.ok(box,'swipe row must have a box');const startX=box.x+box.width/2,startY=box.y+box.height/2,endX=startX+(direction==='right'?100:-100);await page.mouse.move(startX,startY);await page.mouse.down();await page.mouse.move(endX,startY,{steps:6});await page.mouse.up();await page.waitForTimeout(220);}
    async function swipeRowRotated(locator,direction){const box=await locator.boundingBox();assert.ok(box,'rotated swipe row must have a box');const startX=box.x+box.width/2,startY=box.y+box.height/2,endY=startY+(direction==='right'?100:-100);await page.mouse.move(startX,startY);await page.mouse.down();await page.mouse.move(startX,endY,{steps:6});await page.mouse.up();await page.waitForTimeout(220);}
    const paths=()=>page.locator('#map path[stroke="#00e5ff"], #map path[stroke="#dc2626"], #map path[fill="#00e5ff"]').count();
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
    assert.equal(count,1);assert.equal(routePayloads[0].heading,undefined,'initial route must stay direction-agnostic');
    const diagnostic=page.locator('#truckRouteDiagnostics');assert.equal(await diagnostic.isVisible(),true,'diagnostic disclosure must be accessible after route success');
    await diagnostic.locator('summary').click();const report=await page.locator('#truckRouteDiagnosticsText').innerText();
    assert.match(report,/高速設定：ON/);assert.match(report,/IC取得件数：4/);assert.match(report,/IC組合せ評価数：2/);assert.match(report,/応答拒否 1/);assert.match(report,/タイムアウト 1/);
    assert.ok(!report.includes('136.8')&&!report.includes('35.3')&&!report.includes('4.8'),'diagnostics must not include coordinates or vehicle dimensions');
    await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async function(value){window.__copiedHighwayReport=value}}})});
    await page.locator('#truckRouteDiagnosticsCopy').click();
    assert.equal(await page.evaluate(()=>window.__copiedHighwayReport),report,'copy must share the same location-free diagnostic report');
    await diagnostic.locator('summary').click();assert.equal((await stored()).routeVehicle.weight,4.8);assert.equal((await stored()).routeVehicle.axleload,undefined);assert.equal((await stored()).routeVehicle.avoidTolls,false);assert.ok(await paths()>=3);assert.match(await page.locator('#mapHighwayToggle').innerText(),/ON/);assert.equal(await page.locator('#mapHighwayToggle').getAttribute('aria-pressed'),'true');
    assert.ok(await roadPathCount('#0b132b')>=2,'route casing should be present under the fluorescent/red route strokes');
    assert.ok(await roadPathCount('#00e5ff')>=1);assert.ok(await roadPathCount('#dc2626')>=1);
    await page.evaluate(()=>{var original=window.VENDRIVETruckRouting.routeSections;window.__routeSectionsCurrent=original;window.VENDRIVETruckRouting.routeSections=function(value){return original(value).map(function(section){return {motorway:section.motorway,tollway:section.tollway,coordinates:section.coordinates};});};});
    await page.locator('#allRoutes').click();assert.ok(await roadPathCount('#dc2626')>=1,'legacy section objects without highlight must still render priority spans red');
    await page.evaluate(()=>{window.VENDRIVETruckRouting.routeSections=window.__routeSectionsCurrent;delete window.__routeSectionsCurrent;});
    await page.locator('#allRoutes').click();
    assert.match(await page.locator('#truckRouteSummary').innerText(),/有料 約/);assert.match(await page.locator('#truckRouteSummary').innerText(),/高速優先ON/);
    await page.locator('#mapHighwayToggle').click();await waitText('高速利用OFF');assert.match(await page.locator('#truckRouteDiagnosticsText').textContent(),/高速設定：OFF/);await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);assert.equal(count,2);assert.equal((await stored()).routeVehicle.avoidTolls,true);assert.equal(await page.locator('#mapHighwayToggle').getAttribute('aria-pressed'),'false');assert.equal(await roadPathCount('#dc2626'),0);assert.ok(await roadPathCount('#00e5ff')>=1);
    await page.locator('#mapHighwayToggle').click();await waitText('高速優先ON');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);assert.equal(count,3);assert.equal((await stored()).routeVehicle.avoidTolls,false);assert.equal(await page.locator('#mapHighwayToggle').getAttribute('aria-pressed'),'true');assert.ok(await roadPathCount('#dc2626')>=1);
    const routePathBefore=await page.locator('#map path[stroke="#00e5ff"], #map path[stroke="#dc2626"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('d')).join('|'));
    await page.evaluate(()=>{window.__turnZoomCalls=[];window.__turnZoomOriginal=window.L.Map.prototype.setZoom;window.L.Map.prototype.setZoom=function(zoom,options){window.__turnZoomCalls.push({from:this.getZoom(),to:zoom});return window.__turnZoomOriginal.call(this,zoom,options)};});
    await page.locator('#mapFollowLocation').click();
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.3,longitude:136.804,accuracy:8,heading:90,speed:10}}));await page.waitForTimeout(360);
    const turnZoomCall=await page.evaluate(()=>{var calls=window.__turnZoomCalls.slice();window.L.Map.prototype.setZoom=window.__turnZoomOriginal;delete window.__turnZoomOriginal;delete window.__turnZoomCalls;return calls.at(-1)});assert.ok(turnZoomCall&&turnZoomCall.to>turnZoomCall.from&&turnZoomCall.to-turnZoomCall.from<=0.46,'follow mode should ease toward the bend with a fractional zoom step');
    await page.locator('#mapFollowLocation').click();
    const routePathAfter=await page.locator('#map path[stroke="#00e5ff"], #map path[stroke="#dc2626"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('d')).join('|'));
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
    // Verify zoom-out on a real active route after GPS passes the first corner.
    await page.locator('#mapFollowLocation').click();
    for(let i=0;i<8;i++)await page.locator('#zoomIn').evaluate(el=>el.click());
    await page.evaluate(()=>{window.__postTurnZoomCalls=[];window.__postTurnZoomOriginal=window.L.Map.prototype.setZoom;window.L.Map.prototype.setZoom=function(to,options){window.__postTurnZoomCalls.push({from:this.getZoom(),to,animated:!!options?.animate});return window.__postTurnZoomOriginal.call(this,to,options)};});
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.305,longitude:136.805,accuracy:8,heading:0,speed:10}}));await page.waitForTimeout(380);
    const postTurnZoom=await page.evaluate(()=>{const calls=window.__postTurnZoomCalls.slice();window.L.Map.prototype.setZoom=window.__postTurnZoomOriginal;delete window.__postTurnZoomOriginal;delete window.__postTurnZoomCalls;return calls.filter(x=>x.to<x.from).at(-1)});
    assert.ok(postTurnZoom&&postTurnZoom.from-postTurnZoom.to>0&&postTurnZoom.from-postTurnZoom.to<=0.46&&postTurnZoom.animated,'follow zoom must smoothly zoom OUT after passing a significant corner');
    await page.locator('#mapFollowLocation').click();
    const afterSave=await stored();
    await page.locator('#allRoutes').click();await page.locator('#zoomIn').click();
    assert.equal(count,3);assert.ok(await paths()>=2);assert.deepEqual(await stored(),afterSave);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'horizontal overflow');
    await page.locator('#truckRouteRecalculate').click();await waitText('1.8km');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);assert.equal(count,4);
    mode='error';await page.locator('#truckRouteRecalculate').click();await waitText('無料枠');assert.equal(await paths(),0);assert.equal(await page.locator('#truckRouteDiagnostics').isVisible(),false,'failed route request must not retain stale diagnostics');
    mode='bad';await page.locator('#truckRouteRecalculate').click();await waitText('経路データ');assert.equal(await paths(),0);
    mode='success';await page.locator('#truckRouteRecalculate').click();await waitText('1.8km');
    await page.locator('#truckRouteVehicleSettings').click();await page.locator('#truckVehicleModal.open').waitFor();assert.equal(await page.locator('#truckVehicle_weight').inputValue(),'4800');
    await page.locator('#truckVehicleCancel').click();assert.ok(await paths()>=2);
    const beforeAutoReroute=count;assert.equal(routePayloads.slice(0,beforeAutoReroute).every(payload=>payload.heading===undefined),true,'initial and manual route searches must remain direction-agnostic');
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.36,longitude:136.86,accuracy:8,heading:45,speed:10}}));
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.3601,longitude:136.8601,accuracy:8,heading:45,speed:10}}));
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.3602,longitude:136.8602,accuracy:8,heading:45,speed:10}}));
    await page.waitForTimeout(250);assert.equal(count,beforeAutoReroute+1,'three sustained off-route fixes should trigger one automatic reroute');assert.equal(routePayloads.at(-1).heading,45,'automatic off-route reroute should carry the stable travel direction');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);
    // A cancelled in-flight response must never restore a cleared route.
    mode='held';const began=new Promise(resolve=>heldStarted=resolve),done=new Promise(resolve=>heldDone=resolve);
    await page.locator('#truckRouteRecalculate').click();await began;await page.locator('#truckRouteEnd').click();heldResolve();await done;
    assert.equal(await page.locator('#truckRoutePanel').isVisible(),false);assert.equal(await paths(),0);
    const beforeMissing=count;await openMachine('T2');await page.locator('#machineRoute').click();assert.equal(count,beforeMissing);await page.locator('#closeMachine').click();
    // Persisted profile survives app reopen; no route request runs by itself.
    await page.reload({waitUntil:'load'});await page.waitForFunction(()=>window.L&&document.querySelector('#machineSearch').oninput);
    await page.locator('.tabs button[data-page="mapPage"]').click();assert.match(await page.locator('#truckVehicleSummary').innerText(),/4.8t/);assert.equal(count,beforeMissing);
    await page.locator('#truckVehicleSettings').click();assert.equal(await page.locator('#truckVehicle_height').inputValue(),'285');assert.equal(await page.locator('#truckVehicleAvoidTolls').isChecked(),true);await page.locator('#truckVehicleCancel').click();
    // Non-map and normal MAP no longer block landscape with a portrait guard. Normal MAP stays in the portrait-width app; fullscreen can be software-rotated even when OS rotation is locked.
    await page.evaluate(()=>document.body.classList.add('touchDevice'));await page.setViewportSize({width:932,height:430});await page.locator('.tabs button[data-page="todayPage"]').click();assert.equal(await page.locator('#portraitGuard').isVisible(),false);var appBox=await page.locator('.app').boundingBox();assert.ok(appBox&&appBox.width<=432,'normal app should remain portrait-width in landscape viewport');
    await page.locator('.tabs button[data-page="mapPage"]').click();assert.equal(await page.locator('#portraitGuard').isVisible(),false);var normalMapBox=await page.locator('#map').boundingBox();assert.ok(normalMapBox&&normalMapBox.width<=432,'normal MAP should remain portrait-width');
    await page.locator('#allRoutes').click();await page.waitForTimeout(120);
    await page.locator('#mapFullscreen').click();await page.waitForFunction(()=>document.body.classList.contains('mapFullscreen'));var fullBox=await page.locator('#map').boundingBox();assert.ok(fullBox&&fullBox.width>=920&&fullBox.height>=420,'map fullscreen should fill landscape viewport');assert.equal(await page.locator('#mapRotate').isVisible(),true);
    // A route started from a fullscreen PIN must not re-click the already-active MAP tab. Keep the request alive while fullscreen viewport settle timers fire, then require the route to render normally.
    await page.evaluate(()=>{window.__fullscreenRenderMapOriginal=window.renderMap;window.__fullscreenRenderMapCalls=0;window.renderMap=function(){window.__fullscreenRenderMapCalls++;return window.__fullscreenRenderMapOriginal.apply(this,arguments)};});
    const fullscreenRoutePin=page.locator('.machineMapPinBody').first();await fullscreenRoutePin.waitFor({state:'visible'});await fullscreenRoutePin.click();await page.locator('#machineModal.open').waitFor({state:'visible'});
    mode='held';const fullscreenBegan=new Promise(resolve=>heldStarted=resolve),fullscreenDone=new Promise(resolve=>heldDone=resolve),beforeFullscreenRoute=count;
    await page.locator('#machineRoute').click();await fullscreenBegan;await page.waitForTimeout(320);
    assert.equal(await page.evaluate(()=>window.__fullscreenRenderMapCalls),0,'fullscreen route start must not rerender the entire MAP via a redundant tab click');
    heldResolve();await fullscreenDone;mode='success';await waitText('1.8km');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);
    assert.equal(count,beforeFullscreenRoute+1,'fullscreen viewport settling must not duplicate or cancel the route provider call');assert.ok(await paths()>=2,'route must render after fullscreen settle work completes during an in-flight request');
    const nativeCue=await page.locator('#mapRouteCue').evaluate(el=>{const r=el.getBoundingClientRect(),arrow=el.querySelector('.cueArrow');return {visible:getComputedStyle(el).display!=='none',left:r.left,top:r.top,arrow:arrow?.textContent,arrowSize:arrow?parseFloat(getComputedStyle(arrow).fontSize):0}});assert.ok(nativeCue.visible&&nativeCue.left>=10&&nativeCue.left<44&&nativeCue.top>=48,'native landscape navigation cue must move to upper-left');assert.equal(nativeCue.arrow,'↱');assert.ok(nativeCue.arrowSize>=50,'direction arrow must be prominent');
    await page.evaluate(()=>{window.renderMap=window.__fullscreenRenderMapOriginal;delete window.__fullscreenRenderMapOriginal;delete window.__fullscreenRenderMapCalls;});
    await page.locator('#mapRotate').click();await page.waitForFunction(()=>document.body.classList.contains('mapSoftRotated'));await page.waitForTimeout(340);const softCue=await page.locator('#mapRouteCue').evaluate(el=>({left:parseFloat(getComputedStyle(el).left),top:parseFloat(getComputedStyle(el).top),transform:getComputedStyle(el).transform}));assert.ok(softCue.left>=12&&softCue.left<=30&&softCue.top>=48&&softCue.top<=70&&softCue.transform==='none','software-rotated landscape cue should occupy local MAP upper-left');var rotatedBox=await page.locator('#map').boundingBox();assert.ok(rotatedBox&&rotatedBox.width>=920&&rotatedBox.height>=420,'software-rotated map should still fill viewport');assert.equal(await page.locator('#mapRotate').getAttribute('aria-pressed'),'true');
    const paneTransformBefore=await page.locator('#map .leaflet-map-pane').evaluate(el=>el.style.transform);
    await page.evaluate(()=>{window.__panByCalls=[];var original=window.L.Map.prototype.panBy;window.__panByOriginal=original;window.L.Map.prototype.panBy=function(offset,options){window.__panByCalls.push(Array.isArray(offset)?offset.slice():offset);return original.call(this,offset,options)};var map=document.getElementById('map'),r=map.getBoundingClientRect(),x=r.left+r.width*.4,y=r.top+r.height*.55,id=77;function fire(type,cx,cy,buttons){map.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',isPrimary:true,clientX:cx,clientY:cy,button:0,buttons:buttons}));}fire('pointerdown',x,y,1);fire('pointermove',x+120,y,1);fire('pointerup',x+120,y,0);});
    const paneTransformAfter=await page.locator('#map .leaflet-map-pane').evaluate(el=>el.style.transform),rotatedPan=await page.evaluate(()=>{var calls=window.__panByCalls.slice();window.L.Map.prototype.panBy=window.__panByOriginal;delete window.__panByOriginal;delete window.__panByCalls;return calls[calls.length-1]});assert.notEqual(paneTransformAfter,paneTransformBefore,'rotated drag must move the Leaflet map pane');assert.ok(Array.isArray(rotatedPan)&&Math.abs(Number(rotatedPan[0]))<5&&Number(rotatedPan[1])>100,'visual right drag in 90deg MAP must map to positive rotated Y pan');
    const mapPin=page.locator('.machineMapPinBody').first();await mapPin.waitFor({state:'visible'});await mapPin.evaluate(el=>el.click());await page.locator('#machineModal.open').waitFor({state:'visible'});assert.equal(await page.locator('#machineModal.open').isVisible(),true);assert.equal(await page.evaluate(()=>document.body.classList.contains('mapFullscreen')),true);const rotatedMachineTransform=await page.locator('#machineModal .sheet').evaluate(el=>getComputedStyle(el).transform);assert.notEqual(rotatedMachineTransform,'none','machine detail sheet must rotate with software-rotated fullscreen MAP');const rotatedMachineBox=await page.locator('#machineModal .sheet').boundingBox();assert.ok(rotatedMachineBox&&rotatedMachineBox.width>rotatedMachineBox.height,'rotated machine detail must present as landscape');await page.locator('#closeMachine').click();
    await page.locator('#mapRotate').click();await page.waitForFunction(()=>!document.body.classList.contains('mapSoftRotated'));assert.equal(await page.locator('#mapRotate').getAttribute('aria-pressed'),'false');
    await mapPin.evaluate(el=>el.click());await page.locator('#machineModal.open').waitFor({state:'visible'});assert.equal(await page.locator('#machineModal .sheet').evaluate(el=>getComputedStyle(el).transform),'none','machine detail must stay portrait when MAP software rotation is off');await page.locator('#closeMachine').click();
    await page.locator('#mapFullscreen').click();await page.waitForFunction(()=>!document.body.classList.contains('mapFullscreen'));await page.setViewportSize({width,height:932});
    // Accurate arrival within 100m ends navigation and opens one-card-at-a-time visit actions. In software-rotated fullscreen, the arrival card rotates with the MAP and uses the rotated swipe axis.
    mode='success';
    await openMachine('T1');await page.locator('#machineRoute').click();await waitText('1.8km');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);
    const routeStrokeCount=()=>page.locator('#map path[stroke="#00e5ff"], #map path[stroke="#dc2626"]').count();
    const routeInVisibleMap=()=>page.evaluate(()=>{const map=document.getElementById('map')?.getBoundingClientRect(),paths=Array.from(document.querySelectorAll('#map path[stroke="#00e5ff"], #map path[stroke="#dc2626"]'));if(!map)return false;return paths.some(path=>{const r=path.getBoundingClientRect();return (r.width>0||r.height>0)&&r.right>=map.left&&r.left<=map.right&&r.bottom>=map.top&&r.top<=map.bottom;});});
    assert.ok(await routeStrokeCount()>=2,'active route must exist before fullscreen');assert.equal(await routeInVisibleMap(),true,'active route must be inside the visible MAP before fullscreen');
    await page.locator('#mapFullscreen').click();await page.waitForFunction(()=>document.body.classList.contains('mapFullscreen'));await page.waitForTimeout(340);assert.equal(await page.locator('#mapRouteCue').isVisible(),true,'next-turn guidance must appear only in fullscreen when source instructions exist');const portraitCue=await page.locator('#mapRouteCue').evaluate(el=>{const r=el.getBoundingClientRect();return {center:r.left+r.width/2,screen:window.innerWidth,top:r.top}});assert.ok(Math.abs(portraitCue.center-portraitCue.screen/2)<3&&portraitCue.top<28,'portrait fullscreen cue must remain top-centered');assert.match(await page.locator('#mapRouteCue').innerText(),/右折/);assert.ok(await routeStrokeCount()>=2,'active route must survive fullscreen viewport resize');assert.equal(await routeInVisibleMap(),true,'fullscreen must refit the active remaining route into the visible MAP');
    await page.locator('#mapRotate').click();await page.waitForFunction(()=>document.body.classList.contains('mapSoftRotated'));await page.waitForTimeout(340);assert.ok(await routeStrokeCount()>=2,'active route must survive software-rotated fullscreen viewport resize');assert.equal(await routeInVisibleMap(),true,'software-rotated fullscreen must keep the active route inside the visible MAP');
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.3094,longitude:136.8094,accuracy:8,heading:0}}));await page.locator('#arrivalVisitModal.open').waitFor({state:'visible'});assert.equal(await page.locator('#truckRoutePanel').isVisible(),false);assert.equal(await page.locator('#arrivalVisitCard .swipeRow').count(),1);assert.match(await page.locator('#arrivalVisitProgress').innerText(),/Route test machine/);assert.equal(await page.locator('#arrivalVisitCard .todayMachineTasks').count(),0,'arrival task rendering must be independent from Today-list task decoration');assert.equal(await page.locator('#arrivalVisitCard .arrivalTaskRow').count(),2,'arrival card must show all active incomplete tasks for the machine');assert.equal(await page.locator('#arrivalVisitCard .arrivalTaskRow[data-task-id="TASK-ARRIVAL"]').count(),1);assert.equal(await page.locator('#arrivalVisitCard .arrivalTaskRow[data-task-id="TASK-ARRIVAL-2"]').count(),1);assert.match(await page.locator('#arrivalVisitCard .arrivalOrderSection').innerText(),/商品関連/);assert.match(await page.locator('#arrivalVisitCard .arrivalOrderSection').innerText(),/欠品/);assert.match(await page.locator('#arrivalVisitCard .arrivalOrderSection').innerText(),/到着テスト/);assert.notEqual(await page.locator('#arrivalVisitModal .sheet').evaluate(el=>getComputedStyle(el).transform),'none','arrival sheet must rotate with software-rotated fullscreen MAP');
    await swipeRowRotated(page.locator('#arrivalVisitCard .swipeRow'),'left');await page.locator('#visitTaskConfirmModal.open').waitFor({state:'visible'});assert.notEqual(await page.locator('#visitTaskConfirmModal .sheet').evaluate(el=>getComputedStyle(el).transform),'none','task confirmation must rotate in fullscreen landscape');await page.locator('#visitTaskConfirmList input[data-task-id="TASK-ARRIVAL"]').check();await page.locator('#visitTaskConfirmApply').click();await page.locator('#orderVisitConfirm.open').waitFor({state:'visible'});assert.notEqual(await page.locator('#orderVisitConfirm .sheet').evaluate(el=>getComputedStyle(el).transform),'none','order confirmation must rotate in fullscreen landscape');await page.locator('#orderVisitDone').click();
    await page.waitForFunction(()=>document.querySelector('#arrivalVisitProgress')?.textContent.includes('Nearby planned machine'));assert.equal(await page.locator('#arrivalVisitCard .swipeRow').count(),1);assert.notEqual(await page.locator('#arrivalVisitModal .sheet').evaluate(el=>getComputedStyle(el).transform),'none');await swipeRowRotated(page.locator('#arrivalVisitCard .swipeRow'),'right');await page.waitForFunction(()=>!document.getElementById('arrivalVisitModal').classList.contains('open'));
    const afterArrival=await stored(),doneT1=afterArrival.machines.find(m=>m.id==='T1'),skippedT3=afterArrival.machines.find(m=>m.id==='T3');assert.equal(doneT1.visited,true);assert.equal(doneT1.order,null);assert.ok(doneT1.taskDone&&doneT1.taskDone['TASK-ARRIVAL']);assert.equal(!!(doneT1.taskDone&&doneT1.taskDone['TASK-ARRIVAL-2']),false,'unchecked arrival tasks must remain incomplete');assert.ok(skippedT3.skip);
    await page.locator('#mapRotate').click();await page.waitForFunction(()=>!document.body.classList.contains('mapSoftRotated'));await page.locator('#mapFullscreen').click();await page.waitForFunction(()=>!document.body.classList.contains('mapFullscreen'));
    await page.locator('.tabs button[data-page="tasksPage"]').click();
    await page.locator('#taskHistoryList .taskHistoryOpen').first().click();await page.locator('#taskHistoryViewModal.open').waitFor({state:'visible'});
    assert.match(await page.locator('#taskHistoryViewMachines').innerText(),/Route test machine/);
    assert.match(await page.locator('#taskHistoryViewMachines').innerText(),/完了/);
    await page.locator('#taskHistoryViewClose').click();await page.locator('.tabs button[data-page="mapPage"]').click();
    // Office destinations use the same internal HGV route flow from both the office list and the MAP pin. Office arrival ends routing without opening vending-machine visit actions.
    assert.equal(await page.locator('#officeList .item').count(),1);assert.match(await page.locator('#officeList .item button').innerText(),/経路/);
    const beforeOfficeListRoute=count;await page.locator('#officeList .item').click();await waitText('1.8km');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);assert.equal(count,beforeOfficeListRoute+1);assert.deepEqual(routePayloads.at(-1).destination,{lat:35.33,lng:136.83});assert.match(await page.locator('#truckRouteTitle').innerText(),/Route test office/);
    await page.locator('#truckRouteEnd').click();await page.waitForFunction(()=>!document.getElementById('truckRoutePanel').offsetParent);
    const beforeOfficePinRoute=count,officePin=page.locator('.vendrive-office-pin').first();await officePin.waitFor({state:'visible'});await officePin.evaluate(el=>el.click());await waitText('1.8km');await page.waitForFunction(()=>!document.getElementById('truckRouteRecalculate').disabled);assert.equal(count,beforeOfficePinRoute+1);assert.deepEqual(routePayloads.at(-1).destination,{lat:35.33,lng:136.83});
    await page.evaluate(()=>window.__gpsSuccess({coords:{latitude:35.33,longitude:136.83,accuracy:8,heading:45,speed:8}}));await page.waitForTimeout(180);assert.equal(await page.locator('#truckRoutePanel').isVisible(),false);assert.equal(await page.locator('#arrivalVisitModal.open').count(),0,'office arrival must not open machine visit actions');
    // Standard Today cards also support right swipe to skip.
    await page.locator('.tabs button[data-page="todayPage"]').click();const todaySkipRow=page.locator('#todayList .swipeRow[data-machine-id="T4"]');await todaySkipRow.waitFor({state:'visible'});await swipeRow(todaySkipRow,'right');const afterTodaySkip=await stored();assert.ok(afterTodaySkip.machines.find(m=>m.id==='T4').skip);
    // The existing explicit external-navigation path remains separate.
    let externalUrl='';await page.route('https://www.google.com/maps/**',async request=>{externalUrl=request.request().url();await request.fulfill({body:'External navigation test',contentType:'text/html'});});
    await openMachine('T1');await page.locator('#machineExternalNav').click();await page.waitForURL('https://www.google.com/maps/**');
    assert.ok(externalUrl.includes('destination=35.31,136.81'));assert.equal(errors.length,0,errors.join('\n'));
    evidence.push({width,browser:context.browser()?.version(),gates:['blank-profile-blocking','exact-unit-conversion','routing-asset-version-match','stale-section-compatibility','dedicated-tollways-extra-red-segmentation','map-highway-toggle','highway-off-avoidance','highway-on-diverse-bounded-preference','active-highway-ic-search-server-gate','active-ic-global-bound-adoption','fullscreen-route-persistence','fullscreen-route-in-visible-viewport','fullscreen-route-inflight-settle','distinct-ic-corridor-probe','long-distance-highway-search','aligned-route-timeout-budget','fresh-gps-origin','median-off-route-origin','extreme-reroute-guard','fluorescent-cased-route-line','route-highway-status','privacy-safe-highway-diagnostics','ic-provider-failure-counters','diagnostic-copy','diagnostic-no-stale-results','nonblocking-portrait-layout','fullscreen-map-soft-rotation','rotated-map-gesture-axis','fullscreen-pin-machine-modal','rotated-machine-card-orientation','unrotated-machine-card-preserved','arrival-auto-end','rotated-arrival-card-orientation','rotated-arrival-swipe-axis','arrival-one-card-swipe-flow','arrival-full-order-details','arrival-all-active-tasks','office-list-internal-hgv-route','office-pin-internal-hgv-route','office-arrival-no-machine-actions','today-right-swipe-skip','heading-arrow','smooth-GPS-animation','turn-aware-follow-zoom','travelled-line-disappears','direction-aware-off-route-reroute','poor-accuracy-display-suppression','road-geometry','marker-only-GPS','route-survives-map-rerender','recalculate','quota-and-malformed-errors','late-response-cancellation','missing-destination','persistence','external-navigation','no-horizontal-overflow','no-page-errors'],status:'PASS'});
    console.log(`PASS truck route browser ${width}px`);
  }finally{await context.close();await rm(profile,{recursive:true,force:true});}
}
console.log(JSON.stringify({status:'PASS',evidence},null,2));

