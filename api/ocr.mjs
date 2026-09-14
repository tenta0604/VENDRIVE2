const ALLOWED_ORIGINS=new Set(["https://tenta0604.github.io","http://localhost:8000","http://127.0.0.1:8000"]);
const REPORT_TYPES=["sales","input","recovery","input_recovery"];
const MAX_IMAGE_BYTES=4*1024*1024;

function cors(origin){
  const headers={"Vary":"Origin","Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8"};
  if(ALLOWED_ORIGINS.has(origin))headers["Access-Control-Allow-Origin"]=origin;
  headers["Access-Control-Allow-Methods"]="POST, OPTIONS";
  headers["Access-Control-Allow-Headers"]="Content-Type, Accept";
  headers["Access-Control-Max-Age"]="600";
  return headers;
}
function json(status,body,origin){return new Response(JSON.stringify(body),{status,headers:cors(origin)})}
function lineSalesSchema(){return {type:"object",additionalProperties:false,properties:{productCode:{type:"string"},printedName:{type:"string"},temperature:{anyOf:[{type:"string",enum:["HOT","COLD"]},{type:"null"}]},column:{anyOf:[{type:"integer",minimum:1},{type:"null"}]},price:{type:"integer",minimum:1},salesQty:{type:"integer",minimum:0}},required:["productCode","printedName","temperature","column","price","salesQty"]}}
function lineQuantitySchema(){return {type:"object",additionalProperties:false,properties:{productCode:{type:"string"},printedName:{type:"string"},temperature:{anyOf:[{type:"string",enum:["HOT","COLD"]},{type:"null"}]},column:{anyOf:[{type:"integer",minimum:1},{type:"null"}]},quantity:{type:"integer",minimum:1}},required:["productCode","printedName","temperature","column","quantity"]}}
function inputSchema(minTotal){return {type:"object",additionalProperties:false,properties:{totalQty:{type:"integer",minimum:minTotal},items:{type:"array",items:lineQuantitySchema()}},required:["totalQty","items"]}}
function salesSchema(){return {type:"object",additionalProperties:false,properties:{previousClearAt:{type:"string"},elapsedHours:{type:"number",minimum:0},totalQty:{type:"integer",minimum:0},totalAmount:{type:"integer",minimum:0},products:{type:"array",items:lineSalesSchema()},soldOuts:{type:"array",items:{type:"object",additionalProperties:false,properties:{productCode:{type:"string"},column:{anyOf:[{type:"integer",minimum:1},{type:"null"}]},temperature:{anyOf:[{type:"string",enum:["HOT","COLD"]},{type:"null"}]},soldOutElapsedHours:{type:"number",minimum:0}},required:["productCode","column","temperature","soldOutElapsedHours"]}},specialCircumstance:{anyOf:[{type:"object",additionalProperties:false,properties:{code:{type:"string"},note:{type:"string"}},required:["code","note"]},{type:"null"}]}},required:["previousClearAt","elapsedHours","totalQty","totalAmount","products","soldOuts","specialCircumstance"]}}
function resultSchema(){
  const input=inputSchema(0),recovery=inputSchema(1);
  return {type:"object",additionalProperties:false,properties:{provider:{type:"string",enum:["vercel-ai-gateway"]},requestId:{type:"string"},detectedType:{anyOf:[{type:"string",enum:REPORT_TYPES},{type:"null"}]},typeConfidence:{anyOf:[{type:"number",minimum:0,maximum:1},{type:"null"}]},occurredAt:{anyOf:[{type:"string"},{type:"null"}]},makerKey:{anyOf:[{type:"string"},{type:"null"}]},vendorNumber:{anyOf:[{type:"string"},{type:"null"}]},machineId:{anyOf:[{type:"string"},{type:"null"}]},candidatePayload:{anyOf:[salesSchema(),input,recovery,{type:"object",additionalProperties:false,properties:{input:input,recovery:recovery},required:["input","recovery"]},{type:"null"}]},warnings:{type:"array",maxItems:20,items:{type:"string",maxLength:160}}},required:["provider","requestId","detectedType","typeConfidence","occurredAt","makerKey","vendorNumber","machineId","candidatePayload","warnings"]};
}
function extractOutputText(data){
  if(data&&typeof data.output_text==="string")return data.output_text;
  if(data&&Array.isArray(data.output))for(const item of data.output){if(item&&Array.isArray(item.content))for(const part of item.content){if(part&&typeof part.text==="string")return part.text}}
  throw new Error("Gateway response did not contain structured text");
}
function safeSupportedTypes(raw){
  let values;
  try{values=JSON.parse(raw)}catch(error){return REPORT_TYPES.slice()}
  if(!Array.isArray(values))return REPORT_TYPES.slice();
  values=values.filter(value=>REPORT_TYPES.includes(value));
  return values.length?Array.from(new Set(values)):REPORT_TYPES.slice();
}

export default {
  async fetch(request){
    const origin=request.headers.get("origin")||"";
    if(request.method==="OPTIONS"){
      if(!ALLOWED_ORIGINS.has(origin))return json(403,{error:"Origin is not allowed"},origin);
      return new Response(null,{status:204,headers:cors(origin)});
    }
    if(request.method!=="POST")return json(405,{error:"Method not allowed"},origin);
    if(!ALLOWED_ORIGINS.has(origin))return json(403,{error:"Origin is not allowed"},origin);
    const gatewayToken=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
    if(!gatewayToken)return json(503,{error:"OCR gateway is not configured"},origin);
    const contentLength=Number(request.headers.get("content-length")||0);
    if(contentLength&&contentLength>4.45*1024*1024)return json(413,{error:"OCR image payload is too large"},origin);
    let form;
    try{form=await request.formData()}catch(error){return json(400,{error:"Invalid OCR upload"},origin)}
    const file=form.get("file");
    if(!(file instanceof File)||!file.type.startsWith("image/")||file.size<1)return json(400,{error:"A valid image file is required"},origin);
    if(file.size>MAX_IMAGE_BYTES)return json(413,{error:"OCR image must be 4MB or less"},origin);
    const supported=safeSupportedTypes(String(form.get("supportedReportTypes")||"[]"));
    const bytes=new Uint8Array(await file.arrayBuffer());
    let binary="";
    for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    const imageUrl=`data:${file.type};base64,${btoa(binary)}`;
    const schema=resultSchema();
    const prompt=[
      "You extract structured data from Japanese vending-machine operational report images for VENDRIVE2.",
      `Allowed report types: ${supported.join(", ")}.`,
      "Return only fields visible or safely inferable from the image. Never invent missing values.",
      "If identity, timestamps, report type, totals, or lines are uncertain, use null where the schema permits and add a short warning.",
      "Do not return raw OCR text, full transcription, image bytes, data URLs, secrets, tokens, or credentials.",
      "makerKey should be a short normalized maker identifier only when clearly supported by the page; otherwise null.",
      "machineId is normally null unless the page explicitly contains an application machine ID.",
      "For candidatePayload, choose the shape matching detectedType. If the report cannot be safely structured, return null.",
      "For date-times use ISO 8601 with +09:00 when the printed report provides enough information; otherwise null.",
      "provider must be vercel-ai-gateway and requestId should be a short opaque identifier you generate for this extraction."
    ].join("\n");
    let upstream;
    try{
      upstream=await fetch("https://ai-gateway.vercel.sh/v1/responses",{method:"POST",headers:{"Authorization":`Bearer ${gatewayToken}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OCR_GATEWAY_MODEL||"google/gemini-2.5-flash",input:[{role:"user",content:[{type:"input_text",text:prompt},{type:"input_image",image_url:imageUrl,detail:"high"}]}],text:{format:{type:"json_schema",name:"vendrive_ocr_candidate",strict:true,schema}},providerOptions:{gateway:{disallowPromptTraining:true}}})});
    }catch(error){return json(502,{error:"OCR gateway connection failed"},origin)}
    let data;
    try{data=await upstream.json()}catch(error){return json(502,{error:"OCR gateway returned invalid data"},origin)}
    if(!upstream.ok)return json(upstream.status===429?429:502,{error:"OCR gateway request failed"},origin);
    let parsed;
    try{parsed=JSON.parse(extractOutputText(data))}catch(error){return json(502,{error:"OCR structured result could not be parsed"},origin)}
    parsed.provider="vercel-ai-gateway";
    if(typeof parsed.requestId!=="string"||!parsed.requestId.trim())parsed.requestId=data.id||crypto.randomUUID();
    return json(200,parsed,origin);
  }
};
