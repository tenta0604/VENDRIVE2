import {POST as runOcr} from "./ocr.mjs";

const PNG_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export async function GET(request){
  const token=request.headers.get("x-vercel-oidc-token")||"";
  const form=new FormData();
  const bytes=Uint8Array.from(Buffer.from(PNG_BASE64,"base64"));
  form.append("file",new Blob([bytes],{type:"image/png"}),"gateway-smoke.png");
  form.append("supportedReportTypes",JSON.stringify(["sales","input","recovery","input_recovery"]));
  const headers=new Headers({origin:"https://tenta0604.github.io"});
  if(token)headers.set("x-vercel-oidc-token",token);
  const synthetic=new Request("https://relay.local/api/ocr",{method:"POST",headers,body:form});
  const response=await runOcr(synthetic);
  const text=await response.text();
  return new Response(text,{status:response.status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Diagnostic-OIDC-Header":token?"1":"0","X-Diagnostic-OIDC-Env":process.env.VERCEL_OIDC_TOKEN?"1":"0"}});
}
