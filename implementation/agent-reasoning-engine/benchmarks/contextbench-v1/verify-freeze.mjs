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
 if(!f.continuity_review?.passed||f.claim_ceiling!=='development diagnostic only; not benchmark clearance')throw Error('freeze.claim-invalid');
 return {freeze:f,matrix};
}
