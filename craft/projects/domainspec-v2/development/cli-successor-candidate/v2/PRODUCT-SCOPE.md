# CLI successor local product scope

The proposed product is the DomainSpec v2 CLI at version 1.0.0 with the new opt-in TypeScript exact UInt64 profile, declarative function composition, portable/guarded bindings, and project composition generation for TypeScript and Rust. The replacement fixes Rust generation for all validated safe-integer literals, including values outside the i32 range.

The exact source and archive digests in candidate.json, once final checks complete, define the acceptance subject. Prior candidate v1 failed independent review and is not the acceptance subject. The previously accepted compiler/four-product candidate is not changed by this record.

Acceptance would cover the bounded local compiler behavior exercised by the recorded product, regression, package and recipe-qualification checks. It would not approve publication, deployment, hosted CI, production safety, arbitrary external consumers, or a comprehensive security audit. Alch source provenance and ontology scaffolds do not prove source-language semantic equivalence or ontology admission. Checked assurance interchange still explicitly excludes compositions. UI is excluded; BTE comparison is deferred.

Product-construction frontier: repaired source and archived package await final test/review join, then human product acceptance. Operational support: release owner subsequently supplies an exact clean integration/commit scope for the formal release builder, hosted verification on that source, and distribution/provenance/package metadata decisions. No operational authorization is granted here.
