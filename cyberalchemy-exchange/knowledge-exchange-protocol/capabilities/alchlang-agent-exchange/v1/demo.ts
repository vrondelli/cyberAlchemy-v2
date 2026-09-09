import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {CompilationReceiver,envelope,canonical,verifyCompilation,sha} from './exchange.ts';
import {produceArtifact} from './are-host.ts';
import {KepBridge,verifySignedReceipt} from './kep-transport.ts';

export async function runExchange(source:string){
  const sent=envelope(source,'local-exchange-1');
  const sender=await produceArtifact('agent-a',canonical(sent));
  const bridge=new KepBridge();
  try{
    const delivered=await bridge.request({op:'deliver',envelope:sender.bytes});
    if(delivered.status!=='delivered' || delivered.envelope_sha256!==sha(sender.bytes) || delivered.envelope!==sender.bytes || delivered.authenticated_sender!=='agent-a')throw new Error('KEP delivery binding failed');
    const receiver=new CompilationReceiver();
    const compiled=receiver.receive(JSON.parse(delivered.envelope),delivered.authenticated_sender);
    const recipient=await produceArtifact('agent-b',canonical({receipt:compiled.receipt,bundle:compiled.bundle}));
    const {receipt,bundle}=JSON.parse(recipient.bytes);
    if(!verifyCompilation(bundle,receipt,sent))throw new Error('compilation receipt mismatch');
    const acknowledgement=await bridge.request({op:'acknowledge',receipt:canonical(receipt)});
    if(!verifySignedReceipt(receipt,acknowledgement,delivered.recipient_public_key_der))throw new Error('recipient signature invalid');
    const replay=receiver.receive(JSON.parse(delivered.envelope),delivered.authenticated_sender);
    const replayAck=await bridge.request({op:'acknowledge',receipt:canonical(replay.receipt)});
    if(!replay.replayed || !replayAck.replayed || replayAck.state_revision!==acknowledgement.state_revision)throw new Error('duplicate delivery changed state');
    return {status:'PASS',host_runtime:'ARE Coding-Agent Runtime',host_mode:'two scripted local fixture turns',
      agents:[sender.evidence,recipient.evidence],kep:{status:acknowledgement.status,owner_count:acknowledgement.owner_count,
      state_revision:acknowledgement.state_revision,acknowledgements:acknowledgement.acknowledgements,
      ciphertext_sha256:delivered.ciphertext_sha256,crypto:delivered.crypto,storage:delivered.storage},
      bundle,bundle_verified:true,receipt,signature_verified:true,recipient_public_key_der:delivered.recipient_public_key_der,signature_der:acknowledgement.signature_der,
      duplicate_delivery:'same receipt; no new acknowledgement',live_model_invoked:false,solana_invoked:false,
      product_approval:null,authority_effect:'none',claim_ceiling:'One local ARE scripted exchange using the KEP crypto adapter and state kernel; not remote agents, durable storage, Solana finality or production conformance.'};
  }finally{await bridge.close();}
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const source=readFileSync(new URL('./sample.alch',import.meta.url),'utf8');
 runExchange(source).then(result=>process.stdout.write(JSON.stringify(result,null,2)+'\n')).catch(error=>{console.error(error.message);process.exitCode=1;});
}
