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
  await nav(c,"http://127.0.0.1:8000/tools/ops-real-workflow-gate.html",390);
  const draft=await ev(c,`(async()=>{
    const api=window.VENDRIVE2Analytics;if(!api)return{error:"analytics missing"};await api.ready();
    const raw={provider:"google-gemini-api",requestId:"ops-gate",detectedType:"input_recovery",typeConfidence:1,occurredAt:"2026-09-16T08:38:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:"M1",candidatePayload:{input:{paper:{carNumber:"404",operatorName:"op",locationName:"loc"},totalQty:3,items:[{productCode:"705904",printedName:"sample",temperature:"COLD",column:null,quantity:3}]},recovery:{paper:{carNumber:"404",operatorName:"op",locationName:"loc"},totalQty:1,items:[{productCode:"744533",printedName:"sample2",temperature:"COLD",column:null,caseCount:0,looseCount:1,quantity:1}]}},warnings:[]};
    const review=await api.capture.prepareOcrReview({image:{name:"receipt.jpg",mime:"image/jpeg",size:1000,lastModified:null},selectedType:null,ocrResult:raw});
    review.machineMatch={status:"confirmed_mapping",confirmedMapping:{machineId:"M1",missing:false},candidates:[]};
    const host=document.getElementById("review");window.VENDRIVE2CompactOcrReview.mount(host,review);
    const checkbox=host.querySelector('.vdrCompactApproval input');checkbox.checked=true;checkbox.dispatchEvent(new Event("change",{bubbles:true}));
    const create=Array.from(host.querySelectorAll("button")).find(b=>b.textContent.includes("この内容で下書きを作成"));if(!create)return{error:"create button missing",text:host.innerText};if(create.disabled)return{error:"create button disabled",text:host.innerText};
    create.click();
    let confirmBtn=null;for(let i=0;i<30&&!confirmBtn;i++){await new Promise(r=>setTimeout(r,100));confirmBtn=host.querySelector(".vdrDraftConfirmButton")}
    const createdText=host.innerText;if(!confirmBtn)return{error:"confirm button missing",createdText};
    window.confirm=()=>true;confirmBtn.click();await new Promise(r=>setTimeout(r,180));
    const reports=await api.data.reports.list(),report=reports.find(x=>x.source&&x.source.method==="ocr"&&x.vendorNumber==="4038404");
    return{createdText,finalText:host.innerText,status:report&&report.status,button:confirmBtn.textContent,scrollWidth:document.documentElement.scrollWidth,width:innerWidth};
  })()`);
  assert(!draft.error,JSON.stringify(draft));
  assert(draft.createdText.includes("✓ 下書きを作成しました"),"draft success card missing");
  assert(draft.createdText.includes("下書きを確認・確定する"),"explicit confirmation action missing");
  assert(draft.status==="confirmed","draft did not become confirmed");
  assert(draft.finalText.includes("✓ 帳票を確定しました"),"confirmed success state missing");
  assert(draft.button==="確定済み","confirm button state wrong");
  assert(draft.scrollWidth<=draft.width,"draft workflow overflow");
  console.log("OPS_DRAFT_CONFIRM_PASS",JSON.stringify({status:draft.status}));

  await nav(c,"http://127.0.0.1:8000/",390);
  const placement=await ev(c,`(()=>{const hero=document.querySelector("#todayPage .hero"),capture=document.querySelector("#todayPage .reportCaptureSection");return{direct:hero&&hero.nextElementSibling===capture,heroTop:hero&&hero.getBoundingClientRect().top,captureTop:capture&&capture.getBoundingClientRect().top,version:document.body.innerText.includes("2026.09.16-FINAL.9")}})()`);
  assert(placement.direct,"report capture is not directly below Today hero");
  assert(placement.captureTop>placement.heroTop,"report capture placement invalid");
  console.log("OPS_CAPTURE_PLACEMENT_PASS");

  await nav(c,"http://127.0.0.1:8000/tools/ops-real-workflow-gate.html",390);
  const guards=await ev(c,`(async()=>{
    const d=new Date(),yyyy=d.getFullYear(),mm=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0"),today=yyyy+"-"+mm+"-"+dd,week=["日","月","火","水","木","金","土"],todayDay=week[d.getDay()],otherDay=week[(d.getDay()+1)%7];
    const state={machines:[
      {id:"M1",name:"本日A",maker:"サントリー",makerGroup:"サントリー",code:"4038404",address:"",days:[todayDay],cycle:"1週間に1回",last:null,force:today,visited:false,skip:null,order:{type:"商品関連",sub:"補充",detail:"",createdAt:Date.now()},taskDone:{}},
      {id:"M2",name:"対象外B",maker:"サントリー",makerGroup:"サントリー",code:"9999999",address:"",days:[otherDay],cycle:"1週間に1回",last:today,visited:false,taskDone:{}}
    ],offices:[],history:[],tomorrowPlan:null,tasks:[
      {id:"T1",text:"本日対象タスク",target:"サントリー",targetMachineIds:["M1"],completed:false},
      {id:"T2",text:"対象外タスク",target:"サントリー",targetMachineIds:["M2"],completed:false}
    ],taskHistory:[],temporaryVisitPeriods:[],restDays:[],makers:["サントリー"],makerColors:{},makerSettings:[]};
    localStorage.setItem("vendrive2_v7_data",JSON.stringify(state));localStorage.setItem("vendrive2_v7_data_version","1");localStorage.setItem("vendrive2_last_day",today);return true;
  })()`);
  await nav(c,"http://127.0.0.1:8000/",390);
  const warning=await ev(c,`(async()=>{
    window.__messages=[];window.confirm=(m)=>{window.__messages.push(String(m));return false};
    const card=document.querySelector("#todayList .swipeCard");if(!card)return{error:"today machine card missing",body:document.body.innerText.slice(0,500)};
    card.click();await new Promise(r=>setTimeout(r,80));
    const complete=document.getElementById("completeMachine");if(!complete)return{error:"complete button missing"};complete.click();await new Promise(r=>setTimeout(r,80));
    const visitMessages=window.__messages.slice();
    window.__messages=[];document.getElementById("finishDay").click();await new Promise(r=>setTimeout(r,80));
    return{visitMessages,dayMessages:window.__messages.slice(),scrollWidth:document.documentElement.scrollWidth,width:innerWidth};
  })()`);
  assert(!warning.error,warning.error||"");
  assert(warning.visitMessages.length===1&&warning.visitMessages[0].includes("未完了タスクが1件"),"visit task warning missing");
  assert(warning.visitMessages[0].includes("本日対象タスク"),"visit warning missing task name");
  assert(warning.dayMessages.length===1&&warning.dayMessages[0].includes("未達オーダー：1台"),"end-day order warning missing");
  assert(warning.dayMessages[0].includes("未達タスク：1件 / 1台分"),"end-day task warning scope wrong");
  assert(warning.dayMessages[0].includes("本日対象タスク"),"today task missing from end-day warning");
  assert(!warning.dayMessages[0].includes("対象外タスク"),"out-of-route task leaked into end-day warning");
  assert(warning.scrollWidth<=warning.width,"390 Today workflow overflow");
  console.log("OPS_TODAY_GUARDS_390_PASS");

  await c.send("Emulation.setDeviceMetricsOverride",{width:320,height:900,deviceScaleFactor:1,mobile:false});
  const mobile=await ev(c,`(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,capture:!!document.querySelector("#todayPage .reportCaptureSection")}))()`);
  assert(mobile.scrollWidth<=mobile.width,"320 Today overflow");
  assert(mobile.capture,"capture missing at 320");
  console.log("OPS_MOBILE_320_PASS",JSON.stringify(mobile));
}finally{c.close()}