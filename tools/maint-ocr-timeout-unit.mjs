import assert from "node:assert/strict";
process.env.GEMINI_API_KEY="test-key";
process.env.OCR_GEMINI_MODEL="gemini-3.6-flash";
process.env.OCR_PROVIDER_HEDGE_DELAY_MS="40";
process.env.OCR_PROVIDER_ATTEMPT_TIMEOUT_MS="1000";
process.env.OCR_PROVIDER_BUDGET_MS="2500";
const mod=await import("../api/ocr.mjs?hedge="+Date.now());
const okPayload={provider:"google-gemini-api",requestId:"unit",detectedType:null,typeConfidence:null,occurredAt:null,makerKey:null,vendorNumber:null,machineId:null,candidatePayload:null,warnings:[]};
function request(){
  const form=new FormData();
  form.append("file",new Blob([Uint8Array.from([137,80,78,71,13,10,26,10])],{type:"image/png"}),"test.png");
  form.append("supportedReportTypes",JSON.stringify(["sales","input","recovery","input_recovery"]));
  return new Request("https://relay.example/api/ocr",{method:"POST",headers:{Origin:"https://tenta0604.github.io"},body:form});
}
function successResponse(){return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(okPayload)}]}}]}),{status:200,headers:{"Content-Type":"application/json"}})}
const calls=[];
globalThis.fetch=(url,options)=>new Promise((resolve,reject)=>{
  calls.push(String(url));
  if(String(url).includes("gemini-3.5-flash:")){
    setTimeout(()=>resolve(successResponse()),15);
    return;
  }
  const signal=options&&options.signal;
  const timer=setTimeout(()=>resolve(successResponse()),1500);
  if(signal)signal.addEventListener("abort",()=>{clearTimeout(timer);const e=new Error("aborted");e.name="AbortError";reject(e)},{once:true});
});
const started=Date.now();
let response=await mod.POST(request());
let body=await response.json();
const elapsed=Date.now()-started;
assert.equal(response.status,200);
assert.equal(body.provider,"google-gemini-api");
assert.ok(body.warnings.includes("ocr_provider_fallback_used"));
assert.ok(calls.some(x=>x.includes("gemini-3.6-flash")));
assert.ok(calls.some(x=>x.includes("gemini-3.5-flash")));
assert.ok(elapsed<500,"hedged fallback waited too long");
console.log("OCR_HEDGE_SLOW_PRIMARY_PASS",JSON.stringify({elapsed,calls:calls.length}));

calls.length=0;
globalThis.fetch=async url=>{
  calls.push(String(url));
  if(calls.length===1)return new Response(JSON.stringify({error:{code:503,status:"UNAVAILABLE",message:"busy"}}),{status:503,headers:{"Content-Type":"application/json"}});
  return successResponse();
};
const fastStarted=Date.now();
response=await mod.POST(request());
body=await response.json();
const fastElapsed=Date.now()-fastStarted;
assert.equal(response.status,200);
assert.ok(fastElapsed<500,"fast provider failure did not trigger immediate fallback");
console.log("OCR_HEDGE_FAST_FAILURE_PASS",JSON.stringify({elapsed:fastElapsed,calls:calls.length}));

globalThis.fetch=(url,options)=>new Promise((resolve,reject)=>{
  const signal=options&&options.signal;
  const timer=setTimeout(()=>resolve(successResponse()),1000);
  if(signal)signal.addEventListener("abort",()=>{clearTimeout(timer);const e=new Error("aborted");e.name="AbortError";reject(e)},{once:true});
});
response=await mod.POST(request());
body=await response.json();
assert.equal(response.status,504);
assert.equal(body.code,"provider_timeout");
assert.equal(body.retryable,true);
console.log("OCR_HEDGE_TIMEOUT_CLASSIFICATION_PASS");
