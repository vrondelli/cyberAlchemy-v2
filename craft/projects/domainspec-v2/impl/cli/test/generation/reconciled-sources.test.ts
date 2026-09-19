import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {getReconciledSource,getReconciledSourceCapsule,findReconciledSourceByDigest,validateReconciledSourceCapsule,RECONCILED_SOURCE_CAPSULE_SHA256} from '../../src/generation/reconciled-sources.ts';
import {canonicalJson,sha256} from '../../src/input/source-manifest.ts';
import {materializeReconciledSources} from '../../tools/materialize-reconciled-sources.mjs';

const cli=path.resolve(import.meta.dirname,'../..'),project=path.resolve(cli,'../..');
const selection=JSON.parse(fs.readFileSync(path.join(cli,'contracts/reconciled-source-selection.json'),'utf8'));
const projectCompositionIds=['composed_project','composed_workflow'];
const compositionIds=['operation_value_composition','composed_operation',...projectCompositionIds];
const previous132Selection={...selection,sources:selection.sources.filter((s:any)=>!compositionIds.includes(s.id))};
const previous132Sources=getReconciledSourceCapsule().sources.filter(s=>!compositionIds.includes(s.id));

test('composed project successor preserves all 134 previous sources',()=>{
 const capsule=getReconciledSourceCapsule();
 const predecessor={...selection,sources:selection.sources.filter((s:any)=>!projectCompositionIds.includes(s.id))};
 const sources=capsule.sources.filter(s=>!projectCompositionIds.includes(s.id));
 assert.equal(sources.length,134);
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(predecessor)),sources})),'1bbaa49471b01cbdeee8ca76b4833c6a0a9923adc17d5a06108c7ef91cbce7ab');
 assert.equal(sha256(getReconciledSource('composed_project')),'15795f5e18f1bbf04a29ecce1ed941cf8e8bb7e59275d6bc34d57597b159620d');
 assert.equal(sha256(getReconciledSource('composed_workflow')),'f33b6d4f7dbaf976ed3aa1892f29735ff4ad2fb0a6c77cd2d8c7f7f6bb4d445b');
});

test('composition successor preserves all 132 preceding sources and pins both composition contracts',()=>{
 const capsule=getReconciledSourceCapsule();
 assert.equal(previous132Sources.length,132);
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous132Selection)),sources:previous132Sources})),'3ea19a1e4847b87185c74ea46b3eb9310ba0a65ef2524b7ae41d3aae444d69de');
 assert.equal(sha256(getReconciledSource('operation_value_composition')),'b66f8dda9f9a699be28eceeb9081779d4eb6cf54abdd4f7507d323302faa36d3');
 assert.equal(sha256(getReconciledSource('composed_operation')),'277649b65efc5fb8a39bedab056c5e78b4930a8c22b0870f72374d4e962a8026');
});

test('public Mapping successor preserves all 131 immediately preceding sources',()=>{
 const capsule=getReconciledSourceCapsule();
 const predecessor={...previous132Selection,sources:previous132Selection.sources.filter((s:any)=>s.id!=='public_mapping_value_object')};
 const sources=previous132Sources.filter(s=>s.id!=='public_mapping_value_object');
 assert.equal(sources.length,131);
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(predecessor)),sources})),'60414daef6453b440e89c0bb3575c7b79ca6bf9afea1bcdddd4472a6906b9261');
 assert.equal(sha256(getReconciledSource('public_mapping')),'5de04e24cbd6a137b3f3120b5fbfbba2775339f26cfb3d56498eaf6ae8e067b3');
 assert.equal(sha256(getReconciledSource('public_mapping_value_object')),'924538cd28276e3076e06c011ce47cbe73c8d232c230ae9d2407f3abf012caf8');
});

test('selected source capsule is complete, immutable and deterministically materialized',()=>{
 const capsule=getReconciledSourceCapsule();
 assert.equal(capsule.sources.length,136);assert.equal(capsule.capsule_sha256,RECONCILED_SOURCE_CAPSULE_SHA256);
 const previous131Selection={...previous132Selection,sources:previous132Selection.sources.filter((s:any)=>s.id!=='public_mapping_value_object')};
 const previous131Sources=previous132Sources.filter(s=>s.id!=='public_mapping_value_object');
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous131Selection)),sources:previous131Sources})),'60414daef6453b440e89c0bb3575c7b79ca6bf9afea1bcdddd4472a6906b9261','all 131 predecessor sources remain unchanged');
 // The current configuration selected a different output-layout source before
 // this successor. Reconstruct historical bytes explicitly; do not assert that
 // a changed configuration is byte-identical to the old R12/R11 capsule.
 const historicalConfiguration=getReconciledSource('configuration').replace('e952430bbcac1479d1ed1190766c1f965d3d2f2c7499b0c434883a6a85066413','858a7f6430e2ddbc79c41696e432bf4a8b7c82910928c7cec72945131d5f95b4');
 const historicalConfigurationSha256='77a7ec204fa575c52a1f3c126ce839206c81154e9bbd3541eb2ad992143631eb';
 assert.equal(sha256(historicalConfiguration),historicalConfigurationSha256,'exact historical configuration, not a refreshed digest');
 assert.equal(sha256(getReconciledSource('configuration')),'c82035da6f30d440bb9d37960569b5ab8d10ae9d8bdb77ef6de0e7fe52d9dd5d');
 const historical131Selection={...previous131Selection,sources:previous131Selection.sources.map((s:any)=>s.id==='configuration'?{...s,sha256:historicalConfigurationSha256}:s)};
 const historical131Sources=previous131Sources.map(s=>s.id==='configuration'?{...s,sha256:historicalConfigurationSha256,content:historicalConfiguration,size_bytes:Buffer.byteLength(historicalConfiguration)}:s);
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(historical131Selection)),sources:historical131Sources})),'9886ea42053d5c0b918123649317776214b5e92139161f2602e11dde796cffe8','exact historical R12 capsule');
 const previous130Selection={...historical131Selection,sources:historical131Selection.sources.filter((s:any)=>s.id!=='realization_matrix')};
 const previous130Sources=historical131Sources.filter(s=>s.id!=='realization_matrix');
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous130Selection)),sources:previous130Sources})),'5d5b31d9e62a5bf789272bf6af05045dac915e3d7747484336e513c0ff19f1b1','all 130 predecessor sources remain unchanged');
 const previous129Selection={...previous130Selection,sources:previous130Selection.sources.filter((s:any)=>s.id!=='rust_native_verification')};
 const previous129Sources=previous130Sources.filter(s=>s.id!=='rust_native_verification');
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous129Selection)),sources:previous129Sources})),'ca8796a829496d19fe6608a7c58939494a2924d8f3b5fa9d5ea01b5e056d9a04','all 129 predecessor sources remain unchanged');
 const latestRustIds=['rust_event','rust_operation','rust_state_machine','rust_workflow','rust_interface'];
 const previous124Selection={...previous129Selection,sources:previous129Selection.sources.filter((s:any)=>!latestRustIds.includes(s.id))};
 const previous124Sources=previous129Sources.filter(s=>!latestRustIds.includes(s.id));
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous124Selection)),sources:previous124Sources})),'8f2a8fd63acc4d7dc3365aead76aed95e326243663c1705ecc05d658495bf9cb','all 124 predecessor sources remain unchanged');
 const secondRustIds=['rust_calculation','rust_query','rust_mapping','rust_policy'];
 const previous120Selection={...previous129Selection,sources:previous129Selection.sources.filter((s:any)=>![...latestRustIds,...secondRustIds].includes(s.id))};
 const previous120Sources=previous129Sources.filter(s=>![...latestRustIds,...secondRustIds].includes(s.id));
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous120Selection)),sources:previous120Sources})),'b60b105cc833397be3380e0a15faa2d794286eeca455057c0597da42f2e0f2d6','all 120 predecessor sources remain unchanged');
 const rustIds=[...latestRustIds,...secondRustIds,'rust_project','rust_enum','rust_rule','rust_factory'];
 const previous116Selection={...previous129Selection,sources:previous129Selection.sources.filter((s:any)=>!rustIds.includes(s.id))};
 const previous116Sources=previous129Sources.filter(s=>!rustIds.includes(s.id));
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous116Selection)),sources:previous116Sources})),'0d28cff4ce984e2a3a738a621cf2ba2401b724908a54aad6da036ac7d17ee8e6','all 116 predecessor sources remain unchanged');
 {
 const selection=previous116Selection,capsule={sources:previous116Sources,schema_version:'domainspec.reconciled-source-capsule/v1-candidate',authority_effect:'none'};
 const previous115Selection={...selection,sources:selection.sources.filter((s:any)=>s.id!=='python_complete_verification')};
 const previous115Sources=capsule.sources.filter(s=>s.id!=='python_complete_verification');
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous115Selection)),sources:previous115Sources})),'1ee4d9fb10771b5d81d71e9a75a3c1fd9f960d4ba695301a2eb87134d3a1fe44','all 115 predecessor sources remain unchanged');
 {
 const selection=previous115Selection,capsule={sources:previous115Sources,schema_version:'domainspec.reconciled-source-capsule/v1-candidate',authority_effect:'none'};
 const publicMappingIds=['python_public_mapping_semantic','python_public_mapping_observer','python_public_mapping_semantics'];
 const previous112Selection={...selection,sources:selection.sources.filter((s:any)=>!publicMappingIds.includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous112Selection)),sources:capsule.sources.filter(s=>!publicMappingIds.includes(s.id))})),'d1367e126c21f0c4e2f4392e3efe94956e785a2a8697f1cbac763c979ceba43a','all 112 predecessor sources remain unchanged');
 const interfaceIds=[...publicMappingIds,'python_interface_semantic','python_interface_observer','python_interface_semantics'];
 const previous109Selection={...selection,sources:selection.sources.filter((s:any)=>!interfaceIds.includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous109Selection)),sources:capsule.sources.filter(s=>!interfaceIds.includes(s.id))})),'65f3c18e354f6635aa91ab24a173ad8ce4795b14e4eefd974f672e2225df78b4','all 109 predecessor sources remain unchanged');
 const pythonWorkflowIds=[...interfaceIds,'python_workflow_semantic','python_workflow_observer','python_workflow_materialization_observer','python_workflow_semantics'];
 const previous105Selection={...selection,sources:selection.sources.filter((s:any)=>!pythonWorkflowIds.includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous105Selection)),sources:capsule.sources.filter(s=>!pythonWorkflowIds.includes(s.id))})),'fa567fa51745d27b8ec097c2b1e21942d314104f1a2b28cb668a0c13831efd94','all 105 predecessor sources remain unchanged');
 const operationIds=[...pythonWorkflowIds,'python_operation_semantic','python_operation_semantics'];
 const previous103Selection={...selection,sources:selection.sources.filter((s:any)=>!operationIds.includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous103Selection)),sources:capsule.sources.filter(s=>!operationIds.includes(s.id))})),'c842e7f38efbe6eee621f77b4aef988156a5953ed2de7b5a5d58b25860c8fb14','all 103 predecessor sources remain unchanged');
 const stateMachineIds=[...operationIds,'python_state_machine_semantic','python_state_machine_observer','python_state_machine_semantics'];
 const previous100Selection={...selection,sources:selection.sources.filter((s:any)=>!stateMachineIds.includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous100Selection)),sources:capsule.sources.filter(s=>!stateMachineIds.includes(s.id))})),'eda39b7a64e472b07089fcb767a149dbd2d4a1969872b5aef8eb4cbc912b3f8c','all 100 predecessor sources remain unchanged');
 const eventIds=[...stateMachineIds,'python_event_semantic','python_event_observer','python_event_semantics'];
 const previous97Selection={...selection,sources:selection.sources.filter((s:any)=>!eventIds.includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous97Selection)),sources:capsule.sources.filter(s=>!eventIds.includes(s.id))})),'cab3e27821b29075bfca355ca9008bef36862834aaefa5036938ffd46fdc8e73','all 97 predecessor sources remain unchanged');
 const factoryIds=[...eventIds,'python_factory_semantic','python_factory_semantics'];
 const previous95Selection={...selection,sources:selection.sources.filter((s:any)=>!factoryIds.includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous95Selection)),sources:capsule.sources.filter(s=>!factoryIds.includes(s.id))})),'c9475418e89c7e4b4354156c6a6b06ee4591cc56635368ef294e4ba2614b7282','all 95 predecessor sources remain unchanged');
 const sumIds=[...factoryIds,'python_sum_semantic','python_owned_semantics'];
 const previous93Selection={...selection,sources:selection.sources.filter((s:any)=>!sumIds.includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous93Selection)),sources:capsule.sources.filter(s=>!sumIds.includes(s.id))})),'b85c98696319c59bc971ade09a5c2d5c08edb30b37fce6b3476efceb4979587f','all 93 predecessor sources remain unchanged');
 const ownedIds=[...sumIds,'python_owned_observation','python_owned_observer'];
 const previous91Selection={...selection,sources:selection.sources.filter((s:any)=>!ownedIds.includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous91Selection)),sources:capsule.sources.filter(s=>!ownedIds.includes(s.id))})),'00e98bc0f524647103cdcd1658ad0b647250ce4cb9d0026155222e3d5a0fd231','all 91 predecessor sources remain unchanged');
 const enumIds=[...ownedIds,'python_enum_semantic','python_enum_observer','python_enum_semantics'];
 const previous88Selection={...selection,sources:selection.sources.filter((s:any)=>!enumIds.includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous88Selection)),sources:capsule.sources.filter(s=>!enumIds.includes(s.id))})),'e06852b9a80cd4e881b2ae20d2ad8bcb3734b151bd96c8677c9fdaa9c14076dc','all 88 predecessor sources remain unchanged');
 const dataIds=[...enumIds,'python_data_semantic','python_query_observer','python_mapping_observer','python_data_semantics','python_decision_semantic','python_rule_observer','python_policy_observer','python_operation_observer'];
 for (const [id, digest] of Object.entries({python_data_semantic:'b3487fa4251af241bc1c8b3eb1102f23861d1034a1cefb07ec739f9cc7b116d0',python_query_observer:'08c92082e288705a5b283a9222f87d6c26efed7ca7df4da3033b18ca50ba7f60',python_mapping_observer:'ec95e86efa845e5d863c5ba34c303090707ec6053d7cb88b6a88a77b2e411d96'})) assert.equal(sha256(getReconciledSource(id)),digest,'unchanged data predecessor:'+id);
 const previous80Selection={...selection,sources:selection.sources.filter((s:any)=>!dataIds.includes(s.id))},previous80Sources=capsule.sources.filter(s=>!dataIds.includes(s.id));
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous80Selection)),sources:previous80Sources})),'60afed8a09c237354a552c15fdadf27cd8b6f5a3973dde184356ef79810ce761','all 80 predecessor sources remain unchanged');
 {
 const selection=previous80Selection,capsule={sources:previous80Sources,schema_version:'domainspec.reconciled-source-capsule/v1-candidate',authority_effect:'none'};
 const semanticIds=['python_semantic','python_calculation_observer','python_calculation_semantics'];
 const previous77Selection={...selection,sources:selection.sources.filter((s:any)=>!semanticIds.includes(s.id))},previous77Sources=capsule.sources.filter(s=>!semanticIds.includes(s.id));
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous77Selection)),sources:previous77Sources})),'6680615bdb9107ed1eece6b62d827b0e1148c425e1f1483eb512b205548e194b','all 77 predecessor sources remain unchanged');
 {
 const selection=previous77Selection,capsule={sources:previous77Sources,schema_version:'domainspec.reconciled-source-capsule/v1-candidate',authority_effect:'none'};
 const nativeIds=['python_native','python_native_observer'];
 const previous75Selection={...selection,sources:selection.sources.filter((s:any)=>!nativeIds.includes(s.id))},previous75Sources=capsule.sources.filter(s=>!nativeIds.includes(s.id));
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous75Selection)),sources:previous75Sources})),'a4b0c90845f9244c5f70db3f4ad79b9c9d5b1b192c038c3e7afbee317a1bb09e','all 75 predecessor sources remain unchanged');
 {
 const selection=previous75Selection,capsule={sources:previous75Sources,schema_version:'domainspec.reconciled-source-capsule/v1-candidate',authority_effect:'none'};
 const previous74Selection={...selection,sources:selection.sources.filter((s:any)=>s.id!=='python_verification')};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous74Selection)),sources:capsule.sources.filter(s=>s.id!=='python_verification')})),'6f1fd9d7bc01b79240d034c3f9503f06e0b6eb1a84c51a1330b06cfdfba163ec','all 74 predecessor sources remain unchanged');
 const previous73Selection={...selection,sources:selection.sources.filter((s:any)=>!['python_cli','python_verification'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous73Selection)),sources:capsule.sources.filter(s=>!['python_cli','python_verification'].includes(s.id))})),'87a28784b401047d2489c4ba737cde831aeb524058c8df7809d62287a173d3ff','all 73 predecessor sources remain unchanged');
 const added=['python','reference_factory','python_project','python_cli','python_verification'];
 const predecessorSelection={...selection,sources:selection.sources.filter((s:any)=>!added.includes(s.id))};
 const predecessorSources=capsule.sources.filter(s=>!added.includes(s.id));
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(predecessorSelection)),sources:predecessorSources})),'2a9f76fd9b352c45cfd8eac36a56adddd0ac86a58097f8106c627e3dd7a553bc','all 70 predecessor sources remain unchanged');
 {
 const selection=predecessorSelection,capsule={sources:predecessorSources,schema_version:'domainspec.reconciled-source-capsule/v1-candidate',authority_effect:'none'};
 const compositionIds=['semantic_composition_binding','semantic_composition_reference','semantic_composition_cases','composition_effect_audit','semantic_composition_controls','semantic_composition_public'];
 const previous64Selection={...selection,sources:selection.sources.filter((s:any)=>!compositionIds.includes(s.id))},previous64Sources=capsule.sources.filter(s=>!compositionIds.includes(s.id));
 assert.equal(previous64Sources.length,64);
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous64Selection)),sources:previous64Sources})),'223fcb2eee34e23aab3ddfb798f0f75ba2832d65bfec15f8405134459723db16','all 64 predecessor sources remain unchanged');
 const workflowIds=['semantic_workflow_controls','semantic_workflow_outcomes','semantic_workflow_values','semantic_workflow_binding','semantic_workflow_execution','semantic_workflow_cases','workflow_effect_audit','workflow_orchestration_audit'];
 const previous56Selection={...previous64Selection,sources:previous64Selection.sources.filter((s:any)=>!workflowIds.includes(s.id))},previous56Sources=previous64Sources.filter(s=>!workflowIds.includes(s.id));
 assert.equal(previous56Sources.length,56);
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous56Selection)),sources:previous56Sources})),'cce5312d129d1b5aa7188215f626d7f43202c21faa8ac834d3fc905c0b25dcc2','all 56 predecessor sources remain unchanged');
 {
 const selection=previous56Selection,capsule={schema_version:'domainspec.reconciled-source-capsule/v1-candidate',authority_effect:'none',sources:previous56Sources};
 const previous55Selection={...selection,sources:selection.sources.filter((s:any)=>s.id!=='semantic_operation_controls')};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous55Selection)),sources:capsule.sources.filter(s=>s.id!=='semantic_operation_controls')})),'cfbaca0ef5312e28f7360e37935ec1ebddf630daeff6233d1ac2fed177789ecd','all 55 predecessor sources remain unchanged');
 const previous54Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous54Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls'].includes(s.id))})),'22e1d372592c4c303ad962ceadbb860e276fc32dc0b8c247dfe8a5285f8e97d8','all 54 predecessor sources remain unchanged');
 const previous53Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous53Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls'].includes(s.id))})),'f83335f525409860b654df53455bdf4bf8ef7316b543900635ac4873af5eaca0','all 53 predecessor sources remain unchanged');
 const previous52Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous52Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls'].includes(s.id))})),'94cff817adcd0f5181cb188232a523ee699addce8ad39cda855107b83808be4b','all 52 predecessor sources remain unchanged');
 const previous51Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous51Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls'].includes(s.id))})),'d9b28c8899c768d66c6bda1dfde1ef5bbe2ac6a49094d36c2838dbed2c0f3c41','all 51 predecessor sources remain unchanged');
 const previous50Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous50Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit'].includes(s.id))})),'7d6d8f370e5a667eda49b713af92b4943162a0280452a6950b20fa834a9723d3','all 50 predecessor sources remain unchanged');
 const previous49Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous49Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls'].includes(s.id))})),'65224aec6b1876989c8777a1e6156c5844611fbc93f50d45cdcc0c01d27b55fb','all 49 predecessor sources remain unchanged');
 const previous48Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous48Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls'].includes(s.id))})),'f19735f9b1dede6604bd0e073d8ae0beb9e5d84277cd0e77a6536b5ff7a4892b','all 48 predecessor sources remain unchanged');
 const previous47Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_rule_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous47Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_rule_controls'].includes(s.id))})),'0dbd2e023386c3c6141bb7889a9f4cdf2ed4dc9c0dbced3ab1ac1c39bc854453','all 47 predecessor sources remain unchanged');
 const previous46Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_factory_controls','semantic_rule_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous46Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_factory_controls','semantic_rule_controls'].includes(s.id))})),'94f256d391480159d30e81030f268d77f36a1e275d9f188b7828bddaa2cd89ae','all 46 predecessor sources remain unchanged');
 const previous45Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_factory_controls','semantic_record_witness','semantic_rule_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous45Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_factory_controls','semantic_record_witness','semantic_rule_controls'].includes(s.id))})),'230ee3b8a5e295172216449865a51b2c9e9eba2f64896e5ecdc6373af789bb08','all 45 predecessor sources remain unchanged');
 const previous44Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_sum_controls','semantic_record_witness','semantic_factory_controls','semantic_rule_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous44Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_sum_controls','semantic_record_witness','semantic_factory_controls','semantic_rule_controls'].includes(s.id))})),'ba00aa51650f9f61b42ec9583d373660317962ad694fb80caac6f37f6336d8ca','all 44 predecessor sources remain unchanged');
 const previous43Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_enum_controls','semantic_sum_controls','semantic_record_witness','semantic_factory_controls','semantic_rule_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous43Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_enum_controls','semantic_sum_controls','semantic_record_witness','semantic_factory_controls','semantic_rule_controls'].includes(s.id))})),'775c20cdc0b2671213b22bec1251fc90dc19ed18673bd87278183a36d84606e1','all 43 predecessor sources remain unchanged');
 const previous42Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_controls','semantic_enum_controls','semantic_sum_controls','semantic_record_witness','semantic_factory_controls','semantic_rule_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous42Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_controls','semantic_enum_controls','semantic_sum_controls','semantic_record_witness','semantic_factory_controls','semantic_rule_controls'].includes(s.id))})),'507f300f1e00d72a7f60bf16f21910c57a5cff85e0a2fc8b79e80901f499e13d','all 42 predecessor sources remain unchanged');
 const previous41Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','verification_entrypoints','semantic_controls','semantic_enum_controls','semantic_sum_controls','semantic_record_witness','semantic_factory_controls','semantic_rule_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous41Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','verification_entrypoints','semantic_controls','semantic_enum_controls','semantic_sum_controls','semantic_record_witness','semantic_factory_controls','semantic_rule_controls'].includes(s.id))})),'e78a8327a1dddf79824800e7208b96d31b5d577c72217f901649445d7b6c445c','all 41 predecessor sources remain unchanged');
 const previous40Selection={...selection,sources:selection.sources.filter((s:any)=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','verification_artifact_coverage','verification_entrypoints','semantic_controls','semantic_enum_controls','semantic_sum_controls','semantic_record_witness','semantic_factory_controls','semantic_rule_controls'].includes(s.id))};
 assert.equal(sha256(canonicalJson({schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previous40Selection)),sources:capsule.sources.filter(s=>!['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','verification_artifact_coverage','verification_entrypoints','semantic_controls','semantic_enum_controls','semantic_sum_controls','semantic_record_witness','semantic_factory_controls','semantic_rule_controls'].includes(s.id))})),'eaf78f2b1b32e1040dfa22946dd97e04c14721696ef733b9208cc3f9dfb2193f','all 40 predecessor sources remain unchanged');
 const newIds=['semantic_operation_controls','semantic_interface_controls','semantic_query_controls','semantic_mapping_controls','semantic_event_controls','state_machine_effect_audit','semantic_state_machine_controls','semantic_policy_controls','semantic_rule_controls','semantic_factory_controls','semantic_record_witness','public_composition_integration','resolved_composition_bindings','verification_artifact_coverage','verification_entrypoints','semantic_controls','semantic_enum_controls','semantic_sum_controls'];
 const previousSelection={...selection,sources:selection.sources.filter((s:any)=>!newIds.includes(s.id))};
 const previousBody={schema_version:capsule.schema_version,authority_effect:capsule.authority_effect,selection_sha256:sha256(canonicalJson(previousSelection)),sources:capsule.sources.filter(s=>!newIds.includes(s.id))};
 assert.equal(sha256(canonicalJson(previousBody)),'264d06e7b1d54b830b70806f98ff511bf42d1dcade0dbfe0c0d9358b2078acd4','all 38 predecessor source rows remain unchanged');
 }
 }
 }
 }
 }
 }
 }
 assert.equal(capsule.selection_sha256,sha256(canonicalJson(selection)));
 assert.ok(Object.isFrozen(capsule)&&Object.isFrozen(capsule.sources));
 for(const row of capsule.sources){
  assert.ok(Object.isFrozen(row));assert.equal(getReconciledSource(row.id),row.content);
  assert.equal(findReconciledSourceByDigest(row.sha256),row);
  assert.equal(row.content,fs.readFileSync(path.join(project,row.path),'utf8'));
  assert.equal(row.sha256,sha256(row.content));assert.equal(row.size_bytes,Buffer.byteLength(row.content));
 }
 const generated=fs.readFileSync(path.join(cli,'src/generation/reconciled-sources.generated.ts'),'utf8');
 assert.equal(materializeReconciledSources(selection,(p:string)=>fs.readFileSync(path.join(project,p),'utf8')),generated);
 assert.equal(execFileSync(process.execPath,['tools/materialize-reconciled-sources.mjs','--check'],{cwd:cli,encoding:'utf8'}).includes('"status":"pass"'),true);
 assert.equal(findReconciledSourceByDigest('0'.repeat(64)),null);
});

test('caller content, recomputed hashes, unknown IDs and active values cannot substitute compiler sources',()=>{
 const capsule=getReconciledSourceCapsule();
 for(const id of ['missing','../development/source','__proto__',null,{}])assert.throws(()=>getReconciledSource(id as any),/DS_RECONCILED_SOURCES/);
 for(const mutate of [
  (v:any)=>{v.sources[0].content+=' ';},
  (v:any)=>{v.sources[0].path='another/source';},
  (v:any)=>{v.sources.reverse();},
  (v:any)=>{v.extra=true;},
  (v:any)=>{v.sources[0].content+=' ';v.sources[0].sha256=sha256(v.sources[0].content);v.sources[0].size_bytes=Buffer.byteLength(v.sources[0].content);const {capsule_sha256,...body}=v;v.capsule_sha256=sha256(canonicalJson(body));},
 ]){const changed=structuredClone(capsule);mutate(changed);assert.throws(()=>validateReconciledSourceCapsule(changed),/DS_RECONCILED_SOURCES/);}
 let reads=0;const active={...capsule};Object.defineProperty(active,'sources',{enumerable:true,get(){reads++;return capsule.sources;}});
 assert.throws(()=>validateReconciledSourceCapsule(active),/inert data/);assert.equal(reads,0);
 assert.deepEqual(validateReconciledSourceCapsule(structuredClone(capsule)),capsule);
});

test('materialization rejects missing bytes, drift, duplicate identities and escaping source paths',()=>{
 const read=(p:string)=>fs.readFileSync(path.join(project,p),'utf8');
 assert.throws(()=>materializeReconciledSources(selection,()=>undefined),/source drift/);
 assert.throws(()=>materializeReconciledSources(selection,(p:string)=>read(p)+' '),/source drift/);
 for(const mutate of [
  (v:any)=>v.sources.push(v.sources[0]),
  (v:any)=>v.sources.push({...v.sources[0],id:'different'}),
  (v:any)=>{v.sources[0].path='../escape';},
  (v:any)=>{v.sources[0].path='/absolute';},
  (v:any)=>{v.sources[0].path='part\\file';},
  (v:any)=>{v.sources[0].path='part/../file';},
  (v:any)=>{v.sources[0].sha256='not-a-digest';},
  (v:any)=>{v.extra=true;},
 ]){const changed=structuredClone(selection);mutate(changed);assert.throws(()=>materializeReconciledSources(changed,read),/DS_SOURCE_MATERIALIZATION/);}
});

test('compiled capsule works after relocation with filesystem access limited to emitted code',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ds-source-capsule-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const require=createRequire(import.meta.url),types=require.resolve('@types/node/package.json',{paths:process.execArgv.filter(a=>a.endsWith('loader.mjs')).map(p=>path.dirname(p))});
 const deps=path.dirname(path.dirname(path.dirname(types))),src=path.join(cli,'src'),dist=path.join(root,'dist');
 const image=execFileSync('docker',['image','inspect','domainspec-node-toolchain:26.8.1-ts7.0.2','--format','{{.Id}}'],{encoding:'utf8'}).trim();
 assert.equal(image,'sha256:ad84ad003986966fc38cf50953363ce81eb44d108734b882bee8b912c9b652ef');
 const args=['run','--rm','--pull','never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--user',process.getuid!()+':'+process.getgid!(),
  '--mount','type=bind,source='+cli+',target='+cli+',readonly','--mount','type=bind,source='+deps+',target='+deps+',readonly','--mount','type=bind,source='+root+',target='+root,'--workdir',root,image,
  'tsc','--ignoreConfig','--strict','--skipLibCheck','--declaration','--types','node','--typeRoots',path.join(deps,'@types'),'--target','ES2022','--module','NodeNext','--rootDir',src,'--outDir',dist,path.join(src,'generation/reconciled-sources.ts')];
 try{execFileSync('docker',args,{encoding:'utf8'});}catch(e:any){throw Error(String(e.stdout)+String(e.stderr));}
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({type:'module'}));
 const moved=path.join(root,'relocated');fs.renameSync(dist,moved);
 const moduleUrl=pathToFileURL(path.join(moved,'generation/reconciled-sources.js')).href;
 const check=`import assert from 'node:assert/strict';import fs from 'node:fs';
  import {getReconciledSourceCapsule,getReconciledSource} from ${JSON.stringify(moduleUrl)};
  assert.throws(()=>fs.readFileSync(${JSON.stringify(path.join(project,selection.sources[0].path))}),{code:'ERR_ACCESS_DENIED'});
 assert.equal(getReconciledSourceCapsule().sources.length,136);
  assert.ok(getReconciledSource('composed_project').length>0);
  assert.ok(getReconciledSource('composed_workflow').length>0);
  assert.ok(getReconciledSource('operation_value_composition').length>0);
  assert.ok(getReconciledSource('composed_operation').length>0);
  assert.equal(getReconciledSourceCapsule().capsule_sha256,${JSON.stringify(RECONCILED_SOURCE_CAPSULE_SHA256)});
  assert.ok(getReconciledSource('operation_action').length>0);
  assert.ok(getReconciledSource('python').includes('python.validated-extensible-entity-factory/v1'));
  assert.ok(getReconciledSource('reference_factory').length>0);
  assert.ok(getReconciledSource('python_project').includes('domainspec.python-project-planning-contract'));
 assert.ok(getReconciledSource('python_cli').includes('domainspec.python-cli-integration-contract'));
 assert.ok(getReconciledSource('python_complete_verification').includes('domainspec.python-complete-verification-contract'));
  assert.ok(getReconciledSource('python_verification').includes('domainspec.python-verification-projection-contract'));
  assert.ok(getReconciledSource('python_native_observer').includes('native binding inventory'));
  assert.ok(getReconciledSource('rust_project').includes('domainspec.reconciled-rust-compilation'));
  assert.ok(getReconciledSource('rust_factory').includes('identity-only Entity Eq/Hash'));
  assert.ok(getReconciledSource('rust_calculation').includes('checked operations'));
  assert.ok(getReconciledSource('rust_query').includes('asynchronous trait'));
  assert.ok(getReconciledSource('rust_mapping').includes('does not construct an Entity'));
  assert.ok(getReconciledSource('rust_policy').includes('without importing or executing the target'));
  assert.ok(getReconciledSource('rust_event').includes('rust-event-generation-contract'));
  assert.ok(getReconciledSource('rust_operation').includes('one atomic state-and-outbox commit'));
  assert.ok(getReconciledSource('rust_state_machine').includes('pure native Rust reducer'));
  assert.ok(getReconciledSource('rust_workflow').includes('forward Workflow orchestrator'));
  assert.ok(getReconciledSource('rust_interface').includes('asynchronous provider trait'));
  assert.ok(getReconciledSource('rust_native_verification').includes('Cargo check offline'));
  assert.ok(getReconciledSource('realization_matrix').includes('exactly 39 explicit metatype-language cells'));
  console.log('relocated-capsule-pass');`;
 assert.equal(execFileSync(process.execPath,['--permission','--allow-fs-read='+root,'--input-type=module','--eval',check],{cwd:root,encoding:'utf8'}).trim(),'relocated-capsule-pass');
});
