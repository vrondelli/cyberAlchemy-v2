// Derive the independent post-run r4s auditor from the pinned r3 auditor.
// This does not run or score the campaign and never changes the frozen runner.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";

const [priorPath, outputPath] = process.argv.slice(2);
if (!priorPath || !outputPath) throw Error("usage: build-audit-campaign-r4s.mjs R3_AUDITOR NEW_AUDITOR");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const priorBytes = readFileSync(priorPath);
if (sha(priorBytes) !== "231848719ea4abf2683e3de373569d1cc6b8fa14c50ad942cad68b34e8d69b1f")
  throw Error("g01-r4s-auditor.prior-source-drift");
let source = priorBytes.toString("utf8");
function replaceExactly(before, after) {
  if (source.split(before).length !== 2) throw Error(`g01-r4s-auditor.source-shape-drift:${before}`);
  source = source.replace(before, after);
}
replaceExactly("Independent G01 r3 receipt", "Independent G01 r4s receipt");
replaceExactly("g01-product-replication-r3", "g01-product-replication-r4s");
replaceExactly("g01-product-replication-input-r5", "g01-product-replication-input-r7");
replaceExactly("b5a29ece7386c037a9b2e5e36410179f93d80c52e42b20a6e75caa743a74e2bd",
  "9fa1749b4a2f6b8196871f7ddd3bb062cfe045f207c8d8ad553871ff4e12d67b");
replaceExactly("7ddf069e96cb6cf1610da5f21efaf747de152cb1aa597286e5f3b4666555b4bb",
  "de9ea87b8d68816502ac1d202ca9d9378ec22098d4e8c37e33b869bf182f6e8d");
replaceExactly("g01-r3-audit.", "g01-r4s-audit.");
replaceExactly("are.g01-r3-independent-receipt-audit/v1", "are.g01-r4s-independent-receipt-audit/v1");
writeFileSync(outputPath, source, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({prior_sha256: sha(priorBytes), output_sha256: sha(source), output_path: outputPath}));
