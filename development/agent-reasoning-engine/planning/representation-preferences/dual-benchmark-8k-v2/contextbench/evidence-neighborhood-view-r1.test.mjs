import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderEvidenceNeighborhoodFrontier} from './evidence-neighborhood-view-r1.mjs';

const replay=()=>JSON.parse(readFileSync(new URL('./EVIDENCE-NEIGHBORHOOD-FRONTIER-REPLAY-R6.json',import.meta.url)));
test('six hints per facet retain every missing labeled path in a bounded navigation-only view',()=>{
  for(const row of replay().rows){
    const view=renderEvidenceNeighborhoodFrontier({query_results:Object.fromEntries(row.query_results.map(result=>[result.facet,{schema:'are.ranked-source-frontier-hints/v1',index_digest:result.index_digest,hints:result.hints}]))});
    assert.ok(Buffer.byteLength(view.text)<=8192);assert.ok(view.rows.length<=48);assert.equal(view.model_calls,0);
    const paths=new Set(view.rows.map(item=>item.path));
    for(const path of row.labeled_unvisited_paths)assert.ok(paths.has(path),`${row.task_id}:${path}`);
  }
});
test('byte and entry ceilings trim deterministically without mutating input',()=>{
  const row=replay().rows[0],query_results=Object.fromEntries(row.query_results.map(result=>[result.facet,{schema:'are.ranked-source-frontier-hints/v1',index_digest:result.index_digest,hints:result.hints}])),before=JSON.stringify(query_results);
  const view=renderEvidenceNeighborhoodFrontier({query_results,maximum_entries:5,maximum_bytes:500});
  assert.equal(view.rows.length,5);assert.ok(Buffer.byteLength(view.text)<=500);assert.equal(JSON.stringify(query_results),before);
});
test('mixed indexes and invalid envelopes fail closed',()=>{
  const row=replay().rows[0],query_results=Object.fromEntries(row.query_results.slice(0,2).map(result=>[result.facet,{schema:'are.ranked-source-frontier-hints/v1',index_digest:result.index_digest,hints:structuredClone(result.hints)}]));
  Object.values(query_results)[1].index_digest='0'.repeat(64);
  assert.throws(()=>renderEvidenceNeighborhoodFrontier({query_results}),/index/);
  assert.throws(()=>renderEvidenceNeighborhoodFrontier({query_results:{},per_facet:11}),/per-facet/);
});
