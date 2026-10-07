import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "send_staging_heartbeat", HERE / "send_staging_heartbeat.py"
)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class FakeResponse:
    status = 204

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self, _size):
        return b""


class FakeOpener:
    def __init__(self):
        self.request = None

    def open(self, request, timeout):
        self.request = request
        return FakeResponse()


class HeartbeatTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.url = self.root / "heartbeat-url"
        self.url.write_text("https://alerts.example.test/heartbeat/token\n", encoding="utf-8")
        self.state = self.root / "state.json"
        self.state.write_text(
            json.dumps(
                {
                    "schema": MODULE.MONITOR_SCHEMA,
                    "observedAt": "2026-09-20T07:56:12Z",
                    "healthy": True,
                    "release": {"sha256": "a" * 64},
                    "quoteBrl": {"expiresAt": 200000, "refreshRequired": False},
                    "failures": [],
                }
            ),
            encoding="utf-8",
        )

    def tearDown(self):
        self.temporary.cleanup()

    def test_loads_only_bounded_healthy_state(self):
        payload = MODULE.load_payload(self.state)
        self.assertEqual(payload["releaseSha256"], "a" * 64)
        self.assertTrue(payload["healthy"])
        value = json.loads(self.state.read_text(encoding="utf-8"))
        value["healthy"] = False
        self.state.write_text(json.dumps(value), encoding="utf-8")
        with self.assertRaisesRegex(MODULE.HeartbeatError, "monitor-state-not-healthy"):
            MODULE.load_payload(self.state)

    def test_rejects_non_https_userinfo_fragment_and_symlink(self):
        for value in (
            "http://alerts.example.test/token",
            "https://user:pass@alerts.example.test/token",
            "https://alerts.example.test/token#fragment",
        ):
            self.url.write_text(value, encoding="utf-8")
            with self.assertRaises(MODULE.HeartbeatError):
                MODULE.load_url(self.url)
        target = self.root / "target"
        target.write_text("https://alerts.example.test/token", encoding="utf-8")
        self.url.unlink()
        self.url.symlink_to(target)
        with self.assertRaisesRegex(MODULE.HeartbeatError, "credential-invalid"):
            MODULE.load_url(self.url)

    @patch.object(MODULE.urllib.request, "build_opener")
    def test_sends_minimal_json_without_exposing_credential(self, build_opener):
        opener = FakeOpener()
        build_opener.return_value = opener
        payload = MODULE.load_payload(self.state)
        status = MODULE.send(MODULE.load_url(self.url), payload)
        self.assertEqual(status, 204)
        sent = json.loads(opener.request.data)
        self.assertEqual(set(sent), {
            "schema", "sentAt", "monitorObservedAt", "healthy", "releaseSha256", "quoteExpiresAt"
        })
        self.assertNotIn("token", json.dumps(sent))


if __name__ == "__main__":
    unittest.main()
