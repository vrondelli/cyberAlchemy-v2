#!/usr/bin/env python3
"""Post-source-seal exposed diagnostics, complete mappings and reader ceilings.

Open Questions: G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md.
"""
import json
import os
from hashlib import sha256
from pathlib import Path
import statistics
import runpy

fusion = runpy.run_path(str(Path(__file__).with_name('build-defects4j-caller-r4.py')))['fusion']

BASE = Path('/home/vlad_/are-benchmark-archive')
STAGE = BASE / 'defects4j-canonical-exposed-r1'


def digest(b):
    return sha256(b).hexdigest()


def metrics(ranking, gold):
    first = min((ranking.index(p) + 1 for p in gold if p in ranking), default=10**9)
    return {'mrr_at_8': 1 / first if first <= 8 else 0, 'hit_at_3': int(first <= 3), 'recall_at_8': len(gold.intersection(ranking[:8])) / len(gold) if gold else 0}


def main():
    out = STAGE / 'SOURCE-SCORE.json'
    assert not out.exists()
    ab, rb = (STAGE / 'ARE-SCREEN.json').read_bytes(), (STAGE / 'REPOMAP-SCREEN.json').read_bytes()
    a, r = json.loads(ab), json.loads(rb)
    assert r['are_screen_sha256'] == digest(ab) and len(a['cases']) == len(r['cases']) == 62
    repo = {c['case_id']: c for c in r['cases']}
    old_scores = {name: json.loads((BASE / root / 'SCORE.json').read_bytes()) for name, root in [('r3', 'defects4j-caller-dev-r1'), ('r4', 'defects4j-caller-r4')]}
    rows, mappings = [], []
    for c in a['cases']:
        q = repo[c['case_id']]
        assert all(c[k] == q[k] for k in ['source_count', 'source_tree_sha256', 'text_projection_sha256', 'query_sha256', 'expanded_query_sha256'])
        paths = json.loads((Path(c['projection_root']) / 'RECEIPT.json').read_bytes())['sources']
        label = BASE / 'defects4j-metadata-v3.0.1/framework/projects' / c['project'] / 'modified_classes' / f"{c['bug']}.src"
        label_bytes = label.read_bytes()
        assert digest(label_bytes) == old_scores[c['cohort']]['gold_label_sha256'][c['case_id']]
        gold = set()
        for cls in label_bytes.decode().splitlines():
            if not cls.strip():
                continue
            suffix = cls.strip().split('$', 1)[0].replace('.', '/') + '.java'
            matches = [s['path'] for s in paths if s['path'] == suffix or s['path'].endswith('/' + suffix)]
            mappings.append({'case_id': c['case_id'], 'class_sha256': digest(cls.strip().encode()), 'matches': len(matches)})
            if len(matches) == 1:
                gold.add(matches[0])
        assert gold
        base = sorted(set(c['are_production'][:10] + q['repomap_original'][:10] + c['stack'][:8]))
        added = [p for p in c['are_caller'][:10] if p not in base][:4]
        union = sorted(set(base + added))
        assert len(union) <= 32
        arms = {'are': c['are_original'], 'are_production': c['are_production'], 'caller_are_production': c['are_caller'], 'stack': c['stack'], **{k: v for k, v in q.items() if k.startswith('repomap_')}}
        arms.update({'fusion': fusion(union, [c['are_original'], q['repomap_original'], c['stack']]), 'fusion_production': fusion(union, [c['are_production'], q['repomap_original_production'], c['stack']]), 'caller_fusion': fusion(union, [c['are_caller'], q['repomap_caller'], c['stack']]), 'caller_fusion_production': fusion(union, [c['are_caller'], q['repomap_caller_production'], c['stack']])})
        rows.append({'case_id': c['case_id'], 'cohort': c['cohort'], 'project': c['project'], 'gold_files': len(gold), 'label_sha256': digest(label_bytes), 'base_reachable': bool(gold.intersection(base)), 'caller_reachable': bool(gold.intersection(union)), 'candidate_count': len(union), 'candidates': union, 'arm_ranked_files': arms, 'metrics': {name: metrics(rank, gold) for name, rank in arms.items()}})
    aggregate = {}
    for name, expected in [('r3', 32), ('r4', 30)]:
        cohort = [c for c in rows if c['cohort'] == name]
        assert len(cohort) == expected
        arms = {arm: {m: statistics.mean(c['metrics'][arm][m] for c in cohort) for m in ['mrr_at_8', 'hit_at_3', 'recall_at_8']} for arm in cohort[0]['metrics']}
        hits = {arm: sum(c['metrics'][arm]['hit_at_3'] for c in cohort) for arm in arms}
        ceiling = sum(c['caller_reachable'] for c in cohort)
        aggregate[name] = {'cases': expected, 'base_reachable': sum(c['base_reachable'] for c in cohort), 'caller_reachable': ceiling, 'arms': arms, 'hits': hits, 'perfect_reader_hit_at_3_ceiling': ceiling, 'strongest_baseline_hits': max(hits.values()), 'six_extra_hits_possible': ceiling >= max(hits.values()) + 6, 'absolute_24_hits_possible': ceiling >= 24, 'all_mrr_plus_010_possible': all(ceiling / expected - arm['mrr_at_8'] >= .10 for arm in arms.values())}
    result = {'schema': 'are.canonical-exposed-source-diagnostics/v1', 'posture': 'already-exposed development source diagnostics; candidate reach and optimistic ceilings are not reader accuracy or superiority', 'are_screen_sha256': digest(ab), 'repomap_screen_sha256': digest(rb), 'aggregate': aggregate, 'mapping_complete': all(m['matches'] == 1 for m in mappings), 'mapping_failures': [m for m in mappings if m['matches'] != 1], 'mapping_count': len(mappings), 'cases': rows, 'implementation_sha256': digest(Path(__file__).read_bytes()), 'open_questions_owner': 'G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md'}
    data = (json.dumps(result, indent=2) + '\n').encode()
    with os.fdopen(os.open(out, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'wb') as stream:
        stream.write(data)
    print(json.dumps({'mapping_complete': result['mapping_complete'], 'mapping_count': len(mappings), 'aggregate': aggregate, 'receipt_sha256': digest(data)}))


if __name__ == '__main__':
    main()
