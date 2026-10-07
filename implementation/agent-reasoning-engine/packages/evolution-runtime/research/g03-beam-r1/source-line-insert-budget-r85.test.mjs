// Open Questions: evidence/G03-SOURCE-LINE-INSERT-BUDGET-R85.json.
import{test}from'node:test';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{decodeAndProjectLineNote as bind}from'./source-line-insert-budget-r85.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex'),packet={trajectory_id:'t',domain:'web',sources:['before','after'].map((id,i)=>{const text=Array.from({length:10},(_,j)=>"["+j+"] button 'Control "+id+' '+j+"'").join('\n');return{source_id:id,state_index:i,accessibility_tree:text,source_sha256:sha(text),complete_projected_tree:true};})};
const note={record_kind:'observed-transition',outcome:'unverified',title:'Metadata only',summary:'No verified success.',source_line_ids:['before:L1','before:L2',...Array.from({length:8},(_,i)=>'after:L'+(i+1))]};
test('all10 valid proposals checked; cap4 per phase with explicit omissions',()=>{
 const b=bind(packet,JSON.stringify(note));assert.equal(b.proposal_projection.proposed_count,10);assert.equal(b.quotes.length,6);
 assert.deepEqual(b.proposal_projection.omitted_line_ids,['after:L5','after:L6','after:L7','after:L8']);
 assert.equal(b.proposal_projection.all_proposals_source_validated,true);assert.equal(b.metadata_only,true);
});
test('invalid ID beyond cap is never hidden by projection',()=>{
 assert.throws(()=>bind(packet,JSON.stringify({...note,source_line_ids:[...note.source_line_ids,'after:L99']})),/invalid-proposal-source/);
});
test('before/after presentation cap preserves both phases even if proposed late',()=>{
 const ids=[...Array.from({length:10},(_,i)=>'before:L'+(i+1)),...Array.from({length:10},(_,i)=>'after:L'+(i+1))];
 const b=bind(packet,JSON.stringify({...note,source_line_ids:ids}));assert.equal(b.quotes.length,8);assert.equal(b.proposal_projection.omitted_line_ids.length,12);
 assert.deepEqual(b.model_selected_line_ids,['before:L1','before:L2','before:L3','before:L4','after:L1','after:L2','after:L3','after:L4']);
});
test('duplicates, unknown keys and one-phase proposals fail closed',()=>{
 assert.throws(()=>bind(packet,JSON.stringify({...note,source_line_ids:['before:L1','before:L1','after:L1']})),/proposal-shape/);
 assert.throws(()=>bind(packet,JSON.stringify({...note,answer:'yes'})),/proposal-shape/);
 assert.throws(()=>bind(packet,JSON.stringify({...note,source_line_ids:['before:L1','before:L2']})),/both-phases-required/);
});
