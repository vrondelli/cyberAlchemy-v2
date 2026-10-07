"""Independent matched metric/cost reconstruction after sealed predictions.
Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json.
"""
import hashlib
import itertools
import json
import os
import statistics
import uuid
from pathlib import Path
ROOT = Path('/home/vlad_/are-benchmark-archive/g01-runtime-linked-reader-r1b-20261007')
PARENT = ROOT.with_name('g01-runtime-linked-reader-r1-20261007')
ARCHIVE = ROOT.parent
sha = lambda data: hashlib.sha256(data).hexdigest()


def load(path, pin=None):
    data = path.read_bytes()
    if pin and sha(data) != pin:
        raise ValueError('audit.pin:' + str(path))
    return json.loads(data)


def main():
    score = load(ROOT/'SCORE.json', '875dc0149543f765555ab3633a02dc307dbc477c667ce3408d4ad6b7c6681c0d')
    result = load(ROOT/'generate-run/RESULT.json', 'd5a00474302f584333565e2432018ed3bb5a0e726406b4523180f87cb66a4c02')
    seal = load(ROOT/'generate-run/PREDICTION-SEAL.json', 'bf6521c815d7c3122ef37bd247520ab4d3552b65cb3d841bb074090a050d63f8')
    freeze = load(ROOT/'generate-run/FREEZE.json', result['freeze_sha256'])
    packets = [json.loads(line) for line in (ROOT/'PACKETS.jsonl').read_bytes().splitlines()]
    if len(packets) != 32 or result['completed'] != 32 or seal['gold_opened'] is not False:
        raise ValueError('audit.all32-prediction-boundary')
    original_bytes = (ARCHIVE/'defects4j-canonical-entity-reader-r1/PACKETS.jsonl').read_bytes()
    if sha(original_bytes) != '00596b63d4b00f3a2b7f1311efc0311a62c72b1634c1f8e9625d1068e35c892d':
        raise ValueError('audit.source-comparators')
    baselines = {p['case_id']: p['arm_ranked_files'] for p in map(json.loads, original_bytes.splitlines())}
    predictions = {}
    for p in packets:
        reply_path = ROOT/'generate-run'/f"REPLY-{p['ordinal']:02d}.json"
        bound_response = next(r for r in seal['responses'] if r['ordinal'] == p['ordinal'])
        reply = load(reply_path, bound_response['sha256'])
        if reply['request_sha256'] != freeze['ordered_requests'][p['ordinal']-1]['request_sha256'] or reply['public_response']['finish_reason'] != 'stop':
            raise ValueError('audit.request-response')
        value = json.loads(reply['public_response']['message']['content'])
        if set(value) != {'candidate_ids'}:
            raise ValueError('audit.response-shape')
        ids = [int(n.strip('[]')) if type(n) is str else n for n in value['candidate_ids']]
        if len(ids) != len(set(ids)) or len(ids) > 8 or any(type(n) not in [int, float] or n != int(n) or not 1 <= n <= len(p['candidates']) for n in ids):
            raise ValueError('audit.ids')
        files = [p['candidates'][int(n)-1]['path'] for n in ids]
        pred = result['predictions'][p['ordinal']-1]
        if not pred['valid'] or pred['missing'] or pred['ranked_files'] != files:
            raise ValueError('audit.predictions')
        predictions[(p['case_id'], p['arm'])] = files
    reconstructed = []
    for p in packets[::2]:
        cid = p['case_id']
        label = ARCHIVE/'defects4j-metadata-v3.0.1/framework/projects'/p['project']/'modified_classes'/f"{p['bug']}.src"
        data = label.read_bytes()
        if sha(data) != score['label_sha256'][cid]:
            raise ValueError('audit.native-label')
        production = load(ARCHIVE/'g01-jacoco-project-capacity-r6-20261007'/cid/'INSTRUMENTATION.json')['rows']
        paths = {r['path'] for r in production}
        gold = set()
        for cls in [line.strip() for line in data.decode().splitlines() if line.strip()]:
            name, matches = cls.replace('.', '/'), set()
            while not matches:
                matches = {path for path in paths if path == name+'.java' or path.endswith('/'+name+'.java')}
                if matches or '$' not in name:
                    break
                name = name.rsplit('$', 1)[0]
            if len(matches) != 1:
                raise ValueError('audit.independent-native-path-mapping')
            gold.update(matches)
        if not gold:
            raise ValueError('audit.empty-native-reference')
        arms = {**baselines[cid], 'glm_plain': predictions[(cid, 'plain')], 'glm_linked': predictions[(cid, 'linked')]}
        values = {}
        for arm, files in arms.items():
            positions = [i+1 for i, file in enumerate(files) if file in gold]
            earliest = min(positions, default=999999)
            values[arm] = {'mrr_at_8': 1/earliest if earliest <= 8 else 0,
                           'hit_at_3': int(earliest <= 3), 'recall_at_8': len(gold & set(files[:8]))/len(gold)}
        row = next(r for r in score['per_case'] if r['case_id'] == cid)
        if row['metrics'] != values or row['gold_files'] != len(gold):
            raise ValueError('audit.per-case-metrics')
        reconstructed.append(values)
    if len(reconstructed) != 16:
        raise ValueError('audit.full16')
    for arm, recorded in score['aggregate'].items():
        for metric, expected in recorded.items():
            actual = statistics.mean(r[arm][metric] for r in reconstructed)
            if abs(expected-actual) > 1e-12:
                raise ValueError('audit.aggregate')
        if score['hit3_counts'][arm] != sum(r[arm]['hit_at_3'] for r in reconstructed):
            raise ValueError('audit.hit-counts')
    differences = [r['glm_linked']['mrr_at_8']-r['glm_plain']['mrr_at_8'] for r in reconstructed]
    nonzero = [d for d in differences if abs(d) > 1e-12]
    p = (sum(abs(sum(sign*d for sign, d in zip(signs, nonzero))) >= abs(sum(nonzero))-1e-12
             for signs in itertools.product((-1, 1), repeat=len(nonzero))) / 2**len(nonzero)) if nonzero else 1
    if abs(score['paired']['glm_plain']['mean_mrr_delta']-statistics.mean(differences)) > 1e-12 or score['paired']['glm_plain']['project_signflip_p'] != p:
        raise ValueError('audit.paired-significance')
    for arm, cost in score['costs'].items():
        for key, expected in cost.items():
            actual = sum(load(ROOT/'generate-run'/f"REPLY-{r['ordinal']:02d}.json")[key] for r in result['rows'] if r['arm'] == arm)
            if actual != expected:
                raise ValueError('audit.arm-cost')
    old_tokens = load(PARENT/'tokenize-run/RESULT.json', 'cbce51f9944fc0ba6e611355bf4c5316efa214326ae6b3131828686f7a469028')
    tokens = load(ROOT/'tokenize-run/RESULT.json', '8d2f4ab616ef9b45de42508e166698ae36fcf94a1b951d4340fba96ebd71913d')
    out = {'status': 'all16-native-metrics-and-lineage-cost-audit-passed', 'cases': 16, 'valid_predictions': 32,
           'score_sha256': sha((ROOT/'SCORE.json').read_bytes()), 'implementation_sha256': sha(Path(__file__).read_bytes()),
           'matched_mrr_delta': statistics.mean(differences), 'matched_project_signflip_p': p,
           'known_generation_tokens': result['known_prompt_tokens']+result['known_completion_tokens'],
           'measured_tokenizer_prompt_tokens_including_failed_parent': old_tokens['known_prompt_tokens']+tokens['known_prompt_tokens'],
           'provider_calls_including_failed_parent': old_tokens['provider_calls']+tokens['provider_calls']+result['provider_calls'],
           'provider_latency_ms_including_failed_parent': old_tokens['latency_ms']+tokens['latency_ms']+result['latency_ms'],
           'imported_cold_operation_time_ms': 1125665, 'unknown_generation_usage': result['unknown_usage_rows'],
           'scope': 'Independent public prediction/native filename mapping, all per-case and aggregate source/matched metrics, matched project signflip and provider-cost reconstruction. Original source binding/production declarations inherited, not independently reexecuted. Tokenizer measurements are not asserted billed generation tokens; summed durations are not wall-clock efficiency.',
           'gate_remains_failed': score['gate_pass'] is False, 'authority_effect': 'none', 'open_questions_owner': 'G01-RUNTIME-LINKED-READER-R1.json'}
    path = ROOT/'SCORE-AUDIT.json'
    temporary = path.with_name(path.name+'.tmp-'+uuid.uuid4().hex)
    try:
        with os.fdopen(os.open(temporary, os.O_WRONLY|os.O_CREAT|os.O_EXCL, 0o600), 'wb') as stream:
            stream.write((json.dumps(out, indent=2)+'\n').encode())
            stream.flush()
            os.fsync(stream.fileno())
        os.link(temporary, path)
        descriptor = os.open(ROOT, os.O_DIRECTORY|os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
    finally:
        temporary.unlink()
    print(json.dumps(out))


if __name__ == '__main__':
    main()
