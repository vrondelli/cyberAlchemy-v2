import assert from 'node:assert/strict';
import {CompilationReceiver,canonical,envelope,verifyCompilation} from './exchange.ts';
import {produceArtifact} from './are-host.ts';

// Explicitly trusted in-memory simulation: no KEP import, encryption or signature.
const source=Buffer.from(process.argv[2] ?? '', 'base64').toString('utf8');
async function main(){
 const sent=envelope(source,'simulation-1');
 const a=await produceArtifact('agent-a',canonical(sent));
 const receiver=new CompilationReceiver();
 const received=JSON.parse(a.bytes);
 const compiled=receiver.receive(received,'agent-a'); // Fixture identity, not authenticated transport.
 const b=await produceArtifact('agent-b',canonical({bundle:compiled.bundle,receipt:compiled.receipt}));
 const returned=JSON.parse(b.bytes);
 assert.ok(verifyCompilation(returned.bundle,returned.receipt,sent),'returned bundle must verify');
 const altered=structuredClone(returned.bundle);
 altered.files[Object.keys(altered.files)[0]]+='\n// simulated tampering';
 assert.equal(verifyCompilation(altered,returned.receipt,sent),false,'tampering must be rejected');
 const replay=receiver.receive(received,'agent-a');
 assert.ok(replay.replayed);
 assert.equal(canonical({bundle:replay.bundle,receipt:replay.receipt}),b.bytes);
 process.stdout.write(JSON.stringify({status:'PASS',mode:'simulation',kep_invoked:false,
   signature_verified:false,live_model_invoked:false,authority_effect:'none',
   source,sent,...returned,agents:[a.evidence,b.evidence],
   checks:{bundle_verified:true,tampering_rejected:true,replay_unchanged:true}})+'\n');
}
main().catch(error=>{console.error('Simulation failed: '+error.message);process.exitCode=1;});
