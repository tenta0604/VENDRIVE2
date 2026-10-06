(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.VENDRIVETruckRouting=factory();
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var fields={height:['全高',0.5,6],width:['全幅',0.5,4],length:['全長',1,30],weight:['車両総重量',0.5,60]};
  function point(value){return !!value&&typeof value.lat==='number'&&Number.isFinite(value.lat)&&Math.abs(value.lat)<=90&&typeof value.lng==='number'&&Number.isFinite(value.lng)&&Math.abs(value.lng)<=180;}
  function vehicle(value){
    if(!value||typeof value!=='object')throw new Error('車検証などで確認した車両の寸法・総重量を登録してください');
    var result={};
    Object.keys(fields).forEach(function(key){var rule=fields[key],n=value[key];if(typeof n!=='number'||!Number.isFinite(n)||n<rule[1]||n>rule[2])throw new Error(rule[0]+'を正しく入力してください');result[key]=n;});
    if(value.axleload!==null&&value.axleload!==undefined){var axle=value.axleload;if(typeof axle!=='number'||!Number.isFinite(axle)||axle<=0||axle>result.weight)throw new Error('最大軸重は総重量以下の正しい値を入力してください');result.axleload=axle;}
    result.avoidTolls=value.avoidTolls!==false;
    return result;
  }
  function route(value){
    var geometry=value&&value.geometry,summary=value&&value.summary;
    if(!geometry||geometry.type!=='LineString'||!Array.isArray(geometry.coordinates)||geometry.coordinates.length<2||geometry.coordinates.length>100000||!geometry.coordinates.every(function(c){return Array.isArray(c)&&c.length>=2&&point({lng:c[0],lat:c[1]});})||!summary||typeof summary.distance!=='number'||!Number.isFinite(summary.distance)||summary.distance<0||typeof summary.duration!=='number'||!Number.isFinite(summary.duration)||summary.duration<0)throw new Error('経路データを確認できませんでした');
    return {geometry:{type:'LineString',coordinates:geometry.coordinates.map(function(c){return [c[0],c[1]];})},summary:{distance:summary.distance,duration:summary.duration}};
  }
  function createClient(app){
    var destination=null,active=null,sequence=0,controller=null,busy=false,settingsDestination=null;
    var doc=app.document,el=function(id){return doc.getElementById(id);};
    function draw(){if(destination&&app.isDestinationCurrent&&!app.isDestinationCurrent(destination)){end();return;}app.draw(active,destination);}
    function cancel(){sequence++;if(controller)controller.abort();controller=null;busy=false;}
    function end(){cancel();destination=null;active=null;draw();el('truckRoutePanel').classList.add('hidden');}
    function panel(message){
      el('truckRoutePanel').classList.remove('hidden');
      el('truckRouteTitle').textContent=destination?destination.name||'自販機への経路':'トラック経路';
      el('truckRouteSummary').textContent=message;
      el('truckRouteRecalculate').disabled=busy;
      el('truckRouteOverview').disabled=!active;
      el('truckRouteExternal').disabled=!destination;
    }
    function profile(){return vehicle(app.getVehicle());}
    function summary(){var v;try{v=profile();}catch(e){el('truckVehicleSummary').textContent='未登録：実車の寸法・総重量を設定してください';return;}el('truckVehicleSummary').textContent='全高 '+v.height+'m / 全幅 '+v.width+'m / 全長 '+v.length+'m / 総重量 '+v.weight+'t'+(v.axleload?' / 軸重 '+v.axleload+'t':' / 軸重未設定');}
    function openSettings(target){
      settingsDestination=target||null;var v=app.getVehicle()||{};
      ['height','width','length','weight','axleload'].forEach(function(key){el('truckVehicle_'+key).value=typeof v[key]==='number'?(key==='weight'||key==='axleload'?v[key]*1000:v[key]*100):'';});
      el('truckVehicleAvoidTolls').checked=v.avoidTolls!==false;
      el('truckVehicleError').textContent='';app.openModal('truckVehicleModal');
    }
    function number(id,scale){var raw=el(id).value.trim();return raw===''?null:Number(raw)/scale;}
    function saveSettings(){
      var v;
      try{v=vehicle({height:number('truckVehicle_height',100),width:number('truckVehicle_width',100),length:number('truckVehicle_length',100),weight:number('truckVehicle_weight',1000),axleload:number('truckVehicle_axleload',1000),avoidTolls:el('truckVehicleAvoidTolls').checked});}
      catch(e){el('truckVehicleError').textContent=e.message;return;}
      if(app.saveVehicle(v)===false){el('truckVehicleError').textContent='保存できませんでした。端末の保存領域を確認してください';return;}summary();app.closeModal('truckVehicleModal');var target=settingsDestination;settingsDestination=null;
      // A profile edit invalidates all geometry computed for the old vehicle.
      end();app.toast('車両設定を保存しました');if(target)start(target);
    }
    function getPosition(signal){
      var cached=app.getPosition();
      if(point(cached)&&Date.now()-cached.updatedAt<=15000&&typeof cached.accuracy==='number'&&cached.accuracy>=0&&cached.accuracy<=100)return Promise.resolve(cached);
      return new Promise(function(resolve,reject){
        if(!app.geolocation){reject(new Error('現在地を取得できません。位置情報を許可してください'));return;}
        var done=false,timer;
        function finish(error,value){if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);error?reject(error):resolve(value);}
        function abort(){finish(new Error('cancelled'));}
        signal.addEventListener('abort',abort,{once:true});
        timer=setTimeout(function(){finish(new Error('現在地の取得がタイムアウトしました'));},12000);
        app.geolocation.getCurrentPosition(function(p){var next={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,updatedAt:Date.now()};if(!point(next)||typeof next.accuracy!=='number'||!Number.isFinite(next.accuracy)||next.accuracy<0||next.accuracy>100){finish(new Error('現在地の精度が不足しています。屋外で再計算してください'));return;}app.updatePosition(p);finish(null,next);},function(){finish(new Error('現在地を取得できません。位置情報を許可してください'));},{enableHighAccuracy:true,maximumAge:5000,timeout:10000});
      });
    }
    async function calculate(){
      if(!destination||busy)return;
      if(app.isDestinationCurrent&&!app.isDestinationCurrent(destination)){end();app.toast('目的地の位置が変わったため経路を終了しました');return;}
      var v;try{v=profile();}catch(e){var target=destination;end();openSettings(target);return;}
      cancel();busy=true;active=null;draw();controller=new AbortController();var signal=controller.signal,token=sequence;
      panel('現在地を取得中…');
      var timer=null;
      try{
        var origin=await getPosition(signal);if(token!==sequence)return;
        panel('車両条件に合う経路を取得中…');
        timer=setTimeout(function(){if(token===sequence)controller.abort();},15000);
        var response=await app.fetch(app.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({origin:{lat:origin.lat,lng:origin.lng},destination:{lat:destination.lat,lng:destination.lng},vehicle:v}),signal:signal});
        var data=await response.json();if(token!==sequence)return;
        if(!response.ok||!data.ok)throw new Error(data&&typeof data.message==='string'?data.message:'経路を取得できませんでした');
        active=route(data.route);draw();app.fit(active,destination);
        panel((active.summary.distance/1000).toFixed(1)+'km ・ 約'+Math.max(1,Math.ceil(active.summary.duration/60))+'分（渋滞未考慮）');
      }catch(e){if(token!==sequence)return;active=null;draw();panel(signal.aborted?'経路の取得がタイムアウトしました。再計算してください':e.message==='Failed to fetch'?'通信できません。接続を確認して再計算してください':e.message||'経路を取得できませんでした');}
      finally{clearTimeout(timer);if(token===sequence){busy=false;controller=null;el('truckRouteRecalculate').disabled=false;}}
    }
    function start(target){
      if(!point(target)){app.toast('自販機の位置を先に登録してください');return;}
      var copy={lat:target.lat,lng:target.lng,name:target.name,id:target.id};
      try{profile();}catch(e){openSettings(copy);return;}
      if(!app.showMap()){app.toast('地図を読み込めませんでした');return;}
      end();destination=copy;calculate();
    }
    function init(){
      el('truckVehicleSettings').onclick=function(){openSettings(null);};
      el('truckRouteVehicleSettings').onclick=function(){openSettings(destination);};
      el('truckVehicleSave').onclick=saveSettings;
      ['truckVehicleClose','truckVehicleCancel'].forEach(function(id){el(id).onclick=function(){settingsDestination=null;app.closeModal('truckVehicleModal');};});
      el('truckRouteRecalculate').onclick=calculate;el('truckRouteEnd').onclick=end;
      el('truckRouteOverview').onclick=function(){if(active)app.fit(active,destination);};
      el('truckRouteExternal').onclick=function(){if(destination)app.external(destination);};
      summary();
    }
    return {init:init,start:start,end:end,redraw:draw,refreshVehicle:summary};
  }
  return {point:point,vehicle:vehicle,route:route,createClient:createClient};
});

