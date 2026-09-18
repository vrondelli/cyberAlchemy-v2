// Local exact-byte freeze verification; no authority or scientific-success claim.
// Open questions: README.md.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stable} from './delivery.mjs';
export const sha=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:stable(x)).digest('hex');
export function verifyFreeze(path){
 const f=JSON.parse(readFileSync(path)),{freeze_sha256,...material}=f;
 if(f.status!=='frozen'||sha(material)!==freeze_sha256)throw Error('freeze.invalid');
 if(f.node_version!==process.version)throw Error('freeze.node-version');
 if(!Array.isArray(f.sources)||!f.sources.length)throw Error('freeze.sources-required');
 for(const s of f.sources)if(sha(readFileSync(s.path))!==s.sha256)throw Error('freeze.source-drift:'+s.path);
 const matrix=JSON.parse(readFileSync(f.matrix_ref));
 const expectedTasks=f.expected_tasks??8,expectedCells=f.expected_cells??16;
 if(!Number.isSafeInteger(expectedTasks)||expectedTasks<1||!Number.isSafeInteger(expectedCells)||expectedCells<1||matrix.cells.length!==expectedCells||matrix.tasks.length!==expectedTasks)throw Error('freeze.matrix-invalid');
 const preflight=JSON.parse(readFileSync(f.preflight_ref));
 if(preflight.status!=='passed-initial-envelope'||preflight.model_calls!==0||preflight.rows.length!==expectedTasks)throw Error('freeze.preflight-invalid');
 const claimByStage={
  development:'development diagnostic only; not benchmark clearance',
  replication:'8K replication diagnostic only; not complete benchmark clearance',
  'reserved-confirmation':'untouched 8K confirmation only; not benchmark clearance',
  '10k-development-transfer':'10K development transfer only; not confirmation or benchmark clearance',
  '10k-confirmation':'fresh 10K confirmation only; not 12K or benchmark clearance',
  '10k-conditional-development':'fresh 10K conditional development only; not confirmation, 12K, or benchmark clearance'
 };
 const stage=f.evaluation_stage??'development';
 if(!f.continuity_review?.passed||!Object.hasOwn(claimByStage,stage)||f.claim_ceiling!==claimByStage[stage])throw Error('freeze.claim-invalid');
 return {freeze:f,matrix};
}
