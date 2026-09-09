import {readFileSync,realpathSync,lstatSync} from 'node:fs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
const here=dirname(fileURLToPath(import.meta.url));
const repository=resolve(here,'../../../..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const episodeIds=Object.freeze(['exact-json-scoring','retention-tool-pairs']);
export const availableEpisodeIds=Object.freeze([...episodeIds,'archive-slice-bounds','retention-long-window']);
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const driver=`import {readFileSync} from 'node:fs';
const input=JSON.parse(readFileSync(0,'utf8')), before=JSON.stringify(input.args);
let result;
try {const candidate=await import(process.argv[1]); const value=candidate[input.export_name](...input.args); result={ok:true,value};}
catch(error){result={ok:false,error:error.message};}
if(JSON.stringify(input.args)!==before)result={ok:false,error:'candidate-mutated-input'};
process.stdout.write(JSON.stringify(result));`;

export function verifyEpisodeCandidate(id,root) {
  check(availableEpisodeIds.includes(id),'unknown episode');
  const trustedRoot=realpathSync(root),subject=resolve(trustedRoot,'src/subject.mjs');
  const stat=lstatSync(subject);check(stat.isFile()&&!stat.isSymbolicLink(),'candidate must be a regular file');
  const oracle=JSON.parse(readFileSync(resolve(here,'fixtures',id,'oracle.json'),'utf8'));
  const results=oracle.map(c=>{
    let actual,reason='output-mismatch';
    try {
      const output=execFileSync(process.execPath,['--permission',`--allow-fs-read=${subject}`,'--input-type=module','-e',driver,pathToFileURL(subject).href],{cwd:trustedRoot,env:{},input:JSON.stringify({export_name:c.export_name,args:c.args}),encoding:'utf8',timeout:2000,maxBuffer:65536,stdio:['pipe','pipe','pipe']});
      actual=JSON.parse(output);reason=isDeepStrictEqual(actual,c.expected)?'matched':'output-mismatch';
    } catch {reason='invalid-or-failed-child-output';}
    return {id:c.id,passed:reason==='matched',reason};
  });
  return {ok:results.every(r=>r.passed),passed:results.filter(r=>r.passed).length,expected_tests:oracle.length,results};
}

export async function createEpisode(id,directory) {
  check(availableEpisodeIds.includes(id),'unknown episode');
  const folder=resolve(here,'fixtures',id), manifest=JSON.parse(await readFile(resolve(folder,'manifest.json'),'utf8'));
  const provenance=JSON.parse(await readFile(resolve(folder,'provenance.json'),'utf8'));
  check(hash(await readFile(resolve(repository,provenance.source_path)))===provenance.source_sha256,'upstream source drift');
  const files=new Map();
  for(const [name,digest] of Object.entries(manifest.files)) {const bytes=await readFile(resolve(folder,name));check(hash(bytes)===digest,`fixture drift: ${name}`);files.set(name,bytes);}
  const root=resolve(directory,'fixture');
  await mkdir(root,{recursive:true,mode:0o700});await mkdir(resolve(root,'src'),{mode:0o700});await mkdir(resolve(root,'evidence'),{mode:0o700});await mkdir(resolve(directory,'reference'),{mode:0o700});
  for(const [target,name] of [['src/subject.mjs','mutant.mjs'],['README.md','README.md'],['evidence/contract.json','contract.json'],['evidence/cases.json','cases.json'],['verify.test.mjs','verify.test.mjs']])await writeFile(resolve(root,target),files.get(name),{flag:'wx',mode:0o600});
  if(id==='retention-long-window')for(const n of [1,2])await writeFile(resolve(root,`evidence/extended-${n}.json`),files.get(`extended-${n}.json`),{flag:'wx',mode:0o600});
  await writeFile(resolve(directory,'reference/subject.mjs'),files.get('reference.mjs'),{flag:'wx',mode:0o600});
  const required_reads=['README.md','src/subject.mjs','evidence/contract.json','evidence/cases.json',...(id==='retention-long-window'?['evidence/extended-1.json','evidence/extended-2.json']:[])];
  const request=`Repair the controlled ${id} mutation in src/subject.mjs. Read every required file on a separate model turn: ${required_reads.join(', ')}. The source and both evidence files are necessary acceptance context. Only src/subject.mjs may change; preserve its export and unrelated behavior. Required sequence: finish the ${id==='retention-long-window'?'six':'four'} file reads first. If generation is greater than zero and no archive recovery has completed, your NEXT response must call one offered archive tool before any patch, even when the repair is already known. Prefer read-inspection-evidence with a recorded read-file call_id and one bounded page; use read-context-evidence only if offered. After that single recovery page, return the patch; do not page through the whole archive. Track completed reads and avoid rereading files already verified. Return ONLY the JSON patch object specified by the system, with no prose or Markdown. Propose a small patch; do not execute tools beyond allowed reads or alter tests/evidence.`;
  return {id,root,request,observation_allowlist:required_reads,mutation_allowlist:['src/subject.mjs'],required_reads,verification:{test_path:'verify.test.mjs',expected_tests:8},provenance:{...provenance,fixture_sha256:hash(JSON.stringify(manifest)),files:manifest.files},authority_effect:'none'};
}
