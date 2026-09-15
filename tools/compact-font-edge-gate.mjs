let seq=0;
function assert(c,m){if(!c)throw new Error(m)}
async function connect(){const list=await (await fetch("http://127.0.0.1:9222/json/list")).json(),page=list.find(x=>x.type==="page");assert(page,"No Edge page");const ws=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}};return{send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})},close(){ws.close()}}}
async function ev(c,x){const r=await c.send("Runtime.evaluate",{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value}
const c=await connect();
try{
  for(const width of [320,390]){
    await c.send("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:false});
    await c.send("Page.navigate",{url:"http://127.0.0.1:8000/tools/compact-font-gate.html"});
    await new Promise(r=>setTimeout(r,700));
    const out=await ev(c,`(()=>{const n=document.querySelector(".vdrCompactItemName"),code=document.querySelector(".vdrCompactItemCode"),q=document.querySelector(".vdrCompactItemQty"),brand=document.getElementById("brand");return{width:innerWidth,scrollWidth:document.documentElement.scrollWidth,nameFont:getComputedStyle(n).fontSize,codeFont:getComputedStyle(code).fontSize,qtyFont:getComputedStyle(q).fontSize,brandFont:getComputedStyle(brand).fontSize}})()`);
    assert(out.brandFont==="19px","global name fixture not active");
    assert(out.nameFont===(width===320?"10.5px":"11px"),"item name font leaked");
    assert(out.codeFont==="9.5px","code font wrong");
    assert(out.qtyFont==="10.5px","qty font wrong");
    assert(out.scrollWidth<=out.width,"horizontal overflow");
    console.log("COMPACT_FONT_PASS",JSON.stringify(out));
  }
}finally{c.close()}