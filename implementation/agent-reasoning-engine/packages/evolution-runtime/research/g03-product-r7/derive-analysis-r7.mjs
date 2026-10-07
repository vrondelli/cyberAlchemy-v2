// Produce reviewable r7 analysis/audit sources by bounded mechanical rewrite.
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const here = new URL(".", import.meta.url);
const r6 = new URL("../g03-product-r6/", here);
const files = [
  ["analyze-accuracy-r6.mjs", "analyze-accuracy-r7.mjs"],
  ["audit-r6.py", "audit-r7.py"],
];
for (const [sourceName, outputName] of files) {
  const source = readFileSync(new URL(sourceName, r6), "utf8");
  let text = source.replaceAll("r6", "r7").replaceAll("R6", "R7")
    .replaceAll("five-type", "four-type").replaceAll("Five-type", "Four-type")
    .replaceAll("five question types, eight each", "four question types, seven each")
    .replace(/\b40\b/g, "28").replace(/\b80\b/g, "56");
  if (outputName.endsWith(".mjs")) {
    text = text.replace("groups.length !== 5 || groups.some(group => group.length !== 8)",
      "groups.length !== 4 || groups.some(group => group.length !== 7)");
  } else {
    text = text.replace("len(groups) == 5 and all(len(group) == 8 for group in groups)",
      "len(groups) == 4 and all(len(group) == 7 for group in groups)");
  }
  if (/\b40\b|\b80\b|five-type|five question types|groups.length !== 5|group.length !== 8|len\(groups\) == 5|len\(group\) == 8/.test(text))
    throw Error(`unconverted-analysis:${outputName}`);
  writeFileSync(new URL(outputName, here), text, {flag: "wx", mode: 0o600});
}
