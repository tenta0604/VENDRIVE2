import routing from '../truck-routing.js';

const ALLOWED_ORIGINS = new Set(['https://tenta0604.github.io','http://localhost:8000','http://127.0.0.1:8000']);
const ENDPOINT = 'https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson';
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const MAX_BODY_BYTES = 4096;
const MAX_ACTIVE_HIGHWAY_ROUTES = 2;
const JUNCTION_CACHE_TTL_MS = 15*60*1000;
const ROUTE_SERVER_BUDGET_MS = 14500;
const ROUTE_RESPONSE_RESERVE_MS = 700;
// ORS allows alternatives only for trips below 100 km. Reserve a plain HGV fallback.
const ALTERNATIVES_DIRECT_LIMIT_METERS=55000;
const LONG_ROUTE_FERRY_VERIFY_METERS=70000;
const ALTERNATIVE_FIRST_ATTEMPT_MS=6200;
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
async function timedJsonFetch(url,options,timeoutMs){
  const controller=new AbortController();let timer;
  const work=(async()=>{
    const response=await fetch(url,{...options,signal:controller.signal});
    const data=await response.json().catch(()=>null);
    return {ok:response.ok,status:response.status,data:response.ok?data:null,errorCode:!response.ok&&Number.isInteger(data?.error?.code)?data.error.code:null};
  })();
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{
    controller.abort();const error=new Error('upstream timed out');error.name='AbortError';reject(error);
  },timeoutMs);});
  try{return await Promise.race([work,deadline]);}
  finally{clearTimeout(timer);}
}
function routeRequestBody(coordinates,vehicle,restrictions,withAlternatives,startHeading=null,verifyFerries=false){
  // For long highway-ON journeys avoid a provider dynamic-weighting cap caused by avoid_features.
  // Instead request waytype and accept a route only after proving that every span is non-ferry.
  const profileOptions={vehicle_type:'hgv',profile_params:{restrictions}};
  if(!verifyFerries)profileOptions.avoid_features=vehicle.avoidTolls?['ferries','highways','tollways']:['ferries'];
  const body={coordinates,instructions:true,instructions_format:'text',preference:'recommended',extra_info:['waycategory','tollways','waytype'],options:profileOptions};
  if(withAlternatives&&!vehicle.avoidTolls)body.alternative_routes={target_count:3,share_factor:0.85,weight_factor:1.6};
  if(Number.isFinite(startHeading)){
    body.bearings=coordinates.map((_,index)=>index===0?[startHeading,60]:[]);
    body.optimized=false;
  }
  return body;
}
function reserveUpstreamRouteCall(){
  const now=Date.now();while(recent.length&&recent[0]<=now-60000)recent.shift();
  if(recent.length>=30)return false;
  recent.push(now);return true;
}
async function requestOrsRoute(coordinates,vehicle,restrictions,key,{alternatives=false,timeoutMs=9000,startHeading=null,verifyFerries=false}={}){
  if(!reserveUpstreamRouteCall())return {ok:false,status:429,data:null};
  return timedJsonFetch(ENDPOINT,{method:'POST',headers:{'Authorization':key,'Content-Type':'application/json','Accept':'application/geo+json, application/json'},body:JSON.stringify(routeRequestBody(coordinates,vehicle,restrictions,alternatives,startHeading,verifyFerries))},timeoutMs);
}
function junctionCacheKey(origin,destination,radius){return [rounded(origin.lat),rounded(origin.lng),rounded(destination.lat),rounded(destination.lng),radius].join(':');}
async function findMotorwayJunctions(origin,destination,radius){
  const cacheKey=junctionCacheKey(origin,destination,radius),cached=junctionCache.get(cacheKey),now=Date.now();
  if(cached&&now-cached.at<JUNCTION_CACHE_TTL_MS)return cached.value;
  const query='[out:json][timeout:2];(node(around:'+radius+','+origin.lat+','+origin.lng+')["highway"="motorway_junction"];node(around:'+radius+','+destination.lat+','+destination.lng+')["highway"="motorway_junction"];);out body 200;';
  try{
    const response=await timedJsonFetch(OVERPASS_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Accept':'application/json'},body:'data='+encodeURIComponent(query)},2800);
    if(!response.ok)return {items:[],status:'provider-error'};
    const data=response.data,seen=new Set(),items=[];
    for(const element of Array.isArray(data?.elements)?data.elements:[]){
      if(element?.type!=='node'||!Number.isFinite(element.lat)||!Number.isFinite(element.lon)||seen.has(element.id))continue;
      seen.add(element.id);items.push({id:element.id,lat:element.lat,lng:element.lon,ref:typeof element.tags?.ref==='string'?element.tags.ref:'',name:typeof element.tags?.name==='string'?element.tags.name:''});
    }
    const value={items,status:items.length?'ok':'no-junctions'};
    junctionCache.set(cacheKey,{at:now,value});
    while(junctionCache.size>40)junctionCache.delete(junctionCache.keys().next().value);
    return value;
  }catch(error){return {items:[],status:error?.name==='AbortError'?'timeout':'provider-error'};}
}
function activeHighwayPairs(junctions,origin,destination,baselineDistance){
  const direct=routing.distanceMeters(origin,destination);
  if(!Number.isFinite(direct)||direct<5000)return [];
  const perEndAccessLimit=Math.min(25000,Math.max(9000,baselineDistance*0.25)),combinedAccessLimit=Math.min(35000,Math.max(16000,baselineDistance*0.35));
  const entries=junctions.map(j=>({...j,access:routing.distanceMeters(origin,j)})).filter(j=>Number.isFinite(j.access)&&j.access<=perEndAccessLimit).sort((a,b)=>a.access-b.access).slice(0,12);
  const exits=junctions.map(j=>({...j,egress:routing.distanceMeters(j,destination)})).filter(j=>Number.isFinite(j.egress)&&j.egress<=perEndAccessLimit).sort((a,b)=>a.egress-b.egress).slice(0,12);
  const pairs=[];
  for(const entry of entries)for(const exit of exits){
    if(entry.id===exit.id)continue;
    const highwaySpan=routing.distanceMeters(entry,exit),accessTotal=entry.access+exit.egress;
    if(!Number.isFinite(highwaySpan)||highwaySpan<Math.max(2500,direct*0.22))continue;
    if(accessTotal>combinedAccessLimit)continue;
    pairs.push({entry,exit,highwaySpan,accessTotal,score:accessTotal+Math.abs(highwaySpan-direct)*0.08});
  }
  const balanced=pairs.slice().sort((a,b)=>a.score-b.score||b.highwaySpan-a.highwaySpan||a.accessTotal-b.accessTotal),result=[],seen=new Set();
  function keyOf(pair){return (pair.entry.ref||pair.entry.id)+'>'+(pair.exit.ref||pair.exit.id);}
  function add(pair){if(!pair||result.length>=MAX_ACTIVE_HIGHWAY_ROUTES)return;const key=keyOf(pair);if(seen.has(key))return;seen.add(key);result.push(pair);}
  const first=balanced[0];add(first);
  if(first){
    const diverse=pairs.filter(pair=>keyOf(pair)!==keyOf(first)).map(pair=>({...pair,diversity:Math.min(routing.distanceMeters(pair.entry,first.entry),routing.distanceMeters(pair.exit,first.exit))})).filter(pair=>Number.isFinite(pair.diversity)&&pair.diversity>=2500).sort((a,b)=>b.diversity-a.diversity||b.highwaySpan-a.highwaySpan||a.accessTotal-b.accessTotal);
    add(diverse[0]);
  }
  for(const pair of balanced)add(pair);
  return result;
}
async function handle(request) {
  const routeDeadline=Date.now()+ROUTE_SERVER_BUDGET_MS;
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
  const startHeading=body?.heading===undefined?null:(typeof body.heading==='number'&&Number.isFinite(body.heading)&&body.heading>=0&&body.heading<360?body.heading:null);
  if(body?.heading!==undefined&&startHeading===null)return json(400,{ok:false,message:'進行方向を確認できませんでした'},origin,allowed);
  let vehicle;
  try { vehicle=routing.vehicle(body.vehicle); } catch(error) { return json(400,{ok:false,message:error.message},origin,allowed); }
  const key=process.env.ORS_API_KEY?.trim();
  if (!key) return json(503,{ok:false,message:'経路サービスの準備がまだ完了していません。外部ナビを利用できます'},origin,allowed);
  const restrictions={height:vehicle.height,width:vehicle.width,length:vehicle.length,weight:vehicle.weight};
  if (vehicle.axleload!==undefined)restrictions.axleload=vehicle.axleload;
  const directMeters=routing.distanceMeters(body.origin,body.destination),junctionRadius=Math.round(Math.max(8000,Math.min(25000,directMeters*0.35+4000)));
  const junctionPromise=!vehicle.avoidTolls&&directMeters>=6000?findMotorwayJunctions(body.origin,body.destination,junctionRadius):Promise.resolve({items:[],status:'not-requested'});
  try {
    const originDestination=[[body.origin.lng,body.origin.lat],[body.destination.lng,body.destination.lat]];
    // Long route first: uncomplicated HGV request. Alternatives are optional and can
    // exceed both ORS's 100km limit and its own CPU deadline.
    let verifyFerries=!vehicle.avoidTolls&&directMeters>=LONG_ROUTE_FERRY_VERIFY_METERS;
    const requestAlternatives=!vehicle.avoidTolls&&startHeading===null&&directMeters<ALTERNATIVES_DIRECT_LIMIT_METERS;
    let baselineRetried=false,baselineRetryCause='none',response;
    try{
      response=await requestOrsRoute(originDestination,vehicle,restrictions,key,{alternatives:requestAlternatives,timeoutMs:requestAlternatives?ALTERNATIVE_FIRST_ATTEMPT_MS:12000,startHeading,verifyFerries});
    }catch(error){
      if(error?.name!=='AbortError'||!requestAlternatives)throw error;
      baselineRetried=true;baselineRetryCause='alternative-timeout';
      const remaining=routeDeadline-Date.now()-ROUTE_RESPONSE_RESERVE_MS;
      if(remaining<1200)throw error;
      response=await requestOrsRoute(originDestination,vehicle,restrictions,key,{alternatives:false,timeoutMs:Math.min(7000,remaining),startHeading,verifyFerries});
    }
    if(!response.ok&&requestAlternatives&&response.status===400){
      baselineRetried=true;baselineRetryCause='alternative-rejected';
      const remaining=routeDeadline-Date.now()-ROUTE_RESPONSE_RESERVE_MS;
      if(remaining>=1200)response=await requestOrsRoute(originDestination,vehicle,restrictions,key,{alternatives:false,timeoutMs:Math.min(7000,remaining),startHeading,verifyFerries});
    }
    // For a medium-length HGV request whose explicit ferry avoidance exceeds ORS's
    // dynamic-weighting ceiling, retry without that expensive condition exactly once.
    // A verified full-coverage non-ferry waytype becomes mandatory for the response.
    if(!response.ok&&!baselineRetried&&!requestAlternatives&&!vehicle.avoidTolls&&!verifyFerries&&response.status===400&&response.errorCode===2004){
      const remaining=routeDeadline-Date.now()-ROUTE_RESPONSE_RESERVE_MS;
      if(remaining>=2000){
        verifyFerries=true;baselineRetried=true;baselineRetryCause='dynamic-distance-limit';
        response=await requestOrsRoute(originDestination,vehicle,restrictions,key,{alternatives:false,timeoutMs:Math.min(9000,remaining),startHeading,verifyFerries:true});
      }
    }
    if (!response.ok) {
      if(response.status===429)return json(429,{ok:false,message:'無料枠の取得上限です。時間をおいて再計算するか外部ナビを利用してください'},origin,allowed);
      if(response.status===401||response.status===403)return json(503,{ok:false,message:'経路サービスの認証を確認する必要があります'},origin,allowed);
      if(response.status===400||response.status===404)return json(422,{ok:false,message:directMeters>=70000?'経路提供元の長距離・車両制限に達しました。安全なHGV経路を作れないためトラック対応外部ナビをご利用ください':'車両条件に合う経路が見つかりません。位置と車両設定を確認してください'},origin,allowed);
      return json(502,{ok:false,message:'経路サービスに接続できません。時間をおいて再計算してください'},origin,allowed);
    }
    const data=response.data,features=Array.isArray(data?.features)?data.features:[];
    if(!features.length)throw new Error('missing route');
    function sanitizeFeature(feature){
      const steps=(Array.isArray(feature?.properties?.segments)?feature.properties.segments:[]).flatMap(segment=>Array.isArray(segment?.steps)?segment.steps:[]);
      // Retain only indexed maneuver types, never arbitrary upstream HTML/text.
      const maneuvers=steps.slice(0,1000).filter(step=>Number.isInteger(step?.type)&&Number.isInteger(step?.way_points?.[0])).map(step=>({type:step.type,at:step.way_points[0]}));
      return routing.route({geometry:feature?.geometry,summary:feature?.properties?.summary,waycategory:feature?.properties?.extras?.waycategory?.values,tollways:feature?.properties?.extras?.tollways?.values,waytype:feature?.properties?.extras?.waytype?.values,maneuvers});
    }
    const primary=sanitizeFeature(features[0]),candidates=[primary];
    function safeRoute(candidate){if(!verifyFerries)return true;return Array.isArray(candidate.waytype)&&candidate.waytype.length>0&&candidate.waytype[0][0]===0&&candidate.waytype.at(-1)[1]===candidate.geometry.coordinates.length-1&&!candidate.waytype.some(span=>span[2]===9);}
    if(!safeRoute(primary))return json(502,{ok:false,message:'長距離経路のフェリー不使用を確認できません。トラック対応外部ナビで安全なルートを確認してください'},origin,allowed);
    for(let i=1;i<features.length;i++){try{const result=sanitizeFeature(features[i]);if(safeRoute(result))candidates.push(result);}catch{}}
    function candidate(route){const usage=routing.routeUsage(route);return {route,usage};}
    const primaryItem=candidate(primary),existingItems=candidates.map(candidate),bestExistingMotorway=Math.max(0,...existingItems.map(item=>item.usage.motorwayMeters));
    const motorwayTarget=primary.summary.distance*0.85,highwaySearch={baselineAlternatives:requestAlternatives,baselineRetried,baselineRetryCause,longRouteFerryVerified:verifyFerries,attempted:false,junctions:0,junctionQueryStatus:'not-requested',evaluated:0,accepted:0,finalEligible:0,viaTimeouts:0,viaProviderRejected:0,viaNoFeature:0,viaLowMotorway:0,viaErrors:0,timeBudgetLimited:false,status:baselineRetried?'baseline-fallback':'not-needed',radiusMeters:junctionRadius,motorwayTargetMeters:Math.round(motorwayTarget),bestExistingMotorwayMeters:Math.round(bestExistingMotorway),pairStrategy:'balanced+diverse-corridor'},activeHighwayRoutes=new Set();
    if(!vehicle.avoidTolls&&!baselineRetried&&primary.summary.distance>=6000&&bestExistingMotorway<motorwayTarget){
      highwaySearch.attempted=true;
      const junctionResult=await junctionPromise,junctions=junctionResult.items;highwaySearch.junctions=junctions.length;highwaySearch.junctionQueryStatus=junctionResult.status;
      const pairs=activeHighwayPairs(junctions,body.origin,body.destination,primary.summary.distance);highwaySearch.evaluated=pairs.length;
      const remainingTime=routeDeadline-Date.now()-ROUTE_RESPONSE_RESERVE_MS;
      const viaBudget=Math.min(6500,Math.max(0,remainingTime));
      if(viaBudget<3000){highwaySearch.timeBudgetLimited=true;highwaySearch.status='time-budget-skip';}
      const viaResults=viaBudget<3000?[]:await Promise.all(pairs.map(async pair=>{
        try{
          const viaResponse=await requestOrsRoute([[body.origin.lng,body.origin.lat],[pair.entry.lng,pair.entry.lat],[pair.exit.lng,pair.exit.lat],[body.destination.lng,body.destination.lat]],vehicle,restrictions,key,{alternatives:false,timeoutMs:viaBudget,startHeading,verifyFerries});
          if(!viaResponse.ok){highwaySearch.viaProviderRejected++;return null;}
          const viaData=viaResponse.data,feature=Array.isArray(viaData?.features)?viaData.features[0]:null;
          if(!feature){highwaySearch.viaNoFeature++;return null;}
          const viaRoute=sanitizeFeature(feature);if(!safeRoute(viaRoute)){highwaySearch.viaErrors++;return null;}const viaUsage=routing.routeUsage(viaRoute),meaningfulMotorway=Math.max(1500,primary.summary.distance*0.15);
          if(viaUsage.motorwayMeters<meaningfulMotorway){highwaySearch.viaLowMotorway++;return null;}
          return {route:viaRoute,usage:viaUsage,via:{entry:{id:pair.entry.id,ref:pair.entry.ref,name:pair.entry.name},exit:{id:pair.exit.id,ref:pair.exit.ref,name:pair.exit.name}}};
        }catch(error){if(error?.name==='AbortError')highwaySearch.viaTimeouts++;else highwaySearch.viaErrors++;return null;}
      }));
      for(const result of viaResults)if(result){candidates.push(result.route);activeHighwayRoutes.add(result.route);highwaySearch.accepted++;}
      if(viaBudget<6500&&pairs.length)highwaySearch.timeBudgetLimited=true;
      if(highwaySearch.status!=='time-budget-skip')highwaySearch.status=highwaySearch.accepted?'via-ic-candidates-added':highwaySearch.timeBudgetLimited&&pairs.length?'time-budget-exhausted':junctions.length?'no-valid-via-route':'junction-search-unavailable';
    }
    const maxDuration=primary.summary.duration+Math.min(480,primary.summary.duration*0.20),maxDistance=primary.summary.distance+Math.min(10000,primary.summary.distance*0.30);
    let route=primary,selection='optimal',usage=primaryItem.usage;
    if(!vehicle.avoidTolls){
      const eligible=candidates.map(candidate).filter(item=>item.usage.priorityMeters>100&&item.route.summary.duration<=maxDuration&&item.route.summary.distance<=maxDistance).sort((a,b)=>a.route.summary.duration-b.route.summary.duration||a.route.summary.distance-b.route.summary.distance);
      if(eligible.length){
        const activeEligible=eligible.filter(item=>activeHighwayRoutes.has(item.route)).sort((a,b)=>b.usage.motorwayMeters-a.usage.motorwayMeters||b.usage.priorityMeters-a.usage.priorityMeters||a.route.summary.duration-b.route.summary.duration||a.route.summary.distance-b.route.summary.distance);highwaySearch.finalEligible=activeEligible.length;
        if(activeEligible.length){route=activeEligible[0].route;usage=activeEligible[0].usage;selection='active-ic-expressway-preferred';}
        else{
          const fastest=eligible[0],nearFast=eligible.filter(item=>item.route.summary.duration<=fastest.route.summary.duration+Math.min(300,fastest.route.summary.duration*0.15)&&item.route.summary.distance<=fastest.route.summary.distance+Math.min(8000,fastest.route.summary.distance*0.20)).sort((a,b)=>b.usage.priorityMeters-a.usage.priorityMeters||b.usage.motorwayMeters-a.usage.motorwayMeters||a.route.summary.duration-b.route.summary.duration||a.route.summary.distance-b.route.summary.distance);
          route=nearFast[0].route;usage=nearFast[0].usage;selection='expressway-natural-preferred';
        }
      } else selection=highwaySearch.attempted?'active-highway-unavailable':'highway-unavailable';
    }else selection='highway-avoided';
    highwaySearch.selectedMotorwayMeters=Math.round(usage.motorwayMeters);highwaySearch.availableCandidateCount=candidates.length;
    return json(200,{ok:true,profile:'driving-hgv',route,selection,usage,highwaySearch,attribution:'© openrouteservice | © OpenStreetMap contributors'},origin,allowed);
  } catch(error) {
    return json(502,{ok:false,message:error?.name==='AbortError'?'基本のHGV経路取得がタイムアウトしました。時間をおいて再検索してください':'経路を取得できませんでした'},origin,allowed);
  }
}
export async function POST(request) { return handle(request); }
export async function OPTIONS(request) { return handle(request); }


export { timedJsonFetch };
