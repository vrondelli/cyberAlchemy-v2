import {createHash} from "node:crypto";

const MAX_SECRET_BYTES = 1024 * 1024;
const PROVIDER_ID = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/u;
const PURPOSE = PROVIDER_ID;
const ENV_LOCATOR = /^[A-Z_][A-Z0-9_]{0,126}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const referenceState = new WeakMap();

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function deny(code) {
  throw new SecretProviderError(code);
}

function checkedText(value, pattern, code) {
  if (typeof value !== "string" || !pattern.test(value)) deny(code);
  return value;
}

function checkedLocator(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 1024 || value.includes("\0")) deny("reference-invalid");
  return value;
}

function stateFor(reference) {
  const state = referenceState.get(reference);
  if (!state) deny("reference-invalid");
  return state;
}

function ownedBytes(material) {
  if (typeof material === "string") {
    const value = Buffer.from(material, "utf8");
    if (value.length === 0 || value.length > MAX_SECRET_BYTES) deny("material-invalid");
    return value;
  }
  if (!Buffer.isBuffer(material) && !(material instanceof Uint8Array)) deny("material-invalid");
  if (material.byteLength === 0 || material.byteLength > MAX_SECRET_BYTES) deny("material-invalid");
  const value = Buffer.from(material);
  material.fill(0);
  return value;
}

const resolutionReasons = new Set(['timeout','spawn-failed','stdin-failed','output-limit','process-failed','empty-output']);
export class SecretResolutionError extends Error {
  constructor(reason) {
    super('secret resolution failed');
    this.name = 'SecretResolutionError';
    this.resolution_failure = resolutionReasons.has(reason) ? reason : 'unknown';
  }
}
export function secretResolutionFailure(error) {
  return (error instanceof SecretResolutionError || error instanceof SecretProviderError)
    && resolutionReasons.has(error.resolution_failure) ? error.resolution_failure : 'unknown';
}

export class SecretProviderError extends Error {
  constructor(code) {
    super("secret provider operation denied");
    this.name = "SecretProviderError";
    this.code = code;
  }
}

class SecretReference {
  constructor({provider_id, locator, purpose}) {
    const providerId = checkedText(provider_id, PROVIDER_ID, "reference-invalid");
    const exactLocator = checkedLocator(locator);
    const exactPurpose = checkedText(purpose, PURPOSE, "reference-invalid");
    const referenceDigest = sha256(stable({
      domain: "are.secret-reference/v1",
      locator: exactLocator,
      provider_id: providerId,
      purpose: exactPurpose
    }));
    referenceState.set(this, Object.freeze({provider_id: providerId, locator: exactLocator, purpose: exactPurpose, reference_digest: referenceDigest}));
    Object.freeze(this);
  }

  toJSON() {
    return projectSecretReference(this);
  }

  toString() {
    const projection = projectSecretReference(this);
    return `SecretReference(redacted, provider_id=${projection.provider_id}, reference_digest=${projection.reference_digest})`;
  }
}

export function createSecretReference({provider_id, locator, purpose = "model-provider"}) {
  return new SecretReference({provider_id, locator, purpose});
}

export function projectSecretReference(reference) {
  const state = stateFor(reference);
  return Object.freeze({
    schema_version: "are.secret-reference/v1",
    provider_id: state.provider_id,
    reference_digest: state.reference_digest,
    status: "reference-only",
    authority_effect: "none"
  });
}

export function createEnvironmentSecretProvider({provider_id = "environment", env = process.env} = {}) {
  const providerId = checkedText(provider_id, PROVIDER_ID, "provider-invalid");
  if (!env || typeof env !== "object" || Array.isArray(env)) deny("provider-invalid");
  return Object.freeze({
    provider_id: providerId,
    provider_kind: "environment",
    async resolve({locator}) {
      if (!ENV_LOCATOR.test(locator)) deny("resolution-denied");
      const value = env[locator];
      if (typeof value !== "string" || value.length === 0) deny("resolution-denied");
      return Buffer.from(value, "utf8");
    }
  });
}

export function createInjectedSecretProvider({provider_id, resolve}) {
  const providerId = checkedText(provider_id, PROVIDER_ID, "provider-invalid");
  if (typeof resolve !== "function") deny("provider-invalid");
  return Object.freeze({provider_id: providerId, provider_kind: "injected", resolve});
}

export function createSecretProviderRegistry({providers}) {
  if (!Array.isArray(providers) || providers.length === 0) deny("registry-invalid");
  const providerById = new Map();
  for (const provider of providers) {
    const providerId = checkedText(provider?.provider_id, PROVIDER_ID, "provider-invalid");
    if (typeof provider.resolve !== "function" || providerById.has(providerId)) deny("provider-invalid");
    providerById.set(providerId, provider);
  }

  return Object.freeze({
    provider_ids: Object.freeze([...providerById.keys()].sort()),
    async consume({secret_ref, consumer_id, request_digest, consumer}) {
      const reference = stateFor(secret_ref);
      const consumerId = checkedText(consumer_id, PROVIDER_ID, "consumption-denied");
      if (typeof request_digest !== "string" || !SHA256.test(request_digest) || typeof consumer !== "function") deny("consumption-denied");
      const provider = providerById.get(reference.provider_id);
      if (!provider) deny("provider-unavailable");

      let material;
      try {
        material = await provider.resolve(Object.freeze({
          locator: reference.locator,
          purpose: reference.purpose,
          reference_digest: reference.reference_digest,
          request_digest,
          consumer_id: consumerId
        }));
      } catch (error) {
        const denied = new SecretProviderError("resolution-denied");
        denied.resolution_failure = secretResolutionFailure(error);
        throw denied;
      }

      let owned;
      try {
        owned = ownedBytes(material);
      } catch {
        deny("resolution-denied");
      }
      let callbackResult;
      let callbackFailed = false;
      try {
        callbackResult = await consumer(owned.subarray());
      } catch {
        callbackFailed = true;
      } finally {
        owned.fill(0);
      }
      if (callbackFailed || callbackResult !== undefined) deny("consumer-denied");

      return Object.freeze({
        schema_version: "are.secret-consumption-receipt/v1",
        status: "consumed",
        provider_id: reference.provider_id,
        reference_digest: reference.reference_digest,
        consumer_digest: sha256(stable({domain: "are.secret-consumer/v1", consumer_id: consumerId})),
        request_digest,
        authority_effect: "none"
      });
    }
  });
}
