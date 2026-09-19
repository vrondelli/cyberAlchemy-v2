// Canonical payloads are immutable snapshots; health is derived outside them.
// Open questions: CANONICAL-OUTCOME-REPAIR-DRAFT.md.
export function preserveComparisonResult(value,client){
 if(value&&typeof value==='object'&&!Array.isArray(value)&&Array.isArray(value.receipts)&&Array.isArray(value.index_tokenizer_receipts))return structuredClone(value);
 // This is recovery evidence, not a claim of parity with an already persisted result.
 const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 return {...structuredClone(v),receipts:structuredClone(Array.isArray(client?.receipts)?client.receipts:Array.isArray(v.receipts)?v.receipts:[]),index_tokenizer_receipts:structuredClone(Array.isArray(client?.index_receipts)?client.index_receipts:Array.isArray(v.index_tokenizer_receipts)?v.index_tokenizer_receipts:[]),accounting_requires_reconciliation:true,dispatcher_recovery:{schema:'are.synthetic-comparison-result/v1',reason:'incomplete-executor-receipt-summary',canonical_persistence_claimed:false}};
}
