(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.VENDRIVETruckRouting=factory();
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var ASSET_VERSION='2026.10.08-FINAL.44';
  var ROUTE_REQUEST_TIMEOUT_MS=20000;
  var fields={height:['全高',0.5,6],width:['全幅',0.5,4],length:['全長',1,30],weight:['車両総重量',0.5,60]};
  function point(value){return !!value&&typeof value.lat==='number'&&Number.isFinite(value.lat)&&Math.abs(value.lat)<=90&&typeof value.lng==='number'&&Number.isFinite(value.lng)&&Math.abs(value.lng)<=180;}
  function distanceMeters(a,b){if(!point(a)||!point(b))return Infinity;var rad=Math.PI/180,lat1=a.lat*rad,lat2=b.lat*rad,dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad,s=Math.sin(dlat/2)*Math.sin(dlat/2)+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlng/2)*Math.sin(dlng/2);return 6371000*2*Math.atan2(Math.sqrt(s),Math.sqrt(Math.max(0,1-s)));}
  function normalizeHeading(value){if(typeof value!=='number'||!Number.isFinite(value))return null;return ((value%360)+360)%360;}
  function bearing(from,to){if(!point(from)||!point(to)||distanceMeters(from,to)<0.5)return null;var rad=Math.PI/180,lat1=from.lat*rad,lat2=to.lat*rad,dlng=(to.lng-from.lng)*rad,y=Math.sin(dlng)*Math.cos(lat2),x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dlng);return normalizeHeading(Math.atan2(y,x)/rad);}
  function resolveHeading(previous,next,reported,last){var direct=normalizeHeading(reported);if(direct!==null)return direct;if(point(previous)&&point(next)&&distanceMeters(previous,next)>=4){var movement=bearing(previous,next);if(movement!==null)return movement;}return normalizeHeading(last);}
  function headingDifference(a,b){var first=normalizeHeading(a),second=normalizeHeading(b);if(first===null||second===null)return 0;var diff=Math.abs(first-second)%360;return diff>180?360-diff:diff;}
  function stableTravelHeading(samples){
    var valid=(Array.isArray(samples)?samples:[]).filter(function(sample){return point(sample)&&typeof sample.accuracy==='number'&&Number.isFinite(sample.accuracy)&&sample.accuracy<=25;});
    if(valid.length<2)return null;
    var latest=valid[valid.length-1],direct=normalizeHeading(latest.reportedHeading);
    if(direct!==null&&typeof latest.speed==='number'&&Number.isFinite(latest.speed)&&latest.speed>=2)return direct;
    var first=valid[0];if(distanceMeters(first,latest)<10)return null;
    return bearing(first,latest);
  }
  function coordinatePoint(coordinate){return {lng:coordinate[0],lat:coordinate[1]};}
  function turnReferencePoint(coordinates,index,direction,minMeters){
    var current=coordinatePoint(coordinates[index]),distance=0,i=index;
    while(true){
      var nextIndex=i+direction;if(nextIndex<0||nextIndex>=coordinates.length)return null;
      var next=coordinatePoint(coordinates[nextIndex]);distance+=distanceMeters(current,next);current=next;i=nextIndex;
      if(distance>=minMeters)return current;
    }
  }
  function nextTurnMeters(value,currentProgress){
    var coordinates=value&&value.geometry&&Array.isArray(value.geometry.coordinates)?value.geometry.coordinates:null;
    if(!coordinates||coordinates.length<3)return null;
    var edge=currentProgress&&Number.isInteger(currentProgress.edge)?Math.max(0,Math.min(coordinates.length-2,currentProgress.edge)):0;
    var cursor=currentProgress&&point(currentProgress.point)?currentProgress.point:coordinatePoint(coordinates[edge]),distanceAhead=0;
    for(var vertex=edge+1;vertex<coordinates.length-1;vertex++){
      var vertexPoint=coordinatePoint(coordinates[vertex]);distanceAhead+=distanceMeters(cursor,vertexPoint);cursor=vertexPoint;
      if(distanceAhead>500)return null;
      var before=turnReferencePoint(coordinates,vertex,-1,30),after=turnReferencePoint(coordinates,vertex,1,30);
      if(!before||!after)continue;
      var incoming=bearing(before,vertexPoint),outgoing=bearing(vertexPoint,after);
      if(headingDifference(incoming,outgoing)>=40)return distanceAhead;
    }
    return null;
  }
  function navigationZoomTarget(value,currentProgress){
    var meters=nextTurnMeters(value,currentProgress);
    if(meters===null)return 16;
    if(meters<=50)return 19;
    if(meters<=120)return 18;
    if(meters<=260)return 17;
    return 16;
  }
  function vehicle(value){
    if(!value||typeof value!=='object')throw new Error('車検証などで確認した車両の寸法・総重量を登録してください');
    var result={};
    Object.keys(fields).forEach(function(key){var rule=fields[key],n=value[key];if(typeof n!=='number'||!Number.isFinite(n)||n<rule[1]||n>rule[2])throw new Error(rule[0]+'を正しく入力してください');result[key]=n;});
    if(value.axleload!==null&&value.axleload!==undefined){var axle=value.axleload;if(typeof axle!=='number'||!Number.isFinite(axle)||axle<=0||axle>result.weight)throw new Error('最大軸重は総重量以下の正しい値を入力してください');result.axleload=axle;}
    result.avoidTolls=value.avoidTolls!==false;
    return result;
  }
  function cleanExtra(info,coordinateCount,label,valueValid){
    if(info===undefined)return undefined;
    if(!Array.isArray(info))throw new Error(label+'データを確認できませんでした');
    var clean=[],previousEnd=null;
    info.forEach(function(item){
      if(!Array.isArray(item)||item.length<3||!Number.isInteger(item[0])||!Number.isInteger(item[1])||!Number.isInteger(item[2])||item[0]<0||item[1]<=item[0]||item[1]>=coordinateCount||!valueValid(item[2])||(previousEnd!==null&&item[0]!==previousEnd))throw new Error(label+'データを確認できませんでした');
      clean.push([item[0],item[1],item[2]]);previousEnd=item[1];
    });
    if(clean.length&&(clean[0][0]!==0||clean[clean.length-1][1]!==coordinateCount-1))throw new Error(label+'データを確認できませんでした');
    return clean;
  }
  function route(value){
    var geometry=value&&value.geometry,summary=value&&value.summary;
    if(!geometry||geometry.type!=='LineString'||!Array.isArray(geometry.coordinates)||geometry.coordinates.length<2||geometry.coordinates.length>100000||!geometry.coordinates.every(function(c){return Array.isArray(c)&&c.length>=2&&point({lng:c[0],lat:c[1]});})||!summary||typeof summary.distance!=='number'||!Number.isFinite(summary.distance)||summary.distance<0||typeof summary.duration!=='number'||!Number.isFinite(summary.duration)||summary.duration<0)throw new Error('経路データを確認できませんでした');
    var result={geometry:{type:'LineString',coordinates:geometry.coordinates.map(function(c){return [c[0],c[1]];})},summary:{distance:summary.distance,duration:summary.duration}};
    var waycategory=cleanExtra(value&&value.waycategory,geometry.coordinates.length,'道路種別',function(v){return v>=0;});
    var tollways=cleanExtra(value&&value.tollways,geometry.coordinates.length,'有料道路',function(v){return v===0||v===1;});
    if(waycategory!==undefined)result.waycategory=waycategory;
    if(tollways!==undefined)result.tollways=tollways;
    return result;
  }
  function routeSections(value){
    var normalized=route(value),coordinates=normalized.geometry.coordinates,waycategory=normalized.waycategory||[],tollways=normalized.tollways||[],result=[],wcIndex=0,tollIndex=0;
    function spanValue(spans,index,edge){
      while(index.value<spans.length&&edge>=spans[index.value][1])index.value++;
      var item=spans[index.value];return item&&edge>=item[0]&&edge<item[1]?item[2]:0;
    }
    var wc={value:wcIndex},tw={value:tollIndex};
    for(var edge=0;edge<coordinates.length-1;edge++){
      var category=spanValue(waycategory,wc,edge),tollExtra=spanValue(tollways,tw,edge);
      var motorway=(category&1)===1,tollway=(category&2)===2||tollExtra===1,highlight=motorway||tollway,last=result[result.length-1];
      var next=[coordinates[edge+1][0],coordinates[edge+1][1]];
      if(last&&last.motorway===motorway&&last.tollway===tollway){last.coordinates.push(next);last.endEdge=edge+1;}
      else result.push({motorway:motorway,tollway:tollway,highlight:highlight,startEdge:edge,endEdge:edge+1,coordinates:[[coordinates[edge][0],coordinates[edge][1]],next]});
    }
    return result;
  }
  function polylineMeters(coordinates){
    var total=0;
    for(var i=1;i<coordinates.length;i++)total+=distanceMeters({lng:coordinates[i-1][0],lat:coordinates[i-1][1]},{lng:coordinates[i][0],lat:coordinates[i][1]});
    return total;
  }
  function routeUsage(value){
    var motorwayMeters=0,tollwayMeters=0,priorityMeters=0;
    routeSections(value).forEach(function(section){var meters=polylineMeters(section.coordinates);if(section.motorway)motorwayMeters+=meters;if(section.tollway)tollwayMeters+=meters;if(section.highlight)priorityMeters+=meters;});
    return {motorwayMeters:motorwayMeters,tollwayMeters:tollwayMeters,priorityMeters:priorityMeters};
  }
  function projectSegment(position,a,b){
    var rad=Math.PI/180,lat=((a[1]+b[1])/2)*rad,xScale=111320*Math.max(0.15,Math.cos(lat)),yScale=110540;
    var ax=(a[0]-position.lng)*xScale,ay=(a[1]-position.lat)*yScale,bx=(b[0]-position.lng)*xScale,by=(b[1]-position.lat)*yScale,dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
    var t=den>0?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/den)):0;
    var projected={lng:a[0]+(b[0]-a[0])*t,lat:a[1]+(b[1]-a[1])*t};
    return {t:t,point:projected,distance:distanceMeters(position,projected)};
  }
  function routeProgress(value,position,startEdge){
    if(!point(position))return null;
    var normalized=route(value),coordinates=normalized.geometry.coordinates,start=Math.max(0,(Number.isInteger(startEdge)?startEdge:0)-3),best=null;
    for(var edge=start;edge<coordinates.length-1;edge++){
      var projected=projectSegment(position,coordinates[edge],coordinates[edge+1]);
      if(!best||projected.distance<best.distance)best={edge:edge,t:projected.t,point:projected.point,distance:projected.distance};
    }
    return best;
  }
  function remainingRouteSections(value,progress){
    var sections=routeSections(value);
    if(!progress||!Number.isInteger(progress.edge)||!point(progress.point))return sections;
    var result=[];
    sections.forEach(function(section){
      if(section.endEdge<=progress.edge)return;
      var coordinates=section.coordinates.map(function(c){return [c[0],c[1]];});
      var startEdge=section.startEdge;
      if(progress.edge>=section.startEdge&&progress.edge<section.endEdge){
        var offset=progress.edge-section.startEdge,tail=coordinates.slice(offset+1);
        coordinates=[[progress.point.lng,progress.point.lat]].concat(tail);startEdge=progress.edge;
      }
      if(coordinates.length>=2)result.push({motorway:section.motorway,tollway:section.tollway,highlight:section.highlight,startEdge:startEdge,endEdge:section.endEdge,coordinates:coordinates});
    });
    return result;
  }
  function createClient(app){
    var destination=null,active=null,progress=null,sequence=0,controller=null,busy=false,settingsDestination=null,offRouteHits=0,offRouteSamples=[],lastAutoRerouteAt=0;
    var doc=app.document,el=function(id){return doc.getElementById(id);};
    function draw(){if(destination&&app.isDestinationCurrent&&!app.isDestinationCurrent(destination)){end();return;}app.draw(active,destination,progress);}
    function fitActive(){if(active&&destination&&typeof app.fit==='function')app.fit(active,destination,progress);}
    function navigationView(){if(typeof app.navigationView==='function')app.navigationView(active,destination,progress);}
    function cancel(){sequence++;if(controller)controller.abort();controller=null;busy=false;}
    function end(){cancel();destination=null;active=null;progress=null;offRouteHits=0;offRouteSamples=[];lastAutoRerouteAt=0;draw();navigationView();el('truckRoutePanel').classList.add('hidden');}
    function panel(message){
      el('truckRoutePanel').classList.remove('hidden');
      el('truckRouteTitle').textContent=destination?destination.name||'自販機への経路':'トラック経路';
      el('truckRouteSummary').textContent=message;
      el('truckRouteRecalculate').disabled=busy;
      el('truckRouteOverview').disabled=!active;
      el('truckRouteExternal').disabled=!destination;
    }
    function profile(){return vehicle(app.getVehicle());}
    function syncHighwayToggle(){
      var button=el('mapHighwayToggle');if(!button)return;
      var v;try{v=profile();}catch(e){button.disabled=true;button.textContent='高速\n--';button.classList.remove('active');if(button.setAttribute){button.setAttribute('aria-pressed','false');button.setAttribute('title','高速利用：車両未設定');button.setAttribute('aria-label','高速利用：車両未設定');}return;}
      var enabled=v.avoidTolls===false;button.disabled=false;button.textContent='高速\n'+(enabled?'ON':'OFF');enabled?button.classList.add('active'):button.classList.remove('active');
      if(button.setAttribute){button.setAttribute('aria-pressed',enabled?'true':'false');button.setAttribute('title','高速利用：'+(enabled?'ON':'OFF'));button.setAttribute('aria-label','高速利用：'+(enabled?'ON':'OFF'));}
    }
    function setHighwayEnabled(enabled){
      var v;try{v=profile();}catch(e){openSettings(destination);return;}
      var next=Object.assign({},v,{avoidTolls:!enabled});
      if(app.saveVehicle(next)===false){app.toast('高速設定を保存できませんでした');syncHighwayToggle();return;}
      var setting=el('truckVehicleAvoidTolls');if(setting)setting.checked=enabled;summary();
      if(destination){cancel();active=null;progress=null;offRouteHits=0;draw();calculate();}else app.toast(enabled?'高速優先をONにしました':'高速利用をOFFにしました');
    }
    function summary(){var v;try{v=profile();}catch(e){el('truckVehicleSummary').textContent='未登録：実車の寸法・総重量を設定してください';syncHighwayToggle();return;}el('truckVehicleSummary').textContent='全高 '+v.height+'m / 全幅 '+v.width+'m / 全長 '+v.length+'m / 総重量 '+v.weight+'t'+(v.axleload?' / 軸重 '+v.axleload+'t':' / 軸重未設定')+(v.avoidTolls?' / 高速OFF':' / 高速優先ON');syncHighwayToggle();}
    function openSettings(target){
      settingsDestination=target||null;var v=app.getVehicle()||{};
      ['height','width','length','weight','axleload'].forEach(function(key){el('truckVehicle_'+key).value=typeof v[key]==='number'?(key==='weight'||key==='axleload'?v[key]*1000:v[key]*100):'';});
      el('truckVehicleAvoidTolls').checked=v.avoidTolls===false;
      el('truckVehicleError').textContent='';app.openModal('truckVehicleModal');
    }
    function number(id,scale){var raw=el(id).value.trim();return raw===''?null:Number(raw)/scale;}
    function saveSettings(){
      var v;
      try{v=vehicle({height:number('truckVehicle_height',100),width:number('truckVehicle_width',100),length:number('truckVehicle_length',100),weight:number('truckVehicle_weight',1000),axleload:number('truckVehicle_axleload',1000),avoidTolls:!el('truckVehicleAvoidTolls').checked});}
      catch(e){el('truckVehicleError').textContent=e.message;return;}
      if(app.saveVehicle(v)===false){el('truckVehicleError').textContent='保存できませんでした。端末の保存領域を確認してください';return;}summary();app.closeModal('truckVehicleModal');var target=settingsDestination;settingsDestination=null;
      end();app.toast('車両設定を保存しました');if(target)start(target);
    }
    function getPosition(signal){
      var cached=app.getPosition();
      if(point(cached)&&Date.now()-cached.updatedAt<=5000&&typeof cached.accuracy==='number'&&cached.accuracy>=0&&cached.accuracy<=50)return Promise.resolve(cached);
      return new Promise(function(resolve,reject){
        if(!app.geolocation){reject(new Error('現在地を取得できません。位置情報を許可してください'));return;}
        var done=false,timer;
        function finish(error,value){if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);error?reject(error):resolve(value);}
        function abort(){finish(new Error('cancelled'));}
        signal.addEventListener('abort',abort,{once:true});
        timer=setTimeout(function(){finish(new Error('現在地の取得がタイムアウトしました'));},12000);
        app.geolocation.getCurrentPosition(function(p){var next={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,updatedAt:Date.now()};if(!point(next)||typeof next.accuracy!=='number'||!Number.isFinite(next.accuracy)||next.accuracy<0||next.accuracy>50){finish(new Error('現在地の精度が不足しています。屋外で再計算してください'));return;}app.updatePosition(p);finish(null,next);},function(){finish(new Error('現在地を取得できません。位置情報を許可してください'));},{enableHighAccuracy:true,maximumAge:0,timeout:10000});
      });
    }
    function routeSummary(v){
      var usage=routeUsage(active),label=usage.motorwayMeters>100?'高速 約'+(usage.motorwayMeters/1000).toFixed(1)+'km':usage.priorityMeters>100?'有料 約'+(usage.priorityMeters/1000).toFixed(1)+'km':'高速・有料区間なし';
      return (active.summary.distance/1000).toFixed(1)+'km ・ 約'+Math.max(1,Math.ceil(active.summary.duration/60))+'分（渋滞未考慮） ・ '+label+' ・ '+(v.avoidTolls?'高速利用OFF':'高速優先ON');
    }
    function median(values){var sorted=values.slice().sort(function(a,b){return a-b}),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;}
    function stableOffRouteOrigin(samples){var valid=samples.filter(point);if(!valid.length)return null;return {lat:median(valid.map(function(p){return p.lat})),lng:median(valid.map(function(p){return p.lng})),accuracy:median(valid.map(function(p){return typeof p.accuracy==='number'&&Number.isFinite(p.accuracy)?p.accuracy:50})),updatedAt:Math.max.apply(null,valid.map(function(p){return p.updatedAt||Date.now()}))};}
    function remainingMeters(value,currentProgress){var total=0;remainingRouteSections(value,currentProgress).forEach(function(section){total+=polylineMeters(section.coordinates)});return total;}
    async function calculate(options){
      options=options&&typeof options==='object'?options:{};
      if(!destination||busy)return;
      if(app.isDestinationCurrent&&!app.isDestinationCurrent(destination)){end();app.toast('目的地の位置が変わったため経路を終了しました');return;}
      var v;try{v=profile();}catch(e){var target=destination;end();openSettings(target);return;}
      var auto=options.auto===true,previousActive=active,previousProgress=progress;
      cancel();busy=true;if(!auto){active=null;progress=null;draw();}controller=new AbortController();var signal=controller.signal,token=sequence;
      panel(auto?'ルートを再検索中…':'現在地を取得中…');
      var timer=null;
      try{
        var origin=point(options.origin)?options.origin:await getPosition(signal);if(token!==sequence)return;
        if(!auto)panel('車両条件に合う経路を取得中…');
        timer=setTimeout(function(){if(token===sequence)controller.abort();},ROUTE_REQUEST_TIMEOUT_MS);
        var requestBody={origin:{lat:origin.lat,lng:origin.lng},destination:{lat:destination.lat,lng:destination.lng},vehicle:v},rerouteHeading=auto?normalizeHeading(options.heading):null;if(rerouteHeading!==null)requestBody.heading=rerouteHeading;
        var response=await app.fetch(app.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(requestBody),signal:signal});
        var data=await response.json();clearTimeout(timer);timer=null;if(token!==sequence)return;
        if(!response.ok||!data.ok)throw new Error(data&&typeof data.message==='string'?data.message:'経路を取得できませんでした');
        var nextRoute=route(data.route);
        if(auto&&previousActive){
          var baseline=remainingMeters(previousActive,previousProgress)+(previousProgress&&point(previousProgress.point)?distanceMeters(origin,previousProgress.point):0),detourLimit=baseline+Math.max(3000,baseline*0.5);
          if(baseline>500&&nextRoute.summary.distance>detourLimit){active=previousActive;progress=previousProgress;offRouteHits=0;offRouteSamples=[];draw();navigationView();panel('再検索した経路が大きく迂回するため、現在の経路を保持しています');app.toast('大きく迂回する再検索結果を採用しませんでした');return;}
        }
        active=nextRoute;progress=null;offRouteHits=0;offRouteSamples=[];draw();if(!auto)fitActive();navigationView();if(auto)app.toast('新しい経路に更新しました');
        panel(routeSummary(v));
      }catch(e){
        if(token!==sequence)return;
        if(auto){active=previousActive;progress=previousProgress;draw();navigationView();panel('ルート再検索に失敗しました。現在の経路を表示しています');}
        else{active=null;progress=null;draw();panel(signal.aborted?'経路の取得がタイムアウトしました。再計算してください':e.message==='Failed to fetch'?'通信できません。接続を確認して再計算してください':e.message||'経路を取得できませんでした');}
      }finally{clearTimeout(timer);if(token===sequence){busy=false;controller=null;el('truckRouteRecalculate').disabled=false;}}
    }
    function onPosition(position){
      if(!active||!destination||busy||!point(position))return;
      var accuracy=typeof position.accuracy==='number'&&Number.isFinite(position.accuracy)?position.accuracy:Infinity;
      if(accuracy>50)return;
      if(distanceMeters(position,destination)<=100){var arrived=destination;offRouteHits=0;end();app.toast('目的地付近に到着しました');if(typeof app.onArrival==='function')app.onArrival(arrived,position);return;}
      var match=routeProgress(active,position,progress?progress.edge:0);if(!match)return;
      var snapThreshold=Math.max(25,Math.min(50,accuracy*1.5+10)),offThreshold=Math.max(60,Math.min(100,accuracy*2+20));
      if(match.distance<=snapThreshold){
        offRouteHits=0;offRouteSamples=[];
        if(!progress||match.edge>progress.edge||(match.edge===progress.edge&&match.t>progress.t+0.01)){progress=match;draw();}
        navigationView();return;
      }
      if(match.distance>offThreshold){offRouteHits++;offRouteSamples.push(position);if(offRouteSamples.length>3)offRouteSamples.shift();}else{offRouteHits=0;offRouteSamples=[];}
      if(offRouteHits>=3&&offRouteSamples.length>=3&&Date.now()-lastAutoRerouteAt>=30000){
        var stableOrigin=stableOffRouteOrigin(offRouteSamples),rerouteHeading=stableTravelHeading(offRouteSamples);offRouteHits=0;offRouteSamples=[];lastAutoRerouteAt=Date.now();app.toast('ルートを再検索します');if(stableOrigin)calculate({auto:true,origin:stableOrigin,heading:rerouteHeading});
      }
    }
    function start(target){
      if(!point(target)){app.toast('目的地の位置を先に登録してください');return;}
      var copy={lat:target.lat,lng:target.lng,name:target.name,id:target.id,kind:target.kind==='office'?'office':'machine'};
      try{profile();}catch(e){openSettings(copy);return;}
      if(!app.showMap()){app.toast('地図を読み込めませんでした');return;}
      end();destination=copy;calculate();
    }
    function init(){
      el('truckVehicleSettings').onclick=function(){openSettings(null);};
      el('truckRouteVehicleSettings').onclick=function(){openSettings(destination);};
      el('truckVehicleSave').onclick=saveSettings;
      ['truckVehicleClose','truckVehicleCancel'].forEach(function(id){el(id).onclick=function(){settingsDestination=null;app.closeModal('truckVehicleModal');};});
      el('truckRouteRecalculate').onclick=function(){calculate();};el('truckRouteEnd').onclick=end;
      el('mapHighwayToggle').onclick=function(){var v;try{v=profile();}catch(e){openSettings(destination);return;}setHighwayEnabled(v.avoidTolls!==false);};
      el('truckRouteOverview').onclick=fitActive;
      el('truckRouteExternal').onclick=function(){if(destination)app.external(destination);};
      summary();syncHighwayToggle();
    }
    return {init:init,start:start,end:end,onPosition:onPosition,redraw:draw,fitActive:fitActive,refreshNavigationView:navigationView,isBusy:function(){return busy;},refreshVehicle:function(){summary();syncHighwayToggle();}};
  }
  return {assetVersion:ASSET_VERSION,point:point,vehicle:vehicle,route:route,routeSections:routeSections,routeUsage:routeUsage,routeProgress:routeProgress,remainingRouteSections:remainingRouteSections,distanceMeters:distanceMeters,bearing:bearing,resolveHeading:resolveHeading,stableTravelHeading:stableTravelHeading,nextTurnMeters:nextTurnMeters,navigationZoomTarget:navigationZoomTarget,createClient:createClient};
});

