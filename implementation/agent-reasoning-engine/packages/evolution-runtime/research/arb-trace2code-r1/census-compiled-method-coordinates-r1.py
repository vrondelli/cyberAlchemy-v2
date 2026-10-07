"""No model, labels, compilation or execution. Full retained runtime census.
Open Questions: evidence/G01-COMPILED-METHOD-COORDINATES-R1.json.
"""
import hashlib
import importlib.util
import json
import time
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).parent
INDEX = Path('/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007')
RUNTIME = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007')
BOUND = Path('/home/vlad_/are-benchmark-archive/g01-jacoco-source-binding-r7-20261007')
OUT = Path('/home/vlad_/are-benchmark-archive/g01-compiled-method-coordinate-r1-20261007')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_module(name, filename):
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def read(path):
    return json.loads(path.read_bytes())


def main():
    if OUT.exists():
        raise ValueError('coordinate-census.no-replay')
    coords = load_module('coords', 'compiled-method-coordinates-r1.py')
    helper = load_module('retained_helper', 'preflight-jacoco-source-binding-r7.py')
    pins = {
        INDEX / 'RESULT.json': '4476e7072b6117bc7c7c8bae481f85e1496e8c7b535dfcd520ef46b3b2443f56',
        INDEX / 'AUDIT.json': '040b7af9ffa1ec7b8df6514be0f864fc1f51063dc6cc2fe626af7b860fe5c640',
        RUNTIME / 'CAMPAIGN-TERMINAL.json': '4f120aeeccfa2953cc284bba0d915c87c492714936dde56898491588b3599a79',
        BOUND / 'RESULT.json': 'dd46b26e1baac18c80c8fcc7533b547c29282f889e6cd6804b1c7b4db231c15f'
    }
    for path, pin in pins.items():
        if sha(path.read_bytes()) != pin:
            raise ValueError('coordinate-census.parent-drift')
    source = read(INDEX / 'RESULT.json')
    bound = {r['case_id']: r for r in read(BOUND / 'RESULT.json')['rows']}
    terminal = {r['case_id']: r for r in read(RUNTIME / 'CAMPAIGN-TERMINAL.json')['rows']}
    assert len(source['rows']) == len(bound) == len(terminal) == 16
    protocol = HERE / '../../evidence/G01-COMPILED-METHOD-COORDINATES-R1.json'
    files = ['compiled-method-coordinates-r1.py', 'test_compiled_method_coordinates_r1.py',
             'census-compiled-method-coordinates-r1.py', 'preflight-jacoco-source-binding-r7.py']
    freeze = {'source_pins': {n: sha((HERE / n).read_bytes()) for n in files},
              'input_pins': {str(p): pin for p, pin in pins.items()},
              'protocol_sha256': sha(protocol.read_bytes()), 'cases': [],
              'authority_effect': 'none', 'open_questions_owner': protocol.name}
    for row in source['rows']:
        case_id = row['case_id']
        paths = [INDEX / case_id / 'PARSER-OUTPUT.jsonl', RUNTIME / case_id / 'RESULT.json']
        if bound[case_id]['source_bound_failure']:
            paths += [RUNTIME / case_id / n for n in ['BOUND-CLASSINFO.json', 'CLASSES-BEFORE.json', 'INSTRUMENTATION.json', 'coverage.xml']]
            paths += [BOUND / case_id / 'SOURCE-BOUND-COVERAGE.json']
        freeze['cases'].append({'case_id': case_id, 'input_pins': {str(p): sha(p.read_bytes()) for p in paths}})
    OUT.mkdir(mode=0o700)

    def save(name, value):
        raw = (json.dumps(value, separators=(',', ':')) + '\n').encode()
        helper.save_exclusive(OUT / name, raw)
        return sha(raw)

    freeze_hash = save('FREEZE.json', freeze)
    start, rows = time.monotonic(), []
    for source_row in source['rows']:
        case_id = source_row['case_id']
        case = RUNTIME / case_id
        result_bytes = (case / 'RESULT.json').read_bytes()
        assert sha(result_bytes) == terminal[case_id]['result_sha256']
        result = json.loads(result_bytes)
        index_bytes = (INDEX / case_id / 'PARSER-OUTPUT.jsonl').read_bytes()
        assert sha(index_bytes) == source_row['parser_output_sha256']
        records = {r['path']: r for r in map(json.loads, index_bytes.splitlines())}
        row = {'case_id': case_id, 'source_methods': source_row['totals']['methods'],
               'runtime_available': bound[case_id]['source_bound_failure'], 'counts': {}, 'methods': []}
        if not row['runtime_available']:
            row['unavailable_reason'] = bound[case_id]['error']
        else:
            coverage_bytes = (BOUND / case_id / 'SOURCE-BOUND-COVERAGE.json').read_bytes()
            assert sha(coverage_bytes) == bound[case_id]['source_bound_coverage_sha256']
            coverage = json.loads(coverage_bytes)
            for r in coverage['rows']:
                raw = (case / 'buggy-java-only/corpus' / r['path']).read_bytes()
                assert sha(raw) == r['source_sha256'] == records[r['path']]['source_sha256']
            xml = (case / 'coverage.xml').read_bytes()
            assert sha(xml) == result['coverage_xml_sha256']
            assert b'<!ENTITY' not in xml
            xml_classes = {c.get('name'): c for p in ET.fromstring(xml).findall('package') for c in p.findall('class')}
            classes = read(case / 'BOUND-CLASSINFO.json')
            before = {c['path']: c for c in read(case / 'CLASSES-BEFORE.json')}
            assert len(before) == len(classes)
            for cls in classes:
                raw = (case / 'trusted-fixture' / result['compiled_root'] / cls['path']).read_bytes()
                assert sha(raw) == cls['sha256'] == before[cls['path']]['sha256']
                assert helper.class_id(raw) == cls['class_id']
                parsed = coords.parse_class(raw)
                assert parsed['name'] == cls['name'] and parsed['access_flags'] == cls['access_flags']
                assert len(parsed['methods']) == cls['method_count']
                xml_class = xml_classes.get(cls['name'])
                xml_methods = {} if xml_class is None else {(m.get('name'), m.get('desc')): m for m in xml_class.findall('method')}
                if xml_class is not None:
                    assert xml_class.get('sourcefilename') == parsed['source_filename']
                    assert len(xml_methods) == len(xml_class.findall('method'))
                package = cls['name'].rpartition('/')[0]
                path = result['source_root'] + '/' + (package + '/' if package else '') + str(parsed['source_filename'])
                record = records.get(path)
                compiled_ids = {(m['name'], m['descriptor']) for m in parsed['methods']}
                assert set(xml_methods).issubset(compiled_ids)
                for method in parsed['methods']:
                    xml_method = xml_methods.get((method['name'], method['descriptor']))
                    counters = {} if xml_method is None else {c.get('type'): {'covered': int(c.get('covered')), 'missed': int(c.get('missed'))} for c in xml_method.findall('counter')}
                    assert all(v['covered'] >= 0 and v['missed'] >= 0 for v in counters.values())
                    association = {'status': 'source-record-unavailable', 'source_method_id': None} if record is None else coords.associate_method(cls['name'], method, record)
                    entry = {'class_name': cls['name'], 'class_sha256': cls['sha256'], 'class_id': cls['class_id'],
                             'path': path if record else None, **method, **association,
                             'reported': xml_method is not None, 'reported_counters': counters,
                             'reported_positive': counters.get('INSTRUCTION', {}).get('covered', 0) > 0,
                             'test_exclusive': False, 'type_attributed_signature': False}
                    row['methods'].append(entry)
                    row['counts'][entry['status']] = row['counts'].get(entry['status'], 0) + 1
            row['compiled_methods'] = len(row['methods'])
            row['reported_positive_methods'] = sum(m['reported_positive'] for m in row['methods'])
            row['associated_reported_positive_methods'] = sum(m['reported_positive'] and m['source_method_id'] is not None for m in row['methods'])
        digest = save(case_id + '.json', row)
        summary = {k: v for k, v in row.items() if k != 'methods'}
        summary['receipt_sha256'] = digest
        rows.append(summary)
        print(json.dumps(summary), flush=True)
    for path, pin in pins.items():
        assert sha(path.read_bytes()) == pin
    for c in freeze['cases']:
        for path, pin in c['input_pins'].items():
            assert sha(Path(path).read_bytes()) == pin
    for n, pin in freeze['source_pins'].items():
        assert sha((HERE / n).read_bytes()) == pin
    assert sha(protocol.read_bytes()) == freeze['protocol_sha256']
    output = {'status': 'all16-retained-compiled-method-coordinate-census-complete', 'rows': rows,
              'freeze_sha256': freeze_hash, 'elapsed_ms': round((time.monotonic() - start) * 1000),
              'provider_calls': 0, 'reference_label_reads': 0, 'execution_replays': 0,
              'authority_effect': 'none', 'type_attributed_signature': False,
              'claim_ceiling': 'Compiled identity and conservative source-coordinate association only, no accuracy or superiority',
              'open_questions_owner': protocol.name}
    print(json.dumps({'result_sha256': save('RESULT.json', output), **output}), flush=True)


if __name__ == '__main__':
    main()
