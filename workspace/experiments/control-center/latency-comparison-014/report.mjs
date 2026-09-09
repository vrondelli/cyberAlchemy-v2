import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {readCampaign,sha} from '../latency-comparison-012/campaign.mjs';
import {importArm,verifyArtifacts} from '../latency-comparison-013/import.mjs';
const here=fileURLToPath(new URL('./',import.meta.url));
const repo=fileURLToPath(new URL('../../../../../',import.meta.url));
export function metricCoverage(budgets,view,valid){
  return Object.entries(budgets).map(([name,b])=>{
    if(!Number.isFinite(b.p95_ms)||b.p95_ms<0||!Number.isInteger(b.minimum_samples)||b.minimum_samples<1)throw Error('invalid-budget:'+name);
    const captured=name==='workspace.tauri.chat-cold-ipc-handshake';
    const evaluable=valid&&captured&&b.minimum_samples===1&&view.status==='POPULATION_COMPLETE';
    return {name,budget_ms:b.p95_ms,minimum_samples:b.minimum_samples,
      status:evaluable?(['baseline','uninstrumented'].every(a=>typeof view.p95_ms?.[a]==='number'&&Number.isFinite(view.p95_ms[a])&&view.p95_ms[a]<=b.p95_ms)?'PASS':'FAIL'):'not_evaluable',
      reason:evaluable?null:!captured?'metric-not-captured':!valid?'invalid-source-evidence':'fixed-population-incomplete'};
  });
}
export function report(dir){
  const checks=[],add=(id,fn)=>{try{fn();checks.push({id,status:'PASS'});}catch(e){checks.push({id,status:'FAIL',reason:e.message});}};
  const binding=JSON.parse(readFileSync(here+'budget-binding.json'));
  const budgetBytes=readFileSync(repo+binding.path);
  add('budget-binding',()=>{if(sha(budgetBytes)!==binding.sha256)throw Error('budget-drift');});
  let state;
  add('ledger',()=>{state=readCampaign(dir);});
  const hosts=new Set();
  if(state){
    add('harness-binding',()=>{
      const bytes=readFileSync(new URL('../latency-comparison-013/bindings.json',import.meta.url));
      if(sha(bytes)!==state.identity.harness_sha256)throw Error('harness-drift');
      for(const b of JSON.parse(bytes))if(sha(readFileSync(repo+b.path))!==b.sha256)throw Error('source-drift:'+b.path);
    });
    const paths=new Set();
    for(const event of state.events)if(event.type==='settle')for(const r of event.results){
      if(r.status==='not-run')continue;
      add('raw-import:'+r.run_id,()=>{
        if(paths.has(r.run_id))throw Error('duplicate-raw-run');paths.add(r.run_id);
        verifyArtifacts([r]);
        const expected={...state.identity,...state.identity.arms[r.arm],arm:r.arm,pair:event.pair,
          binary_path:repo+'cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-'+(r.arm==='baseline'?'003':'008')+'/native/'+r.arm+'/essays-desktop'};
        const imported=importArm(r.run_id,expected);
        if(JSON.stringify(imported)!==JSON.stringify(r))throw Error('normalized-raw-mismatch');
        if(r.status==='completed')hosts.add(r.host.host_sha256);
      });
    }
    add('host-comparability',()=>{if(hosts.size!==1)throw Error('missing-or-mixed-host-identity');});
  }
  const valid=checks.every(c=>c.status==='PASS');
  const view=state?.view??{status:'INVALID'};
  const metrics=metricCoverage(JSON.parse(budgetBytes).budgets,view,valid);
  return {schema_version:'workspace.verified-differential-report/v1',
    campaign:resolve(dir),identity:state?.identity??null,budget_sha256:sha(budgetBytes),
    ledger_sha256:state?sha(readFileSync(join(dir,'events.jsonl'))):null,
    checks,metrics,population_status:view.status,qualified_counts:view.qualified_counts??null,
    differential:valid&&view.status==='POPULATION_COMPLETE'?{status:view.threshold_check,p95_ms:view.p95_ms,delta_ms:view.overhead_delta_ms}:{status:'not_evaluable'},
    product_candidate_ready:false,
    blockers:['Required non-handshake metrics are not captured by this campaign','Exact frozen-product Rust/frontend/build/unified-smoke evidence remains required',...(view.status!=='POPULATION_COMPLETE'?['Qualified populations incomplete']:[])],
    authority_effect:'none'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==3)throw Error('usage: report.mjs CAMPAIGN_DIRECTORY');
  const result=report(process.argv[2]);console.log(JSON.stringify(result,null,2));
  if(result.checks.some(c=>c.status==='FAIL'))process.exitCode=1;
}
