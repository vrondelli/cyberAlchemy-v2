# Scorer startup diagnosis

Independent no-reference probes confirm that existing sandbox Python help, interpreter startup and parser loading succeed, but `git -C <pinned upstream> rev-parse HEAD` fails before native reference loading. Git reports that it cannot open `/dev/null` for reading and writing: permission denied. Native `verify_sources` executes this command before opening gold.

The exact existing sandbox arguments plus only `--dev-bind /dev/null /dev/null` succeed: Git returns pinned upstream revision `1436c28a8eb95496da4ea69ad458b9f8a8eb7d61`, exit0 and zero stderr. Host `/dev/null` is character device1:3 with mode666. No persistent filesystem path needs writable access, and a private `/dev` mount is unnecessary.

Use an additive bridge/scorer version and new analysis namespace. Preserve the failed v3 evaluation and frozen sources. Re-run synthetic persistent-write/network denials and bounded-pipe tests plus the previously missing Git-startup check before approval. These probes did not load gold, score a prediction, call a model or change sources.

## Open Questions

The additive implementation and exact review remain pending. See `SEAL-RECOVERY-AMENDMENT.md` for the original generation recovery; this startup correction changes neither that acceptance nor scientific criteria.
