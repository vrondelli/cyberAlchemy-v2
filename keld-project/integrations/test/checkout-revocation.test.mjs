import test from 'node:test';
import assert from 'node:assert/strict';
import {createCheckoutService} from '../src/checkout.mjs';

const orderId='a'.repeat(32);
const origin='https://staging.keld.studio';

function fixture(accessRevoked,overrides={}){
  const row={id:orderId,customer:'owner',provider:'stripe',account:'acct_fixture',
    amount:20000,created_at:100,expires_at:1000,status:'paid',
    request_key:'original-key',remote_id:'cs_fixture',access_revoked:accessRevoked,
    response:{remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/fixture'},
    terms:{amountCents:20000,currency:'USD',payerEmail:null,reference:null},...overrides};
  let providerReads=0;
  const service=createCheckoutService({origin,clock:()=>200,
    auth:{identity:async()=>({customer:'owner'})},
    repository:async operation=>{
      if(operation==='get')return row;
      if(operation==='list')return {orders:[row],next:null};
      throw new Error(`unexpected repository operation ${operation}`);
    },
    adapters:{stripe:{account:'acct_fixture',verify:async()=>{providerReads++;throw new Error('revoked order must not reverify');}}}});
  return {service,providerReads:()=>providerReads};
}

test('verified revocation overrides paid history and strips actionable provider instructions',async()=>{
  const {service,providerReads}=fixture(1);
  const restored=await service.restore({},orderId);
  assert.equal(restored.state,'revoked');
  assert.equal(restored.ledgerStatus,'revoked');
  assert.equal(restored.result.recovered,true);
  assert.equal(restored.result.checkoutUrl,undefined);
  assert.equal((await service.list({})).orders[0].status,'revoked');
  assert.deepEqual(await service.confirm({},orderId),{orderId,status:'revoked'});
  assert.equal(providerReads(),0);
});

test('paid order without access revocation retains paid history presentation',async()=>{
  const {service}=fixture(0);
  assert.equal((await service.restore({},orderId)).state,'paid');
  assert.equal((await service.list({})).orders[0].status,'paid');
});

test('buyer late-refund projection is narrow, conservative and identical in owned history and restore',async()=>{
  const cases=[
    [{status:'paid-review',late_refund_state:'queued'},'recorded',undefined],
    [{status:'paid-review',late_refund_state:'processing',late_refund_lease_until:260},'checking',undefined],
    [{status:'paid-review',late_refund_state:'processing',late_refund_lease_until:199},'review-required',undefined],
    [{status:'paid-review',late_refund_state:'review'},'review-required',undefined],
    [{status:'paid-review',late_refund_state:'succeeded'},'review-required',undefined],
    [{status:'paid-review'},undefined,undefined],
    [{status:'paid-review',late_refund_state:'succeeded',access_revoked:1,
      full_refund_recorded:1,revocation_reason:'full-refund'},'verified-full-refund','full-refund'],
    [{status:'paid-review',late_refund_state:'review',access_revoked:1,
      full_refund_recorded:1,revocation_reason:'lost-dispute'},undefined,'lost-dispute'],
    [{status:'paid-review',late_refund_state:'review',access_revoked:1,
      full_refund_recorded:1,lost_dispute_recorded:1,revocation_reason:'full-refund'},undefined,'lost-dispute'],
    [{status:'paid',late_refund_state:'queued'},undefined,undefined],
  ];
  for(const [row,late,reason] of cases){
    const {service}=fixture(0,row);
    const restored=await service.restore({},orderId);
    const history=(await service.list({})).orders[0];
    assert.equal(restored.lateRefundStatus,late);
    assert.equal(history.lateRefundStatus,late);
    assert.equal(restored.revocationReason,reason);
    assert.equal(history.revocationReason,reason);
    for(const buyerView of [restored,history]){
      for(const internal of ['late_refund_state','late_refund_lease_until','full_refund_recorded','lost_dispute_recorded','revocation_reason','payment_id','last_reason'])
        assert.equal(Object.hasOwn(buyerView,internal),false);
    }
  }
});
