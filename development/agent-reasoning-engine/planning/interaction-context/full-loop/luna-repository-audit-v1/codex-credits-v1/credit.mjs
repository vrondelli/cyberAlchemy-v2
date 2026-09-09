export function creditSnapshot(response){
 const r=response.rateLimitsByLimitId?.codex??response.rateLimits;
 const balance=Number(r?.credits?.balance);
 if(r?.credits?.balance==null||!Number.isFinite(balance)||balance<0||r?.credits?.unlimited||r?.spendControlReached===true)throw Error('credit-status-unavailable-or-blocked');
 return {balance,usedPercent:r.primary?.usedPercent??null,hasCredits:r.credits.hasCredits,spendControlReached:r.spendControlReached??null};
}
export function checkCredit(initial,current,estimated,budget){
 const observed=Math.max(0,initial.balance-current.balance),used=Math.max(observed,estimated);
 if(!Number.isFinite(used)||used<0||used+budget.reserve_per_turn_credits>budget.cap_credits||current.balance<budget.reserve_per_turn_credits)throw Error('credit-budget-stop');
 return {observed_balance_drop:observed,conservative_usage:estimated,used,reserved:budget.reserve_per_turn_credits};
}
export function tokenCredits(u){
 if(!u||!Number.isSafeInteger(u.inputTokens)||!Number.isSafeInteger(u.outputTokens)||u.inputTokens<0||u.outputTokens<0)throw Error('token-usage-unavailable');
 // Ignore cache discounts and allow 1.25x input pricing as a conservative reserve.
 return (u.inputTokens*6.25+u.outputTokens*30)/1e6;
}
