// Open Questions: evidence/G03-SEMANTIC-INSERT-PILOT-R81.json.
import {test} from 'node:test';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import {validateAndBindNote as bind} from './semantic-insert-note-r81.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex'),before="RootWebArea 'Café'\n[10] button 'Open form'",after="RootWebArea 'Form'\n[20] textbox 'Name'";
const packet={trajectory_id:'t1',domain:'web',sources:[before,after].map((s,i)=>({source_id:i?'after':'before',state_index:i,accessibility_tree:s,source_sha256:sha(s),complete_projected_tree:true}))};
const note={record_kind:'observed-transition',outcome:'unverified',title:'Opening a form',summary:'An observed form navigation.',quotes:[{source_id:'before',quote:"[10] button 'Open form'"},{source_id:'after',quote:"[20] textbox 'Name'"}]};
test('exact quotes bind UTF8 byte spans and unchanged source identities',()=>{
 const output=bind(packet,note);assert.equal(output.metadata_only,true);assert.equal(output.semantic_support_not_certified,true);
 assert.equal(output.quotes[0].start_byte,Buffer.byteLength(before.split('\n')[0])+1);
 assert.equal(output.quotes[0].start_line,2);assert.equal(output.quotes[0].end_line,2);
 assert.equal(output.quotes[0].source_sha256,sha(before));assert.equal(output.outcome,'unverified');
});
test('invented, altered or ambiguous quote fails closed',()=>{
 assert.throws(()=>bind(packet,{...note,quotes:[{...note.quotes[0],quote:"[10] button 'Upload file'"},note.quotes[1]]}),/quote-not-unique-exact/);
 const repeated=before+'\n'+note.quotes[0].quote;
 assert.throws(()=>bind({...packet,sources:[{...packet.sources[0],accessibility_tree:repeated,source_sha256:sha(repeated)},packet.sources[1]]},note),/quote-not-unique-exact/);
});
test('source drift or clipped projection fails closed',()=>{
 assert.throws(()=>bind({...packet,sources:[{...packet.sources[0],source_sha256:'f'.repeat(64)},packet.sources[1]]},note),/source-identity/);
 assert.throws(()=>bind({...packet,sources:[{...packet.sources[0],complete_projected_tree:false},packet.sources[1]]},note),/source-identity/);
});
test('certified success, extra keys and metadata overflow rejected',()=>{
 assert.throws(()=>bind(packet,{...note,outcome:'success'}),/note-shape/);
 assert.throws(()=>bind(packet,{...note,answer:'yes'}),/note-shape/);
 assert.throws(()=>bind(packet,{...note,summary:'x'.repeat(601)}),/metadata-cap/);
});
test('before-only and duplicate quotations rejected',()=>{
 assert.throws(()=>bind(packet,{...note,quotes:[note.quotes[0],{source_id:'before',quote:"RootWebArea 'Café'"}]}),/both-phases-required/);
 assert.throws(()=>bind(packet,{...note,quotes:[...note.quotes,note.quotes[0]]}),/quote-not-unique-exact/);
});
test('unknown source and excessive quote count rejected',()=>{
 assert.throws(()=>bind(packet,{...note,quotes:[{...note.quotes[0],source_id:'goal'},note.quotes[1]]}),/quote-shape/);
 assert.throws(()=>bind(packet,{...note,quotes:Array(9).fill(note.quotes[0])}),/quote-count/);
});
