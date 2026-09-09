import test from 'node:test';
import assert from 'node:assert/strict';
import {creditSnapshot,checkCredit,tokenCredits} from './credit.mjs';
const budget={cap_credits:50,reserve_per_turn_credits:10};
test('credit status fails closed and selects the actual Codex bucket',()=>{
 const s=creditSnapshot({rateLimitsByLimitId:{codex:{credits:{balance:'500',hasCredits:true,unlimited:false},primary:{usedPercent:96},spendControlReached:false}}});assert.equal(s.balance,500);
 for(const credits of [null,{balance:null},{balance:'n/a'},{balance:'500',unlimited:true}])assert.throws(()=>creditSnapshot({rateLimits:{credits}}));
 assert.throws(()=>creditSnapshot({rateLimits:{credits:{balance:'500'},spendControlReached:true}}));
});
test('reserve uses larger of token estimate and account debit with a per-turn margin',()=>{
 assert.equal(checkCredit({balance:500},{balance:499},2,budget).used,2);
 assert.throws(()=>checkCredit({balance:500},{balance:459},0,budget));assert.throws(()=>checkCredit({balance:500},{balance:500},41,budget));
 assert.throws(()=>checkCredit({balance:5},{balance:5},0,budget));
 assert.equal(tokenCredits({inputTokens:1000000,outputTokens:1000000}),36.25);
 assert.throws(()=>tokenCredits(undefined));
});
