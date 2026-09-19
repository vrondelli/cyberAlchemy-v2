#!/usr/bin/env python3
"""Real TLC executions and full EVF integration; temporary synthetic examples only."""
import argparse
import copy
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
sys.dont_write_bytecode = True
KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT))
sys.path.insert(0, str(KIT / "tests"))
from failure_support import preserve_failure
import formal
from common import Invalid, b64, data, digest, raw, read, save
from adapters import tlc

class RealTLC(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        formal.core.check_kit()
        cls.temp = tempfile.TemporaryDirectory(prefix="evf-real-tlc-tests-")
        cls.root = Path(cls.temp.name) / "audit"
        shutil.copytree(KIT / "formal-example", cls.root)
        cls.tools = formal.tools_bind(cls.root, {"java": ARGS.java, "tlc": ARGS.tlc}, True)["tools"]
        cls.paths = formal.check_tools(cls.root, read(cls.root / cls.tools))
        spec = read(cls.root / "audit.json")
        spec["claims"] = [c for c in spec["claims"] if c["id"] == "tlc-counter"]
        save(cls.root / "tlc-only.json", spec)
        result, code = formal.run_formal(cls.root, "tlc-only.json", cls.tools, True)
        if code:
            retained = preserve_failure(cls.root)
            raise RuntimeError("TLC examples did not pass; NOT skipped. Historical diagnostic copy: "
                               + str(retained) + "; " + str(result))
        cls.claim_path = Path(result["formal_claims"])
        cls.bundle = read(cls.claim_path)
        cls.options = read(cls.root / "tlc-positive.json")["options"]
        cls.positive = read(formal.verify_ref(cls.root, next(r for r in cls.bundle["jobs"][0]["records"]
                            if read(formal.verify_ref(cls.root, r))["normalized_outcome"] == "supported")))

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def run_model(self, name, transform):
        source = self.root / (name + ".tla")
        source.write_text(transform((self.root / "Counter.tla").read_text().replace("MODULE Counter", "MODULE " + name)))
        with tempfile.TemporaryDirectory(prefix="evf-tlc-native-test-") as temporary:
            evidence = tlc.execute(self.root, source, self.options, self.paths, Path(temporary))
        return source, evidence

    def test_full_evf_claim_and_twice_each_positive_negative(self):
        result = formal.verify_formal(self.root, str(self.claim_path))
        self.assertEqual(result["claims_verified"], 1)
        claim = self.bundle["claims"][0]
        self.assertEqual(claim["observed_details"]["distinct_states"], 3)
        self.assertEqual(claim["dependency_refs"][0]["path"], "Counter.cfg")
        records = [read(formal.verify_ref(self.root, r)) for r in self.bundle["jobs"][0]["records"]]
        negatives = [r for r in records if r["normalized_outcome"] == "counterexample"]
        self.assertEqual(len(negatives), 2)
        self.assertTrue(all(r["details"]["violation_kind"] == "temporal" and r["details"]["trace"] for r in negatives))

    def test_real_invariant_counterexample(self):
        source, evidence = self.run_model("UnsafeCounter", lambda text: text.replace("x + 1", "x + 3"))
        outcome, details = tlc.classify(evidence, self.options, source)
        self.assertEqual(outcome, "counterexample")
        self.assertEqual(details["violated_property"], "Bounds")
        self.assertEqual(details["violation_kind"], "invariant")

    def test_real_deadlock_is_not_target_counterexample(self):
        source, evidence = self.run_model("DeadlockCounter", lambda text: text.replace("x = Max\n", "FALSE\n"))
        with self.assertRaises(Invalid): tlc.classify(evidence, self.options, source)

    def test_real_empty_initial_states_cannot_pass(self):
        source, evidence = self.run_model("EmptyCounter", lambda text: text.replace("Init == x = 0", "Init == x = 0 /\\ FALSE"))
        with self.assertRaises(Invalid): tlc.classify(evidence, self.options, source)

    def test_real_syntax_error_cannot_pass(self):
        source, evidence = self.run_model("SyntaxCounter", lambda text: text.replace("x + 1", "x + )"))
        with self.assertRaises(Invalid): tlc.classify(evidence, self.options, source)

    def test_configuration_drift_blocks_current_claim(self):
        path = self.root / "Counter.cfg"
        original = path.read_bytes()
        try:
            path.write_bytes(original.replace(b"Max = 2", b"Max = 3"))
            with self.assertRaises(Invalid): formal.verify_formal(self.root, str(self.claim_path))
        finally:
            path.write_bytes(original)

    def test_missing_tlc_runtime_is_not_evaluable(self):
        lock = read(self.root / self.tools)
        lock["tools"].pop("tlc")
        save(self.root / "missing-tlc-tools.json", lock)
        result, code = formal.run_formal(self.root, "tlc-only.json", "missing-tlc-tools.json", True)
        self.assertEqual(code, 2)
        self.assertEqual(result["supported_claims"], 0)

    def test_altered_runtime_bytes_are_rejected(self):
        wrong = self.root / "wrong.jar"
        wrong.write_bytes(b"not the selected TLA release")
        with self.assertRaises(Invalid):
            formal.tools_bind(self.root, {"tlc": str(wrong)}, True)

    def test_timeout_cannot_pass(self):
        evidence = copy.deepcopy(self.positive["native_evidence"])
        evidence["processes"][0]["failure"] = "timeout"
        with self.assertRaises(Invalid): tlc.classify(evidence, self.options, self.root / "Counter.tla")

    def test_missing_temporal_receipt_cannot_pass(self):
        import re
        evidence = copy.deepcopy(self.positive["native_evidence"])
        stdout = raw(evidence["processes"][0]["stdout"]).decode()
        stdout = re.sub(r"@!@!@STARTMSG 2267:0 @!@!@.*?@!@!@ENDMSG 2267 @!@!@\n", "", stdout, flags=re.S)
        evidence["processes"][0]["stdout"] = b64(stdout.encode())
        with self.assertRaises(Invalid): tlc.classify(evidence, self.options, self.root / "Counter.tla")

    def test_missing_counterexample_trace_rejected(self):
        import re
        record = next(read(formal.verify_ref(self.root, r)) for r in self.bundle["jobs"][0]["records"]
                      if read(formal.verify_ref(self.root, r))["normalized_outcome"] == "counterexample")
        evidence = copy.deepcopy(record["native_evidence"])
        stdout = raw(evidence["processes"][0]["stdout"]).decode()
        stdout = re.sub(r"@!@!@STARTMSG (?:2216|2217|2218|2122):4 @!@!@.*?@!@!@ENDMSG \d+ @!@!@\n", "", stdout, flags=re.S)
        evidence["processes"][0]["stdout"] = b64(stdout.encode())
        with self.assertRaises(Invalid): tlc.classify(evidence, self.options, self.root / "UnfairCounter.tla")

    def test_inflated_temporal_claim_rejected(self):
        bundle = copy.deepcopy(self.bundle)
        bundle["claims"][0]["machine_property"]["constants"]["Max"] = 1000
        bundle.pop("bundle_digest")
        bundle["bundle_digest"] = digest(bundle)
        save(self.root / "inflated-temporal.json", bundle)
        with self.assertRaises(Invalid): formal.verify_formal(self.root, str(self.root / "inflated-temporal.json"))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--java", required=True)
    parser.add_argument("--tlc", required=True)
    ARGS, remaining = parser.parse_known_args()
    unittest.main(argv=[sys.argv[0], *remaining], verbosity=2)
