#!/usr/bin/env python3
"""Source-only ARB RepoMap adapter input preflight; no official code or gold."""

import hashlib
import importlib.util
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004')
SOURCE = ROOT / 'source-only-r1'
ADAPTER = Path(__file__).with_name('rank-exposed-official-repomap-r1.py')
MANIFEST = SOURCE / 'corpus/v2_trace2code/corpus_manifest.jsonl'
RANKINGS = ROOT / 'exposed-fixed-rrf-source-r1/DEVELOPMENT-RANKINGS.jsonl'
GIN_QUERIES = ROOT / 'query-only-dev-r1/DEV-QUERIES.jsonl'
NONGIN_QUERIES = ROOT / 'nongin-confirmation-queries-r1/CONFIRMATION-QUERIES.jsonl'
OUTPUT = ROOT / 'exposed-official-repomap-preflight-r1/PREFLIGHT.json'
PINS = {
    ADAPTER: 'aeadb2c44ef6bbd118660ab5147c6ceb42030b879e406f0571455eb474eb3beb',
    SOURCE / 'SOURCE-CORPUS-AUDIT.json': '1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f',
    MANIFEST: '9fef569ebf06d5a96b788d9b6136dd023a324b3d5e795172faf6f0c696d9498f',
    RANKINGS: '90562963631facf609b1ee1599f190c307e95a8e99f45e7ac2e00581bad95b6a',
    GIN_QUERIES: '19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a',
    NONGIN_QUERIES: 'fd40d61077846f49374ee61a87e561699d85de9016ac590790be5228fa67b08c',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def load_jsonl(path):
    with path.open() as stream:
        return [json.loads(line) for line in stream]


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise SystemExit('output-exists-or-input-pin-drift')
    spec = importlib.util.spec_from_file_location('repomap_adapter', ADAPTER)
    adapter = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(adapter)
    manifest = load_jsonl(MANIFEST)
    rankings = load_jsonl(RANKINGS)
    queries = load_jsonl(GIN_QUERIES) + load_jsonl(NONGIN_QUERIES)
    by_key = {}
    for row in rankings:
        by_key.setdefault((row['repo'], row['base_commit']), []).append(row)
    by_id = {row['id']: row for row in queries}
    if (len(manifest) != 98 or len(by_key) != 98 or len(rankings) != 101
            or len(queries) != 101 or len(by_id) != 101
            or {row['id'] for row in rankings} != set(by_id)):
        raise SystemExit('denominator-drift')
    total_chunks = total_files = 0
    maximum_snapshot_files = 0
    for meta in manifest:
        key = (meta['repo'], meta['base_commit'])
        rel = Path(meta['chunks_path'])
        if rel.parts[:2] != ('data', 'corpus') or '..' in rel.parts:
            raise SystemExit('unsafe-manifest-path')
        path = SOURCE.joinpath(*rel.parts[1:]).resolve(strict=True)
        if not path.is_relative_to(SOURCE):
            raise SystemExit('snapshot-escape')
        paths = set()
        count = 0
        with path.open() as stream:
            for line in stream:
                chunk = json.loads(line)
                count += 1
                paths.add(chunk['path'])
        if count != meta['chunk_count'] or len(paths) != meta['file_count']:
            raise SystemExit('snapshot-size-drift')
        for base in by_key[key]:
            if paths != set(base['arb_edge_bm25']) or paths != set(base['are_edge_trace_text']):
                raise SystemExit('candidate-universe-drift')
        total_chunks += count
        total_files += len(paths)
        maximum_snapshot_files = max(maximum_snapshot_files, len(paths))
    for base in rankings:
        query = by_id[base['id']]
        if (base['repo'] != query['repo'] or base['base_commit'] != query['base_commit']
                or set(query['query']) != {'command', 'failure_excerpt', 'run_strategy', 'source_type'}):
            raise SystemExit('query-identity-or-shape-drift')
        wire = adapter.edge_window(query['query']['failure_excerpt'])
        if (not wire or len(wire.encode()) > 1024
                or hashlib.sha256(wire.encode()).hexdigest() != base['query_sha256']):
            raise SystemExit('edge-query-drift')
    summary = {
        'snapshots': len(manifest), 'cases': len(rankings),
        'chunks': total_chunks, 'file_entries': total_files,
        'maximum_snapshot_files': maximum_snapshot_files,
        'candidate_universe_mismatches': 0, 'query_identity_or_hash_mismatches': 0,
    }
    receipt = {
        'schema': 'are.arb-exposed-official-repomap-source-preflight-r1/v1',
        'posture': 'source-only-preflight-no-gold-no-official-checkout-no-model',
        'input_sha256': {str(path): pin for path, pin in PINS.items()},
        'script_sha256': sha(Path(__file__)), 'summary': summary,
        'claim_ceiling': 'Input readiness only; official RepoMap ranking, native scoring and superiority remain unrun.',
    }
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
