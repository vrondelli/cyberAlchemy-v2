# Secret-store source import

Private source/test copy authorized by the owner for KELD deployment preparation.
Source: domainspec-core/projects/secret-management. Exact copied file hashes and
scope are in [UPSTREAM.json](UPSTREAM.json); all copied files retain their bytes.
No vault, identity, binary, runtime state or upstream development history is copied.
The KELD application image does not contain this operator-side package.

## Open Questions

Production policy, backups and rotation remain owned by the
[deployment instructions](../../deploy/README.md#open-questions).
