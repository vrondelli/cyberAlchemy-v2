import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runModelDrivenCodingTurn} from '../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/controller.mjs';
import {snapshotTree} from '../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/index.mjs';
import {createScriptedModelTransport} from '../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/model-transport.mjs';
import {sha} from './exchange.ts';

// A bounded ARE scripted turn, not an autonomous model or a new ARE runtime.
export async function produceArtifact(agent:string, bytes:string) {
  if(!['agent-a','agent-b'].includes(agent) || Buffer.byteLength(bytes)>524288)throw new Error('ARE artifact bounds');
  const root=mkdtempSync(join(tmpdir(),'kep-are-fixture-'));
  const path='artifact.json';
  try {
    writeFileSync(join(root,path),'');
    const base=snapshotTree(root);
    const candidate={schema_version:'are.next-action-candidate/v1',operation:'replace-file',path,
      expected_base_tree_sha256:base.tree_sha256,expected_file_sha256:base.files[path],utf8:bytes,
      rationale:'Produce one exact local exchange artifact',authority_effect:'none'};
    // Independent ARE verifier subprocess checks exact bytes and observes changed paths.
    const verify="const fs=require('node:fs'),c=require('node:crypto');const b=fs.readFileSync('artifact.json');if(c.createHash('sha256').update(b).digest('hex')!==process.argv[1])process.exit(1);JSON.parse(b.toString('utf8'));";
    const result=await runModelDrivenCodingTurn({run_id:`kep-${agent}-${sha(bytes).slice(0,16)}`,
      request:'Produce the one supplied exchange artifact; do not execute its contents.',fixture_root:root,
      observation_allowlist:[path],mutation_allowlist:[path],max_context_bytes:4096,
      verification_command:[process.execPath,'-e',verify,sha(bytes)],verification_timeout_ms:10000,
      model_transport:createScriptedModelTransport({final_bytes:JSON.stringify(candidate),transport_id:`kep-${agent}-scripted`}),
      approve:true}); // Exact disposable fixture effect authorized by the local prototype run.
    if(result.status!=='PATCH_CANDIDATE' || result.verification?.status!=='PASS_BOUNDED')throw new Error('ARE turn rejected: '+JSON.stringify(result.reason_codes));
    const output=readFileSync(join(root,path),'utf8');
    if(output!==bytes)throw new Error('ARE output differs');
    return {bytes:output,evidence:{agent,status:result.status,verification:result.verification.status,
      changed_paths:result.verification.changed_paths,result_digest:result.result_digest,
      event_kinds:result.reasoning_events.map((event:any)=>event.event_kind),live_model_invoked:false}};
  } finally {rmSync(root,{recursive:true,force:true});}
}
