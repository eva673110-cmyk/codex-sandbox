import {validVolume} from './model.js';
export const emptyState=()=>({started:false,goal:1800,days:{}});
export function validateState(value){
 if(!value||typeof value.started!=='boolean'||!Number.isInteger(value.goal)||value.goal<500||value.goal>4000||value.goal%100||!value.days||Array.isArray(value.days))throw Error('Неверный формат резервной копии.');
 const clean=emptyState();clean.started=value.started;clean.goal=value.goal;
 const ids=new Set();if(Object.keys(value.days).length>10000)throw Error('Слишком много дней.');
 for(const [key,day]of Object.entries(value.days)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||new Date(key+'T12:00:00Z').toISOString().slice(0,10)!==key||!day||!Array.isArray(day.entries)||day.entries.length>10000)throw Error('Некорректный день.');
  const result={entries:[]};if(day.goal!==undefined){if(!Number.isInteger(day.goal)||day.goal<500||day.goal>4000||day.goal%100)throw Error('Некорректная цель.');result.goal=day.goal;}
  for(const entry of day.entries){if(!entry||typeof entry.id!=='string'||!/^[\w-]{1,80}$/.test(entry.id)||ids.has(entry.id)||!Number.isInteger(entry.volume)||!validVolume(entry.volume)||!['water','other'].includes(entry.type)||!Number.isFinite(entry.time)||entry.time<0||entry.time>8640000000000000)throw Error('Некорректная запись.');ids.add(entry.id);result.entries.push({id:entry.id,type:entry.type,volume:entry.volume,time:entry.time});}
  clean.days[key]=result;
 }return clean;
}
export function diffStates(before,after){const ops=[];
 if(before.goal!==after.goal||before.started!==after.started)ops.push({kind:'settings',goal:after.goal,started:after.started});
 for(const [day,data]of Object.entries(after.days)){
  if(!before.days[day])ops.push({kind:'day',day,...(data.goal?{goal:data.goal}:{})});
  else if(data.goal!==before.days[day].goal&&data.goal)ops.push({kind:'goal',day,goal:data.goal});
  const old=new Map((before.days[day]?.entries||[]).map(e=>[e.id,e])),now=new Set(data.entries.map(e=>e.id));
  for(const entry of data.entries){if(!old.has(entry.id))ops.push({kind:'add',day,entry});else if(JSON.stringify(old.get(entry.id))!==JSON.stringify(entry))throw Error('Записи можно удалить и добавить заново.');}
  for(const entry of old.values())if(!now.has(entry.id))ops.push({kind:'delete',day,entryId:entry.id});
 }return ops;
}
export function applyOps(state,ops){state=structuredClone(state);for(const op of ops){if(op.kind==='settings'){state.goal=op.goal;state.started=op.started;continue;}if(op.kind==='activity')continue;state.days[op.day]??={entries:[]};const day=state.days[op.day];if(op.kind==='day'&&!day.goal&&op.goal)day.goal=op.goal;if(op.kind==='goal')day.goal=op.goal;if(op.kind==='add'&&!day.entries.some(e=>e.id===op.entry.id))day.entries.push(op.entry);if(op.kind==='delete')day.entries=day.entries.filter(e=>e.id!==op.entryId);}return state;}
export function mergeBackup(state,backup){const merged=structuredClone(state);for(const [key,day]of Object.entries(backup.days)){merged.days[key]??={entries:[],...(day.goal?{goal:day.goal}:{})};const existing=new Set(merged.days[key].entries.map(e=>e.id));for(const entry of day.entries)if(!existing.has(entry.id))merged.days[key].entries.push(entry);}if(!state.started){merged.started=backup.started;merged.goal=backup.goal;}return merged;}
