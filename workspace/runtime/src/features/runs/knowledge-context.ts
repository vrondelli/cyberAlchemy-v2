// One inspected concept, never its neighbors or upstream file contents.
// Open questions: ../../../../plans/orchestrator-integration/T5D-KNOWLEDGE-CONTEXT.md.
export interface KnowledgeRecord {
 id:string;label:string;kind:string;summary:string;status:string;
 sourceRefs:readonly {source_id:string;source_ref:string;selector?:string;digest?:string}[];
}
export function knowledgeContextText(record:KnowledgeRecord|null):string|null {
 if(!record||record.kind!=='concept'||!record.id.startsWith('concept:')||!record.summary.trim())return null;
 return JSON.stringify({schema:'workspace-research-concept-context/v1',id:record.id,label:record.label,status:record.status,definition:record.summary,source_refs:record.sourceRefs.map(ref=>({source_id:ref.source_id,source_ref:ref.source_ref,selector:ref.selector??null,digest:ref.digest??null})),authority_effect:'none',claim_ceiling:'Research projection; status and references do not establish acceptance, admission or source verification.'},null,2);
}
