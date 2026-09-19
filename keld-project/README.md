# KELD in CyberAlchemy v2

KELD is the studio and commercial offering for agent gear. This project will
prepare the existing private Agent Reasoning Engine for sale as downloadable
software and connect its release to the KELD storefront. The current private
state is a development/distribution fact, not a permanent restriction on selling it.

## Start here

- [Original project handoff](KELD_PROJECT.md) — preserved incoming brief.
- [Project intake](docs/PROJECT-INTAKE.md) — scope, terminology and open decisions.
- [ARE integration research](docs/ARE-INTEGRATION-RESEARCH.md) — evidence and proposed boundaries.
- [Distribution audit](docs/DISTRIBUTION-AUDIT.md) — portable full-closure test and customer packaging gaps.
- [Private archive](docs/PRIVATE-ARCHIVE.md) — reproducible packaging and extracted-engine verification.
- [Customer quickstart candidate](docs/CUSTOMER-QUICKSTART.md) — exact prerequisites and verified agent initialization.
- [Standalone customer bundle](docs/CUSTOMER-BUNDLE.md) — engine, installer, project setup and launcher verified without this checkout.
- [Connected storefront preview](docs/CONNECTED-PREVIEW.md) — verified release metadata in the KELD shop, with downloads and checkout disabled.
- [Delivery DAG](docs/DELIVERY-PLAN.md) — construction order and launch dependencies.
- [Release-readiness audit](docs/RELEASE-READINESS.md) — requirement-by-requirement evidence and remaining gaps.
- [Import manifest](docs/IMPORT-MANIFEST.json) — hashes of all 59 incoming files.

The 16 MB starter is preserved under `prototype/`. It contains the website,
not the engine. ARE continues to live at
[its product package](../agent-reasoning-engine/README.md) and
[its implementation](../implementation/agent-reasoning-engine/README.md).
The existing [ARE documentation prototype](are-documentation/README.md)
is available for later product-copy and documentation integration.

## Local use

From the CyberAlchemy v2 root:

```sh
python3 keld-project/scripts/verify-import.py
python3 keld-project/scripts/preview.py
node keld-project/scripts/smoke.mjs
```

Preview: `http://127.0.0.1:4194/`, `/shop.html`, `/legend.html`.
The preview maps `/are/` to the local ARE app on port 4193. Start that app with
`npm run dev` from `keld-project/are-documentation` to follow the product link.
This local redirect does not change the production `/are/` route.
The import verifier rebuilds in a temporary directory and removes it afterward;
it does not overwrite imported templates, generated pages or historical QA reports.
The served smoke test writes fresh local results under ignored `evidence/`.
`KELD_PLAYWRIGHT_MODULE` and `KELD_CHROMIUM` override the existing workstation's
Playwright module and Chromium paths. `KELD_PREVIEW_URL` overrides the preview URL.
No dependency installation was added. The original Python browser scripts still
have their documented container-specific browser dependency and were not rerun.

The prototype remains in checkout-preview mode. Packaging work produces a local
private candidate only. No order, entitlement, customer release, merchant account,
external message, or deployment has been created. No nested Git repository was
initialized or commit made.

## Open Questions

Owned by [project intake](docs/PROJECT-INTAKE.md#open-questions) and the
[delivery plan](docs/DELIVERY-PLAN.md#open-questions). The original handoff's
commercial decisions remain source evidence, not a verified public release.
