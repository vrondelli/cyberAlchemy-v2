# Independent review of Auth Foundation EVF V0-V2 bridge

## Verdict

`AGREE` with `author-attempt-002` within the candidate V0-V2 claim ceiling.
`author-attempt-001` is superseded and was not used as closure evidence.

The independent replay passed V0, V1, and V2. Both 13-entry manifests verify,
the twelve non-summary replay artifacts are byte-identical to the sealed author
attempt, and `RESULT.json` is identical after removing only `generated_at`.
Six repository regressions and ten independent adversarial checks passed.

## Findings

1. `source-bindings.json`, all tier invocations, and both underlying EVF
   profiles bind the exact current `INPUT-CANDIDATE.json` bytes with SHA-256
   `0b943846c1316d6ec18e75357dd499badcfbfe260cdd5ffad6a4c7384ef5a5dc`.
   The bridge rejects an unbound subject before provider receipt construction,
   and the tier kernel independently rejects subject drift.
2. The evidence routes are materially distinct. The executable profile records
   64 Rust tests from `auth-completion-provider`; the theorem profile records
   three Lean 4 typechecker checks from `lean4-core-typechecker`. Their route IDs
   and independence groups are distinct. The shared
   `evf-independent-verifier` binary validates two different sealed EVF
   envelopes and is not claimed as a separate proof route.
3. The Lean route is honestly mapped for this V0-V2 profile. The property has
   the `executable-implementation` trait, whose declared capability is
   `executable-evaluation`. The plan and provider binding explicitly limit the
   Lean observation to a real typechecker-backed execution and deny V3 theorem
   completeness.
4. V2 closes all five required negative-control classes. Subject,
   denominator, evidence, and execution map to passed hostile observations;
   oracle coverage maps to all six declared behavioral mutants killed for their
   declared causes with neutral controls passing.
5. The kernel fails closed for subject and profile drift, duplicate route IDs,
   duplicate independence groups, false exact-binding claims, missing or
   surviving V2 controls, and provider disagreement. When V2 controls are
   incomplete, it reports V1 as available but grants no verified tier.
6. The property statement is consistent with the candidate product contract's
   fail-closed rule: ALLOW requires every identity, cardinality, field,
   revision, currentness, scope, and permission predicate to pass.

No author implementation defect was found. No author file or prior
`repair-assurance-transfer-epoch-001` evidence was modified.

## Exact commands

From
`/home/vrondelli/projects/domainspec-core/projects/auth-foundation/development/auth-service-d65-r2-plan/verification-tier-bridge-001`:

```sh
test ! -e evidence/reviewer-attempt-001
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3.14 -B run.py --output evidence/reviewer-attempt-001/replay
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3.14 -B -m unittest -v test_bridge.py
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3.14 -B - <<'PY'
import copy
import json
from auth_tier_bridge.bridge import BRIDGE_ROOT, KERNEL, UMBRELLA_ROOT, _validate_profile_subject_binding

author = BRIDGE_ROOT / "evidence/author-attempt-002"
bindings = json.loads((BRIDGE_ROOT / "source-bindings.json").read_text())
results = {}

def evaluate(name, source, mutate, expect):
    invocation = json.loads((author / source).read_text())
    mutate(invocation)
    result = KERNEL.evaluate(UMBRELLA_ROOT, KERNEL.CANONICAL_ROOT, invocation)
    results[name] = {
        "pass": expect(result),
        "contract_state": result["contract_state"],
        "verified_tier": result["verified_tier"],
        "available_lower_tier": result["available_lower_tier"],
        "residue": result["residue"],
    }

def redigest(receipt):
    receipt["payload_digest"] = KERNEL.digest_value({k: v for k, v in receipt.items() if k != "payload_digest"})

evaluate("subject-digest-drift", "V1-INVOCATION.json",
    lambda i: (i["subject"].update({"sha256": "0" * 64}),
        [p.update({"subject_sha256": "0" * 64}) or redigest(p) for p in i["providers"]]),
    lambda r: r["contract_state"] == "not_evaluable" and r["verified_tier"] is None and "subject-binding-drift" in r["residue"])
evaluate("duplicate-route-id", "V1-INVOCATION.json",
    lambda i: (i["providers"][1].update({"route_id": i["providers"][0]["route_id"]}), redigest(i["providers"][1])),
    lambda r: r["contract_state"] == "not_evaluable" and r["verified_tier"] is None and "provider-routes-not-independent" in r["residue"])
evaluate("duplicate-independence-group", "V1-INVOCATION.json",
    lambda i: (i["providers"][1].update({"independence_group": i["providers"][0]["independence_group"]}), redigest(i["providers"][1])),
    lambda r: r["contract_state"] == "not_evaluable" and r["verified_tier"] is None and "provider-routes-not-independent" in r["residue"])
evaluate("false-exact-bindings", "V1-INVOCATION.json",
    lambda i: (i["providers"][1].update({"exact_bindings": False}), redigest(i["providers"][1])),
    lambda r: r["contract_state"] == "not_evaluable" and r["verified_tier"] is None and any(x.startswith("invalid-provider-receipt:") for x in r["residue"]))
evaluate("profile-digest-drift", "V1-INVOCATION.json",
    lambda i: i["profile"].update({"sha256": "0" * 64}),
    lambda r: r["contract_state"] == "not_evaluable" and r["verified_tier"] is None and "profile-binding-drift" in r["residue"])
evaluate("missing-v2-control", "V2-INVOCATION.json", lambda i: i["controls"].pop(),
    lambda r: r["contract_state"] == "not_evaluable" and r["verified_tier"] is None and r["available_lower_tier"] == "V1")
evaluate("surviving-duplicate-class-control", "V2-INVOCATION.json",
    lambda i: i["controls"].append({"control_id": "surviving-subject-control", "class": "subject", "expected_non_success": True, "detected": False}),
    lambda r: r["contract_state"] == "not_evaluable" and r["verified_tier"] is None and "negative-control-class-missing-or-survived" in r["residue"])
evaluate("provider-disagreement", "V1-INVOCATION.json",
    lambda i: (i["providers"][1].update({"normalized_outcome": "counterexample"}), redigest(i["providers"][1])),
    lambda r: r["contract_state"] == "conflicting_evidence" and r["verified_tier"] is None)

exe = json.loads((UMBRELLA_ROOT / bindings["refs"]["executable_evidence"]["path"]).read_text())
thm = json.loads((UMBRELLA_ROOT / bindings["refs"]["theorem_evidence"]["path"]).read_text())
try:
    bad_subject = copy.deepcopy(bindings["refs"]["subject"])
    bad_subject["sha256"] = "0" * 64
    _validate_profile_subject_binding(exe, bad_subject)
    rejected = False
except RuntimeError as exc:
    rejected = str(exc) == "profile-does-not-bind-tier-subject"
results["profile-rejects-unbound-subject"] = {"pass": rejected}
results["route-materiality"] = {
    "pass": (
        exe["route"] == "executable"
        and thm["route"] == "theorem"
        and exe["profile_id"] == "auth.completion.executable.v1"
        and thm["profile_id"] == "auth.completion.theorem.v1"
        and exe["stage_receipts"][6]["details"]["observations"]["auth-complete-local-checks"][0]["output"]["rust_tests"] == 64
        and all(obs["provider_id"] == "lean4-core-typechecker" for values in thm["stage_receipts"][6]["details"]["observations"].values() for obs in values)
    ),
    "executable_route": exe["route"],
    "theorem_route": thm["route"],
    "executable_profile": exe["profile_id"],
    "theorem_profile": thm["profile_id"],
}
print(json.dumps(results, indent=2, sort_keys=True))
if not all(item["pass"] for item in results.values()):
    raise SystemExit(1)
PY
(cd evidence/reviewer-attempt-001/replay && sha256sum -c ARTIFACTS.sha256)
(cd evidence/author-attempt-002 && sha256sum -c ARTIFACTS.sha256)
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3.14 -B - <<'PY'
import json
from pathlib import Path
root = Path("evidence")
author = root / "author-attempt-002"
replay = root / "reviewer-attempt-001/replay"
names = sorted(p.name for p in author.iterdir() if p.is_file() and p.name not in {"RESULT.json", "ARTIFACTS.sha256"})
byte_equal = {name: (author / name).read_bytes() == (replay / name).read_bytes() for name in names}
a = json.loads((author / "RESULT.json").read_text())
r = json.loads((replay / "RESULT.json").read_text())
a.pop("generated_at")
r.pop("generated_at")
print(json.dumps({"byte_equal": byte_equal, "normalized_result_equal": a == r}, indent=2, sort_keys=True))
if not all(byte_equal.values()) or a != r:
    raise SystemExit(1)
PY
```

An initial `sha256sum -c evidence/author-attempt-002/ARTIFACTS.sha256`
invocation from the bridge root exited 1 because the manifest entries are
basename-relative. Running the manifest from `evidence/author-attempt-002`, as
shown above, verified all 13 entries.

The author manifest uses basename-relative entries. This first path-sensitive
invocation from the bridge root failed to locate its entries:

```sh
sha256sum -c evidence/author-attempt-002/ARTIFACTS.sha256
```

The corrected exact invocation was run from the manifest directory:

```sh
cd /home/vrondelli/projects/domainspec-core/projects/auth-foundation/development/auth-service-d65-r2-plan/verification-tier-bridge-001/evidence/author-attempt-002
sha256sum -c ARTIFACTS.sha256
```

It verified all 13 author artifacts. The replay manifest also verified all 13
replay artifacts.

## Claim ceiling

This review proves only an independent local replay of the exact Auth candidate
property and current bound evidence through the candidate EVF V0-V2 enforcement
kernel. It grants no product approval, governance admission, runtime admission,
publication, release, deployment, customer certification, or operational
authority.

`authority_effect: none`

## Open Questions

- Should V3 add a distinct theorem-checking capability instead of mapping the
  Lean typechecker route to `executable-evaluation`?
- Should future provider receipts bind the raw EVF evidence digest and profile
  digest directly, instead of keeping those joins in sealed
  `PROVIDER-BINDINGS.json`?
- Should a future independence contract represent shared verifier
  infrastructure explicitly while preserving distinct evidence-producer
  routes?
- Which admitted runtime, if any, should own continuous Auth verification?
