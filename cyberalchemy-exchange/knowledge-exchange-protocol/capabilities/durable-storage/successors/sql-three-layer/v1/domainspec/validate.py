#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent;REPO=ROOT.parents[8];ONTOLOGY=ROOT.parent/'ontology'
def sha(p:Path)->str:return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p:Path):return json.loads(p.read_text())
def digest(root:Path,paths:list[str])->str:
 h=hashlib.sha256()
 for rel in sorted(paths):h.update(rel.encode());h.update(b'\0');h.update((root/rel).read_bytes());h.update(b'\0')
 return h.hexdigest()
def validate(root:Path=ROOT,native:bool=True):
 root=root.resolve();errors=[];binding=load(root/'binding.json');feature_id=binding['feature_id'];feature=load(root/f'specs/{feature_id}/feature.json');project=load(root/'project.json')
 pred=binding['predecessors']['ontology_admission'];pp=(root/pred['path']).resolve()
 if not pp.is_file() or sha(pp)!=pred['sha256']:errors.append('ontology admission predecessor drift')
 else:
  admission=load(pp)
  if admission.get('admission',{}).get('lifecycle_status')!='admitted' or admission.get('subject',{}).get('material_digest')!=pred['material_digest']:errors.append('ontology admission semantic drift')
 node_ids=feature.get('nodes',[]);edge_ids=feature.get('edges',[])
 if project.get('features')!=[feature_id]:errors.append('project feature closure drift')
 expected_nodes={f'specs/{feature_id}/nodes/{n}.json' for n in node_ids};expected_edges={f'specs/{feature_id}/edges/{e}.json' for e in edge_ids}
 actual_nodes={p.relative_to(root).as_posix() for p in (root/f'specs/{feature_id}/nodes').glob('*.json')};actual_edges={p.relative_to(root).as_posix() for p in (root/f'specs/{feature_id}/edges').glob('*.json')}
 if expected_nodes!=actual_nodes or expected_edges!=actual_edges:errors.append('authored source closure drift')
 for rel in expected_edges:
  e=load(root/rel)
  if e.get('source_node_id') not in node_ids or e.get('target_node_id') not in node_ids:errors.append(f'edge endpoint closure drift: {rel}')
 registries=[('definition_mappings','definition-bindings.json','bindings','definition_id'),('ontology_node_mappings','nodes.json','nodes','id'),('ontology_rule_mappings','rules.json','rules','rule_id'),('proof_requirement_mappings','proof-requirements.json','proof_requirements','proof_id')]
 for name,file,key,idkey in registries:
  expected={x[idkey] for x in load(ONTOLOGY/file)[key]};mapping=binding.get(name,{})
  if set(mapping)!=expected:errors.append(f'{name} not total and exact')
  for raw in mapping.values():
   for target in raw if isinstance(raw,list) else [raw]:
    if target not in node_ids:errors.append(f'{name} unknown target: {target}')
 if binding.get('authority_effect')!='none' or binding.get('external_effect')!='none':errors.append('source effect ceiling drift')
 if native:
  rel=root.relative_to(REPO).as_posix();cmd=[str(REPO/'toolchains/node-typescript/bin/node-env'),'run','--project','projects/domainspec-v2/impl','--','pnpm','exec','tsx','cli/src/cli/main.ts','lint',f'/workspace/{rel}'];c=subprocess.run(cmd,cwd=REPO,capture_output=True,text=True)
  if c.returncode!=0:errors.append(f'native DomainSpec lint failed: {c.stdout or c.stderr}')
 paths=['binding.json','project.json',f'specs/{feature_id}/feature.json',*sorted(expected_nodes),*sorted(expected_edges)]
 return {'schema_version':'cav2-kep-dst3-domainspec-validation/v1','result':'PASS' if not errors else 'BLOCK','candidate_material_digest':digest(root,paths),'counts':{'nodes':len(node_ids),'edges':len(edge_ids),'files':len(paths)},'errors':errors,'authority_effect':'none','external_effect':'none'}
def main()->int:
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=ROOT);p.add_argument('--no-native',action='store_true');a=p.parse_args();r=validate(a.root,not a.no_native);print(json.dumps(r,indent=2,sort_keys=True));return 0 if r['result']=='PASS' else 1
if __name__=='__main__':raise SystemExit(main())

