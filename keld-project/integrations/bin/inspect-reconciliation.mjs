import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createRepository} from '../src/repository.mjs';
const [path,state='all',cursor='0',...extra]=process.argv.slice(2);
if(!path||extra.length||!['all','queued','processing','review','done'].includes(state)||
  !/^\d+$/.test(cursor)||!Number.isSafeInteger(Number(cursor))){
  console.error('Usage: node bin/inspect-reconciliation.mjs <config.json> [all|queued|processing|review|done] [after-cursor]');process.exitCode=1;
}else try{
  const {integration}=await loadConfig(path,{requireCurrentQuote:false,role:'worker'});
  const result=await createRepository(integration.ledger)('reconcile-inspect',{
    state,after:Number(cursor),now:Math.floor(Date.now()/1000),
  });
  console.log(JSON.stringify({ok:true,mode:'sandbox',...result}));
}catch(error){
  console.error(JSON.stringify(error instanceof ConfigurationError?
    {ok:false,error:'configuration-invalid',issues:error.issues}:
    {ok:false,error:'reconciliation-inspection-failed'}));process.exitCode=1;
}
