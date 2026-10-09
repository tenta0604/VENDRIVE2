import test from 'node:test';
import assert from 'node:assert/strict';
import { POST, OPTIONS, timedJsonFetch } from '../api/route.mjs';
import routing from '../truck-routing.js';

const origin='https://tenta0604.github.io';
const vehicle={height:2.85,width:1.89,length:5.2,weight:4.8,avoidTolls:true};
const input={origin:{lat:35.3,lng:136.8},destination:{lat:35.31,lng:136.81},vehicle};
const feature={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.805,35.303],[136.81,35.31]]},properties:{summary:{distance:1800,duration:280},segments:[{steps:[{type:11,way_points:[0,1],instruction:'Depart'},{type:1,way_points:[1,2],instruction:'Turn right'}]}],extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,1,0],[1,2,1]]}}}};
function withWaytype(feature,code=1){return {...feature,properties:{...feature.properties,extras:{...feature.properties.extras,waytype:{values:[[0,feature.geometry.coordinates.length-1,code]]}}}};}
const request=(body=input,options={})=>new Request('http://localhost/api/route',{method:'POST',headers:{origin,'content-type':'application/json',...options.headers},body:JSON.stringify(body)});

test('upstream timeout also covers a stalled response JSON body, not just response headers',async()=>{
  const previous=globalThis.fetch;
  let aborted=false;
  globalThis.fetch=async(_url,options)=>{
    options.signal.addEventListener('abort',()=>{aborted=true;});
    return {ok:true,status:200,json:()=>new Promise(()=>{})};
  };
  try{
    const started=Date.now();
    await assert.rejects(timedJsonFetch('https://example.test/route',{method:'POST'},35),e=>e?.name==='AbortError');
    assert.equal(aborted,true,'the stalled JSON stream should be aborted');
    assert.ok(Date.now()-started<1000,'full-response deadline must be bounded');
  }finally{globalThis.fetch=previous;}
});

test('time budget skips optional via-IC probes and still delivers an already fetched safe HGV route',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch,realNow=Date.now;
  process.env.ORS_API_KEY='test-secret';
  let afterBaseline=false,viaCalls=0;
  const far={origin:{lat:35.51,lng:136.11},destination:{lat:35.75,lng:136.49},vehicle:{...vehicle,avoidTolls:false}};
  const base={geometry:{type:'LineString',coordinates:[[136.11,35.51],[136.29,35.62],[136.49,35.75]]},properties:{summary:{distance:48000,duration:3200},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  globalThis.fetch=async(url,opts)=>{
    if(String(url).includes('overpass-api.de'))return Response.json({elements:[
      {type:'node',id:99101,lat:35.54,lon:136.14,tags:{ref:'ENTRY'}},
      {type:'node',id:99102,lat:35.72,lon:136.46,tags:{ref:'EXIT'}}
    ]});
    const submitted=JSON.parse(opts.body);
    assert.equal(submitted.options.vehicle_type,'hgv');
    assert.deepEqual(submitted.options.profile_params.restrictions,{height:2.85,width:1.89,length:5.2,weight:4.8});
    if(submitted.coordinates.length!==2){viaCalls++;return Response.json({error:'slow'});}
    afterBaseline=true;
    return Response.json({features:[base]});
  };
  Date.now=()=>realNow()+(afterBaseline?14500:0);
  try{
    const result=await POST(request(far));assert.equal(result.status,200);
    const data=await result.json();
    assert.deepEqual(data.route.summary,{distance:48000,duration:3200});
    assert.equal(data.profile,'driving-hgv');
    assert.equal(data.highwaySearch.attempted,true);
    assert.equal(data.highwaySearch.timeBudgetLimited,true);
    assert.equal(data.highwaySearch.status,'time-budget-skip');
    assert.equal(viaCalls,0,'do not start an optional ORS request after the budget is exhausted');
  }finally{
    Date.now=realNow;globalThis.fetch=oldFetch;
    if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;
  }
});

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
    assert.equal(body.options.vehicle_type,'hgv');assert.equal(body.instructions,true);assert.equal(body.preference,'recommended');
    assert.deepEqual(body.extra_info,['waycategory','tollways','waytype']);
    assert.deepEqual(body.options.profile_params.restrictions,{height:2.85,width:1.89,length:5.2,weight:4.8,axleload:2.5});
    assert.deepEqual(body.options.avoid_features,['ferries','highways','tollways']);assert.equal(body.alternative_routes,undefined);
    assert.deepEqual(data.route.summary,{distance:1800,duration:280});
    assert.deepEqual(data.route.maneuvers,[{type:11,at:0},{type:1,at:1}]);assert.equal(JSON.stringify(data.route).includes('Turn right'),false);
    assert.deepEqual(data.route.waycategory,[[0,2,0]]);assert.deepEqual(data.route.tollways,[[0,1,0],[1,2,1]]);assert.deepEqual(routing.routeSections(data.route).map(x=>({motorway:x.motorway,tollway:x.tollway})),[{motorway:false,tollway:false},{motorway:false,tollway:true}]);
    assert.equal(JSON.stringify(data).includes('test-secret'),false);
    assert.equal(response.headers.get('cache-control'),'no-store');
    await POST(request({...input,vehicle:{...vehicle,avoidTolls:false}}));{const onBody=JSON.parse(sent.options.body);assert.deepEqual(onBody.options.avoid_features,['ferries']);assert.deepEqual(onBody.alternative_routes,{target_count:3,share_factor:0.85,weight_factor:1.6});}
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});
test('optional reroute heading becomes an ORS start bearing without changing HGV restrictions',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';const bodies=[];
  globalThis.fetch=async(url,options)=>{bodies.push(JSON.parse(options.body));return Response.json({features:[feature]});};
  try{
    const invalid=await POST(request({...input,heading:361}));assert.equal(invalid.status,400);
    const response=await POST(request({...input,heading:92,vehicle:{...vehicle,axleload:2.5}}));assert.equal(response.status,200);
    const body=bodies.at(-1);assert.deepEqual(body.bearings,[[92,60],[]]);assert.equal(body.optimized,false);assert.deepEqual(body.coordinates,[[136.8,35.3],[136.81,35.31]]);
    assert.equal(body.options.vehicle_type,'hgv');assert.deepEqual(body.options.profile_params.restrictions,{height:2.85,width:1.89,length:5.2,weight:4.8,axleload:2.5});
    bodies.length=0;await POST(request({...input,vehicle:{...vehicle,axleload:2.5}}));assert.equal(bodies.at(-1).bearings,undefined);assert.equal(bodies.at(-1).optimized,undefined);
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
test('highway ON prefers more expressway use only among near-fast bounded candidates',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  const surface={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.804,35.304],[136.81,35.31]]},properties:{summary:{distance:1600,duration:180},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  const shortHighway={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.801,35.301],[136.806,35.306],[136.81,35.31]]},properties:{summary:{distance:2000,duration:190},extras:{waycategory:{values:[[0,1,1],[1,3,0]]},tollways:{values:[[0,1,1],[1,3,0]]}}}};
  const longHighway={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.804,35.3],[136.808,35.3],[136.81,35.31]]},properties:{summary:{distance:2300,duration:225},extras:{waycategory:{values:[[0,2,1],[2,3,0]]},tollways:{values:[[0,2,1],[2,3,0]]}}}};
  globalThis.fetch=async()=>Response.json({features:[surface,shortHighway,longHighway]});
  try{
    const response=await POST(request({...input,vehicle:{...vehicle,avoidTolls:false}}));assert.equal(response.status,200);
    const data=await response.json();assert.equal(data.selection,'expressway-natural-preferred');assert.deepEqual(data.route.summary,{distance:2300,duration:225});
    assert.ok(data.usage.priorityMeters>100);assert.equal(data.highwaySearch.baselineAlternatives,true);
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});
test('highway ON falls back cleanly when provider returns no highway candidate',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  const surface={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.805,35.305],[136.81,35.31]]},properties:{summary:{distance:1500,duration:170},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  globalThis.fetch=async()=>Response.json({features:[surface]});
  try{
    const response=await POST(request({...input,vehicle:{...vehicle,avoidTolls:false}}));assert.equal(response.status,200);
    const data=await response.json();assert.equal(data.selection,'highway-unavailable');assert.deepEqual(data.route.summary,{distance:1500,duration:170});
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});



test('highway ON rejects an excessive expressway detour',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  const surface={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.805,35.305],[136.81,35.31]]},properties:{summary:{distance:2000,duration:300},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  const hugeDetour={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.84,35.3],[136.85,35.31],[136.81,35.31]]},properties:{summary:{distance:30000,duration:1000},extras:{waycategory:{values:[[0,2,1],[2,3,0]]},tollways:{values:[[0,2,1],[2,3,0]]}}}};
  globalThis.fetch=async()=>Response.json({features:[surface,hugeDetour]});
  try{
    const response=await POST(request({...input,vehicle:{...vehicle,avoidTolls:false}}));assert.equal(response.status,200);
    const data=await response.json();assert.equal(data.selection,'highway-unavailable');assert.deepEqual(data.route.summary,{distance:2000,duration:300});
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});




test('highway ON actively searches motorway junctions and adopts a bounded HGV via-IC candidate',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  const farInput={origin:{lat:35.20,lng:136.70},destination:{lat:35.40,lng:136.95},vehicle:{...vehicle,avoidTolls:false}};
  const surface={geometry:{type:'LineString',coordinates:[[136.70,35.20],[136.82,35.30],[136.95,35.40]]},properties:{summary:{distance:32000,duration:2400},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  const modestHighway={geometry:{type:'LineString',coordinates:[[136.70,35.20],[136.75,35.24],[136.82,35.30],[136.95,35.40]]},properties:{summary:{distance:32500,duration:2320},extras:{waycategory:{values:[[0,1,1],[1,3,0]]},tollways:{values:[[0,3,0]]}}}};
  const viaHighway={geometry:{type:'LineString',coordinates:[[136.70,35.20],[136.73,35.22],[136.86,35.33],[136.92,35.38],[136.95,35.40]]},properties:{summary:{distance:34000,duration:2750},extras:{waycategory:{values:[[0,1,0],[1,3,1],[3,4,0]]},tollways:{values:[[0,1,0],[1,3,1],[3,4,0]]}}}};
  const junctions={elements:[
    {type:'node',id:101,lat:35.22,lon:136.73,tags:{highway:'motorway_junction',ref:'A'}},
    {type:'node',id:102,lat:35.38,lon:136.92,tags:{highway:'motorway_junction',ref:'B'}},
    {type:'node',id:103,lat:35.225,lon:136.735,tags:{highway:'motorway_junction',ref:'A2'}},
    {type:'node',id:104,lat:35.375,lon:136.915,tags:{highway:'motorway_junction',ref:'B2'}}
  ]};
  const routeBodies=[];
  globalThis.fetch=async(url,options)=>{
    if(String(url).includes('overpass-api.de'))return Response.json(junctions);
    routeBodies.push(JSON.parse(options.body));
    return Response.json({features:(routeBodies.length===1?[surface,modestHighway]:[viaHighway]).map(x=>withWaytype(x))});
  };
  try{
    const response=await POST(request(farInput));assert.equal(response.status,200);
    const data=await response.json();assert.equal(data.selection,'active-ic-expressway-preferred');assert.equal(data.highwaySearch.attempted,true);assert.ok(data.highwaySearch.junctions>=4);assert.ok(data.highwaySearch.evaluated>=1);assert.ok(data.highwaySearch.accepted>=1);
    assert.deepEqual(data.route.summary,{distance:34000,duration:2750});assert.ok(data.usage.motorwayMeters>10000);assert.ok(data.route.summary.duration>2320+120,'active IC route should be adopted even outside the old near-fast +2 minute window when it remains inside global detour bounds');
    const viaRequest=routeBodies.find(body=>body.coordinates.length===4);assert.ok(viaRequest,'active highway search must issue a waypoint HGV request');assert.equal(viaRequest.options.vehicle_type,'hgv');assert.deepEqual(viaRequest.options.profile_params.restrictions,{height:2.85,width:1.89,length:5.2,weight:4.8});assert.equal(viaRequest.alternative_routes,undefined);
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});
test('active highway IC discovery fails open to the safe baseline HGV route',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  const farInput={origin:{lat:35.05,lng:136.50},destination:{lat:35.28,lng:136.78},vehicle:{...vehicle,avoidTolls:false}};
  const surface={geometry:{type:'LineString',coordinates:[[136.50,35.05],[136.64,35.16],[136.78,35.28]]},properties:{summary:{distance:34000,duration:2500},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  globalThis.fetch=async(url)=>{
    if(String(url).includes('overpass-api.de'))throw new Error('overpass unavailable');
    return Response.json({features:[surface]});
  };
  try{
    const response=await POST(request(farInput));assert.equal(response.status,200);
    const data=await response.json();assert.equal(data.selection,'active-highway-unavailable');assert.equal(data.highwaySearch.attempted,true);assert.equal(data.highwaySearch.status,'junction-search-unavailable');assert.equal(data.highwaySearch.junctionQueryStatus,'provider-error');assert.equal(data.highwaySearch.junctions,0);assert.equal(data.highwaySearch.evaluated,0);assert.deepEqual(data.route.summary,{distance:34000,duration:2500});
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});


test('long-distance highway ON still searches farther IC access and does not stop after only 18km of motorway',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  const farInput={origin:{lat:35.00,lng:136.00},destination:{lat:35.80,lng:137.00},vehicle:{...vehicle,avoidTolls:false}};
  const surface={geometry:{type:'LineString',coordinates:[[136.00,35.00],[136.50,35.40],[137.00,35.80]]},properties:{summary:{distance:120000,duration:7200},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  const modestHighway={geometry:{type:'LineString',coordinates:[[136.00,35.00],[136.20,35.15],[136.50,35.40],[137.00,35.80]]},properties:{summary:{distance:121000,duration:7000},extras:{waycategory:{values:[[0,1,1],[1,3,0]]},tollways:{values:[[0,3,0]]}}}};
  const viaHighway={geometry:{type:'LineString',coordinates:[[136.00,35.00],[136.08,35.08],[136.50,35.40],[136.92,35.72],[137.00,35.80]]},properties:{summary:{distance:125000,duration:7600},extras:{waycategory:{values:[[0,1,0],[1,3,1],[3,4,0]]},tollways:{values:[[0,1,0],[1,3,1],[3,4,0]]}}}};
  const junctions={elements:[
    {type:'node',id:501,lat:35.08,lon:136.08,tags:{highway:'motorway_junction',ref:'LONG-A'}},
    {type:'node',id:502,lat:35.72,lon:136.92,tags:{highway:'motorway_junction',ref:'LONG-B'}},
    {type:'node',id:503,lat:35.085,lon:136.085,tags:{highway:'motorway_junction',ref:'LONG-A2'}},
    {type:'node',id:504,lat:35.715,lon:136.915,tags:{highway:'motorway_junction',ref:'LONG-B2'}}
  ]};
  const routeBodies=[];let overpassBody='';
  globalThis.fetch=async(url,options)=>{
    if(String(url).includes('overpass-api.de')){overpassBody=String(options.body||'');return Response.json(junctions);}
    routeBodies.push(JSON.parse(options.body));
    return Response.json({features:routeBodies.length===1?[surface,modestHighway]:[viaHighway]});
  };
  try{
    const response=await POST(request(farInput));assert.equal(response.status,200);
    const data=await response.json();assert.equal(data.highwaySearch.attempted,true);assert.ok(data.highwaySearch.radiusMeters>18000);assert.ok(data.highwaySearch.accepted>=1);assert.equal(data.selection,'active-ic-expressway-preferred');
    assert.deepEqual(data.route.summary,{distance:125000,duration:7600});assert.ok(data.usage.motorwayMeters>45000);
    assert.ok(decodeURIComponent(overpassBody).includes('around:25000'),'long-distance search should expand beyond the old 18km radius');
    assert.equal(routeBodies[0].alternative_routes,undefined,'long distance must never request ORS alternatives');assert.equal(routeBodies[0].options.avoid_features,undefined,'long highway ON avoids dynamic-weight distance cap; ferry safety verified via waytype');assert.equal(data.highwaySearch.longRouteFerryVerified,true);
    assert.ok(routeBodies.some(body=>body.coordinates.length===4),'a long-distance via-IC HGV route must be evaluated even when endpoint IC access exceeds the old combined 18km cap');
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});

test('highway ON uses one of the two bounded via-IC probes for a geographically distinct motorway corridor',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  const farInput={origin:{lat:35.00,lng:136.00},destination:{lat:35.00,lng:137.00},vehicle:{...vehicle,avoidTolls:false}};
  const surface={geometry:{type:'LineString',coordinates:[[136.00,35.00],[136.50,35.00],[137.00,35.00]]},properties:{summary:{distance:120000,duration:7200},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  const modestHighway={geometry:{type:'LineString',coordinates:[[136.00,35.00],[136.30,35.00],[136.50,35.00],[137.00,35.00]]},properties:{summary:{distance:121000,duration:7100},extras:{waycategory:{values:[[0,1,1],[1,3,0]]},tollways:{values:[[0,3,0]]}}}};
  const shortVia={geometry:{type:'LineString',coordinates:[[136.00,35.00],[136.02,35.00],[136.35,35.00],[136.98,35.00],[137.00,35.00]]},properties:{summary:{distance:124000,duration:7450},extras:{waycategory:{values:[[0,1,0],[1,2,1],[2,4,0]]},tollways:{values:[[0,4,0]]}}}};
  const longVia={geometry:{type:'LineString',coordinates:[[136.00,35.00],[136.00,35.08],[136.20,35.07],[136.80,34.93],[137.00,34.92],[137.00,35.00]]},properties:{summary:{distance:128000,duration:7550},extras:{waycategory:{values:[[0,1,0],[1,4,1],[4,5,0]]},tollways:{values:[[0,1,0],[1,4,1],[4,5,0]]}}}};
  const junctions={elements:[
    {type:'node',id:701,lat:35.00,lon:136.02,tags:{highway:'motorway_junction',ref:'NEAR-A'}},
    {type:'node',id:702,lat:35.002,lon:136.022,tags:{highway:'motorway_junction',ref:'NEAR-A2'}},
    {type:'node',id:703,lat:35.00,lon:136.98,tags:{highway:'motorway_junction',ref:'NEAR-B'}},
    {type:'node',id:704,lat:35.002,lon:136.978,tags:{highway:'motorway_junction',ref:'NEAR-B2'}},
    {type:'node',id:705,lat:35.08,lon:136.00,tags:{highway:'motorway_junction',ref:'ALT-A'}},
    {type:'node',id:706,lat:34.92,lon:137.00,tags:{highway:'motorway_junction',ref:'ALT-B'}}
  ]};
  const routeBodies=[];
  globalThis.fetch=async(url,options)=>{
    if(String(url).includes('overpass-api.de'))return Response.json(junctions);
    const body=JSON.parse(options.body);routeBodies.push(body);
    if(body.coordinates.length===2)return Response.json({features:[withWaytype(surface),withWaytype(modestHighway)]});
    const entryLat=body.coordinates[1][1],exitLat=body.coordinates[2][1];
    return Response.json({features:[withWaytype(entryLat>35.05&&exitLat<34.95?longVia:shortVia)]});
  };
  try{
    const response=await POST(request(farInput));assert.equal(response.status,200);
    const data=await response.json();assert.equal(data.highwaySearch.pairStrategy,'balanced+diverse-corridor');assert.equal(data.highwaySearch.junctionQueryStatus,'ok');assert.ok(data.highwaySearch.motorwayTargetMeters>45000);assert.equal(data.highwaySearch.evaluated,2);assert.ok(data.highwaySearch.finalEligible>=1);assert.equal(data.highwaySearch.viaProviderRejected,0);assert.equal(data.highwaySearch.viaErrors,0);
    const viaBodies=routeBodies.filter(body=>body.coordinates.length===4);assert.equal(viaBodies.length,2);
    assert.ok(viaBodies.some(body=>body.coordinates[1][1]>35.05&&body.coordinates[2][1]<34.95),'one probe must explore a geographically distinct IC corridor instead of spending both probes on the nearest cluster');
    assert.equal(data.selection,'active-ic-expressway-preferred');assert.deepEqual(data.route.summary,{distance:128000,duration:7550});assert.ok(data.usage.motorwayMeters>60000);
    viaBodies.forEach(body=>assert.deepEqual(body.options.profile_params.restrictions,{height:2.85,width:1.89,length:5.2,weight:4.8}));
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});

test('highway diagnostics separate rejected ORS via-IC probes without increasing calls',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  const requestBody={origin:{lat:35.20,lng:136.70},destination:{lat:35.40,lng:136.95},vehicle:{...vehicle,avoidTolls:false}};
  const surface={geometry:{type:'LineString',coordinates:[[136.70,35.20],[136.82,35.30],[136.95,35.40]]},properties:{summary:{distance:32000,duration:2400},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  const junctions={elements:[{type:'node',id:19801,lat:35.22,lon:136.73,tags:{ref:'A'}},{type:'node',id:19802,lat:35.38,lon:136.92,tags:{ref:'B'}},{type:'node',id:19803,lat:35.225,lon:136.735,tags:{ref:'C'}},{type:'node',id:19804,lat:35.375,lon:136.915,tags:{ref:'D'}}]};
  let routeRequests=0;
  globalThis.fetch=async(url,options)=>{
    if(String(url).includes('overpass-api.de'))return Response.json(junctions);
    const sent=JSON.parse(options.body);routeRequests++;
    assert.equal(sent.options.vehicle_type,'hgv');assert.deepEqual(sent.options.profile_params.restrictions,{height:2.85,width:1.89,length:5.2,weight:4.8});
    if(sent.coordinates.length===2)return Response.json({features:[surface]});
    return Response.json({error:'vehicle restriction'}, {status:400});
  };
  try{
    const response=await POST(request(requestBody));assert.equal(response.status,200);
    const result=await response.json();assert.equal(result.highwaySearch.attempted,true);assert.equal(result.highwaySearch.junctionQueryStatus,'ok');
    assert.equal(result.highwaySearch.accepted,0);assert.equal(result.highwaySearch.viaProviderRejected,result.highwaySearch.evaluated);assert.equal(result.highwaySearch.viaNoFeature,0);
    assert.ok(routeRequests<=3,'baseline plus at most two via-IC requests');
    assert.equal(result.selection,'active-highway-unavailable');assert.deepEqual(result.route.summary,{distance:32000,duration:2400});
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
