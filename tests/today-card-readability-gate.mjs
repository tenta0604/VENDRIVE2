import assert from 'node:assert/strict';

function isoDay(delta=0){
 const d=new Date();d.setDate(d.getDate()+delta);
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function fixture(){
 const name='愛知県一宮市とても長い施設名・東側駐車場の自動販売機 訪問対象';
 const base={maker:'サントリー',address:'一宮市のテスト施設',lat:35.3,lng:136.8,
  days:['月','火','水','木','金','土','日'],cycle:'毎日',last:isoDay(-1),skip:null,
  force:null,order:null,memo:'',sales:'',taskDone:{}};
 const site={id:'D1',name:'地域の長い名前を持つ納品先・物流センター北側の受け取り口',
  code:'D-001',address:'愛知県一宮市',lat:35.31,lng:136.81,createdAt:Date.now()};
 const request={id:'REQ-P',siteId:'D1',siteName:site.name,siteCode:site.code,
  status:'pending',createdAt:Date.now()-50000,completedAt:null,scheduledDate:isoDay(),
  items:[{name:'ミネラルウォーター 500ml・お客様の希望商品',quantity:'4',unit:'ケース',sellPrice:'130円／本'}],
  memo:'荷下ろし口を確認'};
 const done={...request,id:'REQ-D',status:'done',completedAt:Date.now(),createdAt:Date.now()-100000};
 return {
  machines:[
   {...base,id:'M-P',name,code:'M-001',visited:false},
   {...base,id:'M-D',name:'完了済み自販機',code:'M-002',lat:35.32,visited:true}
  ],
  offices:[],deliverySites:[site],deliveryRequests:[request,done],
  history:[],tasks:[],taskHistory:[],restDays:[],makers:['サントリー'],makerColors:{},makerSettings:{}
 };
}
async function inspectCard(page,selector,width){
 return page.locator(selector).evaluate((node,viewportWidth)=>{
  const title=node.querySelector(':scope > div:first-child > b');
  const info=node.querySelector(':scope > div:first-child');
  const action=node.querySelector('.todayCardActions');
  const badge=action?.querySelector('.badge');
  const nav=action?.querySelector('.todayExternalNav');
  const meta=node.querySelector('.meta, .deliveryItemMeta');
  const rect=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
  return {card:rect(node),style:{minHeight:getComputedStyle(node).minHeight,opacity:getComputedStyle(node).opacity},
   title:{...rect(title),font:getComputedStyle(title).fontSize,line:getComputedStyle(title).lineHeight},
   info:rect(info),action:rect(action),nav:rect(nav),badge:rect(badge),
   meta:meta?{...rect(meta),font:getComputedStyle(meta).fontSize}:null,
   warning:!!(node.scrollWidth>node.clientWidth+1),viewportWidth};
 },width);
}
function verifyCard(card,width,label){
 assert.equal(card.style.minHeight,'88px',label+' minimum height');
 assert.equal(card.title.font,'13px',label+' readable title font');
 assert.equal(card.meta?.font,'10px',label+' consistent supporting copy');
 assert(card.title.height>=18,label+' title line box is legible');
 assert(card.title.right<=card.action.left+1,label+' long title does not overlap actions');
 assert(card.action.left>=card.info.right-1,label+' action and content regions stay separate');
 assert(card.nav.height>=40,label+' external navigation gets 40px touch height');
 assert(card.nav.left>=card.card.left-1&&card.nav.right<=card.card.right+1,label+' nav stays inside card');
 assert(card.badge.right<=card.card.right+1,label+' status stays inside card');
 assert(card.card.right<=width+1,label+' card stays inside viewport');
 assert.equal(card.warning,false,label+' no overflowing text/content');
}
export async function runTodayCardReadabilityGate(browser,baseUrl){
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:860}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await context.addInitScript(data=>{
    localStorage.setItem('vendrive2_v7_data',JSON.stringify(data));
    const d=new Date(),day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('vendrive2_last_day',day);
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
     watchPosition(_ok,fail){queueMicrotask(()=>fail?.({code:1}));return 1},
     clearWatch(){},getCurrentPosition(_ok,fail){queueMicrotask(()=>fail?.({code:1}))}
    }});
   },fixture());
   await context.route(/https:\/\/api\.open-meteo\.com\/v1\/forecast/,route=>
    route.fulfill({status:503,contentType:'application/json',body:'{"error":"not needed for card layout"}'}));
   await page.goto(baseUrl.replace(/\/$/,'')+'/index.html?todayReadabilityGate='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#deliveryNav').waitFor({state:'attached'});
   await page.waitForFunction(()=>document.querySelectorAll('#todayList .swipeRow').length===4,null,{timeout:12000});

   const ids=await page.locator('#todayList > .swipeRow').evaluateAll(nodes=>nodes.map(x=>x.dataset.machineId||x.dataset.deliveryId));
   assert.deepEqual(ids,['M-P','REQ-P','M-D','REQ-D'],
    'pending vending and delivery stay above completed vending/delivery in original order');
   const heading=await page.locator('#todayPage .sectionhead').evaluate(el=>({
    display:getComputedStyle(el).display,areas:getComputedStyle(el).gridTemplateAreas,
    width:el.getBoundingClientRect().width,scrollWidth:el.scrollWidth
   }));
   assert.equal(heading.display,'grid','Today header uses compact two-line grid');
   assert(heading.areas.includes('hint'),'swipe instructions remain accessible');
   assert(heading.scrollWidth<=heading.width+1,'Today header does not overflow');
   assert.match(await page.locator('#todayPage .swipeHint').innerText(),/左：完了/);
   assert.match(await page.locator('#todayNavSafety summary').innerText(),/車両制限非対応/);
   for(const [selector,label] of [
    ['#todayList .swipeRow[data-machine-id="M-P"] .swipeCard','pending vending'],
    ['#todayList .swipeRow[data-delivery-id="REQ-P"] .swipeCard','pending delivery'],
    ['#todayList .swipeRow[data-machine-id="M-D"] .swipeCard','completed vending'],
    ['#todayList .swipeRow[data-delivery-id="REQ-D"] .swipeCard','completed delivery']
   ])verifyCard(await inspectCard(page,selector,width),width,label);
   for(const selector of [
    '#todayList .swipeRow[data-machine-id="M-D"] .swipeCard',
    '#todayList .swipeRow[data-delivery-id="REQ-D"] .swipeCard']){
    const opacity=Number(await page.locator(selector).evaluate(el=>getComputedStyle(el).opacity));
    assert(Math.abs(opacity-0.48)<0.011,'completed work should be clearly faded: '+opacity);
   }
   for(const selector of [
    '#todayList .swipeRow[data-machine-id="M-P"] .swipeCard',
    '#todayList .swipeRow[data-delivery-id="REQ-P"] .swipeCard']){
    const opacity=Number(await page.locator(selector).evaluate(el=>getComputedStyle(el).opacity));
    assert.equal(opacity,1,'pending work must remain fully opaque');
   }
   assert.equal(await page.locator('#todayList .todayExternalNav').count(),4,'all quick nav buttons preserved');
   assert.match(await page.locator('#todayList .deliverySwipeCard .deliveryItemMeta').first().innerText(),/ミネラルウォーター/,'delivery item details remain');
   assert.match(await page.locator('#todayList .swipeRow[data-machine-id="M-P"] .makerChip').innerText(),/サントリー/,'machine maker label preserved');
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('vendrive2_v7_data')));
   assert.equal(before.machines.find(m=>m.id==='M-P').visited,false,'viewing the card must not mark a vending visit');
   assert.equal(before.deliveryRequests.find(r=>r.id==='REQ-P').status,'pending','viewing the card must not complete delivery');
   assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+1,'no horizontal page overflow');
   assert.deepEqual(errors,[],'no JS page errors');
   console.log('PASS Today machine/delivery card hierarchy and preserved ordering at '+width+'px');
  }finally{await context.close()}
 }
 console.log('=== tests/today-card-readability-gate.mjs ===\nPASS');
}
