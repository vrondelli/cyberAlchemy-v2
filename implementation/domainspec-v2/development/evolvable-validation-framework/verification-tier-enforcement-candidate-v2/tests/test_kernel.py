from __future__ import annotations

import copy, hashlib, json, tempfile, unittest
from pathlib import Path
from jsonschema import Draft202012Validator
from evf_v3.kernel import digest_value, evaluate

ROOT = Path(__file__).resolve().parents[1]

class KernelTests(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory(); self.repo = Path(self.t.name)
        self.repo.joinpath("profile.json").write_bytes(ROOT.joinpath("profile.json").read_bytes())
        self.repo.joinpath("family.json").write_text('{}\n'); self.repo.joinpath("subject.json").write_text('{}\n')
        for i in range(5): self.repo.joinpath(f"raw{i}").write_text(f'{i}\n'); self.repo.joinpath(f"pp{i}").write_text(f'p{i}\n'); self.repo.joinpath(f"mut{i}").write_text(f'm{i}\n')
        self.obligations=[{"obligation_id":f"o{i}","trait":t} for i,t in enumerate(["executable-implementation","theorem-backed","temporal-state","bounded-structural","recursive-relational"])]
        bounds={"denominator":5,"timeout_seconds":60,"max_output_bytes":1048576};bounds["digest"]=digest_value(bounds)
        self.inv={"schema_version":"evf.verification-tier-invocation/v2-candidate","request_id":"t","requested_tier":"V3","profile":self.ref("profile.json"),"property_family":{"family_id":"auth","definition_ref":self.ref("family.json"),"obligations":self.obligations},"subject":self.ref("subject.json"),"bounds":bounds,"providers":[],"controls":[{"control_id":c,"class":c,"expected_non_success":True,"detected":True} for c in ["subject","oracle","denominator","evidence","execution"]],"effect_ceiling":"read-only-isolated-verification"}
        caps=["executable-evaluation","theorem-checking","explicit-state-model-checking","relational-model-finding","datalog-fixed-point"]
        for i,cap in enumerate(caps): self.inv["providers"].append(self.provider(i,cap))
    def tearDown(self): self.t.cleanup()
    def ref(self,name):
        b=self.repo.joinpath(name).read_bytes();return {"path":name,"sha256":hashlib.sha256(b).hexdigest(),"size_bytes":len(b)}
    def provider(self,i,cap):
        p={"schema_version":"evf.verification-tier-provider-receipt/v2-candidate","route_id":f"r{i}","independence_group":f"g{i}","producer_identity":f"p{i}","capability":cap,"obligation_id":f"o{i}","subject_sha256":self.inv["subject"]["sha256"],"bounds_digest":self.inv["bounds"]["digest"],"normalized_outcome":"no-counterexample","fresh":True,"fixture":False,"execution_state":"completed","raw_evidence_ref":self.ref(f"raw{i}"),"raw_evidence_sha256":self.ref(f"raw{i}")["sha256"],"provider_profile_ref":self.ref(f"pp{i}"),"provider_profile_sha256":self.ref(f"pp{i}")["sha256"],"input_refs":[self.ref(f"raw{i}")],"infrastructure":[{"component_id":"shared" if i in [2,3] else f"i{i}","sha256":"a"*64}],"route_mutation":{"mutation_id":f"m{i}","expected_non_success":True,"detected":True,"input_ref":self.ref(f"mut{i}"),"evidence_ref":self.ref(f"mut{i}")}}
        p["payload_digest"]=digest_value(p);return p
    def redigest(self,p): p["payload_digest"]=digest_value({k:v for k,v in p.items() if k!="payload_digest"})
    def test_v3_satisfied(self):
        schema=json.loads((ROOT/"contracts/provider-receipt.v2.schema.json").read_text());Draft202012Validator(schema).validate(self.inv["providers"][0])
        r=evaluate(self.repo,self.inv);self.assertEqual("satisfied",r["contract_state"]);self.assertEqual(["shared"],r["shared_infrastructure"])
    def test_raw_evidence_tamper_fails(self):
        self.inv["providers"][0]["raw_evidence_sha256"]="0"*64;self.redigest(self.inv["providers"][0]);self.assertIn("provider-direct-binding-invalid",evaluate(self.repo,self.inv)["residue"])
    def test_profile_tamper_fails(self):
        self.inv["providers"][0]["provider_profile_sha256"]="0"*64;self.redigest(self.inv["providers"][0]);self.assertIn("provider-direct-binding-invalid",evaluate(self.repo,self.inv)["residue"])
    def test_duplicate_producer_fails(self):
        self.inv["providers"][1]["producer_identity"]="p0";self.redigest(self.inv["providers"][1]);self.assertIn("provider-independence-invalid",evaluate(self.repo,self.inv)["residue"])
    def test_missing_trait_fails(self):
        self.inv["providers"].pop();self.assertIn("trait-or-obligation-coverage-incomplete",evaluate(self.repo,self.inv)["residue"])
    def test_surviving_mutation_fails(self):
        self.inv["providers"][2]["route_mutation"]["detected"]=False;self.redigest(self.inv["providers"][2]);self.assertIn("route-mutation-missing-or-survived",evaluate(self.repo,self.inv)["residue"])
    def test_missing_control_fails_without_tier(self):
        self.inv["controls"].pop();r=evaluate(self.repo,self.inv);self.assertIsNone(r["verified_tier"])
    def test_disagreement_never_votes(self):
        other=copy.deepcopy(self.inv["providers"][2]);other["route_id"]="r-extra";other["independence_group"]="g-extra";other["producer_identity"]="p-extra";other["normalized_outcome"]="counterexample";self.redigest(other);self.inv["providers"].append(other);self.assertEqual("conflicting_evidence",evaluate(self.repo,self.inv)["contract_state"])
    def test_subject_drift_fails(self):
        self.repo.joinpath("subject.json").write_text('changed\n');self.assertIn("subject-binding-drift",evaluate(self.repo,self.inv)["residue"])
    def test_unknown_field_fails(self):
        self.inv["extra"]=True;self.assertIn("invocation-shape-invalid",evaluate(self.repo,self.inv)["residue"])

if __name__=="__main__": unittest.main()
