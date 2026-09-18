"""Review exact private archive bytes. Findings are locations, never matched values."""
import hashlib
import json
from pathlib import Path
import re
import tarfile
from collections import Counter

PATTERNS = {
    'workstation-path': re.compile(r'/home/[^\s"\'`<>]+|/mnt/[a-z]/[^\s"\'`<>]+|[A-Za-z]:\\(?:Users|home)\\[^\s"\'`<>]+'),
    'private-key-marker': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'),
    'credential-shaped-token': re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-(?:proj-)?[A-Za-z0-9_-]{40,}|AKIA[A-Z0-9]{16})\b'),
}


def findings(path, data):
    try:
        content = data.decode('utf-8')
    except UnicodeDecodeError:
        return [], 'non-utf8'
    output = []
    for kind, pattern in PATTERNS.items():
        lines = sorted({content.count('\n', 0, match.start()) + 1 for match in pattern.finditer(content)})
        if lines:
            output.append({'kind': kind, 'lines': lines})
    return output, 'utf8'


def review(archive, manifest, closure):
    if hashlib.sha256(archive.read_bytes()).hexdigest() != manifest['sha256']:
        raise ValueError('Archive hash mismatch')
    expected = {f['path']: f for f in closure['files']}
    seen = set()
    rows = []
    with tarfile.open(archive, 'r:gz') as source:
        for member in source:
            if member.isdir():
                continue
            if member.name not in expected or member.name in seen:
                raise ValueError('Unexpected or duplicate archive member')
            seen.add(member.name)
            entry = expected[member.name]
            if member.issym():
                if entry.get('kind') != 'symlink' or entry.get('link_target') != member.linkname:
                    raise ValueError('Symlink inventory mismatch')
                rows.append({'path': member.name, 'sha256': entry['sha256'], 'scan': 'symlink', 'findings': []})
                continue
            if not member.isfile() or member.size != entry['bytes']:
                raise ValueError('Archive type/size mismatch')
            data = source.extractfile(member).read()
            if hashlib.sha256(data).hexdigest() != entry['sha256']:
                raise ValueError('Member hash mismatch')
            hits, scan = findings(member.name, data)
            rows.append({'path': member.name, 'sha256': entry['sha256'], 'scan': scan, 'findings': hits})
    if seen != set(expected):
        raise ValueError('Missing archive members')
    counts = Counter(hit['kind'] for row in rows for hit in row['findings'])
    return {'schema_version': 'keld.archive-content-review/v1', 'archive_sha256': manifest['sha256'],
            'closure_digest': closure['closure_digest'], 'file_count': len(rows),
            'finding_file_counts': dict(counts), 'scan_counts': dict(Counter(row['scan'] for row in rows)),
            'publication_approved': False,
            'limitations': 'Pattern-based review leads only; no matched values copied. Absence of a finding is not secret clearance or distribution approval. No ownership determination.',
            'files': rows}


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    candidate = root / 'evidence/private-candidate'
    manifest = json.loads((candidate / 'manifest.json').read_text())
    result = review(candidate / 'are-private-candidate.tar.gz', manifest, json.loads((candidate / 'source-closure.json').read_text()))
    (root / 'evidence/archive-content-review.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k != 'files'}))
