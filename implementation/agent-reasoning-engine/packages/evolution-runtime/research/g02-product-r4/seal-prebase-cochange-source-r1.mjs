// Full12 source-only pilot. Fetch exact public base ancestors, no reference data.
// Open Questions: evidence/G02-PREBASE-COCHANGE-SOURCE-R1.json.
import{readFileSync,writeFileSync,mkdirSync,existsSync,lstatSync,statfsSync}from'node:fs';import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{spawnSync,execFileSync}from'node:child_process';
import{bindDelivery}from'../../../../benchmarks/contextbench-v1/delivery.mjs';import{rankCochange}from'./prebase-cochange-r1.mjs';
const here=dirname(fileURLToPath(import.meta.url)),root='/home/vlad_/are-benchmark-archive/g02-prebase-cochange-source-r1-20261006',old='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006',raw='/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,r)=>{if(!v)throw Error('cochange-source.'+r);},read=p=>JSON.parse(readFileSync(p));
const env={PATH:process.env.PATH,GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_NOSYSTEM:'1',GIT_TERMINAL_PROMPT:'0',GIT_NO_LAZY_FETCH:'1'};
const git=(dir,args,input)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-c','pack.threads=1','-C',dir,...args],{env,input,maxBuffer:64*1024**2,timeout:120000,stdio:['pipe','pipe','pipe']});
need(!existsSync(root),'no-overwrite');const oldBytes=readFileSync(join(old,'QUALITY-RESULT.json'));need(sha(oldBytes)==='0d63c7c73b1183c52a875c79a70169148b68fdef5a79ba5f04ee709a50623a1e','prior-quality-pin');
const prior=JSON.parse(oldBytes),cases=[];
for(const row of prior.rows){const pair=row.pair,b=read(join(raw,pair,'raw/tasks/binding.json')),taskPath=join(raw,pair,'raw/tasks',b.task_file),taskBytes=readFileSync(taskPath),task=JSON.parse(taskBytes),base=join(raw,pair,'raw/sources/session/base'),controlPath=join(old,pair+'-control','RESULT.json'),controlBytes=readFileSync(controlPath),r=JSON.parse(controlBytes);
 need(sha(taskBytes)===b.task_sha256&&task.instance_id===b.instance_id&&/^[a-f0-9]{40}$/.test(task.base_commit)&&git(base,['rev-parse','HEAD']).toString().trim()===task.base_commit,'task-base');
 need(['https://github.com/ansible/ansible.git','https://github.com/django/django.git','https://github.com/sympy/sympy.git','https://github.com/nlohmann/json.git'].includes(task.repo_url),'public-url');
 const delivery=bindDelivery({captures:r.result.captures,receipts:r.result.receipts});need(r.status==='matched-arm-passed'&&delivery.unmapped.length===0&&delivery.token_accounting.cost_complete,'control-binding');
 const observed=[...new Set(delivery.read_observations.sort((a,b)=>a.first_confirmed_receipt-b.first_confirmed_receipt).map(x=>x.path))];
 cases.push({pair,instance_id:task.instance_id,base_commit:task.base_commit,repo_url:task.repo_url,base_tree:git(base,['rev-parse','HEAD^{tree}']).toString().trim(),base,task_path:taskPath,task_sha256:sha(taskBytes),control_path:controlPath,control_sha256:sha(controlBytes),observed_paths:observed,seed_paths:observed.slice(0,12)});
}need(cases.length===12,'all12');mkdirSync(root,{mode:0o700});const save=(dir,n,x)=>writeFileSync(join(dir,n),JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
const freeze={status:'all12-source-policy-frozen-before-history-fetch',cases,prior_quality_sha256:sha(oldBytes),
 source_sha256:Object.fromEntries(['prebase-cochange-r1.mjs','seal-prebase-cochange-source-r1.mjs'].map(n=>[n,sha(readFileSync(join(here,n)))])),
 protocol_sha256:sha(readFileSync(join(here,'../../evidence/G02-PREBASE-COCHANGE-SOURCE-R1.json'))),
 history_policy:{exact_base_fetch:true,depth:1001,filter:'blob:none',first_parent_only:true,exclude_merges:true,maximum_commits:1000,minimum_available_commits:100,maximum_raw_paths_per_commit:20,no_commit_messages_authors_patches_or_blobs:true,no_lazy_fetch:true,no_future_refs:true,automatic_retries:0},
 gate:{all12_source_valid:true,novel_hits_at_least:4,hit_gain_vs_equal_width_churn_at_least:3,proposal_precision_at_least:.5,mean_additive_file_f1_gain_vs_archived_native_control_at_least:.03,no_negative_repository_mean:true},
 authority_effect:'none',claim_ceiling:'Exposed source proposal screen only, not actual read delivery or native quality.',open_questions_owner:'G02-PREBASE-COCHANGE-SOURCE-R1.json'};
save(root,'FREEZE.json',freeze);const rows=[];
for(const c of cases){const dir=join(root,c.pair);mkdirSync(dir,{mode:0o700});let error=null,ranking=null,history=null;
 try{
  const fs=statfsSync(root);need(fs.bavail*fs.bsize>=8*1024**3,'reserve');const cache=join(dir,'history.git');mkdirSync(cache,{mode:0o700});git(cache,['init','--bare']);git(cache,['remote','add','origin',c.repo_url]);
  save(dir,'FETCH-STARTED.json',{exact_base_commit:c.base_commit,repo_url:c.repo_url,filter:'blob:none',depth:1001,automatic_retries:0,started_at:new Date().toISOString()});
  const started=Date.now(),r=spawnSync('git',['-c','core.hooksPath=/dev/null','-c','pack.threads=1','-C',cache,'fetch','--filter=blob:none','--depth=1001','--no-tags','--no-write-fetch-head','origin',c.base_commit],{env,timeout:300000,killSignal:'SIGKILL',encoding:'utf8',maxBuffer:2*1024**2});
  save(dir,'FETCH-RECEIPT.json',{exit_code:r.status,signal:r.signal,error:r.error?String(r.error.code):null,elapsed_ms:Date.now()-started,stdout_sha256:sha(r.stdout??''),stderr_sha256:sha(r.stderr??''),automatic_retries:0});
  need(r.status===0&&!r.error,'fetch-failed-no-replay');need(!git(cache,['for-each-ref','--format=%(refname)']).toString().trim(),'unexpected-refs');need(git(cache,['rev-parse',c.base_commit+'^{tree}']).toString().trim()===c.base_tree,'exact-base-tree');
  const commits=git(cache,['rev-list','--first-parent','--no-merges','--max-count=1000',c.base_commit]).toString().trim().split('\n').filter(Boolean);need(commits.length>=100&&commits.every(x=>/^[a-f0-9]{40}$/.test(x)),'history-capacity');
  history=[];
  for(const commit of commits){const rawPaths=git(cache,['diff-tree','--no-commit-id','--name-only','--no-renames','--no-ext-diff','-r','-z',commit]);const paths=new TextDecoder('utf-8',{fatal:true}).decode(rawPaths).split('\0').filter(Boolean);need(new Set(paths).size===paths.length,'unique-history-paths');history.push({commit,paths});}
  save(dir,'HISTORY.json',{base_commit:c.base_commit,base_tree:c.base_tree,policy:freeze.history_policy,history,authority_effect:'none'});
  const eligible=git(c.base,['ls-files','-z']).toString().split('\0').filter(p=>p&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(x=>x==='..'||x==='.')&&/\.(?:py|cpp|cc|cxx|hpp|hh|hxx|h|c)$/.test(p)).filter(p=>{const s=lstatSync(join(c.base,p));return s.isFile()&&s.size<=2*1024**2;});
  ranking=rankCochange({history,seeds:c.seed_paths,observed:c.observed_paths,eligible});
  save(dir,'LEADS.json',{pair:c.pair,instance_id:c.instance_id,base_commit:c.base_commit,history_sha256:sha(readFileSync(join(dir,'HISTORY.json'))),...ranking,provider_calls:0,reference_label_reads:0});
 }catch(e){error=String(e.message).slice(0,240);}
 const result={pair:c.pair,status:error?'source-case-failed':'source-case-sealed',error,history_commits:history?.length??null,proposals:ranking?.treatment.length??0,leads_sha256:existsSync(join(dir,'LEADS.json'))?sha(readFileSync(join(dir,'LEADS.json'))):null,provider_calls:0,reference_label_reads:0,automatic_retries:0};save(dir,'RESULT.json',result);rows.push({...result,result_sha256:sha(readFileSync(join(dir,'RESULT.json')))});console.log(JSON.stringify({finished:rows.length,expected:12,...result}));
}
save(root,'SOURCE-SEAL.json',{status:'all12-source-attempts-terminal-before-evaluator',freeze_sha256:sha(readFileSync(join(root,'FREEZE.json'))),rows,valid:rows.filter(r=>r.status==='source-case-sealed').length,provider_calls:0,reference_label_reads:0,authority_effect:'none',open_questions_owner:'G02-PREBASE-COCHANGE-SOURCE-R1.json'});
console.log(JSON.stringify({status:'all12-source-attempts-terminal-before-evaluator',valid:rows.filter(r=>r.status==='source-case-sealed').length,expected:12}));
