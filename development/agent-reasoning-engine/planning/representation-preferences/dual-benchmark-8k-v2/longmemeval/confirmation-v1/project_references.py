"""Separate evaluator-only full-stream projection. Never print reference values.
Open questions: REFERENCE-EXTRACTION.md. No network or providers in this module.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
from project_stream import Reader, Sink, ProjectionError, SOURCE_BYTES, SOURCE_SHA256, REVISION, QUESTION_IDS, projection_failure_diagnostic
FIELDS = {'question_id', 'question_type', 'question', 'question_date', 'answer'}

def answer_value(reader, sink, depth=0):
    """Stream one general JSON value with bounded depth/keys/scalars/output.
    Preserve JSON type and numeric spelling; selected-value eligibility is later.
    """
    if depth > 64: raise ProjectionError('JSON nesting ceiling exceeded')
    reader.ws(); c = reader.peek()
    if c == '"':
        reader.string(sink); return 'string'
    if c == '{':
        reader.get(); sink.put('{'); reader.ws(); keys = set()
        if reader.peek() == '}': reader.get(); sink.put('}'); return 'object'
        while True:
            key = reader.string(sink, capture=True, capture_limit=256)
            if key in keys: raise ProjectionError('duplicate ignored object key')
            keys.add(key)
            if len(keys) > 128: raise ProjectionError('ignored object key ceiling exceeded')
            reader.expect(':'); sink.put(':'); answer_value(reader, sink, depth + 1)
            reader.ws(); delimiter = reader.get()
            if delimiter == '}': sink.put('}'); return 'object'
            if delimiter != ',': raise ProjectionError('invalid object')
            sink.put(',')
    if c == '[':
        reader.get(); sink.put('['); reader.ws()
        if reader.peek() == ']': reader.get(); sink.put(']'); return 'array'
        while True:
            answer_value(reader, sink, depth + 1); reader.ws(); delimiter = reader.get()
            if delimiter == ']': sink.put(']'); return 'array'
            if delimiter != ',': raise ProjectionError('invalid array')
            sink.put(',')
    token = ''
    while reader.peek() and reader.peek() not in ' ,]}\r\n\t':
        token += reader.get()
        if len(token) > 128: raise ProjectionError('JSON scalar ceiling exceeded')
    if token not in ('true', 'false', 'null') and not re.fullmatch(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?', token):
        raise ProjectionError('invalid JSON scalar')
    sink.put(token)
    return 'null' if token == 'null' else 'boolean' if token in ('true', 'false') else 'number'

def record(reader, sink):
    reader.expect('{'); reader.ws(); keys = set(); qid = None; emitted = 0; answer_type = None
    if reader.peek() == '}': raise ProjectionError('missing required source field')
    sink.put('{')
    while True:
        key = reader.string(capture=True, capture_limit=256)
        if key in keys: raise ProjectionError('duplicate record key')
        keys.add(key)
        if len(keys) > 128: raise ProjectionError('record key ceiling exceeded')
        reader.expect(':')
        if key in FIELDS:
            if emitted: sink.put(',')
            sink.put(json.dumps(key) + ':'); emitted += 1
            if key == 'question_id':
                qid = reader.string(capture=True, capture_limit=256)
                sink.put(json.dumps(qid))
            elif key == 'answer': answer_type = answer_value(reader, sink)
            else: reader.string(sink)
        else: reader.skip()
        reader.ws(); delimiter = reader.get()
        if delimiter == '}': break
        if delimiter != ',': raise ProjectionError('invalid record')
    if not FIELDS <= keys or not qid: raise ProjectionError('missing required source field')
    sink.put('}\n')
    return {'question_id': qid, 'answer_json_type': answer_type}

def project_stream(stream, destination, *, expected_sha256=SOURCE_SHA256,
                   expected_bytes=SOURCE_BYTES, expected_records=500,
                   question_ids=QUESTION_IDS, row_limit=1024**2,
                   output_limit=4*1024**2, disk_floor=128*1024**2, before_write=None):
    """Publish evaluator-only directory iff the *whole* binary stream verifies."""
    if not re.fullmatch('[a-f0-9]{64}', expected_sha256): raise ProjectionError('invalid SHA binding')
    if any(not isinstance(n, int) or n <= 0 for n in (expected_bytes, expected_records, row_limit, output_limit)):
        raise ProjectionError('invalid bounds')
    ids = tuple(question_ids)
    if len(ids) != 4 or len(set(ids)) != 4 or any(not re.fullmatch('[a-zA-Z0-9_-]+', x) for x in ids):
        raise ProjectionError('exact four safe question IDs required')
    dest = Path(destination); dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists(): raise ProjectionError('destination already exists; no retry/overwrite')
    if shutil.disk_usage(dest.parent).free < disk_floor: raise ProjectionError('disk reserve unavailable')
    stage = Path(tempfile.mkdtemp(prefix='.unverified-reference-', dir=dest.parent)); os.chmod(stage, 0o700)
    reader = Reader(stream, expected_bytes); selected = {}; all_ids = set(); retained = 0; count = 0
    try:
        reader.expect('['); reader.ws()
        if reader.peek() == ']': raise ProjectionError('empty source dataset')
        while True:
            count += 1
            if count > expected_records: raise ProjectionError('source record ceiling exceeded')
            path = stage / 'current-reference-row.json'
            sink = Sink(path, row_limit, output_limit, retained, before_write)
            try: summary = record(reader, sink)
            finally: sink.close()
            qid = summary['question_id']
            if qid in all_ids: raise ProjectionError('duplicate question ID')
            all_ids.add(qid)
            if qid in ids:
                target = 'reference-' + qid + '.json'; path.rename(stage / target)
                retained += sink.size
                selected[qid] = {**summary, 'path': target, 'bytes': sink.size, 'sha256': sink.hash.hexdigest()}
            else: path.unlink()
            reader.ws(); delimiter = reader.get()
            if delimiter == ']': break
            if delimiter != ',': raise ProjectionError('invalid top-level array')
        reader.ws()
        if reader.peek(): raise ProjectionError('trailing source data')
        if count != expected_records: raise ProjectionError('source record count mismatch')
        if reader.count != expected_bytes: raise ProjectionError('source byte count mismatch')
        if reader.hash.hexdigest() != expected_sha256: raise ProjectionError('source SHA mismatch')
        if set(selected) != set(ids): raise ProjectionError('missing selected question IDs')
        pinned = expected_sha256 == SOURCE_SHA256 and expected_bytes == SOURCE_BYTES and expected_records == 500
        receipt = {'status': 'verified-evaluator-reference-projection', 'source_sha256': reader.hash.hexdigest(),
                   'source_bytes': reader.count, 'source_records': count, 'pinned_upstream_source_verified': pinned, 'source_revision': REVISION if pinned else None,
                   'source_filename': 'longmemeval_s_cleaned.json' if pinned else 'injected-offline-source',
                   'license': 'MIT' if pinned else None, 'projection_code_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                   'selected': [selected[q] for q in ids], 'reference_output_bytes': retained,
                   'limits': {'row_bytes': row_limit, 'reference_output_bytes': output_limit, 'disk_floor': disk_floor},
                   'evaluation_references_emitted': True, 'generator_reference_access': False, 'provider_calls': 0,
                   'purpose': 'isolated evaluator references; never generator input',
                   'open_questions_ref': '../REFERENCE-EXTRACTION.md'}
        if before_write: before_write()
        with open(stage / 'reference-acquisition.json', 'x', encoding='utf-8') as f:
            json.dump(receipt, f, indent=2); f.write('\n'); f.flush(); os.fsync(f.fileno())
        # No pre-existing destination is accepted; caller owns one acquisition job.
        if dest.exists(): raise ProjectionError('destination appeared during extraction')
        stage.rename(dest)
        return receipt
    except ProjectionError as error:
        error.source_bytes_read = reader.count
        error.record_index = count
        raise
    finally:
        if stage.exists():
            original_error = sys.exception()
            try: shutil.rmtree(stage)
            except Exception as cleanup_error:
                failure = ProjectionError('projection staging cleanup failed')
                failure.original_error = original_error; failure.cleanup_error = cleanup_error
                raise failure from (original_error or cleanup_error)

