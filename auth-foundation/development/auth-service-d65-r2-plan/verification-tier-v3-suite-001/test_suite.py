from __future__ import annotations
import copy, importlib.util, json, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parent
AUTHOR=ROOT/"evidence/author-attempt-005"
UMBRELLA=next(p for p in ROOT.parents if p.name=="domainspec-core").parent
KPATH=UMBRELLA/"cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/verification-tier-enforcement-candidate-v2/evf_v3/kernel.py"
spec=importlib.util.spec_from_file_location("suite_test_kernel",KPATH);assert spec and spec.loader
K=importlib.util.module_from_spec(spec);spec.loader.exec_module(K)

class SuiteTests(unittest.TestCase):
    def invocation(self): return json.loads((AUTHOR/"V3-INVOCATION.json").read_text())
    def redigest(self,p): p["payload_digest"]=K.digest_value({k:v for k,v in p.items() if k!="payload_digest"})
    def test_author_v3_is_satisfied(self):
        r=K.evaluate(UMBRELLA,self.invocation());self.assertEqual("V3",r["verified_tier"]);self.assertEqual("no_counterexample_within_bounds",r["property_outcome"])
    def test_direct_raw_evidence_tamper_fails(self):
        i=self.invocation();i["providers"][0]["raw_evidence_sha256"]="0"*64;self.redigest(i["providers"][0]);self.assertIn("provider-direct-binding-invalid",K.evaluate(UMBRELLA,i)["residue"])
    def test_provider_profile_tamper_fails(self):
        i=self.invocation();i["providers"][1]["provider_profile_sha256"]="0"*64;self.redigest(i["providers"][1]);self.assertIn("provider-direct-binding-invalid",K.evaluate(UMBRELLA,i)["residue"])
    def test_producer_alias_fails(self):
        i=self.invocation();i["providers"][1]["producer_identity"]=i["providers"][0]["producer_identity"];self.redigest(i["providers"][1]);self.assertIn("provider-independence-invalid",K.evaluate(UMBRELLA,i)["residue"])
    def test_missing_obligation_fails(self):
        i=self.invocation();i["providers"].pop();self.assertIn("trait-or-obligation-coverage-incomplete",K.evaluate(UMBRELLA,i)["residue"])
    def test_survived_mutation_fails(self):
        i=self.invocation();i["providers"][2]["route_mutation"]["detected"]=False;self.redigest(i["providers"][2]);self.assertIn("route-mutation-missing-or-survived",K.evaluate(UMBRELLA,i)["residue"])
    def test_same_obligation_disagreement_never_votes(self):
        i=self.invocation();p=copy.deepcopy(i["providers"][2]);p["route_id"]="auth-tla-second";p["independence_group"]="auth-tla-second";p["producer_identity"]="tlc-second";p["normalized_outcome"]="counterexample";self.redigest(p);i["providers"].append(p);self.assertEqual("conflicting_evidence",K.evaluate(UMBRELLA,i)["contract_state"])
    def test_shared_java_is_reported(self): self.assertEqual(["java17"],K.evaluate(UMBRELLA,self.invocation())["shared_infrastructure"])
    def test_exact_tool_infrastructure_is_declared(self):
        providers={p["route_id"]:p for p in self.invocation()["providers"]}
        self.assertEqual({"java17","alloy-6.2.0"},{x["component_id"] for x in providers["auth-alloy"]["infrastructure"]})
        self.assertEqual({"souffle-wrapper","souffle-2.5"},{x["component_id"] for x in providers["auth-souffle"]["infrastructure"]})
    def test_each_route_mutation_is_detected(self): self.assertTrue(all(p["route_mutation"]["detected"] for p in self.invocation()["providers"]))
    def test_each_route_binds_inputs_and_mutant(self):
        for p in self.invocation()["providers"]: self.assertTrue(p["input_refs"]);self.assertIn("input_ref",p["route_mutation"])
    def test_formal_route_summaries_pass(self):
        for route in ["rust","lean","tla","alloy","souffle"]: self.assertEqual("pass",json.loads((AUTHOR/f"{route}-route-result.json").read_text())["status"])
    def test_declared_denominators_match_models(self):
        lean=json.loads((ROOT/"profiles/lean.json").read_text());souffle=json.loads((ROOT/"profiles/souffle.json").read_text())
        theorem_count=sum(1 for name in ["ExactPermissionPolicy.lean","AuthRustProjection.lean"] for line in (ROOT.parent/"repair-assurance-transfer-epoch-001"/name).read_text().splitlines() if line.startswith("theorem "))
        roles={value for line in (ROOT/"models/AuthDelegation.dl").read_text().splitlines() for value in __import__('re').findall(r'"(root-a|root-b|team-a|leaf-a|leaf-b)"',line)}
        self.assertEqual(lean["bounds"]["theorems"],theorem_count);self.assertEqual(souffle["bounds"]["roles"],len(roles))

if __name__=="__main__":unittest.main()
