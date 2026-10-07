import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createRepository} from '../src/repository.mjs';
import {createPaymentAdapters} from '../src/payments.mjs';
import {recheckReviewedLateRefund} from '../src/refund-worker.mjs';

export class UsageError extends Error {}

/** Privileged, explicit sandbox operator action. Never sends a provider POST. */
export async function recheckRefund(argv,{load=loadConfig,repositoryFactory=createRepository,
  adapterFactory=createPaymentAdapters,clock=()=>Math.floor(Date.now()/1000)}={}){
  const [path,orderId,rawGeneration,operatorRef,ack,...extra]=argv;
  if(!path||extra.length||!/^[a-f0-9]{32}$/.test(orderId??'')||
     !/^[1-9]\d*$/.test(rawGeneration??'')||
     !Number.isSafeInteger(Number(rawGeneration))||
     !/^[a-z0-9][a-z0-9_-]{2,63}$/.test(operatorRef??'')||
     ack!=='--apply-verified-full-refund')throw new UsageError('invalid-arguments');
  const generation=Number(rawGeneration);
  const {integration}=await load(path,{requireCurrentQuote:false,role:'worker'});
  const repository=repositoryFactory(integration.ledger);
  // This operation opens SQLite read-only and rejects a legacy schema before
  // the ordinary repository path can initialize or migrate the ledger.
  const preflight=await repository('refund-review-preflight',{orderId,generation,now:clock()});
  if(preflight?.eligible!==true)throw new Error('refund-review-conflict');
  const result=await recheckReviewedLateRefund({repository,
    adapters:adapterFactory(integration.payments),orderId,generation,operatorRef,clock});
  return {ok:true,mode:'sandbox',...result};
}

export function recheckError(error){
  return error instanceof ConfigurationError?
    {ok:false,error:'configuration-invalid',issues:error.issues}:
    {ok:false,error:'refund-recheck-failed'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log(JSON.stringify(await recheckRefund(process.argv.slice(2))));}
  catch(error){
    if(error instanceof UsageError)
      console.error('Usage: node bin/recheck-refund.mjs <config.json> <order-id> <generation> <operator-ref> --apply-verified-full-refund');
    else console.error(JSON.stringify(recheckError(error)));
    process.exitCode=1;
  }
}
