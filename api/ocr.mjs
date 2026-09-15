const ALLOWED_ORIGINS=new Set(["https://tenta0604.github.io","http://localhost:8000","http://127.0.0.1:8000"]);
const REPORT_TYPES=["sales","input","recovery","input_recovery"];
const MAX_IMAGE_BYTES=4*1024*1024;
const DEFAULT_MODEL="gemini-3.6-flash";

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
  const model=process.env.OCR_GEMINI_MODEL||DEFAULT_MODEL;
  let upstream;
  try{
    upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
      method:"POST",
      headers:{"x-goog-api-key":apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        contents:[{role:"user",parts:[{text:prompt},{inlineData:{mimeType:file.type,data:base64}}]}],
        generationConfig:{responseMimeType:"application/json",responseJsonSchema:schema}
      })
    });
  }catch(error){return json(502,{error:"OCR provider connection failed"},origin)}
  let data;
  try{data=await upstream.json()}catch(error){return json(502,{error:"OCR provider returned invalid data"},origin)}
  if(!upstream.ok)return json(upstream.status===429?429:502,{error:"OCR provider request failed"},origin);
  let parsed;
  try{parsed=JSON.parse(extractGeminiText(data))}catch(error){return json(502,{error:"OCR structured result could not be parsed"},origin)}
  parsed.provider="google-gemini-api";
  if(typeof parsed.requestId!=="string"||!parsed.requestId.trim())parsed.requestId=crypto.randomUUID();
  return json(200,parsed,origin);
}

export async function POST(request){return handle(request)}
export async function OPTIONS(request){return handle(request)}
