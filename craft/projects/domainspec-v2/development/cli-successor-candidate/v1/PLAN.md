# CLI successor candidate validation

Product construction: freeze the 199-file CLI source selected and tested in cli-successor-validation/v1; run the real two-run L1 qualification campaign; independently review the exact source snapshot and evidence. Runtime execution uses the working CLI, with source hashes checked before and after. The snapshot is CLI source, not a standalone full repository build closure.

Operational support: release owner must authorize exact integration/commit scope for a clean source commit before the existing release builder can create its formal bundle. Hosted exact-source validation and distribution/provenance/metadata decisions follow separately. They do not block local qualification or review. No release, publication, deployment or acceptance is authorized here.

Writes: this evidence directory, validator-owned temporary recipe/container resources. No production resources; adapters run Terraform backendless validation and Docker bake checks only. Frozen accepted candidate and source implementation remain unchanged. UI excluded; BTE comparison deferred.
