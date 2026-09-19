// Exact prospective source freeze. Open questions: LIVE-PROTOCOL.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash} from './prepare.mjs';
import {verifyPreparationBindings} from './preflight.mjs';
import {verifyResearchContinuity,verifyEvolutionRecord} from '../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../../../..'),read=p=>JSON.parse(readFileSync(p)),bind=p=>({path:relative(root,p),sha256:hash(readFileSync(p))});
const preparation=join(dir,'preflight-r1'),pre=read(join(preparation,'RESULTS.json'));assert.ok(pre.admitted&&pre.model_calls===0&&pre.rows.length===8);verifyPreparationBindings(pre.source_bindings);
const binding=read(join(dir,'live-continuity.json')),hypotheses=read(join(dir,'live-hypotheses.json')),experiment=read(join(dir,'live-experiment.json')),policy=read(resolve(root,binding.policy_ref));assert.ok(verifyResearchContinuity({binding,hypotheses,policy,phase:'freeze',root}).ok);for(const r of [...hypotheses.records,experiment])assert.ok(verifyEvolutionRecord(r).ok);
const review=read(join(dir,'LIVE-REVIEW.json'));assert.ok(review.approved&&review.scope==='packet-component-live');verifyPreparationBindings(review.source_bindings);
const paths=new Set(pre.source_bindings.map(b=>resolve(root,b.path)));for(const row of pre.rows){verifyPreparationBindings(row.donor_bindings);for(const b of row.donor_bindings)paths.add(resolve(root,b.path));paths.add(resolve(root,row.prepared_path));paths.add(join(resolve(root,row.prepared_path),'../source-manifest.json'));}
for(const n of readdirSync(dir))if((n.endsWith('.mjs')&&!n.startsWith('score'))||['LIVE-PROTOCOL.md','live-continuity.json','live-continuity-validation.json','live-hypotheses.json','live-experiment.json','LIVE-REVIEW.json'].includes(n))paths.add(join(dir,n));
const entries=[...paths].filter(p=>p.startsWith(dir)&&p.endsWith('.mjs'));
const parser=`import {SourceTextModule} from 'node:vm';import {readFileSync} from 'node:fs';import {resolve,dirname} from 'node:path';const pending=JSON.parse(readFileSync(0,'utf8')),seen=new Set(),files=new Set();while(pending.length){const p=pending.pop();if(seen.has(p))continue;seen.add(p);const m=new SourceTextModule(readFileSync(p,'utf8'));for(const spec of m.dependencySpecifiers){if(!spec.startsWith('.'))continue;const child=resolve(dirname(p),spec);files.add(child);if(child.endsWith('.mjs'))pending.push(child);}}process.stdout.write(JSON.stringify([...files]));`;
for(const p of JSON.parse(execFileSync(process.execPath,['--experimental-vm-modules','--input-type=module','-e',parser],{input:JSON.stringify(entries),encoding:'utf8',stdio:['pipe','pipe','pipe']})))paths.add(p);
const freeze={schema:'are.packet-component-live-freeze/v1',approved:true,authority_effect:'none',preparation_directory:relative(root,preparation),preparation_results_sha256:hash(readFileSync(join(preparation,'RESULTS.json'))),maximum_new_model_tokens:128000,maximum_pair_concurrency:2,planned_donors:8,planned_slots:16,model:'glm-5.3-flash',bindings:[...paths].sort().map(bind),prospective_records:['live-hypotheses.json','live-experiment.json'].map(n=>bind(join(dir,n))),continuity:bind(join(dir,'live-continuity.json')),gate_results:[{...bind(join(dir,'live-continuity-validation.json')),success_field:'ok',success_value:true}],review:bind(join(dir,'LIVE-REVIEW.json')),campaign_goal_achieved:false};
writeFileSync(join(dir,'live-freeze.json'),JSON.stringify(freeze,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({frozen:true,bindings:paths.size}));
