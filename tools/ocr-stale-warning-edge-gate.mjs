let seq=0;
function assert(c,m){if(!c)throw new Error(m)}
async function connect(){
  const list=await (await fetch("http://127.0.0.1:9222/json/list")).json(),page=list.find(x=>x.type==="page");assert(page,"No Edge page");
  const ws=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}};
  return{send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})},close(){ws.close()}};
}
async function ev(c,x){const r=await c.send("Runtime.evaluate",{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function nav(c,url,width){await c.send("Network.setCacheDisabled",{cacheDisabled:true});await c.send("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:false});await c.send("Page.navigate",{url});await new Promise(r=>setTimeout(r,1200))}
const c=await connect();
try{
  await nav(c,"http://127.0.0.1:8000/tools/ocr-stale-warning-gate.html",320);
  const zero=await ev(c,`(()=>{const review={classification:{effectiveType:"input_recovery",detectedType:"input_recovery",typeConfidence:1},identity:{occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:"M1"},ocr:{warnings:["recovery_case_conversion_required"]},candidatePayload:{input:{paper:{locationName:"loc",operatorName:"op"},totalQty:1,items:[{productCode:"705904",printedName:"input",temperature:"COLD",column:null,quantity:1}]},recovery:{paper:{locationName:"loc",operatorName:"op"},totalQty:11,items:[{productCode:"744654",printedName:"yogurt",temperature:"COLD",column:null,caseCount:0,looseCount:10,quantity:10},{productCode:"744533",printedName:"ginger",temperature:"COLD",column:null,caseCount:0,looseCount:1,quantity:1}]}},machineMatch:{status:"confirmed_mapping",confirmedMapping:{machineId:"M1",missing:false},candidates:[]}};const host=document.getElementById("review");window.VENDRIVE2CompactOcrReview.mount(host,review);return{txt:host.innerText,width:innerWidth,scrollWidth:document.documentElement.scrollWidth}})()`);
  assert(!zero.txt.includes("recovery_case_conversion_required"),"raw legacy warning leaked");
  assert(!zero.txt.includes("数量確認"),"zero-case recovery falsely flagged");
  assert(zero.scrollWidth<=zero.width,"zero-case 320 overflow");
  console.log("CASE_WARNING_ZERO_CASE_UI_PASS");

  const unsafe=await ev(c,`(()=>{const review={classification:{effectiveType:"input_recovery",detectedType:"input_recovery",typeConfidence:1},identity:{occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:"M1"},ocr:{warnings:["case_conversion_required:recovery.items.0.quantity"]},candidatePayload:{input:{paper:{locationName:"loc",operatorName:"op"},totalQty:1,items:[{productCode:"705904",printedName:"input",temperature:"COLD",column:null,quantity:1}]},recovery:{paper:{locationName:"loc",operatorName:"op"},totalQty:0,items:[{productCode:"744654",printedName:"yogurt",temperature:"COLD",column:null,caseCount:1,looseCount:2,quantity:0}]}},machineMatch:{status:"confirmed_mapping",confirmedMapping:{machineId:"M1",missing:false},candidates:[]}};const host=document.getElementById("review");window.VENDRIVE2CompactOcrReview.mount(host,review);const edit=host.querySelector('[aria-label="在庫反映数量を編集"]');return{txt:host.innerText,hasEdit:!!edit,width:innerWidth,scrollWidth:document.documentElement.scrollWidth}})()`);
  assert(unsafe.txt.includes("数量確認 1件"),"unsafe case not categorized as quantity check");
  assert(unsafe.txt.includes("ケース入数が不明です"),"friendly case message missing");
  assert(unsafe.hasEdit,"pinpoint case quantity edit missing");
  assert(!unsafe.txt.includes("case_conversion_required"),"internal token leaked");
  assert(unsafe.scrollWidth<=unsafe.width,"unsafe 320 overflow");
  console.log("CASE_WARNING_PINPOINT_UI_PASS");

  await nav(c,"http://127.0.0.1:8000/",390);
  const failure=await ev(c,`(async()=>{
    const input=document.getElementById("reportCaptureFile"),button=document.getElementById("runReportOcr");
    if(!input||!button||typeof input.onchange!=="function"||typeof button.onclick!=="function")return{error:"report capture UI not initialized"};
    const dt=new DataTransfer();dt.items.add(new File([new Blob(["x"],{type:"image/png"})],"test.png",{type:"image/png"}));Object.defineProperty(input,"files",{value:dt.files,configurable:true});input.dispatchEvent(new Event("change",{bubbles:true}));
    document.getElementById("reportCaptureReviewResult").innerHTML='<div id="oldReview">OLD REVIEW</div>';
    document.getElementById("reportOcrResult").innerHTML='<div>OLD SUMMARY</div>';
    window.VENDRIVE2OCRAdapter={version:1,analyze:()=>Promise.reject(Object.assign(new Error("busy"),{code:"provider_busy",retryable:true,status:503}))};
    button.disabled=false;button.click();await new Promise(r=>setTimeout(r,140));
    return{reviewHtml:document.getElementById("reportCaptureReviewResult").innerHTML,resultText:document.getElementById("reportOcrResult").innerText,status:document.getElementById("reportOcrStatus").innerText,buttonDisabled:button.disabled};
  })()`);
  assert(!failure.error,failure.error||"");
  assert(failure.reviewHtml==="","failed OCR retained old review");
  assert(failure.resultText.includes("OCRサービスが混雑しています"),"busy failure not shown");
  assert(failure.buttonDisabled===false,"OCR button remained disabled");
  console.log("OCR_FAILURE_CLEARS_STALE_REVIEW_PASS");

  const race=await ev(c,`(async()=>{
    const input=document.getElementById("reportCaptureFile"),button=document.getElementById("runReportOcr");
    const dt=new DataTransfer();dt.items.add(new File([new Blob(["x"],{type:"image/png"})],"race.png",{type:"image/png"}));Object.defineProperty(input,"files",{value:dt.files,configurable:true});input.dispatchEvent(new Event("change",{bubbles:true}));
    let resolveFirst=null,calls=0;
    const success={provider:"google-gemini-api",requestId:"late-success",detectedType:"input",typeConfidence:1,occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:null,candidatePayload:{paper:{carNumber:"404",operatorName:"op",locationName:"loc"},totalQty:1,items:[{productCode:"705904",printedName:"sample",temperature:"COLD",column:null,quantity:1}]},warnings:[]};
    window.VENDRIVE2OCRAdapter={version:1,analyze:()=>{calls++;if(calls===1)return new Promise(r=>{resolveFirst=r});return Promise.reject(Object.assign(new Error("busy"),{code:"provider_busy",retryable:true,status:503}))}};
    button.disabled=false;button.click();await new Promise(r=>setTimeout(r,20));button.disabled=false;button.click();await new Promise(r=>setTimeout(r,120));resolveFirst(success);await new Promise(r=>setTimeout(r,220));
    return{reviewHtml:document.getElementById("reportCaptureReviewResult").innerHTML,resultText:document.getElementById("reportOcrResult").innerText,status:document.getElementById("reportOcrStatus").innerText};
  })()`);
  assert(race.reviewHtml==="","late old success restored review");
  assert(race.resultText.includes("OCRサービスが混雑しています"),"newer failure was overwritten by late success");
  console.log("OCR_STALE_SUCCESS_CANNOT_OVERWRITE_NEW_FAILURE_PASS");

  const dimensions=await ev(c,`(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,version:document.body.innerText.includes("2026.09.16-FINAL.8")}))()`);
  assert(dimensions.scrollWidth<=dimensions.width,"390 app horizontal overflow");
  console.log("OCR_STALE_WARNING_EDGE_PASS",JSON.stringify(dimensions));
}finally{c.close()}
