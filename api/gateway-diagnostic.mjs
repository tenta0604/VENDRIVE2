function pickToken(request){
  const header=request.headers.get("x-vercel-oidc-token")||"";
  if(header)return {token:header,source:"request-oidc"};
  const envOidc=process.env.VERCEL_OIDC_TOKEN||"";
  if(envOidc)return {token:envOidc,source:"env-oidc"};
  const apiKey=process.env.AI_GATEWAY_API_KEY||"";
  if(apiKey)return {token:apiKey,source:"api-key"};
  return {token:"",source:"none"};
}

function safeError(data){
  if(!data||typeof data!=="object")return null;
  const err=data.error;
  if(typeof err==="string")return err.slice(0,240);
  if(err&&typeof err==="object"){
    const out={};
    if(typeof err.type==="string")out.type=err.type.slice(0,120);
    if(typeof err.code==="string")out.code=err.code.slice(0,120);
    if(typeof err.message==="string")out.message=err.message.slice(0,240);
    return out;
  }
  if(typeof data.message==="string")return data.message.slice(0,240);
  return null;
}

export async function GET(request){
  const picked=pickToken(request);
  const result={
    ok:false,
    tokenSource:picked.source,
    requestOidc:Boolean(request.headers.get("x-vercel-oidc-token")),
    envOidc:Boolean(process.env.VERCEL_OIDC_TOKEN),
    apiKeyPresent:Boolean(process.env.AI_GATEWAY_API_KEY),
    model:process.env.OCR_GATEWAY_MODEL||"google/gemini-2.5-flash"
  };
  if(!picked.token){
    result.stage="auth-missing";
    return Response.json(result,{status:503,headers:{"Cache-Control":"no-store"}});
  }
  let upstream;
  try{
    upstream=await fetch("https://ai-gateway.vercel.sh/v1/responses",{
      method:"POST",
      headers:{Authorization:`Bearer ${picked.token}`,"Content-Type":"application/json"},
      body:JSON.stringify({model:result.model,input:"Reply with the single word OK."})
    });
  }catch(error){
    result.stage="network";
    result.error="gateway connection failed";
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
  result.ok=true;
  result.stage="gateway-ok";
  result.responseId=typeof data?.id==="string"?data.id:null;
  return Response.json(result,{status:200,headers:{"Cache-Control":"no-store"}});
}
