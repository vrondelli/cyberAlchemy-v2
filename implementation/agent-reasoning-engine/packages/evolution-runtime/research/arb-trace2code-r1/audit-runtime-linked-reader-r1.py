"""Independent source/observation audit, no ranking implementation imported.
Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json.
"""
import hashlib
import json
import os
import uuid
from pathlib import Path

ROOT = Path('/home/vlad_/are-benchmark-archive/g01-runtime-linked-reader-r1-20261007')
INPUT = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007')
BINDING = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-source-binding-r7-20261007')
SOURCE = Path('/home/vlad_/are-benchmark-archive/defects4j-canonical-exposed-r1')
HERE = Path(__file__).parent


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read(path, pin=None):
    data = path.read_bytes()
    if pin is not None and sha(data) != pin:
        raise ValueError('audit.input-drift:' + str(path))
    return json.loads(data)


def main():
    seal = read(ROOT / 'PACKET-SEAL.json', '260c34eee3f64db23243671ddd813acc7422518aa90e35c6e71f8ab40a6820bc')
    data = (ROOT / 'PACKETS.jsonl').read_bytes()
    if sha(data) != seal['packets_sha256'] or sha((ROOT / 'PROTOCOL.json').read_bytes()) != seal['protocol_sha256']:
        raise ValueError('audit.packet-protocol')
    for path, pin in seal['input_pins'].items():
        read(Path(path), pin)
    for name, pin in seal['source_sha256'].items():
        if sha((HERE / name).read_bytes()) != pin:
            raise ValueError('audit.builder-drift')
    packets = [json.loads(line) for line in data.splitlines()]
    freeze = read(INPUT / 'FREEZE.json')
    binding = {r['case_id']: r for r in read(BINDING / 'RESULT.json')['rows']}
    nav = {r['case_id']: r for r in read(SOURCE / 'ENTITY-OPERATOR-SCREEN-R1.json')['cases']}
    observations = {r['case_id']: r for r in read(SOURCE / 'ARE-SCREEN.json')['cases']}
    if len(packets) != 32 or len(freeze['cases']) != 16:
        raise ValueError('audit.denominator')
    source_records, source_lines, unavailable = 0, 0, []
    for i, c in enumerate(freeze['cases']):
        cid = c['case_id']
        pair = packets[i*2:i*2+2]
        if [p['arm'] for p in pair] != (['linked', 'plain'] if i % 2 == 0 else ['plain', 'linked']):
            raise ValueError('audit.arm-order')
        if pair[0]['candidates'] != pair[1]['candidates']:
            raise ValueError('audit.observation-asymmetry')
        records = pair[0]['candidates']
        production = {r['path'] for r in read(INPUT / cid / 'INSTRUMENTATION.json')['rows']}
        expected = sorted(set(nav[cid]['variants']['combined']['candidates']) & production)
        if [r['path'] for r in records] != expected or [r['candidate_id'] for r in records] != list(range(1, len(records)+1)):
            raise ValueError('audit.candidate-pool')
        coverage = {}
        if binding[cid]['source_bound_failure']:
            coverage = {r['path']: r for r in read(BINDING / cid / 'SOURCE-BOUND-COVERAGE.json', binding[cid]['source_bound_coverage_sha256'])['rows']}
        else:
            unavailable.append(cid)
        for r in records:
            raw = (INPUT / cid / 'buggy-java-only/corpus' / r['path']).read_bytes()
            if sha(raw) != r['source_sha256']:
                raise ValueError('audit.source-bytes')
            lines = raw.decode('utf8', errors='replace').splitlines()
            bound = coverage.get(r['path'])
            positive = {x['line'] for x in bound['lines'] if x['covered_instructions'] > 0} if bound else None
            state = 'unavailable' if positive is None else 'observed' if positive else 'not-observed'
            if r['file_execution'] != state:
                raise ValueError('audit.file-execution')
            positions = [j+1 for j, f in enumerate(observations[cid]['frames']) if any(m['path'] == r['path'] and m['source_sha256'] == r['source_sha256'] and m['line_in_range'] for m in f['matches'])]
            if positions != r['stack_positions']:
                raise ValueError('audit.stack-position')
            for line in r['lines']:
                original = lines[line['line']-1]
                if line['text'] != (original[:450] if line['partial_line'] else original) or line['partial_line'] != (len(original) > 450):
                    raise ValueError('audit.line-source-binding')
                state = 'unavailable' if positive is None else 'observed' if line['line'] in positive else 'not-observed'
                if line['execution'] != state:
                    raise ValueError('audit.line-execution')
                source_lines += 1
            source_records += 1
        for p in pair:
            if p['case_id'] != cid or p['runtime_available'] != binding[cid]['source_bound_failure'] or sha(p['prompt'].encode()) != p['prompt_sha256']:
                raise ValueError('audit.packet-identity')
            rendered = [json.loads(line) for line in p['prompt'].splitlines() if line.startswith('{')]
            if sorted(rendered, key=lambda r: r['candidate_id']) != records:
                raise ValueError('audit.rendered-observations')
            canonical_bytes = json.dumps(records, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
            if sha(canonical_bytes) != p['common_records_sha256']:
                raise ValueError('audit.common-record-digest')
    out = {'status': 'all16-source-observation-audit-passed', 'cases': 16, 'packets': 32,
           'source_records': source_records, 'source_lines': source_lines, 'unavailable_cases': unavailable,
           'packet_seal_sha256': sha((ROOT / 'PACKET-SEAL.json').read_bytes()),
           'implementation_sha256': sha(Path(__file__).read_bytes()), 'provider_calls': 0, 'reference_label_reads': 0,
           'scope': 'Independent source bytes, selected line coordinates/flags, stack positions, candidate sets and paired rendered-observation equality. Does not independently reproduce excerpt-window or linked ordering selection, token admission, native accuracy or semantics.',
           'authority_effect': 'none', 'open_questions_owner': 'G01-RUNTIME-LINKED-READER-R1.json'}
    data = (json.dumps(out, indent=2) + '\n').encode()
    temporary = ROOT / ('AUDIT.json.tmp-' + uuid.uuid4().hex)
    try:
        with os.fdopen(os.open(temporary, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.link(temporary, ROOT / 'AUDIT.json')
        descriptor = os.open(ROOT, os.O_DIRECTORY | os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
    finally:
        temporary.unlink()
    print(json.dumps(out))


if __name__ == '__main__':
    main()
