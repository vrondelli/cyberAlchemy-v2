#!/usr/bin/env python3
"""Hostile controls for the unselected v11 entrypoint-classification slice."""

import copy
import importlib.util
import re
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate-current-evidence-successor-v11.py")
SPEC = importlib.util.spec_from_file_location("auth_native_ledger_v11", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def v39_fixture_trace(request: str, variant: str, api: bool,
                      scenario: str = "allow") -> list[str]:
    helpers = ("allow_iff", "unique_resolved_session", "trusted_scope",
               "session_current", "complete_active_roles", "exact_active_role_grant")
    names = [] if variant in ("clean", "duplicate-pre-gate") or \
        scenario == "duplicate" else \
        ["READY", "authorize", *(helpers if variant == "marked" else
                                  helpers[:helpers.index(variant) + 1])]
    markers = ([f"AUTH_V39_CASE request={request}"] if api else []) + [
        f"AUTH_V39_{name} request={request}" +
        (" epoch=1" if name == "READY" else "") for name in names]
    decision = "ALLOW" if variant in ("clean", "marked") and \
        scenario == "allow" else "DENY"
    return markers + ([f"AUTH_V39_END request={request} decision={decision}"]
                      if api else [])


class NativeLedgerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.raw = MODULE.inventory()

    def fixture(self) -> dict:
        return copy.deepcopy(self.raw)

    def test_baseline_is_conservative(self) -> None:
        ledger = MODULE.classify(self.fixture())
        self.assertEqual(len(ledger["endpoints"]), 22)
        self.assertEqual(len(ledger["generated_helpers"]), 8)
        for root in MODULE.ROOTS:
            self.assertEqual(sum(row["per_root"][root]["state"] == "reachable"
                                 for row in ledger["endpoints"]), 1)
            self.assertEqual(sum(row["per_root"][root]["state"] == "unresolved"
                                 for row in ledger["endpoints"]), 21)
            self.assertFalse(any(row["per_root"][root]["state"] == "ruled_out"
                                 for row in ledger["endpoints"]))
            self.assertTrue(any(row["per_root"][root]["static_local_package"] == "absent"
                                for row in ledger["endpoints"]))

    def test_added_or_duplicate_known_entrypoint_fails(self) -> None:
        value = self.fixture()
        value["known_entrypoints"].append(dict(value["known_entrypoints"][0], id="new-policy"))
        value["known_entrypoint_count"] += 1
        with self.assertRaisesRegex(ValueError, "count changed"):
            MODULE.classify(value)
        value = self.fixture()
        value["known_entrypoints"][1]["id"] = value["known_entrypoints"][0]["id"]
        with self.assertRaisesRegex(ValueError, "identities changed"):
            MODULE.classify(value)

    def test_package_membership_and_duplicate_manifest_fail(self) -> None:
        value = self.fixture()
        value["known_entrypoints"][0]["selected_root_cargo_membership"].remove("api")
        with self.assertRaisesRegex(ValueError, "membership disagrees"):
            MODULE.classify(value)
        value = self.fixture()
        value["selected_root_package_manifests"]["api"].append(
            value["selected_root_package_manifests"]["api"][0])
        with self.assertRaisesRegex(ValueError, "manifest identities ambiguous"):
            MODULE.classify(value)

    def test_missing_source_or_signature_fails(self) -> None:
        value = self.fixture()
        value["known_entrypoints"][0]["signature"] = ""
        with self.assertRaisesRegex(ValueError, "source identity incomplete"):
            MODULE.classify(value)
        value = self.fixture()
        del value["source_sha256"][value["known_entrypoints"][0]["source"]]
        with self.assertRaisesRegex(ValueError, "source-set digest disagrees"):
            MODULE.classify(value)

    def test_generated_helper_role_or_name_drift_fails(self) -> None:
        value = self.fixture()
        value["generated_policy_callables"][0]["name"] = "new_helper"
        with self.assertRaisesRegex(ValueError, "callable baseline changed"):
            MODULE.classify(value)
        value = self.fixture()
        helper = next(row for row in value["generated_policy_callables"]
                      if row["name"] != "authorize")
        helper["role"] = "proven-endpoint"
        with self.assertRaisesRegex(ValueError, "helper changed"):
            MODULE.classify(value)

    def test_cfg_and_source_change_alter_candidate_digest(self) -> None:
        base = MODULE.classify(self.fixture())
        value = self.fixture()
        value["known_entrypoints"][0]["cfg"] = ["#[cfg(test)]"]
        changed = MODULE.classify(value)
        self.assertNotEqual(base["inventory_semantic_sha256"],
                            changed["inventory_semantic_sha256"])
        with self.assertRaisesRegex(ValueError, "frozen native endpoint identity changed"):
            MODULE.verify_frozen_identity(changed)
        value = self.fixture()
        value["source_sha256"][value["known_entrypoints"][0]["source"]] = "0" * 64
        value["source_set_sha256"] = MODULE.sha("".join(
            f"{path}\0{hash_value}\n" for path, hash_value
            in value["source_sha256"].items()).encode())
        changed = MODULE.classify(value)
        self.assertNotEqual(base["inventory_semantic_sha256"],
                            changed["inventory_semantic_sha256"])
        with self.assertRaisesRegex(ValueError, "frozen native endpoint identity changed"):
            MODULE.verify_frozen_identity(changed)

    def test_non_known_source_change_fails_frozen_source_set(self) -> None:
        value = self.fixture()
        known_sources = {row["source"] for row in value["known_entrypoints"]}
        extra = next(source for source in value["source_sha256"]
                     if source not in known_sources)
        value["source_sha256"][extra] = "0" * 64
        with self.assertRaisesRegex(ValueError, "source-set digest disagrees"):
            MODULE.classify(value)
        value["source_set_sha256"] = MODULE.sha("".join(
            f"{path}\0{hash_value}\n" for path, hash_value
            in value["source_sha256"].items()).encode())
        with self.assertRaisesRegex(ValueError, "frozen native Rust source set changed"):
            MODULE.verify_frozen_identity(MODULE.classify(
                value, MODULE.independent_normal_closure()))

    def test_added_symlinked_source_fails(self) -> None:
        value = self.fixture()
        value["opaque_edges"].append({"source": "new-policy/src/lib.rs",
                                      "kind": "unresolved-symlink-source", "cfg": []})
        with self.assertRaisesRegex(ValueError, "symlink source set changed"):
            MODULE.classify(value)

    def test_independent_cargo_closure_and_frozen_identity(self) -> None:
        independent = MODULE.independent_normal_closure()
        ledger = MODULE.classify(self.fixture(), independent)
        MODULE.verify_frozen_identity(ledger)
        changed = copy.deepcopy(independent)
        changed["api"][0]["features"].append("unexpected-feature")
        with self.assertRaisesRegex(ValueError, "frozen independent Cargo closure changed"):
            MODULE.verify_frozen_identity(MODULE.classify(self.fixture(), changed))
        changed = copy.deepcopy(independent)
        changed["api"].pop()
        with self.assertRaisesRegex(ValueError, "independent Cargo closure disagrees"):
            MODULE.classify(self.fixture(), changed)

    def test_signature_and_helper_drift_fail_frozen_identity(self) -> None:
        value = self.fixture()
        value["known_entrypoints"][0]["signature"] += " /* mutant */"
        with self.assertRaisesRegex(ValueError, "frozen native endpoint identity changed"):
            MODULE.verify_frozen_identity(MODULE.classify(value, MODULE.independent_normal_closure()))
        value = self.fixture()
        helper = next(row for row in value["generated_policy_callables"]
                      if row["name"] != "authorize")
        helper["signature"] += " /* mutant */"
        with self.assertRaisesRegex(ValueError, "frozen generated helper identity changed"):
            MODULE.verify_frozen_identity(MODULE.classify(value, MODULE.independent_normal_closure()))

    def test_current_compiled_mir_and_synthetic_parser_mutants(self) -> None:
        mir = MODULE.authority_mir()
        witness = MODULE.authority_identity_witness(mir)
        self.assertEqual(witness["mir_sha256"], MODULE.FROZEN_AUTHORITY_MIR_SHA256)
        self.assertTrue(witness["normal_cfg_transfer_dominance"])
        self.assertTrue(witness["constructed_ready_is_callback_argument"])
        self.assertFalse(witness["cross_body_handoff_proven"])
        for original, mutant in [
            ("_53 = &((*_2).0: std::string::String);",
             "_53 = &((*_2).1: std::string::String);"),
            ("evaluation_epoch_id: copy _3, decision_time: copy _4",
             "evaluation_epoch_id: copy _4, decision_time: copy _4"),
            ("decision_time: copy _4, command: move _148",
             "decision_time: copy _3, command: move _148"),
            ("command: move _148, authenticated_subject_id",
             "command: move _149, authenticated_subject_id"),
        ]:
            self.assertIn(original, mir)
            with self.subTest(mutant=mutant):
                with self.assertRaisesRegex(ValueError, "READY"):
                    MODULE.authority_identity_witness(mir.replace(original, mutant, 1))
        callback = re.search(r"= copy _5\(copy (_\d+)\) ->", mir)
        self.assertIsNotNone(callback)
        assert callback is not None
        wrong_local = "_1" if callback.group(1) != "_1" else "_2"
        with self.assertRaises(ValueError):
            MODULE.authority_identity_witness(
                mir.replace(callback.group(0), callback.group(0).replace(
                    callback.group(1), wrong_local), 1))
        ready = "= ReadyAuthorization::<'_, '_> {"
        self.assertIn(ready, mir)
        with self.assertRaises(ValueError):
            MODULE.authority_identity_witness(mir.replace(ready, ready + ready, 1))

    def test_bridge_reachability_candidate_promotes_only_predecision_rows(self) -> None:
        ledger = MODULE.classify(self.fixture(), MODULE.independent_normal_closure())
        MODULE.verify_frozen_identity(ledger)
        endpoints = {row["id"]: row for row in ledger["endpoints"]}
        roots = {}
        promotions = []
        for root in ("tenant", "prototype", "https"):
            manifest = MODULE.ROOT_MANIFESTS[root]
            source = endpoints[MODULE.PUBLIC_SELF[root]]["source"]
            output = {"decisions": [True]} if root == "tenant" else {"decision": "ALLOW"}
            denied = {"decisions": [False]} if root == "tenant" else {"decision": "DENY"}
            common = {"admission_mir_sha256": "a" * 64,
                      "ready_decision_mir_sha256": "b" * 64,
                      "metadata_sha256": "c" * 64, "lock_sha256": "d" * 64,
                      "root_package_id": f"package-{root}",
                      "normal_exit": True}
            roots[root] = {
                "normal_feature_same_build_mir_and_binary": True,
                "clean_allow": True, "callback_mutant_denied": True,
                "source_bytes_preserved": True,
                "manifest": manifest,
                "manifest_sha256": MODULE.sha((MODULE.IMPL / manifest).read_bytes()),
                "root_source": source,
                "clean_root_source_sha256": endpoints[MODULE.PUBLIC_SELF[root]]["source_sha256"],
                "mutant_root_source_sha256": "e" * 64,
                "clean": {**common, "output": output, "binary_sha256": "1" * 64,
                          "root_mir_sha256": "2" * 64,
                          "callback_sentinel_count": 0},
                "callback_mutant": {**common, "output": denied,
                                    "binary_sha256": "3" * 64,
                                    "root_mir_sha256": "4" * 64,
                                    "callback_sentinel_count": 1,
                                    "v32_rejection": "READY callback target count changed"},
            }
            promotions.append({"root": root, "entrypoint": "admission-service-with-ready",
                               "state": "reachable", "witness": "normal-same-build-allow-handoff"})
        evidence = {
            "schema_version": "auth-foundation.v4b-normal-bridge-reachability/v36-candidate",
            "status": "indeterminate", "roots": roots,
            "candidate_promotions": promotions,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
        }
        candidate = MODULE.bridge_reachability_candidate(ledger, evidence)
        target = next(row for row in candidate["ledger"]["endpoints"]
                      if row["id"] == "admission-service-with-ready")
        self.assertEqual(target["per_root"]["api"]["state"], "unresolved")
        self.assertTrue(all(target["per_root"][root]["state"] == "reachable"
                            for root in roots))
        self.assertEqual(endpoints["admission-service-with-ready"]["per_root"]["tenant"]["state"],
                         "unresolved")
        self.assertFalse(candidate["endpoint_set_closed"])
        self.assertFalse(candidate["runtime_guarantees_observed"])
        for mutation, message in (
            (lambda x: x["roots"].pop("https"), "shape or ceiling"),
            (lambda x: x["roots"]["tenant"].update(manifest="wrong"), "binding changed"),
            (lambda x: x["roots"]["prototype"]["callback_mutant"].update(
                binary_sha256="1" * 64), "causal control changed"),
            (lambda x: x["roots"]["prototype"]["callback_mutant"].update(
                admission_mir_sha256="f" * 64), "causal control changed"),
            (lambda x: x["roots"]["prototype"]["callback_mutant"].update(
                root_package_id="other-package"), "causal control changed"),
            (lambda x: x["roots"]["prototype"]["callback_mutant"].update(
                callback_sentinel_count=0), "causal control changed"),
            (lambda x: x.update(runtime_guarantees_observed=True), "shape or ceiling"),
            (lambda x: x["candidate_promotions"].append({"root": "api"}), "promotion list changed"),
        ):
            hostile = copy.deepcopy(evidence)
            mutation(hostile)
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    MODULE.bridge_reachability_candidate(ledger, hostile)

    def test_downstream_reachability_candidate_is_six_row_and_fail_closed(self) -> None:
        ledger = MODULE.classify(self.fixture(), MODULE.independent_normal_closure())
        endpoints = {row["id"]: row for row in ledger["endpoints"]}
        roots = {}
        promotions = []
        for root in ("tenant", "prototype", "https"):
            source = endpoints[MODULE.PUBLIC_SELF[root]]["source"]
            ready = endpoints["ready-decision"]["source"]
            policy = endpoints["generated-policy"]["source"]
            clean_sources = {name: endpoints[endpoint]["source_sha256"] for name, endpoint in
                             ((source, MODULE.PUBLIC_SELF[root]),
                              (ready, "ready-decision"), (policy, "generated-policy"))}
            allow = {"decisions": [True]} if root == "tenant" else {"decision": "ALLOW"}
            deny = {"decisions": [False]} if root == "tenant" else {"decision": "DENY"}
            request = "request-0" if root == "tenant" else "verified-request"
            marks = [f"AUTH_V37_READY request={request} epoch=1",
                     f"AUTH_V37_POLICY request={request}"]
            def variant(binary: str, root_mir: str, ready_mir: str, policy_mir: str,
                        decision: dict, markers: list[str], site: bool, sources: dict) -> dict:
                return {"binary_sha256": binary * 64, "root_mir_sha256": root_mir * 64,
                        "admission_mir_sha256": "a" * 64,
                        "ready_decision_mir_sha256": ready_mir * 64,
                        "policy_mir_sha256": policy_mir * 64,
                        "metadata_sha256": "b" * 64, "lock_sha256": "c" * 64,
                        "root_package_id": f"package-{root}", "normal_exit": True,
                        "decision": decision, "markers": markers,
                        "source_sha256": sources,
                        "selected_graph_inspection": {
                            "normal_mir_argument_join": [{"edge": edge} for edge in
                                ("root-to-admission", "admission-to-authority",
                                 "authority-to-ready-decision")],
                            "cross_body_execution_proven": False,
                            "ready_sentinel_site": site, "policy_sentinel_site": site,
                            "selected_ready_mir_sha256": ready_mir * 64,
                            "selected_policy_mir_sha256": policy_mir * 64}}
            marked_sources = {**clean_sources, ready: "e" * 64, policy: "f" * 64}
            roots[root] = {
                "manifest": MODULE.ROOT_MANIFESTS[root],
                "manifest_sha256": MODULE.sha((MODULE.IMPL / MODULE.ROOT_MANIFESTS[root]).read_bytes()),
                "root_source": source,
                "normal_feature_same_build_mir_and_binary": True, "clean_allow": True,
                "instrumented_allow": True, "policy_mutant_denied": True,
                "negative_control_silent": True, "source_bytes_preserved": True,
                "clean": variant("1", "2", "3", "4", allow, [], False, clean_sources),
                "instrumented": variant("5", "2", "6", "7", allow, marks, True, marked_sources),
                "policy_mutant": variant("8", "2", "6", "9", deny, marks, True,
                                         {**marked_sources, policy: "d" * 64}),
                "negative": variant("0", "d", "6", "7", deny, [], True,
                                    {**marked_sources, source: "9" * 64}),
            }
            promotions.extend({"root": root, "entrypoint": endpoint,
                               "state": "reachable",
                               "witness": "v37-paired-instrumented-normal-build-entry-observed"}
                              for endpoint in ("ready-decision", "generated-policy"))
        evidence = {"schema_version":
                        "auth-foundation.v4b-normal-downstream-reachability/v37-candidate",
                    "status": "indeterminate", "roots": roots,
                    "candidate_promotions": promotions,
                    "endpoint_set_closed": False, "all_path_ready_dominance": False,
                    "runtime_guarantees_observed": False}
        candidate = MODULE.downstream_reachability_candidate(ledger, evidence)
        self.assertEqual(candidate["promoted_rows"], promotions)
        self.assertEqual(sum(row["per_root"]["tenant"]["state"] == "reachable"
                             for row in candidate["ledger"]["endpoints"]), 3)
        self.assertEqual(endpoints["ready-decision"]["per_root"]["tenant"]["state"],
                         "unresolved")
        self.assertFalse(candidate["runtime_guarantees_observed"])
        for mutation, message in (
            (lambda x: x["candidate_promotions"].append({"root": "api"}), "promotion list changed"),
            (lambda x: x["roots"]["tenant"]["instrumented"].update(markers=[]),
             "causal marker changed"),
            (lambda x: x["roots"]["prototype"]["negative"].update(markers=marks),
             "causal marker changed"),
            (lambda x: x["roots"]["https"]["instrumented"].update(
                policy_mir_sha256="4" * 64), "MIR site changed"),
            (lambda x: x["roots"]["tenant"]["clean"]["source_sha256"].update(
                {endpoints["generated-policy"]["source"]: "0" * 64}),
             "clean source changed"),
            (lambda x: x.update(runtime_guarantees_observed=True), "shape or ceiling"),
        ):
            hostile = copy.deepcopy(evidence)
            mutation(hostile)
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    MODULE.downstream_reachability_candidate(ledger, hostile)

    def test_api_reachability_candidate_promotes_only_three_rows(self) -> None:
        ledger = MODULE.classify(self.fixture(), MODULE.independent_normal_closure())
        endpoints = {row["id"]: row for row in ledger["endpoints"]}
        sources = {endpoints[name]["source"]: endpoints[name]["source_sha256"]
                   for name in ("api-http-authorize", "ready-decision", "generated-policy")}
        test = "authorization-api/tests/v38_probe.rs"
        harness = "f" * 64
        manifests = ("authorization-api/Cargo.toml",
                     "authorization-admission-service/Cargo.toml",
                     "authorization-ready-authority/Cargo.toml",
                     "authorization-ready-decision/Cargo.toml",
                     "standard-runtime/Cargo.toml")
        def markers(scenario: str, decision: str, stages: tuple[str, ...]) -> list[str]:
            request = f"auth_v38_{scenario}"
            return ([f"AUTH_V38_CASE request={request}"] +
                    [f"AUTH_V38_{stage} request={request}" +
                     (" epoch=1" if stage == "READY" else "") for stage in stages] +
                    [f"AUTH_V38_END request={request} decision={decision}"])
        def variant(binary: str, api_mir: str, ready_mir: str, policy_mir: str,
                    source_map: dict, observation_map: dict, marked: bool) -> dict:
            return {"source_sha256": source_map, "binary_sha256": binary * 64,
                    "metadata_sha256": "a" * 64, "lock_sha256": "b" * 64,
                    "test_package_id": "api-package",
                    "selected_mir": {
                        "selected_mir_sha256": dict(zip(manifests,
                            (api_mir * 64, "c" * 64, "d" * 64,
                             ready_mir * 64, policy_mir * 64))),
                        "normal_mir_argument_join": ([{}, {}, {}] if not marked else None),
                        "cross_body_execution_proven": False,
                        "sentinels_in_selected_mir": marked,
                        "worker_mir_literal_count": 2 if marked else 0,
                        "worker_normal_body_site_count": 1 if marked else 0,
                        "worker_mir_literal_posture": (
                            "one-non-body-occurrence-and-one-selected-worker-body-site"
                            if marked else "absent"),
                        "handoff_check_posture": (
                            "source-constrained-mutant-MIR-and-dynamic-entry"
                            if marked else "V32-clean")},
                    "observations": {scenario: {
                        "normal_exit": True, "scenario": scenario,
                        "decision": decision, "markers": observed,
                        "test_binary_sha256": binary * 64}
                        for scenario, (decision, observed) in observation_map.items()}}
        stages = ("HTTP", "RUNTIME", "WORKER", "READY", "POLICY")
        marked_sources = {**sources, endpoints["api-http-authorize"]["source"]: "0" * 64,
                          endpoints["ready-decision"]["source"]: "1" * 64,
                          endpoints["generated-policy"]["source"]: "2" * 64,
                          test: harness}
        clean = variant("3", "4", "5", "6", {**sources, test: harness},
                        {"allow": ("ALLOW", markers("allow", "ALLOW", ()))}, False)
        marked = variant("7", "8", "9", "0", marked_sources,
                         {"allow": ("ALLOW", markers("allow", "ALLOW", stages)),
                          "duplicate": ("DENY", markers(
                              "duplicate", "DENY", ("HTTP", "RUNTIME", "WORKER")))}, True)
        mutant = variant("e", "8", "9", "f",
                         {**marked_sources, endpoints["generated-policy"]["source"]: "9" * 64},
                         {"allow": ("DENY", markers("allow", "DENY", stages))}, True)
        promotions = [{"root": "api", "entrypoint": name, "state": "reachable",
                       "witness": "v38-paired-instrumented-normal-feature-http-entry-observed"}
                      for name in ("api-runtime-authorize", "ready-decision", "generated-policy")]
        evidence = {
            "schema_version": "auth-foundation.v4b-normal-api-reachability/v38-candidate",
            "status": "indeterminate", "root_id": "api",
            "root_manifest": MODULE.ROOT_MANIFESTS["api"],
            "candidate_promotions": promotions,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "normal_feature_same_build_mir_and_test_binary": True,
            "source_bytes_preserved": True, "clean_http_allow": True,
            "instrumented_http_allow": True,
            "pre_gate_duplicate_denied_without_downstream_markers": True,
            "policy_mutant_denied_after_downstream_markers": True,
            "original_source_sha256": sources,
            "mirror_only_harness_sha256": harness,
            "variants": {"clean": clean, "marked": marked, "policy-deny": mutant},
        }
        candidate = MODULE.api_reachability_candidate(ledger, evidence)
        self.assertEqual(candidate["promoted_rows"], promotions)
        self.assertEqual(sum(row["per_root"]["api"]["state"] == "reachable"
                             for row in candidate["ledger"]["endpoints"]), 4)
        self.assertEqual(endpoints["ready-decision"]["per_root"]["api"]["state"],
                         "unresolved")
        self.assertFalse(candidate["runtime_guarantees_observed"])
        for mutation, message in (
            (lambda x: x["candidate_promotions"].append({"entrypoint": "api-http-authorize"}),
             "promotion list"),
            (lambda x: x["variants"]["marked"]["observations"]["duplicate"].update(
                markers=markers("duplicate", "DENY", stages)), "ordered request"),
            (lambda x: x["variants"]["marked"]["selected_mir"].update(
                sentinels_in_selected_mir=False), "selected normal MIR"),
            (lambda x: x["variants"]["clean"]["source_sha256"].update(
                {endpoints["ready-decision"]["source"]: "a" * 64}), "paired build"),
            (lambda x: x["variants"]["marked"]["source_sha256"].update(
                {endpoints["api-http-authorize"]["source"]:
                 sources[endpoints["api-http-authorize"]["source"]]}), "paired build"),
            (lambda x: x["variants"]["policy-deny"]["source_sha256"].update(
                {endpoints["generated-policy"]["source"]:
                 x["variants"]["marked"]["source_sha256"][
                     endpoints["generated-policy"]["source"]]}), "paired build"),
            (lambda x: x["original_source_sha256"].update(extra="0" * 64),
             "original source set"),
            (lambda x: x.update(runtime_guarantees_observed=True), "ceiling changed"),
        ):
            hostile = copy.deepcopy(evidence)
            mutation(hostile)
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    MODULE.api_reachability_candidate(ledger, hostile)

    def helper_observation_fixture(self, ledger: dict) -> dict:
        v39 = MODULE.helper_observation_module()
        endpoints = {row["id"]: row for row in ledger["endpoints"]}
        policy_source = (MODULE.IMPL / v39.POLICY).read_text()
        ready_source = (MODULE.IMPL / v39.READY).read_text()
        ready_marked = MODULE.sha(v39.v37.mutate_ready(ready_source).replace(
            "AUTH_V37_READY", f"{v39.MARKER}READY").encode())
        policy_marked = MODULE.sha(v39.mark_policy(policy_source).encode())
        harness = MODULE.sha(v39.v38.HARNESS.replace("AUTH_V38_", v39.MARKER).encode())
        roots = {}
        for root in MODULE.ROOTS:
            api = root == "api"
            root_source = endpoints[MODULE.PUBLIC_SELF[root]]["source"]
            original_root = endpoints[MODULE.PUBLIC_SELF[root]]["source_sha256"]
            original_ready = endpoints["ready-decision"]["source_sha256"]
            original_policy = endpoints["generated-policy"]["source_sha256"]
            names = ("clean", "marked", *v39.ACTIVE) if api else \
                    ("clean", "marked", "duplicate-pre-gate")
            variants = {}
            for index, variant in enumerate(names):
                marked = variant != "clean"
                source = {
                    root_source: (MODULE.sha(v39.v37.mutate_duplicate_row(
                        (MODULE.IMPL / root_source).read_text()).encode())
                        if variant == "duplicate-pre-gate" else original_root),
                    v39.READY: ready_marked if marked else original_ready,
                    v39.POLICY: (MODULE.sha(v39.mark_policy(policy_source, variant).encode())
                                  if api and variant in v39.ACTIVE else
                                  policy_marked if marked else original_policy),
                }
                if api:
                    source[v39.v38.TEST] = harness
                inspection = {
                    "selected_policy_function_markers": {
                        name: int(marked) for name in ("authorize", *v39.HELPERS)},
                    "all_nine_policy_bodies_bound": True,
                    "ready_marker_count": int(marked),
                    "normal_mir_argument_join": [{}, {}, {}] if not marked else None,
                    "cross_body_execution_proven": False,
                }
                request = ("auth_v38_allow" if api else
                           "request-0" if root == "tenant" else "verified-request")
                decision = "ALLOW" if variant in ("clean", "marked") else "DENY"
                trace = v39_fixture_trace(request, variant, api)
                binary = f"{index + 1:x}" * 64
                if api:
                    mir = {manifest: "a" * 64 for manifest in v39.v38.SELECTED}
                    mir[v39.READY_MANIFEST] = ("b" if marked else "c") * 64
                    mir[v39.POLICY_MANIFEST] = (f"{index + 1:x}" if marked else "d") * 64
                    variants[variant] = {
                        "source_sha256": source, "binary_sha256": binary,
                        "metadata_sha256": "e" * 64, "lock_sha256": "f" * 64,
                        "test_package_id": "api-package", "selected_mir_sha256": mir,
                        "selected_mir_inspection": inspection,
                        "observations": {"allow": {
                            "normal_exit": True, "scenario": "allow",
                            "decision": decision, "markers": trace,
                            "test_binary_sha256": binary}},
                    }
                else:
                    root_mir = "1" if variant != "duplicate-pre-gate" else "2"
                    variants[variant] = {
                        "source_sha256": source, "binary_sha256": binary,
                        "metadata_sha256": "e" * 64, "lock_sha256": "f" * 64,
                        "root_mir_sha256": root_mir * 64,
                        "admission_mir_sha256": "3" * 64,
                        "ready_decision_mir_sha256": ("4" if marked else "5") * 64,
                        "ready_mir_sha256": ("4" if marked else "5") * 64,
                        "policy_mir_sha256": ("6" if marked else "7") * 64,
                        "selected_policy_mir": inspection,
                        "normal_exit": True,
                        "decision": ({"decisions": [decision == "ALLOW"]}
                                     if root == "tenant" else {"decision": decision}),
                        "markers": trace,
                    }
            if api:
                request = "auth_v38_duplicate"
                variants["marked"]["observations"]["duplicate"] = {
                    "normal_exit": True, "scenario": "duplicate",
                    "decision": "DENY",
                    "markers": v39_fixture_trace(request, "duplicate-pre-gate", True,
                                                  "duplicate"),
                    "test_binary_sha256": variants["marked"]["binary_sha256"],
                }
            roots[root] = {
                "root_id": root, "manifest": MODULE.ROOT_MANIFESTS[root],
                "source_bytes_preserved": True,
                ("normal_feature_same_build_mir_and_test_binary" if api else
                 "normal_feature_same_build_mir_and_binary"): True,
                **({"mirror_only_harness_sha256": harness} if api else {}),
                "variants": variants,
            }
        return {
            "schema_version": "auth-foundation.v4b-normal-policy-helper/v39-candidate",
            "status": "indeterminate",
            "predecessor_sha256": MODULE.sha(MODULE.INVENTORY.read_bytes()),
            "roots": roots, "active_helpers": v39.ACTIVE,
            "dormant_in_observed_selected_allow": v39.DORMANT,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
        }

    def test_helper_observation_candidate_is_non_promoting_and_fail_closed(self) -> None:
        ledger = MODULE.classify(self.fixture(), MODULE.independent_normal_closure())
        original = copy.deepcopy(ledger)
        evidence = self.helper_observation_fixture(ledger)
        candidate = MODULE.helper_observation_candidate(ledger, evidence)
        self.assertEqual(candidate["ledger"], original)
        self.assertEqual(ledger, original)
        self.assertEqual(candidate["promoted_rows"], [])
        self.assertFalse(candidate["endpoint_set_closed"])
        self.assertFalse(candidate["runtime_guarantees_observed"])
        for root in MODULE.ROOTS:
            rows = candidate["helper_observations"][root]
            self.assertEqual(set(rows), set(MODULE.GENERATED_HELPERS))
            self.assertTrue(all(row["role"] == "candidate/helper-unresolved"
                                for row in rows.values()))
        for mutation, message in (
            (lambda x: x["roots"].pop("https"), "shape or claim ceiling"),
            (lambda x: x.update(active_helpers=("allow_iff",)), "shape or claim ceiling"),
            (lambda x: x.update(active_helpers=tuple(reversed(x["active_helpers"]))),
             "shape or claim ceiling"),
            (lambda x: x.update(runtime_guarantees_observed=True), "shape or claim ceiling"),
            (lambda x: x["roots"]["api"]["variants"]["clean"]["source_sha256"].update(
                {"authorization-api/src/lib.rs": "0" * 64}), "source mutation identity"),
            (lambda x: x["roots"]["api"]["variants"]["marked"]["selected_mir_inspection"].update(
                selected_policy_function_markers={}), "selected MIR body"),
            (lambda x: x["roots"]["api"]["variants"]["marked"]["observations"]["duplicate"].update(
                markers=["AUTH_V39_allow_iff request=auth_v38_duplicate"]), "decision or trace"),
            (lambda x: x["roots"]["api"]["variants"]["marked"]["observations"]["allow"].update(
                markers=list(reversed(x["roots"]["api"]["variants"]["marked"]
                                      ["observations"]["allow"]["markers"]))),
             "decision or trace"),
            (lambda x: x["roots"]["api"]["variants"]["marked"]["observations"]["allow"].update(
                markers=[item.replace("auth_v38_allow", "wrong-request") for item in
                         x["roots"]["api"]["variants"]["marked"]["observations"]["allow"]
                          ["markers"]]), "decision or trace"),
            (lambda x: x["roots"]["api"]["variants"]["allow_iff"]["observations"]["allow"].update(
                decision="ALLOW"), "decision or trace"),
            (lambda x: x["roots"]["api"]["variants"]["allow_iff"].update(
                binary_sha256=x["roots"]["api"]["variants"]["marked"]["binary_sha256"]),
             "compiled binary variants"),
            (lambda x: x["roots"]["api"]["variants"]["allow_iff"]["selected_mir_sha256"].update(
                {"standard-runtime/Cargo.toml": x["roots"]["api"]["variants"]["marked"]
                 ["selected_mir_sha256"]["standard-runtime/Cargo.toml"]}),
             "causal compiled mutation"),
            (lambda x: x["roots"]["tenant"]["variants"]["duplicate-pre-gate"].update(
                policy_mir_sha256="8" * 64), "duplicate source overlay"),
            (lambda x: x["roots"]["tenant"]["variants"]["duplicate-pre-gate"]
             ["source_sha256"].update({"standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs":
                                       "8" * 64}), "source mutation identity"),
            (lambda x: x["roots"]["api"]["variants"].update(marked=[]),
             "variant report shape"),
        ):
            hostile = copy.deepcopy(evidence)
            mutation(hostile)
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    MODULE.helper_observation_candidate(ledger, hostile)
        changed_role = copy.deepcopy(ledger)
        changed_role["generated_helpers"][0]["role"] = "proved-endpoint"
        with self.assertRaisesRegex(ValueError, "helper baseline role"):
            MODULE.helper_observation_candidate(changed_role, evidence)


if __name__ == "__main__":
    unittest.main()
