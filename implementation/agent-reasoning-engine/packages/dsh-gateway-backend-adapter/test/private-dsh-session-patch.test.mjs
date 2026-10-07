import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {createRequire} from "node:module";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath, pathToFileURL} from "node:url";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {Session, SessionStore} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-session")).href);
const {Context} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/cordis")).href);
const {createUserMessage} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-llm")).href);
const patchScript = fileURLToPath(new URL("../scripts/apply-private-dsh-session-patch.mjs", import.meta.url));
const packageRoot = fileURLToPath(new URL("..", import.meta.url));

function message(label) {
  return createUserMessage({
    content: [{type: "text", text: `local ${label}; never dispatch`}],
    source: {kind: "plugin", plugin: "are-private-patch-test"},
  });
}

function insert(session, userMessage) {
  return session.append("agent/inbox/spliced", {target: "next-turn", start: 0, inserted: [userMessage]});
}

test("private patch verifier binds the installed pinned graph without changing it", () => {
  const checked = spawnSync(process.execPath, [patchScript, "--check"], {
    cwd: packageRoot, encoding: "utf8",
  });
  assert.equal(checked.status, 0, checked.stderr);
  const output = JSON.parse(checked.stdout);
  assert.equal(output.schema_version, "are.private-dsh-graph-patch/v2");
  assert.equal(output.mode, "check");
  assert.equal(output.dependency.dsh, "0.1.5-rc.2");
  assert.equal(output.dependency.session, "0.1.5-rc.3");
  assert.equal(output.dependency.cordis, "4.0.2");
  assert.equal(output.dependency.loader, "1.0.3");
  assert.equal(output.dependency.app_boot, "0.1.5-rc.3");
  assert.equal(output.dependency.agent_presets, "0.1.5-rc.3");
  assert.deepEqual(output.files.map((file) => file.name), [
    "@deepseek-ai/dsh-session/lib/index.js",
    "@deepseek-ai/dsh-session/lib/types/index.d.ts",
    "@deepseek-ai/cordis/lib/index.js",
    "@deepseek-ai/cordis-plugin-loader/lib/index.js",
    "@deepseek-ai/cordis-plugin-loader/lib/types/config/tree.d.ts",
    "@deepseek-ai/cordis-plugin-loader/lib/types/config/entry.d.ts",
    "@deepseek-ai/dsh-app-boot/lib/index.js",
    "@deepseek-ai/dsh-app-boot/lib/types/index.d.ts",
    "@deepseek-ai/dsh-agent-presets/lib/index.js",
    "@deepseek-ai/dsh/lib/profile-boot-Dk-7KqJc.js",
    "@deepseek-ai/dsh-agent-loop/lib/index.js",
  ]);
  assert.deepEqual(output.files.map((file) => file.previous_state),
    Array.from({length: 11}, () => "patched"));
  assert.equal(new Set(output.files.map((file) => file.patched_sha256)).size, 11);
  const planned = spawnSync(process.execPath, [patchScript, "--plan"], {
    cwd: packageRoot, encoding: "utf8",
  });
  assert.equal(planned.status, 0, planned.stderr);
  assert.deepEqual(JSON.parse(planned.stdout).files, output.files,
    "the no-write plan must recognize the exact complete installed projection");
  assert.equal(join(packageRoot, "scripts/apply-private-dsh-session-patch.mjs"), patchScript);
});

test("unqualified detached Sessions keep native append behavior", () => {
  const session = Session.create("are-unqualified-session");
  const userMessage = message("unqualified");
  assert.equal(insert(session, userMessage).data.inserted[0].id, userMessage.id);
  assert.equal(session.snapshotEvents().length, 1);
});

test("Store factory protects prepared Sessions before announcement and cannot be installed late", () => {
  const store = new SessionStore(new Context());
  assert.throws(() => store.installAppendAdmissionFactoryV1(null), /must be a function/u);
  store.installAppendAdmissionFactoryV1((session) => {
    session.installAppendAdmissionGuardV1((event) => event.type !== "agent/inbox/spliced");
  });
  assert.throws(() => store.installAppendAdmissionFactoryV1(() => {}), /already installed/u);
  const restoredHeader = Session.create("are-restored-before-announce").header;
  for (const [id, options] of [
    ["are-prepared-before-announce", undefined],
    ["are-restored-before-announce", {seed: [], meta: restoredHeader, eventState: "detached"}],
  ]) {
    const prepared = store.prepare(id, options);
    assert.equal(prepared.hasAppendAdmissionGuardV1(), true);
    const before = prepared.snapshotEvents().length;
    assert.throws(() => insert(prepared, message(id)), /session append admission denied/u);
    assert.equal(prepared.snapshotEvents().length, before);
  }
  assert.throws(() => store.prepare("are-unadmitted-seed", {seed: [{}]}),
    /cannot adopt seed events before admission/u);
  const late = new SessionStore(new Context());
  late.prepare("are-already-prepared");
  assert.throws(() => late.installAppendAdmissionFactoryV1(() => {}), /before the first prepare/u);
  const asyncOwner = new SessionStore(new Context());
  asyncOwner.installAppendAdmissionFactoryV1(async () => {});
  assert.throws(() => asyncOwner.prepare("are-async-factory"), /did not synchronously install a guard/u);
});

test("Host-prepared owner installs the guard when SessionStore mounts, before first prepare", () => {
  const ctx = new Context();
  let installed = 0;
  Object.defineProperty(ctx, Symbol.for("are.dsh-web-host-owner/v1"), {value: {
    installSessionFactory(store) {
      installed += 1;
      store.installAppendAdmissionFactoryV1((session) => {
        session.installAppendAdmissionGuardV1(() => false);
      });
    },
  }});
  const store = new SessionStore(ctx);
  assert.equal(installed, 1);
  const prepared = store.prepare("are-host-prepared-before-tree");
  assert.throws(() => insert(prepared, message("host-prepared")),
    /session append admission denied/u);
});

test("a selected Session denies direct inbox and user-surface writes before log commit", () => {
  const session = Session.create("are-denied-session");
  const seen = [];
  session.installAppendAdmissionGuardV1((event) => {
    assert.equal(Object.isFrozen(event), true);
    seen.push(event.type);
    return false;
  });
  assert.throws(() => insert(session, message("denied-inbox")), /session append admission denied/u);
  assert.throws(() => session.append("user/message", message("denied-surface"), {surfaceOp: "append"}),
    /session append admission denied/u);
  assert.deepEqual(seen, ["agent/inbox/spliced", "user/message"]);
  assert.equal(session.snapshotEvents().length, 0);
  assert.throws(() => session.installAppendAdmissionGuardV1(() => true), /already installed/u);
});

test("a single-use caller permit can admit one inbox append but not its replay", () => {
  const session = Session.create("are-once-session");
  const userMessage = message("single-use");
  let consumed = false;
  session.installAppendAdmissionGuardV1((event) => {
    if (event.type !== "agent/inbox/spliced" || event.data.inserted.length === 0) return true;
    if (consumed || event.data.inserted.length !== 1 || event.data.inserted[0].id !== userMessage.id) return false;
    consumed = true;
    return true;
  });
  assert.equal(insert(session, userMessage).data.inserted[0].id, userMessage.id);
  session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
    removedCount: 1, inserted: [], outcome: "canceled"});
  assert.throws(() => insert(session, userMessage), /session append admission denied/u);
  assert.equal(session.snapshotEvents().length, 2);
});

test("async or reentrant guards fail before append and do not become approval", () => {
  const asyncSession = Session.create("are-async-session");
  assert.throws(() => asyncSession.installAppendAdmissionGuardV1(null), /must be a function/u);
  asyncSession.installAppendAdmissionGuardV1(() => Promise.resolve(true));
  assert.throws(() => insert(asyncSession, message("async")), /session append admission denied/u);
  assert.equal(asyncSession.snapshotEvents().length, 0);

  const reentrant = Session.create("are-reentrant-session");
  reentrant.installAppendAdmissionGuardV1(() => {
    reentrant.append("session/title", {title: "nested"});
    return true;
  });
  assert.throws(() => insert(reentrant, message("reentrant")), /cannot reenter its admission guard/u);
  assert.equal(reentrant.snapshotEvents().length, 0);
});
