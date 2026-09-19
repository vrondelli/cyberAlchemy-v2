import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createPaymentAdapters} from '../src/payments.mjs';
import {createRepository} from '../src/repository.mjs';
import {runMaintenance} from '../src/maintenance.mjs';
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
      onCycle:report=>{
        const ok=!report.stopping&&report.errors.length===0&&report.events?.failed.length===0&&
          report.events?.retried===0&&report.events?.review.length===0&&report.reconciliation?.failed.length===0&&
          report.reconciliation?.review===0&&report.queue?.counts.review===0&&report.queue?.remaining>0;
        console.log(JSON.stringify({ok,mode:'sandbox',...report}));
        if(mode==='once'&&!ok)process.exitCode=1;
      }});
  }catch(error){
    console.error(JSON.stringify(error instanceof ConfigurationError?{ok:false,error:'configuration-invalid',issues:error.issues}:{ok:false,error:'maintenance-failed'}));process.exitCode=1;
  }finally{process.off('SIGINT',shutdown);process.off('SIGTERM',shutdown);}
}
