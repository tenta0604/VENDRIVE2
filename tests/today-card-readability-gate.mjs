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

async function checkGestureFeedback(page,selector,isDelivery){
 const phases=await page.locator(selector).evaluate((row,delivery)=>{
  const card=row.querySelector('.swipeCard'),bounds=card.getBoundingClientRect();
  const x=bounds.left+45,y=bounds.top+30;
  function fire(type,dx){card.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:47,pointerType:'touch',clientX:x+dx,clientY:y,button:0}))}
  function state(){return {reveal:row.classList.contains('revealComplete'),ready:row.classList.contains('readyComplete'),
   right:row.classList.contains('revealSkip'),readyRight:row.classList.contains('readySkip'),
   color:getComputedStyle(row.querySelector('.swipeAction.complete')).backgroundColor,
   mark:getComputedStyle(row.querySelector('.swipeAction.complete'),'::before').content,
   skipMark:delivery?'':getComputedStyle(row.querySelector('.swipeAction.skip'),'::before').content,
   inlineTransform:card.style.transform}}
  fire('pointerdown',0);fire('pointermove',-40);const partial=state();
  fire('pointermove',-85);const ready=state();
  fire('pointermove',-30);const backed=state();
  fire('pointercancel',-30);const canceled=state();
  fire('pointerdown',0);fire('pointermove',85);const right=state();
  fire('pointercancel',85);const canceledRight=state();
  return {partial,ready,backed,canceled,right,canceledRight};
 },isDelivery);
 assert(phases.partial.reveal&&!phases.partial.ready,'partial swipe reveals but cannot commit');
 assert(phases.ready.ready,'full swipe threshold has explicit ready cue');
 assert.equal(phases.ready.color,'rgb(23, 108, 80)','ready completion color');
 assert.match(phases.ready.mark,/✓/,'ready completion checkmark');
 assert.equal(phases.backed.ready,false,'backing off removes ready state');
 assert.equal(phases.canceled.ready,false,'cancel clears ready state');
 assert.equal(phases.canceled.reveal,false,'cancel clears reveal');
 assert.match(phases.canceled.inlineTransform,/^translateX\(0(?:px)?\)$/,'cancel restores card regardless of browser CSS unit normalization');
 assert.equal(phases.right.readyRight,!isDelivery,'only vending can be right-skipped');
 assert.equal(phases.right.right,!isDelivery,'delivery cannot reveal right skip');
 if(!isDelivery)assert.match(phases.right.skipMark,/↷/,'skip readiness arrow');
 assert.equal(phases.canceledRight.readyRight,false,'cancel clears right readiness');
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
   const styles=await page.evaluate(()=>({
    tab:getComputedStyle(document.querySelector('.tabs button')).transitionDuration,
    button:getComputedStyle(document.querySelector('#todayList .todayExternalNav')).transitionDuration,
    progress:getComputedStyle(document.querySelector('#progressBar')).transitionDuration
   }));
   assert.match(styles.tab,/0\.15s/,'tab feedback 150ms');
   assert.match(styles.button,/0\.15s/,'button feedback 150ms');
   assert.match(styles.progress,/0\.23s/,'progress width easing 230ms');
   await checkGestureFeedback(page,'#todayList .swipeRow[data-machine-id="M-P"]',false);
   await checkGestureFeedback(page,'#todayList .swipeRow[data-delivery-id="REQ-P"]',true);
   // Non-Today lists use the same visual rhythm without changing data or
   // removing actions. Exercise real cards with long Japanese names.
   for(const view of [
    {tab:'machinesPage',selector:'#machineList .item',fragment:'とても長い施設名'},
    {tab:'deliveryPage',selector:'#deliverySitesList .item',fragment:'長い名前を持つ納品先'}
   ]){
    await page.locator('.tabs button[data-page="'+view.tab+'"]').click();
    await page.locator(view.selector).first().waitFor({state:'visible',timeout:8000});
    const card=await page.locator(view.selector).first().evaluate(el=>{
     const b=el.querySelector('b'),r=el.getBoundingClientRect(),st=getComputedStyle(el);
     return {font:b&&getComputedStyle(b).fontSize,bg:st.backgroundColor,
      radius:st.borderRadius,minHeight:st.minHeight,pad:st.paddingTop,
      overflow:el.scrollWidth>el.clientWidth+1,right:r.right,
      text:el.innerText};
    });
    assert.equal(card.radius,'15px',view.tab+' cards share radius');
    assert.equal(card.minHeight,'58px',view.tab+' cards share minimum size');
    assert.equal(card.pad,'12px',view.tab+' cards share vertical padding');
    assert.equal(card.font,'12px',view.tab+' names share readability');
    assert.equal(card.bg,'rgb(255, 255, 255)',view.tab+' card contrast');
    assert.equal(card.overflow,false,view.tab+' long names have no horizontal card overflow');
    assert(card.right<=width+1,view.tab+' list fits viewport width');
    assert(card.text.includes(view.fragment),view.tab+' long Japanese fixture name preserved');
   }
   await page.locator('.tabs button[data-page="todayPage"]').click();
   assert.equal(Number(await page.locator('#todayList .swipeRow[data-machine-id="M-D"] .swipeCard').evaluate(el=>getComputedStyle(el).opacity)),0.48,'Today completed opacity must not be changed by other tab styling');
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('vendrive2_v7_data')));
   assert.equal(before.machines.find(m=>m.id==='M-P').visited,false,'viewing the card must not mark a vending visit');
   assert.equal(before.deliveryRequests.find(r=>r.id==='REQ-P').status,'pending','viewing the card must not complete delivery');
   assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+1,'no horizontal page overflow');
   assert.deepEqual(errors,[],'no JS page errors');
   console.log('PASS Today machine/delivery card hierarchy and preserved ordering at '+width+'px');
  }finally{await context.close()}
 }
 const reduced=await browser.newContext({viewport:{width:390,height:860},reducedMotion:'reduce'});
 const page=await reduced.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await reduced.addInitScript(data=>{
   localStorage.setItem('vendrive2_v7_data',JSON.stringify(data));
   const d=new Date(),day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
   localStorage.setItem('vendrive2_last_day',day);
   Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
    watchPosition(_ok,fail){queueMicrotask(()=>fail?.({code:1}));return 1},
    clearWatch(){},getCurrentPosition(_ok,fail){queueMicrotask(()=>fail?.({code:1}))}
   }});
  },fixture());
  await reduced.route(/https:\/\/api\.open-meteo\.com\/v1\/forecast/,route=>
   route.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.goto(baseUrl.replace(/\/$/,'')+'/index.html?reducedMotionGate='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelectorAll('#todayList .swipeRow').length===4,null,{timeout:12000});
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true,'reduced motion enabled');
  const transitions=await page.evaluate(()=>({
   tab:getComputedStyle(document.querySelector('.tabs button')).transitionDuration,
   button:getComputedStyle(document.querySelector('#todayList .todayExternalNav')).transitionDuration,
   progress:getComputedStyle(document.querySelector('#progressBar')).transitionDuration,
   card:getComputedStyle(document.querySelector('#todayList .swipeCard')).transitionDuration
  }));
  for(const [control,duration] of Object.entries(transitions))assert.equal(duration,'0s',control+' reduced-motion transition');
  await checkGestureFeedback(page,'#todayList .swipeRow[data-machine-id="M-P"]',false);
  await checkGestureFeedback(page,'#todayList .swipeRow[data-delivery-id="REQ-P"]',true);
  assert.deepEqual(errors,[],'reduced-motion runs without page errors');
  console.log('PASS reduced motion disables animation while swipe still reacts');
 }finally{await reduced.close()}
 console.log('=== tests/today-card-readability-gate.mjs ===\nPASS');
}
