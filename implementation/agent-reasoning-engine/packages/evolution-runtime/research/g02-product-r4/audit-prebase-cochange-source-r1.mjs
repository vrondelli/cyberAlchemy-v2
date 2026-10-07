// All12 sealed source reconstruction, then exposed file-proxy arithmetic only.
// Open Questions: evidence/G02-PREBASE-COCHANGE-SOURCE-R1.json.
import{readFileSync,writeFileSync,existsSync,lstatSync}from'node:fs';import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
import{rankCochange}from'./prebase-cochange-r1.mjs';import{bindDelivery,stable}from'../../../../benchmarks/contextbench-v1/delivery.mjs';
const here=dirname(fileURLToPath(import.meta.url)),root='/home/vlad_/are-benchmark-archive/g02-prebase-cochange-source-r1-20261006',prior='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p)),need=(v,r)=>{if(!v)throw Error('cochange-audit.'+r);};
const env={PATH:process.env.PATH,GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_NOSYSTEM:'1',GIT_TERMINAL_PROMPT:'0',GIT_NO_LAZY_FETCH:'1'},git=(dir,args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-C',dir,...args],{env,maxBuffer:64*1024**2,timeout:120000}).toString('utf8');
need(!existsSync(join(root,'EVALUATOR-AUDIT.json')),'no-overwrite');const fBytes=readFileSync(join(root,'FREEZE.json')),f=JSON.parse(fBytes),seal=read(join(root,'SOURCE-SEAL.json'));
need(f.cases.length===12&&seal.rows.length===12&&seal.freeze_sha256===sha(fBytes),'all12-seal');
for(const[n,pin]of Object.entries(f.source_sha256))need(sha(readFileSync(join(here,n)))===pin,'generator-source-drift');
const oldBytes=readFileSync(join(prior,'QUALITY-RESULT.json'));need(sha(oldBytes)===f.prior_quality_sha256,'prior-quality');const old=JSON.parse(oldBytes),predictions=[];
// No Gold read before every source result and proposal has been reconstructed.
for(const c of f.cases){const dir=join(root,c.pair),s=seal.rows.find(s=>s.pair===c.pair),rBytes=readFileSync(join(dir,'RESULT.json'));need(sha(rBytes)===s.result_sha256,'result-pin');
 const result=JSON.parse(rBytes);need(result.status==='source-case-sealed'&&s.status==='source-case-sealed','all12-valid-no-partial-label-audit');
 const leadBytes=readFileSync(join(dir,'LEADS.json')),lead=JSON.parse(leadBytes),historyBytes=readFileSync(join(dir,'HISTORY.json')),h=JSON.parse(historyBytes),cache=join(dir,'history.git');
 need(sha(leadBytes)===s.leads_sha256&&sha(historyBytes)===lead.history_sha256&&h.base_commit===c.base_commit&&h.base_tree===c.base_tree,'lead-history-pins');
 need(!git(cache,['for-each-ref','--format=%(refname)']).trim()&&git(cache,['rev-parse',c.base_commit+'^{tree}']).trim()===c.base_tree,'ancestor-cache-identity');
 const commits=git(cache,['rev-list','--first-parent','--no-merges','--max-count=1000',c.base_commit]).trim().split('\n').filter(Boolean);need(stable(commits)===stable(h.history.map(x=>x.commit))&&commits.length>=100,'bounded-ancestor-membership');
 for(const x of h.history){const paths=git(cache,['diff-tree','--no-commit-id','--name-only','--no-renames','--no-ext-diff','-r','-z',x.commit]).split('\0').filter(Boolean);need(stable(paths)===stable(x.paths),'coedit-witness-reconstruction');}
 const cb=readFileSync(c.control_path);need(sha(cb)===c.control_sha256,'control-pin');const control=JSON.parse(cb),d=bindDelivery({captures:control.result.captures,receipts:control.result.receipts});need(d.unmapped.length===0,'control-delivery');
 const observed=[...new Set(d.read_observations.sort((a,b)=>a.first_confirmed_receipt-b.first_confirmed_receipt).map(x=>x.path))];need(stable(observed)===stable(c.observed_paths)&&stable(observed.slice(0,12))===stable(c.seed_paths),'seed-binding');
 const eligible=git(c.base,['ls-files','-z']).split('\0').filter(p=>p&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(x=>x==='..'||x==='.')&&/\.(?:py|cpp|cc|cxx|hpp|hh|hxx|h|c)$/.test(p)).filter(p=>{const s=lstatSync(join(c.base,p));return s.isFile()&&s.size<=2*1024**2;});
 const expected=rankCochange({history:h.history,seeds:c.seed_paths,observed:c.observed_paths,eligible});for(const[k,v]of Object.entries(expected))need(stable(lead[k])===stable(v),'full-source-ranking-reconstruction');
 predictions.push({c,lead});
}
const norm=p=>{p=p.replaceAll('\\','/');if(p.startsWith('/testbed/'))return p.slice(9);if(p.startsWith('/workspace/')){const q=p.slice(11),i=q.indexOf('/');return i<0?q:q.slice(i+1);}return p.startsWith('/')?p.replace(/^\/+/, ''):p.replace(/^[./]+/,'');};
const metric=(p,g)=>{const hits=[...p].filter(x=>g.has(x));return{intersection:hits.length,pred_size:p.size,gold_size:g.size,file_f1:p.size+g.size?2*hits.length/(p.size+g.size):0};};
const rows=[];let hits=0,controlHits=0,proposals=0,meanGain=0;const strata=new Map();
for(const{c,lead}of predictions){const oldRow=old.rows.find(r=>r.pair===c.pair),bundleDir=join(prior,'score-bundles',c.pair+'-control'),bundleBytes=readFileSync(join(bundleDir,'BUNDLE.json')),bundle=JSON.parse(bundleBytes),nativeBytes=readFileSync(join(prior,c.pair+'-control','NATIVE-SCORE.json')),native=JSON.parse(nativeBytes);
 need(sha(nativeBytes)===oldRow.control.score_sha256&&native.bundle_sha256===sha(bundleBytes)&&bundle.instance_id===c.instance_id&&bundle.commit===c.base_commit,'pinned-native-bundle');
 const gb=readFileSync(join(bundleDir,'GOLD-EXPOSED-TASK1.json'));need(sha(gb)===bundle.gold_sha256,'exact-exposed-gold');const g=JSON.parse(gb);need(g.inst_id===c.instance_id,'gold-case');
 const init=g.init_ctx??[],add=g.add_ctx??[],ctx=!init.length&&!add.length&&Array.isArray(g.gold_ctx)?g.gold_ctx:[...init,...add],gold=new Set(ctx.filter(x=>x.file).map(x=>norm(x.file)));
 const pb=readFileSync(join(prior,c.pair+'-control','prediction.json'));need(sha(pb)===bundle.prediction_sha256,'prediction-pin');const base=new Set(JSON.parse(pb).traj_data.pred_files.map(norm)),original=metric(base,gold),n=native.native.final.file;
 need(original.intersection===n.intersection&&original.pred_size===n.pred_size&&original.gold_size===n.gold_size&&Math.abs(original.file_f1-oldRow.control.file_f1)<1e-12,'native-file-count-reproduction');
 const treatment=lead.treatment.map(x=>x.path),control=lead.control.map(x=>x.path);need(treatment.length===control.length&&treatment.every(x=>!c.observed_paths.includes(x)),'equal-width-unseen');
 const ht=treatment.filter(x=>gold.has(x)),hc=control.filter(x=>gold.has(x)),a=metric(new Set([...base,...treatment]),gold),churn=metric(new Set([...base,...control]),gold),gain=a.file_f1-original.file_f1;
 hits+=ht.length;controlHits+=hc.length;proposals+=treatment.length;meanGain+=gain;const st=strata.get(c.repo_url)??[];st.push(gain);strata.set(c.repo_url,st);
 rows.push({pair:c.pair,repo_url:c.repo_url,leads_sha256:sha(readFileSync(join(root,c.pair,'LEADS.json'))),gold_sha256:sha(gb),proposals:treatment.length,treatment_novel_hits:ht.length,churn_novel_hits:hc.length,original,treatment_additive:a,churn_additive:churn,additive_file_f1_gain:gain});
}meanGain/=12;const precision=proposals?hits/proposals:0,repositoryGains=Object.fromEntries([...strata].map(([k,v])=>[k,v.reduce((s,x)=>s+x,0)/v.length])),gate=f.gate;
const checks={all12_source_valid:true,novel_hits:hits>=gate.novel_hits_at_least,hit_gain:hits-controlHits>=gate.hit_gain_vs_equal_width_churn_at_least,precision:precision>=gate.proposal_precision_at_least,mean_additive_file_f1_gain:meanGain>=gate.mean_additive_file_f1_gain_vs_archived_native_control_at_least,no_negative_repository_mean:Object.values(repositoryGains).every(x=>x>=0)};
const out={status:Object.values(checks).every(Boolean)?'source-screen-qualified-for-native-test':'source-screen-rejected',freeze_sha256:sha(fBytes),source_seal_sha256:sha(readFileSync(join(root,'SOURCE-SEAL.json'))),audit_source_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),rows,
 treatment_novel_hits:hits,churn_novel_hits:controlHits,proposals,proposal_precision:precision,mean_additive_file_f1_gain:meanGain,repository_mean_gains:repositoryGains,checks,provider_calls:0,
 claim_ceiling:'Reconstructed source proposals and exposed additive file-set diagnostic only; no new source read delivery, native Span-F1, cost superiority or confirmation.',authority_effect:'none',open_questions_owner:'G02-PREBASE-COCHANGE-SOURCE-R1.json'};
const bytes=JSON.stringify(out,null,2)+'\n';writeFileSync(join(root,'EVALUATOR-AUDIT.json'),bytes,{flag:'wx',mode:0o600});console.log(JSON.stringify({status:out.status,treatment_novel_hits:hits,churn_novel_hits:controlHits,proposals,proposal_precision:precision,mean_additive_file_f1_gain:meanGain,checks,sha256:sha(bytes)}));
