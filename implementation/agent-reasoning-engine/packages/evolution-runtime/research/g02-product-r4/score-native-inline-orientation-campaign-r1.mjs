// Private post-seal scoring. Open Questions: G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url));
const project=resolve(here,'../../../../../..');
const root='/home/vlad_/are-benchmark-archive/g02-inline-orientation-native-exposed-r1-20261006';
const remote='/opt/are/evolution-runtime/g02-wsl-vps-provider-r1/inline-orientation-exposed-r1-score';
const host='root@187.77.163.194',options=['-o','BatchMode=yes','-o','ConnectTimeout=15'];
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(readFileSync(p));
const save=(p,d)=>writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx',mode:0o600});
const requireIt=(v,r)=>{if(!v)throw Error('matched-score.'+r);};
const sealBytes=readFileSync(join(root,'PRE-SCORE-CAMPAIGN-SEAL.json'));
const bundlesRoot=join(root,'score-bundles'),bundleSeal=read(join(bundlesRoot,'BUNDLES-SEAL.json'));
requireIt(bundleSeal.campaign_seal_sha256===sha(sealBytes)&&bundleSeal.bundles.length===12,'campaign-seal');
for(const entry of bundleSeal.bundles){
 requireIt(/^(0[1-9]|1[0-2])-pr11-mixed-\d{2}$/.test(entry.pair)&&['orientation'].includes(entry.arm),'path');
 const name=entry.pair+'-'+entry.arm,arm=join(root,name),bundle=join(bundlesRoot,name);
 const bundleBytes=readFileSync(join(bundle,'BUNDLE.json'));
 requireIt(sha(bundleBytes)===entry.bundle_sha256,'bundle-seal');
 const scorePath=join(arm,'NATIVE-SCORE.json'),terminalPath=join(arm,'SCORE-TERMINAL.json');
 if(existsSync(terminalPath)){
  const terminal=read(terminalPath);
  requireIt(terminal.score_sha256===sha(readFileSync(scorePath))&&terminal.bundle_sha256===entry.bundle_sha256,'terminal-seal');
  continue;
 }
 requireIt(!existsSync(join(arm,'SCORE-STARTED.json'))&&!existsSync(scorePath),'attempt-incomplete-no-replay');
 save(join(arm,'SCORE-STARTED.json'),{started_at:new Date().toISOString(),bundle_sha256:entry.bundle_sha256,
  driver_sha256:sha(readFileSync(join(here,'score-native-workspace-filtered-task1-r1.py'))),authority_effect:'none'});
 const target=remote+'/'+name;
 const ssh=command=>execFileSync('ssh',[...options,host,command],{encoding:'utf8',timeout:180000,maxBuffer:8000000});
 const scp=args=>execFileSync('scp',[...options,...args],{encoding:'utf8',timeout:180000,maxBuffer:8000000});
 const free=Number(ssh("df -B1 --output=avail /opt/are/evolution-runtime | tail -1").trim());
 requireIt(Number.isSafeInteger(free)&&free>JSON.parse(bundleBytes).source_bytes+100*1024**2,'vps-scorer-reserve');
 ssh('mkdir -p -m 700 '+remote+' && test ! -e '+target+' && mkdir -m 700 '+target+' && mkdir -m 700 '+target+'/out');
 scp(['-r',bundle+'/.',host+':'+target+'/']);
 scp([join(here,'score-native-workspace-filtered-task1-r1.py'),host+':'+target+'/score.py']);
 scp([join(project,'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-manifest.json'),host+':'+target+'/source-manifest.json']);
 const log=ssh('docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges '+
  '--cpus 1 --memory 512m --pids-limit 128 --tmpfs /tmp:rw,nosuid,nodev,size=128m '+
  '-v /opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream:/upstream:ro '+
  '-v '+target+':/work:ro -v '+target+'/out:/out '+
  'sha256:e592d8dcd42b3218edd36dbf1b959ef5964f203d099f382a301e2ec9bf1941ff python /work/score.py');
 writeFileSync(join(arm,'native-score-stdout.log'),log,{flag:'wx',mode:0o600});
 scp([host+':'+target+'/out/NATIVE-SCORE.json',scorePath]);
 const scoreBytes=readFileSync(scorePath),score=JSON.parse(scoreBytes);
 requireIt(score.bundle_sha256===entry.bundle_sha256&&!score.native?.error,'score-identity');
 const remoteHash=ssh('sha256sum '+target+'/out/NATIVE-SCORE.json').trim().split(/\s+/)[0];
 requireIt(remoteHash===sha(scoreBytes),'transfer-identity');
 save(terminalPath,{score_sha256:sha(scoreBytes),bundle_sha256:entry.bundle_sha256,terminal_at:new Date().toISOString(),
  network:'disabled inside pinned scorer',authority_effect:'none'});
 console.log(JSON.stringify({pair:entry.pair,arm:entry.arm,status:'native-scored',score_sha256:sha(scoreBytes)}));
}
console.log(JSON.stringify({status:'all-12-native-scored',authority_effect:'none'}));
