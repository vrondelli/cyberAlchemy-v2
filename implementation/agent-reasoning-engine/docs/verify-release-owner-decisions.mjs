#!/usr/bin/env node
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const decisionsPath = resolve(docsRoot, "release-owner-decisions.json");
const receiptPath = resolve(docsRoot, "release-owner-decisions-receipt.json");
const candidatePath = resolve(productRoot, "evidence/product-candidate.018.json");
const sha256 = value => createHash("sha256").update(value).digest("hex");
const stableJson = value => `${JSON.stringify(value, null, 2)}\n`;

function need(condition, code) { if (!condition) throw new Error(code); }

export function validateReleaseOwnerDecisions(decisions, options = {}) {
  const candidate = options.candidate ?? JSON.parse(readFileSync(candidatePath, "utf8"));
  need(decisions?.schema_version === "are.release-owner-decisions/v1", "owner-decisions.schema-version-invalid");
  need(decisions.decision_id === "ARE-RELEASE-OWNER-DECISIONS-001", "owner-decisions.id-invalid");
  need(decisions.status === "OWNER_DECISIONS_RECORDED", "owner-decisions.status-invalid");
  need(decisions.authority_effect === "none", "owner-decisions.authority-effect-invalid");
  need(decisions.applies_to?.baseline_candidate_id === candidate.candidate_id, "owner-decisions.candidate-id-drift");
  need(decisions.applies_to?.first_customer_release === "0.10.0-rc.1", "owner-decisions.release-invalid");
  need(decisions.commercial_identity?.product_name === "Agent Reasoning Engine (ARE)", "owner-decisions.product-name-invalid");
  need(decisions.commercial_identity?.merchant_legal_name === "Keld", "owner-decisions.merchant-invalid");
  need(decisions.commercial_identity?.copyright_owner === "Vladimir Rondelli", "owner-decisions.copyright-owner-invalid");
  need(!/cyber\s*alchemy/iu.test(JSON.stringify(decisions.commercial_identity)), "owner-decisions.legacy-commercial-identity");
  need(JSON.stringify(decisions.merchant_and_markets?.initial_markets_normalized) === JSON.stringify(["United States", "European Union member states", "Brazil"]), "owner-decisions.markets-invalid");
  need(decisions.contacts?.security === "rondelli.vladimir@gmail.com", "owner-decisions.security-contact-invalid");
  need(decisions.contacts?.support === decisions.contacts.security, "owner-decisions.support-contact-invalid");
  for (const field of ["product_release", "artifact_deployment", "security_incident_response", "privacy_retention", "compliance_coordination"]) {
    need(decisions.accountable_owners?.[field] === "Vladimir Rondelli", `owner-decisions.owner-invalid:${field}`);
  }
  need(decisions.accountable_owners?.reliability_slo === null, "owner-decisions.slo-owner-should-be-null");
  need(decisions.accountable_owners?.qualified_legal_reviewer === null, "owner-decisions.qualified-review-not-completed");
  need(decisions.use_and_data_scope?.vendor_telemetry === "none in the first customer release", "owner-decisions.telemetry-posture-invalid");
  need(decisions.use_and_data_scope?.vendor_operated_processing === "none in the first customer release", "owner-decisions.processing-posture-invalid");
  need(Array.isArray(decisions.use_and_data_scope?.prohibited_initial_uses) && decisions.use_and_data_scope.prohibited_initial_uses.length === 8, "owner-decisions.prohibited-uses-incomplete");
  need(JSON.stringify(decisions.license_direction?.resale_threshold?.qualifies) === JSON.stringify(["added working function", "added working integration"]), "owner-decisions.resale-qualifiers-invalid");
  need(JSON.stringify(decisions.license_direction?.resale_threshold?.does_not_qualify) === JSON.stringify(["cosmetic edits", "renaming", "bug fixes alone"]), "owner-decisions.resale-non-qualifiers-invalid");
  need(JSON.stringify(decisions.license_direction?.resale_threshold?.outside_rule) === JSON.stringify(["hosted access", "paid support services"]), "owner-decisions.resale-outside-rule-invalid");
  need(decisions.license_direction?.open_source_claim === false, "owner-decisions.open-source-claim-invalid");
  need(Array.isArray(decisions.remaining_evidence_gates) && decisions.remaining_evidence_gates.length === 5, "owner-decisions.evidence-gates-incomplete");
  need(typeof decisions.claim_limit === "string" && decisions.claim_limit.length > 0, "owner-decisions.claim-limit-missing");
  return Object.freeze({market_count: decisions.merchant_and_markets.initial_markets_normalized.length, owner_count: 5, evidence_gate_count: decisions.remaining_evidence_gates.length});
}

function buildReceipt(bytes, result) {
  return {
    schema_version: "are.release-owner-decisions-receipt/v1",
    decision_id: "ARE-RELEASE-OWNER-DECISIONS-001",
    status: "PASS",
    decisions_sha256: sha256(bytes),
    candidate_id: "ARE-PRODUCT-CANDIDATE-018",
    first_customer_release: "0.10.0-rc.1",
    market_count: result.market_count,
    accountable_owner_assignment_count: result.owner_count,
    remaining_evidence_gate_count: result.evidence_gate_count,
    owner_decisions_status: "COMPLETE",
    activation_status: "BLOCKED_PENDING_EVIDENCE_AND_QUALIFIED_REVIEW",
    claim_limit: "PASS verifies the recorded owner choices. It does not prove legal sufficiency, source rights, contact operation, or release readiness.",
    authority_effect: "none"
  };
}

function main() {
  const [mode = "--check"] = process.argv.slice(2);
  need(["--check", "--write"].includes(mode), "usage:verify-release-owner-decisions [--check|--write]");
  const bytes = readFileSync(decisionsPath);
  const result = validateReleaseOwnerDecisions(JSON.parse(bytes));
  const receiptBytes = stableJson(buildReceipt(bytes, result));
  if (mode === "--write") writeFileSync(receiptPath, receiptBytes);
  else {
    need(existsSync(receiptPath), "owner-decisions.receipt-missing");
    need(readFileSync(receiptPath, "utf8") === receiptBytes, "owner-decisions.receipt-drift");
  }
  process.stdout.write(stableJson({...buildReceipt(bytes, result), mode}));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
