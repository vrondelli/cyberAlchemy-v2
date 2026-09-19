// Reviewed initial prompt and source identity. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {readFileSync,realpathSync,lstatSync} from 'node:fs';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {verifySchemaAgreementSchedule} from './schema-agreement-schedule-r1.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('ranked-output-donor.'+m);};
export function loadRankedOutputDonor({stage,review_sha256,sequence,candidate_slot}){
 need(Number.isSafeInteger(sequence)&&sequence>=0&&sequence<4,'sequence');stage=resolve(stage);need(realpathSync(stage)===stage,'canonical-stage');
 const bindings=[];let bytes=0;
 const read=(p,pin)=>{p=resolve(p);need(realpathSync(p)===p,'canonical-file');const stat=lstatSync(p);need(stat.isFile()&&stat.size<=128*1024**2-bytes,'read-limit');const data=readFileSync(p);bytes+=data.length;need(bytes<=128*1024**2&&typeof pin==='string'&&hash(data)===pin,'file-drift');bindings.push({path:p,sha256:pin});return JSON.parse(data);};
 const review=read(join(stage,'RESULT-REVIEW-R1.json'),review_sha256);need(review.approved===true&&review.findings.length===0,'review');
 const pins=new Map();for(const b of review.source_bindings){const p=resolve(b.path);need(!pins.has(p)||pins.get(p)===b.sha256,'conflicting-pin');pins.set(p,b.sha256);}
 const pinned=p=>read(p,pins.get(resolve(p)));
 const freeze=pinned(join(stage,'FREEZE.json'));verifySchemaAgreementSchedule({schedule:freeze.request.schedule,...freeze.request.sources});
 const slot=freeze.request.schedule.slots[sequence];need(stable(slot)===stable(candidate_slot),'candidate-slot');
 const report=pinned(join(stage,'supervision/RESULTS.json')),m=report.measurement_report,s=report.process_settlement;
 need(report.qualified===true&&s?.local_settled===true&&s.process_group_absent===true&&s.forced===false&&s.exit_code===0,'settlement');
 need(m?.qualified===true&&m.model_calls===0&&m.schedule_sha256===freeze.request.schedule.schedule_sha256&&m.rows.length===4,'report');
 const row=m.rows[sequence];need(row.qualified===true&&row.slot_id===slot.slot_id&&row.task_sha256===slot.task_sha256&&row.cell_sha256===slot.cell_sha256&&row.model_calls===0,'row');
 const task=read(slot.task_path,slot.task_sha256),initial_wire=pinned(row.prompt_path);
 need(pins.get(resolve(row.prompt_path))===row.prompt_sha256&&row.receipt?.request_sha256===hash(stable(initial_wire))&&initial_wire.model==='glm-5.3-flash','prompt');
 const ordinal=String(sequence).padStart(2,'0'),source_index=pinned(join(stage,'runs_root',ordinal,'source-index.json')),repoRoot=join(stage,'source_root',ordinal,'base');
 need(realpathSync(repoRoot)===repoRoot&&source_index.base_commit===task.base_commit&&task.instance_id===slot.instance_id,'source-identity');
 const git=args=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:repoRoot,encoding:'utf8',timeout:120000,maxBuffer:1048576}).trim();
 need(git(['rev-parse','HEAD'])===task.base_commit&&git(['status','--porcelain'])==='','source-drift');
 const material={task,initial_wire,source_index,repoRoot,source_bindings:bindings};
 return {...material,donor_sha256:hash(stable(material))};
}
