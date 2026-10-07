import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime/g02-product-replication-tools-r3";
const source = readFileSync(join(root,"analyze-product-paired-cohort.mjs"),"utf8");
const occurrences = source.split("24").length - 1;
if (occurrences !== 5) throw Error(`g02-r3-analysis-source-drift:${occurrences}`);
const output = source.replaceAll("24","12");
const path = join(root,"analyze-product-paired-cohort-r3.mjs");
writeFileSync(path,output,{flag:"wx",mode:0o600});
const sha = createHash("sha256").update(output).digest("hex");
process.stdout.write(`${JSON.stringify({analysis_path:path,analysis_sha256:sha})}\n`);
