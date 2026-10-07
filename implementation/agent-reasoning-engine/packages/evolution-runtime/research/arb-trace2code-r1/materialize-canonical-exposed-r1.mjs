// Trusted fixture preparation only. Open Questions: G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md.
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,openSync,closeSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {projectFixture} from './project-canonical-buggy-fixture-r1.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export const cohorts=[
  {name:'r3',count:32,root:'/home/vlad_/are-benchmark-archive/defects4j-caller-dev-r1',packet_sha256:'e1636fad114813142c1b2b2a281db29a0de34433457725cf0a4b95e709b46f59'},
  {name:'r4',count:30,root:'/home/vlad_/are-benchmark-archive/defects4j-caller-r4',packet_sha256:'9cf325c8e3cf2c805214e8f48572e20432860d4ab65f17576ecb7cae91ca99dd'}];
export function exposedPackets(){
  return cohorts.flatMap(cohort=>{
    const bytes=readFileSync(join(cohort.root,'PACKETS.jsonl'));if(sha(bytes)!==cohort.packet_sha256)throw Error('packet drift');
    const packets=bytes.toString().trimEnd().split('\n').map(JSON.parse);if(packets.length!==cohort.count)throw Error('case count');
    return packets.map(p=>{
      const m=/^Defects4J-([A-Za-z]+)-(\d+)$/.exec(p.case_id);if(!m)throw Error('invalid exposed identity');
      const expanded=p.prompt.split('Failure:\n')[1].split('\nCandidates:\n')[0];if(sha(expanded)!==p.expanded_query_sha256)throw Error('query drift');
      return {cohort:cohort.name,case_id:p.case_id,project:m[1],bug:Number(m[2]),trace:expanded.split('\nCaller source observations:\n')[0],packet_sha256:cohort.packet_sha256};
    });
  });
}
export function verifyProjection(root){
  const bytes=readFileSync(join(root,'RECEIPT.json'));const r=JSON.parse(bytes);
  if(r.complete!==true||sha(JSON.stringify(r.sources))!==r.source_tree_sha256)throw Error('incomplete projection');
  for(const s of r.sources)if(sha(readFileSync(join(root,'corpus',s.path)))!==s.sha256)throw Error('projection drift');
  return {projection_receipt_sha256:sha(bytes),source_tree_sha256:r.source_tree_sha256,source_count:r.source_count,buggy_commit:r.buggy_commit,project:r.project,bug:r.bug};
}
function main(){
  const stage='/home/vlad_/are-benchmark-archive/defects4j-canonical-exposed-r1';
  const framework='/home/vlad_/are-benchmark-archive/defects4j-runtime-v3.0.1';
  const pin='6d54320e0db5a357f9ab38a8e4d2e5aead7e1c09';
  const repo=resolve(fileURLToPath(new URL('../../../../../..',import.meta.url)));
  if(execFileSync('git',['-C',framework,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==pin)throw Error('framework drift');
  const packets=exposedPackets();if(packets.length!==62||new Set(packets.map(p=>p.case_id)).size!==62)throw Error('denominator');
  mkdirSync(stage,{mode:0o700});for(const name of ['trusted','buggy','logs'])mkdirSync(join(stage,name),{mode:0o700});
  writeFileSync(join(stage,'INPUTS.json'),JSON.stringify({schema:'are.canonical-exposed-fixture-inputs/v1',framework_pin:pin,posture:'all62 already-exposed cases; trusted preparation may access fixed/patch/gold; Java-only consumer boundary',cases:packets,implementation_sha256:sha(readFileSync(fileURLToPath(import.meta.url)))},null,2)+'\n',{flag:'wx',mode:0o600});
  const rows=[];
  // Diagnose the known representability failure first, but retain the full cohort.
  const order=[...packets].sort((a,b)=>Number(b.case_id==='Defects4J-JxPath-7')-Number(a.case_id==='Defects4J-JxPath-7'));
  for(const p of order){
    let projectionRoot=join(stage,'buggy',p.case_id);let state='complete';let failure_phase=null;
    try{
      if(p.case_id==='Defects4J-JxPath-8')projectionRoot='/home/vlad_/are-benchmark-archive/defects4j-canonical-jxpath8-r1/buggy-java-only';
      else{
        const trusted=join(stage,'trusted',p.case_id);const fd=openSync(join(stage,'logs',p.case_id+'.log'),'wx',0o600);
        let result;
        try{result=spawnSync('bash',[join(repo,'tools/toolchain/run-defects4j'),'checkout','-p',p.project,'-v',p.bug+'b','-w',trusted],{timeout:300000,stdio:['ignore',fd,fd],env:{...process.env,TZ:'America/Los_Angeles',GIT_AUTHOR_NAME:'ARE fixture preparation',GIT_AUTHOR_EMAIL:'fixture@are.invalid',GIT_COMMITTER_NAME:'ARE fixture preparation',GIT_COMMITTER_EMAIL:'fixture@are.invalid'}});}finally{closeSync(fd);}
        if(result.status!==0||result.error){failure_phase='framework-checkout';throw Error('framework checkout failed');}
        failure_phase='Java-projection';projectFixture({root:trusted,output:projectionRoot,project:p.project,bug:p.bug,frameworkPin:pin});
      }
      const proof=verifyProjection(projectionRoot);if(proof.project!==p.project||proof.bug!==p.bug)throw Error('projection identity');
      rows.push({...p,state,projection_root:projectionRoot,...proof});
    }catch{state='failed';rows.push({...p,state,failure_phase:failure_phase??'existing-projection-verification',trusted_log:join(stage,'logs',p.case_id+'.log')});}
    writeFileSync(join(stage,'STATUS.json'),JSON.stringify({schema:'are.canonical-exposed-fixture-status/v1',expected:62,finished:rows.length,complete:rows.filter(r=>r.state==='complete').length,failed:rows.filter(r=>r.state==='failed').length,last:p.case_id},null,2)+'\n',{mode:0o600});
    console.log(JSON.stringify({case_id:p.case_id,state,finished:rows.length,expected:62}));
  }
  rows.sort((a,b)=>packets.findIndex(p=>p.case_id===a.case_id)-packets.findIndex(p=>p.case_id===b.case_id));
  const receipt={schema:'are.canonical-exposed-fixtures/v1',posture:'source-preparation evidence, not accuracy, fresh confirmation or superiority',framework_pin:pin,expected:62,complete:rows.filter(r=>r.state==='complete').length,failed:rows.filter(r=>r.state==='failed').length,cases:rows,open_questions_owner:'G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md'};
  const bytes=JSON.stringify(receipt,null,2)+'\n';writeFileSync(join(stage,'FIXTURES.json'),bytes,{flag:'wx',mode:0o600});
  console.log(JSON.stringify({terminal:true,complete:receipt.complete,failed:receipt.failed,receipt_sha256:sha(bytes)}));
  if(receipt.failed)process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
