(function(global){
"use strict";

var STYLE_ID="vendrive-sales-review-style";

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
    ".vdrSalesReview{margin-top:10px;display:grid;gap:10px}",
    ".vdrSalesCard{border:1px solid #e3e4e6;border-radius:14px;background:#fff;padding:12px}",
    ".vdrSalesTitle{font-size:12px;font-weight:900;margin-bottom:8px}",
    ".vdrSalesGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    ".vdrSalesField{display:grid;gap:4px;min-width:0}",
    ".vdrSalesField.full{grid-column:1/-1}",
    ".vdrSalesField label{font-size:9px;font-weight:900;color:#6f7379}",
    ".vdrSalesField input,.vdrSalesField select{width:100%;min-width:0;border:1px solid #d8dadd;border-radius:10px;background:#fafafa;padding:9px;font-size:12px}",
    ".vdrSalesSummary{display:grid;grid-template-columns:1fr 1fr;gap:7px}",
    ".vdrSalesMetric{border:1px solid #ececef;border-radius:11px;padding:9px;background:#fafafa}",
    ".vdrSalesMetric span{display:block;font-size:9px;color:#777}",
    ".vdrSalesMetric b{display:block;font-size:15px;margin-top:2px}",
    ".vdrSalesLine{border:1px solid #ececef;border-radius:12px;padding:10px;margin-top:8px;background:#fcfcfc}",
    ".vdrSalesLineTop{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}",
    ".vdrSalesLineTop b{font-size:11px}",
    ".vdrSalesRemove,.vdrSalesAdd{border:1px solid #ddd;background:#fff;border-radius:9px;padding:7px 9px;font-size:10px;font-weight:850}",
    ".vdrSalesRemove{color:#b42318;border-color:#f0cccc;background:#fff8f8}",
    ".vdrSalesValidation{border-radius:12px;padding:10px;font-size:10px;font-weight:800;line-height:1.5}",
    ".vdrSalesValidation.ok{background:#ecfdf3;border:1px solid #bbf7d0;color:#166534}",
    ".vdrSalesValidation.warn{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412}",
    ".vdrSalesApproval{display:flex;align-items:flex-start;gap:8px;padding:11px;border:1px solid #ddd;border-radius:12px;background:#fafafa;font-size:10px;font-weight:800;line-height:1.45}",
    ".vdrSalesApproval input{margin-top:2px}",
    ".vdrSalesSave{width:100%;border:0;border-radius:12px;background:#111;color:#fff;padding:12px;font-size:12px;font-weight:900}",
    ".vdrSalesSave:disabled{opacity:.42;cursor:not-allowed}",
    ".vdrSalesStatus{font-size:10px;line-height:1.5;color:#666}",
    "@media(max-width:350px){.vdrSalesGrid{grid-template-columns:1fr}.vdrSalesField.full{grid-column:auto}.vdrSalesSummary{grid-template-columns:1fr 1fr}}"
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
function intOrNull(value){if(value==="")return null;var n=Number(value);return Number.isInteger(n)?n:null}
function numOrNull(value){if(value==="")return null;var n=Number(value);return Number.isFinite(n)?n:null}
function field(parent,label,type,value,onInput,options){
  var wrap=el("div","vdrSalesField"+(options&&options.full?" full":"")),lab=el("label","",label),input;
  if(type==="select"){
    input=el("select");
    (options&&options.choices||[]).forEach(function(choice){
      var opt=el("option");opt.value=choice.value;opt.textContent=choice.label;if(choice.value===String(value===null?"":value))opt.selected=true;input.appendChild(opt);
    });
  }else{
    input=el("input");input.type=type||"text";if(value!==undefined&&value!==null)input.value=String(value);
    if(options&&options.min!==undefined)input.min=String(options.min);
    if(options&&options.step!==undefined)input.step=String(options.step);
    if(options&&options.placeholder)input.placeholder=options.placeholder;
  }
  input.addEventListener("input",function(){onInput(input.value)});
  input.addEventListener("change",function(){onInput(input.value)});
  wrap.appendChild(lab);wrap.appendChild(input);parent.appendChild(wrap);return input;
}
function metric(parent,label,value){
  var box=el("div","vdrSalesMetric"),s=el("span","",label),b=el("b","",value);box.appendChild(s);box.appendChild(b);parent.appendChild(box);return b;
}
function mount(container,review){
  ensureStyle();
  container.innerHTML="";
  var root=el("div","vdrSalesReview");container.appendChild(root);
  if(!review||!review.classification||review.classification.effectiveType!=="sales"){
    root.appendChild(el("div","vdrSalesCard","売上帳票のレビュー候補ではありません。"));
    return {mounted:false};
  }
  if(!review.candidatePayload||typeof review.candidatePayload!=="object"){
    root.appendChild(el("div","vdrSalesCard","売上候補データがありません。OCR結果を確認してください。"));
    return {mounted:false};
  }

  var p=review.candidatePayload;
  if(!Array.isArray(p.products))p.products=[];
  if(!Array.isArray(p.soldOuts))p.soldOuts=[];
  var saved=false,approval;

  var intro=el("div","vdrSalesCard");
  intro.appendChild(el("div","vdrSalesTitle","売上ジャーナル照合"));
  intro.appendChild(el("div","vdrSalesStatus","OCR結果は候補です。実際の紙と照合し、誤読があればここで修正してください。画像自体は保存されません。"));
  root.appendChild(intro);

  var identity=el("div","vdrSalesCard"),identityGrid=el("div","vdrSalesGrid");
  identity.appendChild(el("div","vdrSalesTitle","基本情報"));identity.appendChild(identityGrid);
  field(identityGrid,"売上日時","datetime-local",isoToLocal(review.identity&&review.identity.occurredAt),function(v){review.identity.occurredAt=localToIso(v);changed()});
  field(identityGrid,"メーカー","text",review.identity&&review.identity.makerKey||"",function(v){review.identity.makerKey=v.trim()||null;changed()},{placeholder:"例: coca-cola"});
  field(identityGrid,"自販機番号","text",review.identity&&review.identity.vendorNumber||"",function(v){review.identity.vendorNumber=v.trim()||null;changed()});
  field(identityGrid,"前回クリア日時","datetime-local",isoToLocal(p.previousClearAt),function(v){p.previousClearAt=localToIso(v);changed()});
  field(identityGrid,"経過時間（h）","number",p.elapsedHours,function(v){p.elapsedHours=numOrNull(v);changed()},{min:0,step:0.1});
  root.appendChild(identity);

  var totals=el("div","vdrSalesCard"),totalsGrid=el("div","vdrSalesGrid"),totalsSummary=el("div","vdrSalesSummary");
  totals.appendChild(el("div","vdrSalesTitle","帳票合計"));totals.appendChild(totalsGrid);
  field(totalsGrid,"売上数合計","number",p.totalQty,function(v){p.totalQty=intOrNull(v);changed()},{min:0,step:1});
  field(totalsGrid,"売上金額","number",p.totalAmount,function(v){p.totalAmount=intOrNull(v);changed()},{min:0,step:1});
  totals.appendChild(totalsSummary);
  var calcQty=metric(totalsSummary,"商品行から計算","— 本"),calcAmount=metric(totalsSummary,"商品行から計算","— 円");
  root.appendChild(totals);

  var productsCard=el("div","vdrSalesCard"),productsList=el("div"),addProduct=el("button","vdrSalesAdd","＋ 商品行を追加");
  addProduct.type="button";productsCard.appendChild(el("div","vdrSalesTitle","商品別売上"));productsCard.appendChild(productsList);productsCard.appendChild(addProduct);root.appendChild(productsCard);
  addProduct.addEventListener("click",function(){p.products.push({productCode:"",printedName:"",temperature:null,column:null,price:1,salesQty:0});renderProducts();changed()});

  var soldCard=el("div","vdrSalesCard"),soldList=el("div"),addSold=el("button","vdrSalesAdd","＋ 売切情報を追加");
  addSold.type="button";soldCard.appendChild(el("div","vdrSalesTitle","売切情報"));soldCard.appendChild(soldList);soldCard.appendChild(addSold);root.appendChild(soldCard);
  addSold.addEventListener("click",function(){p.soldOuts.push({productCode:"",column:null,temperature:null,soldOutElapsedHours:0});renderSoldOuts();changed()});

  var validationBox=el("div","vdrSalesValidation warn","確認中…");root.appendChild(validationBox);
  var approvalWrap=el("label","vdrSalesApproval");approval=document.createElement("input");approval.type="checkbox";approvalWrap.appendChild(approval);approvalWrap.appendChild(el("span","","実際の売上ジャーナルと照合し、この内容をAnalyticsの下書きとして保存してよいことを確認しました。"));root.appendChild(approvalWrap);
  var save=el("button","vdrSalesSave","確認して下書きを作成");save.type="button";save.disabled=true;root.appendChild(save);
  var status=el("div","vdrSalesStatus","まだ保存されていません。自動確定・在庫変動・legacyデータ変更は行いません。");root.appendChild(status);
  approval.addEventListener("change",updateSaveState);

  function productName(code){for(var i=0;i<p.products.length;i++)if(p.products[i].productCode===code)return p.products[i].printedName||"";return ""}
  function renderProducts(){
    productsList.innerHTML="";
    p.products.forEach(function(item,index){
      var line=el("div","vdrSalesLine"),top=el("div","vdrSalesLineTop"),grid=el("div","vdrSalesGrid"),remove=el("button","vdrSalesRemove","削除");
      remove.type="button";top.appendChild(el("b","",String(index+1)+"行目"));top.appendChild(remove);line.appendChild(top);line.appendChild(grid);
      field(grid,"商品コード","text",item.productCode,function(v){item.productCode=v.trim();changed()});
      field(grid,"商品名","text",item.printedName,function(v){item.printedName=v;changed()});
      field(grid,"単価","number",item.price,function(v){item.price=intOrNull(v);changed()},{min:1,step:1});
      field(grid,"売上数","number",item.salesQty,function(v){item.salesQty=intOrNull(v);changed()},{min:0,step:1});
      field(grid,"コラム（任意）","number",item.column===null?"":item.column,function(v){item.column=intOrNull(v);changed()},{min:1,step:1});
      field(grid,"温度（任意）","select",item.temperature||"",function(v){item.temperature=v||null;changed()},{choices:[{value:"",label:"未設定"},{value:"COLD",label:"COLD"},{value:"HOT",label:"HOT"}]});
      remove.addEventListener("click",function(){p.products.splice(index,1);renderProducts();changed()});
      productsList.appendChild(line);
    });
    if(!p.products.length)productsList.appendChild(el("div","vdrSalesStatus","商品行がありません。OCR漏れの場合は追加してください。"));
  }
  function renderSoldOuts(){
    soldList.innerHTML="";
    p.soldOuts.forEach(function(item,index){
      var line=el("div","vdrSalesLine"),top=el("div","vdrSalesLineTop"),grid=el("div","vdrSalesGrid"),remove=el("button","vdrSalesRemove","削除");
      remove.type="button";top.appendChild(el("b","","売切 "+String(index+1)));top.appendChild(remove);line.appendChild(top);line.appendChild(grid);
      field(grid,"商品コード","text",item.productCode,function(v){item.productCode=v.trim();changed()});
      field(grid,"コラム","number",item.column===null?"":item.column,function(v){item.column=intOrNull(v);changed()},{min:1,step:1});
      field(grid,"温度","select",item.temperature||"",function(v){item.temperature=v||null;changed()},{choices:[{value:"",label:"未設定"},{value:"COLD",label:"COLD"},{value:"HOT",label:"HOT"}]});
      field(grid,"売切経過時間（h）","number",item.soldOutElapsedHours,function(v){item.soldOutElapsedHours=numOrNull(v);changed()},{min:0,step:0.1});
      var name=productName(item.productCode);if(name)line.appendChild(el("div","vdrSalesStatus","商品名: "+name));
      remove.addEventListener("click",function(){p.soldOuts.splice(index,1);renderSoldOuts();changed()});
      soldList.appendChild(line);
    });
    if(!p.soldOuts.length)soldList.appendChild(el("div","vdrSalesStatus","売切情報なし"));
  }
  function totalsFromLines(){
    var qty=0,amount=0,valid=true;
    p.products.forEach(function(item){
      if(!Number.isInteger(item.salesQty)||!Number.isInteger(item.price)){valid=false;return}
      qty+=item.salesQty;amount+=item.salesQty*item.price;
    });
    return {valid:valid,qty:qty,amount:amount};
  }
  function validate(){
    var calc=totalsFromLines();
    calcQty.textContent=calc.valid?calc.qty.toLocaleString("ja-JP")+" 本":"—";
    calcAmount.textContent=calc.valid?calc.amount.toLocaleString("ja-JP")+" 円":"—";
    var api=global.VENDRIVE2Analytics,official=null,error=null;
    try{
      if(!api||!api.data||!api.data.reports||typeof api.data.reports.validatePayload!=="function")throw new Error("validator unavailable");
      official=api.data.reports.validatePayload("sales",review.identity&&review.identity.occurredAt,p);
    }catch(e){error=e}
    if(official&&official.readyToConfirm===true){
      validationBox.className="vdrSalesValidation ok";
      validationBox.textContent="照合OK：商品行の数量・金額と帳票合計が一致し、必須項目も確認できます。";
      return true;
    }
    validationBox.className="vdrSalesValidation warn";
    var messages=[];
    if(calc.valid&&calc.qty!==p.totalQty)messages.push("売上数合計が商品行と一致していません");
    if(calc.valid&&calc.amount!==p.totalAmount)messages.push("売上金額が商品行と一致していません");
    if(!review.identity||!review.identity.occurredAt)messages.push("売上日時を確認してください");
    if(!review.identity||!review.identity.makerKey)messages.push("メーカーを確認してください");
    if(!review.identity||!review.identity.vendorNumber)messages.push("自販機番号を確認してください");
    if(!messages.length)messages.push(error&&error.message?error.message:"OCR候補に未確認項目があります");
    validationBox.textContent="要確認："+messages.join(" / ");
    return false;
  }
  function updateSaveState(){var valid=validate();save.disabled=saved||!approval.checked||!valid}
  function changed(){if(approval){approval.checked=false}updateSaveState()}
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

  renderProducts();renderSoldOuts();updateSaveState();
  return {mounted:true,review:review};
}

global.VENDRIVE2SalesReview=Object.freeze({version:1,mount:mount});
})(window);
