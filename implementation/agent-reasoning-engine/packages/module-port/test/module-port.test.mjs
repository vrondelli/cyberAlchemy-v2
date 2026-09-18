import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

import {
  createModulePort,
  sealModuleManifest,
  verifyModuleManifest,
} from "../index.mjs";
import {
  createSemanticTextFacade,
  semanticTextOutputValidators,
} from "../semantic-text.mjs";
import {
  createContextSourcesFacade,
  createStaticContextSourcesModulePort,
} from "../context-sources.mjs";
import {
  composeStaticModulePort,
  sealStaticModuleConfiguration,
} from "../static-composition.mjs";
import {nativeSemanticModuleManifest} from "../native-semantic-adapter.mjs";

function adapter(moduleId, capabilityId = "fixture.echo/v1", invoke = ({input}) => ({text: input.text}), dependencies = undefined) {
  return {
    manifest: sealModuleManifest({
      schema_version: "are.module-manifest/v1",
      module_id: moduleId,
      version: "1-candidate",
      adapter_protocol: "are.module-adapter/v1",
      capabilities: [{capability_id: capabilityId, input_protocol: "fixture.input/v1", output_protocol: "fixture.output/v1"}],
      ...(dependencies === undefined ? {} : {dependencies}),
      required_permissions: [],
      side_effects: false,
      authority_effect: "none",
    }),
    invoke,
  };
}

function invocation(capabilityId = "fixture.echo/v1") {
  return {
    schema_version: "are.module-invocation/v1",
    invocation_id: "fixture:invocation",
    consumer_id: "fixture-consumer",
    capability_id: capabilityId,
    input: {text: "hello"},
    dependency_posture: "required-for-judgment",
    authority_effect: "none",
  };
}

const outputValidators = {"fixture.output/v1": (value) => Object.keys(value).length === 1 && typeof value.text === "string"};

test("empty module set is valid and returns explicit unavailable receipts", () => {
  const port = createModulePort();
  assert.deepEqual(port.capability_ids, []);
  assert.equal(port.inspect().fallback, "forbidden");
  const result = port.invoke(invocation());
  assert.equal(result.ok, false);
  assert.equal(result.disposition, "unavailable");
  assert.deepEqual(result.reason_codes, ["module.capability-unavailable"]);
  assert.equal(result.receipt.module_id, null);
  assert.equal(result.receipt.authority_effect, "none");
});

test("module-set digest is independent of adapter order", () => {
  const alpha = adapter("fixture-alpha", "fixture.alpha/v1");
  const beta = adapter("fixture-beta", "fixture.beta/v1");
  const left = createModulePort({adapters: [alpha, beta]});
  const right = createModulePort({adapters: [beta, alpha]});
  assert.equal(left.module_set_digest, right.module_set_digest);
  assert.deepEqual(left.inspect().modules, right.inspect().modules);
});

test("dependency graph is exact, closed, acyclic, and deterministically ordered", () => {
  const alpha = adapter("fixture-alpha", "fixture.alpha/v1");
  const beta = adapter("fixture-beta", "fixture.beta/v1", ({input}) => ({text: input.text}),
    [{module_id: "fixture-alpha", version: "1-candidate"}]);
  const gamma = adapter("fixture-gamma", "fixture.gamma/v1", ({input}) => ({text: input.text}),
    [{module_id: "fixture-alpha", version: "1-candidate"}]);
  const left = createModulePort({adapters: [gamma, alpha, beta]});
  const right = createModulePort({adapters: [beta, gamma, alpha]});
  assert.equal(left.module_set_digest, right.module_set_digest);
  assert.deepEqual(left.inspect().dependency_order, ["fixture-alpha", "fixture-beta", "fixture-gamma"]);
  assert.deepEqual(left.inspect(), right.inspect());

  assert.throws(() => createModulePort({adapters: [beta]}), /dependency is missing/);
  const wrongVersion = adapter("fixture-wrong-version", "fixture.wrong/v1", ({input}) => ({text: input.text}),
    [{module_id: "fixture-alpha", version: "2-candidate"}]);
  assert.throws(() => createModulePort({adapters: [alpha, wrongVersion]}), /version mismatches/);
  const cycleA = adapter("fixture-cycle-a", "fixture.cycle-a/v1", ({input}) => ({text: input.text}),
    [{module_id: "fixture-cycle-b", version: "1-candidate"}]);
  const cycleB = adapter("fixture-cycle-b", "fixture.cycle-b/v1", ({input}) => ({text: input.text}),
    [{module_id: "fixture-cycle-a", version: "1-candidate"}]);
  assert.throws(() => createModulePort({adapters: [cycleA, cycleB]}), /cycle detected/);
});

test("static composition binds reviewed factories exactly and rejects partial upgrades", () => {
  const alpha = adapter("fixture-static-alpha", "fixture.static-alpha/v1");
  const beta = adapter("fixture-static-beta", "fixture.static-beta/v1", ({input}) => ({text: input.text}),
    [{module_id: "fixture-static-alpha", version: "1-candidate"}]);
  const configuration = sealStaticModuleConfiguration({
    configuration_id: "fixture-static-composition",
    modules: [
      {factory_id: "beta-factory", module_id: beta.manifest.module_id, version: beta.manifest.version, manifest_digest: beta.manifest.manifest_digest},
      {factory_id: "alpha-factory", module_id: alpha.manifest.module_id, version: alpha.manifest.version, manifest_digest: alpha.manifest.manifest_digest},
    ],
  });
  const composed = composeStaticModulePort({configuration, adapter_factories: {
    "alpha-factory": () => alpha,
    "beta-factory": () => beta,
  }});
  assert.equal(composed.ok, true);
  assert.equal(composed.disposition, "available");
  assert.deepEqual(composed.dependency_order, ["fixture-static-alpha", "fixture-static-beta"]);
  assert.equal(Object.isFrozen(configuration.modules[0]), true);
  assert.equal(Object.isFrozen(composed.modules[0]), true);

  const alphaOnlyConfiguration = sealStaticModuleConfiguration({
    configuration_id: "wrapper-reviewed-modules-successor",
    modules: [{factory_id: "alpha-factory", module_id: alpha.manifest.module_id,
      version: alpha.manifest.version, manifest_digest: alpha.manifest.manifest_digest}],
  });
  const successor = composeStaticModulePort({configuration: alphaOnlyConfiguration,
    adapter_factories: {"alpha-factory": () => alpha}});
  assert.equal(successor.ok, true);
  assert.notEqual(successor.module_set_digest, composed.module_set_digest);

  const missing = composeStaticModulePort({configuration, adapter_factories: {"alpha-factory": () => alpha}});
  assert.equal(missing.port, null);
  assert.deepEqual(missing.reason_codes, ["module.reviewed-factory-unavailable"]);

  const upgradedAlpha = {...alpha, manifest: sealModuleManifest({...alpha.manifest, version: "2-candidate"})};
  const drifted = composeStaticModulePort({configuration, adapter_factories: {
    "alpha-factory": () => upgradedAlpha,
    "beta-factory": () => beta,
  }});
  assert.equal(drifted.port, null);
  assert.deepEqual(drifted.reason_codes, ["module.static-binding-drift"]);
});

test("native semantic adapter is self-contained and digest-bound", () => {
  assert.equal(nativeSemanticModuleManifest.module_id, "are-native-semantic-text");
  assert.equal(verifyModuleManifest(nativeSemanticModuleManifest), true);
  assert.match(nativeSemanticModuleManifest.manifest_digest, /^[a-f0-9]{64}$/u);
  assert.equal(nativeSemanticModuleManifest.authority_effect, "none");
});

test("manifest validation is closed and digest-bound", () => {
  const valid = adapter("fixture-valid").manifest;
  assert.equal(verifyModuleManifest(valid), true);
  assert.equal(verifyModuleManifest({...valid, unexpected: true}), false);
  assert.equal(verifyModuleManifest({...valid, version: "changed"}), false);
  assert.throws(() => sealModuleManifest({...valid, unexpected: true}), /manifest fields/);
});

test("duplicate capability providers are rejected without priority", () => {
  assert.throws(() => createModulePort({adapters: [adapter("fixture-one"), adapter("fixture-two")]}), /ambiguous/);
  assert.throws(() => createModulePort({
    adapters: [adapter("fixture-same", "fixture.one/v1"), adapter("fixture-same", "fixture.two/v1")],
  }), /identity is duplicated/);
});

test("valid synchronous output is sealed with exact receipt digests", () => {
  const port = createModulePort({adapters: [adapter("fixture-echo")], output_validators: outputValidators});
  const result = port.invoke(invocation());
  assert.equal(result.ok, true);
  assert.equal(result.disposition, "available");
  assert.deepEqual(result.value, {text: "hello"});
  assert.equal(result.module_id, "fixture-echo");
  assert.match(result.receipt.input_digest, /^[a-f0-9]{64}$/u);
  assert.match(result.receipt.output_digest, /^[a-f0-9]{64}$/u);
  assert.match(result.receipt.receipt_digest, /^[a-f0-9]{64}$/u);
  assert.equal(result.authority_effect, "none");
});

test("validator configuration is snapshotted at construction", () => {
  const validators = {...outputValidators};
  const port = createModulePort({adapters: [adapter("fixture-stable-validator")], output_validators: validators});
  validators["fixture.output/v1"] = () => false;
  assert.equal(port.invoke(invocation()).disposition, "available");
});

test("missing validators, exceptions, promises, and malformed output block without leaked errors", () => {
  const missing = createModulePort({adapters: [adapter("fixture-missing-validator")]}).invoke(invocation());
  assert.deepEqual(missing.reason_codes, ["module.output-validator-unavailable"]);

  const failing = createModulePort({
    adapters: [adapter("fixture-failing", "fixture.echo/v1", () => { throw new Error("secret backend detail"); })],
    output_validators: outputValidators,
  }).invoke(invocation());
  assert.deepEqual(failing.reason_codes, ["module.invoke-failed"]);
  assert.doesNotMatch(JSON.stringify(failing), /secret backend detail/);

  const promised = createModulePort({
    adapters: [adapter("fixture-promise", "fixture.echo/v1", () => Promise.resolve({text: "late"}))],
    output_validators: outputValidators,
  }).invoke(invocation());
  assert.deepEqual(promised.reason_codes, ["module.invoke-must-be-synchronous"]);

  const malformed = createModulePort({
    adapters: [adapter("fixture-malformed", "fixture.echo/v1", () => ({wrong: true}))],
    output_validators: outputValidators,
  }).invoke(invocation());
  assert.deepEqual(malformed.reason_codes, ["module.output-invalid"]);
});

test("semantic facade exposes unavailable rather than false when no module is installed", () => {
  const facade = createSemanticTextFacade(createModulePort({output_validators: semanticTextOutputValidators}), {consumer_id: "request-intent-runtime"});
  const key = facade.semanticKey("Build—a—new system", {invocation_id: "semantic-key-1"});
  const phrase = facade.containsPhrase("predefined", "define", {invocation_id: "phrase-1"});
  assert.equal(key.disposition, "unavailable");
  assert.equal(key.value, null);
  assert.equal(phrase.disposition, "unavailable");
  assert.equal(phrase.value, null);
});

test("core and semantic facade do not import the concrete native adapter", () => {
  const core = readFileSync(new URL("../index.mjs", import.meta.url), "utf8");
  const facade = readFileSync(new URL("../semantic-text.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(core, /native-semantic-adapter/u);
  assert.doesNotMatch(facade, /native-semantic-adapter/u);
});

test("context source facade returns typed catalog and ontology receipts", () => {
  const definition_catalog = JSON.parse(readFileSync(new URL("../../context-basis-runtime/test/fixtures/definition-catalog.json", import.meta.url), "utf8"));
  const ontology_snapshot = JSON.parse(readFileSync(new URL("../../context-basis-runtime/test/fixtures/ontology-snapshot.json", import.meta.url), "utf8"));
  const port = createStaticContextSourcesModulePort({definition_catalog, ontology_snapshot});
  const facade = createContextSourcesFacade(port, {consumer_id: "context-basis-runtime"});
  const catalog = facade.definitionCatalog({invocation_id: "context-source:catalog", dependency_posture: "required-for-operation"});
  const ontology = facade.ontologySnapshot({invocation_id: "context-source:ontology", dependency_posture: "optional-enrichment"});
  assert.equal(catalog.disposition, "available");
  assert.equal(catalog.value.catalog_id, definition_catalog.catalog_id);
  assert.equal(ontology.disposition, "available");
  assert.equal(ontology.value.ontology_id, ontology_snapshot.ontology_id);
  assert.equal(catalog.receipt.module_set_digest, ontology.receipt.module_set_digest);
  assert.match(catalog.receipt.output_digest, /^[a-f0-9]{64}$/u);
});

test("static context source adapter snapshots values and preserves partial capability absence", () => {
  const definition_catalog = JSON.parse(readFileSync(new URL("../../context-basis-runtime/test/fixtures/definition-catalog.json", import.meta.url), "utf8"));
  const port = createStaticContextSourcesModulePort({definition_catalog});
  definition_catalog.catalog_id = "mutated-after-construction";
  definition_catalog.definitions[0].definition_id = "mutated-nested-definition";
  const facade = createContextSourcesFacade(port, {consumer_id: "context-basis-runtime"});
  const catalog = facade.definitionCatalog({invocation_id: "context-source:catalog-snapshot", dependency_posture: "required-for-operation"});
  const ontology = facade.ontologySnapshot({invocation_id: "context-source:ontology-missing", dependency_posture: "optional-enrichment"});
  assert.equal(catalog.value.catalog_id, "test.are.context-basis.definitions");
  assert.equal(catalog.value.definitions[0].definition_id, "RequestContext");
  assert.equal(ontology.disposition, "unavailable");
  assert.deepEqual(ontology.reason_codes, ["module.capability-unavailable"]);
});
