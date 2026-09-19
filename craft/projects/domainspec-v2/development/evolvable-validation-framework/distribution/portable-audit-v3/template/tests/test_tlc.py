#!/usr/bin/env python3
"""TLC contract/parser tests. Synthetic protocol messages are not model-checking evidence."""
import copy
from pathlib import Path
import sys
import tempfile
import unittest
import shutil
sys.dont_write_bytecode = True
KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT / "adapters"))
sys.path.insert(0, str(KIT / "tests"))
from failure_support import preserve_failure
from common import Invalid, b64, read
import tlc

def message(code, text, severity=0):
    return f"@!@!@STARTMSG {code}:{severity} @!@!@\n{text}\n@!@!@ENDMSG {code} @!@!@\n"

class TLCContracts(unittest.TestCase):
    def test_failed_setup_evidence_survives_source_cleanup(self):
        with tempfile.TemporaryDirectory(prefix="evf-failure-retention-test-") as temporary:
            root = Path(temporary) / "audit"
            root.mkdir()
            (root / "raw.json").write_text('{"status":"not_evaluable"}')
            retained = preserve_failure(root)
        try:
            self.assertEqual((retained / "raw.json").read_text(), '{"status":"not_evaluable"}')
            self.assertFalse(root.exists())
        finally:
            # Only the fresh diagnostic directory created by this test.
            self.assertTrue(retained.parent.name.startswith("evf-test-failure-"))
            shutil.rmtree(retained.parent)

    def setUp(self):
        self.source = KIT / "formal-example/Counter.tla"
        self.options = read(KIT / "formal-example/tlc-positive.json")["options"]
        self.records = [(2262, tlc.VERSION), (2187, "Running breadth-first search Model-Checking with fp 0 and seed 1 with 1 worker test"),
                        (2220, "Starting SANY..."), (2219, "SANY finished."), (2185, "Starting..."),
                        (2190, "Finished computing initial states: 1 distinct state generated."),
                        (2192, "Checking temporal properties for the complete state space with 3 total distinct states"),
                        (2267, "Finished checking temporal properties"), (2193, "Model checking completed. No error has been found."),
                        (2199, "4 states generated, 3 distinct states found, 0 states left on queue."), (2186, "Finished")]

    def evidence(self):
        return {"configuration": b64(tlc.configuration(self.options).encode()), "runtime_jar_sha256": tlc.JAR_SHA256,
                "artifacts": {}, "processes": [{"argv": ["/test/java", *tlc.arguments("tla2tools.jar", self.source.name)],
                "failure": None, "exit_code": 0, "stderr": b64(b""),
                "stdout": b64("".join(message(c, t) for c, t in self.records).encode())}]}

    def rejected(self, evidence=None):
        with self.assertRaises(Invalid):
            tlc.classify(evidence or self.evidence(), self.options, self.source)

    def test_complete_success_shape(self):
        self.assertEqual(tlc.classify(self.evidence(), self.options, self.source)[0], "supported")

    def test_missing_final_marker(self):
        self.records.pop()
        self.rejected()

    def test_no_success_even_with_exit_zero(self):
        self.records = [r for r in self.records if r[0] != 2193]
        self.rejected()

    def test_missing_temporal_completion(self):
        self.records = [r for r in self.records if r[0] != 2267]
        self.rejected()

    def test_partial_temporal_search(self):
        self.records = [(c, t.replace("complete state space", "partial state space")) for c, t in self.records]
        self.rejected()

    def test_nonempty_queue(self):
        self.records[-2] = (2199, "4 states generated, 3 distinct states found, 1 states left on queue.")
        self.rejected()

    def test_zero_initial_space(self):
        self.records[-2] = (2199, "0 states generated, 0 distinct states found, 0 states left on queue.")
        self.rejected()

    def test_warning_is_not_silent_success(self):
        evidence = self.evidence()
        from common import raw
        evidence["processes"][0]["stdout"] = b64(raw(evidence["processes"][0]["stdout"]) + message(2401, "warning", 3).encode())
        self.rejected(evidence)

    def test_wrong_runtime_hash(self):
        evidence = self.evidence()
        evidence["runtime_jar_sha256"] = "0" * 64
        self.rejected(evidence)

    def test_simulation_flag_is_not_model_checking(self):
        evidence = self.evidence()
        evidence["processes"][0]["argv"].insert(-1, "-simulate")
        self.rejected(evidence)

    def test_truncated_protocol(self):
        evidence = self.evidence()
        evidence["processes"][0]["stdout"] = b64(b"@!@!@STARTMSG 2262:0 @!@!@\ntruncated")
        self.rejected(evidence)

    def test_unknown_error_code(self):
        self.records.insert(-1, (9999, "unknown"))
        self.rejected()

    def test_configuration_digest_is_not_enough_to_weaken_property(self):
        evidence = self.evidence()
        evidence["configuration"] = b64(b"SPECIFICATION Spec\n")
        self.rejected(evidence)

    def test_empty_property_set_rejected(self):
        self.options.update(invariants=[], properties=[])
        with self.assertRaises(Invalid): tlc.validate(self.options)

    def test_multiple_temporal_properties_rejected(self):
        self.options["properties"].append("Other")
        with self.assertRaises(Invalid): tlc.validate(self.options)

    def test_configuration_injection_rejected(self):
        self.options["constants"] = {"Max": "2\nCHECK_DEADLOCK FALSE"}
        with self.assertRaises(Invalid): tlc.validate(self.options)

    def test_extra_configuration_directive_rejected(self):
        with tempfile.TemporaryDirectory(prefix="evf-tlc-contract-") as temporary:
            root = Path(temporary)
            config = root / "Counter.cfg"
            config.write_text(tlc.configuration(self.options) + "CHECK_DEADLOCK FALSE\n")
            with self.assertRaises(Invalid): tlc.sources(root, self.source, self.options)

    def test_external_module_rejected(self):
        with tempfile.TemporaryDirectory(prefix="evf-tlc-contract-") as temporary:
            root = Path(temporary)
            (root / "Counter.cfg").write_text(tlc.configuration(self.options))
            source = root / "Counter.tla"
            source.write_text(self.source.read_text().replace("EXTENDS Naturals", "EXTENDS PrivateModule"))
            with self.assertRaises(Invalid): tlc.sources(root, source, self.options)

    def test_comment_does_not_hide_dependency(self):
        with tempfile.TemporaryDirectory(prefix="evf-tlc-contract-") as temporary:
            root = Path(temporary)
            (root / "Counter.cfg").write_text(tlc.configuration(self.options))
            source = root / "Counter.tla"
            source.write_text(self.source.read_text().replace("EXTENDS Naturals", "EXTENDS (* a (*nested*) comment *) PrivateModule"))
            with self.assertRaises(Invalid): tlc.sources(root, source, self.options)

if __name__ == "__main__":
    unittest.main(verbosity=2)
