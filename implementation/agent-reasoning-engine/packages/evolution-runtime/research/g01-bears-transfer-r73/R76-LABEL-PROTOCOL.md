# Bears r76 evaluator-only old-side label admission

Before source ranking or GLM calls, bind exact r75 failed-side archives to the
curated Bears patch `diff` in the pinned official metadata. In an evaluator-
only private directory, parse every `diff --git a/P b/P` header, reject unsafe
or renamed paths, and require that **all** patch files are existing old-side
`.java` files within the r75 projected Java source tree. Reject added Java,
non-Java, and path-changing patches for this first transfer. At least one
path is required. Compare parsed header count with the official patch file
counts. Rehash every failed archive and inspect its exact root and Java path
set. Preserve each failed case's reason. Do not score or rank anything here.

This gate is deliberately strict and label-shape-selective; it does not imply
an unselected random sample. A failing 24-case denominator is terminal for
r76; a separately frozen, original-order successor may draw from r73's
remaining candidates before any provider call. Never silently drop cases at
evaluation time. Output a gold-free source cohort separately from the
evaluator receipt. No gold path or fix content may be transferred to the VPS.

## Open questions

- How many of r75's 24 source-admitted cases satisfy existing-old-side Java
  patch labels under this rule?
