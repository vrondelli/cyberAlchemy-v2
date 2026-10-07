"""Isolated exposed scoring. Open Questions: G02-R11-REGION-POOLING-EXPOSED-R1.md."""
import json
import statistics
from hashlib import sha256
from pathlib import Path
import pyarrow.parquet as parquet

ROOT = Path('/home/vlad_/are-benchmark-archive')
OUT = ROOT/'g02-r11-region-pooling-exposed-r1-20261006'
HERE = Path(__file__).parent
digest = lambda b: sha256(b).hexdigest()


def normalize(path):
    path = path.replace('\\','/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        path = path[len('/workspace/'):].split('/',1)[-1]
    return path.lstrip('/').removeprefix('./')


def f1(a,b):
    return 2*len(a&b)/(len(a)+len(b)) if a or b else 1.0


def main():
    assert not (OUT/'EVALUATOR-AUDIT.json').exists()
    sb = (OUT/'SOURCE-SEAL.json').read_bytes(); seal = json.loads(sb)
    assert digest((OUT/'PROTOCOL.md').read_bytes()) == seal['protocol_sha256']
    for key,name in [('implementation_sha256','seal-g02-r11-region-pooling-r1.py'),
                     ('ranker_sha256','region-pooling-r1.py'),
                     ('tokenizer_sha256','seal-g02-r11-multiview-file-card-exposed-r1.py')]:
        assert digest((HERE/name).read_bytes()) == seal[key]
    ids = [r['instance_id'] for r in seal['rows']]; assert len(ids) == len(set(ids)) == 12
    dataset = ROOT/'g01-r8-eight-task-evaluator-r1/full.parquet'
    hasher = sha256()
    with dataset.open('rb') as stream:
        for block in iter(lambda:stream.read(1024*1024),b''):
            hasher.update(block)
    assert hasher.hexdigest() == '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
    refs = parquet.read_table(dataset,columns=['instance_id','base_commit','gold_context'],
                              filters=[('instance_id','in',ids)]).to_pylist()
    gold_by_id = {r['instance_id']:r for r in refs}; assert len(refs) == len(gold_by_id) == 12
    rows = []
    for ordinal,r in enumerate(seal['rows'],1):
        assert r['ordinal'] == ordinal
        ref = gold_by_id[r['instance_id']]; assert r['base_commit'] == ref['base_commit']
        selected = {normalize(p) for p in r['selected_paths']}
        delivered = {normalize(p) for p in r['delivered_paths']}
        proposed = {normalize(p['path']) for p in r['proposals']}
        control = {normalize(p['path']) for p in r['controls']}
        assert len(proposed) == len(r['proposals']) == len(control) == len(r['controls']) <= 3
        assert not (proposed|control)&(selected|delivered)
        assert all(p['path'] in r['source_sha256'] and len(p['query_terms']) >= 2
                   and 1 <= p['start'] <= p['end'] for p in r['proposals']+r['controls'])
        gold = {normalize(p['file']) for p in json.loads(ref['gold_context'])}
        hits = proposed&(gold-selected-delivered); control_hits = control&(gold-selected-delivered)
        rows.append({'ordinal':ordinal,'repo':r['repo'],'proposals':len(proposed),
                     'control_count':len(control),'new_gold_hits':len(hits),
                     'control_new_gold_hits':len(control_hits),'new_gold_paths':sorted(hits),
                     'baseline_file_f1':f1(selected,gold),'counterfactual_file_f1':f1(selected|proposed,gold),
                     'control_counterfactual_file_f1':f1(selected|control,gold)})
    hits = sum(r['new_gold_hits'] for r in rows); count = sum(r['proposals'] for r in rows)
    controls = sum(r['control_new_gold_hits'] for r in rows)
    summary = {'tasks':12,'proposals':count,'new_gold_hits':hits,'control_new_gold_hits':controls,
               'net_gain':hits-controls,'proposal_precision':hits/count if count else 0,
               'repositories_with_hit':len({r['repo'] for r in rows if r['new_gold_hits']}),
               'baseline_mean_file_f1':statistics.mean(r['baseline_file_f1'] for r in rows),
               'counterfactual_mean_file_f1':statistics.mean(r['counterfactual_file_f1'] for r in rows),
               'control_counterfactual_mean_file_f1':statistics.mean(r['control_counterfactual_file_f1'] for r in rows),
               'index_elapsed_s':sum(r['elapsed_s'] for r in seal['rows'])}
    criteria = {'minimum_3_new_gold':hits>=3,'minimum_2_repositories':summary['repositories_with_hit']>=2,
                'precision_ge_one_third':summary['proposal_precision']>=1/3,
                'nonnegative_mean_file_f1':summary['counterfactual_mean_file_f1']>=summary['baseline_mean_file_f1'],
                'net_gain_ge_1_vs_width_control':hits-controls>=1,
                'equal_width_control':all(r['proposals']==r['control_count'] for r in rows)}
    result = {'schema':'are.g02-region-pooling-audit/v1','posture':'exposed post-seal reach screen, not native scores or superiority',
              'source_seal_sha256':digest(sb),'implementation_sha256':digest(Path(__file__).read_bytes()),
              'summary':summary,'criteria':criteria,'gate_passed':all(criteria.values()),'rows':rows,
              'open_questions_owner':'G02-R11-REGION-POOLING-EXPOSED-R1.md'}
    with (OUT/'EVALUATOR-AUDIT.json').open('x') as stream:
        json.dump(result,stream,indent=2); stream.write('\n')
    print(json.dumps({'summary':summary,'criteria':criteria,'gate_passed':result['gate_passed'],
                      'sha256':digest((OUT/'EVALUATOR-AUDIT.json').read_bytes())}))


if __name__ == '__main__':
    main()
