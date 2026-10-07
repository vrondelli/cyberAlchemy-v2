import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {treeBinding} from "./prepare.mjs";
import {verifyHen11VpsPackage} from "./verify-vps-package.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");

test("package observation verifies every file and tree with development launch enabled", () => {
  const root = mkdtempSync(join(tmpdir(), "hen11-package-")); try {
    const tree = join(root, "repositories/task"); mkdirSync(tree, {recursive: true}); writeFileSync(join(tree, "a"), "a"); const freezePath = join(root, "FREEZE.json"), freezeBytes = "{}\n"; writeFileSync(freezePath, freezeBytes);
    writeFileSync(freezePath, `${canonicalJson({execution_mode: "development", development_execution: {prelaunch_authorization_required: false, cryptographic_signatures_required: false}, native_scoring_environment: {fixture: true}})}\n`); const boundFreezeBytes = readFileSync(freezePath), binding = treeBinding(tree), manifest = {schema_version: "are.hen11-vps-transfer-manifest/v1", execution_host: "187.77.163.194", target_root: root, deployment_digest: "d".repeat(64), files: [{local_path: freezePath, remote_path: freezePath, sha256: sha(boundFreezeBytes)}], repositories: [{task_id: "task", local_path: tree, remote_path: tree, ...binding}], scoring_assets: [], launch: {disabled: false}};
    const manifestPath = join(root, "TRANSFER-MANIFEST.json"); writeFileSync(manifestPath, `${canonicalJson(manifest)}\n`); const options = {manifestPath, freezeSha256: sha(boundFreezeBytes), verify_topology: () => ({host: "fixture"}), verify_scoring_environment: () => true}, receipt = verifyHen11VpsPackage(options); assert.equal(receipt.files_verified, 1); assert.equal(receipt.trees_verified, 1); assert.equal(receipt.launch_disabled, false);
    writeFileSync(join(tree, "a"), "drift"); assert.throws(() => verifyHen11VpsPackage(options), /tree:/);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("package verification rejects a scoring preflight that mutates a bound tree", () => {
  const root = mkdtempSync(join(tmpdir(), "hen11-package-mutation-")); try {
    const tree = join(root, "upstream"); mkdirSync(tree); writeFileSync(join(tree, "source.py"), "print('safe')\n");
    const freezePath = join(root, "FREEZE.json"), boundFreezeBytes = `${canonicalJson({execution_mode: "development", development_execution: {prelaunch_authorization_required: false, cryptographic_signatures_required: false}, native_scoring_environment: {fixture: true}})}\n`; writeFileSync(freezePath, boundFreezeBytes);
    const binding = treeBinding(tree), manifest = {schema_version: "are.hen11-vps-transfer-manifest/v1", execution_host: "187.77.163.194", target_root: root, deployment_digest: "d".repeat(64), files: [{local_path: freezePath, remote_path: freezePath, sha256: sha(boundFreezeBytes)}], repositories: [], scoring_assets: [{name: "upstream", local_path: tree, remote_path: tree, ...binding}], launch: {disabled: false}};
    const manifestPath = join(root, "TRANSFER-MANIFEST.json"); writeFileSync(manifestPath, `${canonicalJson(manifest)}\n`);
    assert.throws(() => verifyHen11VpsPackage({manifestPath, freezeSha256: sha(boundFreezeBytes), verify_topology: () => ({host: "fixture"}), verify_scoring_environment: () => { writeFileSync(join(tree, "__pycache__.pyc"), "mutation"); return true; }}), /tree-after-preflight:/);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
