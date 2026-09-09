// Additive companion probe. The production aggregate metric must wrap this call
// unchanged when integrated. No chat text, credentials, or response body is emitted.
export async function probeHandshake({invokeStatus,frame,now,sessionId,attemptId,emit}) {
  if (![invokeStatus,now,emit].every(x=>typeof x==='function') || (frame!==null&&typeof frame!=='function')
    || ![sessionId,attemptId].every(x=>typeof x==='string'&&x.trim())) throw Error('probe.invalid-input');
  const start=now();
  const result=await invokeStatus();
  const statusEnd=now();
  if(frame)await new Promise(resolve=>frame(resolve));
  const end=now();
  const receipt={schema_version:'workspace.handshake-phases/v1',session_id:sessionId,attempt_id:attemptId,
    clock:'frontend-monotonic',frame_available:frame!==null,start_ms:start,status_end_ms:statusEnd,end_ms:end,
    status_ipc_ms:statusEnd-start,post_status_frame_ms:end-statusEnd,authority_effect:'none'};
  // Failed or backward clocks must not manufacture a timing receipt or alter the
  // product's successful status result. Missing receipt rejects the research run.
  if([start,statusEnd,end].every(Number.isFinite)&&start>=0&&statusEnd>=start&&end>=statusEnd){
    try{emit(receipt);}catch{/* Diagnostic sink failure cannot change status semantics. */}
  }
  return result;
}
