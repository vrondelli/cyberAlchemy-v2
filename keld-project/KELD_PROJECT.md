# Keld — Project Handoff & Local Development Guide

> **KELD · Agent gear.**  
> **Even minds need tools.**

**Prepared:** 17 September 2026  
**Scope:** Keld's institutional website, illustrated legend, and Agent Reasoning Engine storefront.  
**Baseline:** `keld-are-alpha-source.zip`, the latest alpha/early-supporter revision.  
**Status:** Working static prototype. Live commerce, customer entitlements, support routing, and actual engine delivery are not implemented.

**License supersession notice:** Apache-2.0 references in this preserved handoff
and storefront prototype are historical and must not be published as the current
ARE offer. The later owner direction selects candidate custom source-available
terms: selling a redistributed software copy requires new functionality or a
material functional improvement; cosmetic edits, renaming and bug fixes alone
do not qualify. The reseller should make the complete source code of its
qualifying modified version available to verified ARE purchasers at no
charge; no free binaries, future upgrades, or human support are required from
the reseller. Purchase verification, final legal text and
distribution-rights review remain open before sale. See the
[resale/share-back decision](docs/decisions/ARE-RESALE-SHAREBACK-2026-09-21.md)
and [candidate license clauses](docs/ARE-LICENSE-CANDIDATE.md).

## Start here

This document is the project brief, implementation specification, and handoff for continuing locally. It is not just a summary of the design conversation.

The accompanying `keld-project-starter.zip` contains this document and all 58 files from the latest source package under `prototype/`, including the logo, six illustrated scenes, editable templates, styles, JavaScript, build script, and browser checks. Those source files have not been rewritten for this handoff.

**The package is the website, not the Agent Reasoning Engine source code or a release of the engine.** Do not sell or deliver this website archive as ARE.

Recommended sequence: run the existing prototype, commit a baseline, preserve its behavior with tests, then make the production implementation. Do not replace the developed identity with a generic template.

### Contents

1. [Run the project on your PC](#1-run-the-project-on-your-pc)
2. [Confirmed decisions and working assumptions](#2-confirmed-decisions-and-working-assumptions)
3. [Existing source map](#3-existing-source-map)
4. [Brand, copy, and illustrated legend](#4-brand-copy-and-illustrated-legend)
5. [Pages and experiences to preserve](#5-pages-and-experiences-to-preserve)
6. [Pricing and the hidden shelf](#6-pricing-and-the-hidden-shelf)
7. [Alpha offer and the first 100 customers](#7-alpha-offer-and-the-first-100-customers)
8. [Recommended production architecture](#8-recommended-production-architecture)
9. [Checkout, delivery, and customer records](#9-checkout-delivery-and-customer-records)
10. [Release preparation and licensing boundaries](#10-release-preparation-and-licensing-boundaries)
11. [Testing and acceptance criteria](#11-testing-and-acceptance-criteria)
12. [Implementation milestones](#12-implementation-milestones)
13. [Decisions still needed before sales](#13-decisions-still-needed-before-sales)
14. [First task for a coding assistant](#14-first-task-for-a-coding-assistant)
15. [Sources and handoff verification](#15-sources-and-handoff-verification)

---

## 1. Run the project on your PC

### 1.1 Preferred environment: Windows + WSL Ubuntu

Use your existing WSL Ubuntu / VS Code workflow. Keep the working repository in the Linux filesystem, for example `~/projects/keld-project`, rather than running Linux tooling against a project under `/mnt/c`. Microsoft's WSL guidance recommends keeping project files in the filesystem corresponding to the tools doing the work. [S1]

Download `keld-project-starter.zip`. Extract its `keld-project` folder into `~/projects/`. You can use Windows Explorer to copy the folder into WSL, or use the commands below.

**Run inside WSL Ubuntu, not PowerShell.** The example discovers the normal Windows Downloads directory. A relocated Downloads folder requires changing `DOWNLOADS`. Use a new destination; do not extract over an existing project with local changes.

```bash
# Check the tools needed for the supplied static prototype.
python3 --version
git --version

# Locate the normal Windows Downloads folder from WSL.
WIN_PROFILE="$(powershell.exe -NoProfile -Command '$env:USERPROFILE' | tr -d '\r')"
DOWNLOADS="$(wslpath "$WIN_PROFILE")/Downloads"

mkdir -p "$HOME/projects"

# The archive itself contains a top-level keld-project/ folder.
if [ -d "$HOME/projects/keld-project" ]; then
  echo "Destination exists. Use a new folder to avoid overwriting your work."
else
  python3 -m zipfile -e \
    "$DOWNLOADS/keld-project-starter.zip" \
    "$HOME/projects"
fi
```

After extracting, open a WSL terminal in the project:

```bash
cd ~/projects/keld-project
code .

# Build all three page entry points and their offline editions.
python3 -X utf8 prototype/build.py

# Serve only the website folder, on the local machine.
python3 -m http.server 8000 --bind 127.0.0.1 --directory prototype
```

Open these addresses in your browser:

```text
http://localhost:8000/              Studio homepage
http://localhost:8000/shop.html     ARE alpha storefront
http://localhost:8000/legend.html   Illustrated legend
```

Keep that terminal open while previewing. `Ctrl+C` stops the server. After editing source templates, run the build again in another terminal, then refresh the browser.

The Python server is for local development, not production hosting. [S2]

### 1.2 Native Windows alternative

Extract `keld-project-starter.zip` using Explorer and open PowerShell in the extracted `keld-project` folder. With Python 3 installed and its Windows launcher available:

```powershell
py -3 --version
py -3 -X utf8 .\prototype\build.py
py -3 -m http.server 8000 --bind 127.0.0.1 --directory .\prototype
```

Use the same localhost addresses. The UTF-8 switch avoids platform-default encoding problems with the story's punctuation and symbols. Keep Windows and WSL dependency installations separate; do not share a virtual environment or `node_modules` between them.

### 1.3 No-install viewing

The following files open directly in a browser:

```text
prototype/keld-illustrated-standalone.html  Homepage first
prototype/keld-shop-standalone.html         Shop first
prototype/keld-legend-standalone.html       Legend first
```

They embed the styles, scripts, and imagery. They are useful references and offline previews, **not the preferred files to edit**.

### 1.4 Establish a baseline

From `keld-project/`, create a `.gitignore` before the first commit:

```gitignore
# Local secrets: never commit real credentials.
.env
.env.*
!.env.example

# Local tools and generated production output.
.venv/
node_modules/
.astro/
web/dist/
__pycache__/
*.pyc

# Local test artifacts.
playwright-report/
test-results/

# Operating-system files.
.DS_Store
Thumbs.db
```

Then review the staged files and commit:

```bash
git init
git add .
git diff --cached --stat
git status
# After checking that no credentials or private engine files are staged:
git commit -m "Preserve Keld alpha website baseline and project brief"
```

No remote repository, deployment, payment account, or domain is created by these commands. Keep the initial baseline recoverable while refactoring.

---

## 2. Confirmed decisions and working assumptions

### Confirmed product direction

| Area | Requirement |
| --- | --- |
| Studio | **Keld**, not Nalth or Aethril. |
| Category | **Agent gear**: tools and systems for people building AI agents. |
| Product | **Agent Reasoning Engine**, abbreviated **ARE**. |
| Product maturity | **Alpha**, clearly disclosed before purchase. |
| Delivery | Downloadable software, not access to a hosted engine. |
| License direction | Apache-licensed software. |
| Starting price | **$200 USD**, one-time purchase. |
| Buyer-selected range | **$50–$1,000 USD**, inclusive; custom cents supported. |
| Price discovery | Values below $200 are initially hidden and revealed through intentional exploration. |
| Equal product | Every accepted price gets the same release and software license. |
| Early-customer program | First **100 customers** receive one year of ongoing upgrades and direct maker support. |
| Support purpose | Questions, troubleshooting, feedback, discussing improvements, and related product conversations. |
| Visual identity | The selected geometric emblem with a central hexagon and fitted outer forms. |
| Story | Keld as a legendary artificer; the real studio carries the workshop's name. |
| Legend presentation | Six existing generated scenes integrated into a navigable sequence and full illustrated reader. |

### Interpretations already applied in the prototype

Retain these while implementing, but get explicit owner approval before publishing binding purchase terms:

- The Apache version is **Apache License 2.0**. The original request said Apache; the prototype adopted 2.0.
- Both upgrades **and direct support** last 12 calendar months, starting at verified purchase—not the future stable release.
- The first-100 benefits apply at every accepted price, including discovered lower prices.
- Upgrades are included as released. No release cadence, stable-release date, response-time guarantee, custom development commitment, or implementation of every suggestion is promised.
- No subscription or automatic renewal is included. Arrangements after the first year remain undefined.
- The displayed buyer-selected amount is the product subtotal. Tax treatment and final-total presentation must be decided for the real merchant.

### Not established

There is no verified ARE repository, release version, installation command, supported-runtime matrix, benchmark, or technical feature inventory in the supplied website package. Do not invent these from the artwork or the phrase “reasoning engine.” The hosting provider, payment provider, support address, and merchant details are also unselected.

---

## 3. Existing source map

Paths below are relative to `prototype/` in the starter bundle.

| File or directory | Purpose and editing rule |
| --- | --- |
| `index.template.html` | Main editable studio template, illustrated chapters, full legend, and reading-room content. |
| `shop.fragment.html` | Product page, alpha offer, pricing controls, buying notes, and FAQ. |
| `shop.dialogs.html` | Bag, checkout review, preview delivery, and other shop dialogs. |
| `assets/shop-config.js` | Public product/pricing configuration and preview/live gates. Never place secrets here. |
| `assets/shop.js` | Pricing, discovery, bag state, checkout preview, and guarded checkout request. |
| `assets/shop.css` | Storefront, pricing, bag, and checkout styling. |
| `assets/alpha.css` | Alpha notice and first-100 offer styling. |
| `assets/styles.css` / `assets/app.js` | Original studio styles, navigation, and general interactions. |
| `assets/legend.css` / `assets/legend.js` | Illustrated sequence, viewer, keyboard/touch interaction, and reader styling. |
| `assets/legend/*.webp` | Six optimized scenes and corresponding thumbnails. |
| `assets/legend/chapters.json` | Editorial metadata reference. **Not currently consumed by the build or runtime.** |
| `assets/keld-mark.svg` / `assets/keld-wordmark.svg` | Brand artwork. Preserve the chosen mark. |
| `assets/symbols.txt` | Inline SVG symbol definitions used by the build. Keep relevant brand edits consistent here. |
| `assets/artifact.svg` | Technical/artistic instrument illustration, not a real product render. |
| `build.py` | Standard-library Python builder, using paths relative to its own location. |
| `index.html`, `shop.html`, `legend.html` | Generated modular pages. Edit source templates, then rebuild. |
| `keld-*-standalone.html` | Generated offline editions with embedded assets. Do not hand-edit. |
| `qa_alpha.py`, `qa_discovery.py`, `qa_legend.py` | Local browser regression scripts; portability note in Section 11. |
| `QA-*.json` / `previews/` | Existing reports and reference screenshots, not proof of production readiness. |

Additional implementation notes already exist: `ALPHA-OFFER.md`, `DISCOVERY.md`, `CHECKOUT-CONTRACT.md`, `LEGEND.md`, `RELEASE.md`, `LAUNCH.md`, and `TESTING.md`.

Some older notes describe files as “unchanged” relative to an earlier revision. Treat those as historical statements. The alpha source and the decisions in this handoff are the current baseline.

**Important:** editing `chapters.json` alone will not change the visible legend. Today, update the corresponding template text too. In a future content refactor, generate all chapter views from one canonical content source.

---

## 4. Brand, copy, and illustrated legend

### Positioning

Keld makes the equipment that makes agents more capable. It is an independent maker's workshop, not a generic AI consultancy and not a marketplace of imaginary tools.

Primary language:

> **KELD**  
> **Agent gear.**  
> **Even minds need tools.**

Studio explanation:

> We build agent gear—tools and systems for people building AI agents.

The mythology uses **Hoarder of Secrets**, **Cyber Blacksmith**, and **Keeper of the Unmade**. Keld collects overlooked knowledge, shapes it into instruments, and equips other minds rather than thinking in their place.

The narrative is original fiction. Keep that distinction visible. The engine and purchase terms must be explained in straightforward language.

### Visual direction

Preserve the existing dark workshop entrance, warm-paper workbench/shop, graphite and forest-dark shadows, copper accents, precise diagrams, and editorial typography. Do not redesign it into neon gradients, robot mascots, or a standard SaaS landing page.

Current core design tokens from `assets/styles.css`:

```css
:root {
  --ink: #242a23;
  --dark: #171d19;
  --paper: #f3f1e8;
  --paper-deep: #e9e7dc;
  --copper: #d0a07a;
  --copper-dark: #946242;
  --light: #f1eddf;
  --sans: Arial, Helvetica, sans-serif;
  --serif: Georgia, "Times New Roman", serif;
  --mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
```

Retain the actual type hierarchy and spacing from the CSS, not just these colors. Existing typography uses system fonts; there are no bundled font files to install.

### Six-scene story sequence

| Order | Scene | Narrative role | Image |
| --- | --- | --- | --- |
| 01 | The Threshold | Discover the workshop of Keld. | `assets/legend/01-threshold.webp` |
| 02 | The Archive | Hoarder of Secrets: knowledge rescued from forgotten attempts. | `assets/legend/02-archive.webp` |
| 03 | The Forge | Cyber Blacksmith: understanding made into an instrument. | `assets/legend/03-forge.webp` |
| 04 | The Unmade | Keeper of the Unmade: unfinished ideas waiting for their moment. | `assets/legend/04-unmade.webp` |
| 05 | The Instruments | Tools prepared for another mind. | `assets/legend/05-instruments.webp` |
| 06 | The Maker's Mark | Completion; “Even minds need tools.” | `assets/legend/06-makers-mark.webp` |

Keep the existing artwork. Its hooded maker remains anonymous, and its world uses warm copper light, dark stone, archives, schematics, and carefully made mechanisms.

Required interactions: chapter thumbnails, previous/next, keyboard navigation, horizontal swipes without trapping vertical scroll, a full uncropped scene viewer, and a complete illustrated reader. No autoplay or forced audio. Honor reduced motion and restore focus when dialogs close.

The pictured memory capsules, keys, and other artifacts are narrative objects. They must not become product promises or additional shop listings without real products behind them.

---

## 5. Pages and experiences to preserve

**Homepage:** brand, workshop hero, “Even minds need tools,” agent-gear explanation, featured ARE alpha, illustrated legend, studio principles, field notes, and contact route.

**Shop/product:** ARE description, alpha disclosure, artwork gallery, buyer-selected price, hidden-shelf behavior, downloadable delivery, Apache presentation, first-100 offer, buying notes, and FAQ. One real offer; no Individual/Team licensing tiers.

**Legend:** six-scene visual progression plus full prose, not just a gallery detached from the story.

**Bag and checkout:** preserve the chosen price, disclose alpha status and actual first-100 eligibility, distinguish subtotal/taxes/total, and never imply that a preview is a completed order.

**Contact:** a useful route for product questions and collaboration. The current form prepares a draft; it is not connected to delivery. Do not show “message sent” until an implemented service accepts it.

**Future customer access:** purchase recovery, authorized downloads, available upgrades, benefit expiry, and a real direct-maker support destination. This is proposed functionality, not present in the prototype.

**Future legal pages:** purchase terms, privacy, refunds, and a clear software-license explanation. Drafts require review against the actual merchant and service; do not publish invented legal details.

Keep direct entry points working and add redirects if production routes change. Do not make every page depend on opening a modal or knowing a fragment identifier.

---

## 6. Pricing and the hidden shelf

### Canonical values

Use integer USD cents for storage, validation, and payment creation:

```ts
export const ARE_PRICING = {
  currency: "USD",
  baseCents: 20_000,
  minimumCents: 5_000,
  maximumCents: 100_000,
  presetsCents: [5_000, 10_000, 20_000, 50_000, 100_000],
  quantity: 1,
} as const;
```

This is a proposed TypeScript representation of existing values, not a new pricing policy. Existing public configuration lives in `assets/shop-config.js`.

### Initial state

Start at **$200**. Show **$200, $500, and $1,000** presets and a visible slider range of **$200–$1,000**. Do not advertise the $50 floor through helper text, FAQ, bag copy, or accessible labels before discovery.

### Discovery

Reveal the lower range only after an intentional attempt below $200: pressing minus at the base price, dragging left beyond the starting boundary, supported keyboard decrease actions, or committing a lower custom amount. Editing the bag can also trigger discovery.

After revealing:

> **You found the hidden shelf.**  
> A quieter price. The same instrument.

Show the $50 and $100 presets and extend the slider to $50. Keep arbitrary valid amounts with up to two decimal places. A sub-$50 attempt can reveal the shelf, but the amount remains invalid.

### Input and state rules

Maintain distinct draft text, committed amount, validation state, and discovery state. Typing `1000` passes through `1`, `10`, and `100`; those intermediate characters must **not** reveal the shelf. Commit on Enter, blur/Tab, or an intentional purchase/review action.

A purchase click must not be lost because revealing the panel shifts the layout. Commit, validate, reveal when appropriate, and then continue the intended action.

Resetting returns the amount to $200 without re-hiding the shelf during the current visit. A fresh visit starts hidden, except that a valid restored below-base session cart represents an already discovered price.

Keep amounts synchronized across input, slider, presets, purchase button, mobile bar, bag, checkout, and confirmation. Do not silently round fractional cents, coerce an empty string to zero, or fall back to $200 for invalid input.

The server accepts **5,000–100,000 integer cents** regardless of any client discovery flag. The hidden shelf is an Easter egg, not an authorization boundary or confidential value. Keep it out of initial UI copy, but do not pretend browser-source values are secret.

---

## 7. Alpha offer and the first 100 customers

### Public offer copy

> **The first 100.**  
> **A year at the workbench.**
>
> Start with the alpha. Stay close to what it becomes.
>
> The first 100 customers receive the downloadable ARE alpha, one year of ongoing upgrades as they are released, and direct support from the person building it.

Personal message:

> “I'm building ARE, and I'll be the person you speak to. Bring your questions, the rough edges, and your ideas for what it could become.”

Support covers setup and usage questions, troubleshooting, reporting issues, discussing improvements, and sharing feedback. It is not a promise of unlimited bespoke engineering.

### Disclosure and consistency

State that ARE is alpha before purchase: bugs, unfinished areas, and breaking changes are possible. Encourage testing in the buyer's environment. Do not label it production-ready, invent a release number, or imply a guaranteed stable version during the included year.

Repeat the actual offer consistently in the product card, detailed offer, FAQ, bag, checkout, receipt, and customer access area. A lower selected price must not remove support or upgrades for an eligible first-100 customer.

### Eligibility implementation requirements

These are production safeguards, not existing backend features:

- Count eligible **customers**, not tabs, bag additions, orders from the same person, webhook deliveries, or downloads.
- Assign and persist a stable customer identity. Decide how individual/team purchases and duplicate emails map to a customer before launch.
- Store the offer version, verified purchase timestamp, included benefits, and expiry on the order/entitlement record.
- Use a transactional capacity check. Two simultaneous buyers near the cap must not receive unsupported promises.
- Establish any checkout reservation server-side with expiry and cancellation handling. A bag does not reserve a place.
- Make eligibility and inclusion clear before payment. If availability changes, require a new review instead of silently removing benefits.
- Grant entitlements only after verified successful payment, idempotently. Repeat purchases must not consume extra places or silently restart the year.
- After the cap, stop advertising the first-100 benefits as available. Do not invent a subsequent support policy.
- Resolve refunds, cancellations, delayed payments, failed reservations, and whether any places can be reused before taking payments.

Use calendar-month arithmetic for the proposed 12-month term, with an explicit timezone and tested leap-day/month-end handling. Display an exact expiry date to the customer. The end of a service period must not be treated as the end of the Apache software license. [S3]

Do not display a remaining-places counter until it has an authoritative source. There is no confirmed current customer count.

---

## 8. Recommended production architecture

**Recommendation, not an already implemented stack:** Astro + TypeScript for a content-first site, retaining ordinary CSS and using client components only where interaction needs them. React is optional for the more complex shop state; it is not necessary for every page. Astro supports a mostly static site with selectively hydrated interactive components. [S4]

Start with one repository. Avoid a monorepo, CMS, elaborate dashboard, custom payment form, or multiple microservices unless a concrete need appears.

### Suggested organization

```text
keld-project/
├── KELD_PROJECT.md             # This specification
├── prototype/                 # Existing working baseline; all source/assets included
├── web/                       # Proposed production app; not scaffolded in this bundle
│   ├── public/                # Public-only assets; never engine archives or secrets
│   ├── src/
│   │   ├── assets/            # Brand and optimized illustration assets
│   │   ├── components/        # Header, gallery, PriceSelector, Bag, AlphaOffer, etc.
│   │   ├── content/           # Legend and field notes
│   │   ├── config/            # Typed public product and brand data
│   │   ├── layouts/
│   │   ├── lib/               # Price parsing and state rules, shared validation
│   │   ├── server/            # Orders, payments, entitlements, delivery
│   │   ├── pages/             # Public pages plus API endpoints where supported
│   │   └── styles/
│   ├── tests/
│   ├── .env.example           # Names/placeholders only
│   └── package.json
└── docs/                      # Later decisions, runbooks, and release process
```

Static hosting is sufficient for the public pages, but it does **not** execute a checkout API. A live shop needs a server runtime/appropriate Astro adapter or a separate backend exposed through the same origin. Select this deliberately with the hosting provider. [S5]

Suggested commerce infrastructure: a small transactional database, a hosted payment page, private release storage, and transactional email. PostgreSQL is a reasonable database choice; the specific providers remain open. Keep provider code behind a small interface instead of coupling pricing and customer eligibility to UI components.

### Scaffold only after preserving the baseline

Use a supported Node.js LTS release meeting the chosen Astro version's requirements. At this handoff, Node's official site lists the 24.x line as LTS and Astro's installation page requires Node 22.12.0 or later, excluding odd-numbered releases. Record the actual installed versions and commit the dependency lockfile. [S6] [S7]

```bash
# From keld-project/, with Node and npm already available inside WSL:
node --version
npm --version

# Create the production app in web/, never over prototype/.
npm create astro@latest -- --template minimal
# In the wizard, choose ./web as the destination and install dependencies.

cd web
node --version > .nvmrc
npm run dev
```

This creates an empty starter, **not a migration of Keld**. Port existing sections and styling deliberately. Use the scripts generated by the chosen version, verify them, and keep the runtime requirement documented. On later clean installs, use the committed lockfile with `npm ci`.

Do not add production endpoints or credentials merely to make a preview button appear active. The first production milestone should still use explicitly labeled checkout simulation.

---

## 9. Checkout, delivery, and customer records

### Existing preview/live gates

The current `assets/shop-config.js` intentionally contains:

```js
mode: 'preview',
approvedForSale: false,
fulfillmentReady: false,
earlySupporter: {
  customerLimit: 100,
  upgradesMonths: 12,
  directSupportMonths: 12,
  periodStarts: 'verified-purchase',
  entitlementReady: false
}
```

The endpoint, real release information, policy URLs, and contact email are not configured. Keep the gates closed until their services exist and are verified. Flipping flags does not implement payments, assign a customer place, or deliver support.

### Checkout creation contract

The existing frontend expects a same-origin HTTPS endpoint such as `POST /api/checkout`:

```json
{
  "productId": "agent-reasoning-engine",
  "offerId": "release",
  "amountCents": 20000,
  "currency": "USD",
  "quantity": 1
}
```

Successful response:

```json
{
  "checkoutUrl": "https://PAYMENT-PROVIDER.example/created-checkout-session"
}
```

That URL is illustrative, not a configured service. Failures must return an appropriate non-success response and a usable error; the bag must preserve the selected price for retry.

The server must use its own trusted product configuration; require an integer amount within bounds, USD, the correct product and offer, and quantity 1. Treat every browser value as untrusted. Use safe money parsing, request-size limits, rate limiting, origin checks as appropriate, and idempotency for checkout creation.

Create a payment session reflecting the buyer's exact selected subtotal. A fixed-price payment link that replaces it with $200 is not compatible with this flow. Show applicable taxes and the final total before charging. Persist the price, release, terms version, and offer snapshot before redirecting.

Never accept an arbitrary return/checkout destination from the browser. Use server-configured return locations and the real provider's HTTPS checkout destination. Do not include private download URLs in the checkout-creation response.

### Verified fulfillment

Recommended sequence:

```text
Buyer selects amount and reviews the offer
  -> server validates and creates pending order / eligibility reservation
  -> hosted payment page displays the actual final charge
  -> verified provider payment event
  -> idempotent transaction records payment and eligible customer benefits
  -> durable delivery/email job
  -> authorized release download and support information
```

A success URL, client-side storage, or an open checkout window is not proof of payment. Verify the payment's order association, status, currency, and expected amount/tax breakdown on the server. Account for asynchronous payments, retries, and out-of-order notifications. Stripe's documentation provides a concrete example of signature verification, duplicate-event handling, and webhook-based fulfillment; Stripe itself has not been selected for Keld. [S8] [S9]

Keep the merchant's official release archive outside public site assets. Provide authorized access through short-lived download links, with secure recovery when a link expires. That controls the delivery service; it does not remove Apache redistribution rights. Never log full access tokens or collect payment-card data in this website.

### Minimal records to design

| Record | Purpose |
| --- | --- |
| Customer | Stable purchaser identity and recovery destination. |
| Release | Real version, artifact location, checksum, publication time, license and release notes. |
| Order | Selected amount, currency, price/tax breakdown, status, release and offer/terms snapshot. |
| Payment event | Provider event/session IDs, verification and processing status; uniqueness for idempotency. |
| Early-supporter allocation | Customer, program version, reservation/confirmed status, and capped allocation. |
| Entitlement | Upgrade/support scope, purchase start, expiry, and state. |
| Delivery job | Retryable notification/delivery attempt independent of the payment response. |

Enforce uniqueness and the capacity limit in trusted storage, not JavaScript. Provide an operator recovery process for paid orders whose confirmation or download email fails.

---

## 10. Release preparation and licensing boundaries

The intended Apache 2.0 license allows use, modification, and redistribution subject to its terms; recipients can redistribute the software, including commercially. The software rights are distinct from paid distribution and additional support obligations. Do not create seat restrictions or a one-year software-use expiry while presenting the same work as Apache 2.0. [S3] [S10]

The commercial offer is the official downloadable release and the stated early-customer services—not exclusive rights to the software. Do not imply that only a $200 purchaser may use ARE commercially.

Prepare the **actual engine** package separately:

```text
ARE release archive (proposed contents; not supplied here)
├── actual engine source and/or distributable files
├── README with tested requirements, installation, and one real example
├── LICENSE with the applicable unmodified license text
├── NOTICE / third-party notices where applicable
├── CHANGELOG or release notes
└── version and known alpha limitations
```

Audit ownership and dependencies, preserve required notices, identify the covered work, and use the real copyright owner's name. Generate the checksum and archive size from the real artifact, never from an example. Apache's application guidance and redistribution requirements are the relevant references. [S3] [S10]

Keep the ARE license scope separate from the website, logo, story, and illustrations. Do not automatically place all studio assets under Apache just because the engine uses it. Do not imply Apache Software Foundation authorship, affiliation, or endorsement. [S3] [S10]

Confirm upgrade distribution, notices, support access, download recovery, and post-year-one access policy before sale. Already granted software rights do not expire simply because included services end. Legal/purchase policies still need review for the actual merchant and markets.

---

## 11. Testing and acceptance criteria

### 11.1 Run the existing browser checks

The current source tests use Python Playwright but hard-code `executable_path='/usr/bin/chromium'`. That path belonged to the previous execution environment; it is not portable to a typical PC.

For local use, create a virtual environment from the project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install playwright
python -m playwright install chromium
```

On Linux, missing browser-system libraries can be installed with the documented `python -m playwright install --with-deps chromium` command; it can request administrator access. On Windows, use `py -3 -m venv .venv`, then call `.venv\Scripts\python.exe` for pip, browser installation, and the scripts. [S11]

Before running the checks, update the launch call in these **local copies**:

```text
prototype/qa_alpha.py
prototype/qa_discovery.py
prototype/qa_legend.py
prototype/capture_legend.py
```

Replace the container-specific launch expression with:

```python
p.chromium.launch(headless=True)
```

Keep each existing assignment name (`b` or `browser`). Remove the hard-coded executable and container-specific arguments, rather than replacing them with another personal machine path. Playwright can then use its installed browser. [S11]

Run:

```bash
python -X utf8 prototype/build.py
python -X utf8 prototype/qa_alpha.py
python -X utf8 prototype/qa_discovery.py
python -X utf8 prototype/qa_legend.py
```

The portability edit above is **documented, not applied to the preserved source bundle**. The included historical reports record 29 alpha, 51 discovery, and 58 legend checks. They are not certification of your machine, real devices, live payments, or delivery.

Those scripts render embedded pages with `set_content`. Add served-route tests against localhost in the production project to cover navigation, network asset loading, and future API integration. Never weaken a correct requirement just to make an old selector pass after refactoring.

### 11.2 Frontend regression checklist

- [ ] Initial price is $200; lower presets/copy remain hidden, including accessible text.
- [ ] Typing 500 or 1000 does not reveal the shelf on intermediate digits.
- [ ] Committing 125.25 reveals it and preserves $125.25 through bag and review.
- [ ] Minus at $200 reveals the shelf; reset returns to $200 without hiding it.
- [ ] $50 and $1,000 work; 49.99, 1000.01, empty, negative, and fractional-cent values fail clearly.
- [ ] Purchase/review clicks survive reveal-induced layout changes.
- [ ] First-100 service copy and alpha disclosure remain consistent at every valid price.
- [ ] All six scenes load; thumbnails, arrows, keyboard, swipes, viewer, and reader work.
- [ ] Vertical mobile scrolling is not hijacked; dialogs restore focus on close/Escape.
- [ ] No horizontal overflow at 320, 390, 768, 1024, 1440, and 1920 pixels.
- [ ] Reduced motion remains readable; no forced animation or sound.
- [ ] Shop, legend, and homepage entry URLs load independently.
- [ ] Preview actions never claim a real payment, allocated place, or engine delivery.

### 11.3 Production commerce checklist

- [ ] Reject manipulated product, offer, currency, quantity, and amounts server-side.
- [ ] Provider checkout receives the exact selected subtotal and discloses final charges.
- [ ] Double submissions/retried notifications do not create duplicate fulfillment or places.
- [ ] Two eligible buyers racing for the final place cannot both be promised it incorrectly.
- [ ] Repeat customers do not consume extra places or reset the service period.
- [ ] Cancelled, delayed, failed, refunded, and disputed payments follow approved rules.
- [ ] No software delivery based solely on a return URL or browser state.
- [ ] Paid-order email failure is retryable without charging again.
- [ ] Unauthorized and expired download links fail safely; recovery works.
- [ ] Upgrade/support expiry is tested at exact boundaries, leap days, and month ends.
- [ ] Contact and support messages reach the real destination.
- [ ] Real customer data, secrets, archives, and tokens are absent from public bundles/logs.

---

## 12. Implementation milestones

### Milestone 0 — Establish the local baseline

Run the prototype; inspect all entry points; commit source and this brief; fix test-browser portability in a separate commit; capture local results. **Done:** another developer can reproduce the preview from a clean checkout.

### Milestone 1 — Organize the production frontend

Create the chosen app structure, centralize product/offer content and pricing, and port existing sections without changing visual direction. Generate the six chapter views from one content source. Preserve legacy entry routes with redirects as needed. **Done:** frontend acceptance checks pass and the comparison with the prototype is reviewed on desktop and mobile.

### Milestone 2 — Prepare the real ARE release and offer

Supply the engine repository/archive, real alpha version, verified installation and example, known limitations, attribution, checksum, direct-support channel, and approved purchase/service terms. **Done:** a test user can install the actual release and understand exactly what purchase includes.

### Milestone 3 — Implement test-mode commerce

Build validation, hosted checkout, payment verification, customer identity, capped entitlements, private delivery, and notification retries. Run provider test-mode cases, including the first-100 race conditions. **Done:** the complete test purchase reaches the correct downloadable artifact with consistent price and service details.

### Milestone 4 — Launch deliberately

Confirm merchant/domain configuration, policies, backups, support readiness, production secrets, logging, and payment/fulfillment recovery. Remove misleading preview labels only after real replacements work. Do not deploy the whole development folder: publish only intended pages/assets and supported server code, excluding tests, local reports, environment files, and internal notes. **Done:** real checkout and delivery have been verified end-to-end and there is an operator runbook.

No milestone requires redesigning the logo, changing the legend, introducing subscription tiers, or inventing ARE features.

---

## 13. Decisions still needed before sales

| Decision | What must be supplied or approved |
| --- | --- |
| Engine release | Repository, real alpha version, archive, contents, requirements, example, limitations, checksum. |
| Merchant and domain | Seller identity, public business details, chosen domain and hosting account. |
| Payments | Provider/account, supported checkout flow, taxes/invoices, refund handling. |
| Apache scope | Confirm version 2.0 and the actual files/third-party components it covers. |
| Support channel | Real destination and practical way eligible customers contact the maker. |
| Service term | Confirm 12 months for both services, starting at verified purchase. |
| First-100 policy | Stable customer identity, duplicate/team purchases, reservations, delayed payments, refunds and cap behavior. |
| Upgrade access | How releases are distributed, recovery/re-download access, and what changes after year one. |
| Data handling | Customer data collected, retention, recovery/security, and actual privacy policy. |
| Post-cap sales | Whether/how sales continue once the 100-customer program is full. |

These are launch blockers, not blockers to starting development. Build provider-neutral boundaries and keep unresolved choices visible instead of silently guessing.

---

## 14. First task for a coding assistant

Use this with the document and source in the same local workspace:

```text
Read KELD_PROJECT.md and inspect prototype/ before changing anything.

This is Keld's institutional website and ARE storefront, not the ARE engine
implementation. Continue the existing work; do not replace it with a new design.

First objective:
1. Verify the supplied build and the homepage, shop, and legend entry points.
2. Inspect the current templates, styles, shop-config, pricing/discovery logic,
   legend assets, alpha offer, and tests.
3. Make the local test-browser configuration portable and run the existing
   checks. Preserve the original baseline in Git.
4. Propose a small, maintainable implementation structure. Use the recommended
   Astro/TypeScript direction unless this repository already has another chosen
   production stack. Treat prototype/ as the visual/behavioral reference.
5. Implement the frontend foundation and preserve one complete user journey
   before connecting any live service.

Non-negotiables:
- Keep the selected hexagonal Keld mark, workshop atmosphere, and six scenes.
- ARE is downloadable alpha software, presented as Apache 2.0 in the baseline.
- Default price $200 USD; accepted range $50-$1,000, integer cents internally.
- Lower prices stay hidden until an intentional below-$200 attempt.
- Typing 1000 must not unlock the shelf through intermediate digits.
- Same release/license and eligible first-100 benefits at every accepted price.
- First 100 customers: a year of upgrades as released and direct maker support.
- No invented benchmarks, engine features, sales counts, support addresses,
  production readiness, release schedule, or service guarantees.
- Keep preview mode. No fake payment success, entitlements, or engine downloads.
- Preserve keyboard access, reduced motion, mobile behavior, and modal focus.

Deliver:
- Source changes in small, reviewable steps.
- Reproducible local commands.
- Tests for preserved behavior and a clear report of failures or limitations.
- A list of remaining production/merchant decisions.

Start with the local baseline and frontend organization. Do not enable live
payments, deploy publicly, or change the commercial offer without authorization.
```

---

## 15. Sources and handoff verification

### Project sources

The primary project source is the user-approved conversation direction together with the latest website package. The more specific current requirements—alpha, first-100 services, hidden prices, and illustrated legend—supersede early naming and layout explorations.

Original archive:

```text
keld-are-alpha-source.zip
SHA-256: 754291746383efa225ba7b74879de1fc749511f064b9c01e362e46e77e8a3fb0
```

For this handoff, the source archive was inspected and its `build.py` executed successfully. Rebuilding reproduced the supplied generated files byte-for-byte. The modular homepage, shop, and legend had no missing local asset references or duplicate element IDs in the static check; local HTTP responses were checked for the pages and representative assets.

The starter bundle relocates the original archive's `keld-alpha/` contents to `prototype/` without changing their file contents. It adds this brief; it does not create an Astro app, commerce backend, payment account, actual ARE release, or deployed website. The historical UI test reports remain historical unless rerun locally.

### Official technical references

URLs are provided for implementation verification. Provider details can change; check the relevant documentation when wiring live systems.

| Ref | Source | URL |
| --- | --- | --- |
| S1 | Microsoft Learn — Working across file systems in WSL | `https://learn.microsoft.com/en-us/windows/wsl/filesystems` |
| S2 | Python — `http.server`, including local CLI use and production warning | `https://docs.python.org/3/library/http.server.html` |
| S3 | Apache Software Foundation — Apache License 2.0, especially Sections 2, 4, 6, and 9 | `https://www.apache.org/licenses/LICENSE-2.0` |
| S4 | Astro — Islands architecture | `https://docs.astro.build/en/concepts/islands/` |
| S5 | Astro — On-demand rendering and server adapters | `https://docs.astro.build/en/guides/on-demand-rendering/` |
| S6 | Node.js — Current release/LTS information | `https://nodejs.org/` |
| S7 | Astro — Install and setup | `https://docs.astro.build/en/install-and-setup/` |
| S8 | Stripe — Webhook verification and event handling | `https://docs.stripe.com/webhooks` |
| S9 | Stripe — Checkout fulfillment | `https://docs.stripe.com/checkout/fulfillment` |
| S10 | Apache Software Foundation — Licensing and Distribution FAQ | `https://www.apache.org/foundation/license-faq.html` |
| S11 | Playwright Python — Installing and managing browsers | `https://playwright.dev/python/docs/browsers` |

**Working principle:** preserve what makes Keld distinctive; make the software offering clear; implement the commercial promises before accepting payment.
