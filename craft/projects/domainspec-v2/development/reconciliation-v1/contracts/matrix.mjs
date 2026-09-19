import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export const axes=['authored','canonical','implemented','tested','accepted','packaged','published'];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
export const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const catalogPath='definitions/meta-types/current-implementation.json';
const relationshipPath='definitions/relationships/relationships.yml';
const capabilityPath='impl/cli/src/product/capabilities.ts';
const generatorPath='impl/cli/src/generation/generators.ts';
const modelPath='impl/cli/src/input/project-model.ts';
const acceptedPath='development/cli-successor-candidate/acceptance-v2/decision.json';
const archivePath='development/cli-successor-candidate/v2/package/domainspec-v2-cli-1.0.0.tgz';
const local=p=>p.replace(/^projects\/domainspec-v2\//,'');
export function arrayConstant(text,name) {
  const match=text.match(new RegExp(name+' = Object\\.freeze\\(\\[([\\s\\S]*?)\\] as const\\)'));
  if(!match)throw Error('Unrecognized capability declaration: '+name);
  return [...match[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);
}
function commandNames(text) {return [...new Set([...text.matchAll(/command\s*===\s*['"]([a-z][a-z-]*)['"]/g)].map(m=>m[1]).filter(n=>n!=='help'))].sort();}
function states(implemented='source-present-bounded',canonical='candidate-not-admitted') {
  return {authored:'source-contract-present',canonical,implemented,tested:'not-run-current',accepted:'not-established-for-current-tree',packaged:'inspect-evidence-counterpart',published:'not-established'};
}
export function buildMatrix() {
  const catalog=json(catalogPath),relations=json(relationshipPath),capability=read(capabilityPath);
  const kinds=catalog.backend_meta_types.map(r=>r.label),languages=['typescript','python','rust'];
  const evidence=[];
  const ev=(p,selector,needle)=>{const source=read(p);if(needle&&!source.includes(needle))throw Error('Missing selector '+p+': '+needle);const existing=evidence.find(e=>e.path===p&&e.selector===selector);if(existing)return existing.id;const id='E'+String(evidence.length+1).padStart(3,'0');evidence.push({id,path:p,selector,sha256:hash(source),...(needle?{needle}:{})});return id;};
  const cat=ev(catalogPath,'backend_meta_types, scope, claim_ceiling'),rel=ev(relationshipPath,'signatures, generated_views, deferred, deprecated');
  const caps=ev(capabilityPath,'STABLE_COMMANDS, EXPERIMENTAL_COMMANDS, AUTHORING_META_TYPES, COMPILED_META_TYPES','STABLE_COMMANDS');
  const gen=ev(generatorPath,'GENERATOR_REGISTRY and language renderers','GENERATOR_REGISTRY');
  const model=ev(modelPath,'decodeBody, relationship validation, typed closures','validateRelationshipGraph');
  const accept=ev(acceptedPath,'decision, candidate_sha256, package_archive_sha256, operational_authorizations');
  const historical=ev('development/cli-successor-candidate/v2/REPORT.md','Evidence and Product scope','203 tests');
  const pkg=ev('impl/cli/package.json','version, scripts, files, exports');
  const main=ev('impl/cli/src/cli/main.ts','runCli command dispatcher',"command==='application-check'");
  const acceptance=json(acceptedPath),candidatePath=local(acceptance.candidate_path);
  const candidate=json(candidatePath),sourceManifest=json('development/cli-successor-candidate/v2/source-manifest.json');
  const candidateRef=ev(candidatePath,'candidate_id, validation_result, artifacts, claim_ceiling');
  const sourceRef=ev('development/cli-successor-candidate/v2/source-manifest.json','files');
  if(hash(read(candidatePath))!==acceptance.candidate_sha256 || hash(fs.readFileSync(path.join(root,archivePath)))!==acceptance.package_archive_sha256)throw Error('Accepted candidate binding drift');
  if(hash(read('development/cli-successor-candidate/v2/source-manifest.json'))!==candidate.source_manifest_sha256)throw Error('Accepted source-manifest drift');
  const sourceComparison=sourceManifest.files.map(r=>{const p=local(r.path);return {path:p,expected_sha256:r.sha256,actual_sha256:fs.existsSync(path.join(root,p))?hash(fs.readFileSync(path.join(root,p))):null};});
  const archiveMembers=execFileSync('tar',['-tzf',path.join(root,archivePath)],{maxBuffer:8*1024*1024}).toString().split('\n');
  const stable=arrayConstant(capability,'STABLE_COMMANDS'),experimental=arrayConstant(capability,'EXPERIMENTAL_COMMANDS'),authoring=arrayConstant(capability,'AUTHORING_META_TYPES');
  const compiled=arrayConstant(capability,'COMPILED_META_TYPES');
  const discovered=commandNames(read('impl/cli/src/cli/main.ts'));
  const commands=discovered.map(id=>({id,classification:stable.includes(id)?'advertised-stable':experimental.includes(id)?'advertised-experimental':'dispatcher-only-candidate',states:{...states(),authored:stable.includes(id)||experimental.includes(id)?'advertised-command':'dispatcher-only'},evidence_refs:[main,caps,pkg,accept,historical],limitations:id==='run'?['Experimental host runtime; no generated-language parity or durable Workflow guarantee.']:id.startsWith('application-')?['Absent from STABLE_COMMANDS, EXPERIMENTAL_COMMANDS and CLI_HELP.']:id.startsWith('certify')?['Checked interchange explicitly rejects project compositions.']:['Command registration is not current end-to-end validation.']}));
  const profiles=[];
  const add=(id,category,types,langs,cmds,p,needle,limits,implementation='source-present-bounded')=>{const e=ev(p,needle,needle);profiles.push({id,category,types,languages:langs,commands:cmds,states:states(implementation),evidence_refs:[e,gen,model],limitations:limits});};
  const codeCommands=['compile','instantiate','instantiate-project','build','verify','verify-project','formalize','formalize-check','certify','certify-check','lint','receipt'];
  add('domainspec.node/v1','source',kinds,languages,codeCommands.concat('add'),'impl/cli/src/input/project-root.ts','domainspec.node/v1',['Core bodies differ by kind; this is not a universal record or execution model.']);
  const typed='impl/cli/src/typed-operation/contracts.ts',backend='impl/cli/src/typed-backend/contracts.ts';
  for(const [suffix,types,p,limit] of [
    ['record',['Entity','Value Object'],typed,'Shared representation retains identity/value distinctions; not a database table declaration.'],
    ['sum',['Enum'],typed,'Variant payload contract used in typed closure; not an additional canonical meta-type or proof that ordinary Enum generation preserves payloads.'],
    ['operation',['Operation','Query'],typed,'Typed closure and generated-language behavior require separate parity proof; Query can consume a read-only operation closure.'],
    ['rule',['Rule'],typed,'Boolean closure required; untyped Rule generation fails explicitly.'],
    ['query',['Query'],backend,'Filtering/projection/order/limit over supplied rows, not automatic database IO.'],
    ['calculation',['Calculation'],backend,'UInt64 arithmetic with explicit rounding; source graph still requires calculates relation.'],
    ['mapping',['Mapping'],backend,'Field/default transformation; no implicit Calculation-to-Mapping canonical edge.'],
    ['policy',['Policy'],backend,'This contract uses inline BackendPredicate cases; declared Rule references exist in the distinct static body profile. Selection does not execute a strategy.']
  ])add('domainspec.typed-'+suffix+'/v1','typed-contract',types,languages,[...codeCommands,...(types.some(t=>authoring.includes(t))?['add']:[])],p,'domainspec.typed-'+suffix+'/v1',[limit]);
  add('domainspec.typescript-exact-uint64/v1','realization',kinds,['typescript'],['build','verify'],'impl/cli/src/generation/exact-uint64.ts','domainspec.typescript-exact-uint64/v1',['Typed Query/Calculation/Mapping/Policy specialized; typed record properties must be scalar; other types fall through to ordinary generators. Reject Python/Rust; not all-kind numeric parity.']);
  add('domainspec.application-layout/v1','layout',kinds,languages,['build','verify'],'impl/cli/src/generation/output-layout.ts','domainspec.application-layout/v1',['Path/layout projection only; not application ontology or runtime activation.']);
  add('domainspec.project-composition/v1','composition',['Mapping','Query','Rule','Calculation'],['typescript','rust'],['compile','build','verify'],'impl/cli/src/input/project-composition.ts','domainspec.project-composition/v1',['Scoped reference graph, not DS-D8 admission; no Python composition target; checked interchange rejects compositions.']);
  add('domainspec.declarative-function/v1','composition',['Mapping','Query','Rule','Calculation'],['typescript','rust'],['compile','build','verify'],'impl/cli/src/typed-backend/declarative-function.ts','domainspec.declarative-function/v1',['TypeScript/Node behavior with Rust portability path; no procedural flows or automatic IO.']);
  add('node-rust-v1','portability',['Mapping','Query','Rule','Calculation'],['typescript','rust'],['compile','build','verify'],'impl/cli/src/input/project-composition.ts','node-rust-v1',['Subset portability contract, not all JavaScript/Rust equivalence.']);
  add('provider-neutral-v1','integration',kinds,languages,['instantiate'],'impl/cli/src/system-integration/frozen-profile.generated.ts','provider-neutral-v1',['D45-D49 contract formation and observation; no provider runtime guarantees.']);
  add('domainspec.calculation-semantics/v1','static-contract',['Calculation'],languages,codeCommands.concat('add'),'impl/cli/src/static-semantics/contracts.ts','domainspec.calculation-semantics/v1',['Distinct from typed-calculation UInt64 grammar; numeric rounding is explicit.']);
  add('in-memory-v1','runtime',kinds,['host-node'],['run'],'impl/cli/src/runtime/contracts.ts','in-memory-v1',['Experimental host interpreter, not execution of generated TypeScript/Python/Rust. Typed contracts required by several branches; Workflow returns declarations, not general dispatch.'],'experimental-runtime');
  add('domainspec.durable-operation-invocation/v1','runtime',['Operation'],['host-node'],[], 'impl/cli/src/runtime/durable.ts','domainspec.durable-operation-invocation/v1',['Experimental library API, not a CLI run provider selector. Supplied transactional port; composition assurance restriction remains.'],'experimental-runtime');
  add('bound-application-v1','application',kinds,['typescript'],['application-check','application-build'],'impl/cli/src/application/compiler.ts','bound-application-v1',['Candidate application ontology with embedded core models; storage binds supplied SQL, not generated DDL; UI declarations do not admit canonical UI types.'],'working-tree-candidate');
  for(const [name,file,version] of [['outbound-composition','outbound-composition','v1-candidate'],['outbound-composition','outbound-composition','v2-candidate'],['request-custody','request-custody','v1-candidate'],['stream-lifecycle','stream-lifecycle','v1-candidate']]) {
    add('domainspec.'+name+'/'+version,'composition-extension',['Mapping','Query','Rule','Calculation'],['typescript'],['compile','build','verify'],'impl/cli/src/typed-backend/'+file+'.ts','domainspec.'+name+'/'+version,['Candidate extension, not DS-D8 admission. Its focused test file is absent from the default test script.'],'working-tree-candidate');
  }
  const mintedPath='definitions/minted-project/supported-profiles.yml';
  for(const p of json(mintedPath).profiles)add(p.id+'@'+p.version,'minted-project',p.kinds,['language-independent'],[],mintedPath,p.id,['Separate minted-project formation profile; not a CLI output realization selector. Release admission not granted.'],p.status==='experimental'?'experimental-runtime':'working-tree-candidate');
  const gaps=[
    {id:'G01',title:'Dispatcher-only application commands',evidence_refs:[main,caps],next_tasks:['DSR-026','DSR-029','DSR-034'],meaning:'Two current native commands are absent from capability/help metadata.'},
    {id:'G02',title:'Untyped Query and Rule are not complete evaluators',evidence_refs:[gen],next_tasks:['DSR-018','DSR-030'],meaning:'Untyped Query copies state in TypeScript/Python and panics in Rust; untyped Rule throws/panics.'},
    {id:'G03',title:'State Machine trigger/output confusion',evidence_refs:[model],next_tasks:['DSR-016'],meaning:'Incoming transitions Event is checked against effect_event_ref; trigger and output roles are conflated.'},
    {id:'G04',title:'Workflow target identity is not occurrence identity',evidence_refs:[model],next_tasks:['DSR-017','DSR-024'],meaning:'Relationship checks use unique bare Operation IDs; general execution and qualified occurrence semantics are not implied.'},
    {id:'G05',title:'Multiplicity and ownership axes need reconciliation',evidence_refs:[model,rel],next_tasks:['DSR-008','DSR-010'],meaning:'Current validator applies verb-level multiplicity and inverse-collapse checks; this does not implement all BMC ownership/membership dimensions.'},
    {id:'G06',title:'Composition certificate and checked assurance differ',evidence_refs:[ev('impl/cli/src/assurance/checked-interchange.ts','createCheckedInterchange','checked interchange does not yet cover composition'),ev('impl/cli/src/compilation/certificate.ts','composition identity and stale checks','stale compiled composition')],next_tasks:['DSR-020','DSR-021'],meaning:'Project certificates include compositions; checked interchange rejects them. Neither proves general runtime execution.'},
    {id:'G07',title:'Default test denominator omits candidate suites',evidence_refs:[pkg],next_tasks:['DSR-029'],meaning:'outbound-composition, request-custody, service-security and stream-lifecycle test files exist but are absent from test:proof/test:parallel.'},
    {id:'G08',title:'Accepted archive is not the current source tree',evidence_refs:[accept,candidateRef,sourceRef],next_tasks:['DSR-035','DSR-036'],meaning:'Exact accepted successor identity is preserved separately from changed source and the output-layout candidate.'},
    {id:'G09',title:'Policy profiles use different condition models',evidence_refs:[ev(backend,'TypedPolicyCase / BackendPredicate','interface TypedPolicyCase'),ev('impl/cli/src/static-semantics/contracts.ts','PolicyDecision.rule_ref','readonly rule_ref')],next_tasks:['DSR-015'],meaning:'Static Policy reuses declared Rules; typed-policy uses inline predicates. Do not silently call these identical.'},
    {id:'G10',title:'Nested types and storage are distinct contracts',evidence_refs:[ev(typed,'TypedType and TypedProperty','export type TypedType'),ev('impl/cli/APPLICATION.md','Storage declarations','no DDL is synthesized')],next_tasks:['DSR-009','DSR-028'],meaning:'Typed composition exists; shared records are not database tables or proof of cross-language nested identity/value fidelity.'},
  ];
  for(const name of ['outbound-composition','request-custody','service-security','stream-lifecycle'])ev('impl/cli/test/generation/'+name+'.test.ts','candidate test file exists');
  ev('impl/cli/src/typed-backend/service-security.ts','ServiceSecurity; compileServiceSecurity','compileServiceSecurity');
  const kindNotes={Entity:'Identity-bearing domain object; no automatic persistence.', 'Value Object':'Value semantics and invariant references; shared typed-record representation does not collapse identity distinctions.',Enum:'Closed variants; typed sum has payloads.',Operation:'Declared reads/writes/effects; generated code and host/provider runtime are separate.',Query:'Typed row evaluator or typed read-only closure; untyped fallback differs by language.',Calculation:'Pure arithmetic; current source graph still requires an outgoing calculates relationship.',Rule:'Boolean assertion; typed semantics required for evaluation.',Policy:'Selects target/strategy; does not execute it. Static Rules and typed inline predicates differ.',Workflow:'Orchestration/recovery models and in-process recovery helpers; no general durable workflow executor.',Interface:'Versioned boundary signatures and compatibility checks, not network transport.',Event:'Versioned occurrence/payload identity, not event delivery.',Mapping:'Field transformation with source/target roles; not implicit calculation dependency.', 'State Machine':'Transition helpers exist; trigger/output relationship mismatch remains.'};
  const typeRows=catalog.backend_meta_types.map(t=>({id:t.id,label:t.label,states:states('source-present-bounded','baseline-meaning-admitted'),evidence_refs:[cat,gen,model],authoring:{source_json:true,structured_add:authoring.includes(t.label)},meaning:kindNotes[t.label]}));
  const realizations=typeRows.flatMap(t=>languages.map(language=>({id:t.id+'/'+language,type:t.label,language,states:states(t.label==='Query'?'contract-dependent':t.label==='Rule'?'typed-required':'source-present-bounded','baseline-meaning-admitted'),evidence_refs:[cat,gen,model],limitations:[kindNotes[t.label],...(t.label==='Query'?[language==='rust'?'Untyped Query emits panic.':'Untyped Query returns a state snapshot, not authored filtering.']:[])]})));
  const relationshipRows=relations.signatures.map(s=>{
    const source=s.source_types??[s.source_type],target=s.target_types??[s.target_type];
    const backend=source.concat(target).every(t=>kinds.includes(t));
    return {id:s.id,source_types:source,target_types:target,multiplicity:s.multiplicity,feature_scope:s.feature_scope,semantics:s.semantics,release_scope:backend?'backend':'UI-excluded-from-v1',states:states(backend?'source-present-bounded':'excluded-from-cli-release','canonical-signature-active'),evidence_refs:[rel,model],next_tasks:backend?['DSR-008','DSR-010','DSR-030']:['DSR-041']};
  });
  const cells=profiles.flatMap(p=>p.types.flatMap(type=>p.languages.map(language=>({id:p.id+'|'+type+'|'+language,profile:p.id,type,language,commands:p.commands.filter(c=>c!=='add'||authoring.includes(type)),states:{...p.states},evidence_refs:p.evidence_refs}))));
  const comparisonByPath=new Map(sourceComparison.map(r=>[r.path,r]));
  const counterparts=evidence.filter(e=>e.path.startsWith('impl/cli/src/')).map(e=>{
    const member='package/dist/'+e.path.slice('impl/cli/src/'.length).replace(/\.ts$/,'.js');
    const old=comparisonByPath.get(e.path);
    return {evidence_ref:e.id,path:e.path,accepted_source_identity:!old?'absent-from-accepted-source-manifest':old.expected_sha256===old.actual_sha256?'matches-accepted-source-file':'differs-from-accepted-source-file',archive_member:member,archive_member_present:archiveMembers.includes(member),claim_ceiling:'Module presence or one matching file does not establish current dependency closure acceptance.'};
  });
  const layoutPath='development/output-layout/release-preparation-v1/candidate.json',layout=json(layoutPath);
  const layoutRef=ev(layoutPath,'status, product_acceptance, archive');
  const layoutArchive='development/output-layout/release-preparation-v1/'+layout.archive.path;
  if(hash(fs.readFileSync(path.join(root,layoutArchive)))!==layout.archive.sha256)throw Error('Layout archive drift');
  const currentSourceDrift=sourceComparison.filter(r=>r.expected_sha256!==r.actual_sha256);
  return {schema_version:'domainspec.support-matrix/v1-candidate',task_id:'DSR-003',status:'candidate-current-state-not-release-promise',authority_effect:'none',closure_definition_selected:false,
    semantics:{axes,default_unknown:'not-established',fresh_product_tests:'not-run',rule:'Every row retains seven independent states. Profile cells describe source applicability, not tested Cartesian-product support. No global PASS.',acceptance_rule:'Exact historical accepted candidate only; current dependency closure is not inferred from file or version equality.',scope:'Selected backend CLI, core relationships, explicit typed/composition/runtime/application and minted-project profiles. Historical/research portfolio disposition belongs to DSR-002/041.',not_applicable:'Unsupported axis combination, not a passing product cell; all real selected promises still require DSR-018/029 tests.'},
    denominators:{backend_types:13,languages:3,realizations:39,relationships:31,backend_relationships:17,advertised_stable_commands:21,advertised_experimental_commands:1,dispatcher_only_commands:2,profiles:profiles.length,profile_type_language_cells:cells.length},
    dimensions:{types:kinds,languages,commands:discovered,profiles:profiles.map(p=>p.id)},types:typeRows,realizations,relationships:relationshipRows,noncanonical_relationships:{generated_views:relations.generated_views,deferred:relations.deferred,deprecated:relations.deprecated},commands,profiles,cells,
    command_combination_rule:{representation:'normalized-total-lookup',query:'resolveCombination(matrix, {type,language,profile,command})',conditions:'A declared cell must exist and list the command. Other combinations return not-applicable with reason. Matching combinations return source-applicability-only plus seven states, never semantic PASS.',command_level_only:commands.filter(c=>!cells.some(r=>r.commands.includes(c.id))).map(c=>c.id)},
    evidence,package_counterparts:counterparts,package_states:{accepted_successor:{id:acceptance.candidate_id,candidate_sha256:acceptance.candidate_sha256,archive_path:archivePath,archive_sha256:acceptance.package_archive_sha256,accepted:'exact-human-product-acceptance',tested:'historical-report-not-rerun',published:'not-established',evidence_refs:[accept,candidateRef,historical,sourceRef]},current_tree:{accepted:'not-established',tested:'not-run-current',source_manifest_members:sourceComparison.length,changed_or_missing_members:currentSourceDrift,new_files:'Not counted by the old accepted source manifest; working-tree candidates tracked separately.',version_is_acceptance:false},layout_candidate:{id:layout.id,archive_path:layoutArchive,archive_sha256:layout.archive.sha256,accepted:layout.product_acceptance,tested:'historical-report-not-rerun',published:'not-established',evidence_refs:[layoutRef]}},gaps,open_questions_ref:'../DECISIONS.md'};
}

export function resolveCombination(matrix,{type,language,profile,command}) {
  const row=matrix.cells.find(r=>r.type===type&&r.language===language&&r.profile===profile);
  if(!row)return {status:'not-applicable',reason:'No declared profile/type/language cell.'};
  if(!row.commands.includes(command))return {status:'not-applicable',reason:'Command is not a declared consumer of this profile cell; see command-level row.'};
  return {status:'source-applicability-only',cell_id:row.id,states:row.states,evidence_refs:row.evidence_refs};
}
export function validateMatrix(m,{checkDisk=true}={}) {
  const errors=[];const check=(ok,msg)=>{if(!ok)errors.push(msg);};
  check(m.schema_version==='domainspec.support-matrix/v1-candidate','schema');check(m.authority_effect==='none','authority');check(m.closure_definition_selected===false,'closure cannot be selected by a matrix');
  const expectedKinds=json(catalogPath).backend_meta_types.map(r=>r.label).sort();
  check(JSON.stringify(m.types.map(r=>r.label).sort())===JSON.stringify(expectedKinds),'type denominator');
  check(m.realizations.length===39&&new Set(m.realizations.map(r=>r.id)).size===39,'realization denominator');
  for(const type of expectedKinds)for(const language of ['typescript','python','rust'])check(m.realizations.filter(r=>r.type===type&&r.language===language).length===1,'missing realization '+type+'/'+language);
  check(JSON.stringify(m.relationships.map(r=>r.id).sort())===JSON.stringify(json(relationshipPath).signatures.map(r=>r.id).sort()),'relationship denominator');
  check(m.relationships.filter(r=>r.release_scope==='backend').length===17,'backend relationship denominator');
  check(JSON.stringify(m.commands.map(r=>r.id).sort())===JSON.stringify(commandNames(read('impl/cli/src/cli/main.ts'))),'command denominator');
  check(m.commands.filter(r=>r.classification==='advertised-stable').length===21,'stable commands');check(m.commands.filter(r=>r.classification==='dispatcher-only-candidate').length===2,'dispatcher-only commands');
  check(new Set(m.profiles.map(r=>r.id)).size===m.profiles.length,'duplicate profile');check(new Set(m.cells.map(r=>r.id)).size===m.cells.length,'duplicate cell');
  const evidence=new Map(m.evidence.map(e=>[e.id,e]));
  for(const e of m.evidence){check(/^[a-f0-9]{64}$/.test(e.sha256),'invalid source digest '+e.id);check(e.selector?.length>0,'selector '+e.id);if(checkDisk){check(hash(read(e.path))===e.sha256,'source drift '+e.path);if(e.needle)check(read(e.path).includes(e.needle),'selector drift '+e.id);}}
  for(const row of [...m.types,...m.realizations,...m.relationships,...m.commands,...m.profiles,...m.cells]) {
    check(JSON.stringify(Object.keys(row.states).sort())===JSON.stringify([...axes].sort()),'independent axes '+row.id);
    check(!Object.values(row.states).includes('pass'),'blanket pass '+row.id);check(row.states.tested==='not-run-current','fresh tests falsely asserted '+row.id);
    check(row.states.accepted==='not-established-for-current-tree','current acceptance falsely asserted '+row.id);check(row.states.published==='not-established','publication falsely asserted '+row.id);
    check(row.evidence_refs.length>0&&row.evidence_refs.every(id=>evidence.has(id)),'evidence refs '+row.id);
  }
  for(const p of m.profiles)for(const type of p.types)for(const language of p.languages){const row=m.cells.find(r=>r.profile===p.id&&r.type===type&&r.language===language);check(Boolean(row),'missing profile cell '+p.id+' '+type+' '+language);if(row)check(JSON.stringify(row.states)===JSON.stringify(p.states),'profile state drift '+row.id);}
  for(const r of m.cells){const p=m.profiles.find(p=>p.id===r.profile);check(Boolean(p&&p.types.includes(r.type)&&p.languages.includes(r.language)&&r.commands.every(c=>p.commands.includes(c))),'invalid cell '+r.id);}
  const exact=m.profiles.find(p=>p.id==='domainspec.typescript-exact-uint64/v1');check(JSON.stringify(exact?.languages)===JSON.stringify(['typescript']),'exact UInt64 language leakage');
  check(m.package_states.current_tree.accepted==='not-established'&&m.package_states.current_tree.version_is_acceptance===false,'package/source acceptance collapse');
  check(m.gaps.length>=10&&m.gaps.every(g=>g.evidence_refs.every(id=>evidence.has(id))&&g.next_tasks.length),'gap evidence');
  check(m.profiles.length===m.denominators.profiles&&m.cells.length===m.denominators.profile_type_language_cells,'declared denominator drift');
  if(checkDisk)check(JSON.stringify(m)===JSON.stringify(buildMatrix()),'deterministic source view drift');
  return {status:errors.length?'fail':'pass',errors,counts:{types:m.types.length,realizations:m.realizations.length,relationships:m.relationships.length,commands:m.commands.length,profiles:m.profiles.length,cells:m.cells.length,evidence:m.evidence.length},claim_ceiling:'Matrix structure, current source identities and declared applicability only; no current product execution or admission.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv[2]==='emit')console.log(JSON.stringify(buildMatrix(),null,2));
  else if(process.argv[2]==='check'){const r=validateMatrix(json('development/reconciliation-v1/contracts/support-matrix.json'));console.log(JSON.stringify(r,null,2));if(r.status!=='pass')process.exitCode=1;}
  else throw Error('Usage: node matrix.mjs emit | check');
}
