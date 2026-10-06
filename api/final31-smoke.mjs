import routing from '../truck-routing.js';

const ENDPOINT='https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson';

export async function GET(){
  if(process.env.VERCEL_ENV!=='preview')return Response.json({ok:false,message:'preview only'},{status:404});
  const key=process.env.ORS_API_KEY?.trim();
  if(!key)return Response.json({ok:false,message:'missing key'},{status:503});
  const vehicle={height:2.38,width:1.88,length:5.57,weight:6.095};
  const restrictions={height:vehicle.height,width:vehicle.width,length:vehicle.length,weight:vehicle.weight};
  const cases=[
    {name:'nagoya-ic-komaki-ic',a:[137.01917,35.17278],b:[136.908389,35.301583]},
    {name:'nagoya-station-komaki',a:[136.8815,35.1709],b:[136.9270,35.2890]},
    {name:'nagoya-station-gifu',a:[136.8815,35.1709],b:[136.7560,35.4090]},
    {name:'nagoya-station-ichinomiya-station',a:[136.8815,35.1709],b:[136.7977,35.3020]}
  ];
  const results=[];
  for(const item of cases){
    const body={
      coordinates:[item.a,item.b],instructions:false,preference:'fastest',
      alternative_routes:{target_count:3,share_factor:0.85,weight_factor:1.8},
      extra_info:['waycategory','tollways'],
      options:{vehicle_type:'hgv',avoid_features:['ferries'],profile_params:{restrictions}}
    };
    const response=await fetch(ENDPOINT,{method:'POST',headers:{Authorization:key,'Content-Type':'application/json','Accept':'application/geo+json, application/json'},body:JSON.stringify(body)});
    let data={};try{data=await response.json();}catch{}
    const candidates=(Array.isArray(data.features)?data.features:[]).map((feature,index)=>{
      try{
        const route=routing.route({geometry:feature?.geometry,summary:feature?.properties?.summary,waycategory:feature?.properties?.extras?.waycategory?.values,tollways:feature?.properties?.extras?.tollways?.values});
        const sections=routing.routeSections(route);
        return {index,distance:route.summary.distance,duration:route.summary.duration,motorway:sections.some(s=>s.motorway),tollway:sections.some(s=>s.tollway)};
      }catch{return {index,invalid:true};}
    });
    results.push({name:item.name,status:response.status,featureCount:candidates.length,candidates,error:data?.error?.message||data?.error});
  }
  return Response.json({ok:true,results});
}
