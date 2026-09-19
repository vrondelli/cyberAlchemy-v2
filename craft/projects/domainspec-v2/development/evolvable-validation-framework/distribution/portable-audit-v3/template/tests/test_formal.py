#!/usr/bin/env python3
"""Parser/contract construction tests. Synthetic messages here are NOT formal evidence."""
import copy
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
sys.dont_write_bytecode = True
KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT / "adapters"))
from common import Invalid, b64, capture, check_version, parse
import cbmc
import graph
import lean_adapter

def process(stdout=b"", code=0, argv=None):
    return {"argv": argv or ["/test-only/tool"], "exit_code": code, "failure": None,
            "stdout": b64(stdout), "stderr": b64(b"")}

class FormalContracts(unittest.TestCase):
    def setUp(self):
        self.options = {"function": "main", "unwind": 4, "assertions": ["PAIR_COMMUTATIVE"]}
        self.property = {"description": "PAIR_COMMUTATIVE", "property": "main.assertion.1",
                         "sourceLocation": {"propertyClass": "assertion"}, "status": "SUCCESS"}
        self.rows = [{"program": "CBMC 6.11.0 (cbmc-6.11.0)"}, {"result": [self.property]}, {"cProverStatus": "success"}]
        self.graph = {"nodes": ["A", "B", "C"], "edges": [["A", "B"], ["B", "C"]], "required_sources": ["A"], "target": "C"}
        self.lean = {"declaration": "EVF.canonicalPair_comm", "expected_type": "∀ a b : Nat, EVF.canonicalPair a b = EVF.canonicalPair b a", "allowed_axioms": []}

    def cbmc_evidence(self, code=0):
        return {"processes": [process(json.dumps(self.rows).encode(), code, ["/test-only/cbmc", *cbmc.flags(self.options), "/test-only/subject.c"])], "artifacts": {}}

    def lean_evidence(self, axioms):
        return {"processes": [process(argv=["/test-only/lean", "-o", "Proof.olean", "Proof.lean"]),
                              process(axioms.encode(), argv=["/test-only/lean", "Check.lean"])], "artifacts": {}}

    def test_cbmc_success_shape(self):
        self.assertEqual(cbmc.classify(self.cbmc_evidence(), self.options)[0], "supported")

    def test_cbmc_counterexample_shape(self):
        self.property["status"] = "FAILURE"
        self.rows[-1]["cProverStatus"] = "failure"
        self.assertEqual(cbmc.classify(self.cbmc_evidence(10), self.options)[0], "counterexample")

    def test_cbmc_missing_final_rejected(self):
        self.rows.pop()
        with self.assertRaises(Invalid): cbmc.classify(self.cbmc_evidence(), self.options)

    def test_cbmc_empty_properties_rejected(self):
        self.rows[1]["result"] = []
        with self.assertRaises(Invalid): cbmc.classify(self.cbmc_evidence(), self.options)

    def test_cbmc_unknown_property_rejected(self):
        self.property["status"] = "UNKNOWN"
        with self.assertRaises(Invalid): cbmc.classify(self.cbmc_evidence(), self.options)

    def test_cbmc_wrong_assertion_rejected(self):
        self.property["description"] = "UNRELATED"
        with self.assertRaises(Invalid): cbmc.classify(self.cbmc_evidence(), self.options)

    def test_cbmc_unwinding_failure_is_not_target_counterexample(self):
        self.rows[1]["result"].append({"description": "unwinding assertion", "property": "main.unwind.0", "status": "FAILURE"})
        self.rows[-1]["cProverStatus"] = "failure"
        with self.assertRaises(Invalid): cbmc.classify(self.cbmc_evidence(10), self.options)

    def test_cbmc_weakened_flags_rejected(self):
        evidence = self.cbmc_evidence()
        evidence["processes"][0]["argv"].remove("--unwinding-assertions")
        with self.assertRaises(Invalid): cbmc.classify(evidence, self.options)

    def test_cbmc_contradictory_exit_rejected(self):
        with self.assertRaises(Invalid): cbmc.classify(self.cbmc_evidence(10), self.options)

    def test_cbmc_external_preprocessor_dependency_rejected(self):
        with tempfile.TemporaryDirectory(prefix="evf-c-contract-") as temporary:
            source = Path(temporary) / "subject.c"
            for token in ("#", "%:", "??="):
                source.write_text(token + 'include "outside.h"\n')
                with self.assertRaises(Invalid): cbmc.validate_source(source)

    def test_lean_explicit_axiom_free_shape(self):
        result = lean_adapter.classify(self.lean_evidence("'EVF.canonicalPair_comm' does not depend on any axioms"), self.lean)
        self.assertEqual(result[1]["axioms"], [])

    def test_lean_transitive_sorry_rejected(self):
        with self.assertRaises(Invalid): lean_adapter.classify(self.lean_evidence("'EVF.canonicalPair_comm' depends on axioms: [sorryAx]"), self.lean)

    def test_lean_compiler_trust_rejected(self):
        with self.assertRaises(Invalid): lean_adapter.classify(self.lean_evidence("'EVF.canonicalPair_comm' depends on axioms: [Lean.trustCompiler]"), self.lean)

    def test_lean_different_theorem_rejected(self):
        with self.assertRaises(Invalid): lean_adapter.classify(self.lean_evidence("'EVF.other' does not depend on any axioms"), self.lean)

    def test_lean_missing_type_audit_rejected(self):
        evidence = self.lean_evidence("")
        evidence["processes"].pop()
        with self.assertRaises(Invalid): lean_adapter.classify(evidence, self.lean)

    def test_lean_type_check_failure_rejected(self):
        evidence = self.lean_evidence("")
        evidence["processes"][1]["exit_code"] = 1
        with self.assertRaises(Invalid): lean_adapter.classify(evidence, self.lean)

    def test_graph_code_injection_rejected(self):
        self.graph["nodes"][0] = 'A". arbitrary rule'
        with self.assertRaises(Invalid): graph.validate(self.graph)

    def test_graph_unbound_endpoint_rejected(self):
        self.graph["edges"].append(["C", "outside"])
        with self.assertRaises(Invalid): graph.validate(self.graph)

    def test_souffle_missing_output_rejected(self):
        with self.assertRaises(Invalid): graph.parse_souffle(process(), {}, self.graph)

    def test_souffle_unrelated_violation_rejected(self):
        with self.assertRaises(Invalid): graph.parse_souffle(process(), {"Violation.csv": b64(b"outside\n")}, self.graph)

    def test_alloy_missing_receipt_rejected(self):
        with self.assertRaises(Invalid): graph.parse_alloy(process(), {}, self.graph)

    def test_alloy_unknown_rejected(self):
        command = {"name": "NoViolation", "type": "check", "source": "check NoViolation for exactly 3 Node", "scopes": ["exactly 3 Node"], "status": "unknown"}
        receipt = {"solver": "sat4j", "commands": {"NoViolation": command}, "timestamp": 1, "repeat": 1, "sigs": {}}
        with self.assertRaises(Invalid): graph.parse_alloy(process(), {"receipt.json": b64(json.dumps(receipt).encode())}, self.graph)

    def test_alloy_unexpected_status_rejected(self):
        command = {"name": "NoViolation", "type": "check", "source": "check NoViolation for exactly 3 Node", "scopes": ["exactly 3 Node"], "status": "pending"}
        receipt = {"solver": "sat4j", "commands": {"NoViolation": command}, "timestamp": 1, "repeat": 1, "sigs": {}}
        with self.assertRaises(Invalid): graph.parse_alloy(process(), {"receipt.json": b64(json.dumps(receipt).encode())}, self.graph)

    def test_souffle_weakened_invocation_rejected(self):
        evidence = {"translation": graph.QUERY, "processes": [process(argv=["/test/tool", "-F", "/test/facts", "-D", "/test/output", "/test/model.dl"])], "artifacts": {"Violation.csv": b64(b"")}}
        with self.assertRaises(Invalid): graph.classify("souffle", evidence, self.graph)

    def test_duplicate_json_rejected(self):
        with self.assertRaises(Invalid): parse('{"outcome": "pass", "outcome": "fail"}')

    def test_version_substring_is_not_exact_version(self):
        with self.assertRaises(Invalid): check_version("souffle", process(b"Version: 12.5 (12.5)\n"))

    def test_capture_limits_output(self):
        with tempfile.TemporaryDirectory(prefix="evf-capture-test-") as temporary:
            result = capture([sys.executable, "-c", "import sys; sys.stdout.write('x'*100000)"], Path(temporary), limit=1000)
            self.assertEqual(result["failure"], "output-limit")

    def test_capture_limits_time(self):
        with tempfile.TemporaryDirectory(prefix="evf-capture-test-") as temporary:
            result = capture([sys.executable, "-c", "import time; time.sleep(3)"], Path(temporary), timeout=0.1)
            self.assertEqual(result["failure"], "timeout")

if __name__ == "__main__":
    unittest.main(verbosity=2)
