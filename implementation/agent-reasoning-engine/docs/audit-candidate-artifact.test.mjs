import test from "node:test";
import assert from "node:assert/strict";
import {auditCandidateArtifact} from "./audit-candidate-artifact.mjs";

test("Candidate 013 artifact preflight accounts for every frozen file deterministically", () => {
  const first = auditCandidateArtifact();
  assert.equal(first, auditCandidateArtifact());
  const result = JSON.parse(first);
  assert.equal(Object.values(result.classifications).reduce((sum, count) => sum + count, 0), 3410);
  assert.equal(result.status, "BLOCKED");
  assert(result.classifications.unresolved >= 428);
  assert.equal(Object.values(result.unresolved.by_scope).reduce((sum, count) => sum + count, 0), result.classifications.unresolved);
  assert(result.unresolved.by_scope["domainspec-compiler-dist"] >= 428);
  assert.equal(result.unresolved.by_scope["language-toolchain"], 6);
  assert.equal(result.closure_composition.domainspec_compiler_dist_files, 1436);
  assert.equal(result.closure_composition.domainspec_compiler_source_files, 0);
});
