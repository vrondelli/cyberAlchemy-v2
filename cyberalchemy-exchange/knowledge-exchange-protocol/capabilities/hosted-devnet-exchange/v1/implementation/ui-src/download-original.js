// Saving verified bytes is independent of acknowledgement persistence.
export async function downloadOriginal(exchange, receive, save) {
  if (exchange.received) { save(exchange.received.file); return; }
  let receiveError;
  try { await receive(); } catch (error) { receiveError = error; }
  if (exchange.received) {
    try { save(exchange.received.file); }
    catch { throw new Error('Original verified. Saving could not start; choose Save again.' + (receiveError ? ' Acknowledgement is also pending.' : '')); }
  }
  if (receiveError) throw receiveError;
}
export function saveOriginal(file) {
  const url=URL.createObjectURL(new Blob([file.bytes],{type:'application/octet-stream'}));
  const link=document.createElement('a');link.href=url;link.download=file.name;
  document.body.append(link);
  try { link.click(); } finally { link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000); }
}
