"""Independent existing-JDK javap descriptor/debug-line check on every class.
Open Questions: evidence/G01-COMPILED-METHOD-COORDINATES-R1.json.
"""
import hashlib
import importlib.util
import json
import re
import subprocess
import time
from pathlib import Path
HERE = Path(__file__).parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g01-compiled-method-coordinate-r1b-20261007')
INPUT = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007')
JDK = Path('/home/vlad_/.local/share/are-toolchains/defects4j-v3/jdk-11.0.32.1+1')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read(path):
    return json.loads(path.read_bytes())


def native_methods(text):
    out, current, in_lines = [], None, False
    for line in text.splitlines():
        match = re.fullmatch(r'\s+descriptor: (\(.*)', line)
        if match:
            current = {'descriptor': match[1], 'line_table': []}
            out.append(current)
            in_lines = False
        elif line.strip() == 'LineNumberTable:':
            assert current is not None
            in_lines = True
        elif in_lines:
            match = re.fullmatch(r'\s+line (\d+): (\d+)', line)
            if match:
                current['line_table'].append({'start_pc': int(match[2]), 'line': int(match[1])})
            else:
                in_lines = False
    return out


def main():
    spec = importlib.util.spec_from_file_location('storage', HERE / 'preflight-jacoco-source-binding-r7.py')
    storage = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(storage)
    freeze = read(ROOT / 'FREEZE.json')
    result = read(ROOT / 'RESULT.json')
    assert result['freeze_sha256'] == sha((ROOT / 'FREEZE.json').read_bytes())
    for n, pin in freeze['source_pins'].items():
        assert sha((HERE / n).read_bytes()) == pin
    for path, pin in freeze['input_pins'].items():
        assert sha(Path(path).read_bytes()) == pin
    for row in freeze['cases']:
        for path, pin in row['input_pins'].items():
            assert sha(Path(path).read_bytes()) == pin
    paths = [JDK / 'bin/javap', JDK / 'lib/modules', Path(__file__)]
    audit_freeze = {'pins': {str(p): sha(p.read_bytes()) for p in paths},
                    'result_sha256': sha((ROOT / 'RESULT.json').read_bytes()),
                    'scope': 'All compiled descriptors and debug line tables via independent JDK javap; source association is conservative coordinate evidence, not Java type attribution.',
                    'authority_effect': 'none', 'open_questions_owner': 'G01-COMPILED-METHOD-COORDINATES-R1.json'}

    def save(name, value):
        raw = (json.dumps(value, separators=(',', ':')) + '\n').encode()
        storage.save_exclusive(ROOT / name, raw)
        return sha(raw)

    freeze_hash = save('AUDIT-FREEZE.json', audit_freeze)
    start, rows = time.monotonic(), []
    for row in result['rows']:
        raw = (ROOT / (row['case_id'] + '.json')).read_bytes()
        assert sha(raw) == row['receipt_sha256']
        case = json.loads(raw)
        if not row['runtime_available']:
            assert not case['methods']
            rows.append({'case_id': row['case_id'], 'runtime_available': False, 'methods_checked': 0})
            continue
        prior = read(INPUT / row['case_id'] / 'RESULT.json')
        classes = read(INPUT / row['case_id'] / 'BOUND-CLASSINFO.json')
        expected = [{'descriptor': m['descriptor'], 'line_table': m['line_table']} for m in case['methods']]
        observed, operation_ms = [], 0
        for offset in range(0, len(classes), 64):
            selected = classes[offset:offset + 64]
            files = [INPUT / row['case_id'] / 'trusted-fixture' / prior['compiled_root'] / c['path'] for c in selected]
            for path, cls in zip(files, selected):
                assert sha(path.read_bytes()) == cls['sha256']
            tick = time.monotonic()
            proc = subprocess.run([str(JDK / 'bin/javap'), '-p', '-s', '-l', *map(str, files)],
                                  capture_output=True, timeout=120, check=True)
            operation_ms += round((time.monotonic() - tick) * 1000)
            assert not proc.stderr
            storage.save_exclusive(ROOT / (row['case_id'] + f'.javap-{offset}.txt'), proc.stdout)
            observed.extend(native_methods(proc.stdout.decode('utf8', errors='strict')))
        assert observed == expected, 'javap descriptor/debug-table mismatch: ' + row['case_id']
        rows.append({'case_id': row['case_id'], 'runtime_available': True,
                     'compiled_classes_checked': len(classes), 'methods_checked': len(expected),
                     'native_operation_ms': operation_ms})
        print(json.dumps(rows[-1]), flush=True)
    for path, pin in audit_freeze['pins'].items():
        assert sha(Path(path).read_bytes()) == pin
    assert sha((ROOT / 'RESULT.json').read_bytes()) == audit_freeze['result_sha256']
    audit = {'status': 'all-retained-compiled-descriptors-debug-lines-native-audit-passed', 'rows': rows,
             'audit_freeze_sha256': freeze_hash, 'result_sha256': audit_freeze['result_sha256'],
             'elapsed_ms': round((time.monotonic() - start) * 1000), 'provider_calls': 0,
             'reference_label_reads': 0, 'subject_execution_replays': 0,
             'scope': audit_freeze['scope'], 'authority_effect': 'none',
             'open_questions_owner': 'G01-COMPILED-METHOD-COORDINATES-R1.json'}
    print(json.dumps({'audit_sha256': save('AUDIT.json', audit), **audit}), flush=True)


if __name__ == '__main__':
    main()
