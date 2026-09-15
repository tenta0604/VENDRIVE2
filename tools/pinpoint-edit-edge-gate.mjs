let seq=0;
function assert(c,m){if(!c)throw new Error(m)}
async function connect(){const list=await (await fetch("http://127.0.0.1:9222/json/list")).json(),page=list.find(x=>x.type==="page");assert(page,"No Edge page");const ws=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}};return{send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})},close(){ws.close()}}}
async function ev(c,x){const r=await c.send("Runtime.evaluate",{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function nav(c,w){await c.send("Emulation.setDeviceMetricsOverride",{width:w,height:900,deviceScaleFactor:1,mobile:false});await c.send("Page.navigate",{url:"http://127.0.0.1:8000/tools/pinpoint-edit-gate.html"});await new Promise(r=>setTimeout(r,700))}
const c=await connect();
try{
  await nav(c,320);
  const machine=await ev(c,`(()=>{const r={classification:{effectiveType:"input_recovery",detectedType:"input_recovery",typeConfidence:1},identity:{occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:null},ocr:{warnings:[]},candidatePayload:{input:{paper:{locationName:"第一フジタクシー大治",operatorName:"大岩 忍"},totalQty:1,items:[{productCode:"705904",printedName:"185ボス",temperature:"COLD",column:null,quantity:1}]},recovery:{paper:{locationName:"第一フジタクシー大治",operatorName:"大岩 忍"},totalQty:1,items:[{productCode:"744654",printedName:"280P",temperature:"COLD",column:null,caseCount:0,looseCount:1,quantity:1}]}},machineMatch:{status:"management_match",candidates:[{machineId:"M1",machine:{id:"M1",name:"第一フジタクシー大治営業所",managementCodeKey:"4038404"}}]}};window.currentReview=r;VENDRIVE2CompactOcrReview.mount(document.getElementById("review"),r);return{txt:document.getElementById("review").innerText,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,drafts:__draftCalls}})()`);
  assert(machine.txt.includes("紐づけ確認 1件"),"machine-only badge not explicit");
  assert(!machine.txt.includes("OCR確認"),"machine issue leaked into OCR badge");
  assert(machine.txt.includes("この自販機と紐づける"),"machine link action missing");
  assert(machine.scrollWidth<=machine.width,"320 overflow");
  assert(machine.drafts===0,"render wrote draft");
  console.log("PINPOINT_MACHINE_ONLY_PASS");

  const uncertain=await ev(c,`(async()=>{const r={classification:{effectiveType:"input",detectedType:"input",typeConfidence:.99},identity:{occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:"M1"},ocr:{warnings:["uncertain:input.items.0.productCode"]},candidatePayload:{paper:{locationName:"第一フジタクシー大治",operatorName:"大岩 忍"},totalQty:2,items:[{productCode:"70590?",printedName:"185ボス",temperature:"COLD",column:null,quantity:2}]},machineMatch:{status:"confirmed_mapping",confirmedMapping:{machineId:"M1",missing:false},candidates:[{machineId:"M1",machine:{id:"M1",name:"第一フジタクシー大治営業所",managementCodeKey:"4038404"}}]}};window.currentReview=r;const host=document.getElementById("review");VENDRIVE2CompactOcrReview.mount(host,r);let b=host.querySelector('[aria-label="商品コードを編集"]');if(!b)return{error:"edit missing",txt:host.innerText};b.click();let input=host.querySelector(".vdrInlineEditor input");if(!input)return{error:"inline missing",txt:host.innerText};input.value="705904";host.querySelector(".vdrInlineEditor .save").click();await new Promise(x=>setTimeout(x,80));return{txt:host.innerText,code:r.candidatePayload.items[0].productCode,warnings:r.ocr.warnings.slice(),drafts:__draftCalls,full:Array.from(host.querySelectorAll("button")).some(x=>x.textContent==="全体を編集"),width:innerWidth,scrollWidth:document.documentElement.scrollWidth}})()`);
  assert(!uncertain.error,uncertain.error||"");
  assert(uncertain.code==="705904","pinpoint value not updated");
  assert(uncertain.warnings.length===0,"uncertainty warning not cleared");
  assert(!uncertain.txt.includes("OCR確認"),"OCR badge remained after correction");
  assert(uncertain.full,"full editor button missing");
  assert(uncertain.drafts===0,"inline edit persisted data");
  assert(uncertain.scrollWidth<=uncertain.width,"320 edit overflow");
  console.log("PINPOINT_INLINE_EDIT_PASS",JSON.stringify({code:uncertain.code}));

  const meta=await ev(c,`(async()=>{const r={classification:{effectiveType:"input",detectedType:"input",typeConfidence:1},identity:{occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"403840?",machineId:null},ocr:{warnings:["uncertain:vendorNumber"]},candidatePayload:{paper:{locationName:"第一フジタクシー大治",operatorName:"大岩 忍"},totalQty:1,items:[{productCode:"705904",printedName:"185ボス",temperature:"COLD",column:null,quantity:1}]},machineMatch:{status:"no_match",candidates:[]}};const host=document.getElementById("review");VENDRIVE2CompactOcrReview.mount(host,r);let b=host.querySelector('[aria-label="ベンダーを編集"]');b.click();let input=host.querySelector(".vdrInlineEditor input");input.value="4038404";host.querySelector(".vdrInlineEditor .save").click();await new Promise(x=>setTimeout(x,120));return{vendor:r.identity.vendorNumber,status:r.machineMatch.status,txt:host.innerText,links:__linkCalls,drafts:__draftCalls}})()`);
  assert(meta.vendor==="4038404","metadata inline edit failed");
  assert(meta.status==="confirmed_mapping","machine rematch not refreshed");
  assert(meta.links===0&&meta.drafts===0,"metadata edit caused persistence");
  console.log("PINPOINT_METADATA_EDIT_PASS");

  await nav(c,390);
  const full=await ev(c,`(()=>{const r={classification:{effectiveType:"input",detectedType:"input",typeConfidence:1},identity:{occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:"M1"},ocr:{warnings:[]},candidatePayload:{paper:{locationName:"第一フジタクシー大治",operatorName:"大岩 忍"},totalQty:1,items:[{productCode:"705904",printedName:"185ボス",temperature:"COLD",column:null,quantity:1}]},machineMatch:{status:"confirmed_mapping",confirmedMapping:{machineId:"M1",missing:false},candidates:[]}};const host=document.getElementById("review");VENDRIVE2CompactOcrReview.mount(host,r);const b=Array.from(host.querySelectorAll("button")).find(x=>x.textContent==="全体を編集");b.click();return{txt:host.innerText,width:innerWidth,scrollWidth:document.documentElement.scrollWidth}})()`);
  assert(full.txt.includes("FULL_EDITOR_MOUNTED"),"full editor unavailable");
  assert(full.scrollWidth<=full.width,"390 overflow");
  console.log("PINPOINT_FULL_EDITOR_PASS");
}finally{c.close()}