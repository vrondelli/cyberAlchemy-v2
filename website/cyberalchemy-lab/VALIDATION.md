# Website validation — 2026-09-14

Scope: the bilingual public website in `public/`, built from the source map in [README.md](README.md).

## Results

- PASS: PT and EN pages, six product tabs, four work-loop tabs, arrow-key navigation, language switching with preserved section, direct product links, and open-question disclosure.
- PASS: desktop and mobile viewport widths 1440, 768, 390 and 320 pixels without horizontal overflow, including all product panels.
- PASS: product and work-loop content remains readable without JavaScript.
- PASS: local image references, internal fragment targets, unique HTML IDs and source-mapped editorial content.
- PASS: Docker Compose configuration and nginx configuration validation before activation.
- PASS: HTTPS root, English page, assets, robots and sitemap return the exact local bytes; `/en` redirects to HTTPS `/en/`.
- PASS: public `/ddd` and `/ddd/en` SHA-256 digests match the pre-deployment digests.

The meaningful browser checks are in [check.cjs](check.cjs). Supply `PLAYWRIGHT_MODULE` for an installed Playwright package, `CHROME_PATH` for Chromium if necessary, and `BASE_URL` for a served site. Optional `OUTPUT_DIR` enables full-page desktop/mobile screenshots. Browser-profile temporary files require free disk space.

## Deployment

Public service: `/srv/cyberalchemy-public-site`, Compose project `cyberalchemy-public-site`, container `cyberalchemy-public-site-site-1`. Only `public/` is served. The website router accepts the explicit root, English, asset, robots and sitemap paths; it does not claim `/ddd` or any subdomain.

Deploy configuration is retained in [deploy/compose.json](deploy/compose.json) and [deploy/nginx.conf](deploy/nginx.conf). To withdraw this new root website, stop its own Compose service. The DDD service remains independent.

## Open Questions

See [README.md](README.md#open-questions). These checks cover this website and its delivery, not the readiness or effectiveness of the products described by it.
