#!/usr/bin/env python3
"""Fail-closed self-validator for the ORODI operator-interface binding candidate."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
BINDING_PATH = Path(__file__).with_name("ORODI-OPERATOR-INTERFACE-BINDING.v1-candidate.json")
RECEIPT_PATH = Path(__file__).with_name("self-validation.json")
EXPECTED_IMAGES = {
    "grafana/grafana@sha256:b0ae311af06228bcfd4a620504b653db80f5b91e94dc3dc2a5b7dab202bcde20",
    "grafana/loki@sha256:70b9f699fc9bb868b62f1cfd4f787dfa50242f1fd92e6089787d5d7daea75fe8",
    "grafana/alloy@sha256:c958aef7294bc40c67caadb2bcecc93b95ab7961ff8afae3abee170d77426193",
}
EXPECTED_CAPABILITIES = {
    "CA2-CAP-ORODI-EVALUATE-CANARY": "5b06c298d4ebe3ce163fefc9982825cae7c89bbf1db0783ab0add9c0260368b3",
    "CA2-CAP-ORODI-VERIFY-ROLLBACK": "9a36d34e72cd2a21142a70d49f7bbe0bcee5e621dc450c8f4065138ad971804e",
    "CA2-CAP-ORODI-MATERIALIZE-RUN-READY-LAB": "4e6353aeff6b28b0f4fb79303c91547c08e57ac877ac931301b3c02bd43c3cb9",
    "CA2-CAP-ORODI-COMMISSION-LOCAL-LAB": "90ebcc11d2fe908ed85709b786138fd6a4d856fdef41f24123fcf40dac71cb85",
}
EXPECTED_CHECKS = {
    "ORODI-OI-NON-ACTUATION",
    "ORODI-OI-TELEMETRY-CONSERVATION",
    "ORODI-OI-PRIVACY",
    "ORODI-OI-BOUNDED-CARDINALITY",
    "ORODI-OI-EVENT-CONSERVATION",
    "ORODI-OI-ROLLBACK-RESTORATION",
    "ORODI-OI-LOOPBACK-AND-EPHEMERAL",
    "ORODI-OI-IMMUTABLE-IMAGES",
    "ORODI-OI-ALERT-RULE-SET",
    "ORODI-OI-ALERT-FAIL-CLOSED",
    "ORODI-OI-NO-EXTERNAL-NOTIFICATION-DELIVERY",
    "ORODI-OI-ALERT-FIRING-RECOVERY-EVIDENCE",
    "ORODI-OI-FINITE-COUNTER-SERIES-CONSERVATION",
    "ORODI-OI-EVIDENCE-MANIFEST-CLOSURE",
}
EXPECTED_ALERT_RULES = {
    "orodi-telemetry-unavailable",
    "orodi-unsafe-candidate-routing",
    "orodi-candidate-degradation",
    "orodi-stable-degradation",
    "orodi-rollback-incomplete",
}
EXPECTED_TARGETS = {
    "projects/domainspec-v2/impl/operational-resilience/body-war-canary.compose.yaml",
    "projects/domainspec-v2/impl/operational-resilience/body-war-canary.prometheus.yml",
    "projects/domainspec-v2/impl/operational-resilience/body-war-canary-local-test.sh",
    "projects/domainspec-v2/impl/operational-resilience/body-war-canary-validate-static.py",
    "projects/domainspec-v2/impl/operational-resilience/body-war-canary.grafana-datasources.yml",
    "projects/domainspec-v2/impl/operational-resilience/body-war-canary.grafana-dashboard-provider.yml",
    "projects/domainspec-v2/impl/operational-resilience/body-war-canary.grafana-dashboard.json",
    "projects/domainspec-v2/impl/operational-resilience/body-war-canary.grafana-alerts.yml",
    "projects/domainspec-v2/impl/operational-resilience/body-war-canary.loki.yml",
    "projects/domainspec-v2/impl/operational-resilience/body-war-canary.alloy",
    "projects/domainspec-v2/impl/operational-resilience/BODY-WAR-CANARY-OPERATOR.md",
    "projects/domainspec-v2/impl/operational-resilience/src/body-war-canary-gateway-entry.ts",
    "projects/domainspec-v2/impl/operational-resilience/src/body-war-canary-gateway-server.ts",
    "projects/domainspec-v2/impl/operational-resilience/src/body-war-canary-gateway-metrics.ts",
    "projects/domainspec-v2/impl/operational-resilience/src/body-war-canary-operational-event.ts",
    "projects/domainspec-v2/impl/operational-resilience/test/body-war-canary-gateway-server.test.ts",
    "projects/domainspec-v2/impl/operational-resilience/test/body-war-canary-gateway-metrics.test.ts",
    "projects/domainspec-v2/impl/operational-resilience/test/body-war-canary-operational-event.test.ts",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fail(errors: list[str], code: str) -> None:
    errors.append(code)


def validate() -> dict[str, object]:
    binding = json.loads(BINDING_PATH.read_text(encoding="utf-8"))
    errors: list[str] = []

    if binding.get("status") != "candidate": fail(errors, "status-not-candidate")
    if binding.get("objective_route") != "CA2-ROUTE-IMPLEMENT": fail(errors, "objective-route")
    if binding.get("authorship_route") != "CA2-ROUTE-DELEGATE": fail(errors, "authorship-route")
    if binding.get("registered_ontology_id") != "domainspec.orodi.ontology@1": fail(errors, "registered-ontology")
    if binding.get("projection_ontology_id") != "domainspec.orodi.operator-interface.system@1": fail(errors, "projection-ontology")
    if binding.get("required_gate_result") != "pass": fail(errors, "required-gate")
    if binding.get("authority_effect") != "none": fail(errors, "authority-effect")

    frozen = binding["frozen_predecessors"]
    digest_entries = [frozen["immutable_product_capability_registry"]]
    digest_entries.extend(frozen["semantic_sources"])
    digest_entries.extend(frozen["compiled_projection"]["artifacts"])
    for entry in digest_entries:
        path = REPO / entry["path"]
        if not path.is_file():
            fail(errors, f"missing-predecessor:{entry['path']}")
        elif sha256(path) != entry["sha256"]:
            fail(errors, f"predecessor-drift:{entry['path']}")

    graph = json.loads((REPO / "projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/operator-interface/domainspec/generated/graph.json").read_text())
    system = json.loads((REPO / "projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/operator-interface/domainspec/generated/system-ontology.json").read_text())
    source_set = frozen["compiled_projection"]["source_set_digest"]
    if graph.get("source_set_digest") != source_set or system.get("source_set_digest") != source_set:
        fail(errors, "source-set-digest")
    if system.get("ontology_id") != binding.get("projection_ontology_id") or system.get("status") != "candidate":
        fail(errors, "system-ontology-identity")
    system_nodes = {node["node_id"] for node in system.get("nodes", [])}
    required_alert_nodes = {
        "orodi-operator-interface.AlertRule",
        "orodi-operator-interface.AlertInstance",
        "orodi-operator-interface.AlertState",
        "orodi-operator-interface.AlertEvidence",
        "orodi-operator-interface.EvaluateAlertRules",
        "orodi-operator-interface.AlertStateObserved",
        "orodi-operator-interface.AlertEvaluationCannotActuate",
        "orodi-operator-interface.NotificationDeliveryRequiresAuthority",
    }
    if not required_alert_nodes.issubset(system_nodes): fail(errors, "system-alert-projection")
    projection_receipt = json.loads((REPO / "projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/operator-interface/domainspec/generated/system-ontology-receipt.json").read_text())
    if projection_receipt.get("deterministic_runs") != 2 or projection_receipt.get("equal_graph_bytes") is not True or projection_receipt.get("equal_system_ontology_bytes") is not True:
        fail(errors, "compiled-projection-determinism")

    registry = json.loads((REPO / frozen["immutable_product_capability_registry"]["path"]).read_text())
    registry_records = {record["capability_id"]: record["record_digest"] for record in registry["records"]}
    projected = {record["capability_id"]: record["record_digest"] for record in binding["projected_product_capabilities"]}
    if projected != EXPECTED_CAPABILITIES: fail(errors, "projected-capabilities")
    if any(registry_records.get(capability_id) != digest for capability_id, digest in projected.items()):
        fail(errors, "capability-registry-mismatch")

    if set(binding["immutable_images"]) != EXPECTED_IMAGES: fail(errors, "immutable-images")
    checks = {check["check_id"] for check in binding["required_checks"]}
    if checks != EXPECTED_CHECKS: fail(errors, "required-checks")
    alerting = binding.get("alerting_realization", {})
    if alerting.get("provisioning_mode") != "file-provisioned" or alerting.get("rule_count") != 5 or set(alerting.get("rule_uids", [])) != EXPECTED_ALERT_RULES:
        fail(errors, "alert-rule-set")
    if alerting.get("no_data_state") != "Alerting" or alerting.get("evaluation_error_state") != "Alerting":
        fail(errors, "alert-fail-closed")
    notification = alerting.get("notification_delivery", {})
    if notification != {
        "state": "disabled",
        "mute_interval": "orodi-local-evaluation-only",
        "mute_coverage": "00:00-24:00 every day",
        "receiver": "ORODI disabled local sink",
        "sink": "http://127.0.0.1:9/orodi-disabled",
        "sink_boundary": "container loopback only; no external destination or credential",
    }:
        fail(errors, "notification-delivery-boundary")
    if alerting.get("authority_effect") != "none": fail(errors, "alert-authority-effect")

    targets = binding["implementation_target_allowlist"]
    target_paths = [target["path"] for target in targets]
    if len(target_paths) != len(set(target_paths)): fail(errors, "duplicate-target")
    if set(target_paths) != EXPECTED_TARGETS: fail(errors, "target-allowlist")
    for target in targets:
        path = REPO / target["path"]
        preimage = target["preimage"]
        if target.get("postimage", {}).get("sha256_required_for_conformance") is not True:
            fail(errors, f"postimage-not-required:{target['path']}")
        if preimage.get("state") == "present":
            if not path.is_file():
                fail(errors, f"missing-target-preimage:{target['path']}")
            elif sha256(path) != preimage.get("sha256"):
                fail(errors, f"target-preimage-drift:{target['path']}")
        elif preimage.get("state") == "absent":
            if path.exists(): fail(errors, f"unexpected-target-preimage:{target['path']}")
            if "sha256" in preimage: fail(errors, f"absent-target-has-digest:{target['path']}")
        else:
            fail(errors, f"invalid-preimage-state:{target['path']}")
    if any(target["preimage"].get("state") != "present" for target in targets):
        fail(errors, "current-target-not-frozen")

    runner_path = REPO / "projects/domainspec-v2/impl/operational-resilience/body-war-canary-local-test.sh"
    runner = runner_path.read_text(encoding="utf-8")
    manifest_block = runner.partition('phase="postimage-evidence"')[2].partition('> "$evidence_dir/implementation-postimages.sha256"')[0]
    manifest_paths: list[str] = []
    runtime_prefix = '"$runtime_dir/'
    for line in manifest_block.splitlines():
        offset = line.find(runtime_prefix)
        if offset >= 0:
            suffix = line[offset + len(runtime_prefix):].split('"', 1)[0]
            manifest_paths.append(f"projects/domainspec-v2/impl/operational-resilience/{suffix}")
    if not manifest_block or len(manifest_paths) != 18:
        fail(errors, "evidence-manifest-count")
    if len(manifest_paths) != len(set(manifest_paths)):
        fail(errors, "evidence-manifest-duplicate")
    if set(manifest_paths) != set(target_paths):
        fail(errors, "evidence-manifest-target-closure")
    for required_manifest_target in (
        "projects/domainspec-v2/impl/operational-resilience/src/body-war-canary-gateway-metrics.ts",
        "projects/domainspec-v2/impl/operational-resilience/test/body-war-canary-gateway-metrics.test.ts",
    ):
        if required_manifest_target not in manifest_paths:
            fail(errors, f"evidence-manifest-missing:{required_manifest_target}")

    metrics_source = (REPO / "projects/domainspec-v2/impl/operational-resilience/src/body-war-canary-gateway-metrics.ts").read_text(encoding="utf-8")
    metrics_test = (REPO / "projects/domainspec-v2/impl/operational-resilience/test/body-war-canary-gateway-metrics.test.ts").read_text(encoding="utf-8")
    for token in (
        'const COHORTS: readonly Cohort[] = ["stable", "candidate"]',
        'const OUTCOMES: readonly Outcome[] = ["good", "bad"]',
        'const STATUS_CLASSES: readonly StatusClass[] = ["2xx", "4xx", "5xx", "timeout", "transport"]',
        "for (const cohort of COHORTS)",
        "for (const outcome of OUTCOMES)",
        "for (const status_class of STATUS_CLASSES)",
        "?.count ?? 0",
    ):
        if token not in metrics_source: fail(errors, f"finite-series-exporter:{token}")
    for token in (
        "assert.equal(counterRows.length, 20)",
        'cohort="stable",outcome="bad",status_class="5xx"',
        'cohort="candidate",outcome="good",status_class="transport"',
        "assert.doesNotMatch(text, /run_id|request_id|url=|host=|token=/)",
    ):
        if token not in metrics_test: fail(errors, f"finite-series-test:{token}")
    query_files = (
        "projects/domainspec-v2/impl/operational-resilience/body-war-canary.grafana-alerts.yml",
        "projects/domainspec-v2/impl/operational-resilience/body-war-canary.grafana-dashboard.json",
        "projects/domainspec-v2/impl/operational-resilience/body-war-canary.prometheus.yml",
    )
    for relative in query_files:
        query_text = "".join((REPO / relative).read_text(encoding="utf-8").lower().split())
        if "vector(0)" in query_text: fail(errors, f"query-side-zero-synthesis:{relative}")

    human = binding.get("human_visual_gate", {})
    if human.get("sequence") != "terminal-after-all-machine-gates" or human.get("decision_authority") != "human":
        fail(errors, "human-visual-gate")
    forbidden = set(binding.get("forbidden_effects", []))
    for required in ("ontology admission", "binding acceptance", "self-approval of implementation conformance", "production deployment", "external notification delivery or contact credentials", "Git commit or push"):
        if required not in forbidden: fail(errors, f"forbidden-effect:{required}")

    result = {
        "schema_version": "domainspec.orodi.operator-interface-binding-self-validation/v1",
        "binding_id": binding.get("binding_id"),
        "result": "pass" if not errors else "fail",
        "errors": errors,
        "verified_predecessor_digests": len(digest_entries),
        "verified_product_capabilities": len(projected),
        "verified_immutable_images": len(binding["immutable_images"]),
        "verified_target_preimages": len(targets),
        "verified_required_checks": len(checks),
        "verified_alert_rules": len(EXPECTED_ALERT_RULES),
        "verified_finite_counter_series": 20,
        "verified_evidence_manifest_targets": len(manifest_paths),
        "query_side_vector_zero_synthesis": "forbidden-and-absent",
        "external_notification_delivery": "disabled",
        "runtime_executed": False,
        "authority_effect": "none",
    }
    if RECEIPT_PATH.is_file():
        receipt = json.loads(RECEIPT_PATH.read_text(encoding="utf-8"))
        receipt_checks = {
            "binding_sha256": sha256(BINDING_PATH),
            "validator_sha256": sha256(Path(__file__)),
            "result": "pass",
            "runtime_executed": False,
            "authority_effect": "none",
            "verified_predecessor_digests": len(digest_entries),
            "verified_product_capabilities": len(projected),
            "verified_immutable_images": len(binding["immutable_images"]),
            "verified_target_preimages": len(targets),
            "verified_required_checks": len(checks),
            "verified_alert_rules": len(EXPECTED_ALERT_RULES),
            "verified_finite_counter_series": 20,
            "verified_evidence_manifest_targets": len(manifest_paths),
            "query_side_vector_zero_synthesis": "forbidden-and-absent",
            "external_notification_delivery": "disabled",
        }
        for field, expected in receipt_checks.items():
            if receipt.get(field) != expected:
                fail(errors, f"receipt:{field}")
        result["errors"] = errors
        result["result"] = "pass" if not errors else "fail"
    return result


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["result"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
