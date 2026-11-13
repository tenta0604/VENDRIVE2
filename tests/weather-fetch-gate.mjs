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
  assert.equal(test.calls.length,1,'Today should issue exactly one weather query (not JMA + Best Match)');
  assert(!test.calls[0].includes('models='),'single query should use Open-Meteo Best Match');
  await test.page.evaluate(()=>window.VENDRIVE2DeliveryBridge.renderAll());
  await test.page.waitForTimeout(120);
  assert.equal(test.calls.length,1,'repeated Today renders should reuse successful cache');
  assert.deepEqual(test.errors,[],'healthy weather render caused page errors');
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
  console.log('\n=== tests/weather-fetch-gate.mjs ===\nPASS\none Open-Meteo Best Match request: PASS\nToday cache and precipitation: PASS\nHTTP error retry: PASS\nhung request timeout/recovery: PASS\nmissing location safety: PASS');
 }finally{
  if(test)await test.context.close();
 }
}
