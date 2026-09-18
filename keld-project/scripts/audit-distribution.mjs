import {spawnSync} from 'node:child_process';
import {chmodSync,copyFileSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename,dirname,isAbsolute,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {materializeProductClosure,productRoot,repositoryRoot} from '../../implementation/agent-reasoning-engine/src/product.mjs';
import {verifyCopiedClosure} from '../../implementation/agent-reasoning-engine/src/product-isolation.mjs';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const closure=materializeProductClosure();const out=resolve(project,'evidence');mkdirSync(out,{recursive:true});
const buckets={};const licenses=[];const absoluteReferences=[];const externalSymlinks=[];const sensitiveNames=[];
const inside=(root,path)=>{const r=relative(root,path);return r!==''&&!r.startsWith('..')&&!isAbsolute(r)};
for(const f of closure.files){
 if(!inside(repositoryRoot,resolve(repositoryRoot,f.path)))throw Error(`Unsafe closure path: ${f.path}`);
 const bucket=f.path.split('/').slice(0,3).join('/');buckets[bucket]??={files:0,bytes:0};buckets[bucket].files++;buckets[bucket].bytes+=f.bytes;
 if(/^(LICENSE|LICENCE|NOTICE|COPYING)(\.|$)/i.test(basename(f.path)))licenses.push(f.path);
 if(f.kind==='symlink'&&(!inside(repositoryRoot,resolve(dirname(resolve(repositoryRoot,f.path)),f.link_target))||isAbsolute(f.link_target)))externalSymlinks.push(f.path);
 if(/^(\.env(?:\..*)?|\.npmrc|id_rsa|id_ed25519)$/.test(basename(f.path)))sensitiveNames.push(f.path);
 if(/\.(?:mjs|js|json|md|py|sh|rs|toml)$/.test(f.path)&&f.bytes<2_000_000){const s=readFileSync(resolve(repositoryRoot,f.path),'utf8');const count=[...s.matchAll(/(?:\/home\/[^\s"'`<>]+|\/mnt\/[a-z]\/[^\s"'`<>]+)/g)].length;if(count)absoluteReferences.push({path:f.path,count});}
}
const report={schema_version:'keld.distribution-audit/v1',date:new Date().toISOString(),product_id:closure.product_id,version:closure.product_version,closure_digest:closure.closure_digest,file_count:closure.files.length,total_bytes:closure.files.reduce((n,f)=>n+f.bytes,0),buckets,license_files:licenses,absolute_reference_files:absoluteReferences,external_symlinks:externalSymlinks,sensitive_filenames:sensitiveNames,publication_approved:false};
let temp;
try{
 if(externalSymlinks.length||sensitiveNames.length)throw Error('Closure requires file-boundary review before relocation');
 temp=mkdtempSync(resolve(tmpdir(),'keld-are-relocation-'));
 for(const f of closure.files){const dst=resolve(temp,f.path);mkdirSync(dirname(dst),{recursive:true});if(f.kind==='symlink')symlinkSync(f.link_target,dst);else{copyFileSync(resolve(repositoryRoot,f.path),dst);chmodSync(dst,f.mode)}}
 report.copy_integrity=verifyCopiedClosure(temp,closure);
 const runtime=resolve(temp,relative(repositoryRoot,productRoot));
 const r=spawnSync(process.execPath,[resolve(runtime,'bin/are.mjs'),'doctor','--json'],{cwd:runtime,encoding:'utf8',timeout:60_000,maxBuffer:4*1024*1024});
 let doctor;try{doctor=JSON.parse(r.stdout)}catch{doctor=null}
 report.relocation={exit_code:r.status,signal:r.signal,error:r.error?.code??null,status:doctor?.status??'ERROR',reason_codes:doctor?.reason_codes??[],closure_digest:doctor?.source_closure?.closure_digest??null,stderr:r.stderr?.replaceAll(temp,'<isolated-root>').slice(0,2000)??''};
 report.relocation.same_closure=doctor?.source_closure?.closure_digest===closure.closure_digest;
 report.status=report.copy_integrity&&r.status===0&&report.relocation.same_closure?'PASS':'FAIL';
 if(process.argv.includes('--full-tests')&&report.status==='PASS'){
  const testRun=spawnSync(process.execPath,[resolve(runtime,'bin/are.mjs'),'test'],{cwd:runtime,encoding:'utf8',timeout:900_000,maxBuffer:64*1024*1024,env:{...process.env,ARE_PRODUCT_TEST_EXECUTION_MODE:'isolated-source-closure'}});
  let testResult;try{testResult=JSON.parse(testRun.stdout)}catch{testResult=null}
  report.full_tests={exit_code:testRun.status,signal:testRun.signal,error:testRun.error?.code??null,result:testResult,stderr:testRun.stderr?.replaceAll(temp,'<isolated-root>').slice(-6000)??''};
  if(!testResult)report.full_tests.stdout_tail=testRun.stdout?.replaceAll(temp,'<isolated-root>').slice(-6000)??'';
  if(testRun.status!==0||!testResult||testResult.source_closure_digest!==closure.closure_digest||testResult.execution_mode!=='isolated-source-closure')report.status='FAIL';
 }

}catch(e){report.status='FAIL';report.error=String(e.message)}finally{if(temp)rmSync(temp,{recursive:true,force:true});report.temporary_copy_removed=true}
report.claim_limit='Complete declared closure relocation and doctor, plus full product tests only when full_tests is present. Uses this workstation toolchain; not a clean-machine installation, public-content review, license approval or customer release.';
writeFileSync(resolve(out,'distribution-audit.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(resolve(out,'distribution-source-closure.json'),JSON.stringify(closure,null,2)+'\n');
console.log(JSON.stringify({status:report.status,files:report.file_count,bytes:report.total_bytes,license_files:licenses.length,absolute_reference_files:absoluteReferences.length,external_symlinks:externalSymlinks.length,relocation:report.relocation,full_test_exit:report.full_tests?.exit_code}));
if(report.status!=='PASS')process.exitCode=1;
