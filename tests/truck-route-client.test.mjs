import test from 'node:test';
import assert from 'node:assert/strict';
import routing from '../truck-routing.js';
const vehicle={height:2.85,width:1.89,length:5.2,weight:4.8,avoidTolls:true};
const route={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.805,35.305],[136.81,35.31]]},summary:{distance:1800,duration:280},waycategory:[[0,1,0],[1,2,1]]};
const target={id:'T1',name:'Test',lat:35.31,lng:136.81};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(initial=vehicle){
  let profile=initial,drawn=null,calls=0,saveOK=true,current=true,fetchImpl=async()=>Response.json({ok:true,route});
  const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',checked:false,disabled:false,classList:{hidden:true,add(){this.hidden=true;},remove(){this.hidden=false;}}});return nodes.get(id);};
  const getNode=node;const domNode=id=>{const result=getNode(id);if(!result.nativeValue){let value=String(result.value);Object.defineProperty(result,'value',{get(){return value;},set(next){value=String(next);},configurable:true});result.nativeValue=true;}return result;};
  const modals=new Set();
  const client=routing.createClient({document:{getElementById:domNode},endpoint:'https://relay.test/api/route',geolocation:null,getPosition:()=>({lat:35.3,lng:136.8,accuracy:8,updatedAt:Date.now()}),getVehicle:()=>profile,saveVehicle:value=>{if(!saveOK)return false;profile=value;return true;},openModal:id=>modals.add(id),closeModal:id=>modals.delete(id),toast(){},showMap:()=>true,draw:value=>drawn=value,fit(){},external(){},isDestinationCurrent:()=>current,fetch:async(...args)=>{calls++;return fetchImpl(...args);}});
  client.init();return {client,node:domNode,modals,get profile(){return profile;},get drawn(){return drawn;},get calls(){return calls;},setFetch(fn){fetchImpl=fn;},setSave(value){saveOK=value;},setCurrent(value){current=value;}};
}
test('unknown profile opens blank fields and blocks route calls; validation uses explicit converted units',async()=>{
  const h=harness(null);h.client.start(target);assert.ok(h.modals.has('truckVehicleModal'));assert.equal(h.node('truckVehicle_weight').value,'');assert.equal(h.calls,0);
  h.node('truckVehicleSave').onclick();assert.match(h.node('truckVehicleError').textContent,/全高/);
  for(const [key,value] of Object.entries({height:'285',width:'189',length:'520',weight:'4800'}))h.node('truckVehicle_'+key).value=value;
  h.node('truckVehicleAvoidTolls').checked=true;h.node('truckVehicleSave').onclick();await tick();
  assert.deepEqual(h.profile,vehicle);assert.equal(h.calls,1);assert.ok(h.drawn);assert.match(h.node('truckRouteSummary').textContent,/1.8km/);
});
test('profile save failure stays open and never routes on unpersisted values',()=>{
  const h=harness();h.node('truckVehicleSettings').onclick();h.setSave(false);h.node('truckVehicleSave').onclick();
  assert.ok(h.modals.has('truckVehicleModal'));assert.match(h.node('truckVehicleError').textContent,/保存できません/);assert.equal(h.calls,0);
});
test('route redraw does not call provider and invalidated destinations clear the route',async()=>{
  const h=harness();h.client.start(target);await tick();assert.equal(h.calls,1);assert.ok(h.drawn);
  h.client.redraw();h.client.redraw();assert.equal(h.calls,1);
  h.setCurrent(false);h.client.redraw();assert.equal(h.drawn,null);assert.equal(h.node('truckRoutePanel').classList.hidden,true);
});
test('late responses from ended/replaced routes cannot resurrect them',async()=>{
  const h=harness();let release;
  h.setFetch(()=>new Promise(resolve=>release=resolve));h.client.start(target);await tick();h.client.end();release(Response.json({ok:true,route}));await tick();
  assert.equal(h.drawn,null);assert.equal(h.node('truckRoutePanel').classList.hidden,true);
  let first;h.setFetch(()=>new Promise(resolve=>first=resolve));h.client.start(target);await tick();h.setFetch(async()=>Response.json({ok:true,route}));h.client.start({...target,id:'T3',name:'New target'});await tick();first(Response.json({ok:true,route:{...route,summary:{distance:99000,duration:99000}}}));await tick();
  assert.equal(h.node('truckRouteTitle').textContent,'New target');assert.equal(h.drawn.summary.distance,1800);
});
test('provider error or malformed geometry removes old geometry and supports manual retry',async()=>{
  const h=harness();h.client.start(target);await tick();assert.ok(h.drawn);
  h.setFetch(async()=>Response.json({ok:false,message:'無料枠の上限'},{status:429}));h.node('truckRouteRecalculate').onclick();await tick();assert.equal(h.drawn,null);assert.match(h.node('truckRouteSummary').textContent,/無料枠/);assert.equal(h.node('truckRouteRecalculate').disabled,false);
  h.setFetch(async()=>Response.json({ok:true,route:{geometry:{type:'LineString',coordinates:[]},summary:route.summary}}));h.node('truckRouteRecalculate').onclick();await tick();assert.equal(h.drawn,null);
  h.setFetch(async()=>Response.json({ok:true,route}));h.node('truckRouteRecalculate').onclick();await tick();assert.ok(h.drawn);
});


test('route sections preserve motorway classification and reject malformed spans',()=>{
  assert.deepEqual(routing.routeSections(route).map(section=>({motorway:section.motorway,count:section.coordinates.length})),[{motorway:false,count:2},{motorway:true,count:2}]);
  assert.throws(()=>routing.route({...route,waycategory:[[0,99,1]]}),/道路種別/);
});
test('heading prefers reported GPS direction and falls back to meaningful movement',()=>{
  const a={lat:35.3,lng:136.8},east={lat:35.3,lng:136.801};
  assert.equal(routing.resolveHeading(a,east,450,null),90);
  assert.ok(Math.abs(routing.resolveHeading(a,east,null,null)-90)<1);
  assert.equal(routing.resolveHeading(a,{lat:35.300001,lng:136.800001},null,123),123);
});

test('route sections highlight both motorway and toll-only spans',()=>{
  const mixed={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.801,35.301],[136.802,35.302],[136.803,35.303]]},summary:{distance:900,duration:120},waycategory:[[0,1,0],[1,2,2],[2,3,1]]};
  assert.deepEqual(routing.routeSections(mixed).map(s=>({motorway:s.motorway,tollway:s.tollway,highlight:s.highlight})),[
    {motorway:false,tollway:false,highlight:false},{motorway:false,tollway:true,highlight:true},{motorway:true,tollway:false,highlight:true}
  ]);
});
