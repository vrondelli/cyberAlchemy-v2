import subprocess,json,shutil,os,tempfile
from pathlib import Path
T=Path('/home/vrondelli/projects/domainspec-v2-o00-9832ee36-tools')
rows=[]
def run(id,args,expected=None):
 try:
  r=subprocess.run(args,capture_output=True,text=True,timeout=45)
  ok=r.returncode==0 and (expected is None or expected in r.stdout+r.stderr)
  rows.append({'id':id,'argv':args,'resolved_executable':shutil.which(args[0]),'returncode':r.returncode,'stdout':r.stdout.strip(),'stderr':r.stderr.strip(),'result':'PASS' if ok else 'BLOCK'})
 except Exception as e:rows.append({'id':id,'argv':args,'result':'not_evaluable','error':str(e)})
for i,c,e in [('node',['node','--version'],'v26.8.1'),('npm',['npm','--version'],'11.19.0'),('pnpm',['pnpm','--version'],'10.34.5'),('typescript',['tsc','--version'],'7.0.2'),('lean',['lean','--version'],'4.33.1'),('rustc',['rustc','--version'],'1.94.0'),('cargo',['cargo','--version'],'1.94.0'),('python',['python3','--version'],'3.12.14'),('psql',['psql','--version'],'PostgreSQL'),('git',['git','--version'],'git version'),('docker',['docker','version','--format','{{.Client.Version}}/{{.Server.Version}}'],'28.0.1/28.0.1'),('buildx',['docker','buildx','version'],'0.21.3')]:run(i,c,e)
run('tsx-import',['node','--import','tsx','--input-type=module','-e','console.log("tsx-load-ok")'],'tsx-load-ok')
run('python-jsonschema',['python3','-c','from importlib.metadata import version; from jsonschema import Draft202012Validator; Draft202012Validator({"type":"integer"}).validate(1); print(version("jsonschema"))'],'4.26.0')
run('terraform-adapter',['tools/recipe-qualification/terraform','version','-json'],'1.16.0')
run('docker-adapter',['tools/recipe-qualification/docker','buildx','version'],'0.21.3')
run('postgres-image',['docker','image','inspect','postgres:16@sha256:71e27bf60b70bded003791b5573f8b808365613f341df20ffcf0c1ed7bc13ddf','--format','{{.Id}}'],'sha256:')
with tempfile.TemporaryDirectory(prefix='o00-smoke-') as scratch:
 p=Path(scratch);(p/'Smoke.lean').write_text('example : 1 + 1 = 2 := by decide\n');run('lean-smoke',['lean',str(p/'Smoke.lean')])
 (p/'smoke.rs').write_text('pub fn answer() -> u32 { 42 }\n');run('rust-smoke',['rustc','--edition','2024','--crate-type','lib',str(p/'smoke.rs'),'-o',str(p/'libsmoke.rlib')])
 (p/'smoke.ts').write_text('const answer: number = 42;\n');run('tsc-smoke',['tsc','--ignoreConfig','--noEmit','--strict','--skipLibCheck',str(p/'smoke.ts')])
 (p/'sentinel').write_text('o00-host-mount-ok\n');run('daemon-mount-path',['docker','run','--rm','--network','none','--mount',f'type=bind,src={p},dst=/probe,readonly','--entrypoint','cat','docker:28.0.1-cli@sha256:043c259759666d273afa94a9c9175a87a11f16cde2f613f4c527e4395b703a1f','/probe/sentinel'],'o00-host-mount-ok')
run('frozen-dependency-resolution',['node','--input-type=module','-e','import fs from "node:fs"; for (const p of ["typescript","@typescript/native","tsx","@types/node"]) { const j=JSON.parse(fs.readFileSync("../node_modules/"+p+"/package.json","utf8")); console.log(p+"="+j.name+"@"+j.version); }'])
result={'result':'PASS' if all(r['result']=='PASS' for r in rows) else 'BLOCK','checks':rows,'claim_ceiling':'Tool availability and minimal tool execution only; no compiler product tests or qualification performed.'}
(T/'tool-probes.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));raise SystemExit(result['result']!='PASS')
