// Historical delivered evidence for tokenizer qualification only; no evaluator access.
// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {readFileSync,readdirSync,realpathSync,lstatSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reconstructComparisonPrediction} from './ranked-source-prediction-r1.mjs';
import {bindInvestigationEvidence} from './bounded-archive-frontier-evidence-join-r1.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('catalog-donor.'+m);};
export function loadCatalogDonor({stage,review_sha256,sequence,candidate_slot}){
 need(Number.isSafeInteger(sequence)&&sequence>=0&&sequence<4,'sequence');
 need(/^[a-f0-9]{64}$/.test(review_sha256),'review-pin');
 const bindings=[];let bytes=0;
 const canonical=p=>{p=resolve(p);need(realpathSync(p)===p,'canonical-path');return p;};
 stage=canonical(stage);
 const read=(path,pin)=>{
  path=canonical(path);const stat=lstatSync(path);
  need(stat.isFile()&&stat.size<=128*1024**2-bytes,'read-limit');
  need(typeof pin==='string'&&/^[a-f0-9]{64}$/.test(pin),'missing-file-pin');
  const data=readFileSync(path);bytes+=data.length;
  need(data.length===stat.size&&bytes<=128*1024**2&&hash(data)===pin,'file-drift');
  bindings.push({path,sha256:pin});return data;
 };
 const review=JSON.parse(read(join(stage,'RESULT-REVIEW.json'),review_sha256));
 need(review.approved===true&&review.result_integrity_approved===true,'review-not-approved');
 const pins=new Map();for(const b of review.source_bindings){const p=resolve(b.path);need(!pins.has(p)||pins.get(p)===b.sha256,'conflicting-pin');pins.set(p,b.sha256);}
 const pinned=p=>read(p,pins.get(resolve(p)));
 const freeze=JSON.parse(pinned(join(stage,'FREEZE.json'))),slot=freeze.request.schedule.slots[sequence];
 need(slot?.sequence===sequence&&slot.arm==='ranked-source-hints','donor-slot');
 need(candidate_slot?.arm==='ranked-read-acquisition'&&candidate_slot.sequence===sequence&&candidate_slot.task_id===slot.task_id&&candidate_slot.task_sha256===slot.task_sha256&&candidate_slot.instance_id===slot.instance_id&&candidate_slot.base_commit===slot.base_commit,'candidate-task-binding');
 const task=JSON.parse(read(slot.task_path,slot.task_sha256));
 need(task.instance_id===slot.instance_id&&task.base_commit===slot.base_commit,'task-identity');
 const ordinal=String(sequence).padStart(2,'0'),run=canonical(join(stage,'runs_root',ordinal)),repoRoot=canonical(join(stage,'source_root',ordinal,'base'));
 const result=JSON.parse(pinned(join(run,'result.json')));
 need(canonical(result.source_root)===canonical(join(stage,'source_root',ordinal)),'source-assignment');
 const git=args=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:repoRoot,encoding:'utf8',timeout:120000,maxBuffer:1048576}).trim();
 need(git(['rev-parse','HEAD'])===slot.base_commit&&git(['status','--porcelain'])==='','base-revision-or-drift');
 const names=readdirSync(canonical(join(run,'snapshots'))).sort();
 need(names.length<=4096&&names.every(n=>/^[a-f0-9]{64}\.json$/.test(n)),'snapshot-names');
 const snapshots=names.map(n=>JSON.parse(pinned(join(run,'snapshots',n))));
 const lines=pinned(join(run,'events.jsonl')).toString('utf8').split('\n');if(lines.at(-1)==='')lines.pop();
 need(lines.length<=100000&&lines.every(Boolean),'journal-shape');
 // Reconstruct historical delivery/export integrity, without importing a scorer.
 reconstructComparisonPrediction({arm:slot.arm,result,events:lines.map(JSON.parse),snapshots,task,repoRoot});
 const end=result.branches.at(-1).receipt_indices.at(-1)+1;
 const branch_inputs={branches:result.branches,receipts:result.receipts.slice(0,end)};
 const joined=bindInvestigationEvidence(branch_inputs);
 const material={task,branch_inputs,snapshots,repoRoot,source_bindings:bindings};
 return {...material,donor_sha256:hash(stable(material)),confirmed_reads:joined.read_observations.length,model_calls:0,scope:'Historical confirmed delivery for representative tokenizer qualification only; no gold or quality claim.'};
}
