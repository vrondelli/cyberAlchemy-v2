# EVF repair resource overlay

This is local deployment preparation, not a live update. Pair `resources.compose.yaml` with the exact selected deployment Compose and the newly tested application image. Do not run the historical r2 base as a deployment shortcut.

| Service | Memory / memory+swap | CPU quota | PID limit |
|---|---:|---:|---:|
| application | 768 MiB / 768 MiB | 1 CPU | 128 |
| database | 1 GiB / 1 GiB | 1 CPU | 256 |

These are initial bounded budgets, not certified capacity. Preserve headroom for the OS, Traefik and other VPS services; verify current host capacity before rollout. PostgreSQL tuning and worst-case connection/query memory need workload measurements. An OOM boundary limits damage but can interrupt work, so do not present limits alone as availability assurance.

`python3 -B validate_resources.py` checks Compose's resolved model using dummy interpolation values. It compares the resource overlay against the historical configuration structurally, permits only the eight declared quota fields, and exercises missing-quota and changed-database-image negative cases. It also verifies that local implementation Compose uses the same budgets. It never starts services or reads credentials.

The application change supplies host-only HSTS for one year, nosniff and no-referrer on all hosted responses, retaining each route's CSP and content type. Cleartext localhost previews do not activate browser HSTS. The separate existing response-admission work binds bulk payload ownership and transport deadlines; its tested HTTP/1.1 vectored path is narrower than universal outbound or HTTP/2 protection.

Later deployment must select the exact new image, back up the current database, preserve the existing volume and credentials, stop the application writer before database container quota recreation, and verify readiness and state continuity afterward. Resource changes affect the PostgreSQL container too; an application-only replacement will not apply its quota. Do not use down -v, overwrite old receipts, or roll back only the binary after the state-layout migration.

Current product work and tests are recorded in ../../../implementation/evidence/evf-fixes-20260906. Historical production EVF FAIL remains unchanged until a separately authorized rollout and fresh live audit.
