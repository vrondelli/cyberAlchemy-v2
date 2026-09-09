# SQL Three-Layer Durable Storage Runtime

This bounded Rust realization implements the admitted SQL three-layer system
ontology. Its portable core depends on behavioral traits, not a database
dialect. PostgreSQL is the first adapter. Docker Compose supplies two local
PostgreSQL processes with distinct volumes for integration evidence; a separate
content-addressed filesystem path supplies the SQL-independent immutable
archive.

Protection succeeds only after exact bytes are written and read back from all
three declared failure domains. Recovery checks operational SQL, then the
append-only journal, then the immutable archive, and only reports success after
the destination is retrieved and its qualified byte identity is verified.

The Docker topology is local conformance evidence. It is not a production
availability, independence, retention, security, RPO, RTO, deployment, or
external-effect claim.

