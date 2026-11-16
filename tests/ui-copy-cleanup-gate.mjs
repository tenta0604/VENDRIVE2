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
   assert.equal(manifestVersion,'1.0.0','public 1.0 semantic release version is consistent');
   assert.equal(await page.title(),'VENDRIVE 1.0','browser tab reflects public release');
   const pwa=await page.evaluate(async()=>{
    const response=await fetch('manifest.webmanifest',{cache:'no-store'});
    if(!response.ok)throw Error('PWA manifest unavailable');
    const j=await response.json();
    return {name:j.name,short_name:j.short_name,id:j.id,start_url:j.start_url,scope:j.scope};
   });
   assert.equal(pwa.name,'VENDRIVE 1.0','PWA long name uses approved public brand');
   assert.equal(pwa.short_name,'VENDRIVE','PWA launcher remains compact');
   for(const key of ['id','start_url','scope'])
    assert.equal(pwa[key],'/VENDRIVE2/','PWA existing install and data identity remains stable: '+key);

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
   assert.deepEqual(errors,[],'page errors during UI copy cleanup');
   console.log('UI copy, collapsible safety and controls PASS at '+width+'px');
  }finally{await context.close()}
 }
 console.log('=== tests/ui-copy-cleanup-gate.mjs ===\nPASS');
}
