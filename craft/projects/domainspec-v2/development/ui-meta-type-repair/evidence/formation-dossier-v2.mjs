import { buildEnvelope } from "../contracts/canonical-json-v1.mjs";

export const V2_ORDER=["independent-positive","stable-contrast","label-erasure","criterion-erasure","changed-consequence","typed-negatives","corpus-bound-portability","owner-firewall"];
const REQUIRED_STATES=["missing","missing","missing","missing","pass","pass","missing","pass"];
const PROHIBITED=["dossier-outcome-is-not-semantic-identity","defer-is-not-collapse-or-demotion","policy-missing-is-not-fail","route-open-is-not-signature-evidence","indexing-is-not-activation-or-promotion"];

export function createFormationDossierV2(input){
  for(const key of ["score","weight","weights","threshold"])if(Object.hasOwn(input,key)||input.conjuncts?.some((entry)=>Object.hasOwn(entry,key)))throw new TypeError(`${key} is prohibited`);
  if(!Array.isArray(input.conjuncts)||input.conjuncts.length!==8)throw new TypeError("dossier v2 requires eight conjuncts");
  input.conjuncts.forEach((entry,index)=>{if(entry.id!==V2_ORDER[index])throw new TypeError(`conjunct ${index+1} must be ${V2_ORDER[index]}`);if(entry.state!==REQUIRED_STATES[index])throw new TypeError(`${entry.id} must be ${REQUIRED_STATES[index]}`);if(!Array.isArray(entry.evidence_handles))throw new TypeError(`${entry.id} requires evidence handles`);if(entry.state==="pass"&&entry.evidence_handles.length===0)throw new TypeError(`${entry.id} pass requires evidence`);});
  const planes=["mutation","reroute","corpus","relationship_packet","dossier_policy","relationship_decision"];
  for(const plane of planes)requireHandle(input.producer_handles?.[plane],plane);
  requireGeneration(input.predecessor_generation_id,"predecessor_generation_id");
  const semantic={schema_version:"ui-repair.formation-dossier.v2",subject:input.subject,predecessor_generation_id:input.predecessor_generation_id,producer_handles:input.producer_handles,conjuncts:input.conjuncts,outcome:"DEFER",next_owner:"owner:evidence-repair",prohibited_inferences:PROHIBITED};
  const envelope=buildEnvelope({contractId:"ui-repair.formation-dossier",contractVersion:"2.0.0",semanticFields:Object.keys(semantic),record:semantic,status:"defer",predecessorGenerationId:input.predecessor_generation_id,inputHandles:Object.values(input.producer_handles).map((entry)=>entry.generation_id).sort(),createdAt:input.created_at});return{...envelope,semantic};
}
function requireHandle(value,label){if(!value||!/^record:sha256:[a-f0-9]{64}$/.test(value.record_id)||!/^sha256:[a-f0-9]{64}$/.test(value.content_digest)||!/^generation:sha256:[a-f0-9]{64}$/.test(value.generation_id))throw new TypeError(`${label} handle is invalid`);}
function requireGeneration(value,label){if(typeof value!=="string"||!/^generation:sha256:[a-f0-9]{64}$/.test(value))throw new TypeError(`${label} is invalid`);}
