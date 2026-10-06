import routing from '../truck-routing.js';

const ALLOWED_ORIGINS = new Set(['https://tenta0604.github.io','http://localhost:8000','http://127.0.0.1:8000']);
const ENDPOINT = 'https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson';
const MAX_BODY_BYTES = 4096;
// Per-warm-instance guard complements the provider's hard free quota. It is not a distributed limiter.
const recent = [];
function originAllowed(request,origin,allowed) {
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
  const origin = request.headers.get('origin') || '',allowed=originAllowed(request,origin,allowed);
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
    const response=await fetch(ENDPOINT,{method:'POST',headers:{'Authorization':key,'Content-Type':'application/json','Accept':'application/geo+json, application/json'},signal:controller.signal,body:JSON.stringify({coordinates:[[body.origin.lng,body.origin.lat],[body.destination.lng,body.destination.lat]],instructions:false,options:{vehicle_type:'hgv',avoid_features:vehicle.avoidTolls?['ferries','tollways']:['ferries'],profile_params:{restrictions}}})});
    if (!response.ok) {
      if(response.status===429)return json(429,{ok:false,message:'無料枠の取得上限です。時間をおいて再計算するか外部ナビを利用してください'},origin,allowed);
      if(response.status===401||response.status===403)return json(503,{ok:false,message:'経路サービスの認証を確認する必要があります'},origin,allowed);
      if(response.status===400||response.status===404)return json(422,{ok:false,message:'車両条件に合う経路が見つかりません。位置と車両設定を確認してください'},origin,allowed);
      return json(502,{ok:false,message:'経路サービスに接続できません。時間をおいて再計算してください'},origin,allowed);
    }
    const data=await response.json(),feature=data?.features?.[0];
    const route=routing.route({geometry:feature?.geometry,summary:feature?.properties?.summary});
    return json(200,{ok:true,profile:'driving-hgv',route,attribution:'© openrouteservice | © OpenStreetMap contributors'},origin,allowed);
  } catch {
    return json(502,{ok:false,message:controller.signal.aborted?'経路サービスがタイムアウトしました':'経路を取得できませんでした'},origin,allowed);
  } finally { clearTimeout(timer); }
}
export async function POST(request) { return handle(request); }
export async function OPTIONS(request) { return handle(request); }

