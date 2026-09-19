# DeepSeek Harness VPS installation evidence

Official harness identity and use of the existing GLM VPS were confirmed by the user. Installed on root@187.77.163.194 (srv1959838), under /opt/are-harness-benchmark/dsh-0.1.5-rc.2. Existing presentation services were not changed.

The exact Node image digest, package lock and offline-check hashes are in INSTALL-RECEIPT.json. All copied hashes were verified. CLI/headless help, default configuration rendering and native module loading pass without networking or credentials. No model calls occurred.

The published npm version 0.1.5-rc.2 differs from the newer source commit examined in the plan. Its headless help does not advertise --json. Do not infer newer source functionality or full execution readiness from these installation checks. npm skipped unapproved lifecycle scripts; native libraries load, but subprocess functional qualification remains pending.

## Open Questions

GLM provider configuration, native tool execution, full wire accounting, exact 8K admission, benchmark task/source adapter, independent experiment review and live canary remain pending. Current space inspection found approximately 189 GB free disk and 14 GB available memory before installation; live admission must remeasure capacity. Secrets remain on the existing host and were not copied into these artifacts.
