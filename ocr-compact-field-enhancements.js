(function(global){
"use strict";
var INSTALL_FLAG="__vendriveCompactFieldEnhancements",pendingContinuation=null,installTimer=null;
function api(){return global.VENDRIVE2Analytics||null}
function machineSnapshot(machineId){var bridge=global.VENDRIVE2ReadBridge;if(!machineId||!bridge||typeof bridge.getMachineSnapshot!=="function")return null;try{return bridge.getMachineSnapshot(machineId)}catch(error){return null}}
function candidateMachineId(review){var mm=review&&review.machineMatch,candidates=mm&&Array.isArray(mm.candidates)?mm.candidates:[];if(mm&&mm.status==="confirmed_mapping"&&mm.confirmedMapping&&!mm.confirmedMapping.missing)return mm.confirmedMapping.machineId||null;if(mm&&mm.status==="management_match"&&candidates.length===1)return candidates[0].machineId||null;return null}
function hasBlockingMachineMatch(review){var status=review&&review.machineMatch&&review.machineMatch.status;return status==="confirmed_mapping_conflict"||status==="ambiguous_management_match"||status==="stale_confirmed_mapping"}
function soldOutSignature(review){var p=review&&review.candidatePayload||{},rows=Array.isArray(p.soldOuts)?p.soldOuts:[];try{return JSON.stringify(rows)}catch(error){return String(rows.length)}}
function decorateSoldOuts(container,review){
  if(!container)return;
  var type=review&&review.classification&&review.classification.effectiveType,p=review&&review.candidatePayload||{},rows=Array.isArray(p.soldOuts)?p.soldOuts:[],old=container.querySelector(".vdrEnhSoldouts");
  if(type!=="sales"||!rows.length){if(old)old.remove();return}
  var sig=soldOutSignature(review);if(old&&old.getAttribute("data-vdr-sig")===sig)return;if(old)old.remove();
  var productNames={};(Array.isArray(p.products)?p.products:[]).forEach(function(item){if(item&&item.productCode)productNames[item.productCode]=item.printedName||""});
  var card=document.createElement("div");card.className="vdrCompactCard vdrEnhSoldouts";card.setAttribute("data-vdr-sig",sig);
  var head=document.createElement("div");head.className="vdrCompactSection";head.textContent="売り切れ";card.appendChild(head);
  var table=document.createElement("div");table.className="vdrCompactTable";
  rows.forEach(function(item){item=item||{};var row=document.createElement("div");row.className="vdrCompactRow";
    var code=document.createElement("div");code.className="vdrCompactCell";var codeText=document.createElement("span");codeText.className="vdrCompactItemCode";codeText.textContent=item.productCode||"—";code.appendChild(codeText);row.appendChild(code);
    var name=document.createElement("div");name.className="vdrCompactCell";var nameText=document.createElement("span");nameText.className="vdrCompactItemName";var temp=item.temperature==="HOT"?"温":item.temperature==="COLD"?"冷":"—";nameText.textContent=(productNames[item.productCode]||"商品名未取得")+" · "+temp;name.appendChild(nameText);row.appendChild(name);
    var detail=document.createElement("div");detail.className="vdrCompactCell";var detailText=document.createElement("span");detailText.className="vdrCompactItemQty";var bits=[];if(Number.isInteger(item.column)&&item.column>0)bits.push("列"+item.column);if(typeof item.soldOutElapsedHours==="number"&&isFinite(item.soldOutElapsedHours)&&item.soldOutElapsedHours>=0)bits.push(String(item.soldOutElapsedHours)+"h");detailText.textContent=bits.length?bits.join(" / "):"売切";detail.appendChild(detailText);row.appendChild(detail);table.appendChild(row)
  });
  card.appendChild(table);
  var productCard=Array.prototype.slice.call(container.querySelectorAll(".vdrCompactCard")).find(function(node){var title=node.querySelector(".vdrCompactSection");return title&&title.textContent==="商品別売上"});
  if(productCard&&productCard.parentNode)productCard.parentNode.insertBefore(card,productCard.nextSibling);else{var root=container.querySelector(".vdrCompact");if(root)root.appendChild(card)}
}
function decorateVisitContinuation(container,review,context){
  if(!container||!context||!context.machineId||hasBlockingMachineMatch(review))return;
  var currentCandidate=candidateMachineId(review),conflict=currentCandidate&&String(currentCandidate)!==String(context.machineId),card=Array.prototype.slice.call(container.querySelectorAll(".vdrCompactCard")).find(function(node){return !!node.querySelector(".vdrCompactMachine")});if(!card)return;
  var oldConflict=card.querySelector(".vdrEnhVisitConflict");if(oldConflict)oldConflict.remove();
  if(conflict){var warning=document.createElement("div");warning.className="vdrCompactIssue error vdrEnhVisitConflict";warning.textContent="⚠ この訪問で確定済みの自販機と、今回帳票の候補が一致しません。管理番号・メーカーを確認してください。";card.appendChild(warning);var approval=container.querySelector(".vdrCompactApproval input");if(approval)approval.disabled=true;var save=container.querySelector(".vdrCompactButton.primary");if(save)save.disabled=true;return}
  var info=machineSnapshot(context.machineId),machineText=card.querySelector(".vdrCompactMachineText");if(machineText&&machineText.getAttribute("data-vdr-visit-machine")!==String(context.machineId)){machineText.innerHTML="";var b=document.createElement("b");b.textContent="✓ "+(info&&info.name||context.machineName||context.machineId);var span=document.createElement("span");span.textContent="この訪問の自販機を継続 · 再紐づけ不要"+(info&&info.managementCodeKey?" · "+info.managementCodeKey:"");machineText.appendChild(b);machineText.appendChild(span);machineText.setAttribute("data-vdr-visit-machine",String(context.machineId))}
  Array.prototype.slice.call(card.querySelectorAll("button")).forEach(function(button){if(button.textContent.indexOf("この自販機と紐づける")>=0)button.remove()});
  var machineBadge=container.querySelector(".vdrCompactBadge.machine");if(machineBadge)machineBadge.remove()
}
function enhanceContainer(container,review,context){decorateSoldOuts(container,review);decorateVisitContinuation(container,review,context)}
function observeContainer(container,review,context){if(!container||typeof MutationObserver!=="function")return;if(container.__vdrFieldEnhObserver)container.__vdrFieldEnhObserver.disconnect();var scheduled=false,observer=new MutationObserver(function(){if(scheduled)return;scheduled=true;Promise.resolve().then(function(){scheduled=false;enhanceContainer(container,review,context)})});observer.observe(container,{childList:true,subtree:true});container.__vdrFieldEnhObserver=observer}
function wrapOptions(review,options,context){options=options||{};var out={},key;for(key in options)out[key]=options[key];var originalEnsure=options.ensureVisit,originalContinue=options.onContinueCapture,originalFinish=options.onFinishCapture;
  out.ensureVisit=function(currentReview){var target=currentReview||review,promise=typeof originalEnsure==="function"?Promise.resolve(originalEnsure(target)):Promise.resolve(null);return promise.then(function(visitId){if(!visitId)return visitId;var a=api(),visits=a&&a.data&&a.data.visits;if(!visits||typeof visits.get!=="function")return visitId;return Promise.resolve(visits.get(visitId)).then(function(visit){if(!visit||!visit.machineId)return visitId;var candidate=candidateMachineId(target);if(candidate&&String(candidate)!==String(visit.machineId)){var error=new Error("この訪問で確定済みの自販機と今回帳票の候補が一致しません");error.code="visit_machine_context_conflict";throw error}if(target&&target.identity)target.identity.machineId=visit.machineId;return visitId})})};
  out.onContinueCapture=function(){var machineId=review&&review.identity&&review.identity.machineId||context&&context.machineId||null,info=machineSnapshot(machineId);pendingContinuation=machineId?{machineId:String(machineId),machineName:info&&info.name||null,createdAt:Date.now()}:null;return typeof originalContinue==="function"?originalContinue():undefined};
  out.onFinishCapture=function(finishOptions){pendingContinuation=null;return typeof originalFinish==="function"?originalFinish(finishOptions):Promise.resolve(null)};
  return out
}
function install(){var compact=global.VENDRIVE2CompactOcrReview;if(!compact||typeof compact.mount!=="function")return false;if(compact[INSTALL_FLAG])return true;var originalMount=compact.mount,version=(Number(compact.version)||3)+1;
  function enhancedMount(container,review,options){var context=pendingContinuation&&Date.now()-pendingContinuation.createdAt<10*60*1000?pendingContinuation:null;pendingContinuation=null;var wrappedOptions=wrapOptions(review,options,context),result=originalMount(container,review,wrappedOptions);enhanceContainer(container,review,context);observeContainer(container,review,context);return result}
  var enhanced={version:version,mount:enhancedMount};enhanced[INSTALL_FLAG]=true;global.VENDRIVE2CompactOcrReview=Object.freeze(enhanced);return true
}
function start(){if(install()){if(installTimer){clearInterval(installTimer);installTimer=null}return}if(!installTimer){var tries=0;installTimer=setInterval(function(){tries++;if(install()||tries>200){clearInterval(installTimer);installTimer=null}},50)}}
start();if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
})(window);
