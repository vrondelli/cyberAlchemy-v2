#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, fsyncSync, mkdirSync, mkdtempSync, openSync, readFileSync, renameSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";
import {renderDeterministicContinuity} from "../../src/deterministic-continuity-renderer-v4.mjs";
import {LIVE_SCENARIOS_V4} from "./live-scenarios-v4.mjs";

const digest=(value)=>createHash("sha256").update(typeof value==="string"?value:canonicalJson(canonicalizeJson(value))).digest("hex");
const argument=(name)=>{const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:null;};
const cycleRoot=resolve(argument("--cycle-root")??"");
const hypothesis=JSON.parse(readFileSync(join(cycleRoot,"hypothesis-v4.json"),"utf8"));
if(hypothesis.candidate?.candidate_ref!=="deterministic-continuity-renderer/v4"||LIVE_SCENARIOS_V4.length!==20)throw Error("interaction-v4.hypothesis-invalid");
function atomicJson(path,value){mkdirSync(dirname(path),{recursive:true,mode:0o700});const temporary=`${path}.tmp-${process.pid}`;const fd=openSync(temporary,"wx",0o600);try{writeFileSync(fd,`${canonicalJson(canonicalizeJson(value))}\n`);fsyncSync(fd);}finally{closeSync(fd);}renameSync(temporary,path);const directory=openSync(dirname(path),"r");try{fsyncSync(directory);}finally{closeSync(directory);}}
const temporaryRoot=mkdtempSync(join(tmpdir(),"are-interaction-live-v4-"));
const raw=[],redacted=[];
for(const scenario of LIVE_SCENARIOS_V4){
 const started=Date.now();
 const envelope={transition:scenario.expected_transition,active_objective:scenario.active_objective,active_cycle:scenario.active_cycle,relationship_code:scenario.relationship_code,response_language:scenario.response_language,next_action:scenario.next_pending_action,clarification_needed:scenario.clarification_expected,evidence_status:scenario.evidence_status};
 const output=renderDeterministicContinuity(envelope);
 raw.push({scenario,output});
 redacted.push({scenario_id:scenario.scenario_id,input_digest:digest({envelope,user_request:scenario.user_request}),response_digest:digest(output.response),expected_transition:scenario.expected_transition,clarification_expected:scenario.clarification_expected,structural:{valid:true,transition:output.transition,active_cycle:output.active_cycle,relationship_code:output.relationship_code,response_language:output.response_language,clarification_needed:output.clarification_needed,evidence_status:output.evidence_status},provider_status:"not-applicable",elapsed_ms:Date.now()-started,usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0}});
}
const rawPath=join(temporaryRoot,"responses.json");atomicJson(rawPath,{hypothesis_digest:hypothesis.hypothesis_digest,scenarios:raw});
const material={schema_version:"are.interaction-learning-live-run/v1",cycle_id:hypothesis.cycle_id,hypothesis_digest:hypothesis.hypothesis_digest,model:"none-deterministic",provider_binding:"none",raw_response_retention:"temporary-evaluator-transfer-only",scenario_count:20,scenarios:redacted,authority_effect:"none"};
const manifest={...material,run_digest:digest(material)};const manifestPath=join(cycleRoot,"live-run-v4.json");atomicJson(manifestPath,manifest);
process.stdout.write(`${canonicalJson({ok:true,run_digest:manifest.run_digest,scenario_count:20,temporary_evaluator_path:rawPath,persisted_manifest:manifestPath,authority_effect:"none"})}\n`);
