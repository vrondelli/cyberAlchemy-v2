// Observe local request lifecycles without changing provider wire bytes or receipts.
// These intervals include credential callbacks and transport, not backend execution.
// Open questions: README.md.
export function observeModelReceiptTimings(receipts,{record,now=Date.now}={}){
  if(!Array.isArray(receipts)||typeof record!=='function')throw Error('invalid timing observer');
  const previous=Object.getOwnPropertyDescriptor(receipts,'push'),original=receipts.push;
  const push=function(...items){
    const length=Reflect.apply(original,this,items);
    for(const receipt of items){
      if(receipt?.kind!=='model'||receipt.dispatched!==true)continue;
      const end_ms=now(),latency_ms=receipt.latency_ms;
      if(!Number.isSafeInteger(end_ms)||!Number.isFinite(latency_ms)||latency_ms<0)throw Error('invalid model timing receipt');
      record({kind:'local-model-request-interval',request_sha256:receipt.request_sha256??null,start_ms:end_ms-latency_ms,end_ms,latency_ms,status:receipt.status??null,
        scope:'local credential callback and transport lifecycle; not backend execution'});
    }
    return length;
  };
  Object.defineProperty(receipts,'push',{value:push,writable:true,configurable:true});
  return ()=>{if(receipts.push!==push)throw Error('timing observer changed');if(previous)Object.defineProperty(receipts,'push',previous);else delete receipts.push;};
}
