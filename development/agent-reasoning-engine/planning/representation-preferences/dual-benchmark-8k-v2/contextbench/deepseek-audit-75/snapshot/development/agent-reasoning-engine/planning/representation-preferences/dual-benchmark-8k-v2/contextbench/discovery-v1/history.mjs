// Pure structural prototype. No providers, gold, token estimates or archive mutations.
// Open questions and integration boundary: PLAN.md.
const stable=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const bytes=x=>Buffer.byteLength(stable(x));
const need=(ok,code)=>{if(!ok)throw Error('history-projection.'+code);};
const clone=x=>JSON.parse(stable(x));
function groups(messages){
 const result=[],seen=new Set();
 for(let i=0;i<messages.length;){
  const m=messages[i];need(m&&['system','developer','user','assistant','tool'].includes(m.role),'invalid-message-role');
  need(m.role!=='tool','orphan-tool');
  if(m.role==='assistant'&&m.tool_calls?.length){
   need(Array.isArray(m.tool_calls),'invalid-tool-calls');
   const ids=m.tool_calls.map(c=>c.id);need(ids.every(id=>typeof id==='string'&&id.length&&!seen.has(id))&&new Set(ids).size===ids.length,'duplicate-or-invalid-call-id');
   const replies=messages.slice(i+1,i+1+ids.length);
   need(replies.length===ids.length&&replies.every(r=>r.role==='tool'&&ids.includes(r.tool_call_id))&&new Set(replies.map(r=>r.tool_call_id)).size===ids.length,'incomplete-exchange');
   for(const id of ids)seen.add(id);
   result.push({start:i,end:i+ids.length+1,exchange:true,ids});i+=ids.length+1;
  }else{need(m.tool_calls===undefined||Array.isArray(m.tool_calls)&&m.tool_calls.length===0,'invalid-tool-calls');result.push({start:i,end:i+1,exchange:false,ids:[]});i++;}
 }
 return result;
}

/** Pending is one complete executed exchange; caller binds its first-delivery receipt.
 * Archive refs are opaque existing recovery metadata, preserved exactly, not validated here.
 * Protect pending correction/terminal assistant messages explicitly by original index.
 */
export function projectHistory({history,pending=[],archive_refs=[],protected_message_indices=[]}){
 need(Array.isArray(history)&&Array.isArray(pending)&&Array.isArray(archive_refs)&&Array.isArray(protected_message_indices),'invalid-input');
 need(protected_message_indices.every(i=>Number.isSafeInteger(i)&&i>=0&&i<history.length),'invalid-protected-index');
 const original=clone(history),pendingCopy=clone(pending),refs=clone(archive_refs),protectedOriginal=new Set(protected_message_indices);
 let normalized=original.map((message,i)=>({message,original_index:i,pending:false})),restored=0;
 if(pendingCopy.length){
  const pg=groups(pendingCopy);need(pg.length===1&&pg[0].exchange,'pending-complete-exchange-required');
  const ids=new Set(pg[0].ids),hits=[];
  for(const [i,row]of normalized.entries()){
   const m=row.message;
   if(m.role==='tool'&&ids.has(m.tool_call_id)||m.role==='assistant'&&m.tool_calls?.some(c=>ids.has(c.id))){
    const expected=m.role==='assistant'?pendingCopy[0]:pendingCopy.find(p=>p.role==='tool'&&p.tool_call_id===m.tool_call_id);
    need(stable(m)===stable(expected),'pending-content-conflict');hits.push(i);
   }
  }
  need(new Set(hits.map(i=>normalized[i].message.role==='assistant'?'assistant':normalized[i].message.tool_call_id)).size===hits.length,'duplicate-pending-fragment');
  const at=hits.length?hits[0]:normalized.length;
  const rows=pendingCopy.map(message=>({message,pending:true,original_index:hits.find(i=>stable(normalized[i].message)===stable(message))??null}));
  restored=pendingCopy.length-hits.length;
  const hitSet=new Set(hits);normalized=[...normalized.slice(0,at).filter((_r,i)=>!hitSet.has(i)),...rows,...normalized.slice(at).filter((_r,i)=>!hitSet.has(i+at))];
 }
 const all=groups(normalized.map(r=>r.message)),exchanges=all.filter(g=>g.exchange),recent=new Set(exchanges.slice(-2)),kept=[],omitted=[];
 const earliestRecent=exchanges.slice(-2)[0]?.start??0;
 for(const g of all){
  const rows=normalized.slice(g.start,g.end),protectedGroup=rows.some(r=>r.pending||protectedOriginal.has(r.original_index));
  const role=rows[0].message.role;
  const retain=protectedGroup||(g.exchange?recent.has(g):role!=='assistant'||g.start>=earliestRecent);
  if(retain)kept.push(...rows.map(r=>r.message));
  else omitted.push({original_indices:rows.map(r=>r.original_index),kind:g.exchange?'complete-tool-exchange':'old-plain-assistant',message_count:rows.length,message_bytes:rows.reduce((s,r)=>s+bytes(r.message),0),reason:'older-than-two-recent-complete-exchanges'});
 }
 groups(kept); // Fail closed if a future edit breaks pairing.
 const normalMessages=normalized.map(r=>r.message),inputBytes=bytes(original),normalizedBytes=bytes(normalMessages),selectedBytes=bytes(kept);
 return {history:clone(kept),archive_refs:refs,diagnostics:{version:'history-projection-v1',unit:'UTF-8 stable JSON bytes; NOT tokens',input_messages:original.length,normalized_messages:normalized.length,selected_messages:kept.length,restored_pending_messages:restored,input_bytes:inputBytes,normalized_bytes:normalizedBytes,selected_bytes:selectedBytes,removed_bytes:normalizedBytes-selectedBytes,omitted_old_history:omitted,complete_exchanges_before:exchanges.length,complete_exchanges_after:groups(kept).filter(g=>g.exchange).length,pending_protected:pendingCopy.length>0,archive_reference_count:refs.length,archive_reference_validation:'opaque preservation only; receipt validation remains caller-owned',admission:'not performed; oversize protected content must remain intact',performance_claim:null}};
}
