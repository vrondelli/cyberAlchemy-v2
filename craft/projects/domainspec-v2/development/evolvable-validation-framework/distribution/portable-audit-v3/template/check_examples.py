#!/usr/bin/env python3
"""Recheck a shipped historical claim projection, without claiming a fresh tool execution."""
import sys
from pathlib import Path
sys.dont_write_bytecode = True
KIT = Path(__file__).resolve().parent
sys.path.insert(0, str(KIT / "adapters"))
from common import Invalid, data, digest, file, read, sha
import driver
import evf_core

def verify():
    evf_core.check_kit()
    package = read(KIT / "FORMAL-CLAIM.json")
    if package["schema_version"] != "evf.checked-example-claims/v1" or package["scope"] != "bundled-synthetic-examples-only":
        raise Invalid("Unexpected example-claim scope")
    recorded_digest = package.pop("claim_package_digest")
    if digest(package) != recorded_digest:
        raise Invalid("Example claim-package digest mismatch")
    if len(package["claims"]) != 5 or {c["provider"] for c in package["claims"]} != set(driver.KINDS):
        raise Invalid("Example claim denominator changed")
    catalog = read(KIT / "TOOLCHAINS.json")
    for claim in package["claims"]:
        if claim["status"] != "recorded-supported-for-example-scope" or claim["whole_system_claim"] or claim["evidence_kind"] != driver.KINDS[claim["provider"]]:
            raise Invalid("Example claim status/kind inflated")
        source = file(KIT, claim["source"]["path"])
        if sha(source) != claim["source"]["sha256"]:
            raise Invalid("Example source drift")
        for dependency in claim["dependencies"]:
            if sha(file(KIT, dependency["path"])) != dependency["sha256"]:
                raise Invalid("Example dependency drift")
        observed = read(file(KIT, claim["evidence"]["path"]))
        if digest(observed) != claim["evidence"]["digest"] or len(observed["records"]) != 4:
            raise Invalid("Example native evidence drift or wrong denominator")
        if observed["runtime_catalog"] != {name: catalog["tools"][name] for name in driver.REQUIRED[claim["provider"]] if name in catalog["tools"]}:
            raise Invalid("Example runtime provenance differs from catalog")
        counts = {"supported": 0, "negative": 0}
        details = []
        for record in observed["records"]:
            request = read(file(KIT, record["request"]))
            outcome, actual = driver.classify(request, record["native_evidence"], KIT / "formal-example")
            if record["normalized_outcome"] != outcome or record["details"] != actual:
                raise Invalid("Projected native evidence does not match its result")
            if outcome == "supported":
                counts["supported"] += 1
                details.append(actual)
                expected_property = request["options"] if claim["provider"] in ("lean", "cbmc", "tlc") else read(source)
                if expected_property != claim["machine_property"]:
                    raise Invalid("Example machine property drift")
                expected_dependencies = [{"path": "formal-example/" + str(p.relative_to(KIT / "formal-example")), "sha256": sha(p)}
                                         for p in driver.dependencies(KIT / "formal-example", request)]
                if expected_dependencies != claim["dependencies"]:
                    raise Invalid("Example dependency denominator changed")
                if (KIT / "formal-example" / request["source"]).resolve() != source:
                    raise Invalid("Claim describes a different example source")
            elif outcome == ("rejected-proof" if claim["provider"] == "lean" else "counterexample"):
                counts["negative"] += 1
            else:
                raise Invalid("Unsupported negative evidence")
        if counts != {"supported": 2, "negative": 2} or details[0] != details[1] or details[0] != claim["observed_details"]:
            raise Invalid("Example repetitions or details changed")
    return {"verdict": "snapshot-consistent", "claims_checked": 5,
            "current_tool_execution": "not-performed", "whole_system_claim": False,
            "meaning": "Historical projected evidence for shipped examples only; rerun formal-run for current owner evidence"}

if __name__ == "__main__":
    try:
        print(data(verify()).decode(), end="")
    except (Invalid, OSError, ValueError, KeyError, TypeError) as error:
        print(data({"verdict": "not_evaluable", "reason": str(error)}).decode(), end="")
        sys.exit(2)
