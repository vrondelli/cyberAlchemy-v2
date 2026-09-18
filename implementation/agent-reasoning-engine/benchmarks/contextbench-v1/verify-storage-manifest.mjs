// Verify a closeout manifest after source-tree compaction or path relocation.
// Accepts the all-cache v1 manifest, whose evidence and source paths are absolute.
import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

const [manifestPath]=process.argv.slice(2);
if(!manifestPath)throw Error('storage manifest path required');
const path=resolve(manifestPath),manifest=JSON.parse(readFileSync(path));
if(manifest.schema_version!=='are.contextbench-all-cache-compaction/v1')throw Error('storage-manifest.schema');
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
let evidenceBytes=0;
for(const row of manifest.preserved_evidence){
  const stat=statSync(row.path);
  if(!stat.isFile()||stat.size!==row.size||sha(row.path)!==row.sha256)throw Error(`storage-manifest.evidence-drift:${row.path}`);
  evidenceBytes+=stat.size;
}
for(const row of manifest.source_bindings){
  execFileSync('git',['-C',row.store_path,'cat-file','-e',`${row.commit}^{commit}`],{stdio:'ignore',timeout:120000});
}
console.log(JSON.stringify({schema_version:'are.contextbench-storage-verification/v1',status:'verified',manifest_ref:path,
  evidence_files:manifest.preserved_evidence.length,evidence_bytes:evidenceBytes,source_bindings:manifest.source_bindings.length,
  model_calls:0,authority_effect:'none'}));
