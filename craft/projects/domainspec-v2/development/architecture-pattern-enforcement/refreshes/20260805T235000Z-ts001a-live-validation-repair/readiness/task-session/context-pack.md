# TS001A Context Pack

Execute only `SWU-APE-ENUM-TS-001A` in the existing
`projects/domainspec-v2/impl` package.

The selected protocol is an owned const-object Enum provider. The material
surface is exactly one provider module, one focused runtime/type test, and one
focused TypeScript configuration. The provider must expose `defineEnum`,
`composeEnum`, and the type-only `EnumValue`; freeze cloned outputs; preserve
literal inference; accept direct and nested named composition; and reject
unowned inputs, collisions, unsafe keys, repeated contributions, and cyclic raw
graphs with stable causes.

Ownership stays module-private. This unit does not activate the TypeScript
profile and does not claim to observe source syntax. Computed/spread syntax,
helper impersonation at source level, adapter projection, and profile admission
belong to later SWUs.

Acceptance requires the exact focused Vitest command, focused `tsc` project,
unchanged parent typecheck, provider digest, and a separate terminal Task
Session receipt. The three material targets are exact-present postimages from
the blocked first attempt; the terminal receipt remains absent. This repair
attempt must not change provider bytes.
