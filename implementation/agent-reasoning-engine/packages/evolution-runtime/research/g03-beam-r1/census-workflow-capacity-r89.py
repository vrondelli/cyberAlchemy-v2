"""Question-blind canonical workflow capacity census.
Open Questions: evidence/G03-FULL-WORKFLOW-CAPACITY-R89.json.
"""
import gzip
import hashlib
import json
from pathlib import Path

PACK = Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
MANIFEST_PIN = '454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def census():
    manifest_bytes = (PACK / 'MANIFEST.json').read_bytes()
    if sha(manifest_bytes) != MANIFEST_PIN:
        raise ValueError('capacity.manifest-drift')
    manifest = json.loads(manifest_bytes)
    rows = []
    states = empty = actions = total = first_two = large = 0
    for entry in manifest['entries']:
        compressed = (PACK / 'trajectories' / (entry['id'] + '.json.gz')).read_bytes()
        plain = gzip.decompress(compressed)
        if sha(compressed) != entry['compressed_sha256'] or sha(plain) != entry['plain_sha256']:
            raise ValueError('capacity.source-drift')
        trajectory = json.loads(plain)
        if set(trajectory) - {'id', 'domain', 'environment', 'goal', 'states'} or trajectory['id'] != entry['id']:
            raise ValueError('capacity.source-schema')
        trees = [str(state.get('accessibility_tree') or '') for state in trajectory['states']]
        sizes = [len(tree.encode()) for tree in trees]
        states += len(sizes)
        empty += sum(not tree for tree in trees)
        actions += sum(bool(state.get('action')) for state in trajectory['states'])
        total += sum(sizes)
        first_two += sum(sizes[:2])
        large += sum(size > 32000 for size in sizes)
        rows.append({'id': trajectory['id'], 'states': len(sizes), 'source_utf8_bytes': sum(sizes), 'largest_state_bytes': max(sizes, default=0), 'plain_sha256': entry['plain_sha256']})
    if len(rows) != 200 or len({row['id'] for row in rows}) != 200:
        raise ValueError('capacity.all200')
    return {'status': 'canonical-question-blind-capacity-census', 'manifest_sha256': MANIFEST_PIN,
            'runner_sha256': sha(Path(__file__).read_bytes()), 'trajectories': len(rows), 'states': states,
            'empty_trees': empty, 'states_with_actions': actions, 'total_tree_utf8_bytes': total,
            'first_two_state_utf8_bytes': first_two, 'first_two_state_byte_fraction': first_two / total,
            'states_exceeding_32000_byte_budget': large,
            'whole_workflows_within_32000_bytes': sum(row['source_utf8_bytes'] <= 32000 for row in rows),
            'whole_workflows_within_128000_bytes': sum(row['source_utf8_bytes'] <= 128000 for row in rows),
            'source_identity_checks_passed': True, 'question_or_reference_reads': 0, 'provider_calls': 0,
            'budget_units': 'UTF-8 bytes, not model tokens, characters or semantic coverage', 'rows': rows,
            'claim_ceiling': 'Capacity only; no source-witness or answer-quality improvement',
            'open_questions_owner': 'G03-FULL-WORKFLOW-CAPACITY-R89.json'}

if __name__ == '__main__':
    print(json.dumps(census()))
