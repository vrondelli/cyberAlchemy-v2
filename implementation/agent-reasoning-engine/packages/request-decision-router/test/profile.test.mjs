import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";
import test from "node:test";

import {admitDecisionProfile, computeDecisionProfileDigest, loadVerifiedDecisionProfile} from "../index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const profilePath = resolve(packageRoot, "profiles/cyberalchemy-v1.json");

test("profile digest and exact provenance verify", () => {
  const loaded = loadVerifiedDecisionProfile(profilePath, repositoryRoot);
  assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
  assert.equal(computeDecisionProfileDigest(loaded.value), loaded.value.profile_digest);
});

test("profile digest drift blocks admission", () => {
  const profile = JSON.parse(readFileSync(profilePath, "utf8"));
  profile.consequence.max_direct_steps += 1;
  const admitted = admitDecisionProfile(profile);
  assert.equal(admitted.ok, false);
  assert.ok(admitted.reason_codes.includes("profile.profile-digest.mismatch"));
});

test("canonical route registry is projected completely into the verified profile", () => {
  const loaded = loadVerifiedDecisionProfile(profilePath, repositoryRoot);
  assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
  const registry = JSON.parse(readFileSync(resolve(repositoryRoot, "cyberAlchemy-v2/agent-routing/routes.json"), "utf8"));
  const expected = registry.routes.map((route) => route.route_id).filter((id) => ![registry.entry_route_id, "CA2-ROUTE-AMBIGUOUS"].includes(id)).sort();
  assert.deepEqual(loaded.value.routes.map((route) => route.route_id).sort(), expected);
  for (const route of loaded.value.routes) {
    const source = registry.routes.find((candidate) => candidate.route_id === route.route_id);
    assert.equal(route.capability_ref, source.capability_ref);
    assert.equal(route.lifecycle_state, source.lifecycle_state);
  }
});

test("Goal route is not a zero-signal fallback", () => {
  const profile = loadVerifiedDecisionProfile(profilePath, repositoryRoot).value;
  const goal = profile.routes.find((route) => route.route_id === "CA2-ROUTE-PLAN");
  assert.ok(goal.objective_kinds.length > 0);
  assert.ok(goal.signals.length > 0);
  assert.ok(goal.provenance_ids.includes("goal-profile"));
});

test("route policies admit only optional well-formed availability capability bindings", () => {
  const candidate = JSON.parse(readFileSync(profilePath, "utf8"));
  candidate.route_policies[0].availability_capability_id = "route.available/example/v1";
  candidate.profile_digest = computeDecisionProfileDigest(candidate);
  assert.equal(admitDecisionProfile(candidate).ok, true);

  candidate.route_policies[0].availability_capability_id = "Not A Capability";
  candidate.profile_digest = computeDecisionProfileDigest(candidate);
  const invalid = admitDecisionProfile(candidate);
  assert.equal(invalid.ok, false);
  assert.ok(invalid.reason_codes.some((reason) => reason.endsWith("availability_capability_id.invalid")));
});
