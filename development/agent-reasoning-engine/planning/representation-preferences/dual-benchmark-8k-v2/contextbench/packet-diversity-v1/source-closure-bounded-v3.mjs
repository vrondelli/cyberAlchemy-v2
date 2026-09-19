// Successor preparation correction; does not mutate the frozen failed experiment.
// Open questions: SOURCE-BOUNDED-V3.md. No gold, network or model calls.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {bindDelivery} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {projectObservationsToBase} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-map.mjs';
import {hash,restoreVerifiedBase} from './prepare-bounded-v3.mjs';
export function terminalSourceClosure(donor){
 const path=join(donor.archive_root,'result.json'),binding=donor.bindings.find(b=>resolve(b.path)===resolve(path));assert.ok(binding,'archived result binding required');const bytes=readFileSync(path);assert.equal(hash(bytes),binding.sha256);
 const archived=JSON.parse(bytes),terminal=archived.receipts.find(r=>hash(r)===donor.original_terminal_receipt_sha256);assert.ok(terminal?.kind==='model'&&terminal.status===200&&terminal.dispatched&&!terminal.failure_code,'confirmed original terminal request required');
 const delivery=bindDelivery({captures:[...donor.captures,{prompt:donor.original_prompt,prompt_sha256:hash(donor.original_prompt)}],receipts:[...donor.receipts,terminal]});assert.equal(delivery.unmapped.length,0);assert.ok(delivery.requests.some(r=>r.receipt_index===donor.receipts.length&&r.posture==='confirmed-successful-request'),'original terminal request must bind');
 const reads=delivery.read_observations,known=new Map(reads.map(r=>[r.id,r]));for(const r of donor.reads){assert.ok(known.has(r.id));assert.equal(known.get(r.id).source_sha256,r.source_sha256);}
 const prefixPaths=new Set(donor.reads.map(r=>r.path)),paths=[...new Set(reads.map(r=>r.path))].sort();
 return {schema:'are.terminal-source-closure/v1',reads,paths,additional_paths:paths.filter(p=>!prefixPaths.has(p)),prefix_candidate_count:donor.reads.length,terminal_delivery_count:reads.length,archived_result_binding:binding,terminal_receipt_sha256:hash(terminal),source_set_sha256:hash(reads),candidate_policy_unchanged:true};
}
export function restoreRequestCompleteBase({donor,...options}){
 const closure=terminalSourceClosure(donor),restored=restoreVerifiedBase({...options,donor:{...donor,reads:closure.reads}});
 // The native exporter projects all delivered observations, even unselected ones.
 // Exercise that complete source dependency before any model dispatch.
 const projection=projectObservationsToBase(closure.reads,donor.snapshots,options.directory);
 assert.equal(projection.projections.length,closure.reads.length);
 return {restored,closure,all_delivered_sources_projected:true,unmapped_read_count:projection.projections.filter(p=>p.unmapped_current_lines.length).length};
}
