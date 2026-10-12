import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../api/route.mjs';

const origin='https://tenta0604.github.io';
const vehicle={height:2.85,width:1.89,length:5.2,weight:4.8,avoidTolls:true};
const input={origin:{lat:35.3,lng:138.8},destination:{lat:35.31,lng:138.81},vehicle};
const feature={geometry:{type:'LineString',coordinates:[[138.8,35.3],[138.805,35.303],[138.81,35.31]]},properties:{summary:{distance:1800,duration:280},segments:[],extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}};
const request=(body=input)=>new Request('http://localhost/api/route',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});


test('FINAL.56 timeout-class diagnostics expose only bounded coarse stages and no secrets in HTTP body or runtime log',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch,oldWarn=console.warn,logs=[];
  process.env.ORS_API_KEY='SUPER_SECRET_ORS_KEY';
  console.warn=(...args)=>logs.push(args.join(' '));
  globalThis.fetch=async()=>{const error=new Error('DO_NOT_COPY upstream private internal');error.name='AbortError';throw error;};
  try{
    const response=await POST(request({...input,vehicle}));
    assert.equal(response.status,502);
    const data=await response.json();
    assert.equal(data.ok,false);
    assert.match(data.message,/タイムアウト/);
    assert.equal(data.routeDiagnostic.version,'2026.10.12-FINAL.56');
    assert.equal(data.routeDiagnostic.phase,'baseline-hgv');
    assert.equal(data.routeDiagnostic.kind,'upstream-timeout');
    assert.equal(data.routeDiagnostic.optionalIcMs,0);
    assert.ok(Number.isInteger(data.routeDiagnostic.elapsedMs));
    const combined=JSON.stringify(data)+' '+logs.join(' ');
    for(const token of ['SUPER_SECRET_ORS_KEY','DO_NOT_COPY','138.8','35.3','2.85','1.89','4.8'])assert.ok(!combined.includes(token),'diagnostic must not expose '+token);
    assert.match(logs.join(' '),/VENDRIVE_ROUTE_FAILURE/);
  } finally {
    globalThis.fetch=oldFetch;console.warn=oldWarn;
    if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;
  }
});

test('FINAL.56 success timing fields do not change route or provider selection',async()=>{
  const oldKey=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;process.env.ORS_API_KEY='SUPER_SECRET_ORS_KEY';
  globalThis.fetch=async()=>Response.json({features:[feature]});
  try{
    const response=await POST(request());assert.equal(response.status,200);
    const data=await response.json();
    assert.equal(data.routeDiagnostic.kind,'ok');
    assert.equal(data.routeDiagnostic.phase,'complete');
    assert.ok(Number.isInteger(data.routeDiagnostic.baselineMs));
    assert.ok(Number.isInteger(data.routeDiagnostic.elapsedMs));
    assert.equal(data.route.summary.distance,1800);
    assert.equal(data.profile,'driving-hgv');
    assert.ok(!JSON.stringify(data.routeDiagnostic).includes('SUPER_SECRET_ORS_KEY'));
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;}
});
