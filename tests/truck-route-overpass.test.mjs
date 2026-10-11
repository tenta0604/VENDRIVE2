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
      assert.match(String(opts.headers['User-Agent']),/^VENDRIVE2\/1\.0 \(\+https:\/\//,'all Overpass calls must identify the application');
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



test('FINAL.53: concurrent identical IC lookups share one request and preserve HGV baseline',async()=>{
 const previousKey=process.env.ORS_API_KEY,previousFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
 const trip={origin:{lat:35.29,lng:136.64},destination:{lat:35.41,lng:136.88},vehicle:{...vehicle,avoidTolls:false}};
 const base={geometry:{type:'LineString',coordinates:[[136.64,35.29],[136.75,35.35],[136.88,35.41]]},properties:{summary:{distance:32000,duration:2200},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
 let overpassCalls=0;
 globalThis.fetch=async(url)=>{
   if(String(url).includes('overpass')){overpassCalls++;await new Promise(resolve=>setTimeout(resolve,20));return Response.json({elements:[]});}
   return Response.json({features:[base]});
 };
 try{
   const responses=await Promise.all([POST(request(trip)),POST(request(trip))]);
   assert.ok(responses.every(r=>r.status===200));
   const data=await Promise.all(responses.map(r=>r.json()));
   assert.ok(data.every(d=>d.highwaySearch.junctionQueryStatus==='no-junctions'));
   assert.equal(overpassCalls,1,'coalesce identical concurrent public IC queries');
 }finally{globalThis.fetch=previousFetch;if(previousKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=previousKey;}
});

test('FINAL.53: 406 is an access refusal, not a reason to switch Overpass providers',async()=>{
 const previousKey=process.env.ORS_API_KEY,previousFetch=globalThis.fetch;process.env.ORS_API_KEY='test-secret';
 const trip={origin:{lat:35.155,lng:136.655},destination:{lat:35.365,lng:136.905},vehicle:{...vehicle,avoidTolls:false}};
 const base={geometry:{type:'LineString',coordinates:[[136.655,35.155],[136.78,35.28],[136.905,35.365]]},properties:{summary:{distance:37000,duration:2500},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
 let overpassCalls=0;
 globalThis.fetch=async(url,opts)=>{
   if(String(url).includes('overpass')){overpassCalls++;assert.match(String(opts.headers['User-Agent']),/VENDRIVE2\/1\.0/);return new Response('access denied',{status:406});}
   return Response.json({features:[base]});
 };
 try{
   const result=await POST(request(trip));assert.equal(result.status,200);
   const data=await result.json();
   assert.equal(data.highwaySearch.junctionAttempts,1);
   assert.equal(data.highwaySearch.junctionFirstFailure,'http-406');
   assert.equal(data.highwaySearch.junctionLastFailure,'http-406');
   assert.equal(overpassCalls,1,'a 406 must never trigger a backup attempt');
   assert.equal(data.usage.motorwayMeters,0);
   const again=await POST(request({...trip,origin:{lat:35.18,lng:136.68}}));assert.equal(again.status,200);
   const repeat=await again.json();assert.equal(repeat.highwaySearch.junctionAttempts,0);
   assert.equal(repeat.highwaySearch.junctionFirstFailure,'cooldown');
   assert.equal(overpassCalls,1,'no second request while provider is access-blocked');
 }finally{globalThis.fetch=previousFetch;if(previousKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=previousKey;}
});

test('FINAL.53: 429 stops all provider attempts and enforces a minimum cooldown',async()=>{
 const previousKey=process.env.ORS_API_KEY,previousFetch=globalThis.fetch,originalNow=Date.now;
 process.env.ORS_API_KEY='test-secret';
 Date.now=()=>originalNow()+11*60*1000; // Move beyond the prior access-block fixture without sleeping.
 const trip={origin:{lat:35.09,lng:136.58},destination:{lat:35.37,lng:136.91},vehicle:{...vehicle,avoidTolls:false}};
 const base={geometry:{type:'LineString',coordinates:[[136.58,35.09],[136.76,35.23],[136.91,35.37]]},properties:{summary:{distance:44000,duration:3000},extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
 let overpassCalls=0;
 globalThis.fetch=async(url)=>{
   if(String(url).includes('overpass')){overpassCalls++;return new Response('rate-limited',{status:429});}
   return Response.json({features:[base]});
 };
 try{
   const result=await POST(request(trip));assert.equal(result.status,200);const data=await result.json();
   assert.equal(data.highwaySearch.junctionAttempts,1);
   assert.equal(data.highwaySearch.junctionFirstFailure,'http-429');
   assert.equal(overpassCalls,1);
   const again=await POST(request({...trip,origin:{lat:35.12,lng:136.59}}));assert.equal(again.status,200);
   const second=await again.json();assert.equal(second.highwaySearch.junctionAttempts,0);
   assert.equal(second.highwaySearch.junctionFirstFailure,'cooldown');
   assert.equal(overpassCalls,1,'no provider requests during the cooldown');
 }finally{Date.now=originalNow;globalThis.fetch=previousFetch;if(previousKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=previousKey;}
});
