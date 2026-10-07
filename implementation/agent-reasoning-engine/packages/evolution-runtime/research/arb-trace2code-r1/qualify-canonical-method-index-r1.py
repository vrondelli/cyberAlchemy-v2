"""All16 source-only AST qualification, never reference/provider access.
Open Questions: evidence/G01-CANONICAL-METHOD-INDEX-R1.json.
"""
import json
import os
import runpy
import subprocess
import time
from pathlib import Path

HERE = Path(__file__).parent
COMMON = runpy.run_path(str(HERE/'build-runtime-linked-reader-r1.py'))
sha, save, encoded = COMMON['sha'], COMMON['save'], COMMON['encoded']
check_spans = runpy.run_path(str(HERE/'test_canonical_method_index_r1.py'))['check_spans']
INPUT = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007')
OUTPUT = INPUT.with_name('g01-canonical-method-index-r1-20261007')
JDK = Path('/home/vlad_/.local/share/are-toolchains/defects4j-v3/jdk-11.0.32.1+1')
PROTOCOL = HERE/'../../evidence/G01-CANONICAL-METHOD-INDEX-R1.json'


def main():
    started = time.monotonic()
    if OUTPUT.exists():
        raise ValueError('method-index.no-overwrite')
    freeze = COMMON['read_pinned'](INPUT/'FREEZE.json', '6d7da5657efb4a5d70cc109380bd714c6f0eb60971c61ed9c31ceee62c69723a')
    terminal = COMMON['read_pinned'](INPUT/'CAMPAIGN-TERMINAL.json', '4f120aeeccfa2953cc284bba0d915c87c492714936dde56898491588b3599a79')
    terminals = {r['case_id']: r for r in terminal['rows']}
    if len(freeze['cases']) != len(terminals) or len(terminals) != 16:
        raise ValueError('method-index.full16')
    for name, pin in freeze['source_sha256'].items():
        if sha((HERE/name).read_bytes()) != pin:
            raise ValueError('method-index.original-source-drift')
    case_pins, manifests = [], {}
    for case in freeze['cases']:
        cid = case['case_id']
        result = COMMON['read_pinned'](INPUT/cid/'RESULT.json', terminals[cid]['result_sha256'])
        ib, rb = [(INPUT/cid/name).read_bytes() for name in ['INSTRUMENTATION.json', 'buggy-java-only/RECEIPT.json']]
        instrumentation, receipt = json.loads(ib), json.loads(rb)
        sources = {s['path']: s for s in receipt['sources']}
        if receipt['source_tree_sha256'] != case['source_tree_sha256'] or instrumentation['source_root'] != result['source_root']:
            raise ValueError('method-index.source-tree')
        production = sorted(instrumentation['rows'], key=lambda r: r['path'])
        if len(production) != instrumentation['production_source_files'] or len({r['path'] for r in production}) != len(production):
            raise ValueError('method-index.production-completeness')
        for source in production:
            path = source['path']
            raw = (INPUT/cid/'buggy-java-only/corpus'/path).read_bytes()
            if '\n' in path or '\r' in path or not path.startswith(instrumentation['source_root']+'/') or sha(raw) != source['source_sha256'] or sha(raw) != sources[path]['sha256']:
                raise ValueError('method-index.production-source-binding')
        manifests[cid] = production
        case_pins.append({'case_id': cid, 'source_tree_sha256': case['source_tree_sha256'],
                          'instrumentation_sha256': sha(ib), 'projection_receipt_sha256': sha(rb), 'production_sources': len(production)})
    OUTPUT.mkdir(mode=0o700)
    captured = {'status': 'frozen-before-parser', 'cases': case_pins,
                'source_sha256': {name: sha((HERE/name).read_bytes()) for name in
                                  ['CanonicalMethodIndexR1.java', 'qualify-canonical-method-index-r1.py', 'test_canonical_method_index_r1.py', 'build-runtime-linked-reader-r1.py']},
                'jdk_sha256': {str(JDK/name): sha((JDK/name).read_bytes()) for name in ['bin/java', 'lib/modules']},
                'protocol_sha256': sha(PROTOCOL.read_bytes()), 'source_manifest_sha256': sha(encoded(manifests)),
                'parser_heap_cap_mib': 1024, 'per_case_timeout_s': 300, 'automatic_retries': 0,
                'provider_calls': 0, 'reference_label_reads': 0, 'authority_effect': 'none', 'open_questions_owner': 'G01-CANONICAL-METHOD-INDEX-R1.json'}
    save(OUTPUT/'FREEZE.json', encoded(captured)+b'\n')
    save(OUTPUT/'SOURCE-MANIFEST.json', encoded(manifests)+b'\n')
    save(OUTPUT/'PROTOCOL.json', PROTOCOL.read_bytes())
    save(OUTPUT/'STARTED.json', encoded({'pid': os.getpid(), 'freeze_sha256': sha((OUTPUT/'FREEZE.json').read_bytes())})+b'\n')
    rows = []
    for case in case_pins:
        cid = case['case_id']
        for name, pin in captured['source_sha256'].items():
            if sha((HERE/name).read_bytes()) != pin:
                raise ValueError('method-index.source-drift-before-parser')
        directory = OUTPUT/cid
        directory.mkdir(mode=0o700)
        command = [str(JDK/'bin/java'), '-Xmx1024m', '--add-modules', 'jdk.compiler', str(HERE/'CanonicalMethodIndexR1.java'), str(INPUT/cid/'buggy-java-only/corpus')]
        source_rows = manifests[cid]
        save(directory/'STARTED.json', encoded({'command': command, 'production_sources': len(source_rows)})+b'\n')
        begin = time.monotonic()
        error, completed = None, None
        with (directory/'PARSER-OUTPUT.jsonl').open('xb') as stdout, (directory/'PARSER-STDERR.txt').open('xb') as stderr:
            try:
                completed = subprocess.run(command, input=('\n'.join(r['path'] for r in source_rows)+'\n').encode(),
                                           stdout=stdout, stderr=stderr, timeout=300, check=False)
            except subprocess.TimeoutExpired:
                error = 'parser-timeout'
            stdout.flush(); os.fsync(stdout.fileno()); stderr.flush(); os.fsync(stderr.fileno())
        output = (directory/'PARSER-OUTPUT.jsonl').read_bytes()
        totals = {'classes': 0, 'methods': 0, 'calls': 0, 'abstract_declarations': 0, 'method_spans_gt_32000_bytes': 0,
                  'maximum_method_span_utf8_bytes': 0, 'unavailable_spans': 0, 'unavailable_reference_spans': 0,
                  'unavailable_declaration_spans': 0}
        failures, parsed = [], []
        try:
            if completed is None or completed.returncode != 0:
                raise ValueError(error or 'parser-process-failed')
            parsed = [json.loads(line) for line in output.splitlines()]
            if [r['path'] for r in parsed] != [r['path'] for r in source_rows]:
                raise ValueError('parser-source-denominator')
            for record, source in zip(parsed, source_rows, strict=True):
                raw = (INPUT/cid/'buggy-java-only/corpus'/source['path']).read_bytes()
                if sha(raw) != source['source_sha256'] or record.get('source_sha256') != sha(raw) or record.get('source_bytes') != len(raw):
                    raise ValueError('parser-source-identity')
                if record['status'] != 'parsed':
                    failures.append({'path': record['path'], 'status': record['status'], 'errors': record.get('errors', []), 'unavailable_spans': record.get('unavailable_spans')})
                check_spans(record, raw)
                entities = {r['entity_id']: r for r in record.get('classes', [])+record.get('methods', [])}
                if len(entities) != len(record.get('classes', []))+len(record.get('methods', [])):
                    raise ValueError('parser.entity-duplicate')
                for name in ['classes', 'methods', 'calls']:
                    totals[name] += len(record.get(name, []))
                totals['unavailable_spans'] += record.get('unavailable_spans', 0)
                totals['unavailable_reference_spans'] += record.get('unavailable_reference_spans', 0)
                totals['unavailable_declaration_spans'] += record.get('unavailable_declaration_spans', 0)
                for method in record.get('methods', []):
                    span = method['span']
                    if span['complete']:
                        parent = entities[method['owner_class_id']]['span']
                        if parent['complete'] and not parent['start_utf8'] <= span['start_utf8'] <= span['end_utf8'] <= parent['end_utf8']:
                            raise ValueError('parser.method-containment')
                        size = span['end_utf8']-span['start_utf8']
                        totals['maximum_method_span_utf8_bytes'] = max(totals['maximum_method_span_utf8_bytes'], size)
                        totals['method_spans_gt_32000_bytes'] += int(size > 32000)
                    totals['abstract_declarations'] += int(not method['has_body'])
                for call in record.get('calls', []):
                    if call['resolution'] != ('unresolved-syntactic-reference' if call['span']['complete'] else 'unavailable-source-position'):
                        raise ValueError('parser.false-resolution')
        except (ValueError, KeyError, UnicodeError) as failure:
            error = str(failure)[:120]
        row = {'case_id': cid, 'qualified': not error and not failures and len(parsed) == len(source_rows),
               'error': error, 'expected_sources': len(source_rows), 'accounted_sources': len(parsed),
               'parser_failures': failures, 'totals': totals, 'parser_elapsed_ms': round((time.monotonic()-begin)*1000),
               'parser_output_sha256': sha(output), 'parser_stderr_sha256': sha((directory/'PARSER-STDERR.txt').read_bytes())}
        save(directory/'RESULT.json', encoded(row)+b'\n'); rows.append(row)
        print(json.dumps({'case_id': cid, 'qualified': row['qualified'], 'sources': row['accounted_sources'], 'methods': totals['methods'], 'failures': len(failures), 'error': error}), flush=True)
    result = {'status': 'all16-canonical-method-index-qualified' if all(r['qualified'] for r in rows) else 'all16-canonical-method-index-rejected',
              'cases': 16, 'qualified_cases': sum(r['qualified'] for r in rows), 'rows': rows,
              'elapsed_ms': round((time.monotonic()-started)*1000), 'freeze_sha256': sha((OUTPUT/'FREEZE.json').read_bytes()),
              'provider_calls': 0, 'reference_label_reads': 0, 'runtime_method_binding': False,
              'resolved_call_graph': False, 'tokenizer_admitted': False, 'authority_effect': 'none',
              'claim_ceiling': 'Exact source-method syntax index only; no runtime method execution, semantic graph, native quality or superiority',
              'open_questions_owner': 'G01-CANONICAL-METHOD-INDEX-R1.json'}
    save(OUTPUT/'RESULT.json', encoded(result)+b'\n')
    print(json.dumps({'status': result['status'], 'qualified_cases': result['qualified_cases'], 'elapsed_ms': result['elapsed_ms']}), flush=True)


if __name__ == '__main__':
    main()
