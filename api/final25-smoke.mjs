import { POST } from './route.mjs';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') return Response.json({ok:false,message:'preview only'},{status:404});
  const origin='https://final25-smoke.local';
  const payload={
    origin:{lat:35.3045,lng:136.7930},
    destination:{lat:35.1709,lng:136.8815},
    vehicle:{height:2.38,width:1.88,length:5.57,weight:6.095,avoidTolls:false}
  };
  const response=await POST(new Request(origin+'/api/route',{
    method:'POST',
    headers:{origin,'content-type':'application/json'},
    body:JSON.stringify(payload)
  }));
  const data=await response.json();
  if(!response.ok||!data?.ok)return Response.json({ok:false,status:response.status,message:data?.message||'route smoke failed'},{status:502});
  const categories=Array.isArray(data.route?.waycategory)?data.route.waycategory:[];
  return Response.json({
    ok:true,
    profile:data.profile,
    summary:data.route?.summary,
    waycategoryCount:categories.length,
    hasMotorway:categories.some(item=>(item[2]&1)===1),
    categoryValues:[...new Set(categories.map(item=>item[2]))],
    coordinateCount:Array.isArray(data.route?.geometry?.coordinates)?data.route.geometry.coordinates.length:0
  });
}
