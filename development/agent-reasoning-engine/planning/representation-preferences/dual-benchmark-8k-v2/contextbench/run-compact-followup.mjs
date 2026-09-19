// Exact bounded fresh-followup qualification command. Open questions: COMPACT-FOLLOWUP.md.
import vm from 'node:vm';import {readFileSync,writeFileSync,realpathSync,lstatSync,existsSync,mkdirSync} from 'node:fs';import {join,resolve,dirname} from 'node:path';import {createHash} from 'node:crypto';
import {runComparisonProductionStage} from './comparison-production-stage.mjs';import {guardStorage} from '../storage-host-small-run.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('compact-followup-command.'+m);};
const [manifest_path,manifest_sha256,review_path]=process.argv.slice(2),controller=new AbortController();process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
function verify(){
 const bytes=readFileSync(manifest_path);need(hash(bytes)===manifest_sha256,'manifest-drift');const f=JSON.parse(bytes);
 need(f.schema==='are.compact-followup-freeze/v1'&&f.deadline_ms===120000&&f.growth_bytes===33*1024**2,'envelope');
 need(Array.isArray(f.files)&&f.files.length>0&&f.files.length<=1500,'files');const files=new Map();
 for(const b of f.files){need(resolve(b.path)===b.path&&realpathSync(b.path)===b.path&&lstatSync(b.path).isFile()&&!files.has(b.path),'file-identity');need(hash(readFileSync(b.path))===b.sha256,'source-drift');files.set(b.path,b.sha256);}
 need(typeof vm.SourceTextModule==='function','vm-flag');
 for(const p of files.keys())if(p.endsWith('.mjs'))for(const spec of new vm.SourceTextModule(readFileSync(p,'utf8'),{identifier:p}).dependencySpecifiers){if(spec.startsWith('node:'))continue;need(spec.startsWith('.')&&files.has(resolve(dirname(p),spec)),'static-dependency');}
 for(const name of ['run-compact-followup.mjs','compact-followup-worker.mjs','qualify-compact-followup.mjs'])need(files.has(join(import.meta.dirname,name)),'required-code');
 need(files.has(f.request.credential_path)&&files.has(f.request.binding.provenance.path)&&files.has(f.protocol_path),'required-input');
 need(files.get(join(f.request.fixture_root,'observations.txt'))===f.request.fixture_sha256,'fixture-binding');return f;
}
let output=null;
try{
 const f=verify(),review=JSON.parse(readFileSync(review_path));need(review.approved===true&&review.live_execution_admitted===true&&review.manifest_sha256===manifest_sha256,'exact-review');
 need(resolve(f.request.out_root)===f.request.out_root&&!existsSync(f.request.out_root)&&realpathSync(dirname(f.request.out_root))===dirname(f.request.out_root),'fresh-output');
 const storage=guardStorage({binding:f.request.binding,output:f.request.out_root,growth_reservation_bytes:f.growth_bytes});mkdirSync(f.request.out_root,{mode:0o700});
 let stage;
 try{stage=await runComparisonProductionStage({operation:'qualify',args:f.request,signal:controller.signal},{worker:join(import.meta.dirname,'compact-followup-worker.mjs'),deadline_ms:f.deadline_ms});verify();output={complete:stage.value.complete,qualification_passed:stage.value.qualification_passed,manifest_sha256,storage,...stage};}
 catch(e){output={complete:false,qualification_passed:false,conservative_model_token_reservation:16000,manifest_sha256,error:String(e.message),evidence:e.result??stage??null};}
 const bytes=JSON.stringify(output,null,2)+String.fromCharCode(10);need(Buffer.byteLength(bytes)<=1024*1024,'parent-output-bound');writeFileSync(join(dirname(manifest_path),'PROCESS.json'),bytes,{flag:'wx',mode:0o600});
 console.log(JSON.stringify({complete:output.complete,qualification_passed:output.qualification_passed,evidence:join(dirname(manifest_path),'PROCESS.json')}));process.exitCode=output.complete?0:2;
}catch(e){console.error(String(e.message));if(output)console.log(JSON.stringify(output));process.exitCode=2;}
