import importlib.util
import hashlib
import json
import pathlib
import tempfile
import types
import unittest
from unittest import mock

PATH = pathlib.Path(__file__).with_name("qualify-unexposed-window-v1.py")
SPEC = importlib.util.spec_from_file_location("qualifier", PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def fixture(extra_message_field=False):
    rows, candidates = [], []
    for index in range(32):
        message = {"role": "user", "content": f"source-{index}"}
        if extra_message_field:
            message["evaluator_reference"] = "SECRET_GOLD"
        row = {"question_id": f"{index + 256:08x}", "question_type": f"type-{index % 6}", "question": "q", "question_date": "date", "haystack_dates": ["date"], "haystack_sessions": [[message]]}
        rows.append(row)
        candidates.append({"question_id": row["question_id"], "question_type": row["question_type"], "source_row_sha256": MODULE.digest(row), "selection_key": f"{index + 1:064x}", "history_sessions": 1, "history_messages": 1})
    queue_hash, bundle_hash = "e" * 64, "f" * 64
    queue = {"schema_version": "are.longmemeval-unexposed-candidate-queue/v2", "pool_sha256": "d" * 64, "exposure_registry_sha256": "c" * 64, "frozen_seed_sha256": "b" * 64, "exposed_ids": MODULE.EXPOSED_IDS, "eligible_count": 492, "qualification_window": candidates, "selection_uses_evaluator_data": False, "authority_effect": "none", "queue_sha256": queue_hash}
    bundle = {"schema_version": "are.longmemeval-qualification-source-bundle/v1", "queue_sha256": queue_hash, "fields": MODULE.SOURCE_FIELDS, "rows": rows, "evaluator_fields_emitted": False, "authority_effect": "none", "bundle_sha256": bundle_hash}
    queue_bytes = (json.dumps(queue) + "\n").encode()
    bundle_bytes = (json.dumps(bundle) + "\n").encode()
    bindings = {"EXPECTED_QUEUE_FILE_SHA256": hashlib.sha256(queue_bytes).hexdigest(), "EXPECTED_BUNDLE_FILE_SHA256": hashlib.sha256(bundle_bytes).hexdigest(), "EXPECTED_QUEUE_SHA256": queue_hash, "EXPECTED_BUNDLE_SHA256": bundle_hash, "EXPECTED_POOL_SHA256": "d" * 64}
    return queue_bytes, bundle_bytes, bindings


class QualificationTests(unittest.TestCase):
    def test_qualification_digest_and_long_boundary(self):
        candidate = {"question_id": "12345678", "source_row_sha256": "a" * 64}
        short = MODULE.qualification(candidate, "b" * 64, 8000)
        long = MODULE.qualification(candidate, "c" * 64, 8001)
        self.assertFalse(short["long_history"])
        self.assertTrue(long["long_history"])
        material = dict(long)
        observed = material.pop("qualification_sha256")
        self.assertEqual(observed, MODULE.digest(material))

    def test_policy_is_tokenizer_only_and_zero_retry(self):
        self.assertEqual(MODULE.ENDPOINT_PROFILE["endpoint"].rsplit("/", 1)[-1], "tokenizer")
        self.assertEqual(MODULE.ENDPOINT_PROFILE["automatic_retries"], 0)
        self.assertEqual(MODULE.MAXIMUM_CALLS, 32)
        self.assertNotIn("chat/completions", MODULE.REMOTE_PROGRAM)

    def test_exact_source_schema_rejects_evaluator_field_before_dispatch(self):
        queue_bytes, bundle_bytes, bindings = fixture(extra_message_field=True)
        with mock.patch.multiple(MODULE, **bindings):
            with self.assertRaisesRegex(RuntimeError, "message-schema-invalid"):
                MODULE.validate_and_prepare(bundle_bytes, queue_bytes)

    def test_mocked_32_call_run_has_no_retry_and_publishes_terminal_receipt(self):
        queue_bytes, bundle_bytes, bindings = fixture()
        calls = []

        def responder(*args, **kwargs):
            calls.append(kwargs["input"])
            payload = {"status": 200, "prompt_tokens": 9000 + len(calls), "response_sha256": f"{len(calls):064x}", "response_bytes": 100}
            return types.SimpleNamespace(returncode=0, stdout=json.dumps(payload).encode(), stderr=b"")

        with tempfile.TemporaryDirectory() as root:
            root = pathlib.Path(root)
            queue_path, bundle_path, output = root / "queue.json", root / "bundle.json", root / "out"
            queue_path.write_bytes(queue_bytes)
            bundle_path.write_bytes(bundle_bytes)
            with mock.patch.multiple(MODULE, **bindings), mock.patch.object(MODULE.subprocess, "run", side_effect=responder):
                result = MODULE.run(bundle_path, queue_path, output)
            self.assertEqual(len(calls), 32)
            self.assertEqual(result["calls"], 32)
            self.assertTrue(result["all_usage_known"])
            self.assertEqual(json.loads((output / "RESULTS.json").read_text())["status"], "measured")
            self.assertFalse(list(output.glob(".*.tmp")))

    def test_malformed_third_response_seals_remaining_slots_without_retry(self):
        queue_bytes, bundle_bytes, bindings = fixture()
        calls = 0

        def responder(*args, **kwargs):
            nonlocal calls
            calls += 1
            if calls == 3:
                return types.SimpleNamespace(returncode=0, stdout=b"not-json", stderr=b"")
            payload = {"status": 200, "prompt_tokens": 9000, "response_sha256": f"{calls:064x}", "response_bytes": 100}
            return types.SimpleNamespace(returncode=0, stdout=json.dumps(payload).encode(), stderr=b"")

        with tempfile.TemporaryDirectory() as root:
            root = pathlib.Path(root)
            queue_path, bundle_path, output = root / "queue.json", root / "bundle.json", root / "out"
            queue_path.write_bytes(queue_bytes)
            bundle_path.write_bytes(bundle_bytes)
            with mock.patch.multiple(MODULE, **bindings), mock.patch.object(MODULE.subprocess, "run", side_effect=responder):
                with self.assertRaisesRegex(RuntimeError, "tokenizer-response-invalid"):
                    MODULE.run(bundle_path, queue_path, output)
            result = json.loads((output / "RESULTS.json").read_text())
            self.assertEqual(calls, 3)
            self.assertEqual(result["status"], "failed")
            self.assertFalse(result["all_usage_known"])
            self.assertEqual([slot["status"] for slot in result["slots"][:4]], ["measured", "measured", "failed", "unexecuted"])

    def test_preflight_validates_exact_inputs_without_provider_or_output(self):
        queue_bytes, bundle_bytes, bindings = fixture()
        with tempfile.TemporaryDirectory() as root:
            root = pathlib.Path(root)
            queue_path, bundle_path = root / "queue.json", root / "bundle.json"
            queue_path.write_bytes(queue_bytes)
            bundle_path.write_bytes(bundle_bytes)
            with mock.patch.multiple(MODULE, **bindings), mock.patch.object(MODULE.subprocess, "run") as provider:
                result = MODULE.preflight(bundle_path, queue_path)
            self.assertEqual(result["status"], "validated")
            self.assertEqual(result["rows"], 32)
            provider.assert_not_called()
            self.assertEqual(sorted(path.name for path in root.iterdir()), ["bundle.json", "queue.json"])

    def test_recovery_seals_prepared_only_as_indeterminate_without_provider(self):
        queue_bytes, bundle_bytes, bindings = fixture()
        with tempfile.TemporaryDirectory() as root:
            root = pathlib.Path(root)
            queue_path, bundle_path, output = root / "queue.json", root / "bundle.json", root / "out"
            queue_path.write_bytes(queue_bytes)
            bundle_path.write_bytes(bundle_bytes)
            output.mkdir()
            with mock.patch.multiple(MODULE, **bindings):
                _bundle, _queue, prepared = MODULE.validate_and_prepare(bundle_bytes, queue_bytes)
                MODULE.exclusive_json(output / "01-prepared.json", prepared[0][2])
                measured = {**prepared[1][2], "status": "measured", "http_status": 200, "input_tokens": 9001, "response_sha256": "a" * 64, "response_bytes": 100, "elapsed_ms": 1}
                MODULE.exclusive_json(output / "02-prepared.json", prepared[1][2])
                MODULE.exclusive_json(output / "02-measured.json", measured)
                with mock.patch.object(MODULE.subprocess, "run") as provider:
                    result = MODULE.recover(bundle_path, queue_path, output)
            provider.assert_not_called()
            self.assertEqual(result["status"], "inconclusive")
            self.assertEqual(result["calls_lower_bound"], 1)
            self.assertEqual(result["calls_upper_bound"], 2)
            self.assertFalse(result["calls_exact"])
            self.assertEqual([slot["status"] for slot in result["slots"][:3]], ["indeterminate", "measured", "unexecuted"])
            self.assertEqual(json.loads((output / "RESULTS.json").read_text())["recovery_provider_calls"], 0)

    def test_recovery_rejects_forged_measured_receipt(self):
        queue_bytes, bundle_bytes, bindings = fixture()
        with tempfile.TemporaryDirectory() as root:
            root = pathlib.Path(root)
            queue_path, bundle_path, output = root / "queue.json", root / "bundle.json", root / "out"
            queue_path.write_bytes(queue_bytes)
            bundle_path.write_bytes(bundle_bytes)
            output.mkdir()
            with mock.patch.multiple(MODULE, **bindings):
                _bundle, _queue, prepared = MODULE.validate_and_prepare(bundle_bytes, queue_bytes)
                MODULE.exclusive_json(output / "01-prepared.json", prepared[0][2])
                forged = {**prepared[0][2], "status": "measured", "http_status": 999, "input_tokens": 1, "response_sha256": "NOT-A-HASH", "response_bytes": -1, "elapsed_ms": 1, "unexpected": True}
                MODULE.exclusive_json(output / "01-measured.json", forged)
                with self.assertRaisesRegex(RuntimeError, "measured-invalid"):
                    MODULE.recover(bundle_path, queue_path, output)

    def test_recovery_generic_failure_is_only_an_upper_bound_and_rejects_qualification_drift(self):
        queue_bytes, bundle_bytes, bindings = fixture()
        with tempfile.TemporaryDirectory() as root:
            root = pathlib.Path(root)
            queue_path, bundle_path, output = root / "queue.json", root / "bundle.json", root / "out"
            queue_path.write_bytes(queue_bytes)
            bundle_path.write_bytes(bundle_bytes)
            output.mkdir()
            with mock.patch.multiple(MODULE, **bindings):
                _bundle, _queue, prepared = MODULE.validate_and_prepare(bundle_bytes, queue_bytes)
                MODULE.exclusive_json(output / "01-prepared.json", prepared[0][2])
                failed = {**prepared[0][2], "status": "failed", "failure_code": "tokenizer-call-failed", "exit_code": 125, "diagnostic": "docker unavailable", "elapsed_ms": 1}
                MODULE.exclusive_json(output / "01-failed.json", failed)
                result = MODULE.recover(bundle_path, queue_path, output)
            self.assertEqual(result["calls_lower_bound"], 0)
            self.assertEqual(result["calls_upper_bound"], 1)
            self.assertFalse(result["calls_exact"])

        with tempfile.TemporaryDirectory() as root:
            root = pathlib.Path(root)
            queue_path, bundle_path, output = root / "queue.json", root / "bundle.json", root / "out"
            queue_path.write_bytes(queue_bytes)
            bundle_path.write_bytes(bundle_bytes)
            output.mkdir()
            (output / "qualifications.json").write_text("[{}]")
            with mock.patch.multiple(MODULE, **bindings):
                with self.assertRaisesRegex(RuntimeError, "qualification-set-drift"):
                    MODULE.recover(bundle_path, queue_path, output)

    def test_post_response_receipt_failure_is_terminally_indeterminate(self):
        queue_bytes, bundle_bytes, bindings = fixture()
        calls = 0

        def responder(*args, **kwargs):
            nonlocal calls
            calls += 1
            payload = {"status": 200, "prompt_tokens": 9000, "response_sha256": "a" * 64, "response_bytes": 100}
            return types.SimpleNamespace(returncode=0, stdout=json.dumps(payload).encode(), stderr=b"")

        original_write = MODULE.exclusive_json

        def fail_measured(path, value):
            if path.name == "01-measured.json":
                raise OSError("injected-measured-publication-failure")
            return original_write(path, value)

        with tempfile.TemporaryDirectory() as root:
            root = pathlib.Path(root)
            queue_path, bundle_path, output = root / "queue.json", root / "bundle.json", root / "out"
            queue_path.write_bytes(queue_bytes)
            bundle_path.write_bytes(bundle_bytes)
            with mock.patch.multiple(MODULE, **bindings), mock.patch.object(MODULE.subprocess, "run", side_effect=responder), mock.patch.object(MODULE, "exclusive_json", side_effect=fail_measured):
                with self.assertRaisesRegex(OSError, "publication-failure"):
                    MODULE.run(bundle_path, queue_path, output)
            result = json.loads((output / "RESULTS.json").read_text())
            self.assertEqual(calls, 1)
            self.assertEqual(result["calls_lower_bound"], 0)
            self.assertEqual(result["calls_upper_bound"], 1)
            self.assertFalse(result["calls_exact"])
            self.assertEqual(result["slots"][0]["status"], "indeterminate")


if __name__ == "__main__":
    unittest.main()
