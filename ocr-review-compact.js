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
    ".vdrCompactTitle{font-size:13px;font-weight:950}.vdrCompactSub{font-size:9px;color:#73777d;line-height:1.45;margin-top:3px}",
    ".vdrCompactBadges{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.vdrCompactBadge{border-radius:999px;padding:5px 8px;font-size:9px;font-weight:900;white-space:nowrap;background:#ecfdf3;color:#166534}",
    ".vdrCompactBadge.warn{background:#fff7ed;color:#9a3412}.vdrCompactBadge.error{background:#fff1f2;color:#b42318}.vdrCompactBadge.machine{background:#eff6ff;color:#1d4ed8}",
    ".vdrCompactMeta{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.vdrCompactMetaCell{background:#f7f7f8;border-radius:10px;padding:8px;min-width:0;position:relative}",
    ".vdrCompactMetaCell.warn{background:#fff7ed}.vdrCompactMetaCell.error{background:#fff1f2}.vdrCompactMetaCell>span{display:block;font-size:8px;color:#777}.vdrCompactMetaCell>b{display:block;font-size:11px;margin-top:2px;overflow-wrap:anywhere}",
    ".vdrCompactSection{font-size:10px;font-weight:950;margin:1px 0 5px}.vdrCompactTable{display:grid;gap:4px}",
    ".vdrCompactRow{display:grid;grid-template-columns:minmax(54px,72px) minmax(0,1fr) minmax(42px,58px);gap:7px;align-items:stretch;border-bottom:1px solid #f0f0f1;padding:6px 2px;min-width:0}.vdrCompactRow:last-child{border-bottom:0}",
    ".vdrCompactCell{min-width:0;display:flex;align-items:center;gap:4px;flex-wrap:wrap}.vdrCompactCell.warn{background:#fff7ed;color:#9a3412;border-radius:7px;padding:4px}.vdrCompactCell.error{background:#fff1f2;color:#b42318;border-radius:7px;padding:4px}",
    ".vdrCompactItemCode{font-size:9.5px;color:#34373b;font-weight:650;overflow-wrap:anywhere}.vdrCompactItemName{font-size:11px;line-height:1.35;font-weight:800;letter-spacing:0;overflow-wrap:anywhere}.vdrCompactItemQty{text-align:right;font-size:10.5px;font-weight:900;white-space:nowrap;margin-left:auto}.vdrCompactRowNote{grid-column:1/-1;display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:8.5px;color:#9a3412;background:#fff7ed;border-radius:7px;padding:5px 7px}",
    ".vdrFieldFlag{font-size:7.5px;font-weight:950;color:#b42318;white-space:nowrap}.vdrFieldEdit{border:1px solid #f3b6ad;background:#fff;border-radius:7px;padding:3px 6px;font-size:8px;font-weight:950;color:#b42318;white-space:nowrap}.vdrFieldEdit.neutral{border-color:#d7d9dd;color:#444}",
    ".vdrInlineEditor{grid-column:1/-1;border:1px solid #f1c6bd;background:#fffaf8;border-radius:10px;padding:9px;display:grid;gap:7px;margin-top:3px}.vdrInlineEditorTitle{font-size:9px;font-weight:950;color:#8a2c1d}.vdrInlineEditor input,.vdrInlineEditor select{width:100%;box-sizing:border-box;border:1px solid #d8dadd;border-radius:8px;padding:8px;font-size:11px;background:#fff}.vdrInlineEditorActions{display:flex;gap:6px;justify-content:flex-end}.vdrInlineEditorActions button{border:1px solid #d7d9dd;border-radius:8px;background:#fff;padding:6px 9px;font-size:9px;font-weight:900}.vdrInlineEditorActions .save{background:#111;color:#fff;border-color:#111}",
    ".vdrCompactIssues{display:grid;gap:5px}.vdrCompactIssue{font-size:10px;line-height:1.45;border-radius:9px;padding:8px;background:#fff7ed;color:#9a3412}.vdrCompactIssue.error{background:#fff1f2;color:#b42318;font-weight:800}",
    ".vdrCompactMachine{display:flex;justify-content:space-between;gap:8px;align-items:center}.vdrCompactMachineText{min-width:0}.vdrCompactMachineText b{font-size:11px}.vdrCompactMachineText span{display:block;font-size:9px;color:#70747a;margin-top:2px;overflow-wrap:anywhere}.vdrMachineFlag{font-size:8px;font-weight:950;color:#1d4ed8;margin-top:5px}",
    ".vdrCompactActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.vdrCompactButton{border:1px solid #d7d9dd;border-radius:11px;background:#fff;padding:10px;font-size:10px;font-weight:900}.vdrCompactButton.primary{background:#111;color:#fff;border-color:#111}.vdrCompactButton:disabled{opacity:.4}",
    ".vdrCompactApproval{display:flex;gap:8px;align-items:flex-start;font-size:9px;font-weight:800;line-height:1.45;padding:9px;background:#fafafa;border-radius:10px}.vdrCompactStatus{font-size:9px;color:#666;line-height:1.5}.vdrDraftSuccess{display:grid;gap:7px;border:1px solid #a7e0b5;background:#f0fdf4;border-radius:12px;padding:11px;margin-top:8px}.vdrDraftSuccessTitle{font-size:12px;font-weight:950;color:#166534}.vdrDraftSuccessText{font-size:9px;line-height:1.5;color:#356044}.vdrDraftConfirmButton{border:0;border-radius:10px;background:#166534;color:#fff;padding:10px;font-size:10px;font-weight:950}.vdrDraftConfirmButton:disabled{opacity:.55}.vdrDraftSuccess.confirmed{background:#ecfdf3;border-color:#74c98a}",
    ".vdrCompactDetail[hidden]{display:none!important}.vdrCompactDetail{border-top:1px solid #ececef;padding-top:10px}.vdrCompactMuted{font-size:9px;color:#777}",
    "@media(max-width:350px){.vdrCompactActions{grid-template-columns:1fr}.vdrCompactRow{grid-template-columns:58px minmax(0,1fr) 48px}.vdrCompactItemName{font-size:10.5px}.vdrFieldEdit{padding:3px 5px}}"
  ].join("");document.head.appendChild(s);
}
function typeLabel(type){return {sales:"売上",input:"投入",recovery:"回収",input_recovery:"投入＋回収"}[type]||"未判定"}
function makerLabel(v){return ({suntory:"サントリー"})[v]||v||"—"}
function tempLabel(v){return v==="HOT"?"温":v==="COLD"?"冷":"—"}
function timeLabel(v){if(!v)return"—";var m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);return m?m[2]+"/"+m[3]+" "+m[4]+":"+m[5]:v}
function localDateTime(v){var m=/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(v||"");return m?m[1]:""}
function validIso(v){return typeof v==="string"&&/^\d{4}-\d{2}-\d{2}T/.test(v)&&!isNaN(Date.parse(v))}
function firstPaper(review,type){var p=review.candidatePayload||{};if(type==="input_recovery")return p.input&&p.input.paper||p.recovery&&p.recovery.paper||{};return p.paper||{}}
function eachPaper(review,type,fn){var p=review.candidatePayload||{};if(type==="input_recovery"){if(p.input&&p.input.paper)fn(p.input.paper);if(p.recovery&&p.recovery.paper)fn(p.recovery.paper)}else if(p.paper)fn(p.paper)}
function benignWarning(w){return w==="ocr_provider_fallback_used"||w==="recovery_case_conversion_required"||(typeof w==="string"&&w.indexOf("case_conversion_required:")===0)}
function normalizeWarningPath(path,type){
  path=String(path||"").replace(/^candidatePayload\./,"").replace(/^identity\./,"");
  if(type==="input"&&path.indexOf("input.")===0)path=path.slice(6);
  if(type==="recovery"&&path.indexOf("recovery.")===0)path=path.slice(9);
  if(type==="sales"&&path.indexOf("sales.")===0)path=path.slice(6);
  if(path==="paper.locationName"||path==="input.paper.locationName"||path==="recovery.paper.locationName")return "locationName";
  if(path==="paper.operatorName"||path==="input.paper.operatorName"||path==="recovery.paper.operatorName")return "operatorName";
  return path;
}
function uncertainPaths(review,type){
  var out=[];((review.ocr&&review.ocr.warnings)||[]).forEach(function(w){if(typeof w==="string"&&w.indexOf("uncertain:")===0)out.push(normalizeWarningPath(w.slice(10),type))});return out
}
function addIssue(out,key,message,severity,category){out.push({key:key,message:message,severity:severity||"warn",category:category||"ocr"})}
function leafLabel(path){var leaf=String(path||"").split(".").pop();return {productCode:"商品コード",printedName:"商品名",temperature:"温冷",quantity:"数量",salesQty:"売上数",price:"価格",caseCount:"ケース数",looseCount:"バラ数",column:"列",occurredAt:"日時",previousClearAt:"前回クリア日時",elapsedHours:"経過時間",makerKey:"メーカー",vendorNumber:"ベンダー番号",locationName:"設置先",operatorName:"担当者"}[leaf]||"読み取り値"}
function issuesFor(review,type){
  var out=[],uncertain=uncertainPaths(review,type),identity=review.identity||{},p=review.candidatePayload||{};
  if(!validIso(identity.occurredAt))addIssue(out,"occurredAt","帳票日時を確認してください","error","required");
  if(!identity.makerKey)addIssue(out,"makerKey","メーカーを入力してください","error","required");
  if(!identity.vendorNumber)addIssue(out,"vendorNumber","ベンダー番号を入力してください","error","required");
  var mm=review.machineMatch;
  if(mm){
    if(mm.status==="management_match")addIssue(out,"machine","登録自販機の候補があります。紐づけを確認してください","warn","machine");
    else if(mm.status==="confirmed_mapping_conflict"||mm.status==="ambiguous_management_match"||mm.status==="stale_confirmed_mapping"){addIssue(out,"machine","自販機の紐づけに競合があります","error","machine");addIssue(out,"vendorNumber","ベンダー番号を確認・修正できます","warn","machine")}
    else if(mm.status==="no_match"){addIssue(out,"machine","登録自販機との一致を確認できませんでした","warn","machine");addIssue(out,"vendorNumber","ベンダー番号を確認・修正できます","warn","machine")}
    else if(mm.status==="unavailable"){addIssue(out,"machine","自販機照合を実行できませんでした","warn","machine");addIssue(out,"vendorNumber","ベンダー番号を確認・修正できます","warn","machine")}
  }
  function itemIssues(items,prefix,kind){
    if(!Array.isArray(items)||!items.length){addIssue(out,prefix,"商品行がありません","error","consistency");return}
    items.forEach(function(item,i){
      var base=prefix+"."+i;
      if(!item.productCode)addIssue(out,base+".productCode","商品"+(i+1)+"の商品コードを入力してください","error","required");
      if(!item.printedName)addIssue(out,base+".printedName","商品"+(i+1)+"の商品名を入力してください","error","required");
      if(kind==="sales"&&(!Number.isInteger(item.salesQty)||item.salesQty<0))addIssue(out,base+".salesQty","商品"+(i+1)+"の売上数を確認してください","error","required");
      if(kind!=="sales"&&(!Number.isInteger(item.quantity)||item.quantity<0))addIssue(out,base+".quantity","商品"+(i+1)+"の数量を確認してください","error","required");
    });
  }
  if(type==="sales"){
    itemIssues(p.products,"products","sales");
    if(!validIso(p.previousClearAt))addIssue(out,"previousClearAt","前回クリア日時を確認してください","error","required");
    else if(validIso(identity.occurredAt)&&Date.parse(p.previousClearAt)>Date.parse(identity.occurredAt))addIssue(out,"previousClearAt","前回クリア日時が売上日時より後になっています","error","consistency");
    if(typeof p.elapsedHours!=="number"||!isFinite(p.elapsedHours)||p.elapsedHours<0)addIssue(out,"elapsedHours","経過時間を確認してください","error","required");
    if(Array.isArray(p.products)){var q=0,a=0,valid=true;p.products.forEach(function(x){if(!Number.isInteger(x.salesQty)||!Number.isInteger(x.price)){valid=false;return}q+=x.salesQty;a+=x.salesQty*x.price});if(valid&&q!==p.totalQty)addIssue(out,"totalQty","売上数合計が商品行と一致していません","error","consistency");if(valid&&a!==p.totalAmount)addIssue(out,"totalAmount","売上金額が商品行と一致していません","error","consistency")}
  }else{
    var input=type==="input"?p:type==="input_recovery"?p.input:null,recovery=type==="recovery"?p:type==="input_recovery"?p.recovery:null;
    if(input){itemIssues(input.items,type==="input_recovery"?"input.items":"items","input");var iq=Array.isArray(input.items)?input.items.reduce(function(n,x){return n+(Number.isInteger(x.quantity)?x.quantity:0)},0):0;if(iq!==input.totalQty)addIssue(out,type==="input_recovery"?"input.totalQty":"totalQty","投入合計が商品行と一致していません","error","consistency")}
    if(recovery){itemIssues(recovery.items,type==="input_recovery"?"recovery.items":"items","recovery");(recovery.items||[]).forEach(function(x,i){if(Number.isInteger(x.caseCount)&&x.caseCount>0&&(!Number.isInteger(x.quantity)||x.quantity<=x.looseCount))addIssue(out,(type==="input_recovery"?"recovery.items":"items")+"."+i+".quantity","ケース入数が不明です。在庫反映数量を確認してください","error","consistency")})}
  }
  uncertain.forEach(function(path){if(!path)return;var msg=leafLabel(path)+"の読み取りが不確かです";addIssue(out,path,msg,"warn","ocr")});
  ((review.ocr&&review.ocr.warnings)||[]).filter(function(w){return typeof w==="string"&&!benignWarning(w)&&w.indexOf("uncertain:")!==0}).forEach(function(w){addIssue(out,"ocr","OCR警告: "+w,"warn","ocr_global")});
  var seen={};return out.filter(function(x){var k=x.key+"|"+x.message;if(seen[k])return false;seen[k]=true;return true})
}
function issueFor(issues,key){var found=null;issues.forEach(function(x){if(x.key===key&&(!found||x.severity==="error"))found=x});return found}
function severityFor(issues,key){var x=issueFor(issues,key);return x?x.severity:null}
function getPath(obj,path){return String(path).split(".").reduce(function(v,k){return v==null?undefined:v[k]},obj)}
function setPath(obj,path,value){var parts=String(path).split("."),cur=obj;for(var i=0;i<parts.length-1;i++){if(cur[parts[i]]==null)cur[parts[i]]={};cur=cur[parts[i]]}cur[parts[parts.length-1]]=value}
function clearUncertain(review,type,path){
  if(!review.ocr||!Array.isArray(review.ocr.warnings))return;
  review.ocr.warnings=review.ocr.warnings.filter(function(w){return !(typeof w==="string"&&w.indexOf("uncertain:")===0&&normalizeWarningPath(w.slice(10),type)===path)})
}
function rerender(container,review){var y=global.scrollY;mount(container,review);setTimeout(function(){try{global.scrollTo(0,y)}catch(error){}},0)}
function refreshMachineMatch(review){
  var api=global.VENDRIVE2Analytics,id=review.identity||{};
  if(!api||!api.bridge||typeof api.bridge.findMachineCandidates!=="function"||!id.makerKey||!id.vendorNumber){review.machineMatch={status:"unavailable",candidates:[]};return Promise.resolve()}
  return Promise.resolve(api.bridge.findMachineCandidates({makerKey:id.makerKey,vendorNumber:id.vendorNumber})).then(function(match){review.machineMatch=match||{status:"no_match",candidates:[]};if(match&&match.status==="confirmed_mapping"&&match.confirmedMapping&&!match.confirmedMapping.missing)review.identity.machineId=match.confirmedMapping.machineId;else review.identity.machineId=null}).catch(function(){review.machineMatch={status:"unavailable",candidates:[]}})
}
function editControl(parent,issue,label,open){
  if(!issue)return;
  parent.classList.add(issue.severity);
  parent.appendChild(el("span","vdrFieldFlag","⚠ 要確認"));
  var b=el("button","vdrFieldEdit","編集");b.type="button";b.setAttribute("aria-label",label+"を編集");b.onclick=function(e){e.preventDefault();e.stopPropagation();open(b)};parent.appendChild(b)
}
function plainEditControl(parent,label,open){
  var b=el("button","vdrFieldEdit neutral","編集");b.type="button";b.setAttribute("aria-label",label+"を編集");b.onclick=function(e){e.preventDefault();e.stopPropagation();open(b)};parent.appendChild(b)
}
function inlineEditor(anchor,title,spec,onSave){
  var scope=anchor.closest(".vdrCompactRow,.vdrCompactMetaCell,.vdrCompactCard")||anchor.parentNode,old=scope.querySelector(".vdrInlineEditor");if(old)old.remove();
  var box=el("div","vdrInlineEditor"),t=el("div","vdrInlineEditorTitle",title),input;
  box.appendChild(t);
  if(spec.options){input=document.createElement("select");spec.options.forEach(function(o){var op=document.createElement("option");op.value=o.value;op.textContent=o.label;if(String(o.value)===String(spec.value))op.selected=true;input.appendChild(op)})}
  else{input=document.createElement("input");input.type=spec.type||"text";input.value=spec.value==null?"":String(spec.value);if(spec.type==="number")input.min="0"}
  box.appendChild(input);
  var actions=el("div","vdrInlineEditorActions"),cancel=el("button","","キャンセル"),save=el("button","save","保存");cancel.type=save.type="button";cancel.onclick=function(){box.remove()};save.onclick=function(){var value=input.value;if(spec.type==="number"){value=Number(value);if(!Number.isInteger(value)||value<0){input.focus();return}}save.disabled=true;Promise.resolve(onSave(value)).catch(function(){save.disabled=false})};actions.appendChild(cancel);actions.appendChild(save);box.appendChild(actions);
  scope.appendChild(box);setTimeout(function(){input.focus();try{box.scrollIntoView({behavior:"smooth",block:"nearest"})}catch(error){}},0)
}
function machineInfo(review){var mm=review.machineMatch||null;if(!mm)return null;var candidates=Array.isArray(mm.candidates)?mm.candidates:[],candidate=null;if(mm.confirmedMapping)candidate=candidates.find(function(c){return c.machineId===mm.confirmedMapping.machineId})||null;if(!candidate&&candidates.length===1)candidate=candidates[0];return{match:mm,candidate:candidate,machine:candidate&&candidate.machine||null}}
function mount(container,review){
  ensureStyle();container.innerHTML="";
  var type=review&&review.classification&&review.classification.effectiveType;
  if(["sales","input","recovery","input_recovery"].indexOf(type)<0||!review.candidatePayload){container.appendChild(el("div","vdrCompactCard","確認できるOCR候補がありません。"));return{mounted:false}}
  var issues=issuesFor(review,type),blocking=issues.filter(function(x){return x.severity==="error"}),ocrIssues=issues.filter(function(x){return x.category==="ocr"||x.category==="required"}),machineIssues=issues.filter(function(x){return x.category==="machine"}),consistencyIssues=issues.filter(function(x){return x.category==="consistency"}),globalIssues=issues.filter(function(x){return x.category==="ocr_global"}),root=el("div","vdrCompact"),card=el("div","vdrCompactCard"),top=el("div","vdrCompactTop"),titleWrap=el("div"),confidence=review.classification&&typeof review.classification.typeConfidence==="number"?Math.round(review.classification.typeConfidence*100)+"%":"—";
  titleWrap.appendChild(el("div","vdrCompactTitle",typeLabel(type)+"帳票"));titleWrap.appendChild(el("div","vdrCompactSub","帳票種別の判定 "+confidence+" · 怪しい箇所だけその場で修正できます"));top.appendChild(titleWrap);
  var badges=el("div","vdrCompactBadges");
  if(ocrIssues.length||globalIssues.length){var ocrCount=ocrIssues.length+globalIssues.length;badges.appendChild(el("span","vdrCompactBadge "+(ocrIssues.some(function(x){return x.severity==="error"})?"error":"warn"),"OCR確認 "+ocrCount+"件"))}
  if(consistencyIssues.length)badges.appendChild(el("span","vdrCompactBadge error","数量確認 "+consistencyIssues.length+"件"));
  if(machineIssues.length)badges.appendChild(el("span","vdrCompactBadge machine","紐づけ確認 "+machineIssues.length+"件"));
  if(!ocrIssues.length&&!consistencyIssues.length&&!machineIssues.length&&!globalIssues.length)badges.appendChild(el("span","vdrCompactBadge","確認可能"));
  top.appendChild(badges);card.appendChild(top);
  var paper=firstPaper(review,type),meta=el("div","vdrCompactMeta");
  function metaCell(label,value,key,spec,apply){
    var box=el("div","vdrCompactMetaCell"),issue=issueFor(issues,key);box.appendChild(el("span","",label));box.appendChild(el("b","",value==null||value===""?"—":value));
    function openEditor(btn){inlineEditor(btn,label+"を修正",spec,function(v){return Promise.resolve(apply(v)).then(function(){clearUncertain(review,type,key);return(key==="makerKey"||key==="vendorNumber")?refreshMachineMatch(review):null}).then(function(){rerender(container,review)})})}
    if(issue)editControl(box,issue,label,openEditor);else if(spec&&spec.alwaysEditable)plainEditControl(box,label,openEditor);meta.appendChild(box)
  }
  metaCell("日時",timeLabel(review.identity&&review.identity.occurredAt),"occurredAt",{type:"datetime-local",value:localDateTime(review.identity&&review.identity.occurredAt),alwaysEditable:true},function(v){review.identity.occurredAt=v?v+":00+09:00":null});
  metaCell("ベンダー",review.identity&&review.identity.vendorNumber,"vendorNumber",{type:"text",value:review.identity&&review.identity.vendorNumber,alwaysEditable:true},function(v){review.identity.vendorNumber=String(v).trim()||null});
  metaCell("メーカー",makerLabel(review.identity&&review.identity.makerKey),"makerKey",{type:"text",value:review.identity&&review.identity.makerKey,alwaysEditable:true},function(v){review.identity.makerKey=String(v).trim()||null});
  metaCell("設置先",paper.locationName,"locationName",{type:"text",value:paper.locationName,alwaysEditable:true},function(v){eachPaper(review,type,function(x){x.locationName=String(v).trim()||null})});
  metaCell("担当者",paper.operatorName,"operatorName",{type:"text",value:paper.operatorName,alwaysEditable:true},function(v){eachPaper(review,type,function(x){x.operatorName=String(v).trim()||null})});
  if(type==="sales"){var salesPeriod=review.candidatePayload||{};metaCell("前回クリア",timeLabel(salesPeriod.previousClearAt),"previousClearAt",{type:"datetime-local",value:localDateTime(salesPeriod.previousClearAt),alwaysEditable:true},function(v){salesPeriod.previousClearAt=v?v+":00+09:00":null})}
  card.appendChild(meta);root.appendChild(card);

  var mi=machineInfo(review),machineCard=el("div","vdrCompactCard"),machineFlex=el("div","vdrCompactMachine"),machineText=el("div","vdrCompactMachineText"),machineIssue=issueFor(issues,"machine");
  if(mi&&mi.match.status==="confirmed_mapping"&&mi.machine){machineText.appendChild(el("b","", "✓ "+(mi.machine.name||mi.machine.id)));machineText.appendChild(el("span","", "登録自販機と一致 · "+(mi.machine.managementCodeKey||review.identity.vendorNumber||"")))}
  else if(mi&&mi.candidate&&mi.machine){machineText.appendChild(el("b","", "候補: "+(mi.machine.name||mi.machine.id)));machineText.appendChild(el("span","", "管理番号 "+(mi.machine.managementCodeKey||review.identity.vendorNumber||"")+" · 未確定"));machineText.appendChild(el("div","vdrMachineFlag","● 自販機の紐づけ確認"))}
  else{machineText.appendChild(el("b","", "登録自販機: 未確認"));machineText.appendChild(el("span","",review.identity&&review.identity.vendorNumber?"一致する登録先を確認してください":"ベンダー番号が必要です"));if(machineIssue)machineText.appendChild(el("div","vdrMachineFlag","● 自販機の紐づけ確認"))}
  machineFlex.appendChild(machineText);
  if(mi&&mi.match.status==="management_match"&&mi.candidate&&mi.machine){var link=el("button","vdrCompactButton","この自販機と紐づける");link.type="button";link.onclick=function(){var api=global.VENDRIVE2Analytics;if(!api||!api.data||!api.data.machineLinks)return;link.disabled=true;link.textContent="紐づけ中…";Promise.resolve(api.data.machineLinks.put({makerKey:review.identity.makerKey,vendorNumber:review.identity.vendorNumber,machineId:mi.candidate.machineId})).then(function(){review.identity.machineId=mi.candidate.machineId;return refreshMachineMatch(review)}).then(function(){rerender(container,review)}).catch(function(){link.disabled=false;link.textContent="紐づけに失敗 · 再試行"})};machineFlex.appendChild(link)}
  machineCard.appendChild(machineFlex);root.appendChild(machineCard);

  function fieldCell(className,text,key,title,spec,apply){
    var cell=el("div","vdrCompactCell"),issue=issueFor(issues,key);cell.appendChild(el("span",className,text));
    editControl(cell,issue,title,function(btn){inlineEditor(btn,title+"を修正",spec,function(v){apply(v);clearUncertain(review,type,key);rerender(container,review)})});return cell
  }
  function section(label,items,kind,prefix){
    var c=el("div","vdrCompactCard"),h=el("div","vdrCompactSection",label),table=el("div","vdrCompactTable");c.appendChild(h);
    (items||[]).forEach(function(item,i){
      var row=el("div","vdrCompactRow"),base=prefix+"."+i;
      row.appendChild(fieldCell("vdrCompactItemCode",item.productCode||"—",base+".productCode","商品コード",{type:"text",value:item.productCode},function(v){item.productCode=String(v).trim()||null}));
      var nameCell=el("div","vdrCompactCell"),nameIssue=issueFor(issues,base+".printedName"),tempIssue=issueFor(issues,base+".temperature");nameCell.appendChild(el("span","vdrCompactItemName",(item.printedName||"—")+" · "+tempLabel(item.temperature)));
      if(nameIssue)editControl(nameCell,nameIssue,"商品名",function(btn){inlineEditor(btn,"商品名を修正",{type:"text",value:item.printedName},function(v){item.printedName=String(v).trim()||null;clearUncertain(review,type,base+".printedName");rerender(container,review)})});
      if(tempIssue)editControl(nameCell,tempIssue,"温冷",function(btn){inlineEditor(btn,"温冷を修正",{value:item.temperature,options:[{value:"COLD",label:"冷"},{value:"HOT",label:"温"},{value:"UNKNOWN",label:"不明"}]},function(v){item.temperature=v;clearUncertain(review,type,base+".temperature");rerender(container,review)})});
      row.appendChild(nameCell);
      if(kind==="sales")row.appendChild(fieldCell("vdrCompactItemQty",String(item.salesQty)+"本",base+".salesQty","売上数",{type:"number",value:item.salesQty},function(v){item.salesQty=v}));
      else if(kind==="recovery"){
        var qCell=el("div","vdrCompactCell"),caseIssue=issueFor(issues,base+".caseCount"),looseIssue=issueFor(issues,base+".looseCount"),qtyIssue=issueFor(issues,base+".quantity");qCell.appendChild(el("span","vdrCompactItemQty",String(item.caseCount||0)+"箱 / "+String(item.looseCount||0)+"本"));
        if(caseIssue)editControl(qCell,caseIssue,"ケース数",function(btn){inlineEditor(btn,"ケース数を修正",{type:"number",value:item.caseCount||0},function(v){item.caseCount=v;clearUncertain(review,type,base+".caseCount");rerender(container,review)})});
        if(looseIssue)editControl(qCell,looseIssue,"バラ数",function(btn){inlineEditor(btn,"バラ数を修正",{type:"number",value:item.looseCount||0},function(v){item.looseCount=v;clearUncertain(review,type,base+".looseCount");rerender(container,review)})});
        if(qtyIssue)editControl(qCell,qtyIssue,"在庫反映数量",function(btn){inlineEditor(btn,"在庫反映数量を修正",{type:"number",value:item.quantity},function(v){item.quantity=v;clearUncertain(review,type,base+".quantity");rerender(container,review)})});
        row.appendChild(qCell);
        if(qtyIssue&&qtyIssue.message){row.appendChild(el("div","vdrCompactRowNote","⚠ "+qtyIssue.message))}
      }else row.appendChild(fieldCell("vdrCompactItemQty",String(item.quantity)+"本",base+".quantity","投入数",{type:"number",value:item.quantity},function(v){item.quantity=v}));
      var priceIssue=issueFor(issues,base+".price");if(priceIssue){var extra=el("div","vdrCompactRowNote","⚠ 価格を確認してください"),pb=el("button","vdrFieldEdit","編集");pb.type="button";pb.onclick=function(){inlineEditor(pb,"価格を修正",{type:"number",value:item.price},function(v){item.price=v;clearUncertain(review,type,base+".price");rerender(container,review)})};extra.appendChild(pb);row.appendChild(extra)}
      var columnIssue=issueFor(issues,base+".column");if(columnIssue){var col=el("div","vdrCompactRowNote","⚠ 列番号を確認してください"),cb=el("button","vdrFieldEdit","編集");cb.type="button";cb.onclick=function(){inlineEditor(cb,"列番号を修正",{type:"number",value:item.column},function(v){item.column=v;clearUncertain(review,type,base+".column");rerender(container,review)})};col.appendChild(cb);row.appendChild(col)}
      table.appendChild(row)
    });
    if(!(items||[]).length)table.appendChild(el("div","vdrCompactMuted","商品行なし"));c.appendChild(table);root.appendChild(c)
  }
  var p=review.candidatePayload;
  if(type==="sales"){
    section("商品別売上",p.products,"sales","products");
    var totals=el("div","vdrCompactCard"),tm=el("div","vdrCompactMeta");
    function totalCell(label,key,value,spec,apply){var box=el("div","vdrCompactMetaCell"),issue=issueFor(issues,key);box.appendChild(el("span","",label));box.appendChild(el("b","",value));editControl(box,issue,label,function(btn){inlineEditor(btn,label+"を修正",spec,function(v){apply(v);rerender(container,review)})});tm.appendChild(box)}
    totalCell("売上数合計","totalQty",String(p.totalQty||0)+"本",{type:"number",value:p.totalQty},function(v){p.totalQty=v});totalCell("売上金額","totalAmount",(p.totalAmount||0).toLocaleString("ja-JP")+"円",{type:"number",value:p.totalAmount},function(v){p.totalAmount=v});totals.appendChild(tm);root.appendChild(totals)
  }else{
    var inp=type==="input"?p:type==="input_recovery"?p.input:null,rec=type==="recovery"?p:type==="input_recovery"?p.recovery:null;
    if(inp)section("投入",inp.items,"input",type==="input_recovery"?"input.items":"items");if(rec)section("回収",rec.items,"recovery",type==="input_recovery"?"recovery.items":"items");
    if(inp){var totalKey=type==="input_recovery"?"input.totalQty":"totalQty",it=el("div","vdrCompactCard"),im=el("div","vdrCompactMeta"),ib=el("div","vdrCompactMetaCell"),ii=issueFor(issues,totalKey);ib.appendChild(el("span","","投入合計"));ib.appendChild(el("b","",String(inp.totalQty||0)+"本"));editControl(ib,ii,"投入合計",function(btn){inlineEditor(btn,"投入合計を修正",{type:"number",value:inp.totalQty},function(v){inp.totalQty=v;rerender(container,review)})});im.appendChild(ib);it.appendChild(im);root.appendChild(it)}
  }

  var residual=globalIssues.concat(consistencyIssues.filter(function(x){return !issueFor(issues,x.key)||x.key.indexOf(".quantity")<0}));
  if(residual.length){var ic=el("div","vdrCompactCard"),list=el("div","vdrCompactIssues");ic.appendChild(el("div","vdrCompactSection","確認ポイント"));residual.forEach(function(x){list.appendChild(el("div","vdrCompactIssue"+(x.severity==="error"?" error":""),(x.severity==="error"?"⚠ ":"")+x.message))});ic.appendChild(list);root.appendChild(ic)}

  var actionsCard=el("div","vdrCompactCard"),detail=el("div","vdrCompactDetail"),actions=el("div","vdrCompactActions"),edit=el("button","vdrCompactButton","全体を編集");detail.hidden=true;edit.type="button";actions.appendChild(edit);
  var approvalWrap=el("label","vdrCompactApproval"),approval=document.createElement("input");approval.type="checkbox";approvalWrap.appendChild(approval);approvalWrap.appendChild(el("span","","一覧を実紙と照合し、この内容をAnalyticsの下書きとして保存してよいことを確認しました。"));
  var save=el("button","vdrCompactButton primary","この内容で下書きを作成");save.type="button";save.disabled=true;actions.appendChild(save);actionsCard.appendChild(actions);actionsCard.appendChild(approvalWrap);
  var status=el("div","vdrCompactStatus",blocking.length?"赤い要修正項目があるため、修正してから保存してください。":"まだ保存されていません。自動確定・在庫変動・legacyデータ変更は行いません。");actionsCard.appendChild(status);actionsCard.appendChild(detail);root.appendChild(actionsCard);
  function update(){save.disabled=blocking.length>0||!approval.checked}approval.onchange=update;
  edit.onclick=function(){if(detail.hidden){detail.hidden=false;edit.textContent="編集内容を反映して閉じる";detail.innerHTML="";var editor=type==="sales"?global.VENDRIVE2SalesReview:global.VENDRIVE2InputRecoveryReview;if(editor&&typeof editor.mount==="function")editor.mount(detail,review);else detail.appendChild(el("div","vdrCompactMuted","編集画面を利用できません"));setTimeout(function(){try{detail.scrollIntoView({behavior:"smooth",block:"start"})}catch(error){}},0)}else{edit.disabled=true;edit.textContent="反映中…";Promise.resolve(refreshMachineMatch(review)).then(function(){rerender(container,review)}).catch(function(){rerender(container,review)})}};
  function showDraftSuccess(result){
    var report=result&&result.report,id=report&&report.id;if(!id)return;
    approval.disabled=true;approvalWrap.style.display="none";edit.disabled=true;save.disabled=true;save.textContent="作成済み";status.textContent="";
    var old=actionsCard.querySelector(".vdrDraftSuccess");if(old)old.remove();
    var card=el("div","vdrDraftSuccess"),title=el("div","vdrDraftSuccessTitle","✓ 下書きを作成しました"),effect=type==="sales"?"確定すると、この売上データが分析エンジンの対象になります。":"確定すると、この投入・回収データが在庫計算と分析の対象になります。",text=el("div","vdrDraftSuccessText","まだ正式確定ではありません。内容に問題がなければ、下のボタンで確定してください。 "+effect),confirmButton=el("button","vdrDraftConfirmButton","下書きを確認・確定する");
    confirmButton.type="button";card.appendChild(title);card.appendChild(text);card.appendChild(confirmButton);actionsCard.insertBefore(card,detail);
    confirmButton.onclick=function(){
      var api=global.VENDRIVE2Analytics;if(!api||!api.data||!api.data.reports||typeof api.data.reports.confirm!=="function")return;
      var message="この帳票を正式に確定しますか？\n\n"+effect+"\n確定後も元のOCR画像は保存されません。";
      if(typeof global.confirm==="function"&&!global.confirm(message))return;
      confirmButton.disabled=true;confirmButton.textContent="確定しています…";
      Promise.resolve(api.data.reports.confirm(id)).then(function(out){
        if(!out||out.confirmed!==true){confirmButton.disabled=false;confirmButton.textContent="下書きを確認・確定する";text.textContent="まだ確定できません。内容を全体編集で確認してください。";return}
        card.classList.add("confirmed");title.textContent="✓ 帳票を確定しました";text.textContent=type==="sales"?"売上データが分析エンジンの対象になりました。":"投入・回収データが在庫計算と分析の対象になりました。";confirmButton.textContent="確定済み";confirmButton.disabled=true;save.textContent="確定済み";
      }).catch(function(error){confirmButton.disabled=false;confirmButton.textContent="下書きを確認・確定する";text.textContent="確定できませんでした："+(error&&error.message?error.message:"内容を確認してください")})
    }
  }
  save.onclick=function(){if(save.disabled)return;var api=global.VENDRIVE2Analytics;if(!api||!api.capture||typeof api.capture.createDraftFromReview!=="function")return;save.disabled=true;status.textContent="編集内容を再確認しています…";Promise.resolve(refreshMachineMatch(review)).then(function(){var latestBlocking=issuesFor(review,type).filter(function(x){return x.severity==="error"});if(latestBlocking.length){rerender(container,review);return null}status.textContent="下書きを作成しています…";return api.capture.createDraftFromReview({review:clone(review),userApproved:true,visitId:null})}).then(function(result){if(result)showDraftSuccess(result)}).catch(function(error){status.textContent="下書きを作成できませんでした："+(error&&error.message?error.message:"内容を確認してください");update()})};
  update();container.appendChild(root);return{mounted:true,review:review,issues:issues}
}
global.VENDRIVE2CompactOcrReview=Object.freeze({version:2,mount:mount});
})(window);