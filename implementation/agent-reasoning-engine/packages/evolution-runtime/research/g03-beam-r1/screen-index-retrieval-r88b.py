"""Question-text-only retrieval, then source-witness audit. Open Questions: G03-INDEX-RETRIEVAL-R88B.json."""
from collections import Counter
import gzip
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re

HERE = Path(__file__).parent
PACK = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
INDEX = Path('/home/vlad_/are-benchmark-archive/g03-source-line-insertion-index-r87b-20261006/provider-run')
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-index-retrieval-screen-r88b-20261006')
WIRE = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005/RESERVE-DEV-WIRES-R35.json')
PROTOCOL = HERE / '../../evidence/G03-INDEX-RETRIEVAL-R88B.json'
PINS = {
    WIRE: '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9',
    PACK / 'MANIFEST.json': '454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc',
    INDEX / 'INDEX.json': '23597e504b442f286c61bc70f5d3a734c1427b976c0a168c5eac39fa06c09ccb',
    INDEX / 'AUDIT.json': 'fe344af392e9cb36e018fa197e07c337e98382b75f3f87050f3e4208e5183118',
    PACK / 'TYPED-SOURCE-FACTS-R80.json': '97217d5d5a03084ad1323b7294c168ac08db1ba61159273ac4df57be86f7bf15',
}
STOP = set('the and for with from this that what which when where after before using into have does our are you your page site system work working would could should answer question correct select one final boxed please portal website custom'.split())


def sha(b):
    return hashlib.sha256(b).hexdigest()


def terms(text):
    return [t for t in re.findall(r'[a-z0-9]{3,}', text.casefold()) if t not in STOP]


def query_text(text):
    # Remove MCQ alternatives and response-format directions, not task intent.
    text = text.partition('\nA.')[0]
    return re.split(r'\b(?:Select ONE|Put your final answer|Mark your final answer|Your final answer)\b', text, maxsplit=1, flags=re.I)[0]


def ranking(query, documents):
    tf = {key: Counter(terms(text)) for key, text in documents.items()}
    lengths = {key: sum(counts.values()) for key, counts in tf.items()}
    avg = sum(lengths.values()) / max(1, len(lengths))
    df = Counter(t for counts in tf.values() for t in counts)
    scores = {}
    for key, counts in tf.items():
        value = 0.0
        for t in set(terms(query)):
            freq = counts[t]
            if freq:
                idf = math.log(1 + (len(tf) - df[t] + .5) / (df[t] + .5))
                value += idf * freq * 2.2 / (freq + 1.2 * (.25 + .75 * lengths[key] / max(avg, 1)))
        scores[key] = value
    return sorted(scores, key=lambda key: (-scores[key], key)), scores


def retrieve(query, raw, notes):
    control, raw_scores = ranking(query, raw)
    note_rank, note_scores = ranking(query, notes)
    positive_notes = {key: i + 1 for i, key in enumerate(note_rank) if note_scores[key] > 0}
    raw_rank = {key: i + 1 for i, key in enumerate(control)}
    fused = {key: (1 / (60 + raw_rank[key]) if raw_scores[key] > 0 else 0)
             + (1 / (60 + positive_notes[key]) if key in positive_notes else 0) for key in raw}
    treatment = sorted(raw, key=lambda key: (-fused[key], key))
    return {'plain_metadata': control[:8], 'optional_note_rrf': treatment[:8]}


def write(name, value):
    data = (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()
    with (ROOT / name).open('xb') as f:
        f.write(data)
    return sha(data)


def verify_witness(ref, trajectories, groups):
    t = trajectories[ref['trajectory_id']]
    states = {s['state_index']: s for s in t['states']}
    if 'state_index' in ref:
        tree = str(states[ref['state_index']].get('accessibility_tree') or '')
        lo, hi = ref['line_range']
        block = '\n'.join(tree.splitlines()[lo:hi + 1])
        if sha(block.encode()) != ref['source_sha256']:
            raise ValueError('witness-line-source-drift')
    elif 'to_state' in ref:
        if ref['from_state'] not in states or ref['from_state'] >= ref['to_state']:
            raise ValueError('witness-transition-order')
        tree = str(states[ref['to_state']].get('accessibility_tree') or '')
        if 'destination_tree_sha256' in ref:
            if sha(tree.encode()) != ref['destination_tree_sha256']:
                raise ValueError('witness-destination-source-drift')
        elif ref['post_group_sha256'] not in {sha(g['text'].encode()) for g in groups.group_rows(tree)}:
            raise ValueError('witness-group-source-drift')
    else:
        label = ref['observed_action_label']
        if not any(label in str(s.get('accessibility_tree') or '') and 'click(' in str(s.get('action') or '') for s in t['states']):
            raise ValueError('witness-action-absent')


def main():
    if ROOT.exists():
        raise ValueError('no-overwrite')
    for path, pin in PINS.items():
        if sha(path.read_bytes()) != pin:
            raise ValueError('input-drift:' + path.name)
    protocol = json.loads(PROTOCOL.read_bytes())
    ROOT.mkdir(mode=0o700)
    write('FREEZE.json', {'inputs': {str(p): v for p, v in PINS.items()}, 'protocol_sha256': sha(PROTOCOL.read_bytes()), 'runner_sha256': sha(Path(__file__).read_bytes()), 'group_module_sha256': sha((HERE / 'screen-lme-v2-ui-groups-r61.py').read_bytes()), 'gate': protocol['gate'], 'provider_calls': 0, 'authority_effect': 'none'})
    # Closed selector projection; no type/image/old arm/outcome is forwarded.
    questions = [{'id': r['id'], 'question': r['question']} for r in json.loads(WIRE.read_bytes())['rows']]
    if len(questions) != 26 or len({q['id'] for q in questions}) != 26:
        raise ValueError('all26')
    write('QUESTIONS-TEXT-ONLY.json', questions)
    trajectories, raw = {}, {}
    manifest = json.loads((PACK / 'MANIFEST.json').read_bytes())
    for e in manifest['entries']:
        compressed = (PACK / 'trajectories' / (e['id'] + '.json.gz')).read_bytes()
        plain = gzip.decompress(compressed)
        if sha(compressed) != e['compressed_sha256'] or sha(plain) != e['plain_sha256']:
            raise ValueError('canonical-source-drift')
        t = json.loads(plain)
        if set(t) - {'id', 'domain', 'environment', 'goal', 'states'}:
            raise ValueError('closed-source-schema')
        trajectories[t['id']] = t
        # Whole-workflow raw metadata, not the optional note's first transition.
        pages = list(dict.fromkeys(title for s in t['states'] for title in re.findall(r"RootWebArea '([^']+)'", str(s.get('accessibility_tree') or ''), re.I)))
        raw[t['id']] = str(t.get('goal') or '') + '\n' + '\n'.join(pages) + '\n' + '\n'.join(str(s.get('action') or '') for s in t['states'])
    index = json.loads((INDEX / 'INDEX.json').read_bytes())
    if len(raw) != 200 or {e['trajectory_id'] for e in index['entries']} != set(raw):
        raise ValueError('all200-index')
    notes = {e['trajectory_id']: e['note']['title'] + '\n' + e['note']['summary'] for e in index['entries'] if e['status'] in {'valid-optional-note', 'valid-cached-optional-note'}}
    if len(notes) != 127:
        raise ValueError('all127-notes')
    rows = [{'question_id': q['id'], 'question_sha256': sha(q['question'].encode()), 'arms': retrieve(query_text(q['question']), raw, notes)} for q in questions]
    selection_sha = write('PRE-AUDIT-SELECTION.json', {'rows': rows, 'all26': True, 'all200_candidates': True, 'source_capacity_absences': 73, 'all200_source_hashes_verified': True, 'reference_answer_reads': 0, 'authority_effect': 'none'})
    # Witness audit occurs only after all selections are sealed. R80 facts are
    # previously exposed source evidence, not reference answers or QA labels.
    baseline = json.loads((PACK / 'TYPED-SOURCE-FACTS-R80.json').read_bytes())
    spec = importlib.util.spec_from_file_location('r88b_groups', HERE / 'screen-lme-v2-ui-groups-r61.py')
    groups = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(groups)
    evidence_rows = {r['question_id']: r for r in baseline['rows']}
    scored = []
    counts = Counter()
    for row in rows:
        witness = evidence_rows[row['question_id']]
        known = witness['status'] in {'directly_supported', 'contradicts_premise'}
        if known:
            for ref in witness['source_refs']:
                verify_witness(ref, trajectories, groups)
        available = {r['trajectory_id'] for r in witness['source_refs']}
        minimum = 2 if witness['operator'] in {'ordered_between', 'ordered_successor'} else 1
        outcomes = {arm: len(set(ids) & available) >= minimum if known else None for arm, ids in row['arms'].items()}
        for arm, hit in outcomes.items():
            counts[arm] += hit is True
        scored.append({'question_id': row['question_id'], 'existing_source_witness': known, 'minimum_distinct_witness_trajectories': minimum if known else None, 'reach': outcomes})
    passed = counts['optional_note_rrf'] == 7 and counts['optional_note_rrf'] - counts['plain_metadata'] >= 2
    out = {'status': 'retrieval-proxy-qualified' if passed else 'retrieval-proxy-rejected', 'rows': scored, 'questions': 26, 'existing_witnessed_questions': 7, 'unresolved_questions_not_accuracy_scored': 19, 'plain_metadata_witness_reach': counts['plain_metadata'], 'optional_note_witness_reach': counts['optional_note_rrf'], 'strong_existing_r80_witness_reach': 7, 'selection_sha256': selection_sha, 'construction_tokens_inherited': 1489200, 'new_provider_calls': 0, 'reference_answer_reads': 0, 'confirmation_reads': 0, 'authority_effect': 'none', 'claim_ceiling': 'Exposed known-source-witness retrieval proxy only. Workflow expansion is not bounded reader evidence; no accuracy, semantic qualification of19, broad QA admission or superiority.', 'open_questions_owner': 'G03-INDEX-RETRIEVAL-R88B.json'}
    pin = write('RESULT.json', out)
    print(json.dumps({k: v for k, v in out.items() if k != 'rows'} | {'result_sha256': pin}))


if __name__ == '__main__':
    main()
