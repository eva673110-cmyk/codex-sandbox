import assert from 'node:assert/strict';
import {config} from './config.js';
import {emptyState,applyOps} from './data.js';
config.supabaseUrl='https://test.supabase.co';config.publishableKey='sb_publishable_test';
const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
globalThis.window={addEventListener(){}};globalThis.document={hidden:false,hasFocus:()=>true,addEventListener(){}};globalThis.location={hash:'',pathname:'/',search:'',href:'https://example.test/water-balance/'};
Object.defineProperty(globalThis,'navigator',{value:{onLine:false},configurable:true});
globalThis.setInterval=()=>0;
let server=emptyState(),loseResponse=false,account='first';const seen=new Set();
globalThis.fetch=async(url,options)=>{
 if(url.includes('/auth/v1/signup')){assert.equal(new URL(url).searchParams.get('redirect_to'),'https://example.test/water-balance/');assert.deepEqual(JSON.parse(options.body),{email:'new@example.invalid',password:'new-password'});return{ok:true,status:200,json:async()=>({user:{id:'unconfirmed'}})};}
 if(url.includes('/auth/v1/resend')){assert.equal(JSON.parse(options.body).type,'signup');return{ok:true,status:200,json:async()=>({})};}
 if(url.includes('/auth/v1/token'))return {ok:true,status:200,json:async()=>({access_token:'test',refresh_token:'test',expires_in:3600,user:{id:account}})};
 if(url.includes('/rpc/sync_water')){assert.equal(options.headers.Authorization,'Bearer test');const ops=JSON.parse(options.body).operations;const fresh=ops.filter(op=>!seen.has(op.id));for(const op of fresh)seen.add(op.id);server=applyOps(server,fresh);if(loseResponse){loseResponse=false;throw Error('Connection lost after commit');}return{ok:true,status:200,json:async()=>structuredClone(server)};}
 throw Error('Unexpected endpoint');
};
const cloud=await import('./cloud.js');await cloud.signup('new@example.invalid','new-password');assert.equal(cloud.getSession(),null);assert.equal(storage.size,0);await cloud.resendConfirmation('new@example.invalid');let latest;await cloud.initCloud(value=>latest=value,()=>{});let state=await cloud.login('test@example.invalid','test-password');
state.started=true;state.days['2026-10-04']={goal:1800,entries:[{id:'one',type:'water',volume:250,time:1791129600000}]};cloud.observe(state);
assert.equal(server.started,false);assert.ok(JSON.parse(storage.get('water-user-first')).pending.length>0);await assert.rejects(()=>cloud.logout(),/синхронизируйте/);
navigator.onLine=true;loseResponse=true;await cloud.sync();assert.equal(server.days['2026-10-04'].entries.length,1);assert.ok(JSON.parse(storage.get('water-user-first')).pending.length>0);
await cloud.sync();assert.equal(server.days['2026-10-04'].entries.length,1);assert.equal(JSON.parse(storage.get('water-user-first')).pending.length,0);assert.equal(latest.days['2026-10-04'].entries[0].volume,250);
const restored=await cloud.login('test@example.invalid','test-password');assert.deepEqual(restored,latest);
account='second';const second=await cloud.login('second@example.invalid','test-password');assert.deepEqual(second,emptyState());assert.ok(storage.has('water-user-first'));
console.log('Облачный адаптер с имитацией API: офлайн-очередь, потеря ответа после сохранения, безопасный повтор, блокировка выхода, восстановление кэша и разделение аккаунтов — пройдены.');
