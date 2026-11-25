import assert from 'node:assert/strict';

function localDate(daysFromNow=0){
 const d=new Date();d.setDate(d.getDate()+daysFromNow);
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
const forecast={
 current:{temperature_2m:23.2,weather_code:1},
 daily:{
  time:Array.from({length:9},(_,i)=>localDate(i)),
  temperature_2m_max:Array(9).fill(26),
  temperature_2m_min:Array(9).fill(16),
  precipitation_probability_max:Array(9).fill(42),
  weather_code:Array(9).fill(1)
 }
};
const body=JSON.stringify(forecast);
function fixture(withPoint=true){
 return {machines:[],offices:withPoint?[{id:'OFF-WEATHER',name:'テスト営業所',lat:35.3,lng:136.8,address:'テスト住所'}]:[],history:[],tasks:[],taskHistory:[],restDays:[],makers:[],makerColors:{},makerSettings:{}};
}
async function openTest(browser,baseUrl,withPoint,onWeather){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const calls=[];
 await context.addInitScript((state)=>{
  localStorage.setItem('vendrive2_v7_data',JSON.stringify(state));
  const d=new Date(),today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  localStorage.setItem('vendrive2_last_day',today);
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
   watchPosition(_onSuccess,onError){if(onError)queueMicrotask(()=>onError({code:1}));return 1},
   clearWatch(){},getCurrentPosition(_onSuccess,onError){if(onError)queueMicrotask(()=>onError({code:1}))}
  }});
 },fixture(withPoint));
 await context.route(/https:\/\/api\.open-meteo\.com\/v1\/forecast\?/,async route=>{
  const url=route.request().url();
  calls.push(url);
  await onWeather(route,calls.length);
 });
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(baseUrl.replace(/\/$/,'')+'/index.html?weatherGate='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
 return {context,page,calls,errors};
}
async function waitWeather(page,text,timeout=12000){
 await page.waitForFunction(value=>document.querySelector('#todayWeatherCard')?.textContent?.includes(value),text,{timeout});
}
export async function runWeatherGate(browser,baseUrl){
 let test;
 try{
  // Single Best Match query, precipitation visible, repeated renders use cache.
  test=await openTest(browser,baseUrl,true,async route=>{
   await route.fulfill({status:200,contentType:'application/json',body});
  });
  await waitWeather(test.page,'23℃');
  assert.match(await test.page.locator('#todayWeatherCard').innerText(),/降水 42%/);
  const icon=test.page.locator('#todayWeatherCard .weatherLineIcon');
  assert.equal(await icon.count(),1,'Today shows one SVG weather icon');
  assert.equal(await icon.getAttribute('viewBox'),'0 0 24 24');
  assert.equal(await icon.getAttribute('stroke-width'),'1.7');
  assert.match(await icon.getAttribute('class'),/weatherIcon-partly/);
  assert.equal(await icon.getAttribute('aria-hidden'),'true');
  assert.equal(test.calls.length,1,'Today should issue exactly one weather query (not JMA + Best Match)');
  assert(!test.calls[0].includes('models='),'single query should use Open-Meteo Best Match');
  await test.page.evaluate(()=>window.VENDRIVE2DeliveryBridge.renderAll());
  await test.page.waitForTimeout(120);
  assert.equal(test.calls.length,1,'repeated Today renders should reuse successful cache');
  assert.deepEqual(test.errors,[],'healthy weather render caused page errors');
  await test.page.locator('#finishDay').click();
  await test.page.locator('#tomorrowWeatherCard .weatherLineIcon').waitFor({timeout:12000});
  assert.match(await test.page.locator('#tomorrowWeatherCard .weatherLineIcon').getAttribute('class'),/weatherIcon-partly/);
  assert.match(await test.page.locator('#tomorrowWeatherCard').innerText(),/翌出勤日の天気.*晴れ\/曇り/);
  assert.match(await test.page.locator('#tomorrowWeatherCard').innerText(),/降水 42%/);
  console.log('Today and next-workday line weather icons: PASS');
  await test.context.close();test=null;

  // Failed response exposes a retry; retry must bypass short-lived negative cache.
  test=await openTest(browser,baseUrl,true,async(route,n)=>{
   await route.fulfill({status:n===1?503:200,contentType:'application/json',body:n===1?'{"reason":"temporary"}':body});
  });
  await test.page.locator('#todayWeatherCard .weatherRetryButton').waitFor({timeout:12000});
  assert.equal(test.calls.length,1,'the first error should not cause a request storm');
  await test.page.locator('#todayWeatherCard .weatherRetryButton').click();
  await waitWeather(test.page,'23℃');
  assert.equal(test.calls.length,2,'manual retry must issue one new request');
  assert.deepEqual(test.errors,[],'weather retry caused page errors');
  await test.context.close();test=null;

  // A syntactically valid HTTP 200 but incomplete payload must fail promptly;
  // it used to throw inside a .then success callback and wait seven seconds.
  test=await openTest(browser,baseUrl,true,async route=>{
   await route.fulfill({status:200,contentType:'application/json',body:'{"current":{},"daily":{}}'});
  });
  await test.page.locator('#todayWeatherCard .weatherRetryButton').waitFor({timeout:3000});
  assert.match(await test.page.locator('#todayWeatherCard').innerText(),/天気データを確認できません/);
  assert.equal(test.calls.length,1,'incomplete forecast rejected once without timeout');
  assert.deepEqual(test.errors,[],'malformed API payload should be caught without unhandled rejection');
  await test.context.close();test=null;

  // A hung fetch must terminate after the configured time budget and allow a retry.
  test=await openTest(browser,baseUrl,true,async(route,n)=>{
   if(n===1){await new Promise(resolve=>setTimeout(resolve,10000));try{await route.fulfill({status:200,contentType:'application/json',body})}catch{};return}
   await route.fulfill({status:200,contentType:'application/json',body});
  });
  await test.page.locator('#todayWeatherCard .weatherRetryButton').waitFor({timeout:11000});
  assert.equal(test.calls.length,1,'hung request should be bounded without duplicates');
  await test.page.locator('#todayWeatherCard .weatherRetryButton').click();
  await waitWeather(test.page,'23℃');
  assert.equal(test.calls.length,2,'retry after timeout must recover');
  assert.deepEqual(test.errors,[],'timeout recovery caused page errors');
  await test.context.close();test=null;

  // If neither pins nor geolocation is available, do not invent a forecast location.
  test=await openTest(browser,baseUrl,false,async route=>{
   await route.fulfill({status:500,body:'unexpected weather call'});
  });
  await waitWeather(test.page,'天気地点なし');
  assert.equal(test.calls.length,0,'no location should never initiate an arbitrary-location weather request');
  assert.deepEqual(test.errors,[],'no-location path caused page errors');
  await test.context.close();test=null;
  // Save successful route/office weather, then show it immediately after app reload
  // even if subsequent weather requests fail; never present it as a fresh update.
  let simulateNetworkFailure=false;
  test=await openTest(browser,baseUrl,true,async route=>{
   if(simulateNetworkFailure){
    await new Promise(resolve=>setTimeout(resolve,700));
    await route.fulfill({status:503,contentType:'application/json',body:'{"reason":"temporarily unavailable"}'});
   }else{
    await route.fulfill({status:200,contentType:'application/json',body});
   }
  });
  await waitWeather(test.page,'23℃');
  const persisted=await test.page.evaluate(()=>{
   const cache=JSON.parse(localStorage.getItem('vendrive2_weather_last_good_v1')||'{}');
   return Object.entries(cache).map(([key,entry])=>({key,day:entry.day,
    hasTemperature:typeof entry.data?.core?.current?.temperature_2m==='number'}));
  });
  assert.equal(persisted.length,1,'successful office forecast should persist for reload');
  assert.equal(persisted[0].hasTemperature,true,'persisted forecast contains real temperature');
  await test.page.evaluate(()=>{
   const key='vendrive2_weather_last_good_v1',cache=JSON.parse(localStorage.getItem(key));
   for(const item of Object.values(cache))item.at=Date.now()-40*60000;
   localStorage.setItem(key,JSON.stringify(cache));
  });
  simulateNetworkFailure=true;
  await test.page.reload({waitUntil:'domcontentloaded',timeout:30000});
  await test.page.waitForFunction(()=>{
   const t=document.querySelector('#todayWeatherCard')?.textContent||'';
   return t.includes('23℃')&&t.includes('前回')&&t.includes('更新中');
  },null,{timeout:8000});
  await test.page.locator('#todayWeatherCard .weatherRetryButton').waitFor({timeout:8000});
  assert.match(await test.page.locator('#todayWeatherCard').innerText(),/天気サービスが応答していません/,'HTTP failure reason should be visible');
  assert.match(await test.page.locator('#todayWeatherCard').innerText(),/23℃/,'last good forecast should remain visible after refresh failure');
  simulateNetworkFailure=false;
  await test.page.locator('#todayWeatherCard .weatherRetryButton').click();
  await test.page.waitForFunction(()=>!document.querySelector('#todayWeatherCard .weatherRetryButton')&&
   document.querySelector('#todayWeatherCard')?.textContent.includes('23℃'),null,{timeout:7000});
  assert.equal(test.calls.length,3,'initial, failed refresh, and recovery use exactly three requests');
  assert.deepEqual(test.errors,[],'cache recovery should cause no page errors');
  await test.context.close();test=null;

  // Reproduce the previously untested live GPS case: a phone without saved
  // map pins can emit noisy coordinates several times before the forecast resolves.
  // It should not keep changing the weather key and resetting the loading state.
  const gpsContext=await browser.newContext({viewport:{width:390,height:844}});
  const gpsCalls=[],gpsErrors=[];
  try{
   await gpsContext.addInitScript(state=>{
    localStorage.setItem('vendrive2_v7_data',JSON.stringify(state));
    const d=new Date(),today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('vendrive2_last_day',today);
    const gps=(lat,lng)=>({coords:{latitude:lat,longitude:lng,accuracy:25,heading:null,speed:0}});
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
     watchPosition(onSuccess){window.__weatherGPS=onSuccess;queueMicrotask(()=>onSuccess(gps(35.30,136.80)));return 2},
     clearWatch(){},getCurrentPosition(onSuccess){onSuccess(gps(35.30,136.80))}
    }});
   },fixture(false));
   await gpsContext.route(/https:\/\/api\.open-meteo\.com\/v1\/forecast\?/,async route=>{
    gpsCalls.push(route.request().url());
    await new Promise(resolve=>setTimeout(resolve,1000));
    await route.fulfill({status:200,contentType:'application/json',body});
   });
   await gpsContext.route(/https:\/\/nominatim\.openstreetmap\.org\/reverse/,async route=>route.fulfill({status:503,body:'not used in forecast'}));
   const page=await gpsContext.newPage();
   page.on('pageerror',e=>gpsErrors.push(String(e)));
   await page.goto(baseUrl.replace(/\/$/,'')+'/index.html?gpsWeatherGate='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>typeof window.__weatherGPS==='function'&&
    (document.querySelector('#todayWeatherCard')?.textContent||'').includes('天気を取得中'),null,{timeout:8000});
   await page.evaluate(()=>{
    const samples=[[35.3012,136.7995],[35.3001,136.8004],[35.3025,136.8012],[35.2978,136.8001],[35.2991,136.8003]];
    for(const [lat,lng] of samples)window.__weatherGPS({coords:{latitude:lat,longitude:lng,accuracy:30,heading:null,speed:0}});
   });
   await waitWeather(page,'23℃');
   assert.equal(gpsCalls.length,1,'GPS coordinate noise must not trigger duplicate weather requests');
   assert.equal(await page.evaluate(()=>localStorage.getItem('vendrive2_weather_last_good_v1')),null,
    'live device GPS coordinates must not be persisted into the weather cache');
   await page.waitForTimeout(350);
   assert.equal(gpsCalls.length,1,'GPS re-render should continue using the original forecast');
   assert.deepEqual(gpsErrors,[],'GPS jitter must not cause script errors');
  }finally{await gpsContext.close()}

  console.log('\n=== tests/weather-fetch-gate.mjs ===\nPASS\none Open-Meteo Best Match request: PASS\nToday cache and precipitation: PASS\nHTTP error retry: PASS\nmalformed payload prompt failure: PASS\nhung request timeout/recovery: PASS\nmissing location safety: PASS\npersistent last-good and offline fallback: PASS\nGPS jitter single weather request and GPS privacy: PASS');
 }finally{
  if(test)await test.context.close();
 }
}
