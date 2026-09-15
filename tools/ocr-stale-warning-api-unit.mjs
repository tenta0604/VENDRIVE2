import assert from "node:assert/strict";
process.env.GEMINI_API_KEY="test-key";
process.env.OCR_GEMINI_MODEL="gemini-3.6-flash";
process.env.OCR_PROVIDER_HEDGE_DELAY_MS="500";
process.env.OCR_PROVIDER_ATTEMPT_TIMEOUT_MS="1500";
process.env.OCR_PROVIDER_BUDGET_MS="2500";
const mod=await import("../api/ocr.mjs?warning="+Date.now());
function request(){
  const form=new FormData();
  form.append("file",new Blob([Uint8Array.from([137,80,78,71,13,10,26,10])],{type:"image/png"}),"test.png");
  form.append("supportedReportTypes",JSON.stringify(["sales","input","recovery","input_recovery"]));
  return new Request("https://relay.example/api/ocr",{method:"POST",headers:{Origin:"https://tenta0604.github.io"},body:form});
}
function provider(payload){return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(payload)}]}}]}),{status:200,headers:{"Content-Type":"application/json"}})}
function base(recovery,warnings){
  return {provider:"google-gemini-api",requestId:"unit",detectedType:"input_recovery",typeConfidence:1,occurredAt:"2026-09-15T08:38:00+09:00",makerKey:"suntory",vendorNumber:"4038404",machineId:null,candidatePayload:{input:{paper:{carNumber:"404",operatorName:"operator",locationName:"location"},totalQty:1,items:[{productCode:"705904",printedName:"sample",temperature:"COLD",column:null,quantity:1}]},recovery},warnings};
}
globalThis.fetch=async()=>provider(base({paper:{carNumber:"404",operatorName:"operator",locationName:"location"},totalQty:11,items:[{productCode:"744654",printedName:"yogurt",temperature:"COLD",column:null,caseCount:0,looseCount:10,quantity:10},{productCode:"744533",printedName:"ginger",temperature:"COLD",column:null,caseCount:0,looseCount:1,quantity:1}]} ,["recovery_case_conversion_required"]));
let response=await mod.POST(request()),body=await response.json();
assert.equal(response.status,200);
assert.ok(!body.warnings.includes("recovery_case_conversion_required"));
assert.ok(!body.warnings.some(x=>x.startsWith("case_conversion_required:")));
console.log("CASE_WARNING_ZERO_CASE_REMOVED_PASS",JSON.stringify(body.warnings));

globalThis.fetch=async()=>provider(base({paper:{carNumber:"404",operatorName:"operator",locationName:"location"},totalQty:0,items:[{productCode:"744654",printedName:"yogurt",temperature:"COLD",column:null,caseCount:1,looseCount:2,quantity:0}]} ,["recovery_case_conversion_required"]));
response=await mod.POST(request());body=await response.json();
assert.equal(response.status,200);
assert.ok(!body.warnings.includes("recovery_case_conversion_required"));
assert.ok(body.warnings.includes("case_conversion_required:recovery.items.0.quantity"));
console.log("CASE_WARNING_PINPOINT_NORMALIZED_PASS",JSON.stringify(body.warnings));
