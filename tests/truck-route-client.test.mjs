import test from 'node:test';
import assert from 'node:assert/strict';
import routing from '../truck-routing.js';
const vehicle={height:2.85,width:1.89,length:5.2,weight:4.8,avoidTolls:true};
const route={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.805,35.305],[136.81,35.31]]},summary:{distance:1800,duration:280},waycategory:[[0,1,0],[1,2,1]]};
const target={id:'T1',name:'Test',lat:35.31,lng:136.81};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(initial=vehicle){
  let profile=initial,drawn=null,drawProgress=null,calls=0,saveOK=true,current=true,fetchImpl=async()=>Response.json({ok:true,route}),arrivals=[],fits=[],position={lat:35.3,lng:136.8,accuracy:8,updatedAt:Date.now()},geoCalls=0;
  const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',checked:false,disabled:false,classList:{hidden:true,add(){this.hidden=true;},remove(){this.hidden=false;}}});return nodes.get(id);};
  const getNode=node;const domNode=id=>{const result=getNode(id);if(!result.nativeValue){let value=String(result.value);Object.defineProperty(result,'value',{get(){return value;},set(next){value=String(next);},configurable:true});result.nativeValue=true;}return result;};
  const modals=new Set();
  const geolocation={getCurrentPosition(success){geoCalls++;success({coords:{latitude:position.lat,longitude:position.lng,accuracy:position.accuracy}});}};
  const client=routing.createClient({document:{getElementById:domNode},endpoint:'https://relay.test/api/route',geolocation:geolocation,getPosition:()=>position,getVehicle:()=>profile,saveVehicle:value=>{if(!saveOK)return false;profile=value;return true;},openModal:id=>modals.add(id),closeModal:id=>modals.delete(id),toast(){},showMap:()=>true,draw:(value,target,progress)=>{drawn=value;drawProgress=progress;},fit:(value,target,progress)=>fits.push({value,target,progress}),external(){},onArrival:(target,position)=>arrivals.push({target,position}),isDestinationCurrent:()=>current,fetch:async(...args)=>{calls++;return fetchImpl(...args);}});
  client.init();return {client,node:domNode,modals,get profile(){return profile;},get drawn(){return drawn;},get drawProgress(){return drawProgress;},get calls(){return calls;},get arrivals(){return arrivals;},get fits(){return fits;},get geoCalls(){return geoCalls;},setFetch(fn){fetchImpl=fn;},setSave(value){saveOK=value;},setCurrent(value){current=value;},setPosition(value){position=value;}};
}
test('unknown profile opens blank fields and blocks route calls; validation uses explicit converted units',async()=>{
  const h=harness(null);h.client.start(target);assert.ok(h.modals.has('truckVehicleModal'));assert.equal(h.node('truckVehicle_weight').value,'');assert.equal(h.calls,0);
  h.node('truckVehicleSave').onclick();assert.match(h.node('truckVehicleError').textContent,/全高/);
  for(const [key,value] of Object.entries({height:'285',width:'189',length:'520',weight:'4800'}))h.node('truckVehicle_'+key).value=value;
  h.node('truckVehicleAvoidTolls').checked=false;h.node('truckVehicleSave').onclick();await tick();
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
test('automatic reroute heading is used only when travel direction is reliable',()=>{
  const moving=[{lat:35.3,lng:136.8,accuracy:8,reportedHeading:92,speed:8},{lat:35.3,lng:136.8002,accuracy:8,reportedHeading:90,speed:8},{lat:35.3,lng:136.8004,accuracy:8,reportedHeading:88,speed:8}];
  assert.equal(routing.stableTravelHeading(moving),88);
  const noSpeed=moving.map(({speed,...sample})=>sample);assert.ok(Math.abs(routing.stableTravelHeading(noSpeed)-90)<2);
  assert.equal(routing.stableTravelHeading([{lat:35.3,lng:136.8,accuracy:40,reportedHeading:90,speed:8},{lat:35.3,lng:136.8004,accuracy:40,reportedHeading:90,speed:8}]),null);
});
test('turn-aware zoom tightens as a significant route bend approaches',()=>{
  const turnRoute={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.801,35.3],[136.801,35.301],[136.802,35.301]]},summary:{distance:400,duration:60}};
  const atStart={edge:0,t:0,point:{lng:136.8,lat:35.3},distance:0},nearTurn={edge:0,t:0.7,point:{lng:136.8007,lat:35.3},distance:0};
  const far=routing.nextTurnMeters(turnRoute,atStart),near=routing.nextTurnMeters(turnRoute,nearTurn);
  assert.ok(far>70&&far<120);assert.ok(near>10&&near<50);assert.equal(routing.navigationZoomTarget(turnRoute,atStart),18);assert.equal(routing.navigationZoomTarget(turnRoute,nearTurn),19);
  const straight={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.801,35.3],[136.802,35.3]]},summary:{distance:200,duration:30}};assert.equal(routing.nextTurnMeters(straight,null),null);assert.equal(routing.navigationZoomTarget(straight,null),16);
});

test('route sections highlight both motorway and toll-only spans',()=>{
  const mixed={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.801,35.301],[136.802,35.302],[136.803,35.303]]},summary:{distance:900,duration:120},waycategory:[[0,1,0],[1,2,2],[2,3,1]]};
  assert.deepEqual(routing.routeSections(mixed).map(s=>({motorway:s.motorway,tollway:s.tollway,highlight:s.highlight})),[
    {motorway:false,tollway:false,highlight:false},{motorway:false,tollway:true,highlight:true},{motorway:true,tollway:false,highlight:true}
  ]);
});

test('routing asset version matches FINAL.41 release',()=>{
  assert.equal(routing.assetVersion,'2026.10.08-FINAL.41');
});

test('dedicated tollways extra highlights a route when waycategory reports no highway or toll bits',()=>{
  const providerMismatch={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.801,35.301],[136.802,35.302],[136.803,35.303]]},summary:{distance:900,duration:120},waycategory:[[0,3,0]],tollways:[[0,1,0],[1,3,1]]};
  assert.deepEqual(routing.routeSections(providerMismatch).map(s=>({motorway:s.motorway,tollway:s.tollway,highlight:s.highlight,count:s.coordinates.length})),[
    {motorway:false,tollway:false,highlight:false,count:2},{motorway:false,tollway:true,highlight:true,count:3}
  ]);
});

test('MAP highway toggle persists positive mode and recalculates an active route',async()=>{
  const h=harness();h.client.start(target);await tick();
  assert.equal(h.profile.avoidTolls,true);assert.match(h.node('mapHighwayToggle').textContent,/OFF/);assert.equal(h.calls,1);
  h.node('mapHighwayToggle').onclick();await tick();
  assert.equal(h.profile.avoidTolls,false);assert.match(h.node('mapHighwayToggle').textContent,/ON/);assert.match(h.node('truckRouteSummary').textContent,/高速優先ON/);assert.equal(h.calls,2);
  h.node('mapHighwayToggle').onclick();await tick();
  assert.equal(h.profile.avoidTolls,true);assert.match(h.node('mapHighwayToggle').textContent,/OFF/);assert.match(h.node('truckRouteSummary').textContent,/高速利用OFF/);assert.equal(h.calls,3);
});

test('route usage measures expressway distance and remaining sections drop travelled geometry',()=>{
  const navRoute={geometry:{type:'LineString',coordinates:[[136.8,35.3],[136.801,35.3],[136.802,35.3],[136.803,35.3]]},summary:{distance:300,duration:30},waycategory:[[0,1,0],[1,3,1]],tollways:[[0,1,0],[1,3,1]]};
  const usage=routing.routeUsage(navRoute);assert.ok(usage.priorityMeters>150);assert.ok(usage.motorwayMeters>150);
  const progress=routing.routeProgress(navRoute,{lat:35.3,lng:136.8015},0);assert.equal(progress.edge,1);assert.ok(progress.distance<2);
  const remaining=routing.remainingRouteSections(navRoute,progress);assert.equal(remaining[0].startEdge,1);assert.ok(Math.abs(remaining[0].coordinates[0][0]-136.8015)<0.00001);
  assert.ok(routing.routeUsage(navRoute).priorityMeters>routing.routeUsage({ ...navRoute, geometry:{type:'LineString',coordinates:[[136.802,35.3],[136.803,35.3]]}, waycategory:[[0,1,1]], tollways:[[0,1,1]] }).priorityMeters);
});
test('navigation progress redraws remaining line and sustained off-route fixes trigger one direction-aware automatic reroute',async()=>{
  let now=Date.now(),bodies=[];
  const h=harness();h.setFetch(async(url,options)=>{bodies.push(JSON.parse(options.body));return Response.json({ok:true,route});});
  h.client.start(target);await tick();assert.equal(h.calls,1);assert.equal(bodies[0].heading,undefined);
  h.client.onPosition({lat:35.307,lng:136.807,accuracy:8,updatedAt:now});assert.ok(h.drawn);assert.ok(h.drawProgress&&h.drawProgress.edge>=1);
  h.client.onPosition({lat:35.35,lng:136.85,accuracy:8,reportedHeading:45,heading:45,speed:10,updatedAt:now+1000});
  h.client.onPosition({lat:35.3501,lng:136.8501,accuracy:8,reportedHeading:45,heading:45,speed:10,updatedAt:now+2000});
  h.client.onPosition({lat:35.3502,lng:136.8502,accuracy:8,reportedHeading:45,heading:45,speed:10,updatedAt:now+3000});await tick();
  assert.equal(h.calls,2);assert.ok(Math.abs(bodies[1].origin.lat-35.3501)<0.00001&&Math.abs(bodies[1].origin.lng-136.8501)<0.00001);assert.equal(bodies[1].heading,45);
  h.node('truckRouteRecalculate').onclick();await tick();assert.equal(bodies.at(-1).heading,undefined,'manual recalculation must stay direction-agnostic');
});
test('stale or coarse cached GPS is refreshed before an initial route request',async()=>{
  const h=harness();h.setPosition({lat:35.3,lng:136.8,accuracy:70,updatedAt:Date.now()-10000});
  h.client.start(target);await tick();assert.equal(h.geoCalls,1);assert.equal(h.calls,0);
  h.setPosition({lat:35.3,lng:136.8,accuracy:12,updatedAt:Date.now()});h.client.start(target);await tick();assert.equal(h.calls,1);
});
test('automatic reroute keeps the existing route when the replacement is an extreme distance detour',async()=>{
  const h=harness(),huge={...route,summary:{distance:12000,duration:900}};let count=0;h.setFetch(async()=>Response.json({ok:true,route:++count===1?route:huge}));
  h.client.start(target);await tick();h.client.onPosition({lat:35.307,lng:136.807,accuracy:8,updatedAt:Date.now()});
  for(const [lat,lng] of [[35.35,136.85],[35.3501,136.8501],[35.3502,136.8502]])h.client.onPosition({lat,lng,accuracy:8,updatedAt:Date.now()});
  await tick();assert.equal(h.calls,2);assert.deepEqual(h.drawn.summary,route.summary);assert.match(h.node('truckRouteSummary').textContent,/大きく迂回/);
});

test('accurate GPS inside 100m ends navigation and emits one arrival callback',async()=>{
  const h=harness();h.client.start(target);await tick();assert.ok(h.drawn);
  h.client.onPosition({lat:35.31,lng:136.81,accuracy:8,updatedAt:Date.now()});
  assert.equal(h.arrivals.length,1);assert.equal(h.arrivals[0].target.id,'T1');assert.equal(h.drawn,null);assert.equal(h.node('truckRoutePanel').classList.hidden,true);
  h.client.onPosition({lat:35.31,lng:136.81,accuracy:8,updatedAt:Date.now()+1000});assert.equal(h.arrivals.length,1);
});

test('fitActive reuses the current remaining-route progress without a provider call',async()=>{
  const h=harness();h.client.start(target);await tick();const calls=h.calls;
  h.setPosition({lat:35.305,lng:136.805,accuracy:8,updatedAt:Date.now()});h.client.onPosition({lat:35.305,lng:136.805,accuracy:8,updatedAt:Date.now()});
  h.client.fitActive();assert.equal(h.calls,calls);assert.ok(h.fits.length>=2);assert.equal(h.fits.at(-1).value.summary.distance,1800);assert.ok(h.fits.at(-1).progress&&Number.isInteger(h.fits.at(-1).progress.edge));
});
