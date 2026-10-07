// Private benchmark-only isolated ESM projection; never modifies canonical files.
// Open Questions: evidence/G01-NATIVE-PROFILE-CLOSURE-R9.json.
import assert from 'node:assert/strict';import {readFileSync,realpathSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
import {registerHooks,isBuiltin} from 'node:module';
const FREEZE='/home/vlad_/are-benchmark-archive/g01-native-method-live-r8-20261007/FREEZE.json';
const FREEZE_SHA='a7fe0022b0f6d8df91009daf1fc4aa604ac4d4472ce568e79b0cbf24b60cee30';
const KEY='are_native_provider_profile',VALUE='stateless-r9',QUERY='?'+KEY+'='+VALUE;
export const DELIVERY_PATH=fileURLToPath(new URL('../../../../benchmarks/contextbench-v1/delivery.mjs',import.meta.url));
export const DELIVERY_SHA='f109168f98c4305ecea2d39a8563516bd6dac7e0b37de73800b27e0ab42c21bc';
const BEFORE="thinking:{type:'enabled',clear_thinking:false}";
const AFTER="thinking:{type:'enabled',clear_thinking:true}";
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=readFileSync(FREEZE);assert.equal(sha(bytes),FREEZE_SHA,'profile-closure.freeze-drift');
const pins=JSON.parse(bytes).source_pins;
const library=path=>Object.hasOwn(pins,path)&&path.endsWith('.mjs')&&!path.endsWith('.test.mjs')&&
 !/\/(?:run-|qualify-|audit-native-method-live-)/.test(path);
let hook;const loaded=new Map();
export function verifyProfileClosureSourcePins(){
 assert.equal(sha(readFileSync(FREEZE)),FREEZE_SHA);
 for(const[path,pin]of Object.entries(pins))assert.equal(sha(readFileSync(path)),pin,'profile-closure.source-drift');
 return Object.keys(pins).length;
}
export function profileSource(path){
 assert.ok(library(path),'profile-closure.unpinned-or-nonlibrary-module');
 assert.equal(realpathSync(path),path,'profile-closure.symlink');
 const raw=readFileSync(path);assert.equal(sha(raw),pins[path],'profile-closure.source-drift');
 let source=raw.toString('utf8');
 if(path===DELIVERY_PATH){assert.equal(sha(raw),DELIVERY_SHA);assert.equal(source.split(BEFORE).length,2);
  source=source.replace(BEFORE,AFTER);assert.equal(source.replace(AFTER,BEFORE),raw.toString('utf8'));}
 return {source,canonical_sha256:sha(raw),effective_sha256:sha(source),modified:path===DELIVERY_PATH};
}
function tagged(value){
 if(typeof value!=='string'||!value.startsWith('file:'))return false;
 const url=new URL(value);if(!url.searchParams.has(KEY))return false;
 assert.equal(url.search,QUERY,'profile-closure.exact-namespace');assert.equal(url.hash,'','profile-closure.no-fragment');return true;
}
export function profileModuleURL(value){
 const url=new URL(value);assert.equal(url.protocol,'file:','profile-closure.file-only');
 assert.ok(url.search===''||tagged(url.href),'profile-closure.no-other-query');assert.equal(url.hash,'');
 const path=fileURLToPath(url);assert.ok(library(path),'profile-closure.unpinned-or-nonlibrary-module');
 url.search=QUERY;return url.href;
}
export function installProfileModuleClosure(){
 verifyProfileClosureSourcePins();if(hook)return;
 hook=registerHooks({
  resolve(specifier,context,nextResolve){
   const active=tagged(specifier)||tagged(context.parentURL);
   const result=nextResolve(specifier,context);
   if(!active||isBuiltin(specifier)||result.url.startsWith('node:'))return result;
   assert.ok(result.url.startsWith('file:'),'profile-closure.no-external-dependency');
   return {...result,url:profileModuleURL(result.url)};
  },
  load(url,context,nextLoad){
   if(!tagged(url))return nextLoad(url,context);
   const path=fileURLToPath(url),projection=profileSource(path);loaded.set(path,projection);
   return {format:'module',source:projection.source,shortCircuit:true};
  }
 });
}
export async function loadProfileBoundModule(url){installProfileModuleClosure();return import(profileModuleURL(url));}
export function profileClosureEvidence(){
 return {namespace:QUERY,frozen_source_pins:verifyProfileClosureSourcePins(),loaded_modules:[...loaded].map(([path,{source,...binding}])=>({path,...binding})),
  authority_effect:'none',canonical_files_changed:false};
}
