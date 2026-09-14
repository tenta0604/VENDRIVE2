const ALLOWED_ORIGIN="https://tenta0604.github.io";

function out(status,body,origin){
  const headers={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","Vary":"Origin"};
  if(origin===ALLOWED_ORIGIN)headers["Access-Control-Allow-Origin"]=origin;
  return new Response(JSON.stringify(body),{status,headers});
}

export async function POST(request){
  const origin=request.headers.get("origin")||"";
  if(origin!==ALLOWED_ORIGIN)return out(403,{ok:false,stage:"origin"},origin);
  const apiKey=process.env.GEMINI_API_KEY||"";
  if(!apiKey)return out(503,{ok:false,stage:"auth"},origin);
  let form;
  try{form=await request.formData()}catch{return out(500,{ok:false,stage:"formData"},origin)}
  const file=form.get("file");
  if(!file||typeof file.arrayBuffer!=="function")return out(400,{ok:false,stage:"file"},origin);
  let bytes;
  try{bytes=new Uint8Array(await file.arrayBuffer())}catch{return out(500,{ok:false,stage:"arrayBuffer"},origin)}
  let base64;
  try{base64=Buffer.from(bytes).toString("base64")}catch{return out(500,{ok:false,stage:"base64"},origin)}
  let upstream;
  try{
    upstream=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",{
      method:"POST",
      headers:{"x-goog-api-key":apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{role:"user",parts:[{text:"Identify whether this image can be read. Reply only with JSON: {\\\"ok\\\":true}."},{inlineData:{mimeType:file.type||"image/png",data:base64}}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens:32}})
    });
  }catch{return out(502,{ok:false,stage:"fetch"},origin)}
  let data=null;
  try{data=await upstream.json()}catch{return out(502,{ok:false,stage:"upstream-json",upstreamStatus:upstream.status},origin)}
  if(!upstream.ok)return out(200,{ok:false,stage:"upstream",upstreamStatus:upstream.status},origin);
  const text=data?.candidates?.[0]?.content?.parts?.find(part=>typeof part?.text==="string")?.text||null;
  return out(200,{ok:true,stage:"complete",byteLength:bytes.length,upstreamStatus:upstream.status,textPresent:Boolean(text)},origin);
}
