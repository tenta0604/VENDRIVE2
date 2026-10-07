import routing from '../truck-routing.js';

const ALLOWED_ORIGINS = new Set(['https://tenta0604.github.io','http://localhost:8000','http://127.0.0.1:8000']);
const ENDPOINT = 'https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson';
const MAX_BODY_BYTES = 4096;
// Per-warm-instance guard complements the provider's hard free quota. It is not a distributed limiter.
const recent = [];
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
  const now=Date.now();while(recent.length&&recent[0]<=now-60000)recent.shift();
  if (recent.length>=30) return json(429,{ok:false,message:'経路の取得回数が多いため、1分後に再計算してください'},origin,allowed);
  recent.push(now);
  const restrictions={height:vehicle.height,width:vehicle.width,length:vehicle.length,weight:vehicle.weight};
  if (vehicle.axleload!==undefined)restrictions.axleload=vehicle.axleload;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try {
    const upstreamBody={coordinates:[[body.origin.lng,body.origin.lat],[body.destination.lng,body.destination.lat]],instructions:false,preference:'recommended',extra_info:['waycategory','tollways'],options:{vehicle_type:'hgv',avoid_features:vehicle.avoidTolls?['ferries','highways','tollways']:['ferries'],profile_params:{restrictions}}};
    if(!vehicle.avoidTolls)upstreamBody.alternative_routes={target_count:3,share_factor:0.85,weight_factor:1.6};
    const response=await fetch(ENDPOINT,{method:'POST',headers:{'Authorization':key,'Content-Type':'application/json','Accept':'application/geo+json, application/json'},signal:controller.signal,body:JSON.stringify(upstreamBody)});
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
    function candidate(route){
      const usage=routing.routeUsage(route);
      return {route,usage};
    }
    const primaryItem=candidate(primary),maxDuration=primary.summary.duration+Math.min(480,primary.summary.duration*0.20),maxDistance=primary.summary.distance+Math.min(10000,primary.summary.distance*0.30);
    let route=primary,selection='optimal',usage=primaryItem.usage;
    if(!vehicle.avoidTolls){
      const eligible=candidates.map(candidate).filter(item=>item.usage.priorityMeters>100&&item.route.summary.duration<=maxDuration&&item.route.summary.distance<=maxDistance).sort((a,b)=>a.route.summary.duration-b.route.summary.duration||a.route.summary.distance-b.route.summary.distance);
      if(eligible.length){
        const fastest=eligible[0],nearFast=eligible.filter(item=>item.route.summary.duration<=fastest.route.summary.duration+Math.min(120,fastest.route.summary.duration*0.10)&&item.route.summary.distance<=fastest.route.summary.distance+Math.min(3000,fastest.route.summary.distance*0.15)).sort((a,b)=>b.usage.priorityMeters-a.usage.priorityMeters||b.usage.motorwayMeters-a.usage.motorwayMeters||a.route.summary.duration-b.route.summary.duration||a.route.summary.distance-b.route.summary.distance);
        route=nearFast[0].route;usage=nearFast[0].usage;selection='expressway-natural-preferred';
      } else selection='highway-unavailable';
    }else selection='highway-avoided';
    return json(200,{ok:true,profile:'driving-hgv',route,selection,usage,attribution:'© openrouteservice | © OpenStreetMap contributors'},origin,allowed);
  } catch {
    return json(502,{ok:false,message:controller.signal.aborted?'経路サービスがタイムアウトしました':'経路を取得できませんでした'},origin,allowed);
  } finally { clearTimeout(timer); }
}
export async function POST(request) { return handle(request); }
export async function OPTIONS(request) { return handle(request); }

