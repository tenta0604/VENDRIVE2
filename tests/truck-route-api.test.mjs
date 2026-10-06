import test from 'node:test';
import assert from 'node:assert/strict';
import { POST, OPTIONS } from '../api/route.mjs';
import routing from '../truck-routing.js';

const origin='https://tenta0604.github.io';
const vehicle={height:2.85,width:1.89,length:5.2,weight:4.8,avoidTolls:true};
const input={origin:{lat:35.3,lng:136.8},destination:{lat:35.31,lng:136.81},vehicle};
const feature={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.805,35.303],[136.81,35.31]]},properties:{summary:{distance:1800,duration:280},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,1,0],[1,2,1]]}}}};
const request=(body=input,options={})=>new Request('http://localhost/api/route',{method:'POST',headers:{origin,'content-type':'application/json',...options.headers},body:JSON.stringify(body)});
test('vehicle validation rejects missing, zero, nonnumeric and impossible axle values',()=>{
  for(const field of ['height','width','length','weight'])for(const value of [undefined,null,'',0,'2',NaN,Infinity])assert.throws(()=>routing.vehicle({...vehicle,[field]:value}));
  assert.throws(()=>routing.vehicle({...vehicle,axleload:4.9}));
  assert.equal(routing.vehicle({...vehicle,axleload:null}).axleload,undefined);
  assert.equal(routing.vehicle({...vehicle,axleload:2.5}).axleload,2.5);
});
test('origin/method/preflight/body gates reject before the upstream request',async()=>{
  assert.equal((await POST(request(input,{headers:{origin:'https://other.example'}}))).status,403);
  assert.equal((await POST(new Request('http://localhost/api/route',{headers:{origin}}))).status,405);
  const preflight=await OPTIONS(new Request('http://localhost/api/route',{method:'OPTIONS',headers:{origin}}));
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
  const previewOrigin='https://preview.example';
  const sameOriginPreflight=await OPTIONS(new Request(previewOrigin+'/api/route',{method:'OPTIONS',headers:{origin:previewOrigin}}));
  assert.equal(sameOriginPreflight.status,204);assert.equal(sameOriginPreflight.headers.get('access-control-allow-origin'),previewOrigin);
  assert.equal((await POST(request({...input,origin:{lat:'35',lng:136.8}}))).status,400);
  assert.equal((await POST(request({...input,vehicle:{...vehicle,height:null}}))).status,400);
  assert.equal((await POST(request({...input,padding:'x'.repeat(5000)}))).status,413);
  assert.equal((await POST(new Request('http://localhost/api/route',{method:'POST',headers:{origin},body:'broken'}))).status,400);
});
test('unconfigured relay has a usable nonsecret error',async()=>{
  const old=process.env.ORS_API_KEY;delete process.env.ORS_API_KEY;
  try{const response=await POST(request());assert.equal(response.status,503);assert.match((await response.json()).message,/外部ナビ/);}finally{if(old!==undefined)process.env.ORS_API_KEY=old;}
});
test('HGV request uses the new endpoint, lng/lat ordering, exact dimensions and no secret output',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  let sent;
  globalThis.fetch=async(url,options)=>{sent={url,options};return Response.json({features:[feature]});};
  try{
    const response=await POST(request({...input,vehicle:{...vehicle,axleload:2.5}}));assert.equal(response.status,200);
    const data=await response.json(),body=JSON.parse(sent.options.body);
    assert.equal(sent.url,'https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson');
    assert.deepEqual(body.coordinates,[[136.8,35.3],[136.81,35.31]]);
    assert.equal(body.options.vehicle_type,'hgv');assert.equal(body.instructions,false);assert.equal(body.preference,'fastest');
    assert.deepEqual(body.extra_info,['waycategory','tollways']);
    assert.deepEqual(body.options.profile_params.restrictions,{height:2.85,width:1.89,length:5.2,weight:4.8,axleload:2.5});
    assert.deepEqual(body.options.avoid_features,['ferries','highways','tollways']);
    assert.deepEqual(data.route.summary,{distance:1800,duration:280});
    assert.deepEqual(data.route.waycategory,[[0,2,0]]);assert.deepEqual(data.route.tollways,[[0,1,0],[1,2,1]]);assert.deepEqual(routing.routeSections(data.route).map(x=>({motorway:x.motorway,tollway:x.tollway})),[{motorway:false,tollway:false},{motorway:false,tollway:true}]);
    assert.equal(JSON.stringify(data).includes('test-secret'),false);
    assert.equal(response.headers.get('cache-control'),'no-store');
    await POST(request({...input,vehicle:{...vehicle,avoidTolls:false}}));assert.deepEqual(JSON.parse(sent.options.body).options.avoid_features,['ferries']);
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});
test('provider failures and malformed geometry fail closed without car/straight-line fallback',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  try{
    for(const [upstream,expected] of [[429,429],[403,503],[401,503],[400,422],[404,422],[500,502]]){
      globalThis.fetch=async()=>Response.json({error:'test-secret'}, {status:upstream});
      const response=await POST(request());assert.equal(response.status,expected);assert.equal((await response.text()).includes('test-secret'),false);
    }
    globalThis.fetch=async()=>Response.json({features:[{...feature,geometry:{type:'LineString',coordinates:[[136.8,35.3]]}}]});
    assert.equal((await POST(request())).status,502);
    globalThis.fetch=async()=>Response.json({features:[{...feature,properties:{...feature.properties,extras:{waycategory:{values:[[0,99,1]]}}}}]});assert.equal((await POST(request())).status,502);
    globalThis.fetch=async()=>Response.json({features:[{...feature,properties:{...feature.properties,extras:{...feature.properties.extras,tollways:{values:[[0,2,2]]}}}}]});assert.equal((await POST(request())).status,502);
    globalThis.fetch=async()=>{throw new Error('provider down');};assert.equal((await POST(request())).status,502);
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});
test('warm-instance quota guard caps upstream calls',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';let calls=0;
  globalThis.fetch=async()=>{calls++;return Response.json({features:[feature]});};
  try{
    let response;for(let i=0;i<31;i++){response=await POST(request());if(response.status===429)break;}
    assert.equal(response.status,429);assert.ok(calls<=30);
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});

