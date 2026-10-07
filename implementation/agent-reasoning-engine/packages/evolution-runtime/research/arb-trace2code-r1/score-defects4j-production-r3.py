#!/usr/bin/env python3
"""Seal complete fresh-case predictions before opening r3 gold."""
import itertools
import json
from hashlib import sha256
from pathlib import Path
import statistics
import sys

BASE = Path('/home/vlad_/are-benchmark-archive')
PACKET_SHA = '2ef2d9726c8b7117053b0c2fae945c62f210ff919309801db2b439a20a5dc139'
PROTOCOL_SHA = 'bed29bfba7483bd82809c1a77e95b0142f0e23dd8d9414072602f1f3181ce104'

def digest(path):
    return sha256(path.read_bytes()).hexdigest()

def signflip(values):
    values = [v for v in values if abs(v)>1e-12]
    if not values:
        return 1.0
    observed=abs(sum(values))
    return sum(abs(sum(a*b for a,b in zip(signs,values)))>=observed-1e-12
               for signs in itertools.product((-1,1),repeat=len(values)))/(2**len(values))

def metrics(ranking,gold):
    positions=[ranking.index(path)+1 for path in gold if path in ranking]
    first=min(positions,default=10**9)
    return {'mrr_at_8':1/first if first<=8 else 0,'hit_at_3':int(first<=3),
            'recall_at_8':len(gold.intersection(ranking[:8]))/len(gold) if gold else 0}

def main(root,protocol):
    assert not (root/'SCORE.json').exists()
    assert digest(root/'PACKETS.jsonl')==PACKET_SHA and digest(protocol)==PROTOCOL_SHA
    packets=[json.loads(line) for line in (root/'PACKETS.jsonl').read_text().splitlines()]
    generation=json.loads((root/'GENERATION-RESULT.json').read_bytes())
    assert len(packets)==generation['completed']==32 and generation['packets_sha256']==PACKET_SHA
    freeze=json.loads((root/'GENERATION-FREEZE.json').read_bytes())
    assert freeze['packets_sha256']==PACKET_SHA and freeze['protocol_sha256']==PROTOCOL_SHA and freeze['gold_opened'] is False
    assert freeze['runner_sha256']==digest(Path(__file__).with_name('run-defects4j-production-vps-r3.mjs'))
    responses=[]
    predictions={row['case_id']:row for row in generation['predictions']}
    assert len(predictions)==32
    for p in packets:
        path=root/f"GENERATION-{p['ordinal']:02d}.json"
        row=json.loads(path.read_bytes())
        assert row['case_id']==p['case_id'] and row['prompt_sha256']==p['prompt_sha256']
        assert row['http_status']==200 and not row['failure_code']
        selected=row['selected_ids'] if row['valid'] else []
        assert selected is not None and len(selected)<=8 and len(selected)==len(set(selected))
        assert all(type(i) is int and 1<=i<=len(p['candidates']) for i in selected)
        files=[p['candidates'][i-1]['path'] for i in selected]
        assert predictions[p['case_id']]['ranked_files']==files
        responses.append({'case_id':p['case_id'],'sha256':digest(path)})
    seal={'schema':'are.defects4j-production-r3-prediction-seal/v1','cases':32,'gold_opened':False, 'posture':'fresh-case prospective confirmation',
          'packet_sha256':PACKET_SHA,'protocol_sha256':PROTOCOL_SHA,
          'generation_result_sha256':digest(root/'GENERATION-RESULT.json'),'response_sha256':responses}
    seal_path=root/'PREDICTION-SEAL.json'
    assert not seal_path.exists()
    seal_path.write_text(json.dumps(seal,indent=2)+'\n')
    # First r3 label read: only after the complete, source-bound prediction seal.
    manifest=json.loads((BASE/'defects4j-trigger-supply-r3/SOURCE-ORDER-32.json').read_bytes())
    by_case={c['case_id']:c for c in manifest['cases']}
    rows=[];gold_hashes={};mapping_failures=[]
    for p in packets:
        c=by_case[p['case_id']]
        label_path=BASE/'defects4j-metadata-v3.0.1/framework/projects'/c['project']/'modified_classes'/f"{c['bug_id']}.src"
        label_bytes=label_path.read_bytes();gold_hashes[p['case_id']]=sha256(label_bytes).hexdigest()
        classes=[line.strip().split('$',1)[0] for line in label_bytes.decode().splitlines() if line.strip()]
        paths=(BASE/'defects4j-buggy-source-32-r3'/f"{p['case_id']}.paths").read_text().splitlines()
        gold=set()
        for cls in classes:
            suffix=cls.replace('.','/')+'.java'
            matches=[path for path in paths if path==suffix or path.endswith('/'+suffix)]
            if len(matches)!=1:
                mapping_failures.append({'case_id':p['case_id'],'class_sha256':sha256(cls.encode()).hexdigest(),'matches':len(matches)})
            else:
                gold.add(matches[0])
        arms={**p['arm_ranked_files'],'fusion':p['fusion_ranked_files'],
              'glm':predictions[p['case_id']]['ranked_files']}
        rows.append({'case_id':p['case_id'],'project':p['project'],'gold_file_count':len(gold),
                     'metrics':{name:metrics(ranking,gold) for name,ranking in arms.items()}})
    names=('are','are_production','repomap','repomap_production','stack','fusion','fusion_production','glm')
    aggregate={name:{m:statistics.mean(r['metrics'][name][m] for r in rows)
                     for m in ('mrr_at_8','hit_at_3','recall_at_8')} for name in names}
    projects=sorted({r['project'] for r in rows})
    per_project={project:{name:statistics.mean(r['metrics'][name]['mrr_at_8'] for r in rows if r['project']==project)
                          for name in names} for project in projects}
    paired={name:{'mean_mrr_delta':aggregate['glm']['mrr_at_8']-aggregate[name]['mrr_at_8'],
                  'project_signflip_p':signflip([per_project[p]['glm']-per_project[p][name] for p in projects])}
            for name in names if name!='glm'}
    hits={name:sum(r['metrics'][name]['hit_at_3'] for r in rows) for name in names}
    criteria={'all_mrr_deltas_ge_010':all(v['mean_mrr_delta']>=.10 for v in paired.values()),
              'repomap_project_p_le_005':paired['repomap']['project_signflip_p']<=.05,
              'fusion_project_p_le_005':paired['fusion']['project_signflip_p']<=.05,
              'repomap_production_project_p_le_005':paired['repomap_production']['project_signflip_p']<=.05,
              'fusion_production_project_p_le_005':paired['fusion_production']['project_signflip_p']<=.05,
              'glm_hit3_ge_24':hits['glm']>=24,
              'hit3_advantage_ge_6':hits['glm']-max(hits[n] for n in names if n!='glm')>=6,
              'complete_gold_mapping':not mapping_failures}
    score={'schema':'are.defects4j-production-r3-score/v1','cases':32,'projects':16,
           'prediction_seal_sha256':digest(seal_path),'gold_label_sha256':gold_hashes,
           'aggregate':aggregate,'hit3_counts':hits,'paired':paired,'per_project':per_project,
           'criteria':criteria,'gate_passed':all(criteria.values()),'mapping_failures':mapping_failures,
           'per_case_numeric':rows,'provider_prompt_tokens':generation['prompt_tokens'],
           'provider_completion_tokens':generation['completion_tokens'],'valid_responses':generation['valid'],
           'claim_scope':'Fresh-case prospective adapted Defects4J public Java modified-file localization, same projects; not live ARE, ContextBench, leaderboard, all-in cost or product-wide superiority.'}
    (root/'SCORE.json').write_text(json.dumps(score,indent=2)+'\n')
    print(json.dumps({k:score[k] for k in ('aggregate','hit3_counts','paired','criteria','gate_passed','valid_responses')}))

if __name__=='__main__':
    main(Path(sys.argv[1]).resolve(strict=True),Path(sys.argv[2]).resolve(strict=True))
