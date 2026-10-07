// One shared frozen source/runtime tool interface for both adaptive arms.
// Open Questions: evidence/G01-ADAPTIVE-COMMON-TOOLS-R1.json.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';import {pathToFileURL} from 'node:url';
import {createFrozenCanonicalMethodViews} from './canonical-method-views-r1.mjs';
import {createAdaptiveRuntimeViews} from './adaptive-runtime-view-policy-r1.mjs';
import {REQUEST_CAP} from './canonical-method-view-policy-r1.mjs';
const ROOT='/home/vlad_/are-benchmark-archive/g01-compiled-method-coordinate-r1b-20261007';
const PINS={'FREEZE.json':'4aa94da17458a8e675eb1f8612dec98d89cf112af0e5560b925d65a83dd6cbe0',
 'RESULT.json':'c916dfcf1eef2825da96612c307cdc13cd459e392bc5c51d08df0b36bb8d1a53',
 'AUDIT.json':'fd642dd18cd19bb246c977c2e9b2e4aa7f70907f021c3d6ca11aa878af7e0dbf'};
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const need=(v,c)=>{if(!v)throw Error('adaptive-view.'+c);};
export function createFrozenAdaptiveCommonTools(){
 const validateBasis=()=>{for(const[name,pin]of Object.entries(PINS))need(sha(readFileSync(join(ROOT,name)))===pin,'runtime-basis-drift');};
 validateBasis();
 const result=JSON.parse(readFileSync(join(ROOT,'RESULT.json'))),audit=JSON.parse(readFileSync(join(ROOT,'AUDIT.json')));
 need(result.status==='all16-retained-compiled-method-coordinate-census-complete'&&result.rows.length===16&&
  audit.status==='all-retained-compiled-descriptors-debug-lines-native-audit-passed','qualified-runtime');
 const rows=new Map(result.rows.map(r=>[r.case_id,r]));let cachedId=null,cached=null;
 const loadRuntime=caseId=>{
  if(cachedId!==caseId){const raw=readFileSync(join(ROOT,caseId+'.json'));
   need(sha(raw)===rows.get(caseId).receipt_sha256,'runtime-case-drift');cached=JSON.parse(raw);cachedId=caseId;}
  return cached;
 };
 return createAdaptiveRuntimeViews({caseIds:[...rows.keys()],sourceView:createFrozenCanonicalMethodViews(),loadRuntime,validateBasis});
}
async function main(){
 let size=0;const chunks=[];for await(const part of process.stdin){size+=part.length;need(size<=REQUEST_CAP,'request-byte-cap');chunks.push(part);}
 const request=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(chunks)));
 console.log(JSON.stringify(createFrozenAdaptiveCommonTools()(request)));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{
 const failure_code=/^(adaptive-view|method-view)\.[a-z-]+$/.test(error?.message)?error.message:'adaptive-view.input-or-validation-failed';
 console.log(JSON.stringify({status:'failed-closed',failure_code,authority_effect:'none'}));process.exitCode=2;
});
