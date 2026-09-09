import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assess} from '../latency-comparison-011/host.mjs';
import {extractMetrics} from '../native-test/campaign/collect.mjs';
import {sha} from '../latency-comparison-012/campaign.mjs';
export function population(attempts,budgets){
  if(!Array.isArray(attempts)||attempts.length>60)throw Error('attempt-limit');
  const qualified=[],rejected=[],errors=[],seen=new Set(),identities=new Set();
  for(const [index,a] of attempts.entries()){
    if(!a.id||seen.has(a.id))throw Error('duplicate-attempt');seen.add(a.id);
    if(qualified.length>=40)throw Error('attempt-after-population');
    const h=assess(a.host?.observations,a.host?.startMs,a.host?.endMs,a.host?.errors??[]);
    if(!h.qualified)rejected.push({id:a.id,reasons:h.reasons});
    if(a.failed){errors.push('functional-failure:'+a.id);if(index!==attempts.length-1)errors.push('successor-after-failure');break;}
    if(!h.qualified)continue;
    if(typeof a.identity_sha256!=='string'||!/^[a-f0-9]{64}$/.test(a.identity_sha256))errors.push('missing-identity:'+a.id);
    identities.add(a.identity_sha256);qualified.push(a);
  }
  if(identities.size>1)errors.push('mixed-candidate-or-host');
  const metrics=Object.entries(budgets).map(([name,b])=>{
    const values=qualified.map(a=>{
      const v=a.metrics?.[name];
      if(!Array.isArray(v)||v.length<b.minimum_samples||!v.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)){errors.push('metric-invalid:'+a.id+':'+name);return null;}
      return Math.max(...v);
    });
    const complete=qualified.length===40&&values.every(v=>v!==null);
    const p95=complete?[...values].sort((a,b)=>a-b)[37]:null;
    return {name,qualified_sessions:qualified.length,session_maxima_ms:values,p95_ms:p95,budget_ms:b.p95_ms,status:!complete?'not_evaluable':p95<=b.p95_ms?'PASS':'FAIL'};
  });
  return {status:errors.length?'INVALID':qualified.length<40?'INCOMPLETE':metrics.some(m=>m.status==='FAIL')?'FAIL':'PASS',errors,rejected,qualified_count:qualified.length,metrics,authority_effect:'none'};
}
export function readAttempt(dir){
  const artifacts={},json=f=>{const b=readFileSync(join(dir,f));artifacts[f]=sha(b);return JSON.parse(b);};
  const result=json('result.json'),host=json('host.json');
  if(result.status==='host-rejected-prelaunch')return {id:resolve(dir),host,failed:false,artifacts};
  const identity=json('identity.json');
  const stdout=readFileSync(join(dir,'stdout.log'));artifacts['stdout.log']=sha(stdout);
  let metrics={},parseError=null;try{metrics=extractMetrics(stdout.toString());}catch(e){parseError=e.message;}
  return {id:resolve(dir),host,identity_sha256:sha(JSON.stringify({identity,host:host.host_sha256})),metrics,artifacts,
    failed:result.result?.exitCode!==0||!!result.result?.timedOut||!!result.result?.interrupted||!!parseError};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const list=JSON.parse(readFileSync(process.argv[2]));
  const budget=readFileSync(new URL('../../../runtime/performance-budgets.candidate.json',import.meta.url));
  const binding=JSON.parse(readFileSync(new URL('./budget-binding.json',import.meta.url)));
  if(sha(budget)!==binding.sha256)throw Error('budget-drift');
  const result=population(list.map(readAttempt),JSON.parse(budget).budgets);
  console.log(JSON.stringify({...result,budget_sha256:sha(budget)},null,2));
  if(result.status!=='PASS')process.exitCode=1;
}
