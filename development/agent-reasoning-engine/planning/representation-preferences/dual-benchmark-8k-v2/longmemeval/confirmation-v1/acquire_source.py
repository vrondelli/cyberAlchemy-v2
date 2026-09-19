"""Pinned single-attempt acquisition wrapper. Execution is explicit, never on import.
Open questions and remaining gates: ACQUISITION.md.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import selectors
import shutil
import signal
import threading
import subprocess
import tempfile
import time
import urllib.request
from urllib.parse import urlsplit
from project_stream import project_stream, projection_failure_diagnostic, SOURCE_BYTES, SOURCE_SHA256, REVISION, QUESTION_IDS

SOURCE_URL = f'https://huggingface.co/datasets/xiaowu0162/longmemeval-cleaned/resolve/{REVISION}/longmemeval_s_cleaned.json'
LICENSE_URL = 'https://raw.githubusercontent.com/xiaowu0162/LongMemEval/9e0b455f4ef0e2ab8f2e582289761153549043fc/LICENSE'
LICENSE_SHA256 = 'd3c4b9aa54759df6ded337978a6f3b55b75615e5e4525c3b82d7e2627d4b9732'
ALLOWED_HOSTS = frozenset({'huggingface.co', 'us.aws.cdn.hf.co', 'cdn-lfs.huggingface.co', 'cdn-lfs-us-1.hf.co', 'cdn-lfs-eu-1.hf.co', 'cas-bridge.xethub.hf.co', 'transfer.xethub.hf.co', 'cas-server.xethub.hf.co'})

class AcquisitionError(RuntimeError):
    pass


def validate_url(url):
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or parsed.hostname not in ALLOWED_HOSTS or parsed.username or parsed.password or parsed.port not in (None, 443) or parsed.fragment:
        raise AcquisitionError('redirect outside exact HTTPS delivery allowlist')
    return parsed.hostname


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def __init__(self): super().__init__(); self.count = 0
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        validate_url(newurl); self.count += 1
        if self.count > 5: raise AcquisitionError('redirect ceiling exceeded')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def open_source(url, timeout):
    if url != SOURCE_URL: raise AcquisitionError('unpinned source endpoint')
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), SafeRedirect())
    request = urllib.request.Request(url, headers={'Accept-Encoding': 'identity', 'User-Agent': 'ARE-source-projection/1'})
    return opener.open(request, timeout=timeout)


class NativeStorageGuard:
    """Persistent Node guard starts before the Python memory cap; no retries."""
    def __init__(self):
        self.process = subprocess.Popen(['node', str(Path(__file__).with_name('storage_guard.mjs'))], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)
        self.selector = selectors.DefaultSelector(); self.selector.register(self.process.stdout, selectors.EVENT_READ)
    def __call__(self, path):
        self.process.stdin.write(json.dumps({'outRoot': str(path)}) + '\n'); self.process.stdin.flush()
        if not self.selector.select(15): raise AcquisitionError('native storage guard timed out')
        line = self.process.stdout.readline()
        if not line: raise AcquisitionError('native storage guard unavailable')
        result = json.loads(line)
        if not result.get('ok'):
            error = AcquisitionError('native storage guard blocked'); error.storage_receipt = result.get('receipt'); raise error
        return result['receipt']
    def close(self):
        self.selector.close()
        self.process.stdin.close()
        try: self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill(); self.process.wait()
        self.process.stdout.close()


class LimitedStream:
    def __init__(self, response, guard, parent, *, clock=time.monotonic, sleep=time.sleep,
                 rate=1024**2, timeout=900, interval_bytes=4*1024**2, interval_seconds=30):
        if not 0 < rate <= 1024**2 or not 0 < timeout <= 900: raise AcquisitionError('invalid transfer limits')
        self.response, self.guard, self.parent = response, guard, parent
        self.clock, self.sleep, self.rate = clock, sleep, rate
        self.started = clock(); self.deadline = self.started + timeout; self.next_read = self.started
        self.last_guard = self.started; self.guarded_bytes = 0; self.bytes = 0
        self.interval_bytes, self.interval_seconds = interval_bytes, interval_seconds
        self.storage_receipts = []
    def check_storage(self):
        try: receipt = self.guard(self.parent)
        except Exception as error:
            if getattr(error, 'storage_receipt', None) is not None: self.storage_receipts.append(error.storage_receipt)
            raise
        self.storage_receipts.append(receipt); self.last_guard = self.clock(); self.guarded_bytes = self.bytes
    def maybe_guard(self):
        if self.bytes - self.guarded_bytes >= self.interval_bytes or self.clock() - self.last_guard >= self.interval_seconds:
            self.check_storage()
    def read(self, size=-1):
        if self.clock() >= self.deadline: raise AcquisitionError('transfer deadline exceeded')
        size = min(65536, size if size >= 0 else 65536)
        self.maybe_guard()
        # Reserve bandwidth before each read, without accumulating burst credit.
        self.next_read = max(self.next_read, self.clock()) + size / self.rate
        wait = self.next_read - self.clock()
        if self.next_read >= self.deadline: raise AcquisitionError('transfer deadline exceeded')
        if wait > 0: self.sleep(wait)
        try: raw = self.response.read(size)
        except AcquisitionError: raise
        except Exception as error: raise AcquisitionError('source stream read failed') from error
        if self.clock() >= self.deadline: raise AcquisitionError('transfer deadline exceeded')
        if not isinstance(raw, bytes) or len(raw) > size: raise AcquisitionError('invalid binary response read')
        self.bytes += len(raw)
        return raw


def _acquire(destination, *, license_path, storage_guard, transport=open_source,
            clock=time.monotonic, sleep=time.sleep, expected_sha256=SOURCE_SHA256,
            expected_bytes=SOURCE_BYTES, expected_records=500, expected_license_sha256=LICENSE_SHA256):
    dest = Path(destination); dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists(): raise AcquisitionError('destination exists; no overwrite')
    with open(license_path, 'rb') as notice: license_bytes = notice.read(16385)
    if len(license_bytes) > 16384 or hashlib.sha256(license_bytes).hexdigest() != expected_license_sha256:
        raise AcquisitionError('pinned MIT notice unavailable or changed')
    attempt_path = dest.with_name(dest.name + '.attempt.json')
    attempt = {'status': 'started', 'source_url': SOURCE_URL, 'attempts': 1, 'network_bytes': 0,
               'network_bytes_definition':'bytes returned to projector; lower bound on total network transfer when a read fails',
               'source_expected_bytes': expected_bytes, 'source_expected_sha256': expected_sha256,
               'license_url': LICENSE_URL, 'license_sha256': expected_license_sha256,
               'storage_receipts': [], 'provider_calls': 0, 'open_questions_ref': 'ACQUISITION.md',
               'wrapper_code_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
               'guard_bridge_sha256': hashlib.sha256(Path(__file__).with_name('storage_guard.mjs').read_bytes()).hexdigest(),
               'native_guard_sha256': hashlib.sha256((Path(__file__).resolve().parents[7] / 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs').read_bytes()).hexdigest()}
    with open(attempt_path, 'x', encoding='utf-8') as file: json.dump(attempt, file); file.flush(); os.fsync(file.fileno())
    stage = None; response = None; limited = None; published = False; original_error = None
    try:
        try: initial_storage = storage_guard(dest.parent)
        except Exception as error:
            if getattr(error, 'storage_receipt', None) is not None: attempt['storage_receipts'].append(error.storage_receipt)
            raise
        attempt['storage_receipts'].append(initial_storage)
        stage = Path(tempfile.mkdtemp(prefix='.source-acquisition-', dir=dest.parent))
        try: response = transport(SOURCE_URL, 30)
        except AcquisitionError: raise
        except Exception as error: raise AcquisitionError('source HTTPS request failed') from error
        attempt['final_delivery_host'] = validate_url(response.geturl())
        if response.status != 200: raise AcquisitionError('source HTTP status not 200')
        if response.headers.get('Content-Encoding', 'identity').lower() != 'identity' or response.headers.get('Content-Range'):
            raise AcquisitionError('encoded or partial response rejected')
        length = response.headers.get('Content-Length')
        if length is not None and int(length) != expected_bytes: raise AcquisitionError('response length metadata mismatch')
        limited = LimitedStream(response, storage_guard, dest.parent, clock=clock, sleep=sleep)
        limited.check_storage()
        result = project_stream(limited, stage / 'source', expected_sha256=expected_sha256,
                                expected_bytes=expected_bytes, expected_records=expected_records, before_write=limited.maybe_guard)
        limited.check_storage()
        source = stage / 'source'
        (source / 'LICENSE-MIT.txt').write_bytes(license_bytes)
        attribution = {'dataset': 'xiaowu0162/longmemeval-cleaned', 'variant': 'longmemeval_s_cleaned.json',
                       'revision': REVISION, 'source_url': SOURCE_URL, 'source_sha256': result['source_sha256'],
                       'license': 'MIT', 'license_notice_sha256': expected_license_sha256, 'license_source': LICENSE_URL,
                       'change_notice': 'Four selected source-only rows; evaluator labels and original session IDs removed; all retained dated role/content history preserved.',
                       'question_ids': list(QUESTION_IDS), 'generator_evaluation_reference_access': False,
                       'production_bindings_verified': result['pinned_upstream_source_verified'] and expected_license_sha256 == LICENSE_SHA256}
        (source / 'ATTRIBUTION.json').write_text(json.dumps(attribution, indent=2) + '\n')
        attempt.update(status='verified', network_bytes=limited.bytes, source_receipt=result,
                       storage_receipts=attempt['storage_receipts'] + limited.storage_receipts)
        (source / 'network-acquisition.json').write_text(json.dumps(attempt, indent=2) + '\n')
        if dest.exists(): raise AcquisitionError('destination appeared during acquisition')
        limited.check_storage()
        attempt['storage_receipts'] = [initial_storage] + limited.storage_receipts
        source.rename(dest); published = True
        return attempt
    except Exception as error:
        original_error = getattr(error, 'original_error', None) or error
        diagnostic = projection_failure_diagnostic(original_error) or projection_failure_diagnostic(error)
        if diagnostic is not None: attempt['projection_failure'] = diagnostic
        attempt.update(status='failed', failure=type(error).__name__, failure_category=str(error) if isinstance(error, AcquisitionError) else 'projection or persistence failure', network_bytes=limited.bytes if limited else 0)
        if limited: attempt['storage_receipts'] = [initial_storage] + limited.storage_receipts
        failure = AcquisitionError('acquisition failed; no automatic retry'); failure.receipt = attempt
        raise failure from error
    finally:
        cleanup_errors = []
        if response:
            try: response.close()
            except Exception as error: cleanup_errors.append({'phase':'response-close','type':type(error).__name__})
        if stage and stage.exists():
            try: shutil.rmtree(stage)
            except Exception as error: cleanup_errors.append({'phase':'staging-cleanup','type':type(error).__name__})
        if cleanup_errors:
            attempt.update(status='failed', cleanup_errors=cleanup_errors)
        # Always attempt finalization even if cleanup failed; keep the in-memory receipt.
        journal_error = None
        try:
            with open(attempt_path, 'w', encoding='utf-8') as file: json.dump(attempt, file, indent=2); file.write('\n'); file.flush(); os.fsync(file.fileno())
        except Exception as error:
            journal_error = error
            attempt.update(status='failed', failure_category='attempt journal persistence failed')
        if cleanup_errors or journal_error:
            if published and dest.exists():
                try: shutil.rmtree(dest)
                except Exception as error: attempt.setdefault('cleanup_errors', []).append({'phase':'published-cleanup','type':type(error).__name__})
            failure = AcquisitionError('acquisition cleanup or journal failed; no automatic retry'); failure.receipt = attempt
            raise failure from (original_error or journal_error)


class WholeAttemptDeadline:
    """A main-thread POSIX wall timer interrupts trickling header/body reads."""
    def __init__(self, seconds):
        if not isinstance(seconds,(int,float)) or not 0 < seconds <= 900: raise AcquisitionError('invalid whole-attempt deadline')
        self.seconds = seconds
    def __enter__(self):
        if threading.current_thread() is not threading.main_thread(): raise AcquisitionError('acquisition requires an isolated main-thread process')
        if signal.getitimer(signal.ITIMER_REAL)[0] != 0: raise AcquisitionError('existing process timer; use an isolated acquisition process')
        self.previous = signal.getsignal(signal.SIGALRM)
        def expire(signum, frame): raise AcquisitionError('whole-attempt wall deadline exceeded')
        signal.signal(signal.SIGALRM, expire); signal.setitimer(signal.ITIMER_REAL, self.seconds)
        return self
    def __exit__(self, *args):
        signal.setitimer(signal.ITIMER_REAL, 0); signal.signal(signal.SIGALRM, self.previous)


def acquire(destination, *, attempt_timeout=900, **options):
    with WholeAttemptDeadline(attempt_timeout):
        return _acquire(destination, **options)


def main():
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('destination'); parser.add_argument('--license', required=True)
    args = parser.parse_args(); guard = NativeStorageGuard()
    try:
        import resource
        resource.setrlimit(resource.RLIMIT_AS, (64*1024**2, 64*1024**2))
        receipt = acquire(args.destination, license_path=args.license, storage_guard=guard)
        print(json.dumps({'status': receipt['status'], 'network_bytes': receipt['network_bytes']}))
    except Exception as error:
        import sys
        print(json.dumps({'status':'failed','failure_type':type(error).__name__,'attempt_receipt':str(Path(args.destination).with_name(Path(args.destination).name + '.attempt.json'))}),file=sys.stderr)
        raise SystemExit(1) from None
    finally: guard.close()

if __name__ == '__main__': main()
