#!/usr/bin/env python3
"""Native line-offset supplement; no label repair. Open Questions: G02-R11-SOURCE-FIDELITY-R1.md."""
import json
import runpy
from hashlib import sha256
from pathlib import Path

ROOT = Path('/home/vlad_/are-benchmark-archive')
OUT = ROOT/'g02-r11-source-fidelity-exposed-r1-20261006'
UPSTREAM_SHA = 'aba937cdd6dc7096a2fdd4435788ebedec5e92d42a98d3091a929dae47c18b48'
digest = lambda b: sha256(b).hexdigest()


def load_native():
    path = OUT/'UPSTREAM-FILEIO.py'
    assert digest(path.read_bytes()) == UPSTREAM_SHA
    return runpy.run_path(str(path))['line_to_byte']


def main():
    assert not (OUT/'NATIVE-LINE-SUPPLEMENT.json').exists()
    data = (OUT/'FIDELITY-AUDIT.json').read_bytes()
    assert digest(data) == 'f5d1c9ea770cd4aab202b54e4279813221e7cdf7b22c48e213bbd2240725614f'
    audit = json.loads(data); native = load_native()
    rows = []; native_spans = eof_spans = absent_spans = dropped_spans = 0
    for row in audit['rows']:
        base = ROOT/f"g02-product-replication-r11-20261002/pairs/{row['ordinal']:02d}-pr11-mixed-{row['ordinal']:02d}/raw/sources/session/base"
        files = []
        for f in row['files']:
            path = base/f['path']; checks = []
            raw = path.read_bytes() if f['tracked_regular_present'] else None
            if raw is not None:
                assert digest(raw) == f['source_sha256']
            for a in f['annotations']:
                span = native(str(path), a['start_line'], a['end_line'])
                present = span is not None
                if present:
                    native_spans += 1
                elif raw is None:
                    absent_spans += 1
                else:
                    dropped_spans += 1
                eof = bool(raw is not None and raw.endswith(b'\n') and
                           a['end_line'] == len(raw.decode('utf8', errors='replace').splitlines())+1 and
                           a['bounds_valid'] is False and present)
                eof_spans += int(eof)
                checks.append({'start_line': a['start_line'], 'end_line': a['end_line'],
                               'native_byte_interval': list(span) if span else None,
                               'native_representable': present, 'terminal_newline_offset_explains_logical_overrun': eof})
            files.append({'path': f['path'], 'checks': checks})
        rows.append({'ordinal': row['ordinal'], 'files': files})
    assert native_spans+absent_spans+dropped_spans == audit['totals']['span_occurrences'] == 114
    result = {'schema': 'are.g02-native-line-fidelity-supplement/v1', 'posture': 'pinned native semantics, diagnostic only; no source/gold/score rewrite',
              'logical_line_audit_sha256': digest(data), 'upstream_fileio_sha256': UPSTREAM_SHA,
              'upstream_gold_loader_sha256': '3eee61cfe239590d069f03fdbf38a70a74efc6d170b37ca17e39ba7f9742e1a7',
              'upstream_commit': '1436c28a8eb95496da4ea69ad458b9f8a8eb7d61',
              'native_representable_spans': native_spans, 'absent_path_spans': absent_spans,
              'present_file_native_dropped_spans': dropped_spans,
              'terminal_newline_explained_overruns': eof_spans, 'rows': rows,
              'interpretation': 'Five logical overruns are native-valid EOF newline intervals, not five scoring-invalid spans. One missing path remains. Gold content text is not used by the pinned loader.',
              'implementation_sha256': digest(Path(__file__).read_bytes()), 'open_questions_owner': 'G02-R11-SOURCE-FIDELITY-R1.md'}
    with (OUT/'NATIVE-LINE-SUPPLEMENT.json').open('x') as stream:
        json.dump(result, stream, indent=2); stream.write('\n')
    print(json.dumps({k: result[k] for k in ['native_representable_spans', 'absent_path_spans', 'present_file_native_dropped_spans', 'terminal_newline_explained_overruns']}))
    print(json.dumps({'sha256': digest((OUT/'NATIVE-LINE-SUPPLEMENT.json').read_bytes())}))


if __name__ == '__main__':
    main()
