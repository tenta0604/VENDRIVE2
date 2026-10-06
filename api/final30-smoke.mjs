import { POST } from './route.mjs';
import routing from '../truck-routing.js';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') return Response.json({ok:false,message:'preview only'},{status:404});
  const origin='https://final30-smoke.local';
  const routeInput={origin:{lat:35.17278,lng:137.01917},destination:{lat:35.301583,lng:136.908389}};
  const baseVehicle={height:2.38,width:1.88,length:5.57,weight:6.095};
  const results=[];
  for(const enabled of [true,false]){
    const vehicle={...baseVehicle,avoidTolls:!enabled};
    const response=await POST(new Request(origin+'/api/route',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({...routeInput,vehicle})}));
    const data=await response.json();
    let sections=[];
    if(data?.ok&&data?.route){try{sections=routing.routeSections(data.route);}catch{}}
    results.push({
      highwayEnabled:enabled,status:response.status,ok:!!data?.ok,
      distance:data?.route?.summary?.distance,duration:data?.route?.summary?.duration,
      hasMotorway:sections.some(s=>s.motorway),hasTollway:sections.some(s=>s.tollway),
      redSectionCount:sections.filter(s=>s.highlight).length,
      message:data?.message
    });
  }
  return Response.json({ok:true,results});
}
