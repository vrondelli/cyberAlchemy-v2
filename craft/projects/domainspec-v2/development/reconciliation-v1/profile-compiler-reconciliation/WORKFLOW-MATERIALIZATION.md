# Typed Workflow materialization

Date: 2026-09-09. Remaining-work task R02 / PCR-06 candidate.
Authority effect: none.

## Result

[Native source emitter](../../../impl/cli/src/generation/workflow-materialization-source.ts)
now generates a standalone typed boundary module from checked Workflow bindings
and their exact selected field compilation. This completes R02, not native
Workflow orchestration or public CLI integration.

The [definition](workflow-materialization-contract.json), SHA-256
88d7a46aa61a28b371de4e468163a2c36c1da1d8ca83c14c77584fb2061a54a4,
and [ontology scaffold](../ontology/workflow-materialization-candidate.json)
preceded implementation. Existing value, Event, Operation, binding, outcome and
selected recovery semantics are reused without rewriting those sources.

## Generated boundary

- capture owns and normalizes all ordinary and Event inputs without calling
  getters, coercion, clocks, factories, guards, lookups or providers.
- captureResult owns a typed returned value and binds its slot to the exact
  captured input instance, step occurrence and action hash. It does not prove
  commit; R03 must first classify returned metadata through R01.
- Each forward argument function requires its exact preceding result prefix.
  Compensation arguments require a prefix reaching their associated step and
  read only the checked scope. Cloned, reordered, future, duplicate and
  cross-capture result slots reject.
- The final result function requires all forward slots and evaluates only the
  checked expression. A typed result is not evidence of successful execution.
- Compensation values are separate from the expression-only Recovery Intent.
  No new recovery carrier, eligibility policy or dispatch is introduced here.

Root slots are required. Nested ordinary optionals normalize absence to null;
Event optional payload fields preserve absence. UInt64 remains bigint, including
the maximum value. Event integer remains signed 64-bit; generated-time Event
inputs cannot supply a time and no Event is constructed. Lists retain duplicate
occurrences; sets use the existing canonical uniqueness rules. Named Entity,
Value Object, Enum and sum normalization retains the selected distinctions.

Bounded inert capture limits depth to 64, nodes to 20,000, array length to 1,024
and own keys per object to 2,048. Ordinary accessor/coercion isolation is tested;
arbitrary Proxy isolation is not claimed. Registration is process-local
provenance, not authenticated provider evidence or durable replay protection.

## Verification

Seven focused suites pass **66/66**, zero failures/skips, in **107.916 seconds**:
materialization 9, outcomes 9, recovery 11, bindings 9, occurrences 8,
configured Operations 11 and configured Events 9. Source typecheck and frozen
catalog/relationship/integration checks pass. Historical catalog 39 is not the
reconciled 39-cell native completion matrix.

Tests compile generated TypeScript with the existing pinned TypeScript 7.0.2 /
Node 26.8.1 container and execute the emitted JavaScript. Typed consumers prove
bigint and occurrence types. Nested optional/list/set/Enum/Value Object/sum,
ontology-property projection, exact literals, payload-free variants and explicit
to_set have native coverage. Generated code remains reproducible after removing
the test-owned source tree because it uses the checked snapshot.

An independent behavior oracle rejects four compiling mutants: final-result
occurrence substitution, wrong same-typed earlier result, widened forward prefix
and swapped Event occurrence. A separate native AST observer derives expectations
from authored bindings/occurrences, without executing the generator or module.
It rejects five compiling mutants removing input/result capture, weakening
capture identity, widening prefix or introducing an ambient clock.

Initial native compilation caught and corrected a missing generic delimiter in
the emitter. Expanded fixtures initially violated existing Value Object admission
and variant expression syntax; the fixtures were corrected, not the language.
All final checks above are against corrected bytes. No broad 38-file regression,
Python/Rust realization or installed package is claimed by this unit.

## Task Session context and gates

Task Session with standard Context Builder, executed locally without delegation.
Selected source selectors: R02 plan/done criteria; R01 outcome boundary; checked
Workflow bindCall and expression scope; selected recovery/D36/D37; exact field
selection and structural value/expression emitters; Event scalar/input rules;
Operation native test helper; and the three-step direct DomainSpec fixture.

Obligations cover source identity, owned values, result-prefix availability,
Event non-effects, exact types, compensation scope, hostile and mutation controls,
compatibility and evidence synchronization. Strict task coverage passes.
Runtime handoff and sigil-development experiments are not applicable. Fallback
search was limited to native test helper and TypeScript observer API locations.

No product decision changed. Pure generated specialization and existing native
toolchains are implementation choices within the selected plan. Nine-file scope:
definition, ontology scaffold, emitter, test, package test registration, this
report, CLI-COMPLETION, STATUS and remaining-work checklist.

Preservation audit: all eight protected sources retain their entry hashes.
Removing only this unit's test path reproduces package.json's R02 entry hash
ad18c334e38d8b639a698abf8a3ccf403e62ed166b58d60a1f78f1005bea723c.
No temporary dependency link, new toolchain, source migration, default cutover,
publication, AlchLang change or production provider effect occurred.

ARE request ds-cli-continuation-20260909-064:
route 189f7265d59346b9f6dfface2c0742b9b3c69a88db484196599fb08913b75a9f;
context 262a3f6186480fa5bf8e2c7b9a440eb84c69eef72c6fe6cdd2433b431aeb559c;
effect 9b26916ac29a889259fe33b15f812800d90455366bb9830b1857131132f7bf9f.
Assessments grant no operational authority.

## Next construction

R03: exact generated Operation imports, awaited forward orchestration, outcome
classification, selected recovery and typed compensation binding integration,
with independent native observation. R04 public Mapping bindings remains
independently runnable. The complete CLI goal remains active.

Implementation SHA-256: 3d3d80929bc3d61714c818770d6c822f3a1205426c29bf7284931b29e7b421e1.
Test SHA-256: e732ebc0299add7fb2c9db766a6c9f3bf63f4213bebe92e926769357d6e6ffc7.
Scoped whitespace check passes. ARE continuation
148545dcab43a42fbd99d87647a1dae468df978e857ba13fa1e0c5625d1d3e65
selects R03; no missing owner gate is reported. Its consequence gate does not
erase the user's explicit ongoing bounded implementation authorization.
