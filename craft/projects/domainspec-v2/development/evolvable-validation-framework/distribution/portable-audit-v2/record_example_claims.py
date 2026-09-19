#!/usr/bin/env python3
"""Export an explicitly labelled portable projection from currently verified synthetic evidence."""
import argparse
import copy
from datetime import datetime, timezone
from pathlib import Path
import runpy
import sys
HERE = Path(__file__).resolve().parent
KIT = HERE / "kit"
sys.dont_write_bytecode = True
sys.path.insert(0, str(KIT))
import formal
from common import data, digest, file, read, save, sha

def record(root, claims_path):
    formal.core.check_kit()
    verification = formal.verify_formal(root, str(claims_path))
    bundle = read(claims_path)
    tools = read(formal.verify_ref(root, bundle["tools_ref"]))
    paths = formal.check_tools(root, tools)
    replacements = {str(p): "@tool:" + name for name, p in paths.items()}
    catalog = read(KIT / "TOOLCHAINS.json")
    claims = []
    for claim, job in zip(bundle["claims"], bundle["jobs"], strict=True):
        provider = claim["provider"]
        source_name = "formal-example/" + claim["source_ref"]["path"]
        source = file(KIT, source_name)
        if sha(source) != claim["source_ref"]["sha256"]:
            raise ValueError("Only the exact shipped synthetic examples may be projected")
        records = []
        for reference in job["records"]:
            original = read(formal.verify_ref(root, reference))
            request_name = "formal-example/" + original["request_ref"]["path"]
            if sha(file(KIT, request_name)) != original["request_ref"]["sha256"]:
                raise ValueError("Request differs from shipped example")
            native = copy.deepcopy(original["native_evidence"])
            for process in native["processes"]:
                process["argv"] = [replacements.get(arg, arg) for arg in process["argv"]]
            records.append({"request": request_name, "native_evidence": native,
                            "normalized_outcome": original["normalized_outcome"], "details": original["details"],
                            "source_receipt_digest": original["receipt_digest"]})
        projected = {"schema_version": "evf.portable-example-evidence-projection/v1", "provider": provider,
                     "projection_notice": "Tool paths replaced by symbolic names; raw stdout/stderr and tool artifacts preserved. Not the original EVF receipt and not current host evidence.",
                     "runtime_catalog": {n: catalog["tools"][n] for n in formal.driver.REQUIRED[provider] if n in catalog["tools"]},
                     "records": records}
        evidence_name = "checked-examples/" + claim["claim_id"] + ".json"
        save(KIT / evidence_name, projected)
        claims.append({"claim_id": claim["claim_id"], "provider": provider, "evidence_kind": claim["evidence_kind"],
                       "status": "recorded-supported-for-example-scope", "whole_system_claim": False,
                       "statement": claim["author_description"], "machine_property": claim["machine_property"],
                       "source": {"path": source_name, "sha256": sha(source)},
                       "assumptions": claim["assumptions"], "limits": claim["limits"], "observed_details": claim["observed_details"],
                       "evidence": {"path": evidence_name, "digest": digest(projected)}})
    package = {"schema_version": "evf.checked-example-claims/v1", "scope": "bundled-synthetic-examples-only",
               "recorded_at": datetime.now(timezone.utc).isoformat(), "claims": claims,
               "source_bundle_digest": verification["bundle_digest"],
               "source_verification": "Full current EVF and native-evidence checks passed before projection",
               "authority_effect": "none", "runtime_conformance_of_owner_code": "not-claimed"}
    package["claim_package_digest"] = digest(package)
    save(KIT / "FORMAL-CLAIM.json", package)
    runpy.run_path(str(KIT / "build.py"))["manifest"]()
    print(data({"status": "recorded", "claims": len(claims), "path": str(KIT / "FORMAL-CLAIM.json")}).decode(), end="")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--claims", required=True)
    args = parser.parse_args()
    record(Path(args.workspace).resolve(strict=True), Path(args.claims).resolve(strict=True))
