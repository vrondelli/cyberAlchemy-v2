import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

export const dir = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(dir, '../../..');
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export const json = value => JSON.stringify(value, null, 2) + '\n';
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const definitions = 'definitions/DEFINITIONS.md';
const cards = 'definitions/meta-types/meta-types.md';
const relationships = 'definitions/relationships/relationships.yml';
const bmc = 'development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md';
export const metaIds = [1,2,3,4,5,6,7,8,9,11,12,13,14].map(n=>'DS-D1.'+n);
const sections = p => read(p).split(/(?=^## )/m).filter(x=>x.startsWith('## '));
const voice = (text, label, next) => {
  const start=text.indexOf(label); if(start<0)return null;
  let body=text.slice(start+label.length).trim();
  const end=next.map(x=>body.indexOf(x)).filter(x=>x>=0);
  return end.length?body.slice(0,Math.min(...end)).trim():body;
};
function source(p, selector, text) {
  return {path:p,selector,sha256:hash(read(p)),excerpt_sha256:hash(text),excerpt:text};
}
export function buildCatalog() {
  const concepts=[];
  for(const p of [definitions,cards])for(const s of sections(p)) {
    const heading=s.split('\n')[0];
    const id=heading.match(/^## (DS-D1(?:\.\d+)?|DS-D2|DS-D8|domainspec-v2-D\d+)(?=[ .—])/u)?.[1];
    if(!id || !(metaIds.includes(id)||['DS-D1','DS-D2','DS-D8'].includes(id)||(p===definitions&&Number(id.split('-D')[1])>=18&&Number(id.split('-D')[1])<=49)))continue;
    const historical=id==='domainspec-v2-D26';
    concepts.push({concept_id:id,term:heading.replace(/^## /,''),disposition:'reuse',
      owner_route:'DomainSpec definitions-governance (source owner)',status:historical?'superseded-reference-only':'owned-source-reuse',
      authority_effect:'none',source:source(p,heading,s),
      formal_voice:voice(s,'Formal voice:', ['Plain-language voice:'])??voice(s,'Formal voice (historical, non-authoritative):',['Plain-language voice:'])??'Exact source section governs this registry reference.',
      plain_language_voice:voice(s,'Plain-language voice:',['Domain-context voice:','DomainSpec-context voice:'])??'Reuse the exact source registry; this pack does not re-admit its members.',
      domain_context_voice:voice(s,'Domain-context voice:',['Use carefully:','Misuse warning:','Validation implications:','Challenge contract:'])??voice(s,'DomainSpec-context voice:',['###','Use carefully:'])??'See exact source section and current support matrix for independent implementation state.',
      boundary:historical?'D26 is superseded by D27; its historical dual-authorship rule is not active.':'Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.',
      context:'DomainSpec reconciliation; preserve distinction and identity before compiler representation.',
      consumer_refs:['DSR-007','DSR-018','DSR-030'],definition_refs:[],plane:id.startsWith('DS-D')?'domain':'governance'});
  }
  const registry=JSON.parse(read(relationships));
  for(const r of registry.signatures)concepts.push({concept_id:'DS-D8:'+r.id,term:r.id,disposition:'reuse',owner_route:'DomainSpec definitions-governance (DS-D8 source owner)',authority_effect:'none',status:'owned-source-reuse',source:source(relationships,'/signatures/'+registry.signatures.indexOf(r),JSON.stringify(r)),signature:r,formal_voice:JSON.stringify({source:r.source_types??r.source_type,target:r.target_types??r.target_type,scope:r.feature_scope,multiplicity:r.multiplicity}),plain_language_voice:r.semantics,domain_context_voice:r.examples.join('; '),boundary:'Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.',consumer_refs:['DSR-008','DSR-010','DSR-031'],definition_refs:['DS-D2','DS-D8','domainspec-v2-D18'],plane:'relationship'});
  for(const s of sections(bmc)) {
    const id=s.match(/^## (BMC-REL-(?:D0[1-8]|RQ1))\s/)?.[1];if(!id)continue;
    const selections=[...s.matchAll(/^Selected (?:option|disposition):.*$/gm)].map(x=>x[0]);
    // D01 selection is in the following top-level disposition section.
    const body=id==='BMC-REL-D01'?read(bmc).slice(read(bmc).indexOf('## BMC-REL-D01'),read(bmc).indexOf('## BMC-REL-D02')):s;
    concepts.push({concept_id:id,term:id+' selected meaning',disposition:'reuse',owner_route:'DomainSpec relationship owner (recorded source decision)',authority_effect:'none',status:'source-decision-reuse-not-fresh-receipt',source:source(bmc,'## '+id,body),formal_voice:id==='BMC-REL-D01'?'BMC-REL-D01-B2-ORTHOGONAL-STRICT-PROFILES':selections.join('\n'),plain_language_voice:'Reuse the selected facet only; other unresolved facets and missing exact receipts are not closed.',domain_context_voice:'Downstream BMC reconciliation must preserve count bases, closure, ownership and provenance distinctions.',boundary:'A source decision is not packet-wide admission or evidence recovery. Seven missing BMC references remain unresolved.',consumer_refs:['DSR-004','DSR-008','DSR-010'],definition_refs:['DS-D8','domainspec-v2-D18','domainspec-v2-D27'],plane:'relationship'});
  }
  const candidates=JSON.parse(fs.readFileSync(path.join(dir,'candidates.json')));
  concepts.push(...candidates.concepts);
  concepts.sort((a,b)=>a.concept_id.localeCompare(b.concept_id));
  const matrixPath='development/reconciliation-v1/contracts/support-matrix.json';
  return {schema_version:'domainspec.reconciliation-definition-catalog/v1-candidate',task_id:'DSR-006',authority_effect:'none',goal:'Reconcile existing DomainSpec meanings and user-facing declarative intent before implementation.',goal_owner:'DomainSpec meaning owner (role; person unassigned)',user_confirmation:'Candidate authorship requested; individual proposed meanings not separately confirmed.',context_provenance:[{kind:'explicit',ref:'current-conversation',value:'User constraints paraphrased in CONTEXT.md'},{kind:'current-window-inference',ref:'current-conversation',value:'do it resolves to the proposed DSR-006, not all remaining work'},{kind:'saved-session',ref:'none',value:'No saved interview answers supplied'}],context_sufficiency:{status:'sufficient-for-bounded-candidate-authorship',requirement_digest:JSON.parse(fs.readFileSync(path.join(dir,'preservation-before.json'))).planning_preimages.find(p=>p.path.endsWith('/WORK-ITEMS.json')).sha256,candidate_digest:hash(json(candidates)),evaluator:'Explicit task/dependency/source coverage in CONTEXT.md; native Define runtime structure check separate',residue:'OPEN-QUESTIONS.md'},source_bindings:[...new Set(concepts.filter(c=>c.source).map(c=>c.source.path)),matrixPath].map(p=>({path:p,sha256:hash(read(p))})),concepts,required_concept_ids:concepts.map(c=>c.concept_id),allowed_uses:['review','meaning-refinement','bounded fixture design'],blocked_actions:['canonical-promotion','infer-owner-approval','compile-unreviewed-meaning','claim-product-conformance'],refresh_route:'Rerun source-binding checks; challenge the exact source owner for owned meanings, or reopen this candidate through Define.',open_questions_ref:'OPEN-QUESTIONS.md'};
}
export function buildInput(catalog) {
  return {concepts:catalog.concepts.map(c=>({concept_id:c.concept_id,term:c.term,question:c.question??'What meaning is required for '+c.term+'?',owner_route:c.owner_route})),responses:catalog.concepts.map(c=>({concept_id:c.concept_id,action:c.disposition,payload:c.disposition==='reuse'?{definition_ref:c.source.path+'#'+c.source.selector+'@sha256:'+c.source.sha256}:c.disposition==='propose'?{definition:c.normative_voice,plain_explanation:c.plain_language_voice,boundary:c.boundary}:{reason:c.reason,next_action:c.next_action}}))};
}
export function buildOntology(catalog) {
  return {schema_version:'domainspec.reconciliation-business-ontology/v1-candidate',task_id:'DSR-006',authority_effect:'none',status:'definition-backed-candidate-not-compiled',definition_catalog_ref:'../definition-pack/catalog.json',definition_catalog_sha256:hash(json(catalog)),product:{name:'DomainSpec',job:'Turn declared domain meanings into checked typed graphs and evidence-bound generated code.',beneficiaries:['Domain authors','Alch frontend authors','Compiler maintainers','Target implementers','Assurance and release reviewers'],value:'One meaningful source of domain intent with traceable implementation, fewer duplicated rules and explicit compatibility.',non_goals:['ARE-specific configuration','universal record metatype','database selection','new unadmitted graph verbs','product release or admission']},nodes:catalog.concepts.map(c=>({id:c.concept_id,label:c.term,plane:c.plane,definition_ref:c.concept_id,disposition:c.disposition,owner_route:c.owner_route,consumer_refs:c.consumer_refs})),review_links:catalog.concepts.flatMap(c=>(c.definition_refs??[]).map(to=>({from:c.concept_id,to,kind:'meaning-dependency',status:'candidate-review-link-not-DS-D8-edge'}))),canonical_signature_refs:catalog.concepts.filter(c=>c.signature).map(c=>c.concept_id),invariants:['Every node resolves to exactly one disposition.','Review labels cannot redefine source meanings.','A semantic category is not an emitted data shape.','Evidence does not transition owner-controlled admission.'],acceptance:{candidate:'All 13 backend types, 31 signatures, D18-D49 and named consumers are reference-complete with separating evidence.',product:'Unproven here; requires selected vertical and full support-matrix obligations.'},open_questions_ref:'../definition-pack/OPEN-QUESTIONS.md'};
}
export function render(catalog,result) {
  const lines=['# DomainSpec reconciliation — Define result','','Candidate review document; not a released product manual. No canonical promotion or implementation authority.','',`Pack: ${result.definition_pack.pack_id}`,`Session: ${result.session.session_id} (scripted, non-durable runtime; exact result saved in runtime-result.json).`,'',`Concept dispositions: ${catalog.concepts.length}. Native validation: ${result.validation.validation_scope}. Downstream handoff is blocked by explicit open dispositions.`, '', '## What this changes in our model','', 'Entity remains identity-bearing; Value Object remains value-equal. A record is only a data shape. Calculations remain pure, mappers receive explicit values, policies select behavior using declared rules in the proposed authoring profile, and state-machine triggers remain separate from effects.', '', 'These are candidate clarifications and exact source reuses, not newly implemented Alch syntax. The business ontology maps the meanings without adding canonical graph verbs. Source cards may contain older implementation-era prose; the frozen support matrix owns the current observed state.','','## Complete concept dispositions',''];
  for(const c of catalog.concepts){lines.push('### '+c.term,'',`ID: ${c.concept_id} · ${c.disposition} · owner: ${c.owner_route}`,'',`Consumers: ${c.consumer_refs.join(', ')}`,'');if(c.source)lines.push(`Source: [${c.source.path}](${path.join(root,c.source.path)}) — selector ${c.source.selector}; SHA-256 ${c.source.sha256}.`,'');if(c.disposition==='open')lines.push(c.question,'',c.reason,'',`Stop condition: ${c.stop_condition}`,`Next action: ${c.next_action}`,'');else lines.push('Formal / exact contract:','','```text',c.formal_voice,'```','',...(c.normative_voice?['Normative: '+c.normative_voice,'']:[]),'Plain language: '+c.plain_language_voice,'','Domain example/context: '+c.domain_context_voice,'','Boundary: '+c.boundary,'');}
  lines.push('## Open Questions','','See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) for exact owners, consequences and stop conditions. Existing reconciliation questions remain in ../DECISIONS.md.','');return lines.join('\n');
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const catalog=buildCatalog();console.log(json({catalog,input:buildInput(catalog),ontology:buildOntology(catalog)}));
}
