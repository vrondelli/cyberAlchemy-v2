// Prepare one source-only G02 development pair. No gold columns are loaded.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {copyFileSync,cpSync,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

const suffix=process.env.G02_PAIR_SUFFIX??'groups-r1';
const instance=process.env.G02_INSTANCE??'SWE-Bench-Pro__javascript__maintenance__bugfix__ad093510';
if(!/^[a-z0-9-]+$/.test(suffix)||!/^[A-Za-z0-9_-]+$/.test(instance))throw Error('g02-cross-layer-prospective.invalid-target');
const root='/opt/are-benchmark-runs/g02-cross-layer-'+suffix;
const prior='/opt/are-benchmark-runs/g02-nodebb-09eb-r1';
const diagnostic='/opt/are/evolution-runtime/g02-cross-layer-nodebb-live-diagnostic-r4';
const tools=process.env.G02_TOOLS_ROOT??'/opt/are/evolution-runtime/g02-cross-layer-prospective-tools-r1';
const exposed=process.env.G02_EXPOSED==='1';
const goPacket=process.env.G02_GO_PACKET==='1';
const retention=process.env.G02_RETENTION==='1';
const selectiveRetention=process.env.G02_SELECTIVE_RETENTION==='1';
const ownExpansions=process.env.G02_OWN_EXPANSIONS==='1';
const repository=process.env.G02_REPO??'NodeBB/NodeBB';
const cacheName={
  'NodeBB/NodeBB':'nodebb',
  'flipt-io/flipt':'flipt',
  'qutebrowser/qutebrowser':'qutebrowser',
  'internetarchive/openlibrary':'openlibrary',
  'navidrome/navidrome':'navidrome',
  'element-hq/element-web':'elementweb',
}[repository];
if(!cacheName)throw Error('g02-cross-layer-prospective.unsupported-repository');
if(!tools.startsWith('/opt/are/evolution-runtime/')||tools.includes('..'))throw Error('g02-cross-layer-prospective.invalid-tools-root');
const dataset='/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(value,reason)=>{if(!value)throw Error('g02-cross-layer-prospective.'+reason);};
need(!existsSync(root),'root-exists');
for(const path of [prior,diagnostic,dataset,join(tools,'cross-layer-source-hints.mjs')])need(existsSync(path),'source-missing');
mkdirSync(root,{recursive:false,mode:0o700});
mkdirSync(join(root,'tasks'));mkdirSync(join(root,'code'));
cpSync(join(prior,'code'),join(root,'code'),{recursive:true,force:true});
const taskFile=instance+'.json';
const projectScript='import json,sys,pyarrow.parquet as pq; fields=("instance_id","original_inst_id","repo","repo_url","language","base_commit","problem_statement","source"); rows=[r for r in pq.read_table(sys.argv[1],columns=list(fields)).to_pylist() if r["instance_id"]==sys.argv[2]]; assert len(rows)==1; open(sys.argv[3],"x").write(json.dumps(rows[0],indent=2)+"\\n")';
const project=spawnSync('python3',['-c',projectScript,dataset,instance,join(root,'tasks',taskFile)],{encoding:'utf8'});
need(project.status===0,'source-projection:'+project.stderr?.slice(0,240));
const taskBytes=readFileSync(join(root,'tasks',taskFile));
const task=JSON.parse(taskBytes);
need(task.repo===repository&&task.source==='Pro'&&task.instance_id===instance,'task-identity');
const cache='/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926/cache/'+cacheName;
const commit=spawnSync('git',['-C',cache,'cat-file','-e',task.base_commit+'^{commit}']);
need(commit.status===0,'commit-unavailable');
const binding={instance_id:instance,task_file:taskFile,task_sha256:sha(taskBytes),base_commit:task.base_commit,
  cache:cacheName,experiment_id:'g02-cross-layer-'+suffix,container_name:'are-g02-cross-layer-'+suffix};
writeFileSync(join(root,'tasks/binding.json'),JSON.stringify(binding,null,2)+'\n',{flag:'wx'});
copyFileSync(join(tools,'cross-layer-source-hints.mjs'),join(root,'code/cross-layer-source-hints.mjs'));
const builder=spawnSync('/opt/cyberalchemy-are-tools/node-24.10.0/node',[
  existsSync(join(tools,'build-ranker.mjs'))?join(tools,'build-ranker.mjs'):join(diagnostic,'code/build-ranker.mjs'),
  join(prior,'code/ranked-source-acquisition.mjs'),
  join(root,'code/cross-layer-source-hints.mjs'),join(root,'code/ranked-source-acquisition.mjs.new')],{encoding:'utf8'});
need(builder.status===0,'ranker-build:'+builder.stderr?.slice(0,240));
copyFileSync(join(root,'code/ranked-source-acquisition.mjs.new'),join(root,'code/ranked-source-acquisition.mjs'));
if(goPacket){
  const built=spawnSync('/opt/cyberalchemy-are-tools/node-24.10.0/node',[
    join(tools,'build-go-packet.mjs'),join(prior,'code/episode-recovery-v2.mjs'),
    join(root,'code/episode-recovery-v2.mjs.new')],{encoding:'utf8'});
  need(built.status===0,'packet-build:'+built.stderr?.slice(0,240));
  copyFileSync(join(root,'code/episode-recovery-v2.mjs.new'),join(root,'code/episode-recovery-v2.mjs'));
}
if(selectiveRetention){
  need(retention,'selective-retention-requires-retention');
  const built=spawnSync('/opt/cyberalchemy-are-tools/node-24.10.0/node',[
    join(tools,'build-selective-retention-episode.mjs'),join(prior,'code/episode-recovery-v2.mjs'),
    join(root,'code/episode-recovery-v2.mjs.new')],{encoding:'utf8'});
  need(built.status===0,'selective-retention-build:'+built.stderr?.slice(0,240));
  copyFileSync(join(root,'code/episode-recovery-v2.mjs.new'),join(root,'code/episode-recovery-v2.mjs'));
}
if(ownExpansions){
  const built=spawnSync('/opt/cyberalchemy-are-tools/node-24.10.0/node',[
    join(tools,'build-own-expansions-base.mjs'),join(prior,'code/base-overlay.mjs'),
    join(root,'code/base-overlay.mjs.new')],{encoding:'utf8'});
  need(built.status===0,'own-expansions-build:'+built.stderr?.slice(0,240));
  copyFileSync(join(root,'code/base-overlay.mjs.new'),join(root,'code/base-overlay.mjs'));
}
if(retention){
  const built=spawnSync('/opt/cyberalchemy-are-tools/node-24.10.0/node',[
    join(tools,'build-retention-profile.mjs'),join(prior,'code/deepseek-full-window-profile.mjs'),
    join(root,'code/deepseek-full-window-profile.mjs.new')],{encoding:'utf8'});
  need(built.status===0,'retention-build:'+built.stderr?.slice(0,240));
  copyFileSync(join(root,'code/deepseek-full-window-profile.mjs.new'),join(root,'code/deepseek-full-window-profile.mjs'));
}
const hashes={};
for(const path of ['tasks/'+taskFile,'tasks/binding.json','code/ranked-source-acquisition.mjs','code/cross-layer-source-hints.mjs',
  'code/confirm-are.mjs','code/episode-recovery-v2.mjs','code/orchestrate-recovery-v2.mjs',
  'code/deepseek-full-window-profile.mjs','code/base-overlay.mjs','code/run_dsh_control.py'])
  hashes[path]=sha(readFileSync(join(root,path)));
const freeze={schema_version:'are.g02-cross-layer-prospective-freeze/v1',status:'frozen-before-model-dispatch',instance_id:instance,
  selection:exposed?'Exposed task; ARE-only mechanism diagnostic after its matched pair was scored. No prospective claim.':
    'Source-only cross-repository development objective with no task-specific G02 evidence found before selection. Earlier round-30 exposure requires an independent holdout audit.',
  task_posture:exposed?'exposed-diagnostic':'source-only-development-pair',
  source_columns:['instance_id','original_inst_id','repo','repo_url','language','base_commit','problem_statement','source'],
  arm_model:'glm-5.3-flash',are_token_cap:650000,dsh_token_cap:1000000,
  go_focused_packet_line_cap:goPacket?100:50,
  discovery_retention:retention,
  selective_retention:selectiveRetention,
  own_expansions_fix:ownExpansions,
  primary_quality:['native Span-F1','native File-F1'],efficiency:['known model tokens','arm wall seconds'],
  success:'both valid arms; ARE strictly higher on Span-F1 and File-F1, strictly lower known model tokens and wall seconds',
  source_hashes:hashes,gold_posture:exposed?'gold was previously opened for diagnosis; no gold used by this selector or ranker':
    'native score and gold unopened until both predictions and costs are sealed'};
writeFileSync(join(root,'FREEZE.json'),JSON.stringify(freeze,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,instance,task_sha256:binding.task_sha256,ranker_sha256:hashes['code/ranked-source-acquisition.mjs']}));
