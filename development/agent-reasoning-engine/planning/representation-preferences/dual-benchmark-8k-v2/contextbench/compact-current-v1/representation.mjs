// Preserve legacy concise instructions/descriptions, retain every raw tool field for the shared codec. Open questions: README.md.
import {COMPACT_SYSTEM,compactRequest as legacyCompactRequest} from './../../../dual-benchmark-8k-v1/contextbench/representation.mjs';
export function compactRequest({messages,tools}){
 return {messages:messages.map((m,i)=>i===0&&m.role==='system'?{...m,content:COMPACT_SYSTEM}:m),tools:legacyCompactRequest({messages:[],tools}).tools};
}
