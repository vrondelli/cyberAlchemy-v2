import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime/g03-product-replication-tools-r5";
const input = join(root,"analyze-product-longmemeval-r4.mjs");
const output = join(root,"analyze-product-longmemeval-r5.mjs");
const sha = value => createHash("sha256").update(value).digest("hex");
let source = readFileSync(input,"utf8");
function replace(before, after, expected = 1) {
  const count = source.split(before).length - 1;
  if (count !== expected) throw Error(`analysis-source-drift:${before}:${count}`);
  source = source.replaceAll(before,after);
}
replace("fixed 80-question LongMemEval-S replication", "fixed 50-question five-type LongMemEval-S replication");
replace("source.rows?.length!==80", "source.rows?.length!==50");
replace("new Set(source.question_ids).size!==80", "new Set(source.question_ids).size!==50");
replace("generation.terminal_count!==80", "generation.terminal_count!==50");
replace("score.valid_judgments>160", "score.valid_judgments>100");
replace("index<80", "index<50");
replace(".length)/80", ".length)/50");
replace("planned_questions:80", "planned_questions:50");
replace("six question-type strata", "five question-type strata");
replace("score.valid_judgments===160", "score.valid_judgments===100");
replace("all-80 efficiency headline", "all-50 efficiency headline");
replace("Fixed 80-question", "Fixed 50-question five-type", 2);
replace("planned:80", "planned:50");
writeFileSync(output,source,{flag:"wx",mode:0o600});
process.stdout.write(`${JSON.stringify({analysis_path:output,analysis_sha256:sha(source)})}\n`);
