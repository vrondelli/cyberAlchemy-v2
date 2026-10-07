"""Independent source/offset/containment audit, no Java parser/checker imported.
Open Questions: evidence/G01-CANONICAL-METHOD-INDEX-R1.json.
"""
import json
import runpy
from pathlib import Path
HERE = Path(__file__).parent
STORAGE = runpy.run_path(str(HERE/'build-runtime-linked-reader-r1.py'))
sha, save, encoded = STORAGE['sha'], STORAGE['save'], STORAGE['encoded']
ROOT = Path('/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007')
INPUT = ROOT.with_name('g01-jacoco-project-capacity-r6-20261007')


def coordinates(text):
    offsets, lines, byte, line, previous = [0], [1], 0, 1, ''
    for char in text:
        start_line = line
        if char == '\r' or char == '\n' and previous != '\r':
            line += 1
        if ord(char) > 65535:
            offsets.append(None)
            lines.append(start_line)
        byte += len(char.encode('utf8'))
        offsets.append(byte)
        lines.append(line)
        previous = char
    return offsets, lines


def main():
    result = json.loads((ROOT/'RESULT.json').read_bytes())
    freeze = STORAGE['read_pinned'](ROOT/'FREEZE.json', result['freeze_sha256'])
    for name, pin in freeze['source_sha256'].items():
        if sha((HERE/name).read_bytes()) != pin:
            raise ValueError('method-audit.source-drift')
    for path, pin in freeze['jdk_sha256'].items():
        if sha(Path(path).read_bytes()) != pin:
            raise ValueError('method-audit.jdk-drift')
    # Original frozen writer hashes encoded(manifests), then writes exactly one LF.
    # Verify that exact representation, not arbitrary whitespace normalization or a refreshed pin.
    manifest_bytes = (ROOT/'SOURCE-MANIFEST.json').read_bytes()
    if not manifest_bytes.endswith(b'\n') or sha(manifest_bytes[:-1]) != freeze['source_manifest_sha256']:
        raise ValueError('method-audit.original-manifest-payload-plus-lf')
    manifests = json.loads(manifest_bytes)
    if len(result['rows']) != len(freeze['cases']) or len(result['rows']) != 16:
        raise ValueError('method-audit.full16')
    totals = {'sources': 0, 'classes': 0, 'methods': 0, 'calls': 0, 'unavailable_references': 0, 'bodyless_declarations': 0,
              'method_spans_gt_32000_bytes': 0, 'maximum_method_span_utf8_bytes': 0}
    rows = []
    for case, recorded in zip(freeze['cases'], result['rows'], strict=True):
        cid = case['case_id']
        if recorded['case_id'] != cid or not recorded['qualified']:
            raise ValueError('method-audit.case-not-qualified')
        ib = (INPUT/cid/'INSTRUMENTATION.json').read_bytes()
        if sha(ib) != case['instrumentation_sha256']:
            raise ValueError('method-audit.instrumentation-drift')
        instrumentation = {s['path']: s for s in json.loads(ib)['rows']}
        data = (ROOT/cid/'PARSER-OUTPUT.jsonl').read_bytes()
        if sha(data) != recorded['parser_output_sha256'] or sha((ROOT/cid/'PARSER-STDERR.txt').read_bytes()) != recorded['parser_stderr_sha256']:
            raise ValueError('method-audit.output-drift')
        entries = [json.loads(line) for line in data.splitlines()]
        if [r['path'] for r in entries] != [s['path'] for s in manifests[cid]]:
            raise ValueError('method-audit.source-denominator')
        count = 0
        for record, source in zip(entries, manifests[cid], strict=True):
            raw = (INPUT/cid/'buggy-java-only/corpus'/source['path']).read_bytes()
            if sha(raw) != source['source_sha256'] or sha(raw) != record['source_sha256'] or record['status'] != 'parsed':
                raise ValueError('method-audit.source-identity')
            offset, line = coordinates(raw.decode('utf8'))
            classes = {c['entity_id']: c for c in record['classes']}
            methods = {m['entity_id']: m for m in record['methods']}
            top = {record['package_syntax']+'.'+c['name'] if record['package_syntax'] else c['name']
                   for c in record['classes'] if c['parent_class_id'] is None}
            if top != set(instrumentation[record['path']]['top_level_classes']):
                raise ValueError('method-audit.top-declaration-mismatch')
            for category in ['classes', 'methods', 'calls']:
                totals[category] += len(record[category])
                for entity in record[category]:
                    span = entity['span']
                    if not span['complete']:
                        if category != 'calls' or entity['resolution'] != 'unavailable-source-position':
                            raise ValueError('method-audit.unavailable-declaration')
                        totals['unavailable_references'] += 1
                        continue
                    start, end = span['start_utf16'], span['end_utf16']
                    if offset[start] != span['start_utf8'] or offset[end] != span['end_utf8'] or line[start] != span['start_line'] or line[max(start,end-1)] != span['end_line']:
                        raise ValueError('method-audit.independent-coordinate-binding')
                    content = raw[span['start_utf8']:span['end_utf8']]
                    if 'source' in span and content.decode('utf8') != span['source']:
                        raise ValueError('method-audit.source-slice')
                    parent_id = entity.get('owner_class_id') or entity.get('parent_class_id')
                    if parent_id:
                        parent = classes[parent_id]['span']
                        if not parent['start_utf8'] <= span['start_utf8'] <= span['end_utf8'] <= parent['end_utf8']:
                            raise ValueError('method-audit.class-containment')
                    if category == 'methods':
                        totals['bodyless_declarations'] += int(not entity['has_body'])
                        totals['maximum_method_span_utf8_bytes'] = max(totals['maximum_method_span_utf8_bytes'], len(content))
                        totals['method_spans_gt_32000_bytes'] += int(len(content) > 32000)
                    if category == 'calls':
                        if entity['resolution'] != 'unresolved-syntactic-reference':
                            raise ValueError('method-audit.false-callee-resolution')
                        if entity['enclosing_method_id']:
                            method = methods[entity['enclosing_method_id']]['span']
                            if not method['start_utf8'] <= span['start_utf8'] <= span['end_utf8'] <= method['end_utf8']:
                                raise ValueError('method-audit.lexical-method-containment')
            totals['sources'] += 1
            count += len(record['methods'])
        if count != recorded['totals']['methods']:
            raise ValueError('method-audit.count-reconstruction')
        rows.append({'case_id': cid, 'sources': len(entries), 'methods': count})
    audit = {'status': 'all16-method-source-coordinate-audit-passed', 'cases': 16, 'totals': totals, 'rows': rows,
             'result_sha256': sha((ROOT/'RESULT.json').read_bytes()), 'implementation_sha256': sha(Path(__file__).read_bytes()),
             'scope': 'Independent UTF16-to-UTF8 offsets/physical lines, exact source slices, all file/top-declaration completeness and class/method lexical containment. No independent Java grammar parser, runtime method binding, type attribution, resolved callee or native-quality verification.',
             'manifest_payload_sha256': freeze['source_manifest_sha256'], 'manifest_file_sha256': sha(manifest_bytes),
             'manifest_pin_scope': 'Original frozen SHA covers exact payload, file is exactly that payload plus one LF; no normalization or old pin update',
             'provider_calls': 0, 'reference_label_reads': 0, 'authority_effect': 'none', 'open_questions_owner': 'G01-CANONICAL-METHOD-INDEX-R1.json'}
    save(ROOT/'AUDIT.json', encoded(audit)+b'\n')
    print(json.dumps({k: audit[k] for k in ['status', 'cases', 'totals']}))


if __name__ == '__main__':
    main()
