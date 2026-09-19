from pathlib import Path
import json,subprocess,os,time
root=Path(__file__).resolve().parent
iso=json.loads((root/'isolation.json').read_text());env=os.environ.copy()
env['PATH']='/tmp/dsv2-python-ci-63wpx2nv/bin:/home/vrondelli/.nvm/versions/node/v26.8.1/bin:'+env['PATH']
env['CARGO_TARGET_DIR']='/tmp/alchlang-rust-target/f059fb528c0ff5c45e21b4a2524bae75fc677590b778b5d5450474f55d941668'
env['PYTHONDONTWRITEBYTECODE']='1'
env['npm_config_audit']='false';env['npm_config_fund']='false';env['npm_config_update_notifier']='false'
steps=[('typecheck',['npm','run','typecheck']),('system-integration',['npm','run','system-integration:check']),('proof-tests',['npm','run','test:proof']),('parallel-tests',['npm','run','test:parallel']),('package-contracts',['npm','run','test:contract']),('build',['npm','run','build']),('rust-generation',['npm','run','validate:rust']),('clean-package',['npm','run','validate:clean-package']),('sqlite-tests',['node','--import','tsx','--test','test/runtime-l3.test.ts']),('recipe-qualification',['npm','run','recipe-qualification:l1','--','--output-root',str(root/'recipe-evidence')])]
results=[]
for name,command in steps:
 print('RUNNING '+name,flush=True);start=time.monotonic()
 with (root/'logs'/f'{name}.log').open('x') as log:
  result=subprocess.run(command,cwd=iso['cli'],env=env,stdout=log,stderr=subprocess.STDOUT)
 results.append({'id':name,'command':command,'exit_code':result.returncode,'result':'pass' if result.returncode==0 else 'fail','duration_seconds':round(time.monotonic()-start,2),'log':f'logs/{name}.log'})
 (root/'qualification-checks.json').write_text(json.dumps({'result':'pass' if all(x['result']=='pass' for x in results) else 'fail','completed':len(results),'total':len(steps),'checks':results},indent=2)+'\n')
 print(results[-1]['result'].upper()+' '+name,flush=True)
