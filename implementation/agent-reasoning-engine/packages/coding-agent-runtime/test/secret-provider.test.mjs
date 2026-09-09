import assert from "node:assert/strict";
import test from "node:test";

import {
  SecretProviderError,
  createEnvironmentSecretProvider,
  createInjectedSecretProvider,
  createSecretProviderRegistry,
  createSecretReference,
  projectSecretReference
} from "../secret-provider.mjs";

const REQUEST_DIGEST = "a".repeat(64);

test("secret references serialize only a redacted provider and digest projection", () => {
  const reference = createSecretReference({provider_id: "cloud-plugin", locator: "projects/example/secrets/model-key", purpose: "model-provider"});
  const rendered = JSON.stringify(reference);
  assert.equal(rendered.includes("projects/example"), false);
  assert.equal(rendered.includes("model-key"), false);
  assert.deepEqual(JSON.parse(rendered), projectSecretReference(reference));
});
test("environment provider supports deployment injection and clears retained callback bytes", async () => {
  const reference = createSecretReference({provider_id: "deploy-env", locator: "MODEL_API_KEY"});
  const registry = createSecretProviderRegistry({providers: [createEnvironmentSecretProvider({provider_id: "deploy-env", env: {MODEL_API_KEY: "injected-secret"}})]});
  let retained;
  let observed;
  const receipt = await registry.consume({
    secret_ref: reference,
    consumer_id: "model-transport",
    request_digest: REQUEST_DIGEST,
    consumer: async (material) => {
      retained = material;
      observed = Buffer.from(material).toString("utf8");
    }
  });
  assert.equal(observed, "injected-secret");
  assert.deepEqual([...retained], new Array("injected-secret".length).fill(0));
  assert.equal(JSON.stringify(receipt).includes("injected-secret"), false);
  assert.equal(JSON.stringify(receipt).includes("MODEL_API_KEY"), false);
  assert.equal(receipt.authority_effect, "none");
});

test("injected provider is a neutral cloud or plugin boundary", async () => {
  const calls = [];
  const reference = createSecretReference({provider_id: "cloud-sm", locator: "tenant/model/key"});
  const registry = createSecretProviderRegistry({providers: [createInjectedSecretProvider({
    provider_id: "cloud-sm",
    async resolve(request) {
      calls.push(request);
      return new Uint8Array(Buffer.from("cloud-secret", "utf8"));
    }
  })]});
  await registry.consume({
    secret_ref: reference,
    consumer_id: "model-transport",
    request_digest: REQUEST_DIGEST,
    consumer: (material) => { assert.equal(Buffer.from(material).toString("utf8"), "cloud-secret"); }
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].request_digest, REQUEST_DIGEST);
});

test("missing providers and backend failures expose only redacted errors", async () => {
  const locator = "sensitive/provider/location";
  const reference = createSecretReference({provider_id: "missing-provider", locator});
  const registry = createSecretProviderRegistry({providers: [createInjectedSecretProvider({provider_id: "other-provider", resolve: async () => "unused"})]});
  await assert.rejects(
    () => registry.consume({secret_ref: reference, consumer_id: "model-transport", request_digest: REQUEST_DIGEST, consumer: () => {}}),
    (error) => error instanceof SecretProviderError && error.code === "provider-unavailable" && !String(error).includes(locator)
  );

  const failing = createSecretProviderRegistry({providers: [createInjectedSecretProvider({provider_id: "failing-provider", resolve: async () => { throw new Error(`leak:${locator}`); }})]});
  const failingReference = createSecretReference({provider_id: "failing-provider", locator});
  await assert.rejects(
    () => failing.consume({secret_ref: failingReference, consumer_id: "model-transport", request_digest: REQUEST_DIGEST, consumer: () => {}}),
    (error) => error instanceof SecretProviderError && error.code === "resolution-denied" && !String(error).includes(locator)
  );
});

test("a consumer cannot return secret material through the consumption boundary", async () => {
  const reference = createSecretReference({provider_id: "test-provider", locator: "secret"});
  const registry = createSecretProviderRegistry({providers: [createInjectedSecretProvider({provider_id: "test-provider", resolve: async () => "secret-material"})]});
  await assert.rejects(
    () => registry.consume({secret_ref: reference, consumer_id: "model-transport", request_digest: REQUEST_DIGEST, consumer: (material) => Buffer.from(material)}),
    (error) => error instanceof SecretProviderError && error.code === "consumer-denied" && !String(error).includes("secret-material")
  );
});
