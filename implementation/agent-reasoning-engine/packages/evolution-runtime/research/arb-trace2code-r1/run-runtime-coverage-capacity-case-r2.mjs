// One exact frozen exposed case; all outputs exclusive, no retry or provider.
// Open Questions: evidence/G01-RUNTIME-COVERAGE-PROJECT-CAPACITY-R2.json.
import{readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,statfsSync}from'node:fs';import{join,dirname,resolve}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{spawnSync,execFileSync}from'node:child_process';
import{projectFixture}from'./project-canonical-buggy-fixture-r1.mjs';import{productionInstrumentation}from'./all-production-instrumentation-r2.mjs';
const here=dirname(fileURLToPath(import.meta.url)),repo=resolve(here,'../../../../../..'),campaign='/home/vlad_/are-benchmark-archive/g01-runtime-coverage-project-capacity-r2-20261006',id=process.argv[2];
const framework='/home/vlad_/are-benchmark-archive/defects4j-runtime-v3.0.1',toolRoot='/home/vlad_/.local/share/are-toolchains/defects4j-v3';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,r)=>{if(!v)throw Error('coverage-capacity.'+r);};
const freezeBytes=readFileSync(join(campaign,'FREEZE.json')),freeze=JSON.parse(freezeBytes),c=freeze.cases.find(c=>c.case_id===id);
need(process.argv.length===3&&c&&/^Defects4J-[A-Za-z]+-\d+$/.test(id),'arguments');
for(const[n,pin]of Object.entries(freeze.source_sha256))need(sha(readFileSync(join(here,n)))===pin,'source-drift');
for(const[n,pin]of Object.entries(freeze.framework_source_sha256))need(sha(readFileSync(join(framework,n)))===pin,'framework-source-drift');
need(execFileSync('git',['-C',framework,'rev-parse','HEAD'],{encoding:'utf8'}).trim()===freeze.framework_pin,'framework-pin');
need(sha(readFileSync(join(repo,'tools/toolchain/run-defects4j')))===freeze.launcher_sha256,'launcher-drift');
const root=join(campaign,id);need(!existsSync(root),'no-overwrite');mkdirSync(root,{mode:0o700});
const save=(n,x)=>writeFileSync(join(root,n),JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
save('STARTED.json',{case_id:id,campaign_freeze_sha256:sha(freezeBytes),started_at:new Date().toISOString()});
const sandbox=['--unshare-all','--die-with-parent','--new-session','--cap-drop','ALL','--ro-bind','/','/','--tmpfs','/home','--tmpfs','/mnt','--tmpfs','/run','--tmpfs','/tmp','--proc','/proc','--dev','/dev',
 '--ro-bind',framework,framework,'--ro-bind',toolRoot,toolRoot,'--bind',root,root,
 '--ro-bind',join(repo,'tools/toolchain/run-defects4j'),'/run/are-run-defects4j','--clearenv',
 '--setenv','PATH','/usr/bin:/bin','--setenv','TZ','America/Los_Angeles','--setenv','ANT_OPTS','-Xmx1536m',
 '--setenv','GIT_AUTHOR_NAME','ARE fixture preparation','--setenv','GIT_AUTHOR_EMAIL','fixture@are.invalid','--setenv','GIT_COMMITTER_NAME','ARE fixture preparation','--setenv','GIT_COMMITTER_EMAIL','fixture@are.invalid'];
const operations=[];
function run(label,args){const fs=statfsSync(root);need(fs.bavail*fs.bsize>=8*1024**3,'reserve');
 const out=openSync(join(root,label+'.stdout'),'wx',0o600),err=openSync(join(root,label+'.stderr'),'wx',0o600),started=Date.now();let r;
 try{r=spawnSync('/usr/bin/bwrap',[...sandbox,'/bin/bash','/run/are-run-defects4j',...args],{timeout:300000,killSignal:'SIGKILL',stdio:['ignore',out,err],env:{PATH:'/usr/bin:/bin'}});}finally{closeSync(out);closeSync(err);}
 const x={label,args,exit_code:r.status,signal:r.signal,error:r.error?String(r.error.code):null,elapsed_ms:Date.now()-started,stdout_sha256:sha(readFileSync(join(root,label+'.stdout'))),stderr_sha256:sha(readFileSync(join(root,label+'.stderr'))),automatic_retries:0};operations.push(x);save(label+'-RECEIPT.json',x);need(r.status===0&&!r.error,label+'-failed-no-replay');return x;
}
let error=null,projection=null,instrumentation=null,sourceRoot=null;
try{
 run('PREPARATION',['checkout','-p',c.project,'-v',c.bug+'b','-w',join(root,'trusted-fixture')]);
 projection=projectFixture({root:join(root,'trusted-fixture'),output:join(root,'buggy-java-only'),project:c.project,bug:c.bug,frameworkPin:freeze.framework_pin});
 need(projection.source_tree_sha256===c.source_tree_sha256&&projection.source_count===c.source_count,'source-parity');
 run('SOURCE-ROOT',['export','-p','dir.src.classes','-w',join(root,'trusted-fixture')]);sourceRoot=readFileSync(join(root,'SOURCE-ROOT.stdout'),'utf8').trim();
 need(/^[A-Za-z0-9_./-]+$/.test(sourceRoot)&&!sourceRoot.startsWith('/')&&!sourceRoot.split('/').some(x=>!x||x==='.'||x==='..'),'source-root');
 instrumentation=productionInstrumentation(projection.sources.map(s=>({...s,bytes:readFileSync(join(root,'buggy-java-only/corpus',s.path))})),sourceRoot);
 save('INSTRUMENTATION.json',instrumentation);writeFileSync(join(root,'ALL-PRODUCTION-CLASSES.txt'),instrumentation.classes.join('\n')+'\n',{flag:'wx',mode:0o600});
 run('COVERAGE',['coverage','-w',join(root,'trusted-fixture'),'-t',c.test_selector,'-i',join(root,'ALL-PRODUCTION-CLASSES.txt')]);
 for(const s of projection.sources)need(sha(readFileSync(join(root,'trusted-fixture',s.path)))===s.sha256,'source-changed');
 need(existsSync(join(root,'trusted-fixture/coverage.xml')),'coverage-output-absent');
}catch(e){error=String(e.message).slice(0,240);}
const out={status:error?'terminal-coverage-capacity-case-failed':'terminal-coverage-execution-complete',case_id:id,error,campaign_freeze_sha256:sha(freezeBytes),
 source_root:sourceRoot,production_source_files:instrumentation?.production_source_files??null,instrumented_top_level_classes:instrumentation?.classes.length??null,
 source_tree_sha256:projection?.source_tree_sha256??null,operations,execution:operations.find(x=>x.label==='COVERAGE')??null,
 coverage_xml_sha256:existsSync(join(root,'trusted-fixture/coverage.xml'))?sha(readFileSync(join(root,'trusted-fixture/coverage.xml'))):null,
 provider_calls:0,reference_label_reads:0,automatic_retries:0,claim_ceiling:'Offline execution capacity only; source binding/failure validation separate; no quality.',authority_effect:'none',open_questions_owner:'G01-RUNTIME-COVERAGE-PROJECT-CAPACITY-R2.json'};
save('RESULT.json',out);console.log(JSON.stringify({case_id:id,status:out.status,error}));if(error)process.exitCode=1;
