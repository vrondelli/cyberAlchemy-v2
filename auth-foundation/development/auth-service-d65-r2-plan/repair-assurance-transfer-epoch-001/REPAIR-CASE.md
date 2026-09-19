# Repair-assurance transfer case

Status: author pass; independent replay pending. Authority effect: none.

## Property

The product property is exact fail-closed authorization: return `ALLOW` only
when the request and trusted inputs are admissible, the session and
authentication evidence are current, the resolved roles are complete and
active, and an exact role grant matches the required permission and trusted
scope. Otherwise return `DENY`.

The evidence-pipeline property is narrower: the declared six-mutation campaign
must be able to construct disposable copies from the selected Auth source tree
and produce one typed observation for every mutation without depending on
ephemeral runtime state.

## Counterexample

The first fresh run failed before executing the first seeded mutation.
`mutations.py` copied the entire Auth implementation tree and attempted to copy
unrelated `.runtime` directories. Those directories contained Unix sockets and
dangling packaged-library links. Python `shutil.copytree` raised `shutil.Error`,
so the campaign produced no six-row mutation result.

The failing exit code and stdout/stderr are preserved under
`counterexamples/mutation-copy-runtime-state.*`. The counterexample is a real
evidence-pipeline defect discovered by the fresh transfer run; it is separate
from the six deliberately seeded Auth product mutants.

## Defect

The copy boundary selected the whole `implementation/` directory while its
ignore policy excluded only `target` and `__pycache__`. This allowed
non-source, process-owned `.runtime` state from unrelated Auth implementations
to control whether the declared mutation denominator was evaluable.

## Repair

The isolated epoch now defines one shared ignored-part set containing `target`,
`__pycache__` and `.runtime`. The set governs both the source inventory and the
disposable-copy operation. A regression test verifies that the copy callback
excludes all three names. The historical `completion-v1` runner remains
unchanged; the repair exists only in this new epoch.

## Verification bounds and result

The repaired epoch produced candidate
`3ed9cbef5a9e0eaec5158ed04c8c18221cb756b52ed49756cf5925cf1a41d9d3`
and passed:

- 64 Rust tests;
- all 48 declared service/API obligations;
- all six behavioral mutants, killed for their declared causes after two
  passing neutral runs each;
- executable and theorem EVF routes, with all thirteen stages independently
  verified on each route;
- all twelve hostile profile/provider controls;
- all ten package-level evidence regression tests.

This establishes a bounded author result for the current source and tool epoch.
It does not prove arbitrary authorization behavior, universal compiler
correctness, product approval, admission, publication, release or deployment.

## Open Questions

- Will the independent reviewer reproduce the repaired epoch and the original
  copy-boundary counterexample?
- Is a distinct pre-repair Auth product candidate recoverable, or should the
  product portion remain explicitly classified as mutation calibration?

