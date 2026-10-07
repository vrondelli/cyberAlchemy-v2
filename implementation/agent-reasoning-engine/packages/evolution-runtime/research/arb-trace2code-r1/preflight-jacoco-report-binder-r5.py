"""Existing terminal executions only, no re-execution. Open Questions: G01-JACOCO-REPORT-BINDER-R5.json."""
import hashlib
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).parent
PARENT = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r4-20261006')
IDENTITY = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-class-identity-r5-20261006')
ROOT = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-report-binder-r5-20261006')


def sha(b):
    return hashlib.sha256(b).hexdigest()


def write(name, value):
    data = (json.dumps(value, indent=2) + '\n').encode()
    with (ROOT / name).open('xb') as f:
        f.write(data)
    return sha(data)


def main():
    if ROOT.exists():
        raise ValueError('no-overwrite')
    fb = (IDENTITY / 'FREEZE.json').read_bytes()
    freeze = json.loads(fb)
    for name, pin in freeze['source_sha256'].items():
        if sha((HERE / name).read_bytes()) != pin:
            raise ValueError('identity-source-drift')
    ROOT.mkdir(mode=0o700)
    cases = [c for c in freeze['cases'] if c['status'] == 'terminal-fixture' and (IDENTITY / (c['case_id'] + '-BOUND-CLASSINFO.json')).exists()]
    write('FREEZE.json', {'identity_freeze_sha256': sha(fb), 'cases': cases, 'source_sha256': {n: sha((HERE / n).read_bytes()) for n in ['bind-jacoco-r5.py', 'test_bind_jacoco_r5.py', Path(__file__).name]}, 'protocol_sha256': sha((HERE / '../../evidence/G01-JACOCO-REPORT-BINDER-R5.json').read_bytes()), 'claim_ceiling': 'Retained existing executions only; no new availability', 'authority_effect': 'none'})
    spec = importlib.util.spec_from_file_location('binder', HERE / 'bind-jacoco-r5.py')
    binder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(binder)
    rows = []
    for c in cases:
        row = {'case_id': c['case_id'], 'reconstructed': False, 'error': None}
        try:
            parent = PARENT / c['case_id']
            rb = (parent / 'RESULT.json').read_bytes()
            if sha(rb) != c['result_sha256']:
                raise ValueError('parent-result-drift')
            result = json.loads(rb)
            if result['status'] != 'terminal-jacoco-execution-complete':
                row['status'] = 'no-prior-execution-no-replay'
                rows.append(row)
                continue
            cb = (IDENTITY / (c['case_id'] + '-BOUND-CLASSINFO.json')).read_bytes()
            classes = json.loads(cb)['rows']
            for cls in classes:
                if sha((parent / 'trusted-fixture' / result['compiled_root'] / cls['path']).read_bytes()) != cls['sha256']:
                    raise ValueError('compiled-byte-drift')
            projection = json.loads((parent / 'buggy-java-only/RECEIPT.json').read_bytes())
            sources = {}
            for s in projection['sources']:
                b = (parent / 'buggy-java-only/corpus' / s['path']).read_bytes()
                if sha(b) != s['sha256'] or sha((parent / 'trusted-fixture' / s['path']).read_bytes()) != s['sha256']:
                    raise ValueError('source-drift')
                sources[s['path']] = {**s, 'bytes': b}
            eb, xb = (parent / 'coverage.exec').read_bytes(), (parent / 'coverage.xml').read_bytes()
            if sha(eb) != result['coverage_exec_sha256'] or sha(xb) != result['coverage_xml_sha256']:
                raise ValueError('execution-or-report-drift')
            instrumentation = json.loads((parent / 'INSTRUMENTATION.json').read_bytes())
            execution = binder.execution_data(eb, classes)
            bound = binder.bind_report(xb, sources, instrumentation, classes, execution)
            pin = write(c['case_id'] + '-BOUND.json', {**bound, 'execution': execution, 'parent_result_sha256': sha(rb), 'identity_rows_sha256': sha(cb), 'authority_effect': 'none'})
            row.update(reconstructed=True, bound_sha256=pin, generated_execution_records=len(bound['generated_execution_observations_not_source_lines']), unique_executed_source_lines=bound['unique_executed_source_lines'])
        except (ValueError, OSError, KeyError) as e:
            row['error'] = str(e)[:240]
        rows.append(row)
    out = {'status': 'terminal-retained-report-binder-preflight', 'rows': rows, 'reconstructed_existing_executions': sum(r['reconstructed'] for r in rows), 'errors': sum(r['error'] is not None for r in rows), 'new_test_executions': 0, 'provider_calls': 0, 'reference_label_reads': 0, 'authority_effect': 'none', 'claim_ceiling': 'Old terminal byte/source/exec/report reconstruction only; generated-method live probes still untested. No fresh availability, ranking or superiority.', 'open_questions_owner': 'G01-JACOCO-REPORT-BINDER-R5.json'}
    pin = write('RESULT.json', out)
    print(json.dumps(out | {'sha256': pin}))


if __name__ == '__main__':
    main()
