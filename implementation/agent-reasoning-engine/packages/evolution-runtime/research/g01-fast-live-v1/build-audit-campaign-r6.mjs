// Derive the independent r6 auditor from the pinned, previously exercised r4s
// auditor. This does not run, score, or change the frozen campaign.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";

const [priorPath, outputPath] = process.argv.slice(2);
if (!priorPath || !outputPath) throw Error("usage: build-audit-campaign-r6.mjs R4S_AUDITOR NEW_AUDITOR");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const bytes = readFileSync(priorPath);
if (sha(bytes) !== "13df1d145955869fabefab2d70a4cf2c6d8755132b1e565458d4f03551dac0ac")
  throw Error("g01-r6-auditor.prior-source-drift");
let source = bytes.toString("utf8");
function replaceExactly(before, after) {
  if (source.split(before).length !== 2) throw Error(`g01-r6-auditor.source-shape-drift:${before}`);
  source = source.replace(before, after);
}
replaceExactly("Independent G01 r4s receipt", "Independent G01 r6 receipt");
replaceExactly("g01-product-replication-r4s", "g01-product-replication-r6");
replaceExactly("g01-product-replication-input-r7", "g01-product-replication-input-r9");
replaceExactly("9fa1749b4a2f6b8196871f7ddd3bb062cfe045f207c8d8ad553871ff4e12d67b",
  "b8f43652066e037441f9dee0ddcdf1acbed849f63746c31595b07f1ea022a427");
replaceExactly("de9ea87b8d68816502ac1d202ca9d9378ec22098d4e8c37e33b869bf182f6e8d",
  "ca6369131496e64ef670c4cd01feada4f00538a283d452b0c4f2b2e2b0e849e6");
replaceExactly("g01-r4s-audit.", "g01-r6-audit.");
replaceExactly("are.g01-r4s-independent-receipt-audit/v1", "are.g01-r6-independent-receipt-audit/v1");
replaceExactly("definition.non_tool_terminal_after_convergence === true && freeze.non_tool_terminal_after_convergence === true,",
  "definition.non_tool_terminal_after_convergence === true && freeze.non_tool_terminal_after_convergence === true &&\n" +
  "  definition.span_refinement_policy === \"source-only-go-selected-subspan-r1\" &&\n" +
  "  freeze.span_refinement_policy === definition.span_refinement_policy,");
replaceExactly("need(plan.non_tool_terminal_after_convergence === true, \"pair-policy\");",
  "need(plan.non_tool_terminal_after_convergence === true &&\n" +
  "    plan.span_refinement_policy === definition.span_refinement_policy, \"pair-policy\");");
replaceExactly("armFreeze.non_tool_terminal_after_convergence === true &&",
  "armFreeze.non_tool_terminal_after_convergence === true &&\n" +
  "      (arm === \"candidate\" ? armFreeze.span_refinement_policy === definition.span_refinement_policy :\n" +
  "        armFreeze.span_refinement_policy === undefined) &&");
writeFileSync(outputPath, source, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({prior_sha256: sha(bytes), output_sha256: sha(source), output_path: outputPath}));
