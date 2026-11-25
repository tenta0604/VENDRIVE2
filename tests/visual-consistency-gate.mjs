import assert from 'node:assert/strict';

const dimensions=[320,390,430];
function sameColor(value,expected,label){assert.equal(value,expected,label)}
async function inspect(page,selector){
 return page.locator(selector).first().evaluate(el=>{
  const s=getComputedStyle(el),r=el.getBoundingClientRect();
  return {background:s.backgroundColor,color:s.color,borderRadius:s.borderRadius,
   borderColor:s.borderTopColor,minHeight:s.minHeight,marginTop:s.marginTop,
   alignItems:s.alignItems,lineHeight:s.lineHeight,width:r.width,height:r.height,left:r.left,right:r.right,
   outlineColor:s.outlineColor,fontSize:s.fontSize,paddingTop:s.paddingTop,paddingLeft:s.paddingLeft}
 });
}
export async function runVisualConsistencyGate(browser,baseUrl){
 for(const width of dimensions){
  const context=await browser.newContext({viewport:{width,height:844}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto(baseUrl.replace(/\/$/,'')+'/index.html?visualGate='+Date.now(),
    {waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#deliveryNav').waitFor({state:'attached'});
   const root=await page.evaluate(()=>{
    const s=getComputedStyle(document.documentElement);
    return {accent:s.getPropertyValue('--accent').trim(),cardRadius:s.getPropertyValue('--ui-card-radius').trim(),
     controlRadius:s.getPropertyValue('--ui-control-radius').trim(),sectionSpace:s.getPropertyValue('--ui-section-space').trim()};
   });
   assert.equal(root.accent,'#285eaa','approved blue accent');
   assert.equal(root.cardRadius,'16px','cards share a 16px radius');
   assert.equal(root.controlRadius,'11px','form fields/buttons share 11px radius');
   assert.equal(root.sectionSpace,'18px','sections use shared spacing');

   const tabRects=await page.locator('.tabs button').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none').map(n=>{
    const b=n.getBoundingClientRect();return {left:b.left,right:b.right,width:b.width,top:b.top,bottom:b.bottom};
   }));
   assert.equal(tabRects.length,6,'all six destination tabs remain available');
   for(let i=0;i<tabRects.length;i++){
    assert(tabRects[i].width>=29,'tab width is readable on narrow screens');
    assert(tabRects[i].right<=width+1,'tabs must not overflow to the right');
    if(i>0)assert(tabRects[i].left>=tabRects[i-1].right-1,'tabs must not overlap');
   }
   const kpi=await inspect(page,'#todayPage .kpi');
   assert.equal(kpi.borderRadius,'0px','Today KPIs form a single integrated progress card');
   assert.equal(await page.locator('#todayPage .hero .kpi').count(),3,'three interactive metrics inside the progress card');
   assert.equal(await page.locator('#heroPercent').innerText(),'0%','empty progress percentage is zero');
   const nav=await page.locator('.tabs').evaluate(el=>({position:getComputedStyle(el).position,bottom:el.getBoundingClientRect().bottom,icons:[...el.querySelectorAll('button')].map(b=>getComputedStyle(b,'::before').maskImage),height:el.getBoundingClientRect().height}));
   assert.equal(nav.position,'fixed','navigation dock is fixed');
   assert(Math.abs(nav.bottom-844)<2,'dock is at viewport bottom');
   assert(nav.height>=60,'dock has comfortable targets');
   assert(nav.icons.every(x=>x.includes('data:image/svg+xml')),'each of the six tabs has its own vector icon');
   assert(tabRects.every(x=>x.bottom-x.top>=44),'six accessible touch targets');
   await page.locator('#todayPage .kpi').first().click();
   assert.equal(await page.locator('#statsModal').evaluate(el=>el.classList.contains('open')),true,'integrated metric opens existing detail');
   await page.locator('#closeStats').click();
   await page.locator('.tabs button[data-page="tasksPage"]').click();
   assert.equal((await inspect(page,'#tasksPage>.row')).minHeight,'44px','Tasks heading row aligned to common height');
   assert.equal((await inspect(page,'#tasksPage .title')).fontSize,width<=360?'22px':'24px','Tasks heading hierarchy');
   assert.equal((await inspect(page,'#addTask')).minHeight,'38px','Task registration button is comfortable');
   assert.equal((await inspect(page,'#tasksPage .sectionhead b')).fontSize,'14px','Tasks section title aligns with other tabs');
   const taskSection=await inspect(page,'#tasksPage .section');
   assert.equal(taskSection.marginTop,'18px','Task section rhythm is consistent');
   assert.equal((await inspect(page,'#tasksPage>.row')).alignItems,'center','Task heading/actions align');
   assert.equal((await inspect(page,'#addTask')).borderRadius,'11px','Task add button matches control corners');
   await page.locator('#addTask').click();
   const textInput=await inspect(page,'#taskText');
   assert.equal(textInput.background,'rgb(255, 255, 255)','form surfaces use shared white');
   assert.equal(textInput.borderRadius,'11px','Task input matches shared controls');
   await page.locator('#taskText').focus();
   sameColor((await inspect(page,'#taskText')).outlineColor,'rgb(40, 94, 170)','keyboard/text-input focus is discoverable');
   await page.locator('#cancelTask').click();

   await page.locator('.tabs button[data-page="mapPage"]').click();
   assert.equal((await inspect(page,'#mapPage>.row')).minHeight,'44px','Map heading aligned');
   assert.equal((await inspect(page,'#officeAddTop')).minHeight,'38px','Map office top action has consistent height');
   const search=await inspect(page,'#mapPage .search');
   assert.equal(search.borderRadius,'11px','Map search matches control geometry');
   assert(search.height>=44,'Map search touch target is comfortable');
   assert.equal(search.background,'rgb(255, 255, 255)','Map search stays white');
   assert.equal((await inspect(page,'#mapPage .days .day')).minHeight,'38px','Map weekday target remains reachable');
   const mapSearch=await inspect(page,'#addressSearchButton');
   sameColor(mapSearch.background,'rgb(24, 46, 73)','Map search button no longer uses missing CSS variable');
   sameColor(mapSearch.color,'rgb(255, 255, 255)','Map search button text is legible');
   assert.equal((await inspect(page,'#mapPage>.row')).alignItems,'center','Map heading/actions align');
   assert.match(await page.locator('.mapSearchAttribution').innerText(),/OpenStreetMap contributors/,'map attribution retained');
   assert.match(await page.locator('#externalNavSafety summary').innerText(),/車両制限非対応/,'truck safety notice retained');

   await page.locator('.tabs button[data-page="machinesPage"]').click();
   assert.equal((await inspect(page,'#machinesPage>.row')).minHeight,'44px','Machine header aligned');
   assert.equal((await inspect(page,'#machineSort')).minHeight,'38px','Machine sort button matches registration');
   const machineSearch=await inspect(page,'#machinesPage .search');
   assert.equal(machineSearch.borderRadius,'11px','Machine search matches Map search');
   assert(machineSearch.height>=44,'Machine search touch target');
   assert.equal((await inspect(page,'#machineDayFilter')).minHeight,'42px','Machine day filter touch target');
   assert.equal((await inspect(page,'#machineMakerFilter')).minHeight,'42px','Machine maker filter touch target');
   await page.locator('#addMachine').click();
   assert.equal((await inspect(page,'#newName')).borderRadius,'11px','Machine registration fields match Task fields');
   await page.locator('#cancelAdd').click();

   await page.locator('.tabs button[data-page="ordersPage"]').click();
   assert.equal((await inspect(page,'#ordersPage>.row')).minHeight,'44px','Order header aligned');
   assert.equal((await inspect(page,'#addOrder')).borderRadius,'11px','Order button matches shared controls');
   assert.equal((await inspect(page,'#addOrder')).minHeight,'38px','Order registration target height');
   await page.locator('.tabs button[data-page="deliveryPage"]').click();
   assert.equal((await inspect(page,'#deliveryPage>.row')).minHeight,'44px','Delivery header aligned');
   assert.equal((await inspect(page,'#deliveryAddSite')).borderRadius,'11px','Delivery button matches shared controls');
   assert.equal((await inspect(page,'#deliveryAddSite')).minHeight,'38px','Delivery registration target height');
   const deliverySearch=await inspect(page,'#deliveryPage .search');
   assert.equal(deliverySearch.borderRadius,'11px','Delivery search matches other tabs');
   assert(deliverySearch.height>=44,'Delivery search touch target');
   assert.equal(deliverySearch.background,'rgb(255, 255, 255)','Delivery search remains white');
   assert.equal((await inspect(page,'#deliveryPage .sectionhead b')).fontSize,'14px','Delivery section titles consistent');

   const widthResult=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    visualWidth:window.innerWidth
   }));
   assert(widthResult.scrollWidth<=width+1,'No horizontal app overflow at '+width+'px: '+JSON.stringify(widthResult));
   assert.deepEqual(errors,[],'no JavaScript errors during design checks');
   console.log('PASS visual foundations, six tabs, fields, navy Map search and focus at '+width+'px');
  }finally{await context.close()}
 }
 console.log('=== tests/visual-consistency-gate.mjs ===\nPASS');
}
