// Exact frozen exposed feasibility case. Open Questions: G01-JACOCO-FEASIBILITY-R3.json.
import{readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,statfsSync,lstatSync}from'node:fs';
import{join,dirname,resolve}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{spawnSync,execFileSync}from'node:child_process';
import{projectFixture}from'./project-canonical-buggy-fixture-r1.mjs';import{productionInstrumentation}from'./all-production-instrumentation-r2.mjs';import{classInventory,bindClassInfo}from'./jacoco-class-binding-r3.mjs';
const here=dirname(fileURLToPath(import.meta.url)),repo=resolve(here,'../../../../../..'),campaign='/home/vlad_/are-benchmark-archive/g01-jacoco-feasibility-r3-20261006',id=process.argv[2];
const framework='/home/vlad_/are-benchmark-archive/defects4j-runtime-v3.0.1',toolRoot='/home/vlad_/.local/share/are-toolchains/defects4j-v3',jacoco='/home/vlad_/.local/share/are-toolchains/jacoco-0.8.12';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,r)=>{if(!v)throw Error('jacoco-case.'+r);};
const fb=readFileSync(join(campaign,'FREEZE.json')),freeze=JSON.parse(fb),c=freeze.cases.find(c=>c.case_id===id);need(process.argv.length===3&&c,'arguments');
for(const[n,pin]of Object.entries(freeze.source_sha256))need(sha(readFileSync(join(here,n)))===pin,'source-drift');
for(const[n,pin]of Object.entries(freeze.framework_source_sha256))need(sha(readFileSync(join(framework,n)))===pin,'framework-source-drift');
for(const e of freeze.tools.entries)need(sha(readFileSync(join(jacoco,e.name)))===e.sha256,'tool-drift');
need(execFileSync('git',['-C',framework,'rev-parse','HEAD'],{encoding:'utf8'}).trim()===freeze.framework_pin,'framework-pin');need(sha(readFileSync(join(repo,'tools/toolchain/run-defects4j')))===freeze.launcher_sha256,'launcher');
const root=join(campaign,id);need(!existsSync(root),'no-overwrite');mkdirSync(root,{mode:0o700});const fixture=join(root,'trusted-fixture');
const save=(n,x)=>writeFileSync(join(root,n),JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});save('STARTED.json',{case_id:id,freeze_sha256:sha(fb),started_at:new Date().toISOString()});
const sandbox=['--unshare-all','--die-with-parent','--new-session','--cap-drop','ALL','--ro-bind','/','/','--tmpfs','/home','--tmpfs','/mnt','--tmpfs','/run','--tmpfs','/tmp','--proc','/proc','--dev','/dev',
 '--ro-bind',framework,framework,'--ro-bind',toolRoot,toolRoot,'--ro-bind',jacoco,jacoco,'--bind',root,root,'--ro-bind',join(repo,'tools/toolchain/run-defects4j'),'/run/are-run-defects4j','--clearenv',
 '--setenv','PATH','/usr/bin:/bin','--setenv','TZ','America/Los_Angeles','--setenv','LANG','C.UTF-8','--setenv','LC_ALL','C.UTF-8','--setenv','ANT_OPTS','-Xmx1536m -Dfile.encoding=UTF-8',
 '--setenv','GIT_AUTHOR_NAME','ARE fixture preparation','--setenv','GIT_AUTHOR_EMAIL','fixture@are.invalid','--setenv','GIT_COMMITTER_NAME','ARE fixture preparation','--setenv','GIT_COMMITTER_EMAIL','fixture@are.invalid'];
const operations=[];
function run(label,args,{agent=null,java=false}={}){const fs=statfsSync(root);need(fs.bavail*fs.bsize>=8*1024**3,'disk-reserve');const out=openSync(join(root,label+'.stdout'),'wx',0o600),err=openSync(join(root,label+'.stderr'),'wx',0o600),started=Date.now();let r;
 const command=java?[join(toolRoot,'jdk-11.0.32.1+1/bin/java'),'-Dfile.encoding=UTF-8','-jar',join(jacoco,'cli.jar'),...args]:['/bin/bash','/run/are-run-defects4j',...args];
 const argv=[...sandbox,...(agent?['--setenv','JAVA_TOOL_OPTIONS',agent]:[]),...command];
 try{r=spawnSync('/usr/bin/bwrap',argv,{timeout:300000,killSignal:'SIGKILL',stdio:['ignore',out,err],env:{PATH:'/usr/bin:/bin'}});}finally{closeSync(out);closeSync(err);}
 const x={label,args,agent_option:agent,java_cli:java,exit_code:r.status,signal:r.signal,error:r.error?String(r.error.code):null,elapsed_ms:Date.now()-started,stdout_sha256:sha(readFileSync(join(root,label+'.stdout'))),stderr_sha256:sha(readFileSync(join(root,label+'.stderr'))),automatic_retries:0};operations.push(x);save(label+'-RECEIPT.json',x);need(r.status===0&&!r.error,label+'-failed-no-replay');return x;
}
const relative=p=>{need(/^[A-Za-z0-9_./-]+$/.test(p)&&!p.startsWith('/')&&!p.split('/').some(x=>!x||x==='.'||x==='..'),'exported-root');return p;};
let error=null,projection=null,instrumentation=null,sourceRoot=null,compiledRoot=null,classes=null;
try{
 run('PREPARATION',['checkout','-p',c.project,'-v',c.bug+'b','-w',fixture]);
 projection=projectFixture({root:fixture,output:join(root,'buggy-java-only'),project:c.project,bug:c.bug,frameworkPin:freeze.framework_pin});need(projection.source_tree_sha256===c.source_tree_sha256&&projection.source_count===c.source_count,'source-parity');
 run('SOURCE-ROOT',['export','-p','dir.src.classes','-w',fixture]);sourceRoot=relative(readFileSync(join(root,'SOURCE-ROOT.stdout'),'utf8').trim());
 run('COMPILED-ROOT',['export','-p','dir.bin.classes','-w',fixture]);compiledRoot=relative(readFileSync(join(root,'COMPILED-ROOT.stdout'),'utf8').trim());
 instrumentation=productionInstrumentation(projection.sources.map(s=>({...s,bytes:readFileSync(join(root,'buggy-java-only/corpus',s.path))})),sourceRoot);save('INSTRUMENTATION.json',instrumentation);
 run('COMPILE',['compile','-w',fixture]);need(!lstatSync(join(fixture,compiledRoot)).isSymbolicLink(),'class-root-symlink');const before=classInventory(join(fixture,compiledRoot));save('CLASSES-BEFORE.json',before);
 run('CLASSINFO',['classinfo',join(fixture,compiledRoot)],{java:true});classes=bindClassInfo(readFileSync(join(root,'CLASSINFO.stdout'),'utf8'),before,instrumentation);save('BOUND-CLASSINFO.json',classes);
 const includes=instrumentation.classes.flatMap(n=>[n,n+'$*']).join(':');need(includes.length<100000,'includes-budget');
 const agent='-javaagent:'+join(jacoco,'agent.jar')+'=destfile='+join(root,'coverage.exec')+',append=true,output=file,dumponexit=true,jmx=false,includes='+includes+' -Dfile.encoding=UTF-8';
 run('TEST',['test','-w',fixture,'-t',c.test_selector],{agent});
 const log=readFileSync(join(root,'TEST.stdout'),'utf8')+'\n'+readFileSync(join(root,'TEST.stderr'),'utf8');need(!/IllegalClassFormatException|Error while instrumenting|Method code too large/i.test(log),'instrumentation-error');
 const after=classInventory(join(fixture,compiledRoot));save('CLASSES-AFTER.json',after);need(JSON.stringify(before)===JSON.stringify(after),'compiled-byte-drift');
 for(const s of projection.sources)need(sha(readFileSync(join(fixture,s.path)))===s.sha256,'source-byte-drift');
 const failure=readFileSync(join(fixture,'failing_tests'),'utf8');need(JSON.stringify([...failure.matchAll(/^--- (.+)$/gm)].map(m=>m[1]))===JSON.stringify([c.test_selector]),'test-selector');need(failure.split('\n')[1].split(':')[0].trim()===c.expected_failure_type,'failure-type');
 need(existsSync(join(root,'coverage.exec')),'exec-absent');
 run('REPORT',['report',join(root,'coverage.exec'),'--classfiles',join(fixture,compiledRoot),'--sourcefiles',join(fixture,sourceRoot),'--encoding','UTF-8','--xml',join(root,'coverage.xml')],{java:true});
 const reportLog=readFileSync(join(root,'REPORT.stdout'),'utf8')+'\n'+readFileSync(join(root,'REPORT.stderr'),'utf8');need(!/do not match|does not match|different class with same name/i.test(reportLog),'report-class-mismatch');
}catch(e){error=String(e.message).slice(0,240);}
const out={status:error?'terminal-jacoco-case-failed':'terminal-jacoco-execution-complete',case_id:id,error,freeze_sha256:sha(fb),source_tree_sha256:projection?.source_tree_sha256??null,source_root:sourceRoot,compiled_root:compiledRoot,production_source_files:instrumentation?.production_source_files??null,compiled_classes:classes?.length??null,operations,
 coverage_exec_sha256:existsSync(join(root,'coverage.exec'))?sha(readFileSync(join(root,'coverage.exec'))):null,coverage_xml_sha256:existsSync(join(root,'coverage.xml'))?sha(readFileSync(join(root,'coverage.xml'))):null,
 provider_calls:0,reference_label_reads:0,automatic_retries:0,authority_effect:'none',claim_ceiling:'Execution feasibility only, final class/source audit separate; no ranking/quality/superiority.',open_questions_owner:'G01-JACOCO-FEASIBILITY-R3.json'};
save('RESULT.json',out);console.log(JSON.stringify({case_id:id,status:out.status,error}));if(error)process.exitCode=1;
