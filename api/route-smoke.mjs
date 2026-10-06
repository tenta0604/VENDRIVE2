import { POST } from './route.mjs';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') return Response.json({ok:false,message:'preview only'},{status:404});
  const origin='https://preview-smoke.local';
  const payload={
    origin:{lat:35.3000,lng:136.8000},
    destination:{lat:35.3100,lng:136.8100},
    vehicle:{height:2.38,width:1.88,length:5.57,weight:6.095,avoidTolls:true}
  };
  const response=await POST(new Request(origin+'/api/route',{
    method:'POST',
    headers:{origin,'content-type':'application/json'},
    body:JSON.stringify(payload)
  }));
  const data=await response.json();
  if(!response.ok||!data?.ok){
    return Response.json({ok:false,upstreamStatus:response.status,message:data?.message||'route smoke failed'},{status:502});
  }
  return Response.json({
    ok:true,
    profile:data.profile,
    vehicle:payload.vehicle,
    summary:data.route?.summary,
    geometryType:data.route?.geometry?.type,
    coordinateCount:Array.isArray(data.route?.geometry?.coordinates)?data.route.geometry.coordinates.length:0,
    attribution:data.attribution
  });
}
