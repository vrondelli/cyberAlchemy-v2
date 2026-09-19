// Source-only R09 runner. Open questions: RESULT.md.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const lane=import.meta.dirname, root=path.resolve(lane,'../../../../..');
const cli=path.join(root,'impl/cli');
const prefix='development/reconciliation-v1/profile-compiler-reconciliation/';
const selected=[
  prefix+'PARALLEL-EXECUTION.md',prefix+'REMAINING-WORK-PLAN.md',
  prefix+'resolved-artifact-plan-contract.json',prefix+'reconciled-output-contract.json',
  'impl/cli/src/generation/publish-project.ts','impl/cli/src/generation/publish-instantiation.ts',
  'impl/cli/src/generation/reconciled-output.ts','impl/cli/src/generation/resolved-artifact-plan.ts',
  'impl/cli/src/generation/output-layout.ts','impl/cli/src/generation/reconciled-application-layout.ts',
  'impl/cli/src/generation/reconciled-project.ts','impl/cli/src/generation/reconciled-instantiation.ts',
  'impl/cli/src/generation/project-build.ts','impl/cli/src/index.ts',
  'impl/cli/test/generation/resolved-artifact-plan.test.ts',
  'impl/cli/test/generation/reconciled-project.test.ts',
  'impl/cli/test/generation/reconciled-instantiation.test.ts',
  'impl/cli/test/generation/reconciled-build.test.ts',
  'impl/cli/test/generation/reconciled-application-layout.test.ts',
  'impl/cli/test/generation/generated-module-surface.test.ts',
  'impl/cli/test/generation/publish-instantiation.test.ts',
  'impl/cli/test/generation/configured-rules.test.ts',
  'impl/cli/test/helpers/plans.ts','impl/cli/package.json',
];
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest=path.join(lane,'source-inputs.json');
if(process.argv[2]==='snapshot'){
  if(fs.existsSync(manifest))throw Error('snapshot already exists; preserve original evidence');
  const inputs=new Set(),visit=file=>{
    if(!fs.existsSync(file)||!fs.statSync(file).isFile()||inputs.has(file))return;
    inputs.add(file);
    if(!/\.(?:ts|js|mjs)$/.test(file))return;
    const text=fs.readFileSync(file,'utf8');
    for(const m of text.matchAll(/(?:from\s*|import\s*\()(['"])(\.[^'"\n]+)\1/g)){
      let dep=path.resolve(path.dirname(file),m[2]);
      if(!fs.existsSync(dep)&&dep.endsWith('.js'))dep=dep.slice(0,-3)+'.ts';
      visit(dep);
    }
    for(const m of text.matchAll(/bytes\((?:base\+)?(['"])([^'"\n]+)\1\)/g)){
      const ref=m[0].includes('base+')?prefix+m[2]:m[2];visit(path.join(root,ref));
    }
  };
  selected.forEach(p=>visit(path.join(root,p)));
  // Exact static fixture consumed by the reused publication tests.
  const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);e.isDirectory()?walk(p):visit(p);}};
  walk(path.join(cli,'fixtures/input-roots/canonical-project'));
  visit(path.join(cli,'node_modules/tsx/package.json'));
  const git=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});
  const status=spawnSync('git',['status','--short','--',...selected],{cwd:root,encoding:'utf8'});
  fs.writeFileSync(manifest,JSON.stringify({schema_version:'r09-source-inputs/v1-candidate',created_at:new Date().toISOString(),source_root:root,git_head:git.stdout.trim(),selected_status:status.stdout,node:process.version,coverage:'selected reviewed files, recursively discovered literal relative imports, literal bytes() dependencies, canonical publication fixture; not a complete dynamic dependency attestation',files:[...inputs].sort().map(p=>({path:path.relative(root,p),sha256:digest(p)}))},null,2)+'\n',{flag:'wx'});
  console.log('snapshotted',inputs.size,'selected/transitive inputs');
}else if(process.argv[2]==='check'){
  const m=JSON.parse(fs.readFileSync(manifest,'utf8'));
  const changed=m.files.filter(f=>!fs.existsSync(path.join(root,f.path))||digest(path.join(root,f.path))!==f.sha256);
  console.log(JSON.stringify({checked_at:new Date().toISOString(),input_count:m.files.length,changed},null,2));
  process.exitCode=changed.length?1:0;
}else if(process.argv[2]==='run'){
  if(!fs.existsSync(manifest))throw Error('capture snapshot first');
  const baseline=JSON.parse(fs.readFileSync(manifest,'utf8'));
  if(baseline.files.some(f=>!fs.existsSync(path.join(root,f.path))||digest(path.join(root,f.path))!==f.sha256))throw Error('selected inputs changed; review affected evidence before rerun');
  const out=path.join(lane,'results');fs.mkdirSync(out,{recursive:true});
  const loader=path.join(cli,'node_modules/tsx/dist/loader.mjs');
  const jobs=[
    ['reused-publication',['test/generation/publish-instantiation.test.ts']],
    ['reused-surface',['test/generation/generated-module-surface.test.ts']],
    ['reused-plan',['--test-name-pattern=^(joins all thirteen|native dependencies follow|registered but stale|rejects forged identities|deduplicates exact shared)', 'test/generation/resolved-artifact-plan.test.ts']],
    ['reused-layout',['--test-name-pattern=^application layout preserves','test/generation/reconciled-application-layout.test.ts']],
    ['focused-probes',[path.join(lane,'probes.test.ts')]],
  ];
  const summary=[];
  if(jobs.some(([name])=>fs.existsSync(path.join(out,name+'.tap'))))throw Error('first-run evidence already exists; use exact commands with a new evidence destination');
  for(const [name,args] of jobs){
    const argv=['--import',loader,'--test','--test-concurrency=1',...args],start=Date.now();
    const r=spawnSync(process.execPath,argv,{cwd:cli,encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024});
    const file=path.join(out,name+'.tap');
    if(fs.existsSync(file))throw Error('retain first-run evidence; log already exists:'+file);
    fs.writeFileSync(file,r.stdout+'\n'+r.stderr+(r.error?'\n'+r.error:''),{flag:'wx'});
    summary.push({name,command:[process.execPath,...argv],cwd:cli,status:r.status,signal:r.signal,elapsed_ms:Date.now()-start,log:path.relative(lane,file)});
    console.log(name,r.status,Date.now()-start+'ms');
  }
  fs.writeFileSync(path.join(out,'commands.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
  process.exitCode=summary.some(s=>s.status!==0)?1:0;
}else throw Error('use snapshot, run, or check');
