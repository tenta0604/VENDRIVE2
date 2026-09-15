import assert from "node:assert/strict";
process.env.GEMINI_API_KEY="test-key";
process.env.OCR_GEMINI_MODEL="gemini-3.6-flash";
const mod=await import("../api/ocr.mjs?test="+Date.now());
const originalFetch=globalThis.fetch;
const okPayload={provider:"google-gemini-api",requestId:"unit",detectedType:null,typeConfidence:null,occurredAt:null,makerKey:null,vendorNumber:null,machineId:null,candidatePayload:null,warnings:[]};
function makeRequest(){
  const form=new FormData();
  form.append("file",new Blob([Uint8Array.from([137,80,78,71,13,10,26,10])],{type:"image/png"}),"test.png");
  form.append("supportedReportTypes",JSON.stringify(["sales","input","recovery","input_recovery"]));
  return new Request("https://relay.example/api/ocr",{method:"POST",headers:{Origin:"https://tenta0604.github.io"},body:form});
}
const calls=[];
globalThis.fetch=async url=>{
  calls.push(String(url));
  if(calls.length<=2)return new Response(JSON.stringify({error:{code:503,status:"UNAVAILABLE",message:"high demand"}}),{status:503,headers:{"Content-Type":"application/json"}});
  return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(okPayload)}]}}]}),{status:200,headers:{"Content-Type":"application/json"}});
};
let response=await mod.POST(makeRequest());
assert.equal(response.status,200);
let body=await response.json();
assert.equal(body.provider,"google-gemini-api");
assert.ok(body.warnings.includes("ocr_provider_fallback_used"));
assert.ok(calls[0].includes("gemini-3.6-flash"));
assert.ok(calls[1].includes("gemini-3.6-flash"));
assert.ok(calls[2].includes("gemini-3.5-flash"));
console.log("OCR_FALLBACK_SUCCESS",JSON.stringify({calls:calls.length,models:calls.map(x=>x.match(/models\/([^:]+):/)[1])}));

calls.length=0;
globalThis.fetch=async url=>{calls.push(String(url));return new Response(JSON.stringify({error:{code:503,status:"UNAVAILABLE",message:"high demand"}}),{status:503,headers:{"Content-Type":"application/json"}})};
response=await mod.POST(makeRequest());
assert.equal(response.status,503);
body=await response.json();
assert.equal(body.code,"provider_busy");
assert.equal(body.retryable,true);
assert.ok(calls.length>=4);
console.log("OCR_BUSY_CLASSIFICATION",JSON.stringify({status:response.status,code:body.code,calls:calls.length}));

const preflight=await mod.OPTIONS(new Request("https://relay.example/api/ocr",{method:"OPTIONS",headers:{Origin:"https://tenta0604.github.io"}}));
assert.equal(preflight.status,204);
assert.equal(preflight.headers.get("access-control-allow-origin"),"https://tenta0604.github.io");
console.log("OCR_CORS_SUCCESS");

globalThis.fetch=originalFetch;
