import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {createRpcClient} from './rpc-client.mjs';
function fixture(t,options={}){const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();const sent=[];child.stdin.on('data',b=>sent.push(b.toString()));const client=createRpcClient(child,{timeoutMs:500,...options});t.after(()=>client.close());return {child,client,sent};}
test('fragmented UTF-8 JSONL response is correlated',async t=>{const h=fixture(t);const p=h.client.request({id:1,method:'fixture'});const bytes=Buffer.from('{"id":1,"result":{"text":"é"}}\n');for(const byte of bytes)h.child.stdout.write(Buffer.from([byte]));assert.equal((await p).result.text,'é');assert.equal(h.sent.length,1);});
test('EOF rejects pending RPC without retry',async t=>{const h=fixture(t);const p=h.client.request({id:1});h.child.emit('exit',0);await assert.rejects(p,/delivery-unknown/);assert.equal(h.sent.length,1);});
test('timeout rejects pending RPC without retry',async t=>{const h=fixture(t,{timeoutMs:10});await assert.rejects(h.client.request({id:1}),/timeout-delivery-unknown/);assert.equal(h.sent.length,1);});
test('oversized frame fails closed',async t=>{const h=fixture(t,{maxFrameBytes:16});const p=h.client.request({id:1});h.child.stdout.write('x'.repeat(17));await assert.rejects(p,/frame-overflow/);});
test('malformed JSON fails pending RPC',async t=>{const h=fixture(t);const p=h.client.request({id:1});h.child.stdout.write('{broken}\n');await assert.rejects(p,/malformed-rpc-frame/);});
test('unknown response identity cannot satisfy pending RPC',async t=>{const h=fixture(t);const p=h.client.request({id:1});h.child.stdout.write('{"id":2,"result":{}}\n');await assert.rejects(p,/uncorrelated/);});
test('notifications remain distinct from correlated responses',async t=>{const notes=[];const h=fixture(t,{onNotification:m=>notes.push(m)});const p=h.client.request({id:1});h.child.stdout.write('{"method":"fixture","params":{}}\n{"id":1,"result":{}}\n');await p;assert.equal(notes.length,1);});
test('JSON primitives are not treated as notifications',async t=>{const h=fixture(t);const p=h.client.request({id:1});h.child.stdout.write('null\n');await assert.rejects(p,/invalid-rpc-message/);});
