#!/usr/bin/env python3
"""Same canonical Java/query inputs, pinned official RepoMap; no labels/providers.

Open Questions: G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md.
"""
import json
import os
from hashlib import sha256
from pathlib import Path
import subprocess
import sys
import time
from production_path_r1 import production_path

BASE = Path('/home/vlad_/are-benchmark-archive/defects4j-canonical-exposed-r1')
OFFICIAL = Path('/home/vlad_/are-benchmark-archive/arb-official-repomap-code-07014c-r1')
PIN = '07014c986f3deadb1548c62b32c0ffbe6a81465d'


def digest(b):
    return sha256(b).hexdigest()


def main():
    output = BASE / 'REPOMAP-SCREEN.json'
    assert not output.exists()
    assert subprocess.check_output(['git', '-C', str(OFFICIAL), 'rev-parse', 'HEAD']).decode().strip() == PIN
    assert not subprocess.check_output(['git', '-C', str(OFFICIAL), 'status', '--porcelain=v1']).strip()
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(OFFICIAL / 'src'))
    from agent_retrieval_bench.repomap_eval import build_repomap_index, rank_files_for_sample
    are_bytes = (BASE / 'ARE-SCREEN.json').read_bytes()
    are = json.loads(are_bytes)
    assert len(are['cases']) == 62 and are['gold_read_by_generator'] is False
    cases = []
    started = time.monotonic()
    for c in are['cases']:
        projection = Path(c['projection_root'])
        receipt_bytes = (projection / 'RECEIPT.json').read_bytes()
        assert digest(receipt_bytes) == c['projection_receipt_sha256']
        receipt = json.loads(receipt_bytes)
        chunks, identities = [], []
        for s in receipt['sources']:
            path = projection / 'corpus' / s['path']
            assert path.resolve().is_relative_to((projection / 'corpus').resolve()) and not path.is_symlink()
            raw = path.read_bytes()
            assert digest(raw) == s['sha256'] and len(raw) == s['bytes']
            text = raw.decode(errors='replace')[:20_000]
            chunks.append({'path': s['path'], 'kind': 'file', 'text': text})
            identities.append(f"{s['path']}\t{digest(text.encode())}\n")
        assert len(chunks) == c['source_count'] == receipt['source_count']
        assert digest(''.join(identities).encode()) == c['text_projection_sha256']
        paths = {s['path'] for s in receipt['sources']}
        index = build_repomap_index(chunks)
        assert set(index.nodes) == paths
        ranks = {}
        for name, query in [('original', c['query']), ('caller', c['expanded_query'])]:
            assert digest(query.encode()) == c['query_sha256' if name == 'original' else 'expanded_query_sha256']
            sample = {'task_type': 'trace2code', 'query': {'command': '', 'failure_excerpt': query, 'run_strategy': 'recorded_trigger_tests', 'source_type': 'defects4j'}}
            ranked = rank_files_for_sample(sample=sample, query_text=query, index=index, candidate_paths=paths, query_weight=.65, pagerank_weight=.25, affinity_weight=.10)
            assert len(ranked) == len(paths) and {r[0] for r in ranked} == paths
            ranks['repomap_' + name] = [r[0] for r in ranked[:20]]
            ranks['repomap_' + name + '_production'] = [r[0] for r in ranked if production_path(r[0])][:20]
        cases.append({'case_id': c['case_id'], 'source_count': c['source_count'], 'source_tree_sha256': c['source_tree_sha256'], 'text_projection_sha256': c['text_projection_sha256'], 'query_sha256': c['query_sha256'], 'expanded_query_sha256': c['expanded_query_sha256'], **ranks})
        print(json.dumps({'case_id': c['case_id'], 'finished': len(cases), 'elapsed_s': round(time.monotonic() - started, 1)}), flush=True)
    result = {'schema': 'are.canonical-repomap-development-screen/v1', 'posture': 'all62 exposed cases, source-only seal, not accuracy/confirmation/superiority', 'cases': cases, 'are_screen_sha256': digest(are_bytes), 'official_commit': PIN, 'implementation_sha256': digest(Path(__file__).read_bytes()), 'elapsed_s': time.monotonic() - started, 'gold_read_by_generator': False, 'open_questions_owner': 'G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md'}
    data = (json.dumps(result, indent=2) + '\n').encode()
    with os.fdopen(os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'wb') as stream:
        stream.write(data)
    print(json.dumps({'terminal': True, 'cases': 62, 'receipt_sha256': digest(data)}), flush=True)


if __name__ == '__main__':
    main()
