#!/usr/bin/env python3
"""Bind all 24 r11 r3 exact commits to already verified private VPS caches."""

import hashlib
import json
import os
from pathlib import Path
import subprocess

BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-r11-clean-cohort-candidate-r3/COHORT-CANDIDATE.json'
R1_TRANSFER = BASE / 'g01-r11-cache-transfer-r1/VERIFY.json'
QUALIFIED = BASE / 'g01-r11-remaining-typescript-qualification-r1/RESULT.json'
OUTPUT = BASE / 'g01-r11-r3-cache-binding-r1/VERIFY.json'
R1_CACHE = Path('/tmp/are-g01-r11-source-caches-r1')
NEW_MUI = Path('/tmp/are-g01-r11-remaining-typescript-cache-r1/mui--material-ui.git')
PINS = {
    CANDIDATE: '4a880cebe939ab25e3c35431cef7396a95534c863547e74024bc5211991bdb66',
    R1_TRANSFER: 'd41c94642eec173aadaea9f47c7efe01e811175d4893ffb040cc6095f63a56ce',
    QUALIFIED: '9d705ecd9ffe68262d892c98ffcd726e018fe3a2d8103c5c3aec58198e0fea85',
}
ENV = {**os.environ, 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null',
       'GIT_TERMINAL_PROMPT': '0', 'GIT_NO_LAZY_FETCH': '1'}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def git(repo, *args):
    value = subprocess.run(['git', '--no-optional-locks', '-c', f'safe.directory={repo}',
                            '-C', str(repo), *args], capture_output=True, text=True,
                           timeout=30, env=ENV)
    if value.returncode:
        raise ValueError('git-check-failed:' + str(repo))
    return value.stdout.strip()


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('fresh-output-or-pinned-input-drift')
    candidate, prior, qualified = (json.loads(path.read_text()) for path in
                                   (CANDIDATE, R1_TRANSFER, QUALIFIED))
    winner = candidate.get('replacement_id')
    if (candidate.get('status') != 'preflight-only-not-frozen' or
            candidate.get('gold_values_or_paths_used') is not False or candidate.get('model_calls') != 0 or
            prior.get('status') != 'passed' or prior.get('model_calls') != 0 or prior.get('gold_loaded') is not False or
            qualified.get('status') != 'passed' or qualified.get('first_eligible_id') != winner or
            qualified.get('model_calls') != 0 or
            candidate.get('replacement_qualification_receipt_sha256') != PINS[QUALIFIED] or
            len(candidate['ordered_tasks']) != 24 or prior.get('verified_tasks') != 24):
        raise ValueError('lineage-shape')
    previous = {row['instance_id']: row for row in prior['verified_task_bindings']}
    if len(previous) != 24:
        raise ValueError('prior-duplicate-binding')
    eligible = qualified['rows'][-1]
    bindings = []
    for task in candidate['ordered_tasks']:
        identifier = task['instance_id']
        if identifier == winner:
            repo = NEW_MUI
            if (eligible['instance_id'] != identifier or eligible['base_commit'] != task['base_commit'] or
                    eligible['admitted_gold_files'] != eligible['gold_file_count'] or
                    eligible['excluded_gold_files'] or eligible['absent_gold_files']):
                raise ValueError('qualified-winner-binding')
        else:
            row = previous.get(identifier)
            if row is None or row['origin'] != task['repo_url'] or row['base_commit'] != task['base_commit']:
                raise ValueError('retained-cache-binding')
            repo = Path(row['repository_path'])
            if repo.parent != R1_CACHE:
                raise ValueError('retained-cache-root')
        if not repo.is_dir() or repo.is_symlink() or repo.resolve() != repo:
            raise ValueError('cache-path-shape')
        if git(repo, 'remote', 'get-url', 'origin') != task['repo_url']:
            raise ValueError('cache-origin')
        if git(repo, 'rev-parse', '--verify', task['base_commit'] + '^{commit}') != task['base_commit']:
            raise ValueError('commit-identity')
        tree = git(repo, 'rev-parse', task['base_commit'] + '^{tree}')
        if len(tree) != 40 or (identifier == winner and tree != eligible['tree']) or (
                identifier != winner and tree != previous[identifier]['tree']):
            raise ValueError('tree-identity')
        bindings.append({'instance_id': identifier, 'origin': task['repo_url'],
                         'base_commit': task['base_commit'], 'tree': tree,
                         'repository_path': str(repo)})
    if len({row['instance_id'] for row in bindings}) != 24:
        raise ValueError('duplicate-task')
    result = {'schema_version': 'are.g01-r11-r3-vps-cache-binding/v1', 'status': 'passed',
              'candidate_sha256': PINS[CANDIDATE], 'r1_transfer_sha256': PINS[R1_TRANSFER],
              'qualification_sha256': PINS[QUALIFIED], 'verified_tasks': 24,
              'verified_origins': len({row['origin'] for row in bindings}),
              'verified_task_bindings': bindings, 'script_sha256': sha(Path(__file__)),
              'gold_loaded': False, 'model_calls': 0,
              'claim_ceiling': 'Exact cache/commit/tree binding only; no checkout, full index, native-file admission, model quality, or superiority.',
              'open_questions': ['Will isolated checkouts and all 24 bounded indexes pass?',
                                 'Will independent native-reference admission pass?']}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': 'passed', 'verified_tasks': 24,
                      'verified_origins': result['verified_origins'], 'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
