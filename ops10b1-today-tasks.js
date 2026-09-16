(function(){
'use strict';
var pendingMachine=null;
function taskProgressLabel(task){var p=taskProgress(task);return p.done+' / '+p.total+'台';}
function taskLines(machine){
  var tasks=activeTasksForMachine(machine),wrap=document.createElement('div');
  wrap.className='todayMachineTasks';
  if(!tasks.length)return wrap;
  var head=document.createElement('div');head.className='todayMachineTasksHead';head.innerHTML='<b>TASK</b><span>'+tasks.length+'件</span>';wrap.appendChild(head);
  tasks.slice(0,2).forEach(function(task){var row=document.createElement('div');row.className='todayMachineTaskLine';row.innerHTML='<span>'+esc(task.text||'タスク')+'</span><strong>'+esc(taskProgressLabel(task))+'</strong>';wrap.appendChild(row)});
  if(tasks.length>2){var more=document.createElement('div');more.className='todayMachineTaskMore';more.textContent='＋'+(tasks.length-2)+'件';wrap.appendChild(more)}
  return wrap;
}
window.renderTodayWithTasks=function(){
  renderToday();
  var old=$id('todayTaskBlock');if(old)old.remove();
  var machines=sortedTodayMachines(targets(todayDay,false)),cards=Array.from($id('todayList').querySelectorAll('.swipeCard'));
  cards.forEach(function(card,index){var machine=machines[index];if(!machine)return;var oldTasks=card.querySelector('.todayMachineTasks');if(oldTasks)oldTasks.remove();var lines=taskLines(machine);if(lines.children.length)card.appendChild(lines)});
};
function ensureModal(){
  if($id('visitTaskConfirmModal'))return;
  var modal=document.createElement('div');modal.id='visitTaskConfirmModal';modal.className='modal';
  modal.innerHTML='<div class="sheet visitTaskConfirmSheet"><div class="modalTop"><div><div class="ey">VISIT CHECK</div><div class="visitTaskConfirmTitle">タスクを個別に確認</div></div><button class="secondary" id="visitTaskConfirmClose" type="button">閉じる</button></div><div class="visitTaskConfirmHelp">この訪問で完了したタスクだけチェックしてください。未チェックは未完了のまま残ります。</div><div id="visitTaskConfirmList"></div><div class="actions"><button class="secondary" id="visitTaskConfirmKeep" type="button">未完了を残して訪問完了</button><button class="primary" id="visitTaskConfirmApply" type="button">チェックを反映して訪問完了</button></div></div>';
  document.body.appendChild(modal);
  $id('visitTaskConfirmClose').onclick=function(){pendingMachine=null;closeModal('visitTaskConfirmModal')};
  $id('visitTaskConfirmKeep').onclick=function(){applyVisitTaskSelection(false)};
  $id('visitTaskConfirmApply').onclick=function(){applyVisitTaskSelection(true)};
}
function renderVisitTaskConfirm(machine){
  ensureModal();pendingMachine=machine;var box=$id('visitTaskConfirmList'),tasks=activeTasksForMachine(machine);box.innerHTML='';
  tasks.forEach(function(task){var label=document.createElement('label');label.className='visitTaskConfirmRow';label.innerHTML='<input type="checkbox" data-task-id="'+esc(task.id)+'"><span><b>'+esc(task.text||'タスク')+'</b><small>全体進捗 '+esc(taskProgressLabel(task))+'</small></span>';box.appendChild(label)});
  openModal('visitTaskConfirmModal');
}
function markTaskDone(machine,task){
  if(!machine.taskDone||typeof machine.taskDone!=='object')machine.taskDone={};
  machine.taskDone[task.id]={completedAt:Date.now()};completeParentTaskIfDone(task);
}
function continueVisit(machine){
  selectedMachine=machine;
  if(machine.order){$id('orderVisitConfirmDetail').textContent=machine.order.type+(machine.order.sub?' ＞ '+machine.order.sub:'');closeModal('machineModal');openModal('orderVisitConfirm');return;}
  finishVisitCore();
}
function applyVisitTaskSelection(useChecks){
  var machine=pendingMachine;if(!machine)return;var checked={};
  if(useChecks)Array.from($id('visitTaskConfirmList').querySelectorAll('input[data-task-id]:checked')).forEach(function(input){checked[input.dataset.taskId]=true});
  activeTasksForMachine(machine).forEach(function(task){if(checked[task.id])markTaskDone(machine,task)});
  pendingMachine=null;persist();closeModal('visitTaskConfirmModal');renderAll();continueVisit(machine);
}
window.completeVisit=function(){
  if(!selectedMachine)return false;
  var tasks=activeTasksForMachine(selectedMachine);
  if(tasks.length){renderVisitTaskConfirm(selectedMachine);return false;}
  if(selectedMachine.order){$id('orderVisitConfirmDetail').textContent=selectedMachine.order.type+(selectedMachine.order.sub?' ＞ '+selectedMachine.order.sub:'');closeModal('machineModal');openModal('orderVisitConfirm');return true;}
  finishVisitCore();return true;
};
var style=document.createElement('style');style.textContent='.todayMachineTasks{margin-top:9px;padding-top:8px;border-top:1px solid #eceef0}.todayMachineTasksHead{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}.todayMachineTasksHead b{font-size:9px;letter-spacing:1px;color:#b42318}.todayMachineTasksHead span{font-size:9px;color:#777;font-weight:850}.todayMachineTaskLine{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:3px 0;font-size:10px;line-height:1.35}.todayMachineTaskLine span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800}.todayMachineTaskLine strong{flex:0 0 auto;font-size:9px;color:#666}.todayMachineTaskMore{margin-top:2px;font-size:9px;color:#777;font-weight:850}.visitTaskConfirmTitle{font-size:20px;font-weight:950;margin-top:3px}.visitTaskConfirmHelp{margin:12px 0 8px;padding:10px 11px;border-radius:12px;background:#f5f5f5;color:#555;font-size:10px;line-height:1.55;font-weight:750}.visitTaskConfirmRow{display:flex;align-items:flex-start;gap:10px;padding:12px 2px;border-bottom:1px solid #eee}.visitTaskConfirmRow input{width:20px;height:20px;margin:0;flex:0 0 auto}.visitTaskConfirmRow span{min-width:0;flex:1}.visitTaskConfirmRow b{display:block;font-size:12px;line-height:1.4}.visitTaskConfirmRow small{display:block;margin-top:3px;color:#777;font-size:9px}.visitTaskConfirmSheet .actions{display:grid;grid-template-columns:1fr 1.2fr;position:sticky;bottom:-18px;background:#fff;padding:12px 0 18px}.visitTaskConfirmSheet .actions button{min-height:46px;white-space:normal;line-height:1.3}';document.head.appendChild(style);
ensureModal();renderAll();
})();