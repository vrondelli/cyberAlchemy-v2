#!/usr/bin/env python3
"""Exposed stronger-baseline audit; never alters the frozen development score.

Open Questions: G01-DEFECTS4J-PRODUCTION-DEV-R1-PROTOCOL.md.
"""
import json
from hashlib import sha256
from pathlib import Path
import runpy
import statistics
import sys

METRICS = runpy.run_path(str(Path(__file__).with_name('score-defects4j-rerank-r2.py')))
metrics, signflip = METRICS['metrics'], METRICS['signflip']
BASE = Path('/home/vlad_/are-benchmark-archive')

def digest(path):
    return sha256(path.read_bytes()).hexdigest()

def main(root):
    output = root/'STRONGER-BASELINE-AUDIT.json'
    assert not output.exists()
    score = json.loads((root/'SCORE.json').read_bytes())
    packets = [json.loads(line) for line in (root/'PACKETS.jsonl').read_text().splitlines()]
    baseline_path = root/'SEALED-PRODUCTION-REPOMAP.json'
    baseline = json.loads(baseline_path.read_bytes())
    prior_path = BASE/'defects4j-buggy-source-32-r2/SEALED-OFFICIAL-REPOMAP.json'
    prior = {r['case_id']:r for r in json.loads(prior_path.read_bytes())['cases']}
    by_repo = {r['case_id']:r for r in baseline['cases']}
    by_case = {r['case_id']:r for r in score['per_case_numeric']}
    manifest = json.loads((BASE/'defects4j-trigger-supply-r2/SOURCE-ORDER-32.json').read_bytes())
    cases = {c['case_id']:c for c in manifest['cases']}
    assert len(packets) == len(by_repo) == len(by_case) == len(cases) == 32
    rows = []
    for p in packets:
        cid = p['case_id']; c = cases[cid]; b = by_repo[cid]; old = prior[cid]
        for field in ('buggy_revision','trace_view_sha256','java_source_projection_sha256',
                      'candidate_count','ranked_files_top20'):
            assert b[field] == old[field], (cid,field)
        label = BASE/'defects4j-metadata-v3.0.1/framework/projects'/c['project']/'modified_classes'/f"{c['bug_id']}.src"
        assert digest(label) == score['gold_label_sha256'][cid]
        paths = (BASE/'defects4j-buggy-source-32-r2'/f'{cid}.paths').read_text().splitlines()
        gold = set()
        for cls in label.read_text().splitlines():
            if not cls.strip():
                continue
            suffix = cls.strip().split('$',1)[0].replace('.','/')+'.java'
            matches = [path for path in paths if path == suffix or path.endswith('/'+suffix)]
            assert len(matches) == 1
            gold.add(matches[0])
        ar = p['arm_ranked_files']['are']; br = b['production_ranked_files_top20']
        sr = p['arm_ranked_files']['stack']; union = [x['path'] for x in p['candidates']]
        fusion = sorted(union,key=lambda path:(-sum(1/(60+rank.index(path)+1)
          for rank in (ar,br,sr) if path in rank),path))
        rows.append({'case_id':cid,'project':p['project'],'metrics':{
          'production_repomap':metrics(br,gold),'production_fusion':metrics(fusion,gold),
          'glm':by_case[cid]['metrics']['glm']}})
    names = ('production_repomap','production_fusion','glm')
    aggregate = {n:{m:statistics.mean(r['metrics'][n][m] for r in rows)
                   for m in ('mrr_at_8','hit_at_3','recall_at_8')} for n in names}
    projects = sorted({r['project'] for r in rows})
    paired = {n:{'mean_mrr_delta':aggregate['glm']['mrr_at_8']-aggregate[n]['mrr_at_8'],
                 'project_signflip_p':signflip([statistics.mean(r['metrics']['glm']['mrr_at_8']-
                    r['metrics'][n]['mrr_at_8'] for r in rows if r['project']==p) for p in projects])}
              for n in names if n!='glm'}
    hits = {n:sum(r['metrics'][n]['hit_at_3'] for r in rows) for n in names}
    criteria = {'original_development_screen_passed':score['gate_passed'],
                'stronger_mrr_deltas_ge_010':all(v['mean_mrr_delta']>=.10 for v in paired.values()),
                'stronger_project_p_le_005':all(v['project_signflip_p']<=.05 for v in paired.values()),
                'hit3_advantage_ge_6':hits['glm']-max(hits[n] for n in names if n!='glm')>=6}
    result = {'schema':'are.defects4j-production-baseline-audit/v1',
              'posture':'post-gold exposed development; does not change frozen primary score or claim superiority',
              'score_sha256':digest(root/'SCORE.json'),'baseline_sha256':digest(baseline_path),
              'aggregate':aggregate,'hit3_counts':hits,'paired':paired,'criteria':criteria,
              'development_advancement_passed':all(criteria.values()),'per_case_numeric':rows}
    with output.open('x') as handle:
        handle.write(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='per_case_numeric'}))

if __name__ == '__main__':
    main(Path(sys.argv[1]).resolve(strict=True))
