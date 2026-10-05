import {config} from './config.js';
import {emptyState,validateState,diffStates,applyOps} from './data.js';
import {dayKey} from './model.js';
export const configured=Boolean(config.supabaseUrl&&config.publishableKey);
const sessionKey='water-session-v1';
let session=null,baseline=emptyState(),pending=[],busy=false,blocked=false;
let update=()=>{},status=()=>{},lastTick=performance.now(),active=0,opened=false;
const cacheKey=()=>`water-user-${session.user.id}`;
export const getSession=()=>session;
function persist(){localStorage.setItem(cacheKey(),JSON.stringify({state:baseline,pending}));}
async function request(path,body,method='POST',authenticated=false){
 if(!configured)throw Error('Supabase ещё не подключён.');
 const response=await fetch(config.supabaseUrl.replace(/\/$/,'')+path,{method,headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(authenticated?{Authorization:`Bearer ${session.access_token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
 if(!response.ok){if(response.status===401&&authenticated)throw Error('Войдите заново: срок доступа истёк. Локальные записи сохранены.');if(response.status===403)throw Error('Доступ не разрешён. Проверьте приглашение.');throw Error(response.status===429?'Слишком много запросов. Попробуйте позже.':'Запрос не выполнен. Проверьте интернет, данные входа и настройки проекта.');}
 return response.status===204?null:response.json();
}
function storeSession(value){session={...value,expires_at:value.expires_at||Date.now()/1000+value.expires_in};localStorage.setItem(sessionKey,JSON.stringify(session));}
async function refresh(){if(session.expires_at<Date.now()/1000+60){const passwordRequired=session.passwordRequired;storeSession({...await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token}),passwordRequired});}}
export async function login(email,password){storeSession(await request('/auth/v1/token?grant_type=password',{email,password}));return loadCache();}
export async function signup(email,password){await request('/auth/v1/signup?redirect_to='+encodeURIComponent(new URL('./',location.href).href),{email,password});}
export async function resendConfirmation(email){await request('/auth/v1/resend',{type:'signup',email,options:{email_redirect_to:new URL('./',location.href).href}});}
function loadCache(){baseline=emptyState();pending=[];blocked=false;opened=false;active=0;lastTick=performance.now();const saved=localStorage.getItem(cacheKey());if(saved){const data=JSON.parse(saved);baseline=validateState(data.state);if(!Array.isArray(data.pending))throw Error('Очередь сохранения повреждена.');pending=data.pending;}return structuredClone(baseline);}
export async function initCloud(onUpdate,onStatus){update=onUpdate;status=onStatus;if(!configured)return null;
 const hash=new URLSearchParams(location.hash.slice(1));let passwordRequired=false;
 if(hash.has('access_token')){const access_token=hash.get('access_token'),refresh_token=hash.get('refresh_token');session={access_token,refresh_token};const user=await request('/auth/v1/user',undefined,'GET',true);passwordRequired=['invite','recovery'].includes(hash.get('type'));storeSession({access_token,refresh_token,user,expires_in:+hash.get('expires_in')||3600,passwordRequired});history.replaceState(null,'',location.pathname+location.search);}
 else{const saved=localStorage.getItem(sessionKey);if(saved)session=JSON.parse(saved);}
 if(!session?.user?.id)return null;return {state:loadCache(),passwordRequired:passwordRequired||session.passwordRequired};
}
export async function updatePassword(password){await refresh();await request('/auth/v1/user',{password},'PUT',true);session.passwordRequired=false;localStorage.setItem(sessionKey,JSON.stringify(session));}
export async function recover(email){await request('/auth/v1/recover?redirect_to='+encodeURIComponent(new URL('./',location.href).href),{email});}
export async function logout(){if(pending.length)throw Error('Сначала синхронизируйте записи. Сейчас есть несохранённые в облаке изменения.');await refresh();await request('/auth/v1/logout',{},'POST',true);localStorage.removeItem(sessionKey);localStorage.removeItem(cacheKey());session=null;baseline=emptyState();pending=[];}
export function observe(state){if(!session)return;const ops=diffStates(baseline,state);if(!ops.length)return;const next=ops.map(op=>({...op,id:crypto.randomUUID()}));const previous=baseline;baseline=structuredClone(state);pending.push(...next);try{persist();}catch(error){baseline=previous;pending.splice(pending.length-next.length);throw error;}status('Сохранено на устройстве · ожидает синхронизации');void sync();}
export async function sync(){if(!session||busy||blocked)return;if(!navigator.onLine){status('Без интернета · записи сохраняются на устройстве');return;}busy=true;let succeeded=false;const owner=session.user.id;const batch=pending.slice(0,200);try{await refresh();const result=await request('/rest/v1/rpc/sync_water',{operations:batch},'POST',true);if(session?.user.id!==owner)return;const received=validateState(result);const sent=new Set(batch.map(o=>o.id));pending=pending.filter(o=>!sent.has(o.id));baseline=applyOps(received,pending);persist();update(structuredClone(baseline));succeeded=true;status(pending.length?'Синхронизация продолжается…':'Сохранено в облаке');}catch(error){status(error.message);}finally{busy=false;}if(succeeded&&pending.length)void sync();}
function tick(){const now=performance.now(),seconds=Math.min((now-lastTick)/1000,15);lastTick=now;if(!document.hidden&&document.hasFocus()&&session)active+=seconds;if(!session||blocked)return;if(active>=15||!opened){pending.push({id:crypto.randomUUID(),kind:'activity',seconds:Math.floor(active),visits:opened?0:1,day:dayKey()});active-=Math.floor(active);opened=true;try{persist();}catch{blocked=true;status('Нет места для сохранения. Скачайте резервную копию.');}void sync();}}
setInterval(tick,15000);window.addEventListener('online',()=>void sync());document.addEventListener('visibilitychange',()=>{lastTick=performance.now();});
export async function adminStats(){await refresh();return request('/rest/v1/rpc/water_usage',{},'POST',true);}
export async function membership(){await refresh();const rows=await request('/rest/v1/water_members?select=is_admin',undefined,'GET',true);return rows.some(row=>row.is_admin);}
setInterval(()=>void sync(),60000);
