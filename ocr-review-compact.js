(function(global){
"use strict";
var STYLE_ID="vendrive-compact-ocr-review-style";
function el(tag,className,text){var n=document.createElement(tag);if(className)n.className=className;if(text!==undefined&&text!==null)n.textContent=String(text);return n}
function clone(v){return JSON.parse(JSON.stringify(v))}
function ensureStyle(){
  if(document.getElementById(STYLE_ID))return;
  var s=el("style");s.id=STYLE_ID;s.textContent=[
    ".vdrCompact{display:grid;gap:10px;margin-top:10px}",
    ".vdrCompactCard{border:1px solid #e2e4e7;border-radius:14px;background:#fff;padding:12px;min-width:0}",
    ".vdrCompactTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}",
    ".vdrCompactTitle{font-size:13px;font-weight:950}",
    ".vdrCompactSub{font-size:9px;color:#73777d;line-height:1.45;margin-top:3px}",
    ".vdrCompactBadge{border-radius:999px;padding:5px 8px;font-size:9px;font-weight:900;white-space:nowrap;background:#ecfdf3;color:#166534}",
    ".vdrCompactBadge.warn{background:#fff7ed;color:#9a3412}.vdrCompactBadge.error{background:#fff1f2;color:#b42318}",
    ".vdrCompactMeta{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}",
    ".vdrCompactMeta>div{background:#f7f7f8;border-radius:10px;padding:8px;min-width:0}",
    ".vdrCompactMeta span{display:block;font-size:8px;color:#777}.vdrCompactMeta b{display:block;font-size:11px;margin-top:2px;overflow-wrap:anywhere}",
    ".vdrCompactMeta .warn{color:#b42318}",
    ".vdrCompactSection{font-size:10px;font-weight:950;margin:1px 0 5px}",
    ".vdrCompactTable{display:grid;gap:4px}",
    ".vdrCompactRow{display:grid;grid-template-columns:minmax(54px,72px) minmax(0,1fr) minmax(38px,54px);gap:7px;align-items:center;border-bottom:1px solid #f0f0f1;padding:6px 2px;font-size:10px;min-width:0}",
    ".vdrCompactRow:last-child{border-bottom:0}.vdrCompactRow span{min-width:0;overflow-wrap:anywhere}.vdrCompactItemCode{font-size:9.5px;color:#34373b;font-weight:650}.vdrCompactItemName{font-size:11px;line-height:1.35;font-weight:800;letter-spacing:0}.vdrCompactItemQty{text-align:right;font-size:10.5px;font-weight:900;white-space:nowrap}",
    ".vdrCompactRow.warn{background:#fff7ed;color:#9a3412;border-radius:8px;padding:7px}.vdrCompactRow.error{background:#fff1f2;color:#b42318;border-radius:8px;padding:7px}",
    ".vdrCompactIssues{display:grid;gap:5px}.vdrCompactIssue{font-size:10px;line-height:1.45;border-radius:9px;padding:8px;background:#fff7ed;color:#9a3412}",
    ".vdrCompactIssue.error{background:#fff1f2;color:#b42318;font-weight:800}",
    ".vdrCompactMachine{display:flex;justify-content:space-between;gap:8px;align-items:center}.vdrCompactMachineText{min-width:0}.vdrCompactMachineText b{font-size:11px}.vdrCompactMachineText span{display:block;font-size:9px;color:#70747a;margin-top:2px;overflow-wrap:anywhere}",
    ".vdrCompactActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.vdrCompactButton{border:1px solid #d7d9dd;border-radius:11px;background:#fff;padding:10px;font-size:10px;font-weight:900}.vdrCompactButton.primary{background:#111;color:#fff;border-color:#111}.vdrCompactButton:disabled{opacity:.4}",
    ".vdrCompactApproval{display:flex;gap:8px;align-items:flex-start;font-size:9px;font-weight:800;line-height:1.45;padding:9px;background:#fafafa;border-radius:10px}",
    ".vdrCompactStatus{font-size:9px;color:#666;line-height:1.5}.vdrCompactDetail[hidden]{display:none!important}",
    ".vdrCompactDetail{border-top:1px solid #ececef;padding-top:10px}.vdrCompactMuted{font-size:9px;color:#777}",
    "@media(max-width:350px){.vdrCompactMeta{grid-template-columns:1fr 1fr}.vdrCompactActions{grid-template-columns:1fr}.vdrCompactRow{grid-template-columns:58px minmax(0,1fr) 44px}.vdrCompactItemName{font-size:10.5px}}"
  ].join("");document.head.appendChild(s);
}
function typeLabel(type){return {sales:"売上",input:"投入",recovery:"回収",input_recovery:"投入＋回収"}[type]||"未判定"}
function tempLabel(v){return v==="HOT"?"温":v==="COLD"?"冷":"—"}
function timeLabel(v){if(!v)return"—";var m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);return m?m[2]+"/"+m[3]+" "+m[4]+":"+m[5]:v}
function firstPaper(review,type){
  var p=review.candidatePayload||{};
  if(type==="input_recovery")return p.input&&p.input.paper||p.recovery&&p.recovery.paper||{};
  return p.paper||{};
}
function benignWarning(w){return w==="ocr_provider_fallback_used"}
function addIssue(out,key,message,severity){out.push({key:key,message:message,severity:severity||"warn"})}
function uncertainKeys(review){
  var out={};((review.ocr&&review.ocr.warnings)||[]).forEach(function(w){
    if(typeof w!=="string"||w.indexOf("uncertain:")!==0)return;
    out[w.slice(10)]=true;
  });return out;
}
function isUncertain(map,keys){return keys.some(function(k){return !!map[k]})}
function issuesFor(review,type){
  var out=[],uncertain=uncertainKeys(review),identity=review.identity||{},p=review.candidatePayload||{};
  if(!identity.occurredAt)addIssue(out,"occurredAt","帳票日時を確認してください","error");
  if(!identity.makerKey)addIssue(out,"makerKey","メーカーを確認してください","error");
  if(!identity.vendorNumber)addIssue(out,"vendorNumber","ベンダー番号を確認してください","error");
  if(isUncertain(uncertain,["occurredAt"]))addIssue(out,"occurredAt","帳票日時の読み取りが不確かです");
  if(isUncertain(uncertain,["makerKey"]))addIssue(out,"makerKey","メーカーの読み取りが不確かです");
  if(isUncertain(uncertain,["vendorNumber"]))addIssue(out,"vendorNumber","ベンダー番号の読み取りが不確かです");
  var mm=review.machineMatch;
  if(mm){
    if(mm.status==="confirmed_mapping"){}
    else if(mm.status==="management_match")addIssue(out,"machine","登録自販機の候補があります。紐づけを確認してください");
    else if(mm.status==="confirmed_mapping_conflict"||mm.status==="ambiguous_management_match"||mm.status==="stale_confirmed_mapping")addIssue(out,"machine","自販機の紐づけに競合があります","error");
    else if(mm.status==="no_match")addIssue(out,"machine","登録自販機との一致を確認できませんでした");
    else if(mm.status==="unavailable")addIssue(out,"machine","自販機照合を実行できませんでした");
  }
  function itemIssues(items,prefix,kind){
    if(!Array.isArray(items)||!items.length){addIssue(out,prefix,"商品行がありません","error");return}
    items.forEach(function(item,i){
      var base=prefix+"."+i;
      if(!item.productCode)addIssue(out,base,"商品"+(i+1)+"の商品コードを確認してください","error");
      if(!item.printedName)addIssue(out,base,"商品"+(i+1)+"の商品名を確認してください");
      if(kind==="sales"&&(!Number.isInteger(item.salesQty)||item.salesQty<0))addIssue(out,base,"商品"+(i+1)+"の売上数を確認してください","error");
      if(kind!=="sales"&&(!Number.isInteger(item.quantity)||item.quantity<0))addIssue(out,base,"商品"+(i+1)+"の数量を確認してください","error");
      Object.keys(uncertain).forEach(function(path){if(path===base||path.indexOf(base+".")===0||path===base.replace(/^input\.|^recovery\./,""))addIssue(out,base,"商品"+(i+1)+"に読み取り要確認項目があります")});
    });
  }
  if(type==="sales"){
    itemIssues(p.products,"products","sales");
    if(Array.isArray(p.products)){
      var q=0,a=0,valid=true;p.products.forEach(function(x){if(!Number.isInteger(x.salesQty)||!Number.isInteger(x.price)){valid=false;return}q+=x.salesQty;a+=x.salesQty*x.price});
      if(valid&&q!==p.totalQty)addIssue(out,"totalQty","売上数合計が商品行と一致していません","error");
      if(valid&&a!==p.totalAmount)addIssue(out,"totalAmount","売上金額が商品行と一致していません","error");
    }
  }else{
    var input=type==="input"?p:type==="input_recovery"?p.input:null,recovery=type==="recovery"?p:type==="input_recovery"?p.recovery:null;
    if(input){
      itemIssues(input.items,type==="input_recovery"?"input.items":"items","input");
      var iq=Array.isArray(input.items)?input.items.reduce(function(n,x){return n+(Number.isInteger(x.quantity)?x.quantity:0)},0):0;
      if(iq!==input.totalQty)addIssue(out,"inputTotal","投入合計が商品行と一致していません","error");
    }
    if(recovery){
      itemIssues(recovery.items,type==="input_recovery"?"recovery.items":"items","recovery");
      (recovery.items||[]).forEach(function(x,i){if(Number.isInteger(x.caseCount)&&x.caseCount>0&&(!Number.isInteger(x.quantity)||x.quantity<=x.looseCount))addIssue(out,(type==="input_recovery"?"recovery.items":"items")+"."+i,"ケース分を含む在庫反映単位数を確認してください","error")});
    }
  }
  ((review.ocr&&review.ocr.warnings)||[]).filter(function(w){return typeof w==="string"&&!benignWarning(w)&&w.indexOf("uncertain:")!==0}).forEach(function(w){addIssue(out,"ocr","OCR警告: "+w)});
  var seen={};return out.filter(function(x){var k=x.key+"|"+x.message;if(seen[k])return false;seen[k]=true;return true});
}
function hasIssue(issues,key){var sev=null;issues.forEach(function(x){if(x.key===key||x.key.indexOf(key+".")===0||key.indexOf(x.key+".")===0){if(x.severity==="error")sev="error";else if(!sev)sev="warn"}});return sev}
function row(parent,code,name,qty,severity){
  var r=el("div","vdrCompactRow"+(severity?" "+severity:""));r.appendChild(el("span","vdrCompactItemCode",code||"—"));r.appendChild(el("span","vdrCompactItemName",name||"—"));r.appendChild(el("span","vdrCompactItemQty",qty));parent.appendChild(r)
}
function machineInfo(review){
  var mm=review.machineMatch||null;if(!mm)return null;
  var candidates=Array.isArray(mm.candidates)?mm.candidates:[],candidate=null;
  if(mm.confirmedMapping)candidate=candidates.find(function(c){return c.machineId===mm.confirmedMapping.machineId})||null;
  if(!candidate&&candidates.length===1)candidate=candidates[0];
  return {match:mm,candidate:candidate,machine:candidate&&candidate.machine||null}
}
function mount(container,review){
  ensureStyle();container.innerHTML="";
  var type=review&&review.classification&&review.classification.effectiveType;
  if(["sales","input","recovery","input_recovery"].indexOf(type)<0||!review.candidatePayload){container.appendChild(el("div","vdrCompactCard","確認できるOCR候補がありません。"));return {mounted:false}}
  var issues=issuesFor(review,type),errors=issues.filter(function(x){return x.severity==="error"}),root=el("div","vdrCompact"),card=el("div","vdrCompactCard"),top=el("div","vdrCompactTop"),titleWrap=el("div"),confidence=review.classification&&typeof review.classification.typeConfidence==="number"?Math.round(review.classification.typeConfidence*100)+"%":"—";
  titleWrap.appendChild(el("div","vdrCompactTitle",typeLabel(type)+"帳票"));
  titleWrap.appendChild(el("div","vdrCompactSub","帳票種別の判定 "+confidence+" · 全項目を一覧で確認できます"));
  top.appendChild(titleWrap);top.appendChild(el("span","vdrCompactBadge"+(errors.length?" error":issues.length?" warn":""),errors.length?"要修正 "+errors.length+"件":issues.length?"要確認 "+issues.length+"件":"確認可能"));card.appendChild(top);
  var meta=el("div","vdrCompactMeta"),paper=firstPaper(review,type);
  [["日時",timeLabel(review.identity&&review.identity.occurredAt),"occurredAt"],["ベンダー",review.identity&&review.identity.vendorNumber||"—","vendorNumber"],["設置先",paper.locationName||"—","locationName"],["担当者",paper.operatorName||"—","operatorName"]].forEach(function(v){var box=el("div"),sev=hasIssue(issues,v[2]);box.appendChild(el("span","",v[0]));box.appendChild(el("b",sev?sev:"",v[1]));meta.appendChild(box)});card.appendChild(meta);root.appendChild(card);

  var mi=machineInfo(review),machineCard=el("div","vdrCompactCard"),machineFlex=el("div","vdrCompactMachine"),machineText=el("div","vdrCompactMachineText"),machineSev=hasIssue(issues,"machine");
  if(mi&&mi.match.status==="confirmed_mapping"&&mi.machine){machineText.appendChild(el("b","", "✓ "+(mi.machine.name||mi.machine.id)));machineText.appendChild(el("span","", "登録自販機と一致 · "+(mi.machine.managementCodeKey||review.identity.vendorNumber||"")))}
  else if(mi&&mi.candidate&&mi.machine){machineText.appendChild(el("b",machineSev||"","候補: "+(mi.machine.name||mi.machine.id)));machineText.appendChild(el("span","", "管理番号 "+(mi.machine.managementCodeKey||review.identity.vendorNumber||"")+" · 未確定"))}
  else{machineText.appendChild(el("b",machineSev||"","登録自販機: 未確認"));machineText.appendChild(el("span","",review.identity&&review.identity.vendorNumber?"一致する登録先を確認してください":"ベンダー番号が必要です"))}
  machineFlex.appendChild(machineText);
  if(mi&&mi.match.status==="management_match"&&mi.candidate&&mi.machine){
    var link=el("button","vdrCompactButton","この自販機と紐づける");link.type="button";link.onclick=function(){
      var api=global.VENDRIVE2Analytics;if(!api||!api.data||!api.data.machineLinks)return;
      link.disabled=true;link.textContent="紐づけ中…";
      Promise.resolve(api.data.machineLinks.put({makerKey:review.identity.makerKey,vendorNumber:review.identity.vendorNumber,machineId:mi.candidate.machineId})).then(function(){
        review.identity.machineId=mi.candidate.machineId;return api.bridge.findMachineCandidates({makerKey:review.identity.makerKey,vendorNumber:review.identity.vendorNumber})
      }).then(function(match){review.machineMatch=match;mount(container,review)}).catch(function(){link.disabled=false;link.textContent="紐づけに失敗 · 再試行"});
    };machineFlex.appendChild(link)
  }
  machineCard.appendChild(machineFlex);root.appendChild(machineCard);

  function section(label,items,kind,prefix){
    var c=el("div","vdrCompactCard"),h=el("div","vdrCompactSection",label),table=el("div","vdrCompactTable");c.appendChild(h);
    (items||[]).forEach(function(item,i){var key=prefix+"."+i,sev=hasIssue(issues,key),qty=kind==="sales"?String(item.salesQty)+"本":kind==="recovery"?(String(item.caseCount||0)+"箱 / "+String(item.looseCount||0)+"本"):(String(item.quantity)+"本");row(table,item.productCode,item.printedName+" · "+tempLabel(item.temperature),qty,sev)});
    if(!(items||[]).length)table.appendChild(el("div","vdrCompactMuted","商品行なし"));
    c.appendChild(table);root.appendChild(c)
  }
  var p=review.candidatePayload;
  if(type==="sales"){
    section("商品別売上",p.products,"sales","products");
    var tc=el("div","vdrCompactCard"),sevQ=hasIssue(issues,"totalQty"),sevA=hasIssue(issues,"totalAmount"),tm=el("div","vdrCompactMeta");
    [["売上数合計",(p.totalQty||0)+"本",sevQ],["売上金額",(p.totalAmount||0).toLocaleString("ja-JP")+"円",sevA]].forEach(function(v){var b=el("div"),x=el("b",v[2]||"",v[1]);b.appendChild(el("span","",v[0]));b.appendChild(x);tm.appendChild(b)});tc.appendChild(tm);root.appendChild(tc)
  }else{
    var inp=type==="input"?p:type==="input_recovery"?p.input:null,rec=type==="recovery"?p:type==="input_recovery"?p.recovery:null;
    if(inp)section("投入",inp.items,"input",type==="input_recovery"?"input.items":"items");
    if(rec)section("回収",rec.items,"recovery",type==="input_recovery"?"recovery.items":"items");
    if(inp){var it=el("div","vdrCompactCard"),im=el("div","vdrCompactMeta"),ib=el("div"),is=hasIssue(issues,"inputTotal");ib.appendChild(el("span","","投入合計"));ib.appendChild(el("b",is||"",String(inp.totalQty||0)+"本"));im.appendChild(ib);it.appendChild(im);root.appendChild(it)}
  }

  if(issues.length){
    var ic=el("div","vdrCompactCard"),list=el("div","vdrCompactIssues");ic.appendChild(el("div","vdrCompactSection","確認ポイント"));
    issues.forEach(function(x){list.appendChild(el("div","vdrCompactIssue"+(x.severity==="error"?" error":""),(x.severity==="error"?"⚠ ":"")+" "+x.message))});ic.appendChild(list);root.appendChild(ic)
  }

  var actionsCard=el("div","vdrCompactCard"),detail=el("div","vdrCompactDetail");detail.hidden=true;
  var actions=el("div","vdrCompactActions"),edit=el("button","vdrCompactButton",issues.length?"要確認箇所を修正":"編集する");edit.type="button";actions.appendChild(edit);
  var approvalWrap=el("label","vdrCompactApproval"),approval=document.createElement("input");approval.type="checkbox";approvalWrap.appendChild(approval);approvalWrap.appendChild(el("span","","一覧を実紙と照合し、この内容をAnalyticsの下書きとして保存してよいことを確認しました。"));
  var save=el("button","vdrCompactButton primary","この内容で下書きを作成");save.type="button";save.disabled=true;actions.appendChild(save);
  actionsCard.appendChild(actions);actionsCard.appendChild(approvalWrap);var status=el("div","vdrCompactStatus",errors.length?"赤い要修正項目があるため、修正してから保存してください。":"まだ保存されていません。自動確定・在庫変動・legacyデータ変更は行いません。");actionsCard.appendChild(status);actionsCard.appendChild(detail);root.appendChild(actionsCard);
  function update(){save.disabled=errors.length>0||!approval.checked}
  approval.onchange=update;
  edit.onclick=function(){
    if(detail.hidden){
      detail.hidden=false;edit.textContent="編集画面を閉じる";detail.innerHTML="";
      var editor=type==="sales"?global.VENDRIVE2SalesReview:global.VENDRIVE2InputRecoveryReview;
      if(editor&&typeof editor.mount==="function")editor.mount(detail,review);else detail.appendChild(el("div","vdrCompactMuted","編集画面を利用できません"));
      setTimeout(function(){try{detail.scrollIntoView({behavior:"smooth",block:"start"})}catch(error){}},0)
    }else{detail.hidden=true;edit.textContent=issues.length?"要確認箇所を修正":"編集する"}
  };
  save.onclick=function(){
    if(save.disabled)return;var api=global.VENDRIVE2Analytics;if(!api||!api.capture||typeof api.capture.createDraftFromReview!=="function")return;
    save.disabled=true;status.textContent="下書きを作成しています…";
    Promise.resolve(api.capture.createDraftFromReview({review:clone(review),userApproved:true,visitId:null})).then(function(result){
      approval.disabled=true;edit.disabled=true;save.disabled=true;status.textContent="下書きを作成しました"+(result&&result.report&&result.report.id?"（ID: "+result.report.id+"）":"")+"。自動確定・在庫変動は行っていません。";
    }).catch(function(error){status.textContent="下書きを作成できませんでした："+(error&&error.message?error.message:"内容を確認してください");update()})
  };
  update();container.appendChild(root);return {mounted:true,review:review,issues:issues}
}
global.VENDRIVE2CompactOcrReview=Object.freeze({version:1,mount:mount});
})(window);