import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(change){
  const root=mkdtempSync(join(tmpdir(),'wlc008-verifier-'));
  try{
    const here=root+'/a/b/c/d/latency-comparison-008/';
    const assets=root+'/a/b/c/d/latency-comparison-005/dist/uninstrumented/';
    mkdirSync(here+'native/uninstrumented',{recursive:true});
    mkdirSync(here+'native/source',{recursive:true});mkdirSync(assets,{recursive:true});
    copyFileSync(new URL('./verify-native.mjs',import.meta.url),here+'verify-native.mjs');
    const input={sources:[{path:'selected',sha256:sha('source')}]},bytes=JSON.stringify(input);
    writeFileSync(root+'/selected','source');writeFileSync(here+'build-inputs.json',bytes);
    writeFileSync(here+'native/uninstrumented/essays-desktop','synthetic binary');
    writeFileSync(here+'native/source/Cargo.toml','manifest');writeFileSync(assets+'index.html','asset');
    const identity={arm:'uninstrumented',authority_effect:'none',build_inputs_sha256:sha(bytes),
      build_id:sha(JSON.stringify({arm:'uninstrumented',identity:input})),binary_sha256:sha('synthetic binary'),
      cargo_manifest_sha256:sha('manifest'),tauri_config:{build:{frontendDist:assets}},
      frontend:[{path:'index.html',sha256:sha('asset')}]};
    writeFileSync(here+'native/uninstrumented/identity.json',JSON.stringify(identity));
    change?.({root,here,assets});
    const result=spawnSync(process.execPath,[here+'verify-native.mjs'],{encoding:'utf8'});
    return {status:result.status,...JSON.parse(result.stdout)};
  }finally{rmSync(root,{recursive:true,force:true});}
}
test('synthetic exact artifact passes without runtime attestation',()=>{
  const r=fixture();assert.equal(r.status,0);assert.equal(r.ok,true);assert.equal(r.running_process_attestation,'not_evaluable');
});
test('source, binary, manifest and frontend drift fail closed',()=>{
  for(const mutate of [
    ({root})=>writeFileSync(root+'/selected','changed'),
    ({here})=>writeFileSync(here+'native/uninstrumented/essays-desktop','changed'),
    ({here})=>writeFileSync(here+'native/source/Cargo.toml','changed'),
    ({assets})=>writeFileSync(assets+'index.html','changed'),
    ({assets})=>writeFileSync(assets+'unexpected.js','extra'),
  ]){const r=fixture(mutate);assert.equal(r.status,1);assert.equal(r.ok,false);}
});
test('missing binary is explicitly not evaluable',()=>{
  const r=fixture(({here})=>rmSync(here+'native/uninstrumented/essays-desktop'));
  assert.equal(r.status,1);assert.equal(r.checks[1].status,'not_evaluable');
});
test('wrong arm, asset configuration and input identity fail closed',()=>{
  for(const mutate of [i=>{i.arm='baseline';},i=>{i.tauri_config.build.frontendDist='/wrong/';},i=>{i.build_inputs_sha256='0'.repeat(64);}]){
    const r=fixture(({here})=>{const path=here+'native/uninstrumented/identity.json';const i=JSON.parse(readFileSync(path));mutate(i);writeFileSync(path,JSON.stringify(i));});
    assert.equal(r.status,1);assert.equal(r.ok,false);
  }
});
