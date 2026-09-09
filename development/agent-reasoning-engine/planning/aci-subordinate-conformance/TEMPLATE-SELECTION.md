# Template and profile selection — ACI-subordinate conformance plan

## Inventory lookup

- Inventory machine view:
  `.arcanum/inventory/index.json`
- Machine-view validation: `pass`
- Lookup result: no exact inventory entry owns an ACI-subordinate Invoke Plan
  profile. Nearby Invoke plan syntheses are examples only and were not selected
  as authority.
- Authority fallback: the installed Invoke Plan templates and mode contract.

Inventory remains a discovery/read-model input. It does not authorize or
promote this plan.

## Selected templates

| Template | Digest | Eligibility | Selection |
|---|---|---|---|
| `.agents/skills/invoke/templates/implementation-layering.md` | `73a2765a32d5cc937818274dd8eb4e433e92aeb28fe617340ef4b27781d3f7c3` | required for every Plan flow | selected |
| `.agents/skills/invoke/templates/work-pack.md` | `dda86f74da4563af2e85aa32dcc6a4d665491c472bbcb4697b9bc97c4586d0a5` | required canonical executable plan | selected |
| `.agents/skills/invoke/templates/domainspec-spec/execution-pack.md` | `1f6c9deeb72caa72271bc32493bc0da84a9bd728180c01f6bc57265e34b8e585` | required for high-complexity wave choreography | selected |

## Profile decision

The existing plan is high complexity because it crosses private/external
authority, durable state, effect, replay, and multiple unresolved owner gates.
The selected output remains `split`:

```text
IMPLEMENTATION-LAYERING.md
  -> WORK-PACK.md
    -> work-pack/waves/*
      -> work-pack/tasks/*
        -> one SWU at a time
  -> EXECUTION-PACK.md
```

No tie existed among eligible templates, so no additional user choice was
required. The deprecated `module-formulae` execution profile was excluded.
