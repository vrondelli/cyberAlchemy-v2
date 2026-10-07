"""Equal-budget whole-history slice screen; no model/evaluator reads.
Open Questions: evidence/G03-CONTEXTUAL-STATE-SLICES-R90.json.
"""
from collections import Counter
import gzip
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import time

HERE = Path(__file__).parent
PACK = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
QUESTIONS = Path('/home/vlad_/are-benchmark-archive/g03-index-retrieval-screen-r88b-20261006/QUESTIONS-TEXT-ONLY.json')
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-contextual-state-slices-r90-20261007')
PROTOCOL = HERE / '../../evidence/G03-CONTEXTUAL-STATE-SLICES-R90.json'
STOP = set('the and for with from this that what which when where after before using into have does our are you your page site system work working would could should answer question correct select one final boxed please portal website custom'.split())

def sha(data):
    return hashlib.sha256(data).hexdigest()

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def terms(text):
    return Counter(t for t in re.findall(r'[a-z0-9]{3,}', text.casefold()) if t not in STOP)

def slices(tree, cap=6000):
    lines = tree.splitlines()
    start = 0
    while start < len(lines):
        end = start
        size = 0
        while end < len(lines):
            addition = len(lines[end].encode()) + (1 if end > start else 0)
            if end > start and size + addition > cap:
                break
            size += addition
            end += 1
            if size > cap:
                break  # Keep an oversized whole line explicitly, never truncate it.
        text = '\n'.join(lines[start:end])
        yield {'start_line': start, 'end_line': end - 1, 'text': text,
               'source_sha256': sha(text.encode()), 'complete_state_scope': start == 0 and end == len(lines),
               'oversized_source_line': size > cap}
        start = end

def statistics(bags):
    lengths = [sum(b.values()) for b in bags]
    average = sum(lengths) / max(1, len(bags))
    df = Counter(t for bag in bags for t in bag)
    return lengths, average, df

def bm25(query, bags, stats=None):
    lengths, average, df = stats or statistics(bags)
    result = []
    for bag, length in zip(bags, lengths):
        score = 0.0
        for term in terms(query):
            frequency = bag[term]
            if frequency:
                score += math.log(1 + (len(bags) - df[term] + .5) / (df[term] + .5)) * frequency * 2.2 / (frequency + 1.2 * (.25 + .75 * length / max(average, 1)))
        result.append(score)
    return result

def select(rows, scores, budget=32000, sizes=None):
    chosen, seen = [], set()
    sizes = sizes or [len(json.dumps(row, ensure_ascii=False, separators=(',', ':')).encode()) for row in rows]
    used = 2
    # Budget counts the entire serialized reader evidence, not only raw text.
    for i in sorted(range(len(rows)), key=lambda i: (-scores[i], rows[i]['slice_id'])):
        if scores[i] <= 0:
            break
        row = rows[i]
        key = (row['source_sha256'], row['context'])
        if key in seen:
            continue
        addition = sizes[i] + (1 if chosen else 0)
        if used + addition <= budget:
            chosen.append(row)
            seen.add(key)
            used += addition
    return chosen

def source_ref_reached(ref, selected, trajectories, groups):
    tid = ref['trajectory_id']
    trajectory = trajectories[tid]
    states = {s['state_index']: s for s in trajectory['states']}
    state_index = ref.get('state_index', ref.get('to_state'))
    if state_index is None:
        label = ref['observed_action_label']
        return any(r['trajectory_id'] == tid and label in r['text'] and 'click(' in str(states[r['state_index']].get('action') or '') for r in selected)
    tree = str(states[state_index].get('accessibility_tree') or '')
    if 'line_range' in ref:
        lo, hi = ref['line_range']
    elif 'post_group_sha256' in ref:
        matches = [g for g in groups.group_rows(tree) if sha(g['text'].encode()) == ref['post_group_sha256']]
        if len(matches) != 1:
            raise ValueError('slice-witness.unique-group')
        lo, hi = matches[0]['start_line'], matches[0]['end_line']
    else:
        lo, hi = 0, len(tree.splitlines()) - 1
    covered = set()
    for row in selected:
        if row['trajectory_id'] == tid and row['state_index'] == state_index:
            covered.update(range(row['start_line'], row['end_line'] + 1))
    return set(range(lo, hi + 1)) <= covered

def main():
    started = time.monotonic()
    if ROOT.exists():
        raise ValueError('slice-screen.no-overwrite')
    pins = {PACK / 'MANIFEST.json': '454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc',
            QUESTIONS: '7d580e2eed89c56f487f4f2f26832576f542c5289aff1f8859ba9dfc704512e8',
            PACK / 'TYPED-SOURCE-FACTS-R80.json': '97217d5d5a03084ad1323b7294c168ac08db1ba61159273ac4df57be86f7bf15'}
    for path, pin in pins.items():
        if sha(path.read_bytes()) != pin:
            raise ValueError('slice-screen.input-drift')
    writer_path = HERE / '../arb-trace2code-r1/audit-jacoco-project-capacity-r6.py'
    writer = load_module('r90_atomic', writer_path)
    ROOT.mkdir(mode=0o700)
    def save(name, value):
        data = (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()
        writer.save_exclusive(ROOT / name, data)
        return sha(data)
    freeze_sha = save('FREEZE.json', {'inputs': {str(p): h for p, h in pins.items()},
        'source_sha256': sha(Path(__file__).read_bytes()), 'writer_sha256': sha(writer_path.read_bytes()),
        'protocol_sha256': sha(PROTOCOL.read_bytes()), 'helper_sha256': {n: sha((HERE / n).read_bytes()) for n in ['screen-index-retrieval-r88b.py', 'screen-lme-v2-ui-groups-r61.py']},
        'budget_utf8_bytes_per_arm': 32000, 'known_source_witness_gate': 7, 'minimum_gain_over_raw': 2,
        'provider_calls': 0, 'authority_effect': 'none'})
    trajectories, rows, states_count = {}, [], 0
    for entry in json.loads((PACK / 'MANIFEST.json').read_bytes())['entries']:
        compressed = (PACK / 'trajectories' / (entry['id'] + '.json.gz')).read_bytes()
        plain = gzip.decompress(compressed)
        if sha(compressed) != entry['compressed_sha256'] or sha(plain) != entry['plain_sha256']:
            raise ValueError('slice-screen.canonical-source-drift')
        trajectory = json.loads(plain)
        if set(trajectory) - {'id', 'domain', 'environment', 'goal', 'states'}:
            raise ValueError('slice-screen.closed-source')
        trajectories[trajectory['id']] = trajectory
        for i, state in enumerate(trajectory['states']):
            states_count += 1
            tree = str(state.get('accessibility_tree') or '')
            titles = re.findall(r"RootWebArea '([^']+)'", tree)
            context = json.dumps({'goal': str(trajectory.get('goal') or ''), 'page_titles': titles,
                'observed_preceding_action': str(trajectory['states'][i-1].get('action') or '') if i else None,
                'observed_current_action': str(state.get('action') or '')}, ensure_ascii=False)
            for fragment in slices(tree):
                rows.append({**fragment, 'slice_id': f"{trajectory['id']}:{state['state_index']}:{fragment['start_line']}",
                    'trajectory_id': trajectory['id'], 'state_index': state['state_index'],
                    'state_tree_sha256': sha(tree.encode()), 'context': context,
                    'preceding_state_index': trajectory['states'][i-1]['state_index'] if i else None,
                    'scope_caveat': 'Observed partial source; not absence, procedural success or action causality; images unavailable.'})
    if len(trajectories) != 200 or states_count != 5095:
        raise ValueError('slice-screen.full-source-accounting')
    save('INDEX-CENSUS.json', {'trajectories': 200, 'states': states_count, 'slices': len(rows),
        'oversized_source_line_slices': sum(r['oversized_source_line'] for r in rows),
        'index_sha256': sha(json.dumps(rows, ensure_ascii=False, separators=(',', ':')).encode()), 'query_or_reference_used_to_build': False})
    raw = [terms(r['text']) for r in rows]
    contextual = [bag + terms(r['context']) for bag, r in zip(raw, rows)]
    stats = {'raw': statistics(raw), 'contextual': statistics(contextual)}
    sizes = [len(json.dumps(row, ensure_ascii=False, separators=(',', ':')).encode()) for row in rows]
    questions = json.loads(QUESTIONS.read_bytes())
    if len(questions) != 26 or any(set(q) != {'id', 'question'} for q in questions):
        raise ValueError('slice-screen.closed-all26')
    helper = load_module('r90_r88b', HERE / 'screen-index-retrieval-r88b.py')
    selected = [{'question_id': q['id'], 'question_sha256': sha(q['question'].encode()),
        'arms': {arm: select(rows, bm25(helper.query_text(q['question']), bags, stats[arm]), sizes=sizes) for arm, bags in [('raw', raw), ('contextual', contextual)]}} for q in questions]
    selection_sha = save('PRE-AUDIT-SELECTION.json', selected)
    # Previously exposed source witnesses only, read after all selections seal.
    facts = {r['question_id']: r for r in json.loads((PACK / 'TYPED-SOURCE-FACTS-R80.json').read_bytes())['rows']}
    groups = load_module('r90_groups', HERE / 'screen-lme-v2-ui-groups-r61.py')
    counts, outcomes = Counter(), []
    for row in selected:
        fact = facts[row['question_id']]
        known = fact['status'] in {'directly_supported', 'contradicts_premise'}
        hits = {}
        for ref in fact['source_refs'] if known else []:
            helper.verify_witness(ref, trajectories, groups)
        for arm, evidence in row['arms'].items():
            reached = {r['trajectory_id'] for r in fact['source_refs'] if source_ref_reached(r, evidence, trajectories, groups)} if known else set()
            minimum = 2 if fact['operator'] in {'ordered_between', 'ordered_successor'} else 1
            hits[arm] = len(reached) >= minimum if known else None
            counts[arm] += hits[arm] is True
        outcomes.append({'question_id': row['question_id'], 'known_source_witness': known, 'reach': hits})
    passed = counts['contextual'] == 7 and counts['contextual'] - counts['raw'] >= 2
    out = {'status': 'bounded-source-witness-qualified' if passed else 'bounded-source-witness-rejected',
        'questions': 26, 'trajectories': 200, 'states': states_count, 'slices': len(rows), 'rows': outcomes,
        'raw_known_witness_reach': counts['raw'], 'contextual_known_witness_reach': counts['contextual'],
        'unresolved_questions': 19, 'freeze_sha256': freeze_sha, 'selection_sha256': selection_sha,
        'elapsed_ms': round((time.monotonic() - started) * 1000), 'new_provider_calls': 0,
        'reference_reads': 0, 'confirmation_reads': 0, 'authority_effect': 'none',
        'claim_ceiling': 'Exposed source-slice witness screen, not QA accuracy, token qualification or superiority;19 unresolved.',
        'open_questions_owner': 'G03-CONTEXTUAL-STATE-SLICES-R90.json'}
    result_sha = save('RESULT.json', out)
    print(json.dumps({k: v for k, v in out.items() if k != 'rows'} | {'result_sha256': result_sha}))

if __name__ == '__main__':
    main()
