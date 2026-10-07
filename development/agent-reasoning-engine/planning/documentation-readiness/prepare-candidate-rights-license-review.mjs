#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildSourceRightsInventory,
  buildSourceRightsReceipt,
  validateFrozenInventory
} from "../../../../implementation/agent-reasoning-engine/docs/generate-source-rights-inventory.mjs";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptRoot, "../../../..");
const productRoot = resolve(repositoryRoot, "implementation/agent-reasoning-engine");
const docsRoot = resolve(productRoot, "docs");

const paths = Object.freeze({
  candidate: resolve(productRoot, "evidence/product-candidate.020.json"),
  ownerDecisions: resolve(docsRoot, "release-owner-decisions.json"),
  historicalRequirements: resolve(docsRoot, "license-requirements.json"),
  licenseDraft: resolve(repositoryRoot, "keld-project/docs/ARE-LICENSE-CANDIDATE.md"),
  inventory: resolve(docsRoot, "source-rights-inventory.candidate-020.json"),
  inventoryReceipt: resolve(docsRoot, "source-rights-inventory-receipt.candidate-020.json"),
  review: resolve(docsRoot, "source-rights-review.candidate-020.json"),
  requirements: resolve(docsRoot, "license-requirements.candidate-020.json"),
  requirementsReceipt: resolve(docsRoot, "license-requirements-receipt.candidate-020.json"),
  reviewerAssignment: resolve(docsRoot, "releases/0.10.0-rc.1-rights-license-review-assignment.json"),
  handoff: resolve(docsRoot, "releases/0.10.0-rc.1-rights-license-review-handoff.md")
});

const refs = Object.freeze({
  inventory: "implementation/agent-reasoning-engine/docs/source-rights-inventory.candidate-020.json",
  inventoryReceipt: "implementation/agent-reasoning-engine/docs/source-rights-inventory-receipt.candidate-020.json",
  review: "implementation/agent-reasoning-engine/docs/source-rights-review.candidate-020.json",
  requirements: "implementation/agent-reasoning-engine/docs/license-requirements.candidate-020.json",
  requirementsReceipt: "implementation/agent-reasoning-engine/docs/license-requirements-receipt.candidate-020.json",
  reviewerAssignment: "implementation/agent-reasoning-engine/docs/releases/0.10.0-rc.1-rights-license-review-assignment.json",
  licenseDraft: "keld-project/docs/ARE-LICENSE-CANDIDATE.md"
});

const sha256 = value => createHash("sha256").update(value).digest("hex");
const stableJson = value => `${JSON.stringify(value, null, 2)}\n`;
const need = (condition, code) => { if (!condition) throw new Error(code); };
const repositoryPath = path => resolve(repositoryRoot, path.replace(/^cyberAlchemy-v2\//u, ""));

function closureInventory(candidate) {
  const closurePaths = candidate.source_closure.files.map(file => file.path);
  const packagePaths = closurePaths.filter(path => path.endsWith("/package.json"));
  let declaredLicenses = 0;
  let dependencyEdges = 0;
  for (const path of packagePaths) {
    const manifest = JSON.parse(readFileSync(repositoryPath(path), "utf8"));
    if (typeof manifest.license === "string" && manifest.license.length > 0) declaredLicenses += 1;
    for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
      dependencyEdges += Object.keys(manifest[field] ?? {}).length;
    }
  }
  return {
    package_manifest_count: packagePaths.length,
    package_manifests_with_declared_license: declaredLicenses,
    declared_npm_dependency_edges: dependencyEdges,
    license_or_notice_file_count: closurePaths.filter(path => /(?:^|\/)(?:LICENSE|LICENCE|NOTICE)(?:\.|$)/iu.test(path)).length,
    cargo_manifest_or_lock_count: closurePaths.filter(path => /(?:^|\/)Cargo\.(?:toml|lock)$/u.test(path)).length
  };
}

function buildReview(inventory, inventoryBytes) {
  return {
    schema_version: "are.source-rights-review/v1",
    review_id: "ARE-SOURCE-RIGHTS-REVIEW-020",
    status: "ENGINEERING_REVIEW_COMPLETE_QUALIFIED_CLEARANCE_PENDING",
    reviewed_on: "2026-09-25",
    inventory_binding: {
      inventory_id: inventory.inventory_id,
      inventory_sha256: sha256(inventoryBytes),
      candidate_id: inventory.applies_to.candidate_id,
      source_closure_digest: inventory.applies_to.source_closure_digest
    },
    review_scope: {
      source_families: inventory.summary.source_family_count,
      files: inventory.summary.file_count,
      owner_assertion_files: inventory.summary.owner_assertion_file_count,
      embedded_spdx_marker_files: inventory.summary.spdx_marker_file_count,
      embedded_copyright_marker_files: inventory.summary.copyright_marker_file_count,
      notice_candidates: inventory.summary.notice_candidate_file_count
    },
    family_disposition: {
      applies_to_all_inventory_families: true,
      copyright_owner_assertion: inventory.owner_assertion.copyright_owner,
      engineering_disposition: "OWNER_ASSERTION_RECORDED_NO_CONTRADICTORY_EMBEDDED_MARKER_DETECTED",
      clearance_disposition: "QUALIFIED_PROVENANCE_AND_LICENSE_REVIEW_REQUIRED",
      non_inference: "Marker absence and an owner assertion do not establish originality, ownership, or permission to distribute."
    },
    notice_candidate_dispositions: [
      {
        path: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/coding-agent-runtime/IMPLEMENTATION-DAG.md",
        line: 159,
        signal: "third-party",
        disposition: "POLICY_INSTRUCTION_NOT_EMBEDDED_LICENSE_OR_VENDORED_SOURCE_NOTICE",
        evidence: "The line instructs future contributors to record vendored source in a third-party provenance manifest; it does not identify present third-party code."
      }
    ],
    conclusion: "The deterministic Candidate 020 engineering review found no embedded SPDX, copyright, or license notice that contradicts the recorded owner assertion. It found no marker evidence of vendored third-party source. Qualified provenance and exact-license review remain release gates.",
    open_questions: [
      `Can qualified review substantiate provenance and distribution rights for all ${inventory.summary.source_family_count} source families?`,
      "Does any source derive from external material without an embedded marker?"
    ],
    claim_limit: "This is an engineering disposition of the exact technical inventory. It is not an ownership certification, originality opinion, legal clearance, or permission to distribute.",
    authority_effect: "none"
  };
}

function buildReviewerAssignment(candidate, inventory, inventoryBytes, reviewBytes) {
  return {
    schema_version: "are.rights-license-review-assignment/v1",
    assignment_id: "ARE-RIGHTS-LICENSE-REVIEW-ASSIGNMENT-020",
    status: "INTERNAL_ENGINEERING_REVIEW_ACCEPTED_LEGAL_REVIEWER_UNASSIGNED",
    designated_on: "2026-09-25",
    gate_ref: "DG-PR-09",
    applies_to: {
      candidate_id: candidate.candidate_id,
      candidate_digest: candidate.candidate_digest,
      source_closure_digest: candidate.source_closure.closure_digest
    },
    capacity_decision: {
      gate_ref: "DG-PR-11",
      selected_option: "A",
      product_and_source_rights_reviewers: ["Vladimir Rondelli", "Dave"],
      qualified_legal_reviewer: null,
      legal_review_status: "UNASSIGNED_BLOCKING"
    },
    independence_decision: {
      gate_ref: "DG-PR-14",
      selected_option: "A",
      review_posture: "INTERNAL_ENGINEERING_REVIEW_ONLY",
      independent_review_claimed: false,
      substitutes_for_qualified_legal_review: false
    },
    internal_engineering_review_status: "ACCEPTED_BY_BOTH_DESIGNATED_REVIEWERS",
    legal_review_path: {
      gate_ref: "DG-PR-17",
      selected_option: "A",
      disposition: "DEFERRED_BLOCKING",
      non_legal_readiness_work_may_continue: true,
      legal_gate_bypass_allowed: false
    },
    reviewers: [
      {
        supplied_identity: "me",
        recorded_identity: "Vladimir Rondelli",
        identity_status: "RESOLVED_FROM_PRODUCT_OWNER_RECORD",
        roles: ["product reviewer", "source-rights reviewer"],
        qualification_basis: {
          gate_ref: "DG-PR-12",
          selected_option: "A",
          capacity: "PRODUCT_OWNER_AND_DIRECT_MAINTAINER",
          basis: "Product owner and direct maintainer with authorship and provenance knowledge.",
          legal_qualification_asserted: false
        },
        conflict_and_independence_disclosure: {
          posture: "NOT_INDEPENDENT_PRODUCT_OWNER",
          disclosure: "Vladimir Rondelli is the product owner and direct maintainer of the reviewed source."
        },
        review_status: "ACCEPTED_INTERNAL_ENGINEERING_DISPOSITION",
        review_disposition: {
          gate_ref: "DG-PR-15",
          selected_option: "A",
          decided_on: "2026-09-25",
          inventory_id: inventory.inventory_id,
          inventory_sha256: sha256(inventoryBytes),
          engineering_review_sha256: sha256(reviewBytes),
          source_family_count: inventory.summary.source_family_count,
          source_family_coverage: "ALL_INVENTORIED_FAMILIES",
          owner_assertion_disposition: "ACCEPTED_FOR_INTERNAL_ENGINEERING_REVIEW",
          notice_candidate_count: inventory.summary.notice_candidate_file_count,
          notice_disposition: "ACCEPTED_AS_POLICY_INSTRUCTION_NOT_EMBEDDED_LICENSE_OR_VENDORED_SOURCE_NOTICE",
          result: "ACCEPTED",
          claim_limit: "This internal engineering disposition is based on product-owner authorship and provenance knowledge. It is not ownership certification, independent review, legal clearance, license approval, or release permission."
        }
      },
      {
        supplied_identity: "Dave",
        recorded_identity: "Dave",
        identity_status: "DISPLAY_NAME_ONLY_BY_OWNER_DECISION",
        identity_decision: {
          gate_ref: "DG-PR-10",
          selected_option: "B",
          disposition: "RETAIN_DISPLAY_NAME_AND_KEEP_REVIEW_RECORD_INCOMPLETE"
        },
        roles: ["product reviewer", "source-rights reviewer"],
        qualification_basis: {
          gate_ref: "DG-PR-13",
          selected_option: "A",
          capacity: "TRUSTED_TECHNICAL_REVIEWER",
          basis: "Trusted technical reviewer familiar with ARE's code and development history.",
          legal_qualification_asserted: false
        },
        conflict_and_independence_disclosure: {
          posture: "INDEPENDENCE_NOT_ESTABLISHED",
          disclosure: "Dave is a trusted technical reviewer familiar with ARE's code and development history; no independent-review claim is made."
        },
        review_status: "ACCEPTED_INTERNAL_ENGINEERING_DISPOSITION",
        review_disposition: {
          gate_ref: "DG-PR-16",
          selected_option: "A",
          decided_on: "2026-09-25",
          attestation_source: "USER_RELAYED_DAVE_CONFIRMATION",
          direct_signed_attestation: false,
          inventory_id: inventory.inventory_id,
          inventory_sha256: sha256(inventoryBytes),
          engineering_review_sha256: sha256(reviewBytes),
          source_family_count: inventory.summary.source_family_count,
          source_family_coverage: "ALL_INVENTORIED_FAMILIES",
          owner_assertion_disposition: "ACCEPTED_FOR_INTERNAL_ENGINEERING_REVIEW",
          notice_candidate_count: inventory.summary.notice_candidate_file_count,
          notice_disposition: "ACCEPTED_AS_POLICY_INSTRUCTION_NOT_EMBEDDED_LICENSE_OR_VENDORED_SOURCE_NOTICE",
          result: "ACCEPTED",
          claim_limit: "This user-relayed internal engineering disposition is not a direct signed attestation, ownership certification, independent review, legal clearance, license approval, or release permission."
        }
      }
    ],
    completion_requirements: [
      "replace Dave's display-name-only limitation before completing the durable review record",
      "assign a qualified legal reviewer separately",
      "record qualified approval of exact legal-text digests and jurisdictional limitations"
    ],
    completion_status: "NOT_COMPLETE",
    claim_limit: "This record designates product and source-rights reviewers only. It does not verify qualifications, prove independence, designate legal counsel, complete review, provide legal advice, clear rights, approve a license, or authorize release.",
    authority_effect: "none"
  };
}

function buildRequirements(candidate, inventory, inventoryBytes, inventoryReceiptBytes, reviewBytes, assignmentBytes) {
  const historical = JSON.parse(readFileSync(paths.historicalRequirements, "utf8"));
  const requirements = structuredClone(historical);
  const currentInventory = closureInventory(candidate);
  requirements.requirements_id = "ARE-COMMERCIAL-LICENSE-REQUIREMENTS-020";
  requirements.applies_to = {
    candidate_id: candidate.candidate_id,
    candidate_digest: candidate.candidate_digest,
    source_closure_digest: candidate.source_closure.closure_digest,
    source_file_count: candidate.source_closure.files.length
  };
  requirements.current_closure_inventory = {
    ...currentInventory,
    interpretation: "Candidate 020 carries no LICENSE or NOTICE file in its exact closure. Package metadata and declared dependency edges are inventory signals only; they do not prove ownership or eliminate copied-source and non-package obligations."
  };
  requirements.historical_notice_audit.reason = "The audit covers an older 3,000-plus-file private archive with bundled TypeScript and cannot clear Candidate 020.";
  requirements.activation_rule = "No payment acceptance or customer delivery until Candidate 020 source-family provenance, every notice candidate, the exact governing license and customer-facing terms receive qualified review and product approval is separately granted.";
  requirements.current_source_rights_inventory = {
    path: refs.inventory,
    sha256: sha256(inventoryBytes),
    receipt_path: refs.inventoryReceipt,
    status: inventory.status,
    receipt_sha256: sha256(inventoryReceiptBytes)
  };
  requirements.engineering_source_rights_review = {
    path: refs.review,
    sha256: sha256(reviewBytes),
    status: "ENGINEERING_REVIEW_COMPLETE_QUALIFIED_CLEARANCE_PENDING"
  };
  requirements.review_assignment = {
    path: refs.reviewerAssignment,
    sha256: sha256(assignmentBytes),
    status: "INTERNAL_ENGINEERING_REVIEW_ACCEPTED_LEGAL_REVIEWER_UNASSIGNED",
    product_and_source_rights_reviewers: ["Vladimir Rondelli", "Dave"],
    qualified_legal_reviewer: null
  };
  requirements.exact_license_candidate = {
    path: refs.licenseDraft,
    sha256: sha256(readFileSync(paths.licenseDraft)),
    status: "PRIVATE_DRAFT_NOT_GOVERNING_LICENSE",
    unresolved_decisions: [
      "purchase verification and account recovery",
      "source availability duration",
      "downstream grants, patent terms, termination/cure, warranty, liability, governing law, and bundled-work treatment",
      "final release reconciliation against the exact customer bundle"
    ]
  };
  requirements.claim_limit = "This specification reconciles recorded commercial intent, Candidate 020 closure facts, the engineering rights review, and the non-governing license draft. It is not legal text, ownership certification, distribution clearance, sale approval, or a license grant.";
  return requirements;
}

function buildRequirementsReceipt(candidate, requirementsBytes, requirements) {
  return {
    schema_version: "are.commercial-license-requirements-receipt/v2",
    requirements_id: requirements.requirements_id,
    status: "PASS",
    requirements_sha256: sha256(requirementsBytes),
    candidate_id: candidate.candidate_id,
    candidate_digest: candidate.candidate_digest,
    source_closure_digest: candidate.source_closure.closure_digest,
    current_closure_inventory: closureInventory(candidate),
    resolved_owner_decision_count: requirements.resolved_owner_decisions.length,
    remaining_qualified_review_count: requirements.remaining_qualified_review_requirements.length,
    license_candidate_status: requirements.exact_license_candidate.status,
    activation_status: "BLOCKED_PENDING_QUALIFIED_PROVENANCE_AND_EXACT_LEGAL_REVIEW",
    claim_limit: "PASS verifies evidence bindings, resolved intent, and Candidate 020 closure inventory. It is not legal text, rights clearance, sale approval, or a license grant.",
    authority_effect: "none"
  };
}

function buildHandoff(candidate, inventory, inventoryBytes, inventoryReceiptBytes, reviewBytes, assignmentBytes, requirementsBytes, requirementsReceiptBytes, requirements) {
  const inventoryFacts = requirements.current_closure_inventory;
  return `# Candidate 020 rights and license review handoff

**Status:** ENGINEERING PACKAGE COMPLETE — QUALIFIED REVIEW REQUIRED

**Prepared:** 2026-09-25

**Applies to:** \`${candidate.candidate_id}\`, digest \`${candidate.candidate_digest}\`, exact ${inventory.summary.file_count}-file closure \`${candidate.source_closure.closure_digest}\`.

**Claim ceiling:** This package organizes technical evidence and unresolved questions. It is not legal advice, an ownership certification, rights clearance, sale approval, or a license grant.

## Engineering result

- The exact closure contains ${inventory.summary.file_count} files (${inventory.summary.total_bytes.toLocaleString("en-US")} bytes) in ${inventory.summary.source_family_count} source families.
- ${inventory.summary.text_file_count} files decode as UTF-8 text and ${inventory.summary.binary_file_count} do not.
- The scan found ${inventory.summary.spdx_marker_file_count} embedded SPDX marker files, ${inventory.summary.copyright_marker_file_count} embedded copyright marker files, and ${inventory.summary.notice_candidate_file_count} notice candidate.
- The sole notice candidate is \`packages/coding-agent-runtime/IMPLEMENTATION-DAG.md\`. Its “third-party” text is a future-contributor policy instruction, not an identified embedded license or vendored-source notice.
- The closure contains ${inventoryFacts.package_manifest_count} package manifests, ${inventoryFacts.package_manifests_with_declared_license} declared package-license fields, ${inventoryFacts.declared_npm_dependency_edges} declared npm dependency edges, ${inventoryFacts.license_or_notice_file_count} LICENSE/LICENCE/NOTICE files, and ${inventoryFacts.cargo_manifest_or_lock_count} Cargo manifests or lockfiles.
- Absence of markers, declared dependencies, or notice files does not establish originality, ownership, or permission to distribute.

## Exact evidence

| Artifact | SHA-256 | Purpose |
| --- | --- | --- |
| \`${refs.inventory}\` | \`${sha256(inventoryBytes)}\` | File-level closure, family, role, marker, and owner-assertion inventory |
| \`${refs.inventoryReceipt}\` | \`${sha256(inventoryReceiptBytes)}\` | Deterministic inventory receipt |
| \`${refs.review}\` | \`${sha256(reviewBytes)}\` | Engineering marker and notice disposition |
| \`${refs.reviewerAssignment}\` | \`${sha256(assignmentBytes)}\` | Reviewer designation and incomplete-input record |
| \`${refs.requirements}\` | \`${sha256(requirementsBytes)}\` | Candidate-specific commercial intent and exact-license reconciliation |
| \`${refs.requirementsReceipt}\` | \`${sha256(requirementsReceiptBytes)}\` | Requirements and evidence-binding receipt |
| \`${refs.licenseDraft}\` | \`${requirements.exact_license_candidate.sha256}\` | Private clause draft; not a governing license |

Candidate 018 artifacts remain historical evidence and were not repurposed as Candidate 020 clearance.

## Designated reviewers

- Vladimir Rondelli: product and source-rights reviewer. His recorded basis is product owner and direct maintainer with authorship and provenance knowledge. He is not independent because he owns and maintains the product. No legal qualification is asserted.
- Dave: product and source-rights reviewer. DG-PR-10 option B retains this display name only. His recorded basis is trusted technical reviewer familiar with ARE's code and development history. His independence is not established. No legal qualification is asserted.
- Qualified legal reviewer: unassigned and blocking for exact-license and jurisdictional approval.

These are internal engineering reviews, not independent clearance. Designation does not complete the review or qualify either reviewer to make the separately blocked legal and jurisdictional decisions.

Vladimir accepted the internal engineering disposition at DG-PR-15. Dave accepted the same disposition at DG-PR-16 through a user-relayed confirmation. Both decisions cover all ${inventory.summary.source_family_count} inventoried source families and the sole notice candidate. Dave's confirmation is not a direct signed attestation.

DG-PR-17 option A defers qualified legal review and keeps it blocking. Non-legal readiness checks may continue, but they cannot bypass exact-license or jurisdictional approval.

## Qualified reviewer decisions required

1. Substantiate provenance and distribution rights for all ${inventory.summary.source_family_count} source families, including any derivation not exposed by embedded markers.
2. Confirm whether the notice-candidate disposition is complete and whether any attribution or third-party notice must ship.
3. Revise and approve the exact governing license. Cover purchase verification, source-offer duration, downstream grants, patents, termination, warranty, liability, governing law, and bundled works.
4. Review United States, European Union member-state, and Brazil obligations for the selected commercial offer and customer-facing terms.
5. Bind approved LICENSE, notices, customer summary, and commercial terms to the exact customer archive before separate product approval.

## Reviewer record to return

The reviewer should return their identity, qualification basis, review date, and each evidence digest reviewed. The record must disposition every source family and notice candidate. It must also state exact approved legal-text digests, jurisdictional limits, conditions, remediation, and an approved/rejected/deferred result. A partial or conditional result must remain blocking.

## Open Questions

- Will a later decision replace Dave's display-name-only limitation before the review record can complete?
- Who will perform the separately required qualified legal and jurisdictional review?
- What evidence substantiates provenance for each source family beyond the product-owner assertion?
- Are there external derivations without embedded markers?
- What exact license and notice text will govern Candidate 020 if it is later approved for release?
- Which jurisdiction-specific conditions must be satisfied before payment acceptance or delivery?
`;
}

function validateReview(review, inventory, inventoryBytes) {
  need(review.inventory_binding.inventory_sha256 === sha256(inventoryBytes), "candidate-020-rights.review-inventory-drift");
  need(review.review_scope.files === inventory.summary.file_count, "candidate-020-rights.review-file-count-drift");
  need(review.review_scope.source_families === inventory.summary.source_family_count, "candidate-020-rights.review-family-count-drift");
  need(review.notice_candidate_dispositions.length === inventory.notice_candidates.length, "candidate-020-rights.notice-coverage-drift");
  for (const disposition of review.notice_candidate_dispositions) {
    const notice = inventory.notice_candidates.find(item => item.path === disposition.path);
    need(notice?.license_text_signals.includes(disposition.signal), `candidate-020-rights.notice-signal-drift:${disposition.path}`);
    const line = readFileSync(repositoryPath(disposition.path), "utf8").split(/\r?\n/u)[disposition.line - 1] ?? "";
    need(line.toLowerCase().includes(disposition.signal), `candidate-020-rights.notice-line-drift:${disposition.path}`);
  }
}

function validateRequirements(candidate, requirements, bindings) {
  need(requirements.schema_version === "are.commercial-license-requirements/v2", "candidate-020-license.schema-version-invalid");
  need(requirements.status === "REQUIREMENTS_CANDIDATE", "candidate-020-license.status-invalid");
  need(requirements.authority_effect === "none", "candidate-020-license.authority-effect-invalid");
  need(requirements.applies_to.candidate_id === candidate.candidate_id, "candidate-020-license.candidate-id-drift");
  need(requirements.applies_to.candidate_digest === candidate.candidate_digest, "candidate-020-license.candidate-digest-drift");
  need(requirements.applies_to.source_closure_digest === candidate.source_closure.closure_digest, "candidate-020-license.closure-digest-drift");
  need(requirements.applies_to.source_file_count === candidate.source_closure.files.length, "candidate-020-license.file-count-drift");
  for (const source of [requirements.owner_decision_source, requirements.owner_decision_record, requirements.historical_notice_audit]) {
    need(source.sha256 === sha256(readFileSync(resolve(repositoryRoot, source.path))), `candidate-020-license.source-drift:${source.path}`);
  }
  need(requirements.current_source_rights_inventory.sha256 === sha256(bindings.inventoryBytes), "candidate-020-license.inventory-drift");
  need(requirements.current_source_rights_inventory.receipt_sha256 === sha256(bindings.inventoryReceiptBytes), "candidate-020-license.inventory-receipt-drift");
  need(requirements.engineering_source_rights_review.sha256 === sha256(bindings.reviewBytes), "candidate-020-license.review-drift");
  need(requirements.review_assignment.sha256 === sha256(bindings.assignmentBytes), "candidate-020-license.assignment-drift");
  need(requirements.review_assignment.status === "INTERNAL_ENGINEERING_REVIEW_ACCEPTED_LEGAL_REVIEWER_UNASSIGNED", "candidate-020-license.assignment-status-invalid");
  need(requirements.review_assignment.qualified_legal_reviewer === null, "candidate-020-license.legal-reviewer-unassigned-posture-invalid");
  need(requirements.exact_license_candidate.sha256 === sha256(readFileSync(paths.licenseDraft)), "candidate-020-license.draft-drift");
  need(requirements.exact_license_candidate.status === "PRIVATE_DRAFT_NOT_GOVERNING_LICENSE", "candidate-020-license.draft-status-invalid");
  need(requirements.remaining_qualified_review_requirements.length > 0, "candidate-020-license.qualified-review-missing");
  need(requirements.activation_rule.includes("No payment acceptance or customer delivery"), "candidate-020-license.activation-block-missing");
}

function buildArtifacts() {
  const candidate = JSON.parse(readFileSync(paths.candidate, "utf8"));
  const ownerDecisions = JSON.parse(readFileSync(paths.ownerDecisions, "utf8"));
  const inventory = buildSourceRightsInventory(candidate, ownerDecisions, {
    inventoryId: "ARE-SOURCE-RIGHTS-INVENTORY-020",
    sourceLabel: "exact Candidate 020 source closure",
    nextGate: "A qualified reviewer must verify provenance for every source family and disposition every notice candidate before final license clearance.",
    readFile: path => readFileSync(repositoryPath(path))
  });
  const inventoryBytes = stableJson(inventory);
  const inventoryReceipt = buildSourceRightsReceipt(inventoryBytes, inventory);
  const inventoryReceiptBytes = stableJson(inventoryReceipt);
  validateFrozenInventory(inventory, candidate, inventoryReceipt, inventoryBytes);
  const review = buildReview(inventory, inventoryBytes);
  const reviewBytes = stableJson(review);
  validateReview(review, inventory, inventoryBytes);
  const assignment = buildReviewerAssignment(candidate, inventory, inventoryBytes, reviewBytes);
  const assignmentBytes = stableJson(assignment);
  const requirements = buildRequirements(candidate, inventory, inventoryBytes, inventoryReceiptBytes, reviewBytes, assignmentBytes);
  validateRequirements(candidate, requirements, {inventoryBytes, inventoryReceiptBytes, reviewBytes, assignmentBytes});
  const requirementsBytes = stableJson(requirements);
  const requirementsReceipt = buildRequirementsReceipt(candidate, requirementsBytes, requirements);
  const requirementsReceiptBytes = stableJson(requirementsReceipt);
  const handoff = buildHandoff(candidate, inventory, inventoryBytes, inventoryReceiptBytes, reviewBytes, assignmentBytes, requirementsBytes, requirementsReceiptBytes, requirements);
  return {candidate, inventory, inventoryReceipt, requirements, files: new Map([
    [paths.inventory, inventoryBytes],
    [paths.inventoryReceipt, inventoryReceiptBytes],
    [paths.review, reviewBytes],
    [paths.reviewerAssignment, assignmentBytes],
    [paths.requirements, requirementsBytes],
    [paths.requirementsReceipt, requirementsReceiptBytes],
    [paths.handoff, handoff]
  ])};
}

function main() {
  const [mode = "--check"] = process.argv.slice(2);
  need(["--check", "--write"].includes(mode), "usage:prepare-candidate-rights-license-review [--check|--write]");
  const artifacts = buildArtifacts();
  for (const [path, expected] of artifacts.files) {
    if (mode === "--write") writeFileSync(path, expected);
    else {
      need(existsSync(path), `candidate-020-rights.artifact-missing:${path}`);
      need(readFileSync(path, "utf8") === expected, `candidate-020-rights.artifact-drift:${path}`);
    }
  }
  process.stdout.write(stableJson({
    schema_version: "are.candidate-rights-license-preparation-receipt/v1",
    status: "PASS",
    mode,
    candidate_id: artifacts.candidate.candidate_id,
    source_closure_digest: artifacts.candidate.source_closure.closure_digest,
    file_count: artifacts.inventory.summary.file_count,
    source_family_count: artifacts.inventory.summary.source_family_count,
    notice_candidate_count: artifacts.inventory.summary.notice_candidate_file_count,
    license_candidate_status: artifacts.requirements.exact_license_candidate.status,
    qualified_review_status: "REQUIRED",
    authority_effect: "none"
  }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
