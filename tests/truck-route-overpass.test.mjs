import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../api/route.mjs';

const origin='https://tenta0604.github.io';
const vehicle={height:2.85,width:1.89,length:5.2,weight:4.8,avoidTolls:true};
const request=(body)=>new Request('http://localhost/api/route',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
test('FINAL.52: failed primary Overpass HTTP 504 uses one documented backup, retaining HGV safety and IC preference',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  const far={origin:{lat:35.20,lng:136.70},destination:{lat:35.40,lng:136.95},vehicle:{...vehicle,avoidTolls:false}};
  const surface={geometry:{type:'LineString',coordinates:[[136.70,35.20],[136.82,35.30],[136.95,35.40]]},properties:{summary:{distance:32000,duration:2400},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  const via={geometry:{type:'LineString',coordinates:[[136.70,35.20],[136.73,35.22],[136.86,35.33],[136.92,35.38],[136.95,35.40]]},properties:{summary:{distance:34000,duration:2750},extras:{waycategory:{values:[[0,1,0],[1,3,1],[3,4,0]]},tollways:{values:[[0,1,0],[1,3,1],[3,4,0]]}}}};
  const queried=[],orsBodies=[];
  globalThis.fetch=async(url,opts)=>{
    if(String(url).includes('overpass')){
      queried.push(String(url));
      if(String(url).includes('overpass-api.de'))return new Response('busy',{status:504,headers:{'Content-Type':'text/plain'}});
      return Response.json({elements:[
        {type:'node',id:52101,lat:35.22,lon:136.73,tags:{ref:'ENTRY'}},
        {type:'node',id:52102,lat:35.38,lon:136.92,tags:{ref:'EXIT'}}
      ]});
    }
    const body=JSON.parse(opts.body);orsBodies.push(body);
    assert.equal(body.options.vehicle_type,'hgv');
    assert.deepEqual(body.options.profile_params.restrictions,{height:2.85,width:1.89,length:5.2,weight:4.8});
    return Response.json({features:[body.coordinates.length===2?surface:via]});
  };
  try{
    const response=await POST(request(far));assert.equal(response.status,200);const data=await response.json();
    assert.equal(data.highwaySearch.junctionProvider,'backup');
    assert.equal(data.highwaySearch.junctionAttempts,2);
    assert.equal(data.highwaySearch.junctionFirstFailure,'http-504');
    assert.equal(data.highwaySearch.junctionQueryStatus,'ok');
    assert.ok(data.highwaySearch.accepted>=1);
    assert.equal(data.selection,'active-ic-expressway-preferred');
    assert.equal(queried.length,2,'one initial and one backup lookup maximum');
    assert.ok(orsBodies.length<=3,'no more than two optional HGV IC probes');
    assert.ok(queried[0].includes('overpass-api.de')&&queried[1].includes('overpass.private.coffee'),'backup must use a distinct provider');
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});

test('FINAL.52: two failed Overpass providers never fabricate ICs or trigger extra HGV requests',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
  const far={origin:{lat:35.215,lng:136.71},destination:{lat:35.395,lng:136.94},vehicle:{...vehicle,avoidTolls:false}};
  const surface={geometry:{type:'LineString',coordinates:[[136.71,35.215],[136.83,35.30],[136.94,35.395]]},properties:{summary:{distance:34500,duration:2500},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
  let overpassCalls=0,hgvCalls=0;
  globalThis.fetch=async(url)=>{
    if(String(url).includes('overpass')){overpassCalls++;return new Response('unavailable',{status:503,headers:{'Content-Type':'text/plain'}});}
    hgvCalls++;return Response.json({features:[surface]});
  };
  try{
    const response=await POST(request(far));assert.equal(response.status,200);const data=await response.json();
    assert.equal(data.highwaySearch.junctionQueryStatus,'provider-error');
    assert.equal(data.highwaySearch.junctionProvider,'none');
    assert.equal(data.highwaySearch.junctionAttempts,2);
    assert.equal(data.highwaySearch.junctionLastFailure,'http-503');
    assert.equal(data.highwaySearch.accepted,0);
    assert.equal(data.selection,'active-highway-unavailable');
    assert.equal(data.usage.motorwayMeters,0);
    assert.equal(overpassCalls,2);
    assert.equal(hgvCalls,1,'keep the usable base HGV route when junction providers fail');
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});


