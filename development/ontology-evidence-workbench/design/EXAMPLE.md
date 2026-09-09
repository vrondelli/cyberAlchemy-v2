# Worked Example — Poker Team O13

## Source

The first walkthrough consumes the existing verified
`generated/runs/SWU-OCGP-008/` bundle. Poker Team remains read-only.

## Exact Candidate Story

```text
F1  Finding: O13 instrument types mismatch; pipeline result is FLAG
└─ derives-from R1  Research artifact: static observability audit
   └─ derives-from D1  Definition: O13 declares both instruments as Gauge

D2  Definition: backend registers both instruments as Histogram
└─ contradicts D1

C-SPECIALIZES-D2-D1
└─ candidate relation: specializes(D2,D1)
   disposition: policy-indeterminate
   diagnostic: POLICY_OWNER_UNBOUND
   authority_effect: none
```

The exact grounding closure is `F1 → R1 → D1`. `D2` is visible conflict
evidence but is excluded from that closure.

## Adapter Projection

| Source object | Presentation object | Exact inspector state |
| --- | --- | --- |
| F1 / Finding | `claim` node | `source_kind=Finding` |
| R1 / Research artifact | `source` node | exact source path/digest |
| D1 / Definition | `claim` node | declared Gauge contract |
| D2 / Definition | `claim` node | observed Histogram registration |
| F1 `derives-from` R1 | `builds_on` edge | exact `derives-from`; generalized mapping |
| R1 `derives-from` D1 | `builds_on` edge | exact `derives-from`; generalized mapping |
| D2 `contradicts` D1 | `contradicts` edge | exact match |
| D2 `specializes` D1 | `related` edge | exact `specializes`; policy-indeterminate; mapping lossy |

## Guided Tour

### Step 1 — Start with the finding

The UI selects F1 and states that this is a candidate finding from a verified
run, not a product verdict created by OEW.

### Step 2 — Follow its evidence

The path animation moves to R1. The inspector shows the exact `derives-from`
relation even though the layout graph uses upstream `builds_on`.

### Step 3 — Reach the declared contract

D1 becomes the focus. Graph, outline, and table all show the same exact relation
and source handles.

### Step 4 — Preserve the contradiction

D2 remains visible with a dashed conflict edge. The tour explains why it does
not enter grounding closure.

### Step 5 — Show the unowned hierarchy candidate

The amber candidate edge shows `POLICY_OWNER_UNBOUND`; no visual affordance
allows the reviewer to “accept” it.

### Step 6 — Inspect trust

The receipt drawer shows:

- source run and terminal receipt;
- source and adapter digests;
- adapter version and mapping counts;
- Understand-Anything pin;
- `authority_effect: none`;
- protected Poker/IOLM/source scope result.

## Optional Code Context

In L2, explicit mappings may link:

- D1 to the Poker observability specification path;
- D2 to the telemetry instrument registration path;
- F1/R1 to the report source paths.

Those nodes appear in a separately labeled code-context lane. They help a
reviewer navigate implementation, but they do not change the evidence graph or
Poker product ownership.

## Acceptance Oracle

The walkthrough passes only when:

1. lineage selection is exactly F1/R1/D1;
2. D2 remains visible and non-composing;
3. the `specializes` candidate is indeterminate with the exact diagnostic;
4. every visible object opens exact source evidence;
5. all three equivalent views agree;
6. no protected source bytes change.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
