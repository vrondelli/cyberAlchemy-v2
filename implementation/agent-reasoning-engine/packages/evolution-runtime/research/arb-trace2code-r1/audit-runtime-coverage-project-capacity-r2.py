"""All16 terminal availability audit, no evaluator labels.
Open Questions: evidence/G01-RUNTIME-COVERAGE-PROJECT-CAPACITY-R2.json.
"""
import hashlib
import importlib.util
import json
import re
from pathlib import Path

def sha(b):
    return hashlib.sha256(b).hexdigest()

def main():
    here = Path(__file__).parent
    root = Path('/home/vlad_/are-benchmark-archive/g01-runtime-coverage-project-capacity-r2-20261006')
    freeze_bytes = (root / 'FREEZE.json').read_bytes()
    freeze = json.loads(freeze_bytes)
    for name, pin in freeze['source_sha256'].items():
        if sha((here / name).read_bytes()) != pin:
            raise ValueError('audit.source-drift')
    spec = importlib.util.spec_from_file_location('binder', here / 'bind-runtime-coverage-r1.py')
    binder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(binder)
    terminal = json.loads((root / 'CAMPAIGN-TERMINAL.json').read_bytes())
    if terminal['freeze_sha256'] != sha(freeze_bytes) or len(terminal['rows']) != 16 or len(freeze['cases']) != 16:
        raise ValueError('audit.all16-terminal')
    rows = []
    for c in freeze['cases']:
        case_root = root / c['case_id']
        sealed = next(r for r in terminal['rows'] if r['case_id'] == c['case_id'])
        row = {'case_id': c['case_id'], 'source_bound_failure': False, 'error': None}
        try:
            result_bytes = (case_root / 'RESULT.json').read_bytes()
            if sha(result_bytes) != sealed['result_sha256']:
                raise ValueError('audit.result-drift')
            result = json.loads(result_bytes)
            if result['status'] != 'terminal-coverage-execution-complete':
                raise ValueError(result['error'])
            projection = json.loads((case_root / 'buggy-java-only/RECEIPT.json').read_bytes())
            if projection['source_tree_sha256'] != c['source_tree_sha256']:
                raise ValueError('audit.source-tree')
            instrumentation = json.loads((case_root / 'INSTRUMENTATION.json').read_bytes())
            if (case_root / 'ALL-PRODUCTION-CLASSES.txt').read_text().splitlines() != instrumentation['classes'] or '-i' not in result['execution']['args']:
                raise ValueError('audit.all-class-explicit')
            sources = {}
            for s in projection['sources']:
                data = (case_root / 'buggy-java-only/corpus' / s['path']).read_bytes()
                if sha(data) != s['sha256'] or sha((case_root / 'trusted-fixture' / s['path']).read_bytes()) != s['sha256']:
                    raise ValueError('audit.source-drift')
                sources[s['path']] = {**s, 'bytes': data}
            xml_bytes = (case_root / 'trusted-fixture/coverage.xml').read_bytes()
            if sha(xml_bytes) != result['coverage_xml_sha256']:
                raise ValueError('audit.xml-drift')
            bound = binder.bind_coverage(xml_bytes, sources, instrumentation)
            failure = (case_root / 'trusted-fixture/failing_tests').read_bytes()
            if re.findall(r'^--- (.+)$', failure.decode(), re.M) != [c['test_selector']]:
                raise ValueError('audit.expected-failing-test')
            failure_type = failure.decode().splitlines()[1].split(':')[0].strip()
            if failure_type != c['expected_failure_type']:
                raise ValueError('audit.changed-failure-type')
            out = {**bound, 'case_id': c['case_id'], 'source_tree_sha256': c['source_tree_sha256'], 'coverage_xml_sha256': sha(xml_bytes),
                   'failure_observation_sha256': sha(failure), 'failure_type': failure_type, 'provider_calls': 0, 'reference_label_reads': 0,
                   'claim_ceiling': 'Source-bound executed lines; not fault responsibility or quality.', 'authority_effect': 'none', 'open_questions_owner': 'G01-RUNTIME-COVERAGE-PROJECT-CAPACITY-R2.json'}
            data = (json.dumps(out, indent=2) + '\n').encode()
            with (case_root / 'SOURCE-BOUND-COVERAGE.json').open('xb') as stream:
                stream.write(data)
            row.update(source_bound_failure=True, source_bound_coverage_sha256=sha(data), source_files_with_execution=bound['source_files_with_execution'], unique_executed_source_lines=bound['unique_executed_source_lines'])
        except (ValueError, OSError, KeyError) as e:
            row['error'] = str(e)[:240]
        rows.append(row)
    count = sum(r['source_bound_failure'] for r in rows)
    out = {'status': 'source-capacity-gate-passed' if count >= freeze['capacity_gate']['source_bound_failure_reproductions_at_least'] else 'source-capacity-gate-failed',
           'freeze_sha256': sha(freeze_bytes), 'expected': 16, 'source_bound_failure_reproductions': count, 'rows': rows,
           'provider_calls': 0, 'reference_label_reads': 0, 'automatic_retries': 0, 'authority_effect': 'none',
           'claim_ceiling': 'Full16 exposed multi-project availability only, not ranking, native ContextBench quality or superiority.', 'open_questions_owner': 'G01-RUNTIME-COVERAGE-PROJECT-CAPACITY-R2.json'}
    data = (json.dumps(out, indent=2) + '\n').encode()
    with (root / 'CAPACITY-AUDIT.json').open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': out['status'], 'source_bound_failure_reproductions': count, 'expected': 16, 'sha256': sha(data)}))

if __name__ == '__main__':
    main()
