import { POST } from './route.mjs';
import routing from '../truck-routing.js';

const ENDPOINT='https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson';

function usage(route){return routing.routeUsage(route);}
function sanitize(feature){return routing.route({geometry:feature?.geometry,summary:feature?.properties?.summary,waycategory:feature?.properties?.extras?.waycategory?.values,tollways:feature?.properties?.extras?.tollways?.values});}

export async function GET(){
  if(process.env.VERCEL_ENV!=='preview')return Response.json({ok:false,message:'preview only'},{status:404});
  const key=process.env.ORS_API_KEY?.trim();if(!key)return Response.json({ok:false,message:'missing key'},{status:503});
  const vehicle={height:2.38,width:1.88,length:5.57,weight:6.095,avoidTolls:false};
  const restrictions={height:vehicle.height,width:vehicle.width,length:vehicle.length,weight:vehicle.weight};
  const cases=[
    {name:'nagoya-ic-komaki-ic',origin:{lat:35.17278,lng:137.01917},destination:{lat:35.301583,lng:136.908389}},
    {name:'nagoya-station-komaki',origin:{lat:35.1709,lng:136.8815},destination:{lat:35.2890,lng:136.9270}},
    {name:'nagoya-station-gifu',origin:{lat:35.1709,lng:136.8815},destination:{lat:35.4090,lng:136.7560}},
    {name:'nagoya-station-ichinomiya',origin:{lat:35.1709,lng:136.8815},destination:{lat:35.3020,lng:136.7977}}
  ];
  const results=[];
  for(const item of cases){
    const body={coordinates:[[item.origin.lng,item.origin.lat],[item.destination.lng,item.destination.lat]],instructions:false,preference:'fastest',alternative_routes:{target_count:3,share_factor:0.95,weight_factor:2.0},extra_info:['waycategory','tollways'],options:{vehicle_type:'hgv',avoid_features:['ferries'],profile_params:{restrictions}}};
    const direct=await fetch(ENDPOINT,{method:'POST',headers:{Authorization:key,'Content-Type':'application/json','Accept':'application/geo+json, application/json'},body:JSON.stringify(body)});
    let data={};try{data=await direct.json();}catch{}
    const candidates=(Array.isArray(data.features)?data.features:[]).map((feature,index)=>{
      try{const route=sanitize(feature),u=usage(route);return {index,distance:route.summary.distance,duration:route.summary.duration,motorwayMeters:Math.round(u.motorwayMeters),priorityMeters:Math.round(u.priorityMeters)};}catch{return {index,invalid:true};}
    });
    let expected=null;
    if(candidates.length&&candidates[0].distance!==undefined){
      const primary=candidates[0],maxDuration=primary.duration+Math.min(900,primary.duration*0.35),maxDistance=primary.distance+Math.min(20000,primary.distance*0.5);
      expected=candidates.filter(c=>!c.invalid&&c.priorityMeters>100&&c.duration<=maxDuration&&c.distance<=maxDistance).sort((a,b)=>b.priorityMeters-a.priorityMeters||b.motorwayMeters-a.motorwayMeters||a.duration-b.duration||a.distance-b.distance)[0]||null;
    }
    const relay=await POST(new Request('https://final32-smoke.local/api/route',{method:'POST',headers:{origin:'https://final32-smoke.local','content-type':'application/json'},body:JSON.stringify({origin:item.origin,destination:item.destination,vehicle})}));
    const relayData=await relay.json();
    results.push({name:item.name,directStatus:direct.status,candidateCount:candidates.length,candidates,expectedIndex:expected?.index??null,relayStatus:relay.status,relaySelection:relayData?.selection,relayUsage:relayData?.usage,relayDistance:relayData?.route?.summary?.distance,relayDuration:relayData?.route?.summary?.duration,message:relayData?.message||data?.error?.message||data?.error});
  }
  return Response.json({ok:true,results});
}
