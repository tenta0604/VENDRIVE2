const endpoint="https://vendrive2-ocr-relay.vercel.app/api/ocr";
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2rVQAAAAASUVORK5CYII=","base64");
async function attempt(n){
  const form=new FormData();
  form.append("file",new Blob([png],{type:"image/png"}),"ocr-smoke.png");
  form.append("supportedReportTypes",JSON.stringify(["sales","input","recovery","input_recovery"]));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  try{
    const response=await fetch(endpoint,{method:"POST",headers:{Origin:"https://tenta0604.github.io",Accept:"application/json"},body:form,signal:controller.signal});
    const text=await response.text();
    let body=null;try{body=JSON.parse(text)}catch{}
    console.log("OCR_PRODUCTION_SMOKE_ATTEMPT",JSON.stringify({attempt:n,status:response.status,code:body&&body.code||null,provider:body&&body.provider||null}));
    if(response.status===200&&body&&body.provider==="google-gemini-api")return true;
    return false;
  } finally {clearTimeout(timer)}
}
for(let i=1;i<=8;i++){
  try{if(await attempt(i)){console.log("OCR_PRODUCTION_SMOKE_PASS");process.exit(0)}}catch(error){console.log("OCR_PRODUCTION_SMOKE_ERROR",JSON.stringify({attempt:i,name:error&&error.name||null,message:String(error&&error.message||error).slice(0,120)}))}
  await new Promise(r=>setTimeout(r,10000));
}
throw new Error("Production OCR smoke did not reach HTTP 200 after retries");
