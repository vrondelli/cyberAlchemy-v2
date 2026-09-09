import test from 'node:test';
import assert from 'node:assert/strict';
import {downloadOriginal} from './download-original.js';
test('retrieval verifies then automatically saves original bytes',async()=>{const e={},bytes=new Uint8Array([0,255,1]);let saved;await downloadOriginal(e,async()=>{e.received={file:{name:'a.png',bytes}};},f=>saved=f);assert.equal(saved.bytes,bytes);});
test('acknowledgement failure still permits automatic saving',async()=>{const e={};let saves=0;await assert.rejects(downloadOriginal(e,async()=>{e.received={file:{bytes:new Uint8Array([1])}};throw Error('Receipt pending');},()=>saves++),/Receipt pending/);assert.equal(saves,1);});
test('failed decryption or access never saves',async()=>{let saves=0;await assert.rejects(downloadOriginal({},async()=>{throw Error('Access denied');},()=>saves++));assert.equal(saves,0);});
test('save again uses verified bytes without retrieval or acknowledgement',async()=>{let retrieves=0,saves=0;await downloadOriginal({received:{file:{}}},()=>retrieves++,()=>saves++);assert.equal(retrieves,0);assert.equal(saves,1);});
test('save initiation failure presents actionable fallback',async()=>{await assert.rejects(downloadOriginal({received:{file:{}}},()=>{},()=>{throw Error('blocked');}),/blocked/);});
