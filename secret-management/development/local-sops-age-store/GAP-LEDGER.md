# Local SOPS And Age Store Gap Ledger

| ID | Status | Evidence or gap | Consequence |
| --- | --- | --- | --- |
| `LOCAL-G-BACKEND` | resolved-candidate | Real SOPS/age round trips, tamper rejection, wrong-key rejection, and pinned executable hashes pass. | Local encrypted storage is usable. |
| `LOCAL-G-CLI` | resolved-candidate | `init`, `put`, explicit reveal, list, delete, describe, doctor, launcher, and package tests pass. | Local operator workflow is usable. |
| `LOCAL-G-PERMISSIONS` | resolved-candidate | Key/vault/lock modes, ownership, leaf symlink rejection, and encrypted atomic replacement pass. | Local filesystem invariants are enforced. |
| `LOCAL-G-RECOVERY` | open-operator | No external backup of the age identity is verified. | Losing the identity makes the vault unrecoverable; operator backup is required. |
| `LOCAL-G-ROTATION` | deferred | Material replacement exists, but age-recipient/key rotation automation and recovery rehearsal do not. | Do not claim managed rotation. |
| `LOCAL-G-CONCURRENCY` | partial | Two concurrent local writers pass and `flock` guards writes; multi-process crash/recovery stress is not proven. | Evidence remains local and bounded. |
| `LOCAL-G-TRUSTED-CONSUMER` | deferred | A trusted Python callback or explicit reveal can copy material. | Same-process non-exfiltration is not claimed. |
| `LOCAL-G-ACCOUNT-COMPROMISE` | out-of-scope | The key and vault are accessible to the same OS account and root. | This is not protection from account compromise. |
| `LOCAL-G-CI-TEAM-CLOUD` | blocked-separate-scope | CI identity, team sharing, managed services, migration, and deployment are absent. | Separate product and authority decisions are required. |
| `LOCAL-G-VOICE` | blocked-separate-scope | Voice code was regression-tested but not changed or connected to the store. | ElevenLabs integration remains a separate bounded task. |

No open row invalidates local single-user use. Every open row limits broader
security, recovery, integration, or production claims.

