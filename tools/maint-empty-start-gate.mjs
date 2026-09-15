let seq=0;
function assert(c,m){if(!c)throw new Error(m)}
async function connect(){
  const list=await (await fetch("http://127.0.0.1:9222/json/list")).json();
  const page=list.find(x=>x.type==="page");assert(page,"No Edge page target");
  const ws=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}};
  return {
    send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})},
    close(){ws.close()}
  };
}
async function evalIn(c,expression){
  const r=await c.send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result&&r.result.value;
}
async function nav(c,url,wait=1700){await c.send("Page.navigate",{url});await new Promise(r=>setTimeout(r,wait))}
const existingState={
  machines:[{id:"EX1",name:"既存自販機",maker:"サントリー",code:"EX-001",address:"愛知県一宮市",days:["火"],cycle:"毎日",last:"2026-09-14",time:"指定なし",sales:"既存販売情報",memo:"既存メモ",lat:35.304,lng:136.803}],
  offices:[],history:[],tomorrowPlan:null,tasks:[],taskHistory:[],temporaryVisitPeriods:[],restDays:[],makers:["サントリー"],makerColors:{},makerSettings:[]
};
const dbState={
  machines:[{id:"DB1",name:"DB保存自販機",maker:"サントリー",code:"DB-001",address:"愛知県一宮市",days:["火"],cycle:"毎日",last:"2026-09-14",time:"指定なし",sales:"DB販売情報",memo:"DBメモ",lat:35.305,lng:136.804}],
  offices:[],history:[],tomorrowPlan:null,tasks:[],taskHistory:[],temporaryVisitPeriods:[],restDays:[],makers:["サントリー"],makerColors:{},makerSettings:[]
};

const c=await connect();
try{
  await c.send("Emulation.setDeviceMetricsOverride",{width:320,height:900,deviceScaleFactor:1,mobile:false});
  await nav(c,"http://127.0.0.1:8000/index.html?empty-start=fresh",2200);
  const fresh=await evalIn(c,`(async()=>{
    for(let i=0;i<50;i++){if(window.VENDRIVE2ReadBridge&&localStorage.getItem("vendrive2_v7_data"))break;await new Promise(r=>setTimeout(r,100))}
    const machines=window.VENDRIVE2ReadBridge.getMachinesSnapshot();
    const raw=JSON.parse(localStorage.getItem("vendrive2_v7_data")||"null");
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,machines,storedCount:raw&&Array.isArray(raw.machines)?raw.machines.length:null,machineSummary:document.getElementById("machineCountSummary")?.textContent||null,body:document.body.innerText,version:document.getElementById("appVersion")?.textContent||null};
  })()`);
  assert(fresh.width===320,"fresh width mismatch");
  assert(fresh.machines.length===0&&fresh.storedCount===0,"fresh install did not remain empty");
  assert(!fresh.body.includes("自販機 A")&&!fresh.body.includes("駐車スペースに注意"),"sample fixture visible on fresh install");
  assert(fresh.version.includes("2026.09.15-FINAL.2"),"fresh version mismatch");
  assert(fresh.scrollWidth<=fresh.width,"fresh 320px horizontal overflow");
  console.log("EMPTY_START_FRESH",JSON.stringify({width:fresh.width,count:fresh.machines.length,storedCount:fresh.storedCount,summary:fresh.machineSummary,version:fresh.version}));

  await c.send("Emulation.setDeviceMetricsOverride",{width:390,height:900,deviceScaleFactor:1,mobile:false});
  await nav(c,"http://localhost:8000/tools/maint-empty-start-seed.html");
  await evalIn(c,`(()=>{localStorage.clear();localStorage.setItem("vendrive2_v7_data",JSON.stringify(${JSON.stringify(existingState)}));localStorage.setItem("vendrive2_v7_data_version","1");localStorage.setItem("vendrive2_last_day","2026-09-15");return true})()`);
  await nav(c,"http://localhost:8000/index.html?empty-start=existing",2200);
  const existing=await evalIn(c,`(async()=>{
    for(let i=0;i<50;i++){if(window.VENDRIVE2ReadBridge)break;await new Promise(r=>setTimeout(r,100))}
    const machines=window.VENDRIVE2ReadBridge.getMachinesSnapshot(),raw=JSON.parse(localStorage.getItem("vendrive2_v7_data")||"null");
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,machines,stored:raw&&raw.machines,body:document.body.innerText};
  })()`);
  assert(existing.width===390,"existing width mismatch");
  assert(existing.machines.length===1&&existing.machines[0].id==="EX1"&&existing.machines[0].name==="既存自販機","existing localStorage data was not preserved");
  assert(existing.stored.length===1&&existing.stored[0].id==="EX1","existing persisted state was replaced");
  assert(!existing.body.includes("自販機 A"),"sample data injected into existing localStorage");
  assert(existing.scrollWidth<=existing.width,"existing 390px horizontal overflow");
  console.log("EMPTY_START_LOCALSTORAGE",JSON.stringify({width:existing.width,count:existing.machines.length,id:existing.machines[0].id}));

  await nav(c,"http://127.0.0.2:8000/tools/maint-empty-start-seed.html");
  await evalIn(c,`new Promise((resolve,reject)=>{
    localStorage.clear();
    const rq=indexedDB.open("VENDRIVE2_DB",2);
    rq.onupgradeneeded=()=>{if(!rq.result.objectStoreNames.contains("snapshots"))rq.result.createObjectStore("snapshots")};
    rq.onerror=()=>reject(rq.error);
    rq.onsuccess=()=>{
      const db=rq.result,tx=db.transaction("snapshots","readwrite");
      tx.objectStore("snapshots").put({version:1,savedAt:Date.now(),raw:JSON.stringify(${JSON.stringify(dbState)})},"current");
      tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>reject(tx.error);
    };
  })`);
  await nav(c,"http://127.0.0.2:8000/index.html?empty-start=db-recovery",2300);
  const dbRecovery=await evalIn(c,`(async()=>{
    for(let i=0;i<50;i++){if(window.VENDRIVE2ReadBridge&&window.VENDRIVE2ReadBridge.getMachinesSnapshot().length)break;await new Promise(r=>setTimeout(r,100))}
    const machines=window.VENDRIVE2ReadBridge.getMachinesSnapshot(),raw=JSON.parse(localStorage.getItem("vendrive2_v7_data")||"null");
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,machines,stored:raw&&raw.machines,body:document.body.innerText};
  })()`);
  assert(dbRecovery.machines.length===1&&dbRecovery.machines[0].id==="DB1"&&dbRecovery.machines[0].name==="DB保存自販機","IndexedDB recovery data was not preserved");
  assert(dbRecovery.stored.length===1&&dbRecovery.stored[0].id==="DB1","IndexedDB recovered state was not persisted");
  assert(!dbRecovery.body.includes("自販機 A"),"sample data injected into IndexedDB recovery");
  assert(dbRecovery.scrollWidth<=dbRecovery.width,"DB recovery horizontal overflow");
  console.log("EMPTY_START_INDEXEDDB",JSON.stringify({width:dbRecovery.width,count:dbRecovery.machines.length,id:dbRecovery.machines[0].id}));
} finally {c.close()}
