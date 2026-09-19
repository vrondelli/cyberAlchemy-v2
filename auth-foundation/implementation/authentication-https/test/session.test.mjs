import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POLICY,sessionState,checkAuthentication} from '../src/session-state.mjs';
test('idle boundary, activity, absolute cap and terminal states are independent',()=>{
 const s={status:'active',created:100,last:100,absolute:100+POLICY.absolute};
 assert.equal(sessionState(s,999),'active');assert.equal(sessionState(s,1000),'idle-expired');
 s.last=999;assert.equal(sessionState(s,1000),'active');
 s.last=s.absolute-1;assert.equal(sessionState(s,s.absolute),'absolute-expired');
 for(const status of ['signed-out','replaced','idle-expired','absolute-expired'])assert.equal(sessionState({...s,status},100),status);
 assert.equal(sessionState(undefined,100),'unknown');
});
test('fresh authentication rejects missing, stale, future and malformed auth_time',()=>{
 const ctx={issued:1000,wallNow:1001,fresh:true};
 for(const auth_time of [undefined,null,999,1002,'1000',NaN,1000.5])assert.throws(()=>checkAuthentication({auth_time},ctx));
 checkAuthentication({auth_time:1000},ctx);
 checkAuthentication({auth_time:1001},ctx);
 assert.throws(()=>checkAuthentication({auth_time:1},{issued:30000,wallNow:30000,fresh:false}));
 checkAuthentication({auth_time:1000},{issued:1100,wallNow:1100,fresh:false});
});
