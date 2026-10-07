"""Seal source-only Java BM25 rankings for fixed r98 query compression.

The same rule and arms run on exposed GitBug and Bears before either cohort's
labels are opened by the separate evaluator. No model or holdout case is used.
Open question: does compressed-query retrieval transfer across populations?
"""

import argparse
import gc
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath


ROOT = Path('/home/vlad_/are-benchmark-archive')
HERE = Path(__file__).resolve().parent
BM25 = HERE.parent / 'arb-trace2code-r1/rank-gin-official-bm25-replica-r1.py'
BM25_SHA = 'f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1'
SYMBOL = HERE / 'rank_symbol_dev_r84.py'
SYMBOL_SHA = '5f82858f8cdb21186e6b9c4664b513935a60f68f0b7556cdd957d826170a519a'
INPUTS = {
    'gitbug': {
        'queries': (ROOT / 'gitbug-java-metadata-preflight-20261005/query-compression-r98/QUERIES.jsonl',
                    '8f8009835b27fdf871d9123766c00f825580ed81b7d9a6c773b1dc5d0cf06d03'),
        'source': (ROOT / 'gitbug-java-metadata-preflight-20261005/dev-projection-r83/SOURCE-PROJECTION.json',
                   'aaff284494a0726d5517a2f492a36186d6c34a35b4166819dc3a83f77211eb46'),
        'prior': (ROOT / 'gitbug-java-metadata-preflight-20261005/dev-symbol-r84/RANKINGS.jsonl',
                  'e1ef342e646806d223b3e8bf02c06c45f2f9b4f116b064aeaa708bf8cd6e774d'),
        'count': 12,
    },
    'bears': {
        'queries': (ROOT / 'bears-metadata-preflight-r73-20261005/query-compression-r98/QUERIES.jsonl',
                    '33bae51f45a7c953668a4e16ce72c278817de14c1224920d1df34588312eaf9e'),
        'source': (ROOT / 'bears-metadata-preflight-r73-20261005/source-projection-r77/SOURCE-PROJECTION.json',
                   '33dc47d6db3804943b76a2dea11dcca3da35ab80451ddb6a9040a7d7dc944cf6'),
        'prior': (ROOT / 'bears-metadata-preflight-r73-20261005/fusion-r77/RANKINGS.jsonl',
                  'a8d1e2474275a58e013e3722400118c50c4a83ba8a83e3cdbaf3c7ddf4b0f699'),
        'count': 24,
    },
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def write_new(path, data):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def load_pinned(pair):
    path, digest = pair
    data = path.read_bytes()
    if digest is not None and sha(data) != digest:
        raise SystemExit(f'input-drift:{path}')
    return data, sha(data)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cohort', choices=INPUTS, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    if args.out.exists() or sha(BM25.read_bytes()) != BM25_SHA or sha(SYMBOL.read_bytes()) != SYMBOL_SHA:
        raise SystemExit('output-or-rule-drift')
    cfg = INPUTS[args.cohort]
    query_bytes, query_sha = load_pinned(cfg['queries'])
    source_bytes, source_sha = load_pinned(cfg['source'])
    prior_bytes, prior_sha = load_pinned(cfg['prior'])
    queries = [json.loads(line) for line in query_bytes.splitlines()]
    source = json.loads(source_bytes)['records']
    prior = [json.loads(line) for line in prior_bytes.splitlines()]
    original_queries = None
    if args.cohort == 'bears':
        original_path = ROOT / 'bears-metadata-preflight-r73-20261005/query-only-r77/QUERIES.jsonl'
        original_bytes = original_path.read_bytes()
        if sha(original_bytes) != 'be63d0919095bdca86090e86510a15368ea7b14cab8872f7765d17e928300d71':
            raise SystemExit('original-query-drift')
        original_queries = [json.loads(line) for line in original_bytes.splitlines()]
    if len(queries) != cfg['count'] or len(source) != cfg['count'] or len(prior) != cfg['count']:
        raise SystemExit('denominator-drift')
    bm = module(BM25, 'pinned_bm25_r99')
    sym = module(SYMBOL, 'pinned_symbol_r99')
    args.out.mkdir(parents=True, mode=0o700)
    freeze = {'schema_version': 'g01.java-query-compression-ranking-freeze-r99/v1',
              'cohort': args.cohort, 'cases': cfg['count'], 'queries_sha256': query_sha,
              'source_sha256': source_sha, 'prior_rankings_sha256': prior_sha,
              'bm25_sha256': BM25_SHA, 'symbol_rule_sha256': SYMBOL_SHA,
              'script_sha256': sha(Path(__file__).read_bytes()),
              'arms': ['raw_original', 'raw_reduced', 'raw_mix', 'are_raw',
                       'are_reduced_mix_safe', 'raw_symbol_reduced'],
              'fusion': 'RRF(k=60); preserve original ARE/raw top-three consensus in treatment',
              'development_gate': {'minimum_mrr8_gain_over_strongest_matched_comparator_each_population': 0.03,
                                   'minimum_wins_gitbug': 4, 'minimum_wins_bears': 7,
                                   'no_mean_mrr8_decline_vs_are_raw_each_population': True},
              'gold_values_used': False, 'model_calls': 0,
              'claim_ceiling': 'Exposed source-only rankings; evaluator and fresh confirmation separate.'}
    write_new(args.out / 'RANKING-FREEZE.json', (json.dumps(freeze, sort_keys=True, indent=2) + '\n').encode())
    rows = []
    for ordinal, (query, src, old) in enumerate(zip(queries, source, prior, strict=True), 1):
        if not (query['ordinal'] == src['ordinal'] == old['ordinal'] == ordinal
                and query['repo'] == src['repo'] == old['repo']
                and query['base_commit'] == src['base_commit']
                and query['source_query_sha256'] == old['query_sha256']):
            raise SystemExit(f'case-identity:{ordinal}')
        root = Path(src['root']).resolve(strict=True)
        if not root.is_relative_to(cfg['source'][0].parent.resolve(strict=True)):
            raise SystemExit(f'source-root:{ordinal}')
        universe = old['are']
        if len(universe) != src['projected_files'] or len(set(universe)) != len(universe):
            raise SystemExit(f'universe:{ordinal}')
        chunks = []
        for relpath in sorted(universe):
            rel = PurePosixPath(relpath)
            if rel.is_absolute() or '..' in rel.parts or not relpath.endswith('.java'):
                raise SystemExit(f'unsafe-path:{ordinal}')
            target = root.joinpath(*rel.parts).resolve(strict=True)
            if not target.is_relative_to(root) or not target.is_file():
                raise SystemExit(f'source-path:{ordinal}')
            lines = target.read_text(encoding='utf-8', errors='replace').splitlines()
            for start in range(0, max(1, len(lines)), 120):
                chunks.append({'path': relpath, 'chunk_id': f'{relpath}:{start+1}',
                               'text': '\n'.join(lines[start:start+120]), 'symbol': '', 'kind': ''})
        snapshot = bm.Snapshot(chunks, len(universe))
        reduced = snapshot.rank(query['query'])
        raw = old['raw_bm25']
        are_raw = old['a_are_raw'] if args.cohort == 'gitbug' else old['base']
        # Symbol arm comes from the original failure-side query only.
        if args.cohort == 'gitbug':
            symbol = old['symbol']
        else:
            symbol = sym.symbol_rank(original_queries[ordinal - 1]['query'], universe, bm.tokenize)
        mix = sym.order(universe, raw, reduced)
        treatment = sym.order(universe, universe, raw, reduced)
        treatment = sym.protect_consensus(treatment, are_raw, universe, raw)
        comparator = sym.order(universe, raw, symbol, reduced)
        if any(len(rank) != len(universe) or set(rank) != set(universe)
               for rank in (reduced, mix, treatment, comparator)):
            raise SystemExit(f'rank-permutation:{ordinal}')
        rows.append({'ordinal': ordinal, 'repo': src['repo'], 'base_commit': src['base_commit'],
                     'source_query_sha256': query['source_query_sha256'],
                     'reduced_query_sha256': query['query_sha256'],
                     'raw_original': raw, 'raw_reduced': reduced, 'raw_mix': mix,
                     'are_raw': are_raw, 'are_reduced_mix_safe': treatment,
                     'raw_symbol_reduced': comparator})
        print(json.dumps({'cohort': args.cohort, 'ordinal': ordinal, 'files': len(universe)}), flush=True)
        del snapshot, chunks
        gc.collect()
    encoded = ''.join(json.dumps(row, sort_keys=True) + '\n' for row in rows).encode()
    write_new(args.out / 'RANKINGS.jsonl', encoded)
    write_new(args.out / 'RANKING-SEAL.json', (json.dumps({
        'schema_version': 'g01.java-query-compression-ranking-seal-r99/v1',
        'cohort': args.cohort, 'cases': len(rows), 'freeze_sha256': sha((args.out / 'RANKING-FREEZE.json').read_bytes()),
        'rankings_sha256': sha(encoded), 'gold_values_used': False, 'model_calls': 0,
    }, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'cohort': args.cohort, 'rankings_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
