// Gateway credentials authorize local control and observation, not model work.
// Keep this list explicit so backend configuration cannot accidentally inherit
// a new gateway credential without a corresponding boundary review.
export const GATEWAY_PRIVATE_ENV_KEYS = Object.freeze([
  "ARE_GATEWAY_CONNECTION_TOKEN",
  "ARE_ADAPTER_OBSERVATION_TOKEN",
  "ARE_HOSTED_INPUT_ATTESTATION_KEY",
]);

export function gatewayPrivateEnvironmentKey(key) {
  return GATEWAY_PRIVATE_ENV_KEYS.includes(key);
}

export function backendEnvironment(source = process.env) {
  const projected = {...source};
  for (const key of GATEWAY_PRIVATE_ENV_KEYS) delete projected[key];
  return projected;
}
