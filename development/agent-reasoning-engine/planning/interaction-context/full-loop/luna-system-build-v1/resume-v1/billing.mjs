export function creditSnapshot(response){
 const r=response.rateLimitsByLimitId?.codex??response.rateLimits;
 const balance=Number(r?.credits?.balance),windows=[r?.primary,r?.secondary].filter(Boolean);
 if(r?.credits?.balance==null||!Number.isFinite(balance)||balance<0||r?.spendControlReached===true||!windows.length||windows.some(w=>!Number.isFinite(w.usedPercent)))throw Error('usage status unavailable or blocked');
 return {checked_at:new Date().toISOString(),balance,windows,usedPercent:Math.max(...windows.map(w=>w.usedPercent)),hasCredits:r.credits.hasCredits,spendControlReached:r.spendControlReached??false};
}
export function checkCredit(initial,current,estimated,budget){
 const observed=Math.max(0,initial.balance-current.balance);
 if(!Number.isFinite(estimated)||estimated<0||estimated+budget.reserve_per_turn_credits>budget.cap_credits)throw Error('worker estimate budget stop');
 if(current.usedPercent>=budget.max_allowance_used_percent||current.usedPercent-initial.usedPercent>=budget.max_allowance_increase_percent)throw Error('included allowance stop');
 if(observed>0)throw Error('purchased balance changed; stop for attribution');
 return {worker_estimate_credits:estimated,worker_reserve_credits:budget.reserve_per_turn_credits,account_balance_drop:observed,included_allowance_used_percent:current.usedPercent,account_scope:'shared; not worker attribution'};
}
export function tokenCredits(u){
 if(!u||!Number.isSafeInteger(u.inputTokens)||!Number.isSafeInteger(u.outputTokens)||u.inputTokens<0||u.outputTokens<0)throw Error('token usage unavailable');
 return (u.inputTokens*6.25+u.outputTokens*30)/1e6;
}
