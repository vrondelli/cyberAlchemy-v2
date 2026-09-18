import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createRepository} from '../src/repository.mjs';
import {Rejected} from '../src/errors.mjs';
const [path,provider,eventId,generation,reason,...extra]=process.argv.slice(2);
if(!path||extra.length||!['stripe','mercadopago','paypal'].includes(provider)||!eventId||
  !/^[1-9]\d*$/.test(generation??'')||!Number.isSafeInteger(Number(generation))||
  !['configuration-corrected','binding-restored','provider-recovered'].includes(reason)){
  console.error('Usage: node bin/retry-event.mjs <config.json> <provider> <event-id> <generation> <configuration-corrected|binding-restored|provider-recovered>');process.exitCode=1;
}else try{
  const {integration}=await loadConfig(path,{requireCurrentQuote:false,role:'worker'});
  const event={provider,account:integration.payments[provider].account,environment:'sandbox',event_id:eventId,generation:Number(generation)};
  const result=await createRepository(integration.ledger)('event-requeue',{event,reason,now:Math.floor(Date.now()/1000)});
  console.log(JSON.stringify({ok:true,mode:'sandbox',...result}));
}catch(error){
  console.error(JSON.stringify(error instanceof ConfigurationError?{ok:false,error:'configuration-invalid',issues:error.issues}:
    {ok:false,error:error instanceof Rejected?error.code:'event-retry-failed'}));process.exitCode=1;
}
