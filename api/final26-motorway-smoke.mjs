import { POST } from './route.mjs';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') return Response.json({ok:false,message:'preview only'},{status:404});
  const origin='https://final26-motorway-smoke.local';
  const cases=[
    {name:'nagoya-komaki',origin:{lat:35.1815,lng:137.0415},destination:{lat:35.2945,lng:136.9245}},
    {name:'ichinomiya-komaki',origin:{lat:35.3020,lng:136.8010},destination:{lat:35.2945,lng:136.9245}},
    {name:'nagoya-kasugai',origin:{lat:35.1815,lng:137.0415},destination:{lat:35.2470,lng:136.9820}}
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
