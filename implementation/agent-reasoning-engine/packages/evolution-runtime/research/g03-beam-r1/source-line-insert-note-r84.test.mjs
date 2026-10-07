// Open Questions: evidence/G03-SOURCE-LINE-INSERT-PILOT-R84.json.
import{test}from'node:test';import assert from'node:assert/strict';import{createHash}from'node:crypto';
import{renderInsertionPacket,decodeAndBindLineNote as bind}from'./source-line-insert-note-r84.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex'),texts=["RootWebArea 'Café'\n[10] button 'Open form'","RootWebArea 'Form'\n[20] textbox 'Name'"];
const packet={trajectory_id:'t1',domain:'web',sources:texts.map((s,i)=>({source_id:i?'after':'before',state_index:i,accessibility_tree:s,source_sha256:sha(s),complete_projected_tree:true}))};
const note={record_kind:'observed-transition',outcome:'unverified',title:'Observed navigation',summary:'Metadata, not proof.',source_line_ids:['before:L2','after:L2']};
test('catalog renders all original source lines losslessly',()=>{
 const output=renderInsertionPacket(packet);assert.deepEqual(output.sources.map(s=>s.lines.map(l=>l.text).join('\n')),texts);
 assert.equal(output.sources[0].lines[1].id,'before:L2');assert.equal(output.sources[0].lines[1].eligible,true);
});
test('IDs copy original bytes with UTF8-safe coordinates',()=>{
 const output=bind(packet,JSON.stringify(note)),q=output.quotes[0];assert.equal(q.quote,texts[0].split('\n')[1]);
 assert.equal(q.start_byte,Buffer.byteLength(texts[0].split('\n')[0])+1);assert.equal(q.start_line,2);
 assert.equal(output.quotation_origin,'canonical-source-lines-not-model-text');assert.equal(output.metadata_only,true);
});
test('unknown, noncanonical, duplicate or single-phase IDs fail',()=>{
 for(const ids of [['before:L99','after:L2'],['before:L02','after:L2'],['before:L2','before:L2'],['before:L1','before:L2']])assert.throws(()=>bind(packet,JSON.stringify({...note,source_line_ids:ids})));
});
test('explicit line IDs disambiguate repeated original text, not guessed ranges',()=>{
 const repeated=texts[0]+'\n'+texts[0].split('\n')[1],p={...packet,sources:[{...packet.sources[0],accessibility_tree:repeated,source_sha256:sha(repeated)},packet.sources[1]]};
 const output=bind(p,JSON.stringify({...note,source_line_ids:['before:L3','after:L2']}));assert.equal(output.quotes[0].start_line,3);
 assert.equal(output.quotes[0].start_byte,Buffer.byteLength(texts[0])+1);
});
test('whole source identity and projected completeness checks unchanged',()=>{
 assert.throws(()=>renderInsertionPacket({...packet,sources:[{...packet.sources[0],source_sha256:'a'.repeat(64)},packet.sources[1]]}),/source-identity/);
 assert.throws(()=>renderInsertionPacket({...packet,sources:[{...packet.sources[0],complete_projected_tree:false},packet.sources[1]]}),/source-identity/);
});
test('long or empty lines remain rendered but cannot become quotations',()=>{
 const s='\n'+'x'.repeat(301),p={...packet,sources:[{...packet.sources[0],accessibility_tree:s,source_sha256:sha(s)},packet.sources[1]]};
 assert.equal(renderInsertionPacket(p).sources[0].lines[1].text.length,301);
 assert.throws(()=>bind(p,JSON.stringify(note)),/ineligible-line/);
});
test('raw closed schema, conservative outcome and strict enclosing fence',()=>{
 assert.throws(()=>bind(packet,JSON.stringify({...note,outcome:'success'})),/note-shape/);
 assert.throws(()=>bind(packet,JSON.stringify({...note,quotes:['invented']})),/note-shape/);
 assert.throws(()=>bind(packet,'preface\n'+JSON.stringify(note)));
 assert.equal(bind(packet,'```json\n'+JSON.stringify(note)+'\n```').metadata_projection.enclosing_json_fence_removed,true);
});
test('metadata-only clipping explicit and Unicode-safe, source lines unchanged',()=>{
 const output=bind(packet,JSON.stringify({...note,title:'a'.repeat(119)+'😀more',summary:'s'.repeat(700)}));
 assert.equal(output.title,'a'.repeat(119));assert.equal(output.summary.length,600);assert.equal(output.metadata_projection.summary_truncated,true);
 assert.deepEqual(output.quotes,bind(packet,JSON.stringify(note)).quotes);assert.equal(output.semantic_support_not_certified,true);
});
