import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {handle} from '../continuity-v1/adapter.mjs';
import {createBridge} from './bridge.mjs';
const dir=mkdtempSync(join(tmpdir(),'are-protocol-fixture-'));
try{
 const c={mode:'isolated-prototype',session_id:'thread',cwd:dir,transcript_path:join(dir,'transcript'),participant_ref:'user',product_ref:'product',log_path:join(dir,'ledger')};
 const call=(kind,turn,extra)=>handle(c,{session_id:'thread',cwd:dir,transcript_path:c.transcript_path,hook_event_name:kind,turn_id:turn,...extra});
 call('UserPromptSubmit','one',{prompt:'/are mode apply-scoped'});call('Stop','one',{stop_hook_active:false,last_assistant_message:'Ready.'});call('UserPromptSubmit','active',{prompt:'Explain.'});
 const bridge=createBridge(c),fixtures=[];
 const steer={id:1,method:'turn/steer',params:{threadId:'thread',expectedTurnId:'active',input:[{type:'text',text:'Please keep it brief.',text_elements:[]}]}};
 fixtures.push({schema:'TurnSteerParams.json',value:bridge.request(steer).request.params});
 const response={turnId:'active'};fixtures.push({schema:'TurnSteerResponse.json',value:response});
 const injection=bridge.response({id:1,result:response}).request;fixtures.push({schema:'ThreadInjectItemsParams.json',value:injection.params});
 bridge.response({id:injection.id,result:{}});fixtures.push({schema:'ThreadInjectItemsResponse.json',value:{}});
 const compact={threadId:'thread',turnId:'active',item:{type:'contextCompaction',id:'compact'},completedAtMs:1};
 fixtures.push({schema:'ItemCompletedNotification.json',value:compact});
 const recovery=bridge.notification({method:'item/completed',params:compact}).request;
 fixtures.push({schema:'ThreadInjectItemsParams.json',value:recovery.params});
 console.log(JSON.stringify(fixtures,null,2));
}finally{rmSync(dir,{recursive:true,force:true});}
