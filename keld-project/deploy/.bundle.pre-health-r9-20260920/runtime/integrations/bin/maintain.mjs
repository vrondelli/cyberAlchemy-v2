import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createPaymentAdapters} from '../src/payments.mjs';
import {createRepository} from '../src/repository.mjs';
import {runMaintenance} from '../src/maintenance.mjs';
import {rename,writeFile} from 'node:fs/promises';
const [path,mode='once',interval='60',...extra]=process.argv.slice(2);
if(!path||extra.length||!['once','watch'].includes(mode)||!/^\d+$/.test(interval)||Number(interval)<30||Number(interval)>3600){
  console.error('Usage: node bin/maintain.mjs <config.json> [once|watch] [interval-seconds:30..3600]');process.exitCode=1;
}else{
  const stop=new AbortController();const shutdown=()=>stop.abort();
  process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
  try{
    const {integration}=await loadConfig(path,{requireCurrentQuote:false,role:'worker'});
    await runMaintenance({repository:createRepository(integration.ledger),adapters:createPaymentAdapters(integration.payments),
      watch:mode==='watch',intervalSeconds:Number(interval),signal:stop.signal,
      onCycle:async report=>{
        const completionFailures=report.reconciliation?.failed.filter(x=>x.code==='reconciliation-completion-not-recorded').length??0;
        const healthy=!report.stopping&&report.errors.length===0&&report.events?.failed.length===0&&completionFailures===0&&
          report.queue!==null&&report.reconciliationQueue!==null;
        const degraded=(report.events?.retried??0)>0||(report.events?.review.length??0)>0||
          (report.reconciliation?.retried??0)>0||(report.reconciliation?.review??0)>0||
          (report.queue?.counts.review??0)>0||(report.reconciliationQueue?.counts.review??0)>0;
        if(mode==='watch'){
          const healthPath=process.env.KELD_WORKER_HEALTH_FILE??'/scratch/worker-health.json';
          const temporary=healthPath+'.tmp';
          const heartbeat={schema:'keld-worker-health/v1',observedAt:Math.floor(Date.now()/1000),cycle:report.cycle,healthy,degraded,
            eventQueue:report.queue&&{counts:report.queue.counts,due:report.queue.due,deferred:report.queue.deferred},
            reconciliationQueue:report.reconciliationQueue&&{counts:report.reconciliationQueue.counts,due:report.reconciliationQueue.due,deferred:report.reconciliationQueue.deferred}};
          await writeFile(temporary,JSON.stringify(heartbeat)+'\n',{mode:0o600});
          await rename(temporary,healthPath);
        }
        console.log(JSON.stringify({ok:healthy,degraded,mode:'sandbox',...report}));
        if(mode==='once'&&!healthy)process.exitCode=1;
      }});
  }catch(error){
    console.error(JSON.stringify(error instanceof ConfigurationError?{ok:false,error:'configuration-invalid',issues:error.issues}:{ok:false,error:'maintenance-failed'}));process.exitCode=1;
  }finally{process.off('SIGINT',shutdown);process.off('SIGTERM',shutdown);}
}
