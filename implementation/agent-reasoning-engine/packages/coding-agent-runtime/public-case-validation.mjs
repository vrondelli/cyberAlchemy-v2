// Candidate validation only. Open questions: ../../benchmarks/glm-episodes-v1/PUBLIC-VALIDATION.md
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(x,code)=>{if(!x)throw new Error(code);};
const driver=`import {readFileSync} from 'node:fs';
const input=JSON.parse(readFileSync(0,'utf8')),before=JSON.stringify(input.args);
let output;
try {const module=await import(process.argv[1]); output={ok:true,value:await module[input.export_name](...input.args)};}
catch(error) {output={ok:false,error:String(error.message)};}
if(JSON.stringify(input.args)!==before)output={mutated:true};
process.stdout.write(JSON.stringify(output));`;
function pointer(value,path) {
 need(typeof path==='string'&&/^\/(?:[^~]|~[01])*$/.test(path),'public-check-selector-invalid');
 for(const key of path.slice(1).split('/').map(k=>k.replaceAll('~1','/').replaceAll('~0','~'))) {
  need(value!==null&&typeof value==='object'&&Object.hasOwn(value,key),'public-check-selector-missing');value=value[key];
 }
 return value;
}
export function validatePublicCases({subject,plan,child_timeout_ms=1000,batch_timeout_ms=20000}) {
 need(process.versions.node==='26.8.1','public-check-node-version');
 need(Number.isSafeInteger(child_timeout_ms)&&child_timeout_ms>=1&&child_timeout_ms<=5000&&Number.isSafeInteger(batch_timeout_ms)&&batch_timeout_ms>=child_timeout_ms&&batch_timeout_ms<=120000,'public-check-execution-budget');
 need(plan?.schema_version==='are.public-case-plan/v1'&&Array.isArray(plan.sources)&&plan.sources.length>0&&plan.sources.length<=16,'public-check-plan-invalid');
 need(Array.isArray(plan.checks)&&plan.checks.length>0&&plan.checks.length<=32&&Buffer.byteLength(JSON.stringify(plan))<=131072,'public-check-budget');
 const snapshots=new Map();
 for(const source of plan.sources) {
  need(!snapshots.has(source.path)&&/^[a-f0-9]{64}$/.test(source.sha256),'public-check-source-invalid');
  const bytes=readFileSync(source.path);need(hash(bytes)===source.sha256,'public-check-source-drift');
  snapshots.set(source.path,JSON.parse(bytes));
 }
 const ids=new Set();
 for(const c of plan.checks) {
  need(typeof c.id==='string'&&!ids.has(c.id)&&/^[a-z0-9-]{1,80}$/.test(c.id),'public-check-id');ids.add(c.id);
  need(typeof c.export_name==='string'&&/^[A-Za-z_$][\w$]*$/.test(c.export_name)&&Array.isArray(c.args),'public-check-call');
  need(c.expected&&typeof c.expected.ok==='boolean'&&Object.keys(c.expected).every(k=>['ok','value','error'].includes(k)),'public-check-expected');
  need(Array.isArray(c.evidence)&&c.evidence.length>0,'public-check-evidence-required');
  for(const ref of c.evidence) {
   need(snapshots.has(ref.path),'public-check-source-missing');
   need(hash(JSON.stringify(pointer(snapshots.get(ref.path),ref.selector)))===ref.value_sha256,'public-check-selector-drift');
  }
 }
 need(lstatSync(subject).isFile()&&!lstatSync(subject).isSymbolicLink(),'public-check-subject-invalid');
 const exact=realpathSync(subject),bytes=readFileSync(exact);need(bytes.length<=65536,'public-check-subject-budget');
 const subjectHash=hash(bytes),started=Date.now();
 const results=[];
 for(const c of plan.checks) {
  let passed=false,reason='output-mismatch';
  if(Date.now()-started>=batch_timeout_ms)reason='batch-deadline';
  else try {
   const stdout=execFileSync(process.execPath,['--permission',`--allow-fs-read=${exact}`,'--max-old-space-size=64','--input-type=module','-e',driver,pathToFileURL(exact).href],{env:{},input:JSON.stringify({export_name:c.export_name,args:c.args}),encoding:'utf8',timeout:Math.min(child_timeout_ms,Math.max(1,batch_timeout_ms-(Date.now()-started))),maxBuffer:65536,stdio:['pipe','pipe','pipe']});
   passed=isDeepStrictEqual(JSON.parse(stdout),c.expected);reason=passed?'matched':'output-mismatch';
  } catch (error) {reason=error?.code==='ETIMEDOUT'?'child-timeout':error?.code==='ENOBUFS'?'child-output-limit':'invalid-or-failed-child-output';}
  results.push({id:c.id,passed,reason});
 }
 need(hash(readFileSync(exact))===subjectHash,'public-check-subject-drift');
 for(const source of plan.sources)need(hash(readFileSync(source.path))===source.sha256,'public-check-source-drift');
 return {schema_version:'are.public-case-result/v1',authority_effect:'none',child_timeout_ms,batch_timeout_ms,ok:results.every(r=>r.passed),subject_sha256:subjectHash,plan_sha256:hash(JSON.stringify(plan)),passed:results.filter(r=>r.passed).length,total:results.length,results,elapsed_ms:Date.now()-started};
}
