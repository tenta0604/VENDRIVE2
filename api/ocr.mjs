const ALLOWED_ORIGINS=new Set(["https://tenta0604.github.io","http://localhost:8000","http://127.0.0.1:8000"]);
const REPORT_TYPES=["sales","input","recovery","input_recovery"];
const MAX_IMAGE_BYTES=4*1024*1024;
const DEFAULT_MODEL="gemini-3.6-flash";
const FALLBACK_MODELS=["gemini-3.5-flash","gemini-3.5-flash-lite","gemini-3.1-flash-lite"];
const PROVIDER_BUDGET_MS=24000;
const PROVIDER_ATTEMPT_TIMEOUT_MS=8000;
const PRIMARY_RETRY_DELAY_MS=350;

function cors(origin){
  const headers={"Vary":"Origin","Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8"};
  if(ALLOWED_ORIGINS.has(origin))headers["Access-Control-Allow-Origin"]=origin;
  headers["Access-Control-Allow-Methods"]="POST, OPTIONS";
  headers["Access-Control-Allow-Headers"]="Content-Type, Accept";
  headers["Access-Control-Max-Age"]="600";
  return headers;
}
function json(status,body,origin){return new Response(JSON.stringify(body),{status,headers:cors(origin)})}
function nullableString(){return {anyOf:[{type:"string"},{type:"null"}]}}
function nullableInt(minimum=0){return {anyOf:[{type:"integer",minimum},{type:"null"}]}}
function temperatureSchema(){return {anyOf:[{type:"string",enum:["HOT","COLD"]},{type:"null"}]}}
function columnSchema(){return {anyOf:[{type:"integer",minimum:1},{type:"null"}]}}
function paperSchema(){return {type:"object",additionalProperties:false,properties:{carNumber:nullableString(),operatorName:nullableString(),locationName:nullableString()},required:["carNumber","operatorName","locationName"]}}
function lineSalesSchema(){return {type:"object",additionalProperties:false,properties:{productCode:{type:"string"},printedName:{type:"string"},temperature:temperatureSchema(),column:columnSchema(),price:{type:"integer",minimum:1},salesQty:{type:"integer",minimum:0}},required:["productCode","printedName","temperature","column","price","salesQty"]}}
function inputLineSchema(){return {type:"object",additionalProperties:false,properties:{productCode:{type:"string"},printedName:{type:"string"},temperature:temperatureSchema(),column:columnSchema(),quantity:{type:"integer",minimum:0}},required:["productCode","printedName","temperature","column","quantity"]}}
function recoveryLineSchema(){return {type:"object",additionalProperties:false,properties:{productCode:{type:"string"},printedName:{type:"string"},temperature:temperatureSchema(),column:columnSchema(),caseCount:{type:"integer",minimum:0},looseCount:{type:"integer",minimum:0},quantity:{type:"integer",minimum:0}},required:["productCode","printedName","temperature","column","caseCount","looseCount","quantity"]}}
function counterRowSchema(){return {type:"object",additionalProperties:false,properties:{price:nullableInt(0),branchNumber:nullableInt(0),previousCount:nullableInt(0),currentCount:nullableInt(0),salesQty:nullableInt(0)},required:["price","branchNumber","previousCount","currentCount","salesQty"]}}
function paymentSchema(){return {type:"object",additionalProperties:false,properties:{cardAmount:nullableInt(0),cashAmount:nullableInt(0),salesAmount:nullableInt(0)},required:["cardAmount","cashAmount","salesAmount"]}}
function inputSchema(){return {type:"object",additionalProperties:false,properties:{paper:paperSchema(),counterRows:{type:"array",items:counterRowSchema()},payment:paymentSchema(),totalQty:{type:"integer",minimum:0},items:{type:"array",items:inputLineSchema()}},required:["paper","counterRows","payment","totalQty","items"]}}
function recoverySchema(){return {type:"object",additionalProperties:false,properties:{paper:paperSchema(),totalQty:{type:"integer",minimum:0},items:{type:"array",items:recoveryLineSchema()}},required:["paper","totalQty","items"]}}
function salesSchema(){return {type:"object",additionalProperties:false,properties:{previousClearAt:{type:"string"},elapsedHours:{type:"number",minimum:0},totalQty:{type:"integer",minimum:0},totalAmount:{type:"integer",minimum:0},products:{type:"array",items:lineSalesSchema()},soldOuts:{type:"array",items:{type:"object",additionalProperties:false,properties:{productCode:{type:"string"},column:columnSchema(),temperature:temperatureSchema(),soldOutElapsedHours:{type:"number",minimum:0}},required:["productCode","column","temperature","soldOutElapsedHours"]}},specialCircumstance:{anyOf:[{type:"object",additionalProperties:false,properties:{code:{type:"string"},note:{type:"string"}},required:["code","note"]},{type:"null"}]}},required:["previousClearAt","elapsedHours","totalQty","totalAmount","products","soldOuts","specialCircumstance"]}}
function resultSchema(){
  const input=inputSchema(),recovery=recoverySchema();
  return {type:"object",additionalProperties:false,properties:{provider:{type:"string",enum:["google-gemini-api"]},requestId:{type:"string"},detectedType:{anyOf:[{type:"string",enum:REPORT_TYPES},{type:"null"}]},typeConfidence:{anyOf:[{type:"number",minimum:0,maximum:1},{type:"null"}]},occurredAt:{anyOf:[{type:"string"},{type:"null"}]},makerKey:{anyOf:[{type:"string"},{type:"null"}]},vendorNumber:{anyOf:[{type:"string"},{type:"null"}]},machineId:{anyOf:[{type:"string"},{type:"null"}]},candidatePayload:{anyOf:[salesSchema(),input,recovery,{type:"object",additionalProperties:false,properties:{input,recovery},required:["input","recovery"]},{type:"null"}]},warnings:{type:"array",maxItems:20,items:{type:"string",maxLength:160}}},required:["provider","requestId","detectedType","typeConfidence","occurredAt","makerKey","vendorNumber","machineId","candidatePayload","warnings"]};
}
function safeSupportedTypes(raw){
  let values;
  try{values=JSON.parse(raw)}catch(error){return REPORT_TYPES.slice()}
  if(!Array.isArray(values))return REPORT_TYPES.slice();
  values=values.filter(value=>REPORT_TYPES.includes(value));
  return values.length?Array.from(new Set(values)):REPORT_TYPES.slice();
}
function extractGeminiText(data){
  const parts=data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts;
  if(Array.isArray(parts))for(const part of parts){if(part&&typeof part.text==="string")return part.text}
  throw new Error("Gemini response did not contain structured text");
}

async function handle(request){
  const origin=request.headers.get("origin")||"";
  if(request.method==="OPTIONS"){
    if(!ALLOWED_ORIGINS.has(origin))return json(403,{error:"Origin is not allowed"},origin);
    return new Response(null,{status:204,headers:cors(origin)});
  }
  if(request.method!=="POST")return json(405,{error:"Method not allowed"},origin);
  if(!ALLOWED_ORIGINS.has(origin))return json(403,{error:"Origin is not allowed"},origin);
  const apiKey=process.env.GEMINI_API_KEY||"";
  if(!apiKey)return json(503,{error:"OCR provider authentication is unavailable"},origin);
  const contentLength=Number(request.headers.get("content-length")||0);
  if(contentLength&&contentLength>4.45*1024*1024)return json(413,{error:"OCR image payload is too large"},origin);
  let form;
  try{form=await request.formData()}catch(error){return json(400,{error:"Invalid OCR upload"},origin)}
  const file=form.get("file");
  if(!file||typeof file!=="object"||typeof file.arrayBuffer!=="function"||typeof file.type!=="string"||typeof file.size!=="number"||!file.type.startsWith("image/")||file.size<1)return json(400,{error:"A valid image file is required"},origin);
  if(file.size>MAX_IMAGE_BYTES)return json(413,{error:"OCR image must be 4MB or less"},origin);
  const supported=safeSupportedTypes(String(form.get("supportedReportTypes")||"[]"));
  const bytes=new Uint8Array(await file.arrayBuffer());
  let binary="";
  for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  const base64=btoa(binary);
  const schema=resultSchema();
  const prompt=[
    "You extract structured data from Japanese vending-machine operational report images for VENDRIVE2.",
    `Allowed report types: ${supported.join(", ")}.`,
    "Return only fields visible or safely inferable from the image. Never invent missing values.",
    "The real input-confirmation layout contains a header, counter rows (price, branch number, previous count, current count, sales quantity), card/cash/sales amounts, product input rows, and an input total.",
    "The real recovery-confirmation layout contains product code/name, temperature, and recovery counts split into caseCount (ケース) and looseCount (バラ). Preserve both printed counts.",
    "For recovery quantity, use the unit-equivalent count used by inventory. When caseCount is 0, quantity must equal looseCount. When caseCount is greater than 0 and the case size is not printed or otherwise certain, set quantity to 0 and add warning recovery_case_conversion_required instead of inventing a conversion.",
    "For recovery totalQty, sum quantity values only when every row has a safe unit-equivalent quantity. Otherwise use 0 and add a warning.",
    "For joined input_recovery paper, return both calibrated sections under candidatePayload.input and candidatePayload.recovery.",
    "paper.carNumber, paper.operatorName, and paper.locationName come from the printed header when legible; otherwise null.",
    "For input counter values that are unreadable use null. Do not fabricate missing counter rows.",
    "For input payment amounts that are unreadable use null.",
    "If identity, timestamps, report type, totals, or lines are uncertain, use null where the schema permits, zero only where the schema requires a numeric placeholder, and add a short warning.",
    "Do not return raw OCR text, full transcription, image bytes, base64, data URLs, secrets, tokens, or credentials.",
    "makerKey should be a short normalized maker identifier only when clearly supported by the page; otherwise null.",
    "machineId is normally null unless the page explicitly contains an application machine ID.",
    "For candidatePayload, choose the shape matching detectedType. If the report cannot be safely structured, return null.",
    "For date-times use ISO 8601 with +09:00 when the printed report provides enough information; otherwise null.",
    "provider must be google-gemini-api and requestId should be a short opaque identifier you generate for this extraction."
  ].join("\n");
  const primaryModel=(process.env.OCR_GEMINI_MODEL||DEFAULT_MODEL).trim()||DEFAULT_MODEL;
  const fallbackModels=FALLBACK_MODELS.filter((model,index,list)=>model!==primaryModel&&list.indexOf(model)===index);\n  const models=[primaryModel,primaryModel,...fallbackModels];
  const startedAt=Date.now(),failures=[];
  const requestBody=JSON.stringify({
    contents:[{role:"user",parts:[{text:prompt},{inlineData:{mimeType:file.type,data:base64}}]}],
    generationConfig:{responseMimeType:"application/json",responseJsonSchema:schema}
  });

  for(let attempt=0;attempt<models.length;attempt++){
    const model=models[attempt],elapsed=Date.now()-startedAt,remaining=PROVIDER_BUDGET_MS-elapsed;
    if(remaining<1200)break;
    if(attempt===1&&model===primaryModel)await new Promise(resolve=>setTimeout(resolve,Math.min(PRIMARY_RETRY_DELAY_MS,Math.max(0,remaining-1000))));
    const controller=new AbortController(),timeoutMs=Math.min(PROVIDER_ATTEMPT_TIMEOUT_MS,Math.max(1000,PROVIDER_BUDGET_MS-(Date.now()-startedAt)-500));
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    let upstream,data;
    try{
      upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
        method:"POST",
        headers:{"x-goog-api-key":apiKey,"Content-Type":"application/json"},
        body:requestBody,
        signal:controller.signal
      });
      try{data=await upstream.json()}catch(error){
        failures.push({kind:"invalid_data",model,status:upstream.status});
        console.info("VENDRIVE2_OCR_PROVIDER",JSON.stringify({model,status:upstream.status,kind:"invalid_data",attempt:attempt+1}));
        continue;
      }
    }catch(error){
      const kind=error&&error.name==="AbortError"?"timeout":"connection";
      failures.push({kind,model,status:null});
      console.info("VENDRIVE2_OCR_PROVIDER",JSON.stringify({model,status:null,kind,attempt:attempt+1}));
      continue;
    }finally{clearTimeout(timer)}

    if(!upstream.ok){
      const providerError=data&&data.error&&typeof data.error==="object"?data.error:{};
      const providerStatus=typeof providerError.status==="string"?providerError.status:null;
      let kind="rejected";
      if(upstream.status===429||upstream.status===500||upstream.status===502||upstream.status===503||upstream.status===504)kind="busy";
      else if(upstream.status===401)kind="auth";
      failures.push({kind,model,status:upstream.status,providerStatus});
      console.info("VENDRIVE2_OCR_PROVIDER",JSON.stringify({model,status:upstream.status,providerStatus,kind,attempt:attempt+1}));
      if(kind==="auth")break;
      continue;
    }

    let parsed;
    try{parsed=JSON.parse(extractGeminiText(data))}catch(error){
      failures.push({kind:"structured_parse",model,status:upstream.status});
      console.info("VENDRIVE2_OCR_PROVIDER",JSON.stringify({model,status:upstream.status,kind:"structured_parse",attempt:attempt+1}));
      continue;
    }
    parsed.provider="google-gemini-api";
    if(typeof parsed.requestId!=="string"||!parsed.requestId.trim())parsed.requestId=crypto.randomUUID();
    if(!Array.isArray(parsed.warnings))parsed.warnings=[];
    if(model!==primaryModel&&parsed.warnings.length<20&&!parsed.warnings.includes("ocr_provider_fallback_used"))parsed.warnings.push("ocr_provider_fallback_used");
    console.info("VENDRIVE2_OCR_PROVIDER",JSON.stringify({model,status:200,kind:"success",attempt:attempt+1}));
    return json(200,parsed,origin);
  }

  if(failures.some(item=>item.kind==="auth"))return json(503,{error:"OCR provider authentication is unavailable",code:"provider_auth_unavailable",retryable:false},origin);
  if(failures.some(item=>item.kind==="busy"))return json(503,{error:"OCR provider is temporarily busy. Please retry.",code:"provider_busy",retryable:true},origin);
  if(failures.some(item=>item.kind==="timeout"))return json(504,{error:"OCR provider timed out",code:"provider_timeout",retryable:true},origin);
  if(failures.some(item=>item.kind==="connection"))return json(502,{error:"OCR provider connection failed",code:"provider_connection_failed",retryable:true},origin);
  if(failures.some(item=>item.kind==="structured_parse"))return json(502,{error:"OCR structured result could not be parsed",code:"structured_parse_failed",retryable:true},origin);
  if(failures.some(item=>item.kind==="invalid_data"))return json(502,{error:"OCR provider returned invalid data",code:"provider_invalid_data",retryable:true},origin);
  return json(502,{error:"OCR provider rejected the request",code:"provider_rejected",retryable:false},origin);
}

export async function POST(request){return handle(request)}
export async function OPTIONS(request){return handle(request)}
