import {execFileSync} from 'node:child_process';
import {fstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadCustomerProfile} from './setup-customer-profile.mjs';

if(process.argv.length!==5)throw Error('Usage: node customer-app-server.mjs <engine-root> <project-root> <codex-binary>');
const engine=resolve(process.argv[2]),project=resolve(process.argv[3]),binary=resolve(process.argv[4]);
const runtime=resolve(engine,'cyberAlchemy-v2/implementation/agent-reasoning-engine');
const api=await import(pathToFileURL(resolve(runtime,'packages/codex-app-server-wrapper/index.mjs')));
const {realizeActivatedModulePort}=await import(pathToFileURL(resolve(runtime,'packages/module-port-governance-cutover/index.mjs')));
const loaded=await loadCustomerProfile(engine,project);
const version=execFileSync(binary,['--version'],{encoding:'utf8',timeout:15000}).trim();
const protocol=api.protocolBindingCheck(loaded.value.protocol_binding,version);
if(!protocol.ok)throw Error('Agent protocol mismatch: '+protocol.reason_codes?.join(','));
const cutover=realizeActivatedModulePort({repository_root:resolve(engine,'cyberAlchemy-v2')});
if(!cutover.ok)throw Error('Engine module-port validation failed: '+cutover.reason_codes?.join(','));
if(loaded.value.reasoning_state.storage_mode==='append-only-file-fsync'){
  const fd=Number(process.env.KELD_WRITER_LOCK_FD);
  if(!Number.isInteger(fd)||fd<3||!fstatSync(fd).isFile())throw Error('Launch persistent sessions through customer-app-server.mjs');
}
let wrapper;
process.once('exit',()=>wrapper?.close());
wrapper=api.createCodexAppServerWrapper({loaded_profile:loaded.value,decision_profile:loaded.decision_profile,
  definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,
  source_snapshot:loaded.source_snapshot,context_source_provider:loaded.context_source_provider,
  semantic_profile:loaded.semantic_profile,module_port:cutover.port});
const upstream=api.runStdioProxy({wrapper,command:binary});
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{
  upstream.kill('SIGTERM');
  const timer=setTimeout(()=>{upstream.kill('SIGKILL');process.exit(1)},2000);timer.unref();
});
upstream.once('exit',(code)=>process.exit(code??1));
