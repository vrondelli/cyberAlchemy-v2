import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createPaymentAdapters} from '../src/payments.mjs';
import {createRepository} from '../src/repository.mjs';
import {recoverPayment} from '../src/recover-payment.mjs';
import {Rejected} from '../src/errors.mjs';
const [path,orderId,remoteId,...extra]=process.argv.slice(2);
if(!path||!orderId||!remoteId||extra.length){
  console.error('Usage: node bin/recover-payment.mjs <config.json> <local-order-id> <provider-order-or-payment-id>');process.exitCode=1;
}else try{
  const {integration}=await loadConfig(path,{requireCurrentQuote:false,role:'worker'});
  const result=await recoverPayment({repository:createRepository(integration.ledger),adapters:createPaymentAdapters(integration.payments),orderId,remoteId});
  console.log(JSON.stringify({ok:result.status==='paid',mode:'sandbox',...result}));if(result.status!=='paid')process.exitCode=1;
}catch(error){
  console.error(JSON.stringify(error instanceof ConfigurationError?{ok:false,error:'configuration-invalid',issues:error.issues}:{ok:false,error:error instanceof Rejected?error.code:'payment-recovery-failed'}));process.exitCode=1;
}
