// Read-only status and guaranteed inactive-ID checks; no turn or approval commands.
export async function probeSemantics(browser){
  return browser.execute(async()=>{
    const invoke=globalThis.__TAURI__?.core?.invoke;
    if(typeof invoke!=='function')throw Error('tauri-core-missing');
    const statuses=await Promise.all(Array.from({length:8},()=>invoke('chat_control_plane_status',{})));
    const inactiveDisconnect=await invoke('chat_disconnect',{connectionId:0});
    let replayError=null;
    try{await invoke('chat_replay',{connectionId:0});}catch(e){replayError=String(e);}
    return {statuses,inactiveDisconnect,replayError};
  });
}
export function verifySemantics(result){
  return Array.isArray(result?.statuses)&&result.statuses.length===8&&result.statuses.every(x=>x===true)
    &&result.inactiveDisconnect===false&&result.replayError==='chat connection is not active';
}
