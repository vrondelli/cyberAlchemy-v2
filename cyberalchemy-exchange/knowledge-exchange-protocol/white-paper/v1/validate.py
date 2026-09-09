#!/usr/bin/env python3
"""Validate source currency and minimum structure for the KEP paper draft."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    registry = json.loads((ROOT / "SOURCES.json").read_text())

    seen: set[str] = set()
    local_sources_by_id: dict[str, dict[str, object]] = {}
    for source in registry["local_sources"]:
        source_id = source["source_id"]
        if source_id in seen:
            errors.append(f"duplicate source_id: {source_id}")
        seen.add(source_id)
        local_sources_by_id[source_id] = source
        path = (ROOT / source["path"]).resolve()
        if not path.is_file():
            errors.append(f"missing local source: {source_id}: {source['path']}")
            continue
        actual = sha256(path)
        if actual != source["sha256"]:
            errors.append(
                f"source drift: {source_id}: expected {source['sha256']}, got {actual}"
            )

    required_evf_sources = {
        "LOCAL-EVF-CLAIMS-V2",
        "LOCAL-EVF-FORMAL-RECEIPT-V2",
        "LOCAL-EVF-PROVIDER-OBSERVATIONS",
        "LOCAL-EVF-RELATION-MATRIX",
        "LOCAL-EVF-INDEPENDENT-REVIEW-009",
    }
    missing_evf_sources = sorted(required_evf_sources - set(local_sources_by_id))
    for source_id in missing_evf_sources:
        errors.append(f"missing EVF source: {source_id}")

    required_hosted_governance_sources = {
        "LOCAL-HOSTED-DEFINITION-ACCEPTANCE",
        "LOCAL-HOSTED-CAPABILITY-ADOPTION",
        "LOCAL-HOSTED-ONTOLOGY-CANDIDATE",
        "LOCAL-HOSTED-ONTOLOGY-ADMISSION",
        "LOCAL-HOSTED-DOMAINSPEC-CANDIDATE",
        "LOCAL-HOSTED-DOMAINSPEC-ADMISSION",
        "LOCAL-HOSTED-SYSTEM-ONTOLOGY-CANDIDATE",
        "LOCAL-HOSTED-SYSTEM-ONTOLOGY-PREACCEPTANCE",
        "LOCAL-HOSTED-SYSTEM-ONTOLOGY-ADMISSION",
        "LOCAL-HOSTED-IMPLEMENTATION-BINDING-CANDIDATE",
        "LOCAL-HOSTED-IMPLEMENTATION-BINDING-PREACCEPTANCE",
        "LOCAL-HOSTED-IMPLEMENTATION-BINDING-ACCEPTANCE",
        "LOCAL-HOSTED-IMPLEMENTATION-BINDING-RECORD-002",
        "LOCAL-HOSTED-IMPLEMENTATION-BINDING-CANDIDATE-002",
        "LOCAL-HOSTED-IMPLEMENTATION-BINDING-PREACCEPTANCE-002",
        "LOCAL-HOSTED-IMPLEMENTATION-BINDING-DRIFT-002",
    }
    missing_hosted_governance_sources = sorted(
        required_hosted_governance_sources - set(local_sources_by_id)
    )
    for source_id in missing_hosted_governance_sources:
        errors.append(f"missing hosted governance source: {source_id}")

    if not missing_hosted_governance_sources:
        definition_acceptance = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-DEFINITION-ACCEPTANCE"]["path"]))
            .resolve()
            .read_text()
        )
        capability_adoption = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-CAPABILITY-ADOPTION"]["path"]))
            .resolve()
            .read_text()
        )
        ontology_candidate = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-ONTOLOGY-CANDIDATE"]["path"]))
            .resolve()
            .read_text()
        )
        ontology_admission = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-ONTOLOGY-ADMISSION"]["path"]))
            .resolve()
            .read_text()
        )
        domainspec_candidate = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-DOMAINSPEC-CANDIDATE"]["path"]))
            .resolve()
            .read_text()
        )
        domainspec_admission = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-DOMAINSPEC-ADMISSION"]["path"]))
            .resolve()
            .read_text()
        )
        system_ontology_candidate = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-SYSTEM-ONTOLOGY-CANDIDATE"]["path"]))
            .resolve()
            .read_text()
        )
        system_ontology_preacceptance = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-SYSTEM-ONTOLOGY-PREACCEPTANCE"]["path"]))
            .resolve()
            .read_text()
        )
        system_ontology_admission = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-SYSTEM-ONTOLOGY-ADMISSION"]["path"]))
            .resolve()
            .read_text()
        )
        implementation_binding_candidate = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-IMPLEMENTATION-BINDING-CANDIDATE"]["path"]))
            .resolve()
            .read_text()
        )
        implementation_binding_preacceptance = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-IMPLEMENTATION-BINDING-PREACCEPTANCE"]["path"]))
            .resolve()
            .read_text()
        )
        implementation_binding_acceptance = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-IMPLEMENTATION-BINDING-ACCEPTANCE"]["path"]))
            .resolve()
            .read_text()
        )
        implementation_binding_record_002 = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-IMPLEMENTATION-BINDING-RECORD-002"]["path"]))
            .resolve()
            .read_text()
        )
        implementation_binding_candidate_002 = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-IMPLEMENTATION-BINDING-CANDIDATE-002"]["path"]))
            .resolve()
            .read_text()
        )
        implementation_binding_preacceptance_002 = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-IMPLEMENTATION-BINDING-PREACCEPTANCE-002"]["path"]))
            .resolve()
            .read_text()
        )
        implementation_binding_drift_002 = json.loads(
            (ROOT / str(local_sources_by_id["LOCAL-HOSTED-IMPLEMENTATION-BINDING-DRIFT-002"]["path"]))
            .resolve()
            .read_text()
        )
        if definition_acceptance.get("acceptance", {}).get("lifecycle_status") != "accepted":
            errors.append("hosted definition decision is not accepted")
        if capability_adoption.get("adoption", {}).get("lifecycle_status") != "adopted":
            errors.append("hosted Product Capability decision is not adopted")
        if ontology_candidate.get("admission_status") != "not-requested":
            errors.append("hosted ontology candidate unexpectedly claims admission")
        if ontology_candidate.get("material_digest") != "561fa9497a13a3b011908d703dbea5ebd4e21919a382ef2b408e6e8cc56a8c1d":
            errors.append("hosted ontology candidate material digest changed")
        admission = ontology_admission.get("admission", {})
        if admission.get("lifecycle_status") != "admitted":
            errors.append("hosted ontology decision is not admitted")
        if admission.get("admitted_candidate_sha256") != "d70444430addaf592efac682273898ce7d8856e0a9599c08a8d95a48b6c2f1a4":
            errors.append("hosted ontology admission candidate digest changed")
        if admission.get("admitted_material_digest") != "561fa9497a13a3b011908d703dbea5ebd4e21919a382ef2b408e6e8cc56a8c1d":
            errors.append("hosted ontology admission material digest changed")
        if domainspec_candidate.get("admission_status") != "not-requested":
            errors.append("hosted DomainSpec candidate unexpectedly claims admission")
        if domainspec_candidate.get("source_material_digest") != "0df6308ca5b32a273ca0798ca624491dc1fe44c4607e3f0d55e663f1e4fd314b":
            errors.append("hosted DomainSpec source material digest changed")
        if domainspec_candidate.get("predecessor", {}).get("admission_decision_sha256") != "409015aefa426abd0ceeb7438fa96b434a7e15e7d58c3feeb8209012ca2d6706":
            errors.append("hosted DomainSpec ontology predecessor changed")
        domainspec_source_admission = domainspec_admission.get("admission", {})
        if domainspec_source_admission.get("lifecycle_status") != "admitted":
            errors.append("hosted DomainSpec source decision is not admitted")
        if domainspec_source_admission.get("admitted_candidate_sha256") != "4a14ac7c158376a3db13f55b2dc828ea1c3ec83e40d4ec0d7bd70a69a68650e4":
            errors.append("hosted DomainSpec admission candidate digest changed")
        if domainspec_source_admission.get("admitted_source_material_digest") != "0df6308ca5b32a273ca0798ca624491dc1fe44c4607e3f0d55e663f1e4fd314b":
            errors.append("hosted DomainSpec admission material digest changed")
        if domainspec_admission.get("successor_authorization", {}).get("compiled_graph_or_system_ontology_admission") != "not-authorized":
            errors.append("hosted DomainSpec decision inflated successor authority")
        if system_ontology_candidate.get("candidate_set_digest") != "8aa30019a659b5131c9f524e7bcdb3b7679b7ea5712e3e8e6ebd28a46d281c1f":
            errors.append("hosted system ontology candidate-set digest changed")
        if system_ontology_candidate.get("admission_status") != "not-requested":
            errors.append("hosted system ontology candidate unexpectedly claims admission")
        if system_ontology_candidate.get("predecessor", {}).get("domainspec_source_admission", {}).get("sha256") != "9df4785c383cb8fe22854c1070d6966bc7217a2f2545ad9fee256179019d191f":
            errors.append("hosted system ontology DomainSpec predecessor changed")
        if system_ontology_preacceptance.get("candidate_sha256") != "37b5b8531e13058bc39a61ee7572ea3059376cd54851f9717f19e02de2359aa4":
            errors.append("hosted system ontology preacceptance candidate changed")
        if system_ontology_preacceptance.get("result") != "PASS":
            errors.append("hosted system ontology preacceptance did not pass")
        if system_ontology_preacceptance.get("admission_status") != "not-requested":
            errors.append("hosted system ontology preacceptance inflated admission")
        system_admission = system_ontology_admission.get("admission", {})
        if system_admission.get("lifecycle_status") != "admitted":
            errors.append("hosted system ontology decision is not admitted")
        if system_admission.get("admitted_candidate_sha256") != "37b5b8531e13058bc39a61ee7572ea3059376cd54851f9717f19e02de2359aa4":
            errors.append("hosted system ontology admission candidate changed")
        if system_admission.get("admitted_candidate_set_digest") != "8aa30019a659b5131c9f524e7bcdb3b7679b7ea5712e3e8e6ebd28a46d281c1f":
            errors.append("hosted system ontology admitted set changed")
        if system_ontology_admission.get("successor_authorization", {}).get("implementation_binding_acceptance") != "not-authorized":
            errors.append("hosted system ontology decision inflated successor authority")
        if implementation_binding_candidate.get("acceptance_status") != "not-requested":
            errors.append("hosted implementation binding candidate unexpectedly claims acceptance")
        if implementation_binding_candidate.get("binding_record", {}).get("sha256") != "50a0e5ce9cbc811c8e9d5249b28ae0c1bb4b19824d27a8b4adce7dd7afd2bf92":
            errors.append("hosted implementation binding record digest changed")
        if implementation_binding_candidate.get("implementation_material", {}).get("sha256") != "e96a517ca08db35294010db5002a02ae8ccc37e1d2b0d14bc834cc2eca92795f":
            errors.append("hosted implementation material digest changed")
        if implementation_binding_candidate.get("predecessor", {}).get("system_ontology_admission", {}).get("sha256") != "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677":
            errors.append("hosted implementation binding system-ontology predecessor changed")
        if implementation_binding_candidate.get("ontology_bindings", {}).get("selector_bindings_total") != 31:
            errors.append("hosted implementation selector binding count changed")
        if implementation_binding_preacceptance.get("candidate_sha256") != "25e7afc5ab29cc9f52a4f63fc74b25db45d68e6853e4b11f540b4995d9d4d925":
            errors.append("hosted implementation binding preacceptance candidate changed")
        if implementation_binding_preacceptance.get("result") != "PASS":
            errors.append("hosted implementation binding preacceptance did not pass")
        if implementation_binding_preacceptance.get("acceptance_status") != "not-requested":
            errors.append("hosted implementation binding preacceptance inflated acceptance")
        binding_acceptance = implementation_binding_acceptance.get("acceptance", {})
        if binding_acceptance.get("lifecycle_status") != "accepted":
            errors.append("hosted implementation binding decision is not accepted")
        if binding_acceptance.get("accepted_candidate_sha256") != "25e7afc5ab29cc9f52a4f63fc74b25db45d68e6853e4b11f540b4995d9d4d925":
            errors.append("hosted implementation binding accepted candidate changed")
        if binding_acceptance.get("accepted_binding_record_sha256") != "50a0e5ce9cbc811c8e9d5249b28ae0c1bb4b19824d27a8b4adce7dd7afd2bf92":
            errors.append("hosted implementation binding accepted record changed")
        if binding_acceptance.get("accepted_implementation_material_sha256") != "e96a517ca08db35294010db5002a02ae8ccc37e1d2b0d14bc834cc2eca92795f":
            errors.append("hosted implementation binding accepted material changed")
        if implementation_binding_acceptance.get("successor_authorization", {}).get("implementation_conformance_assessment") != "not-authorized-by-this-decision":
            errors.append("hosted implementation binding decision inflated conformance authority")
        if implementation_binding_record_002.get("implementation_material_sha256") != "b48ab24d96eb5fd19144baf2bc0406bdd765fce646c80ee5ccc122e55ae6fb75":
            errors.append("hosted replacement binding record material changed")
        if implementation_binding_candidate_002.get("acceptance_status") != "not-requested":
            errors.append("hosted replacement binding candidate unexpectedly claims acceptance")
        if implementation_binding_candidate_002.get("binding_record", {}).get("sha256") != "41c3bf98980d41efa4979856e72ccc7e2707f89ff4c94c41edfd66a95b3f76af":
            errors.append("hosted replacement binding snapshot digest changed")
        if implementation_binding_candidate_002.get("implementation_material", {}).get("sha256") != "b48ab24d96eb5fd19144baf2bc0406bdd765fce646c80ee5ccc122e55ae6fb75":
            errors.append("hosted replacement implementation material changed")
        if implementation_binding_candidate_002.get("replacement_context", {}).get("historical_acceptance_decision", {}).get("sha256") != "993d8bb23435a0fe568b602f71f3988a2cf642ed5b529097499ca83f01991748":
            errors.append("hosted replacement candidate historical acceptance changed")
        if implementation_binding_preacceptance_002.get("candidate_sha256") != "9288302121e4d86bdb72eec29296fc476693edc679f96f1a03a12f9bda780f00":
            errors.append("hosted replacement preacceptance candidate changed")
        if implementation_binding_preacceptance_002.get("result") != "PASS":
            errors.append("hosted replacement binding preacceptance did not pass")
        if implementation_binding_preacceptance_002.get("acceptance_status") != "not-requested":
            errors.append("hosted replacement preacceptance inflated acceptance")
        if implementation_binding_drift_002.get("candidate_sha256") != "9288302121e4d86bdb72eec29296fc476693edc679f96f1a03a12f9bda780f00":
            errors.append("hosted replacement drift receipt candidate changed")
        if implementation_binding_drift_002.get("result") != "BLOCK":
            errors.append("hosted replacement drift receipt is not BLOCK")
        if implementation_binding_drift_002.get("candidate_currentness") != "stale-after-preacceptance":
            errors.append("hosted replacement drift receipt currentness changed")
        if implementation_binding_drift_002.get("acceptance_status") != "not-requested":
            errors.append("hosted replacement drift receipt inflated acceptance")

    if not missing_evf_sources:
        def load_local_json(source_id: str) -> dict[str, object]:
            source = local_sources_by_id[source_id]
            return json.loads((ROOT / str(source["path"])).resolve().read_text())

        evf_claims = load_local_json("LOCAL-EVF-CLAIMS-V2")
        formal_receipt = load_local_json("LOCAL-EVF-FORMAL-RECEIPT-V2")
        provider_observations = load_local_json("LOCAL-EVF-PROVIDER-OBSERVATIONS")
        relation_matrix = load_local_json("LOCAL-EVF-RELATION-MATRIX")
        independent_review = load_local_json("LOCAL-EVF-INDEPENDENT-REVIEW-009")

        claims = evf_claims.get("claims", [])
        projection_count = sum(len(claim.get("providers", [])) for claim in claims)
        if len(claims) != 7:
            errors.append(f"EVF claim count changed: expected 7, got {len(claims)}")
        if projection_count != 15:
            errors.append(
                f"EVF declared projection count changed: expected 15, got {projection_count}"
            )
        if formal_receipt.get("status") != "PASS_BOUNDED":
            errors.append("EVF formal receipt is not PASS_BOUNDED")
        if formal_receipt.get("claim_count") != len(claims):
            errors.append("EVF formal receipt claim count does not match claim source")
        if formal_receipt.get("projection_count") != projection_count:
            errors.append("EVF formal receipt projection count does not match claim source")
        if formal_receipt.get("two_run_determinism") is not True:
            errors.append("EVF formal receipt lacks two-run determinism")

        expected_provider_cases = {
            "RUST-LOCAL-CONFORMANCE": 29,
            "CRYPTO-KNOWN-ANSWER-HARNESS": 3,
            "SQL-THREE-LAYER-INTEGRATION": 1,
            "SOLANA-PROGRAM-TEST": 13,
            "PROTOCOL-LOCAL-FORMAL-PROVIDERS": 7,
        }
        actual_provider_cases = {
            observation.get("provider_id"): observation.get("observed_cases")
            for observation in provider_observations.get("observations", [])
            if observation.get("bounded_result") == "PASS_BOUNDED"
        }
        if actual_provider_cases != expected_provider_cases:
            errors.append(
                "EVF provider observation cases changed: "
                f"expected {expected_provider_cases}, got {actual_provider_cases}"
            )

        if relation_matrix.get("relation_count") != 204:
            errors.append("EVF relation count changed from 204")
        if relation_matrix.get("distinct_record_count") != 204:
            errors.append("EVF distinct relation record count changed from 204")

        severity_counts = independent_review.get("severity_counts", {})
        if independent_review.get("result") != "PASS_BOUNDED":
            errors.append("EVF independent review 009 is not PASS_BOUNDED")
        if independent_review.get("unresolved_high_or_critical") is not False:
            errors.append("EVF independent review has unresolved high or critical findings")
        if severity_counts.get("medium") != 10:
            errors.append("EVF independent review medium-residue count changed from 10")

    external_ids: set[str] = set()
    for source in registry["external_sources"]:
        source_id = source["source_id"]
        if source_id in external_ids:
            errors.append(f"duplicate external source_id: {source_id}")
        external_ids.add(source_id)
        if not source["url"].startswith("https://"):
            errors.append(f"external source is not HTTPS: {source_id}")

    required_files = [
        "README.md",
        "WHITE-PAPER.md",
        "RESEARCH-PLAN.md",
        "SOURCES.json",
        "CLAIM-LEDGER.md",
        "EVIDENCE-MATRIX.md",
        "RELATED-WORK.md",
        "research/TOWER.md",
        "research/levels/L0-corpus.md",
        "research/levels/L1-residue-map.md",
        "research/levels/L2-closure-plan.md",
        "research/levels/L0-current-evidence-baseline.md",
        "research/gates/closure-gates.md",
        "research/residue/open-residue.md",
    ]
    for relative in required_files:
        if not (ROOT / relative).is_file():
            errors.append(f"missing package file: {relative}")

    paper = (ROOT / "WHITE-PAPER.md").read_text()
    required_sections = [
        "## Abstract",
        "## 1. Who encrypts, what is stored, and what Solana proves",
        "## 2. The problem: knowledge does not behave like a coin",
        "## 5. Protocol invariants",
        "## 7. Layered architecture",
        "## 10. Construction method: definitions before implementation",
        "## 12. Evidence",
        "## 13. Threat and failure model",
        "## 16. What remains to be proved",
        "## References",
    ]
    for heading in required_sections:
        if heading not in paper:
            errors.append(f"missing paper section: {heading}")

    paper_claim_ledger = (ROOT / "CLAIM-LEDGER.md").read_text()
    evidence_matrix = (ROOT / "EVIDENCE-MATRIX.md").read_text()
    for token in [
        "WP-C17",
        "WP-C18",
        "WP-C19",
        "WP-C20",
        "WP-C21",
        "WP-C22",
    ]:
        if token not in paper_claim_ledger:
            errors.append(f"missing EVF claim-ledger row: {token}")
    for token in [
        "seven claims, fifteen deterministic projections",
        "204/204 distinct relation-to-provider records",
        "ten carried medium residues",
    ]:
        if token not in evidence_matrix:
            errors.append(f"missing EVF evidence-matrix statement: {token}")

    for source_id in external_ids:
        url = next(
            source["url"]
            for source in registry["external_sources"]
            if source["source_id"] == source_id
        )
        if url not in paper and url not in (ROOT / "RELATED-WORK.md").read_text():
            errors.append(f"external source not cited: {source_id}")

    result = {
        "result": "PASS" if not errors else "BLOCK",
        "paper_id": registry["paper_id"],
        "local_source_count": len(registry["local_sources"]),
        "evf_claim_count": 7,
        "evf_projection_count": 15,
        "external_source_count": len(registry["external_sources"]),
        "paper_sha256": sha256(ROOT / "WHITE-PAPER.md"),
        "authority_effect": "none",
        "publication_status": "not-authorized",
        "errors": errors,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
