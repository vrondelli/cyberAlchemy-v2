import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {realpathSync} from 'node:fs';
import {isMeasurementSpec,load} from './loader.mjs';
import {specURL} from '../campaign/measurement-loader.mjs';

const runtime=new URL('../../../../runtime/',import.meta.url);
const mochaRequire=createRequire(realpathSync(new URL('node_modules/@wdio/mocha-framework/build/index.js',runtime)));
const mochaPath=mochaRequire.resolve('mocha');
test('only exact spec path matches despite cache query or fragment',()=>{
  assert.equal(isMeasurementSpec(specURL),true);
  assert.equal(isMeasurementSpec(specURL+'?invalidateCache=0.123#test'),true);
  assert.equal(isMeasurementSpec(specURL+'.other?invalidateCache=0.123'),false);
  assert.equal(isMeasurementSpec('https://example.com/spec.mjs'),false);
  assert.equal(isMeasurementSpec('invalid'),false);
});
test('decorated source still requires the pinned hash',async()=>{
  await assert.rejects(load(specURL+'?invalidateCache=1',{},async()=>({source:'changed'})),/MEASUREMENT_SPEC_DRIFT/);
});
test('unrelated modules pass through unchanged',async()=>{
  const result={source:'unchanged'};
  assert.equal(await load('file:///unrelated.mjs',{},async()=>result),result);
});
for(const [name,register,expected] of [
  ['original loader reproduces WDIO cache-URL miss','../campaign/measurement-register.mjs',false],
  ['v2 transforms spec through installed Mocha cache decoration','./register.mjs',true],
])test(name,()=>{
  const script=`import Mocha from ${JSON.stringify(mochaPath)};
    const mocha=new Mocha();mocha.addFile(${JSON.stringify(fileURLToPath(specURL))});
    await mocha.loadFilesAsync({esmDecorator:file=>file+'?invalidateCache=0.123'});
    const tests=mocha.suite.suites.flatMap(s=>s.tests);
    if(tests.length!==1)throw Error('SPEC_NOT_LOADED');
    const marked=tests[0].fn.toString().includes('collectionMode: "measurement-only/v1"');
    if(marked!==${expected})throw Error('UNEXPECTED_TRANSFORM');
    console.log('VERIFIED');`;
  const result=spawnSync(process.execPath,['--import',fileURLToPath(new URL(register,import.meta.url)),'--input-type=module','-e',script],{encoding:'utf8',timeout:10000});
  assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/VERIFIED/);
});
