import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('research view executes with all non-builtin imports confined to the owned copy',()=>{
  const root=fileURLToPath(new URL('.',import.meta.url));
  const program=`import {registerHooks} from 'node:module';import {fileURLToPath} from 'node:url';
    registerHooks({resolve(specifier,context,next){const r=next(specifier,context);if(!r.url.startsWith('node:')&&(!r.url.startsWith('file:')||!fileURLToPath(r.url).startsWith(${JSON.stringify(root)})))throw Error('EXTERNAL_IMPORT:'+r.url);return r;}});
    const {loadInput}=await import(${JSON.stringify(new URL('./adapter.mjs',import.meta.url).href)});
    const {buildView}=await import(${JSON.stringify(new URL('./view.mjs',import.meta.url).href)});
    const {view}=buildView(loadInput());if(view.research_dag.nodes.length!==6)throw Error('DAG');console.log(view.view_digest);`;
  const r=spawnSync(process.execPath,['--input-type=module','-e',program],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/^[a-f0-9]{64}\s*$/);
});
