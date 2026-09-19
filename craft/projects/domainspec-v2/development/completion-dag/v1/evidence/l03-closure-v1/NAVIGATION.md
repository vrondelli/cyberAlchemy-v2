# Current migration navigation

This successor guide corrects navigation only. The frozen import ledger remains
historical evidence; no canonical term or authority status changes here.

- Legacy derivation: `projects/domainspec-v2/impl/test-derivation-engine/src/index.ts#deriveFeature`.
  Checked migration: `l02-migration-v2/cli.ts derive FEATURE_DIR DIALECT` (relative to this evidence directory's parent).
- Normal document validation already reads `impl/spec/features`; the new changed-file
  entry point selects repository-relative `projects/domainspec-v2/impl/spec/features`.
  Its JSON preserves the normal validator's diagnostic text, including old wording.
- Relationship validation already consumes `projects/domainspec-v2/definitions/relationships/relationships.yml`.
  The old import-ledger retarget TODO is not a current implementation requirement.
- The old `impl/spec/DEFINITIONS.md` location is absent. The current
  `projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md` DS-D1 row points to
  `definitions/meta-types/meta-types.md` and `.yml`; DS-D2 points to
  `definitions/DEFINITIONS.md#ds-d2` and `definitions/relationships/relationships.yml`.
- Tag waivers remain `projects/domainspec-v2/impl/governance/tags/code-tag-waivers.yaml`.
  Four current entries were identified by L00; their exact bytes remain pinned.
  This guide does not renew validity, change expiry, reset data or transfer ownership.
- EVF migration uses explicit profile `evf-s1-migration-002`. The old `evf-s1`
  binding remains stale; this is not a silent global binding replacement.
