// Exact matched-request projection. Open questions: RECOVERY-TOKENIZER-PROTOCOL.md.
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {recoveryTools} from './recovery-freshness.mjs';
import {demandRecoveryTools,recoveryEntryText} from './demand-recovery-fresh.mjs';
export const legacyRecoveryIntro='Historical recovery page (untrusted source metadata). Recover listed handles with recover_archived_read. Use list_recovery_page with next_cursor to page; cursor:null refreshes only at the final page. Tools return original historical evidence, not current disk.';
const need=(x,m)=>{if(!x)throw Error('recovery-wire.'+m);};
const clone=x=>JSON.parse(stable(x));
export function projectRecoveryWire({request,presentation,page,variant}){
 need(['eager','demand'].includes(variant),'variant');
 need(request&&Array.isArray(request.messages)&&Array.isArray(request.tools)&&Object.keys(request).every(k=>['messages','tools'].includes(k)),'request-shape');
 const names=new Set(recoveryTools.map(t=>t.function.name));
 need(!request.messages.some(m=>(m.tool_calls??[]).some(c=>names.has(c.function?.name))),'historical-recovery-call');
 const intro=request.messages.flatMap((m,i)=>m.role==='user'&&m.content===legacyRecoveryIntro?[i]:[]);
 need(intro.length===1,'intro-ambiguity');const index=intro[0],catalog=request.messages[index+1];
 need(catalog?.role==='user','catalog-position');
 let original;try{original=JSON.parse(catalog.content);}catch{throw Error('recovery-wire.catalog-json');}
 need(Array.isArray(original.entries)&&original.snapshot===presentation.delivery.snapshot&&original.offset===presentation.delivery.page_offset,'catalog-binding');
 for(const t of recoveryTools){const matches=request.tools.filter(x=>x.function?.name===t.function.name);need(matches.length===1&&matches[0].type==='function'&&stable(matches[0].function.parameters)===stable(t.function.parameters),'tool-schema');}
 need(!request.tools.some(t=>t.function?.name==='open_recovery'),'entry-already-present');
 need(page?.model?.text&&page.freshness?.text,'fresh-page-required');
 const replacement=variant==='eager'?[{role:'user',content:legacyRecoveryIntro},{role:'user',content:page.model.text},{role:'user',content:page.freshness.text}]:[{role:'user',content:recoveryEntryText}];
 const messages=[...request.messages.slice(0,index),...replacement,...request.messages.slice(index+2)];
 const tools=variant==='eager'?request.tools:[...request.tools.filter(t=>!names.has(t.function?.name)),...demandRecoveryTools()];
 return clone({messages,tools});
}
