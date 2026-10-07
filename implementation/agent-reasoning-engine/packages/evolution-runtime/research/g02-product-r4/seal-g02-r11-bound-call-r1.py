#!/usr/bin/env python3
"""Source-only bound-call screen. Open Questions: G02-R11-BOUND-CALL-EXPOSED-R1.md."""
import ast
import json
import re
import runpy
import subprocess
import time
from collections import defaultdict
from hashlib import sha256
from pathlib import Path

ROOT = Path('/home/vlad_/are-benchmark-archive')
OUT = ROOT/'g02-r11-bound-call-exposed-r1-20261006'
digest = lambda b: sha256(b).hexdigest()
bound_calls = runpy.run_path(str(Path(__file__).with_name('python-bound-call-r1.py')))['bound_calls']


def git(root, *args):
    return subprocess.check_output(['git', '-c', f'safe.directory={root}', '-C', str(root), *args])


def main():
    started = time.monotonic(); assert not OUT.exists()
    pb = (ROOT/'g02-r11-baseline-delta-packets-exposed-r1-20261005/PACKETS.json').read_bytes()
    ub = (ROOT/'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json').read_bytes()
    assert digest(pb) == '050acc7b183a8f6db8cdc4f7bab8561b1c381e9a3ce59c01d1928930947357a7'
    assert digest(ub) == '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
    packets, union = json.loads(pb)['ordered_packets'], json.loads(ub)['rows']
    assert len(packets) == len(union) == 12
    protocol = (Path(__file__).parents[2]/'evidence/G02-R11-BOUND-CALL-EXPOSED-R1.md').read_bytes()
    rows = []
    for ordinal, (p, u) in enumerate(zip(packets, union), 1):
        assert p['ordinal'] == u['ordinal'] == ordinal and p['instance_id'] == u['instance_id']
        raw = ROOT/f'g02-product-replication-r11-20261002/pairs/{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw'
        base = raw/'sources/session/base'
        assert git(base, 'rev-parse', 'HEAD').decode().strip() == u['base_commit']
        assert not git(base, 'diff', '--name-only', 'HEAD')
        pred_bytes = (raw/'policy-pruning/prediction.json').read_bytes()
        pred = json.loads(pred_bytes); assert pred['instance_id'] == p['instance_id']
        selected = set(pred['traj_data']['pred_files'])
        assert selected == {x['path'] for x in p['baseline_selected']}
        delivered = set(u['delivered_paths'])
        documents, hashes, exclusions = {}, {}, defaultdict(int)
        paths = [x.decode() for x in git(base, 'ls-files', '-z', '--', '*.py').split(b'\0') if x]
        for rel in sorted(paths):
            file = base/rel
            assert not Path(rel).is_absolute() and '..' not in Path(rel).parts
            if not file.is_file() or file.is_symlink() or not file.resolve().is_relative_to(base.resolve()):
                exclusions['unsafe_or_nonregular'] += 1; continue
            if file.stat().st_size > 262144:
                exclusions['large'] += 1; continue
            data = file.read_bytes(); hashes[rel] = digest(data)
            try:
                documents[rel] = ast.parse(data, filename=rel)
            except (SyntaxError, UnicodeError, ValueError):
                exclusions['parse_error'] += 1
        hits = defaultdict(list)
        for source, spans in pred['traj_data']['pred_spans'].items():
            assert source in selected
            assert all(type(s['start']) is int and type(s['end']) is int and 1 <= s['start'] <= s['end'] for s in spans)
            if source not in documents:
                continue
            for hit in bound_calls(source, documents, spans):
                if hit['path'] not in selected|delivered:
                    hits[hit['path']].append(hit)
        issue_words = set(re.findall(r'\b[A-Za-z_][A-Za-z0-9_]*\b', p['issue']))
        ranked = []
        for path, witnesses in hits.items():
            unique = {(w['source'], w['call_line'], w['qualified']): w for w in witnesses}
            witnesses = sorted(unique.values(), key=lambda w: (w['source'], w['call_line'], w['qualified']))
            rank = [int(any(w['name'] in issue_words for w in witnesses)), len({w['source'] for w in witnesses}),
                    len(witnesses), -min(w['end_line']-w['line']+1 for w in witnesses)]
            ranked.append({'path': path, 'source_sha256': hashes[path], 'rank': rank,
                           'witnesses': [{**w, 'caller_sha256': hashes[w['source']]} for w in witnesses]})
        ranked.sort(key=lambda c: (tuple(-v for v in c['rank']), c['path']))
        rows.append({'ordinal': ordinal, 'repo': p['repo'], 'instance_id': p['instance_id'], 'base_commit': u['base_commit'],
                     'prediction_sha256': digest(pred_bytes), 'issue_sha256': digest(p['issue'].encode()),
                     'selected_paths': sorted(selected), 'delivered_paths': sorted(delivered),
                     'tracked_python_files': len(paths), 'parsed_python_files': len(documents), 'exclusions': dict(exclusions),
                     'parsed_source_manifest_sha256': digest(json.dumps(hashes, sort_keys=True).encode()),
                     'parsed_source_sha256': hashes, 'candidate_count': len(ranked), 'proposals': ranked[:3]})
        print(json.dumps({'ordinal': ordinal, 'parsed': len(documents), 'candidates': len(ranked), 'proposals': len(ranked[:3])}), flush=True)
    result = {'schema': 'are.g02-bound-call-source/v1', 'posture': 'all12 exposed, source-only, no gold/model/fresh cases',
              'protocol_sha256': digest(protocol), 'packets_sha256': digest(pb), 'union_sha256': digest(ub),
              'implementation_sha256': digest(Path(__file__).read_bytes()),
              'binder_sha256': digest(Path(__file__).with_name('python-bound-call-r1.py').read_bytes()),
              'elapsed_s': time.monotonic()-started, 'rows': rows, 'open_questions_owner': 'G02-R11-BOUND-CALL-EXPOSED-R1.md'}
    OUT.mkdir(mode=0o700)
    for name, data in [('PROTOCOL.md', protocol), ('SOURCE-SEAL.json', (json.dumps(result, indent=2)+'\n').encode())]:
        with (OUT/name).open('xb') as stream:
            stream.write(data)
    print(json.dumps({'terminal': True, 'tasks': len(rows), 'proposals': sum(len(r['proposals']) for r in rows),
                      'sha256': digest((OUT/'SOURCE-SEAL.json').read_bytes())}))


if __name__ == '__main__':
    main()
