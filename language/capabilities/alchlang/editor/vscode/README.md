# AlchLang editor support

This candidate VS Code language extension associates `.alch` files with
AlchLang, supplies light and dark file icons, applies syntax highlighting
through a TextMate grammar, and provides an opt-in Color Studio for personal
token colors. TextMate grammars are also reusable by editors that support the
same grammar format.

It also contributes two optional color layers, `AlchLang Monokai Dimmed` and
`AlchLang Light`. They assign explicit colors to every semantic scope emitted
by the grammar without changing the grammar's classification. The dark layer
inherits a repository-local, digest-pinned copy of VS Code's MIT-licensed
Monokai Dimmed theme, then appends AlchLang-specific rules.
Those dark-theme rules use a deliberately muted palette rather than the more
saturated defaults, while retaining a minimum `4.5:1` contrast ratio. The
light theme remains independently tuned for a white background.

The highlighting covers comments, strings, declarations, headers, clauses,
primitive and named field types, constants, function calls, expressions,
operators, and record fields. It includes the current semantic-contract blocks:
`axiom`, `intrinsic`, `invariant`, `governed-by`, and `validation`.
`configuration` is a generic AlchLang type declaration: any valid declaration
name receives the type-name scope. Names such as `AreProductionSemanticCore`
remain ordinary domain-specific instances and are not language keywords or
editor special cases.

Top-level declarations are column-zero forms. Their names are separated into
type, callable, and governance scopes. Indented uses of words such as `action`,
`operation`, `target`, and `invariant` are treated as references or clauses,
not declarations. Header values, reference operands, symbolic values,
environment names, field modifiers, and control directives have their own
scopes so themes do not leave every identifier at the default foreground.

AlchLang permits hyphens in identifiers, so generic token rules use
identifier-aware boundaries. For example, `operation-pending` is one symbol;
it is not partially colored as the `operation` keyword. Named field types are
limited lexically to UpperCamel or qualified UpperCamel forms such as
`PriceSnapshot`, `Pricing.Envelope`, and `Request.Message[]`. Lowercase dotted
forms such as `best.amountMinor` remain expression/member paths.

## Validate

From this directory:

```bash
npm test
```

The test is dependency-free. It checks manifest bindings, grammar regular
expressions, exact capture scopes, first-rule precedence, non-collapse and
context orthogonality fixtures, all declaration forms in the current Alch
corpus, the top-level/indented boundary, passive SVG constraints, complete
theme-scope coverage, a pinned Monokai Dimmed base, reference-role color
separation, adjacent semantic-role color separation, and a minimum 4.5
token/background contrast ratio.

## Package locally

Create the installable package without installing or publishing it:

```bash
npm run package:vsix
```

This uses the pinned `@vscode/vsce` version and writes
`alchlang-language-support-0.3.8.vsix` in this directory. The package excludes
tests and existing VSIX files while retaining the manifest, grammar, language
configuration, icons, themes, Color Studio runtime and assets, README, and
vendored Monokai license.

After local acceptance, the package can be installed explicitly with:

```bash
code --install-extension alchlang-language-support-0.3.8.vsix
```

Packaging does not install the extension or publish it to the Marketplace.

## Try locally

Open this directory as a VS Code extension project and launch an Extension
Development Host with `F5`, or start VS Code with:

```bash
code --extensionDevelopmentPath=/absolute/path/to/cyberAlchemy-v2/language/capabilities/alchlang/editor/vscode
```

No extension is installed or published by this repository package. The default
language icon is used only when the active file-icon theme permits language
icons and does not already provide a stronger `.alch` association.

### Select the AlchLang color layer

In the Extension Development Host, open the Command Palette and run
`Preferences: Color Theme`, or press `Ctrl+K Ctrl+T`. Select
`AlchLang Monokai Dimmed` or `AlchLang Light`. The reported clause scope
`keyword.other.clause.alch` receives an explicit contrasting color instead of
inheriting the low-contrast grey from another theme.

Reference clauses intentionally use two colors. In
`grounded-by MeaningfulTokensHaveBoundaries`, `intrinsic ContainsPhrase`, and
`operation append-reason`, the reference keyword is blue and the referenced
operand is the deeper muted red `#C76A70` in `AlchLang Monokai Dimmed` and
brown in `AlchLang Light`.
This preserves the distinction between relationship and target instead of
making the whole line one token role or merging the target with a string.

The AlchLang-specific palette also keeps locally adjacent semantic families
apart: types do not reuse string color, booleans and `none` do not reuse
control or clause color, and numbers do not reuse variable color. These are
theme-level non-collapse guarantees; the underlying TextMate scopes remain
independent of color.

### Configure your own colors

Open the Command Palette and run `AlchLang: Configure Colors`. Color Studio
shows the active theme, a live AlchLang sample, all 15 semantic color roles,
contrast ratios against the current editor background, and warnings for the
important role distinctions protected by the built-in themes.

Color Studio uses one self-contained live-sample panel and no separate palette
box. Select any colored word with a pointer, or focus it and press `Enter` or
`Space`, to show that exact word, its semantic role, editable hex color, color
picker, and contrast ratio. Editing there recolors every sample word in that
role immediately. All 15 roles are represented by selectable words in the
sample, and the inspector compacts for narrow windows.

Inside VS Code, Color Studio follows the active workbench colors. In a
standalone browser preview where VS Code variables are unavailable, it uses a
dimmed charcoal surface instead of falling through to the browser's white
canvas; the semantic token colors remain unchanged.

`Vivid base` reproduces the screenshot-derived palette and is the default dark
editing base when no saved AlchLang customization exists. Its intentionally
strong blue and red roles may trigger contrast warnings; Color Studio reports
those warnings without silently changing the requested colors. `Dimmed base`
and `Light base` remain alternative starting points. `Import theme as base`
accepts a VS Code `.json` or `.jsonc` color theme and maps its own TextMate
`tokenColors` onto the 15 AlchLang semantic roles. Exact `.alch` scopes take
priority over generic TextMate scope families. Roles without a usable match keep
their current color, after which every value remains editable. Imported bytes
stay in the Color Studio page's memory; they are not uploaded, retained, or
written to settings. An imported `include` path is reported but is not resolved,
and alpha channels are removed because the generated settings use six-digit
foreground colors.

`Export theme` downloads a reusable VS Code color-theme JSON containing the
current editor surface and all 15 resulting AlchLang token roles. `Copy settings
JSON` copies a self-contained settings fragment without changing VS Code.
`Apply to this theme` writes named AlchLang rules under the active theme in the user's
`editor.tokenColorCustomizations`; unrelated theme properties and TextMate
rules are preserved. `Reset this theme` removes only rules whose names begin
with `AlchLang custom:`. No settings are changed merely by opening the page.

In the standalone loopback preview, Export and Copy run directly in the
browser, Reset restores the original preview palette, and the host-only Apply
button is disabled and labeled `Apply in VS Code`. Inside the extension host,
Export uses VS Code's save dialog, Reset and Apply operate on User Settings,
and Copy uses the VS Code clipboard API.

Color Studio warns about contrast below `4.5:1` but leaves the final palette to
the user. A workspace-level `editor.tokenColorCustomizations` value may take
precedence over User Settings and remains outside this page's write scope.

VS Code does not provide a declarative contribution that overlays token colors
onto every arbitrary active theme. The AlchLang themes are therefore opt-in and
do not modify user or workspace settings. To keep another theme, add an exact
scope override to the user's settings instead:

```json
"editor.tokenColorCustomizations": {
  "textMateRules": [
    {
      "scope": "keyword.other.clause.alch",
      "settings": {"foreground": "#9CDCFE"}
    }
  ]
}
```

The vendored base retains its upstream license in
`themes/MONOKAI-DIMMED-LICENSE.txt`.

## Evidence boundary

This is lexical highlighting, not parser-backed semantic highlighting. It does
not validate source, resolve ontology identities, run the compiler, admit a
grammar change, or grant authority. Compiler diagnostics and language-server
features remain separate future layers. TextMate scopes are theme hints: an
installed theme may render two distinct scopes with the same color even though
the grammar classifies them independently.

## Open Questions

- Should the same TextMate grammar be packaged for another specific editor?
- Should a future language server add diagnostics and semantic tokens?
- Should a future version allow an explicit workspace-settings target in
  addition to User Settings?
