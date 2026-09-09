import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {verifyEpisodeCandidate} from '/home/vrondelli/projects/cyberAlchemy-v2/implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/episodes.mjs';
const base='/home/vrondelli/projects/cyberAlchemy-v2/implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/evidence';
const trials=[];
for(const [i,episode] of [[1,'retention-long-window'],[2,'archive-slice-bounds'],[3,'exact-json-scoring'],[4,'exact-json-scoring'],[5,'archive-slice-bounds'],[6,'retention-long-window']]) {
 const candidate=JSON.parse(readFileSync(join(base,'fixed-repeatability-2026-09-08/run',`trial-${String(i).padStart(2,'0')}`,'candidate.json')));
 const root=mkdtempSync(join(tmpdir(),'are-oracle-recheck-'));
 try {mkdirSync(join(root,'src'));writeFileSync(join(root,'src/subject.mjs'),candidate.changes[0].utf8);trials.push({index:i,episode,result:verifyEpisodeCandidate(episode,root)});}
 finally{rmSync(root,{recursive:true,force:true});}
}
writeFileSync(join(base,'repair-validation-2026-09-08/oracle-recheck.json'),JSON.stringify({authority_effect:'none',historical_scores_replaced:false,provider_calls:0,trials,open_questions_ref:'README.md#open-questions'},null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify(trials));
