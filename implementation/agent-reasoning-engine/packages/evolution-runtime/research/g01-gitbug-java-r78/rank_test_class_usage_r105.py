"""Source-only r103 replay with production-head protection on both arms.

The prior all-file rank-one guard can protect a test file while allowing the
first production file to fall. This variant preserves both roles. It remains
post-hoc exposed development and opens no confirmation, label, or model data.
Open question: does role-consistent protection retain Bears gain on transfer?
"""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath


ROOT = Path('/home/vlad_/are-benchmark-archive')
R103 = Path(__file__).with_name('rank_test_class_usage_r103.py')
R103_SHA = 'db9b20e4dcd97cbb7d0e49f1afefb9c52a827c5774aff758feffe6235347afb3'
CONFIG = {
    'gitbug': (ROOT / 'gitbug-java-metadata-preflight-20261005',
               '6995af3942febf9f0e53827f2f17cfd34fd4afd742d9d9668defb28ba855f8d3', 12),
    'bears': (ROOT / 'bears-metadata-preflight-r73-20261005',
              '2d4892cfca921fdef8fa6c3310760ec703abeffcb937a3ef2bcfdb2c42b71c35', 24),
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def production(path):
    return not {'test', 'tests'} & set(PurePosixPath(path).parts)


def protect(baseline, fused):
    first = next(path for path in baseline if production(path))
    before = next(path for path in fused if production(path))
    if before == first:
        return fused
    result = fused.copy()
    result.remove(first)
    result.insert(result.index(before), first)
    if next(path for path in result if production(path)) != first:
        raise ValueError('production-head-not-protected')
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', choices=CONFIG, required=True)
    args = parser.parse_args()
    if sha(R103) != R103_SHA:
        raise SystemExit('r103-rule-drift')
    spec = importlib.util.spec_from_file_location('r103_usage', R103)
    r103 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(r103)
    root, expected, count = CONFIG[args.population]
    prior_path = root / 'test-class-usage-fusion-r103/SOURCE-SEAL.json'
    output = root / 'test-class-usage-fusion-r105/SOURCE-SEAL.json'
    if output.exists() or sha(prior_path) != expected:
        raise SystemExit('output-exists-or-source-drift')
    prior = json.loads(prior_path.read_text())
    if len(prior['rows']) != count:
        raise SystemExit('denominator-drift')
    old_rank_path = root / ('dev-structure-r90/RANKINGS.jsonl' if args.population == 'gitbug'
                            else 'exposed-structure-r90/RANKINGS.jsonl')
    if sha(old_rank_path) != prior['input_sha256']['ranks']:
        raise SystemExit('baseline-ranking-drift')
    old = [json.loads(line) for line in old_rank_path.read_text().splitlines()]
    rows = []
    protected_counts = {'strong': 0, 'treatment': 0}
    for new, rank in zip(prior['rows'], old, strict=True):
        if new['ordinal'] != rank['ordinal'] or new['repo'] != rank['repo']:
            raise SystemExit('case-binding')
        strong = protect(rank['strong_raw_symbol_structure'], new['strong_usage'])
        treatment = protect(rank['treatment_safe'], new['treatment_usage'])
        protected_counts['strong'] += int(strong != new['strong_usage'])
        protected_counts['treatment'] += int(treatment != new['treatment_usage'])
        if set(strong) != set(new['strong_usage']) or set(treatment) != set(new['treatment_usage']):
            raise SystemExit('universe-drift')
        rows.append({'ordinal': new['ordinal'], 'repo': new['repo'],
                     'strong_usage_protected': strong, 'treatment_usage_protected': treatment})
    result = {'schema_version': 'g01.java-test-class-usage-fusion-r105/v1',
              'posture': 'source-only-post-hoc-exposed-development-no-label-model-or-confirmation',
              'population': args.population, 'cases': count,
              'r103_source_sha256': expected, 'r103_script_sha256': R103_SHA,
              'script_sha256': sha(Path(__file__)),
              'policy': 'Exact r103 fusion; preserve original all-file rank one and also original first production-file rank',
              'exploratory_gate': prior['exploratory_gate'],
              'production_head_repairs': protected_counts,
              'rows': rows,
              'claim_ceiling': 'Exposed source-only role-consistent replay; no fresh claim.',
              'open_questions': ['Does repair remove GitBug losses while preserving Bears quality?']}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    output.parent.mkdir(parents=True, mode=0o700, exist_ok=False)
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'population': args.population, 'repairs': protected_counts,
                      'sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
