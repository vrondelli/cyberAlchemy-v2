"""Source-only matched replay of sealed GLM verifier choices.

Strict-invalid responses abstain both arms. Each arm preserves its own
all-file and production head and may promote only one packet candidate.
No evaluator gold or fresh confirmation is read.
Open question: did valid choices actually improve early ranks?
"""

import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath


ROOT = Path('/home/vlad_/are-benchmark-archive')
VPS = ROOT / 'g01-java-source-verifier-r117'
OUTPUT = ROOT / 'g01-java-source-verifier-r118/SOURCE-SEAL.json'
R101 = Path(__file__).with_name('screen_test_class_usage_r101.py')
R101_SHA = 'a6365e865a80ee737b423fd25a01e6f350205a3f35dd8eac0ed4d525aea7daee'
PINS = {
    'PACKETS.jsonl': 'd3df297ed49f67cd28220ea70f2bf474e93c0d5b1669703b6d04a8f8db03417c',
    'PACKET-FREEZE.json': '20b9af170fc8d5511a70b920627dafdfc5c5ed6bc0a3bd14700b7909f053a7c6',
    'RUN-FREEZE.json': '4f839e8de222f57a5b3277355252fb0e1ff2e598f05787e71a667944f5adb141',
    'RUN-RESULT.json': '74fc948d92a73941adf73480bb91318e3f1f3710deca670bcd64172de4cb269f',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def production(path):
    parts = {part.lower() for part in PurePosixPath(path).parts}
    return path.endswith('.java') and not {'test', 'tests', 'testing', 'testsrc'} & parts


def promote(baseline, choice, candidates, head_id):
    prod = [path for path in baseline if production(path)]
    if not prod or candidates[prod[0]] != head_id:
        raise SystemExit('head-binding')
    if choice == 'ABSTAIN' or choice == head_id:
        return baseline.copy(), None
    inverse = {value: key for key, value in candidates.items()}
    selected = inverse[choice]
    if selected not in baseline or not production(selected):
        raise SystemExit('candidate-outside-production')
    result = baseline.copy()
    result.remove(selected)
    result.insert(result.index(prod[0]) + 1, selected)
    if result[0] != baseline[0] or [path for path in result if production(path)][:2] != [prod[0], selected]:
        raise SystemExit('head-guard')
    return result, selected


def main():
    if OUTPUT.exists() or sha(R101) != R101_SHA:
        raise SystemExit('output-exists-or-rule-drift')
    if any(sha(VPS / name) != pin for name, pin in PINS.items()):
        raise SystemExit('provider-archive-drift')
    spec = importlib.util.spec_from_file_location('r101_usage', R101)
    r101 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(r101)
    packets = [json.loads(line) for line in (VPS / 'PACKETS.jsonl').read_text().splitlines()]
    freeze = json.loads((VPS / 'PACKET-FREEZE.json').read_text())
    result = json.loads((VPS / 'RUN-RESULT.json').read_text())
    if (len(packets) != 36 or freeze['packets_sha256'] != PINS['PACKETS.jsonl']
            or result['status'] != 'complete' or result['attempts'] != 36
            or result['packets_sha256'] != freeze['packets_sha256']):
        raise SystemExit('provider-run-binding')
    selections = []
    selection_sha = []
    for index in range(1, 37):
        path = VPS / f'SELECTION-{index:03d}.json'
        selection_sha.append(sha(path))
        selections.append(json.loads(path.read_text()))
    if sum(item['valid'] for item in selections) != result['valid_selections']:
        raise SystemExit('validity-count-drift')
    rows, changed = [], {'strong': 0, 'treatment': 0}
    cursor = 0
    for population in ('gitbug', 'bears'):
        cfg = r101.CONFIG[population]
        rank_path = cfg['root'] / cfg['ranks'][0]
        if sha(rank_path) != cfg['ranks'][1]:
            raise SystemExit('prior-rank-drift')
        prior = [json.loads(line) for line in rank_path.read_text().splitlines()]
        if len(prior) != cfg['cases']:
            raise SystemExit('denominator-drift')
        for old in prior:
            packet = packets[cursor]
            selection = selections[cursor]
            cursor += 1
            if not (packet['population'] == selection['population'] == population
                    and packet['ordinal'] == selection['ordinal'] == old['ordinal']
                    and packet['repo'] == selection['repo'] == old['repo']
                    and packet['query_sha256'] == selection['query_sha256'] == old['query_sha256']):
                raise SystemExit('case-binding')
            strong = old['strong_raw_symbol_structure']
            treatment = old['treatment_safe']
            if set(strong) != set(treatment) or len(strong) != len(treatment):
                raise SystemExit('rank-universe')
            answer = selection['selection'] if selection['valid'] else {'A': 'ABSTAIN', 'B': 'ABSTAIN'}
            strong_new, strong_selected = promote(strong, answer['A'], packet['candidate_ids'], packet['head_A'])
            treatment_new, treatment_selected = promote(treatment, answer['B'], packet['candidate_ids'], packet['head_B'])
            if set(strong_new) != set(strong) or set(treatment_new) != set(treatment):
                raise SystemExit('rank-universe-after')
            changed['strong'] += strong_new != strong
            changed['treatment'] += treatment_new != treatment
            rows.append({'population': population, 'ordinal': old['ordinal'], 'repo': old['repo'],
                         'query_sha256': old['query_sha256'], 'valid': selection['valid'],
                         'strong_selected': strong_selected, 'treatment_selected': treatment_selected,
                         'strong_verifier': strong_new, 'treatment_verifier': treatment_new})
    if cursor != 36:
        raise SystemExit('cursor')
    report = {'schema_version': 'g01.java-source-verifier-ranking-r118/v1',
              'posture': 'source-only-exposed-matched-replay-no-evaluator-or-fresh-confirmation',
              'input_sha256': PINS, 'selection_sha256': selection_sha,
              'r101_script_sha256': R101_SHA, 'script_sha256': sha(Path(__file__)),
              'cases': {'gitbug': 12, 'bears': 24}, 'valid_selections': result['valid_selections'],
              'changed': changed, 'exploratory_gate': freeze['exploratory_gate'],
              'policy': 'strict-invalid=abstain both; chosen candidate to second production rank separately per arm; preserve all-file and production head; same prompt/source evidence for both arms',
              'rows': rows, 'claim_ceiling': 'Exposed matched rank seal only; no superiority.',
              'open_questions': ['Did the verifier improve matched early-rank quality?']}
    encoded = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(parents=True, mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'sha256': hashlib.sha256(encoded).hexdigest(),
                      'valid_selections': result['valid_selections'], 'changed': changed}, sort_keys=True))


if __name__ == '__main__':
    main()
