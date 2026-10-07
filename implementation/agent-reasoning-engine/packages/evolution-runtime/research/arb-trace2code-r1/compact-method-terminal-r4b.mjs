// Separate fail-closed receipt-history guard; frozen r4 interface remains unchanged.
// Open Questions: evidence/G01-COMPACT-METHOD-TERMINAL-R4B.json.
import {buildMethodHandleTable as build,selectMethodHandleSubmission as select} from './compact-method-terminal-r4.mjs';
export {methodHandleTool,methodHandleMessage,methodHandleSchema,METHOD_HANDLE_TOOL} from './compact-method-terminal-r4.mjs';
const uint=x=>Number.isSafeInteger(x)&&x>=0;
export function requireCertainReceiptHistory(receipts){
 if(!Array.isArray(receipts))throw Error('method-handles.receipt-history-required');
 for(const r of receipts){
  if(r?.dispatch_uncertain===true)throw Error('method-handles.uncertain-history-stop');
  if(r?.kind==='model'&&r.dispatched===true&&(!uint(r.input_tokens)||!uint(r.output_tokens)))
   throw Error('method-handles.unknown-history-usage-stop');
 }
}
export function buildMethodHandleTable(input){requireCertainReceiptHistory(input.receipts);return build(input);}
export function selectMethodHandleSubmission(input){requireCertainReceiptHistory(input.receipts);return select(input);}
