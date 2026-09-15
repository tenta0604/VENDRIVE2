import { __diagnosticResultSchema } from "./ocr.mjs";

const DEFAULT_MODEL="gemini-3.6-flash";
function safeError(data){
  const e=data&&data.error;
  if(!e||typeof e!=="object")return null;
  return {
    code:typeof e.code==="number"?e.code:null,
    status:typeof e.status==="string"?e.status:null,
    message:typeof e.message==="string"?e.message.slice(0,500):null
  };
}
async function jsonBody(response){
  try{return await response.json()}catch{return null}
}
async function run(){
  const apiKey=process.env.GEMINI_API_KEY||"";
  const model=process.env.OCR_GEMINI_MODEL||DEFAULT_MODEL;
  if(!apiKey)return {ok:false,model,error:"missing-api-key"};
  const base=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`;
  const listResponse=await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100",{headers:{"x-goog-api-key":apiKey}});
  const listData=await jsonBody(listResponse);
  const generateModels=Array.isArray(listData&&listData.models)?listData.models.filter(m=>Array.isArray(m.supportedGenerationMethods)&&m.supportedGenerationMethods.includes("generateContent")).map(m=>m.name).slice(0,100):[];
  const modelResponse=await fetch(base,{headers:{"x-goog-api-key":apiKey}});
  const modelData=await jsonBody(modelResponse);

  const simpleResponse=await fetch(base+":generateContent",{
    method:"POST",
    headers:{"x-goog-api-key":apiKey,"Content-Type":"application/json"},
    body:JSON.stringify({
      contents:[{role:"user",parts:[{text:"Return a JSON object with ok true."}]}],
      generationConfig:{
        responseMimeType:"application/json",
        responseJsonSchema:{
          type:"object",
          additionalProperties:false,
          properties:{ok:{type:"boolean"}},
          required:["ok"]
        }
      }
    })
  });
  const simpleData=await jsonBody(simpleResponse);

  const fullResponse=await fetch(base+":generateContent",{
    method:"POST",
    headers:{"x-goog-api-key":apiKey,"Content-Type":"application/json"},
    body:JSON.stringify({
      contents:[{role:"user",parts:[{text:"Return the safest empty VENDRIVE OCR result allowed by the schema. Use null and empty arrays where allowed."}]}],
      generationConfig:{
        responseMimeType:"application/json",
        responseJsonSchema:__diagnosticResultSchema()
      }
    })
  });
  const fullData=await jsonBody(fullResponse);
  return {
    ok:true,
    model,
    availableGenerateModels:generateModels, modelList:{status:listResponse.status,ok:listResponse.ok,error:safeError(listData)}, modelCheck:{status:modelResponse.status,ok:modelResponse.ok,error:safeError(modelData)},
    simpleSchema:{status:simpleResponse.status,ok:simpleResponse.ok,error:safeError(simpleData)},
    fullSchema:{status:fullResponse.status,ok:fullResponse.ok,error:safeError(fullData)}
  };
}
export async function GET(){
  try{
    const result=await run();
    return new Response(JSON.stringify(result),{status:200,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }catch(error){
    return new Response(JSON.stringify({ok:false,error:String(error&&error.message||error).slice(0,500)}),{status:500,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }
}
