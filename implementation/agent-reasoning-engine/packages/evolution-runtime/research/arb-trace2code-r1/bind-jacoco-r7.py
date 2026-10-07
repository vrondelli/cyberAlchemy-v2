"""JaCoCo0.8.12 source/class identity binding, no fault labels.
Open Questions: evidence/G01-JACOCO-SOURCE-BINDING-R7.json.
"""
import hashlib
import re
import struct
import xml.etree.ElementTree as ET


def sha(data):
    return hashlib.sha256(data).hexdigest()


def execution_data(data, classes):
    if len(data) > 32 * 1024 * 1024 or not data.startswith(b'\x01\xc0\xc0\x10\x07'):
        raise ValueError('jacoco.exec-header-or-size')
    offset = 0
    sessions = 0
    records = {}
    known = {c['name']: c['class_id'] for c in classes}
    if len(known) != len(classes) or any(not re.fullmatch(r'[a-f0-9]{16}', x or '') for x in known.values()):
        raise ValueError('jacoco.exec-complete-class-id-inventory')

    def take(n):
        nonlocal offset
        if offset + n > len(data):
            raise ValueError('jacoco.exec-truncated')
        result = data[offset:offset + n]
        offset += n
        return result

    def text():
        n = struct.unpack('>H', take(2))[0]
        # Canonical class/session names here are ASCII, not arbitrary modified UTF8.
        return take(n).decode('ascii', errors='strict')

    def varint():
        n = 0
        for shift in range(0, 35, 7):
            b = take(1)[0]
            n |= (b & 127) << shift
            if not b & 128:
                if n > 1000000:
                    raise ValueError('jacoco.probe-budget')
                return n
        raise ValueError('jacoco.probe-length')

    while offset < len(data):
        kind = take(1)[0]
        if kind == 1:
            if take(4) != b'\xc0\xc0\x10\x07':
                raise ValueError('jacoco.exec-version')
        elif kind == 16:
            text()
            take(16)
            sessions += 1
        elif kind == 17:
            class_id = take(8).hex()
            name = text()
            count = varint()
            bits = take((count + 7) // 8)
            if known.get(name) != class_id:
                raise ValueError('jacoco.executed-class-id-unmatched:' + name)
            old = records.get(name)
            if old and old['probe_count'] != count:
                raise ValueError('jacoco.executed-probe-count-drift')
            merged = bytes(a | b for a, b in zip(old['_bits'], bits)) if old else bits
            positive = sum(bool(merged[i // 8] & (1 << (i % 8))) for i in range(count))
            records[name] = {'name': name, 'class_id': class_id, 'probe_count': count, 'positive_probes': positive, '_bits': merged}
        else:
            raise ValueError('jacoco.exec-block')
    if not sessions or not records or not any(r['positive_probes'] for r in records.values()):
        raise ValueError('jacoco.exec-empty')
    return {'sessions': sessions, 'rows': [{k: v for k, v in r.items() if k != '_bits'} for r in records.values()]}


def bind_report(xml, sources, instrumentation, classes, executed):
    if len(xml) > 32 * 1024 * 1024 or b'<!ENTITY' in xml:
        raise ValueError('jacoco.xml-boundary')
    tree = ET.fromstring(xml)
    if tree.tag != 'report':
        raise ValueError('jacoco.report-root')
    compiled = {c['name']: c for c in classes}
    for c in classes:
        if c.get('analyzed') is False:
            if not (c.get('access_flags', 0) & 4096 and c.get('line_coverage_available') is False and c['executable_lines'] is None and c.get('analysis_omission')):
                raise ValueError('jacoco.unverified-generated-analysis-omission')
        elif c.get('analyzed') is not True or not isinstance(c['executable_lines'], int):
            raise ValueError('jacoco.class-analysis-state')
    for row in instrumentation['rows']:
        for top in row['top_level_classes']:
            c = compiled.get(top.replace('.', '/'))
            if not c or c['analyzed'] is not True:
                raise ValueError('jacoco.declared-source-type-not-analyzed')
    positive_names = {r['name'] for r in executed['rows'] if r['positive_probes']}
    seen = set()
    rows = {}
    source_by_top = {n.replace('.', '/'): r['path'] for r in instrumentation['rows'] for n in r['top_level_classes']}
    for meta in instrumentation.get('excluded_metadata', []):
        relative = meta['path'][len(instrumentation['source_root']) + 1:]
        source_by_top[relative[:-5]] = meta['path']
    root = instrumentation['source_root']
    for package in tree.findall('package'):
        package_name = package.get('name')
        if package_name is None or (package_name and not re.fullmatch(r'[A-Za-z0-9_$/]+', package_name)):
            raise ValueError('jacoco.package')
        files = {}
        for c in package.findall('class'):
            name = c.get('name')
            filename = c.get('sourcefilename')
            if name in seen or name not in compiled or name.rpartition('/')[0] != package_name:
                raise ValueError('jacoco.report-class-membership')
            if compiled[name]['analyzed'] is not True:
                raise ValueError('jacoco.generated-class-unexpected-source-report')
            seen.add(name)
            if not filename or not re.fullmatch(r'[A-Za-z0-9_$-]+\.java', filename):
                raise ValueError('jacoco.sourcefile')
            path = root + '/' + (package_name + '/' if package_name else '') + filename
            owners = [top for top in source_by_top if name == top or name.startswith(top + '$')]
            owner = max(owners, key=len) if owners else None
            if owner is None or source_by_top[owner] != path:
                raise ValueError('jacoco.class-source-binding')
            files[filename] = path
            for counter in c.findall('counter'):
                if int(counter.get('covered')) > 0 and name not in positive_names:
                    raise ValueError('jacoco.positive-report-without-execution')
        for s in package.findall('sourcefile'):
            filename = s.get('name')
            path = files.get(filename)
            if path is None or path in rows or path not in sources:
                raise ValueError('jacoco.sourcefile-not-bound')
            source = sources[path]
            if sha(source['bytes']) != source['sha256']:
                raise ValueError('jacoco.source-sha')
            n = len(source['bytes'].decode('utf8', errors='strict').splitlines())
            lines = []
            numbers = set()
            for line in s.findall('line'):
                fields = {k: line.get(k) for k in ['nr', 'mi', 'ci', 'mb', 'cb']}
                if any(not re.fullmatch(r'[0-9]+', v or '') for v in fields.values()):
                    raise ValueError('jacoco.line-counter')
                fields = {k: int(v) for k, v in fields.items()}
                number = fields['nr']
                if number < 1 or number > n or number in numbers:
                    raise ValueError('jacoco.line-bounds-or-duplicate')
                numbers.add(number)
                lines.append({'line': number, 'covered_instructions': fields['ci'], 'missed_instructions': fields['mi'], 'covered_branches': fields['cb'], 'missed_branches': fields['mb']})
            rows[path] = {'path': path, 'source_sha256': source['sha256'], 'lines': sorted(lines, key=lambda x: x['line']), 'executed_lines': sum(x['covered_instructions'] > 0 for x in lines)}
    omitted = [c['name'] for c in classes if c['name'] not in seen]
    if any(compiled[name]['analyzed'] and compiled[name]['executable_lines'] > 0 for name in omitted):
        raise ValueError('jacoco.executable-class-omitted')
    total = sum(r['executed_lines'] for r in rows.values())
    if not total:
        raise ValueError('jacoco.no-source-execution')
    line_counters = [c for c in tree.findall('counter') if c.get('type') == 'LINE']
    if line_counters:
        if len(line_counters) != 1 or int(line_counters[0].get('covered')) != total or int(line_counters[0].get('missed')) != sum(x['covered_instructions'] == 0 and x['missed_instructions'] > 0 for r in rows.values() for x in r['lines']):
            raise ValueError('jacoco.aggregate-line-counter')
    return {'rows': [rows[k] for k in sorted(rows)], 'reported_classes': len(seen), 'compiled_classes': len(classes), 'omitted_zero_line_classes': [n for n in omitted if compiled[n]['analyzed']],
            'omitted_generated_line_coverage_unavailable': [n for n in omitted if not compiled[n]['analyzed']],
            'generated_execution_observations_not_source_lines': [r for r in executed['rows'] if not compiled[r['name']]['analyzed']],
            'source_files_with_execution': sum(r['executed_lines'] > 0 for r in rows.values()), 'unique_executed_source_lines': total,
            'negative_evidence_policy': 'Zero or missing probes do not prove irrelevance. Exception-aborted paths may not reach a JaCoCo probe.',
            'execution_scope': 'Official single-test command phase, including Ant and any child JVMs; not claimed test-JVM-exclusive.'}
