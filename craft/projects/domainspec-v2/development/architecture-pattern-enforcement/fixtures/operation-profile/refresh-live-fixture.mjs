import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../../../../", import.meta.url));
const fixtureRef =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/poker-team.fixture.json";
const applicabilityRef =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/applicability.json";

const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const sha = (value) =>
  createHash("sha256").update(value).digest("hex");
const canonicalSha = (value) => sha(canonical(value));
const fileSha = (ref) => sha(readFileSync(resolve(repoRoot, ref)));

const fixture = JSON.parse(readFileSync(resolve(repoRoot, fixtureRef), "utf8"));
const applicability = JSON.parse(
  readFileSync(resolve(repoRoot, applicabilityRef), "utf8"),
);
const selectedCase = applicability.cases.find(
  (entry) => entry.case_id === "AOP-APP-001-poker-create-player",
);
if (!selectedCase) throw new Error("AOP_REFRESH_APPLICABILITY_MISSING");

for (const source of fixture.selected_sources) {
  source.sha256 = fileSha(source.path);
  source.size = statSync(resolve(repoRoot, source.path)).size;
}

const subject = fixture.selected_sources.find(
  (entry) => entry.source_id === "poker-create-player",
);
if (!subject) throw new Error("AOP_REFRESH_SUBJECT_MISSING");

const observation = fixture.integration_evidence.repository_observation;
observation.source_sha256 = subject.sha256;
const { observation_sha256: _oldObservationSha, ...observationBody } = observation;
observation.observation_sha256 = canonicalSha(observationBody);

const concernRecord = fixture.integration_evidence.persistence_candidate_record;
concernRecord.payload_sha256 = observation.observation_sha256;
const { record_sha256: _oldRecordSha, ...recordBody } = concernRecord;
concernRecord.record_sha256 = canonicalSha(recordBody);

const candidateJoin = {
  concern_kind: concernRecord.concern_kind,
  observation_id: observation.observation_id,
  observation_ref: observation.observation_ref,
  observation_sha256: observation.observation_sha256,
  record_id: concernRecord.record_id,
  record_ref: concernRecord.record_ref,
  record_sha256: concernRecord.record_sha256,
  external_status: concernRecord.status,
  external_ceiling: concernRecord.ceiling,
  interface_ref: concernRecord.interface_ref,
  evidence_lane: concernRecord.evidence_lane,
};

const applicabilityByProperty = new Map(
  selectedCase.applicability_results.map((entry) => [entry.property_id, entry]),
);
for (const [index, envelope] of fixture.evaluation_evidence.entries()) {
  const row = applicabilityByProperty.get(envelope.property_id);
  if (!row) throw new Error(`AOP_REFRESH_PROPERTY_MISSING:${envelope.property_id}`);
  const expectedValue = { profile_obligation: row.basis };
  const observedValue = {
    evidence_state: envelope.result === "pass" ? "observed" : envelope.result,
  };
  const rawEvidence = [{ ref: subject.path, sha256: subject.sha256 }];
  const joins = index === fixture.evaluation_evidence.length - 1
    ? [candidateJoin]
    : [];
  envelope.expected_value_sha256 = canonicalSha(expectedValue);
  envelope.observed_value_sha256 = canonicalSha(observedValue);
  envelope.raw_evidence_sha256 = canonicalSha(rawEvidence);
  envelope.joins_sha256 = canonicalSha(joins);
  envelope.producer_output_sha256 = canonicalSha({
    producer_id: envelope.producer_id,
    result: envelope.result,
    diagnostic: envelope.diagnostic,
    observed_value: observedValue,
  });
  const { envelope_sha256: _oldEnvelopeSha, ...envelopeBody } = envelope;
  envelope.envelope_sha256 = canonicalSha(envelopeBody);
}

writeFileSync(
  resolve(repoRoot, fixtureRef),
  `${JSON.stringify(fixture, null, 2)}\n`,
  "utf8",
);

process.stdout.write(
  `${JSON.stringify({
    fixture_sha256: fileSha(fixtureRef),
    applicability_sha256: fileSha(applicabilityRef),
    subject_sha256: subject.sha256,
  })}\n`,
);
