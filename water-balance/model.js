export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const validVolume = value => /^\d+$/.test(String(value)) && Number(value)>0 && Number(value)<=2000;
export const totals = entries => ({total:entries.reduce((s,e)=>s+e.volume,0),water:entries.filter(e=>e.type==='water').reduce((s,e)=>s+e.volume,0)});
export function ensureDay(state,date = new Date()) { const key=dayKey(date); if(state.started){state.days[key]??={goal:state.goal,entries:[]};state.days[key].goal??=state.goal;} return key; }
export function setGoal(state,goal,date = new Date()) {state.goal=goal;state.started=true;const key=ensureDay(state,date);state.days[key].goal=goal;}
export function progress(total,goal) {return {percent:Math.round(total/goal*100),fill:Math.min(total/goal,1),remaining:Math.max(goal-total,0)};}
