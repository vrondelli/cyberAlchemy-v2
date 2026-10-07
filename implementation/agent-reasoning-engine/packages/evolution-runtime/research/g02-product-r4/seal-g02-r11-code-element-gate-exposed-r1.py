#!/usr/bin/env python3
"""Seal exact issue-to-code-element proposals over exposed G02 r11 union.

Source-only: no native labels, comparator outputs, prior audit, or scores.
"""

import ast
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
OUTPUT = ROOT / 'g02-r11-code-element-gate-exposed-r1-20261003/SOURCE-SEAL.json'
UNION_SHA = '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
TOKEN = re.compile(r'\b[A-Za-z_][A-Za-z0-9_]{3,}\b')
BACKTICK = re.compile(r'`([^`\n]{2,100})`')
CALL = re.compile(r'\b([A-Za-z_][A-Za-z0-9_]{3,})\s*\(')
CPP_DECL = re.compile(r'(?m)^\s*(?:#\s*define|class|struct|enum(?:\s+class)?)\s+([A-Za-z_]\w*)\b')
QUALIFIED = re.compile(r'\b[A-Za-z_]\w*(?:::[A-Za-z_]\w*){1,}\b')
STOP = {'about', 'after', 'another', 'before', 'build', 'class', 'code', 'config',
        'data', 'error', 'false', 'file', 'files', 'from', 'function', 'issue',
        'json', 'module', 'none', 'object', 'other', 'path', 'private', 'public',
        'python', 'result', 'return', 'should', 'source', 'string', 'tests',
        'that', 'these', 'this', 'true', 'type', 'value', 'when', 'which', 'with'}


def sha_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def normalize_issue(raw):
    if raw.startswith('"') and raw.endswith('"'):
        try:
            decoded = json.loads(raw)
            if isinstance(decoded, str):
                return decoded, True
        except json.JSONDecodeError:
            pass
    return raw, False


def explicit_anchors(issue):
    lines = [line for line in issue.splitlines()
             if not re.match(r'^\s*-\s*\[[ xX]\]', line)]
    cleaned = '\n'.join(lines)
    code = set()
    for fragment in BACKTICK.findall(cleaned):
        code.update(TOKEN.findall(fragment))
    code.update(CALL.findall(cleaned))
    code.update(token for token in TOKEN.findall(cleaned)
                if '_' in token or any(char.isdigit() for char in token)
                or (any(char.islower() for char in token) and any(char.isupper() for char in token)))
    anchors = {token.casefold() for token in code
               if len(token) >= 4 and token.casefold() not in STOP}
    phrases = {phrase.casefold() for phrase in QUALIFIED.findall(cleaned)
               if len(phrase) >= 8}
    return anchors, phrases


def declarations(path, text):
    if path.suffix == '.py':
        try:
            tree = ast.parse(text)
            return {node.name.casefold() for node in ast.walk(tree)
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))}
        except SyntaxError:
            return {name.casefold() for name in re.findall(r'(?m)^\s*(?:async\s+def|def|class)\s+([A-Za-z_]\w*)\b', text)}
    return {name.casefold() for name in CPP_DECL.findall(text)}


def main():
    if OUTPUT.exists() or sha(UNION) != UNION_SHA:
        raise ValueError('output-exists-or-union-drift')
    source = json.loads(UNION.read_text())
    if [row['ordinal'] for row in source['rows']] != list(range(1, 13)):
        raise ValueError('source-row-drift')
    rows = []
    for row in source['rows']:
        ordinal = row['ordinal']
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw'
        base = raw / 'sources/session/base'
        tasks = [path for path in (raw / 'tasks').glob('*.json') if path.name != 'binding.json']
        if len(tasks) != 1:
            raise ValueError(f'task-count:{ordinal}')
        task = json.loads(tasks[0].read_text())
        commit = subprocess.check_output(['git', '-c', f'safe.directory={base}', '-C', str(base),
                                          'rev-parse', 'HEAD'], text=True).strip()
        if (task['instance_id'] != row['instance_id'] or
                sha_bytes(task['problem_statement'].encode()) != row['issue_sha256'] or
                commit != row['base_commit']):
            raise ValueError(f'task-identity:{ordinal}')
        issue, decoded = normalize_issue(task['problem_statement'])
        anchors, phrases = explicit_anchors(issue)
        delivered = set(row['delivered_paths'])
        ranked = []
        eligible = 0
        for item in row['candidates']:
            if item['bytes'] > source['max_read_bytes']:
                continue
            eligible += 1
            rel = Path(item['path'])
            if (rel.is_absolute() or not rel.parts or
                    any(part in ('', '.', '..') for part in rel.parts) or item['path'] in delivered):
                raise ValueError(f'unsafe-candidate:{ordinal}')
            path = base / rel
            if path.is_symlink() or not path.is_file() or path.stat().st_size != item['bytes']:
                raise ValueError(f'candidate-source-drift:{ordinal}:{rel}')
            data = path.read_bytes()
            text = data.decode('utf-8', errors='replace')
            declared = declarations(rel, text) & anchors
            path_tokens = {token.casefold() for part in rel.parts for token in TOKEN.findall(part)}
            path_hits = path_tokens & anchors
            phrase_hits = {phrase for phrase in phrases if phrase in text.casefold()}
            direct = bool(set(item['channels']) & {'python_import', 'cpp_include'})
            score = 6 * len(declared) + 5 * len(path_hits) + 4 * len(phrase_hits) + int(direct)
            if score < 5 or not (declared or path_hits or phrase_hits):
                continue
            ranked.append({'path': item['path'], 'score': score, 'bytes': item['bytes'],
                           'source_sha256': sha_bytes(data), 'channels': item['channels'],
                           'declaration_hits': sorted(declared), 'path_hits': sorted(path_hits),
                           'qualified_phrase_hits': sorted(phrase_hits)})
        ranked.sort(key=lambda item: (-item['score'], item['bytes'], item['path']))
        rows.append({'ordinal': ordinal, 'instance_id': row['instance_id'], 'repo': row['repo'],
                     'base_commit': commit, 'issue_sha256': row['issue_sha256'],
                     'issue_was_json_string': decoded, 'anchor_count': len(anchors),
                     'qualified_phrase_count': len(phrases), 'eligible_candidates': eligible,
                     'evidence_candidates': len(ranked), 'proposals': ranked[:3]})
    receipt = {'schema_version': 'g02.r11-code-element-gate-exposed-source/v1',
               'posture': 'source-only-exposed-development-no-gold-dsh-score-or-model',
               'source_union_sha256': UNION_SHA, 'script_sha256': sha(Path(__file__)),
               'rule': 'Decode issue only if it is a valid JSON string. Ignore checkbox lines. Use explicit backtick, call-shaped, underscore/digit/CamelCase anchors and qualified C++ phrases. Candidate must have an exact anchor in a Python AST or C++ class/struct/enum/macro declaration, in path tokens, or an exact qualified phrase in content. Score 6/5/4 respectively plus 1 for direct import/include; require score >=5; rank by score, then smaller bytes, then path; propose at most three files per task, else abstain. Read cap 256 KiB.',
               'rows': rows,
               'claim_ceiling': 'Source-only proposed files; no actual ARE read, native score, all-in cost, independent transfer, or superiority.'}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'sha256': sha_bytes(data), 'json_string_issues': sum(row['issue_was_json_string'] for row in rows),
                      'proposals': [len(row['proposals']) for row in rows],
                      'evidence_candidates': [row['evidence_candidates'] for row in rows]}))


if __name__ == '__main__':
    main()
