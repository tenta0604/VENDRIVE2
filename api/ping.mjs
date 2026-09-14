function payload(request){
  return Response.json({
    ok:true,
    method:request.method,
    oidcHeader:Boolean(request.headers.get("x-vercel-oidc-token")),
    oidcEnv:Boolean(process.env.VERCEL_OIDC_TOKEN)
  },{headers:{"Cache-Control":"no-store"}});
}

export async function GET(request){return payload(request)}
export async function POST(request){return payload(request)}
