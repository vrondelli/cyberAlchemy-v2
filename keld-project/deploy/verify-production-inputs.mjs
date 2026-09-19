import {pathToFileURL} from 'node:url';

const IMAGE_FIELDS = [
  'ARE_EDGE_IMAGE',
  'ARE_PUBLIC_CHAT_IMAGE',
  'ARE_INFERENCE_BROKER_IMAGE',
  'ARE_PROVIDER_GATEWAY_IMAGE',
];

const INTEGER_FIELDS = new Map([
  ['ARE_CHAT_IDLE_RETENTION_SECONDS', BigInt(Math.floor(Number.MAX_SAFE_INTEGER / 1000))],
  ['ARE_BROKER_HOURLY_MICROUSD_LIMIT', 1_000_000_000_000n],
  ['ARE_BROKER_MONTHLY_MICROUSD_LIMIT', 1_000_000_000_000n],
  ['ARE_PROVIDER_INPUT_MICROUSD_PER_MILLION_TOKENS', 1_000_000_000n],
  ['ARE_PROVIDER_OUTPUT_MICROUSD_PER_MILLION_TOKENS', 1_000_000_000n],
]);

// Docker/OCI's repository grammar is lowercase. A tag may contain uppercase
// characters, but the digest is always an exact lowercase sha256 value here.
const REGISTRY = String.raw`(?:[a-z0-9]+(?:[.-][a-z0-9]+)*(?::[1-9][0-9]{0,4})\/)?`;
const COMPONENT = String.raw`[a-z0-9]+(?:(?:[._-]|__)[a-z0-9]+)*`;
const TAG = String.raw`(?:\:[A-Za-z0-9_][A-Za-z0-9_.-]{0,127})?`;
const IMAGE_REFERENCE = new RegExp(`^${REGISTRY}${COMPONENT}(?:\\/${COMPONENT})*${TAG}@sha256:([a-f0-9]{64})$`);

function imageDigest(environment, name) {
  const value = environment[name];
  if (typeof value !== 'string' || value.length > 512 || value.includes('://') || /[\s\\]/u.test(value)) {
    throw new Error(`production-input-${name.toLowerCase()}-digest-reference-required`);
  }
  const match = IMAGE_REFERENCE.exec(value);
  if (!match) throw new Error(`production-input-${name.toLowerCase()}-digest-reference-required`);
  return match[1];
}

function boundedPositiveInteger(environment, name, maximum) {
  const value = environment[name];
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/u.test(value)) {
    throw new Error(`production-input-${name.toLowerCase()}-positive-integer-required`);
  }
  if (value.length > maximum.toString().length || BigInt(value) > maximum) {
    throw new Error(`production-input-${name.toLowerCase()}-out-of-range`);
  }
}

export function verifyProductionInputs(environment = process.env) {
  const digests = IMAGE_FIELDS.map(name => imageDigest(environment, name));
  if (new Set(digests).size !== IMAGE_FIELDS.length) {
    throw new Error('production-input-distinct-role-image-digests-required');
  }
  for (const [name, maximum] of INTEGER_FIELDS) boundedPositiveInteger(environment, name, maximum);
  return {
    ok: true,
    image_references: 'digest-pinned',
    distinct_image_digests: IMAGE_FIELDS.length,
    numeric_inputs: 'valid-positive-integers',
    values_printed: false,
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    process.stdout.write(`${JSON.stringify(verifyProductionInputs())}\n`);
  } catch (error) {
    process.stderr.write(`${error?.message ?? 'production-input-verification-failed'}\n`);
    process.exitCode = 1;
  }
}
