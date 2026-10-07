// Agent proposes; runtime validates ALL proposals, then bounds presentation.
// Open Questions: evidence/G03-SOURCE-LINE-INSERT-BUDGET-R85.json.
import {sourceLineCatalog,decodeAndBindLineNote} from './source-line-insert-note-r84.mjs';
export function decodeAndProjectLineNote(packet,content){
 if(typeof content!=='string'||Buffer.byteLength(content)>32768)throw Error('line-budget.public-content-cap');
 const text=content.trim(),fence=text.match(/^```(?:json)?[ \t]*\r?\n([\s\S]*)\r?\n```$/),raw=JSON.parse(fence?fence[1]:text);
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join(',')!=='outcome,record_kind,source_line_ids,summary,title'||raw.record_kind!=='observed-transition'||raw.outcome!=='unverified'||!Array.isArray(raw.source_line_ids)||raw.source_line_ids.length<2||raw.source_line_ids.length>32||new Set(raw.source_line_ids).size!==raw.source_line_ids.length)throw Error('line-budget.proposal-shape');
 const catalog=sourceLineCatalog(packet),all=raw.source_line_ids;
 // Invalid IDs anywhere, including beyond presentation budget, invalidate the note.
 for(const id of all)if(typeof id!=='string'||!catalog.has(id)||!catalog.get(id).eligible)throw Error('line-budget.invalid-proposal-source');
 const counts={before:0,after:0},selected=[],omitted=[];
 for(const id of all){const phase=catalog.get(id).source.source_id;if(counts[phase]<4){selected.push(id);counts[phase]++;}else omitted.push(id);}
 if(!counts.before||!counts.after)throw Error('line-budget.both-phases-required');
 const bound=decodeAndBindLineNote(packet,JSON.stringify({...raw,source_line_ids:selected}));
 bound.metadata_projection.enclosing_json_fence_removed=!!fence;
 return {...bound,proposal_projection:{model_proposed_line_ids:all,all_proposals_source_validated:true,maximum_proposals:32,maximum_presented_per_phase:4,maximum_presented_total:8,proposed_count:all.length,presented_count:selected.length,omitted_line_ids:omitted,policy:'Preserve proposal order within each phase; retain at most4 per phase. No semantic reranking, invented IDs or silent invalid-proposal dropping.'}};
}
