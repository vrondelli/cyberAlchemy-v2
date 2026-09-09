import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";

import {runModelDrivenCodingTurn} from "../controller.mjs";
import {snapshotTree} from "../index.mjs";
import {createOpenAICompatibleModelTransport} from "../model-transport.mjs";
import {createInjectedSecretProvider, createSecretProviderRegistry, createSecretReference} from "../secret-provider.mjs";

function jsonResponse(payload, status = 200) {
  return {ok: status >= 200 && status < 300, status, async json() { return payload; }};
}

test("OpenAI-compatible transport resolves an environment secret without serializing it", async () => {
  const calls = [];
  const transport = createOpenAICompatibleModelTransport({
    base_url: "https://models.example.test/v1/",
    model: "test-model",
    api_key_env: "ARE_TEST_MODEL_KEY",
    env: {ARE_TEST_MODEL_KEY: "do-not-serialize"},
    fetch_impl: async (url, options) => {
      calls.push({url, options});
      return jsonResponse({choices: [{message: {content: "candidate-bytes"}}]});
    }
  });
  const generated = await transport.generate({prompt: "exact prompt", run_id: "provider-test"});
  assert.equal(calls[0].url, "https://models.example.test/v1/chat/completions");
  assert.equal(calls[0].options.headers.authorization, "Bearer do-not-serialize");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    model: "test-model",
    messages: [{role: "user", content: "exact prompt"}],
    stream: false
  });
  assert.equal(generated.final_bytes, "candidate-bytes");
  assert.equal(generated.receipt.api_key_source, "environment:ARE_TEST_MODEL_KEY");
  assert.equal(JSON.stringify(generated.receipt).includes("do-not-serialize"), false);
  assert.equal(generated.receipt.authority_effect, "none");
});

test("OpenAI-compatible transport supports an unauthenticated Ollama-shaped endpoint", async () => {
  let headers;
  const transport = createOpenAICompatibleModelTransport({
    base_url: "http://127.0.0.1:11434/v1",
    model: "qwen-coder-test",
    env: {},
    fetch_impl: async (_url, options) => {
      headers = options.headers;
      return jsonResponse({choices: [{message: {content: [{type: "text", text: "local-bytes"}]}}]});
    }
  });
  const generated = await transport.generate({prompt: "local prompt", run_id: "ollama-test"});
  assert.equal(headers.authorization, undefined);
  assert.equal(generated.final_bytes, "local-bytes");
  assert.equal(generated.receipt.api_key_source, "none");
});

test("OpenAI-compatible transport does not include a remote error body in its error", async () => {
  const transport = createOpenAICompatibleModelTransport({
    base_url: "https://models.example.test/v1",
    model: "test-model",
    fetch_impl: async () => ({ok: false, status: 401, async json() { return {error: "secret response"}; }})
  });
  await assert.rejects(() => transport.generate({prompt: "prompt", run_id: "error-test"}), /MODEL_HTTP_ERROR:401/u);
});

test("OpenAI-compatible transport rejects credentials embedded in the base URL", () => {
  assert.throws(() => createOpenAICompatibleModelTransport({
    base_url: "https://user:password@models.example.test/v1",
    model: "test-model"
  }), /base_url credentials are forbidden/u);
});

test("OpenAI-compatible transport consumes a neutral secret reference without exposing its locator", async () => {
  const material = "provider-secret-material";
  const locator = "cloud/tenant/model-key";
  let authorization;
  const apiKeyRef = createSecretReference({provider_id: "cloud-plugin", locator});
  const secretRegistry = createSecretProviderRegistry({providers: [createInjectedSecretProvider({
    provider_id: "cloud-plugin",
    resolve: async () => material
  })]});
  const transport = createOpenAICompatibleModelTransport({
    base_url: "https://models.example.test/v1",
    model: "test-model",
    api_key_ref: apiKeyRef,
    secret_registry: secretRegistry,
    fetch_impl: async (_url, options) => {
      authorization = options.headers.authorization;
      return jsonResponse({choices: [{message: {content: "candidate-bytes"}}]});
    }
  });
  const generated = await transport.generate({prompt: "exact prompt", run_id: "neutral-secret-test"});
  assert.equal(authorization, `Bearer ${material}`);
  assert.equal(generated.receipt.api_key_source, "secret-provider:cloud-plugin");
  assert.equal(generated.receipt.secret_consumption.status, "consumed");
  const rendered = JSON.stringify(generated.receipt);
  assert.equal(rendered.includes(material), false);
  assert.equal(rendered.includes(locator), false);
});

test("OpenAI-compatible transport rejects ambiguous credential sources", () => {
  const apiKeyRef = createSecretReference({provider_id: "cloud-plugin", locator: "cloud/key"});
  const secretRegistry = createSecretProviderRegistry({providers: [createInjectedSecretProvider({provider_id: "cloud-plugin", resolve: async () => "key"})]});
  assert.throws(() => createOpenAICompatibleModelTransport({
    base_url: "https://models.example.test/v1",
    model: "test-model",
    api_key: "direct-key",
    api_key_ref: apiKeyRef,
    secret_registry: secretRegistry
  }), /Exactly one API-key source/u);
});

test("Codex-independent transport drives the existing verified patch path", async () => {
  const root = mkdtempSync(join(tmpdir(), "are-openai-compatible-test-"));
  try {
    for (const [path, utf8] of Object.entries({
      "package.json": "{\"type\":\"module\"}\n",
      "src/value.mjs": "export const value = 1;\n",
      "test/value.test.mjs": "import test from 'node:test';import assert from 'node:assert/strict';import {value} from '../src/value.mjs';test('value',()=>assert.equal(value,2));\n"
    })) {
      const target = resolve(root, path);
      mkdirSync(dirname(target), {recursive: true});
      writeFileSync(target, utf8);
    }
    const before = snapshotTree(root);
    const candidate = {
      schema_version: "are.next-action-candidate/v1",
      operation: "replace-file",
      path: "src/value.mjs",
      expected_base_tree_sha256: before.tree_sha256,
      expected_file_sha256: before.files["src/value.mjs"],
      utf8: "export const value = 2;\n",
      rationale: "repair fixture",
      authority_effect: "none"
    };
    const transport = createOpenAICompatibleModelTransport({
      base_url: "http://127.0.0.1:11434/v1",
      model: "local-test",
      env: {},
      fetch_impl: async () => jsonResponse({choices: [{message: {content: JSON.stringify(candidate)}}]})
    });
    const receipt = await runModelDrivenCodingTurn({
      run_id: "openai-compatible-e2e",
      request: "repair value",
      fixture_root: root,
      observation_allowlist: ["package.json", "src/value.mjs", "test/value.test.mjs"],
      mutation_allowlist: ["src/value.mjs"],
      verification_command: [process.execPath, "--test"],
      model_transport: transport,
      approve: true
    });
    assert.equal(receipt.status, "PATCH_CANDIDATE", JSON.stringify(receipt));
    assert.equal(receipt.verification.status, "PASS_BOUNDED");
    assert.equal(readFileSync(resolve(root, "src/value.mjs"), "utf8"), "export const value = 2;\n");
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
