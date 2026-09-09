# UX Plan: Static Candidate-Graph Inspection

Status: design contract
Selected surface: `ux-plan`

## User and Job

A human ontology reviewer needs to answer:

1. what lineage did the policy validate;
2. which edges failed or remained indeterminate, and why;
3. what exact inputs and policy were bound;
4. whether authority effect was absent and governed inputs stayed unchanged.

The reviewer does not approve or promote ontology meaning through this view.

## Surface

One static HTML document generated from canonical run JSON. It contains:

- a plain-language evidence-ceiling banner;
- disposition summary with text, not color alone;
- nested research-lineage outline plus equivalent table;
- conflict and indeterminate-candidate sections;
- provenance/policy digest details;
- write-isolation evidence;
- downloadable canonical JSON references.

## Interaction and Accessibility Contract

- semantic headings, lists, tables, `details`, and links;
- complete keyboard navigation in source order;
- visible focus;
- no required pointer gestures;
- no motion required and no timed interaction;
- graph meaning duplicated in text/table form;
- reason codes paired with plain-language explanations;
- static content remains usable with JavaScript disabled.

## Error and Recovery

A stale or incomplete receipt renders no graph. The surface instead shows the
binding error, affected selector, repair route, and run identity. Recovery is a
new run; the report never edits inputs.

## Evidence Separation

Automated checks may validate markup, keyboard reachability, visible focus, and
content equivalence. A named human must separately record whether the lineage,
conflict, disposition, and authority boundary are understandable. Neither
evidence type is semantic admission.
