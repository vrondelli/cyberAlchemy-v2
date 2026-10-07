import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {G02_GATEWAY_IMAGE_DIGEST,G02_MACHINE_ID_SHA256,observeG02Gateway,verifyG02GatewayObservation} from './g02-gateway-observation-v1.mjs';

function spawnFixture({code=0,stdout=`srv1959838\n${G02_MACHINE_ID_SHA256}\n/are-keld-presentation-provider-gateway-1|65532:65532|${G02_GATEWAY_IMAGE_DIGEST}\nsecret-readable-without-reading-bytes\n`}={}){
  return (command,args)=>{assert.equal(command,'ssh');assert.deepEqual(args.slice(0,6),['-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10']);assert.match(args.at(-1),/sha256sum \/etc\/machine-id/);assert.match(args.at(-1),/\.Image/);assert.match(args.at(-1),/accessSync\('\/run\/secrets\/model_api_key'/);assert.doesNotMatch(args.at(-1),/readFile|cat .*model_api_key/);
    const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();queueMicrotask(()=>{child.stdout.emit('data',stdout);child.emit('close',code);});return child;};
}

test('observation binds exact SSH, container user and secret readability without reading bytes',async()=>{
  const times=['2026-09-26T12:00:00.000Z','2026-09-26T12:00:01.000Z'],receipt=await observeG02Gateway({spawn_process:spawnFixture(),now:()=>times.shift()});
  assert.equal(verifyG02GatewayObservation(receipt).ok,true);assert.equal(receipt.secret_bytes_read,false);assert.equal(receipt.provider_calls,0);
  assert.equal(verifyG02GatewayObservation({...receipt,container_user:'root'}).ok,false);
  assert.equal(verifyG02GatewayObservation({...receipt,machine_id_sha256:'0'.repeat(64)}).ok,false);
  assert.equal(verifyG02GatewayObservation({...receipt,container_image_digest:'sha256:'+'0'.repeat(64)}).ok,false);
});

test('observation fails closed on SSH or identity drift',async()=>{
  await assert.rejects(observeG02Gateway({spawn_process:spawnFixture({code:1})}),/\.ssh:/);
  await assert.rejects(observeG02Gateway({spawn_process:spawnFixture({stdout:'other\n/container|root\nno\n'})}),/\.identity/);
});
