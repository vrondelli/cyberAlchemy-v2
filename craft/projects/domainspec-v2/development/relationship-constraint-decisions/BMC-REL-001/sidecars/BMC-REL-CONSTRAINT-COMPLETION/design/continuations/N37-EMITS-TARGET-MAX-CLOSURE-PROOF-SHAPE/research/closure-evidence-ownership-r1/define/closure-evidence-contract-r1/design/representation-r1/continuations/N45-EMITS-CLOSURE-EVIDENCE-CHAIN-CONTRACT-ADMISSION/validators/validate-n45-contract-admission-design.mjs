#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const selfTest = process.argv.includes("--self-test");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function findRepo(start) { let p=start; while(p!==dirname(p)){ if(existsSync(resolve(p,"AGENTS.md"))&&existsSync(resolve(p,"projects"))) return p; p=dirname(p); } throw new Error("repo root not found"); }
const repo=findRepo(root); let checks=0;
function assert(v,m){checks+=1;if(!v)throw new Error(m);}
function text(p){return readFileSync(p,"utf8");} function json(p){return JSON.parse(text(p));}
function sha(v){return createHash("sha256").update(v).digest("hex");} function digest(p){return sha(readFileSync(p));}
function deep(v){if(Array.isArray(v))return v.map(deep);if(v&&typeof v==="object")return Object.fromEntries(Object.keys(v).sort().map(k=>[k,deep(v[k])]));return v;}
function stable(v){return sha(JSON.stringify(deep(v)));} function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}

const required=["ARCHITECTURE-BUNDLE.md","DESIGN-AUTHORED-CONCERNS.json","DESIGN-CONTEXT.md","DESIGN-DECISION-EXAMPLES.md","DESIGN-DENOMINATOR-RECEIPT.json","DESIGN-DISTILL-VALIDATION.md","DESIGN-PLANNED-WITNESSES.json","DESIGN-RESULT.md","DESIGN-RISKS-AND-GAPS.md","DESIGN-SCOPE-MANIFEST.json","DESIGN-SELECTION-RESULT.json","DESIGN-TRANSPORT.json","INVOKE-PLAN-ENTRY-HANDOFF.json","decisions/N45-EMITS-CLOSURE-EVIDENCE-CHAIN-CONTRACT-ADMISSION/DECISION-GATE.md","decisions/N45-EMITS-CLOSURE-EVIDENCE-CHAIN-CONTRACT-ADMISSION/OPTION-ADMISSIBILITY-REQUEST.json","decisions/N45-EMITS-CLOSURE-EVIDENCE-CHAIN-CONTRACT-ADMISSION/OPTION-PREFILTER-RECEIPT.json","decisions/N45-EMITS-CLOSURE-EVIDENCE-CHAIN-CONTRACT-ADMISSION/OWNER-SELECTION-RECEIPT.json"];
for(const f of required)assert(existsSync(resolve(root,f)),`missing ${f}`);

const manifest=json(resolve(root,"DESIGN-SCOPE-MANIFEST.json"));const mm={...manifest};delete mm.input_digest;
assert(manifest.target_id==="BMC-REL-NONNUMERIC-45-EMITS-CLOSURE-EVIDENCE-CHAIN-CONTRACT-ADMISSION","target drift");
assert(stable(mm)===manifest.input_digest,"manifest digest drift");assert(manifest.target_footprint.inclusions.length===8,"source count drift");
for(const s of manifest.target_footprint.inclusions){assert(existsSync(resolve(repo,s.path)),`missing source ${s.selector}`);assert(digest(resolve(repo,s.path))===s.digest,`source drift ${s.selector}`);}
const denominator=json(resolve(root,"DESIGN-DENOMINATOR-RECEIPT.json"));const dm={...denominator};delete dm.receipt_digest;
assert(denominator.verdict==="pass"&&denominator.manifest_input_digest===manifest.input_digest,"denominator drift");assert(stable(dm)===denominator.receipt_digest,"denominator digest drift");
const selection=json(resolve(root,"DESIGN-SELECTION-RESULT.json"));const sm={...selection};delete sm.result_digest;
assert(selection.verdict==="pass"&&selection.fixed_point===true&&selection.pass_1_digest===selection.pass_2_digest,"selection fixed point drift");assert(selection.manifest_input_digest===manifest.input_digest&&selection.denominator_receipt_digest===denominator.receipt_digest,"selection binding drift");assert(stable(sm)===selection.result_digest,"selection result drift");

const gate=resolve(root,"decisions/N45-EMITS-CLOSURE-EVIDENCE-CHAIN-CONTRACT-ADMISSION");const request=json(resolve(gate,"OPTION-ADMISSIBILITY-REQUEST.json"));const receipt=json(resolve(gate,"OPTION-PREFILTER-RECEIPT.json"));
const presented=["BMC-REL-NONNUMERIC-45-A-ADMIT-COORDINATED-CANDIDATE-CLOSURE-EVIDENCE-CHAIN-CONTRACT","BMC-REL-NONNUMERIC-45-B-DEFER","BMC-REL-NONNUMERIC-45-C-STOP"];
const rejected=["BMC-REL-NONNUMERIC-45-W-ADMIT-ENVELOPE-ONLY","BMC-REL-NONNUMERIC-45-X-COMPILER-ATTESTS-COMPLETENESS","BMC-REL-NONNUMERIC-45-Y-EVALUATOR-OWNS-SEMANTICS-OR-ACCEPTANCE","BMC-REL-NONNUMERIC-45-Z-BUNDLE-IMPLEMENTATION-PACKET-PROFILE-OR-RELEASE"];
assert(stable(request)===receipt.requestDigest,"request digest drift");assert(receipt.routeOutcome==="gate"&&receipt.decisionGateRequired===true&&receipt.directOptionId===null,"gate routing drift");assert(equal(receipt.presentedOptionIds,presented)&&equal(receipt.admissibleOptionIds,presented),"presented options drift");assert(equal(receipt.rejectedOptions.map(x=>x.optionId),rejected),"rejected options drift");
const action=request.candidates.find(x=>x.optionId===presented[0]);assert(action.structuralStatus==="admissible"&&action.hazardClass==="authority"&&action.ownerGate==="relationship-validation-contract-owner:owner-decision","action authority shape drift");
for(const id of presented.slice(1)){const x=request.candidates.find(y=>y.optionId===id);assert(x.structuralStatus==="admissible"&&x.hazardClass==="reversible"&&x.ownerGate===null,`${id} shape drift`);}
const ownerSelection=json(resolve(gate,"OWNER-SELECTION-RECEIPT.json"));
assert(ownerSelection.selection.response==="A"&&ownerSelection.selection.selected_option_id===presented[0],"N45 selection drift");
assert(ownerSelection.admissibility_binding.requestDigest===receipt.requestDigest&&ownerSelection.admissibility_binding.selected_option_admitted===true&&ownerSelection.admissibility_binding.selected_option_presented===true,"N45 selection binding drift");
assert(ownerSelection.authorization_boundary.coordinated_candidate_design_contract_admitted===true&&ownerSelection.authorization_boundary.plan_authoring_authorized_by_this_receipt===false&&ownerSelection.authorization_boundary.repository_authority_effect==="none","N45 authorization ceiling drift");

const source=(selector)=>json(resolve(repo,manifest.target_footprint.inclusions.find(x=>x.selector===selector).path));
const n42=source("n42-owner-a"),n43v=source("n43-validation"),n43c=source("n43-closeout"),n44v=source("n44-validation"),n44c=source("n44-closeout");
assert(n42.selection.response==="A"&&n42.selection.selected_option_id==="BMC-REL-NONNUMERIC-42-A-INLINE-EXACT-PAYLOAD-SETS","N42 binding drift");
assert(n43v.result==="pass"&&n43v.schema_admitted===false&&n43c.status==="proposal-complete-not-admitted","N43 proposal state drift");
assert(n44v.result==="pass"&&n44v.schema_admitted===false&&n44c.status==="proposal-complete-not-admitted","N44 proposal state drift");
assert(n44v.result_fixtures===4&&n44v.hostile_probes_rejected===18,"N44 validation coverage drift");

const architecture=text(resolve(root,"ARCHITECTURE-BUNDLE.md"));for(let i=1;i<=6;i+=1)assert(architecture.includes(`## ${i}.`),`view ${i} missing`);
const examples=text(resolve(root,"DESIGN-DECISION-EXAMPLES.md"));for(const rung of ["## Low","## Medium","## Complex"])assert(examples.includes(rung),`${rung} missing`);assert(examples.includes("A/defer/stop covered evenly")&&examples.includes("decision effect: none"),"example contract drift");
const distill=text(resolve(root,"DESIGN-DISTILL-VALIDATION.md"));assert(distill.includes("Mode: Standard")&&distill.includes("## Round 1")&&distill.includes("## Round 2"),"Distill trace drift");
const transport=json(resolve(root,"DESIGN-TRANSPORT.json"));assert(transport.selection===presented[0]&&transport.decision_gate_required===true&&transport.authority_effect==="none","transport selection/authority drift");assert(transport.result==="owner-selected-plan-entry-handoff-ready"&&transport.next_route==="invoke:plan"&&transport.plan_authoring_started===false,"transport next route drift");assert(transport.canonical_mutation===false&&transport.packet_mutation===false&&transport.profile_admission===false&&transport.implementation_authorized===false&&transport.d06_reopened===false,"transport scope inflation");
const planEntry=json(resolve(root,"INVOKE-PLAN-ENTRY-HANDOFF.json"));
assert(digest(resolve(gate,"OWNER-SELECTION-RECEIPT.json"))===transport.owner_selection_receipt_sha256,"transport owner receipt hash drift");
assert(digest(resolve(root,"INVOKE-PLAN-ENTRY-HANDOFF.json"))===transport.plan_entry_handoff_sha256,"transport Plan-entry hash drift");
assert(planEntry.status==="blocked-pending-plan-activation-inputs"&&planEntry.target_mode==="invoke:plan","plan entry status drift");
assert(planEntry.approved_design_target.selected_option_id===presented[0]&&planEntry.approved_design_target.n43_schema_sha256==="410c2f6f62355d532c98d920f70adc240d760d08484d89d2c49186ca8dacdec9"&&planEntry.approved_design_target.n44_schema_sha256==="9e200fe8ce4f7ad4d9c440fe700648c85b782380ba8789005b1d2ff1b91b2430","plan entry Design binding drift");
assert(planEntry.activation_inputs.approved_stable_design_outputs===true&&planEntry.activation_inputs.source_design_references===true,"plan entry approved sources lost");
for(const [key,value] of Object.entries(planEntry.activation_inputs).filter(([key])=>!["approved_stable_design_outputs","source_design_references"].includes(key)))assert(value===false,`plan activation input inferred ${key}`);
assert(planEntry.authority_boundary.plan_authoring_started===false&&planEntry.authority_boundary.work_pack_created===false&&planEntry.authority_boundary.mutation_ready===false&&planEntry.authority_boundary.authority_effect==="none","plan entry authority inflation");
assert(planEntry.known_plan_contract_gaps.length===1&&planEntry.known_plan_contract_gaps[0].path===".agents/skills/invoke/development/PLAN-ARTIFACT-BOUNDARIES.md"&&!existsSync(resolve(repo,planEntry.known_plan_contract_gaps[0].path)),"Plan contract gap drift");

const preserved={
"projects/domainspec-v2/definitions/relationships/relationships.yml":"82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1",
"projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json":"a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0",
"projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json":"d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7",
"projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs":"69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975"};
for(const [p,d] of Object.entries(preserved))assert(digest(resolve(repo,p))===d,`preserved target drift ${p}`);

function boundary(v){if(!v.n43||!v.n44)throw new Error("partial chain");if(!v.n45Selected)throw new Error("N45 selection lost");if(v.compilerCompleteness)throw new Error("compiler authority");if(v.evaluatorSemantics||v.packetAcceptance)throw new Error("evaluator authority");if(v.implementation||v.profile||v.release||v.planStarted)throw new Error("effect bundle");if(v.mixedSnapshot||v.currentness)throw new Error("identity overreach");if(v.d06)throw new Error("D06 reopened");return true;}
const boundaryBaseline={n43:true,n44:true,n45Selected:true,compilerCompleteness:false,evaluatorSemantics:false,packetAcceptance:false,implementation:false,profile:false,release:false,planStarted:false,mixedSnapshot:false,currentness:false,d06:false};
assert(boundary(boundaryBaseline)===true,"positive boundary failed");let hostileRejected=0;
if(selfTest){for(const key of Object.keys(boundaryBaseline)){const p={...boundaryBaseline,[key]:!boundaryBaseline[key]};let rejectedProbe=false;try{boundary(p);}catch{rejectedProbe=true;}assert(rejectedProbe,`hostile accepted ${key}`);hostileRejected+=1;}}

console.log(JSON.stringify({result:"pass",checks,sources:manifest.target_footprint.inclusions.length,fixed_point:selection.fixed_point,six_views:6,complexity_examples:3,presented_options:presented.length,rejected_controls:rejected.length,hostile_probes_rejected:hostileRejected,preserved_targets:Object.keys(preserved).length,n45_selection:presented[0],plan_entry_status:planEntry.status,authority_effect:"none"},null,2));
