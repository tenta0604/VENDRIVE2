function safeError(data){
  if(!data||typeof data!=="object")return null;
  const err=data.error;
  if(typeof err==="string")return err.slice(0,240);
  if(err&&typeof err==="object"){
    const out={};
    if(typeof err.status==="string")out.status=err.status.slice(0,120);
    if(typeof err.code==="number")out.code=err.code;
    if(typeof err.message==="string")out.message=err.message.slice(0,240);
    return out;
  }
  if(typeof data.message==="string")return data.message.slice(0,240);
  return null;
}

export async function GET(){
  const apiKey=process.env.GEMINI_API_KEY||"";
  const model=process.env.OCR_GEMINI_MODEL||"gemini-2.5-flash";
  const result={
    ok:false,
    provider:"google-gemini-api",
    apiKeyPresent:Boolean(apiKey),
    model
  };
  if(!apiKey){
    result.stage="auth-missing";
    return Response.json(result,{status:503,headers:{"Cache-Control":"no-store"}});
  }
  let upstream;
  try{
    upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
      method:"POST",
      headers:{"x-goog-api-key":apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{role:"user",parts:[{text:"Reply with the single word OK."}]}],generationConfig:{temperature:0,maxOutputTokens:8}})
    });
  }catch(error){
    result.stage="network";
    result.error="Gemini connection failed";
    return Response.json(result,{status:502,headers:{"Cache-Control":"no-store"}});
  }
  result.upstreamStatus=upstream.status;
  result.upstreamOk=upstream.ok;
  let data=null;
  try{data=await upstream.json()}catch{}
  if(!upstream.ok){
    result.stage="upstream";
    result.error=safeError(data);
    return Response.json(result,{status:200,headers:{"Cache-Control":"no-store"}});
  }
  const text=data?.candidates?.[0]?.content?.parts?.find(part=>typeof part?.text==="string")?.text||null;
  result.ok=true;
  result.stage="gemini-ok";
  result.text=text?String(text).slice(0,32):null;
  return Response.json(result,{status:200,headers:{"Cache-Control":"no-store"}});
}
