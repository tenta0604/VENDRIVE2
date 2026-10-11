import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../api/route.mjs';
import { lookupChubuIcs } from '../api/chubu-ic-source.mjs';
import { CHUBU_IC_CATALOG } from '../api/chubu-ic-catalog.mjs';

const vehicle={height:2.85,width:1.89,length:5.2,weight:4.8,avoidTolls:false};
const origin={lat:35.3,lng:136.73}; // Public regional corridor fixture, NOT a private GPS trace.
const destination={lat:35.075,lng:136.835};
const request=body=>new Request('http://localhost/api/route',{method:'POST',
  headers:{origin:'https://tenta0604.github.io','content-type':'application/json'},body:JSON.stringify(body)});
const baseline={
  geometry:{type:'LineString',coordinates:[[136.73,35.30],[136.78,35.20],[136.835,35.075]]},
  properties:{summary:{distance:42500,duration:3300},
    extras:{waycategory:{values:[[0,2,0]]},tollways:{values:[[0,2,0]]}}}
};
const via={
  geometry:{type:'LineString',coordinates:[[136.73,35.30],[136.76,35.29],[136.79,35.20],[136.82,35.10],[136.835,35.075]]},
  properties:{summary:{distance:45500,duration:3520},
    extras:{waycategory:{values:[[0,1,0],[1,3,1],[3,4,0]]},
    tollways:{values:[[0,1,0],[1,3,1],[3,4,0]]}}}
};

test('FINAL.54: real versioned Geofabrik extract has role-specific ramp nodes for both corridor ends',()=>{
  assert.equal(CHUBU_IC_CATALOG.schemaVersion,1);
  assert.match(CHUBU_IC_CATALOG.source.url,/download\.geofabrik\.de\/asia\/japan\/chubu-/);
  assert.match(CHUBU_IC_CATALOG.source.pbfSha256,/^[0-9a-f]{64}$/);
  assert.ok(CHUBU_IC_CATALOG.entryCount>=15&&CHUBU_IC_CATALOG.exitCount>=15);
  const result=lookupChubuIcs(origin,destination,20000);
  assert.equal(result.covered,true);
  assert.equal(result.status,'local-catalog');
  assert.equal(result.provider,'local');
  assert.equal(result.attempts,0);
  assert.ok(result.items.filter(x=>x.role==='entry').length>0,'real entry ramps near origin');
  assert.ok(result.items.filter(x=>x.role==='exit').length>0,'real exit ramps near destination');
  assert.ok(result.items.every(x=>Number.isSafeInteger(x.id)&&x.lat>34&&x.lat<36),'only OSM evidence');
});

test('FINAL.54: outside, stale and corrupt catalog cases fail closed without unverified ICs',()=>{
  const far=lookupChubuIcs({lat:34.1,lng:135},destination,20000);
  assert.equal(far.covered,false);
  assert.equal(far.status,'catalog-outside-coverage');
  const stale=lookupChubuIcs(origin,destination,20000,{
    now:Date.parse('2027-08-01T00:00:00Z')});
  assert.equal(stale.covered,true);
  assert.equal(stale.status,'catalog-stale');
  assert.equal(stale.items.length,0);
  const invalid=lookupChubuIcs(origin,destination,20000,{
    catalog:{...CHUBU_IC_CATALOG,schemaVersion:9}});
  assert.equal(invalid.status,'catalog-invalid');
  assert.equal(invalid.items.length,0);
});

test('FINAL.54: covered regional HGV search never calls Overpass; only restricted HGV routes can be selected',async()=>{
  const key=process.env.ORS_API_KEY,oldFetch=globalThis.fetch;
  process.env.ORS_API_KEY='test-only';
  const calls=[];
  globalThis.fetch=async(url,opts)=>{
    assert.ok(!String(url).includes('overpass'),'covered region must not use public Overpass');
    assert.ok(String(url).includes('/driving-hgv/'),'only genuine HGV provider');
    const body=JSON.parse(opts.body);calls.push(body);
    assert.equal(body.options.vehicle_type,'hgv');
    assert.deepEqual(body.options.profile_params.restrictions,
      {height:2.85,width:1.89,length:5.2,weight:4.8});
    assert.equal(body.options.avoid_features.includes('ferries'),true);
    return Response.json({features:[body.coordinates.length===2?baseline:via]});
  };
  try {
    const response=await POST(request({origin,destination,vehicle}));
    assert.equal(response.status,200);
    const data=await response.json();
    assert.equal(data.highwaySearch.junctionQueryStatus,'local-catalog');
    assert.equal(data.highwaySearch.junctionProvider,'local');
    assert.equal(data.highwaySearch.junctionAttempts,0);
    assert.equal(data.highwaySearch.junctionCatalogDate,CHUBU_IC_CATALOG.source.sourceDate);
    assert.ok(data.highwaySearch.junctions>0);
    assert.ok(data.highwaySearch.evaluated>0,'actual catalog must produce candidate IC pairs');
    assert.ok(calls.length<=3,'base + at most two optional via-IC HGV probes');
    assert.ok(data.highwaySearch.accepted>0,'mocked safe HGV via candidate reaches evaluation');
    assert.equal(data.selection,'active-ic-expressway-preferred');
    assert.ok(data.usage.motorwayMeters>0);
  } finally {
    globalThis.fetch=oldFetch;
    if(key===undefined)delete process.env.ORS_API_KEY;
    else process.env.ORS_API_KEY=key;
  }
});
