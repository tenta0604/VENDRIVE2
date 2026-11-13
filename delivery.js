/* VENDRIVE FINAL.58 — independent delivery locations and non-recurring requests.
 * Stored only in legacy vendrive2_v7_data via the host bridge; no DB/schema change.
 * A sale-price field is free-text reference metadata, never used in arithmetic.
 */
(function(){
'use strict';
var host=window.VENDRIVE2DeliveryBridge;
if(!host)return;
var byId=function(id){return document.getElementById(id)};
var editingSiteId=null,editingRequestId=null,requestSiteId=null,sitePinDraft=null,draftItems=[],currentDetailId=null;
var units=['ケース','本','箱','袋','その他'];
function state(){return host.getState()}
function sites(){return state().deliverySites||[]}
function requests(){return state().deliveryRequests||[]}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#039;'}[c]})}
function uid(prefix){return prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,9)}
function today(){return host.today()}
function validDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;var d=new Date(v+'T00:00:00');return !isNaN(d.getTime())&&d.getFullYear()===Number(v.slice(0,4))&&(d.getMonth()+1)===Number(v.slice(5,7))&&d.getDate()===Number(v.slice(8,10))}
function siteOf(req){return sites().find(function(s){return s.id===req.siteId})}
function bySite(id){return requests().filter(function(r){return r.siteId===id})}
function activeRequests(id){return bySite(id).filter(function(r){return r.status==='pending'})}
function lastCompleted(id){return bySite(id).filter(function(r){return r.status==='done'}).sort(function(a,b){return Number(b.completedAt||0)-Number(a.completedAt||0)})[0]||null}
function hasPin(s){return s&&typeof s.lat==='number'&&isFinite(s.lat)&&s.lat>=-90&&s.lat<=90&&typeof s.lng==='number'&&isFinite(s.lng)&&s.lng>=-180&&s.lng<=180}
function safeText(v,max){return String(v==null?'':v).trim().slice(0,max)}
function itemSummary(item){return (item.name||'商品名未設定')+' '+(item.quantity||'')+(item.unit||'')+(item.sellPrice?' ・ 売値 '+item.sellPrice:'')}
function previewItems(items){return (items||[]).map(function(item){return '<div class="deliveryItemMeta">・'+esc(itemSummary(item))+'</div>'}).join('')}
function siteName(req){var s=siteOf(req);return s?s.name:(req.siteName||'削除された納品先')}
function siteCode(req){var s=siteOf(req);return s?s.code:(req.siteCode||'')}
function nextDate(label){return label||today()}
function dueRequestsOn(date){return requests().filter(function(r){return r.status==='pending'&&r.scheduledDate<=date}).sort(function(a,b){return a.scheduledDate.localeCompare(b.scheduledDate)||a.createdAt-b.createdAt})}
function pendingSort(){return requests().filter(function(r){return r.status==='pending'}).sort(function(a,b){return a.scheduledDate.localeCompare(b.scheduledDate)||a.createdAt-b.createdAt})}
function completedSort(){return requests().filter(function(r){return r.status==='done'}).sort(function(a,b){return (b.completedAt||0)-(a.completedAt||0)})}
function store(){host.persist();host.renderAll()}
function notify(message){host.toast(message)}
function displayModal(id){host.openModal(id)}
function hideModal(id){host.closeModal(id)}
function ensureMarkup(){
 if(byId('deliveryPage'))return;
 document.querySelector('.tabs').insertAdjacentHTML('beforeend','<button type="button" data-page="deliveryPage" id="deliveryNav">納品</button>');
 document.querySelector('main.main').insertAdjacentHTML('beforeend',
 '<section id="deliveryPage" class="page hidden">'+
   '<div class="row"><div><div class="ey">DELIVERIES</div><div class="title">納品</div><div class="subtitle">納品先を登録し、依頼が来たときだけ予定を追加</div></div><button type="button" class="primary pill" id="deliveryAddSite">＋納品先</button></div>'+
   '<div class="notice">納品は不定期です。依頼が届いたときだけ商品・数量・売値メモ・納品予定日を登録します。自販機の訪問周期には影響しません。</div>'+
   '<div class="section"><div class="sectionhead"><b>納品先</b><span class="muted" id="deliverySiteCount"></span></div><div class="search"><span class="searchIcon">⌕</span><input id="deliverySiteSearch" aria-label="納品先を検索" placeholder="納品先名・住所・管理番号を検索"></div><div id="deliverySitesList"></div></div>'+
   '<div class="section"><div class="sectionhead"><b>対応待ちの納品依頼</b><span class="muted" id="deliveryPendingCount"></span></div><div id="deliveryPendingList"></div></div>'+
   '<div class="section"><div class="sectionhead"><b>完了した納品履歴</b><span class="muted" id="deliveryHistoryCount"></span></div><div id="deliveryHistoryList"></div></div>'+
 '</section>');
 var tomorrow=byId('tomorrowList');
 if(tomorrow)tomorrow.insertAdjacentHTML('afterend',
 '<div class="section" id="tomorrowDeliverySection"><div class="sectionhead"><b>翌出勤日の納品</b><span class="muted" id="tomorrowDeliveryCount"></span></div><div id="tomorrowDeliveryList"></div></div>');
 var mapList=byId('mapList');
 if(mapList)mapList.parentNode.insertAdjacentHTML('afterend',
 '<div class="section"><div class="sectionhead"><b>表示中の納品先</b><span class="muted" id="deliveryMapCount"></span></div><div id="deliveryMapList"></div></div>');
 document.body.insertAdjacentHTML('beforeend',
 '<div class="modal" id="deliverySiteEditor"><div class="sheet">'+
   '<div class="modalTop"><div><div class="ey">DELIVERY LOCATION</div><div class="title" id="deliverySiteEditorTitle">納品先登録</div></div><button type="button" class="pill" id="deliverySiteEditorClose">閉じる</button></div>'+
   '<div class="formGroup"><label for="deliverySiteName">納品先名</label><input id="deliverySiteName" maxlength="120" placeholder="店舗名・会社名など"></div>'+
   '<div class="formGroup"><label for="deliverySiteCode">管理番号</label><input id="deliverySiteCode" maxlength="80" placeholder="例：D-001"></div>'+
   '<div class="formGroup"><label for="deliverySiteAddress">住所</label><input id="deliverySiteAddress" maxlength="250" placeholder="住所（任意）"></div>'+
   '<div class="formGroup"><label for="deliverySiteMemo">納品先メモ</label><textarea id="deliverySiteMemo" maxlength="1000" rows="2" placeholder="駐車場所など（任意）"></textarea></div>'+
   '<div class="formGroup"><label>MAPピン</label><div class="row"><span class="meta" id="deliverySitePinText">未設定</span><button type="button" class="secondary" id="deliverySitePickPin">地図で位置指定</button></div></div>'+
   '<div class="actions"><button type="button" class="secondary" id="deliverySiteEditorCancel">キャンセル</button><button type="button" class="primary" id="deliverySiteSave">保存する</button></div>'+
   '<button type="button" class="secondary hidden" id="deliverySiteDelete" style="width:100%;margin-top:9px;color:#b91c1c">この納品先を削除</button>'+
 '</div></div>'+
 '<div class="modal" id="deliverySiteDetail"><div class="sheet">'+
   '<div class="modalTop"><div><div class="ey">DELIVERY LOCATION</div><div class="title" id="deliveryDetailName"></div></div><button type="button" class="pill" id="deliveryDetailClose">閉じる</button></div>'+
   '<div class="meta" id="deliveryDetailCode"></div><div class="meta" id="deliveryDetailAddress"></div><div class="meta" id="deliveryDetailMemo"></div>'+
   '<div class="section"><b>この納品先の依頼</b><div id="deliveryDetailRequests"></div></div>'+
   '<div class="section"><b>前回の納品</b><div class="meta" id="deliveryDetailLast"></div></div>'+
   '<div class="actions"><button type="button" class="primary" id="deliveryDetailNewRequest">＋依頼登録</button><button type="button" class="secondary" id="deliveryDetailEdit">納品先を編集</button></div>'+
   '<div class="actions"><button type="button" class="secondary" id="deliveryDetailExternal">外部ナビ</button></div>'+
 '</div></div>'+
 '<div class="modal" id="deliveryRequestEditor"><div class="sheet">'+
   '<div class="modalTop"><div><div class="ey">DELIVERY REQUEST</div><div class="title" id="deliveryRequestEditorTitle">納品依頼</div></div><button type="button" class="pill" id="deliveryRequestClose">閉じる</button></div>'+
   '<div class="meta" id="deliveryRequestSiteLabel"></div>'+
   '<div class="formGroup"><label for="deliveryRequestDate">納品予定日</label><input type="date" id="deliveryRequestDate"></div>'+
   '<div class="sectionhead" style="margin-top:12px"><b>商品・数量・売値メモ</b><button type="button" class="secondary" id="deliveryCopyPrevious">前回の納品をコピー</button></div>'+
   '<div class="meta">売値は「150円／本」「2,400円／ケース」など自由入力。金額計算はしません。</div>'+
   '<div id="deliveryRequestItems"></div>'+
   '<datalist id="deliveryProductSuggestions"></datalist>'+
   '<button type="button" class="secondary" id="deliveryAddProduct" style="width:100%;margin-top:9px">＋商品を追加</button>'+
   '<div class="formGroup"><label for="deliveryRequestMemo">今回の依頼メモ</label><textarea id="deliveryRequestMemo" maxlength="1500" rows="3" placeholder="納品時の注意など（任意）"></textarea></div>'+
   '<div class="actions"><button type="button" class="secondary" id="deliveryRequestCancel">キャンセル</button><button type="button" class="primary" id="deliveryRequestSave">依頼を保存</button></div>'+
 '</div></div>');
 var style=document.createElement('style');style.textContent=
  '#deliveryPage .item,#deliverySiteDetail .item,#todayList .deliverySwipeCard{align-items:flex-start}'+
  '.deliveryItemMeta{color:#69727e;font-size:10px;line-height:1.5;margin-top:4px;overflow-wrap:anywhere}'+
  '.deliveryCardMain{flex:1;min-width:0;overflow-wrap:anywhere}.deliveryActions{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end;align-items:center}'+
  '.deliveryActions button{padding:7px 9px}.deliveryTodayActions{display:flex;flex-direction:column;align-items:flex-end;gap:7px;flex-shrink:0}.deliveryTodayActions>.deliveryQuickNav{min-height:36px;font-size:10px;padding:9px 10px;white-space:nowrap}.deliveryProductRow{border:1px solid #e3e4e6;background:#fff;padding:10px;border-radius:13px;margin-top:9px}'+
  '.deliveryProductRow label{display:block;color:#6b7280;font-size:10px;margin-bottom:5px}.deliveryProductRow input,.deliveryProductRow select{border:1px solid #ddd;border-radius:9px;background:white;min-width:0;width:100%;padding:10px;font-size:12px}'+
  '.deliveryProductGrid{display:grid;grid-template-columns:1fr 110px;gap:7px;margin-top:9px}.deliveryProductRow button{font-size:11px}'+
  '.vendrive-delivery-pin{background:transparent!important;border:0!important}.deliveryMapPin{background:#0891b2;border:3px solid white;box-shadow:0 2px 10px #0006;border-radius:9px;width:32px;height:32px;color:#fff;display:grid;place-items:center;font-size:16px;font-weight:900;position:relative}'+
  '.deliveryMapPin.done{background:#64748b}.deliveryMapPin small{position:absolute;right:-8px;top:-8px;background:#111;color:#fff;border:2px solid #fff;border-radius:100%;min-width:18px;height:18px;display:grid;place-items:center;font-size:9px}';
 document.head.appendChild(style);
 byId('deliveryNav').onclick=function(){host.showPage('deliveryPage');render()};
 byId('deliveryAddSite').onclick=function(){openSiteEditor(null)};
 byId('deliverySiteSearch').oninput=renderSites;
 byId('deliverySiteEditorClose').onclick=closeSiteEditor;
 byId('deliverySiteEditorCancel').onclick=closeSiteEditor;
 byId('deliverySiteSave').onclick=saveSite;
 byId('deliverySitePickPin').onclick=function(){host.beginSitePinPicker(sitePinDraft)};
 byId('deliverySiteDelete').onclick=deleteSite;
 byId('deliveryDetailClose').onclick=function(){hideModal('deliverySiteDetail')};
 byId('deliveryDetailEdit').onclick=function(){var id=currentDetailId;hideModal('deliverySiteDetail');openSiteEditor(id)};
 byId('deliveryDetailNewRequest').onclick=function(){var id=currentDetailId;hideModal('deliverySiteDetail');openRequestEditor(id,null)};
  byId('deliveryDetailExternal').onclick=function(){externalMap(currentDetailId)};
 byId('deliveryRequestClose').onclick=closeRequestEditor;
 byId('deliveryRequestCancel').onclick=closeRequestEditor;
 byId('deliveryRequestSave').onclick=saveRequest;
 byId('deliveryCopyPrevious').onclick=copyPrevious;
 byId('deliveryAddProduct').onclick=function(){draftItems=readProducts();draftItems.push(blankItem());renderProducts()};
 byId('deliveryRequestItems').addEventListener('click',function(event){var btn=event.target.closest('button[data-remove-product]');if(!btn)return;draftItems=readProducts();draftItems.splice(Number(btn.dataset.removeProduct),1);if(!draftItems.length)draftItems=[blankItem()];renderProducts()});
}
function openSiteEditor(id){
 editingSiteId=id||null;var s=id&&sites().find(function(x){return x.id===id});
 if(id&&!s){notify('納品先が見つかりません');return}
 byId('deliverySiteEditorTitle').textContent=s?'納品先を編集':'納品先を登録';
 byId('deliverySiteName').value=s?s.name:'';
 byId('deliverySiteCode').value=s?s.code:'';
 byId('deliverySiteAddress').value=s?s.address||'':'';
 byId('deliverySiteMemo').value=s?s.memo||'':'';
 sitePinDraft=s&&hasPin(s)?{lat:s.lat,lng:s.lng}:null;
 showPinLabel();
 byId('deliverySiteDelete').classList.toggle('hidden',!s);
 displayModal('deliverySiteEditor');
}
function showPinLabel(){byId('deliverySitePinText').textContent=sitePinDraft?'設定済み（'+sitePinDraft.lat.toFixed(5)+', '+sitePinDraft.lng.toFixed(5)+'）':'ピン未設定'}
function closeSiteEditor(){editingSiteId=null;sitePinDraft=null;hideModal('deliverySiteEditor')}
function saveSite(){
 var name=safeText(byId('deliverySiteName').value,120),code=safeText(byId('deliverySiteCode').value,80);
 if(!name||!code){notify('納品先名と管理番号を入力してください');return}
 if(sites().some(function(x){return x.id!==editingSiteId&&x.code.trim().toLowerCase()===code.toLowerCase()})){notify('この管理番号は別の納品先で使用されています');return}
 var s=editingSiteId&&sites().find(function(x){return x.id===editingSiteId});
 if(!s){s={id:uid('DL'),createdAt:Date.now()};state().deliverySites.push(s)}
 s.name=name;s.code=code;s.address=safeText(byId('deliverySiteAddress').value,250);s.memo=safeText(byId('deliverySiteMemo').value,1000);
 s.lat=sitePinDraft?sitePinDraft.lat:null;s.lng=sitePinDraft?sitePinDraft.lng:null;
 closeSiteEditor();store();notify('納品先を保存しました');
}
function deleteSite(){
 var s=editingSiteId&&sites().find(function(x){return x.id===editingSiteId});if(!s)return;
 if(bySite(s.id).length){notify('納品履歴・依頼がある納品先は削除できません');return}
 if(!confirm('納品先「'+s.name+'」を削除しますか？'))return;
 state().deliverySites=sites().filter(function(x){return x.id!==s.id});
 closeSiteEditor();store();notify('納品先を削除しました');
}
function openSiteDetail(id){
 var s=sites().find(function(x){return x.id===id});if(!s)return;
 currentDetailId=id;byId('deliveryDetailName').textContent=s.name;
 byId('deliveryDetailCode').textContent='管理番号：'+s.code;
 byId('deliveryDetailAddress').textContent=s.address||'住所未登録';
 byId('deliveryDetailMemo').textContent=s.memo||'';
 var pending=activeRequests(id),box=byId('deliveryDetailRequests');box.innerHTML='';
 if(!pending.length)box.innerHTML='<div class="meta">対応待ちの依頼はありません。</div>';
 pending.forEach(function(r){var e=document.createElement('div');e.className='item';e.innerHTML='<div class="deliveryCardMain"><b>納品予定 '+esc(r.scheduledDate)+'</b>'+previewItems(r.items)+'</div><button class="pill" type="button">確認</button>';e.querySelector('button').onclick=function(){hideModal('deliverySiteDetail');openRequestEditor(id,r.id)};box.appendChild(e)});
 var prev=lastCompleted(id);
 byId('deliveryDetailLast').innerHTML=prev?'<b>完了 '+esc(new Date(prev.completedAt).toLocaleDateString('ja-JP'))+'</b>'+previewItems(prev.items):'完了した納品履歴はまだありません。';
 byId('deliveryDetailExternal').disabled=!hasPin(s)&&!s.address;
 displayModal('deliverySiteDetail');
}
function blankItem(){return {name:'',quantity:'',unit:'ケース',sellPrice:''}}
function renderProducts(){
 var box=byId('deliveryRequestItems');box.innerHTML='';
 draftItems.forEach(function(item,i){
  var unitOptions=units.map(function(unit){return '<option'+(item.unit===unit?' selected':'')+'>'+esc(unit)+'</option>'}).join('');
  var e=document.createElement('div');e.className='deliveryProductRow';e.dataset.item=String(i);
  e.innerHTML='<div class="row"><b>商品 '+(i+1)+'</b><button class="secondary" type="button" data-remove-product="'+i+'">削除</button></div>'+
   '<label style="margin-top:7px">商品名</label><input data-field="name" list="deliveryProductSuggestions" maxlength="150" placeholder="商品名" value="'+esc(item.name)+'">'+
   '<div class="deliveryProductGrid"><div><label>数量</label><input data-field="quantity" maxlength="40" placeholder="例：2" value="'+esc(item.quantity)+'"></div><div><label>単位</label><select data-field="unit">'+unitOptions+'</select></div></div>'+
   '<label style="margin-top:9px">売値メモ（自由入力・計算なし）</label><input data-field="sellPrice" maxlength="120" placeholder="例：150円／本" value="'+esc(item.sellPrice)+'">';
  box.appendChild(e);
 });
}
function readProducts(){return Array.from(byId('deliveryRequestItems').querySelectorAll('.deliveryProductRow')).map(function(row){return {name:safeText(row.querySelector('[data-field="name"]').value,150),quantity:safeText(row.querySelector('[data-field="quantity"]').value,40),unit:units.includes(row.querySelector('[data-field="unit"]').value)?row.querySelector('[data-field="unit"]').value:'その他',sellPrice:safeText(row.querySelector('[data-field="sellPrice"]').value,120)}})}
function openRequestEditor(siteId,id){
 var s=sites().find(function(x){return x.id===siteId});if(!s){notify('納品先が見つかりません');return}
 var r=id&&requests().find(function(x){return x.id===id&&x.siteId===siteId&&x.status==='pending'});
 if(id&&!r){notify('完了済みの納品は編集できません');return}
 editingRequestId=r?r.id:null;requestSiteId=siteId;
 byId('deliveryRequestEditorTitle').textContent=r?'納品依頼を編集':'納品依頼を登録';
 byId('deliveryRequestSiteLabel').textContent=s.name+'（管理番号 '+s.code+'）';
 byId('deliveryRequestDate').value=r?r.scheduledDate:today();
 byId('deliveryRequestMemo').value=r?r.memo||'':'';
 draftItems=r?r.items.map(function(item){return {name:item.name||'',quantity:item.quantity||'',unit:item.unit||'ケース',sellPrice:item.sellPrice||''}}):[blankItem()];
 var prev=lastCompleted(siteId),copy=byId('deliveryCopyPrevious');
 copy.disabled=!prev;copy.title=prev?'前回完了した納品内容をコピーします':'前回の納品履歴がありません';
 copy.textContent=prev?'前回の納品をコピー':'前回の納品なし';
 var used={};bySite(siteId).forEach(function(req){(req.items||[]).forEach(function(item){if(item.name)used[item.name]=true})});
 byId('deliveryProductSuggestions').innerHTML=Object.keys(used).slice(0,100).map(function(name){return '<option value="'+esc(name)+'"></option>'}).join('');
 renderProducts();displayModal('deliveryRequestEditor');
}
function closeRequestEditor(){editingRequestId=null;requestSiteId=null;draftItems=[];hideModal('deliveryRequestEditor')}
function copyPrevious(){
 if(!requestSiteId)return;
 var previous=lastCompleted(requestSiteId);if(!previous){notify('前回の完了履歴がありません');return}
 draftItems=previous.items.map(function(item){return {name:item.name,quantity:item.quantity,unit:item.unit,sellPrice:item.sellPrice||''}});
 if(!draftItems.length)draftItems=[blankItem()];
 renderProducts();notify('前回の納品内容をコピーしました。自由に変更できます');
}
function saveRequest(){
 var s=sites().find(function(x){return x.id===requestSiteId});if(!s){notify('納品先が見つかりません');return}
 var date=byId('deliveryRequestDate').value;
 if(!validDate(date)){notify('正しい納品予定日を入力してください');return}
 var items=readProducts();
 if(!items.length||items.some(function(item){return !item.name||!item.quantity})){notify('すべての商品の名前と数量を入力してください');return}
 var r=editingRequestId&&requests().find(function(x){return x.id===editingRequestId&&x.status==='pending'});
 if(editingRequestId&&!r){notify('この依頼は編集できません');return}
 if(!r){r={id:uid('DR'),siteId:s.id,siteName:s.name,siteCode:s.code,status:'pending',createdAt:Date.now(),completedAt:null};state().deliveryRequests.push(r)}
 r.scheduledDate=date;r.items=items;r.memo=safeText(byId('deliveryRequestMemo').value,1500);r.updatedAt=Date.now();
 closeRequestEditor();store();notify('納品依頼を保存しました');
}
function completeRequest(id,fromSwipe){
 var r=requests().find(function(x){return x.id===id&&x.status==='pending'});if(!r)return false;
 if(!fromSwipe&&!confirm('「'+siteName(r)+'」の納品を完了にしますか？'))return false;
 r.status='done';r.completedAt=Date.now();
 store();notify('納品完了。履歴に保存しました');return true;
}
function deletePending(id){
 var r=requests().find(function(x){return x.id===id&&x.status==='pending'});if(!r)return;
 if(!confirm('この未完了の納品依頼を削除しますか？'))return;
 state().deliveryRequests=requests().filter(function(x){return x.id!==id});
 store();notify('未完了の依頼を削除しました');
}
function externalMap(siteId){
 var s=sites().find(function(x){return x.id===siteId});if(!s)return;
 host.externalNavigation(s);
}
function requestCard(r,compact,quickNav){
 var isLate=r.scheduledDate<today()&&r.status==='pending';
 var e=document.createElement('div');e.className='item'+(quickNav?' deliverySwipeCard':'')+(quickNav&&r.status==='done'?' done':'');e.dataset.requestId=r.id;
 e.innerHTML='<div class="deliveryCardMain"><b>📦 '+esc(siteName(r))+'</b>'+
  '<div class="meta">管理番号：'+esc(siteCode(r))+' ・ '+esc(r.scheduledDate)+(isLate?' ・ <b style="color:#b91c1c">予定日超過</b>':'')+'</div>'+
  previewItems(r.items)+(r.memo?'<div class="meta">メモ：'+esc(r.memo)+'</div>':'')+'</div>'+
  (quickNav?'<div class="todayCardActions"><span class="badge '+(r.status==='done'?'b-gray':'b-red')+'">'+(r.status==='done'?'納品完了':'未完了')+'</span><button type="button" class="primary pill todayExternalNav deliveryQuickNav">外部ナビ</button></div>':r.status==='done'?'<span class="badge b-green">納品完了</span>':'<div class="deliveryActions"><button type="button" class="pill" data-action="edit">編集</button><button type="button" class="primary pill" data-action="complete">完了</button>'+(compact?'':'<button type="button" class="pill" data-action="delete">削除</button>')+'</div>');
 if(r.status==='pending')e.querySelectorAll('button[data-action]').forEach(function(btn){btn.onclick=function(){
  if(btn.dataset.action==='complete')completeRequest(r.id);
  else if(btn.dataset.action==='edit')openRequestEditor(r.siteId,r.id);
  else deletePending(r.id);
 }});
 if(quickNav){e.onclick=function(){openSiteDetail(r.siteId)};e.querySelector('.deliveryQuickNav').onclick=function(ev){ev.stopPropagation();externalMap(r.siteId)}};
 return e;
}
function renderSites(){
 var box=byId('deliverySitesList');if(!box)return;
 var q=safeText(byId('deliverySiteSearch').value,250).toLowerCase(),list=sites().filter(function(s){return !q||[s.name,s.code,s.address].join(' ').toLowerCase().includes(q)});
 byId('deliverySiteCount').textContent=sites().length+'件';box.innerHTML='';
 if(!list.length){box.innerHTML='<div class="meta" style="padding:12px">納品先は登録されていません。</div>';return}
 list.forEach(function(s){
  var e=document.createElement('div');e.className='item';
  e.innerHTML='<div class="deliveryCardMain"><b>📍 '+esc(s.name)+'</b><div class="meta">管理番号：'+esc(s.code)+'</div><div class="meta">'+esc(s.address||'住所未登録')+' ・ '+(hasPin(s)?'ピン設定済み':'ピン未設定')+'</div><div class="meta">対応待ち：'+activeRequests(s.id).length+'件</div></div><div class="deliveryActions"><button type="button" class="primary pill" data-action="new">＋依頼</button><button type="button" class="pill" data-action="details">詳細</button></div>';
  e.querySelector('[data-action="new"]').onclick=function(){openRequestEditor(s.id,null)};
  e.querySelector('[data-action="details"]').onclick=function(){openSiteDetail(s.id)};
  box.appendChild(e);
 });
}
function renderPending(){
 var box=byId('deliveryPendingList');if(!box)return;
 var pending=pendingSort();byId('deliveryPendingCount').textContent=pending.length+'件';box.innerHTML='';
 if(!pending.length){box.innerHTML='<div class="meta" style="padding:10px">未完了の納品依頼はありません。</div>';return}
 pending.forEach(function(r){box.appendChild(requestCard(r,false))});
}
function renderHistory(){
 var box=byId('deliveryHistoryList');if(!box)return;
 var completed=completedSort();byId('deliveryHistoryCount').textContent=completed.length+'件';box.innerHTML='';
 if(!completed.length){box.innerHTML='<div class="meta" style="padding:10px">完了履歴はまだありません。</div>';return}
 completed.forEach(function(r){
   var e=requestCard(r,true),stamp=document.createElement('div');stamp.className='meta';stamp.textContent='完了日：'+(r.completedAt?new Date(r.completedAt).toLocaleString('ja-JP'):'不明');
   e.querySelector('.deliveryCardMain').appendChild(stamp);box.appendChild(e);
 });
}
function renderToday(){
 var box=byId('todayList');if(!box)return;
 box.querySelectorAll('.swipeRow[data-delivery-id]').forEach(function(row){row.remove()});
 var progress=host.todayDeliveryProgress();
 // Pending deliveries are actionable work: place them before completed vending cards.
 // Preserve the vending order and keep completed deliveries with completed work.
 var firstDoneCard=box.querySelector('.swipeRow[data-machine-id] > .swipeCard.done');
 var firstDoneRow=firstDoneCard&&firstDoneCard.parentNode;
 progress.pending.concat(progress.done).forEach(function(r){
  var row=document.createElement('div');row.className='swipeRow';row.dataset.deliveryId=r.id;
  row.innerHTML='<div class="swipeAction complete">納品完了</div>';
  var card=requestCard(r,true,true);card.classList.add('swipeCard');
  row.appendChild(card);
  if(r.status==='pending'&&firstDoneRow)box.insertBefore(row,firstDoneRow);
  else box.appendChild(row);
  if(r.status==='pending')host.attachTodayDeliverySwipe(row,function(){return completeRequest(r.id,true)});
 });
}
function renderTomorrow(){
 var box=byId('tomorrowDeliveryList');if(!box)return;
 var date=host.tomorrowDateIso(),due=dueRequestsOn(date);
 byId('tomorrowDeliveryCount').textContent='対応待ち '+due.length+'件';box.innerHTML='';
 if(!due.length){box.innerHTML='<div class="meta" style="padding:9px 2px">翌出勤日の納品依頼はありません。</div>';return}
 due.forEach(function(r){box.appendChild(requestCard(r,true))});
}
function mapSitesForMode(mode){
 var ctx=host.mapContext(),selected=ctx.date;
 if(mode==='all')return sites();
 var valid=requests().filter(function(r){if(r.status!=='pending')return false;return mode==='weekday'?r.scheduledDate===selected:r.scheduledDate<=selected});
 var ids={};valid.forEach(function(r){ids[r.siteId]=(ids[r.siteId]||0)+1});
 return sites().filter(function(s){return ids[s.id]});
}
function renderMap(){
 var ctx=host.mapContext(),mode=ctx.mode,layer=host.mapLayer();
 if(!layer||typeof window.L==='undefined')return;
 var list=mapSitesForMode(mode),box=byId('deliveryMapList');
 byId('deliveryMapCount').textContent=list.length+'件';
 box.innerHTML='';
 if(!list.length)box.innerHTML='<div class="meta" style="padding:10px">この表示条件の納品先はありません。</div>';
 list.forEach(function(s){
  var row=document.createElement('div');row.className='item';row.innerHTML='<div class="deliveryCardMain"><b>📦 '+esc(s.name)+'</b><div class="meta">管理番号：'+esc(s.code)+' ・ '+(hasPin(s)?'ピン設定済み':'位置未設定')+'</div></div><button class="pill" type="button">詳細</button>';
  row.querySelector('button').onclick=function(){openSiteDetail(s.id)};box.appendChild(row);
  if(!hasPin(s))return;
  var count=activeRequests(s.id).length;
  var icon=L.divIcon({className:'vendrive-delivery-pin',html:'<div class="deliveryMapPin">📦'+(count?'<small>'+Math.min(count,99)+'</small>':'')+'</div>',iconSize:[34,34],iconAnchor:[17,17]});
  var marker=L.marker([s.lat,s.lng],{icon:icon,title:s.name,zIndexOffset:900}).addTo(layer);
  marker.on('click',function(){openSiteDetail(s.id)});
 });
}
function mapFitLocations(){
 return mapSitesForMode(host.mapContext().mode).filter(hasPin).map(function(s){return [s.lat,s.lng]});
}
function render(){renderSites();renderPending();renderHistory();renderToday();if(byId('tomorrowDeliveryList'))renderTomorrow()}
function pinSelected(lat,lng){sitePinDraft={lat:lat,lng:lng};showPinLabel();displayModal('deliverySiteEditor');notify('ピンの位置を選択しました。保存すると登録されます')}
function pinCanceled(){displayModal('deliverySiteEditor')}
function init(){ensureMarkup();render()}
window.VENDRIVE2Delivery=Object.freeze({init:init,render:render,renderToday:renderToday,renderMap:renderMap,renderTomorrow:renderTomorrow,pinSelected:pinSelected,pinCanceled:pinCanceled,mapFitLocations:mapFitLocations,openSiteDetail:openSiteDetail,openRequestEditor:openRequestEditor});
init();
})();
