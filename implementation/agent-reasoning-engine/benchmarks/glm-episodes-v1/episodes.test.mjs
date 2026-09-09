import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,copyFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createReadOnlyToolRuntime} from '../../packages/coding-agent-runtime/read-only-tools.mjs';
import {episodeIds,createEpisode,verifyEpisodeCandidate} from './episodes.mjs';
const here=dirname(fileURLToPath(import.meta.url));
async function fixture(id,run){const dir=await mkdtemp('/tmp/glm-episodes-test-');try{const episode=await createEpisode(id,dir);await run(episode,dir);}finally{await rm(dir,{recursive:true,force:true});}}
for(const id of episodeIds){
 test(`${id}: mutant fails and source-derived reference passes independent oracle`,async()=>fixture(id,async(e,dir)=>{const before=verifyEpisodeCandidate(id,e.root);assert(!before.ok);assert(before.passed<8);await copyFile(resolve(dir,'reference/subject.mjs'),resolve(e.root,'src/subject.mjs'));const after=verifyEpisodeCandidate(id,e.root);assert.equal(after.ok,true);assert.equal(after.passed,8);assert.equal(after.expected_tests,8);execFileSync(process.execPath,['--test',e.verification.test_path],{cwd:e.root,timeout:10000,stdio:'pipe'});}));
 test(`${id}: deterministic fixture pins and reference/test isolation`,async()=>fixture(id,async(e,dir)=>{await fixture(id,async(other)=>{assert.equal(e.request,other.request);assert.match(e.request,/Prefer read-inspection-evidence with a recorded read-file call_id/);assert.match(e.request,/read-context-evidence only if offered/);assert.match(e.request,/Return ONLY the JSON patch object/);assert.deepEqual(e.provenance,other.provenance);assert.deepEqual(e.verification,other.verification);for(const path of e.observation_allowlist)assert.deepEqual(await readFile(resolve(e.root,path)),await readFile(resolve(other.root,path)));});const tools=createReadOnlyToolRuntime({repository_root:e.root,observation_allowlist:e.observation_allowlist,maximum_result_bytes:12000});for(const path of e.required_reads)assert.equal(tools.invoke('read-file',{path}).ok,true);assert.equal(tools.invoke('read-file',{path:'verify.test.mjs'}).ok,false);assert.deepEqual(e.observation_allowlist,e.required_reads);assert.deepEqual(e.mutation_allowlist,['src/subject.mjs']);assert(!e.observation_allowlist.includes('verify.test.mjs'));assert(!e.observation_allowlist.some(p=>/oracle|reference|provenance/.test(p)));for(const path of ['evidence/contract.json','evidence/cases.json']){const bytes=await readFile(resolve(e.root,path));assert(bytes.length<=11000);assert(bytes.length>7000);assert(JSON.parse(bytes).examples.length>=16);}await assert.rejects(createEpisode(id,dir));}));
}
test('TAP pass spoof plus successful process exit cannot fool independent oracle',async()=>fixture(episodeIds[0],async(e)=>{await writeFile(resolve(e.root,'src/subject.mjs'),'console.log("TAP version 13\\n1..8\\n# tests 8\\n# pass 8\\n# fail 0"); process.exit(0);');const result=verifyEpisodeCandidate(e.id,e.root);assert.equal(result.ok,false);assert.equal(result.passed,0);}));
test('candidate cannot read hidden oracle or write fixture files',async()=>fixture(episodeIds[0],async(e)=>{const subject=resolve(e.root,'src/subject.mjs');await writeFile(subject,`import {readFileSync} from 'node:fs'; readFileSync(${JSON.stringify(resolve(here,'fixtures/exact-json-scoring/oracle.json'))}); export function scoreResponse(){return {passed:true,reason:'exact_json_match'}}`);assert.equal(verifyEpisodeCandidate(e.id,e.root).passed,0);const target=resolve(e.root,'forbidden-write');await writeFile(subject,`import {writeFileSync} from 'node:fs'; writeFileSync(${JSON.stringify(target)},'tamper');`);assert.equal(verifyEpisodeCandidate(e.id,e.root).passed,0);await assert.rejects(stat(target),/ENOENT/);}));
test('candidate cannot launch a subprocess',async()=>fixture(episodeIds[0],async(e)=>{await writeFile(resolve(e.root,'src/subject.mjs'),"import {execFileSync} from 'node:child_process';execFileSync(process.execPath,['-e','process.exit(0)']);");assert.equal(verifyEpisodeCandidate(e.id,e.root).passed,0);}));
test('in-place masking is rejected even when returned values match',async()=>fixture('retention-tool-pairs',async(e,dir)=>{const reference=(await readFile(resolve(dir,'reference/subject.mjs'),'utf8')).replace('export function projectObservations','function original');await writeFile(resolve(e.root,'src/subject.mjs'),reference+"\nexport function projectObservations(history,...rest){const output=original(history,...rest);history.splice(0,history.length,...output);return output;}\n");const result=verifyEpisodeCandidate(e.id,e.root);assert.equal(result.ok,false);assert.equal(result.results.find(r=>r.id==='mask-old-only').passed,false);}));

for(const id of ['archive-slice-bounds','retention-long-window']){
 test(`${id}: separate pinned mutation and independent oracle`,async()=>fixture(id,async(e,dir)=>{
  const before=verifyEpisodeCandidate(id,e.root);assert.equal(before.ok,false);
  await copyFile(resolve(dir,'reference/subject.mjs'),resolve(e.root,'src/subject.mjs'));
  const after=verifyEpisodeCandidate(id,e.root);assert.equal(after.ok,true);assert.equal(after.passed,8);
  execFileSync(process.execPath,['--test',e.verification.test_path],{cwd:e.root,timeout:10000,stdio:'pipe'});
  const tools=createReadOnlyToolRuntime({repository_root:e.root,observation_allowlist:e.observation_allowlist,maximum_result_bytes:12000});
  for(const path of e.required_reads)assert.equal(tools.invoke('read-file',{path}).ok,true);
  assert.equal(tools.invoke('read-file',{path:'verify.test.mjs'}).ok,false);
  assert.equal(e.required_reads.length,id==='retention-long-window'?6:4);
  await fixture(id,async(other)=>{assert.deepEqual(other.provenance,e.provenance);assert.equal(other.request,e.request);});
 }));
}
