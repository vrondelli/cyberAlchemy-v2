import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {publicCheckPlan} from './public-checks.mjs';
import {validatePublicCases} from '../../packages/coding-agent-runtime/public-case-validation.mjs';
const here=dirname(fileURLToPath(import.meta.url)),hash=x=>createHash('sha256').update(x).digest('hex');
const root=resolve(process.argv[2]),output=resolve(process.argv[3]),aggregate=JSON.parse(readFileSync(join(root,'result.json'))),rows=[];
for(const t of aggregate.trials) {
 if(!t.gate){rows.push({id:t.id,status:'no-submitted-candidate',checked:false});continue;}
 const trial=join(root,`trial-${String(t.index).padStart(2,'0')}`),candidateBytes=readFileSync(join(trial,'candidate.json')),candidate=JSON.parse(candidateBytes);
 const manifest=JSON.parse(readFileSync(join(trial,'manifest.json'))),task=manifest.arms[0].task;
 if(candidate.expected_base_tree_sha256!==task.fixture_tree_sha256||candidate.changes.length!==1||candidate.changes[0].path!=='src/subject.mjs'||candidate.changes[0].operation!=='replace-file'||candidate.changes[0].expected_file_sha256!==task.fixture_files['src/subject.mjs'])throw Error('replay-candidate-binding');
 const plan=publicCheckPlan(t.episode,join(here,'fixtures',t.episode,'cases.json'));
 if(plan.sources[0].sha256!==task.fixture_files['evidence/cases.json'])throw Error('replay-evidence-binding');
 const temp=mkdtempSync(join(tmpdir(),'are-public-replay-'));
 try {
  const subject=join(temp,'subject.mjs');writeFileSync(subject,candidate.changes[0].utf8,{flag:'wx',mode:0o600});
  const result=validatePublicCases({subject,plan});
  rows.push({id:t.id,checked:true,prior_repair:t.repair,candidate_file_sha256:hash(candidateBytes),plan,result});
 }finally{rmSync(temp,{recursive:true,force:true});}
}
writeFileSync(output,JSON.stringify({schema_version:'are.public-validation-replay/v1',authority_effect:'none',historical_run:root,provider_calls:0,trials:rows,open_questions_ref:'README.md#open-questions'},null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify(rows.map(r=>({id:r.id,checked:r.checked,prior_repair:r.prior_repair,public_pass:r.result?.ok,failed:r.result?.results.filter(x=>!x.passed).map(x=>x.id)})),null,2));
