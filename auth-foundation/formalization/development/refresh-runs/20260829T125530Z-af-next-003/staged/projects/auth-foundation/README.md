# Auth Foundation

Status: **proof-and-evidence candidate**

This project starts a new authorization foundation without changing
`projects/auth-user-management/`.

The formalization package, business ontology, owner-accepted business meaning,
and one Auth-owned L0 FormalClaim candidate now exist. There is no authentication runtime, authorization implementation,
database, token provider, proof obligation, formal proof, EVF receipt, or
production claim yet.

Canonical artifacts are JSON and JSON Schema under [`formalization/`](formalization/).
Markdown files are human navigation only.

## Starting question

Can a small session-based RBAC model preserve a clear business meaning while
remaining extensible enough to support secure session currentness, trusted
scope construction, stronger policy profiles, formal proof, and runtime
evidence later?

## Current boundary

The first model says:

- authentication establishes an active session for a user;
- a session activates roles;
- a role grants permissions;
- a permission names a resource, action, and scope;
- trusted application code constructs an authorization request;
- authorization allows exactly when the session is current and an active role
  grants the exact required permission;
- every other result is deny.

The exact business meaning and interpretation are accepted by the Auth
Foundation owner. The FormalClaim that binds them is still a candidate and
requires its own admission decision. The first case is under
[`formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/`](formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/).
