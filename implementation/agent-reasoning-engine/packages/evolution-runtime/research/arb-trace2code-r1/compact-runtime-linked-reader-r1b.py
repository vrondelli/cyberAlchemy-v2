"""Presentation-only successor; parent prompts/results remain immutable.
Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json.
"""
import json
import runpy
import time
from pathlib import Path

HERE = Path(__file__).parent
M = runpy.run_path(str(HERE / 'build-runtime-linked-reader-r1.py'))
sha, save, encoded = M['sha'], M['save'], M['encoded']
PARENT = M['OUTPUT']
OUTPUT = PARENT.with_name('g01-runtime-linked-reader-r1b-20261007')
PROTOCOL = HERE / '../../evidence/G01-RUNTIME-LINKED-READER-R1B.json'
LEGEND = ('Candidate tuple: [candidate_id,path,stack_positions,file_execution,source_lines]. '
          'Each source line tuple: [line_number,text,partial_line,execution]. '
          'Execution values observed/not-observed/unavailable have the same command-phase limitations as above. '
          'Every source excerpt is partial; provenance hashes are retained in receipts, not reproduced here.')


def compact(record):
    return [record['candidate_id'], record['path'], record['stack_positions'], record['file_execution'],
            [[r['line'], r['text'], r['partial_line'], r['execution']] for r in record['lines']]]


def render(prompt):
    prefix, rows = prompt.rsplit('\nCandidate records:\n', 1)
    transformed = []
    for line in rows.splitlines():
        if line.startswith('Derived evidence group: '):
            transformed.append(line)
        else:
            transformed.append(encoded(compact(json.loads(line))).decode())
    return prefix + '\n' + LEGEND + '\nCandidate tuples:\n' + '\n'.join(transformed)


def main():
    started = time.monotonic()
    if OUTPUT.exists():
        raise ValueError('compact.no-overwrite')
    pins = {PARENT/'PACKET-SEAL.json': '260c34eee3f64db23243671ddd813acc7422518aa90e35c6e71f8ab40a6820bc',
            PARENT/'AUDIT.json': 'a82ef095e544a7b6fe09818f2b391b9e353091110218a6c1e113b02047ad6cff',
            PARENT/'tokenize-run/RESULT.json': 'cbce51f9944fc0ba6e611355bf4c5316efa214326ae6b3131828686f7a469028'}
    inputs = {str(path): M['read_pinned'](path, pin) for path, pin in pins.items()}
    old_seal = inputs[str(PARENT/'PACKET-SEAL.json')]
    old_tokenizer = inputs[str(PARENT/'tokenize-run/RESULT.json')]
    if old_tokenizer['admitted'] or (PARENT/'generate-run').exists():
        raise ValueError('compact.not-pre-generation-rejected-parent')
    for name, pin in old_seal['source_sha256'].items():
        if sha((HERE/name).read_bytes()) != pin:
            raise ValueError('compact.parent-source-drift')
    for path, pin in old_seal['input_pins'].items():
        if sha(Path(path).read_bytes()) != pin:
            raise ValueError('compact.original-input-drift')
    raw = (PARENT/'PACKETS.jsonl').read_bytes()
    if sha(raw) != old_seal['packets_sha256']:
        raise ValueError('compact.parent-packets')
    packets = [json.loads(line) for line in raw.splitlines()]
    for p in packets:
        p['parent_prompt_sha256'] = p['prompt_sha256']
        p['prompt'] = render(p['prompt'])
        p['prompt_sha256'] = sha(p['prompt'].encode())
    if len(packets) != 32:
        raise ValueError('compact.full32')
    OUTPUT.mkdir(mode=0o700)
    protocol = PROTOCOL.read_bytes()
    save(OUTPUT/'PROTOCOL.json', protocol)
    data = b''.join(encoded(p)+b'\n' for p in packets)
    save(OUTPUT/'PACKETS.jsonl', data)
    seal = {**old_seal, 'status': 'all16-compact-equal-observation-packets-prepared',
            'packets_sha256': sha(data), 'protocol_sha256': sha(protocol),
            'input_pins': {**old_seal['input_pins'], **{str(path): pin for path, pin in pins.items()}, str(PARENT/'PACKETS.jsonl'): sha(raw)},
            'source_sha256': {**old_seal['source_sha256'], **{name: sha((HERE/name).read_bytes()) for name in
                              ['compact-runtime-linked-reader-r1b.py', 'test_compact_runtime_linked_reader_r1b.py', 'audit-runtime-linked-reader-r1b.py']}},
            'elapsed_ms': round((time.monotonic()-started)*1000), 'parent_construction_elapsed_ms': old_seal['elapsed_ms'],
            'imported_parent_tokenizer_prompt_tokens': old_tokenizer['known_prompt_tokens'],
            'imported_parent_tokenizer_latency_ms': old_tokenizer['latency_ms'],
            'maximum_prompt_utf8_bytes': max(len(p['prompt'].encode()) for p in packets),
            'tokenizer_admitted': False, 'open_questions_owner': 'G01-RUNTIME-LINKED-READER-R1.json'}
    save(OUTPUT/'PACKET-SEAL.json', encoded(seal)+b'\n')
    print(json.dumps({k: seal[k] for k in ['status', 'cases', 'packets', 'maximum_prompt_utf8_bytes', 'elapsed_ms']}))


if __name__ == '__main__':
    main()
