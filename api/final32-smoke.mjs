import { POST } from './route.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function runCase(item,vehicle){
  let last=null;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response=await POST(new Request('https://final32-smoke.local/api/route',{
        method:'POST',
        headers:{origin:'https://final32-smoke.local','content-type':'application/json'},
        body:JSON.stringify({origin:item.origin,destination:item.destination,vehicle})
      }));
      const data=await response.json();
      last={
        name:item.name,attempt,status:response.status,ok:!!data?.ok,
        selection:data?.selection,
        usage:data?.usage&&{
          motorwayMeters:Math.round(data.usage.motorwayMeters||0),
          tollwayMeters:Math.round(data.usage.tollwayMeters||0),
          priorityMeters:Math.round(data.usage.priorityMeters||0)
        },
        distance:data?.route?.summary?.distance,
        duration:data?.route?.summary?.duration,
        message:data?.message
      };
      if(response.ok&&data?.ok)return last;
      if(response.status!==502&&response.status!==503)break;
    }catch(error){
      last={name:item.name,attempt,status:500,ok:false,message:String(error&&error.message||error)};
    }
    if(attempt<3)await sleep(500*attempt);
  }
  return last;
}

export async function GET(){
  if(process.env.VERCEL_ENV!=='preview')return Response.json({ok:false,message:'preview only'},{status:404});
  const vehicle={height:2.38,width:1.88,length:5.57,weight:6.095,avoidTolls:false};
  const cases=[
    {name:'nagoya-ic-komaki-ic',origin:{lat:35.17278,lng:137.01917},destination:{lat:35.301583,lng:136.908389}},
    {name:'nagoya-station-gifu',origin:{lat:35.1709,lng:136.8815},destination:{lat:35.4090,lng:136.7560}},
    {name:'nagoya-station-ichinomiya',origin:{lat:35.1709,lng:136.8815},destination:{lat:35.3020,lng:136.7977}}
  ];
  const results=[];
  for(const item of cases)results.push(await runCase(item,vehicle));
  return Response.json({ok:true,results});
}
