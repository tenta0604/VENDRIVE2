let seq=0;
function assert(condition,message){if(!condition)throw new Error(message)}
async function cdp(wsUrl){
  const ws=new WebSocket(wsUrl),pending=new Map();
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}};
  return {
    send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})},
    close(){ws.close()}
  };
}
async function pageTarget(){
  const res=await fetch("http://127.0.0.1:9222/json/list");
  assert(res.ok,"Edge target list failed");
  const list=await res.json();
  const page=list.find(x=>x.type==="page");
  assert(page,"No Edge page target");
  return page.webSocketDebuggerUrl;
}
async function evalIn(client,expression){
  const result=await client.send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result&&result.result.value;
}
async function navigate(client,url){
  await client.send("Page.navigate",{url});
  await new Promise(r=>setTimeout(r,1700));
}

const client=await cdp(await pageTarget());
try{
  await client.send("Emulation.setDeviceMetricsOverride",{width:390,height:900,deviceScaleFactor:1,mobile:false});
  await navigate(client,"http://127.0.0.1:8000/tools/final-analytics-fixture.html");

  const analyticsResult=await evalIn(client,`(async()=>{
    function a(c,m){if(!c)throw new Error(m)}
    const api=window.VENDRIVE2Analytics;
    a(api&&api.analysis&&api.backup,"Analytics API unavailable");
    const health=await api.ready();
    a(health.ready===true&&health.dbVersion===4&&health.schemaVersion===4&&health.engineVersion==="AN14B3B2","Analytics health/version mismatch");
    localStorage.setItem("vendrive2_v7_data","FINAL_LEGACY_SENTINEL");

    const product=await api.data.products.put({makerKey:"suntory",productCode:"P1",displayName:"FINAL Product",receiptAliases:["P1"],caseQuantity:24,category:"drink",temperatureModes:["COLD"],active:true});
    a(product.id===JSON.stringify(["suntory","P1"]),"Product identity mismatch");
    await api.data.machineLinks.put({makerKey:"suntory",vendorNumber:"V1",machineId:"M1"});
    const candidates=await api.bridge.findMachineCandidates({makerKey:"suntory",vendorNumber:"V1"});
    a(candidates.status==="confirmed_mapping"&&candidates.candidates[0].machineId==="M1","Machine bridge mapping failed");

    await api.data.inventory.setBaseline({makerKey:"suntory",productCode:"P1",occurredAt:"2026-09-01T08:00:00+09:00",quantity:100,note:"FINAL baseline"});
    await api.data.inventory.recordLoad({makerKey:"suntory",productCode:"P1",occurredAt:"2026-09-02T08:00:00+09:00",quantity:20,note:"FINAL load"});
    await api.data.inventory.recordDamage({makerKey:"suntory",productCode:"P1",occurredAt:"2026-09-03T08:00:00+09:00",quantity:5,reason:"damage",note:"FINAL damage"});
    await api.data.inventory.recordCorrection({makerKey:"suntory",productCode:"P1",occurredAt:"2026-09-03T09:00:00+09:00",quantity:-2,note:"FINAL correction"});

    const inputPayload={paper:{carNumber:"404",operatorName:"FINAL",locationName:"FINAL"},counterRows:[],payment:{cardAmount:0,cashAmount:0,salesAmount:0},totalQty:10,items:[{productCode:"P1",printedName:"FINAL Product",temperature:"COLD",column:null,quantity:10}]};
    const input=await api.data.reports.create({type:"input",status:"draft",makerKey:"suntory",vendorNumber:"V1",machineId:"M1",occurredAt:"2026-09-04T08:00:00+09:00",original:inputPayload,current:inputPayload,source:{method:"manual_test",imageStored:false}});
    a((await api.data.reports.confirm(input.id)).confirmed===true,"Input confirmation failed");

    const recoveryPayload={paper:{carNumber:"404",operatorName:"FINAL",locationName:"FINAL"},totalQty:3,items:[{productCode:"P1",printedName:"FINAL Product",temperature:"COLD",column:null,caseCount:0,looseCount:3,quantity:3}]};
    const recovery=await api.data.reports.create({type:"recovery",status:"draft",makerKey:"suntory",vendorNumber:"V1",machineId:"M1",occurredAt:"2026-09-05T08:00:00+09:00",original:recoveryPayload,current:recoveryPayload,source:{method:"manual_test",imageStored:false}});
    a((await api.data.reports.confirm(recovery.id)).confirmed===true,"Recovery confirmation failed");

    const stock=await api.data.inventory.getStock({makerKey:"suntory",productCode:"P1"});
    a(stock.known===true&&stock.quantity===106&&stock.movements.input===-10&&stock.movements.recovery===3&&stock.movements.load===20&&stock.movements.damage===-5&&stock.movements.correction===-2,"Inventory math regression");

    await api.data.expiry.recordLots({machineId:"M1",makerKey:"suntory",productCode:"P1",checkedAt:"2026-09-14T09:00:00+09:00",lots:[{kind:"exact",value:"2026-12-31",quantity:5}],note:"FINAL lots"});
    const facts=await api.data.expiry.getExpiryFacts({machineId:"M1",makerKey:"suntory",productCode:"P1",asOf:"2026-09-15"});
    a(facts.known===true&&facts.result==="lots"&&facts.lots.length===1&&facts.lots[0].status==="valid","Expiry lots regression");
    await api.data.expiry.recordClear({machineId:"M1",makerKey:"suntory",productCode:"P1",checkedAt:"2026-09-16T09:00:00+09:00",note:"FINAL clear"});
    a((await api.data.expiry.getCurrent({machineId:"M1",makerKey:"suntory",productCode:"P1"})).result==="clear","Expiry clear regression");

    const salesDates=[
      ["2025-09-01T12:00:00+09:00",2],["2025-09-02T12:00:00+09:00",3],["2025-09-03T12:00:00+09:00",4],
      ["2026-09-08T12:00:00+09:00",3],["2026-09-09T12:00:00+09:00",4],["2026-09-10T12:00:00+09:00",5],
      ["2026-09-11T12:00:00+09:00",6],["2026-09-12T12:00:00+09:00",7],["2026-09-13T12:00:00+09:00",8]
    ];
    for(let i=0;i<salesDates.length;i++){
      const occurredAt=salesDates[i][0],qty=salesDates[i][1],d=new Date(occurredAt),prev=new Date(d.getTime()-24*3600000).toISOString(),price=180;
      const payload={previousClearAt:prev,elapsedHours:24,totalQty:qty,totalAmount:qty*price,products:[{productCode:"P1",printedName:"FINAL Product",temperature:"COLD",column:1,price:price,salesQty:qty}],soldOuts:i===7?[{productCode:"P1",column:1,temperature:"COLD",soldOutElapsedHours:3}]:[],specialCircumstance:null};
      const report=await api.data.reports.create({type:"sales",status:"draft",makerKey:"suntory",vendorNumber:"V1",machineId:"M1",occurredAt,original:payload,current:payload,source:{method:"manual_test",imageStored:false}});
      a((await api.data.reports.confirm(report.id)).confirmed===true,"Sales confirmation failed "+i);
    }

    const observations=await api.analysis.sales.listObservations({machineId:"M1",productCode:"P1"});
    const windows=await api.analysis.sales.listObservationWindows({machineId:"M1",productCode:"P1",windowSize:3});
    const previous=await api.analysis.sales.listPreviousPeriodComparisons({machineId:"M1",productCode:"P1",windowSize:3});
    const historical=await api.analysis.sales.listHistoricalComparisons({machineId:"M1",productCode:"P1",windowSize:3,yearsBack:1,maxDayDistance:10,timeZone:"Asia/Tokyo"});
    const demand=await api.analysis.sales.listDemandEvidence({machineId:"M1",productCode:"P1",windowSize:3});
    const forecasts=await api.analysis.sales.listForecasts({machineId:"M1",productCode:"P1"});
    const recommendations=await api.analysis.recommendations.list({machineId:"M1",productCode:"P1"});
    a(observations.length===9&&windows.length>=5&&previous.length>=1&&historical.length>=1&&demand.length>=5&&forecasts.length>0&&recommendations.length>0,"Analysis pipeline regression");

    const visits=await api.analysis.planning.listVisitRecommendations({horizon:"next_workday"});
    const bring=await api.analysis.planning.listBringFromVehicleRecommendations({horizon:"next_workday",machineId:"M1"});
    const eod=await api.analysis.planning.getEndOfDayLoadingProposal({businessEnded:true});
    a(visits.length>=2&&bring.length>=1&&eod&&eod.proposalType==="end_of_day_vehicle_loading"&&eod.policy.autoApply===false,"Planning pipeline regression");

    const image={name:"final.jpg",mime:"image/jpeg",size:1234,lastModified:1};
    const ocrResult={provider:"google-gemini-api",requestId:"final-ocr-1",detectedType:"input_recovery",typeConfidence:.99,occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"V1",machineId:"M1",candidatePayload:{input:{paper:{carNumber:"404",operatorName:"FINAL",locationName:"FINAL"},counterRows:[{price:180,branchNumber:0,previousCount:10,currentCount:12,salesQty:2}],payment:{cardAmount:0,cashAmount:360,salesAmount:360},totalQty:2,items:[{productCode:"P1",printedName:"FINAL Product",temperature:"COLD",column:null,quantity:2}]},recovery:{paper:{carNumber:"404",operatorName:"FINAL",locationName:"FINAL"},totalQty:1,items:[{productCode:"P1",printedName:"FINAL Product",temperature:"COLD",column:null,caseCount:0,looseCount:1,quantity:1}]}},warnings:[]};
    const review=await api.capture.prepareOcrReview({image,ocrResult,selectedType:"input_recovery"});
    a(review.reviewVersion===2&&review.candidateValidation.readyToConfirm===true&&review.policy.autoSave===false,"OCR review boundary regression");
    const eventsBefore=(await api.data.inventory.listEvents()).length;
    const draft=await api.capture.createDraftFromReview({review,userApproved:true,visitId:null});
    const eventsAfter=(await api.data.inventory.listEvents()).length;
    a(draft.created===true&&draft.confirmed===false&&draft.report.status==="draft"&&eventsAfter===eventsBefore,"OCR draft safety regression");
    a(localStorage.getItem("vendrive2_v7_data")==="FINAL_LEGACY_SENTINEL","OCR flow changed legacy storage");

    const salesReview={reviewVersion:2,status:"needs_review",image:{name:"s.jpg",mime:"image/jpeg",size:10,lastModified:1,stored:false},classification:{detectedType:"sales",typeConfidence:.99,selectedType:null,effectiveType:"sales",userOverride:false},identity:{occurredAt:"2026-09-15T09:00:00+09:00",makerKey:"suntory",vendorNumber:"V1",machineId:"M1"},ocr:{connected:true,provider:"google-gemini-api",requestId:"sales-ui",warnings:[],rawTextStored:false,imageStored:false},candidatePayload:{previousClearAt:"2026-09-14T09:00:00+09:00",elapsedHours:24,totalQty:2,totalAmount:360,products:[{productCode:"P1",printedName:"FINAL Product",temperature:"COLD",column:1,price:180,salesQty:2}],soldOuts:[],specialCircumstance:null},candidateValidation:{structureReady:true,readyToConfirm:true,reason:null,validation:{quantityMatch:true,amountMatch:true,warnings:[]}},persistence:{reportCreated:false,analyticsWrite:false,legacyWrite:false,allowed:false,reason:"review_only"},policy:{requiresUserReview:true,requiresExplicitSave:true,imageStored:false,rawOcrTextStored:false,autoSave:false}};
    const salesHost=document.getElementById("salesHost");
    a(window.VENDRIVE2SalesReview.mount(salesHost,salesReview).mounted===true,"Sales review mount failed");
    a(salesHost.querySelector(".vdrSalesSave").disabled===true&&salesHost.querySelector(".vdrSalesApproval input")!==null,"Sales approval gate missing");

    const irHost=document.getElementById("irHost");
    a(window.VENDRIVE2InputRecoveryReview.mount(irHost,review).mounted===true,"Input/recovery review mount failed");
    a(irHost.querySelector('[data-role="ir-save"]').disabled===true&&irHost.querySelector('[data-role="ir-validation"]').classList.contains("ok"),"Input/recovery approval gate regression");

    const snap=await api.backup.export();
    const valid4=await api.backup.validate(snap);
    a(valid4.valid===true&&valid4.sourceSchemaVersion===4&&valid4.schemaVersion===4,"Schema4 backup validate failed");
    const v3=JSON.parse(JSON.stringify(snap));v3.schemaVersion=3;delete v3.stores.expiryChecks;
    const valid3=await api.backup.validate(v3);
    a(valid3.sourceSchemaVersion===3&&valid3.schemaVersion===4,"Schema3 backup migration validate failed");
    const v2=JSON.parse(JSON.stringify(snap));v2.schemaVersion=2;delete v2.stores.inventoryEvents;delete v2.stores.expiryChecks;
    const valid2=await api.backup.validate(v2);
    a(valid2.sourceSchemaVersion===2&&valid2.schemaVersion===4,"Schema2 backup migration validate failed");
    let blocked=false;try{await api.backup.restore(snap,{})}catch(e){blocked=true}
    a(blocked,"Analytics restore confirmation gate failed");
    await api.data.products.put({makerKey:"suntory",productCode:"P1",displayName:"MUTATED",receiptAliases:[],caseQuantity:24,category:"drink",temperatureModes:["COLD"],active:true});
    const restored=await api.backup.restore(snap,{confirmation:"RESTORE_ANALYTICS"});
    a(restored.restored===true&&restored.safetySnapshot&&restored.safetySnapshot.kind==="VENDRIVE2_ANALYTICS_BACKUP","Analytics restore failed");
    a((await api.data.products.get(JSON.stringify(["suntory","P1"]))).displayName==="FINAL Product","Analytics restore did not restore data");

    return {health,stock:stock.quantity,observations:observations.length,windows:windows.length,previous:previous.length,historical:historical.length,demand:demand.length,forecasts:forecasts.length,recommendations:recommendations.length,visits:visits.length,bring:bring.length,backupSchemas:[valid4.sourceSchemaVersion,valid3.sourceSchemaVersion,valid2.sourceSchemaVersion]};
  })()`);
  console.log("FINAL_ANALYTICS",JSON.stringify(analyticsResult));

  await evalIn(client,`(async()=>{try{window.VENDRIVE2Analytics.close()}catch(e){};await new Promise(resolve=>{const r=indexedDB.deleteDatabase("VENDRIVE2_ANALYTICS_DB");r.onsuccess=r.onerror=r.onblocked=()=>resolve(true)});localStorage.clear();return true})()`);
  await evalIn(client,`new Promise((resolve,reject)=>{const r=indexedDB.open("VENDRIVE2_DB",1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{r.result.close();resolve(true)}})`);

  for(const width of [320,390]){
    await client.send("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:false});
    const legacyOrigin=width===320?"http://127.0.0.1:8000":"http://localhost:8000";
    await navigate(client,legacyOrigin+"/index.html?final="+width);

    const legacyResult=await evalIn(client,`(async()=>{
      function a(c,m){if(!c)throw new Error(m)}
      const beforeKey="vendrive2_v7_data";
      a(window.VENDRIVE2ReadBridge&&window.VENDRIVE2ReadBridge.version===1,"Legacy read bridge unavailable");
      a(document.getElementById("exportBackup")&&document.getElementById("restoreBackupFile")&&document.getElementById("confirmRestoreBackup"),"Legacy backup UI unavailable");

      const originalCreateObjectURL=URL.createObjectURL.bind(URL);
      URL.createObjectURL=function(blob){window.__finalExportBlob=blob;return originalCreateObjectURL(blob)};
      document.getElementById("exportBackup").click();
      await new Promise(r=>setTimeout(r,150));
      a(window.__finalExportBlob instanceof Blob,"Legacy export blob missing");
      const exported=JSON.parse(await window.__finalExportBlob.text());
      a(exported.kind==="VENDRIVE2_BACKUP"&&exported.formatVersion===1&&exported.appVersion==="2026.09.15-FINAL"&&Array.isArray(exported.data.machines),"Legacy export content regression");
      URL.createObjectURL=originalCreateObjectURL;

      const candidate={
        machines:[
          {id:"M1",name:"FINAL Machine 1",maker:"サントリー",code:"V1",address:"愛知県一宮市",days:["日","月","火","水","木","金","土"],cycle:"毎日",last:"2026-09-14",time:"指定なし",timeCondition:{type:"none",start:"",end:""},sales:"",memo:"",lat:35.304,lng:136.803},
          {id:"M2",name:"FINAL Machine 2",maker:"サントリー",code:"V2",address:"愛知県一宮市",days:["日","月","火","水","木","金","土"],cycle:"毎日",last:"2026-09-14",time:"指定なし",timeCondition:{type:"none",start:"",end:""},sales:"",memo:"",lat:35.305,lng:136.804}
        ],
        offices:[],history:[],tomorrowPlan:null,tasks:[],taskHistory:[],temporaryVisitPeriods:[],restDays:[],makers:["サントリー"],makerColors:{},makerSettings:[]
      };
      const backup={kind:"VENDRIVE2_BACKUP",formatVersion:1,appVersion:"2026.09.15-FINAL",createdAt:"2026-09-15T00:00:00.000Z",data:candidate,runtime:{lastDay:"2026-09-15"}};
      async function chooseBackup(value,name){
        const input=document.getElementById("restoreBackupFile"),dt=new DataTransfer(),file=new File([JSON.stringify(value)],name,{type:"application/json"});
        dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}));
        await new Promise(r=>setTimeout(r,250));
      }

      await chooseBackup({...backup,formatVersion:2},"future.json");
      a(document.getElementById("toast").textContent.includes("新しいバージョン"),"Future legacy backup was not blocked");

      await chooseBackup(backup,"final-backup.json");
      a(document.getElementById("restoreBackupModal").classList.contains("open"),"Legacy restore preview did not open");
      a(document.getElementById("restoreBackupSummary").textContent.includes("自販機：2台"),"Legacy restore preview summary mismatch");
      document.getElementById("confirmRestoreBackup").click();
      for(let i=0;i<60;i++){
        const storedNow=JSON.parse(localStorage.getItem(beforeKey)||"null");
        if(storedNow&&storedNow.machines&&storedNow.machines.length===2&&storedNow.machines[0].id==="M1")break;
        await new Promise(r=>setTimeout(r,100));
      }
      const stored=JSON.parse(localStorage.getItem(beforeKey)||"null");
      a(stored&&stored.machines&&stored.machines.length===2&&stored.machines[0].id==="M1","Legacy restore persistence failed; toast="+document.getElementById("toast").textContent+"; modal="+document.getElementById("restoreBackupModal").className+"; raw="+String(localStorage.getItem(beforeKey)).slice(0,240));
      a(localStorage.getItem(beforeKey+"_version")==="1","Legacy storage version missing");
      a(!document.getElementById("restoreBackupModal").classList.contains("open"),"Legacy restore modal remained open");
      const bridge=window.VENDRIVE2ReadBridge;
      const machines=bridge.getMachinesSnapshot(),planning=bridge.getPlanningSnapshot();
      a(machines.length===2&&machines[0].managementCode==="V1"&&planning.version===1&&Array.isArray(planning.todayIds)&&planning.todayIds.length===2,"Legacy read bridge regression");

      const checkpoint=await new Promise((resolve,reject)=>{
        const req=indexedDB.open("VENDRIVE2_DB");
        req.onerror=()=>reject(req.error);
        req.onsuccess=()=>{
          const db=req.result,tx=db.transaction("snapshots","readonly"),store=tx.objectStore("snapshots"),cur=store.openCursor(),rows=[];
          cur.onerror=()=>{db.close();reject(cur.error)};
          cur.onsuccess=()=>{const c=cur.result;if(c){if(String(c.key).startsWith("pre-restore-"))rows.push(c.value);c.continue()}else{db.close();resolve(rows)}}
        };
      });
      a(checkpoint.length>=1&&checkpoint[checkpoint.length-1].kind==="pre-restore","Pre-restore checkpoint missing");

      const pages=["todayPage","tasksPage","machinesPage","ordersPage","analysisPage"];
      for(const id of pages){
        const button=document.querySelector('.tabs button[data-page="'+id+'"]');a(button,"Missing tab "+id);button.click();await new Promise(r=>setTimeout(r,id==="analysisPage"?500:80));
        a(!document.getElementById(id).classList.contains("hidden"),"Tab did not open "+id);
        a(document.documentElement.scrollWidth<=window.innerWidth,"Horizontal overflow on "+id+" at "+window.innerWidth);
      }
      document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));document.getElementById("mapPage").classList.remove("hidden");
      a(document.getElementById("map").getBoundingClientRect().right<=window.innerWidth+1,"Map container overflow");
      a(document.documentElement.scrollWidth<=window.innerWidth,"Horizontal overflow on mapPage");
      document.getElementById("mapPage").classList.add("hidden");document.getElementById("todayPage").classList.remove("hidden");

      a(document.querySelector('script[src="sales-review.js"]')&&document.querySelector('script[src="input-recovery-review.js"]'),"Review modules not wired");
      a(typeof window.VENDRIVE2Analytics==="object"&&typeof window.VENDRIVE2OCRAdapter==="object","Analytics/OCR adapter not wired");
      return {width:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,machines:machines.length,checkpoints:checkpoint.length,exportVersion:exported.appVersion,analytics:window.VENDRIVE2Analytics.getHealth()};
    })()`);
    assert(legacyResult.width===width,"Viewport width mismatch");
    console.log("FINAL_LEGACY",JSON.stringify(legacyResult));
    await evalIn(client,`(async()=>{try{window.VENDRIVE2Analytics.close()}catch(e){};await new Promise(resolve=>{const r=indexedDB.deleteDatabase("VENDRIVE2_ANALYTICS_DB");r.onsuccess=r.onerror=r.onblocked=()=>resolve(true)});await new Promise(resolve=>{const r=indexedDB.deleteDatabase("VENDRIVE2_DB");r.onsuccess=r.onerror=r.onblocked=()=>resolve(true)});localStorage.clear();return true})()`);
  }
} finally {
  client.close();
}
