#!/usr/bin/env python3
"""Exposed-only source fidelity; no remapping. Open Questions: G02-R11-SOURCE-FIDELITY-R1.md."""
import json
import subprocess
from collections import Counter
from hashlib import sha256
from pathlib import Path
import pyarrow.parquet as parquet

ROOT = Path('/home/vlad_/are-benchmark-archive')
OUT = ROOT/'g02-r11-source-fidelity-exposed-r1-20261006'
digest = lambda b: sha256(b).hexdigest()


def normalize(path):
    if not isinstance(path, str) or not path:
        raise ValueError('invalid-path')
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        path = path[len('/workspace/'):].split('/', 1)[-1]
    path = path.lstrip('/').removeprefix('./')
    if not path or '..' in Path(path).parts:
        raise ValueError('unsafe-path')
    return path


def canonical_content(text):
    return '\n'.join(text.splitlines()).strip()


def inspect_span(text, annotation):
    start, end = annotation['start_line'], annotation['end_line']
    valid_type = type(start) is int and type(end) is int and 1 <= start <= end
    lines = text.splitlines()
    in_bounds = valid_type and end <= len(lines)
    content = annotation.get('content')
    available = isinstance(content, str) and bool(content.strip())
    expected = canonical_content(content) if available else None
    actual = canonical_content('\n'.join(lines[start-1:end])) if in_bounds else None
    exact = expected == actual if available and in_bounds else None
    trailing_equal = (canonical_content('\n'.join(l.rstrip() for l in expected.splitlines())) ==
                      canonical_content('\n'.join(l.rstrip() for l in actual.splitlines()))) if available and in_bounds else None
    elsewhere = bool(expected and expected in canonical_content(text)) if available and exact is not True else False
    return {'start_line': start, 'end_line': end, 'source_lines': len(lines), 'bounds_valid': bool(in_bounds),
            'annotation_content_available': available, 'content_sha256': digest(content.encode()) if isinstance(content, str) else None,
            'interval_content_equal': exact, 'trailing_whitespace_equal': trailing_equal,
            'content_occurs_elsewhere': elsewhere}


def git(base, *args):
    return subprocess.check_output(['git', '-c', f'safe.directory={base}', '-C', str(base), *args])


def main():
    assert not OUT.exists()
    source_bytes = (ROOT/'g02-r11-bound-call-exposed-r1-20261006/SOURCE-SEAL.json').read_bytes()
    assert digest(source_bytes) == 'dfa1228a87ad1415b6f2af3a03ece5ed690d24914fdf6e3e99e2322685c98c9f'
    source = json.loads(source_bytes)['rows']; ids = [r['instance_id'] for r in source]
    assert len(source) == len(set(ids)) == 12
    dataset = ROOT/'g01-r8-eight-task-evaluator-r1/full.parquet'
    with dataset.open('rb') as stream:
        hasher = sha256()
        for b in iter(lambda: stream.read(1024*1024), b''):
            hasher.update(b)
    assert hasher.hexdigest() == '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
    refs = parquet.read_table(dataset, columns=['instance_id', 'base_commit', 'gold_context'],
                             filters=[('instance_id', 'in', ids)]).to_pylist()
    by_id = {r['instance_id']: r for r in refs}; assert len(refs) == len(by_id) == 12
    rows, counts = [], Counter()
    for ordinal, s in enumerate(source, 1):
        assert s['ordinal'] == ordinal
        ref = by_id[s['instance_id']]
        base = ROOT/f'g02-product-replication-r11-20261002/pairs/{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw/sources/session/base'
        head = git(base, 'rev-parse', 'HEAD').decode().strip()
        assert head == ref['base_commit'] == s['base_commit'] and not git(base, 'diff', '--name-only', 'HEAD')
        tracked = {p.decode() for p in git(base, 'ls-files', '-z').split(b'\0') if p}
        annotations = json.loads(ref['gold_context']); grouped = {}
        for a in annotations:
            path = normalize(a['file']); grouped.setdefault(path, []).append(a)
        files = []
        for path, spans in sorted(grouped.items()):
            file = base/path
            available = path in tracked and file.is_file() and not file.is_symlink() and file.resolve().is_relative_to(base.resolve())
            counts['file_occurrences'] += 1
            record = {'path': path, 'tracked_regular_present': available, 'annotations': []}
            if available:
                raw = file.read_bytes(); blob = git(base, 'show', f'HEAD:{path}')
                assert raw == blob
                counts['present_files'] += 1
                record.update({'source_sha256': digest(raw), 'head_blob_bytes_equal': True})
                for a in spans:
                    check = inspect_span(raw.decode('utf8', errors='replace'), a)
                    record['annotations'].append(check); counts['span_occurrences'] += 1
                    counts['in_bounds_spans'] += int(check['bounds_valid'])
                    counts['content_equal_spans'] += int(check['interval_content_equal'] is True)
                    counts['trailing_whitespace_equal_spans'] += int(check['trailing_whitespace_equal'] is True)
                    counts['content_disagreement_spans'] += int(check['interval_content_equal'] is False)
                    counts['content_elsewhere_spans'] += int(check['content_occurs_elsewhere'])
                    counts['unknown_content_spans'] += int(not check['annotation_content_available'])
            else:
                counts['absent_files'] += 1
                for a in spans:
                    record['annotations'].append({'start_line': a['start_line'], 'end_line': a['end_line'],
                                                   'content_sha256': digest(a['content'].encode()) if isinstance(a.get('content'), str) else None,
                                                   'bounds_valid': None, 'interval_content_equal': None})
                    counts['span_occurrences'] += 1; counts['absent_file_spans'] += 1
            files.append(record)
        rows.append({'ordinal': ordinal, 'repo': s['repo'], 'instance_id': s['instance_id'], 'base_commit': head,
                     'base_tree': git(base, 'rev-parse', 'HEAD^{tree}').decode().strip(),
                     'gold_context_sha256': digest(ref['gold_context'].encode()), 'files': files})
    assert counts['file_occurrences'] == 39
    protocol = (Path(__file__).parents[2]/'evidence/G02-R11-SOURCE-FIDELITY-R1.md').read_bytes()
    report = {'schema': 'are.g02-exposed-source-fidelity/v1', 'posture': 'diagnostic only, no gold/source/prediction/score rewrite',
              'tasks': 12, 'totals': dict(counts), 'rows': rows, 'source_binding_sha256': digest(source_bytes),
              'protocol_sha256': digest(protocol), 'implementation_sha256': digest(Path(__file__).read_bytes()),
              'all_paths_and_bounds_representable': counts['present_files'] == 39 and counts['in_bounds_spans'] == counts['span_occurrences'],
              'content_consistency_not_proven': counts['content_equal_spans'] != counts['span_occurrences'],
              'open_questions_owner': 'G02-R11-SOURCE-FIDELITY-R1.md'}
    OUT.mkdir(mode=0o700)
    for name, b in [('PROTOCOL.md', protocol), ('FIDELITY-AUDIT.json', (json.dumps(report, indent=2)+'\n').encode())]:
        with (OUT/name).open('xb') as stream:
            stream.write(b)
    print(json.dumps({'totals': dict(counts), 'all_paths_and_bounds_representable': report['all_paths_and_bounds_representable'],
                      'sha256': digest((OUT/'FIDELITY-AUDIT.json').read_bytes())}))


if __name__ == '__main__':
    main()
