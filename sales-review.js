(function(){
  "use strict";

  var reviewState=null,reviewRequested=false,installed=false;

  function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]})}
  function clone(value){return JSON.parse(JSON.stringify(value))}
  function byId(id){return document.getElementById(id)}
  function typeOf(review){var c=review&&review.classification;return c&&(c.effectiveType||c.selectedType||c.detectedType)||null}
  function num(value,fallback){var n=Number(value);return Number.isFinite(n)?n:fallback}
  function int(value,fallback){var n=Number(value);return Number.isInteger(n)?n:fallback}
  function localDateTime(value){if(!value)return"";var d=new Date(value);if(Number.isNaN(d.getTime()))return"";var local=new Date(d.getTime()+9*3600000);return local.toISOString().slice(0,16)}
  function isoFromLocal(value){return value?value+":00+09:00":null}

  function style(){
    if(byId("vendriveSalesReviewStyle"))return;
    var node=document.createElement("style");node.id="vendriveSalesReviewStyle";node.textContent=".salesReview{margin-top:12px;display:grid;gap:10px}.salesReviewSection{border:1px solid var(--line);border-radius:15px;background:#fff;padding:12px}.salesReviewSectionHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}.salesReviewSectionHead b{font-size:12px}.salesReviewSectionHead span{font-size:9px;color:var(--muted)}.salesReviewGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.salesReviewField{min-width:0}.salesReviewField.full{grid-column:1/-1}.salesReviewField label{display:block;margin-bottom:4px;color:#777;font-size:9px;font-weight:900}.salesReviewField input,.salesReviewField select{width:100%;min-width:0;border:1px solid #ddd;border-radius:10px;background:#fafafa;padding:9px;font-size:11px;outline:none}.salesProductList,.salesSoldOutList{display:grid;gap:8px}.salesProductRow,.salesSoldOutRow{border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;padding:10px}.salesProductTop,.salesSoldOutTop{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.salesProductTop b,.salesSoldOutTop b{font-size:10px}.salesRowDelete{border:0;background:transparent;color:#b42318;font-size:9px;font-weight:900;padding:4px}.salesProductFields{display:grid;grid-template-columns:1fr 1fr;gap:7px}.salesProductFields .wide{grid-column:1/-1}.salesReviewCheck{display:grid;grid-template-columns:1fr 1fr;gap:7px}.salesReviewCheck>div{border:1px solid #e5e7eb;border-radius:11px;padding:9px;background:#fafafa}.salesReviewCheck span{display:block;color:#777;font-size:9px}.salesReviewCheck b{display:block;margin-top:2px;font-size:11px}.salesReviewCheck .ok{color:#166534}.salesReviewCheck .bad{color:#b42318}.salesReviewWarning{margin-top:8px;border-radius:11px;padding:9px 10px;background:#fff7ed;color:#9a3412;font-size:10px;font-weight:800;line-height:1.45}.salesReviewAction{width:100%;margin-top:10px;padding:12px;border:0;border-radius:12px;background:#111;color:#fff;font-size:12px;font-weight:900}.salesReviewAction:disabled{opacity:.45;cursor:not-allowed}.salesReviewAdd{width:100%;margin-top:8px;border:1px dashed #cfd2d6;border-radius:10px;background:#fff;padding:9px;color:#555;font-size:10px;font-weight:850}.salesDraftSuccess{border:1px solid #bbf7d0;border-radius:13px;background:#f0fdf4;padding:11px;color:#166534;font-size:10px;font-weight:800;line-height:1.5}@media(max-width:350px){.salesReviewGrid,.salesReviewCheck,.salesProductFields{grid-template-columns:1fr}.salesReviewField.full,.salesProductFields .wide{grid-column:auto}}";document.head.appendChild(node)
  }

  function updateCopy(){
    var hint=document.querySelector(".reportCaptureHint"),notice=document.querySelector(".reportCaptureNotice");
    if(hint)hint.textContent="販売・投入・回収の帳票をOCRで読み取り、保存前に内容を確認・修正します。画像自体は保存しません。";
    if(notice)notice.innerHTML="<b>OCR結果は必ず確認してください</b><div>OCRの値は候補です。自動確定・在庫移動・既存運用データへの書き込みは行いません。売上票は実紙に合わせて項目ごとに修正できます。</div>"
  }

  function productHtml(item,index){item=item||{};return '<div class="salesProductRow" data-sales-product="'+index+'"><div class="salesProductTop"><b>商品 '+(index+1)+'</b><button class="salesRowDelete" type="button" data-delete-product="'+index+'">削除</button></div><div class="salesProductFields"><div class="salesReviewField"><label>商品コード</label><input data-product-field="productCode" value="'+esc(item.productCode||"")+'"></div><div class="salesReviewField"><label>売価</label><input data-product-field="price" type="number" min="1" inputmode="numeric" value="'+esc(item.price==null?"":item.price)+'"></div><div class="salesReviewField wide"><label>商品名</label><input data-product-field="printedName" value="'+esc(item.printedName||"")+'"></div><div class="salesReviewField"><label>売上数</label><input data-product-field="salesQty" type="number" min="0" inputmode="numeric" value="'+esc(item.salesQty==null?"":item.salesQty)+'"></div></div></div>'}
  function soldOutHtml(item,index){item=item||{};var temp=item.temperature||"";return '<div class="salesSoldOutRow" data-sales-soldout="'+index+'"><div class="salesSoldOutTop"><b>売切 '+(index+1)+'</b><button class="salesRowDelete" type="button" data-delete-soldout="'+index+'">削除</button></div><div class="salesProductFields"><div class="salesReviewField"><label>コラム</label><input data-soldout-field="column" type="number" min="1" inputmode="numeric" value="'+esc(item.column==null?"":item.column)+'"></div><div class="salesReviewField"><label>商品コード</label><input data-soldout-field="productCode" value="'+esc(item.productCode||"")+'"></div><div class="salesReviewField"><label>温度</label><select data-soldout-field="temperature"><option value=""'+(!temp?' selected':'')+'>未判定</option><option value="COLD"'+(temp==='COLD'?' selected':'')+'>冷</option><option value="HOT"'+(temp==='HOT'?' selected':'')+'>温</option></select></div><div class="salesReviewField"><label>売切時間（H）</label><input data-soldout-field="soldOutElapsedHours" type="number" min="0" step="0.1" inputmode="decimal" value="'+esc(item.soldOutElapsedHours==null?"":item.soldOutElapsedHours)+'"></div></div></div>'}

  function collect(){
    if(!reviewState||!byId("salesReviewEditor"))return null;
    var review=clone(reviewState),payload=review.candidatePayload||{},oldProducts=payload.products||[];
    review.identity=review.identity||{};
    review.identity.occurredAt=isoFromLocal(byId("salesReviewOccurredAt").value);
    review.identity.makerKey=byId("salesReviewMakerKey").value.trim();
    review.identity.vendorNumber=byId("salesReviewVendorNumber").value.trim();
    payload.previousClearAt=isoFromLocal(byId("salesReviewPreviousClearAt").value);
    payload.elapsedHours=num(byId("salesReviewElapsedHours").value,-1);
    payload.totalQty=int(byId("salesReviewTotalQty").value,-1);
    payload.totalAmount=int(byId("salesReviewTotalAmount").value,-1);
    payload.products=Array.from(document.querySelectorAll("[data-sales-product]")).map(function(row,index){var original=oldProducts[index]||{};return {productCode:row.querySelector('[data-product-field="productCode"]').value.trim(),printedName:row.querySelector('[data-product-field="printedName"]').value.trim(),temperature:original.temperature===undefined?null:original.temperature,column:original.column===undefined?null:original.column,price:int(row.querySelector('[data-product-field="price"]').value,-1),salesQty:int(row.querySelector('[data-product-field="salesQty"]').value,-1)}});
    payload.soldOuts=Array.from(document.querySelectorAll("[data-sales-soldout]")).map(function(row){var temp=row.querySelector('[data-soldout-field="temperature"]').value,columnValue=row.querySelector('[data-soldout-field="column"]').value;return {productCode:row.querySelector('[data-soldout-field="productCode"]').value.trim(),column:columnValue===""?null:int(columnValue,null),temperature:temp||null,soldOutElapsedHours:num(row.querySelector('[data-soldout-field="soldOutElapsedHours"]').value,-1)}});
    review.candidatePayload=payload;return review
  }

  function validate(review){
    var p=review&&review.candidatePayload||{},products=Array.isArray(p.products)?p.products:[],sold=Array.isArray(p.soldOuts)?p.soldOuts:[];
    var qty=products.reduce(function(sum,item){return sum+(Number.isInteger(item.salesQty)&&item.salesQty>=0?item.salesQty:0)},0);
    var amount=products.reduce(function(sum,item){return sum+(Number.isInteger(item.salesQty)&&item.salesQty>=0&&Number.isInteger(item.price)&&item.price>0?item.salesQty*item.price:0)},0);
    var productsValid=products.length>0&&products.every(function(item){return !!item.productCode&&Number.isInteger(item.price)&&item.price>0&&Number.isInteger(item.salesQty)&&item.salesQty>=0});
    var soldValid=sold.every(function(item){return !!item.productCode&&(item.column===null||(Number.isInteger(item.column)&&item.column>0))&&(item.temperature===null||item.temperature==="HOT"||item.temperature==="COLD")&&typeof item.soldOutElapsedHours==="number"&&Number.isFinite(item.soldOutElapsedHours)&&item.soldOutElapsedHours>=0});
    var required=!!(review&&review.identity&&review.identity.occurredAt&&review.identity.makerKey&&review.identity.vendorNumber&&p.previousClearAt&&typeof p.elapsedHours==="number"&&p.elapsedHours>=0&&Number.isInteger(p.totalQty)&&p.totalQty>=0&&Number.isInteger(p.totalAmount)&&p.totalAmount>=0&&productsValid&&soldValid);
    var soldElapsedOk=sold.every(function(item){return item.soldOutElapsedHours<=p.elapsedHours});
    return {required:required,qty:qty,amount:amount,qtyMatch:qty===p.totalQty,amountMatch:amount===p.totalAmount,soldElapsedOk:soldElapsedOk}
  }

  function updateChecks(){
    var review=collect();if(!review)return;var v=validate(review),qty=byId("salesReviewQtyCheck"),amount=byId("salesReviewAmountCheck"),warning=byId("salesReviewWarning"),save=byId("salesReviewSave");
    if(qty)qty.innerHTML='<span>商品行の売上数</span><b class="'+(v.qtyMatch?'ok':'bad')+'">'+v.qty+' / 帳票 '+review.candidatePayload.totalQty+(v.qtyMatch?' ✓':' 不一致')+'</b>';
    if(amount)amount.innerHTML='<span>商品行の金額計</span><b class="'+(v.amountMatch?'ok':'bad')+'">¥'+v.amount.toLocaleString("ja-JP")+' / 帳票 ¥'+Math.max(0,review.candidatePayload.totalAmount).toLocaleString("ja-JP")+(v.amountMatch?' ✓':' 不一致')+'</b>';
    if(warning){var problems=[];if(!v.qtyMatch)problems.push("売上数合計が一致していません（下書きは要レビューになります）");if(!v.amountMatch)problems.push("売上金額が一致していません（下書きは要レビューになります）");if(!v.soldElapsedOk)problems.push("売切時間が経過時間を超えています（下書きは要レビューになります）");if(!v.required)problems.push("必須項目に未入力・不正な値があります");warning.textContent=problems.join("。");warning.classList.toggle("hidden",!problems.length)}
    if(save)save.disabled=!v.required
  }

  function renderRows(){var p=reviewState&&reviewState.candidatePayload||{},products=byId("salesReviewProducts"),sold=byId("salesReviewSoldOuts");if(products)products.innerHTML=(p.products||[]).map(productHtml).join("");if(sold)sold.innerHTML=(p.soldOuts||[]).map(soldOutHtml).join("");updateChecks()}
  function addProduct(){var next=collect();if(!next)return;next.candidatePayload.products.push({productCode:"",printedName:"",temperature:null,column:null,price:1,salesQty:0});reviewState=next;renderRows()}
  function addSoldOut(){var next=collect();if(!next)return;next.candidatePayload.soldOuts.push({productCode:"",column:null,temperature:null,soldOutElapsedHours:0});reviewState=next;renderRows()}
  function deleteProduct(index){var next=collect();if(!next)return;next.candidatePayload.products.splice(index,1);reviewState=next;renderRows()}
  function deleteSoldOut(index){var next=collect();if(!next)return;next.candidatePayload.soldOuts.splice(index,1);reviewState=next;renderRows()}

  function saveDraft(){
    var api=window.VENDRIVE2Analytics,button=byId("salesReviewSave"),result=byId("salesReviewSaveResult"),review=collect();if(!api||!api.capture||typeof api.capture.createDraftFromReview!=="function"||!review)return;
    var check=validate(review);if(!check.required){updateChecks();return}reviewState=review;button.disabled=true;button.textContent="下書きを作成中…";
    api.capture.createDraftFromReview({review:review,userApproved:true}).then(function(created){var status=created&&created.report&&created.report.status;button.textContent="下書き作成済み";button.disabled=true;if(result)result.innerHTML='<div class="salesDraftSuccess"><b>下書きを作成しました</b><br>'+(status==='needs_review'?'照合差異があるため「要レビュー」で保存しました。':'内容確認済みの下書きとして保存しました。')+'<br>まだ確定していません。在庫移動・既存運用データへの書き込みも行っていません。</div>'}).catch(function(error){console.error("Sales review draft creation failed",error);button.textContent="確認して下書きを作成";button.disabled=false;if(result)result.innerHTML='<div class="salesReviewWarning">下書きを作成できませんでした。入力内容を確認してください。</div>'})
  }

  function bindEditor(){var root=byId("salesReviewEditor");if(!root)return;root.oninput=updateChecks;root.onchange=updateChecks;root.onclick=function(event){var p=event.target.closest("[data-delete-product]"),s=event.target.closest("[data-delete-soldout]");if(p){deleteProduct(Number(p.dataset.deleteProduct));return}if(s){deleteSoldOut(Number(s.dataset.deleteSoldout));return}};byId("salesReviewAddProduct").onclick=addProduct;byId("salesReviewAddSoldOut").onclick=addSoldOut;byId("salesReviewSave").onclick=saveDraft}

  function render(review){
    if(typeOf(review)!=="sales"||!review.candidatePayload||!Array.isArray(review.candidatePayload.products))return;
    reviewState=clone(review);var p=reviewState.candidatePayload||{},identity=reviewState.identity||{},result=byId("reportCaptureReviewResult");if(!result)return;
    result.innerHTML='<div id="salesReviewEditor" class="salesReview"><div class="salesReviewSection"><div class="salesReviewSectionHead"><b>帳票情報</b><span>実紙を見ながら確認</span></div><div class="salesReviewGrid"><div class="salesReviewField full"><label>帳票日時</label><input id="salesReviewOccurredAt" type="datetime-local" value="'+esc(localDateTime(identity.occurredAt))+'"></div><div class="salesReviewField"><label>メーカー</label><input id="salesReviewMakerKey" value="'+esc(identity.makerKey||"")+'"></div><div class="salesReviewField"><label>ベンダー番号</label><input id="salesReviewVendorNumber" value="'+esc(identity.vendorNumber||"")+'"></div><div class="salesReviewField full"><label>前回クリア日時</label><input id="salesReviewPreviousClearAt" type="datetime-local" value="'+esc(localDateTime(p.previousClearAt))+'"></div><div class="salesReviewField"><label>経過時間（H）</label><input id="salesReviewElapsedHours" type="number" min="0" step="0.1" inputmode="decimal" value="'+esc(p.elapsedHours==null?"":p.elapsedHours)+'"></div><div class="salesReviewField"><label>売上数合計</label><input id="salesReviewTotalQty" type="number" min="0" inputmode="numeric" value="'+esc(p.totalQty==null?"":p.totalQty)+'"></div><div class="salesReviewField full"><label>売上金額</label><input id="salesReviewTotalAmount" type="number" min="0" inputmode="numeric" value="'+esc(p.totalAmount==null?"":p.totalAmount)+'"></div></div></div><div class="salesReviewSection"><div class="salesReviewSectionHead"><b>商品別売上</b><span>コード・商品名・売価・売上数</span></div><div id="salesReviewProducts" class="salesProductList"></div><button id="salesReviewAddProduct" class="salesReviewAdd" type="button">＋ 商品行を追加</button></div><div class="salesReviewSection"><div class="salesReviewSectionHead"><b>合計照合</b><span>商品行と帳票合計</span></div><div class="salesReviewCheck"><div id="salesReviewQtyCheck"></div><div id="salesReviewAmountCheck"></div></div><div id="salesReviewWarning" class="salesReviewWarning hidden"></div></div><div class="salesReviewSection"><div class="salesReviewSectionHead"><b>売切情報</b><span>コラム・商品コード・温度・売切時間</span></div><div id="salesReviewSoldOuts" class="salesSoldOutList"></div><button id="salesReviewAddSoldOut" class="salesReviewAdd" type="button">＋ 売切行を追加</button></div><div class="analysisNote">このボタンで作るのは確認済みの下書きだけです。自動確定・在庫移動・legacy書き込みは行いません。</div><button id="salesReviewSave" class="salesReviewAction" type="button">確認して下書きを作成</button><div id="salesReviewSaveResult"></div></div>';
    renderRows();bindEditor()
  }

  function install(){
    if(installed)return true;var api=window.VENDRIVE2Analytics,button=byId("prepareReportCaptureReview");if(!api||!api.capture||typeof api.capture.prepareOcrReview!=="function"||!button)return false;
    installed=true;style();updateCopy();
    var original=api.capture.prepareOcrReview;
    api.capture.prepareOcrReview=function(input){return Promise.resolve(original.call(api.capture,input)).then(function(review){reviewState=clone(review);if(reviewRequested)setTimeout(function(){if(reviewRequested){reviewRequested=false;render(review)}},0);return review})};
    button.addEventListener("click",function(){reviewRequested=true},true);
    var close=byId("closeReportCapture");if(close)close.addEventListener("click",function(){reviewState=null;reviewRequested=false});
    window.VENDRIVE2SalesReview=Object.freeze({version:1,render:function(review){render(clone(review))}});
    return true
  }

  function start(){if(install())return;var tries=0,timer=setInterval(function(){tries++;if(install()||tries>100)clearInterval(timer)},50)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start()
})();
