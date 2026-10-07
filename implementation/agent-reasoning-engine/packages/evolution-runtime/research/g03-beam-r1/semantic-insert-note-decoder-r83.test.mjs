// Open Questions: evidence/G03-SEMANTIC-INSERT-DECODER-R83.json.
import{test}from'node:test';import assert from'node:assert/strict';import{createHash}from'node:crypto';
import{decodeAndBindNote as decode}from'./semantic-insert-note-decoder-r83.mjs';
const texts=["RootWebArea 'Before'\n[10] button 'Open form'","RootWebArea 'After'\n[20] textbox 'Name'"],sha=x=>createHash('sha256').update(x).digest('hex');
const packet={trajectory_id:'t1',domain:'web',sources:texts.map((s,i)=>({source_id:i?'after':'before',state_index:i,accessibility_tree:s,source_sha256:sha(s),complete_projected_tree:true}))};
const note={record_kind:'observed-transition',outcome:'unverified',title:'Observed navigation',summary:'Retrieval metadata only.',quotes:[{source_id:'before',quote:"[10] button 'Open form'"},{source_id:'after',quote:"[20] textbox 'Name'"}]};
test('one complete enclosing JSON fence, not arbitrary response extraction',()=>{
 const raw=JSON.stringify(note),a=decode(packet,raw),b=decode(packet,'```json\n'+raw+'\n```');
 assert.deepEqual(a.quotes,b.quotes);assert.equal(b.metadata_projection.enclosing_json_fence_removed,true);
 assert.throws(()=>decode(packet,'Here is JSON\n'+raw));assert.throws(()=>decode(packet,'```javascript\n'+raw+'\n```'));
 assert.throws(()=>decode(packet,'```json\n'+raw+'\n```\nextra'));
});
test('clip only retrieval metadata, explicit flags, preserve exact quotes and UTF16',()=>{
 const raw={...note,title:'a'.repeat(119)+'😀more',summary:'s'.repeat(700)},output=decode(packet,JSON.stringify(raw));
 assert.equal(output.title,'a'.repeat(119));assert.equal(output.summary.length,600);
 assert.equal(output.metadata_projection.title_truncated,true);assert.equal(output.metadata_projection.summary_truncated,true);
 assert.equal(output.metadata_projection.quotations_changed,false);assert.deepEqual(output.quotes,decode(packet,JSON.stringify(note)).quotes);
 assert.equal(output.outcome,'unverified');assert.equal(output.metadata_only,true);
});
test('fences and long metadata never excuse quote fabrication or unknown keys',()=>{
 assert.throws(()=>decode(packet,JSON.stringify({...note,summary:'s'.repeat(700),quotes:[{...note.quotes[0],quote:"[10] button 'Upload file'"},note.quotes[1]]})),/quote-not-unique-exact/);
 assert.throws(()=>decode(packet,JSON.stringify({...note,answer:'yes'})),/note-shape/);
 assert.throws(()=>decode(packet,'x'.repeat(32769)),/public-content-cap/);
});
