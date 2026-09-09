import { mkdir, open } from "node:fs/promises";
import { dirname, join } from "node:path";

import { canonicalJson, sha256Bytes } from "./canonical-json.mjs";

const BODY_FILES = ["result.v1.json", "projection.v1.json", "digest-map.v1.json"];

async function writeExclusive(path, body) {
  const handle = await open(path, "wx", 0o600);
  try {
    await handle.writeFile(body, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function syncDirectory(path) {
  const handle = await open(path, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function writeRunBundle({
  outDir,
  result,
  projection,
  inputDigests,
  evaluatorDigests,
  isolationAttestation = null,
  runMetadata = {},
  receiptContext = {},
  failBeforeReceipt = false,
}) {
  await open(dirname(outDir), "r").then((handle) => handle.close());
  await mkdir(outDir, { recursive: false, mode: 0o700 });

  const resultBody = canonicalJson({
    schema_version: "candidate-result-v1",
    evaluation: result,
    isolation_attestation: isolationAttestation,
    authority_effect: "none",
  });
  const projectionBody = canonicalJson({
    schema_version: "candidate-projection-v1",
    projection,
    authority_effect: "none",
  });
  const bodyDigests = {
    "result.v1.json": sha256Bytes(resultBody),
    "projection.v1.json": sha256Bytes(projectionBody),
  };
  const digestMapBody = canonicalJson({
    schema_version: "candidate-digest-map-v1",
    input_digests: inputDigests,
    evaluator_digests: evaluatorDigests,
    output_digests: bodyDigests,
    authority_effect: "none",
  });

  await writeExclusive(join(outDir, "result.v1.json"), resultBody);
  await writeExclusive(join(outDir, "projection.v1.json"), projectionBody);
  await writeExclusive(join(outDir, "digest-map.v1.json"), digestMapBody);
  await syncDirectory(outDir);

  if (failBeforeReceipt) throw new Error("INJECTED_PRE_RECEIPT_FAILURE");

  const artifacts = [
    ...Object.entries(bodyDigests),
    ["digest-map.v1.json", sha256Bytes(digestMapBody)],
  ]
    .map(([path, sha256]) => ({ path, sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const receipt = {
    schema_version: "candidate-run-receipt-v1",
    task_id: receiptContext.task_id ?? null,
    swu_id: receiptContext.swu_id ?? null,
    result: "pass",
    state: "receipt-complete",
    artifact_inventory: [...BODY_FILES, "terminal-receipt.json"].sort(),
    artifacts,
    run_metadata: runMetadata,
    authority_effect: "none",
    evidence_ceiling:
      "finite private candidate-graph prototype evidence; no ontology admission or promotion",
  };
  const receiptBody = canonicalJson(receipt);
  await writeExclusive(join(outDir, "terminal-receipt.json"), receiptBody);
  await syncDirectory(outDir);
  return { out_dir: outDir, receipt, receipt_sha256: sha256Bytes(receiptBody) };
}
