import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../api/route.mjs';

const origin='https://tenta0604.github.io';
const vehicle={height:2.85,width:1.89,length:5.2,weight:4.8,avoidTolls:true};
const input={origin:{lat:35.3,lng:136.8},destination:{lat:35.31,lng:136.81},vehicle};
const feature={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.805,35.303],[136.81,35.31]]},properties:{summary:{distance:1800,duration:280},segments:[{steps:[{type:11,way_points:[0,1]},{type:1,way_points:[1,2]}]}],extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
function withWaytype(feature,code=1){return {...feature,properties:{...feature.properties,extras:{...feature.properties.extras,waytype:{values:[[0,feature.geometry.coordinates.length-1,code]]}}}};}
const request=(body=input)=>new Request('http://localhost/api/route',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});

test('if ORS rejects optional alternatives, retry one plain HGV baseline within budget',async()=>{
 const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';const calls=[];
 globalThis.fetch=async(url,opts)=>{const body=JSON.parse(opts.body);calls.push(body);if(body.alternative_routes)return Response.json({error:{code:2004,message:'alternative distance cap'}},{status:400});return Response.json({features:[feature]});};
 try{
  const response=await POST(request({...input,vehicle:{...vehicle,avoidTolls:false}}));assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.highwaySearch.baselineRetried,true);assert.equal(data.highwaySearch.baselineRetryCause,'alternative-rejected');
  assert.equal(calls.length,2);assert.ok(calls[0].alternative_routes);assert.equal(calls[1].alternative_routes,undefined);
  assert.ok(calls.every(c=>c.options.vehicle_type==='hgv'&&c.options.avoid_features.includes('ferries')));
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});

test('long HGV highway ON takes simple fast route, enforces exact truck profile and verified ferry-free waytype',async()=>{
 const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';const bodies=[];
 const body={origin:{lat:35.0,lng:136.0},destination:{lat:36.0,lng:137.1},vehicle:{...vehicle,avoidTolls:false}};
 const longRoute={geometry:{type:'LineString',coordinates:[[136,35],[136.5,35.5],[137.1,36]]},properties:{summary:{distance:180000,duration:9000},extras:{waycategory:{values:[[0,2,1]]},tollways:{values:[[0,2,1]]}}}};
 let waytype=1;
 globalThis.fetch=async(url,opts)=>{if(String(url).includes('overpass'))return Response.json({elements:[]});bodies.push(JSON.parse(opts.body));return Response.json({features:[waytype===null?longRoute:withWaytype(longRoute,waytype)]});};
 try{
   let response=await POST(request(body));assert.equal(response.status,200);let result=await response.json();
   assert.equal(result.highwaySearch.baselineAlternatives,false);assert.equal(result.highwaySearch.longRouteFerryVerified,true);assert.ok(result.usage.motorwayMeters>50000);
   assert.equal(bodies.length,1,'long route baseline does not multiply ORS calls');assert.equal(bodies[0].alternative_routes,undefined);assert.equal(bodies[0].options.vehicle_type,'hgv');
   assert.deepEqual(bodies[0].options.profile_params.restrictions,{height:2.85,width:1.89,length:5.2,weight:4.8});
   assert.equal(bodies[0].options.avoid_features,undefined);assert.ok(bodies[0].extra_info.includes('waytype'));
   waytype=9;response=await POST(request(body));assert.equal(response.status,502);assert.match((await response.json()).message,/フェリー/);
   waytype=null;response=await POST(request(body));assert.equal(response.status,502);assert.match((await response.json()).message,/フェリー/);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});

test('highway OFF always preserves explicit ferry and highway avoidance',async()=>{
 const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';let sent;
 globalThis.fetch=async(url,opts)=>{sent=JSON.parse(opts.body);return Response.json({features:[feature]});};
 try{await POST(request({...input,vehicle:{...vehicle,avoidTolls:true}}));assert.deepEqual(sent.options.avoid_features,['ferries','highways','tollways']);}
 finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});


test('highway use near sixty percent of an otherwise valid baseline still probes for later exit',async()=>{
 const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';const calls=[];
 const body={origin:{lat:35.0,lng:136.0},destination:{lat:35.30,lng:136.4},vehicle:{...vehicle,avoidTolls:false}};
 const baseline={geometry:{type:'LineString',coordinates:[[136,35],[136.26,35.18],[136.4,35.3]]},properties:{summary:{distance:50000,duration:3300},extras:{waycategory:{values:[[0,1,1],[1,2,0]]},tollways:{values:[[0,1,1],[1,2,0]]}}}};
 globalThis.fetch=async(url,opts)=>{if(String(url).includes('overpass'))return Response.json({elements:[]});calls.push(JSON.parse(opts.body));return Response.json({features:[baseline]});};
 try{
  const response=await POST(request(body));assert.equal(response.status,200);const data=await response.json();
  assert.equal(data.highwaySearch.attempted,true,'existing motorway usage should no longer bypass the early-exit search at the old 55% threshold');
  assert.equal(data.highwaySearch.junctionQueryStatus,'no-junctions');
  assert.equal(calls.length,1,'failed IC discovery must not produce unnecessary ORS requests');
  assert.deepEqual(data.route.summary,{distance:50000,duration:3300});
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});


test('medium mountain detour hitting ORS dynamic distance cap retries without ferry avoid, still rejects ferry',async()=>{
 const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';const sent=[];
 const body={origin:{lat:35.0,lng:136.0},destination:{lat:35.45,lng:136.40},vehicle:{...vehicle,avoidTolls:false}};
 const hgv={geometry:{type:'LineString',coordinates:[[136,35],[136.25,35.25],[136.4,35.45]]},properties:{summary:{distance:98000,duration:5400},extras:{waycategory:{values:[[0,2,1]]},tollways:{values:[[0,2,1]]}}}};
 let ferry=false;
 globalThis.fetch=async(url,opts)=>{if(String(url).includes('overpass'))return Response.json({elements:[]});const req=JSON.parse(opts.body);sent.push(req);if(req.options.avoid_features)return Response.json({error:{code:2004,message:'By dynamic weighting maximum 100000m'}},{status:400});return Response.json({features:[withWaytype(hgv,ferry?9:1)]});};
 try{
  let response=await POST(request(body));assert.equal(response.status,200);let result=await response.json();
  assert.equal(result.highwaySearch.baselineRetried,true);assert.equal(result.highwaySearch.baselineRetryCause,'dynamic-distance-limit');
  assert.equal(result.highwaySearch.longRouteFerryVerified,true);assert.equal(result.highwaySearch.attempted,false,'limited ORS budget prioritizes usable baseline, not via-IC probes');
  assert.equal(sent.length,2);assert.deepEqual(sent[0].options.avoid_features,['ferries']);assert.equal(sent[1].options.avoid_features,undefined);
  sent.length=0;ferry=true;response=await POST(request(body));assert.equal(response.status,502);assert.match((await response.json()).message,/フェリー/);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});

test('FINAL.51: medium 2t HGV trip around 42km skips costly alternatives and evaluates a bounded IC route',async()=>{
 const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
 // Approximate corridor only, not real-provider evidence or actual shop/customer coordinates.
 const trip={origin:{lat:35.30,lng:136.72},destination:{lat:35.07,lng:136.82},vehicle:{...vehicle,avoidTolls:false}};
 const base={geometry:{type:'LineString',coordinates:[[136.72,35.30],[136.765,35.18],[136.82,35.07]]},properties:{summary:{distance:42000,duration:2800},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
 const via={geometry:{type:'LineString',coordinates:[[136.72,35.30],[136.74,35.28],[136.765,35.22],[136.79,35.14],[136.82,35.07]]},properties:{summary:{distance:46000,duration:3010},extras:{waycategory:{values:[[0,1,0],[1,3,1],[3,4,0]]},tollways:{values:[[0,1,0],[1,3,1],[3,4,0]]}}}};
 const bodies=[];
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes('overpass-api.de'))return Response.json({elements:[
   {type:'node',id:91001,lat:35.28,lon:136.74,tags:{ref:'ENTRY'}},
   {type:'node',id:91002,lat:35.09,lon:136.815,tags:{ref:'EXIT'}}]});
  const body=JSON.parse(opts.body);bodies.push(body);
  assert.equal(body.options.vehicle_type,'hgv');
  assert.deepEqual(body.options.profile_params.restrictions,{height:2.85,width:1.89,length:5.2,weight:4.8});
  assert.deepEqual(body.options.avoid_features,['ferries']);
  return Response.json({features:[withWaytype(body.coordinates.length===2?base:via)]});
 };
 try{
  const response=await POST(request(trip));assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.highwaySearch.baselineAlternatives,false,'40km-class HGV trips must skip expensive alternatives');
  assert.equal(result.highwaySearch.baselineRetried,false);
  assert.equal(result.highwaySearch.attempted,true);
  assert.equal(result.highwaySearch.junctionQueryStatus,'ok');
  assert.ok(result.highwaySearch.accepted>=1);
  assert.equal(result.selection,'active-ic-expressway-preferred');
  assert.ok(result.usage.motorwayMeters>6000);
  assert.ok(bodies.length<=3,'one baseline and at most two via-IC calls');
  assert.ok(bodies.some(b=>b.coordinates.length===4),'IC route must be evaluated');
  assert.ok(bodies.every(b=>!b.alternative_routes),'medium-distance ORS requests must remain simple');
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});

test('FINAL.51: quick fallback after alternative timeout can still discover safe IC candidate within budget',async()=>{
 const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
 const trip={origin:{lat:35.30,lng:136.80},destination:{lat:35.42,lng:136.89},vehicle:{...vehicle,avoidTolls:false}};
 const base={geometry:{type:'LineString',coordinates:[[136.80,35.30],[136.845,35.36],[136.89,35.42]]},properties:{summary:{distance:19000,duration:1900},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
 const via={geometry:{type:'LineString',coordinates:[[136.80,35.30],[136.81,35.315],[136.84,35.35],[136.88,35.405],[136.89,35.42]]},properties:{summary:{distance:22000,duration:2150},extras:{waycategory:{values:[[0,1,0],[1,3,1],[3,4,0]]},tollways:{values:[[0,1,0],[1,3,1],[3,4,0]]}}}};
 const bodies=[];
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes('overpass-api.de'))return Response.json({elements:[
   {type:'node',id:92001,lat:35.315,lon:136.81,tags:{ref:'E'}},
   {type:'node',id:92002,lat:35.405,lon:136.88,tags:{ref:'X'}}]});
  const body=JSON.parse(opts.body);bodies.push(body);
  if(body.alternative_routes){const error=new Error('simulated alternative timeout');error.name='AbortError';throw error;}
  return Response.json({features:[withWaytype(body.coordinates.length===2?base:via)]});
 };
 try{
  const response=await POST(request(trip));assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.highwaySearch.baselineAlternatives,true);
  assert.equal(data.highwaySearch.baselineRetried,true);
  assert.equal(data.highwaySearch.baselineRetryCause,'alternative-timeout');
  assert.equal(data.highwaySearch.attempted,true,'fallback may not unconditionally suppress IC search');
  assert.ok(data.highwaySearch.accepted>=1);
  assert.equal(data.selection,'active-ic-expressway-preferred');
  assert.ok(bodies.length<=4,'alternative, fallback, and at most two via-IC probes');
  assert.ok(bodies.some(b=>b.coordinates.length===4));
  assert.ok(bodies.every(b=>b.options.vehicle_type==='hgv'));
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});
