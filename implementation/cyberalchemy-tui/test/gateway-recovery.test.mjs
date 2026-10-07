import assert from "node:assert/strict";
import {chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {createTuiGatewayRecoveryPath} from "../src/gateway-recovery.mjs";

test("gateway recovery path is stable per socket and kept in a private directory", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-tui-state-path-"));
  try {
    const first = createTuiGatewayRecoveryPath({socket_path: resolve(root, "one.sock"), state_home: resolve(root, "state")});
    const again = createTuiGatewayRecoveryPath({socket_path: resolve(root, "one.sock"), state_home: resolve(root, "state")});
    const other = createTuiGatewayRecoveryPath({socket_path: resolve(root, "two.sock"), state_home: resolve(root, "state")});
    assert.equal(first, again);
    assert.notEqual(first, other);
    assert.equal(lstatSync(resolve(root, "state/cyberalchemy/tui-gateway")).mode & 0o777, 0o700);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("gateway recovery refuses an existing readable application directory", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-tui-state-unsafe-"));
  try {
    createTuiGatewayRecoveryPath({socket_path: resolve(root, "gateway.sock"), state_home: resolve(root, "state")});
    chmodSync(resolve(root, "state/cyberalchemy"), 0o755);
    assert.throws(() => createTuiGatewayRecoveryPath({socket_path: resolve(root, "gateway.sock"), state_home: resolve(root, "state")}), /gateway-recovery-directory-unsafe/u);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("gateway recovery does not create state through an application-directory symlink", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-tui-state-link-"));
  try {
    mkdirSync(resolve(root, "state"), {mode: 0o700});
    mkdirSync(resolve(root, "target"), {mode: 0o700});
    symlinkSync(resolve(root, "target"), resolve(root, "state/cyberalchemy"));
    assert.throws(() => createTuiGatewayRecoveryPath({socket_path: resolve(root, "gateway.sock"), state_home: resolve(root, "state")}), /gateway-recovery-directory-unsafe/u);
    assert.equal(existsSync(resolve(root, "target/tui-gateway")), false);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
