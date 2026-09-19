import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const release=process.argv[2];
if(!release?.startsWith('/srv/auth-foundation-candidate/releases/'))throw Error('Candidate release path required');
process.chdir(release);
const c=JSON.parse(await readFile('.runtime/config.json','utf8'));
if(c.profile!=='candidate'||c.origin!=='https://localhost:23443')throw Error('Unapproved load target');
const {serviceToken}=await import(pathToFileURL(release+'/src/identity.mjs'));
const {access_token}=await serviceToken(c);
const before=await (await fetch(c.origin+'/health')).json();
const latencies=[];const correlations=new Set();let passed=0;
for(let i=0;i<25;i++){
 const started=performance.now();
 const response=await fetch(c.origin+'/api/document',{headers:{Authorization:`Bearer ${access_token}`}});
 const elapsed=performance.now()-started;latencies.push(elapsed);
 const correlation=response.headers.get('x-auth-correlation-id');
 const body=await response.json();
 if(response.status!==200||body.decision!=='ALLOW'||body.principal_kind!=='service'||!correlation)throw Error('Load fixture failed');
 if(correlations.has(correlation))throw Error('Duplicate correlation identifier');
 correlations.add(correlation);passed++;
 await new Promise(resolve=>setTimeout(resolve,Math.max(0,200-elapsed)));
}
const after=await (await fetch(c.origin+'/health')).json();
latencies.sort((a,b)=>a-b);
const percentile=p=>latencies[Math.min(latencies.length-1,Math.ceil(latencies.length*p)-1)];
console.log(JSON.stringify({
 profile:c.profile,offered_requests:25,passed,failed:25-passed,unique_correlations:correlations.size,
 target_rate_rps:5,duration_class:'five-second-preliminary-smoke',
 latency_ms:{p50:percentile(.50),p95:percentile(.95),p99:percentile(.99),max:latencies.at(-1)},
 telemetry_before:before.operational_evidence,telemetry_after:after.operational_evidence,
 claim_ceiling:'Preliminary 25-request smoke at 5 rps; does not satisfy the ten-minute step, burst, capacity, or soak denominator.'
},null,2));
