import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,existsSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createCustomerProject,validateProjectSpec} from './create-customer-project.mjs';
import {createCodexAppServerWrapper} from '../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
const engineRoot=resolve(import.meta.dirname,'../../..');
const input={project_id:'bakery',definitions:[{id:'batch',term:'Batch',meaning:'A batch contains twelve loaves.'},{id:'pickup',term:'Pickup',meaning:'Pickup closes at 17:00.'}],instructions:'Use the bakery definitions when explaining orders.',persistent_state:false};

test('customer-authored project loads and projects both definitions without the sample context',async()=>{
  const parent=mkdtempSync(resolve(tmpdir(),'keld-authoring-'));const projectRoot=resolve(parent,'my bakery');
  let wrapper;
  try{
    const {loaded}=await createCustomerProject({engineRoot,projectRoot,input});
    wrapper=createCodexAppServerWrapper({loaded_profile:loaded.value,decision_profile:loaded.decision_profile,definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,source_snapshot:loaded.source_snapshot,context_source_provider:loaded.context_source_provider});
    const result=await wrapper.processClientMessage({jsonrpc:'2.0',id:1,method:'turn/start',params:{threadId:'bakery',input:[{type:'text',text:'Explain a batch and pickup'}]}});
    assert.equal(result.to_server.length,1,JSON.stringify(result.to_client));
    const projection=JSON.stringify(result.to_server);
    assert.match(projection,/twelve loaves/);assert.match(projection,/17:00/);assert.match(projection,/bakery definitions/);
    assert.doesNotMatch(projection,/violet-widget|CAV2-D65|CA2-ROUTE/);
    assert.equal(loaded.value.reasoning_state.storage_mode,'process-memory');
    const before=readFileSync(resolve(projectRoot,'decision.json'));
    await assert.rejects(createCustomerProject({engineRoot,projectRoot,input}),/EEXIST/);
    assert.deepEqual(readFileSync(resolve(projectRoot,'decision.json')),before);
    writeFileSync(resolve(projectRoot,'AGENTS.md'),'Bakery closes on Mondays.');
    assert.match(loaded.context_source_provider().instructions[0].content,/Mondays/);
  }finally{wrapper?.close();rmSync(parent,{recursive:true,force:true})}
});

test('malformed authoring collects independent errors and creates no project',async()=>{
  const parent=mkdtempSync(resolve(tmpdir(),'keld-invalid-authoring-'));const projectRoot=resolve(parent,'invalid');
  try{
    const bad={project_id:'Bad ID',instructions:'',persistent_state:'yes',definitions:[{id:'same',term:'',meaning:''},{id:'same',term:'X',meaning:'Y'}],extra:true};
    const errors=validateProjectSpec(bad);
    assert.ok(errors.length>=6);assert.ok(errors.some(e=>e.includes('duplicated')));
    await assert.rejects(createCustomerProject({engineRoot,projectRoot,input:bad}),/Invalid project specification/);
    assert.equal(existsSync(projectRoot),false);
  }finally{rmSync(parent,{recursive:true,force:true})}
});
