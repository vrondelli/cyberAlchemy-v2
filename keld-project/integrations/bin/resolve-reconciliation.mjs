import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createRepository} from '../src/repository.mjs';
import {Rejected} from '../src/errors.mjs';
const [path,orderId,generation,reason,...extra]=process.argv.slice(2);
const reasons=['stripe-expired-unpaid','mercadopago-canceled-expired','paypal-missing-unpaid'];
if(!path||extra.length||!orderId||!/^[1-9]\d*$/.test(generation??'')||
  !Number.isSafeInteger(Number(generation))||!reasons.includes(reason)){
  console.error('Usage: node bin/resolve-reconciliation.mjs <config.json> <order-id> <generation> <stripe-expired-unpaid|mercadopago-canceled-expired|paypal-missing-unpaid>');process.exitCode=1;
}else try{
  const {integration}=await loadConfig(path,{requireCurrentQuote:false,role:'worker'});
  const result=await createRepository(integration.ledger)('reconcile-resolve',{
    work:{orderId,generation:Number(generation)},reason,now:Math.floor(Date.now()/1000),
  });
  console.log(JSON.stringify({ok:true,mode:'sandbox',...result}));
}catch(error){
  console.error(JSON.stringify(error instanceof ConfigurationError?
    {ok:false,error:'configuration-invalid',issues:error.issues}:
    {ok:false,error:error instanceof Rejected?error.code:'reconciliation-resolution-failed'}));process.exitCode=1;
}
