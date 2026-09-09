import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  compileCarrier,
  parseDomainSource,
} from "../../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/index.ts";
import { buildMintedProjectViews } from "../../../../../domainspec-core/projects/domainspec-v2/impl/tools/minted-project/views.ts";
const root = new URL("./", import.meta.url);
const bytes = (v: unknown) => JSON.stringify(v, null, 2) + "\n";
const hash = (b: string | Buffer) =>
  createHash("sha256").update(b).digest("hex");
const source = readFileSync(new URL("purchase.alch", root), "utf8");
const options = {
  developmentProfileRegistry: {
    path: fileURLToPath(new URL("domainspec/development-profile.json", root)),
    handle: "exchange-purchase-development-v0.1",
  },
};
function files(directory: string, extension: string): string[] {
  return readdirSync(new URL(directory, root), { withFileTypes: true })
    .flatMap((entry) => {
      const path = directory + entry.name;
      return entry.isDirectory()
        ? files(path + "/", extension)
        : path.endsWith(extension)
          ? [path]
          : [];
    })
    .sort();
}
function build() {
  const pack=JSON.parse(readFileSync(new URL("definition-pack.json",root),"utf8"));
  for(const source of pack.sources) if(hash(readFileSync(new URL(source.path,root)))!==source.sha256) throw Error("definition source drift: "+source.id);
  const model = compileCarrier(parseDomainSource(source).carrier);
  const ds = buildMintedProjectViews(
    fileURLToPath(new URL("domainspec/", root)),
    options,
  );
  const implementation = Object.fromEntries(
    [
      "definition-pack.json",
      "construction.json",
      "deployment/public.json",
      "purchase.alch",
      "program/src/lib.rs",
      "program/Cargo.toml",
      "program/Cargo.lock",
      "program/tests/settlement.rs",
      "program/examples/local_bank.rs",
      "package.json",
      "package-lock.json",
      "build.ts",
      "sbf.py",
      "program/sbf-harness/Cargo.toml",
      "program/sbf-harness/Cargo.lock",
      "program/sbf-harness/kep-reference/Cargo.toml",
      "../../../../tools/toolchain/solana/lock.json",
      "../../../../tools/toolchain/solana/run",
      "../../../../tools/toolchain/solana/bootstrap.py",
      "ui/index.html",
      "ui/app-entry.mjs",
      "ui/app.js",
      "../../../run",
      "../../../knowledge-exchange-protocol/runtime/solana-program/src/lib.rs",
      "../../../knowledge-exchange-protocol/runtime/solana-program/src/membership.rs",
      "../../../knowledge-exchange-protocol/runtime/solana-program/Cargo.toml",
      "../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/protocol.js",
      "../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/file-client.js",
      "../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/package.json",
      "../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/package-lock.json",
      "../../../../tools/toolchain/lock.json",
      "../../../../rust-toolchain.toml",
      ...files("client/", ".mjs"),
      ...files(
        "../../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/",
        ".ts",
      ),
      ...files(
        "../../../../../domainspec-core/projects/domainspec-v2/impl/tools/minted-project/",
        ".ts",
      ),
    ].map((p) => [p, hash(readFileSync(new URL(p, root)))]),
  );
  return {
    "model.json": bytes(model),
    "graph.json": ds.graphBytes,
    "source-manifest.json": ds.sourceManifestBytes,
    "SPEC.md": ds.markdownBytes,
    "markdown-view.json": ds.markdownViewBytes,
    "build-receipt.json": ds.buildReceiptBytes,
    "system-ontology.json": bytes({
      schema_version: "exchange-purchase-system-candidate/v1",
      authority_effect: "none",
      graph_sha256: hash(ds.graphBytes),
      implementation,
      generated_runtime: false,
      native_effects: [
        "Solana program invocation",
        "SPL token transfer",
        "chain clock",
      ],
      open_questions_ref:
        "../../../../plans/purchase-v1/SOLANA-USDC-PLAN.md#open-questions",
    }),
  };
}
const first = build();
if (bytes(first) !== bytes(build())) throw Error("nondeterministic build");
mkdirSync(new URL("generated/", root), { recursive: true });
for (const [p, b] of Object.entries(first)) {
  const dest = new URL("generated/" + p, root);
  if (process.argv.includes("--check")) {
    if (readFileSync(dest, "utf8") !== b) throw Error("stale " + p);
  } else writeFileSync(dest, b);
}
console.log(
  "Alch + DomainSpec: " +
    Object.keys(first).length +
    " deterministic artifacts" +
    (process.argv.includes("--check") ? " verified" : " built"),
);
