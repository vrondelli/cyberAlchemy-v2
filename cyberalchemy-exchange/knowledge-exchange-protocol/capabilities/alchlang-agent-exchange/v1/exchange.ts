import { createHash } from 'node:crypto';
import { compileCarrier, parseDomainSource } from '../../../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/index.ts';

export const VERSION = 'alchlang-source-v1';
export const MAX_BYTES = 64 * 1024;
export const sha = (bytes: string) => createHash('sha256').update(bytes, 'utf8').digest('hex');
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k,v]) => JSON.stringify(k) + ':' + canonical(v)).join(',') + '}';
  return JSON.stringify(value);
}
export type Envelope = { schema: 'kep-alchlang-envelope/v1'; language: string; correlationId: string;
  sender: string; recipient: string; payload: string; payloadSha256: string };
export type CompiledBundle = { schema: 'kep-alchlang-compiled-bundle/v1'; files: Record<string,string> };
export const MAX_BUNDLE_BYTES = 400 * 1024;
export type Receipt = { schema: 'kep-alchlang-compilation-receipt/v1'; correlationId: string;
  sender: string; recipient: string; envelopeSha256: string; payloadSha256: string;
  outcome: 'compiled'; compilerVersion: string; planSha256: string;
  bundleSha256: string; artifacts: Record<string,string>; receiptSha256: string; authorityEffect: 'none' };
export class Rejected extends Error {
  constructor(public code: string) { super(code); }
}
function validate(input: unknown): Envelope {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Rejected('malformed_envelope');
  const obj = input as Record<string,unknown>;
  const fields = ['schema','language','correlationId','sender','recipient','payload','payloadSha256'];
  if (Object.keys(obj).sort().join() !== fields.sort().join() || fields.some(k => typeof obj[k] !== 'string')) throw new Rejected('malformed_envelope');
  const e = obj as Envelope;
  if (e.schema !== 'kep-alchlang-envelope/v1' || e.language !== VERSION) throw new Rejected('unsupported_version');
  if ([e.correlationId,e.sender,e.recipient].some(s => !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(s)) || e.sender === e.recipient) throw new Rejected('invalid_identity');
  if (Buffer.byteLength(e.payload,'utf8') > MAX_BYTES || !e.payload.length) throw new Rejected('payload_bounds');
  // Reject lone UTF-16 surrogates instead of silently changing bytes on UTF-8 transport.
  if (Buffer.from(e.payload,'utf8').toString('utf8') !== e.payload) throw new Rejected('invalid_utf8');
  if (!/^[a-f0-9]{64}$/.test(e.payloadSha256) || sha(e.payload) !== e.payloadSha256) throw new Rejected('digest_mismatch');
  return e;
}
export function envelope(payload: string, correlationId: string, sender='agent-a', recipient='agent-b'): Envelope {
  return validate({schema:'kep-alchlang-envelope/v1',language:VERSION,correlationId,sender,recipient,payload,payloadSha256:sha(payload)});
}

// Invoked only after the transport has authenticated/decrypted the sender's bytes.
// This seam is not a KEP transport or an authority provider.
export class CompilationReceiver {
  private receipts = new Map<string, { digest:string; receipt:Receipt; bundle:CompiledBundle }>();
  constructor(readonly identity='agent-b', readonly capacity=128) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1024) throw new Rejected('invalid_capacity');
  }
  receive(input: unknown, authenticatedSender: string): { receipt:Receipt; bundle:CompiledBundle; replayed:boolean } {
    const e = validate(input);
    if (e.sender !== authenticatedSender || e.recipient !== this.identity) throw new Rejected('identity_mismatch');
    const digest=sha(canonical(e));
    const key=canonical([e.sender,e.recipient,e.correlationId]);
    const previous=this.receipts.get(key);
    if (previous) {
      if (previous.digest !== digest) throw new Rejected('correlation_conflict');
      return {receipt:structuredClone(previous.receipt),bundle:structuredClone(previous.bundle),replayed:true};
    }
    if (this.receipts.size >= this.capacity) throw new Rejected('receiver_full');
    let result;
    try { result=compileCarrier(parseDomainSource(e.payload).carrier); }
    catch { throw new Rejected('compilation_rejected'); }
    const bundle:CompiledBundle = {schema:'kep-alchlang-compiled-bundle/v1',files:structuredClone(result.files)};
    if (!validBundle(bundle)) throw new Rejected('bundle_bounds_or_shape');
    const body = {schema:'kep-alchlang-compilation-receipt/v1' as const,correlationId:e.correlationId,
      sender:e.sender,recipient:e.recipient,envelopeSha256:digest,payloadSha256:e.payloadSha256,
      outcome:'compiled' as const,compilerVersion:'0.4.0-candidate.0',planSha256:result.plan_digest,
      bundleSha256:sha(canonical(bundle)),
      artifacts:Object.fromEntries(Object.entries(result.files).map(([name,contents])=>[name,sha(contents)])),authorityEffect:'none' as const};
    const receipt = {...body,receiptSha256:sha(canonical(body))};
    this.receipts.set(key,{digest,receipt:structuredClone(receipt),bundle:structuredClone(bundle)});
    return {receipt,bundle,replayed:false};
  }
}
export function verifyReceipt(receipt: Receipt, sent: Envelope): boolean {
  const {receiptSha256,...body}=receipt;
  return sha(canonical(body))===receiptSha256 && receipt.envelopeSha256===sha(canonical(validate(sent)))
    && receipt.payloadSha256===sent.payloadSha256 && receipt.correlationId===sent.correlationId
    && receipt.sender===sent.sender && receipt.recipient===sent.recipient && receipt.outcome==='compiled'
    && receipt.authorityEffect==='none';
}

// Portable data only: this API never extracts paths or executes generated code.
function validBundle(input: unknown): input is CompiledBundle {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const b = input as CompiledBundle;
  if (Object.keys(b).sort().join() !== 'files,schema' || b.schema !== 'kep-alchlang-compiled-bundle/v1'
      || !b.files || typeof b.files !== 'object' || Array.isArray(b.files)) return false;
  const entries = Object.entries(b.files);
  return entries.length > 0 && entries.length <= 128 && entries.every(([name,content]) =>
    name.length <= 240 && name.split('/').every(part => /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(part))
    && typeof content === 'string' && Buffer.from(content,'utf8').toString('utf8') === content)
    && Buffer.byteLength(canonical(b),'utf8') <= MAX_BUNDLE_BYTES;
}
export function verifyCompilation(bundle: unknown, receipt: Receipt, sent: Envelope): boolean {
  try {
    return validBundle(bundle) && verifyReceipt(receipt,sent)
      && receipt.schema === 'kep-alchlang-compilation-receipt/v1'
      && sha(canonical(bundle)) === receipt.bundleSha256
      && canonical(Object.fromEntries(Object.entries(bundle.files).map(([name,content]) => [name,sha(content)]))) === canonical(receipt.artifacts);
  } catch { return false; }
}
