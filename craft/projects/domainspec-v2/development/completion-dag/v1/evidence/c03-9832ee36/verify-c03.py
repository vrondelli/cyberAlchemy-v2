from pathlib import Path
import subprocess,json,hashlib,shutil,os,time
T=Path(__file__).resolve().parent;O=Path('/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/completion-dag/v1/evidence/c03-9832ee36');H='9832ee36c5332be825ff065fb8cff05b23b2fd81';IMAGE='sha256:0c27ed9d072a45ec5d17d15d3530a6d5e630f4b8e1e7f49728c2e7b210f491a5';A=T/'candidate-c03-1';B=T/'candidate-c03-2'
def sha(b):return hashlib.sha256(b).hexdigest()
def inventory(root):return [{'path':str(f.relative_to(root)),'size_bytes':f.stat().st_size,'sha256':sha(f.read_bytes())} for f in sorted(root.rglob('*')) if f.is_file()]
left=inventory(A);right=inventory(B);assert left==right
(O/'two-build-equality.json').write_text(json.dumps({'result':'PASS','file_count':len(left),'total_bytes':sum(r['size_bytes'] for r in left),'build_roots':[str(A),str(B)],'inventory':left,'authority_effect':'none'},indent=2)+'\n')
rows=[]
def verify(label,root,expected=H,should_pass=True):
 args=['docker','run','--rm','--network','none','--user',f'{os.getuid()}:{os.getgid()}','--mount',f'type=bind,src={root},dst=/bundle,readonly','--mount',f'type=bind,src={A}/verify-release-candidate.mjs,dst=/trusted-verifier.mjs,readonly',IMAGE,'node','/trusted-verifier.mjs','--bundle-root','/bundle','--expected-source-commit',expected]
 r=subprocess.run(args,capture_output=True,text=True);(O/'logs'/f'{label}.stdout.json').write_text(r.stdout);(O/'logs'/f'{label}.stderr.log').write_text(r.stderr);d=json.loads(r.stdout);ok=(r.returncode==0 and d['result']=='pass') if should_pass else (r.returncode==1 and d['result']=='fail');row={'id':label,'argv':args,'exit_code':r.returncode,'expected':'pass' if should_pass else 'fail','observed':d['result'],'result':'PASS' if ok else 'BLOCK','failed_checks':[c for c in d['checks'] if c['result']!='pass'],'log':f'logs/{label}.stdout.json','log_sha256':sha(r.stdout.encode())};rows.append(row);print(label,row['result'],flush=True);assert ok,row
verify('offline-build-1',A);verify('offline-build-2',B);verify('wrong-source',A,'0'*40,False)
mutants=T/'c03-negative-copies';mutants.mkdir(exist_ok=False)
cases=[('package-tamper','package/domainspec-v2-cli-1.0.0.tgz','append'),('missing-certificate','qualification/run-2/qualification-certificate.json','remove'),('sbom-tamper','evidence/sbom.spdx.json','append'),('provenance-tamper','evidence/provenance.intoto.json','append'),('checksum-drift','SHA256SUMS','append'),('extra-artifact','extra.txt','new'),('verifier-tamper','verify-release-candidate.mjs','append')]
for label,relative,kind in cases:
 root=mutants/label;shutil.copytree(A,root);p=root/relative
 if kind=='remove':p.unlink()
 elif kind=='new':p.write_text('unexpected\n')
 else:
  with p.open('ab') as f:f.write(b'\nC03-negative-test\n')
 verify(label,root,should_pass=False)
(O/'offline-verification.json').write_text(json.dumps({'result':'PASS','checks':rows,'network':'none','repository_mounted':False,'trusted_verifier_sha256':sha((A/'verify-release-candidate.mjs').read_bytes()),'authority_effect':'none'},indent=2)+'\n')
consumer_rows=[]
for n in [1,2]:
 c=T/f'c03-consumer-{n}';c.mkdir(exist_ok=False);(c/'package.json').write_text('{"private":true,"type":"module"}\n')
 (c/'observe.mjs').write_text('import assert from "node:assert/strict"; import * as api from "@domainspec-v2/cli"; assert.equal(api.CLI_VERSION,"1.0.0"); assert.equal(api.AUTHORITY_EFFECT,"none"); assert.equal(typeof api.runCli,"function"); const out=[]; const errors=[]; assert.equal(api.runCli(["capabilities"],{stdout:x=>out.push(x),stderr:x=>errors.push(x)}),0); const capabilities=JSON.parse(out.join("")); assert.equal(capabilities.product.version,"1.0.0"); console.log(JSON.stringify({version:api.CLI_VERSION,package:api.CLI_PACKAGE_NAME,exports:Object.keys(api).sort(),capabilities,errors},null,2));\n')
 script='set -e\nnpm install --offline --ignore-scripts --no-audit --no-fund /bundle/package/domainspec-v2-cli-1.0.0.tgz > install.log 2>&1\nnode observe.mjs > observation.json\n./node_modules/.bin/domainspec-v2 --version > cli-version.txt\n'
 args=['docker','run','--rm','--network','none','--user',f'{os.getuid()}:{os.getgid()}','--mount',f'type=bind,src={A},dst=/bundle,readonly','--mount',f'type=bind,src={c},dst=/consumer','--workdir','/consumer','--env','NPM_CONFIG_CACHE=/consumer/npm-cache','--env','npm_config_cache=/consumer/npm-cache','--entrypoint','/bin/bash',IMAGE,'-c',script]
 r=subprocess.run(args,capture_output=True,text=True);(O/'logs'/f'consumer-{n}.log').write_text(r.stdout+r.stderr);assert r.returncode==0,(n,r.stderr,(c/'install.log').read_text());assert (c/'cli-version.txt').read_text().strip()=='1.0.0';ob=json.loads((c/'observation.json').read_text());consumer_rows.append({'consumer':n,'result':'PASS','argv':args,'observation':ob,'installed_package':json.loads((c/'node_modules/@domainspec-v2/cli/package.json').read_text())['version'],'network':'none','repository_mounted':False});print('consumer',n,'PASS',flush=True)
assert consumer_rows[0]['observation']==consumer_rows[1]['observation']
(O/'isolated-consumers.json').write_text(json.dumps({'result':'PASS','consumers':consumer_rows,'identical_observations':True,'authority_effect':'none'},indent=2)+'\n')
print(json.dumps({'equality':'PASS','bundle_files':len(left),'offline_and_negative_checks':len(rows),'isolated_consumers':2},indent=2))
