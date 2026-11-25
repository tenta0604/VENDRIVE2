import assert from 'node:assert/strict';

const removedCopy=[
  '完了するまで残り続ける作業',
  '完了するまで本日の画面の最上部に表示されます',
  '現在地・自販機・納品先の位置を管理',
  '登録した自販機は通常の曜日に関係なく、本日・マップにオーダーとして表示されます。',
  '納品先を登録し、依頼が来たときだけ予定を追加',
  '納品は不定期です。依頼が届いたときだけ商品・数量・売値メモ・納品予定日を登録します。'
];

async function checkNotice(page,id,width){
 const el=page.locator('#'+id),summary=el.locator('summary'),detail=el.locator('.navSafetyDetail');
 assert.equal(await el.count(),1,id+' notice exists');
 assert.equal(await el.evaluate(node=>node.tagName),'DETAILS',id+' uses native accessible disclosure');
 assert.equal(await el.getAttribute('open'),null,'notice should start collapsed');
 assert.match(await summary.innerText(),/⚠️\s*車両制限非対応/,'short icon warning remains visible');
 assert.equal(await detail.isVisible(),false,'full long warning must start hidden');
 const bounds=await summary.boundingBox();
 assert(bounds && bounds.x>=-1 && bounds.x+bounds.width<=width+1,'warning pill stays within viewport');
 await summary.click();
 assert.equal(await detail.isVisible(),true,'tap expands important safety detail');
 assert.match(await detail.innerText(),/2tトラックの車高・車幅・重量条件/,'full vehicle-restriction safety detail retained');
 assert.match(await detail.innerText(),/道路標識を確認/,'road signage caution retained');
 await summary.click();
 assert.equal(await detail.isVisible(),false,'tap collapses disclosure again');
}

async function checkMonthlyUnvisited(context,page,width){
 await context.addInitScript(()=>{
  const now=new Date(),iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const plus=n=>{const d=new Date(now);d.setDate(d.getDate()+n);return d};
  const today=iso(now),lastMonth=iso(new Date(now.getFullYear(),now.getMonth(),0)),first=iso(new Date(now.getFullYear(),now.getMonth(),1));
  const week=['日','月','火','水','木','金','土'],rest=[week[plus(1).getDay()]],manualDate=iso(plus(2));
  const m=(id,last,extra={})=>({id,name:'機器 '+id,code:id,address:'テスト住所 '+id,maker:'TEST',days:week,cycle:'毎日',last,visited:false,lat:35.31,lng:136.81,...extra});
  const machines=[m('done',first),m('todayDone',today,{visited:true}),m('old',lastMonth),m('never',null),m('manual',null,{days:[],cycle:'1週間に1回'}),m('skipped',lastMonth,{skip:today}),m('unknown',null,{days:[],cycle:'1週間に1回'})];
  localStorage.setItem('vendrive2_v7_data',JSON.stringify({machines,offices:[],history:[],tasks:[],taskHistory:[],temporaryVisitPeriods:[],restDays:rest,makers:['TEST'],makerColors:{},makerSettings:[],tomorrowPlan:{manual:true,date:manualDate,ids:['manual']}}));
  localStorage.setItem('vendrive2_last_day',today);
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.tabs button[data-page="machinesPage"]').click();
 assert.equal(await page.locator('#machineAllTab').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#machineList').isVisible(),true,'original Machines list visible');
 await page.locator('#machineMonthlyTab').click();
 assert.equal(await page.locator('#machineList').isVisible(),false,'monthly view hides original list');
 assert.equal(await page.locator('#machineMonthlyPanel').isVisible(),true);
 const rows=page.locator('#machineMonthlyList .monthlyMachine'),ids=await rows.evaluateAll(nodes=>nodes.map(node=>node.dataset.machineId));
 assert.deepEqual(ids,['old','never','manual','skipped','unknown'],'only calendar-month unvisited machines in planned date order');
 assert.equal(await page.locator('#machineMonthlyCount').innerText(),'5台 / 7台');
 const date=await page.evaluate(()=>{const d=new Date(),f=n=>{const a=new Date(d);a.setDate(a.getDate()+n);return a.getFullYear()+'-'+String(a.getMonth()+1).padStart(2,'0')+'-'+String(a.getDate()).padStart(2,'0')};return [f(0),f(2),f(3)]});
 const row=id=>page.locator('#machineMonthlyList [data-machine-id="'+id+'"]');
 assert((await row('never').innerText()).includes(date[0]),'today due date');
 assert((await row('manual').innerText()).includes(date[1]),'manual next workday appointment honored');
 assert((await row('skipped').innerText()).includes(date[2]),'today skip, rest day and manual exclusion honored');
 assert((await row('unknown').innerText()).includes('未定'),'no eligible schedule shown honestly');
 for(const node of await rows.all()){const b=await node.boundingBox();assert(b&&b.x>=-1&&b.x+b.width<=width+1,'monthly card stays within mobile viewport')}
 await row('old').click();
 assert.equal(await page.locator('#machineModal').evaluate(x=>x.classList.contains('open')),true,'opens existing machine detail');
 await page.locator('#completeMachine').click();
 assert.equal(await row('old').count(),0,'completed visit immediately disappears');
 await page.locator('#undoAction').click();
 assert.equal(await row('old').count(),1,'undo restores monthly unvisited status');
 await page.locator('#machineAllTab').click();
 assert.equal(await page.locator('#machineList').isVisible(),true);
 assert.equal(await page.locator('#machineMonthlyPanel').isVisible(),false);
}
export async function runUiCopyCleanupGate(browser,baseUrl){
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:860}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto(baseUrl.replace(/\/$/,'')+'/index.html?copyGate='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#deliveryNav').waitFor({state:'attached'});
   const manifestVersion=await page.evaluate(async()=>{const response=await fetch('version.json',{cache:'no-store'});if(!response.ok)throw new Error('version.json failed');return (await response.json()).version});
   assert.equal((await page.locator('#appVersion').innerText()).trim(),'Ver. '+manifestVersion,'rendered app version matches live manifest');
   assert.equal(manifestVersion,'1.2.2','public header icon patch version is consistent');
   assert.equal(await page.title(),'VENDRIVE 1.0','browser tab reflects public release');
   const pwa=await page.evaluate(async()=>{
    const response=await fetch('manifest.webmanifest',{cache:'no-store'});
    if(!response.ok)throw Error('PWA manifest unavailable');
    const j=await response.json();
    return {name:j.name,short_name:j.short_name,id:j.id,start_url:j.start_url,scope:j.scope,icons:j.icons};
   });
   assert.equal(pwa.name,'VENDRIVE 1.0','PWA long name uses approved public brand');
   assert.equal(pwa.short_name,'VENDRIVE','PWA launcher remains compact');
   for(const key of ['id','start_url','scope'])
    assert.equal(pwa[key],'/VENDRIVE2/','PWA existing install and data identity remains stable: '+key);

   assert.deepEqual(pwa.icons,[
    {src:'./vendrive-icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'./vendrive-icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}
   ],'approved app icon references and sizes');
   const apple=page.locator('link[rel="apple-touch-icon"]');
   assert.equal(await apple.count(),1,'one Apple touch icon');
   assert.equal(await apple.getAttribute('href'),'./vendrive-icon-180.png');
   assert.equal(await apple.getAttribute('sizes'),'180x180');
   assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'),'./vendrive-icon-192.png');
   for(const size of [180,192,512]){
    const result=await page.evaluate(async n=>{
     const url='./vendrive-icon-'+n+'.png';
     const response=await fetch(url,{cache:'no-store'});
     if(!response.ok)throw Error('icon unavailable '+n);
     const blob=await response.blob();
     const image=new Image();image.src=URL.createObjectURL(blob);
     try{await image.decode();return {type:blob.type,w:image.naturalWidth,h:image.naturalHeight}}
     finally{URL.revokeObjectURL(image.src)}
    },size);
    assert.deepEqual(result,{type:'image/png',w:size,h:size},'decodable PNG at declared size '+size);
   }
   const headerIcon=page.locator('.header .brand img.mark');
   assert.equal(await headerIcon.count(),1,'header uses approved app icon image');
   assert.equal(await headerIcon.getAttribute('src'),'./vendrive-icon-180.png');
   const headerIconSize=await headerIcon.evaluate(async img=>{await img.decode();const r=img.getBoundingClientRect();return {w:r.width,h:r.height,natural:img.naturalWidth,fit:getComputedStyle(img).objectFit}});
   assert.deepEqual(headerIconSize,{w:33,h:33,natural:180,fit:'cover'},'header icon remains 33px and decodes correctly');
   assert.equal(await page.locator('.header .brand .name').innerText(),'VENDRIVE','brand text preserved');
   await checkNotice(page,'todayNavSafety',width);
   assert.equal(await page.locator('#todayList').count(),1,'Today list remains available');
   assert.equal(await page.locator('#finishDay').count(),1,'day completion remains available');
   await page.locator('.tabs button[data-page="tasksPage"]').click();
   assert.equal(await page.locator('#addTask').isVisible(),true,'task creation remains visible');
   assert.equal(await page.locator('#taskCount').count(),1,'task count survives copy removal');
   assert.equal(await page.locator('#tasksPage .subtitle').count(),0,'unnecessary Task subtitle is removed');
   assert.equal(await page.locator('#tasksPage .heroSub').count(),0,'Task hero explanatory paragraph is removed');
   await page.locator('#addTask').click();
   assert.equal(await page.locator('#taskModal').evaluate(x=>x.classList.contains('open')),true,'task form still opens');
   await page.locator('#cancelTask').click();
   await page.locator('.tabs button[data-page="mapPage"]').click();
   assert.equal(await page.locator('#mapPage .subtitle').count(),0,'Map explanatory subtitle is removed');
   await checkNotice(page,'externalNavSafety',width);
   assert.match(await page.locator('.mapSearchAttribution').innerText(),/OpenStreetMap contributors/,'required map credit remains');
   assert.equal(await page.locator('#addressSearch').count(),1,'map search remains');
   await page.locator('.tabs button[data-page="ordersPage"]').click();
   assert.equal(await page.locator('#ordersPage .notice').count(),0,'redundant Order notice removed');
   assert.equal(await page.locator('#addOrder').isVisible(),true,'order registration remains visible');
   await page.locator('.tabs button[data-page="deliveryPage"]').click();
   assert.equal(await page.locator('#deliveryPage .subtitle').count(),0,'redundant Delivery subtitle removed');
   assert.equal(await page.locator('#deliveryPage .notice').count(),0,'redundant Delivery notice removed');
   assert.equal(await page.locator('#deliveryAddSite').isVisible(),true,'delivery registration remains visible');
   for(const copy of removedCopy){
    const remaining=await page.evaluate(s=>document.body.textContent.includes(s),copy);
    assert.equal(remaining,false,'removed explanatory copy persists: '+copy);
   }
   await checkMonthlyUnvisited(context,page,width);
   assert.deepEqual(errors,[],'page errors during UI copy cleanup and monthly unvisited');
   console.log('UI copy, collapsible safety and controls PASS at '+width+'px');
  }finally{await context.close()}
 }
 console.log('=== tests/ui-copy-cleanup-gate.mjs ===\nPASS');
}
