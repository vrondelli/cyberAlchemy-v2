import {encryptBytes, decryptBytes, sha256Hex, concatBytes, base64ToBytes, messages, signedMessage, sealContentKey, openContentKey} from './protocol.js';
export const MAX_FILE_BYTES = 10_000_000;
export const RETENTION_POLICY = 'kep-file-retention-v1';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', {fatal:true});
const MAX_MANIFEST = 16_384;
export async function encryptFile(file, artifactId, policyId, epoch=1) {
  if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_FILE_BYTES) throw new Error('Choose one file of 10 MB or less.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length !== file.size) throw new Error('File changed while being read.');
  const manifest = encoder.encode(JSON.stringify({format:'kep-original-file-v1',name:file.name,type:file.type || 'application/octet-stream',size:bytes.length,sha256:await sha256Hex(bytes)}));
  if (manifest.length > MAX_MANIFEST) throw new Error('File metadata is too long.');
  const size = new Uint8Array(4); new DataView(size.buffer).setUint32(0,manifest.length);
  return encryptBytes(concatBytes(size,manifest,bytes),artifactId,policyId,epoch);
}
export async function decryptFile(ciphertext, key, context) {
  const bytes = await decryptBytes(ciphertext,key,context);
  if (bytes.length < 4) throw new Error('File package truncated.');
  const length = new DataView(bytes.buffer,bytes.byteOffset,4).getUint32(0);
  if (length > MAX_MANIFEST || length > bytes.length - 4) throw new Error('Invalid file manifest length.');
  const meta = JSON.parse(decoder.decode(bytes.subarray(4,4+length)));
  const original = bytes.slice(4+length);
  if (meta.format !== 'kep-original-file-v1' || typeof meta.name !== 'string' || typeof meta.type !== 'string' || meta.size !== original.length || original.length > MAX_FILE_BYTES || await sha256Hex(original) !== meta.sha256) throw new Error('Original file verification failed.');
  // The filename is a download hint only, never a path or markup.
  const name = meta.name.replace(/[\\/\x00-\x1f\x7f]/g,'_').slice(0,255) || 'knowledge-file';
  return {bytes:original,name,type:meta.type,sha256:meta.sha256};
}
export function uploadMessage(request) {
  const a=request.artifact;
  return signedMessage('file-upload',[messages.artifact(a.operation_id,a.originator_id,a.artifact_version_id,a.policy_id,a.encryption_epoch,a.ciphertext_sha256,a.originator_envelope_sha256),request.original_bytes,request.retention_policy,request.policy_accepted]);
}
export function commandMessage(action,id,request,digest,revision) {
  return signedMessage('file-'+action,[id,request.requester_id,request.attempt_id,digest,revision,RETENTION_POLICY,request.policy_accepted]);
}
export function createFileClient({api,authorize}) {
  const acknowledgeReceipt=async(context,identity,state,accepted)=>{
    if(!accepted)throw new Error('Accept the file retention policy first.');
    if(!state||state.artifactId!==context.artifactId||state.requesterId!==identity.identityId||state.ciphertextSha256!==context.ciphertextSha256||!Number.isSafeInteger(state.revision)||typeof state.attemptId!=='string')throw Error('Invalid pending acknowledgement state.');
    const command={requester_id:state.requesterId,attempt_id:state.attemptId,policy_accepted:true};
    state.authorization??=await authorize(commandMessage('acknowledge',state.artifactId,command,state.ciphertextSha256,state.revision));
    return api(`/v1/files/${encodeURIComponent(state.artifactId)}/acknowledge`,{method:'POST',body:JSON.stringify({...command,authorization:state.authorization})});
  };
  return {
    async prepare(file,identity,artifactId,policyId,accepted) {
      if (!accepted) throw new Error('Accept the file retention policy first.');
      const encrypted = await encryptFile(file,artifactId,policyId);
      const context = {artifactId,policyId,epoch:1,plaintextCommitment:encrypted.plaintextCommitment,ciphertextSha256:encrypted.ciphertextSha256,contentNonceBase64:encrypted.contentNonceBase64,recipientIdentityId:identity.identityId,recipientKeyVersion:identity.keyVersion,envelopeRevision:0};
      const envelope=await sealContentKey(identity.publicKeyBase64,encrypted.contentKeyBase64,context);
      const request={artifact:{operation_id:crypto.randomUUID(),artifact_version_id:artifactId,originator_id:identity.identityId,policy_id:policyId,encryption_epoch:1,ciphertext_base64:encrypted.ciphertextBase64,ciphertext_sha256:encrypted.ciphertextSha256,originator_envelope_base64:envelope.envelopeBase64,originator_envelope_sha256:envelope.envelopeSha256},original_bytes:file.size,retention_policy:RETENTION_POLICY,policy_accepted:true};
      request.artifact.authorization=await authorize(uploadMessage(request));
      // Keep the prepared request for retries. Do not generate another operation on network failure.
      return {request,context,contentKeyBase64:encrypted.contentKeyBase64};
    },
    upload(prepared) { return api('/v1/files',{method:'POST',body:JSON.stringify(prepared.request)}); },
    async receive(context,identity,accepted,attemptId=crypto.randomUUID()) {
      if (!accepted) throw new Error('Accept the file retention policy first.');
      const id=context.artifactId;
      const state=await api(`/v1/artifacts/${encodeURIComponent(id)}`);
      const command={requester_id:identity.identityId,attempt_id:attemptId,policy_accepted:true};
      command.authorization=await authorize(commandMessage('access',id,command,context.ciphertextSha256,state.revision));
      const result=await api(`/v1/files/${encodeURIComponent(id)}/access`,{method:'POST',body:JSON.stringify(command)});
      if(result.ciphertext_sha256!==context.ciphertextSha256 || await sha256Hex(base64ToBytes(result.ciphertext_base64))!==context.ciphertextSha256) throw new Error('Ciphertext verification failed.');
      if(await sha256Hex(base64ToBytes(result.recipient_envelope_base64))!==result.recipient_envelope_sha256) throw new Error('Envelope verification failed.');
      // Envelope revision is supplied by its bound handoff context, not guessed from current artifact revision.
      const key=await openContentKey(result.recipient_envelope_base64,identity.privateKeyBase64,{...context,recipientIdentityId:identity.identityId,recipientKeyVersion:identity.keyVersion});
      const file=await decryptFile(result.ciphertext_base64,key,context);
      // Return verified bytes even if acknowledgement transport fails; retry only this exact receipt.
      const receiptState={artifactId:id,requesterId:identity.identityId,attemptId,ciphertextSha256:context.ciphertextSha256,revision:result.revision};
      const acknowledge=()=>acknowledgeReceipt(context,identity,receiptState,true);
      return {file,acknowledge,attemptId,receiptState};
    },
    acknowledgeReceipt
  };
}
