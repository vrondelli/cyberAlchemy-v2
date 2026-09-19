# Testing Alignment

Required future checks, after a new ownership decision and Plan:

- verify target source declarations close all 13 types and 39 language slots;
- scan TypeScript runtime imports while preserving the type-only exemption;
- resolve Python internal imports and Rust `#[path]` modules, not only TypeScript imports;
- fail when targets import system fixtures, realizations, evaluators/decoders, expected outcomes, mutants, or hostiles;
- use contextual domain-literal evidence to catch import-free Policy/Entity/Value Object/Operation/Query/Calculation leakage without treating generic words as failures;
- test generic targets independently from Financial Settlement and Shipment Priority corpora;
- test the composition adapter with corpus supplied as input;
- preserve exact source hashes and fail current-byte freshness separately from historical receipts.

Current source freshness is not fully closed: three Rule target locks differ by one newline byte from the live files, and Enum has no source locks to check.
