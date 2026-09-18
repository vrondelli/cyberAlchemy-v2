import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {computeDecisionProfileDigest} from '../../implementation/agent-reasoning-engine/packages/request-decision-router/index.mjs';
export function customerFixture(root){
  const put=(name,data)=>{const text=JSON.stringify(data,null,2)+'\n';writeFileSync(resolve(root,name),text);return createHash('sha256').update(text).digest('hex')};
  const hash=put('routes.json',{entry_route_id:'entry',routes:[{route_id:'customer-explain',objective:'Explain customer project',match:['explain'],lifecycle_state:'available',capability_ref:'customer:explain'}]});
  const decision={schema_version:'are.decision-profile/v1',profile_id:'customer-decision',profile_version:'1',authority_effect:'none',
    provenance:[{id:'route-registry',path:'routes.json',sha256:hash}],
    route_policies:[{route_id:'customer-explain',objective_kinds:['explain'],effect_classes:['local-read'],signal_additions:[],exclusion_additions:[],owner_gate_ref:null,provenance_ids:['route-registry']}],
    consequence:{safe_effects:['local-read'],consequential_effects:[],protected_effects:[],owner_gate_by_effect:{},unknown_effect_behavior:'gate',multiple_admissible_behavior:'gate',max_direct_steps:1}};
  decision.profile_digest=computeDecisionProfileDigest(decision);put('decision.json',decision);
  put('definitions.json',{concepts:[{concept_id:'customer-term',term:'Widget',current_disposition:'propose',propose:{normative_voice:'A widget is a customer-owned delivery unit.'}}]});
  put('ontology.json',{ontology_id:'customer-only',nodes:[{node_id:'customer.Widget',kind:'concept',intent:'Deliver a widget'}],edges:[]});
  writeFileSync(resolve(root,'AGENTS.md'),'Customer sentinel: violet-widget-731.\n');
  return {project_id:'widget',decision_profile:'decision.json',definition_sources:['definitions.json'],system_ontology:'ontology.json',instruction_sources:['AGENTS.md'],
    context:{source_epoch:'customer:epoch1',seed_definition_ids:['customer-term'],initial_node_ids:['customer.Widget'],required_edge_ids:[],required_edge_ids_by_node:{},omission_candidate_ids:[],universal_relation_classes:[],route_relation_classes_by_route:{},authority_posture:'candidate',effect_posture:'preflight-no-effect'},effect_defaults:{}};
}
