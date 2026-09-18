# Start a project in your own language

The customer bundle includes a project starter. It creates an explanation-only
policy and validates the resulting profile with the installed ARE engine. It does
not infer your business rules, approve definitions, or authorize arbitrary tools.

## Describe your project

From the extracted customer bundle directory, copy `project-spec.example.json` to
`project-spec.json`. Replace its contents with your own terms and instructions:

```json
{
  "project_id": "bakery",
  "definitions": [
    {"id": "batch", "term": "Batch", "meaning": "A batch contains twelve loaves."},
    {"id": "pickup", "term": "Pickup", "meaning": "Pickup closes at 17:00."}
  ],
  "instructions": "Use the bakery definitions when explaining orders.",
  "persistent_state": false
}
```

Project and definition IDs use lowercase letters, digits and hyphens, up to 64
characters, beginning with a letter or digit. Definition IDs must be unique.
Provide 1–64 definitions, nonempty terms and meanings, instructions, and an explicit
persistence choice. Input errors are reported together before any project is created.

## Create and inspect

After installing the engine, run:

```sh
node tools/create-customer-project.mjs ./engine ./my-project ./project-spec.json
```

The new directory contains:

| File | Purpose |
| --- | --- |
| `definitions.json` | Your terms and meanings, marked as candidate proposals |
| `ontology.json` | One concept node for each supplied definition; no invented relationships |
| `AGENTS.md` | Your instructions |
| `routes.json` | The explanation-only starter route |
| `decision.json` | The route binding and conservative effect boundary |
| `setup.json` | Selected source files and context selectors |
| `.are-keld/profile.json` | Validated customer runtime configuration |

Existing directories are refused. On validation failure, the command removes only
the new directory it created. It does not merge into or migrate an existing project.
The project and engine must remain separate roots. It never starts an agent, calls
a model, or initializes a secret store.

Connect an app-server client using the [quickstart](CUSTOMER-QUICKSTART.md), replacing
`example-project` with `my-project`. Ask it to explain a batch and pickup. The client
must use that project's absolute path as its thread working directory.

## Change the policy deliberately

The generated source files remain editable. Instruction text refreshes through the
existing customer context provider. Changes to definition IDs, ontology structure,
selectors or route policy require corresponding source/configuration updates and
validation. No automatic semantic approval or production-policy migration is supplied.
Use [advanced profile setup](CUSTOMER-PROFILES.md) when configuring routes beyond
explanation. See [recovery](CUSTOMER-RECOVERY.md) before changing persistent state.

## Evidence

`node --test keld-project/scripts/create-customer-project.test.mjs` passes real-wrapper
context projection, live instruction refresh, existing-project preservation and
collect-all invalid-input checks. The bundle builder separately exercises the
included starter against the extracted engine in an isolated Linux container.
Neither check claims model task-quality gains or completeness of arbitrary policies.

## Open Questions

Guided relationship/routing authoring, existing-project adoption, upgrade migration
and interrupted-task recovery remain separate work. Commercial decisions are tracked
in [release readiness](RELEASE-READINESS.md).
