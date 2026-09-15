(function(global){
"use strict";

var STYLE_ID="vendrive-input-recovery-review-style";

function el(tag,className,text){
  var node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined&&text!==null)node.textContent=String(text);
  return node;
}
function clone(value){return JSON.parse(JSON.stringify(value))}
function ensureStyle(){
  if(document.getElementById(STYLE_ID))return;
  var style=el("style");style.id=STYLE_ID;
  style.textContent=[
    ".vdrIrReview{margin-top:10px;display:grid;gap:10px}",
    ".vdrIrCard{border:1px solid #e3e4e6;border-radius:14px;background:#fff;padding:12px}",
    ".vdrIrTitle{font-size:12px;font-weight:900;margin-bottom:8px}",
    ".vdrIrNote{font-size:10px;line-height:1.55;color:#666}",
    ".vdrIrGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    ".vdrIrField{display:grid;gap:4px;min-width:0}",
    ".vdrIrField.full{grid-column:1/-1}",
    ".vdrIrField label{font-size:9px;font-weight:900;color:#6f7379}",
    ".vdrIrField input,.vdrIrField select{width:100%;min-width:0;border:1px solid #d8dadd;border-radius:10px;background:#fafafa;padding:9px;font-size:12px}",
    ".vdrIrMetricGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}",
    ".vdrIrMetric{border:1px solid #ececef;border-radius:11px;padding:9px;background:#fafafa}",
    ".vdrIrMetric span{display:block;font-size:9px;color:#777}",
    ".vdrIrMetric b{display:block;font-size:15px;margin-top:2px}",
    ".vdrIrLine{border:1px solid #ececef;border-radius:12px;padding:10px;margin-top:8px;background:#fcfcfc}",
    ".vdrIrLineTop{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}",
    ".vdrIrLineTop b{font-size:11px}",
    ".vdrIrRemove,.vdrIrAdd{border:1px solid #ddd;background:#fff;border-radius:9px;padding:7px 9px;font-size:10px;font-weight:850}",
    ".vdrIrRemove{color:#b42318;border-color:#f0cccc;background:#fff8f8}",
    ".vdrIrValidation{border-radius:12px;padding:10px;font-size:10px;font-weight:800;line-height:1.55}",
    ".vdrIrValidation.ok{background:#ecfdf3;border:1px solid #bbf7d0;color:#166534}",
    ".vdrIrValidation.warn{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412}",
    ".vdrIrApproval{display:flex;align-items:flex-start;gap:8px;padding:11px;border:1px solid #ddd;border-radius:12px;background:#fafafa;font-size:10px;font-weight:800;line-height:1.45}",
    ".vdrIrApproval input{margin-top:2px}",
    ".vdrIrSave{width:100%;border:0;border-radius:12px;background:#111;color:#fff;padding:12px;font-size:12px;font-weight:900}",
    ".vdrIrSave:disabled{opacity:.42;cursor:not-allowed}",
    ".vdrIrSectionTag{display:inline-flex;border-radius:999px;background:#f3f4f6;padding:4px 8px;font-size:9px;font-weight:900;margin-bottom:8px}",
    "@media(max-width:350px){.vdrIrGrid{grid-template-columns:1fr}.vdrIrField.full{grid-column:auto}.vdrIrMetricGrid{grid-template-columns:1fr 1fr}}"
  ].join("");
  document.head.appendChild(style);
}
function isoToLocal(value){
  if(typeof value!=="string"||!value)return "";
  var m=/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(value);
  return m?m[1]:"";
}
function localToIso(value){
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value||""))return null;
  return value+":00+09:00";
}
function intOrNull(value,min){
  if(value==="")return null;
  var n=Number(value);
  return Number.isInteger(n)&&n>=(min===undefined?0:min)?n:null;
}
function stringOrNull(value){var s=String(value||"").trim();return s||null}
function field(parent,label,type,value,onInput,options){
  var wrap=el("div","vdrIrField"+(options&&options.full?" full":"")),lab=el("label","",label),input;
  if(type==="select"){
    input=el("select");
    (options&&options.choices||[]).forEach(function(choice){
      var opt=el("option");opt.value=choice.value;opt.textContent=choice.label;
      if(choice.value===String(value===null||value===undefined?"":value))opt.selected=true;
      input.appendChild(opt);
    });
  }else{
    input=el("input");input.type=type||"text";
    if(value!==undefined&&value!==null)input.value=String(value);
    if(options&&options.min!==undefined)input.min=String(options.min);
    if(options&&options.step!==undefined)input.step=String(options.step);
    if(options&&options.placeholder)input.placeholder=options.placeholder;
  }
  if(options&&options.role)input.dataset.role=options.role;
  input.addEventListener("input",function(){onInput(input.value)});
  input.addEventListener("change",function(){onInput(input.value)});
  wrap.appendChild(lab);wrap.appendChild(input);parent.appendChild(wrap);return input;
}
function metric(parent,label,value,role){
  var box=el("div","vdrIrMetric"),s=el("span","",label),b=el("b","",value);
  if(role)b.dataset.role=role;
  box.appendChild(s);box.appendChild(b);parent.appendChild(box);return b;
}
function ensurePaper(payload){
  if(!payload.paper||typeof payload.paper!=="object")payload.paper={};
  ["carNumber","operatorName","locationName"].forEach(function(k){if(payload.paper[k]===undefined)payload.paper[k]=null});
  return payload.paper;
}
function ensureInput(payload){
  if(!payload||typeof payload!=="object")return;
  ensurePaper(payload);
  if(!Array.isArray(payload.items))payload.items=[];
  if(!Array.isArray(payload.counterRows))payload.counterRows=[];
  if(!payload.payment||typeof payload.payment!=="object")payload.payment={};
  ["cardAmount","cashAmount","salesAmount"].forEach(function(k){if(payload.payment[k]===undefined)payload.payment[k]=null});
  if(!Number.isInteger(payload.totalQty)||payload.totalQty<0)payload.totalQty=0;
}
function ensureRecovery(payload){
  if(!payload||typeof payload!=="object")return;
  ensurePaper(payload);
  if(!Array.isArray(payload.items))payload.items=[];
  payload.items.forEach(function(item){
    if(item.caseCount===undefined||item.caseCount===null)item.caseCount=0;
    if(item.looseCount===undefined||item.looseCount===null)item.looseCount=Number.isInteger(item.quantity)?item.quantity:0;
    if(item.quantity===undefined||item.quantity===null)item.quantity=item.caseCount===0?item.looseCount:0;
  });
  if(!Number.isInteger(payload.totalQty)||payload.totalQty<0)payload.totalQty=0;
}
function identityReady(review){return !!(review.identity&&review.identity.occurredAt&&review.identity.makerKey&&review.identity.vendorNumber)}
function officialValid(type,review,payload){
  try{
    var api=global.VENDRIVE2Analytics;
    if(!api||!api.data||!api.data.reports||typeof api.data.reports.validatePayload!=="function")return {ok:false,error:"validator unavailable"};
    var result=api.data.reports.validatePayload(type,review.identity&&review.identity.occurredAt,payload);
    return {ok:result.readyToConfirm===true,result:result};
  }catch(error){return {ok:false,error:error&&error.message?error.message:"invalid payload"}}
}

function mount(container,review){
  ensureStyle();
  container.innerHTML="";
  var type=review&&review.classification&&review.classification.effectiveType;
  if(["input","recovery","input_recovery"].indexOf(type)<0){
    container.appendChild(el("div","vdrIrCard","投入・回収帳票のレビュー候補ではありません。"));
    return {mounted:false};
  }
  if(!review.candidatePayload||typeof review.candidatePayload!=="object"){
    container.appendChild(el("div","vdrIrCard","投入・回収の候補データがありません。OCR結果を確認してください。"));
    return {mounted:false};
  }
  if(!review.identity||typeof review.identity!=="object")review.identity={occurredAt:null,makerKey:null,vendorNumber:null,machineId:null};

  var combined=type==="input_recovery";
  var inputPayload=type==="input"?review.candidatePayload:combined?review.candidatePayload.input:null;
  var recoveryPayload=type==="recovery"?review.candidatePayload:combined?review.candidatePayload.recovery:null;
  if(inputPayload)ensureInput(inputPayload);
  if(recoveryPayload)ensureRecovery(recoveryPayload);

  var root=el("div","vdrIrReview"),saved=false,approval,save,status,validationBox;container.appendChild(root);
  var intro=el("div","vdrIrCard");
  intro.appendChild(el("div","vdrIrTitle",combined?"投入＋回収票照合":type==="input"?"投入確認票照合":"回収品確認票照合"));
  intro.appendChild(el("div","vdrIrNote","OCR結果は候補です。実際の紙と照合して修正してください。画像自体は保存されません。"));
  root.appendChild(intro);

  var paperTargets=[];
  if(inputPayload)paperTargets.push(ensurePaper(inputPayload));
  if(recoveryPayload)paperTargets.push(ensurePaper(recoveryPayload));
  function paperValue(key){for(var i=0;i<paperTargets.length;i++)if(paperTargets[i][key])return paperTargets[i][key];return ""}
  function setPaper(key,value){paperTargets.forEach(function(p){p[key]=stringOrNull(value)});changed()}

  var identity=el("div","vdrIrCard"),identityGrid=el("div","vdrIrGrid");
  identity.appendChild(el("div","vdrIrTitle","基本情報"));identity.appendChild(identityGrid);
  field(identityGrid,"帳票日時","datetime-local",isoToLocal(review.identity.occurredAt),function(v){review.identity.occurredAt=localToIso(v);changed()},{role:"ir-occurred-at"});
  field(identityGrid,"メーカー","text",review.identity.makerKey||"",function(v){review.identity.makerKey=stringOrNull(v);changed()},{placeholder:"例: suntory",role:"ir-maker"});
  field(identityGrid,"ベンダー番号","text",review.identity.vendorNumber||"",function(v){review.identity.vendorNumber=stringOrNull(v);changed()},{role:"ir-vendor"});
  field(identityGrid,"車番","text",paperValue("carNumber"),function(v){setPaper("carNumber",v)},{role:"ir-car"});
  field(identityGrid,"担当者","text",paperValue("operatorName"),function(v){setPaper("operatorName",v)},{role:"ir-operator"});
  field(identityGrid,"設置先名","text",paperValue("locationName"),function(v){setPaper("locationName",v)},{full:true,role:"ir-location"});
  root.appendChild(identity);

  var inputMetrics=[],recoveryMetrics=[];

  function renderInputSection(p){
    var section=el("div","vdrIrCard"),counterList=el("div"),counterAdd=el("button","vdrIrAdd","＋ カウンター行を追加");
    counterAdd.type="button";
    section.appendChild(el("div","vdrIrSectionTag","投入確認"));
    section.appendChild(el("div","vdrIrTitle","カウンター情報"));
    section.appendChild(el("div","vdrIrNote","実紙の「売価・枝番・前回・今回・売上数」を照合します。"));
    section.appendChild(counterList);section.appendChild(counterAdd);
    root.appendChild(section);

    function renderCounters(){
      counterList.innerHTML="";
      p.counterRows.forEach(function(row,index){
        var line=el("div","vdrIrLine"),top=el("div","vdrIrLineTop"),grid=el("div","vdrIrGrid"),remove=el("button","vdrIrRemove","削除");
        remove.type="button";top.appendChild(el("b","",String(index+1)+"行目"));top.appendChild(remove);line.appendChild(top);line.appendChild(grid);
        field(grid,"売価","number",row.price,function(v){row.price=intOrNull(v,0);changed()},{min:0,step:1});
        field(grid,"枝番","number",row.branchNumber,function(v){row.branchNumber=intOrNull(v,0);changed()},{min:0,step:1});
        field(grid,"前回","number",row.previousCount,function(v){row.previousCount=intOrNull(v,0);changed()},{min:0,step:1});
        field(grid,"今回","number",row.currentCount,function(v){row.currentCount=intOrNull(v,0);changed()},{min:0,step:1});
        field(grid,"売上数","number",row.salesQty,function(v){row.salesQty=intOrNull(v,0);changed()},{min:0,step:1});
        remove.addEventListener("click",function(){p.counterRows.splice(index,1);renderCounters();changed()});
        counterList.appendChild(line);
      });
      if(!p.counterRows.length)counterList.appendChild(el("div","vdrIrNote","カウンター行なし"));
    }
    counterAdd.addEventListener("click",function(){p.counterRows.push({price:null,branchNumber:null,previousCount:null,currentCount:null,salesQty:null});renderCounters();changed()});
    renderCounters();

    var payment=el("div","vdrIrCard"),payGrid=el("div","vdrIrGrid"),payMetrics=el("div","vdrIrMetricGrid");
    payment.appendChild(el("div","vdrIrTitle","売上金額照合"));payment.appendChild(payGrid);
    field(payGrid,"カード金額","number",p.payment.cardAmount,function(v){p.payment.cardAmount=intOrNull(v,0);changed()},{min:0,step:1});
    field(payGrid,"現金金額","number",p.payment.cashAmount,function(v){p.payment.cashAmount=intOrNull(v,0);changed()},{min:0,step:1});
    field(payGrid,"売上金額","number",p.payment.salesAmount,function(v){p.payment.salesAmount=intOrNull(v,0);changed()},{min:0,step:1,full:true,role:"ir-sales-amount"});
    payment.appendChild(payMetrics);
    var counterAmount=metric(payMetrics,"カウンター計算額","— 円","ir-counter-amount");
    inputMetrics.push({kind:"counterAmount",node:counterAmount,payload:p});
    root.appendChild(payment);

    var itemsCard=el("div","vdrIrCard"),itemsList=el("div"),add=el("button","vdrIrAdd","＋ 投入商品を追加");
    add.type="button";itemsCard.appendChild(el("div","vdrIrTitle","投入情報"));itemsCard.appendChild(itemsList);itemsCard.appendChild(add);root.appendChild(itemsCard);
    function renderItems(){
      itemsList.innerHTML="";
      p.items.forEach(function(item,index){
        if(item.column===undefined)item.column=null;
        var line=el("div","vdrIrLine"),top=el("div","vdrIrLineTop"),grid=el("div","vdrIrGrid"),remove=el("button","vdrIrRemove","削除");
        remove.type="button";top.appendChild(el("b","",String(index+1)+"行目"));top.appendChild(remove);line.appendChild(top);line.appendChild(grid);
        field(grid,"商品コード","text",item.productCode||"",function(v){item.productCode=String(v).trim();changed()},{role:index===0?"ir-input-code":null});
        field(grid,"商品名","text",item.printedName||"",function(v){item.printedName=String(v);changed()});
        field(grid,"温度","select",item.temperature||"",function(v){item.temperature=v||null;changed()},{choices:[{value:"",label:"未設定"},{value:"COLD",label:"冷"},{value:"HOT",label:"温"}]});
        field(grid,"投入数","number",item.quantity,function(v){item.quantity=intOrNull(v,0);changed()},{min:0,step:1,role:index===0?"ir-input-qty":null});
        remove.addEventListener("click",function(){p.items.splice(index,1);renderItems();changed()});
        itemsList.appendChild(line);
      });
      if(!p.items.length)itemsList.appendChild(el("div","vdrIrNote","投入商品行がありません。OCR漏れの場合は追加してください。"));
    }
    add.addEventListener("click",function(){p.items.push({productCode:"",printedName:"",temperature:null,column:null,quantity:0});renderItems();changed()});
    renderItems();

    var totals=el("div","vdrIrCard"),totGrid=el("div","vdrIrGrid"),metrics=el("div","vdrIrMetricGrid");
    totals.appendChild(el("div","vdrIrTitle","投入合計"));totals.appendChild(totGrid);
    field(totGrid,"帳票の投入合計","number",p.totalQty,function(v){p.totalQty=intOrNull(v,0);changed()},{min:0,step:1,full:true,role:"ir-input-total"});
    totals.appendChild(metrics);
    var calc=metric(metrics,"商品行から計算","— 本","ir-input-calc");
    inputMetrics.push({kind:"inputQty",node:calc,payload:p});
    root.appendChild(totals);
  }

  function renderRecoverySection(p){
    var card=el("div","vdrIrCard"),list=el("div"),add=el("button","vdrIrAdd","＋ 回収商品を追加");
    add.type="button";card.appendChild(el("div","vdrIrSectionTag","回収品確認"));card.appendChild(el("div","vdrIrTitle","回収情報"));
    card.appendChild(el("div","vdrIrNote","実紙の「ケース・バラ」を保持します。ケースが0なら在庫反映単位数はバラ数と一致します。ケースがある場合はケース入数を踏まえた単位数を確認してください。"));
    card.appendChild(list);card.appendChild(add);root.appendChild(card);
    function renderItems(){
      list.innerHTML="";
      p.items.forEach(function(item,index){
        if(item.column===undefined)item.column=null;
        if(!Number.isInteger(item.caseCount)||item.caseCount<0)item.caseCount=0;
        if(!Number.isInteger(item.looseCount)||item.looseCount<0)item.looseCount=0;
        if(!Number.isInteger(item.quantity)||item.quantity<0)item.quantity=item.caseCount===0?item.looseCount:0;
        var line=el("div","vdrIrLine"),top=el("div","vdrIrLineTop"),grid=el("div","vdrIrGrid"),remove=el("button","vdrIrRemove","削除");
        remove.type="button";top.appendChild(el("b","",String(index+1)+"行目"));top.appendChild(remove);line.appendChild(top);line.appendChild(grid);
        field(grid,"商品コード","text",item.productCode||"",function(v){item.productCode=String(v).trim();changed()},{role:index===0?"ir-recovery-code":null});
        field(grid,"商品名","text",item.printedName||"",function(v){item.printedName=String(v);changed()});
        field(grid,"温度","select",item.temperature||"",function(v){item.temperature=v||null;changed()},{choices:[{value:"",label:"未設定"},{value:"COLD",label:"冷"},{value:"HOT",label:"温"}]});
        field(grid,"ケース","number",item.caseCount,function(v){
          item.caseCount=intOrNull(v,0);
          if(item.caseCount===0&&Number.isInteger(item.looseCount))item.quantity=item.looseCount;
          syncRecoveryTotal(p);renderItems();changed();
        },{min:0,step:1,role:index===0?"ir-recovery-cases":null});
        field(grid,"バラ","number",item.looseCount,function(v){
          item.looseCount=intOrNull(v,0);
          if(item.caseCount===0&&Number.isInteger(item.looseCount))item.quantity=item.looseCount;
          syncRecoveryTotal(p);renderItems();changed();
        },{min:0,step:1,role:index===0?"ir-recovery-loose":null});
        field(grid,"在庫反映単位数","number",item.quantity,function(v){item.quantity=intOrNull(v,0);syncRecoveryTotal(p);changed()},{min:0,step:1,role:index===0?"ir-recovery-units":null});
        remove.addEventListener("click",function(){p.items.splice(index,1);syncRecoveryTotal(p);renderItems();changed()});
        list.appendChild(line);
      });
      if(!p.items.length)list.appendChild(el("div","vdrIrNote","回収商品行がありません。OCR漏れの場合は追加してください。"));
    }
    add.addEventListener("click",function(){p.items.push({productCode:"",printedName:"",temperature:null,column:null,caseCount:0,looseCount:0,quantity:0});renderItems();changed()});
    syncRecoveryTotal(p);renderItems();

    var totals=el("div","vdrIrCard"),metrics=el("div","vdrIrMetricGrid");
    totals.appendChild(el("div","vdrIrTitle","回収換算"));
    totals.appendChild(el("div","vdrIrNote","回収票には合計欄がないため、レビュー済みの「在庫反映単位数」からアプリ側で合計します。"));
    totals.appendChild(metrics);
    var calc=metric(metrics,"在庫反映合計",String(p.totalQty||0)+" 本","ir-recovery-total");
    recoveryMetrics.push({node:calc,payload:p});
    root.appendChild(totals);
  }

  function syncRecoveryTotal(p){
    if(!p||!Array.isArray(p.items))return;
    var total=0,valid=true;
    p.items.forEach(function(item){if(!Number.isInteger(item.quantity)||item.quantity<0)valid=false;else total+=item.quantity});
    p.totalQty=valid?total:0;
  }

  if(inputPayload)renderInputSection(inputPayload);
  if(recoveryPayload)renderRecoverySection(recoveryPayload);

  validationBox=el("div","vdrIrValidation warn","確認中…");validationBox.dataset.role="ir-validation";root.appendChild(validationBox);
  var approvalWrap=el("label","vdrIrApproval");approval=document.createElement("input");approval.type="checkbox";approval.dataset.role="ir-approval";
  approvalWrap.appendChild(approval);approvalWrap.appendChild(el("span","",combined?"実際の投入確認・回収品確認の両方と照合し、この内容をAnalyticsの下書きとして保存してよいことを確認しました。":type==="input"?"実際の投入確認票と照合し、この内容をAnalyticsの下書きとして保存してよいことを確認しました。":"実際の回収品確認票と照合し、この内容をAnalyticsの下書きとして保存してよいことを確認しました。"));
  root.appendChild(approvalWrap);
  save=el("button","vdrIrSave","確認して下書きを作成");save.type="button";save.disabled=true;save.dataset.role="ir-save";root.appendChild(save);
  status=el("div","vdrIrNote","まだ保存されていません。自動確定・在庫変動・legacyデータ変更は行いません。");status.dataset.role="ir-status";root.appendChild(status);
  approval.addEventListener("change",updateSaveState);

  function validateInputExtras(p,messages){
    var counterAmount=0,counterAmountKnown=p.counterRows.length>0;
    p.counterRows.forEach(function(row,index){
      if([row.price,row.previousCount,row.currentCount,row.salesQty].every(Number.isInteger)){
        if(row.currentCount-row.previousCount!==row.salesQty)messages.push("カウンター"+String(index+1)+"行目の「今回－前回」と売上数が一致していません");
        counterAmount+=row.price*row.salesQty;
      }else counterAmountKnown=false;
    });
    inputMetrics.forEach(function(m){
      if(m.payload!==p)return;
      if(m.kind==="counterAmount")m.node.textContent=counterAmountKnown?counterAmount.toLocaleString("ja-JP")+" 円":"—";
      if(m.kind==="inputQty"){
        var qty=p.items.reduce(function(n,item){return n+(Number.isInteger(item.quantity)?item.quantity:0)},0);
        m.node.textContent=qty.toLocaleString("ja-JP")+" 本";
      }
    });
    var pay=p.payment||{};
    if([pay.cardAmount,pay.cashAmount,pay.salesAmount].every(Number.isInteger)&&pay.cardAmount+pay.cashAmount!==pay.salesAmount)messages.push("カード＋現金と売上金額が一致していません");
    if(counterAmountKnown&&Number.isInteger(pay.salesAmount)&&counterAmount!==pay.salesAmount)messages.push("カウンター計算額と売上金額が一致していません");
  }
  function validateRecoveryExtras(p,messages){
    syncRecoveryTotal(p);
    p.items.forEach(function(item,index){
      if(!Number.isInteger(item.caseCount)||item.caseCount<0||!Number.isInteger(item.looseCount)||item.looseCount<0){messages.push("回収"+String(index+1)+"行目のケース・バラ数を確認してください");return}
      if(item.caseCount===0&&item.quantity!==item.looseCount)messages.push("回収"+String(index+1)+"行目はケース0のため在庫反映単位数をバラ数と一致させてください");
      if(item.caseCount>0&&(!Number.isInteger(item.quantity)||item.quantity<=item.looseCount))messages.push("回収"+String(index+1)+"行目はケース分を含む在庫反映単位数を確認してください");
    });
    recoveryMetrics.forEach(function(m){if(m.payload===p)m.node.textContent=(Number.isInteger(p.totalQty)?p.totalQty:0).toLocaleString("ja-JP")+" 本"});
  }
  function validate(){
    var messages=[];
    if(!identityReady(review))messages.push("帳票日時・メーカー・ベンダー番号を確認してください");
    if(inputPayload)validateInputExtras(inputPayload,messages);
    if(recoveryPayload)validateRecoveryExtras(recoveryPayload,messages);
    var official=officialValid(type,review,review.candidatePayload);
    if(!official.ok)messages.push(official.error||"必須項目または合計値を確認してください");
    if(messages.length){
      validationBox.className="vdrIrValidation warn";
      validationBox.textContent="要確認："+Array.from(new Set(messages)).join(" / ");
      return false;
    }
    validationBox.className="vdrIrValidation ok";
    validationBox.textContent=combined?"照合OK：投入・回収の必須項目と合計整合性を確認できます。":"照合OK：必須項目と合計整合性を確認できます。";
    return true;
  }
  function updateSaveState(){var valid=validate();save.disabled=saved||!approval.checked||!valid}
  function changed(){if(approval)approval.checked=false;updateSaveState()}
  save.addEventListener("click",function(){
    if(saved||!approval.checked||!validate())return;
    var api=global.VENDRIVE2Analytics;
    if(!api||!api.capture||typeof api.capture.createDraftFromReview!=="function"){status.textContent="下書き作成機能を利用できません。ページを再読み込みしてください。";return}
    save.disabled=true;status.textContent="下書きを作成しています…";
    Promise.resolve(api.capture.createDraftFromReview({review:clone(review),userApproved:true,visitId:null})).then(function(result){
      saved=true;approval.disabled=true;save.disabled=true;
      var id=result&&result.report&&result.report.id?"（ID: "+result.report.id+"）":"";
      status.textContent="下書きを作成しました"+id+"。自動確定・在庫変動・legacyデータ変更は行っていません。";
    }).catch(function(error){
      status.textContent="下書きを作成できませんでした："+(error&&error.message?error.message:"入力内容を確認してください");
      updateSaveState();
    });
  });

  updateSaveState();
  return {mounted:true,type:type,review:review};
}

global.VENDRIVE2InputRecoveryReview=Object.freeze({version:1,mount:mount});
})(window);
