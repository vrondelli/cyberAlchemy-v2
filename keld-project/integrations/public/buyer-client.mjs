const storageKey='keld-sdk-checkout-v1';
export class BuyerError extends Error {
  constructor(code){super(code);this.code=code;}
}
export function parsePrice(value){
  if(!/^\d{1,4}(\.\d{1,2})?$/.test(value))throw new BuyerError('amount-invalid');
  const [whole,fraction='']=value.split('.');const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(cents<5000||cents>100000)throw new BuyerError('amount-invalid');return cents;
}
export function paymentPresentation(result,now=Math.floor(Date.now()/1000)){
 if(!result)return {};
 const deadline=Math.min(result.expiresAt??Infinity,result.paymentExpiresAt??Infinity);
 if(result.checkoutState==='expired'||now>=deadline){const {pixCode,checkoutUrl,...rest}=result;return {...rest,checkoutState:'expired'};}
 return result;
}
export function createBuyerClient({fetch:request=globalThis.fetch,storage=globalThis.sessionStorage,uuid=()=>crypto.randomUUID()}={}){
  function validResult(result,provider){
    const currencyAccepted=provider==='stripe'?result?.currency==='USD':provider==='mercadopago'?result?.currency==='BRL':['USD','BRL'].includes(result?.currency);
    if(result?.mode!=='sandbox'||!/^[a-f0-9]{32}$/.test(result.orderId)||!Number.isSafeInteger(result.amountCents)||result.amountCents<=0||!currencyAccepted||(result.currency==='BRL'&&(!Number.isSafeInteger(result.usdAmountCents)||result.usdAmountCents<=0||typeof result.quoteReference!=='string'||!result.quoteReference)))throw new BuyerError('invalid-checkout-response');
    if(result.recovered===true){if(result.checkoutUrl!==undefined||result.pixCode!==undefined)throw new BuyerError('invalid-checkout-response');return;}
    if(provider==='mercadopago'){if(['preparing','verification-required','expired'].includes(result.checkoutState)&&result.pixCode===undefined&&result.checkoutUrl===undefined)return;if(typeof result.pixCode!=='string'||!result.pixCode||result.pixCode.length>4096)throw new BuyerError('invalid-checkout-response');}
    else {const u=new URL(result.checkoutUrl);const host=provider==='stripe'?'checkout.stripe.com':'www.sandbox.paypal.com';if(u.protocol!=='https:'||u.hostname!==host||u.port||u.username||u.password)throw new BuyerError('invalid-checkout-response');}
  }
  const read=()=>{try{
    const value=JSON.parse(storage.getItem(storageKey)||'null');if(value===null)return null;
    if(!['pending','paid','failed'].includes(value.state)||!['stripe','mercadopago','paypal'].includes(value.input?.provider)||!Number.isSafeInteger(value.input.amountCents)||value.input.amountCents<5000||value.input.amountCents>100000||typeof value.requestKey!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(value.requestKey))throw Error();
    if(value.result)validResult(value.result,value.input.provider);return value;
  }catch{throw new BuyerError('storage-unavailable');}};
  const save=value=>{try{storage.setItem(storageKey,JSON.stringify(value));}catch{throw new BuyerError('storage-unavailable');}};
  async function json(url,options){
    const response=await request(url,{credentials:'same-origin',cache:'no-store',...options});
    const body=await response.json();
    if(!response.ok)throw new BuyerError(response.status===401?'authentication-required':body.error||'request-not-completed');
    return body;
  }
  const session=()=>json('/api/session');
  async function post(url,body){
    const s=await session();
    return request(url,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','x-csrf-token':s.csrf},body:JSON.stringify(body)});
  }
  async function operation(url,body){const r=await post(url,body);const value=await r.json();if(!r.ok)throw new BuyerError(r.status===401?'authentication-required':value.error||'request-not-completed');return value;}
  return {
    pending:read,session,
    async logout(){
      const result=await post('/auth/logout',{});
      if(!result.ok){const body=await result.json();throw new BuyerError(result.status===401?'authentication-required':body.error||'request-not-completed');}
      try{storage.removeItem(storageKey);}catch{throw new BuyerError('signed-out-storage-unavailable');}
    },
    orders:before=>json('/api/orders'+(before?'?before='+encodeURIComponent(before):'')),
    async restore(orderId){
      const current=read();
      const recovered=await operation('/api/restore',{orderId});
      if(current&&current.requestKey!==recovered.requestKey&&!['paid','failed'].includes(current.state))throw new BuyerError('checkout-conflict');
      if(recovered.result)validResult(recovered.result,recovered.input.provider);
      if(!recovered.input||typeof recovered.requestKey!=='string'||!['pending','paid','failed'].includes(recovered.state))throw new BuyerError('invalid-checkout-response');
      save(recovered);return read();
    },
    async create(input){
      if(!['stripe','mercadopago','paypal'].includes(input.provider)||!Number.isSafeInteger(input.amountCents)||input.amountCents<5000||input.amountCents>100000)throw new BuyerError('amount-invalid');
      const normalized={provider:input.provider,amountCents:input.amountCents,...(input.provider==='mercadopago'?{payerEmail:input.payerEmail}: {})};
      let pending=read();
      if(pending){
        if(pending.state==='failed'||pending.state==='paid')throw new BuyerError('start-new-checkout');
        if(JSON.stringify(pending.input)!==JSON.stringify(normalized))throw new BuyerError('checkout-conflict');
      }else pending={input:normalized,requestKey:uuid(),state:'pending'};
      // Persist before dispatch: refreshes and network failures must retain the key.
      save(pending);
      try{
        const result=await operation('/api/checkout',{...pending.input,requestKey:pending.requestKey});
        validResult(result,input.provider);
        pending.result=result;save(pending);return result;
      }catch(error){if(error.code==='payment-creation-failed'){pending.state='failed';save(pending);}throw error;}
    },
    async confirm(){
      const pending=read();if(!pending?.result?.orderId)throw new BuyerError('checkout-unbound');
      const result=await operation('/api/confirm',{orderId:pending.result.orderId});
      if(result.status==='paid'){pending.state='paid';save(pending);}return result;
    },
    async download(){
      const pending=read();if(!pending?.result?.orderId)throw new BuyerError('checkout-unbound');
      const response=await post('/api/download',{orderId:pending.result.orderId});
      if(!response.ok){const body=await response.json();throw new BuyerError(response.status===401?'authentication-required':body.error||'request-not-completed');}
      return response.blob();
    },
    reset(){const pending=read();if(pending&&!['failed','paid'].includes(pending.state))throw new BuyerError('payment-outcome-uncertain');storage.removeItem(storageKey);},
  };
}
