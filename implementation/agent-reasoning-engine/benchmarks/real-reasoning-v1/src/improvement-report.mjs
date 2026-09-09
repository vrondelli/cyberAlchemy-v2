import {mkdirSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {packageRoot} from "./common.mjs";

export function writeImprovementReport(result, path = null) {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const target = path ? resolve(path) : resolve(packageRoot, "runs/improvements", `${stamp}-${result.mode}${result.target_id ? `-${result.target_id}` : ""}.json`);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  return target;
}
