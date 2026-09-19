"""No network, native guard subprocess, credentials, or real source input."""
import hashlib
import io
import json
from pathlib import Path
import tempfile
import time
import unittest
from urllib.request import Request
from unittest.mock import patch
from acquire_source import acquire, AcquisitionError, LimitedStream, SafeRedirect, SOURCE_URL, validate_url
from project_stream import QUESTION_IDS
from test_project_stream import fixture

class Clock:
    def __init__(self): self.value = 0; self.waits = []
    def now(self): return self.value
    def sleep(self, value): self.waits.append(value); self.value += value

class Response(io.BytesIO):
    def __init__(self, raw): super().__init__(raw); self.status = 200; self.headers = {'Content-Length': str(len(raw))}
    def geturl(self): return 'https://cas-bridge.xethub.hf.co/object?X-Amz-Signature=DO_NOT_LOG'

class AcquisitionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name); self.out = self.root / 'output'
        self.license = self.root / 'license'; self.license.write_bytes(b'MIT synthetic notice')
        self.raw = json.dumps([fixture(q) for q in QUESTION_IDS], ensure_ascii=False).encode()
        self.clock = Clock(); self.network_calls = 0; self.guards = 0
    def guard(self, path):
        self.guards += 1
        return {'status':'admitted','host_free_bytes':20*1024**3,'free_bytes':20*1024**3,'minimum_host_free_bytes':12*1024**3,'minimum_free_bytes':8*1024**3}
    def transport(self, url, timeout):
        self.assertEqual(url, SOURCE_URL); self.assertEqual(timeout, 30); self.network_calls += 1
        return Response(self.raw)
    def run_acquire(self, **extra):
        args = dict(license_path=self.license, storage_guard=self.guard, transport=self.transport,
                    clock=self.clock.now, sleep=self.clock.sleep, expected_sha256=hashlib.sha256(self.raw).hexdigest(),
                    expected_bytes=len(self.raw), expected_records=4,
                    expected_license_sha256=hashlib.sha256(self.license.read_bytes()).hexdigest())
        args.update(extra); return acquire(self.out, **args)
    def clean_failure(self):
        self.assertFalse(self.out.exists())
        self.assertFalse(list(self.root.glob('.source-acquisition-*')))
        self.assertFalse(list(self.root.glob('.unverified-source-*')))
    def test_single_success_source_only_notice_bound_signed_url_not_recorded(self):
        result = self.run_acquire()
        self.assertEqual(self.network_calls,1); self.assertGreaterEqual(self.guards,2)
        self.assertEqual(result['network_bytes'],len(self.raw))
        self.assertEqual((self.out/'LICENSE-MIT.txt').read_bytes(),self.license.read_bytes())
        text=(self.out/'network-acquisition.json').read_text()
        self.assertNotIn('DO_NOT_LOG',text); self.assertNotIn('GOLD_SECRET',text)
        self.assertFalse((self.out/'raw.json').exists())
        with self.assertRaises(AcquisitionError): self.run_acquire()
        self.assertEqual(self.network_calls,1)
    def test_native_guard_blocks_before_network(self):
        def denied(path): raise AcquisitionError('storage unavailable')
        with self.assertRaises(AcquisitionError): self.run_acquire(storage_guard=denied)
        self.assertEqual(self.network_calls,0); self.clean_failure()
    def test_failure_marker_prevents_retry(self):
        def failed(url, timeout): self.network_calls+=1; raise TimeoutError('contains signed secret URL')
        with self.assertRaises(AcquisitionError): self.run_acquire(transport=failed)
        with self.assertRaises(FileExistsError): self.run_acquire(transport=failed)
        self.assertEqual(self.network_calls,1)
        self.assertNotIn('signed secret',self.out.with_name('output.attempt.json').read_text()); self.clean_failure()
    def test_unsafe_redirects_and_safe_allowlist(self):
        for url in ['http://huggingface.co/x','https://evil.example/x','https://huggingface.co.evil.test/x','https://u:p@huggingface.co/x','https://huggingface.co:444/x']:
            with self.subTest(url=url), self.assertRaises(AcquisitionError): validate_url(url)
        redirect=SafeRedirect()
        for _ in range(5): self.assertIsNotNone(redirect.redirect_request(Request(SOURCE_URL),None,302,'',{},'https://cas-bridge.xethub.hf.co/object?secret=yes'))
        with self.assertRaises(AcquisitionError): redirect.redirect_request(Request(SOURCE_URL),None,302,'',{},SOURCE_URL)
    def test_bad_response_identity_rejected_before_projection(self):
        for mode in ['status','encoding','range','length','url']:
            target=self.root/mode; self.out=target
            def wrong(url,timeout):
                r=Response(self.raw)
                if mode=='status': r.status=206
                elif mode=='encoding': r.headers['Content-Encoding']='gzip'
                elif mode=='range': r.headers['Content-Range']='bytes 0-10/100'
                elif mode=='length': r.headers['Content-Length']='1'
                else: r.geturl=lambda:'https://evil.example/'
                return r
            with self.subTest(mode=mode), self.assertRaises(AcquisitionError): self.run_acquire(transport=wrong)
            self.clean_failure()
    def test_hash_mismatch_and_second_storage_check_stop_publication(self):
        with self.assertRaises(AcquisitionError): self.run_acquire(expected_sha256='0'*64)
        self.clean_failure(); self.out=self.root/'second'
        def later_denied(path):
            self.guards+=1
            if self.guards>=2: raise AcquisitionError('host floor crossed')
            return {'status':'admitted'}
        self.guards=0
        with self.assertRaises(AcquisitionError): self.run_acquire(storage_guard=later_denied)
        self.clean_failure()
    def test_periodic_storage_rate_timeout_and_cancellation(self):
        body=Response(b'x'*(5*1024**2)); limited=LimitedStream(body,self.guard,self.root,clock=self.clock.now,sleep=self.clock.sleep)
        while limited.read(65536): pass
        self.assertGreaterEqual(self.clock.value,5); self.assertGreaterEqual(self.guards,1)
        self.assertTrue(all(v<=1 for v in self.clock.waits))
        with self.assertRaises(AcquisitionError): LimitedStream(body,self.guard,self.root,rate=1024**2+1)
        timed=LimitedStream(Response(b'x'),self.guard,self.root,clock=self.clock.now,sleep=self.clock.sleep,timeout=0.01)
        with self.assertRaises(AcquisitionError): timed.read(65536)
        class Broken(Response):
            def read(self,n): raise OSError('cancelled')
        cancelled=LimitedStream(Broken(b'x'),self.guard,self.root,clock=self.clock.now,sleep=self.clock.sleep)
        with self.assertRaises(AcquisitionError): cancelled.read(1)
    def test_license_change_blocks_network(self):
        with self.assertRaisesRegex(AcquisitionError,'MIT notice'): self.run_acquire(expected_license_sha256='0'*64)
        self.assertEqual(self.network_calls,0); self.clean_failure()
    def test_final_journal_failure_carries_attempt_and_removes_published_source(self):
        import builtins
        real_open=builtins.open
        def fail_final(path,mode='r',*args,**kwargs):
            if str(path).endswith('.attempt.json') and mode=='w': raise OSError('ENOSPC')
            return real_open(path,mode,*args,**kwargs)
        with patch('acquire_source.open',side_effect=fail_final):
            with self.assertRaises(AcquisitionError) as caught: self.run_acquire()
        self.assertEqual(caught.exception.receipt['network_bytes'],len(self.raw)); self.clean_failure()

    def test_wall_watchdog_interrupts_blocking_headers_and_trickling_body(self):
        for mode in ['headers','body']:
            self.out=self.root/mode
            def blocked(url, timeout):
                if mode=='headers': time.sleep(1)
                class Trickle(Response):
                    def read(self,n):
                        # Simulate an HTTP read that never completes because bytes trickle.
                        while True: time.sleep(0.002)
                return Trickle(self.raw)
            start=time.monotonic()
            with self.subTest(mode=mode), self.assertRaises(AcquisitionError):
                self.run_acquire(transport=blocked,attempt_timeout=0.04)
            self.assertLess(time.monotonic()-start,0.5)
            marker=json.loads(self.out.with_name(self.out.name+'.attempt.json').read_text())
            self.assertIn('deadline',marker['failure_category']); self.clean_failure()
    def test_cleanup_error_does_not_skip_journal_or_mask_original(self):
        def corrupt(url, timeout): return Response(self.raw.replace(b'Which',b'WhiCH'))
        with patch('acquire_source.shutil.rmtree',side_effect=OSError('cleanup failed')):
            with self.assertRaises(AcquisitionError) as error:
                self.run_acquire(transport=corrupt)
        marker=json.loads(self.out.with_name('output.attempt.json').read_text())
        self.assertEqual(marker['status'],'failed')
        self.assertTrue(marker['cleanup_errors'])
        self.assertGreater(marker['network_bytes'],0)
        self.assertEqual(error.exception.receipt['network_bytes'],marker['network_bytes'])
        self.assertIn('SHA',str(error.exception.__cause__))
        self.assertFalse(self.out.exists())
    def test_final_publication_guard_denial_preserves_native_receipt(self):
        counter=0
        def deny_final(path):
            nonlocal counter
            counter+=1
            if counter==4:
                self.assertTrue(list(self.root.glob('.source-acquisition-*/source/ATTRIBUTION.json')))
                error=AcquisitionError('native blocked'); error.storage_receipt={'status':'blocked','host_free_bytes':1,'failures':['host-free-space']}; raise error
            return {'status':'admitted'}
        with self.assertRaises(AcquisitionError): self.run_acquire(storage_guard=deny_final)
        self.clean_failure()
        marker=json.loads(self.out.with_name('output.attempt.json').read_text())
        self.assertEqual(marker['storage_receipts'][-1]['status'],'blocked')
        self.assertEqual(marker['storage_receipts'][-1]['host_free_bytes'],1)
        self.assertEqual(marker['network_bytes'],len(self.raw))

if __name__=='__main__': unittest.main()
