import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {setupCustomerProfile} from './setup-customer-profile.mjs';
import {createCodexAppServerWrapper} from '../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
const engineRoot=resolve(import.meta.dirname,'../../..');

import {customerFixture as fixture} from './customer-fixture.mjs';
test('separate project loads and projects only customer context; live edits refresh',async()=>{
  const root=mkdtempSync(resolve(tmpdir(),'keld-customer-'));
  try{
    const result=await setupCustomerProfile({engineRoot,projectRoot:root,input:fixture(root)});
    const loaded=result.loaded;
    assert.equal(loaded.decision_profile.profile_id,'customer-decision');
    assert.equal(loaded.ontology_snapshot.ontology_id,'customer-only');
    assert.deepEqual(loaded.definition_catalog.definitions.map(d=>d.definition_id),['customer-term']);
    assert.ok(loaded.source_snapshot.every(s=>!s.source_identity.includes('cyberAlchemy')));
    const wrapper=createCodexAppServerWrapper({loaded_profile:loaded.value,decision_profile:loaded.decision_profile,definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,source_snapshot:loaded.source_snapshot,context_source_provider:loaded.context_source_provider});
    const action=await wrapper.processClientMessage({jsonrpc:'2.0',id:1,method:'turn/start',params:{threadId:'customer-thread',input:[{type:'text',text:'Explain Widget'}]}});
    assert.equal(action.to_server.length,1,JSON.stringify(action.to_client));
    assert.match(JSON.stringify(action.to_server),/violet-widget-731/);
    assert.doesNotMatch(JSON.stringify(action.to_server),/CAV2-D65|CA2-ROUTE|domainspec-core/);
    writeFileSync(resolve(root,'AGENTS.md'),'Customer sentinel: changed-widget.\n');
    assert.match(loaded.context_source_provider().instructions[0].content,/changed-widget/);
    rmSync(resolve(root,'AGENTS.md'));
    symlinkSync(resolve(engineRoot,'cyberAlchemy-v2/AGENTS.md'),resolve(root,'AGENTS.md'));
    assert.deepEqual(loaded.context_source_provider().reason_codes,['customer.source-boundary-invalid']);
    rmSync(resolve(root,'AGENTS.md'));
    await assert.rejects(setupCustomerProfile({engineRoot,projectRoot:root,input:fixture(root)}),/EEXIST/);
    assert.ok(existsSync(result.profile_path));
  }finally{rmSync(root,{recursive:true,force:true})}
});
test('escaping customer source fails before setup; invalid profile removes only new output',async()=>{
  const root=mkdtempSync(resolve(tmpdir(),'keld-customer-'));
  try{
    const input=fixture(root);symlinkSync(resolve(engineRoot,'cyberAlchemy-v2/AGENTS.md'),resolve(root,'outside.md'));
    await assert.rejects(setupCustomerProfile({engineRoot,projectRoot:root,input:{...input,instruction_sources:['outside.md']}}),/escapes/);
    assert.ok(!existsSync(resolve(root,'.are-keld')));
    writeFileSync(resolve(root,'ontology.json'),'{}');
    await assert.rejects(setupCustomerProfile({engineRoot,projectRoot:root,input}),/Customer profile invalid/);
    assert.ok(!existsSync(resolve(root,'.are-keld')));
    assert.ok(existsSync(resolve(root,'AGENTS.md')));
  }finally{rmSync(root,{recursive:true,force:true})}
});
