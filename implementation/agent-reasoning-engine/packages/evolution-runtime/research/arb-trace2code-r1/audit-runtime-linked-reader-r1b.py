"""Independent tuple equivalence against independently source-audited parent.
Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json.
"""
import hashlib
import json
import os
import uuid
from pathlib import Path
ROOT = Path('/home/vlad_/are-benchmark-archive/g01-runtime-linked-reader-r1b-20261007')
PARENT = ROOT.with_name('g01-runtime-linked-reader-r1-20261007')
HERE = Path(__file__).parent
sha = lambda data: hashlib.sha256(data).hexdigest()


def main():
    seal = json.loads((ROOT/'PACKET-SEAL.json').read_bytes())
    for path, pin in seal['input_pins'].items():
        if sha(Path(path).read_bytes()) != pin:
            raise ValueError('audit.input-drift')
    for name, pin in seal['source_sha256'].items():
        if sha((HERE/name).read_bytes()) != pin:
            raise ValueError('audit.source-drift')
    raw = (ROOT/'PACKETS.jsonl').read_bytes()
    if sha(raw) != seal['packets_sha256'] or sha((ROOT/'PROTOCOL.json').read_bytes()) != seal['protocol_sha256']:
        raise ValueError('audit.packet-protocol')
    packets = [json.loads(line) for line in raw.splitlines()]
    original = [json.loads(line) for line in (PARENT/'PACKETS.jsonl').read_bytes().splitlines()]
    if len(packets) != len(original) or len(packets) != 32:
        raise ValueError('audit.full32')
    for p, old in zip(packets, original, strict=True):
        for key in old:
            if key not in ['prompt', 'prompt_sha256'] and p[key] != old[key]:
                raise ValueError('audit.observation-identity')
        if p['parent_prompt_sha256'] != old['prompt_sha256'] or sha(p['prompt'].encode()) != p['prompt_sha256']:
            raise ValueError('audit.prompt-digests')
        old_prefix, old_rows = old['prompt'].rsplit('\nCandidate records:\n', 1)
        prefix, rows = p['prompt'].rsplit('\nCandidate tuples:\n', 1)
        if not prefix.startswith(old_prefix+'\n'):
            raise ValueError('audit.failure-prefix')
        old_groups = [line for line in old_rows.splitlines() if line.startswith('Derived evidence group: ')]
        new_groups = [line for line in rows.splitlines() if line.startswith('Derived evidence group: ')]
        if old_groups != new_groups:
            raise ValueError('audit.group-order')
        old_records = [json.loads(line) for line in old_rows.splitlines() if not line.startswith('Derived evidence group: ')]
        new_records = [json.loads(line) for line in rows.splitlines() if not line.startswith('Derived evidence group: ')]
        expected = [[r['candidate_id'], r['path'], r['stack_positions'], r['file_execution'],
                     [[s['line'], s['text'], s['partial_line'], s['execution']] for s in r['lines']]] for r in old_records]
        if new_records != expected:
            raise ValueError('audit.delivered-fields')
    parent_audit = json.loads((PARENT/'AUDIT.json').read_bytes())
    if parent_audit['status'] != 'all16-source-observation-audit-passed':
        raise ValueError('audit.parent-source-audit')
    out = {**parent_audit, 'packet_seal_sha256': sha((ROOT/'PACKET-SEAL.json').read_bytes()),
           'implementation_sha256': sha(Path(__file__).read_bytes()),
           'parent_audit_sha256': sha((PARENT/'AUDIT.json').read_bytes()),
           'scope': 'Independent ordered tuple equivalence for all32 prompts and unchanged internal source records; source/line/runtime identity inherited from pinned independently audited parent. Only provenance SHA and repeated scope strings omitted equally from model prompts; common source limits retained. No token/native-quality proof.'}
    temporary = ROOT/('AUDIT.json.tmp-'+uuid.uuid4().hex)
    try:
        with os.fdopen(os.open(temporary, os.O_WRONLY|os.O_EXCL|os.O_CREAT, 0o600), 'wb') as stream:
            stream.write((json.dumps(out, indent=2)+'\n').encode())
            stream.flush()
            os.fsync(stream.fileno())
        os.link(temporary, ROOT/'AUDIT.json')
        descriptor = os.open(ROOT, os.O_DIRECTORY|os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
    finally:
        temporary.unlink()
    print(json.dumps({k: out[k] for k in ['status', 'cases', 'packets', 'source_records', 'source_lines']}))


if __name__ == '__main__':
    main()
