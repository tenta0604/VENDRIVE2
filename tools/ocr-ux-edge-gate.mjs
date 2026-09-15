let seq=0;
function assert(c,m){if(!c)throw new Error(m)}
async function connect(){
  const list=await (await fetch("http://127.0.0.1:9222/json/list")).json(),page=list.find(x=>x.type==="page");assert(page,"No Edge page");
  const ws=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}};
  return {send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})},close(){ws.close()}};
}
async function ev(c,expression){const r=await c.send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result&&r.result.value}
async function nav(c,url){await c.send("Page.navigate",{url});await new Promise(r=>setTimeout(r,1200))}
const c=await connect();
try{
  await c.send("Emulation.setDeviceMetricsOverride",{width:320,height:900,deviceScaleFactor:1,mobile:false});
  await nav(c,"http://127.0.0.1:8000/tools/ocr-ux-gate.html");
  const optimized=await ev(c,`(async()=>{
    const canvas=document.createElement("canvas");canvas.width=1400;canvas.height=2400;const ctx=canvas.getContext("2d"),img=ctx.createImageData(canvas.width,canvas.height);let seed=123456789;
    for(let i=0;i<img.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=seed&255;img.data[i]=v;img.data[i+1]=(v*3)&255;img.data[i+2]=(v*7)&255;img.data[i+3]=255}
    ctx.putImageData(img,0,0);ctx.fillStyle="#fff";ctx.fillRect(260,80,880,2200);ctx.fillStyle="#111";ctx.font="30px sans-serif";for(let y=150;y<2200;y+=55)ctx.fillText("705904 185 BOSS SAMPLE "+y,310,y);
    const blob=await new Promise(r=>canvas.toBlob(r,"image/jpeg",.98));const file=new File([blob],"receipt.jpg",{type:"image/jpeg"});
    window.__progress=[];window.__capturedUpload=null;
    const result=await window.VENDRIVE2OCRAdapter.analyze({file,supportedReportTypes:["sales","input","recovery","input_recovery"],onProgress:i=>window.__progress.push(i)});
    return {original:file.size,captured:window.__capturedUpload,progress:window.__progress,result,scrollWidth:document.documentElement.scrollWidth,width:innerWidth};
  })()`);
  assert(optimized.original>900*1024,"source image did not exercise optimizer");
  assert(optimized.captured&&optimized.captured.size<optimized.original,"optimized upload was not smaller");
  assert(optimized.captured.size<=4*1024*1024,"optimized upload exceeded relay limit");
  assert(Math.max(optimized.captured.width,optimized.captured.height)<=2200,"optimized dimensions exceed max edge");
  assert(optimized.progress.some(x=>x.stage==="optimizing"),"optimizer progress missing");
  assert(optimized.progress.some(x=>x.stage==="ocr_wait"),"OCR wait progress missing");
  console.log("OCR_IMAGE_OPTIMIZATION_PASS",JSON.stringify({original:optimized.original,upload:optimized.captured.size,width:optimized.captured.width,height:optimized.captured.height}));

  const compact320=await ev(c,`(()=>{
    const review={classification:{effectiveType:"input_recovery",detectedType:"input_recovery",typeConfidence:1},identity:{occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:"M1"},ocr:{warnings:[]},candidatePayload:{input:{paper:{carNumber:"404",operatorName:"大岩 忍",locationName:"第一フジタクシー大治"},totalQty:3,items:[{productCode:"705904",printedName:"185ボス",temperature:"COLD",column:null,quantity:1},{productCode:"705906",printedName:"185ボス2",temperature:"COLD",column:null,quantity:2}]},recovery:{paper:{carNumber:"404",operatorName:"大岩 忍",locationName:"第一フジタクシー大治"},totalQty:1,items:[{productCode:"744533",printedName:"500P",temperature:"COLD",column:null,caseCount:0,looseCount:1,quantity:1}]}},machineMatch:{status:"confirmed_mapping",confirmedMapping:{machineId:"M1",missing:false},candidates:[{machineId:"M1",machine:{id:"M1",name:"第一フジタクシー大治",managementCodeKey:"4038404"}}]}};
    const host=document.getElementById("review");window.VENDRIVE2CompactOcrReview.mount(host,review);
    const detail=host.querySelector(".vdrCompactDetail"),before=detail.hidden,text=host.innerText,save=Array.from(host.querySelectorAll("button")).find(b=>b.textContent.includes("下書きを作成"));
    const edit=Array.from(host.querySelectorAll("button")).find(b=>b.textContent==="編集する");edit.click();
    return {before,after:detail.hidden,text,saveDisabled:save.disabled,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,detailText:detail.innerText};
  })()`);
  assert(compact320.before===true&&compact320.after===false,"detailed editor visibility flow failed");
  assert(compact320.text.includes("帳票種別の判定 100%"),"type confidence label missing");
  assert(compact320.text.includes("✓ 第一フジタクシー大治"),"confirmed machine match missing");
  assert(compact320.text.includes("705904")&&compact320.text.includes("744533"),"compact item rows missing");
  assert(compact320.scrollWidth<=compact320.width,"320px horizontal overflow");
  assert(compact320.detailText.includes("カウンター情報"),"legacy detailed editor unavailable on demand");
  console.log("OCR_COMPACT_320_PASS",JSON.stringify({scrollWidth:compact320.scrollWidth,width:compact320.width}));

  const issue=await ev(c,`(()=>{
    const review={classification:{effectiveType:"input",detectedType:"input",typeConfidence:.98},identity:{occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:null},ocr:{warnings:["uncertain:items.0.productCode"]},candidatePayload:{paper:{carNumber:"404",operatorName:"大岩 忍",locationName:"第一フジタクシー大治"},totalQty:99,items:[{productCode:"705904",printedName:"185ボス",temperature:"COLD",column:null,quantity:1}]},machineMatch:{status:"management_match",confirmedMapping:null,candidates:[{machineId:"M1",machine:{id:"M1",name:"第一フジタクシー大治",managementCodeKey:"4038404"}}]}};
    const host=document.getElementById("review");window.VENDRIVE2CompactOcrReview.mount(host,review);
    const text=host.innerText,row=host.querySelector(".vdrCompactRow.error,.vdrCompactRow.warn"),save=Array.from(host.querySelectorAll("button")).find(b=>b.textContent.includes("下書きを作成"));
    return {text,rowClass:row&&row.className,saveDisabled:save.disabled,linkButton:Array.from(host.querySelectorAll("button")).some(b=>b.textContent.includes("この自販機と紐づける"))};
  })()`);
  assert(issue.text.includes("投入合計が商品行と一致していません"),"deterministic issue missing");
  assert(issue.text.includes("読み取り要確認"),"uncertain-field issue missing");
  assert(issue.rowClass&&issue.saveDisabled===true,"issue state did not block direct save");
  assert(issue.linkButton,"unique machine candidate action missing");
  console.log("OCR_ISSUE_HIGHLIGHT_PASS");

  await c.send("Emulation.setDeviceMetricsOverride",{width:390,height:900,deviceScaleFactor:1,mobile:false});
  const compact390=await ev(c,`(()=>{
    const review={classification:{effectiveType:"sales",detectedType:"sales",typeConfidence:1},identity:{occurredAt:"2026-09-15T08:39:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:"M1"},ocr:{warnings:[]},candidatePayload:{previousClearAt:"2026-09-14T08:00:00+09:00",elapsedHours:24.65,totalQty:3,totalAmount:360,products:[{productCode:"705904",printedName:"185ボス",temperature:"COLD",column:1,price:120,salesQty:3}],soldOuts:[],specialCircumstance:null},machineMatch:{status:"confirmed_mapping",confirmedMapping:{machineId:"M1",missing:false},candidates:[{machineId:"M1",machine:{id:"M1",name:"第一フジタクシー大治",managementCodeKey:"4038404"}}]}};
    const host=document.getElementById("review");window.VENDRIVE2CompactOcrReview.mount(host,review);
    return {scrollWidth:document.documentElement.scrollWidth,width:innerWidth,text:host.innerText,detailHidden:host.querySelector(".vdrCompactDetail").hidden};
  })()`);
  assert(compact390.scrollWidth<=compact390.width,"390px horizontal overflow");
  assert(compact390.text.includes("売上金額")&&compact390.detailHidden,"sales compact review failed");
  console.log("OCR_COMPACT_390_PASS",JSON.stringify({scrollWidth:compact390.scrollWidth,width:compact390.width}));
} finally {c.close()}
