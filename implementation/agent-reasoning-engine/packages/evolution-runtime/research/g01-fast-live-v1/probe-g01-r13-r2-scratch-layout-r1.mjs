// Exact no-model four-checkout rehearsal for the largest r13 r2 task.
// Scratch is retained for separately verified cold archival.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base="/opt/are/evolution-runtime";
const scratch="/tmp/are-g01-r13-r2-scratch-layout-probe-r1";
const receiptRoot=`${base}/g01-r13-r2-scratch-layout-probe-r1`;
const cachePath=`${base}/g01-r13-cache-transfer-r2/VERIFY.json`;
const cacheSha="e912532f9e9d23e9f7408a6bb94aaf23c366aed6252f7ef10ac32bd723ea7d07";
const censusPath=`${base}/g01-r13-r2-storage-census-r2/STORAGE-CENSUS.json`;
const censusSha="3d15b1b1f79320e2e8debdb614fbb2e5cf33a4d42c88bb857294fbf48d652421";
const orchestrator=`${base}/g01-source-r13-prospective-r44/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs`;
const orchestratorSha="29e711e77d99de5d91b75cd7ee743a391560a86e83e69a41deafb69f74b3a1bd";
const instanceId="Multi-SWE-Bench__java__maintenance__bugfix__2bd87230";
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const need=(value,reason)=>{if(!value)throw Error(`g01-r13-r2-scratch-probe.${reason}`);};
const free=path=>{const stat=statfsSync(path);return Number(stat.bavail)*Number(stat.bsize);};

async function main(){
 need(!existsSync(scratch)&&!existsSync(receiptRoot),"already-exists");
 need(free(base)>500_000_000,"root-headroom");
 need(sha(readFileSync(cachePath))===cacheSha&&
   sha(readFileSync(censusPath))===censusSha&&
   sha(readFileSync(orchestrator))===orchestratorSha,"source-drift");
 const census=JSON.parse(readFileSync(censusPath));
 const largest=[...census.rows].sort((a,b)=>b.four_copy_regular_block_bytes-a.four_copy_regular_block_bytes)[0];
 need(census.tmpfs_floor_pass===true&&largest?.instance_id===instanceId&&
   free("/tmp")>=census.provisional_tmpfs_floor_bytes,"storage-floor");
 const cache=JSON.parse(readFileSync(cachePath));
 const row=cache.verified_task_bindings.find(item=>item.instance_id===instanceId);
 need(row&&row.base_commit==="dd733c4c5c48e49c4ee7f0bebce3ff939d0bcf03"&&
   row.tree==="3c057871949fa24bc60d4446ec2cd92978ae0d68"&&
   row.repository_path==="/tmp/are-g01-r13-source-caches-r1/fasterxml--jackson-databind.git",
   "worst-task-binding");
 const {prepareIsolatedShallowSourceCheckout}=await import(pathToFileURL(orchestrator).href);
 const before={root_free_bytes:free(base),tmp_free_bytes:free("/tmp")};
 mkdirSync(scratch,{mode:0o700});
 const checkouts=[];
 for(const arm of ["control","candidate"]){
  const armRoot=join(scratch,arm);mkdirSync(armRoot,{mode:0o700});
  for(const name of ["base","work"]){
   const destination=join(armRoot,name);
   const result=prepareIsolatedShallowSourceCheckout({cache:row.repository_path,
     destination,base_commit:row.base_commit});
   need(result.head===row.base_commit&&result.tree===row.tree,"checkout-drift");
   checkouts.push({arm,name,destination,head:result.head,tree:result.tree});
   need(free("/tmp")>1_342_177_280,"tmpfs-reserve");
  }
 }
 const after={root_free_bytes:free(base),tmp_free_bytes:free("/tmp")};
 const receipt={schema_version:"are.g01-r13-r2-scratch-layout-probe/v1",
   status:"passed-source-retained",instance_id:instanceId,
   cache_receipt_sha256:cacheSha,storage_census_sha256:censusSha,
   orchestrator_sha256:orchestratorSha,scratch_root:scratch,receipt_root:receiptRoot,
   checkouts,before,after,tmp_consumed_bytes:before.tmp_free_bytes-after.tmp_free_bytes,
   root_consumed_before_receipt_bytes:before.root_free_bytes-after.root_free_bytes,
   model_calls:0,gold_loaded:false,
   claim_ceiling:"No-model four-checkout storage layout; not live output peak, campaign freeze, quality, or superiority",
   open_questions:["Can source scratch be cold-copied and restored before reclaim?",
     "Will the guarded launch retain enough root/tmpfs headroom for logs and model output?"]};
 mkdirSync(receiptRoot,{mode:0o700});
 const bytes=Buffer.from(JSON.stringify(receipt,null,2)+"\n");
 writeFileSync(join(receiptRoot,"SCRATCH-PROBE.json"),bytes,{flag:"wx",mode:0o600});
 console.log(JSON.stringify({status:receipt.status,tmp_consumed_bytes:receipt.tmp_consumed_bytes,
   tmp_free_after_bytes:after.tmp_free_bytes,root_free_after_bytes:after.root_free_bytes,
   receipt_sha256:sha(bytes),scratch_root:scratch}));
}
main().catch(error=>{console.error(JSON.stringify({status:"probe-error",error:String(error.message)}));process.exitCode=2;});
