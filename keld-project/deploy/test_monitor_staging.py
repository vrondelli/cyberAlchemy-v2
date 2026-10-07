import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import urllib.error


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("monitor_staging", HERE / "monitor_staging.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class FakeResponse:
    def __init__(self, status, body=b""):
        self.status = status
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self, _size):
        return self.body[:_size]


class MonitorTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.manifests = self.root / "manifests"
        self.manifests.mkdir()
        self.old = self.manifests / "old.json"
        self.new = self.manifests / "new.json"
        self.old.write_text("{}\n", encoding="utf-8")
        self.new.write_text("{}\n", encoding="utf-8")
        os.utime(self.old, ns=(1, 1))
        os.utime(self.new, ns=(2, 2))
        self.tool = self.root / "capture_release_manifest.py"
        self.tool.write_text("pass\n", encoding="utf-8")
        self.quote_tool = self.root / "quote_config.py"
        self.quote_tool.write_text("pass\n", encoding="utf-8")
        self.quote_config = self.root / "keld.json"
        self.quote_config.write_text("{}\n", encoding="utf-8")

    def tearDown(self):
        self.temporary.cleanup()

    @staticmethod
    def fake_urlopen(request, timeout):
        if request.full_url == MODULE.ARE_STATUS_URL:
            return FakeResponse(
                200,
                json.dumps(
                    {
                        "configured": True,
                        "model": "glm-test",
                        "mode": "live",
                        "scope": "conversation-only",
                        "persistence": "process-memory",
                        "idle_retention_seconds": 1800,
                        "available": True,
                        "availability_reason": None,
                    }
                ).encode(),
            )
        check = next(item for item in MODULE.DEFAULT_HTTP_CHECKS if item[1] == request.full_url)
        expected, required_content = check[3], check[4]
        if expected >= 300:
            raise urllib.error.HTTPError(request.full_url, expected, "Expected non-success", {}, None)
        return FakeResponse(expected, required_content or b"")

    def successful_subprocess(self, arguments, **_kwargs):
        if Path(arguments[1]) == self.tool:
            payload = {"ok": True, "action": "verify", "sha256": "a" * 64}
        else:
            payload = {
                "ok": True,
                "reference": "BCB-PTAX-venda-2026-09-18T13:03:34-03:00",
                "expiresAt": 200000,
                "secondsRemaining": 100000,
                "refreshRequired": False,
            }
        return subprocess.CompletedProcess(arguments, 0, json.dumps(payload), "")

    def collect(self):
        return MODULE.collect_state(
            self.manifests,
            self.tool,
            self.quote_tool,
            self.quote_config,
            1800,
        )

    @patch.object(MODULE.subprocess, "run")
    @patch.object(MODULE, "open_https")
    def test_healthy_state_and_private_atomic_file(self, open_https, run):
        open_https.side_effect = self.fake_urlopen
        run.side_effect = self.successful_subprocess
        state, code = self.collect()
        self.assertEqual(code, 0)
        self.assertTrue(state["healthy"])
        self.assertEqual(len(state["http"]), len(MODULE.DEFAULT_HTTP_CHECKS))
        output = self.root / "state.json"
        MODULE.write_state(output, state)
        self.assertEqual(output.stat().st_mode & 0o777, 0o600)
        self.assertTrue(json.loads(output.read_text(encoding="utf-8"))["healthy"])

    @patch.object(MODULE.subprocess, "run")
    @patch.object(MODULE, "open_https")
    def test_release_drift_is_unhealthy(self, open_https, run):
        open_https.side_effect = self.fake_urlopen
        def subprocess_result(arguments, **kwargs):
            if Path(arguments[1]) == self.tool:
                return subprocess.CompletedProcess(arguments, 1, "", "release-manifest-drift\n")
            return self.successful_subprocess(arguments, **kwargs)
        run.side_effect = subprocess_result
        state, code = self.collect()
        self.assertEqual(code, 1)
        self.assertFalse(state["healthy"])
        self.assertIn("release-manifest:release-manifest-drift", state["failures"])

    @patch.object(MODULE.subprocess, "run")
    @patch.object(MODULE, "open_https")
    def test_public_dynamic_registration_is_fail_closed(self, open_https, run):
        run.side_effect = self.successful_subprocess

        def response(request, timeout):
            if "clients-registrations" in request.full_url:
                return FakeResponse(200)
            return self.fake_urlopen(request, timeout)

        open_https.side_effect = response
        state, code = self.collect()
        self.assertEqual(code, 1)
        self.assertIn("http:dynamic-client-registration:expected-404:actual-200", state["failures"])

    @patch.object(MODULE.subprocess, "run")
    @patch.object(MODULE, "open_https")
    def test_success_status_with_wrong_content_is_unhealthy(self, open_https, run):
        run.side_effect = self.successful_subprocess

        def response(request, timeout):
            if request.full_url == "https://are.keld.studio/":
                return FakeResponse(200, b"generic placeholder")
            return self.fake_urlopen(request, timeout)

        open_https.side_effect = response
        state, code = self.collect()
        self.assertEqual(code, 1)
        self.assertIn("http:are:required-content-missing", state["failures"])

    @patch.object(MODULE.subprocess, "run")
    @patch.object(MODULE, "open_https")
    def test_storefront_cannot_serve_are(self, open_https, run):
        run.side_effect = self.successful_subprocess

        def response(request, timeout):
            if request.full_url == "https://staging.keld.studio/are/":
                return FakeResponse(200, "<title>A.R.E. — Agent Reasoning Engine</title>".encode())
            return self.fake_urlopen(request, timeout)

        open_https.side_effect = response
        state, code = self.collect()
        self.assertEqual(code, 1)
        self.assertIn("http:storefront-are-isolation:expected-404:actual-200", state["failures"])

    @patch.object(MODULE.subprocess, "run")
    @patch.object(MODULE, "open_https")
    def test_legacy_are_page_must_redirect_to_root(self, open_https, run):
        run.side_effect = self.successful_subprocess

        def response(request, timeout):
            if request.full_url == "https://are.keld.studio/are/":
                return FakeResponse(200, b"legacy page became canonical")
            return self.fake_urlopen(request, timeout)

        open_https.side_effect = response
        state, code = self.collect()
        self.assertEqual(code, 1)
        self.assertIn("http:are-legacy-page:expected-308:actual-200", state["failures"])

    @patch.object(MODULE.subprocess, "run")
    @patch.object(MODULE, "open_https")
    def test_quote_refresh_window_is_unhealthy(self, open_https, run):
        open_https.side_effect = self.fake_urlopen

        def subprocess_result(arguments, **kwargs):
            if Path(arguments[1]) == self.quote_tool:
                payload = {
                    "ok": True,
                    "reference": "BCB-PTAX-venda-2026-09-18T13:03:34-03:00",
                    "expiresAt": 190000,
                    "secondsRemaining": 80000,
                    "refreshRequired": True,
                }
                return subprocess.CompletedProcess(arguments, 0, json.dumps(payload), "")
            return self.successful_subprocess(arguments, **kwargs)

        run.side_effect = subprocess_result
        state, code = self.collect()
        self.assertEqual(code, 1)
        self.assertIsNone(state["quoteBrl"])
        self.assertIn("quote:refresh-required", state["failures"])

    @patch.object(MODULE.subprocess, "run")
    @patch.object(MODULE, "open_https")
    def test_fixed_quote_is_healthy_without_expiry(self, open_https, run):
        open_https.side_effect = self.fake_urlopen

        def subprocess_result(arguments, **kwargs):
            if Path(arguments[1]) == self.quote_tool:
                payload = {
                    "ok": True,
                    "reference": "merchant-fixed-5.10",
                    "fixed": True,
                    "expiresAt": None,
                    "secondsRemaining": None,
                    "refreshRequired": False,
                }
                return subprocess.CompletedProcess(arguments, 0, json.dumps(payload), "")
            return self.successful_subprocess(arguments, **kwargs)

        run.side_effect = subprocess_result
        state, code = self.collect()
        self.assertEqual(code, 0)
        self.assertTrue(state["quoteBrl"]["fixed"])
        self.assertIsNone(state["quoteBrl"]["expiresAt"])

    @patch.object(MODULE.subprocess, "run")
    @patch.object(MODULE, "open_https")
    def test_are_unavailable_or_retention_drift_is_unhealthy(self, open_https, run):
        run.side_effect = self.successful_subprocess

        def response(request, timeout):
            if request.full_url == MODULE.ARE_STATUS_URL:
                return FakeResponse(
                    200,
                    json.dumps(
                        {
                            "configured": True,
                            "model": "glm-test",
                            "mode": "live",
                            "scope": "conversation-only",
                            "persistence": "process-memory",
                            "idle_retention_seconds": 900,
                            "available": False,
                            "availability_reason": "demo-hourly-limit",
                        }
                    ).encode(),
                )
            return self.fake_urlopen(request, timeout)

        open_https.side_effect = response
        state, code = self.collect()
        self.assertEqual(code, 1)
        self.assertIsNone(state["areStatus"])
        self.assertIn("are-status:not-available-or-policy-drift", state["failures"])

    def test_newest_manifest_rejects_symlinks_and_uses_mtime(self):
        self.assertEqual(MODULE.newest_manifest(self.manifests), self.new)
        link = self.manifests / "later.json"
        link.symlink_to(self.old)
        self.assertNotEqual(MODULE.newest_manifest(self.manifests), link)

    def test_open_https_rejects_non_https_untrusted_and_ambiguous_destinations(self):
        rejected = (
            "http://staging.keld.studio/",
            "https://example.com/",
            "https://user@staging.keld.studio/",
            "https://staging.keld.studio:443/",
            "https://staging.keld.studio/#fragment",
        )
        for url in rejected:
            with self.subTest(url=url), self.assertRaisesRegex(
                MODULE.MonitorError, "http:destination-invalid"
            ):
                MODULE.open_https(MODULE.urllib.request.Request(url), timeout=10)

    def test_redirect_handler_refuses_redirect_requests(self):
        handler = MODULE.RejectRedirects()
        self.assertIsNone(
            handler.redirect_request(
                None,
                None,
                302,
                "Found",
                {},
                "https://example.com/",
            )
        )


if __name__ == "__main__":
    unittest.main()
