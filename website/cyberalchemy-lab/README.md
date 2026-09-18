# CyberAlchemy Lab public website

Bilingual editorial website requested by the product owner on 2026-09-14. The public root introduces the product propositions; `/ddd` remains the existing presentation. Published copy describes development intentions, not availability, measured effectiveness, or production readiness.

## Source map

| Public section | Source of meaning |
| --- | --- |
| Lab thesis, work loop, principles | [CyberAlchemy thesis](../../product/PRODUCT-THESIS.md) |
| Craft | [Craft thesis](../../product/craft/PRODUCT-THESIS.md) |
| Craft naming | [Legacy DomainSpec thesis](../../product/domainspec-v2/PRODUCT-THESIS.md) — same product lineage, not another product |
| AlchLang | [Capability introduction](../../language/capabilities/alchlang/README.md) — language capability, no separate product thesis implied |
| Workspace | [Workspace thesis](../../workspace/PRODUCT-THESIS.md) |
| Ontology Product | [Ontology thesis](../../product/ontology-product/PRODUCT-THESIS.md) |
| Essays | [Essays thesis](../../essays/PRODUCT-THESIS.md) |
| ARE | [ARE product thesis](../../agent-reasoning-engine/README.md#product-thesis) |
| Presenter and DDD case | [Portuguese deck](../../essays/presentations/do-dominio-ao-codigo-v3/index.html) and [English deck](../../essays/presentations/do-dominio-ao-codigo-v3/en/index.html) |

The source documents retain authority over meaning. Public copy is an editorial paraphrase and does not promote candidate theses or publish private source artifacts. No claims based on internal benchmarks are used.

## Assets

Lab logos come from `cyberalchemy-exchange/knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/static/assets/cyberalchemy-lab-logo-{light,dark}-v2.svg`.
Craft and AlchLang marks come from `language/capabilities/alchlang/plans/general-compiler-v1/implementation/docs-app/src/assets/`. The favicon and work-loop emblem use the existing Lab symbol. The RAM illustration is native CSS, an illustrative reference to the fictional presentation case.

## Build and preview

Run `python3 website/cyberalchemy-lab/build.py` from the repository root. It generates `public/index.html` and `public/en/index.html` from the bilingual copy. Serve only `public/` with any static server. CSS, JS and assets are local, with no framework, analytics, external fonts, or backend dependency. Without JavaScript the product and approach sections remain readable; JavaScript enhances them with keyboard-accessible tabs.

## Construction and operations

- Product frontier: static bilingual site, complete editorial source mapping, desktop/mobile layout and accessible interactions.
- Product checks: navigation, six product tabs, four work-loop tabs, open questions, language switching, no-script access, static links/assets, overflow and page errors.
- Publication owner: requesting user; implementation and deployment executed by the assistant under that request.
- Deployment target: existing VPS and Traefik network, separate static site service for the root and `/en/`. The existing DDD container and route stay independent.
- No private thesis, build script, or README is included in the served directory.
- Deferred operational work: domain aliases, contact channels, product release links and analytics have no dependency on this site release.

## Open Questions

- Which product journeys should become public demos as evidence matures?
- What contact channel should be exposed when the owner selects one?
- Which research results have a separately reviewed public release?

The website's Lab section exposes the substantive research questions rather than internal workflow metadata.
