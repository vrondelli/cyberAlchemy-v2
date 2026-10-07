"""Native exposed scoring only after complete immutable prediction seal.
Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json.
"""
import hashlib
import itertools
import json
import os
import re
import statistics
import sys
import uuid
from pathlib import Path

ARCHIVE = Path('/home/vlad_/are-benchmark-archive')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read(path, pin=None):
    data = path.read_bytes()
    if pin and sha(data) != pin:
        raise ValueError('score.input-drift:' + str(path))
    return json.loads(data)


def mapped_files(classes, production):
    gold, failures = set(), []
    for cls in classes:
        exact = [(p['path'], top) for p in production for top in p['top_level_classes'] if cls == top or cls.startswith(top+'$')]
        longest = max((len(top) for _, top in exact), default=-1)
        matches = {path for path, top in exact if len(top) == longest}
        if len(matches) == 1:
            gold.update(matches)
        else:
            failures.append({'class_sha256': sha(cls.encode()), 'matches': len(matches)})
    return gold, failures


def metrics(ranking, gold):
    first = min((ranking.index(path)+1 for path in gold if path in ranking), default=999999)
    return {'mrr_at_8': 1/first if first <= 8 else 0, 'hit_at_3': int(first <= 3),
            'recall_at_8': len(set(ranking[:8]) & gold)/len(gold) if gold else 0}


def signflip(values):
    values = [v for v in values if abs(v) > 1e-12]
    if not values:
        return 1.0
    observed = abs(sum(values))
    return sum(abs(sum(a*b for a, b in zip(signs, values))) >= observed-1e-12
               for signs in itertools.product((-1, 1), repeat=len(values))) / (2**len(values))


def public_ids(reply, count):
    def uint(value):
        return type(value) is int and 0 <= value <= 9007199254740991
    public = reply.get('public_response') or {}
    message = public.get('message') or {}
    if not (reply.get('dispatched') is True and reply.get('status') == 200 and not reply.get('failure_code')
            and not reply.get('dispatch_uncertain') and uint(reply.get('prompt_tokens'))
            and uint(reply.get('completion_tokens')) and reply['prompt_tokens']+512 <= 8192
            and reply['completion_tokens'] <= 512 and public.get('finish_reason') == 'stop' and message.get('role') == 'assistant'):
        return None
    try:
        value = json.loads(message['content'])
        if type(value) is not dict or set(value) != {'candidate_ids'} or type(value['candidate_ids']) is not list:
            return None
        ids = []
        for item in value['candidate_ids']:
            if type(item) is str and re.fullmatch(r'(?:[0-9]+|\[[0-9]+\])', item):
                item = int(item.strip('[]'))
            if type(item) is float and item.is_integer():
                item = int(item)
            if type(item) is not int or not 1 <= item <= count:
                return None
            ids.append(item)
        return ids if len(ids) <= 8 and len(ids) == len(set(ids)) else None
    except (KeyError, TypeError, ValueError, OverflowError):
        return None


def save(path, obj):
    temporary = path.with_name(path.name + '.tmp-' + uuid.uuid4().hex)
    try:
        with os.fdopen(os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as stream:
            stream.write((json.dumps(obj, indent=2)+'\n').encode())
            stream.flush()
            os.fsync(stream.fileno())
        os.link(temporary, path)
        descriptor = os.open(path.parent, os.O_DIRECTORY | os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
    finally:
        temporary.unlink()


def main(root):
    if root not in [ARCHIVE/'g01-runtime-linked-reader-r1-20261007', ARCHIVE/'g01-runtime-linked-reader-r1b-20261007']:
        raise ValueError('score.exact-root')
    run = root / 'generate-run'
    seal = read(run / 'PREDICTION-SEAL.json')
    result = read(run / 'RESULT.json', seal['result_sha256'])
    freeze = read(run / 'FREEZE.json', result['freeze_sha256'])
    if seal['gold_opened'] is not False or seal['full_prediction_denominator'] != 32 or len(result['predictions']) != 32:
        raise ValueError('score.prediction-boundary')
    if sha(json.dumps(result['predictions'], ensure_ascii=False, separators=(',', ':')).encode()) != seal['predictions_sha256']:
        raise ValueError('score.prediction-seal')
    for path, pin in freeze['source_sha256'].items():
        if sha(Path(path).read_bytes()) != pin:
            raise ValueError('score.source-drift')
    packet_data = (root / 'PACKETS.jsonl').read_bytes()
    if sha(packet_data) != seal['packets_sha256'] or sha((root / 'PROTOCOL.json').read_bytes()) != freeze['protocol_sha256']:
        raise ValueError('score.packet-protocol')
    packets = [json.loads(line) for line in packet_data.splitlines()]
    predictions = {}
    for p, prediction in zip(packets, result['predictions'], strict=True):
        if (prediction['case_id'], prediction['arm'], prediction['ordinal']) != (p['case_id'], p['arm'], p['ordinal']):
            raise ValueError('score.prediction-identity')
        response = next((r for r in result['rows'] if r['ordinal'] == p['ordinal']), None)
        if response:
            reply = read(run / f"REPLY-{p['ordinal']:02d}.json", response['reply_sha256'])
            if read(run / f"ROW-{p['ordinal']:02d}.json") != response:
                raise ValueError('score.row-reconstruction')
            sealed_response = next(r for r in seal['responses'] if r['ordinal'] == p['ordinal'])
            if sealed_response['sha256'] != response['reply_sha256'] or reply['request_sha256'] != freeze['ordered_requests'][p['ordinal']-1]['request_sha256']:
                raise ValueError('score.response-seal')
            ids = public_ids(reply, len(p['candidates']))
            if ids != response['selected_ids'] or (ids is not None) != response['valid']:
                raise ValueError('score.public-selection-reconstruction')
            files = [p['candidates'][n-1]['path'] for n in ids] if ids is not None else []
            if files != prediction['ranked_files'] or response['valid'] != prediction['valid']:
                raise ValueError('score.prediction-reconstruction')
        elif prediction['valid'] or prediction['ranked_files'] or not prediction['missing']:
            raise ValueError('score.missing-prediction')
        predictions[(p['case_id'], p['arm'])] = prediction['ranked_files']
    # Only now access already exposed reference labels. Never confirmation labels.
    source = ARCHIVE / 'defects4j-canonical-exposed-r1'
    labels = {c['case_id']: c for c in read(source / 'SOURCE-SCORE.json', '5903d07c39962266afc07924f6e53e42d4f6d8033ee4210c9f389477214b188f')['cases']}
    baseline_data = (ARCHIVE/'defects4j-canonical-entity-reader-r1/PACKETS.jsonl').read_bytes()
    if sha(baseline_data) != '00596b63d4b00f3a2b7f1311efc0311a62c72b1634c1f8e9625d1068e35c892d':
        raise ValueError('score.baseline-packets')
    baselines = {p['case_id']: p['arm_ranked_files'] for p in map(json.loads, baseline_data.splitlines())}
    rows, mapping_failures, label_pins = [], [], {}
    for p in packets[::2]:
        cid = p['case_id']
        label = ARCHIVE/'defects4j-metadata-v3.0.1/framework/projects'/p['project']/'modified_classes'/f"{p['bug']}.src"
        raw = label.read_bytes()
        if sha(raw) != labels[cid]['label_sha256']:
            raise ValueError('score.label-drift')
        classes = [line.strip() for line in raw.decode().splitlines() if line.strip()]
        production = read(ARCHIVE/'g01-jacoco-project-capacity-r6-20261007'/cid/'INSTRUMENTATION.json')['rows']
        gold, failed = mapped_files(classes, production)
        mapping_failures.extend({'case_id': cid, **f} for f in failed)
        label_pins[cid] = sha(raw)
        arms = {**baselines[cid], 'glm_plain': predictions[(cid, 'plain')], 'glm_linked': predictions[(cid, 'linked')]}
        rows.append({'case_id': cid, 'project': p['project'], 'runtime_available': p['runtime_available'],
                     'gold_files': len(gold), 'metrics': {name: metrics(ranking, gold) for name, ranking in arms.items()}})
    if len(rows) != 16:
        raise ValueError('score.full16')
    names = list(rows[0]['metrics'])
    aggregate = {name: {metric: statistics.mean(r['metrics'][name][metric] for r in rows)
                       for metric in ['mrr_at_8', 'hit_at_3', 'recall_at_8']} for name in names}
    hits = {name: sum(r['metrics'][name]['hit_at_3'] for r in rows) for name in names}
    paired = {name: {'mean_mrr_delta': aggregate['glm_linked']['mrr_at_8']-aggregate[name]['mrr_at_8'],
                     'project_signflip_p': signflip([r['metrics']['glm_linked']['mrr_at_8']-r['metrics'][name]['mrr_at_8'] for r in rows])}
              for name in names if name != 'glm_linked'}
    costs = {arm: {k: sum(r[k] or 0 for r in result['rows'] if r['arm'] == arm)
                   for k in ['prompt_tokens', 'completion_tokens', 'latency_ms', 'ssh_elapsed_ms']} for arm in ['plain', 'linked']}
    gate = {'all32_valid': result['valid'] == 32, 'complete16_native_mapping': not mapping_failures,
            'mrr_advantage_ge_010': paired['glm_plain']['mean_mrr_delta'] >= .10,
            'hit3_net_advantage_ge_3': hits['glm_linked']-hits['glm_plain'] >= 3,
            'same_observations_audit': read(root/'AUDIT.json')['status'] == 'all16-source-observation-audit-passed'}
    score = {'status': 'terminal-exposed-matched-native-score', 'cases': 16, 'aggregate': aggregate, 'hit3_counts': hits,
             'paired': paired, 'gate': gate, 'gate_pass': all(gate.values()), 'mapping_failures': mapping_failures,
             'label_sha256': label_pins, 'costs': costs, 'unknown_generation_usage_rows': result['unknown_usage_rows'],
             'shared_cold_operation_time_ms': 1125665, 'tokenizer': read(root/'tokenize-run/RESULT.json'),
             'prediction_seal_sha256': sha((run/'PREDICTION-SEAL.json').read_bytes()), 'per_case': rows,
             'claim_ceiling': 'Exposed mechanism development only. Source baselines lack matched runtime input; no fresh confirmation, wall-clock efficiency or superiority claim.',
             'authority_effect': 'none', 'open_questions_owner': 'G01-RUNTIME-LINKED-READER-R1.json'}
    save(root/'SCORE.json', score)
    print(json.dumps({k: score[k] for k in ['cases', 'aggregate', 'hit3_counts', 'gate', 'gate_pass', 'mapping_failures', 'costs']}))


if __name__ == '__main__':
    main(Path(sys.argv[1]))
