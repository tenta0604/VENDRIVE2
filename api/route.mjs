import routing from '../truck-routing.js';

const ALLOWED_ORIGINS = new Set(['https://tenta0604.github.io','http://localhost:8000','http://127.0.0.1:8000']);
const ENDPOINT = 'https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson';
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const MAX_BODY_BYTES = 4096;
const MAX_ACTIVE_HIGHWAY_ROUTES = 2;
const JUNCTION_CACHE_TTL_MS = 15*60*1000;
// Per-warm-instance guard complements the provider's hard free quota. It is not a distributed limiter.
const recent = [];
const junctionCache = new Map();
function originAllowed(request,origin) {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try { return !!origin && new URL(request.url).origin===origin; } catch { return false; }
}
function headers(origin,allowed) {
  const result = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
  if (allowed) result['Access-Control-Allow-Origin']=origin;
  result['Access-Control-Allow-Methods']='POST, OPTIONS';
  result['Access-Control-Allow-Headers']='Content-Type, Accept';
  return result;
}
function json(status,body,origin,allowed) { return new Response(JSON.stringify(body),{status,headers:headers(origin,allowed)}); }
function rounded(value,digits=2){return Number(value).toFixed(digits);}
async function timedFetch(url,options,timeoutMs){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(url,{...options,signal:controller.signal});}
  finally{clearTimeout(timer);}
}
function routeRequestBody(coordinates,vehicle,restrictions,withAlternatives){
  const body={coordinates,instructions:false,preference:'recommended',extra_info:['waycategory','tollways'],options:{vehicle_type:'hgv',avoid_features:vehicle.avoidTolls?['ferries','highways','tollways']:['ferries'],profile_params:{restrictions}}};
  if(withAlternatives&&!vehicle.avoidTolls)body.alternative_routes={target_count:3,share_factor:0.85,weight_factor:1.6};
  return body;
}
function reserveUpstreamRouteCall(){
  const now=Date.now();while(recent.length&&recent[0]<=now-60000)recent.shift();
  if(recent.length>=30)return false;
  recent.push(now);return true;
}
async function requestOrsRoute(coordinates,vehicle,restrictions,key,{alternatives=false,timeoutMs=9000}={}){
  if(!reserveUpstreamRouteCall())return new Response(null,{status:429});
  return timedFetch(ENDPOINT,{method:'POST',headers:{'Authorization':key,'Content-Type':'application/json','Accept':'application/geo+json, application/json'},body:JSON.stringify(routeRequestBody(coordinates,vehicle,restrictions,alternatives))},timeoutMs);
}
function junctionCacheKey(origin,destination,radius){return [rounded(origin.lat),rounded(origin.lng),rounded(destination.lat),rounded(destination.lng),radius].join(':');}
async function findMotorwayJunctions(origin,destination,radius){
  const cacheKey=junctionCacheKey(origin,destination,radius),cached=junctionCache.get(cacheKey),now=Date.now();
  if(cached&&now-cached.at<JUNCTION_CACHE_TTL_MS)return cached.items;
  const query='[out:json][timeout:3];(node(around:'+radius+','+origin.lat+','+origin.lng+')["highway"="motorway_junction"];node(around:'+radius+','+destination.lat+','+destination.lng+')["highway"="motorway_junction"];);out body 60;';
  try{
    const response=await timedFetch(OVERPASS_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Accept':'application/json'},body:'data='+encodeURIComponent(query)},3200);
    if(!response.ok)return [];
    const data=await response.json(),seen=new Set(),items=[];
    for(const element of Array.isArray(data?.elements)?data.elements:[]){
      if(element?.type!=='node'||!Number.isFinite(element.lat)||!Number.isFinite(element.lon)||seen.has(element.id))continue;
      seen.add(element.id);items.push({id:element.id,lat:element.lat,lng:element.lon,ref:typeof element.tags?.ref==='string'?element.tags.ref:'',name:typeof element.tags?.name==='string'?element.tags.name:''});
    }
    junctionCache.set(cacheKey,{at:now,items});
    while(junctionCache.size>40)junctionCache.delete(junctionCache.keys().next().value);
    return items;
  }catch{return [];}
}
function activeHighwayPairs(junctions,origin,destination,baselineDistance){
  const direct=routing.distanceMeters(origin,destination);
  if(!Number.isFinite(direct)||direct<5000)return [];
  const entries=junctions.map(j=>({...j,access:routing.distanceMeters(origin,j)})).filter(j=>Number.isFinite(j.access)&&j.access<=Math.min(18000,Math.max(7000,baselineDistance*0.65))).sort((a,b)=>a.access-b.access).slice(0,5);
  const exits=junctions.map(j=>({...j,egress:routing.distanceMeters(j,destination)})).filter(j=>Number.isFinite(j.egress)&&j.egress<=Math.min(18000,Math.max(7000,baselineDistance*0.65))).sort((a,b)=>a.egress-b.egress).slice(0,5);
  const pairs=[];
  for(const entry of entries)for(const exit of exits){
    if(entry.id===exit.id)continue;
    const highwaySpan=routing.distanceMeters(entry,exit),accessTotal=entry.access+exit.egress;
    if(!Number.isFinite(highwaySpan)||highwaySpan<Math.max(2500,direct*0.22))continue;
    if(accessTotal>Math.min(18000,baselineDistance*0.75+2500))continue;
    pairs.push({entry,exit,score:accessTotal+Math.abs(highwaySpan-direct)*0.08});
  }
  pairs.sort((a,b)=>a.score-b.score);
  const result=[],seen=new Set();
  for(const pair of pairs){
    const key=(pair.entry.ref||pair.entry.id)+'>'+(pair.exit.ref||pair.exit.id);
    if(seen.has(key))continue;seen.add(key);result.push(pair);
    if(result.length>=MAX_ACTIVE_HIGHWAY_ROUTES)break;
  }
  return result;
}
async function handle(request) {
  const origin = request.headers.get('origin') || '',allowed=originAllowed(request,origin);
  if (!allowed) return json(403,{ok:false,message:'許可されていない接続元です'},origin,false);
  if (request.method==='OPTIONS') return new Response(null,{status:204,headers:headers(origin,allowed)});
  if (request.method!=='POST') return json(405,{ok:false,message:'POSTで送信してください'},origin,allowed);
  if (Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES) return json(413,{ok:false,message:'リクエストが大きすぎます'},origin,allowed);
  let body;
  try {
    const reader=request.body?.getReader();if(!reader)throw new Error('empty');
    let size=0;const chunks=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY_BYTES){await reader.cancel();return json(413,{ok:false,message:'リクエストが大きすぎます'},origin,allowed);}chunks.push(value);}
    body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return json(400,{ok:false,message:'入力を確認してください'},origin,allowed); }
  if (!routing.point(body?.origin)||!routing.point(body?.destination)) return json(400,{ok:false,message:'現在地・自販機の位置を確認してください'},origin,allowed);
  let vehicle;
  try { vehicle=routing.vehicle(body.vehicle); } catch(error) { return json(400,{ok:false,message:error.message},origin,allowed); }
  const key=process.env.ORS_API_KEY?.trim();
  if (!key) return json(503,{ok:false,message:'経路サービスの準備がまだ完了していません。外部ナビを利用できます'},origin,allowed);
  const restrictions={height:vehicle.height,width:vehicle.width,length:vehicle.length,weight:vehicle.weight};
  if (vehicle.axleload!==undefined)restrictions.axleload=vehicle.axleload;
  const directMeters=routing.distanceMeters(body.origin,body.destination),junctionRadius=Math.round(Math.max(7000,Math.min(18000,directMeters*0.55)));
  try {
    const response=await requestOrsRoute([[body.origin.lng,body.origin.lat],[body.destination.lng,body.destination.lat]],vehicle,restrictions,key,{alternatives:true,timeoutMs:9000});
    if (!response.ok) {
      if(response.status===429)return json(429,{ok:false,message:'無料枠の取得上限です。時間をおいて再計算するか外部ナビを利用してください'},origin,allowed);
      if(response.status===401||response.status===403)return json(503,{ok:false,message:'経路サービスの認証を確認する必要があります'},origin,allowed);
      if(response.status===400||response.status===404)return json(422,{ok:false,message:'車両条件に合う経路が見つかりません。位置と車両設定を確認してください'},origin,allowed);
      return json(502,{ok:false,message:'経路サービスに接続できません。時間をおいて再計算してください'},origin,allowed);
    }
    const data=await response.json(),features=Array.isArray(data?.features)?data.features:[];
    if(!features.length)throw new Error('missing route');
    function sanitizeFeature(feature){return routing.route({geometry:feature?.geometry,summary:feature?.properties?.summary,waycategory:feature?.properties?.extras?.waycategory?.values,tollways:feature?.properties?.extras?.tollways?.values});}
    const primary=sanitizeFeature(features[0]),candidates=[primary];
    for(let i=1;i<features.length;i++){try{candidates.push(sanitizeFeature(features[i]));}catch{}}
    function candidate(route){const usage=routing.routeUsage(route);return {route,usage};}
    const primaryItem=candidate(primary),existingItems=candidates.map(candidate),bestExistingMotorway=Math.max(0,...existingItems.map(item=>item.usage.motorwayMeters));
    const motorwayTarget=Math.min(18000,primary.summary.distance*0.55),highwaySearch={attempted:false,junctions:0,evaluated:0,accepted:0,status:'not-needed'},activeHighwayRoutes=new Set();
    if(!vehicle.avoidTolls&&primary.summary.distance>=6000&&bestExistingMotorway<motorwayTarget){
      highwaySearch.attempted=true;
      const junctions=await findMotorwayJunctions(body.origin,body.destination,junctionRadius);highwaySearch.junctions=junctions.length;
      const pairs=activeHighwayPairs(junctions,body.origin,body.destination,primary.summary.distance);highwaySearch.evaluated=pairs.length;
      const viaResults=await Promise.all(pairs.map(async pair=>{
        try{
          const viaResponse=await requestOrsRoute([[body.origin.lng,body.origin.lat],[pair.entry.lng,pair.entry.lat],[pair.exit.lng,pair.exit.lat],[body.destination.lng,body.destination.lat]],vehicle,restrictions,key,{alternatives:false,timeoutMs:6500});
          if(!viaResponse.ok)return null;
          const viaData=await viaResponse.json(),feature=Array.isArray(viaData?.features)?viaData.features[0]:null;
          if(!feature)return null;
          const viaRoute=sanitizeFeature(feature),viaUsage=routing.routeUsage(viaRoute),meaningfulMotorway=Math.max(1500,primary.summary.distance*0.15);
          if(viaUsage.motorwayMeters<meaningfulMotorway)return null;
          return {route:viaRoute,usage:viaUsage,via:{entry:{id:pair.entry.id,ref:pair.entry.ref,name:pair.entry.name},exit:{id:pair.exit.id,ref:pair.exit.ref,name:pair.exit.name}}};
        }catch{return null;}
      }));
      for(const result of viaResults)if(result){candidates.push(result.route);activeHighwayRoutes.add(result.route);highwaySearch.accepted++;}
      highwaySearch.status=highwaySearch.accepted?'via-ic-candidates-added':junctions.length?'no-valid-via-route':'junction-search-unavailable';
    }
    const maxDuration=primary.summary.duration+Math.min(480,primary.summary.duration*0.20),maxDistance=primary.summary.distance+Math.min(10000,primary.summary.distance*0.30);
    let route=primary,selection='optimal',usage=primaryItem.usage;
    if(!vehicle.avoidTolls){
      const eligible=candidates.map(candidate).filter(item=>item.usage.priorityMeters>100&&item.route.summary.duration<=maxDuration&&item.route.summary.distance<=maxDistance).sort((a,b)=>a.route.summary.duration-b.route.summary.duration||a.route.summary.distance-b.route.summary.distance);
      if(eligible.length){
        const activeEligible=eligible.filter(item=>activeHighwayRoutes.has(item.route)).sort((a,b)=>b.usage.motorwayMeters-a.usage.motorwayMeters||b.usage.priorityMeters-a.usage.priorityMeters||a.route.summary.duration-b.route.summary.duration||a.route.summary.distance-b.route.summary.distance);
        if(activeEligible.length){route=activeEligible[0].route;usage=activeEligible[0].usage;selection='active-ic-expressway-preferred';}
        else{
          const fastest=eligible[0],nearFast=eligible.filter(item=>item.route.summary.duration<=fastest.route.summary.duration+Math.min(120,fastest.route.summary.duration*0.10)&&item.route.summary.distance<=fastest.route.summary.distance+Math.min(3000,fastest.route.summary.distance*0.15)).sort((a,b)=>b.usage.priorityMeters-a.usage.priorityMeters||b.usage.motorwayMeters-a.usage.motorwayMeters||a.route.summary.duration-b.route.summary.duration||a.route.summary.distance-b.route.summary.distance);
          route=nearFast[0].route;usage=nearFast[0].usage;selection='expressway-natural-preferred';
        }
      } else selection=highwaySearch.attempted?'active-highway-unavailable':'highway-unavailable';
    }else selection='highway-avoided';
    return json(200,{ok:true,profile:'driving-hgv',route,selection,usage,highwaySearch,attribution:'© openrouteservice | © OpenStreetMap contributors'},origin,allowed);
  } catch(error) {
    return json(502,{ok:false,message:error?.name==='AbortError'?'経路サービスがタイムアウトしました':'経路を取得できませんでした'},origin,allowed);
  }
}
export async function POST(request) { return handle(request); }
export async function OPTIONS(request) { return handle(request); }

