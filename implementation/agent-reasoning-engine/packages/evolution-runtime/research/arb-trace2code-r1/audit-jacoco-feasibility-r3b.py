"""Reconstruct both known structural failures, never a quality evaluation.
Open Questions: evidence/G01-JACOCO-FEASIBILITY-R3B.json.
"""
import hashlib
import importlib.util
import json
import re
from pathlib import Path


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    here = Path(__file__).parent
    root = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-feasibility-r3b-20261006')
    fb = (root / 'FREEZE.json').read_bytes()
    freeze = json.loads(fb)
    for name, pin in freeze['source_sha256'].items():
        if sha((here / name).read_bytes()) != pin:
            raise ValueError('jacoco-audit.source-drift')
    if sha((here / '../../evidence/G01-JACOCO-FEASIBILITY-R3B.json').read_bytes()) != freeze['protocol_sha256']:
        raise ValueError('jacoco-audit.protocol-drift')
    spec = importlib.util.spec_from_file_location('jacoco_binder', here / 'bind-jacoco-r3b.py')
    binder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(binder)
    terminal = json.loads((root / 'CAMPAIGN-TERMINAL.json').read_bytes())
    if terminal['freeze_sha256'] != sha(fb) or len(terminal['rows']) != 2:
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
            parent_bytes = (Path(c['prepared_root']) / 'RESULT.json').read_bytes()
            parent_result = json.loads(parent_bytes)
            if sha(parent_bytes) != c['parent_result_sha256'] or not any(o['label'] == 'COMPILE' and o['exit_code'] == 0 for o in parent_result['operations']) or any(o['label'] == 'TEST' for o in parent_result['operations']):
                raise ValueError('jacoco-audit.prepared-no-test')
            before = json.loads((case_root / 'CLASSES-BEFORE.json').read_bytes())
            after = json.loads((case_root / 'CLASSES-AFTER.json').read_bytes())
            if before != after:
                raise ValueError('jacoco-audit.class-byte-drift')
            classes = json.loads((case_root / 'BOUND-CLASSINFO.json').read_bytes())
            if len(classes) != len(before) or len({r['name'] for r in classes}) != len(classes):
                raise ValueError('jacoco-audit.class-completeness')
            parsed = re.findall(r'^\s*\d+\s+\d+\s+(\d+)\s+\d+\s+\d+\s+class 0x([a-f0-9]{16}) ([A-Za-z0-9_$/-]+)$', (case_root / 'CLASSINFO.stdout').read_text(), re.M)
            if [(int(n), class_id, name) for n, class_id, name in parsed] != [(r['executable_lines'], r['class_id'], r['name']) for r in classes if r['class_id'] is not None]:
                raise ValueError('jacoco-audit.classinfo-reconstruction')
            current_paths = sorted(str(p.relative_to(case_root / 'trusted-fixture' / result['compiled_root'])) for p in (case_root / 'trusted-fixture' / result['compiled_root']).rglob('*.class'))
            if current_paths != sorted(r['path'] for r in before):
                raise ValueError('jacoco-audit.class-inventory-completeness')
            for r in classes:
                if r['class_id'] is None and not (r.get('empty_synthetic') and r.get('method_count') == 0 and r.get('analysis_omission')):
                    raise ValueError('jacoco-audit.unexplained-omission')
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
            out = {**bound, 'execution_class_binding': execution, 'coverage_exec_sha256': sha(eb), 'coverage_xml_sha256': sha(xb), 'failure_observation_sha256': sha(failure), 'source_tree_sha256': c['source_tree_sha256'], 'case_id': c['case_id'], 'provider_calls': 0, 'reference_label_reads': 0, 'authority_effect': 'none', 'open_questions_owner': 'G01-JACOCO-FEASIBILITY-R3B.json'}
            data = (json.dumps(out, indent=2) + '\n').encode()
            with (case_root / 'SOURCE-BOUND-COVERAGE.json').open('xb') as f:
                f.write(data)
            row.update(source_bound_failure=True, source_bound_coverage_sha256=sha(data), source_files_with_execution=bound['source_files_with_execution'], unique_executed_source_lines=bound['unique_executed_source_lines'])
        except (ValueError, OSError, KeyError, StopIteration) as e:
            row['error'] = str(e)[:240]
        rows.append(row)
    count = sum(r['source_bound_failure'] for r in rows)
    out = {'status': 'both-structural-failures-feasibility-passed' if count == 2 else 'jacoco-feasibility-rejected', 'rows': rows, 'source_bound_failure_reproductions': count, 'expected': 2, 'freeze_sha256': sha(fb), 'provider_calls': 0, 'reference_label_reads': 0, 'authority_effect': 'none', 'claim_ceiling': 'Two exposed known-failure feasibility cases only; not full16 availability, quality or superiority.', 'open_questions_owner': 'G01-JACOCO-FEASIBILITY-R3B.json'}
    data = (json.dumps(out, indent=2) + '\n').encode()
    with (root / 'FEASIBILITY-AUDIT.json').open('xb') as f:
        f.write(data)
    print(json.dumps({'status': out['status'], 'source_bound_failure_reproductions': count, 'rows': rows, 'sha256': sha(data)}))


if __name__ == '__main__':
    main()
