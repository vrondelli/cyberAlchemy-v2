// Check and one-time freeze of the independently admitted G01 r13 r2 cohort.
// --check is source-only; --freeze requires a fresh same-account readiness receipt.
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const base="/opt/are/evolution-runtime";
const inputRoot=`${base}/g01-product-replication-input-r16`;
const campaignRoot=`${base}/g01-product-replication-r13`;
const sourceRoot=`${base}/g01-source-r13-prospective-r44`;
const configPath=`${base}/g01-r38-pytest-next-order-r1/CONFIG.json`;
const pins=Object.freeze({
 candidate:[`${base}/g01-r13-clean-cohort-candidate-r2/COHORT-CANDIDATE.json`,"e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d"],
 caches:[`${base}/g01-r13-cache-transfer-r2/VERIFY.json`,"e912532f9e9d23e9f7408a6bb94aaf23c366aed6252f7ef10ac32bd723ea7d07"],
 preflight:[`${base}/g01-r13-r2-r44-index-qualification-r1/SOURCE-INDEX-QUALIFICATION.json`,"cea56daa0b7408d38694405c894c3d7f464d9bed6789bab83d3e4e336c17d481"],
 coverage:[`${base}/g01-r13-r2-r44-gold-index-coverage-r1/GOLD-INDEX-COVERAGE.json`,"3960921635df8f42a1f4874775ef29755898ca03540df12fbb8723fe6eda0965"],
 scratch:[`${base}/g01-r13-r2-scratch-layout-probe-r1/SCRATCH-PROBE.json`,"5158becba83450a5c5862d664ba72f3fa325efac00914e27e6c3d9fae6cdede2"],
 prior:[`${base}/g01-product-replication-input-r15/DEFINITION.json`,"d7410c9e5a8ad346f9c6a312d02bda6282b0893a79e0c3017304fa564c70c7c4"],
 config:[configPath,"1d5cfadeb370863a98441c4fe1f5d5bc813e6474fd90ce16671f6c57669b0ee7"]
});
const expectedTree="034458ba51cf7b8b00873fda75f9d1c126f623e5ca0154bbef72388d7770f484";
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const need=(value,reason)=>{if(!value)throw Error(`g01-r13-r2-freeze.${reason}`);};
const readPinned=([path,digest])=>{const bytes=readFileSync(path);need(sha(bytes)===digest,`receipt-drift:${path}`);return JSON.parse(bytes);};
const git=(path,...args)=>execFileSync("git",["-c",`safe.directory=${path}`,"-C",path,...args],
  {encoding:"utf8",timeout:30000}).trim();

function validateInputs({candidate,caches,preflight,coverage,scratch,prior,config,tree}){
 const quota={cpp:1,java:1,javascript:1,python:19,typescript:2};
 const fields=["base_commit","instance_id","language","original_inst_id","problem_statement","repo","repo_url","source"];
 need(candidate.schema_version==="are.g01-r13-clean-source-only-candidate/v1"&&
   candidate.status==="preflight-only-not-frozen"&&candidate.model_calls===0&&
   candidate.gold_values_or_paths_used===false&&candidate.changed_population_from_r12===true&&
   candidate.r44_source_tree_sha256===expectedTree&&
   candidate.selected_repositories===18&&candidate.selected_git_origins===18&&
   candidate.max_tasks_per_repository===2&&candidate.max_tasks_per_git_origin===2&&
   candidate.ordered_tasks?.length===24&&
   Object.keys(candidate.language_quota??{}).sort().join()===Object.keys(quota).sort().join()&&
   Object.entries(quota).every(([name,count])=>candidate.language_quota[name]===count),"candidate");
 const tasks=candidate.ordered_tasks;
 need(new Set(tasks.map(task=>task.instance_id)).size===24&&
   sha(tasks.map(task=>task.instance_id).sort().join("\n")+"\n")===candidate.task_id_set_sha256&&
   tasks.every(task=>Object.keys(task).sort().join()===fields.join()&&
     fields.every(field=>typeof task[field]==="string"&&task[field].length>0)&&
     /^[a-f0-9]{40}$/.test(task.base_commit)),"source-only-tasks");
 const languages=new Map(),repos=new Map(),origins=new Map();
 for(const task of tasks){
  languages.set(task.language,(languages.get(task.language)??0)+1);
  repos.set(task.repo,(repos.get(task.repo)??0)+1);
  origins.set(task.repo_url,(origins.get(task.repo_url)??0)+1);
 }
 need(Object.entries(quota).every(([name,count])=>languages.get(name)===count)&&
   repos.size===18&&origins.size===18&&
   [...repos.values(),...origins.values()].every(count=>count<=2),"allocation");
 need(caches.schema_version==="are.g01-r13-r2-vps-cache-transfer-verify/v1"&&
   caches.status==="passed"&&caches.candidate_sha256===pins.candidate[1]&&
   caches.verified_tasks===24&&caches.verified_origins===18&&
   caches.verified_task_bindings?.length===24&&caches.model_calls===0&&caches.gold_loaded===false,
   "caches");
 const byId=new Map(caches.verified_task_bindings.map(row=>[row.instance_id,row]));
 need(byId.size===24,"cache-duplicates");
 for(const task of tasks){
  const row=byId.get(task.instance_id);
  need(row?.origin===task.repo_url&&row.base_commit===task.base_commit&&
    /^[a-f0-9]{40}$/.test(row.tree)&&existsSync(row.repository_path),"cache-binding");
  need(git(row.repository_path,"remote","get-url","origin")===task.repo_url&&
    git(row.repository_path,"rev-parse",`${task.base_commit}^{tree}`)===row.tree,
    "cache-current-identity");
 }
 need(preflight.schema_version==="are.g01-r13-r2-r44-source-index-qualification/v1"&&
   preflight.status==="source-index-qualified-not-campaign-frozen"&&
   preflight.candidate_sha256===pins.candidate[1]&&preflight.transfer_sha256===pins.caches[1]&&
   preflight.source_tree_sha256===expectedTree&&preflight.source_file_count===412&&
   preflight.worker_deadline_seconds===120&&preflight.outer_deadline_ms===125000&&
   preflight.result?.status==="passed"&&preflight.result.results?.length===24&&
   preflight.model_calls===0&&preflight.gold_loaded===false,"preflight");
 need(tasks.every((task,index)=>{
   const row=preflight.result.results[index];
   return row.instance_id===task.instance_id&&row.repository_path===byId.get(task.instance_id).repository_path&&
     row.status==="passed"&&row.local_settled===true&&row.process_group_absent===true&&
     row.forced===false&&row.model_calls===0&&/^[a-f0-9]{64}$/.test(row.index_digest);
 }),"preflight-rows");
 need(coverage.schema_version==="are.g01-r13-r2-r44-gold-index-coverage/v1"&&
   coverage.status==="passed"&&coverage.posture==="evaluator-only-no-model-no-scores"&&
   coverage.candidate_sha256===pins.candidate[1]&&coverage.transfer_sha256===pins.caches[1]&&
   coverage.preflight_sha256===pins.preflight[1]&&coverage.source_tree_sha256===expectedTree&&
   coverage.gold_paths_or_content_exported===false&&coverage.model_calls===0&&
   coverage.summary?.tasks===24&&coverage.summary.audited===24&&
   coverage.summary.gold_files===62&&coverage.summary.admitted===62&&
   coverage.summary.absent===0&&coverage.summary.excluded===0&&
   coverage.summary.worker_unavailable===0&&coverage.rows?.length===24&&
   coverage.rows.every((row,index)=>row.instance_id===tasks[index].instance_id&&
     row.status==="audited"&&row.index_digest_matches===true&&
     row.absent_gold_files===0&&row.excluded_gold_files===0),"coverage");
 need(scratch.schema_version==="are.g01-r13-r2-scratch-layout-probe/v1"&&
   scratch.status==="passed-source-retained"&&scratch.cache_receipt_sha256===pins.caches[1]&&
   scratch.tmp_consumed_bytes===3089563648&&scratch.after?.tmp_free_bytes>1342177280&&
   scratch.model_calls===0&&scratch.gold_loaded===false&&
   !existsSync(scratch.scratch_root),"scratch-retention-and-reclaim");
 need(prior.schema_version==="are.g01-campaign-definition/v1"&&prior.status==="pre-dispatch"&&
   prior.control_arm==="intent-anchor-convergence-r3"&&
   prior.candidate_arm==="intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1"&&
   prior.abstention_policy==="explicit-no-final-context-zero-r1"&&
   prior.transport_reliability==="bounded-view-and-output-cap-r1"&&
   prior.non_tool_terminal_after_convergence===true&&
   prior.span_refinement_policy==="source-only-go-selected-subspan-r1"&&
   prior.scorer?.image==="are-contextbench-scorer:g01-r1"&&
   prior.decision_rule.includes("G01 r12"),"prior-protocol");
 need(config.context_limit===8000&&config.total_tokens_per_arm===160000&&
   config.model==="glm-5.3-flash"&&config.tasks?.length===1&&
   config.tasks[0].cell_template?.limits?.total_tokens===160000&&
   config.tasks[0].cell_template?.provider_profile?.model_timeout_ms===240000,
   "base-config");
 need(tree.file_count===412&&tree.tree_sha256===expectedTree&&
   !existsSync(inputRoot)&&!existsSync(campaignRoot),"source-tree-or-roots");
 return {tasks,byId};
}

function buildDefinition({candidate,caches,preflight,coverage,scratch,prior,config,tree,tasks,byId}){
 const ordered=tasks.map(task=>({
  slug:`${task.language}-${task.repo.split("/").at(-1).toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${task.instance_id.slice(-8)}`,
  instance_id:task.instance_id,repo:task.repo,
  task_path:join(inputRoot,"tasks",`${task.instance_id}.json`),
  repository_cache:byId.get(task.instance_id).repository_path
 }));
 need(new Set(ordered.map(row=>row.slug)).size===24&&
   ordered.every(row=>/^[a-z0-9-]+$/.test(row.slug)),"slugs");
 return {
  schema_version:"are.g01-campaign-definition/v1",status:"pre-dispatch",
  hypothesis:"On a score-blind five-language 24-task changed-population cohort at paired 8K windows and symmetric 160K total-token arm caps, the unchanged ARE source-context candidate improves native Span-F1 and File-F1 while lowering known tokens and summed arm time against the unchanged intent-anchor control.",
  root:campaignRoot,source_root:sourceRoot,
  source_scratch_root:"/tmp/are-g01-product-replication-r13-source",
  base_config_path:configPath,
  control_arm:prior.control_arm,candidate_arm:prior.candidate_arm,
  transport_reliability:prior.transport_reliability,
  non_tool_terminal_after_convergence:prior.non_tool_terminal_after_convergence,
  abstention_policy:prior.abstention_policy,scorer:prior.scorer,
  ordered_tasks:ordered,
  selection_rule:"Exclude all prior G01/G02 manifested IDs. Preserve 23 r13 r1 score-blind tasks and replace only the Catch2 native-index-ineligible task with the first fixed-seed eligible clean Python task, respecting two-per-origin and repository caps. Fixed mix 1 C++/1 Java/1 JavaScript/19 Python/2 TypeScript; evaluator-only admission bits, not gold paths, values, or scores, determine eligibility.",
  decision_rule:prior.decision_rule.replace("G01 r12", "G01 r13"),
  claim_ceiling:"Private G01 r13 paired GLM-5.3-flash 8K native comparison on the frozen 24-task five-language changed-population cohort only; not full ContextBench or general ARE superiority.",
  preflight_refs:{source_supply_sha256:candidate.source_parquet_sha256,
   exposure_set_sha256:candidate.exposure_set_sha256,
   eligibility_receipt_sha256_by_group:candidate.prior_screen_receipt_sha256,
   source_only_candidate_sha256:pins.candidate[1],source_caches_sha256:pins.caches[1],
   runner_index_preflight_sha256:pins.preflight[1],gold_index_coverage_sha256:pins.coverage[1],
   scratch_probe_sha256:pins.scratch[1],source_tree_sha256:tree.tree_sha256,
   base_config_sha256:pins.config[1]},
  protocol_ref:"implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-R12-CLEAN-COHORT-CANDIDATE.md",
  open_questions:["Will all 24 pairs finish with native scores or only predeclared zero abstentions?",
   "Will root and tmpfs headroom remain within bounds after live model outputs?",
   "Will archival, label integrity, all four intervals and independent audit qualify the narrow claim?"],
  span_refinement_policy:prior.span_refinement_policy,
  source_only_candidate_sha256:pins.candidate[1],source_caches_sha256:pins.caches[1],
  source_runner_index_preflight_sha256:pins.preflight[1],prior_definition_sha256:pins.prior[1],
  source_tree_sha256:tree.tree_sha256,source_tree_file_count:tree.file_count
 };
}

function ready(readyPath,readySha){
 need(/^\/opt\/are\/evolution-runtime\/g01-r10-provider-readiness\/[A-Za-z0-9_-]+\/READY\.json$/.test(readyPath??"")&&
   /^[a-f0-9]{64}$/.test(readySha??""),"readiness-arguments");
 const bytes=readFileSync(readyPath),receipt=JSON.parse(bytes);
 need(sha(bytes)===readySha&&receipt.schema_version==="are.g01-provider-readiness/v1"&&
   receipt.status==="ready"&&receipt.model==="glm-5.3-flash"&&
   receipt.tokenizer?.status===200&&Number.isSafeInteger(receipt.tokenizer.prompt_tokens)&&
   receipt.tokenizer.prompt_tokens>0&&receipt.tiny_generation?.status===200&&
   Number.isSafeInteger(receipt.tiny_generation.output_tokens)&&
   receipt.tiny_generation.output_tokens>0&&receipt.automatic_retries===0&&
   receipt.provider_host_fingerprint_sha256==="bb6900a580e91ec8efa83d491ba9493cd8ae782c69bafaa94d12cfc856f27e2f"&&
   receipt.gateway_container_image==="sha256:dbaf783163a0d1b1e6ea7cd693f1145803df7bfaa1d23d31c41c4ffd447e3361"&&
   Number.isFinite(Date.parse(receipt.checked_at))&&Date.now()>=Date.parse(receipt.checked_at)&&
   Date.now()-Date.parse(receipt.checked_at)<600000,"provider-not-ready");
}

async function main(){
 const [mode,expectedBuilderSha,expectedProjection,readyPath,readySha]=process.argv.slice(2);
 need((mode==="--check"&&process.argv.length===3)||
   (mode==="--freeze"&&process.argv.length===7),"arguments");
 const builderSha=sha(readFileSync(fileURLToPath(import.meta.url)));
 const inputs=Object.fromEntries(Object.entries(pins).map(([name,pin])=>[name,readPinned(pin)]));
 const {bindSourceTree,prepareCampaign}=await import(pathToFileURL(join(sourceRoot,
   "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs")).href);
 const tree=bindSourceTree(sourceRoot);
 const {tasks,byId}=validateInputs({...inputs,tree});
 const definition=buildDefinition({...inputs,tree,tasks,byId});
 const projection=sha(JSON.stringify(definition));
 if(mode==="--check"){
  console.log(JSON.stringify({status:"check-passed-not-frozen",builder_sha256:builderSha,
   definition_projection_sha256:projection,source_tree_sha256:tree.tree_sha256,
   task_count:tasks.length,model_calls:0}));
  return;
 }
 need(builderSha===expectedBuilderSha&&projection===expectedProjection,"checked-builder-or-projection-drift");
 ready(readyPath,readySha);
 mkdirSync(inputRoot,{mode:0o700});mkdirSync(join(inputRoot,"tasks"),{mode:0o700});
 for(const task of tasks)writeFileSync(join(inputRoot,"tasks",`${task.instance_id}.json`),
   `${JSON.stringify(task,null,2)}\n`,{flag:"wx",mode:0o600});
 const bytes=Buffer.from(`${JSON.stringify({...definition,builder_sha256:builderSha,
   definition_projection_sha256:projection,provider_readiness_sha256_at_freeze:readySha},null,2)}\n`);
 const definitionPath=join(inputRoot,"DEFINITION.json");
 writeFileSync(definitionPath,bytes,{flag:"wx",mode:0o600});
 const campaign=prepareCampaign({definitionPath,definitionSha256:sha(bytes)});
 console.log(JSON.stringify({status:"frozen-before-dispatch",definition_path:definitionPath,
   definition_sha256:sha(bytes),campaign_path:campaign.campaign_path,
   campaign_sha256:campaign.campaign_sha256,source_tree_sha256:tree.tree_sha256,
   task_count:campaign.ordered_tasks.length,provider_readiness_sha256:readySha,model_calls:0}));
}
main().catch(error=>{console.error(JSON.stringify({status:"freeze-error",error:String(error.message)}));process.exitCode=2;});
