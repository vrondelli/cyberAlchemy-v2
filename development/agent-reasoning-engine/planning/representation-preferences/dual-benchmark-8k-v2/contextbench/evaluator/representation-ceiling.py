"""Evaluator-only aggregate bounds; never import into generator. Open questions: ../REPRESENTATION-CEILING.md."""
import hashlib, importlib.util, json, sys
from pathlib import Path
from types import SimpleNamespace

root, upstream, payload_path = map(Path, sys.argv[1:])
native = root / 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1'
spec = importlib.util.spec_from_file_location('native_wrapper', native / 'score_native.py')
wrapper = importlib.util.module_from_spec(spec); spec.loader.exec_module(wrapper)
manifest = json.loads((native / 'source-manifest.json').read_text())
wrapper.verify_sources(upstream, manifest)
sys.path.insert(0, str(upstream))
from contextbench.parsers.gold import GoldLoader
from contextbench.evaluate import _step_spans
from contextbench.core.intervals import merge
from contextbench.metrics.compute import span_total_bytes as size, span_intersection_bytes as overlap

def union(sets):
    result = {}
    for spans in sets:
        for path, intervals in spans.items():
            result[path] = merge(result.get(path, []) + intervals)
    return result

payload = json.loads(payload_path.read_text())
gold = GoldLoader(str(upstream / 'data/full.parquet')).get(payload['instance_id'])
assert gold is not None and gold.commit == payload['base_commit'] and gold.repo_url == payload['repo_url']
g = gold.byte_spans(payload['repo_root']); n = size(g)
assert n > 0
outputs = []
for case in payload['cases']:
    reads = [_step_spans(SimpleNamespace(spans=[dict(file=r['path'], **s) for s in r['base_spans']]), payload['repo_root']) for r in case['eligible']]
    assert all(size(r) > 0 for r in reads)
    u = union(reads)
    pure = [r for r in reads if size(r) == overlap(r, g)]
    p = union(pure)
    hit, pure_hit, total = overlap(u, g), overlap(p, g), size(u)
    recall = hit / n
    outputs.append({
        'task_id': payload['task_id'], 'arm': case['arm'], 'stage': case['stage'],
        'source_result': case['source_result'], 'source_result_sha256': case['source_result_sha256'],
        'delivered_reads': case['delivered_reads'], 'eligible_unique_whole_reads': len(reads),
        'gold_bytes': n, 'all_read_union_bytes': total, 'all_read_union_gold_intersection_bytes': hit,
        'all_read_union_precision': hit / total if total else 1,
        'maximum_recall_exact': recall,
        'span_f1_upper_bound': 2 * recall / (1 + recall),
        'all_reads_span_f1': 2 * hit / (total + n),
        'pure_whole_reads': len(pure), 'pure_read_union_gold_bytes': pure_hit,
        'missing_gold_bytes_from_archive': n - hit,
        'reachable_gold_bytes_requiring_impure_whole_reads': hit - pure_hit,
        'perfect_whole_read_selection_attainable_unbounded': pure_hit == n,
        'perfect_arbitrary_subspan_selection_attainable_from_archive': hit == n,
        'exact_optimum_span_f1': None,
        'bound_is_exact_optimum': False,
    })
print(json.dumps({'cases': outputs, 'gold_data_sha256': next(x['sha256'] for x in manifest['files'] if x['path'] == 'data/full.parquet'),
    'upstream_revision': manifest['revision'], 'evaluator_source_hashes': {p: hashlib.sha256((upstream / p).read_bytes()).hexdigest() for p in ['contextbench/evaluate.py', 'contextbench/parsers/gold.py', 'contextbench/core/fileio.py', 'contextbench/core/intervals.py', 'contextbench/metrics/compute.py']}}))
