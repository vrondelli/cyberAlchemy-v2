#!/usr/bin/env python3
"""Source-only: follow code symbols in ARE-selected spans to other definitions."""

import hashlib
import json
import os
import re
import subprocess
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
OUTPUT = ROOT / 'g02-r11-symbol-hop-source-exposed-r1-20261004/SOURCE-SEAL.json'
UNION_SHA = '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
MAX_BYTES = 262144
TOP_SYMBOLS = 32
TOP_CANDIDATES = 20
IDENT = re.compile(r'\b[A-Za-z_][A-Za-z0-9_]{5,}\b')
DEFINITION = re.compile(r'^\s*(?:(?:async\s+)?def|class|struct|enum|using|#\s*define)\s+([A-Za-z_][A-Za-z0-9_]*)\b')
STOP = {'return', 'import', 'include', 'string', 'const', 'value', 'false', 'true',
        'class', 'self', 'assert', 'raise', 'except', 'module', 'object', 'number',
        'result', 'function', 'kwargs', 'none', 'basicjsontype', 'valueerror',
        'typeerror', 'importerror', 'std_string', 'typename', 'nullptr'}
EXTENSIONS = ('*.py', '*.hpp', '*.h', '*.hh', '*.hxx', '*.cpp', '*.cc', '*.cxx')


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def issue_text(raw):
    if raw.startswith('"') and raw.endswith('"'):
        try:
            decoded = json.loads(raw)
            if isinstance(decoded, str):
                return decoded
        except json.JSONDecodeError:
            pass
    return raw


def is_bridge_symbol(name):
    return (name.casefold() not in STOP and
            ('_' in name or any(character.isupper() for character in name[1:])))


def common_directory_depth(left, right):
    a, b = Path(left).parts[:-1], Path(right).parts[:-1]
    count = 0
    for x, y in zip(a, b):
        if x != y:
            break
        count += 1
    return count


def main():
    if OUTPUT.exists() or sha(UNION) != UNION_SHA:
        raise SystemExit('output-exists-or-union-drift')
    union = json.loads(UNION.read_text())['rows']
    if [row['ordinal'] for row in union] != list(range(1, 13)):
        raise SystemExit('cohort-drift')
    rows = []
    for row in union:
        ordinal = row['ordinal']
        raw = (ROOT / 'g02-product-replication-r11-20261002/pairs'
               / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw')
        base = raw / 'sources/session/base'
        task_paths = [path for path in (raw / 'tasks').glob('*.json') if path.name != 'binding.json']
        if len(task_paths) != 1:
            raise SystemExit(f'task-count:{ordinal}')
        task = json.loads(task_paths[0].read_text())
        commit = subprocess.check_output(['git', '-c', f'safe.directory={base}', '-C', str(base),
                                          'rev-parse', 'HEAD'], text=True).strip()
        if (task['instance_id'] != row['instance_id'] or commit != row['base_commit']
                or hashlib.sha256(task['problem_statement'].encode()).hexdigest() != row['issue_sha256']):
            raise SystemExit(f'task-or-base-drift:{ordinal}')
        prediction_path = raw / 'policy-pruning/prediction.json'
        prediction = json.loads(prediction_path.read_text())
        if prediction['instance_id'] != row['instance_id']:
            raise SystemExit(f'prediction-drift:{ordinal}')
        selected = set(prediction['traj_data']['pred_files'])
        spans_by_path = prediction['traj_data']['pred_spans']
        delivered = set(row['delivered_paths'])
        issue_words = {token.casefold() for token in IDENT.findall(issue_text(task['problem_statement']))}
        weights = Counter()
        symbol_sources = defaultdict(set)
        source_sha = {}
        for source_path, spans in spans_by_path.items():
            rel = Path(source_path)
            if rel.is_absolute() or '..' in rel.parts:
                raise SystemExit(f'unsafe-selected-path:{ordinal}')
            source = base / rel
            if not source.is_file() or source.is_symlink():
                raise SystemExit(f'selected-file-drift:{ordinal}')
            if source.stat().st_size > MAX_BYTES:
                continue
            source_sha[source_path] = sha(source)
            lines = source.read_bytes().decode('utf-8', 'replace').splitlines()
            for span in spans:
                start, end = span['start'], span['end']
                if not isinstance(start, int) or not isinstance(end, int) or start < 1 or end < start:
                    raise SystemExit(f'bad-span:{ordinal}')
                for line in lines[start-1:min(end, len(lines))]:
                    names = {token for token in IDENT.findall(line) if is_bridge_symbol(token)}
                    overlap = len({token.casefold() for token in names} & issue_words)
                    for name in names:
                        weights[name] += 1 + 2 * min(overlap, 3) + (2 if name.casefold() in issue_words else 0)
                        symbol_sources[name].add(source_path)
        symbols = [name for name, _ in sorted(weights.items(), key=lambda pair:
                   (-pair[1], -len(pair[0]), pair[0]))[:TOP_SYMBOLS]]
        candidates = defaultdict(set)
        if symbols:
            alternatives = '|'.join(re.escape(name) for name in symbols)
            pattern = (r'^[[:space:]]*((async[[:space:]]+)?def|class|struct|enum|using|'
                       r'#[[:space:]]*define)[[:space:]]+(' + alternatives + r')')
            grep = subprocess.run(
                ['git', '-c', f'safe.directory={base}', '-C', str(base), 'grep', '-n', '-E',
                 pattern, 'HEAD', '--', *EXTENSIONS], capture_output=True, text=True)
            if grep.returncode not in (0, 1):
                raise SystemExit(f'git-grep-failed:{ordinal}:{grep.returncode}')
            for line in grep.stdout.splitlines():
                parts = line.split(':', 3)
                if len(parts) != 4 or parts[0] != 'HEAD':
                    continue
                rel, code = parts[1], parts[3]
                match = DEFINITION.search(code)
                if not match or match.group(1) not in weights:
                    continue
                path = base / rel
                if (rel in selected or rel in delivered or not path.is_file()
                        or path.is_symlink() or path.stat().st_size > MAX_BYTES):
                    continue
                candidates[rel].add(match.group(1))
        ranked = []
        for path, matched in candidates.items():
            strength = sum(weights[name] * 100 for name in matched)
            proximity = max(common_directory_depth(origin, path)
                            for name in matched for origin in symbol_sources[name])
            ranked.append({'path': path, 'matched_symbols': sorted(matched),
                           'score_units': strength + proximity * 5,
                           'bytes': (base / path).stat().st_size})
        ranked.sort(key=lambda item: (-item['score_units'], item['bytes'], item['path']))
        rows.append({'ordinal': ordinal, 'repo': row['repo'], 'instance_id': row['instance_id'],
                     'base_commit': commit, 'issue_sha256': row['issue_sha256'],
                     'prediction_sha256': sha(prediction_path),
                     'selected_source_sha256': source_sha,
                     'bridge_symbols': symbols, 'candidate_count': len(ranked),
                     'shortlist': ranked[:TOP_CANDIDATES]})
    report = {'schema_version': 'g02.r11-symbol-hop-source-exposed-r1/v1',
              'posture': 'source-only-exposed-development-no-gold-dsh-or-score',
              'union_sha256': UNION_SHA, 'script_sha256': sha(Path(__file__)),
              'policy': 'From ARE-selected <=256KiB source spans, rank 32 code-like bridge symbols by frequency and issue-line overlap; find tracked <=256KiB Python/C/C++ definitions of those symbols outside selected/delivered files; rank by bridge weight and source-directory proximity; top 20 per task.',
              'rows': rows,
              'claim_ceiling': 'Source-only shortlist coverage only; no read, native score, model call, independent quality or superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'tasks': len(rows), 'shortlisted': sum(len(row['shortlist']) for row in rows),
                      'candidate_counts': [row['candidate_count'] for row in rows],
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
