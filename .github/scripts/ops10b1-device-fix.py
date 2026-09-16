from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old_version = "APP_VERSION='2026.09.16-FINAL.12'"
new_version = "APP_VERSION='2026.09.16-FINAL.13'"
assert s.count(old_version) == 1
s = s.replace(old_version, new_version, 1)

start = s.index('function ensureVisitTaskConfirmModal(){')
end = s.index('\n\nfunction initDays(){', start)
replacement = r'''function ensureVisitTaskConfirmModal(){var m=$id('visitTaskConfirmModal');if(m)return m;m=document.createElement('div');m.id='visitTaskConfirmModal';m.className='modal';m.innerHTML='<div class="sheet"><div class="modalTop"><div><div class="ey">VISIT CHECK</div><div class="title">完了したタスクを確認</div></div><button class="pill" id="visitTaskConfirmClose">閉じる</button></div><div class="notice">この訪問で完了したタスクだけチェックしてください。チェックしなかったタスクは未完了のまま残ります。</div><div id="visitTaskConfirmList"></div><div class="actions"><button class="primary" id="visitTaskConfirmApply">訪問を完了</button></div></div>';document.body.appendChild(m);$id('visitTaskConfirmClose').onclick=function(){closeModal('visitTaskConfirmModal')};return m}
function continueVisitAfterTaskCheck(machine){selectedMachine=machine;if(machine.order){$id('orderVisitConfirmDetail').textContent=machine.order.type+(machine.order.sub?' ＞ '+machine.order.sub:'');closeModal('machineModal');openModal('orderVisitConfirm');return true}finishVisitCore();return true}
function openVisitTaskConfirm(machine){ensureVisitTaskConfirmModal();var box=$id('visitTaskConfirmList'),tasks=activeTasksForMachine(machine);box.innerHTML='';tasks.forEach(function(task){var row=document.createElement('label');row.style.cssText='display:flex;gap:10px;align-items:flex-start;padding:12px 2px;border-bottom:1px solid #eee';row.innerHTML='<input type="checkbox" data-task-id="'+esc(task.id)+'" style="width:20px;height:20px"><span><b>'+esc(task.text||'タスク')+'</b></span>';box.appendChild(row)});$id('visitTaskConfirmApply').onclick=function(){var chosen={};box.querySelectorAll('input:checked').forEach(function(i){chosen[i.dataset.taskId]=1});tasks.forEach(function(t){if(!chosen[t.id])return;if(!machine.taskDone||typeof machine.taskDone!=='object')machine.taskDone={};machine.taskDone[t.id]={completedAt:Date.now()};completeParentTaskIfDone(t)});persist();closeModal('visitTaskConfirmModal');renderAll();continueVisitAfterTaskCheck(machine)};openModal('visitTaskConfirmModal')}
function completeVisit(){if(!selectedMachine)return false;var tasks=activeTasksForMachine(selectedMachine);if(tasks.length){openVisitTaskConfirm(selectedMachine);return false}return continueVisitAfterTaskCheck(selectedMachine)}
function appendTodayTasks(){var list=$id('todayList');if(!list)return;var machines=sortedTodayMachines(targets(todayDay,false)),wrappers=Array.prototype.slice.call(list.querySelectorAll('.swipeWrap'));wrappers.forEach(function(wrapper,index){var machine=machines[index],card=wrapper.querySelector('.swipeCard');if(!machine||!card)return;var prior=card.querySelector('.todayMachineTasks');if(prior)prior.remove();var tasks=activeTasksForMachine(machine);if(!tasks.length)return;var wrap=document.createElement('div');wrap.className='todayMachineTasks';wrap.style.cssText='margin-top:7px;padding-top:7px;border-top:1px solid #eceef0';var head=document.createElement('div');head.style.cssText='font-size:8px;font-weight:900;color:#b42318;margin-bottom:2px';head.textContent='TASK';wrap.appendChild(head);tasks.forEach(function(task){var row=document.createElement('div');row.style.cssText='padding:2px 0;font-size:9px;font-weight:800;line-height:1.35;white-space:normal;overflow-wrap:anywhere';row.textContent='・'+(task.text||'タスク');wrap.appendChild(row)});card.appendChild(wrap)})}
function renderTodayWithTasks(){renderToday();var old=$id('todayTaskBlock');if(old)old.remove();appendTodayTasks();requestAnimationFrame(appendTodayTasks);setTimeout(appendTodayTasks,120)}'''
s = s[:start] + replacement + s[end:]
p.write_text(s, encoding='utf-8')

Path('version.json').write_text('{\n  "version": "2026.09.16-FINAL.13"\n}\n', encoding='utf-8')
