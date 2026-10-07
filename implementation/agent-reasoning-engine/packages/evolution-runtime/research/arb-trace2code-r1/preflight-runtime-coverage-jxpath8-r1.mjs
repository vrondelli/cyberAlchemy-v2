// Trusted pinned preparation + source-only all-class coverage, network isolated.
// Open Questions: evidence/G01-RUNTIME-COVERAGE-FEASIBILITY-R1.json.
import{readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,statfsSync}from'node:fs';import{join,dirname,resolve}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{spawnSync,execFileSync}from'node:child_process';
import{projectFixture}from'./project-canonical-buggy-fixture-r1.mjs';import{productionInstrumentation}from'./all-production-instrumentation-r1.mjs';
const here=dirname(fileURLToPath(import.meta.url)),repo=resolve(here,'../../../../../..'),root='/home/vlad_/are-benchmark-archive/g01-runtime-coverage-jxpath8-r1-20261006';
const framework='/home/vlad_/are-benchmark-archive/defects4j-runtime-v3.0.1',toolRoot='/home/vlad_/.local/share/are-toolchains/defects4j-v3',pin='6d54320e0db5a357f9ab38a8e4d2e5aead7e1c09',selector='org.apache.commons.jxpath.ri.compiler.CoreOperationTest::testNan';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,r)=>{if(!v)throw Error('coverage-preflight.'+r);},save=(n,x)=>writeFileSync(join(root,n),JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
need(!existsSync(root),'no-overwrite');need(execFileSync('git',['-C',framework,'rev-parse','HEAD'],{encoding:'utf8'}).trim()===pin,'framework-pin');
const expectedBytes=readFileSync('/home/vlad_/are-benchmark-archive/defects4j-canonical-jxpath8-r1/buggy-java-only/RECEIPT.json'),expected=JSON.parse(expectedBytes);
need(sha(expectedBytes)==='6ae5e5de96dd6e1e347d6f4d8b5eacf0e8f75e3980896f5d0736835b24e4d61e','prior-projection');
mkdirSync(root,{mode:0o700});const fs=statfsSync(root);need(fs.bavail*fs.bsize>=8*1024**3,'reserve');
const moduleFiles=['preflight-runtime-coverage-jxpath8-r1.mjs','all-production-instrumentation-r1.mjs','java-type-links-dev-r1.mjs','project-canonical-buggy-fixture-r1.mjs'];
save('FREEZE.json',{status:'frozen-before-isolated-fixture-execution',case_id:'Defects4J-JxPath-8',framework_pin:pin,
 source_sha256:Object.fromEntries(moduleFiles.map(n=>[n,sha(readFileSync(join(here,n)))])),
 framework_source_sha256:Object.fromEntries(['framework/bin/d4j/d4j-coverage','framework/core/Coverage.pm','framework/core/Project.pm','framework/core/Project/JxPath.pm','framework/projects/defects4j.build.xml'].map(n=>[n,sha(readFileSync(join(framework,n)))])),
 launcher_sha256:sha(readFileSync(join(repo,'tools/toolchain/run-defects4j'))),prior_projection_sha256:sha(expectedBytes),
 test_selector:selector,timeout_per_operation_ms:300000,automatic_retries:0,provider_calls:0,
 instrumentation:'All source-declared production top-level classes and framework-included inner classes; explicit -i mandatory, never fix-modified defaults.',
 isolation:'bwrap unshare-all, clear environment, read-only system/framework/toolchain, hidden host home/mnt/run, only new exact archive root writable; no network fallback.',
 claim_ceiling:'Single exposed-case coverage functionality only, not SBEST reproduction or quality.',authority_effect:'none',open_questions_owner:'G01-RUNTIME-COVERAGE-FEASIBILITY-R1.json'});
const sandbox=['--unshare-all','--die-with-parent','--new-session','--cap-drop','ALL','--ro-bind','/','/','--tmpfs','/home','--tmpfs','/mnt','--tmpfs','/run','--tmpfs','/tmp','--proc','/proc','--dev','/dev',
 '--ro-bind',framework,framework,'--ro-bind',toolRoot,toolRoot,'--bind',root,root,
 '--ro-bind',join(repo,'tools/toolchain/run-defects4j'),'/run/are-run-defects4j','--clearenv',
 '--setenv','PATH','/usr/bin:/bin','--setenv','TZ','America/Los_Angeles','--setenv','GIT_AUTHOR_NAME','ARE fixture preparation','--setenv','GIT_AUTHOR_EMAIL','fixture@are.invalid','--setenv','GIT_COMMITTER_NAME','ARE fixture preparation','--setenv','GIT_COMMITTER_EMAIL','fixture@are.invalid'];
function run(label,args){const fd=openSync(join(root,label+'.log'),'wx',0o600),started=Date.now();let r;try{r=spawnSync('/usr/bin/bwrap',[...sandbox,'/bin/bash','/run/are-run-defects4j',...args],{timeout:300000,stdio:['ignore',fd,fd],env:{PATH:'/usr/bin:/bin'}});}finally{closeSync(fd);}
 const x={label,args,exit_code:r.status,signal:r.signal,error:r.error?String(r.error.code):null,elapsed_ms:Date.now()-started,log_sha256:sha(readFileSync(join(root,label+'.log'))),automatic_retries:0};save(label+'-RECEIPT.json',x);need(r.status===0&&!r.error,label+'-failed-no-replay');return x;}
let error=null,projection=null,instrumentation=null,execution=null;
try{
 run('PREPARATION',['checkout','-p','JxPath','-v','8b','-w',join(root,'trusted-fixture')]);
 projection=projectFixture({root:join(root,'trusted-fixture'),output:join(root,'buggy-java-only'),project:'JxPath',bug:8,frameworkPin:pin});
 need(projection.source_tree_sha256===expected.source_tree_sha256&&projection.source_count===expected.source_count,'source-parity');
 instrumentation=productionInstrumentation(projection.sources.map(s=>({...s,bytes:readFileSync(join(root,'buggy-java-only/corpus',s.path))})),'src/java');
 save('INSTRUMENTATION.json',instrumentation);writeFileSync(join(root,'ALL-PRODUCTION-CLASSES.txt'),instrumentation.classes.join('\n')+'\n',{flag:'wx',mode:0o600});
 execution=run('COVERAGE',['coverage','-w',join(root,'trusted-fixture'),'-t',selector,'-i',join(root,'ALL-PRODUCTION-CLASSES.txt')]);
 for(const s of projection.sources)need(sha(readFileSync(join(root,'trusted-fixture',s.path)))===s.sha256,'source-changed');
 need(existsSync(join(root,'trusted-fixture/coverage.xml')),'coverage-output-absent');
}catch(e){error=String(e.message).slice(0,240);}
const out={status:error?'terminal-coverage-feasibility-failed':'terminal-coverage-execution-complete',error,
 production_source_files:instrumentation?.production_source_files??null,instrumented_top_level_classes:instrumentation?.classes.length??null,
 source_tree_sha256:projection?.source_tree_sha256??null,execution,
 coverage_xml_sha256:existsSync(join(root,'trusted-fixture/coverage.xml'))?sha(readFileSync(join(root,'trusted-fixture/coverage.xml'))):null,
 provider_calls:0,reference_label_reads:0,automatic_retries:0,claim_ceiling:'One exposed source/runtime functionality check; XML validation and source binding remain separate. No quality gain or superiority.',authority_effect:'none',open_questions_owner:'G01-RUNTIME-COVERAGE-FEASIBILITY-R1.json'};
save('RESULT.json',out);console.log(JSON.stringify(out));if(error)process.exitCode=1;
