import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const base = "/opt/are/evolution-runtime/g03-product-replication-code-r7/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1";
const sourcePath = join(base,"replication-cohort-reference-project-r5.py");
const targetPath = join(base,"replication-cohort-reference-project-r5-fix1.py");
const sha = value => createHash("sha256").update(value).digest("hex");
const source = readFileSync(sourcePath,"utf8");
if (sha(source) !== "81a6026b09707e8ee0f98f3761391d1eb71c62ab630d93fd1a203d78558a2039" ||
    source.split("len(set(ids)) != 80").length !== 2) throw Error("original-reference-drift");
const corrected = source.replace("len(set(ids)) != 80","len(set(ids)) != 50");
writeFileSync(targetPath,corrected,{flag:"wx",mode:0o600});
process.stdout.write(`${JSON.stringify({reference_path:targetPath,reference_sha256:sha(corrected),change:"evaluator-only distinct-ID count 80 to frozen 50"})}\n`);
