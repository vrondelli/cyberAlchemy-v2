import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examplesRoot = resolve(packageRoot, "examples");
const repositoryExampleRoot = "cyberAlchemy-v2/ontology/governance/continuous-construction/examples";
const programId = "CA2-GOV-PROGRAM-CONTINUOUS-CONSTRUCTION-001";
const programVersion = 2;
const constructionId = "CA2-GCC-EXAMPLE-CONSTRUCTION-001";
const stages = ["canonical-definitions", "product-ontology", "business-ontology", "domainspec-source", "compiled-graph", "system-ontology", "exact-implementation-binding", "static-conformance", "runtime-evidence"];

function sha256(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
function canonical(value: any): any {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function canonicalBytes(value: unknown): string { return `${JSON.stringify(canonical(value))}\n`; }
function pretty(value: unknown): string { return `${JSON.stringify(value, null, 2)}\n`; }
function emit(relative: string, value: unknown): string {
  const content = pretty(value); const target = resolve(examplesRoot, relative);
  mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, content, "utf8"); return sha256(content);
}

const artifactDigests = new Map<string, string>();
for (const stage of stages) artifactDigests.set(stage, emit(`artifacts/${stage}.json`, {schema_version:"cav2-continuous-construction-example-stage-artifact/v1",stage,candidate:true,authority_effect:"none"}));

function stage(stageId: string, state: string) {
  return {stage:stageId,lane:"product-construction",applicable:true,state,
    artifact_ref:state === "validated" ? `${repositoryExampleRoot}/artifacts/${stageId}.json` : null,
    artifact_sha256:state === "validated" ? artifactDigests.get(stageId) : null,
    owner_gate_required:false,owner_gate_bound:false,owner_gate_ref:null,owner_gate_sha256:null};
}
function authorization(attemptId: string) {
  const relative = `authorizations/${attemptId}.json`;
  const reference = `${repositoryExampleRoot}/${relative}`;
  const record = {schema_version:"cav2-continuous-construction-authorization/v1",envelope_id:`AUTH-${attemptId}`,construction_id:constructionId,attempt_id:attemptId,program_id:programId,program_version:programVersion,subject_ref:"EXAMPLE-CONTINUOUS-CONSTRUCTION-SUBJECT",project_ref:"EXAMPLE-CONTINUOUS-CONSTRUCTION-PROJECT",permitted_stages:stages,repository_local:true,reversible:true,effect_ceiling:"none",owner_route:"example-only human owner; grants no real authority",authority_effect:"none"};
  return {reference,digest:emit(relative,record),record};
}
function attempt(attemptId: string, states: string[]) {
  const auth = authorization(attemptId);
  return {schema_version:"cav2-continuous-construction-attempt/v2",construction_id:constructionId,attempt_id:attemptId,program_id:programId,program_version:programVersion,
    authorization:{envelope_id:auth.record.envelope_id,owner_authorization_ref:auth.reference,owner_authorization_sha256:auth.digest,subject_ref:auth.record.subject_ref,project_ref:auth.record.project_ref,permitted_stages:stages,repository_local:true,reversible:true,effect_ceiling:"none"},
    stages:stages.map((id,index)=>stage(id,states[index]!)),operational_tasks:[] as any[],blockers:[],human_test_packet:null as any,human_test_observation:null as any,routine_confirmation_requested:false};
}
function operationalTask(taskId: string, state: "pending"|"blocked"|"complete"|"not_applicable", appliesToStage: string|null, blockingBasis: string) {
  return {task_id:taskId,lane:"operational-support",state,applies_to_stage:appliesToStage,blocking_basis:blockingBasis,detail:"Example operational support task.",owner_route:"example operations owner"};
}
function attemptBasis(value: any) { return {schema_version:"cav2-continuous-construction-attempt-basis/v2",construction_id:value.construction_id,attempt_id:value.attempt_id,program_id:value.program_id,program_version:value.program_version,authorization:value.authorization,stages:value.stages,operational_tasks:value.operational_tasks,blockers:value.blockers,routine_confirmation_requested:value.routine_confirmation_requested}; }
function attachGate(value: any, stageIndex: number) {
  const stageId=stages[stageIndex]!;const relative=`gates/${value.attempt_id}-${stageId}.json`;const reference=`${repositoryExampleRoot}/${relative}`;
  const scope={construction_id:value.construction_id,attempt_id:value.attempt_id,program_id:value.program_id,program_version:value.program_version,envelope_id:value.authorization.envelope_id,owner_authorization_ref:value.authorization.owner_authorization_ref,owner_authorization_sha256:value.authorization.owner_authorization_sha256,subject_ref:value.authorization.subject_ref,project_ref:value.authorization.project_ref,permitted_stages:value.authorization.permitted_stages,stage:stageId};
  const record={schema_version:"cav2-continuous-construction-owner-gate/v1",gate_id:`GATE-${value.attempt_id}-${stageId}`,construction_id:value.construction_id,attempt_id:value.attempt_id,program_id:value.program_id,program_version:value.program_version,stage:stageId,subject_ref:value.authorization.subject_ref,project_ref:value.authorization.project_ref,owner_authorization_ref:value.authorization.owner_authorization_ref,owner_authorization_sha256:value.authorization.owner_authorization_sha256,scope_sha256:sha256(canonicalBytes(scope)),decision:"accept-stage-for-bounded-attempt",owner_route:"example-only human owner; grants no real authority",authority_effect:"none",effect_authorized:false};
  const digest=emit(relative,record);value.stages[stageIndex].owner_gate_required=true;value.stages[stageIndex].owner_gate_bound=true;value.stages[stageIndex].owner_gate_ref=reference;value.stages[stageIndex].owner_gate_sha256=digest;
}
function attachPacket(value: any) {
  const relative = `packets/${value.attempt_id}.json`; const reference = `${repositoryExampleRoot}/${relative}`;
  const openResidue = value.operational_tasks.filter((task: any) => task.state === "pending" || task.state === "blocked").map((task: any) => task.task_id);
  const packet = {schema_version:"cav2-continuous-construction-human-test-packet/v1",packet_id:`PACKET-${value.attempt_id}`,construction_id:value.construction_id,attempt_id:value.attempt_id,project_ref:value.authorization.project_ref,subject_ref:value.authorization.subject_ref,program_id:value.program_id,program_version:value.program_version,owner_authorization_ref:value.authorization.owner_authorization_ref,owner_authorization_sha256:value.authorization.owner_authorization_sha256,stage_set_sha256:sha256(canonicalBytes(value.stages)),attempt_basis_sha256:sha256(canonicalBytes(attemptBasis(value))),frozen:true,human_test_procedure:"Review the immutable stage evidence and exercise the exact bounded candidate without changing any bound bytes.",requested_decision:"Confirm only the exact candidate and named next use represented by this packet.",final_decision_owner:"CyberAlchemy v2 human owner",open_residue:openResidue,rollback_path:"Restore the exact pre-attempt repository-local artifact set.",challenge_route:"CyberAlchemy v2 governance-model owner",prior_decisions:[],authority_effect:"none"};
  const digest = emit(relative,packet); value.human_test_packet={path:reference,sha256:digest}; return {reference,digest,packet};
}
function attachObservation(value: any, packet: {reference:string,digest:string}, result: "passed"|"failed") {
  const relative=`observations/${value.attempt_id}-${result}.json`;const reference=`${repositoryExampleRoot}/${relative}`;
  const record={schema_version:"cav2-continuous-construction-human-test-observation/v1",observation_id:`OBS-${value.attempt_id}-${result.toUpperCase()}`,packet_ref:packet.reference,packet_sha256:packet.digest,result,observed_by:"example human-test fixture",observation_ref:"local deterministic example observation",authority_effect:"none"};
  value.human_test_observation={path:reference,sha256:emit(relative,record)};
}

const continued=attempt("CA2-GCC-EXAMPLE-CONTINUE-001",["validated","validated","pending","pending","pending","pending","pending","pending","pending"]);continued.operational_tasks.push(operationalTask("OPS-EXAMPLE-UNRELATED-001","pending",null,"none"));
const continuedWithFutureOperation=attempt("CA2-GCC-EXAMPLE-CONTINUE-FUTURE-OPERATION-001",["validated","validated","pending","pending","pending","pending","pending","pending","pending"]);continuedWithFutureOperation.operational_tasks.push(operationalTask("OPS-EXAMPLE-FUTURE-RUNTIME-001","pending","runtime-evidence","exact-prerequisite"));
const continuedWithGate=attempt("CA2-GCC-EXAMPLE-CONTINUE-GATE-001",["validated","validated","pending","pending","pending","pending","pending","pending","pending"]);attachGate(continuedWithGate,2);
const stopped=attempt("CA2-GCC-EXAMPLE-STOP-001",["validated","validated","missing","pending","pending","pending","pending","pending","pending"]);
const humanBase=attempt("CA2-GCC-EXAMPLE-HUMAN-001",Array(9).fill("validated"));const packet=attachPacket(humanBase);
const ready=structuredClone(humanBase);const terminal=structuredClone(humanBase);attachObservation(terminal,packet,"passed");
emit("attempts/continue.json",continued);emit("attempts/continue-with-future-operation.json",continuedWithFutureOperation);emit("attempts/continue-with-owner-gate.json",continuedWithGate);emit("attempts/stop.json",stopped);emit("attempts/ready-for-human-test.json",ready);emit("attempts/request-terminal-confirmation.json",terminal);

const skipped=attempt("CA2-GCC-MUTATION-SKIPPED-001",["validated","missing","validated","pending","pending","pending","pending","pending","pending"]);
const missingGate=attempt("CA2-GCC-MUTATION-OWNER-GATE-001",["validated","validated","pending","pending","pending","pending","pending","pending","pending"]);missingGate.stages[2]!.owner_gate_required=true;
const gateWithoutEvidence=attempt("CA2-GCC-MUTATION-GATE-BOOLEAN-001",["validated","validated","pending","pending","pending","pending","pending","pending","pending"]);gateWithoutEvidence.stages[2]!.owner_gate_required=true;gateWithoutEvidence.stages[2]!.owner_gate_bound=true;
const implicit=attempt("CA2-GCC-MUTATION-IMPLICIT-001",["validated","validated","pending","pending","pending","pending","pending","pending","pending"]);implicit.routine_confirmation_requested=true;
const changedPacket=structuredClone(ready);changedPacket.human_test_packet={path:`${repositoryExampleRoot}/packets/changed.json`,sha256:packet.digest};emit("packets/changed.json",{changed:true,authority_effect:"none"});
const changedAuthorization=attempt("CA2-GCC-MUTATION-CHANGED-AUTH-001",["validated","pending","pending","pending","pending","pending","pending","pending","pending"]);changedAuthorization.authorization.owner_authorization_ref=`${repositoryExampleRoot}/authorizations/changed.json`;emit("authorizations/changed.json",{changed:true,authority_effect:"none"});
const fabricatedStage=attempt("CA2-GCC-MUTATION-FABRICATED-STAGE-001",["validated","pending","pending","pending","pending","pending","pending","pending","pending"]);fabricatedStage.stages[0]!.artifact_sha256=sha256("fabricated stage digest");
const changedBasis=structuredClone(ready);const changedArtifactRelative="artifacts/runtime-evidence-after-freeze.json";const changedArtifactRef=`${repositoryExampleRoot}/${changedArtifactRelative}`;const changedArtifactDigest=emit(changedArtifactRelative,{schema_version:"cav2-continuous-construction-example-stage-artifact/v1",stage:"runtime-evidence",candidate:"changed-after-freeze",authority_effect:"none"});changedBasis.stages[8]!.artifact_ref=changedArtifactRef;changedBasis.stages[8]!.artifact_sha256=changedArtifactDigest;
const incompletePacket=attempt("CA2-GCC-MUTATION-INCOMPLETE-PACKET-001",Array(9).fill("validated"));const incomplete=attachPacket(incompletePacket);delete (incomplete.packet as any).rollback_path;incompletePacket.human_test_packet.sha256=emit(`packets/${incompletePacket.attempt_id}.json`,incomplete.packet);
const wrongObservation=structuredClone(terminal);const wrongObsRelative="observations/wrong-packet.json";const wrongObsRef=`${repositoryExampleRoot}/${wrongObsRelative}`;const wrongObs={schema_version:"cav2-continuous-construction-human-test-observation/v1",observation_id:"OBS-WRONG-PACKET",packet_ref:packet.reference,packet_sha256:sha256("different packet"),result:"passed",observed_by:"hostile fixture",observation_ref:"wrong packet mutation",authority_effect:"none"};wrongObservation.human_test_observation={path:wrongObsRef,sha256:emit(wrongObsRelative,wrongObs)};
const operationalPrerequisite=attempt("CA2-GCC-MUTATION-OPERATIONAL-PREREQUISITE-001",["validated","validated","pending","pending","pending","pending","pending","pending","pending"]);operationalPrerequisite.operational_tasks.push(operationalTask("OPS-EXAMPLE-BUSINESS-INPUT-001","pending","business-ontology","exact-prerequisite"));
const operationalBoundary=attempt("CA2-GCC-MUTATION-OPERATIONAL-BOUNDARY-001",["validated","validated","pending","pending","pending","pending","pending","pending","pending"]);operationalBoundary.operational_tasks.push(operationalTask("OPS-EXAMPLE-BUSINESS-CREDENTIAL-001","blocked","business-ontology","credential-boundary"));
const ambiguousOperationalBoundary=attempt("CA2-GCC-MUTATION-AMBIGUOUS-OPERATIONAL-BOUNDARY-001",["validated","validated","pending","pending","pending","pending","pending","pending","pending"]);ambiguousOperationalBoundary.operational_tasks.push(operationalTask("OPS-EXAMPLE-AMBIGUOUS-AUTHORITY-001","blocked",null,"authority-boundary"));

for (const [name,value] of Object.entries({"skipped-predecessor":skipped,"missing-owner-gate":missingGate,"owner-gate-boolean-only":gateWithoutEvidence,"implicit-confirmation":implicit,"changed-packet":changedPacket,"changed-authorization":changedAuthorization,"fabricated-stage-digest":fabricatedStage,"attempt-basis-changed":changedBasis,"incomplete-packet":incompletePacket,"observation-wrong-packet":wrongObservation,"operational-prerequisite":operationalPrerequisite,"operational-boundary":operationalBoundary,"ambiguous-operational-boundary":ambiguousOperationalBoundary})) emit(`mutations/${name}.json`,value);
process.stdout.write("built_examples=43\n");
