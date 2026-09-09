#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const conceptsPath = resolve(here, "concepts.json");
const schemaPath = resolve(here, "concepts.schema.json");
const readme = readFileSync(resolve(here, "README.md"), "utf8");
const document = JSON.parse(readFileSync(conceptsPath, "utf8"));
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) throw new Error(message);
}

const schemaRun = spawnSync("python3", ["-c", [
  "import json,sys",
  "from jsonschema import Draft202012Validator",
  "schema=json.load(open(sys.argv[1],encoding='utf-8'))",
  "value=json.load(open(sys.argv[2],encoding='utf-8'))",
  "Draft202012Validator.check_schema(schema)",
  "Draft202012Validator(schema).validate(value)",
].join(";"), schemaPath, conceptsPath], { encoding: "utf8" });
assert(schemaRun.status === 0, `schema validation failed:${(schemaRun.stderr || schemaRun.stdout).trim()}`);

const expectedIds = Array.from({ length: 8 }, (_, index) => `domainspec-v2-D${index + 37}`);
assert(JSON.stringify(document.concepts.map(({ proposed_id }) => proposed_id)) === JSON.stringify(expectedIds), "concept identity/order drift");
assert(new Set(document.concepts.map(({ term }) => term)).size === 8, "duplicate concept term");
assert(JSON.stringify(document.admission.definition_ids) === JSON.stringify(["domainspec-v2-D36", ...expectedIds]), "admitted definition identity drift");
assert(document.admission.baseline_id === "domainspec-meta-types-current-implemented@7", "admitted baseline identity drift");
assert(document.concepts[0]?.term === "Recovery Intent", "D37 Recovery Intent terminology drift");
for (const concept of document.concepts) {
  const heading = `### D${concept.proposed_id.split("D").at(-1)} — ${concept.term}`;
  const start = readme.indexOf(heading);
  const end = readme.indexOf("\n### D", start + heading.length);
  const card = start < 0 ? "" : readme.slice(start, end < 0 ? readme.length : end);
  assert(start >= 0, `missing three-voice card:${concept.proposed_id}`);
  assert(card.includes("Formal voice:"), `formal voice missing:${concept.proposed_id}`);
  assert(card.includes("Plain-language voice:"), `plain-language voice missing:${concept.proposed_id}`);
  assert(card.includes("Domain-context voice:"), `domain-context voice missing:${concept.proposed_id}`);
  assert(card.includes("Non-collapse boundary:"), `non-collapse boundary missing:${concept.proposed_id}`);
}

const states = new Set(document.concepts.find(({ proposed_id }) => proposed_id === "domainspec-v2-D38").states);
for (const transition of document.dispatch_transitions) {
  assert(states.has(transition.from) && states.has(transition.to), `unknown dispatch transition:${transition.from}->${transition.to}`);
}
assert(!document.dispatch_transitions.some(({ from }) => from === "terminal"), "terminal dispatch has successor");
assert(document.concepts.find(({ proposed_id }) => proposed_id === "domainspec-v2-D39").states.includes("unknown"), "unknown attempt outcome absent");
assert(document.concepts.find(({ proposed_id }) => proposed_id === "domainspec-v2-D40").retry_identity_behavior === "preserved", "invocation identity changes across retry");
assert(document.concepts.find(({ proposed_id }) => proposed_id === "domainspec-v2-D39").retry_identity_behavior === "new-per-execution-episode", "attempt identity does not change per execution episode");
const claim = document.concepts.find(({ proposed_id }) => proposed_id === "domainspec-v2-D41");
const lease = document.concepts.find(({ proposed_id }) => proposed_id === "domainspec-v2-D42");
assert(claim.term === "Compensation Claim", "claim concept missing or combined with lease");
assert(claim.identity_fields.includes("fencing_token"), "claim fencing token absent");
assert(claim.identity_fields.includes("acquired_dispatch_version"), "claim acquisition version absent");
assert(claim.retry_identity_behavior === "independent-authority-lifecycle", "claim lifecycle incorrectly coupled to retry");
assert(lease.term === "Compensation Claim Lease", "lease concept missing or combined with claim");
assert(lease.identity_fields.includes("claim_id"), "lease is not bound to claim identity");
assert(lease.identity_fields.includes("lease_generation"), "lease renewal generation absent");
assert(lease.retry_identity_behavior === "independent-authority-lifecycle", "lease lifecycle incorrectly coupled to retry");
for (const excluded of ["exactly-once-process-execution", "new-meta-type", "new-relationship-verb", "dead-letter"]) {
  assert(document.excluded_semantics.includes(excluded), `non-collapse exclusion missing:${excluded}`);
}
for (const invariant of [
  "intent-required-until-terminal-satisfied-only-completed-unresolved-only-exhausted-or-escalated",
  "one-current-fenced-claim-per-dispatch",
  "claim-acquisition-cas-binds-current-dispatch-version",
  "dispatch-advancement-requires-current-claim-and-active-lease",
  "lease-renewal-preserves-claim-and-fence-with-new-generation",
  "takeover-creates-new-claim-with-greater-fence",
  "stale-claimant-cannot-commit-dispatch-advancement",
  "stable-invocation-identity-across-replays",
  "recovery-operation-enforces-at-most-once-semantic-application-per-invocation-identity",
  "claim-acquisition-lease-grant-or-renewal-alone-does-not-create-an-attempt",
  "expired-lease-during-execution-makes-attempt-unknown-before-replay",
  "dispatch-transition-and-dispatch-outbox-are-atomic",
  "operation-business-state-and-outbox-remain-operation-owned",
  "terminal-disposition-has-no-implicit-successor",
]) assert(document.invariants.includes(invariant), `invariant missing:${invariant}`);

process.stdout.write(`${JSON.stringify({
  status: "pass",
  package_id: document.package_id,
  concepts: document.concepts.length,
  dispatch_transitions: document.dispatch_transitions.length,
  invariants: document.invariants.length,
  checks,
  admission_state: document.status,
  authority_effect: document.authority_effect,
}, null, 2)}\n`);
