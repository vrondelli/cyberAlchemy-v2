# Implementation Layering Seed

- L0: pure sanitizer plus exclusive private evidence writer and no-network
  failure fixtures.
- L1: inject the runner/writer into the typed gate and preserve typed blocker
  precedence through cleanup.
- L2: OEWSN terminal reference/admission contract.
- L3: package verification and a separate compatibility Decision Gate handoff;
  selected repair, build/browser evidence, and optional generic Task Session
  maintenance are not admitted by this package.
