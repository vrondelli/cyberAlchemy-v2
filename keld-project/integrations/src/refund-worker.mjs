import {Rejected} from './errors.mjs';

/** Local-only D2 candidate. It is deliberately not mounted in maintenance. */
export async function processLateRefunds({repository,adapters,signal,
  clock=()=>Math.floor(Date.now()/1000),allowProviderMutation=false}){
  if(allowProviderMutation!==true)throw new Rejected('refund-mutation-disabled');
  const summary={claimed:0,succeeded:0,review:[],retried:0,failed:[]};
  for(let i=0;i<10&&!signal?.aborted;i++){
    const work=await repository('refund-claim',{now:clock()});
    if(!work)break;
    summary.claimed++;
    const token={orderId:work.orderId,generation:work.generation};
    let markerStarted=work.commandStarted===true,finished=false,outcome='review',reason='refund-proof-review';
    try{
      const adapter=adapters[work.provider];
      if(!adapter||adapter.account!==work.account||
         !['stripe','mercadopago'].includes(work.provider))throw new Rejected('refund-provider-unsupported');
      const order=await repository('get',{customer:work.customer,orderId:work.orderId,now:clock()});
      if(order.status!=='paid-review'||order.remote_id!==work.remoteId||
         clock()<order.expires_at||
         (work.provider==='mercadopago'&&order.terms.providerApi==='orders-v1'))
        throw new Rejected('refund-order-mismatch');
      const paymentId=await adapter.refundPaymentId(order.remote_id,order.terms);
      const inspect=()=>adapter.inspectRefund(order.remote_id,order.terms,paymentId);
      let state=await inspect();
      if(state?.provider!==work.provider)throw new Rejected('refund-provider-mismatch');
      const record=async()=>{
        const result=await repository('refund-record-outcome',{work:token,now:clock(),
          proof:{remoteId:order.remote_id,paymentId,providerRef:state.providerRef}});
        if(result.state!=='succeeded')throw new Rejected('refund-outcome-conflict');
        finished=true;summary.succeeded++;
      };
      if(state.kind==='full-refund'&&state.providerRef){await record();continue;}
      if(state.kind==='unrefunded'&&!markerStarted){
        const command=await repository('refund-command-start',{work:token,
          proof:{remoteId:order.remote_id,paymentId},now:clock()});
        markerStarted=true;
        // Exact frozen amount and stable key are mandatory. A timeout after
        // this point is ambiguous: never automatically send a second POST.
        await adapter.issueFullRefund(paymentId,order.terms,command.idempotencyKey);
        state=await inspect();
        if(state?.provider!==work.provider)throw new Rejected('refund-provider-mismatch');
        if(state.kind==='full-refund'&&state.providerRef){await record();continue;}
      }
      // A durable may-send marker is irreversible. After it exists, even an
      // unrefunded read can only schedule another GET, never another POST.
      if(markerStarted&&(state.kind==='unrefunded'||
          ['refund-pending','payment-state-unresolved','refund-not-full-and-final',
            'refund-list-incomplete'].includes(state.reason))){
        outcome='retry';reason='post-command-recheck';
      }else reason=state.reason??'refund-state-review';
    }catch(error){
      if(!markerStarted&&!(error instanceof Rejected)){
        outcome='retry';reason='preflight-read-unavailable';
      }else if(markerStarted){outcome='retry';reason='post-command-recheck';}
      else reason=error instanceof Rejected&&/^[a-z-]{1,80}$/.test(error.code)
        ?error.code:'refund-proof-review';
    }
    if(finished)continue;
    try{
      const result=await repository('refund-finish',{work:token,outcome,reason,now:clock()});
      if(result.state==='queued')summary.retried++;
      else summary.review.push({orderId:work.orderId,reason:result.reason});
    }catch{summary.failed.push({orderId:work.orderId,reason:'refund-completion-not-recorded'});}
  }
  return summary;
}

/** Exact operator-selected D2 review. Provider reads only; never issues a refund. */
export async function recheckReviewedLateRefund({repository,adapters,orderId,generation,
  operatorRef,clock=()=>Math.floor(Date.now()/1000)}){
  if(!/^[a-f0-9]{32}$/.test(orderId)||!Number.isSafeInteger(generation)||generation<1||
     !/^[a-z0-9][a-z0-9_-]{2,63}$/.test(operatorRef))
    throw new Rejected('refund-review-fields');
  const work=await repository('refund-review-claim',{orderId,generation,operatorRef,now:clock()});
  if(work.commandStarted!==true||work.orderId!==orderId||
     !Number.isSafeInteger(work.generation)||work.generation<=generation)
    throw new Rejected('refund-review-conflict');
  const token={orderId,generation:work.generation};
  const eventResolved=async()=>{
    try{
      const status=await repository('refund-review-status',{work:token});
      return status?.verifiedFullRefund===true;
    }catch{return false;}
  };
  let reason='operator-recheck-proof-review';
  try{
    const adapter=adapters[work.provider];
    if(!adapter||adapter.account!==work.account||
       !['stripe','mercadopago'].includes(work.provider))
      throw new Rejected('refund-provider-unsupported');
    const order=await repository('get',{customer:work.customer,orderId,now:clock()});
    if(order.status!=='paid-review'||order.remote_id!==work.remoteId||
       clock()<order.expires_at||
       (work.provider==='mercadopago'&&order.terms.providerApi==='orders-v1'))
      throw new Rejected('refund-order-mismatch');
    const paymentId=await adapter.refundPaymentId(order.remote_id,order.terms);
    const state=await adapter.inspectRefund(order.remote_id,order.terms,paymentId);
    if(state?.provider!==work.provider)throw new Rejected('refund-provider-mismatch');
    if(state.kind==='full-refund'&&state.providerRef){
      const result=await repository('refund-record-outcome',{work:token,now:clock(),
        proof:{remoteId:order.remote_id,paymentId,providerRef:state.providerRef}});
      if(result.state!=='succeeded')throw new Rejected('refund-outcome-conflict');
      return {outcome:'verified-full-refund',orderId};
    }
    if(state.kind==='partial-refund')reason='operator-recheck-partial';
    else if(state.kind==='unrefunded'||
        ['refund-pending','payment-state-unresolved','refund-not-full-and-final',
          'refund-list-incomplete'].includes(state.reason))
      reason='operator-recheck-inconclusive';
  }catch(error){
    if(await eventResolved())return {outcome:'verified-full-refund',orderId,source:'recorded-full-refund'};
    reason=error instanceof Rejected?'operator-recheck-proof-review':'operator-recheck-unavailable';
  }
  let result;
  try{result=await repository('refund-finish',{work:token,outcome:'review',reason,now:clock()});}
  catch(error){
    if(await eventResolved())return {outcome:'verified-full-refund',orderId,source:'recorded-full-refund'};
    throw error;
  }
  if(result.state!=='review')throw new Rejected('refund-review-conflict');
  return {outcome:'review',orderId,reason};
}
