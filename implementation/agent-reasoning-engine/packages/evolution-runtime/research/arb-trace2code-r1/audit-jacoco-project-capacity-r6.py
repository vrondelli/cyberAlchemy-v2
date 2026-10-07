"""Reconstruct all16 fresh canonical source-bound failures, never a quality evaluation.
Open Questions: evidence/G01-JACOCO-PROJECT-CAPACITY-R6.json.
"""
import os
import uuid
import hashlib
import importlib.util
import json
import re
import struct
from pathlib import Path


def save_exclusive(path, data):
    temporary = path.with_name(path.name + '.tmp-' + str(os.getpid()) + '-' + uuid.uuid4().hex)
    try:
        descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.link(temporary, path)
        descriptor = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
    finally:
        temporary.unlink()


def sha(data):
    return hashlib.sha256(data).hexdigest()


CRC_TABLE = []
for value in range(256):
    for _ in range(8):
        value = (value >> 1) ^ (0xd800000000000000 if value & 1 else 0)
    CRC_TABLE.append(value)


def class_id(data):
    value = 0
    for index, byte in enumerate(data):
        if index == 7 and data[6:8] == b'\x00\x35':
            byte = 52
        value = (value >> 8) ^ CRC_TABLE[(value ^ byte) & 255]
    return f'{value:016x}'


def binary_facts(data):
    if len(data) < 10 or data[:4] != b'\xca\xfe\xba\xbe':
        raise ValueError('jacoco-audit.class-binary-header')
    offset = 8

    def take(size):
        nonlocal offset
        if offset + size > len(data):
            raise ValueError('jacoco-audit.class-binary-truncated')
        result = data[offset:offset + size]
        offset += size
        return result

    def u2():
        return struct.unpack('>H', take(2))[0]

    pool = [None] * u2()
    index = 1
    while index < len(pool):
        tag = take(1)[0]
        if tag == 1:
            pool[index] = ('utf8', take(u2()))
        elif tag in {3, 4}:
            take(4)
        elif tag in {5, 6}:
            take(8)
            index += 1
        elif tag == 7:
            pool[index] = ('class', u2())
        elif tag in {8, 16, 19, 20}:
            take(2)
        elif tag in {9, 10, 11, 12, 17, 18}:
            take(4)
        elif tag == 15:
            take(3)
        else:
            raise ValueError('jacoco-audit.class-constant-tag')
        index += 1
    access, this_class = u2(), u2()
    if not pool[this_class] or pool[this_class][0] != 'class':
        raise ValueError('jacoco-audit.this-class-reference')
    name = pool[pool[this_class][1]]
    if not name or name[0] != 'utf8':
        raise ValueError('jacoco-audit.this-class-name')
    u2()
    take(u2() * 2)
    for _ in range(u2()):
        take(6)
        for _ in range(u2()):
            take(2)
            take(struct.unpack('>I', take(4))[0])
    return access, u2(), name[1].decode('ascii', errors='strict')


def main():
    here = Path(__file__).parent
    root = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007')
    fb = (root / 'FREEZE.json').read_bytes()
    freeze = json.loads(fb)
    for name, pin in freeze['source_sha256'].items():
        if sha((here / name).read_bytes()) != pin:
            raise ValueError('jacoco-audit.source-drift')
    if sha((here / '../../evidence/G01-JACOCO-PROJECT-CAPACITY-R6.json').read_bytes()) != freeze['protocol_sha256']:
        raise ValueError('jacoco-audit.protocol-drift')
    spec = importlib.util.spec_from_file_location('jacoco_binder', here / 'bind-jacoco-r5.py')
    binder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(binder)
    terminal = json.loads((root / 'CAMPAIGN-TERMINAL.json').read_bytes())
    if terminal['freeze_sha256'] != sha(fb) or len(terminal['rows']) != 16:
        raise ValueError('jacoco-audit.both-terminal')
    rows = []
    for c in freeze['cases']:
        case_root = root / c['case_id']
        row = {'case_id': c['case_id'], 'source_bound_failure': False, 'error': None}
        try:
            rb = (case_root / 'RESULT.json').read_bytes()
            sealed = next(r for r in terminal['rows'] if r['case_id'] == c['case_id'])
            if sha(rb) != sealed['result_sha256']:
                raise ValueError('jacoco-audit.result-pin')
            result = json.loads(rb)
            if result['status'] != 'terminal-jacoco-execution-complete':
                raise ValueError(result['error'])
            for op in result['operations']:
                for kind in ['stdout', 'stderr']:
                    if sha((case_root / (op['label'] + '.' + kind)).read_bytes()) != op[kind + '_sha256']:
                        raise ValueError('jacoco-audit.operation-log')
            projection = json.loads((case_root / 'buggy-java-only/RECEIPT.json').read_bytes())
            if projection['source_tree_sha256'] != c['source_tree_sha256']:
                raise ValueError('jacoco-audit.source-tree')
            instrumentation = json.loads((case_root / 'INSTRUMENTATION.json').read_bytes())
            expected_includes = ':'.join(x for n in instrumentation['classes'] for x in [n, n + '$*'])
            test = next(o for o in result['operations'] if o['label'] == 'TEST')
            if 'includes=' + expected_includes + ' -Dfile.encoding=UTF-8' not in test['agent_option'] or test['args'] != ['test', '-w', str(case_root / 'trusted-fixture'), '-t', c['test_selector']]:
                raise ValueError('jacoco-audit.all-production-exact-test')
            baseline = next(o for o in result['operations'] if o['label'] == 'BASELINE-TEST')
            if baseline['args'] != test['args'] or baseline['agent_option'] is not None:
                raise ValueError('jacoco-audit.baseline-operation')
            baseline_failure = (case_root / 'BASELINE-FAILING-TESTS.txt').read_text()
            if re.findall(r'^--- (.+)$', baseline_failure, re.M) != [c['test_selector']] or baseline_failure.splitlines()[1].split(':')[0].strip() != c['expected_failure_type']:
                raise ValueError('jacoco-audit.baseline-failure')
            if any(o['automatic_retries'] != 0 or o['elapsed_ms'] > 301000 or o['exit_code'] != 0 for o in result['operations']):
                raise ValueError('jacoco-audit.operation-cap-or-failure')
            before = json.loads((case_root / 'CLASSES-BEFORE.json').read_bytes())
            after = json.loads((case_root / 'CLASSES-AFTER.json').read_bytes())
            if before != after:
                raise ValueError('jacoco-audit.class-byte-drift')
            classes = json.loads((case_root / 'BOUND-CLASSINFO.json').read_bytes())
            if len(classes) != len(before) or len({r['name'] for r in classes}) != len(classes):
                raise ValueError('jacoco-audit.class-completeness')
            parsed = re.findall(r'^\s*\d+\s+\d+\s+(\d+)\s+\d+\s+\d+\s+class 0x([a-f0-9]{16}) ([A-Za-z0-9_$/-]+)$', (case_root / 'CLASSINFO.stdout').read_text(), re.M)
            if [(int(n), class_id, name) for n, class_id, name in parsed] != [(r['executable_lines'], r['class_id'], r['name']) for r in classes if r['analyzed']]:
                raise ValueError('jacoco-audit.classinfo-reconstruction')
            current_paths = sorted(str(p.relative_to(case_root / 'trusted-fixture' / result['compiled_root'])) for p in (case_root / 'trusted-fixture' / result['compiled_root']).rglob('*.class'))
            if current_paths != sorted(r['path'] for r in before):
                raise ValueError('jacoco-audit.class-inventory-completeness')
            for r in classes:
                actual = (case_root / 'trusted-fixture' / result['compiled_root'] / r['path']).read_bytes()
                access, methods, binary_name = binary_facts(actual)
                if binary_name != r['name'] or access != r['access_flags'] or methods != r['method_count'] or class_id(actual) != r['class_id']:
                    raise ValueError('jacoco-audit.independent-class-id-or-header')
                if not r['analyzed'] and not (access & 4096 and r['executable_lines'] is None and r.get('line_coverage_available') is False and r.get('analysis_omission')):
                    raise ValueError('jacoco-audit.unexplained-generated-omission')
                if sha((case_root / 'trusted-fixture' / result['compiled_root'] / r['path']).read_bytes()) != r['sha256'] or next(x for x in before if x['path'] == r['path'])['sha256'] != r['sha256']:
                    raise ValueError('jacoco-audit.compiled-bytes')
            for name in instrumentation['classes']:
                if name.replace('.', '/') not in {r['name'] for r in classes}:
                    raise ValueError('jacoco-audit.missing-top-level-type')
            sources = {}
            for s in projection['sources']:
                b = (case_root / 'buggy-java-only/corpus' / s['path']).read_bytes()
                if sha(b) != s['sha256'] or sha((case_root / 'trusted-fixture' / s['path']).read_bytes()) != s['sha256']:
                    raise ValueError('jacoco-audit.source-drift')
                sources[s['path']] = {**s, 'bytes': b}
            eb, xb = (case_root / 'coverage.exec').read_bytes(), (case_root / 'coverage.xml').read_bytes()
            if sha(eb) != result['coverage_exec_sha256'] or sha(xb) != result['coverage_xml_sha256']:
                raise ValueError('jacoco-audit.coverage-pin')
            execution = binder.execution_data(eb, classes)
            bound = binder.bind_report(xb, sources, instrumentation, classes, execution)
            failure = (case_root / 'trusted-fixture/failing_tests').read_bytes()
            if re.findall(r'^--- (.+)$', failure.decode(), re.M) != [c['test_selector']] or failure.decode().splitlines()[1].split(':')[0].strip() != c['expected_failure_type']:
                raise ValueError('jacoco-audit.failure-binding')
            out = {**bound, 'execution_class_binding': execution, 'coverage_exec_sha256': sha(eb), 'coverage_xml_sha256': sha(xb), 'failure_observation_sha256': sha(failure), 'source_tree_sha256': c['source_tree_sha256'], 'case_id': c['case_id'], 'provider_calls': 0, 'reference_label_reads': 0, 'authority_effect': 'none', 'open_questions_owner': 'G01-JACOCO-PROJECT-CAPACITY-R6.json'}
            data = (json.dumps(out, indent=2) + '\n').encode()
            save_exclusive(case_root / 'SOURCE-BOUND-COVERAGE.json', data)
            row.update(source_bound_failure=True, source_bound_coverage_sha256=sha(data), source_files_with_execution=bound['source_files_with_execution'], unique_executed_source_lines=bound['unique_executed_source_lines'])
        except (ValueError, OSError, KeyError, StopIteration) as e:
            row['error'] = str(e)[:240]
        rows.append(row)
    count = sum(r['source_bound_failure'] for r in rows)
    out = {'status': 'full16-jacoco-availability-qualified' if count >= 15 else 'full16-jacoco-availability-rejected', 'rows': rows, 'source_bound_failure_reproductions': count, 'expected': 16, 'freeze_sha256': sha(fb), 'provider_calls': 0, 'reference_label_reads': 0, 'authority_effect': 'none', 'claim_ceiling': 'All16 exposed fresh-fixture test-command-phase availability only; not test-exclusive causality, quality or superiority.', 'open_questions_owner': 'G01-JACOCO-PROJECT-CAPACITY-R6.json'}
    data = (json.dumps(out, indent=2) + '\n').encode()
    save_exclusive(root / 'CAPACITY-AUDIT.json', data)
    print(json.dumps({'status': out['status'], 'source_bound_failure_reproductions': count, 'rows': rows, 'sha256': sha(data)}))


if __name__ == '__main__':
    main()
