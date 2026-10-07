import {Rejected} from './errors.mjs';

const fail=code=>{throw new Rejected(code);};
const id=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value);
const result=(kind,provider,reason,providerRef)=>({kind,provider,
  ...(reason?{reason}:{}),...(providerRef?{providerRef}:{})});

function amount(value,{zero=false}={}){
  const s=String(value);
  if(typeof value!=='string'&&typeof value!=='number'||typeof value==='number'&&!Number.isFinite(value)||
     !/^\d+(?:\.\d{1,2})?$/.test(s))fail('refund-amount-invalid');
  const [whole,fraction='']=s.split('.');
  const cents=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
  if(cents>BigInt(Number.MAX_SAFE_INTEGER)||!zero&&cents===0n)fail('refund-amount-invalid');
  return Number(cents);
}

// These are observations, never permission to send a refund. Each caller must
// bind the fetched payment to its frozen checkout terms and sandbox merchant.
export function stripeRefundState({payment,charge,refunds,paymentId,amountCents,currency,refundId}){
  if(!Number.isSafeInteger(amountCents)||amountCents<=0||!['USD','BRL'].includes(currency)||
     !id(paymentId)||(refundId!==undefined&&!id(refundId))||
     payment?.id!==paymentId||payment?.livemode!==false||
     charge?.id!==payment?.latest_charge?.id||charge?.payment_intent!==paymentId||
     charge?.livemode!==false||charge?.amount!==amountCents||
     charge?.currency!==currency.toLowerCase()||charge?.status!=='succeeded'||
     charge?.paid!==true||charge?.captured!==true||
     typeof charge?.disputed!=='boolean'||typeof charge?.refunded!=='boolean'||
     !Number.isSafeInteger(charge?.amount_refunded)||charge.amount_refunded<0||
     charge.amount_refunded>amountCents||payment?.status!=='succeeded'||
     payment?.amount_received!==amountCents||payment?.amount!==amountCents||
     payment?.currency!==currency.toLowerCase()||!Array.isArray(refunds?.data)||
     refunds?.object!=='list'||typeof refunds?.has_more!=='boolean'||refunds.data.length>100)
    fail('stripe-refund-proof-invalid');
  if(refunds.has_more)return result('review','stripe','refund-list-incomplete');
  if(refunds.data.length===0){
    if(charge.disputed===true)return result('review','stripe','payment-disputed');
    return charge.amount_refunded===0&&charge.refunded===false
      ? result('unrefunded','stripe') : result('review','stripe','payment-state-unresolved');
  }
  let succeededCents=0;
  const seen=new Set();
  for(const refund of refunds.data){
    if(!id(refund?.id)||refund?.object!=='refund'||refund?.livemode!==false||
       refund?.payment_intent!==paymentId||refund?.charge!==charge.id||
       refund?.currency!==currency.toLowerCase()||!Number.isSafeInteger(refund?.amount)||
       refund.amount<=0||refund.amount>amountCents||seen.has(refund.id))fail('stripe-refund-proof-invalid');
    seen.add(refund.id);
    if(['pending','requires_action'].includes(refund.status))
      return result('review','stripe','refund-pending');
    if(refund.status!=='succeeded')return result('review','stripe','refund-not-full-and-final');
    succeededCents+=refund.amount;
    if(!Number.isSafeInteger(succeededCents)||succeededCents>amountCents)
      fail('stripe-refund-proof-invalid');
  }
  if(succeededCents!==charge.amount_refunded||refundId!==undefined&&!seen.has(refundId))
    return result('review','stripe','refund-not-full-and-final');
  // Stripe lists newest first. For a signed event bind the recorded reversal
  // to that exact refund; the D2 inspector without an event uses the newest.
  const reference=refundId??refunds.data[0].id;
  if(succeededCents===amountCents&&charge.refunded===true)
    return result('full-refund','stripe',null,reference);
  if(charge.disputed===true)return result('review','stripe','payment-disputed');
  if(succeededCents<amountCents&&charge.refunded===false)
    return result('partial-refund','stripe',null,reference);
  return result('review','stripe','refund-not-full-and-final');
}

export function mercadoPagoRefundState({payment,refunds,paymentId,amountCents}){
  if(!Number.isSafeInteger(amountCents)||amountCents<=0||
     !/^[1-9]\d*$/.test(paymentId)||!Number.isSafeInteger(Number(paymentId))||
     String(payment?.id)!==paymentId||payment?.live_mode!==false||
     amount(payment?.transaction_amount)!==amountCents||!Array.isArray(refunds))
    fail('pix-refund-proof-invalid');
  if(refunds.length>100)return result('review','mercadopago','refund-list-unbounded');
  for(const refund of refunds){
    if(!Number.isSafeInteger(refund?.id)||refund.id<=0||
       String(refund?.payment_id)!==paymentId||
       amount(refund?.amount)>amountCents)fail('pix-refund-proof-invalid');
  }
  if(refunds.length===0){
    return payment.status==='approved'&&payment.status_detail==='accredited'&&
      amount(payment.transaction_amount_refunded,{zero:true})===0
      ? result('unrefunded','mercadopago') : result('review','mercadopago','payment-state-unresolved');
  }
  const r=refunds[0];
  if(refunds.length===1&&r.status==='approved'&&
     amount(r.amount)===amount(payment.transaction_amount_refunded,{zero:true})){
    if(amount(r.amount)===amountCents&&payment.status==='refunded')
      return result('full-refund','mercadopago',null,paymentId+':'+r.id);
    if(amount(r.amount)<amountCents&&payment.status==='approved'&&payment.status_detail==='partially_refunded')
      return result('partial-refund','mercadopago',null,paymentId+':'+r.id);
  }
  return result('review','mercadopago','refund-not-full-and-final');
}

// Orders API resources are not Payments-v1 refunds. This observation is never
// authorization to send a provider command; the Orders response contract still
// needs an authenticated sandbox fixture before mutation can be considered.
export function mercadoPagoOrdersRefundState({order,orderId,paymentId,amountCents,
  currency,account,applicationId,externalReference}){
  const ord=value=>typeof value==='string'&&/^ORD[A-Z0-9]{26,29}$/.test(value);
  const pay=value=>typeof value==='string'&&/^PAY[A-Z0-9]{26,29}$/.test(value);
  const ref=value=>typeof value==='string'&&/^REF[A-Z0-9]{26,29}$/.test(value);
  const ps=order?.transactions?.payments;
  const p=Array.isArray(ps)&&ps.length===1?ps[0]:undefined;
  if(!ord(orderId)||!pay(paymentId)||order?.id!==orderId||order?.type!=='online'||
     order?.processing_mode!=='automatic'||String(order?.user_id)!==account||
     String(order?.integration_data?.application_id)!==applicationId||
     (order?.live_mode!==undefined&&order.live_mode!==false)||order?.country_code!=='BRA'||
     order?.external_reference!==externalReference||currency!=='BRL'||
     order?.currency!=='BRL'||!Number.isSafeInteger(amountCents)||amountCents<=0||
     amount(order?.total_amount)!==amountCents||!p||p.id!==paymentId||
     amount(p.amount)!==amountCents||p.payment_method?.id!=='pix'||
     p.payment_method?.type!=='bank_transfer')fail('orders-refund-proof-invalid');
  const refunds=order?.transactions?.refunds;
  const chargebacks=order?.transactions?.chargebacks;
  if(!Array.isArray(refunds)||!Array.isArray(chargebacks))
    return result('review','mercadopago','orders-reversal-list-missing');
  if(refunds.length>100||chargebacks.length>100)
    return result('review','mercadopago','orders-reversal-list-unbounded');
  if(chargebacks.length!==0)return result('review','mercadopago','orders-chargeback-review');
  if(refunds.length===0){
    return order.status==='processed'&&order.status_detail==='accredited'&&
      p.status==='processed'&&p.status_detail==='accredited'&&
      amount(order.total_paid_amount)===amountCents&&amount(p.paid_amount)===amountCents
      ? result('unrefunded','mercadopago')
      : result('review','mercadopago','orders-payment-state-unresolved');
  }
  if(refunds.length!==1)return result('review','mercadopago','orders-refund-count-review');
  const r=refunds[0];
  if(!ref(r?.id)||r.transaction_id!==paymentId||amount(r.amount)>amountCents)
    fail('orders-refund-proof-invalid');
  // The Orders status tables define refunded/refunded on both the order and
  // transaction as full finality. The refund POST example shows a conflicting
  // processed/refunded response, which must remain review-only: a command
  // response is not a qualified final GET. Staging enablement still requires
  // an authenticated post-refund GET sequence proving this exact shape.
  if(r.status==='processed'&&amount(r.amount)===amountCents&&
     order.status==='refunded'&&order.status_detail==='refunded'&&
     amount(order.total_paid_amount)===amountCents&&
     amount(p.paid_amount)===amountCents&&
     p.status==='refunded'&&p.status_detail==='refunded')
    return result('full-refund','mercadopago',null,paymentId+':'+r.id);
  return result('review','mercadopago','orders-refund-not-full-and-final');
}

export function paypalRefundState({capture,captureId,orderId,amountCents,currency}){
  if(!Number.isSafeInteger(amountCents)||amountCents<=0||!['USD','BRL'].includes(currency)||
     !id(captureId)||capture?.id!==captureId||capture?.supplementaryData?.relatedIds?.orderId!==orderId||
     capture?.amount?.currencyCode!==currency||amount(capture?.amount?.value)!==amountCents)
    fail('paypal-refund-proof-invalid');
  // The installed PayPal capture SDK does not expose a refund collection or
  // aggregate refunded amount. COMPLETED cannot prove that a refund was not
  // started concurrently; REFUNDED does not identify the refund resource for
  // the reversal audit. A signed refund ID plus GET refund is required later.
  return result('review','paypal','refund-resource-verification-required');
}

// A known, independently signed refund ID can be inspected through Payments
// v2. This does not enumerate capture refunds or prove an unrefunded capture.
export function paypalRefundCaptureId(refund,refundId){
  if(!id(refundId)||refund?.id!==refundId)fail('paypal-refund-proof-invalid');
  const ups=Array.isArray(refund.links)?refund.links.filter(link=>link?.rel==='up'):[];
  if(ups.length!==1)return null;
  if(ups[0].method!=='GET'||typeof ups[0].href!=='string')
    fail('paypal-refund-proof-invalid');
  const match=/^https:\/\/(?:api-m|api)\.sandbox\.paypal\.com\/v2\/payments\/captures\/([A-Za-z0-9_-]{1,128})$/.exec(ups[0].href);
  if(!match)fail('paypal-refund-proof-invalid');
  return match[1];
}

export function paypalKnownRefundState({refund,refundId,capture,captureId,orderId,
  amountCents,currency,merchantId}){
  if(!id(refundId)||!id(captureId)||!id(orderId)||!id(merchantId)||
     !Number.isSafeInteger(amountCents)||amountCents<=0||
     !['USD','BRL'].includes(currency)||refund?.id!==refundId||
     refund?.amount?.currencyCode!==currency||
     capture?.id!==captureId||capture?.finalCapture!==true||
     capture?.payee?.merchantId!==merchantId||
     capture?.supplementaryData?.relatedIds?.orderId!==orderId||
     capture?.amount?.currencyCode!==currency||
     amount(capture?.amount?.value)!==amountCents||
     (refund?.payer?.merchantId!==undefined&&refund.payer.merchantId!==merchantId))
    fail('paypal-refund-proof-invalid');
  const refunded=amount(refund.amount.value);
  if(refunded>amountCents)fail('paypal-refund-proof-invalid');
  const linkedCapture=paypalRefundCaptureId(refund,refundId);
  if(!linkedCapture)return result('review','paypal','refund-capture-link-unresolved');
  if(linkedCapture!==captureId)fail('paypal-refund-proof-invalid');
  if(refund.status!=='COMPLETED')return result('review','paypal','refund-not-final');
  // A final partial refund can complete the original capture. PayPal's
  // cumulative seller-payable total is optional; absent or different-currency
  // totals are not proof. Never infer a full refund from capture status alone.
  const cumulative=refund?.sellerPayableBreakdown?.totalRefundedAmount;
  if(cumulative!==undefined&&cumulative?.currencyCode!==currency)
    return result('review','paypal','refund-cumulative-mismatch');
  const cumulativeCents=cumulative===undefined?undefined:amount(cumulative.value);
  if(cumulativeCents!==undefined&&(cumulativeCents<refunded||cumulativeCents>amountCents))
    return result('review','paypal','refund-cumulative-mismatch');
  if(refunded===amountCents&&capture.status==='REFUNDED'&&
     (cumulativeCents===undefined||cumulativeCents===amountCents))
    return result('full-refund','paypal',null,refundId);
  if(refunded<amountCents&&capture.status==='REFUNDED'&&
     cumulativeCents===amountCents)
    return result('full-refund','paypal',null,refundId);
  if(refunded<amountCents&&capture.status==='PARTIALLY_REFUNDED'&&
     (cumulativeCents===undefined||cumulativeCents<amountCents))
    return result('partial-refund','paypal',null,refundId);
  return result('review','paypal','capture-refund-state-unresolved');
}
