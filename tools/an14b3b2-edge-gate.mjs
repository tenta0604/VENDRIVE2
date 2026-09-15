const widths=[320,390];
let seq=0;

async function connect(wsUrl){
  const ws=new WebSocket(wsUrl),pending=new Map();
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
  ws.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.id&&pending.has(m.id)){
      const p=pending.get(m.id);pending.delete(m.id);
      m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);
    }
  };
  return {
    send(method,params={}){
      return new Promise((resolve,reject)=>{
        const id=++seq;pending.set(id,{resolve,reject});
        ws.send(JSON.stringify({id,method,params}));
      });
    },
    close(){ws.close()}
  };
}
async function pageTarget(){
  const res=await fetch("http://127.0.0.1:9222/json/list");
  if(!res.ok)throw new Error("Edge CDP target list failed: "+res.status);
  const list=await res.json();
  const page=list.find(x=>x.type==="page");
  if(!page)throw new Error("No Edge page target");
  return page.webSocketDebuggerUrl;
}
function sectionPaper(){return {carNumber:"404",operatorName:"大岩 忍",locationName:"第一フジタクシー大治"}}
function inputPayload(){
  return {
    paper:sectionPaper(),
    counterRows:[
      {price:190,branchNumber:0,previousCount:112,currentCount:131,salesQty:19},
      {price:180,branchNumber:0,previousCount:40,currentCount:42,salesQty:2}
    ],
    payment:{cardAmount:0,cashAmount:3970,salesAmount:3970},
    totalQty:3,
    items:[
      {productCode:"705904",printedName:"185ボス カフェオレ",temperature:"COLD",column:null,quantity:1},
      {productCode:"705905",printedName:"185ボス スレインボー",temperature:"COLD",column:null,quantity:2}
    ]
  };
}
function recoveryPayload(){
  return {
    paper:sectionPaper(),
    totalQty:11,
    items:[
      {productCode:"744654",printedName:"280Pノムヨーグレット",temperature:"COLD",column:null,caseCount:0,looseCount:10,quantity:10},
      {productCode:"744533",printedName:"500Pデカビタ",temperature:"COLD",column:null,caseCount:0,looseCount:1,quantity:1}
    ]
  };
}
function fixture(type,width){
  const minute=width===320?"38":"39";
  let candidatePayload;
  if(type==="input")candidatePayload=inputPayload();
  else if(type==="recovery")candidatePayload=recoveryPayload();
  else candidatePayload={input:inputPayload(),recovery:recoveryPayload()};
  return {
    reviewVersion:2,status:"needs_review",
    image:{name:"fixture.jpg",mime:"image/jpeg",size:123,lastModified:1,stored:false},
    classification:{detectedType:type,typeConfidence:0.99,selectedType:null,effectiveType:type,userOverride:false},
    identity:{occurredAt:"2026-09-15T08:"+minute+":00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:null},
    ocr:{connected:true,provider:"google-gemini-api",requestId:"edge-"+type+"-"+width,warnings:[],rawTextStored:false,imageStored:false},
    candidatePayload,
    candidateValidation:{structureReady:true,readyToConfirm:true,reason:null,validation:{quantityMatch:true,amountMatch:null,warnings:[]}},
    persistence:{reportCreated:false,analyticsWrite:false,legacyWrite:false,allowed:false,reason:"review_only"},
    policy:{requiresUserReview:true,requiresExplicitSave:true,imageStored:false,rawOcrTextStored:false,autoSave:false}
  };
}

for(const width of widths){
  const client=await connect(await pageTarget());
  try{
    await client.send("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:true});
    await client.send("Page.navigate",{url:"http://127.0.0.1:8000/tools/an14b3b2-edge-fixture.html?width="+width});
    await new Promise(r=>setTimeout(r,1800));

    const fixtures={
      input:fixture("input",width),
      recovery:fixture("recovery",width),
      input_recovery:fixture("input_recovery",width)
    };
    const expression=`(async()=> {
      if(!window.VENDRIVE2Analytics||!window.VENDRIVE2InputRecoveryReview)throw new Error("review modules unavailable");
      localStorage.setItem("vendrive2_v7_data","AN14B3B2_SENTINEL");
      const fixtures=${JSON.stringify(fixtures)};
      const host=document.createElement("div");host.id="edge-review-host";
      document.body.innerHTML="";document.body.appendChild(host);

      for(const type of ["input","recovery","input_recovery"]){
        host.innerHTML="";
        const mounted=window.VENDRIVE2InputRecoveryReview.mount(host,fixtures[type]);
        if(!mounted||!mounted.mounted||mounted.type!==type)throw new Error(type+" mount failed");
        if(document.documentElement.scrollWidth>window.innerWidth)throw new Error(type+" horizontal overflow");
        const approval=host.querySelector('[data-role="ir-approval"]');
        const save=host.querySelector('[data-role="ir-save"]');
        const validation=host.querySelector('[data-role="ir-validation"]');
        if(!approval||!save||!validation)throw new Error(type+" review controls missing");
        if(!validation.classList.contains("ok"))throw new Error(type+" initial validation not ok: "+validation.textContent);
        if(!save.disabled)throw new Error(type+" save enabled before approval");
      }

      host.innerHTML="";
      const review=fixtures.input_recovery;
      window.VENDRIVE2InputRecoveryReview.mount(host,review);
      const approval=host.querySelector('[data-role="ir-approval"]');
      const save=host.querySelector('[data-role="ir-save"]');
      const validation=host.querySelector('[data-role="ir-validation"]');
      const qty=host.querySelector('[data-role="ir-input-qty"]');
      qty.value="9";qty.dispatchEvent(new Event("input",{bubbles:true}));
      if(validation.classList.contains("ok")||!save.disabled)throw new Error("input quantity mismatch did not block save");
      qty.value="1";qty.dispatchEvent(new Event("input",{bubbles:true}));
      if(!validation.classList.contains("ok"))throw new Error("corrected input did not validate");

      const loose=host.querySelector('[data-role="ir-recovery-loose"]');
      loose.value="9";loose.dispatchEvent(new Event("input",{bubbles:true}));
      if(!validation.classList.contains("ok"))throw new Error("case-zero recovery auto-sync should remain valid");
      const units=host.querySelector('[data-role="ir-recovery-units"]');
      if(Number(units.value)!==9)throw new Error("case-zero recovery unit auto-sync failed");

      approval.checked=true;approval.dispatchEvent(new Event("change",{bubbles:true}));
      if(save.disabled)throw new Error("approval did not enable save");
      save.click();
      for(let i=0;i<50;i++){
        if(host.querySelector('[data-role="ir-status"]').textContent.includes("下書きを作成しました"))break;
        await new Promise(r=>setTimeout(r,100));
      }
      const status=host.querySelector('[data-role="ir-status"]').textContent;
      if(!status.includes("下書きを作成しました"))throw new Error("draft save failed: "+status);
      const reports=await window.VENDRIVE2Analytics.data.reports.list();
      const inventory=await window.VENDRIVE2Analytics.data.inventory.listEvents();
      if(reports.length!==1||reports[0].type!=="input_recovery"||reports[0].status!=="draft")throw new Error("unexpected report persistence");
      if(reports[0].current.recovery.items[0].caseCount!==0||reports[0].current.recovery.items[0].looseCount!==9||reports[0].current.recovery.items[0].quantity!==9)throw new Error("recovery printed counts were not preserved");
      if(inventory.length!==0)throw new Error("inventory movement occurred");
      if(localStorage.getItem("vendrive2_v7_data")!=="AN14B3B2_SENTINEL")throw new Error("legacy data changed");
      const overflow=document.documentElement.scrollWidth>window.innerWidth;
      return {width,overflow,reports:reports.length,inventory:inventory.length,status,scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth};
    })()`;

    const result=await client.send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
    const value=result.result&&result.result.value;
    if(!value)throw new Error("No result from browser gate");
    console.log("EDGE_GATE",JSON.stringify(value));
    await client.send("Runtime.evaluate",{expression:"window.VENDRIVE2Analytics.close(); indexedDB.deleteDatabase('VENDRIVE2_ANALYTICS_DB'); localStorage.clear(); true",returnByValue:true});
  } finally {
    client.close();
  }
}
