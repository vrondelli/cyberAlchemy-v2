import vm from 'node:vm';import {resolve,dirname} from 'node:path';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdtempSync,rmSync,existsSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {verifyQualificationFreeze,executeQualification} from './run-comparison-compact-qualification.mjs';
const original=new URL('./comparison-qualification-live-r1/FREEZE.json',import.meta.url),hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(t,mutate=()=>{}){const root=mkdtempSync(join(tmpdir(),'qualify-freeze-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const f=JSON.parse(readFileSync(original));
const files=new Map(f.files.map(b=>[b.path,b]));
function add(path){path=resolve(path);if(files.has(path))return;const bytes=readFileSync(path);files.set(path,{path,sha256:hash(bytes)});if(path.endsWith('.mjs'))for(const spec of new vm.SourceTextModule(bytes.toString()).dependencySpecifiers)if(!spec.startsWith('node:'))add(resolve(dirname(path),spec));}
for(const name of ['run-comparison-compact-qualification.mjs','comparison-compact-qualification-worker.mjs'])add(join(import.meta.dirname,name));
f.files=[...files.values()];
for(const key of ['outcome_root','runs_root','metadata_root','source_root'])f.request[key]=join(root,key);
mutate(f);const raw=JSON.stringify(f),manifest_path=join(root,'freeze.json');writeFileSync(manifest_path,raw);return {root,f,manifest_path,manifest_sha256:hash(raw)};}
test('actual source closure verifies without provider calls',t=>{const x=fixture(t);assert.ok(verifyQualificationFreeze(x.manifest_path,x.manifest_sha256).files.some(b=>b.path.endsWith('/comparison-compact-arm.mjs')));});
test('wrong manifest digest and changed file digest fail',t=>{const x=fixture(t,f=>{f.files[0].sha256='0'.repeat(64);});assert.throws(()=>verifyQualificationFreeze(x.manifest_path,'0'.repeat(64)),/manifest-drift/);assert.throws(()=>verifyQualificationFreeze(x.manifest_path,x.manifest_sha256),/source-drift/);});
test('missing required worker rejects even when remaining files match',t=>{const x=fixture(t,f=>{f.files=f.files.filter(b=>!b.path.endsWith('/comparison-compact-qualification-worker.mjs'));});assert.throws(()=>verifyQualificationFreeze(x.manifest_path,x.manifest_sha256),/entry-binding/);});
test('unapproved live review stops before roots or provider access',async t=>{const x=fixture(t),review_path=join(x.root,'review.json');writeFileSync(review_path,JSON.stringify({approved:true,live_execution_admitted:false,manifest_sha256:x.manifest_sha256}));await assert.rejects(executeQualification({...x,review_path,signal:new AbortController().signal}),/exact-review/);for(const key of ['outcome_root','runs_root','metadata_root','source_root'])assert.equal(existsSync(x.f.request[key]),false);});
