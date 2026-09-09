# Durable Storage SQL Three-Layer Successor

This package evolves Durable Storage without making one database its meaning:

```text
encrypted knowledge bytes
  -> operational SQL (normal reads and writes)
  -> append-only recovery journal (separate SQL failure domain)
  -> immutable content-addressed archive (SQL-independent failure domain)

loss or corruption in operational SQL
  -> try the journal
  -> otherwise try the immutable archive
  -> write the destination
  -> read the destination back
  -> verify the full qualified byte identity
  -> only then report restoration
```

The Rust core defines database-neutral behavioral ports. PostgreSQL 17 is the
first SQL adapter. One digest-pinned Docker image is instantiated as two local
services with separate volumes; the archive remains outside SQL. Another SQL
database can be added as an adapter without changing object identity, recovery
order, or the proof that the restored destination was verified.

Run the non-effectful aggregate gate with:

```sh
python3 validate-d65.py
```

Run the bounded Docker proof from `runtime/` with:

```sh
python3 validate.py --docker
```

The local Docker arrangement proves implementation behavior, not production
failure-domain independence, availability, security, retention, RPO, or RTO.

