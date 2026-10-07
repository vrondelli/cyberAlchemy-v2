// Derive the independent r7 auditor from the exercised, pinned r6 auditor.
// Only cohort bindings and output identity change; this script never scores.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";

const [priorPath, outputPath] = process.argv.slice(2);
if (!priorPath || !outputPath) throw Error("usage: build-audit-campaign-r7.mjs R6_AUDITOR NEW_AUDITOR");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const bytes = readFileSync(priorPath);
if (sha(bytes) !== "32afccde459f001b761e2184a2c18f156162608a255869ffc5f1d4871cedff40")
  throw Error("g01-r7-auditor.prior-source-drift");
let source = bytes.toString("utf8");
function replaceExactly(before, after) {
  if (source.split(before).length !== 2) throw Error(`g01-r7-auditor.source-shape-drift:${before}`);
  source = source.replace(before, after);
}
replaceExactly("Independent G01 r6 receipt", "Independent G01 r7 receipt");
replaceExactly("g01-product-replication-r6", "g01-product-replication-r7");
replaceExactly("g01-product-replication-input-r9", "g01-product-replication-input-r10");
replaceExactly("b8f43652066e037441f9dee0ddcdf1acbed849f63746c31595b07f1ea022a427",
  "d0d02594dfac39104d4f3afbc0242414b5e84ea30b82ab766b438548a0594a59");
replaceExactly("ca6369131496e64ef670c4cd01feada4f00538a283d452b0c4f2b2e2b0e849e6",
  "258164a3e34ce406f6074c6ec1fa7aff5130976da66e66b05d4c0ae600f6576a");
replaceExactly("g01-r6-audit.", "g01-r7-audit.");
replaceExactly("are.g01-r6-independent-receipt-audit/v1", "are.g01-r7-independent-receipt-audit/v1");
writeFileSync(outputPath, source, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({prior_sha256: sha(bytes), output_sha256: sha(source), output_path: outputPath}));
