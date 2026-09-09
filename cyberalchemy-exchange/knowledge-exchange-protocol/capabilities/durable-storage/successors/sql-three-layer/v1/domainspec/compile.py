#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,importlib.util,json,os,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent;ADMISSION=ROOT.parent/'decisions/domainspec-source-admission-001.json';GENERATED=ROOT/'generated'
ROLES={'Entity':'stateful-record','Value Object':'immutable-value','Policy':'decision-policy','Operation':'bounded-operation','Rule':'enforced-invariant','Event':'observed-outcome','State Machine':'lifecycle-model','Interface':'capability-boundary','Mapping':'semantic-projection'}
class CompileError(Exception):pass
def canonical(v):return (json.dumps(v,indent=2,sort_keys=True)+'\n').encode()
def sha_bytes(v):return hashlib.sha256(v).hexdigest()
def sha(p):return sha_bytes(p.read_bytes())
def load(p):return json.loads(p.read_text())
def preflight(root):
 s=importlib.util.spec_from_file_location('dst3_ds_validate_compile',ROOT/'validate.py');assert s and s.loader;m=importlib.util.module_from_spec(s);s.loader.exec_module(m);r=m.validate(root,False)
 if r['result']!='PASS':raise CompileError(f'source preflight failed: {r}')
 return r
def build(root:Path=ROOT,admission_path:Path=ADMISSION):
 root=root.resolve();ad=load(admission_path);pf=preflight(root);binding=load(root/'binding.json')
 if ad.get('admission',{}).get('lifecycle_status')!='admitted':raise CompileError('source not admitted')
 if ad['subject']['binding_sha256']!=sha(root/'binding.json'):raise CompileError('admitted binding digest drift')
 if ad['admission']['admitted_candidate_material_digest']!=pf['candidate_material_digest']:raise CompileError('admitted source material digest drift')
 fid=binding['feature_id'];feature=load(root/f'specs/{fid}/feature.json');paths=['binding.json','project.json',f'specs/{fid}/feature.json',*[f'specs/{fid}/nodes/{n}.json' for n in feature['nodes']],*[f'specs/{fid}/edges/{e}.json' for e in feature['edges']]]
 manifest={'schema_version':'cav2-domainspec-source-manifest/v1','source_admission_sha256':sha(admission_path),'candidate_material_digest':pf['candidate_material_digest'],'entries':[{'path':p,'sha256':sha(root/p),'size_bytes':(root/p).stat().st_size} for p in sorted(paths)]}
 reverse={n:{'definition_ids':[],'ontology_node_ids':[],'ontology_rule_ids':[],'proof_requirement_ids':[]} for n in feature['nodes']}
 for reg,target in [('definition_mappings','definition_ids'),('ontology_node_mappings','ontology_node_ids'),('ontology_rule_mappings','ontology_rule_ids'),('proof_requirement_mappings','proof_requirement_ids')]:
  for semantic,raw in binding[reg].items():
   for node in raw if isinstance(raw,list) else [raw]:reverse[node][target].append(semantic)
 nodes=[]
 for nid in feature['nodes']:
  n=load(root/f'specs/{fid}/nodes/{nid}.json');semantic={k:sorted(v) for k,v in reverse[nid].items()};nodes.append({'selector':f'{fid}:{nid}','node_id':nid,'kind':n['kind'],'body':n['body'],'system_role':ROLES[n['kind']],'semantic_bindings':semantic,'source_sha256':sha(root/f'specs/{fid}/nodes/{nid}.json')})
 edges=[]
 for eid in feature['edges']:
  e=load(root/f'specs/{fid}/edges/{eid}.json');edges.append({'edge_id':eid,'relationship':e['relationship'],'source_selector':f"{fid}:{e['source_node_id']}",'target_selector':f"{fid}:{e['target_node_id']}",'source_sha256':sha(root/f'specs/{fid}/edges/{eid}.json')})
 graph={'schema_version':'cav2-compiled-graph/v1','graph_id':'CA2-GRAPH-KEP-DST3-001','source_manifest_sha256':sha_bytes(canonical(manifest)),'nodes':nodes,'edges':edges}
 system={'schema_version':'cav2-system-ontology/v1','ontology_id':'CA2-SYSTEM-ONTOLOGY-KEP-DST-SQL-THREE-LAYER','compiled_graph_sha256':sha_bytes(canonical(graph)),'sql_portability_selector':f'{fid}:sql-portability-contract','first_adapter_selector':f'{fid}:postgresql-adapter','recovery_layer_selectors':[f'{fid}:operational-sql-layer',f'{fid}:recovery-journal-layer',f'{fid}:immutable-archive-layer'],'systems':[{'system_id':f"CA2-SYS-KEP-DST3-{n['node_id'].upper()}",'selector':n['selector'],'role':n['system_role'],'body':n['body'],'semantic_bindings':n['semantic_bindings']} for n in nodes],'relations':edges,'claim_ceiling':'Deterministic system meaning only; PostgreSQL is one adapter and Docker one local environment. No production topology, durability, security, deployment, or external effect.'}
 out={'source-manifest.json':canonical(manifest),'compiled-graph.json':canonical(graph),'system-ontology.json':canonical(system)}
 receipt={'schema_version':'cav2-deterministic-compilation-receipt/v1','compiler_sha256':sha(ROOT/'compile.py'),'source_admission_sha256':sha(admission_path),'outputs':[{'path':p,'sha256':sha_bytes(v)} for p,v in sorted(out.items())],'counts':{'nodes':len(nodes),'edges':len(edges)},'result':'PASS','authority_effect':'none','external_effect':'none'};out['compilation-receipt.json']=canonical(receipt);return out
def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args()
 try:
  out=build()
  if a.check:
   drift=[n for n,v in out.items() if not (GENERATED/n).is_file() or (GENERATED/n).read_bytes()!=v]
   if drift:raise CompileError(f'generated output drift: {drift}')
  else:
   GENERATED.mkdir(parents=True,exist_ok=True)
   for n,v in out.items():
    fd,t=tempfile.mkstemp(dir=GENERATED,prefix=f'.{n}.');
    with os.fdopen(fd,'wb') as h:h.write(v)
    os.replace(t,GENERATED/n)
  print(json.dumps({'result':'PASS','mode':'check' if a.check else 'write','outputs':{n:sha_bytes(v) for n,v in sorted(out.items())},'authority_effect':'none','external_effect':'none'},indent=2,sort_keys=True));return 0
 except Exception as e:print(json.dumps({'result':'BLOCK','error':str(e),'authority_effect':'none','external_effect':'none'},indent=2,sort_keys=True));return 1
if __name__=='__main__':raise SystemExit(main())

