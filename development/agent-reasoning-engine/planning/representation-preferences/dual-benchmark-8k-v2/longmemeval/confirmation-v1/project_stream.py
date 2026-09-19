"""Offline, source-only streaming extractor. No network or evaluator output.
Open questions and remaining gates: STREAMING-IMPLEMENTATION.md.
"""
import argparse
import codecs
import hashlib
from datetime import datetime
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile

SOURCE_SHA256 = 'd6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442'
SOURCE_BYTES = 277383467
QUESTION_IDS = ('09ba9854_abs', '06db6396', 'cc06de0d', '54026fce')
REVISION = '98d7416c24c778c2fee6e6f3006e7a073259d48f'
FIELDS = {'question_id', 'question_type', 'question', 'question_date', 'haystack_dates', 'haystack_sessions'}

class ProjectionError(ValueError):
    pass


# Explicit safe telemetry vocabulary; never persist arbitrary exception text.
SAFE_PROJECTION_REASONS = frozenset((
    'JSON nesting ceiling exceeded',
    'JSON scalar ceiling exceeded',
    'binary stream required',
    'captured scalar ceiling exceeded',
    'date/session cardinality mismatch',
    'destination already exists; no retry/overwrite',
    'destination appeared during extraction',
    'disk reserve unavailable',
    'duplicate ignored object key',
    'duplicate message key',
    'duplicate question ID',
    'duplicate record key',
    'empty message',
    'empty source dataset',
    'empty source session',
    'exact four safe question IDs required',
    'history dates out of order',
    'ignored object key ceiling exceeded',
    'invalid JSON delimiter',
    'invalid JSON scalar',
    'invalid JSON string',
    'invalid SHA binding',
    'invalid array',
    'invalid bounds',
    'invalid message',
    'invalid object',
    'invalid record',
    'invalid source array',
    'invalid string escape',
    'invalid top-level array',
    'invalid unicode escape',
    'invalid unicode surrogate pair',
    'isolated unicode low surrogate',
    'message key ceiling exceeded',
    'missing message source field',
    'missing required source field',
    'missing selected question IDs',
    'projection staging cleanup failed',
    'record key ceiling exceeded',
    'session count ceiling exceeded',
    'source SHA mismatch',
    'source byte ceiling exceeded',
    'source byte count mismatch',
    'source output ceiling exceeded',
    'source record ceiling exceeded',
    'source record count mismatch',
    'string required',
    'trailing source data',
    'turn count ceiling exceeded',
    'unsupported history date format',
    'unsupported role',
))


def projection_failure_diagnostic(error):
    if not isinstance(error, ProjectionError):
        return None
    reason = error.args[0] if len(error.args) == 1 and isinstance(error.args[0], str) else None
    known = reason in SAFE_PROJECTION_REASONS
    result = {'code': 'projection.' + re.sub('[^a-z0-9]+', '-', reason.lower()).strip('-') if known else 'projection.unspecified-failure'}
    if known:
        result['reason'] = reason
    for field, maximum in [('source_bytes_read', SOURCE_BYTES + 65536), ('record_index', 1000000)]:
        value = getattr(error, field, None)
        if type(value) is int and 0 <= value <= maximum:
            result[field] = value
    if 'source_bytes_read' in result:
        result['byte_counter_scope'] = 'binary bytes read into parser, including read-ahead; not exact character offset'
    return result


class Reader:
    """64KiB raw chunks; exact byte hash precedes strict UTF-8 decoding."""
    def __init__(self, stream, maximum_bytes):
        self.stream, self.maximum_bytes = stream, maximum_bytes
        self.decoder = codecs.getincrementaldecoder('utf-8')('strict')
        self.buffer, self.offset, self.count, self.done = '', 0, 0, False
        self.hash = hashlib.sha256()

    def peek(self):
        while self.offset == len(self.buffer) and not self.done:
            raw = self.stream.read(65536)
            if not isinstance(raw, bytes):
                raise ProjectionError('binary stream required')
            self.count += len(raw)
            if self.count > self.maximum_bytes:
                raise ProjectionError('source byte ceiling exceeded')
            self.hash.update(raw)
            self.buffer = self.decoder.decode(raw, final=not raw)
            self.offset = 0
            self.done = not raw
        return self.buffer[self.offset] if self.offset < len(self.buffer) else ''

    def get(self):
        value = self.peek()
        if value:
            self.offset += 1
        return value

    def ws(self):
        while self.peek() and self.peek() in ' \r\n\t':
            self.get()

    def expect(self, value):
        self.ws()
        if self.get() != value:
            raise ProjectionError('invalid JSON delimiter')

    def string(self, sink=None, capture=False, capture_limit=4096):
        self.ws()
        if self.get() != '"':
            raise ProjectionError('string required')
        captured = ['"'] if capture else None
        length = 1
        if sink:
            sink.put('"')
        while True:
            c = self.get()
            if not c or ord(c) < 32:
                raise ProjectionError('invalid JSON string')
            fragment = c
            if c == '\\':
                escape = self.get()
                if not escape or escape not in '"\\/bfnrtu':
                    raise ProjectionError('invalid string escape')
                fragment += escape
                if escape == 'u':
                    digits = ''.join(self.get() for _ in range(4))
                    if len(digits) != 4 or any(d not in '0123456789abcdefABCDEF' for d in digits):
                        raise ProjectionError('invalid unicode escape')
                    fragment += digits
                    unit = int(digits, 16)
                    if 0xD800 <= unit <= 0xDBFF:
                        pair_marker = self.get() + self.get()
                        low = ''.join(self.get() for _ in range(4))
                        if pair_marker != '\\u' or len(low) != 4 or any(d not in '0123456789abcdefABCDEF' for d in low) or not 0xDC00 <= int(low, 16) <= 0xDFFF:
                            raise ProjectionError('invalid unicode surrogate pair')
                        fragment += pair_marker + low
                    elif 0xDC00 <= unit <= 0xDFFF:
                        raise ProjectionError('isolated unicode low surrogate')
            if sink:
                sink.put(fragment)
            if capture:
                length += len(fragment)
                if length > capture_limit:
                    raise ProjectionError('captured scalar ceiling exceeded')
                captured.append(fragment)
            if c == '"':
                return json.loads(''.join(captured)) if capture else None

    def skip(self, depth=0):
        """Discard unknown/evaluator values without materializing string contents."""
        if depth > 64:
            raise ProjectionError('JSON nesting ceiling exceeded')
        self.ws()
        c = self.peek()
        if c == '"':
            self.string()
        elif c == '{':
            self.get(); self.ws(); keys = set()
            if self.peek() == '}':
                self.get(); return
            while True:
                key = self.string(capture=True, capture_limit=256)
                if key in keys: raise ProjectionError('duplicate ignored object key')
                keys.add(key)
                if len(keys) > 128: raise ProjectionError('ignored object key ceiling exceeded')
                self.expect(':'); self.skip(depth + 1)
                self.ws(); c = self.get()
                if c == '}': return
                if c != ',': raise ProjectionError('invalid object')
        elif c == '[':
            self.get(); self.ws()
            if self.peek() == ']':
                self.get(); return
            while True:
                self.skip(depth + 1); self.ws(); c = self.get()
                if c == ']': return
                if c != ',': raise ProjectionError('invalid array')
        else:
            token = ''
            while self.peek() and self.peek() not in ' ,]}\r\n\t':
                token += self.get()
                if len(token) > 128: raise ProjectionError('JSON scalar ceiling exceeded')
            if token not in ('true', 'false', 'null') and not re.fullmatch(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?', token):
                raise ProjectionError('invalid JSON scalar')

class Sink:
    """Buffered UTF-8 output, counted before writing; no record-sized strings."""
    def __init__(self, path, row_limit, total_limit, retained, before_write=None):
        self.before_write = before_write
        if self.before_write: self.before_write()
        self.file = open(path, 'xb')
        self.row_limit, self.total_limit, self.retained = row_limit, total_limit, retained
        self.parts, self.buffer_size, self.size = [], 0, 0
        self.hash = hashlib.sha256()

    def put(self, text):
        raw = text.encode('utf-8')
        self.size += len(raw)
        if self.size > self.row_limit or self.retained + self.size > self.total_limit:
            raise ProjectionError('source output ceiling exceeded')
        self.parts.append(raw); self.buffer_size += len(raw)
        if self.buffer_size >= 16384: self.flush()

    def flush(self):
        raw = b''.join(self.parts)
        if raw and self.before_write: self.before_write()
        self.file.write(raw); self.hash.update(raw)
        self.parts.clear(); self.buffer_size = 0

    def close(self):
        try:
            self.flush(); self.file.flush(); os.fsync(self.file.fileno())
        finally:
            self.file.close()


def array(reader, item):
    reader.expect('['); reader.ws(); count = 0
    if reader.peek() == ']': reader.get(); return count
    while True:
        item(count); count += 1; reader.ws(); delimiter = reader.get()
        if delimiter == ']': return count
        if delimiter != ',': raise ProjectionError('invalid source array')


def message(reader, sink):
    reader.expect('{'); keys = set(); emitted = 0
    sink.put('{'); reader.ws()
    if reader.peek() == '}': raise ProjectionError('empty message')
    while True:
        key = reader.string(capture=True, capture_limit=256)
        if key in keys: raise ProjectionError('duplicate message key')
        keys.add(key)
        if len(keys) > 128: raise ProjectionError('message key ceiling exceeded')
        reader.expect(':')
        if key in ('role', 'content'):
            if emitted: sink.put(',')
            sink.put(json.dumps(key) + ':'); emitted += 1
            if key == 'role':
                role = reader.string(capture=True, capture_limit=32)
                if role not in ('user', 'assistant'): raise ProjectionError('unsupported role')
                sink.put(json.dumps(role))
            else: reader.string(sink)
        else: reader.skip()
        reader.ws(); delimiter = reader.get()
        if delimiter == '}': break
        if delimiter != ',': raise ProjectionError('invalid message')
    if not {'role', 'content'} <= keys: raise ProjectionError('missing message source field')
    sink.put('}')


def record(reader, sink):
    reader.expect('{'); sink.put('{'); keys = set(); emitted = 0
    qid = None; dates = []; session_count = None; turns = 0
    while True:
        key = reader.string(capture=True, capture_limit=256)
        if key in keys: raise ProjectionError('duplicate record key')
        keys.add(key)
        if len(keys) > 128: raise ProjectionError('record key ceiling exceeded')
        reader.expect(':')
        if key not in FIELDS:
            reader.skip()
        else:
            if emitted: sink.put(',')
            sink.put(json.dumps(key) + ':'); emitted += 1
            if key == 'question_id':
                qid = reader.string(capture=True, capture_limit=256)
                sink.put(json.dumps(qid))
            elif key == 'haystack_dates':
                sink.put('[')
                def date(index):
                    if index >= 10000: raise ProjectionError('session count ceiling exceeded')
                    if index: sink.put(',')
                    value = reader.string(capture=True, capture_limit=128)
                    if not re.fullmatch(r'[0-9]{4}/[0-9]{2}/[0-9]{2} \([A-Za-z]{3}\) [0-9]{2}:[0-9]{2}', value): raise ProjectionError('unsupported history date format')
                    try: datetime.strptime(value, '%Y/%m/%d (%a) %H:%M')
                    except ValueError: raise ProjectionError('unsupported history date format') from None
                    dates.append(value); sink.put(json.dumps(value))
                array(reader, date); sink.put(']')
            elif key == 'haystack_sessions':
                sink.put('[')
                def session(index):
                    nonlocal turns
                    if index >= 10000: raise ProjectionError('session count ceiling exceeded')
                    if index: sink.put(',')
                    sink.put('[')
                    def turn(j):
                        if j >= 10000: raise ProjectionError('turn count ceiling exceeded')
                        if j: sink.put(',')
                        message(reader, sink)
                    n = array(reader, turn)
                    if not n: raise ProjectionError('empty source session')
                    turns += n; sink.put(']')
                session_count = array(reader, session); sink.put(']')
            else: reader.string(sink)
        reader.ws(); delimiter = reader.get()
        if delimiter == '}': break
        if delimiter != ',': raise ProjectionError('invalid record')
    if not FIELDS <= keys or not qid: raise ProjectionError('missing required source field')
    if session_count != len(dates) or not dates: raise ProjectionError('date/session cardinality mismatch')
    # Upstream order is authoritative; dates remain attached without sorting.
    sink.put('}\n')
    return {'question_id': qid, 'sessions': session_count, 'turns': turns,
            'history_dates_nondecreasing': all(a[:10] + a[-5:] <= b[:10] + b[-5:] for a, b in zip(dates, dates[1:]))}


def project_stream(stream, destination, *, expected_sha256=SOURCE_SHA256,
                   expected_bytes=SOURCE_BYTES, expected_records=500,
                   question_ids=QUESTION_IDS, row_limit=8*1024**2,
                   output_limit=32*1024**2, disk_floor=128*1024**2, before_write=None):
    """Publish source-only directory iff the *whole* binary stream verifies."""
    if not re.fullmatch('[a-f0-9]{64}', expected_sha256): raise ProjectionError('invalid SHA binding')
    if any(not isinstance(n, int) or n <= 0 for n in (expected_bytes, expected_records, row_limit, output_limit)):
        raise ProjectionError('invalid bounds')
    ids = tuple(question_ids)
    if len(ids) != 4 or len(set(ids)) != 4 or any(not re.fullmatch('[a-zA-Z0-9_-]+', x) for x in ids):
        raise ProjectionError('exact four safe question IDs required')
    dest = Path(destination); dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists(): raise ProjectionError('destination already exists; no retry/overwrite')
    if shutil.disk_usage(dest.parent).free < disk_floor: raise ProjectionError('disk reserve unavailable')
    stage = Path(tempfile.mkdtemp(prefix='.unverified-source-', dir=dest.parent)); os.chmod(stage, 0o700)
    reader = Reader(stream, expected_bytes); selected = {}; all_ids = set(); retained = 0; count = 0
    try:
        reader.expect('['); reader.ws()
        if reader.peek() == ']': raise ProjectionError('empty source dataset')
        while True:
            count += 1
            if count > expected_records: raise ProjectionError('source record ceiling exceeded')
            path = stage / 'current-source-row.json'
            sink = Sink(path, row_limit, output_limit, retained, before_write)
            try: summary = record(reader, sink)
            finally: sink.close()
            qid = summary['question_id']
            if qid in all_ids: raise ProjectionError('duplicate question ID')
            all_ids.add(qid)
            if qid in ids:
                target = 'source-' + qid + '.json'; path.rename(stage / target)
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
        receipt = {'status': 'verified-source-only-projection', 'source_sha256': reader.hash.hexdigest(),
                   'source_bytes': reader.count, 'source_records': count, 'pinned_upstream_source_verified': pinned, 'source_revision': REVISION if pinned else None,
                   'source_filename': 'longmemeval_s_cleaned.json' if pinned else 'injected-offline-source',
                   'license': 'MIT' if pinned else None, 'projection_code_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                   'selected': [selected[q] for q in ids], 'source_output_bytes': retained,
                   'limits': {'row_bytes': row_limit, 'source_output_bytes': output_limit, 'disk_floor': disk_floor},
                   'evaluation_references_emitted': False, 'provider_calls': 0,
                   'long_history_token_qualification': 'pending-real-tokenizer',
                   'open_questions_ref': '../STREAMING-IMPLEMENTATION.md'}
        if before_write: before_write()
        with open(stage / 'acquisition.json', 'x', encoding='utf-8') as f:
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', help='local raw file or - for an externally controlled binary stdin stream')
    parser.add_argument('output', help='new source-only output directory')
    args = parser.parse_args()
    # CLI enforces a process memory ceiling; no network, subprocess or credentials.
    import resource
    resource.setrlimit(resource.RLIMIT_AS, (64*1024**2, 64*1024**2))
    if args.input == '-':
        import sys
        result = project_stream(sys.stdin.buffer, args.output)
    else:
        with open(args.input, 'rb') as source: result = project_stream(source, args.output)
    print(json.dumps({'status': result['status'], 'rows': len(result['selected']), 'source_bytes': result['source_bytes']}))

if __name__ == '__main__': main()
