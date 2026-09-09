import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  canonicalJson,
  mapSelectedLocalIntent,
  sealSelectedLocalMappingProfile,
  sha256HexText,
} from "../index.mjs";

const FIELD_NAMES = [
  "source",
  "purpose",
  "scope",
  "constraints",
  "target_pressure",
  "current_output_hypothesis",
  "revision_route",
];

function field(posture, value, evidenceRefs, inferenceNote = null) {
  return {
    posture,
    value,
    evidence_refs: evidenceRefs,
    inference_note: inferenceNote,
  };
}

function record() {
  return {
    intent_id: "intent-001",
    record_schema: "intent-record.selected-local@1",
    record_status: "selected-local",
    raw_intent: {
      text_or_ref: "Choose a safe design route",
      source_ref: "conversation:1",
      captured_at: "2026-07-30T21:23:16Z",
    },
    intent: {
      source: field("declared", "operator", ["conversation:1"]),
      purpose: field("declared", "select a route", ["conversation:1"]),
      scope: field("declared", "private adapter", ["conversation:1"]),
      constraints: field(
        "inferred",
        ["no execution"],
        ["contract:authority"],
        "The adapter is advisory by contract.",
      ),
      target_pressure: field("declared", "routing is scattered", ["audit:1"]),
      current_output_hypothesis: field("declared", "small adapter", ["conversation:1"]),
      revision_route: field("unresolved", null, []),
    },
  };
}

function profile(mappings = {work_kind: "purpose", guardrails: "constraints"}) {
  return sealSelectedLocalMappingProfile({
    schema_version: "intent-route.selected-local-map@1",
    profile_id: "selected-local-default",
    source_schema: "intent-record.selected-local@1",
    mappings,
  });
}

test("mapping preserves raw intent, source digest, posture, evidence, and inference", () => {
  const source = record();
  const mapping = profile();
  const result = mapSelectedLocalIntent(source, mapping);

  assert.equal(result.ok, true);
  assert.equal(result.value.raw_intent, source.raw_intent.text_or_ref);
  assert.equal(result.value.source_digest, sha256HexText(canonicalJson(source)));
  assert.deepEqual(
    result.value.discriminators.guardrails,
    source.intent.constraints,
  );
  assert.equal(result.receipt.profile_digest, mapping.content_digest);
  assert.deepEqual(result.receipt.mapped_discriminators, ["guardrails", "work_kind"]);
  assert.deepEqual(
    result.receipt.unmapped_fields,
    FIELD_NAMES.filter((name) => !["purpose", "constraints"].includes(name)).sort(),
  );
  assert.equal(result.receipt.authority_effect, "none");
});

test("a declared selector with no source field becomes unresolved and is never guessed", () => {
  const result = mapSelectedLocalIntent(record(), profile({phase: "phase"}));

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.discriminators.phase, {
    evidence_refs: [],
    inference_note: null,
    posture: "unresolved",
    value: null,
  });
});

test("mapping profile digest mismatch fails closed", () => {
  const mapping = profile();
  mapping.content_digest = "0".repeat(64);
  const result = mapSelectedLocalIntent(record(), mapping);

  assert.equal(result.ok, false);
  assert.equal(result.diagnostic.subject, "profile");
  assert.deepEqual(result.diagnostic.reason_codes, ["profile.content_digest.mismatch"]);
});

test("add-on manifest declares exact entrypoints, protocols, and zero permissions", async () => {
  const manifest = JSON.parse(await readFile(
    new URL("../addon-manifest.json", import.meta.url),
    "utf8",
  ));

  assert.equal(manifest.schema_version, "intent-route.addon-manifest@1");
  assert.deepEqual(manifest.required_permissions, []);
  assert.equal(manifest.side_effects, false);
  assert.deepEqual(manifest.entrypoints, {
    core: "./index.mjs",
    json_port: "./src/json-port.mjs",
    selected_local_mapper: "./src/selected-local.mjs",
  });
  assert.equal(manifest.supported_protocols.runtime_port, "intent-route.runtime-port@1");
  assert.equal(manifest.supported_protocols.selected_local_source, "intent-record.selected-local@1");
});

test("exported package source has no host-runtime, network, filesystem, or DOM imports", async () => {
  const sourcePaths = [
    "../index.mjs",
    "../src/canonical-json.mjs",
    "../src/request.mjs",
    "../src/catalog.mjs",
    "../src/eligibility.mjs",
    "../src/resolve.mjs",
    "../src/json-port.mjs",
    "../src/selected-local.mjs",
  ];
  const sources = await Promise.all(sourcePaths.map((path) => (
    readFile(new URL(path, import.meta.url), "utf8")
  )));
  const forbidden = [
    /from\s+["']node:/,
    /\bprocess\./,
    /\bBuffer\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bdocument\./,
    /\bwindow\./,
  ];

  for (const pattern of forbidden) {
    assert.equal(
      sources.some((source) => pattern.test(source)),
      false,
      `forbidden environment dependency matched ${pattern}`,
    );
  }
});
