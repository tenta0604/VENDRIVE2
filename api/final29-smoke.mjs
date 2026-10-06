import { POST } from './route.mjs';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') return Response.json({ok:false,message:'preview only'},{status:404});
  const origin='https://final29-smoke.local';
  const cases=[
    {name:'nagoya-ic-komaki-ic',origin:{lat:35.17278,lng:137.01917},destination:{lat:35.301583,lng:136.908389}},
    {name:'nagoya-ic-kasugai-area',origin:{lat:35.17278,lng:137.01917},destination:{lat:35.2470,lng:136.9820}}
  ];
  const vehicle={height:2.38,width:1.88,length:5.57,weight:6.095,avoidTolls:false};
  const results=[];
  for(const item of cases){
    const response=await POST(new Request(origin+'/api/route',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({origin:item.origin,destination:item.destination,vehicle})}));
    const data=await response.json();
    const wc=Array.isArray(data?.route?.waycategory)?data.route.waycategory:[];
    const tw=Array.isArray(data?.route?.tollways)?data.route.tollways:[];
    results.push({
      name:item.name,status:response.status,ok:!!data?.ok,
      distance:data?.route?.summary?.distance,duration:data?.route?.summary?.duration,
      waycategoryValues:[...new Set(wc.map(v=>v[2]))],
      tollwaysValues:[...new Set(tw.map(v=>v[2]))],
      hasWaycategoryPriority:wc.some(v=>(v[2]&3)!==0),
      hasDedicatedTollway:tw.some(v=>v[2]===1),
      tollwaySpanCount:tw.filter(v=>v[2]===1).length,
      message:data?.message
    });
  }
  return Response.json({ok:true,results});
}
