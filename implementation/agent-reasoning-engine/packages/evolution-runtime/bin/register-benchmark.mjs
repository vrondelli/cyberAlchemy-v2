import {readFileSync} from "node:fs";
import {digest} from "../../request-intent-runtime/src/canonical.mjs";
import {materializeBenchmarkRegistration, persistBenchmarkRegistration} from "../src/benchmark-registration.mjs";
const [id, manifestPath, resultPath] = process.argv.slice(2);
if (!id || !manifestPath || !resultPath) throw Error("Usage: register-benchmark.mjs EXPERIMENT_ID MANIFEST_PATH RESULT_PATH");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")), result = JSON.parse(readFileSync(resultPath, "utf8"));
const record = materializeBenchmarkRegistration({experiment_id: id, manifest, result, expected_result_digest: digest(result)});
console.log(JSON.stringify(persistBenchmarkRegistration(record)));
