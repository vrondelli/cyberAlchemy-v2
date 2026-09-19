import {createHash} from "node:crypto";
import {existsSync,readFileSync,statSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]??"."),base="projects/domainspec-v2/development/remaining-meta-types/active-types/workflow/admission";
const load=(path)=>JSON.parse(readFileSync(resolve(root,path),"utf8")),digest=(path)=>createHash("sha256").update(readFileSync(resolve(root,path))).digest("hex"),fail=(message)=>{throw new Error("RMT_WF_ADMISSION_INVALID:"+message);};
const admission=load(base+"/admission.json"),inventory=load(base+"/source-inventory.json");
if(admission.schema_version!=="domainspec.meta-type-admission/v1"||admission.work_pack_id!=="WP-RMT-002"||admission.task_id!=="TASK-RMT-WF"||admission.meta_type?.id!=="DS-D1.9"||admission.meta_type?.label!=="Workflow"||admission.meta_type?.canonical_maturity!=="active"||admission.authority_effect!=="none")fail("active-row");
if(admission.semantic_plan?.epoch_id!=="WP-RMT-002/S1/2026-08-16"||admission.semantic_plan?.contract_digest!=="75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7")fail("s1-binding");
const d=admission.proof_denominator;if(admission.criterion_schema?.portable_semantics?.length!==10||admission.criterion_schema?.rel_a?.length!==4||admission.criterion_schema?.s1_cross_boundary?.length!==1||d?.semantic_hostile_count!==10||d?.rel_a_hostile_count!==4||d?.s1_hostile_count!==1||d?.control_identity_count!==15||d?.unique_fixture_path_count!==14||d?.fresh_process_count!==2||d?.native_hash_byte_comparison!==false)fail("denominator");
if(JSON.stringify(admission.target_forms)!==JSON.stringify(["typescript.ordered-workflow","python.ordered-workflow","rust.ordered-workflow"]))fail("target-forms");
const h=admission.s1_binding_contract;if(h?.handle!=="workflow-s1-bindings/v1"||h?.operation_handle!=="operation-transaction-effect-group/v1"||h?.state_machine_handle!=="state-machine-transition-effect-intent/v1"||h?.post_commit_failure!=="preserve-durable-facts"||h?.compensation!=="forward-recovery-only")fail("s1-handle");
if(inventory.sources?.length!==9||inventory.authority_effect!=="none")fail("source-inventory");for(const source of inventory.sources){const path=resolve(root,source.path);if(!existsSync(path)||statSync(path).size!==source.size_bytes||digest(source.path)!==source.sha256)fail("source:"+source.role);}
for(const dependency of admission.dependencies){const candidate=load(dependency.path);if(candidate.projection_swu_id!==dependency.swu_id||candidate.lifecycle?.admission_status!=="not-admitted"||candidate.lifecycle?.authority_effect!=="none")fail("dependency:"+dependency.swu_id);}
if(admission.w4_reuse.modified!==false)fail("w4-mutation");if(existsSync(resolve(root,base+"/RECEIPT.json")))fail("lifecycle-receipt-must-remain-deferred");
console.log(JSON.stringify({result:"pass",swu_id:"RMT-WF-001",source_count:9,semantic_plan_epoch_id:admission.semantic_plan.epoch_id,authority_effect:"none"}));
