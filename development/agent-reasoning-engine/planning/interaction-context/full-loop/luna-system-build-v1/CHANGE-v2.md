# Product change — expiring preferences and old-store compatibility

All v1 behavior remains required, with these exact changes:
1. Current health, store and export schema_version become 2.
2. Lessons may have expires_at: null or a nonnegative safe integer UTC epoch
   milliseconds. Omitted on create defaults to null. Invalid values -> 400.
3. Revise may set expires_at; omission preserves it, explicit null clears it.
4. Explain accepts optional now, a nonnegative safe integer epoch milliseconds;
   omission uses Date.now(). A lesson expires when now >= expires_at.
5. Disposition precedence is disabled, expired, inapplicable, unsupported,
   overridden, applicable. Expired records stay inspectable and have no items.
6. Load v1 stores without losing lessons, IDs, revisions, disable controls or
   event history. Treat missing expires_at as null. Persist schema_version 2
   atomically during migration. Existing event objects must remain unchanged.
7. Reopening a migrated store must not migrate twice or duplicate history.
8. Both CLI and HTTP implement the new fields and docs/tests cover them.
Expiry is a projection decision, not automatic deletion or product authority.
