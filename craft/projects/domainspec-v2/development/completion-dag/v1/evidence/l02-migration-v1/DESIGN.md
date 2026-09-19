# L02 additive migration prototype

Construction lane: implementation prototype, following L01's definition pack,
local ontology scaffolds, consumer dispositions and correspondence contract.
These are navigation scaffolds, not admitted ontology records.

Product prototype: explicit Markdown dialect selection produces the existing
native obligations, or a rejection containing diagnostics and no success output.
Business prototype: callers can test migration without replacing their existing
entry point; there is no removal, waiver reset or operational cutover.
DomainSpec prototype: L01-T01–T11 remain the bounded test contract.
Compiled-system prototype: bridge.ts binds the existing grammar, rules and emitters;
the EVF S1 route binds its existing exact-reference deriver. No new obligation
identity scheme or generic JSON interpretation is introduced.

Implementation: selected Markdown files are copied into a temporary snapshot with
their original basenames. This forces dialect selection without changing grammar
or anchor semantics. Read/parse failures reject. Returned digests identify the
snapshot bytes, not an independently admitted source. Temporary files are removed.
Legacy-auto keeps aspect precedence and lists ignored alternate sources.

Changed validation obtains NUL-delimited name/status records through an argument
array to Git. Paths are repository-relative and checked against the configured
feature root. Renames and deletions retain dispositions; unsupported statuses and
Git failures reject. The unchanged normal validator runs read-only over the full
feature context; its diagnostics are projected onto selected existing files.
This preserves normal diagnostic text, including historical docs/features wording.
Outside-scope diagnostics remain visible separately. Deleted-only selections are
reported as changes-only, never a validation PASS. Empty selection is no-work.
This validates current working-tree bytes selected by a commit range, not historical
commit contents, and does not discover untracked or uncommitted changes.

The CLI emits JSON to stdout only. Rollback means invoking the previous entry point
with its previous input binding; no caller is switched by this candidate.
L03 owns all-row migration closure; L04 owns independent review/product approval.

Operational support: migration owner retains future caller-cutover/removal work
(no construction stage affected now); publication owner retains publication work.
UI U00–U05 remains deferred. Existing broader ORODI regression failures are carried
as residue, not waived or represented as passing by these focused tests.
