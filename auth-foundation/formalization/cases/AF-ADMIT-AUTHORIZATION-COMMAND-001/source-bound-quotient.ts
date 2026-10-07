import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalSfolJson } from "../../../../craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/cases/index.js";
import { AUTH_SFOL_V4_SOURCE_PATHS } from "./domainspec-v4-correspondence.js";
import { runAuthNativeWitness } from "./native-witness.js";

const AUTH = fileURLToPath(new URL("../../../", import.meta.url));
const RUST = "implementation/current-runtime-successor-v1/command-boundary/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs";
const REVIEWED_RUST_SHA256 = "6501579fd22c0ba60d876331ab2208406996dd46bbf73913dc64778194e08d1a";
const REVIEWED_RUST_SIZE = 12987;
const sha = (bytes: Buffer | string): string => createHash("sha256").update(bytes).digest("hex");
function fail(code: string, detail: string): never { throw new Error(`${code}:${detail}`); }

/* Independently reviewed declarations of the one byte-pinned source. These are
 * recognition pins, not a Rust parser or an automated purity proof. */
const declarations = {
  struct: {
    AuthenticatedSessionEvidence: "7afd037cada5b880bf2cc3792adb7c824fcdb0e143beaf091e3f7e049991af04",
    Permission: "66df6f2fa10db7ac6020f1558727de8a2afe73c1f43a31cfdb95a4738e099f7c",
    AuthorizationCommand: "452746a28acd16250163a2b2e22e8b5b160303ba74eaf238c769b1c7bb833aa5",
    BoundaryRequest: "a6553f74324a2b2551aed1151fbce4d07ddfc8a4a2ffb8b7e0706fda45c02740",
    RouteAuthorizationBinding: "e1ee4e75b5d04a4d72fe3d2c7d99f9bda5f8fc3e660a10b2a770352da0038594",
    CommandBoundaryContext: "6676094d7cce63fe22ee2d1ee5d97f883cfd7fd82cf03d3daab28fbc696667d8",
  },
  enum: { CommandBoundaryDecision: "1225efb745a913f77039b4dbfa9af18e569c29e0126b30a30268ded8e3857263" },
  fn: {
    candidate_command_provenance: "7a984687646b529808b34d0c78ecd5868da70bb67271151c0ba652a1dd7164ae",
    unique_complete_route_binding: "216528c3a33d49fadfeb718b86fd8e01fc8b522fd7e601ec5a8e0bf68ecbf1eb",
    unique_trusted_authentication_evidence: "ced4c1ba7eae5ee57c2992fbf4dde6c1ff995381dfedfb99fe1cc8ba7cb5ac68",
    command_boundary_admissible: "e561c6d6fbb929928bed3b0641f376e9408bc6998a35cafd7e2afc6e7621eb68",
    admit_authorization_command: "8ae5365687012db6b7af7d2af5f863ea22b39664b01575e2895af7b46995688d",
  },
} as const;

/** Erase comments and literals without moving offsets; reject unsupported lexical forms. */
function codeMask(source: string): string {
  const out = [...source];
  let mode: "code" | "line" | "block" | "string" = "code";
  let blocks = 0;
  for (let i = 0; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (mode === "code") {
      if (c === "/" && n === "/") { out[i] = out[i + 1] = " "; i++; mode = "line"; continue; }
      if (c === "/" && n === "*") { out[i] = out[i + 1] = " "; i++; blocks = 1; mode = "block"; continue; }
      if (c === '"') { out[i] = " "; mode = "string"; continue; }
      if (c === "'") fail("AUTH_QUOTIENT_LEX", "unsupported character literal or lifetime");
      continue;
    }
    if (c !== "\n") out[i] = " ";
    if (mode === "line") { if (c === "\n") mode = "code"; continue; }
    if (mode === "block") {
      if (c === "/" && n === "*") { out[i + 1] = " "; i++; blocks++; }
      else if (c === "*" && n === "/") { out[i + 1] = " "; i++; if (--blocks === 0) mode = "code"; }
      continue;
    }
    if (c === "\\") { if (n === undefined) fail("AUTH_QUOTIENT_LEX", "truncated escape"); out[i + 1] = " "; i++; }
    else if (c === '"') mode = "code";
  }
  if (mode === "block" || mode === "string") fail("AUTH_QUOTIENT_LEX", "unterminated comment or literal");
  return out.join("");
}

function declaration(source: string, mask: string, kind: string, name: string): string {
  const matcher = new RegExp(`\\bpub\\s+${kind}\\s+${name}\\b`, "g");
  const hits = [...mask.matchAll(matcher)];
  if (hits.length !== 1) fail("AUTH_QUOTIENT_SYMBOL", `${kind} ${name}: count=${hits.length}`);
  const start = hits[0]!.index;
  const brace = mask.indexOf("{", start);
  if (brace < 0) fail("AUTH_QUOTIENT_SYNTAX", `${kind} ${name}: missing body`);
  let depth = 0;
  for (let i = brace; i < mask.length; i++) {
    if (mask[i] === "{") depth++;
    else if (mask[i] === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  return fail("AUTH_QUOTIENT_SYNTAX", `${kind} ${name}: unbalanced body`);
}

/** Testable declaration recognition bypasses the production whole-file gate.
 * Declaration pins reject changes within selected bodies, including call graph
 * and branch order. Only the production whole-file pin rejects extra code
 * outside these declarations. No general Rust claim. */
export function recognizeReviewedAuthRust(source: string) {
  const mask = codeMask(source);
  const checked: Record<string, string> = {};
  for (const [kind, names] of Object.entries(declarations)) {
    for (const [name, expected] of Object.entries(names)) {
      const found = declaration(source, mask, kind, name);
      if (sha(found) !== expected) fail("AUTH_QUOTIENT_DECLARATION", `${kind} ${name}`);
      checked[`${kind}:${name}`] = expected;
    }
  }
  return checked;
}

export function checkReviewedAuthRust(bytes: Buffer) {
  if (bytes.length !== REVIEWED_RUST_SIZE || sha(bytes) !== REVIEWED_RUST_SHA256)
    fail("AUTH_QUOTIENT_SOURCE", "reviewed whole-file Rust bytes changed");
  return recognizeReviewedAuthRust(bytes.toString("utf8"));
}

function currentSources(): Map<string, Buffer> {
  return new Map(Object.values(AUTH_SFOL_V4_SOURCE_PATHS).map(path => [path, readFileSync(resolve(AUTH, path))]));
}
function currentRust(): Buffer {
  const path = resolve(AUTH, RUST);
  const before = lstatSync(path);
  if (!before.isFile() || before.isSymbolicLink() || realpathSync(path) !== path || before.size !== REVIEWED_RUST_SIZE)
    fail("AUTH_QUOTIENT_SOURCE", "selected Rust is not the reviewed regular file");
  const bytes = readFileSync(path);
  const after = lstatSync(path);
  if (before.dev !== after.dev || before.ino !== after.ino || before.mtimeMs !== after.mtimeMs || bytes.length !== after.size)
    fail("AUTH_QUOTIENT_SOURCE", "selected Rust changed during read");
  return bytes;
}

/** Local source-bound conditional derivation, not an admitted v4 formal claim. */
export function runAuthSourceBoundQuotient(sources: ReadonlyMap<string, Buffer> = currentSources()) {
  const rust = currentRust();
  const declarationPins = checkReviewedAuthRust(rust);
  // Re-execution is intentional: witness/report hashes alone cannot support
  // even existential corroboration from the current generated Rust.
  const witness = runAuthNativeWitness(sources);
  if (witness.generated_rust.sha256 !== REVIEWED_RUST_SHA256 ||
      witness.generated_rust.size_bytes !== REVIEWED_RUST_SIZE ||
      witness.observations.length !== 8) fail("AUTH_QUOTIENT_WITNESS", "current witness/source mismatch");
  if (!currentRust().equals(rust)) fail("AUTH_QUOTIENT_SOURCE", "selected Rust changed during derivation");
  const body = {
    schema_version: "auth-foundation.source-bound-quotient/v1-candidate" as const,
    reviewed_rust: { path: RUST, sha256: REVIEWED_RUST_SHA256, size_bytes: REVIEWED_RUST_SIZE,
      declaration_sha256: declarationPins },
    current_successor_binding: witness.successor_binding,
    current_successor_receipt: witness.current_successor_receipt,
    correspondence_sha256: witness.correspondence_sha256,
    native_witness_report_sha256: witness.report_sha256,
    native_witness_observations: witness.observations.map(row => ({ case_id: row.case_id,
      case_digest: row.case_digest, valuation: row.valuation, observed_decision: row.observed_decision })),
    rule_selectors: ["auth-command-boundary:unique-trusted-authentication-evidence",
      "auth-command-boundary:unique-complete-route-binding",
      "auth-command-boundary:candidate-command-provenance"],
    guard_equation: "g(c) = a(c) && b(c) && p(c)" as const,
    operation_equation: "admit_authorization_command(c) = if g(c) { Ready } else { Deny }" as const,
    conditional_result: "For representable pinned CommandBoundaryContext c under normally terminating, stable and pure leaf evaluations: if a(c) && b(c) && p(c), then Ready; otherwise Deny. Outside these assumptions no result is asserted" as const,
    assumptions: ["ordinary Rust short-circuit and branch semantics", "terminating, stable and pure leaf outcomes",
      "reviewed source corresponds to compiler input and executable semantics"],
    historical_build_currentness: witness.historical_build_currentness,
    status: "candidate-source-bound-conditional-derivation" as const,
    neutral_set_eligible: false as const, can_satisfy_obligation: false as const,
    evf_pass_emitted: false as const, authority_effect: "none" as const,
    claim_ceiling: "Exact reviewed Rust source-bound conditional equation and eight re-executed existential witnesses only; no leaf-to-business-meaning preservation, admitted v4 formal claim, all-context formal Rust proof, deployment, independent provider, EVF pass or F5 satisfaction" as const,
  };
  return { ...body, report_sha256: sha(canonicalSfolJson(body)) };
}

export function replayAuthSourceBoundQuotient(held: ReturnType<typeof runAuthSourceBoundQuotient>,
  sources: ReadonlyMap<string, Buffer> = currentSources()): ReturnType<typeof runAuthSourceBoundQuotient> {
  const current = runAuthSourceBoundQuotient(sources);
  if (canonicalSfolJson(current) !== canonicalSfolJson(held))
    fail("AUTH_QUOTIENT_REPLAY", "held certificate differs from current re-derivation");
  return current;
}
