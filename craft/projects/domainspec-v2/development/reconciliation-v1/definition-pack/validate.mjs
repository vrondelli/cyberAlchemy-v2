import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCatalog,buildInput,buildOntology,metaIds,dir,root,hash,json} from './build.mjs';
export const load = name => JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
export function validate(catalog=load('catalog.json'),ontology=load('../ontology/business-candidate.json'),result=load('runtime-result.json')) {
  const errors=[];const check=(value,label)=>{if(!value)errors.push(label);};
  const expected=buildCatalog();
  check(json(catalog)===json(expected),'catalog-source-or-meaning-drift');
  check(json(ontology)===json(buildOntology(catalog)),'ontology-definition-projection-drift');
  const ids=catalog.concepts.map(c=>c.concept_id);const idSet=new Set(ids);
  check(ids.length===idSet.size,'duplicate-concept');
  check(json(ids)===json(catalog.required_concept_ids),'required-concept-closure');
  check(metaIds.every(id=>idSet.has(id)),'13-backend-types-required');
  check(!idSet.has('DS-D1.10'),'retired-saga-not-active');
  check(Array.from({length:32},(_,i)=>'domainspec-v2-D'+(i+18)).every(id=>idSet.has(id)),'D18-D49-required');
  check(catalog.concepts.filter(c=>c.signature).length===31,'31-signatures-required');
  const work=JSON.parse(fs.readFileSync(path.join(root,'development/reconciliation-v1/WORK-ITEMS.json')));
  const tasks=new Set(work.work_items.map(w=>w.id));
  for(const c of catalog.concepts){
    check(['reuse','propose','open'].includes(c.disposition),'disposition:'+c.concept_id);
    check(c.authority_effect==='none','authority:'+c.concept_id);
    check(c.consumer_refs?.length>0&&c.consumer_refs.every(x=>tasks.has(x)),'consumers:'+c.concept_id);
    check((c.definition_refs??[]).every(id=>idSet.has(id)),'definition-reference:'+c.concept_id);
    check(Boolean(c.owner_route),'owner:'+c.concept_id);
    if(c.disposition==='propose')for(const key of ['normative_voice','formal_voice','plain_language_voice','domain_context_voice','boundary'])check(Boolean(c[key]),key+':'+c.concept_id);
    if(c.disposition==='reuse'){check(hash(fs.readFileSync(path.join(root,c.source.path)))===c.source.sha256,'source-digest:'+c.concept_id);check(hash(c.source.excerpt)===c.source.excerpt_sha256,'excerpt-digest:'+c.concept_id);}
    if(c.disposition==='open')check(Boolean(c.stop_condition&&c.next_action&&c.question&&c.reason),'open-disposition:'+c.concept_id);
  }
  const input=buildInput(catalog);
  check(json(load('runtime-input.json'))===json(input),'runtime-input-drift');
  check(result.validation.valid===true&&result.validation.validation_scope==='deterministic-structure-only','runtime-structural-validation');
  check(result.validation.handoff_ready===false&&result.definition_pack.open_questions.length===3,'open-meaning-must-block-handoff');
  check(json([...result.definition_pack.required_concepts.map(c=>c.concept_id)].sort())===json([...ids].sort()),'runtime-concept-closure');
  for(const c of catalog.concepts){const d=result.definition_pack.concept_dispositions.filter(x=>x.concept_id===c.concept_id);check(d.length===1&&d[0].disposition===c.disposition,'runtime-disposition:'+c.concept_id);if(c.disposition==='propose')check(d[0]?.candidate_definition?.normative_voice===c.normative_voice,'runtime-meaning:'+c.concept_id);if(c.disposition==='reuse')check(d[0]?.definition_ref===input.responses.find(x=>x.concept_id===c.concept_id).payload.definition_ref,'runtime-reference:'+c.concept_id);}
  check(ontology.authority_effect==='none'&&ontology.status==='definition-backed-candidate-not-compiled','ontology-authority');
  return {schema_version:'domainspec.dsr006-validation/v1-candidate',task_id:'DSR-006',status:errors.length?'fail':'pass',counts:{concepts:ids.length,reuse:88,propose:15,open:3,backend_types:13,signatures:31,method_definitions:32},validation_scope:'Candidate source/disposition/reference closure, not product runtime or proof truth',authority_effect:'none',errors,open_questions_ref:'OPEN-QUESTIONS.md'};
}
export function admissibleSignature(catalog,verb,source,target,scope) {
  const signatures=catalog.concepts.filter(c=>c.signature).map(c=>c.signature);
  const member=(declared,value)=>(Array.isArray(declared)?declared:declared.split('|').map(x=>x.trim())).includes(value);
  return signatures.some(r=>r.id===verb&&member(r.source_types??r.source_type,source)&&member(r.target_types??r.target_type,target)&&r.feature_scope.includes(scope));
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const result=validate();console.log(json(result));if(result.errors.length)process.exitCode=1;}
