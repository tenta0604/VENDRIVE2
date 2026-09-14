import { GET as runSelfTest } from "../api/ocr-self-test.mjs";

if(!process.env.GEMINI_API_KEY){
  throw new Error("AN14B3 build self-test: GEMINI_API_KEY missing");
}

const response=await runSelfTest();
const data=await response.json();
const summary={
  status:response.status,
  provider:data?.provider||null,
  detectedType:data?.detectedType||null,
  totalQty:data?.candidatePayload?.totalQty??null,
  totalAmount:data?.candidatePayload?.totalAmount??null,
  products:Array.isArray(data?.candidatePayload?.products)?data.candidatePayload.products.length:null,
  warnings:Array.isArray(data?.warnings)?data.warnings.length:null
};
console.log("AN14B3 OCR build self-test",JSON.stringify(summary));

if(response.status!==200)throw new Error("AN14B3 build self-test: OCR returned non-200");
if(data.provider!=="google-gemini-api")throw new Error("AN14B3 build self-test: provider mismatch");
if(data.detectedType!=="sales")throw new Error("AN14B3 build self-test: detectedType mismatch");
if(!data.candidatePayload||typeof data.candidatePayload!=="object")throw new Error("AN14B3 build self-test: candidatePayload missing");
if(data.candidatePayload.totalQty!==3)throw new Error("AN14B3 build self-test: totalQty mismatch");
if(data.candidatePayload.totalAmount!==430)throw new Error("AN14B3 build self-test: totalAmount mismatch");
if(!Array.isArray(data.candidatePayload.products)||data.candidatePayload.products.length<2)throw new Error("AN14B3 build self-test: products missing");
if(!Array.isArray(data.warnings))throw new Error("AN14B3 build self-test: warnings missing");
for(const key of ["rawText","rawOcrText","imageData","base64"]){
  if(Object.prototype.hasOwnProperty.call(data,key))throw new Error("AN14B3 build self-test: unsafe field returned");
}
console.log("AN14B3 OCR REAL IMAGE STRUCTURED RESPONSE PASS");
