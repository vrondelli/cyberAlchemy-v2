import {createBuyerClient,parsePrice,paymentPresentation} from './buyer-client.mjs';
const client=createBuyerClient();const $=id=>document.getElementById(id);let busy=false,nextPage=null;
const messages={
 'authentication-required':'Sign in again to continue. Your checkout is saved in this tab.',
 'amount-invalid':'Choose USD 50–1,000, with at most two decimal places.',
 'payment-creation-failed':'This payment could not be created. You can start a new checkout and choose another method.',
 'payment-outcome-uncertain':'The payment outcome is not known yet. Retry this checkout; do not start another payment.',
 'checkout-in-progress':'Your checkout is being prepared. Wait a moment, then retry.',
 'checkout-conflict':'A checkout is already saved. Continue with its original amount and payment method.',
 'signed-out-storage-unavailable':'You are signed out, but this tab could not clear its saved checkout. Close the tab to remove it.',
 'storage-unavailable':'This tab needs session storage to preserve payment retries. Enable it before continuing.',
 'checkout-not-pending':'This checkout is no longer open. Its payment needs reconciliation before another attempt.',
 'not-owned':'This checkout is unavailable for the signed-in account. Sign in with the original buyer account.',
};
function status(text){$('status').textContent=text;}
function render(){
 const p=client.pending();$('logout').disabled=busy;$('history').disabled=busy;$('older').disabled=busy;$('fields').disabled=!!p||busy;
 if(p){$('amount').value=(p.input.amountCents/100).toFixed(2);$('provider').value=p.input.provider;$('email').value=p.input.payerEmail||'';}
 $('email-field').hidden=$('provider').value!=='mercadopago';$('email').required=!$('email-field').hidden;
 $('create').disabled=busy||p?.state==='failed'||p?.state==='paid';$('create').textContent=p?'Resume this checkout':'Continue to sandbox payment';
 $('restart').hidden=!p||!['failed','paid'].includes(p.state);$('restart').disabled=busy;
 $('payment').hidden=!p?.result;$('confirm').disabled=busy;$('download').disabled=busy;
 if(p?.result){const r=paymentPresentation(p.result);$('quote').textContent=`${new Intl.NumberFormat('en-US',{style:'currency',currency:r.currency}).format(r.amountCents/100)} · ${r.currency==='BRL'?'Frozen Pix quote':'Sandbox payment'}`;
  $('provider-link').hidden=!r.checkoutUrl||p.state==='paid';if(r.checkoutUrl)$('provider-link').href=r.checkoutUrl;
  $('pix').hidden=$('pix-label').hidden=!r.pixCode||p.state==='paid';$('pix').value=p.state==='paid'?'':r.pixCode||'';
  if(r.checkoutState==='expired')$('quote').textContent+=' · Payment window ended. Check payment status before starting again.';
 }
 $('download').hidden=p?.state!=='paid';
}
async function run(work,{renderBefore=true}={}){if(busy)return;busy=true;let failure;try{if(renderBefore)render();await work();}catch(e){failure=e.code;status(messages[e.code]||'The request could not finish. Your saved checkout remains available to retry.');if(['authentication-required','signed-out-storage-unavailable'].includes(e.code)){$('login').hidden=false;$('logout').hidden=true;}}finally{busy=false;try{render();}catch{status(messages[failure==='signed-out-storage-unavailable'?failure:'storage-unavailable']);$('create').disabled=true;$('logout').disabled=false;}}}
$('logout').addEventListener('click',()=>run(async()=>{await client.logout();location.assign('/signed-out');},{renderBefore:false}));
$('provider').addEventListener('change',render);
$('purchase').addEventListener('submit',e=>{e.preventDefault();run(async()=>{status('Preparing your sandbox payment…');const input={provider:$('provider').value,amountCents:parsePrice($('amount').value),payerEmail:$('email').value};let result=await client.create(input);for(const delay of [1000,2000,4000]){if(result.checkoutState!=='preparing'||Date.now()>=result.expiresAt*1000)break;status('Your Pix code is being prepared…');await new Promise(resolve=>setTimeout(resolve,delay));result=await client.create(input);}status(result.checkoutState==='verification-required'?'Your order is saved while payment details are verified. Resume this checkout later.':result.checkoutState==='expired'?'The payment window ended. Check payment status before starting again.':result.checkoutState==='preparing'?'Pix is still being prepared. Resume this checkout in a moment.':result.recovered?'Existing payment located. Check payment status.':result.pixCode?'Use the Pix code, then check payment status.':'Your payment is ready. Open the provider to continue.');});});
$('confirm').addEventListener('click',()=>run(async()=>{const result=await client.confirm();status(result.status==='paid'?'Payment verified. Your test file is ready.':result.status==='paid-review'?'Payment received after the reservation ended. Review is required before download.':'Payment has not been confirmed yet.');}));
$('download').addEventListener('click',()=>run(async()=>{const blob=await client.download();const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='are-sandbox-fixture.bin';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status('Your verified test download is ready.');}));
$('restart').addEventListener('click',()=>run(async()=>{client.reset();status('Choose your payment method for a new checkout.');}));
run(async()=>{await client.session();$('login').hidden=true;$('logout').hidden=false;status(location.pathname==='/purchase/cancel'?'You returned without completing approval. Check the saved payment before retrying.':location.pathname==='/purchase/return'?'Welcome back. Check payment status to verify the result.':'Signed in. Choose your sandbox payment method.');},{renderBefore:false});

async function loadHistory(before){
  const {orders,next}=await client.orders(before);if(!before)$('orders').replaceChildren();
  nextPage=next;$('older').hidden=!next;
  for(const order of orders){
    const row=document.createElement('p'),button=document.createElement('button');button.type='button';
    button.textContent=`Restore ${order.provider} · ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(order.amountCents/100)} · ${order.status} · ${new Date(order.createdAt*1000).toLocaleDateString()}`;
    button.addEventListener('click',()=>run(async()=>{const restored=await client.restore(order.orderId);status(restored.ledgerStatus==='expired'||restored.ledgerStatus==='paid-review'?'Checkout restored. Payment review may be required; restoring does not change its status.':'Checkout restored from your account. Continue with its saved details.');}));
    row.append(button);$('orders').append(row);
  }
  status(orders.length?'Choose a checkout to restore.'+(next?' Older checkouts are available below.':' You have reached the end of this history.'):'No previous checkouts were found for this account.');
}
$('history').addEventListener('click',()=>run(()=>loadHistory()));
$('older').addEventListener('click',()=>run(()=>loadHistory(nextPage)));

function refreshPaymentDisplay(){if(busy)return;try{if(client.pending()?.result)render();}catch{status(messages['storage-unavailable']);$('pix').value='';$('pix').hidden=$('pix-label').hidden=$('provider-link').hidden=true;}}
setInterval(refreshPaymentDisplay,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPaymentDisplay();});
