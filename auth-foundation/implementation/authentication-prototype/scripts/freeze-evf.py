#!/usr/bin/env python3
"""Freeze exact local prototype inputs and bind the existing EVF runtime."""
import hashlib,json,os,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[3]
os.chdir(ROOT)
E=ROOT/'evidence';E.mkdir(exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,indent=2)+'\n')
def ref(p):
 p=p.resolve();return {'path':str(p.relative_to(REPO)) if p.is_relative_to(REPO) else str(p),'location':'repository' if p.is_relative_to(REPO) else 'host','sha256':sha(p),'size_bytes':p.stat().st_size,'current':True}
paths=[p for base in ['src','scripts','test','bridge/src','themes'] for p in (ROOT/base).rglob('*') if p.is_file()]
paths += [ROOT/n for n in ['package.json','package-lock.json','compose.yaml','bridge/Cargo.toml','bridge/Cargo.lock','README.md','.runtime/auth-prototype-bridge']]
for name in ['jose','openid-client','oauth4webapi']:
 paths += [p for p in (ROOT/'node_modules'/name).rglob('*') if p.is_file()]
# Preserve all direct and transitive predecessor source inputs actually linked.
for name in ['authorization-service','runtime-adapter','trusted-boundary','sqlite-provider','trusted-input-provider','trusted-input-runtime','trusted-input-construction-runtime','command-boundary-runtime','standard-runtime']:
 directory=ROOT.parent/name
 if directory.exists():paths += [p for p in directory.rglob('*') if p.is_file() and p.suffix in ['.rs','.toml','.lock'] and 'target' not in p.parts]
paths += [ROOT/'../../development/authentication-v1/PROTOTYPE-CONTRACT.json',ROOT/'../../development/authentication-v1/PROTOTYPE-DAG.md']
paths += [ROOT/'../../development/authentication-v1/BRANDED-LOGIN-CONTRACT.json',ROOT/'../../development/authentication-v1/BRANDED-LOGIN-PLAN.md']
files=[{'path':os.path.relpath(p,ROOT),'sha256':sha(p)} for p in sorted(set(p.resolve() for p in paths))]
digest=hashlib.sha256(json.dumps(files,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
save(E/'INPUT-CANDIDATE.json',{'schema_version':'auth-prototype-input/v1','authority_effect':'none','files':files,'input_digest':digest,'open_questions':['Host shared libraries and deployment state are not closed by this manifest.']})
def inp(name,case,d=digest):
 p=E/'evf/inputs'/f'{name}.json';save(p,{'schema_version':'auth-prototype-evf/v1','input_digest':d,'case':case});return ref(p)
node=Path(shutil.which('node')).resolve();unshare=Path(shutil.which('unshare')).resolve()
# Node may be a launcher. Resolve the actual binary used by this process.
node=Path(subprocess.check_output([str(node),'-p','process.execPath'],text=True).strip())
binroot=Path(os.environ.get('AUTH_EVF_BIN',str(Path.home()/'.cache/auth-completion/auth-evf-target/debug')))
cases={'wrong-audience':'WRONG_AUDIENCE','wrong-issuer':'WRONG_ISSUER','expired':'EXPIRED','id-token':'TOKEN_TYPE','wrong-signature':'SIGNATURE'}
mutations=[{'mutant_id':case,'check_id':'prototype-boundary','input_ref':inp(case,case),'expected_output':{'status':'rejected','input_digest':digest,'cause':cause},'expected_rejection_code':cause} for case,cause in cases.items()]
mutations.append({'mutant_id':'stale-input','check_id':'prototype-boundary','input_ref':inp('stale-input','neutral','0'*64),'expected_output':{'status':'rejected','input_digest':digest,'cause':'STALE_INPUT'},'expected_rejection_code':'STALE_INPUT'})
profile={'schema_version':'evf.enforcement-profile/v1','profile_id':'auth.authentication.prototype.v1','subject':'Offline real JWT verifier and existing Rust authorization bridge; live OIDC evidence separate','route':'executable','stages':[{'stage_id':f'S{i}','required':True} for i in range(13)],'semantic_refs':[ref(ROOT/'../../development/authentication-v1/PROTOTYPE-CONTRACT.json'),ref(ROOT/'../../development/authentication-v1/BRANDED-LOGIN-CONTRACT.json')],'obligation_ids':['authn.real-verifier','authn.typed-principal-policy','authn.hostile-token-rejection'],'obligation_denominator':3,'binding_refs':[ref(E/'INPUT-CANDIDATE.json')]+[ref(ROOT/f['path']) for f in files],'checks':[{'check_id':'prototype-boundary','provider_id':'auth-prototype-provider','runtime':{'executable_ref':ref(node),'tool_refs':[ref(ROOT/f['path']) for f in files],'argv':[str(ROOT/'scripts/evf-provider.mjs'),'{input}'],'working_directory':str(ROOT.relative_to(REPO)),'environment':{'PATH':os.environ['PATH'],'HOME':str(Path.home()),'LANG':'C','LC_ALL':'C'},'timeout_ms':60000,'max_output_bytes':1048576,'network':'forbidden','isolation':{'mechanism':'linux-user-and-network-namespace','unshare_ref':ref(unshare)}},'input_ref':inp('neutral','neutral'),'expected_output':{'status':'passed','input_digest':digest}}],'mutations':mutations,'composition':{'mode':'single','provider_ids':['auth-prototype-provider'],'compare_fields':[],'comparability_refs':[ref(E/'INPUT-CANDIDATE.json')]},'producer':{'executable_ref':ref(binroot/'evf-run')},'verifier':{'executable_ref':ref(binroot/'evf-independent-verifier')},'repetitions':2,'authority_effect':'none','claim_ceiling':'Offline cryptographic and bridge prototype evidence only. No live-provider, full ASVS, formal correspondence, production readiness or approval claim.'}
save(E/'evf/profile.json',profile)
print(json.dumps({'input_digest':digest,'files':len(files),'profile':str(E/'evf/profile.json')}))
