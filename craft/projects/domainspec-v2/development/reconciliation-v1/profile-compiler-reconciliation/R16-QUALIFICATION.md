# R16 reproducible local installation package qualification

Status: **pass**  
Date: 2026-09-15  
Authority effect: **none**

The current package builds into one exact installable archive:

- file: `evidence/r16-installation-package/domainspec-v2-cli-1.0.0.tgz`
- package: `@domainspec-v2/cli@1.0.0`
- compressed size: 2,574,504 bytes
- unpacked size: 12,857,770 bytes
- entries: 1,395
- SHA-256: `42446f893c8793c33b71a8afafef0b69b9775a341225cf893049da0fda93da49`

## Reproducibility and installation

The strengthened clean-package validator packed the current build twice into
separate owned temporary directories. Filename, size, npm shasum, integrity,
file inventory, and tarball SHA-256 were identical. It installed the archive in
two independent consumers and exercised the installed binary, stable API,
experimental runtime subpath, authoring, lint, instantiation, formalization,
project verification, deployment-recipe generation/verification, deterministic
outputs, and causal drift rejection. Both runs passed and the validator removed
its temporary roots.

The payload includes the TypeScript, Python and Rust reconciled project planners,
the three explicit migration modules, compiled declarations, required Lean
modules, schemas, CLI binary, user documents, and the R17 reconciled commerce
example. It ships neither `src/` nor
`test/`, declares no runtime npm dependencies, and the installed root import does
not reach the checkout.

The validator now accepts an explicitly pinned absolute TypeScript compiler for
qualification instead of assuming a workspace-relative `node_modules`. All six
generated-source checks and the current TypeScript build passed before packing.

## Size boundary

The package has 1,395 entries because current compilation includes source maps,
declaration maps and internal verification modules, plus the complete installed
example. That is 12.86 MB unpacked and 2.57 MB compressed. This is not a
correctness blocker; payload minimization is a separate optimization and was not
allowed to obscure installation qualification.

This archive is local candidate evidence. It has not been published, admitted,
released, or deployed. R17 owns user documentation and the installed reconciled
three-language acceptance corpus.
