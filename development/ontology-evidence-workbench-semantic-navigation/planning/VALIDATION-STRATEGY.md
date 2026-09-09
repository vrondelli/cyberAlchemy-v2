# Validation Strategy

Status: planned; execution evidence pending

## Planning package validation

```bash
python3 -m json.tool cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/design/DESIGN-SCOPE-MANIFEST.json
python3 -m json.tool cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/design/DESIGN-DENOMINATOR-RECEIPT.json
python3 -m json.tool cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/design/DESIGN-SELECTION-RESULT.json
python3 -m json.tool cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/SWU-MANIFEST.json
python3 -m json.tool cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/CLOSEOUT-SYNC-INVENTORY.json
bash tools/check_markdown_links.sh cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/WORK-PACK.md
git diff --check -- cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation
```

Dispatch Spec, Design denominator and Design selection use their canonical
repository scripts. Validation also checks unique SWU IDs, one parent per SWU,
all task links, dependencies, exact closeout coverage and no task-shaped unit.

## Per-SWU implementation validation

Every product SWU runs from
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/`:

1. `node --check` for changed scripts;
2. focused `node --test <exact changed test files>`;
3. `node --test` for the complete implementation package;
4. fresh patch materialization and retained dashboard build through the
   existing build producer, using a pre-bound unique attempt path;
5. overlay/patch/manifest digest and package-manifest inventory checks;
6. `git diff --check -- cyberAlchemy-v2/implementation/ontology-evidence-workbench`.

The Task Session contract binds the exact build command and output path after
predecessor receipts and current manifests are known; a placeholder output path
is not accepted as executed evidence.

## Browser runtime preflight

```bash
command -v playwright
playwright --version
npm list -g --depth=0 playwright
playwright install --list
node -e 'const {chromium}=require(process.argv[1]); console.log(chromium.executablePath())' "$(npm root -g)/playwright"
```

Task Session records the resolved Playwright package version, Chromium
revision, executable path/digest, fresh context, fonts, locale, viewports,
motion/color mode, loopback origin, request/console ledgers and teardown.

## Required matrices

- exact predicate/color/pattern/direction across graph, selected relation,
  portal, Path forward/reverse, narrow, grayscale, forced colors and reduced motion;
- activation/result/dismissal/restoration for startup modal, modes, Filter,
  Export, Path, Theme, search, help, portal, all-loaded escape and edge action;
- all frozen Body War task/control/state/mode rows;
- known-good, known-bad, representative domain and false-positive fixture
  families for each reusable hard gate.

## Result rules

- Any acceptance-critical unit/fixture/browser/contrast/restoration failure blocks.
- Unexercised is residue, never pass.
- Screenshot review cannot become a hard gate by repetition.
- Automated evidence cannot prove human outcomes.
- No product pass implies ontology, promotion, release, deployment or production readiness.
