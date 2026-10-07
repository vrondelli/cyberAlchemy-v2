import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";
import {verifyHen11LaunchRuntime} from "./launch-vps.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");

test("launch runtime binds exact executable, version, digest and VM flag", () => {
  const bytes = Buffer.from("node-fixture"), topology = {node_path: "/opt/exact/node", node_version: "v24.10.0", node_sha256: sha(bytes)};
  assert.equal(verifyHen11LaunchRuntime({execPath: topology.node_path, version: topology.node_version, execArgv: ["--experimental-vm-modules"], read: () => bytes, topology}), true);
  assert.throws(() => verifyHen11LaunchRuntime({execPath: "/usr/bin/node", version: topology.node_version, execArgv: ["--experimental-vm-modules"], read: () => bytes, topology}), /node-path/);
  assert.throws(() => verifyHen11LaunchRuntime({execPath: topology.node_path, version: topology.node_version, execArgv: [], read: () => bytes, topology}), /vm-flag/);
});
