import { POST } from './route.mjs';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') return Response.json({ok:false,message:'preview only'},{status:404});
  const origin='https://final26-motorway-smoke.local';
  const cases=[
    {name:'nagoya-ic-komaki-ic',origin:{lat:35.17278,lng:137.01917},destination:{lat:35.301583,lng:136.908389}}
  ];
  const vehicle={height:2.38,width:1.88,length:5.57,weight:6.095,avoidTolls:false};
  const results=[];
  for(const item of cases){
    const response=await POST(new Request(origin+'/api/route',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({origin:item.origin,destination:item.destination,vehicle})}));
    const data=await response.json();
    const values=Array.isArray(data?.route?.waycategory)?data.route.waycategory:[];
    results.push({name:item.name,status:response.status,ok:!!data?.ok,distance:data?.route?.summary?.distance,duration:data?.route?.summary?.duration,waycategory:values,hasMotorway:values.some(v=>(v[2]&1)===1),message:data?.message});
  }
  return Response.json({ok:true,results});
}
