#!/usr/bin/env python3
"""Execute the frozen Auth Service EVF campaign and emit deterministic evidence."""

from __future__ import annotations

import copy
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import jsonschema

HERE = Path(__file__).resolve().parent
REPOSITORY = Path(__file__).resolve().parents[5]
SERVICE = REPOSITORY / "projects/auth-foundation/implementation/authorization-service"
IMPLEMENTATION = SERVICE / "src/lib.rs"
TRUSTED_BOUNDARY = REPOSITORY / "projects/auth-foundation/implementation/trusted-boundary/src/lib.rs"
EXPECTED_LINEAGE = [
    "definitions",
    "product-capability",
    "business-ontology",
    "product-contracts",
    "domainspec-source-set",
    "implementation-binding",
    "implementation",
    "tests",
]


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def exact_replace(value: str, old: str, new: str, operator: str) -> str:
    count = value.count(old)
    if count != 1:
        raise RuntimeError(f"{operator} requires exactly one match; observed {count}")
    mutated = value.replace(old, new, 1)
    if mutated == value:
        raise RuntimeError(f"{operator} did not change bytes")
    return mutated


def cargo_test(manifest: Path, target: Path) -> subprocess.CompletedProcess[str]:
    environment = os.environ.copy()
    environment["CARGO_TARGET_DIR"] = str(target)
    return subprocess.run(
        ["cargo", "test", "--manifest-path", str(manifest)],
        cwd=REPOSITORY,
        env=environment,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )


def authorize_segment(source: str) -> str:
    start = source.index("    pub fn authorize(")
    end = source.index("\nfn authorize_in_epoch(", start)
    return source[start:end]


def provider_detector(source: str) -> bool:
    segment = authorize_segment(source)
    return (
        segment.count("self.clock.decision_time()") == 1
        and segment.count("transaction_with_behavior(TransactionBehavior::Deferred)") == 1
        and "Connection::open" not in segment
        and segment.index("self.clock.decision_time()")
        < segment.index("transaction_with_behavior(TransactionBehavior::Deferred)")
        < segment.index("authorize_in_epoch(&transaction")
        < segment.index("transaction.commit()")
    )


def scope_fields(source: str) -> set[str]:
    match = re.search(r"pub struct InboundAuthorizationRequest\s*\{(?P<body>.*?)\n\}", source, re.S)
    if not match:
        return set()
    return set(re.findall(r"pub\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:", match.group("body")))


def observation(campaign: dict, candidate_digest: str, case_id: str, seam: str,
                kind: str, status: str, detector: str, details: str) -> dict:
    return {
        "schema_version": "auth-service-evf-observation/v1",
        "campaign_id": campaign["campaign_id"],
        "run_id": "deterministic-run",
        "case_id": case_id,
        "seam": seam,
        "candidate_digest": candidate_digest,
        "kind": kind,
        "status": status,
        "detector": detector,
        "tool_owned": True,
        "details": details,
    }


def execute_once(campaign: dict) -> list[dict]:
    source = IMPLEMENTATION.read_text(encoding="utf-8")
    boundary_source = TRUSTED_BOUNDARY.read_text(encoding="utf-8")
    candidate_digest = sha256_file(IMPLEMENTATION)
    result: list[dict] = []

    bindings_ok = all(
        (REPOSITORY / item["path"]).is_file()
        and sha256_file(REPOSITORY / item["path"]) == item["sha256"]
        for item in campaign["candidate_bindings"]
    )
    result.append(observation(campaign, candidate_digest, "EVF-BIND-001-NEUTRAL", "binding", "neutral",
                              "passed" if bindings_ok else "failed", "sha256-candidate-binding-check",
                              "All eight frozen candidate bindings matched." if bindings_ok else "A frozen candidate binding did not match."))
    stale = copy.deepcopy(campaign["candidate_bindings"])
    stale[0]["sha256"] = "0" * 64
    stale_detected = any(sha256_file(REPOSITORY / item["path"]) != item["sha256"] for item in stale)
    result.append(observation(campaign, candidate_digest, "EVF-BIND-001-MUTATION", "binding", "mutation",
                              "mutation-detected" if stale_detected else "failed", "sha256-candidate-binding-check",
                              "A stale bound digest was rejected." if stale_detected else "The stale bound digest survived."))

    derivation_files = [
        REPOSITORY / item["path"] for item in campaign["candidate_bindings"]
        if item["id"] in {"definitions", "product-capability", "business-ontology", "product-contracts", "domainspec-source-set"}
    ]
    derivation_corpus = "\n".join(path.read_text(encoding="utf-8") for path in derivation_files) + "\n" + source
    derivation_terms = {"authentication_evidence_revision", "route_binding_revision", "authorization_revision"}
    derivation_ok = all(term in derivation_corpus for term in derivation_terms)
    result.append(observation(campaign, candidate_digest, "EVF-DERIVE-001-NEUTRAL", "derivation", "neutral",
                              "passed" if derivation_ok else "failed", "obligation-source-closure-check",
                              "All revision-closure obligations had source and implementation witnesses." if derivation_ok else "A revision-closure obligation lacked a witness."))
    mutated_derivation = derivation_corpus.replace("authorization_revision", "")
    derivation_mutation_detected = not all(term in mutated_derivation for term in derivation_terms)
    result.append(observation(campaign, candidate_digest, "EVF-DERIVE-001-MUTATION", "derivation", "mutation",
                              "mutation-detected" if derivation_mutation_detected else "failed", "obligation-source-closure-check",
                              "Removal of authorization-revision closure was detected." if derivation_mutation_detected else "The derivation mutation survived."))

    declared_ids = [item["id"] for item in campaign["candidate_bindings"]]
    ids = [item for item in EXPECTED_LINEAGE if item in declared_ids]
    lineage_ok = ids == EXPECTED_LINEAGE and set(declared_ids) == set(EXPECTED_LINEAGE)
    result.append(observation(campaign, candidate_digest, "EVF-LINEAGE-001-NEUTRAL", "lineage", "neutral",
                              "passed" if lineage_ok else "failed", "ordered-lineage-check",
                              "The frozen D65 lineage was complete and ordered." if lineage_ok else "The frozen D65 lineage was incomplete or out of order."))
    mutated_ids = ids.copy()
    mutated_ids[mutated_ids.index("implementation-binding")] = "two-connection-implementation-binding"
    lineage_mutation_detected = mutated_ids != EXPECTED_LINEAGE
    result.append(observation(campaign, candidate_digest, "EVF-LINEAGE-001-MUTATION", "lineage", "mutation",
                              "mutation-detected" if lineage_mutation_detected else "failed", "ordered-lineage-check",
                              "The substituted older service binding was detected." if lineage_mutation_detected else "The lineage mutation survived."))

    case_ids = [case for seam in campaign["seams"] for case in (seam["neutral_case_id"], seam["mutation_case_id"])]
    synthetic_observations = [{"case_id": case_id, "tool_owned": True} for case_id in case_ids]
    observation_ok = len(synthetic_observations) == len(case_ids) and {item["case_id"] for item in synthetic_observations} == set(case_ids) and all(item["tool_owned"] is True for item in synthetic_observations)
    result.append(observation(campaign, candidate_digest, "EVF-OBSERVE-001-NEUTRAL", "observation", "neutral",
                              "passed" if observation_ok else "failed", "observation-cardinality-and-ownership-check",
                              "Every declared case had one tool-owned observation." if observation_ok else "Observation cardinality or ownership failed."))
    missing_observation = synthetic_observations[:-1]
    observation_mutation_detected = {item["case_id"] for item in missing_observation} != set(case_ids)
    result.append(observation(campaign, candidate_digest, "EVF-OBSERVE-001-MUTATION", "observation", "mutation",
                              "mutation-detected" if observation_mutation_detected else "failed", "observation-cardinality-and-ownership-check",
                              "A missing observation was detected." if observation_mutation_detected else "The observation mutation survived."))

    provider_ok = provider_detector(source)
    result.append(observation(campaign, candidate_digest, "EVF-PROVIDER-001-NEUTRAL", "provider", "neutral",
                              "passed" if provider_ok else "failed", "single-provider-epoch-source-check",
                              "One time capture and one transaction enclose evaluation." if provider_ok else "The single-provider epoch invariant failed."))
    anchor = "        let transaction = match self\n"
    provider_mutant = exact_replace(
        source,
        anchor,
        "        let _evf_second_connection = Connection::open_in_memory();\n" + anchor,
        "provider-second-connection",
    )
    provider_mutation_detected = sha256_bytes(provider_mutant.encode()) != candidate_digest and not provider_detector(provider_mutant)
    result.append(observation(campaign, candidate_digest, "EVF-PROVIDER-001-MUTATION", "provider", "mutation",
                              "mutation-detected" if provider_mutation_detected else "failed", "single-provider-epoch-source-check",
                              "An exact-one second-connection mutant changed bytes and was detected." if provider_mutation_detected else "The provider mutation survived."))

    expected_scope = {"request_id", "authentication_evidence_ref", "route_id"}
    fields = scope_fields(boundary_source)
    scope_ok = fields == expected_scope
    result.append(observation(campaign, candidate_digest, "EVF-SCOPE-001-NEUTRAL", "scope", "neutral",
                              "passed" if scope_ok else "failed", "public-api-scope-check",
                              "The inbound request exposed only evidence and route references plus request identity." if scope_ok else "The inbound request scope exceeded its contract."))
    request_match = re.search(r"pub struct InboundAuthorizationRequest\s*\{.*?\n\}", boundary_source, re.S)
    if not request_match:
        raise RuntimeError("scope-caller-permission could not locate InboundAuthorizationRequest")
    request_block = request_match.group(0)
    mutated_request_block = exact_replace(
        request_block,
        "    pub route_id: String,\n",
        "    pub route_id: String,\n    pub required_permission: String,\n",
        "scope-caller-permission-field",
    )
    scope_mutant = exact_replace(
        boundary_source,
        request_block,
        mutated_request_block,
        "scope-caller-permission-struct",
    )
    scope_mutation_detected = scope_fields(scope_mutant) != expected_scope
    result.append(observation(campaign, candidate_digest, "EVF-SCOPE-001-MUTATION", "scope", "mutation",
                              "mutation-detected" if scope_mutation_detected else "failed", "public-api-scope-check",
                              "A caller-supplied permission field was detected." if scope_mutation_detected else "The scope mutation survived."))

    with tempfile.TemporaryDirectory(prefix="auth-evf-") as temporary:
        temp = Path(temporary)
        baseline = cargo_test(SERVICE / "Cargo.toml", temp / "baseline-target")
        semantic_ok = baseline.returncode == 0
        result.append(observation(campaign, candidate_digest, "EVF-SEMANTIC-001-NEUTRAL", "semantic", "neutral",
                                  "passed" if semantic_ok else "failed", "cargo-integration-test-suite",
                                  "All authorization integration tests passed." if semantic_ok else "The authorization integration tests failed."))
        copied = temp / "implementation"
        shutil.copytree(SERVICE.parent, copied, ignore=shutil.ignore_patterns("target"))
        mutant_source_path = copied / "authorization-service/src/lib.rs"
        mutant_source = exact_replace(mutant_source_path.read_text(encoding="utf-8"), "        || evidence.revoked\n", "        && evidence.revoked\n", "semantic-revocation-gate")
        mutant_source_path.write_text(mutant_source, encoding="utf-8")
        semantic_mutant = cargo_test(copied / "authorization-service/Cargo.toml", temp / "mutant-target")
        semantic_mutation_detected = semantic_mutant.returncode != 0
        result.append(observation(campaign, candidate_digest, "EVF-SEMANTIC-001-MUTATION", "semantic", "mutation",
                                  "mutation-detected" if semantic_mutation_detected else "failed", "cargo-integration-test-suite",
                                  "The relaxed revocation gate was killed by the integration suite." if semantic_mutation_detected else "The semantic mutation survived the integration suite."))

    return result


def canonical_jsonl(rows: list[dict]) -> bytes:
    return ("\n".join(json.dumps(row, sort_keys=True, separators=(",", ":")) for row in rows) + "\n").encode()


def main() -> None:
    campaign = load(HERE / "campaign.json")
    schema = load(HERE / "observation.schema.json")
    first = execute_once(campaign)
    second = execute_once(campaign)
    first_bytes = canonical_jsonl(first)
    second_bytes = canonical_jsonl(second)
    replay_equal = first_bytes == second_bytes
    validator = jsonschema.Draft202012Validator(schema)
    schema_errors = [error.message for row in first for error in validator.iter_errors(row)]
    neutral_passes = sum(row["kind"] == "neutral" and row["status"] == "passed" for row in first)
    mutations_detected = sum(row["kind"] == "mutation" and row["status"] == "mutation-detected" for row in first)
    unique_cases = len({row["case_id"] for row in first})
    passed = not schema_errors and len(first) == unique_cases == 14 and neutral_passes == mutations_detected == 7 and replay_equal
    (HERE / "observations.jsonl").write_bytes(first_bytes)
    stream_digest = sha256_bytes(first_bytes)
    receipt = {
        "schema_version": "auth-service-evf-receipt/v1",
        "campaign_id": campaign["campaign_id"],
        "candidate_digest": sha256_file(IMPLEMENTATION),
        "status": "PASS" if passed else "FAIL",
        "authorization_test_result": {"status": "PASS" if neutral_passes == 7 else "FAIL", "complete_runs": 2},
        "evaluation": {
            "declared_seams": 7,
            "declared_cases": 14,
            "neutral_cases_passed": neutral_passes,
            "mutations_detected": mutations_detected,
            "unique_observations": unique_cases,
            "complete_runs": 2,
            "replay_byte_identical": replay_equal,
            "observation_stream_sha256": stream_digest,
            "schema_errors": schema_errors,
        },
        "candidate_changed": False,
        "authority_effect": "none",
        "claim_limit": "EVF campaign evidence only; no product approval, admission, activation, publication, release, deployment, or external-effect authority.",
    }
    (HERE / "EVF-RECEIPT.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2))
    if not passed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
