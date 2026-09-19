"""Inspect returned-read repetition and prompt ledger omissions, without gold data.

Open questions: LEDGER-VISIBILITY-AUDIT-R1.md.
"""
import collections
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STAGE = ROOT / 'schema-agreement-production-live-r1'
PREFIX = 'Evidence coverage ledger (not relevance or gold coverage): '


def analyze_events(events):
    returned = collections.defaultdict(set)
    last_path = None
    successes = repeats = total_lines = repeated_lines = 0
    requests = omissions = 0
    shown_paths = collections.Counter()
    read_paths = collections.Counter()
    for event in events:
        if event['kind'] == 'request-capture':
            prompt = json.loads(event['capture']['prompt'])
            ledgers = [json.loads(m['content'][len(PREFIX):])
                       for m in prompt['messages']
                       if m.get('role') == 'system' and
                       isinstance(m.get('content'), str) and
                       m['content'].startswith(PREFIX)]
            assert len(ledgers) <= 1
            if ledgers:
                paths = {entry['path'] for entry in ledgers[0]['entries']}
                shown_paths.update(paths)
                if last_path is not None:
                    requests += 1
                    omissions += last_path not in paths
        if event['kind'] != 'source-tool-result':
            continue
        function = event['call']['function']
        result = event['output']
        if function['name'] != 'read_file' or result.get('ok') is not True:
            continue
        observation = result['output']
        identity = (observation['path'], observation['source_sha256'],
                    observation.get('source_revision'), observation.get('base_commit'))
        start, end = observation['start_line'], observation['end_line']
        assert isinstance(start, int) and isinstance(end, int) and 1 <= start <= end
        lines = set(range(start, end + 1))
        overlap = lines & returned[identity]
        successes += 1
        repeats += lines <= returned[identity]
        total_lines += len(lines)
        repeated_lines += len(overlap)
        returned[identity].update(lines)
        last_path = observation['path']
        read_paths[last_path] += 1
    return {
        'successful_direct_read_calls': successes,
        'fully_repeated_direct_read_calls': repeats,
        'returned_direct_read_lines': total_lines,
        'previously_returned_direct_read_lines': repeated_lines,
        'ledger_requests_after_successful_direct_read': requests,
        'latest_returned_path_absent_from_ledger_requests': omissions,
        'ledger_shown_path_counts': dict(sorted(shown_paths.items())),
        'successful_direct_read_path_counts': dict(sorted(read_paths.items())),
    }


def main():
    rows, bindings = [], []
    for i in range(4):
        path = STAGE / f'runs_root/{i:02}/events.jsonl'
        data = path.read_bytes()
        bindings.append({'path': str(path.relative_to(ROOT)),
                         'sha256': hashlib.sha256(data).hexdigest()})
        events = [json.loads(line) for line in data.splitlines()]
        rows.append({'slot': i, **analyze_events(events)})
    ledger_path = ROOT / 'ranked-read-ledger-r1.mjs'
    bindings.append({'path': ledger_path.name,
                     'sha256': hashlib.sha256(ledger_path.read_bytes()).hexdigest()})
    return {
        'schema': 'are.ledger-visibility-audit/v1', 'rows': rows,
        'new_provider_calls': 0, 'source_bindings': bindings,
        'limitations': [
            'Returned read is not proof of model delivery; repetition here measures tool output only.',
            'Ledger omission is measured from actual captured prompts, not reconstructed ranking.',
            'Other prompt messages may contain an omitted path and its evidence.',
            'Repeated reads may be intentional; correlation does not prove the ledger caused them.',
            'Counts cover direct read_file calls only, excluding search observations and recovery.',
            'Path omission ignores revision identity; version-specific omission may be higher.',
        ],
        'open_questions_ref': 'LEDGER-VISIBILITY-AUDIT-R1.md',
    }


if __name__ == '__main__':
    print(json.dumps(main(), indent=2, sort_keys=True))
