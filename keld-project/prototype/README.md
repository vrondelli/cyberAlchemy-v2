# Keld — ARE alpha, early supporters, illustrated legend & shop

A complete static website combining Keld's studio, six illustrated story scenes,
the full legend, its YouTube film, and the existing Agent Reasoning Engine storefront.

## Open

- `keld-legend-standalone.html`: the entire offline site, opening at the legend.
- `keld-illustrated-standalone.html`: the entire offline site, opening at the studio hero.
- `keld-shop-standalone.html`: the entire offline site, opening at the shop.

These editions embed CSS, JavaScript and artwork. No build, installation or
internet connection is required to read the story in a browser. The film needs
an internet connection: hosted pages load YouTube after Play; offline editions
open the public video in a new tab. License links also lead to external sites.

For static hosting, use `index.html`, `shop.html`, `legend.html` and the `assets/`
folder. To inspect locally: run `python -m http.server 8000` in this directory
and open http://localhost:8000/legend.html. Use `index.html` for the homepage or
`shop.html` for the storefront. Nothing is deployed by opening these files.

## Illustrated experience

The threshold → the archive → the forge → the unmade → the instruments → the
maker's mark. Select a thumbnail, use previous/next, swipe horizontally on a
scene, or use the keyboard. View scene opens an uncropped full-screen dialog.
The slideshow now contains the full popup story, chapter by chapter. Read all
chapters retains the continuous illustrated reader. Both use one prose source.
The film above it uses the new thumbnail and owner-supplied YouTube upload.
See [FILM-INTEGRATION.md](FILM-INTEGRATION.md).
There is no autoplay. See `LEGEND.md` for editing and accessibility details.

## UI review and laptop fit

The September 18 review uses TasteCheck oracle functions and two independent
audits. Laptop scenes show artwork and full text side by side with chapter
controls above them. Media and major landing compositions respect usable screen
height. Phones and zoom keep readable natural reflow. See
[review/RESULTS.md](review/RESULTS.md), [the substrate](review/SUBSTRATE.md), and
[the executed DAG](review/PLAN.md). `assets/ui-review.css` owns these overrides.

## ARE alpha and the first 100 customers

ARE is now explicitly an alpha release. The first 100 customers receive one
calendar year (12 months) of ongoing ARE updates/upgrades as released and direct
support from the maker, starting at purchase. Support covers setup/use questions,
troubleshooting, reporting issues, feedback, and discussions about improvements.
The copy applies the same one-year period to both upgrades and support.

These benefits apply at every accepted price for eligible first-100 customers;
they are not separate license tiers. No release cadence, response-time guarantee,
custom implementation, stable-release date or specific requested feature is
promised. No remaining-place count is invented. The actual support channel has
not been supplied and must be confirmed before sales open.

The product page, institutional engine card and modal, buying notes/FAQ, bag,
checkout, preview download step, and exported preview summary share the offer.
`assets/alpha.css` is a focused visual extension of the existing design.

See `ALPHA-OFFER.md` for launch details and limits on what this prototype does.

## Pricing and delivery, unchanged

The downloadable engine is presented under Apache License 2.0. The default price
is $200 USD. Buyers can pay $50–$1,000, including cents, for the same release and
license. The lower-price range stays hidden until an intentional attempt below
$200; typing a higher amount does not reveal the secret on intermediate digits.
The cart, review, mobile bar and preview summary preserve the chosen price.
See `DISCOVERY.md` and `CHECKOUT-CONTRACT.md` for existing behavior and integration.

## Edit and build

- `index.template.html`: studio, illustrated chapters and full-story reader.
- `assets/legend.css` and `assets/legend.js`: the new illustrated experience.
- `assets/legend/`: six optimized WebP scenes, thumbnails and editorial metadata.
- `shop.fragment.html` and `shop.dialogs.html`: the existing storefront and dialogs.
- `assets/shop-config.js`: pricing and checkout configuration. Keep preview mode.
- `assets/shop.js` and `assets/shop.css`: commerce interactions and styles.
- `assets/alpha.css`: alpha notice, early-supporter offer, and purchase-flow styling.
- `assets/styles.css` and `assets/app.js`: original studio styles and interactions.

Run `python build.py` after editing. Prebuilt files are supplied. No font files,
third-party JavaScript bundles, trackers or remote image dependencies are added.

## Before launch

This remains a local storefront prototype. No actual engine archive, payment
provider, checkout server, verified download delivery or early-supporter
eligibility service is connected. The
preview-summary text file is not an engine, receipt, license key or real order.

Do not substitute a fixed-price checkout link: the buyer-selected price must be
validated server-side. See `LAUNCH.md`, `CHECKOUT-CONTRACT.md` and `RELEASE.md`.
The engine license does not automatically license the website, logo, fictional
narrative or artwork.

## Verification

`QA-legend.json` records 58 passing local Chromium checks for chapters, image
loading, keyboard, modal focus, synthetic touch, responsive layouts and cart
regressions. `QA-discovery.json` records 51 passing hidden-price checks.
These are local browser tests, not production hosting or real-device certification.
`previews/` contains current UI screenshots. See `TESTING.md` to reproduce checks.

## Verification

Run `python qa_alpha.py`, `python qa_discovery.py`, and `python qa_legend.py`
for local browser checks. They require Python Playwright and a Chromium binary
at `/usr/bin/chromium`; neither is needed to view or host the site.

This revision passed 29 alpha-offer checks, 51 hidden-pricing checks, and
58 illustrated-legend checks in local Chromium. JSON reports are included.
The new previews are in `previews/alpha-*.png`. These checks do not test payments,
customer eligibility allocation, actual engine downloads, or support delivery.

## ARE product page connection

The engine section title and Explore the engine link open the existing ARE page,
not the KELD summary dialog. The owner-selected route is `/are/`, backed by
`keld-project/are-documentation`. Navigation does not send a chat message or
invoke a model. The shop remains a separate action.

`python3 build.py` now emits the selected `/are/` route by default. Set
`KELD_ARE_PAGE_URL` only for an explicitly approved alternate HTTPS URL or
root-relative route. All static/offline editions receive the same link. The ARE
application is not copied or embedded in the standalone HTML.

Production hosting and target-environment acceptance remain separately scoped.
