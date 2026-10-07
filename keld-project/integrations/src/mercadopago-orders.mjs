import {createHash} from 'node:crypto';
import {Rejected, CreationFailed, createAtProvider} from './errors.mjs';
import {mercadoPagoOrdersRefundState} from './refund-state.mjs';

export const ORDERS_API='orders-v1';
// Orders identifiers observed across SDK fixtures and the live sandbox are
// 29–32 characters including the ORD/PAY prefix. Keep the alphabet exact.
const orderId=value=>typeof value==='string'&&/^ORD[A-Z0-9]{26,29}$/.test(value);
const paymentId=value=>typeof value==='string'&&/^PAY[A-Z0-9]{26,29}$/.test(value);
const decimal=n=>`${Math.floor(n/100)}.${String(n%100).padStart(2,'0')}`;
const amount=(value,expected)=>typeof value==='string'&&/^\d+(\.\d{1,2})?$/.test(value)&&Number.isSafeInteger(expected)&&BigInt(value.split('.')[0])*100n+BigInt((value.split('.')[1]??'').padEnd(2,'0'))===BigInt(expected);
// Binds the local order and immutable offer to the provider's supported reference field.
// This is a comparison checksum, not an authentication signature.
export const orderReference=(t,c)=>t.orderId+'_'+createHash('sha256').update(JSON.stringify([
  ORDERS_API,'sandbox',c.account,c.applicationId,t.orderId,t.releaseDigest,t.amountCents,t.currency,t.expiresAt,
])).digest('hex').slice(0,30);
function rejectIssues(issues){if(issues.length){const e=new Rejected('pix-order-invalid');e.issues=issues;throw e;}}
export function validateOrder(o,t,c,{id,paid=false,allowReversals=false}={}){
  const issues=[];const check=(path,ok)=>{if(!ok)issues.push({path,code:'mismatch-or-missing'});};
  check('id',orderId(o?.id)&&(!id||o.id===id));
  check('type',o?.type==='online');check('user_id',String(o?.user_id)===c.account);
  check('integration_data.application_id',String(o?.integration_data?.application_id)===c.applicationId);
  check('live_mode',o?.live_mode===undefined||o.live_mode===false);
  check('country_code',o?.country_code==='BRA');
  check('external_reference',o?.external_reference===orderReference(t,c));
  check('total_amount',amount(o?.total_amount,t.amountCents));
  // Do not infer currency from country, a QR image, or unsigned webhook fields.
  check('currency',t.currency==='BRL'&&o?.currency==='BRL');
  const ps=o?.transactions?.payments;
  const preparing=o?.status==='processing'&&!paid&&(ps===undefined||(Array.isArray(ps)&&ps.length===0));
  check('transactions.payments',preparing||(Array.isArray(ps)&&ps.length===1&&ps[0]!==null&&typeof ps[0]==='object'&&!Array.isArray(ps[0])));
  const p=Array.isArray(ps)&&ps.length===1?ps[0]:undefined;
  if(p){
    check('transactions.payments[0].id',paymentId(p.id));
    check('transactions.payments[0].amount',amount(p.amount,t.amountCents));
    check('transactions.payments[0].payment_method.id',p.payment_method?.id==='pix');
    check('transactions.payments[0].payment_method.type',p.payment_method?.type==='bank_transfer');
  }
  for(const k of ['refunds','chargebacks'])check('transactions.'+k,o?.transactions?.[k]===undefined||
    (Array.isArray(o.transactions[k])&&(allowReversals||o.transactions[k].length===0)));
  if(paid){
    check('status',o?.status==='processed');check('status_detail',o?.status_detail==='accredited');
    check('total_paid_amount',amount(o?.total_paid_amount,t.amountCents));
    check('transactions.payments[0].status',p?.status==='processed');
    check('transactions.payments[0].status_detail',p?.status_detail==='accredited');
    check('transactions.payments[0].paid_amount',amount(p?.paid_amount,t.amountCents));
  }
  rejectIssues(issues);return p;
}
export function bindOrdersAdapter({orders,user},c,{clock=()=>Math.floor(Date.now()/1000)}={}){
  async function account(){
    const u=await user.get();
    rejectIssues([
      ...(String(u?.id)===c.account?[]:[{path:'account.id',code:'mismatch-or-missing'}]),
      ...(u?.site_id==='MLB'&&u?.country_id==='BR'?[]:[{path:'account.country',code:'mismatch-or-missing'}]),
      ...(Array.isArray(u?.tags)&&u.tags.includes('test_user')?[]:[{path:'account.tags',code:'test-account-required'}]),
    ]);
  }
  function response(o,t,id){
    if(!orderId(o?.id)||(id&&o.id!==id))throw new Rejected('provider-id-mismatch');
    let p;
    try {p=validateOrder(o,t,c);if(o.status==='processed')validateOrder(o,t,c,{paid:true});}
    catch(error){if(!(error instanceof Rejected)||!error.issues)throw error;return {remoteId:o.id,checkoutState:'verification-required',verificationIssues:error.issues};}
    if(clock()>=Math.min(t.expiresAt,t.pixExpiresAt??t.expiresAt))return {remoteId:o.id,checkoutState:'expired'};
    if(o.status==='processed'){validateOrder(o,t,c,{paid:true});return {remoteId:o.id,recovered:true};}
    if(!['processing','action_required'].includes(o.status))return {remoteId:o.id,checkoutState:'verification-required',verificationIssues:[{path:'status',code:'not-payable'}]};
    const qr=p?.payment_method?.qr_code;
    if(qr===undefined||qr==='')return {remoteId:o.id,checkoutState:'preparing'};
    if(typeof qr!=='string'||qr.length>4096)return {remoteId:o.id,checkoutState:'verification-required',verificationIssues:[{path:'transactions.payments[0].payment_method.qr_code',code:'invalid'}]};
    return {remoteId:o.id,pixCode:qr,checkoutState:'ready',paymentExpiresAt:Math.min(t.expiresAt,t.pixExpiresAt??t.expiresAt)};
  }
  const get=async id=>{if(!orderId(id))throw new Rejected('provider-id');await account();return orders.get({id});};
  return {
    account:c.account,api:ORDERS_API,
    async terminalUnpaid(id,t){
      const o=await get(id);
      const p=validateOrder(o,t,c,{id});
      const terminal=o.processing_mode==='automatic'&&
        ((o.status==='expired'&&o.status_detail==='expired'&&
          p.status==='expired'&&p.status_detail==='expired')||
         (o.status==='canceled'&&o.status_detail==='canceled'&&
          p.status==='canceled'&&['canceled','canceled_by_api'].includes(p.status_detail)))&&
        amount(o.total_paid_amount,0)&&
        (p.paid_amount==null||amount(p.paid_amount,0));
      return terminal
        ? {kind:'terminal-unpaid',provider:'mercadopago',providerApi:ORDERS_API,remoteId:id}
        : {kind:'unresolved',provider:'mercadopago',providerApi:ORDERS_API,remoteId:id};
    },
    async create(t,key){
      if(t.providerApi!==ORDERS_API||t.pixRequestVersion!==2||t.pixExpirationSeconds!==1800||!Number.isSafeInteger(t.pixExpiresAt)||clock()>=t.pixExpiresAt||t.expiresAt-clock()<1860)throw new CreationFailed(true);
      try {await account();}catch {throw new CreationFailed(true);}
      if(clock()>=t.pixExpiresAt||t.expiresAt-clock()<1860)throw new CreationFailed(true);
      const o=await createAtProvider(()=>orders.create({body:{type:'online',processing_mode:'automatic',total_amount:decimal(t.amountCents),
        external_reference:orderReference(t,c),payer:{email:t.payerEmail,first_name:'APRO'},
        transactions:{payments:[{amount:decimal(t.amountCents),expiration_time:'PT30M',payment_method:{id:'pix',type:'bank_transfer'}}]}},requestOptions:{idempotencyKey:key}}));
      return response(o,t);
    },
    async resume(id,t){const o=await get(id);return response(o,t,id);},
    async verify(id,t){const o=await get(id);validateOrder(o,t,c,{id});if(['processing','action_required','created'].includes(o.status))return null;if(o.status!=='processed')throw new Rejected('pix-order-state-review');return validateOrder(o,t,c,{id,paid:true}).id;},
    async inspectRefund(id,t,paymentId){
      if(t.providerApi!==ORDERS_API||t.currency!=='BRL'||!orderId(id)||
         typeof paymentId!=='string'||!/^PAY[A-Z0-9]{26,29}$/.test(paymentId))
        throw new Rejected('orders-refund-proof-invalid');
      const o=await get(id);
      return mercadoPagoOrdersRefundState({order:o,orderId:id,paymentId,
        amountCents:t.amountCents,currency:t.currency,account:c.account,
        applicationId:c.applicationId,externalReference:orderReference(t,c)});
    },
    async inspectRecordedRefund(id,t){
      // A signed Order notification names the Order, not its Pix payment.
      // Extract one exact payment from a fresh GET; the strict refund-state
      // classifier then binds that payment and any REF to frozen terms.
      if(t.providerApi!==ORDERS_API||t.currency!=='BRL')throw new Rejected('orders-refund-proof-invalid');
      const o=await get(id),p=validateOrder(o,t,c,{id,allowReversals:true});
      if(!p?.id)throw new Rejected('orders-refund-payment-missing');
      return {paymentId:p.id,...mercadoPagoOrdersRefundState({order:o,orderId:id,paymentId:p.id,
        amountCents:t.amountCents,currency:t.currency,account:c.account,
        applicationId:c.applicationId,externalReference:orderReference(t,c)})};
    },
    async localOrderFor(id){
      const o=await get(id);
      if(o?.id!==id||String(o.user_id)!==c.account||String(o.integration_data?.application_id)!==c.applicationId||o.live_mode===true||!/^([a-f0-9]{32})_[a-f0-9]{30}$/.test(o.external_reference))throw new Rejected('pix-order-invalid');
      return o.external_reference.slice(0,32); // Full reference/terms checked before recovery or settlement.
    },
    async discover(t,{begin,end}){
      if(!Number.isSafeInteger(begin)||!Number.isSafeInteger(end)||begin<0||end<begin||end-begin>=365*86400)throw new Rejected('discovery-interval-invalid');
      await account();const ids=[],seen=new Set();let complete=false,total=null,pages=0;
      for(let page=1;page<=5;page++){
        const r=await orders.search({options:{external_reference:orderReference(t,c),type:'online',begin_date:new Date(begin*1000).toISOString(),end_date:new Date(end*1000).toISOString(),page,page_size:20}});
        const count=Number(r?.paging?.total),pageCount=Number(r?.paging?.total_pages);
        if(!/^\d+$/.test(String(r?.paging?.total))||!/^\d+$/.test(String(r?.paging?.total_pages))||!Array.isArray(r?.data)||r.data.length>20||!Number.isSafeInteger(count)||count<0||!Number.isSafeInteger(pageCount)||pageCount<0||(total!==null&&total!==count))throw new Rejected('discovery-response-invalid');
        total=count;pages++;
        for(const o of r.data){if(!orderId(o?.id)||seen.has(o.id)||o.external_reference!==orderReference(t,c))throw new Rejected('discovery-response-invalid');seen.add(o.id);ids.push(o.id);}
        if(page>=pageCount){complete=ids.length===total;break;}
        if(!r.data.length)throw new Rejected('discovery-response-invalid');
      }
      return {ids,total,complete,pages,interval:{begin,end}};
    },
  };
}
