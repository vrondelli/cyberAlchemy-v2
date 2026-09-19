# DomainSpec CLI 1.0.0 — application-layout release candidate

Private local archive prepared from the accepted DSV2-APPLICATION-LAYOUT-001
product plus the previously approved SQLite test-command correction. Final
qualification results and source bindings are in the parent directory's report.
This is an unsigned local candidate, not a published or hosted release.

The tarball contains @domainspec-v2/cli@1.0.0 for Linux x64, requiring Node 26.8.1
and npm 11.19.0. It contains 281 regular package files and has no npm dependencies
or installation hooks. Verify its hash against SHA256SUMS before installing.

Install into a private local consumer:

```sh
npm install --ignore-scripts --no-audit --no-fund /absolute/path/domainspec-v2-cli-1.0.0.tgz
npx --no-install domainspec-v2 --version
```

To use the new directory structure, add
`--output-layout domainspec.application-layout/v1` to both `build` and `verify`.
Existing direct builds keep their previous layout when this option is omitted.
The generated application separates app, domain, runtime, provenance and evidence.

This archive contains the DomainSpec compiler, not the separate AlchLang CLI.
Use the accepted AlchLang checkout for function builds. Its compiler binding can
select the extracted package directory using ALCHLANG_DOMAINSPEC_PACKAGE_ROOT;
AlchLang automatically selects the new layout for function applications.

Open questions: review of this exact archive, subsequent source integration,
hosted qualification and publication. No deployment authority is implied.
