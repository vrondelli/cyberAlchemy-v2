#!/usr/bin/env node
// Test-only WebView2/CDP probe. Do not enable remote debugging in the shipped app.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {randomBytes, randomUUID} from "node:crypto";
import {EventEmitter} from "node:events";
import {existsSync} from "node:fs";
import {cp, mkdtemp, readFile, readdir, rm, writeFile} from "node:fs/promises";
import {createServer as createHttpServer} from "node:http";
import {createServer} from "node:net";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {createInterface} from "node:readline";
import {PassThrough} from "node:stream";

const DEFAULT_TIMEOUT_MS = 20_000;
const POLL_MS = 150;
const pause = ms => new Promise(done => setTimeout(done, ms));

function parseArgs(args) {
  let exe;
  let screenshot;
  let adapterScreenshot;
  let threadScreenshot;
  let decisionScreenshot;
  let evidenceScreenshot;
  let appearanceScreenshot;
  let evolutionScreenshot;
  let evolutionNarrow = false;
  let evolutionNativeNarrow = false;
  let threadNativeNarrow = false;
  let evolutionRoot;
  let evolutionVerifiedRoot = false;
  let evolutionLiveRoot = false;
  let evolutionCoordinationFixture = false;
  let evolutionMultiDefinitionFixture = false;
  let evolutionDenialJourney = false;
  let evolutionSignalLog;
  let adapterLive = false;
  let hostedSteerCheckpoint = false;
  let threadPages = false;
  let adapterRestartSameWindow = false;
  let terminalStatus;
  let degradedSteer = false;
  let unknownDispatch = false;
  let unknownHostedEffect = false;
  let hostedEffectForeign = false;
  let acceptedUnresolved = false;
  let confirmedRecovery = false;
  let adapterExternalSocket;
  let adapterExternalDsh = false;
  let adapterExternalEntry;
  let adapterExternalIdle = false;
  let recoverySignalFile;
  let adapterExternalActive = false;
  let adapterExternalInflight = false;
  let adapterExternalRestored = false;
  let adapterExternalInterrupted = false;
  let adapterExternalCompletedLoss = false;
  let adapterExternalConfirmedRecovery = false;
  let adapterExternalSameWindowRecovery = false;
  let adapterExternalSameWindowInterrupted = false;
  let initialPlacement;
  let resourceSample = false;
  let resourceWithAdapterFixture = false;
  let resourceWithExternalAdapter = false;
  let orbIdleNoDebug = false;
  let dashboardOnly = false;
  let orbBrowserPreset = "default";
  let browserDisableGpu = false;
  let checkOrbMemoryTarget = false;
  let doctorTimeoutOnce = false;
  let resourceCycles = 1;
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--screenshot") screenshot = args[++i];
    else if (arg === "--adapter-screenshot") adapterScreenshot = args[++i];
    else if (arg === "--thread-screenshot") threadScreenshot = args[++i];
    else if (arg === "--decision-screenshot") decisionScreenshot = args[++i];
    else if (arg === "--evidence-screenshot") evidenceScreenshot = args[++i];
    else if (arg === "--appearance-screenshot") appearanceScreenshot = args[++i];
    else if (arg === "--evolution-screenshot") evolutionScreenshot = args[++i];
    else if (arg === "--evolution-narrow") evolutionNarrow = true;
    else if (arg === "--evolution-native-narrow") evolutionNativeNarrow = true;
    else if (arg === "--thread-native-narrow") threadNativeNarrow = true;
    else if (arg === "--evolution-root") evolutionRoot = args[++i];
    else if (arg === "--evolution-verified-root") { evolutionRoot = args[++i]; evolutionVerifiedRoot = true; }
    else if (arg === "--evolution-live-root") { evolutionRoot = args[++i]; evolutionLiveRoot = true; }
    else if (arg === "--evolution-coordination-fixture") evolutionCoordinationFixture = true;
    else if (arg === "--evolution-multi-definition-fixture") evolutionMultiDefinitionFixture = true;
    else if (arg === "--evolution-denial-journey") evolutionDenialJourney = true;
    else if (arg === "--evolution-signal-verified-log") evolutionSignalLog = args[++i];
    else if (arg === "--adapter-live") adapterLive = true;
    else if (arg === "--hosted-steer-checkpoint") hostedSteerCheckpoint = true;
    else if (arg === "--thread-pages") threadPages = true;
    else if (arg === "--adapter-restart-same-window") { adapterLive = true; adapterRestartSameWindow = true; }
    else if (arg === "--terminal-status") terminalStatus = args[++i];
    else if (arg === "--degraded-steer") degradedSteer = true;
    else if (arg === "--unknown-dispatch") unknownDispatch = true;
    else if (arg === "--unknown-hosted-effect") { unknownDispatch = true; unknownHostedEffect = true; }
    else if (arg === "--unknown-hosted-effect-foreign") { unknownDispatch = true; unknownHostedEffect = true; hostedEffectForeign = true; }
    else if (arg === "--accepted-unresolved") { unknownDispatch = true; acceptedUnresolved = true; }
    else if (arg === "--confirmed-recovery") confirmedRecovery = true;
    else if (arg === "--adapter-external-socket") adapterExternalSocket = args[++i];
    else if (arg === "--adapter-external-dsh") adapterExternalDsh = true;
    else if (arg === "--adapter-external-entry") adapterExternalEntry = args[++i];
    else if (arg === "--adapter-external-idle") adapterExternalIdle = true;
    else if (arg === "--recovery-signal-file") recoverySignalFile = args[++i];
    else if (arg === "--adapter-external-active") adapterExternalActive = true;
    else if (arg === "--adapter-external-inflight") adapterExternalInflight = true;
    else if (arg === "--adapter-external-restored") adapterExternalRestored = true;
    else if (arg === "--adapter-external-interrupted") adapterExternalInterrupted = true;
    else if (arg === "--adapter-external-completed-loss") adapterExternalCompletedLoss = true;
    else if (arg === "--adapter-external-confirmed-recovery") adapterExternalConfirmedRecovery = true;
    else if (arg === "--adapter-external-same-window-recovery") adapterExternalSameWindowRecovery = true;
    else if (arg === "--adapter-external-same-window-interrupted") adapterExternalSameWindowInterrupted = true;
    else if (arg === "--initial-placement") initialPlacement = args[++i];
    else if (arg === "--resource-sample") resourceSample = true;
    else if (arg === "--resource-with-adapter-fixture") { resourceSample = true; resourceWithAdapterFixture = true; adapterLive = true; }
    else if (arg === "--resource-with-external-adapter") { resourceSample = true; resourceWithExternalAdapter = true; }
    else if (arg === "--orb-idle-no-debug") orbIdleNoDebug = true;
    else if (arg === "--dashboard-only") dashboardOnly = true;
    else if (arg === "--orb-browser-preset") orbBrowserPreset = args[++i];
    else if (arg === "--browser-disable-gpu") browserDisableGpu = true;
    else if (arg === "--check-orb-memory-target") checkOrbMemoryTarget = true;
    else if (arg === "--doctor-timeout-once") doctorTimeoutOnce = true;
    else if (arg === "--resource-cycles") { resourceSample = true; resourceCycles = Number(args[++i]); }
    else if (arg === "--timeout-ms") timeoutMs = Number(args[++i]);
    else if (!arg.startsWith("--") && !exe) exe = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  if (!exe || process.platform !== "win32") {
    throw new Error("Usage on native Windows: node test-windows-ui.mjs <are-companion.exe> [--dashboard-only | --orb-idle-no-debug | --resource-sample | --resource-cycles 1..8 [--resource-with-adapter-fixture]] [--doctor-timeout-once] [--adapter-live [--hosted-steer-checkpoint | --thread-pages | --adapter-restart-same-window | --terminal-status failed|interrupted|cancelled | --unknown-dispatch | --unknown-hosted-effect | --unknown-hosted-effect-foreign | --accepted-unresolved | --confirmed-recovery] | --adapter-external-socket <pipe|tcp://127.0.0.1:port> [--adapter-external-dsh | --adapter-external-idle] [--adapter-external-entry <file>] [--adapter-external-same-window-recovery --recovery-signal-file <new-file>]] [--screenshot <new.png>] [--adapter-screenshot <new.png>] [--thread-screenshot <new.png>] [--evidence-screenshot <new.png>] [--evolution-root <new-path> | --evolution-verified-root <fixture-path> [--evolution-coordination-fixture | --evolution-multi-definition-fixture | --evolution-denial-journey] | --evolution-live-root <existing-path>] [--evolution-narrow | --evolution-native-narrow] [--evolution-screenshot <new.png>] [--evolution-signal-verified-log <fixture-log>] [--timeout-ms 20000]");
  }
  if (evolutionLiveRoot && args.some(arg => arg.startsWith("--")
    && !["--evolution-live-root", "--evolution-screenshot", "--adapter-external-socket", "--timeout-ms"].includes(arg))) {
    throw new Error("--evolution-live-root accepts only --evolution-screenshot, --adapter-external-socket, and --timeout-ms.");
  }
  if (evolutionDenialJourney && !evolutionVerifiedRoot) throw new Error("--evolution-denial-journey requires --evolution-verified-root. The source fixture is copied before ACL testing.");
  if (evolutionNarrow && evolutionRoot && !evolutionVerifiedRoot) throw new Error("--evolution-narrow requires the registry-only default or --evolution-verified-root.");
  if (evolutionNativeNarrow && evolutionRoot && !evolutionVerifiedRoot) throw new Error("--evolution-native-narrow requires the registry-only default or --evolution-verified-root.");
  if (evolutionNativeNarrow && evolutionNarrow) throw new Error("Select native window sizing or WebView2 emulation, not both.");
  if (threadNativeNarrow && (!adapterLive || threadPages || resourceSample)) {
    throw new Error("--thread-native-narrow requires the isolated active --adapter-live fixture without paging or resource mode.");
  }
  if (evolutionCoordinationFixture && (!evolutionVerifiedRoot || evolutionDenialJourney)) {
    throw new Error("--evolution-coordination-fixture requires --evolution-verified-root without the denial journey.");
  }
  if (evolutionMultiDefinitionFixture && (!evolutionVerifiedRoot || evolutionCoordinationFixture || evolutionDenialJourney)) {
    throw new Error("--evolution-multi-definition-fixture requires its verified root without coordination or denial mode.");
  }
  if (adapterLive && adapterExternalSocket) throw new Error("Choose one adapter observation mode.");
  if (hostedSteerCheckpoint && (!adapterLive || threadPages || resourceSample || adapterRestartSameWindow
    || terminalStatus || degradedSteer || unknownDispatch || confirmedRecovery)) {
    throw new Error("--hosted-steer-checkpoint requires the normal isolated --adapter-live fixture.");
  }
  if (threadPages && (!adapterLive || adapterRestartSameWindow || terminalStatus || degradedSteer || unknownDispatch || confirmedRecovery || resourceSample)) {
    throw new Error("--thread-pages requires the isolated --adapter-live fixture without another recovery or resource mode.");
  }
  if (terminalStatus && (!adapterLive || !["failed", "interrupted", "cancelled"].includes(terminalStatus))) {
    throw new Error("--terminal-status requires --adapter-live and failed, interrupted, or cancelled.");
  }
  if (doctorTimeoutOnce && (adapterLive || adapterExternalSocket || resourceSample)) throw new Error("--doctor-timeout-once requires the isolated UI baseline.");
  if (adapterExternalActive && !adapterExternalSocket) throw new Error("--adapter-external-active requires --adapter-external-socket.");
  if (adapterExternalDsh && (!adapterExternalSocket || adapterLive || adapterExternalIdle
    || adapterExternalActive || adapterExternalInflight || adapterExternalRestored
    || adapterExternalInterrupted || adapterExternalCompletedLoss || adapterExternalConfirmedRecovery
    || adapterExternalSameWindowRecovery || resourceSample)) {
    throw new Error("--adapter-external-dsh requires one active DSH observation endpoint without Codex gateway modes.");
  }
  if (adapterExternalInflight && !adapterExternalSocket) throw new Error("--adapter-external-inflight requires --adapter-external-socket.");
  if (adapterExternalRestored && !adapterExternalSocket) throw new Error("--adapter-external-restored requires --adapter-external-socket.");
  if (adapterExternalInterrupted && !adapterExternalSocket) throw new Error("--adapter-external-interrupted requires --adapter-external-socket.");
  if (adapterExternalCompletedLoss && !adapterExternalSocket) throw new Error("--adapter-external-completed-loss requires --adapter-external-socket.");
  if (adapterExternalConfirmedRecovery && !adapterExternalSocket) throw new Error("--adapter-external-confirmed-recovery requires --adapter-external-socket.");
  if ([adapterExternalActive, adapterExternalInflight, adapterExternalRestored, adapterExternalInterrupted, adapterExternalCompletedLoss, adapterExternalConfirmedRecovery].filter(Boolean).length > 1) throw new Error("Choose one external gateway phase.");
  if (adapterExternalSameWindowRecovery && (!adapterExternalSocket || !adapterExternalActive)) throw new Error("--adapter-external-same-window-recovery requires an active external gateway.");
  if (adapterExternalSameWindowInterrupted && !adapterExternalSameWindowRecovery) throw new Error("--adapter-external-same-window-interrupted requires same-window recovery.");
  if (degradedSteer && !adapterLive) throw new Error("--degraded-steer requires --adapter-live.");
  if (unknownDispatch && !adapterLive) throw new Error("--unknown-dispatch requires --adapter-live.");
  if (acceptedUnresolved && !adapterLive) throw new Error("--accepted-unresolved requires --adapter-live.");
  if (confirmedRecovery && !adapterLive) throw new Error("--confirmed-recovery requires --adapter-live.");
  if (initialPlacement && !["top-left", "top-right", "bottom-left", "bottom-right"].includes(initialPlacement)) throw new Error("--initial-placement must be a corner preset.");
  if (adapterExternalSocket && (!(adapterExternalSocket.startsWith("\\\\.\\pipe\\")
    || /^tcp:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(adapterExternalSocket)
      && Number(adapterExternalSocket.slice("tcp://127.0.0.1:".length)) <= 65535)
    || !process.env.ARE_ADAPTER_OBSERVATION_TOKEN)) throw new Error("An authenticated local observation endpoint is required.");
  if ((adapterExternalEntry || adapterExternalIdle) && !adapterExternalSocket) throw new Error("External entry and idle mode require an observation endpoint.");
  if (adapterExternalEntry && !existsSync(adapterExternalEntry)) throw new Error("External ARE entry is unavailable.");
  if (adapterExternalIdle && (adapterExternalActive || adapterExternalInflight || adapterExternalRestored
    || adapterExternalInterrupted || adapterExternalCompletedLoss || adapterExternalConfirmedRecovery)) {
    throw new Error("Idle gateway mode cannot claim an active or recovered backend thread.");
  }
  if (recoverySignalFile && (!adapterExternalSameWindowRecovery || existsSync(recoverySignalFile))) {
    throw new Error("A recovery signal file requires same-window mode and must not already exist.");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120_000) {
    throw new Error("--timeout-ms must be an integer between 1000 and 120000.");
  }
  if (!Number.isSafeInteger(resourceCycles) || resourceCycles < 1 || resourceCycles > 8) {
    throw new Error("--resource-cycles must be an integer between 1 and 8.");
  }
  if (!["default", "renderer-limit-1", "disable-gpu", "renderer-limit-1-disable-gpu"].includes(orbBrowserPreset)
    || (!orbIdleNoDebug && orbBrowserPreset !== "default")) {
    throw new Error("--orb-browser-preset requires --orb-idle-no-debug and an allowlisted test preset.");
  }
  if (browserDisableGpu && orbIdleNoDebug) throw new Error("Use --orb-browser-preset disable-gpu for orb-only tests.");
  if (checkOrbMemoryTarget && orbIdleNoDebug) throw new Error("--check-orb-memory-target needs a rendered orb test.");
  exe = resolve(exe);
  assert.ok(existsSync(exe), `Companion executable not found: ${exe}`);
  if (screenshot) {
    screenshot = resolve(screenshot);
    assert.ok(!existsSync(screenshot), `Screenshot already exists: ${screenshot}`);
    assert.ok(existsSync(dirname(screenshot)), `Screenshot directory does not exist: ${dirname(screenshot)}`);
  }
  if (adapterScreenshot) {
    adapterScreenshot = resolve(adapterScreenshot);
    assert.ok(!existsSync(adapterScreenshot), `Adapter screenshot already exists: ${adapterScreenshot}`);
    assert.ok(existsSync(dirname(adapterScreenshot)), `Adapter screenshot directory does not exist: ${dirname(adapterScreenshot)}`);
  }
  if (threadScreenshot) {
    threadScreenshot = resolve(threadScreenshot);
    assert.ok(!existsSync(threadScreenshot), `Screenshot already exists: ${threadScreenshot}`);
    assert.ok(existsSync(dirname(threadScreenshot)), `Screenshot directory does not exist: ${dirname(threadScreenshot)}`);
  }
  if (decisionScreenshot) {
    decisionScreenshot = resolve(decisionScreenshot);
    assert.ok(!existsSync(decisionScreenshot), `Screenshot already exists: ${decisionScreenshot}`);
    assert.ok(existsSync(dirname(decisionScreenshot)), `Screenshot directory does not exist: ${dirname(decisionScreenshot)}`);
  }
  if (evidenceScreenshot) {
    evidenceScreenshot = resolve(evidenceScreenshot);
    assert.ok(!existsSync(evidenceScreenshot), `Screenshot already exists: ${evidenceScreenshot}`);
    assert.ok(existsSync(dirname(evidenceScreenshot)), `Screenshot directory does not exist: ${dirname(evidenceScreenshot)}`);
  }
  if (appearanceScreenshot) {
    appearanceScreenshot = resolve(appearanceScreenshot);
    assert.ok(!existsSync(appearanceScreenshot), `Screenshot already exists: ${appearanceScreenshot}`);
    assert.ok(existsSync(dirname(appearanceScreenshot)), `Screenshot directory does not exist: ${dirname(appearanceScreenshot)}`);
  }
  if (evolutionScreenshot) {
    evolutionScreenshot = resolve(evolutionScreenshot);
    assert.ok(!existsSync(evolutionScreenshot), `Screenshot already exists: ${evolutionScreenshot}`);
    assert.ok(existsSync(dirname(evolutionScreenshot)), `Screenshot directory does not exist: ${dirname(evolutionScreenshot)}`);
  }
  if (evolutionRoot) {
    evolutionRoot = resolve(evolutionRoot);
    assert.equal(existsSync(evolutionRoot), evolutionVerifiedRoot || evolutionLiveRoot,
      `Evolution test root existence does not match the selected mode: ${evolutionRoot}`);
    assert.ok(existsSync(dirname(evolutionRoot)), `Evolution test root parent does not exist: ${dirname(evolutionRoot)}`);
  }
  if (evolutionSignalLog) {
    evolutionSignalLog = resolve(evolutionSignalLog);
    assert.ok(existsSync(evolutionSignalLog), `Evolution signal fixture log is missing: ${evolutionSignalLog}`);
  }
  if (resourceSample && ((adapterLive && !resourceWithAdapterFixture) || (adapterExternalSocket && !resourceWithExternalAdapter) || evolutionRoot || evolutionSignalLog)) throw new Error("--resource-sample requires the unconfigured baseline or one selected adapter resource mode.");
  if (resourceWithAdapterFixture && (adapterExternalSocket || terminalStatus || degradedSteer || unknownDispatch || confirmedRecovery)) throw new Error("--resource-with-adapter-fixture requires the normal isolated adapter fixture.");
  if (resourceWithExternalAdapter && (!adapterExternalSocket || !adapterExternalActive || resourceWithAdapterFixture || adapterExternalSameWindowRecovery)) throw new Error("--resource-with-external-adapter requires one active external gateway and no recovery mode.");
  if (adapterRestartSameWindow && (resourceSample || terminalStatus || degradedSteer || unknownDispatch || confirmedRecovery || adapterExternalSocket)) throw new Error("--adapter-restart-same-window requires only the normal isolated adapter fixture.");
  if (orbIdleNoDebug && (resourceSample || doctorTimeoutOnce || adapterLive || adapterExternalSocket || evolutionRoot || evolutionSignalLog
    || initialPlacement || screenshot || adapterScreenshot || threadScreenshot || decisionScreenshot || evidenceScreenshot
    || appearanceScreenshot || evolutionScreenshot || evolutionNarrow || evolutionNativeNarrow || threadNativeNarrow)) throw new Error("--orb-idle-no-debug requires an unconfigured orb-only run.");
  if (dashboardOnly && args.length !== 2 && !(args.length === 4 && args.includes("--timeout-ms"))) {
    throw new Error("--dashboard-only requires only the executable and optional --timeout-ms.");
  }
  return {exe, screenshot, adapterScreenshot, threadScreenshot, decisionScreenshot, evidenceScreenshot, appearanceScreenshot, evolutionScreenshot, evolutionNarrow, evolutionNativeNarrow, threadNativeNarrow, evolutionRoot, evolutionVerifiedRoot, evolutionLiveRoot, evolutionCoordinationFixture, evolutionMultiDefinitionFixture, evolutionDenialJourney, evolutionSignalLog, adapterLive, hostedSteerCheckpoint, threadPages, adapterRestartSameWindow, terminalStatus, degradedSteer, unknownDispatch, unknownHostedEffect, hostedEffectForeign, acceptedUnresolved, confirmedRecovery, adapterExternalSocket, adapterExternalDsh, adapterExternalEntry, adapterExternalIdle, recoverySignalFile, adapterExternalActive, adapterExternalInflight, adapterExternalRestored, adapterExternalInterrupted, adapterExternalCompletedLoss, adapterExternalConfirmedRecovery, adapterExternalSameWindowRecovery, adapterExternalSameWindowInterrupted, initialPlacement, resourceSample, resourceWithAdapterFixture, resourceWithExternalAdapter, orbIdleNoDebug, dashboardOnly, orbBrowserPreset, browserDisableGpu, checkOrbMemoryTarget, resourceCycles, doctorTimeoutOnce, timeoutMs};
}

async function awaitRecoverySignal(timeoutMs, signalFile = null) {
  if (signalFile) {
    process.stderr.write("ARE_COMPANION_UI_PHASE_READY\n");
    await poll(() => existsSync(signalFile), timeoutMs, "Recovery coordinator signal file");
    return;
  }
  const lines = createInterface({input: process.stdin, crlfDelay: Infinity});
  let timer;
  try {
    process.stderr.write("ARE_COMPANION_UI_PHASE_READY\n");
    await Promise.race([
      (async () => {
        for await (const line of lines) if (line.trim() === "continue") return;
        throw new Error("Recovery coordinator closed stdin before continuing the dashboard.");
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Recovery coordinator timed out.")), timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); lines.close(); }
}

function processTreeSnapshot(rootPid) {
  // Read-only Windows counters. Traverse parents from this test launch, never all
  // WebView2 processes on the host, because other apps may share that image name.
  const script = `$ErrorActionPreference = 'Stop'
$rootPid = ${rootPid}
$all = @(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name)
$ids = @($rootPid)
for ($i = 0; $i -lt $ids.Count; $i++) {
  $parentId = $ids[$i]
  foreach ($child in $all) {
    if ($child.ParentProcessId -eq $parentId -and $ids -notcontains $child.ProcessId) { $ids += $child.ProcessId }
  }
}
$rows = @()
foreach ($id in $ids) {
  $meta = $all | Where-Object ProcessId -EQ $id | Select-Object -First 1
  if ($null -eq $meta) { continue }
  try {
    $p = Get-Process -Id $id -ErrorAction Stop
    $rows += [pscustomobject]@{ pid = $id; parent_pid = $meta.ParentProcessId; name = $meta.Name; start_time = $p.StartTime.ToUniversalTime().ToString('o'); private_bytes = $p.PrivateMemorySize64; working_set_bytes = $p.WorkingSet64; cpu_seconds = $p.CPU }
  } catch { }
}
@($rows) | ConvertTo-Json -Compress -Depth 3`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], {encoding: "utf8", timeout: 15_000, maxBuffer: 1024 * 1024});
  if (result.error || result.status !== 0) throw new Error(`Windows process-tree counters failed: ${result.error?.message ?? result.stderr.trim()}`);
  const rows = JSON.parse(result.stdout.trim());
  if (!Array.isArray(rows) || !rows.some(row => row.pid === rootPid)) throw new Error("Companion root process disappeared during measurement.");
  return rows;
}

function closeIsolatedDashboard(rootPid) {
  // Post the same WM_CLOSE as the title-bar control, but only after verifying
  // the exact dashboard title and this test launch's root PID. Another ARE
  // window may have the same title and must never be selected by title alone.
  const script = `$ErrorActionPreference = 'Stop'
Add-Type -Namespace AREProbe -Name Win32 -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool EnumWindows(EnumWindowsProc callback, System.IntPtr state);
[System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode)]
public static extern int GetWindowText(System.IntPtr window, System.Text.StringBuilder text, int capacity);
[System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode)]
public static extern int GetWindowTextLength(System.IntPtr window);
[System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode)]
public static extern uint GetWindowThreadProcessId(System.IntPtr window, out uint processId);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool PostMessage(System.IntPtr window, uint message, System.IntPtr wParam, System.IntPtr lParam);
public delegate bool EnumWindowsProc(System.IntPtr window, System.IntPtr state);
public static System.IntPtr[] FindOwnedWindows(uint processId, string title) {
  var matches = new System.Collections.Generic.List<System.IntPtr>();
  EnumWindows((window, state) => {
    uint owner;
    GetWindowThreadProcessId(window, out owner);
    if (owner != processId) return true;
    var text = new System.Text.StringBuilder(GetWindowTextLength(window) + 1);
    GetWindowText(window, text, text.Capacity);
    if (System.String.Equals(text.ToString(), title, System.StringComparison.Ordinal)) matches.Add(window);
    return true;
  }, System.IntPtr.Zero);
  return matches.ToArray();
}

'@
$windows = [AREProbe.Win32]::FindOwnedWindows([uint32]${rootPid}, 'ARE · Observatory')
if ($windows.Length -ne 1) { throw 'Expected exactly one dashboard window owned by the isolated launch.' }
if (-not [AREProbe.Win32]::PostMessage($windows[0], 0x0010, [IntPtr]::Zero, [IntPtr]::Zero)) { throw 'Dashboard close message was rejected.' }
'closed'`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], {encoding: "utf8", timeout: 15_000, maxBuffer: 1024 * 1024});
  if (result.error || result.status !== 0 || result.stdout.trim() !== "closed") throw new Error(`Isolated dashboard close failed: ${result.error?.message ?? result.stderr.trim()}`);
}

function resizeIsolatedDashboard(rootPid, clientWidthPx, clientHeightPx) {
  // Resize only this test launch's titled dashboard. The browser's devicePixelRatio
  // converts requested CSS pixels to the Win32 client coordinates passed here.
  for (const size of [clientWidthPx, clientHeightPx]) {
    if (!Number.isSafeInteger(size) || size < 200 || size > 8192) throw new Error("Invalid native dashboard size");
  }
  const script = `$ErrorActionPreference = 'Stop'
Add-Type -Namespace AREProbe -Name WindowSizing -MemberDefinition @'
[System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)]
public struct Rect { public int Left, Top, Right, Bottom; }
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool EnumWindows(EnumWindowsProc callback, System.IntPtr state);
[System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode)]
public static extern int GetWindowText(System.IntPtr window, System.Text.StringBuilder text, int capacity);
[System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode)]
public static extern int GetWindowTextLength(System.IntPtr window);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern uint GetWindowThreadProcessId(System.IntPtr window, out uint processId);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool GetClientRect(System.IntPtr window, out Rect rect);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool GetWindowRect(System.IntPtr window, out Rect rect);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool SetWindowPos(System.IntPtr window, System.IntPtr after, int x, int y, int width, int height, uint flags);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern System.IntPtr SendMessage(System.IntPtr window, uint message, System.IntPtr wParam, System.IntPtr lParam);
public delegate bool EnumWindowsProc(System.IntPtr window, System.IntPtr state);
public static System.IntPtr[] FindOwnedWindows(uint processId, string title) {
  var matches = new System.Collections.Generic.List<System.IntPtr>();
  EnumWindows((window, state) => {
    uint owner;
    GetWindowThreadProcessId(window, out owner);
    if (owner != processId) return true;
    var text = new System.Text.StringBuilder(GetWindowTextLength(window) + 1);
    GetWindowText(window, text, text.Capacity);
    if (System.String.Equals(text.ToString(), title, System.StringComparison.Ordinal)) matches.Add(window);
    return true;
  }, System.IntPtr.Zero);
  return matches.ToArray();
}
'@
$windows = [AREProbe.WindowSizing]::FindOwnedWindows([uint32]${rootPid}, 'ARE · Observatory')
if ($windows.Length -ne 1) { throw 'Expected exactly one dashboard window owned by the isolated launch.' }
$client = New-Object AREProbe.WindowSizing+Rect
$outer = New-Object AREProbe.WindowSizing+Rect
if (-not [AREProbe.WindowSizing]::GetClientRect($windows[0], [ref]$client) -or
    -not [AREProbe.WindowSizing]::GetWindowRect($windows[0], [ref]$outer)) { throw 'Could not read dashboard window dimensions.' }
$beforeWidth = $client.Right - $client.Left
$beforeHeight = $client.Bottom - $client.Top
$width = ${clientWidthPx} + ($outer.Right - $outer.Left) - $beforeWidth
$height = ${clientHeightPx} + ($outer.Bottom - $outer.Top) - $beforeHeight
$minmax = [Runtime.InteropServices.Marshal]::AllocHGlobal(40)
try {
  for ($offset = 0; $offset -lt 40; $offset += 4) { [Runtime.InteropServices.Marshal]::WriteInt32($minmax, $offset, 0) }
  [void][AREProbe.WindowSizing]::SendMessage($windows[0], 0x0024, [IntPtr]::Zero, $minmax)
  $minTrackWidth = [Runtime.InteropServices.Marshal]::ReadInt32($minmax, 24)
} finally { [Runtime.InteropServices.Marshal]::FreeHGlobal($minmax) }
if (-not [AREProbe.WindowSizing]::SetWindowPos($windows[0], [IntPtr]::Zero, 0, 0, $width, $height, 0x0006)) { throw 'Dashboard resize request was rejected.' }
Start-Sleep -Milliseconds 100
if (-not [AREProbe.WindowSizing]::GetClientRect($windows[0], [ref]$client)) { throw 'Could not read resized dashboard client dimensions.' }
[pscustomobject]@{before_width=$beforeWidth; before_height=$beforeHeight; after_width=$client.Right-$client.Left; after_height=$client.Bottom-$client.Top; requested_outer_width=$width; min_track_width=$minTrackWidth} | ConvertTo-Json -Compress`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], {encoding: "utf8", timeout: 15_000, maxBuffer: 1024 * 1024});
  if (result.error || result.status !== 0) throw new Error(`Native dashboard resize failed: ${result.error?.message ?? result.stderr.trim()}`);
  return JSON.parse(result.stdout.trim());
}

async function measureProcessTree(rootPid, intervalMs = 10_000) {
  const before = processTreeSnapshot(rootPid);
  await pause(intervalMs);
  const after = processTreeSnapshot(rootPid);
  const prior = new Map(before.map(row => [`${row.pid}:${row.start_time}`, row]));
  const cpuSeconds = after.reduce((sum, row) => sum + Math.max(0, row.cpu_seconds - (prior.get(`${row.pid}:${row.start_time}`)?.cpu_seconds ?? 0)), 0);
  return {interval_ms: intervalMs, process_count: after.length, process_names: after.map(row => row.name), private_bytes: after.reduce((sum, row) => sum + row.private_bytes, 0), working_set_bytes: after.reduce((sum, row) => sum + row.working_set_bytes, 0), cpu_seconds: Number(cpuSeconds.toFixed(6)), processes: after};
}

async function testOrbIdleNoDebug({exe, timeoutMs, orbBrowserPreset}) {
  const profile = await mkdtemp(join(tmpdir(), "are-companion-orb-idle-"));
  const checks = [];
  let child;
  let stderr = "";
  try {
    const launchEnv = {...process.env};
    for (const key of ["ARE_COMPANION_NODE", "ARE_COMPANION_ENTRY", "ARE_COMPANION_OBSERVATION_SOCKET",
      "ARE_ADAPTER_OBSERVATION_TOKEN", "ARE_COMPANION_PREFERENCES_PATH", "ARE_COMPANION_EVOLUTION_ROOT",
      "ARE_COMPANION_EVOLUTION_SIGNAL_LOG", "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"]) delete launchEnv[key];
    launchEnv.ARE_COMPANION_PREFERENCES_PATH = join(profile, "companion.json");
    launchEnv.WEBVIEW2_USER_DATA_FOLDER = join(profile, "webview2");
    const browserPresets = {
      default: null,
      "renderer-limit-1": "--renderer-process-limit=1",
      "disable-gpu": "--disable-gpu",
      "renderer-limit-1-disable-gpu": "--renderer-process-limit=1 --disable-gpu",
    };
    if (browserPresets[orbBrowserPreset]) launchEnv.WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = browserPresets[orbBrowserPreset];
    child = spawn(exe, ["--webview-orb"], {env: launchEnv, stdio: ["ignore", "ignore", "pipe"], windowsHide: false});
    child.stderr.on("data", chunk => { stderr = (stderr + String(chunk)).slice(-8192); });
    await poll(async () => {
      if (child.exitCode !== null) throw new Error(`Companion exited with code ${child.exitCode}`);
      const rows = processTreeSnapshot(child.pid);
      return rows.filter(row => row.name.toLowerCase() === "msedgewebview2.exe").length >= 3;
    }, timeoutMs, "Orb WebView2 process tree without debugger");
    checks.push("orb-webview-process-tree-observed", "debugger-disabled");
    await pause(5_000);
    const sample = await measureProcessTree(child.pid);
    checks.push("orb-idle-process-tree-sampled");
    return {schema_version: "are.companion-windows-orb-idle-sample/v1", ok: true,
      checks, debugger_enabled: false, browser_preset: orbBrowserPreset, sample, authority_effect: "none"};
  } catch (error) {
    return {schema_version: "are.companion-windows-orb-idle-sample/v1", ok: false,
      checks, browser_preset: orbBrowserPreset, error: error.message, stderr: stderr.trim() || null, authority_effect: "none"};
  } finally {
    if (child && child.exitCode === null) {
      const stopped = new Promise(resolve => child.once("exit", resolve));
      child.kill();
      await Promise.race([stopped, pause(5_000)]);
    }
    await rm(profile, {recursive: true, force: true, maxRetries: 8, retryDelay: 250}).catch(() => {});
  }
}

function fakeBackendChild() {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = () => { child.emit("exit", 0, "SIGTERM"); return true; };
  return child;
}

async function startLiveAdapterFixture(degradedSteer = false, unknownDispatch = false, acceptedUnresolved = false, confirmedRecovery = false, terminalStatus, restartIdentity = null, threadPages = false, unknownHostedEffect = false, hostedEffectForeign = false) {
  const {createPersistentGateway, createMemoryGatewaySessionStore, connectGatewayRpcTransport} = await import("../../../packages/codex-app-server-wrapper/index.mjs");
  const {digestValue} = await import("../../../packages/codex-app-server-wrapper/src/canonical.mjs");
  const name = restartIdentity?.name ?? `${process.pid}-${randomUUID()}`;
  const listenPath = restartIdentity?.listenPath ?? `\\\\.\\pipe\\are-ui-gateway-${name}`;
  const observationPath = restartIdentity?.observationPath ?? `\\\\.\\pipe\\are-ui-observation-${name}`;
  const connectionToken = restartIdentity?.connectionToken ?? randomBytes(32).toString("base64url");
  const observationToken = restartIdentity?.observationToken ?? randomBytes(32).toString("base64url");
  let threadPageRevision = 0;
  const sessionStore = createMemoryGatewaySessionStore({store_id: `are-ui-fixture:${name}`});
  if (unknownDispatch && (!unknownHostedEffect || hostedEffectForeign)) {
    assert.equal(sessionStore.append({event_kind: "session-started", consumer_id: "windows:unresolved-fixture", content: {lane: "interaction-bound", resume_token_digest: "fixture-digest"}}).ok, true);
    const threadRef = unknownHostedEffect
      ? `backend-thread:${"a".repeat(64)}`
      : `backend-thread:${digestValue("private-unresolved-fixture-thread")}`;
    const requestKey = "fixture:unknown";
    const requestDigest = "b".repeat(64);
    if (acceptedUnresolved || unknownHostedEffect) assert.equal(sessionStore.append({event_kind: "thread-bound", consumer_id: "windows:unresolved-fixture",
      content: {thread_ref: threadRef}}).ok, true);
    assert.equal(sessionStore.append({event_kind: "dispatch-intent", consumer_id: "windows:unresolved-fixture",
      content: {request_key: requestKey, method: unknownHostedEffect ? "cyberalchemy/hostedEffect/execute" : "turn/start", binding_digest: requestDigest,
        ...(acceptedUnresolved || unknownHostedEffect ? {thread_ref: threadRef} : {})}}).ok, true);
    if (acceptedUnresolved) {
      const material = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: "c".repeat(64),
        request_key_digest: digestValue(requestKey), request_digest: requestDigest,
        response_digest: "d".repeat(64)};
      assert.equal(sessionStore.append({event_kind: "host-observation", consumer_id: "windows:unresolved-fixture",
        content: {observation: {...material, observation_digest: digestValue(material)}}}).ok, true);
    }
  }
  const gateway = createPersistentGateway({
    listen_path: listenPath,
    observation_listen_path: observationPath,
    connection_token: connectionToken,
    observation_token: observationToken,
    session_store: sessionStore,
    wrapper_factory: () => ({
      processClientMessage: async (message) => ({to_server: [message], to_client: []}),
      processServerMessage: async (message) => ({to_server: [], to_client: [message]}),
      observeReasoningThreads: () => (threadPages
        ? Array.from({length: 40}, (_, index) => `backend-thread:${index === 0 ? "a".repeat(64) : `b${index.toString(16).padStart(63, "0")}`}`)
        : [`backend-thread:${"a".repeat(64)}`]).map((thread_ref) => ({thread_ref,
          phase: terminalStatus ? "turn-completed" : "turn-active", reasoning_epoch_digest: "b".repeat(64),
          checkpoint_digest: (threadPageRevision === 0 ? "c" : "d").repeat(64),
          latest_frontier_digest: null, latest_frontier_event_sequence: null,
          last_completion_status: terminalStatus ?? null, plan_context_digest: "f".repeat(64),
          plan_context_event_sequence: 3, plan_obligation_count: 7, plan_completed_count: 2,
          plan_open_decision_count: 1, plan_active_slice_ordinal: 3, plan_active_slice_status: "active"})),
      inspectState: () => ({degraded_steer_threads: degradedSteer ? ["private-degraded-thread"] : []}),
      observeDecisions: () => restartIdentity ? [] : [{decision_type: "effect-evaluation", outcome: "gate", thread_ref: `backend-thread:${"a".repeat(64)}`, decision_digest: "d".repeat(64), evidence_event_digest: "e".repeat(64), event_sequence: 4, observed_at_unix_ms: Date.now(), reason_codes: ["effect.owner-approval-required"]}],
      prepareForEviction: ({reason}) => ({ok: true, checkpoint_digest: `checkpoint:${reason}`, epoch_digest: `epoch:${reason}`, preparation_digest: `preparation:${reason}`}),
    }),
    spawn_impl: fakeBackendChild,
  });
  await gateway.start();
  try {
    const transport = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "windows:ui-fixture", lane: "interaction-bound", connection_token: connectionToken});
    await transport.ready;
    if (unknownHostedEffect && !hostedEffectForeign) {
      const consumerId = "windows:ui-fixture";
      const threadRef = `backend-thread:${"a".repeat(64)}`;
      assert.equal(sessionStore.append({event_kind: "thread-bound", consumer_id: consumerId,
        content: {thread_ref: threadRef}}).ok, true);
      assert.equal(sessionStore.append({event_kind: "dispatch-intent", consumer_id: consumerId,
        content: {request_key: "fixture:unknown-hosted-effect", method: "cyberalchemy/hostedEffect/execute",
          binding_digest: "b".repeat(64), thread_ref: threadRef}}).ok, true);
    }
    if (confirmedRecovery) {
      const consumerId = "windows:ui-fixture";
      const marker = `are-gateway-client:${"a".repeat(32)}`;
      const intent = {request_key: "fixture:recovered", method: "turn/start", binding_digest: "b".repeat(64),
        thread_ref: `backend-thread:${"a".repeat(64)}`, client_message_id: marker};
      assert.equal(sessionStore.append({event_kind: "thread-bound", consumer_id: consumerId,
        content: {thread_ref: intent.thread_ref}}).ok, true);
      assert.equal(sessionStore.append({event_kind: "dispatch-intent", consumer_id: consumerId,
        content: intent}).ok, true);
      const material = {kind: "turn-marker-observed", thread_ref: intent.thread_ref,
        turn_ref: "d".repeat(64), request_key_digest: digestValue(intent.request_key),
        request_digest: intent.binding_digest, client_message_id_digest: digestValue(marker),
        history_response_digest: "e".repeat(64), turn_status: "completed"};
      const observation = {...material, observation_digest: digestValue(material)};
      assert.equal(sessionStore.append({event_kind: "host-observation", consumer_id: consumerId,
        content: {observation}}).ok, true);
      assert.equal(sessionStore.append({event_kind: "dispatch-recovered", consumer_id: consumerId,
        content: {request_key: intent.request_key, request_digest: intent.binding_digest,
          thread_ref: intent.thread_ref, turn_ref: material.turn_ref, turn_status: material.turn_status,
          host_observation_digest: observation.observation_digest, semantic_receipt_digest: "f".repeat(64),
          recovery_digest: "1".repeat(64)}}).ok, true);
    }
    return {gateway, transport, name, listenPath, observationPath, connectionToken, observationToken, sessionStore,
      mutateThreadObservation: () => { threadPageRevision += 1; }};
  } catch (error) {
    await gateway.close();
    sessionStore.close();
    throw error;
  }
}

async function freeLocalPort() {
  const server = createServer();
  await new Promise((done, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", done);
  });
  const port = server.address().port;
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
  return port;
}

async function poll(work, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await work();
      if (value) return value;
    } catch (error) { lastError = error; }
    await pause(POLL_MS);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ""}`);
}

async function listPages(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, {signal: AbortSignal.timeout(1500)});
  if (!response.ok) throw new Error(`WebView2 debugger returned HTTP ${response.status}`);
  const targets = await response.json();
  return targets.filter(target => target.type === "page");
}

function matchingPage(pages, file) {
  const matches = pages.filter(page => {
    try { return new URL(page.url).pathname.endsWith(`/${file}`); }
    catch { return false; }
  });
  if (matches.length > 1) throw new Error(`More than one ${file} WebView2 page exists in the isolated test profile.`);
  return matches[0] ?? null;
}

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener("message", event => {
      let message;
      try { message = JSON.parse(String(event.data)); }
      catch { return; }
      if (!message.id) return;
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      clearTimeout(request.timer);
      if (message.error) request.reject(new Error(`${request.method}: ${message.error.message}`));
      else request.resolve(message.result);
    });
    socket.addEventListener("close", () => {
      for (const request of this.pending.values()) {
        clearTimeout(request.timer);
        request.reject(new Error("WebView2 debugger connection closed."));
      }
      this.pending.clear();
    });
  }

  static async connect(url, timeoutMs) {
    const socket = new WebSocket(url);
    await new Promise((done, reject) => {
      const timer = setTimeout(() => reject(new Error("WebView2 debugger connection timed out.")), timeoutMs);
      socket.addEventListener("open", () => { clearTimeout(timer); done(); }, {once: true});
      socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Could not connect to the WebView2 page.")); }, {once: true});
    });
    return new Cdp(socket);
  }

  send(method, params = {}, timeoutMs = 5000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out.`));
      }, timeoutMs);
      this.pending.set(id, {method, resolve, reject, timer});
      this.socket.send(JSON.stringify({id, method, params}));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {expression, returnByValue: true, awaitPromise: true});
    if (result.exceptionDetails) throw new Error(`WebView script failed: ${result.exceptionDetails.text}`);
    return result.result?.value;
  }

  close() { this.socket.close(); }
}

async function clickElement(cdp, selector) {
  const box = await cdp.evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return null;
    element.scrollIntoView({block: "center", inline: "nearest"});
    const rect = element.getBoundingClientRect();
    return {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height};
  })()`);
  assert.ok(box?.width > 0 && box?.height > 0, `Visible click target missing: ${selector}`);
  await cdp.send("Input.dispatchMouseEvent", {type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1});
  await cdp.send("Input.dispatchMouseEvent", {type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1});
}

async function pressEnter(cdp) {
  await cdp.send("Input.dispatchKeyEvent", {type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13});
  await cdp.send("Input.dispatchKeyEvent", {type: "char", text: "\r", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13});
  await cdp.send("Input.dispatchKeyEvent", {type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13});
}

async function dashboardState(cdp) {
  return cdp.evaluate(`(() => {
    const main = document.querySelector(".app-shell");
    const overview = document.querySelector("#panel-overview");
    const title = document.querySelector("#overview-title");
    const rect = main?.getBoundingClientRect();
    const style = main && getComputedStyle(main);
    return {
      url: location.href,
      readyState: document.readyState,
      title: document.title,
      bodyTextLength: document.body?.innerText.trim().length ?? 0,
      appShellPresent: Boolean(main),
      appShellWidth: rect?.width ?? 0,
      appShellHeight: rect?.height ?? 0,
      appShellDisplay: style?.display ?? null,
      overviewVisible: Boolean(overview && !overview.hidden && title && getComputedStyle(title).visibility === "visible"),
      overviewTitle: title?.innerText ?? null,
      overviewSummary: document.querySelector("#overview-summary")?.innerText ?? null,
      connectionTitle: document.querySelector("#connection-title")?.innerText ?? null,
      connectionDetail: document.querySelector("#connection-detail")?.innerText ?? null,
      productStatus: document.querySelector("#product-status")?.textContent ?? null,
      adapterSummary: document.querySelector("#overview-adapter-title")?.innerText ?? null,
      adapterSummaryDetail: document.querySelector("#overview-adapter-detail")?.innerText ?? null,
      adapterTechnicalDetail: document.querySelector("#overview-adapter-technical")?.textContent ?? null,
      adapterTechnicalOpen: document.querySelector(".overview-adapter-details")?.open ?? null,
      navCount: document.querySelectorAll(".nav-item").length,
      tauriInvokePresent: Boolean(globalThis.__TAURI__?.core?.invoke)
    };
  })()`);
}

async function saveScreenshot(cdp, path) {
  const image = await cdp.send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
  await writeFile(path, Buffer.from(image.data, "base64"), {flag: "wx"});
}

function setReadDeny(path, account, deny) {
  const result = spawnSync("icacls", [path, deny ? "/deny" : "/remove:d", deny ? `${account}:(R)` : account], {
    encoding: "utf8", timeout: 10_000, windowsHide: true,
  });
  assert.equal(result.status, 0, `Could not ${deny ? "deny" : "restore"} disposable ledger read access: ${result.stderr || result.stdout}`);
}

async function testUi({exe, screenshot, adapterScreenshot, threadScreenshot, decisionScreenshot, evidenceScreenshot, appearanceScreenshot, evolutionScreenshot, evolutionNarrow, evolutionNativeNarrow, threadNativeNarrow, evolutionRoot, evolutionVerifiedRoot, evolutionCoordinationFixture, evolutionMultiDefinitionFixture, evolutionDenialJourney, evolutionSignalLog, adapterLive, hostedSteerCheckpoint, threadPages, adapterRestartSameWindow, terminalStatus, degradedSteer, unknownDispatch, unknownHostedEffect, hostedEffectForeign, acceptedUnresolved, confirmedRecovery, adapterExternalSocket, adapterExternalDsh, adapterExternalEntry, adapterExternalIdle, recoverySignalFile, adapterExternalActive, adapterExternalInflight, adapterExternalRestored, adapterExternalInterrupted, adapterExternalCompletedLoss, adapterExternalConfirmedRecovery, adapterExternalSameWindowRecovery, adapterExternalSameWindowInterrupted, initialPlacement, resourceSample, resourceWithAdapterFixture, resourceWithExternalAdapter, browserDisableGpu, checkOrbMemoryTarget, resourceCycles, doctorTimeoutOnce, timeoutMs}) {
  const liveAdapter = adapterLive || Boolean(adapterExternalSocket);
  const externalThread = adapterExternalActive || adapterExternalInflight || adapterExternalRestored || adapterExternalInterrupted || adapterExternalCompletedLoss || adapterExternalConfirmedRecovery;
  const externalRecoveredDecisions = adapterExternalRestored || adapterExternalInterrupted || adapterExternalCompletedLoss || adapterExternalConfirmedRecovery;
  let port = await freeLocalPort();
  const profile = await mkdtemp(join(tmpdir(), "are-companion-ui-"));
  const checks = [];
  const clients = [];
  let nativeNarrowWindow = null;
  let threadNativeNarrowWindow = null;
  let child;
  let orb;
  let dashboard;
  let pages = [];
  let preClickTargetIds = new Set();
  let stderr = "";
  let lastOrbState = null;
  let lastDashboardState = null;
  let adapterFixture;
  let hostedObservationServer;
  let hostedObservationPort;
  let hostedObservationToken;
  let pendingHostedSteerCheckpoint = true;
  let staleHostedObservation = false;
  let hostedObservationReads = 0;
  let orbResources;
  let deniedLedger;
  let denialAccount;
  let ledgerReadDenied = false;
  const doctorCallCount = join(profile, "doctor-call-count.txt");
  try {
    if (evolutionDenialJourney) {
      const copiedRoot = join(profile, "evolution-fixture");
      await cp(evolutionRoot, copiedRoot, {recursive: true, force: false, errorOnExist: true});
      evolutionRoot = copiedRoot;
      const commitDirectory = join(copiedRoot, "ledgers", "commits");
      const sqliteLedger = join(copiedRoot, "evolution-ledger.sqlite");
      assert.ok(!(existsSync(sqliteLedger) && existsSync(commitDirectory)),
        "The copied Evolution fixture must not mix SQLite and file-backed ledgers.");
      if (existsSync(sqliteLedger)) {
        deniedLedger = sqliteLedger;
      } else {
        const commits = await readdir(commitDirectory);
        assert.equal(commits.length, 1, "The copied Evolution fixture must contain exactly one commit record.");
        deniedLedger = join(commitDirectory, commits[0]);
      }
      const account = spawnSync("whoami", [], {encoding: "utf8", timeout: 10_000, windowsHide: true});
      assert.equal(account.status, 0, "Could not identify the disposable fixture owner.");
      denialAccount = account.stdout.trim();
      assert.ok(denialAccount, "Disposable fixture owner is empty.");
    }
    const signalLogBefore = evolutionSignalLog ? await readFile(evolutionSignalLog) : null;
    if (adapterLive) adapterFixture = await startLiveAdapterFixture(degradedSteer, unknownDispatch, acceptedUnresolved, confirmedRecovery, terminalStatus, null, threadPages, unknownHostedEffect, hostedEffectForeign);
    if (hostedSteerCheckpoint) {
      hostedObservationToken = randomBytes(32).toString("hex");
      const threadRef = `backend-thread:${"a".repeat(64)}`;
      hostedObservationServer = createHttpServer((request, response) => {
        const requested = new URL(request.url ?? "/", "http://127.0.0.1");
        if (request.method !== "GET" || requested.pathname !== "/api/observation/rejoin"
          || requested.searchParams.get("refs") !== threadRef
          || request.headers.authorization !== `Bearer ${hostedObservationToken}`) {
          response.writeHead(403, {"content-length": "0"});
          response.end();
          return;
        }
        hostedObservationReads += 1;
        const payload = JSON.stringify({ok: true, value: {schema_version: "are.hosted-rejoin-observation/v1",
          scope: "managed-hosted-client-only", authority_effect: "none",
          observed_at_unix_ms: Date.now() - (staleHostedObservation ? 10_000 : 0),
          rows: [{thread_ref: threadRef, status: "hosted-owned", reason_code: null,
            pending_steer_checkpoint: pendingHostedSteerCheckpoint}]}});
        response.writeHead(200, {"content-type": "application/json", "content-length": Buffer.byteLength(payload)});
        response.end(payload);
      });
      await new Promise((resolveListen, rejectListen) => {
        hostedObservationServer.once("error", rejectListen);
        hostedObservationServer.listen(0, "127.0.0.1", resolveListen);
      });
      hostedObservationPort = hostedObservationServer.address().port;
    }
    if (initialPlacement) await writeFile(join(profile, "companion.json"), JSON.stringify({skin: "verdant", orbPlacement: initialPlacement}), {flag: "wx"});
    const launchEnv = {...process.env};
    for (const key of ["ARE_COMPANION_NODE", "ARE_COMPANION_ENTRY", "ARE_COMPANION_OBSERVATION_SOCKET", "ARE_ADAPTER_OBSERVATION_TOKEN", "ARE_COMPANION_PREFERENCES_PATH", "ARE_COMPANION_EVOLUTION_ROOT", "ARE_COMPANION_EVOLUTION_SIGNAL_LOG", "ARE_COMPANION_HOSTED_REJOIN_URL", "ARE_HOSTED_REJOIN_OBSERVATION_TOKEN"]) delete launchEnv[key];
    launchEnv.ARE_COMPANION_PREFERENCES_PATH = join(profile, "companion.json");
    if (hostedSteerCheckpoint) {
      launchEnv.ARE_COMPANION_HOSTED_REJOIN_URL = `http://127.0.0.1:${hostedObservationPort}/api/observation/rejoin`;
      launchEnv.ARE_HOSTED_REJOIN_OBSERVATION_TOKEN = hostedObservationToken;
    }
    if (adapterFixture || adapterExternalSocket) {
      launchEnv.ARE_COMPANION_NODE = join(dirname(exe), "node", "node.exe");
      launchEnv.ARE_COMPANION_ENTRY = adapterExternalEntry ?? join(dirname(exe), "are", "cyberAlchemy-v2", "implementation", "agent-reasoning-engine", "bin", "are.mjs");
      launchEnv.ARE_COMPANION_OBSERVATION_SOCKET = adapterFixture?.observationPath ?? adapterExternalSocket;
      launchEnv.ARE_ADAPTER_OBSERVATION_TOKEN = adapterFixture?.observationToken ?? process.env.ARE_ADAPTER_OBSERVATION_TOKEN;
      assert.ok(existsSync(launchEnv.ARE_COMPANION_NODE) && existsSync(launchEnv.ARE_COMPANION_ENTRY), "Extracted development runtime is unavailable.");
    }
    if (doctorTimeoutOnce) {
      const bundledNode = join(dirname(exe), "node", "node.exe");
      const realEntry = join(dirname(exe), "are", "cyberAlchemy-v2", "implementation", "agent-reasoning-engine", "bin", "are.mjs");
      assert.ok(existsSync(bundledNode) && existsSync(realEntry), "Extracted development runtime is unavailable.");
      const fixture = join(profile, "doctor-timeout-once.mjs");
      await writeFile(fixture, `import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
const countFile = ${JSON.stringify(doctorCallCount)};
const args = process.argv.slice(2);
if (args[0] === "doctor") {
  const count = (existsSync(countFile) ? Number(readFileSync(countFile, "utf8")) : 0) + 1;
  writeFileSync(countFile, String(count));
  if (count === 1) await new Promise(resolve => setTimeout(resolve, 20_000));
}
const result = spawnSync(process.execPath, [${JSON.stringify(realEntry)}, ...args], {encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
`, {flag: "wx"});
      launchEnv.ARE_COMPANION_NODE = bundledNode;
      launchEnv.ARE_COMPANION_ENTRY = fixture;
    }
    child = spawn(exe, ["--webview-orb"], {
      cwd: dirname(exe),
      env: {
        ...launchEnv,
        ...(evolutionRoot ? {ARE_COMPANION_EVOLUTION_ROOT: evolutionRoot} : {}),
        ...(evolutionSignalLog ? {ARE_COMPANION_EVOLUTION_SIGNAL_LOG: evolutionSignalLog} : {}),
        WEBVIEW2_USER_DATA_FOLDER: profile,
        WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-address=127.0.0.1 --remote-debugging-port=${port}${browserDisableGpu ? " --disable-gpu" : ""}`,
      },
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: false,
    });
    child.stderr.on("data", chunk => { stderr = (stderr + String(chunk)).slice(-8192); });
    const orbPage = await poll(async () => {
      if (child.exitCode !== null) throw new Error(`Companion exited with code ${child.exitCode}`);
      pages = await listPages(port);
      return matchingPage(pages, "orb.html");
    }, timeoutMs, "Floating orb page");
    orb = await Cdp.connect(orbPage.webSocketDebuggerUrl, timeoutMs);
    clients.push(orb);
    const orbState = await poll(async () => {
      const state = await orb.evaluate(`(() => {
        const element = document.querySelector("#orb");
        const rect = element?.getBoundingClientRect();
        return {readyState: document.readyState, title: document.title, present: Boolean(element), width: rect?.width ?? 0, height: rect?.height ?? 0, invokePresent: Boolean(globalThis.__TAURI__?.core?.invoke)};
      })()`);
      lastOrbState = state;
      return state.readyState === "complete" && state.present && state.invokePresent ? state : null;
    }, timeoutMs, "Floating orb document readiness");
    assert.ok(orbState.present && orbState.width > 0 && orbState.height > 0, "Floating orb did not render.");
    assert.equal(orbState.invokePresent, true, "Tauri bridge missing from floating orb.");
    checks.push("orb-rendered", "tauri-bridge-present");
    if (checkOrbMemoryTarget) {
      const result = await orb.evaluate(`(async () => {
        const invoke = globalThis.__TAURI__.core.invoke;
        await invoke("set_orb_memory_target", {target: "low"});
        await invoke("set_orb_memory_target", {target: "normal"});
        await invoke("set_orb_memory_target", {target: "low"});
        try { await invoke("set_orb_memory_target", {target: "invalid"}); return "invalid-accepted"; }
        catch { return "targets-accepted-invalid-rejected"; }
      })()`);
      assert.equal(result, "targets-accepted-invalid-rejected", "Orb memory target did not acknowledge its closed API contract.");
      checks.push("orb-low-memory-target-acknowledged", "orb-normal-memory-target-acknowledged", "orb-memory-target-invalid-rejected");
    }
    if (resourceSample) {
      await pause(5_000);
      if (resourceWithExternalAdapter) process.stderr.write('ARE_COMPANION_UI_RESOURCE_PHASE {"cycle":0,"phase":"orb"}\n');
      orbResources = await measureProcessTree(child.pid);
      checks.push("orb-process-tree-resource-sampled");
    }
    if (initialPlacement) {
      const position = await orb.evaluate('({x: window.screenX, y: window.screenY, left: screen.availLeft, top: screen.availTop, width: screen.availWidth, height: screen.availHeight})');
      assert.equal(initialPlacement.includes("left") ? position.x < position.left + position.width / 2 : position.x > position.left + position.width / 2, true, `Saved placement did not set orb horizontal corner: ${JSON.stringify(position)}`);
      assert.equal(initialPlacement.startsWith("top") ? position.y < position.top + position.height / 2 : position.y > position.top + position.height / 2, true, `Saved placement did not set orb vertical corner: ${JSON.stringify(position)}`);
      checks.push("saved-orb-placement-reapplied-on-cold-start");
    }

    await orb.evaluate(`(() => {
      globalThis.__areUiTestErrors = [];
      addEventListener("unhandledrejection", event => globalThis.__areUiTestErrors.push(String(event.reason)));
      return true;
    })()`);
    preClickTargetIds = new Set((await listPages(port)).map(page => page.id));
    await clickElement(orb, "#orb");
    const dashboardPage = await poll(async () => {
      pages = await listPages(port);
      return matchingPage(pages, "dashboard.html");
    }, timeoutMs, "Dashboard page after orb click");
    dashboard = await Cdp.connect(dashboardPage.webSocketDebuggerUrl, timeoutMs);
    clients.push(dashboard);
    let state = await poll(async () => {
      const current = await dashboardState(dashboard);
      lastDashboardState = current;
      return current.readyState === "complete" && current.appShellPresent ? current : null;
    }, timeoutMs, "Dashboard document readiness");
    assert.ok(state.appShellPresent && state.appShellWidth >= 600 && state.appShellHeight >= 400, `Dashboard app shell is absent or zero-sized: ${JSON.stringify(state)}`);
    assert.ok(state.bodyTextLength >= 200 && state.overviewVisible && state.navCount === 7, `Dashboard is blank or missing its overview: ${JSON.stringify(state)}`);
    assert.equal(state.tauriInvokePresent, true, "Tauri bridge missing from dashboard.");
    checks.push("dashboard-opened", "dashboard-not-blank", "dashboard-overview-visible");
    if (doctorTimeoutOnce) {
      await poll(async () => existsSync(doctorCallCount) ? Number(await readFile(doctorCallCount, "utf8")) : null,
        timeoutMs, "First diagnostic invocation");
      assert.equal((await dashboardState(dashboard)).connectionTitle, "Reading ARE…", "The dashboard claimed health before the timed-out diagnostic recovered.");
      checks.push("doctor-timeout-keeps-health-pending");
    }
    if (resourceSample) {
      const cycles = [];
      for (let index = 0; index < resourceCycles; index++) {
        if (resourceWithAdapterFixture || resourceWithExternalAdapter) {
          await poll(async () => {
            const observed = await dashboard.evaluate(`({posture: document.querySelector("#adapter-observation-status")?.textContent, path: document.querySelector("#overview-adapter-title")?.textContent})`);
            return observed.posture === "Observed" && observed.path === (resourceWithExternalAdapter ? "Backend path ready" : "Path observed") ? observed : null;
          }, timeoutMs, `Connected adapter observation ${index + 1}`);
          await poll(async () => {
            const readiness = await dashboard.evaluate(`({disabled: document.querySelector("#refresh")?.disabled, title: document.querySelector("#connection-title")?.textContent})`);
            return !readiness.disabled && readiness.title === "ARE diagnostic passed" ? readiness : null;
          }, timeoutMs, `Completed product diagnostic ${index + 1}`);
          const refreshPosture = await dashboard.evaluate(`(() => {
            document.querySelector("#refresh")?.click();
            return document.querySelector("#adapter-observation-status")?.textContent;
          })()`);
          assert.equal(refreshPosture, "Reading…", "The connected adapter refresh did not begin.");
          await poll(async () => (await dashboard.evaluate(`document.querySelector("#adapter-observation-status")?.textContent`)) === "Observed", timeoutMs, `Connected adapter refresh ${index + 1}`);
          if (resourceWithExternalAdapter) {
            await clickElement(dashboard, '[data-panel="threads"]');
            await poll(async () => {
              const observed = await dashboard.evaluate('({status: document.querySelector("#thread-observation-status")?.textContent, count: document.querySelector("#thread-count")?.textContent})');
              return observed.status === "Observed" && observed.count === "1" ? observed : null;
            }, timeoutMs, `Installed Codex thread observation ${index + 1}`);
            await clickElement(dashboard, '[data-panel="decisions"]');
            await poll(async () => {
              const observed = await dashboard.evaluate('({status: document.querySelector("#decision-observation-status")?.textContent, count: document.querySelector("#decision-count")?.textContent})');
              return observed.status === "Observed" && Number(observed.count) > 0 ? observed : null;
            }, timeoutMs, `Installed Codex decision observation ${index + 1}`);
            await clickElement(dashboard, '[data-panel="threads"]');
          }
        }
        await pause(5_000);
        if (resourceWithExternalAdapter) process.stderr.write(`ARE_COMPANION_UI_RESOURCE_PHASE ${JSON.stringify({cycle: index + 1, phase: "dashboard"})}\n`);
        const dashboardResources = await measureProcessTree(child.pid);
        closeIsolatedDashboard(child.pid);
        await poll(async () => {
          const current = await listPages(port);
          return !matchingPage(current, "dashboard.html") && matchingPage(current, "orb.html");
        }, timeoutMs, `Dashboard close ${index + 1} with orb remaining`);
        await pause(5_000);
        if (resourceWithExternalAdapter) process.stderr.write(`ARE_COMPANION_UI_RESOURCE_PHASE ${JSON.stringify({cycle: index + 1, phase: "dashboard_closed"})}\n`);
        const closedResources = await measureProcessTree(child.pid);
        await clickElement(orb, "#orb");
        const reopenedPage = await poll(async () => matchingPage(await listPages(port), "dashboard.html"), timeoutMs, `Dashboard reopen ${index + 1}`);
        const reopenedDashboard = await Cdp.connect(reopenedPage.webSocketDebuggerUrl, timeoutMs);
        clients.push(reopenedDashboard);
        await poll(async () => {
          const reopenedState = await dashboardState(reopenedDashboard);
          return reopenedState.readyState === "complete" && reopenedState.overviewVisible && reopenedState.navCount === 7
            && reopenedState.bodyTextLength >= 200;
        }, timeoutMs, `Reopened dashboard ${index + 1} content`);
        dashboard = reopenedDashboard;
        cycles.push({cycle: index + 1, dashboard: dashboardResources, dashboard_closed: closedResources,
          post_close_private_bytes_above_orb: closedResources.private_bytes - orbResources.private_bytes,
          post_close_private_bytes_change: closedResources.private_bytes
            - (cycles.at(-1)?.dashboard_closed.private_bytes ?? orbResources.private_bytes)});
      }
      checks.push("dashboard-process-tree-resource-sampled", "dashboard-closed-process-tree-resource-sampled",
        "dashboard-reopened-nonblank-after-close", "dashboard-repeat-cycle-resource-sampled");
      if (resourceWithAdapterFixture) checks.push("connected-adapter-fixture-refreshed-before-resource-sample");
      if (resourceWithExternalAdapter) checks.push("installed-codex-adapter-thread-decisions-refreshed-before-resource-sample");
      return {schema_version: "are.companion-windows-resource-sample/v1", ok: true, checks,
        observation_mode: resourceWithExternalAdapter ? "installed-codex-observation" : resourceWithAdapterFixture ? "isolated-connected-adapter-fixture" : "unconfigured-baseline",
        orb: orbResources, dashboard: cycles[0].dashboard, dashboard_closed: cycles[0].dashboard_closed,
        delta_private_bytes: cycles[0].dashboard.private_bytes - orbResources.private_bytes,
        cycles,
        authority_effect: "none"};
    }

    state = await poll(async () => {
      const current = await dashboardState(dashboard);
      return current.connectionTitle !== "Awaiting ARE snapshot" && current.connectionTitle !== "Reading ARE…" ? current : null;
    }, timeoutMs, "ARE snapshot result");
    assert.equal(state.connectionTitle, "ARE diagnostic passed", `Dashboard loaded but ARE diagnostic failed: ${state.connectionDetail}`);
    assert.ok(state.productStatus?.trim() && state.productStatus !== "—", "Product status was not populated.");
    checks.push("are-snapshot-visible");
    if (doctorTimeoutOnce) {
      assert.equal(Number(await readFile(doctorCallCount, "utf8")), 2, "The diagnostic did not recover with exactly one retry.");
      checks.push("doctor-timeout-recovered-once");
    }
    const expectedAdapterSummary = adapterExternalIdle || adapterLive || adapterExternalDsh
      ? "Path observed" : adapterExternalSocket ? "Backend path ready" : "Not configured";
    const adapterSummary = await poll(async () => {
      const current = await dashboardState(dashboard);
      return current.adapterSummary === expectedAdapterSummary ? current : null;
    }, timeoutMs, "Independent Overview adapter summary");
    assert.equal(adapterSummary.adapterSummary, expectedAdapterSummary);
    assert.ok(adapterSummary.overviewSummary?.includes("Product diagnostic passed at"),
      `Overview did not name its current product source: ${adapterSummary.overviewSummary}`);
    assert.ok(adapterSummary.overviewSummary.includes(adapterExternalIdle || adapterLive || adapterExternalDsh
      ? "gateway path observed at" : adapterExternalSocket ? "one backend path ready at" : "gateway observation not configured"),
    `Overview did not distinguish its adapter source: ${adapterSummary.overviewSummary}`);
    checks.push("overview-source-aware-summary-rendered");
    const otherSources = await dashboard.evaluate(`(() => {
      const section = document.querySelector("#overview-other-sources");
      return {closed: !section?.open,
        count: section?.querySelectorAll(".overview-source-list > div").length,
        labels: [...(section?.querySelectorAll(".overview-source-list strong") ?? [])].map(node => node.textContent)};
    })()`);
    assert.equal(otherSources.closed, true, "Secondary source readings should not crowd the Overview by default.");
    assert.equal(otherSources.count, 4);
    assert.deepEqual(otherSources.labels, Array(4).fill("Not inspected"),
      "Opening the dashboard must not imply the other sources have already been read.");
    await dashboard.evaluate('document.querySelector("#overview-other-sources summary").click()');
    assert.equal(await dashboard.evaluate('document.querySelector("#overview-other-sources").open'), true);
    await dashboard.evaluate('document.querySelector("#overview-other-sources summary").click()');
    checks.push("overview-secondary-sources-collapsed-and-expandable");
    const sidebarAdapter = await dashboard.evaluate(`(() => {
      const footer = document.querySelector("#sidebar-adapter");
      return {posture: footer?.dataset.adapterPosture,
        label: document.querySelector("#sidebar-adapter-label")?.textContent,
        dotShadow: footer ? getComputedStyle(footer.querySelector(".fine-dot")).boxShadow : null};
    })()`);
    const expectedSidebarPosture = adapterExternalIdle || adapterLive || adapterExternalDsh
      ? "observed" : adapterExternalSocket ? "ready" : "not-configured";
    assert.equal(sidebarAdapter.posture, expectedSidebarPosture, "Sidebar adapter cue must follow its independent observation.");
    assert.equal(sidebarAdapter.label, adapterExternalIdle || adapterLive || adapterExternalDsh ? "Adapter observed"
      : adapterExternalSocket ? "Adapter path ready" : "Adapter not configured");
    assert.equal(sidebarAdapter.dotShadow !== "none", expectedSidebarPosture === "ready",
      "Only a ready same-session path may receive the accent cue.");
    checks.push("sidebar-adapter-cue-is-source-bound");
    assert.equal(adapterSummary.adapterTechnicalOpen, false,
      "The full adapter protocol reading should start collapsed on Overview.");
    if (liveAdapter) {
      assert.ok(adapterSummary.adapterSummaryDetail.length < 160,
        "The visible adapter sentence should stay concise.");
      assert.ok(adapterSummary.adapterSummaryDetail.includes("This chat is not established as ARE-managed"));
      assert.ok(adapterSummary.adapterTechnicalDetail.includes("Desktop task control: unverified"));
      assert.ok(adapterSummary.adapterTechnicalDetail.includes(adapterExternalSocket?.startsWith("tcp://")
        ? "Observation transport: local loopback TCP (development-only, read-only)"
        : "Observation transport: local IPC (read-only)"));
    } else {
      assert.ok(adapterSummary.adapterSummaryDetail.includes("Product health is a separate diagnostic"));
    }
    checks.push("overview-adapter-separate-from-product-health");
    await dashboard.evaluate('document.querySelector(".overview-adapter-details > summary").focus()');
    await pressEnter(dashboard);
    const adapterDisclosure = await dashboard.evaluate(`(() => ({
      open: document.querySelector(".overview-adapter-details")?.open,
      visible: document.querySelector("#overview-adapter-technical")?.getBoundingClientRect().height > 0,
      boundary: document.querySelector("#overview-adapter-detail")?.textContent
    }))()`);
    assert.equal(adapterDisclosure.open, true);
    assert.equal(adapterDisclosure.visible, true);
    if (liveAdapter) assert.ok(adapterDisclosure.boundary.includes("This chat is not established as ARE-managed"));
    await pressEnter(dashboard);
    assert.equal(await dashboard.evaluate('document.querySelector(".overview-adapter-details").open'), false);
    checks.push("overview-adapter-technical-detail-keyboard-revealed");

    if (screenshot) {
      await dashboard.evaluate('document.querySelector("[data-panel-link=adapters]").scrollIntoView({block: "center"})');
      await saveScreenshot(dashboard, screenshot);
      checks.push("dashboard-screenshot-saved");
    }
    await clickElement(dashboard, '[data-panel-link="adapters"]');
    assert.equal(await dashboard.evaluate('!document.querySelector("#panel-adapters").hidden'), true);
    assert.equal(await dashboard.evaluate('window.scrollY'), 0, "panel navigation must start at the new page heading");
    checks.push("overview-adapter-link-opens-adapters");
    for (const [name, expected] of [["adapters", liveAdapter ? "not a promise." : "No adapter path to show yet."], ["threads", "Threads,"], ["decisions", "Decisions,"], ["evolution", "under review."], ["diagnostics", "A precise"], ["appearance", "Make it"]]) {
      await clickElement(dashboard, `[data-panel="${name}"]`);
      const panel = await dashboard.evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(`#panel-${name}`)});
        return {visible: Boolean(element && !element.hidden), text: element?.innerText ?? ""};
      })()`);
      assert.ok(panel.visible && panel.text.includes(expected), `${name} panel did not render after navigation.`);
      if (name === "adapters") {
        const adapter = await poll(async () => {
          const observed = await dashboard.evaluate(`(() => ({
            status: document.querySelector("#adapter-observation-status")?.textContent,
            liveVisible: !document.querySelector("#adapter-live")?.hidden,
            emptyRendered: getComputedStyle(document.querySelector("#adapter-empty")).display !== "none",
            client: document.querySelector("#adapter-client-state")?.textContent,
            gateway: document.querySelector("#adapter-gateway-state")?.textContent,
            backend: document.querySelector("#adapter-backend-state")?.textContent,
            selectedPath: document.querySelector("#adapter-selected-path-state")?.textContent,
            observationTransport: document.querySelector("#adapter-observation-transport")?.textContent,
            observationTransportDetail: document.querySelector("#adapter-observation-transport-detail")?.textContent,
            hostControl: document.querySelector("#adapter-host-control-state")?.textContent,
            hostedEffectTool: document.querySelector("#adapter-hosted-effect-tool-state")?.textContent,
            receiptPosture: document.querySelector("#adapter-receipt-posture")?.textContent,
            acceptedTurnStarts: document.querySelector("#adapter-receipt-turn-start")?.textContent,
          }))()`);
          return observed.status === (liveAdapter ? "Observed" : "Not configured") ? observed : null;
        }, timeoutMs, "Adapter observation posture");
        assert.equal(adapter.liveVisible, liveAdapter);
        assert.equal(adapter.emptyRendered, !liveAdapter, "Adapter empty state and live projection must be mutually exclusive.");
        if (liveAdapter) {
          assert.deepEqual([adapter.client, adapter.gateway, adapter.backend], adapterExternalDsh
            ? ["not-observed", "running", "running"] : adapterExternalIdle
            ? ["not-observed", "running", "not-observed"] : ["connected", "running", adapterExternalSocket ? "ready" : "running"]);
          assert.equal(adapter.selectedPath, adapterExternalSocket && !adapterExternalIdle && !adapterExternalDsh ? "ready" : "not-observed",
            "independent link states must not fabricate a connected-and-ready session");
          assert.equal(adapter.hostControl, "unverified", "gateway readiness must not claim desktop-task control");
          assert.equal(adapter.observationTransport, adapterExternalSocket?.startsWith("tcp://")
            ? "Local loopback TCP · development only" : "Local IPC");
          assert.match(adapter.observationTransportDetail, adapterExternalSocket?.startsWith("tcp://")
            ? adapterExternalDsh
              ? /read-only observation from the restricted DSH Web Host.*does not establish a browser connection or control of this desktop task/i
              : /not an installed integration, managed turn, or control of this desktop task/
            : /does not establish host-task control/);
          checks.push("source-derived-read-only-observation-transport-visible");
          assert.equal(adapter.hostedEffectTool, "disabled", "default-off hosted command path must be visible without implying execution authority");
          if (adapterExternalInflight) {
            assert.equal(adapter.receiptPosture, "Retained receipts observed");
            assert.ok(Number(adapter.acceptedTurnStarts) >= 1,
              "An in-flight installed-Codex turn must expose its retained accepted-start receipt.");
            checks.push("installed-codex-retained-turn-start-receipt-observed");
          }
          checks.push(adapterExternalSocket?.startsWith("tcp://")
            ? "adapter-live-loopback-observed" : "adapter-live-windows-pipe-observed",
          "adapter-same-session-path-distinguished");
          if (adapterExternalDsh) {
            const dsh = await dashboard.evaluate(`(() => ({
              source: document.querySelector("#adapter-observation-source")?.textContent,
              activityVisible: !document.querySelector("#adapter-dsh-activity")?.hidden,
              activeAgents: document.querySelector("#adapter-dsh-active-agents")?.textContent,
            }))()`);
            assert.match(dsh.source, /restricted DSH Web Host/);
            assert.equal(dsh.activityVisible, true);
            assert.equal(dsh.activeAgents, "1");
            checks.push("dsh-host-agent-activity-visible-without-browser-control-claim");
          }
          checks.push("hosted-effect-tool-default-off-visible");
        } else checks.push("adapter-observation-not-configured");
        if (adapterScreenshot) {
          await saveScreenshot(dashboard, adapterScreenshot);
          checks.push("adapter-screenshot-saved");
        }
      }
      if (name === "threads") {
        const threads = await poll(async () => {
          const observed = await dashboard.evaluate(`(() => ({
            status: document.querySelector("#thread-observation-status")?.textContent,
            liveVisible: !document.querySelector("#thread-live")?.hidden,
            emptyVisible: !document.querySelector("#thread-empty")?.hidden,
            count: document.querySelector("#thread-count")?.textContent,
            continuity: document.querySelector("#thread-continuity-status")?.textContent,
            dispatch: document.querySelector("#thread-dispatch-status")?.textContent,
            hostedEffect: document.querySelector("#thread-hosted-effect-status")?.textContent,
            text: document.querySelector("#panel-threads")?.innerText ?? "",
            rows: document.querySelector("#thread-list")?.textContent ?? "",
          }))()`);
          const expectedStatus = adapterExternalDsh ? "Unavailable"
            : degradedSteer || unknownDispatch || threadPages ? "Attention" : adapterLive || externalThread ? "Observed" : adapterExternalSocket ? "No records" : "Not configured";
          return observed.status === expectedStatus ? observed : null;
        }, timeoutMs, "Gateway thread observation posture");
        if (process.env.ARE_WINDOWS_UI_EXPECT_THREAD_REJOIN_SCOPE === "1") {
          assert.match(threads.text, /not the hosted client’s restart\/Rejoin eligibility/);
          assert.match(threads.text, /cannot authorize Send or prove control of this desktop chat/);
          checks.push("thread-rejoin-scope-visible-in-packaged-webview");
        }
        assert.equal(threads.liveVisible, adapterLive || externalThread);
        assert.equal(threads.emptyVisible, !(adapterLive || externalThread));
        if (adapterExternalDsh) {
          const dsh = await dashboard.evaluate(`(() => ({
            visible: !document.querySelector("#dsh-agent-state")?.hidden,
            text: document.querySelector("#dsh-agent-state")?.textContent ?? "",
          }))()`);
          assert.equal(dsh.visible, true);
          assert.match(dsh.text, /DSH Host-owned Agents/);
          assert.match(dsh.text, /Host observation · /);
          assert.match(dsh.text, /native turn (open at observation|closed at observation|state not reported)|no native turn started in this Host run/);
          assert.match(dsh.text, /model entry retained; no later terminal retained|terminal event retained|no retained turn event/);
          assert.match(dsh.text, /hidden reasoning, a browser connection, or control of this desktop task/);
          if (process.env.ARE_WINDOWS_UI_EXPECT_DSH_PREPARATION === "1") {
            assert.match(dsh.text, /latest retained ARE route\/context preparation · CA2-ROUTE-UNDERSTAND/);
            assert.match(dsh.text, /included in latest retained model entry/);
            assert.match(dsh.text, /native turn closed at observation/);
            assert.match(dsh.text, /terminal event retained/);
            assert.doesNotMatch(dsh.text, /explain this architecture|local qualified reply/);
            checks.push("dsh-prepared-route-correlated-to-native-model-entry");
          }
          checks.push("dsh-agent-thread-state-visible-with-explicit-claim-limit");
        }
        if (hostedSteerCheckpoint) {
          const hostedCue = await poll(async () => {
            const text = await dashboard.evaluate('document.querySelector("#thread-list")?.textContent ?? ""');
            return text.includes("Hosted steer checkpoint retained") ? text : null;
          }, timeoutMs, "Hosted steer checkpoint cue in packaged WebView");
          assert.match(hostedCue, /exact guidance outcome still needs confirmation in the hosted client/);
          assert.match(hostedCue, /No guidance is resent from this view/);
          const cueBounds = await dashboard.evaluate(`(() => {
            const cue = [...document.querySelectorAll("#thread-list .thread-card p")]
              .find(element => element.textContent.includes("Hosted steer checkpoint retained"));
            const rect = cue?.getBoundingClientRect();
            return {top: rect?.top, bottom: rect?.bottom, viewportHeight: window.innerHeight};
          })()`);
          assert.ok(Number.isFinite(cueBounds.top) && cueBounds.top >= 0
            && cueBounds.bottom <= cueBounds.viewportHeight,
          `Hosted steer checkpoint must be fully visible in the first viewport: ${JSON.stringify(cueBounds)}`);
          checks.push("hosted-steer-checkpoint-visible-without-resend-control");
          const readsBeforeStale = hostedObservationReads;
          staleHostedObservation = true;
          await clickElement(dashboard, '[data-panel="threads"]');
          await poll(async () => {
            if (hostedObservationReads <= readsBeforeStale) return null;
            const observed = await dashboard.evaluate(`(() => ({
              status: document.querySelector("#thread-observation-status")?.textContent,
              rejoin: document.querySelector("#thread-rejoin-status")?.textContent ?? "",
              rows: document.querySelector("#thread-list")?.textContent ?? "",
            }))()`);
            return observed.status === "Observed"
              && observed.rejoin.includes("No Rejoin eligibility is claimed")
              && !observed.rows.includes("Hosted steer checkpoint retained") ? observed : null;
          }, timeoutMs, "Stale pending hosted steer cue withdrawal in the same window");
          checks.push("hosted-steer-checkpoint-withdrawn-when-observation-stale");
          const readsBeforeAck = hostedObservationReads;
          staleHostedObservation = false;
          pendingHostedSteerCheckpoint = false;
          await clickElement(dashboard, '[data-panel="threads"]');
          await poll(async () => {
            if (hostedObservationReads <= readsBeforeAck) return null;
            const observed = await dashboard.evaluate(`(() => ({
              status: document.querySelector("#thread-observation-status")?.textContent,
              rejoin: document.querySelector("#thread-rejoin-status")?.textContent ?? "",
              rows: document.querySelector("#thread-list")?.textContent ?? "",
            }))()`);
            return observed.status === "Observed" && observed.rejoin.includes("Hosted client")
              && !observed.rows.includes("Hosted steer checkpoint retained") ? observed : null;
          }, timeoutMs, "Acknowledged hosted steer cue withdrawal in the same window");
          checks.push("hosted-steer-checkpoint-withdrawn-after-acknowledgement");
        }
        if (threadScreenshot && !threadNativeNarrow) {
          await saveScreenshot(dashboard, threadScreenshot);
          checks.push("thread-screenshot-saved");
        }
        if (adapterLive && !threadPages) {
          const recoveryView = await dashboard.evaluate(`(() => {
            const details = document.querySelector("#thread-recovery-details");
            const card = document.querySelector("#thread-list .thread-card");
            return {open: details?.open, summary: document.querySelector("#thread-recovery-summary")?.textContent,
              cardTop: card?.getBoundingClientRect().top, viewportHeight: window.innerHeight};
          })()`);
          const needsAttention = degradedSteer || unknownDispatch || unknownHostedEffect || acceptedUnresolved;
          assert.equal(recoveryView.open, needsAttention,
            `Gateway continuity disclosure did not match its recovery posture: ${JSON.stringify(recoveryView)}`);
          assert.match(recoveryView.summary ?? "", needsAttention ? /needs attention/ : /no unresolved outcomes reported/);
          if (!needsAttention) {
            assert.ok(Number.isFinite(recoveryView.cardTop) && recoveryView.cardTop >= 0
              && recoveryView.cardTop < recoveryView.viewportHeight * 0.6,
            `Active Reasoning State card must enter the first viewport: ${JSON.stringify(recoveryView)}`);
            checks.push("active-thread-reasoning-state-in-first-viewport");
          } else checks.push("unresolved-gateway-continuity-details-auto-expanded");
          const collapsed = await dashboard.evaluate(`(() => {
            const card = document.querySelector("#thread-list .thread-card");
            const toggle = card?.querySelector(".thread-detail-toggle");
            const frontier = card?.querySelectorAll(":scope > p")?.[1];
            const plan = card?.querySelector(".thread-plan-progress");
            const heading = card?.querySelector(":scope > h2");
            return {name: toggle?.getAttribute("aria-label"), expanded: toggle?.getAttribute("aria-expanded"),
              frontierHidden: frontier?.hidden, evidenceHidden: card?.querySelector(".thread-evidence-details")?.hidden,
              planVisible: !plan?.hidden && !!plan?.getBoundingClientRect().height,
              namedCard: !!heading && heading.textContent === "Backend thread aaaaaaaa"
                && card.getAttribute("aria-labelledby") === heading.id};
          })()`);
          assert.deepEqual(collapsed, {name: "Inspect state and evidence for backend thread aaaaaaaa",
            expanded: "false", frontierHidden: true, evidenceHidden: true, planVisible: true,
            namedCard: true});
          checks.push("native-backend-thread-card-has-named-heading");
          if (threadNativeNarrow) {
            const devicePixelRatio = await dashboard.evaluate("devicePixelRatio");
            const resized = resizeIsolatedDashboard(child.pid, Math.round(340 * devicePixelRatio), Math.round(740 * devicePixelRatio));
            threadNativeNarrowWindow = {device_pixel_ratio: devicePixelRatio, ...resized};
            assert.ok(Math.abs(resized.after_width - 340 * devicePixelRatio) <= 2
              && Math.abs(resized.after_height - 740 * devicePixelRatio) <= 2
              && resized.min_track_width > 0 && resized.min_track_width <= resized.requested_outer_width + 2,
            `Native Threads client did not admit 340 × 740: ${JSON.stringify(threadNativeNarrowWindow)}`);
            const narrow = await dashboard.evaluate(`(() => {
              const plan = document.querySelector('#thread-list .thread-plan-progress');
              return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
                planBottom:plan?.getBoundingClientRect().bottom,planHeight:plan?.getBoundingClientRect().height,
                frontierHidden:document.querySelector('#thread-list .thread-card')?.querySelectorAll(':scope > p')?.[1]?.hidden,
                evidenceHidden:document.querySelector('#thread-list .thread-evidence-details')?.hidden};
            })()`);
            assert.ok(narrow.width === 340 && narrow.height === 740
              && narrow.planHeight > 0 && narrow.planBottom <= narrow.height
              && narrow.frontierHidden === true && narrow.evidenceHidden === true
              && narrow.scrollWidth <= narrow.width + 1,
            `Native Threads plan did not enter the first viewport: ${JSON.stringify(narrow)}`);
            if (threadScreenshot) {
              await saveScreenshot(dashboard, threadScreenshot);
              checks.push("thread-screenshot-saved");
            }
            resizeIsolatedDashboard(child.pid, resized.before_width, resized.before_height);
            checks.push("thread-native-window-client-resized", "thread-plan-in-native-first-viewport");
          }
          await dashboard.evaluate('document.querySelector("#thread-list .thread-detail-toggle").focus()');
          await pressEnter(dashboard);
          const expanded = await dashboard.evaluate(`(() => {
            const card = document.querySelector("#thread-list .thread-card");
            const toggle = card?.querySelector(".thread-detail-toggle");
            const frontier = card?.querySelectorAll(":scope > p")?.[1];
            return {name: toggle?.getAttribute("aria-label"), expanded: toggle?.getAttribute("aria-expanded"),
              frontierHidden: frontier?.hidden, evidenceHidden: card?.querySelector(".thread-evidence-details")?.hidden};
          })()`);
          assert.deepEqual(expanded, {name: "Close state and evidence for backend thread aaaaaaaa",
            expanded: "true", frontierHidden: false, evidenceHidden: false});
          checks.push("native-thread-detail-collapsed-first", "native-thread-detail-keyboard-revealed");
        }
        if (adapterLive || externalThread) {
          assert.equal(threads.count, threadPages ? "40" : "1");
          if (threadPages) {
            const first = await dashboard.evaluate(`({range: document.querySelector("#thread-page-range")?.textContent,
              rangeRole: document.querySelector("#thread-page-range")?.getAttribute("role"),
              rangeLive: document.querySelector("#thread-page-range")?.getAttribute("aria-live"),
              rangeAtomic: document.querySelector("#thread-page-range")?.getAttribute("aria-atomic"),
              rows: document.querySelectorAll("#thread-list .thread-card").length,
              previousDisabled: document.querySelector("#thread-page-prev")?.disabled,
              nextDisabled: document.querySelector("#thread-page-next")?.disabled,
              disclosure: document.querySelector("#thread-truncation")?.textContent})`);
            assert.equal(first.range, "Showing 1–32 of 40 backend threads");
            assert.deepEqual([first.rangeRole, first.rangeLive, first.rangeAtomic], ["status", "polite", "true"]);
            assert.equal(first.rows, 32);
            assert.equal(first.previousDisabled, true);
            assert.equal(first.nextDisabled, false);
            assert.match(first.disclosure, /8 ongoing threads are on other pages/);
            await dashboard.evaluate('document.querySelector("#thread-page-next").focus()');
            await pressEnter(dashboard);
            await poll(async () => {
              const page = await dashboard.evaluate(`({range: document.querySelector("#thread-page-range")?.textContent,
                rows: document.querySelectorAll("#thread-list .thread-card").length,
                previousDisabled: document.querySelector("#thread-page-prev")?.disabled,
                nextDisabled: document.querySelector("#thread-page-next")?.disabled})`);
              return page.range === "Showing 33–40 of 40 backend threads" && page.rows === 8 && page.previousDisabled === false
                && page.nextDisabled === true ? page : null;
            }, timeoutMs, "Second bounded backend-thread page");
            assert.equal(await dashboard.evaluate('document.activeElement?.id'), "thread-page-prev",
              "Focus should move to the enabled Previous control when Next reaches the final page.");
            await pressEnter(dashboard);
            await poll(async () => {
              const page = await dashboard.evaluate(`({range: document.querySelector("#thread-page-range")?.textContent,
                rows: document.querySelectorAll("#thread-list .thread-card").length})`);
              return page.range === "Showing 1–32 of 40 backend threads" && page.rows === 32 ? page : null;
            }, timeoutMs, "Previous bounded backend-thread page");
            assert.equal(await dashboard.evaluate('document.activeElement?.id'), "thread-page-next",
              "Focus should move to the enabled Next control when Previous reaches the first page.");
            const oldDigest = adapterFixture.gateway.observeReasoningThreads().snapshot_digest;
            adapterFixture.mutateThreadObservation();
            assert.notEqual(adapterFixture.gateway.observeReasoningThreads().snapshot_digest, oldDigest,
              "The fixture did not change the gateway's content-free snapshot.");
            const bridgeError = await dashboard.evaluate(`(async () => {
              try {
                await globalThis.__TAURI__.core.invoke("get_thread_snapshot", {
                  offset: 32, snapshotDigest: ${JSON.stringify(oldDigest)}});
                return "unexpected-success";
              } catch (error) { return String(error); }
            })()`);
            assert.match(bridgeError, /thread\.observation-source-changed/,
              `The native bridge did not preserve the source-change reason: ${bridgeError}`);
            await clickElement(dashboard, "#thread-page-next");
            let lastChangedPageState = null;
            await poll(async () => {
              const state = await dashboard.evaluate(`({status: document.querySelector("#thread-observation-status")?.textContent,
                source: document.querySelector("#thread-observation-source")?.textContent,
                nextDisabled: document.querySelector("#thread-page-next")?.disabled})`);
              lastChangedPageState = state;
              if (["Unavailable", "Incompatible", "Not configured"].includes(state.status)) {
                throw new Error(`Native bridge lost the changed-source reason: ${JSON.stringify(state)}`);
              }
              return state.status === "Source changed" && state.source.includes("select Start fresh")
                && state.nextDisabled === true ? state : null;
            }, timeoutMs, "Changed gateway snapshot rejected during paging").catch(error => {
              throw new Error(`${error.message}: ${JSON.stringify(lastChangedPageState)}`);
            });
            assert.equal(await dashboard.evaluate('document.activeElement?.id'), "thread-page-reset",
              "Changed-source paging should leave focus on the available Start fresh action.");
            await clickElement(dashboard, "#thread-page-reset");
            await poll(async () => {
              const state = await dashboard.evaluate(`({status: document.querySelector("#thread-observation-status")?.textContent,
                range: document.querySelector("#thread-page-range")?.textContent,
                nextDisabled: document.querySelector("#thread-page-next")?.disabled})`);
              return state.status === "Attention" && state.range === "Showing 1–32 of 40 backend threads" && state.nextDisabled === false
                ? state : null;
            }, timeoutMs, "Fresh gateway thread snapshot after change");
            checks.push("gateway-thread-first-page-bounded", "gateway-thread-second-page-visible",
              "gateway-thread-previous-page-restored", "gateway-thread-changed-snapshot-rejected",
              "gateway-thread-fresh-snapshot-restored");
          }
          if (externalThread) {
            if (adapterExternalInflight) {
              assert.ok(threads.rows.includes("Turn active") && threads.rows.includes("No completed frontier")
                && !threads.rows.includes("Turn completed") && !threads.rows.includes("Verified completion frontier"),
              `In-flight installed-Codex thread was not shown as active without a frontier: ${threads.rows}`);
              checks.push("installed-codex-inflight-thread-observed-without-frontier");
            } else if (adapterExternalInterrupted) {
              assert.ok(threads.rows.includes("Recovered host terminal") && threads.rows.includes("Verified completion frontier")
                && threads.rows.includes("Exact host history for this turn: interrupted")
                && threads.rows.includes("without a completion frontier or automatic retry")
                && !threads.rows.includes("Turn active"),
              `Interrupted backend thread was not shown as terminal recovery: ${threads.rows}`);
              checks.push("installed-codex-interrupted-turn-reconciled");
            } else if (adapterExternalCompletedLoss || adapterExternalConfirmedRecovery) {
              assert.ok(threads.rows.includes("Recovered host terminal") && threads.rows.includes("Verified completion frontier (earlier turn)")
                && threads.rows.includes("Exact host history for this turn: completed")
                && threads.rows.includes("ARE did not observe its completion notification")
                && threads.rows.includes("No semantic completion, Evolution signal, completion frontier, or automatic successor")
                && !threads.rows.includes("Turn active"),
              `Completed host turn was not shown as unassessed recovery: ${threads.rows}`);
              checks.push(adapterExternalConfirmedRecovery
                ? "installed-codex-confirmed-recovery-kept-unassessed"
                : "installed-codex-completed-host-unassessed");
            } else {
              assert.ok(threads.rows.includes("Turn completed") && threads.rows.includes("Verified completion frontier"),
                `Real backend thread did not show its completed Reasoning State frontier: ${threads.rows}`);
              checks.push("installed-codex-thread-frontier-observed");
            }
          } else {
            if (terminalStatus) {
              const expectedLabel = `Turn ${terminalStatus}`;
              assert.ok(threads.rows.includes(expectedLabel) && threads.rows.includes("No completed frontier")
                && !threads.rows.includes("Turn active") && !threads.rows.includes("Turn completed"),
              `Terminal backend thread was mislabelled: ${threads.rows}`);
              checks.push(`gateway-thread-${terminalStatus}-status-observed`);
            } else {
              assert.ok(threads.rows.includes("Turn active") && threads.rows.includes("No completed frontier")
                && threads.rows.includes("2/7 obligations complete") && threads.rows.includes("current slice 3/7 (active)")
                && threads.rows.includes("1 open decision"), `Thread row text: ${threads.rows}`);
            }
          }
          assert.match(threads.continuity, degradedSteer ? /1 backend thread is paused after uncertain steer delivery/ : /No degraded steer continuity/);
          assert.match(threads.dispatch, unknownDispatch ? /1 gateway mutation request has an unresolved backend outcome/ : /No unresolved gateway mutation requests/);
          if (unknownHostedEffect) {
            assert.match(threads.hostedEffect, /1 hosted-effect dispatch has an unresolved gateway outcome/);
            assert.match(threads.hostedEffect, /host may or may not have executed it; this is not a safe-retry signal/);
            if (hostedEffectForeign) {
              assert.doesNotMatch(threads.rows, /hosted-effect dispatch has an unresolved gateway outcome for this backend thread/);
              checks.push("foreign-session-hosted-effect-not-attributed-to-thread");
            } else {
              assert.match(threads.rows, /1 hosted-effect dispatch has an unresolved gateway outcome for this backend thread/);
              assert.match(threads.rows, /Host execution is unknown; this is not permission to retry/);
              checks.push("hosted-effect-gateway-uncertainty-rendered-without-retry-claim");
            }
          }
          if (acceptedUnresolved) {
            assert.match(threads.dispatch, /1 unresolved turn start has a durable host-acceptance receipt/);
            assert.match(threads.dispatch, /not ARE completion or permission to retry/);
            checks.push("gateway-accepted-unresolved-turn-distinguished");
          } else if (unknownDispatch) {
            assert.match(threads.dispatch, /No unresolved turn starts have a retained host-acceptance receipt/);
          }
          if (confirmedRecovery) {
            assert.match(threads.dispatch, /1 gateway dispatch recovery was durably confirmed/);
            assert.match(threads.rows, /1 gateway dispatch recovery was durably confirmed for this backend thread/);
            assert.match(threads.rows, /not a new completion frontier or desktop-task activation/);
            checks.push("gateway-confirmed-recovery-not-activation-observed");
          }
          if (adapterExternalConfirmedRecovery) {
            assert.match(threads.dispatch, /No unresolved gateway mutation requests/);
            assert.match(threads.dispatch, /1 gateway dispatch recovery was durably confirmed/);
            assert.match(threads.rows, /1 gateway dispatch recovery was durably confirmed for this backend thread/);
            assert.match(threads.rows, /not a new completion frontier or desktop-task activation/);
            checks.push("installed-codex-confirmed-recovery-observed");
          }
          checks.push(degradedSteer ? "gateway-steer-continuity-attention-observed" : "gateway-thread-reasoning-state-observed");
          if (unknownDispatch) checks.push("gateway-unknown-dispatch-attention-observed");
          if (adapterLive && !threadPages) {
            const geometry = await dashboard.evaluate(`(() => {
              const list = document.querySelector("#thread-list");
              const card = list?.querySelector(".thread-card");
              return {count: list?.children.length, width: card?.getBoundingClientRect().width};
            })()`);
            assert.equal(geometry.count, 1);
            assert.ok(geometry.width >= 680 && geometry.width <= 761,
              `A single thread must use a readable capped width: ${JSON.stringify(geometry)}`);
            checks.push("single-thread-card-readable-width");
          }
          const linkName = threadNativeNarrow
            ? await poll(async () => {
              const state = await dashboard.evaluate(`({
                status:document.querySelector('#thread-observation-status')?.textContent,
                name:document.querySelector('#thread-list .text-link')?.getAttribute('aria-label')
              })`);
              return state.status === "Observed" && state.name ? state.name : null;
            }, timeoutMs, "Fresh thread link after native resize")
            : await dashboard.evaluate('document.querySelector("#thread-list .text-link")?.getAttribute("aria-label")');
          assert.match(linkName ?? "", externalThread
            ? /^View decisions for backend thread [0-9a-f]{8}$/
            : /^View decisions for backend thread aaaaaaaa$/);
          await clickElement(dashboard, "#thread-list .text-link");
          const linkedDecision = await poll(async () => {
            const state = await dashboard.evaluate(`({
              filterVisible: !document.querySelector("#decision-filter")?.hidden,
              decisionsVisible: !document.querySelector("#decision-live")?.hidden,
              decisionRows: document.querySelectorAll("#decision-list .thread-card").length,
              status: document.querySelector("#decision-observation-status")?.textContent,
              filterLabel: document.querySelector("#decision-filter-label")?.textContent ?? "",
            })`);
            return state.filterVisible && state.decisionsVisible
              && (adapterExternalActive || adapterExternalInflight || externalRecoveredDecisions ? state.decisionRows > 0 : state.decisionRows === 1) ? state : null;
          }, timeoutMs, "Packaged thread-to-decision link");
          assert.match(linkedDecision.filterLabel, externalThread
            ? /Backend thread [0-9a-f]{8}/ : /Backend thread aaaaaaaa/);
          checks.push(externalRecoveredDecisions ? "restored-thread-decision-observations-recovered"
            : adapterExternalActive || adapterExternalInflight ? "installed-codex-thread-decision-link-observed" : "thread-specific-decision-link-observed");
          await clickElement(dashboard, "#decision-filter-back");
          await poll(async () => (await dashboard.evaluate('document.activeElement?.getAttribute("aria-label")')) === linkName,
            timeoutMs, "Return focus to backend thread");
          checks.push("decision-return-focus-restored");
        } else checks.push(adapterExternalSocket ? "real-gateway-has-no-backend-threads" : "thread-observation-not-configured");
      }
      if (name === "decisions") {
        const decisions = await poll(async () => {
          const observed = await dashboard.evaluate(`(() => ({
            status: document.querySelector("#decision-observation-status")?.textContent,
            liveVisible: !document.querySelector("#decision-live")?.hidden,
            emptyVisible: !document.querySelector("#decision-empty")?.hidden,
            count: document.querySelector("#decision-count")?.textContent,
            rows: document.querySelector("#decision-list")?.textContent ?? "",
          }))()`);
          const expectedStatus = adapterExternalDsh ? "Unavailable"
            : adapterLive || adapterExternalActive || adapterExternalInflight || externalRecoveredDecisions ? "Observed" : adapterExternalSocket ? "No records" : "Not configured";
          return observed.status === expectedStatus ? observed : null;
        }, timeoutMs, "Gateway decision observation posture");
        assert.equal(decisions.liveVisible, adapterLive || adapterExternalActive || adapterExternalInflight || externalRecoveredDecisions);
        assert.equal(decisions.emptyVisible, !(adapterLive || adapterExternalActive || adapterExternalInflight || externalRecoveredDecisions));
        if (decisionScreenshot) {
          await saveScreenshot(dashboard, decisionScreenshot);
          checks.push("decision-screenshot-saved");
        }
        if (adapterLive || adapterExternalActive || adapterExternalInflight || externalRecoveredDecisions) {
          if (adapterExternalActive || adapterExternalInflight || externalRecoveredDecisions) {
            assert.ok(Number(decisions.count) > 0 && decisions.rows.includes("Evaluated"),
              `Real backend decisions were not rendered: ${JSON.stringify(decisions)}`);
            checks.push(externalRecoveredDecisions ? "installed-codex-decision-observations-recovered" : "installed-codex-decisions-observed");
          } else {
            assert.equal(decisions.count, "1");
            assert.ok(decisions.rows.includes("Effect evaluation") && decisions.rows.includes("effect.owner-approval-required"));
            const collapsedDecision = await dashboard.evaluate(`(() => {
              const card = document.querySelector("#decision-list .decision-card");
              return {open: card?.querySelector("details")?.open,
                summary: card?.querySelector("summary")?.textContent,
                firstView: card?.innerText};
            })()`);
            assert.equal(collapsedDecision.open, false);
            assert.equal(collapsedDecision.summary, "Reason and technical evidence");
            assert.ok(collapsedDecision.firstView.includes("authorization and execution not observed here")
              && !collapsedDecision.firstView.includes("effect.owner-approval-required"));
            await dashboard.evaluate('document.querySelector("#decision-list .decision-card summary").focus()');
            await pressEnter(dashboard);
            const expandedDecision = await dashboard.evaluate(`(() => {
              const card = document.querySelector("#decision-list .decision-card");
              return {open: card?.querySelector("details")?.open, text: card?.innerText};
            })()`);
            assert.equal(expandedDecision.open, true);
            assert.ok(expandedDecision.text.includes("effect.owner-approval-required")
              && expandedDecision.text.includes("Evidence event"));
            checks.push("native-decision-technical-detail-collapsed-first", "native-decision-detail-keyboard-revealed");
            if (!threadPages) {
              const geometry = await dashboard.evaluate(`(() => {
                const list = document.querySelector("#decision-list");
                const card = list?.querySelector(".thread-card");
                return {count: list?.children.length, width: card?.getBoundingClientRect().width};
              })()`);
              assert.equal(geometry.count, 1);
              assert.ok(geometry.width >= 680 && geometry.width <= 761,
                `A single decision must use a readable capped width: ${JSON.stringify(geometry)}`);
              checks.push("single-decision-card-readable-width");
            }
          }
          assert.equal(await dashboard.evaluate('document.querySelector("#decision-filter").hidden'), true,
            "Global Decisions navigation must clear the thread filter");
          checks.push("gateway-decision-evaluation-observed");
        } else checks.push(adapterExternalSocket ? "real-gateway-has-no-decisions" : "decision-observation-not-configured");
      }
      if (name === "evolution") {
        const evolution = await poll(async () => {
          const observed = await dashboard.evaluate(`(() => ({
            status: document.querySelector("#evolution-observation-status")?.textContent,
            liveVisible: !document.querySelector("#evolution-live")?.hidden,
            emptyRendered: getComputedStyle(document.querySelector("#evolution-empty")).display !== "none",
            definitionCount: document.querySelector("#evolution-definition-count")?.textContent,
          }))()`);
          return observed.status === (evolutionVerifiedRoot ? "Verified ledger" : evolutionRoot ? "No runtime evidence" : "Registry only") ? observed : null;
        }, timeoutMs, "Evolution observation posture");
        assert.equal(evolution.liveVisible, true);
        assert.equal(evolution.emptyRendered, false, "The candidate registry must remain visible without a runtime root.");
        const definitionReading = await dashboard.evaluate(`({
          count: document.querySelectorAll("#evolution-definitions .evolution-definition").length,
          text: document.querySelector("#evolution-definitions")?.innerText ?? "",
          scope: document.querySelector("#evolution-definition-card > p")?.textContent ?? "",
        })`);
        assert.equal(definitionReading.count, 5);
        assert.match(definitionReading.text, /Engine improvement/);
        assert.match(definitionReading.text, /compare technique variants/);
        assert.match(definitionReading.text, /Registry status: candidate · Admission no · Enabled no/);
        assert.match(definitionReading.text, /Registry ref: engine-improvement\/v1/);
        assert.match(definitionReading.scope, /Candidate designs, not running jobs/);
        checks.push("evolution-definition-purpose-and-admission-distinct");
        const headingOrder = await dashboard.evaluate(`(() => ({
          sections: [...document.querySelectorAll("#panel-evolution .adapter-capabilities > h2")]
            .filter(heading => !heading.closest("[hidden]"))
            .map(heading => heading.textContent),
          definitions: [...document.querySelectorAll("#evolution-definitions .evolution-definition > h3")]
            .map(heading => heading.textContent),
        }))()`);
        assert.equal(headingOrder.definitions.length, 5);
        assert.ok(headingOrder.definitions.includes("Engine improvement"));
        assert.ok(headingOrder.sections.includes("WHAT CAN EVOLVE · SOURCE REGISTRY")
          && headingOrder.sections.includes("GATEWAY IMPROVEMENT SIGNALS · CANDIDATES ONLY"));
        assert.ok(headingOrder.sections.indexOf(evolutionVerifiedRoot
          ? "OBSERVED CYCLES · RECORDED DISPOSITION" : "WHAT CAN EVOLVE · SOURCE REGISTRY")
          < headingOrder.sections.indexOf(evolutionVerifiedRoot
            ? "WHAT CAN EVOLVE · SOURCE REGISTRY" : "OBSERVED CYCLES · RECORDED DISPOSITION"));
        checks.push("evolution-semantic-headings-follow-source-order");
        if (evolutionVerifiedRoot) {
          const summaryMode = await dashboard.evaluate(`({metricsVisible: !document.querySelector("#evolution-evidence-metrics")?.hidden,
            registrySummaryHidden: document.querySelector("#evolution-registry-summary")?.hidden,
            evidenceLineVisible: !document.querySelector("#evolution-evidence-line")?.hidden})`);
          assert.equal(summaryMode.metricsVisible, true);
          assert.equal(summaryMode.registrySummaryHidden, true);
          assert.equal(summaryMode.evidenceLineVisible, true);
          checks.push("evolution-verified-ledger-metrics-restored");
          const details = await dashboard.evaluate(`(() => ({
            cycleCount: document.querySelector("#evolution-cycle-count")?.textContent,
            commitCount: document.querySelector("#evolution-commit-count")?.textContent,
            rows: document.querySelector("#evolution-cycles")?.innerText,
            coordination: document.querySelector("#evolution-coordination")?.innerText,
            dispositionClaim: document.querySelector("#evolution-disposition-claim-limit")?.textContent,
            cycleBeforeRegistry: Boolean(document.querySelector("#evolution-cycle-card")
              ?.compareDocumentPosition(document.querySelector("#evolution-definition-card")) & Node.DOCUMENT_POSITION_FOLLOWING),
          }))()`);
          assert.equal(evolution.definitionCount, "5");
          assert.equal(details.cycleCount, evolutionMultiDefinitionFixture ? "2" : "1");
          assert.equal(details.commitCount, evolutionCoordinationFixture || evolutionMultiDefinitionFixture ? "2" : "1");
          assert.ok(details.rows.includes(evolutionCoordinationFixture ? "cycle:companion-coordination-fixture" : "cycle:companion-ui-fixture")
            && details.rows.includes("benchmark-research/v1")
            && (!evolutionMultiDefinitionFixture || details.rows.includes("cycle:companion-engine-fixture")));
          assert.match(details.coordination, evolutionCoordinationFixture
            ? /1 admitted phase in the verified ledger/ : /0 admitted phases in the verified ledger/);
          assert.match(details.coordination, evolutionCoordinationFixture
            ? /Planned 1 · Ready 0 · Leased 1 · Completed 0 · Blocked 0/
            : /Planned 0 · Ready 0 · Leased 0 · Completed 0 · Blocked 0/);
          if (evolutionCoordinationFixture) {
            assert.match(details.coordination, /Phase 1 · construction/);
            assert.match(details.coordination,
              /cycle:companion-coordination-fixture · Planned 1 · Ready 0 · Leased 1 · Completed 0 · Blocked 0 · 2 recorded events/);
            assert.doesNotMatch(details.coordination, /task:private-a|worker:private/,
              "Private coordination identifiers crossed the phase summary.");
            checks.push("evolution-native-phase-detail-observed-without-private-identifiers");
          }
          assert.match(details.dispositionClaim ?? "", /derived disposition summarizes recorded events; it does not establish current execution/);
          assert.equal(details.cycleBeforeRegistry, true, "Verified cycle evidence must lead the registry.");
          checks.push("evolution-verified-cycle-prioritized-before-registry");
          const filter = await dashboard.evaluate(`(() => ({hidden: document.querySelector("#evolution-cycle-filter")?.hidden,
            options: [...document.querySelector("#evolution-cycle-definition").options].map(option => option.value),
            status: document.querySelector("#evolution-cycle-filter-status")?.textContent}))()`);
          if (evolutionMultiDefinitionFixture) {
            assert.equal(filter.hidden, false, "Two recorded definitions require a visible filter.");
            assert.deepEqual(filter.options, ["", "benchmark-research/v1", "engine-improvement/v1"]);
            assert.match(filter.status ?? "", /Showing 2 of 2 verified cycles/);
            const selected = await dashboard.evaluate(`(() => {
              const select = document.querySelector("#evolution-cycle-definition");
              select.value = "benchmark-research/v1";
              select.dispatchEvent(new Event("change", {bubbles: true}));
              return {selected: select.value, rows: document.querySelector("#evolution-cycles")?.innerText,
                status: document.querySelector("#evolution-cycle-filter-status")?.textContent};
            })()`);
            assert.equal(selected.selected, "benchmark-research/v1");
            assert.match(selected.rows, /cycle:companion-ui-fixture/);
            assert.doesNotMatch(selected.rows, /cycle:companion-engine-fixture/);
            assert.match(selected.status, /Showing 1 of 2 verified cycles/);
            checks.push("evolution-native-filter-selects-recorded-definition");
          } else {
            assert.equal(filter.hidden, true, "A single recorded definition needs no visible filter.");
            assert.deepEqual(filter.options, ["", "benchmark-research/v1"]);
            assert.match(filter.status ?? "", /Showing 1 of 1 verified cycles/);
            checks.push("evolution-filter-scope-matches-verified-single-definition");
          }
          const cycleViewport = await dashboard.evaluate(`(() => {
            const rect = document.querySelector("#evolution-cycles .evolution-cycle summary")?.getBoundingClientRect();
            return {top: rect?.top, bottom: rect?.bottom, viewportHeight: window.innerHeight,
              scrollY: window.scrollY};
          })()`);
          assert.ok(cycleViewport.scrollY === 0 && Number.isFinite(cycleViewport.top)
            && cycleViewport.top >= 0 && cycleViewport.bottom <= cycleViewport.viewportHeight,
          `Verified cycle summary must be visible before scrolling: ${JSON.stringify(cycleViewport)}`);
          checks.push("evolution-verified-cycle-summary-in-first-viewport");
          checks.push("evolution-verified-cycle-observed");
          checks.push("evolution-verified-coordination-summary-observed");
          const progression = await dashboard.evaluate(`(() => {
            const cycle = document.querySelector("#evolution-cycles .evolution-cycle");
            if (!cycle) return null;
            cycle.querySelector("summary")?.click();
            return {summary: cycle.querySelector("summary")?.innerText ?? "",
              events: [...cycle.querySelectorAll("li")].map(item => item.textContent ?? ""),
              body: cycle.innerText};
          })()`);
          const expectedSummary = evolutionCoordinationFixture
            ? "Recorded disposition: undetermined · Latest verified event type: work-leased · 2 verified events"
            : "Recorded disposition: active · Latest verified event type: diagnosis-recorded · 1 verified event";
          assert.ok(progression?.summary.includes(expectedSummary),
            `Verified cycle summary is incomplete: ${progression?.summary ?? "missing"}`);
          assert.deepEqual(progression.events, evolutionCoordinationFixture
            ? ["Event 1 · phase-admitted", "Event 2 · work-leased"]
            : ["Event 1 · diagnosis-recorded"]);
          assert.equal(progression.body.includes("objective:companion-ui-fixture"), false,
            "Evolution event payload crossed the read-only UI projection.");
          if (evolutionMultiDefinitionFixture) {
            const started = await dashboard.evaluate(`(() => {
              const summary = document.querySelector("#evolution-cycles .evolution-cycle summary");
              summary.focus({preventScroll: true});
              document.querySelector("#refresh").click();
              return {status: document.querySelector("#evolution-observation-status")?.textContent,
                focused: document.activeElement === summary};
            })()`);
            assert.equal(started.status, "Reading…");
            assert.equal(started.focused, true);
            const retained = await poll(async () => {
              const observed = await dashboard.evaluate(`(() => {
                const cycle = document.querySelector("#evolution-cycles .evolution-cycle");
                return {status: document.querySelector("#evolution-observation-status")?.textContent,
                  selected: document.querySelector("#evolution-cycle-definition")?.value,
                  rows: document.querySelector("#evolution-cycles")?.innerText,
                  open: cycle?.open, focused: document.activeElement === cycle?.querySelector("summary")};
              })()`);
              return observed.status === "Verified ledger" ? observed : null;
            }, timeoutMs, "native Evolution selected-definition refresh");
            assert.equal(retained.selected, "benchmark-research/v1");
            assert.match(retained.rows, /cycle:companion-ui-fixture/);
            assert.doesNotMatch(retained.rows, /cycle:companion-engine-fixture/);
            assert.equal(retained.open, true);
            assert.equal(retained.focused, true);
            checks.push("evolution-native-filter-and-cycle-detail-survive-verified-refresh");
          }
          if (evolutionCoordinationFixture) {
            assert.equal(progression.body.includes("task:private-a") || progression.body.includes("worker:private"), false,
              "Private coordination identifiers crossed the read-only UI projection.");
            checks.push("evolution-nonzero-coordination-summary-observed");
          }
          checks.push("evolution-verified-event-progression-observed");
          if (evolutionDenialJourney) {
            setReadDeny(deniedLedger, denialAccount, true);
            ledgerReadDenied = true;
            const observer = join(dirname(exe), "are", "cyberAlchemy-v2", "implementation", "agent-reasoning-engine", "packages", "evolution-runtime", "bin", "observe.mjs");
            const nativeRead = spawnSync(join(dirname(exe), "node", "node.exe"), [observer, "--json", "--root", evolutionRoot], {
              encoding: "utf8", timeout: 10_000, windowsHide: true,
            });
            assert.equal(nativeRead.status, 0, `Native denied-ledger observer failed: ${nativeRead.stderr}`);
            const deniedObservation = JSON.parse(nativeRead.stdout);
            assert.equal(deniedObservation.evidence_status, "unavailable", "Native observer treated denied ledger access as verified-empty evidence.");
            checks.push("native-windows-denied-ledger-is-unavailable");
            await clickElement(dashboard, '[data-panel="evolution"]');
            const retained = await poll(async () => {
              const observed = await dashboard.evaluate(`(() => ({
                status: document.querySelector("#evolution-observation-status")?.textContent,
                historyVisible: !document.querySelector("#evolution-history-note")?.hidden,
                history: document.querySelector("#evolution-history-note")?.textContent ?? "",
                evidence: document.querySelector("#evolution-evidence-status")?.textContent,
                cycleCount: document.querySelector("#evolution-cycle-count")?.textContent,
                cycles: document.querySelector("#evolution-cycles")?.innerText ?? "",
              }))()`);
              return observed.status === "Unavailable" ? observed : null;
            }, timeoutMs, "Evolution permission-denial posture");
            assert.equal(retained.historyVisible, true);
            assert.match(retained.history, /Last verified ledger read.*historical; current cycle and worker state are unknown/);
            assert.equal(retained.evidence, "Last verified · not current");
            assert.equal(retained.cycleCount, "1");
            assert.ok(retained.cycles.includes("cycle:companion-ui-fixture"));
            checks.push("native-windows-denial-retains-dated-history-without-current-claim");
            setReadDeny(deniedLedger, denialAccount, false);
            ledgerReadDenied = false;
            await clickElement(dashboard, '[data-panel="evolution"]');
            await poll(async () => {
              const observed = await dashboard.evaluate('({status: document.querySelector("#evolution-observation-status")?.textContent, historyHidden: document.querySelector("#evolution-history-note")?.hidden})');
              return observed.status === "Verified ledger" && observed.historyHidden ? observed : null;
            }, timeoutMs, "Evolution access restoration");
            checks.push("native-windows-ledger-access-restores-current-view");
          }
        } else if (evolutionRoot) {
          assert.equal(evolution.definitionCount, "5");
          assert.equal(existsSync(evolutionRoot), false, "Dashboard observation created its Evolution root.");
          checks.push("evolution-registry-observed-without-root-mutation");
        } else {
          assert.equal(evolution.definitionCount, "5");
          const registryOnly = await dashboard.evaluate(`({source: document.querySelector("#evolution-observation-source")?.textContent,
            metricsHidden: document.querySelector("#evolution-evidence-metrics")?.hidden,
            evidenceLineHidden: document.querySelector("#evolution-evidence-line")?.hidden,
            compactSummary: document.querySelector("#evolution-registry-summary")?.textContent,
            compactSummaryVisible: !document.querySelector("#evolution-registry-summary")?.hidden,
            cycles: document.querySelector("#evolution-cycle-count")?.textContent,
            commits: document.querySelector("#evolution-commit-count")?.textContent,
            rows: document.querySelector("#evolution-cycles")?.innerText,
            coordination: document.querySelector("#evolution-coordination")?.innerText,
            registryBeforeCycles: Boolean(document.querySelector("#evolution-definition-card")
              ?.compareDocumentPosition(document.querySelector("#evolution-cycle-card")) & Node.DOCUMENT_POSITION_FOLLOWING)})`);
          assert.match(registryOnly.source, /bundled candidate registry · runtime root not configured/);
          assert.equal(registryOnly.metricsHidden, true);
          assert.equal(registryOnly.evidenceLineHidden, true);
          assert.equal(registryOnly.compactSummaryVisible, true);
          assert.match(registryOnly.compactSummary, /5 registry definitions · No runtime root configured/);
          checks.push("evolution-registry-only-compact-summary");
          assert.equal(registryOnly.cycles, "—");
          assert.equal(registryOnly.commits, "—");
          assert.match(registryOnly.rows, /Runtime root not configured; no cycle ledger was read/);
          assert.match(registryOnly.coordination, /No coordination projection/);
          assert.match(registryOnly.coordination, /Runtime root not configured/);
          assert.equal(registryOnly.registryBeforeCycles, true, "Registry-only view must lead with definitions.");
          checks.push("evolution-candidate-registry-visible-without-runtime-root");
        }
        const signals = await poll(async () => {
          const observed = await dashboard.evaluate(`(() => ({
            status: document.querySelector("#evolution-signal-status")?.textContent,
            count: document.querySelector("#evolution-signal-count")?.textContent,
            teaserStatus: document.querySelector("#evolution-signal-teaser-status")?.textContent,
            teaserCount: document.querySelector("#evolution-signal-teaser-count")?.textContent,
            rows: document.querySelector("#evolution-signal-list")?.innerText,
          }))()`);
          return observed.status === (evolutionSignalLog ? "Verified candidate inbox" : "Not configured") ? observed : null;
        }, timeoutMs, "Evolution gateway candidate posture");
        assert.equal(signals.teaserStatus, signals.status);
        if (evolutionSignalLog) {
          assert.equal(signals.count, "1");
          assert.equal(signals.teaserCount, "1 recorded candidate");
          assert.ok(signals.rows.includes("Semantic evaluation blocked"));
          assert.deepEqual(await readFile(evolutionSignalLog), signalLogBefore, "Companion changed the signal fixture log.");
          checks.push("evolution-gateway-candidate-observed");
        } else {
          assert.equal(signals.teaserCount, "No current count");
          checks.push("evolution-gateway-candidates-not-configured");
        }
        checks.push("evolution-gateway-candidate-teaser-matches-source");
        let nativeWindowBefore;
        if (evolutionNarrow || evolutionNativeNarrow) {
          if (evolutionNativeNarrow) {
            const devicePixelRatio = await dashboard.evaluate("devicePixelRatio");
            const resized = resizeIsolatedDashboard(child.pid, Math.round(340 * devicePixelRatio), Math.round(740 * devicePixelRatio));
            nativeWindowBefore = resized;
            nativeNarrowWindow = {device_pixel_ratio: devicePixelRatio, ...resized};
            assert.ok(Math.abs(resized.after_width - 340 * devicePixelRatio) <= 2
              && Math.abs(resized.after_height - 740 * devicePixelRatio) <= 2,
            `Native dashboard client resize did not reach its target: ${JSON.stringify({devicePixelRatio, resized})}`);
            assert.ok(resized.min_track_width > 0 && resized.min_track_width <= resized.requested_outer_width + 2,
              `Native dashboard's minimum tracking width still forbids a narrow window: ${JSON.stringify(resized)}`);
            checks.push("evolution-native-window-client-resized");
            checks.push("evolution-native-minimum-track-width-allows-narrow");
            const retainedSelection = await poll(async () => {
              const observed = await dashboard.evaluate(`(() => {
                const strip = document.querySelector('.nav-list');
                const active = strip.querySelector('.nav-item[data-panel="evolution"]');
                const stripBounds = strip.getBoundingClientRect();
                const itemBounds = active.getBoundingClientRect();
                return {width: innerWidth, current: active.getAttribute('aria-current') === 'page',
                  visible: itemBounds.left >= stripBounds.left - 1 && itemBounds.right <= stripBounds.right + 1,
                  headingFocused: document.activeElement === document.querySelector('#evolution-title'),
                  cycleFocused: document.activeElement === document.querySelector('#evolution-cycles .evolution-cycle summary'),
                  documentFits: document.documentElement.scrollWidth <= innerWidth + 1};
              })()`);
              return observed.width === 340 && observed.visible ? observed : null;
            }, timeoutMs, "selected Evolution label after native resize");
            assert.ok(retainedSelection.current && retainedSelection.documentFits
              && (evolutionMultiDefinitionFixture ? retainedSelection.cycleFocused : retainedSelection.headingFocused),
              `Native resize lost the selected Evolution state: ${JSON.stringify(retainedSelection)}`);
            checks.push("evolution-native-resize-retains-active-selection");
            const linkedNavigation = await dashboard.evaluate(`(() => {
              document.querySelector('.nav-item[data-panel="overview"]').click();
              document.querySelector('#overview-other-sources').open = true;
              document.querySelector('.overview-source-list button[data-panel-link="evolution"]').click();
              const strip = document.querySelector('.nav-list');
              const active = strip.querySelector('.nav-item[data-panel="evolution"]');
              const stripBounds = strip.getBoundingClientRect();
              const itemBounds = active.getBoundingClientRect();
              return {current: active.getAttribute('aria-current') === 'page',
                visible: itemBounds.left >= stripBounds.left - 1 && itemBounds.right <= stripBounds.right + 1,
                scrolled: strip.scrollLeft > 0,
                headingFocused: document.activeElement === document.querySelector('#evolution-title'),
                documentFits: document.documentElement.scrollWidth <= innerWidth + 1};
            })()`);
            assert.ok(Object.values(linkedNavigation).every(Boolean),
              `Narrow Overview-to-Evolution navigation did not reveal its selected destination: ${JSON.stringify(linkedNavigation)}`);
            checks.push("evolution-native-narrow-linked-navigation-visible");
            await poll(async () => {
              const status = await dashboard.evaluate('document.querySelector("#evolution-observation-status")?.textContent');
              return status === (evolutionVerifiedRoot ? "Verified ledger" : "Registry only") ? status : null;
            }, timeoutMs, "Evolution observation after narrow linked navigation");
            checks.push("evolution-native-narrow-linked-reading-settled");
          } else {
            await dashboard.send("Emulation.setDeviceMetricsOverride", {width: 340, height: 740,
              deviceScaleFactor: 1, mobile: false});
          }
          const narrow = await poll(async () => {
            const observed = await dashboard.evaluate(`(() => {
              const title = document.querySelector("#evolution-title");
              const definition = document.querySelector("#evolution-definitions .evolution-definition");
              const cycle = document.querySelector("#evolution-cycles .evolution-cycle");
              const metrics = document.querySelector("#evolution-evidence-metrics");
              const refresh = document.querySelector("#refresh");
              const nav = document.querySelector(".nav-list");
              const navPrevious = document.querySelector("#nav-scroll-prev");
              const navNext = document.querySelector("#nav-scroll-next");
              const refreshText = document.createRange();
              refreshText.selectNodeContents(refresh);
              return {width: innerWidth, height: innerHeight,
                scrollWidth: document.documentElement.scrollWidth,
                navScrollbarWidth: getComputedStyle(nav).scrollbarWidth,
                navScrollWidth: nav.scrollWidth,
                navClientWidth: nav.clientWidth,
                navPreviousVisible: !navPrevious.hidden && getComputedStyle(navPrevious).display !== "none",
                navNextVisible: !navNext.hidden && getComputedStyle(navNext).display !== "none",
                navPreviousLabel: navPrevious.getAttribute("aria-label"),
                navNextLabel: navNext.getAttribute("aria-label"),
                refreshLines: refreshText.getClientRects().length,
                refreshRight: refresh.getBoundingClientRect().right,
                titleLines: Math.round(title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight)),
                firstDefinitionTop: definition?.getBoundingClientRect().top ?? null,
                firstCycleTop: cycle?.getBoundingClientRect().top ?? null,
                cycleTop: document.querySelector("#evolution-cycle-card")?.getBoundingClientRect().top ?? null,
                metricsTop: metrics?.getBoundingClientRect().top ?? null,
                metricsHeight: metrics?.getBoundingClientRect().height ?? null,
                evidenceLineHidden: document.querySelector("#evolution-evidence-line")?.hidden};
            })()`);
            return observed.width === 340 && observed.height === 740 ? observed : null;
          }, timeoutMs, "narrow Evolution WebView2 metrics");
          assert.ok(narrow.scrollWidth <= 341 && narrow.titleLines === 2,
            `Narrow Evolution heading or document overflow: ${JSON.stringify(narrow)}`);
          assert.ok(narrow.navScrollbarWidth === "none" && narrow.navScrollWidth > narrow.navClientWidth
            && narrow.navPreviousVisible && narrow.navNextVisible
            && narrow.navPreviousLabel === "Previous sections" && narrow.navNextLabel === "Next sections",
          `Narrow navigation lost its hidden scrollbar or accessible edge controls: ${JSON.stringify(narrow)}`);
          checks.push("evolution-narrow-hidden-scrollbar-with-edge-controls");
          assert.ok(narrow.refreshLines === 1 && narrow.refreshRight <= narrow.width + 1,
            `Narrow Refresh view control wrapped or left the viewport: ${JSON.stringify(narrow)}`);
          checks.push("evolution-narrow-refresh-control-one-line");
          if (evolutionVerifiedRoot) {
            assert.ok(narrow.cycleTop < narrow.metricsTop && narrow.firstCycleTop < 740
              && narrow.metricsHeight < 220 && narrow.evidenceLineHidden === false,
            `Verified Evolution must lead with a recorded cycle in the narrow first view: ${JSON.stringify(narrow)}`);
            checks.push("evolution-narrow-verified-cycle-before-metrics");
            if (evolutionCoordinationFixture) {
              const phaseRow = await dashboard.evaluate(`(() => {
                const rows = [...document.querySelectorAll("#evolution-coordination .evolution-row")];
                const row = rows
                  .find(item => item.querySelector("strong")?.textContent === "Phase 1 · construction");
                const labels = rows.map(item => {
                  const label = item.querySelector("strong");
                  const range = document.createRange();
                  range.selectNodeContents(label);
                  return {text: label.textContent, lines: range.getClientRects().length};
                });
                return {text: row?.innerText ?? "", right: row?.getBoundingClientRect().right,
                  width: document.documentElement.scrollWidth, viewport: innerWidth, labels};
              })()`);
              assert.match(phaseRow.text, /2 recorded events/);
              assert.deepEqual(phaseRow.labels, [
                {text: "Phases", lines: 1}, {text: "Work items", lines: 1},
                {text: "Phase 1 · construction", lines: 1},
              ], `Verified coordination labels break at narrow width: ${JSON.stringify(phaseRow)}`);
              assert.ok(phaseRow.right <= phaseRow.viewport + 1 && phaseRow.width <= phaseRow.viewport + 1,
                `Verified phase row overflows the narrow window: ${JSON.stringify(phaseRow)}`);
              checks.push("evolution-native-narrow-phase-row-fits");
            }
          } else {
            assert.ok(narrow.firstDefinitionTop < 740 && narrow.evidenceLineHidden === true,
            `Registry-only Evolution must show its first definition in the narrow first view: ${JSON.stringify(narrow)}`);
            checks.push("evolution-narrow-registry-first-definition");
          }
          checks.push(evolutionNativeNarrow ? "evolution-native-narrow-webview2-no-overflow" : "evolution-narrow-webview2-no-overflow");
        }
        if (evolutionScreenshot) {
          if (evolutionCoordinationFixture) await dashboard.evaluate(`(() => {
            [...document.querySelectorAll("#evolution-coordination .evolution-row")]
              .find(item => item.querySelector("strong")?.textContent === "Phase 1 · construction")
              ?.scrollIntoView({block: "center"});
          })()`);
          else if (!evolutionNarrow && !evolutionNativeNarrow && evolutionSignalLog) await dashboard.evaluate('document.querySelector("#evolution-signal-list").scrollIntoView({block: "center"})');
          else if (!evolutionNarrow && !evolutionNativeNarrow && evolutionVerifiedRoot) await dashboard.evaluate('document.querySelector("#evolution-cycles").scrollIntoView({block: "center"})');
          await saveScreenshot(dashboard, evolutionScreenshot);
          checks.push("evolution-screenshot-saved");
        }
        const signalJump = await dashboard.evaluate(`(() => {
          document.querySelector("#evolution-signal-jump").click();
          const heading = document.querySelector("#evolution-signals-title");
          const bounds = heading.getBoundingClientRect();
          return {focused: document.activeElement === heading,
            visible: bounds.top >= -1 && bounds.top < innerHeight};
        })()`);
        assert.ok(signalJump.focused && signalJump.visible,
          `Evolution candidate teaser did not reveal its details: ${JSON.stringify(signalJump)}`);
        checks.push("evolution-gateway-candidate-teaser-jump");
        if (evolutionNarrow) await dashboard.send("Emulation.clearDeviceMetricsOverride");
        if (nativeWindowBefore) resizeIsolatedDashboard(child.pid, nativeWindowBefore.before_width, nativeWindowBefore.before_height);
      }
      if (name === "diagnostics") {
        const productBeforeRefresh = await dashboard.evaluate(`({
          posture: document.querySelector("#diagnostic-product-posture")?.textContent,
          detail: document.querySelector("#diagnostic-product-detail")?.textContent ?? "",
        })`);
        if (productBeforeRefresh.posture === "Stale") {
          assert.match(productBeforeRefresh.detail, /expired|last observed/i,
            "An expired product diagnostic was not explained as historical.");
          checks.push("expired-product-diagnostic-remains-historical-before-refresh");
        }
        await clickElement(dashboard, "#refresh");
        const sources = await poll(async () => {
          const observed = await dashboard.evaluate(`(() => ({
            product: document.querySelector("#diagnostic-product-posture")?.textContent,
            adapter: document.querySelector("#diagnostic-adapter-posture")?.textContent,
            thread: document.querySelector("#diagnostic-thread-posture")?.textContent,
            evolution: document.querySelector("#diagnostic-evolution-posture")?.textContent,
            signal: document.querySelector("#diagnostic-evolution-signal-posture")?.textContent,
            decision: document.querySelector("#diagnostic-decision-posture")?.textContent,
            details: ["product", "adapter", "thread", "evolution", "evolution-signal", "decision"].map(source =>
              document.querySelector("#diagnostic-" + source + "-detail")?.textContent ?? ""),
          }))()`);
          const target = ["Diagnostic passed", liveAdapter ? "Observed" : "Not configured", adapterExternalDsh ? "Unavailable" : degradedSteer || unknownDispatch || threadPages ? "Attention" : adapterLive || externalThread ? "Observed" : adapterExternalSocket ? "No records" : "Not configured", evolutionVerifiedRoot ? "Verified ledger" : evolutionRoot ? "No runtime evidence" : "Registry only", evolutionSignalLog ? "Verified candidate inbox" : "Not configured", adapterExternalDsh ? "Unavailable" : adapterLive || adapterExternalActive || adapterExternalInflight || externalRecoveredDecisions ? "Observed" : adapterExternalSocket ? "No records" : "Not configured"];
          return JSON.stringify([observed.product, observed.adapter, observed.thread, observed.evolution, observed.signal, observed.decision]) === JSON.stringify(target) ? observed : null;
        }, timeoutMs, "Independent Evidence source postures");
        assert.equal(sources.product, "Diagnostic passed");
        assert.equal(sources.details.length, 6);
        for (const detail of sources.details) assert.ok(detail.trim().length >= 24, `Evidence source explanation missing: ${JSON.stringify(sources)}`);
        assert.ok(sources.details[0].includes("product"), "Product explanation must name its own boundary.");
        assert.ok(sources.details[4].includes("candidate"), "Candidate inbox explanation must stay separate from the Evolution ledger.");
        checks.push("evidence-explicit-refresh-restores-current-readings",
          "six-evidence-source-postures-independent", "six-evidence-source-explanations-visible");
        if (evidenceScreenshot) {
          await dashboard.evaluate('document.querySelector(".source-health").scrollIntoView({block: "center"})');
          await saveScreenshot(dashboard, evidenceScreenshot);
          checks.push("evidence-screenshot-saved");
        }
      }
      if (name === "appearance") {
        const initialPosition = await orb.evaluate('({x: window.screenX, y: window.screenY})');
        await clickElement(dashboard, '[data-orb-placement="top-left"]');
        const moved = await poll(async () => {
          const current = await orb.evaluate('({x: window.screenX, y: window.screenY})');
          return Math.abs(current.x - initialPosition.x) + Math.abs(current.y - initialPosition.y) > 10 ? current : null;
        }, timeoutMs, "Floating mark corner placement");
        assert.ok(Number.isFinite(moved.x) && Number.isFinite(moved.y));
        const placement = await poll(async () => {
          try { return JSON.parse(await readFile(join(profile, "companion.json"), "utf8")); }
          catch { return null; }
        }, timeoutMs, "Isolated Companion preference write");
        assert.equal(placement.orbPlacement, "top-left");
        await clickElement(dashboard, '[data-skin-choice="cobalt"]');
        const skin = await poll(async () => {
          const current = await orb.evaluate('document.documentElement.dataset.skin');
          return current === "cobalt" ? current : null;
        }, timeoutMs, "Floating mark skin update");
        assert.equal(skin, "cobalt");
        assert.equal(JSON.parse(await readFile(join(profile, "companion.json"), "utf8")).skin, "cobalt");
        await clickElement(dashboard, '[data-orb-placement="center"]');
        const reset = await poll(async () => {
          const current = JSON.parse(await readFile(join(profile, "companion.json"), "utf8"));
          return current.orbPlacement === "center" ? current : null;
        }, timeoutMs, "Floating mark reset preference");
        assert.equal(reset.skin, "cobalt", "Placement must preserve the selected skin.");
        checks.push("orb-corner-placement-and-reset", "isolated-preference-persistence", "skin-updates-floating-mark");
        if (appearanceScreenshot) {
          await dashboard.evaluate('document.querySelector(".placement-control").scrollIntoView({block: "center"})');
          await saveScreenshot(dashboard, appearanceScreenshot);
          checks.push("appearance-screenshot-saved");
        }
      }
      checks.push(`${name}-panel-visible`);
    }
    for (const [panel, issue] of [["adapters", "adapter"], ["threads", "thread"], ["decisions", "decision"],
      ["evolution", "evolution"], ["evolution", "evolution-signal"]]) {
      await clickElement(dashboard, `[data-panel="${panel}"]`);
      await clickElement(dashboard, `[data-panel-link="diagnostics"][data-diagnostic-issue="${issue}"]`);
      const focusedIssue = await dashboard.evaluate('document.activeElement?.id');
      assert.equal(focusedIssue, `diagnostic-${issue}-issue`, `${issue} did not focus its Evidence source row.`);
      await clickElement(dashboard, `#diagnostic-${issue}-issue [data-panel-link="${panel}"]`);
      // WebView2 can settle a dispatched pointer event after CDP returns.
      // Wait only for the actual panel and focus state; a missed click still fails.
      const returned = await poll(async () => {
        const value = await dashboard.evaluate(`({visible: !document.querySelector("#panel-${panel}").hidden,
          focusedHeading: document.activeElement?.id === "${panel}-title"})`);
        return value.visible && value.focusedHeading ? value : null;
      }, Math.min(timeoutMs, 3_000), `${issue} Evidence return`);
      assert.deepEqual(returned, {visible: true, focusedHeading: true}, `${issue} Evidence return missed its source page.`);
      checks.push(`${issue}-evidence-source-link-and-return`);
    }
    await dashboard.send("Page.bringToFront");
    await dashboard.evaluate('document.querySelector("[data-panel=overview]").focus()');
    await dashboard.send("Input.dispatchKeyEvent", {type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13});
    await dashboard.send("Input.dispatchKeyEvent", {type: "char", text: "\r", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13});
    await dashboard.send("Input.dispatchKeyEvent", {type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13});
    const keyboard = await dashboard.evaluate('({overviewVisible: !document.querySelector("#panel-overview").hidden, current: document.querySelector("[data-panel=overview]").getAttribute("aria-current"), focusIsHeading: document.activeElement === document.querySelector("#panel-overview h1")})');
    assert.deepEqual(keyboard, {overviewVisible: true, current: "page", focusIsHeading: true});
    checks.push("keyboard-navigation-and-heading-focus");
    const headingFocus = await dashboard.evaluate(`(() => {
      const heading = document.querySelector("#panel-overview h1");
      const panel = document.querySelector("#panel-overview");
      const style = getComputedStyle(heading);
      return {outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth,
        devicePixelRatio: window.devicePixelRatio, viewportScale: window.visualViewport?.scale ?? null,
        headingWidth: heading.getBoundingClientRect().width, panelWidth: panel.getBoundingClientRect().width};
    })()`);
    assert.equal(headingFocus.outlineStyle, "solid", "Focused page heading needs a visible native outline.");
    assert.ok(Number.isFinite(headingFocus.devicePixelRatio) && headingFocus.devicePixelRatio > 0
      && Number.parseFloat(headingFocus.outlineWidth) * headingFocus.devicePixelRatio >= 1.99,
      `Focused page heading outline is thinner than two device pixels: ${JSON.stringify(headingFocus)}`);
    assert.ok(headingFocus.headingWidth < headingFocus.panelWidth * 0.85,
      `Focused heading outline spans too much of the page: ${JSON.stringify(headingFocus)}`);
    checks.push("native-heading-focus-outline-bounded");
    await clickElement(dashboard, "#refresh");
    await poll(async () => {
      const refreshed = await dashboard.evaluate('({disabled: document.querySelector("#refresh").disabled, title: document.querySelector("#connection-title").textContent})');
      return !refreshed.disabled && refreshed.title === "ARE diagnostic passed" ? refreshed : null;
    }, timeoutMs, "Product diagnostic refresh");
    checks.push("product-refresh-independent-of-live-sources");
    if (adapterExternalSameWindowRecovery) {
      await clickElement(dashboard, '[data-panel="adapters"]');
      await poll(async () => (await dashboard.evaluate('document.querySelector("#adapter-observation-status").textContent')) === "Observed", timeoutMs, "Installed Codex adapter before gateway restart");
      await clickElement(dashboard, '[data-panel="threads"]');
      await poll(async () => (await dashboard.evaluate('document.querySelector("#thread-observation-source").textContent'))?.includes("same gateway epoch as Adapters"), timeoutMs, "Installed Codex thread correlated before gateway restart");
      await clickElement(dashboard, '[data-panel="decisions"]');
      await poll(async () => (await dashboard.evaluate('document.querySelector("#decision-observation-status").textContent')) === "Observed", timeoutMs, "Installed Codex decisions before gateway restart");
      await awaitRecoverySignal(timeoutMs, recoverySignalFile);
      await clickElement(dashboard, '[data-panel="adapters"]');
      await poll(async () => (await dashboard.evaluate('document.querySelector("#adapter-observation-status").textContent')) === "Observed", timeoutMs, "Installed Codex adapter after gateway restart");
      const withdrawn = await dashboard.evaluate('({thread: document.querySelector("#thread-observation-status").textContent, source: document.querySelector("#thread-observation-source").textContent, decision: document.querySelector("#decision-observation-status").textContent, decisionLiveHidden: document.querySelector("#decision-live").hidden})');
      assert.ok(["Source changed", "Stale"].includes(withdrawn.thread), `Old installed Codex thread was not withdrawn: ${JSON.stringify(withdrawn)}`);
      assert.ok(!withdrawn.source.includes("same gateway epoch as Adapters"), "Old installed Codex thread retained adapter correlation.");
      assert.ok(["Source changed", "Stale"].includes(withdrawn.decision) && withdrawn.decisionLiveHidden,
        `Old installed Codex decisions were not withdrawn: ${JSON.stringify(withdrawn)}`);
      await clickElement(dashboard, '[data-panel="threads"]');
      await poll(async () => {
        const state = await dashboard.evaluate('({status: document.querySelector("#thread-observation-status").textContent, source: document.querySelector("#thread-observation-source").textContent, rows: document.querySelector("#thread-list").textContent})');
        return state.status === "Observed" && state.source.includes("same gateway epoch as Adapters")
          && (adapterExternalSameWindowInterrupted
            ? state.rows.includes("Recovered host terminal")
              && state.rows.includes("Exact host history for this turn: interrupted")
              && state.rows.includes("without a completion frontier or automatic retry")
              && !state.rows.includes("Turn active")
            : state.rows.includes("Turn completed")) ? state : null;
      }, timeoutMs, "Recovered installed Codex thread in same dashboard");
      await clickElement(dashboard, '[data-panel="decisions"]');
      await poll(async () => (await dashboard.evaluate('document.querySelector("#decision-observation-status").textContent')) === "Observed", timeoutMs, "Recovered installed Codex decision observations");
      const recovered = await dashboard.evaluate('({decisionRows: document.querySelectorAll("#decision-list .thread-card").length, decisionLiveHidden: document.querySelector("#decision-live").hidden, hostControl: document.querySelector("#adapter-host-control-state").textContent})');
      assert.ok(recovered.decisionRows > 0 && !recovered.decisionLiveHidden && recovered.hostControl === "unverified",
        `Recovered installed Codex decisions were not shown under the new epoch: ${JSON.stringify(recovered)}`);
      checks.push("installed-codex-same-window-restart-invalidates-old-epochs", "installed-codex-same-window-restart-recovers-decision-observations");
      if (adapterExternalSameWindowInterrupted) checks.push("installed-codex-same-window-interrupted-turn-reconciled");
    }
    if (adapterFixture) {
      await clickElement(dashboard, '[data-panel="adapters"]');
      await poll(async () => (await dashboard.evaluate('document.querySelector("#adapter-observation-status").textContent')) === "Observed", timeoutMs, "Adapter before gateway loss");
      await clickElement(dashboard, '[data-panel="threads"]');
      await poll(async () => (await dashboard.evaluate('document.querySelector("#thread-observation-source").textContent'))?.includes("same gateway epoch as Adapters"), timeoutMs, "Correlated thread before gateway loss");
      if (adapterRestartSameWindow) {
        await clickElement(dashboard, '[data-panel="decisions"]');
        await poll(async () => (await dashboard.evaluate('document.querySelector("#decision-observation-status").textContent')) === "Observed", timeoutMs, "Process-local decisions before gateway restart");
        const oldEpoch = adapterFixture.gateway.observeAdapters().runtime_epoch_id;
        const restartIdentity = Object.fromEntries(["name", "listenPath", "observationPath", "connectionToken", "observationToken"]
          .map(key => [key, adapterFixture[key]]));
        await adapterFixture.transport.close();
        await adapterFixture.gateway.close();
        adapterFixture.sessionStore.close();
        adapterFixture = null;
        await clickElement(dashboard, '[data-panel="adapters"]');
        await poll(async () => (await dashboard.evaluate('document.querySelector("#adapter-observation-status").textContent')) === "Unavailable", timeoutMs, "Adapter unavailable during gateway restart");
        assert.ok(!(await dashboard.evaluate('document.querySelector("#thread-observation-source").textContent')).includes("same gateway epoch as Adapters"));
        adapterFixture = await startLiveAdapterFixture(false, false, false, false, undefined, restartIdentity);
        assert.notEqual(adapterFixture.gateway.observeAdapters().runtime_epoch_id, oldEpoch, "The fixture did not create a new gateway runtime epoch.");
        await clickElement(dashboard, '[data-panel="adapters"]');
        await poll(async () => (await dashboard.evaluate('document.querySelector("#adapter-observation-status").textContent')) === "Observed", timeoutMs, "Adapter after same-window gateway restart");
        await poll(async () => (await dashboard.evaluate('document.querySelector("#thread-observation-status").textContent')) === "Source changed", timeoutMs, "Old thread epoch invalidated after restart");
        await poll(async () => (await dashboard.evaluate('document.querySelector("#decision-observation-status").textContent')) === "Source changed", timeoutMs, "Old process-local decisions invalidated after restart");
        await clickElement(dashboard, '[data-panel="threads"]');
        await poll(async () => (await dashboard.evaluate('document.querySelector("#thread-observation-source").textContent'))?.includes("same gateway epoch as Adapters"), timeoutMs, "New thread epoch observed in same dashboard");
        await clickElement(dashboard, '[data-panel="decisions"]');
        await poll(async () => (await dashboard.evaluate('document.querySelector("#decision-observation-status").textContent')) === "No records", timeoutMs, "New gateway process has no decisions");
        const restoredState = await dashboard.evaluate('({oldDecisionsHidden: document.querySelector("#decision-live").hidden, hostControl: document.querySelector("#adapter-host-control-state").textContent})');
        assert.deepEqual(restoredState, {oldDecisionsHidden: true, hostControl: "unverified"});
        checks.push("same-window-gateway-restart-invalidates-old-epochs", "same-window-gateway-restart-recovers-new-epoch-without-old-decisions");
      }
      await adapterFixture.transport.close();
      await adapterFixture.gateway.close();
      adapterFixture.sessionStore.close();
      adapterFixture = null;
      await clickElement(dashboard, '[data-panel="adapters"]');
      await poll(async () => (await dashboard.evaluate('document.querySelector("#adapter-observation-status").textContent')) === "Unavailable", timeoutMs, "Adapter source loss");
      const threadCorrelationAfterLoss = await dashboard.evaluate('document.querySelector("#thread-observation-source").textContent');
      assert.ok(!threadCorrelationAfterLoss.includes("same gateway epoch as Adapters"), "A lost gateway retained the thread-adapter correlation claim.");
      checks.push("gateway-loss-clears-thread-adapter-correlation");
      await clickElement(dashboard, '[data-panel="decisions"]');
      await poll(async () => (await dashboard.evaluate('document.querySelector("#decision-observation-status").textContent')) === "Unavailable", timeoutMs, "Decision source loss");
      await clickElement(dashboard, '[data-panel="threads"]');
      await poll(async () => (await dashboard.evaluate('document.querySelector("#thread-observation-status").textContent')) === "Unavailable", timeoutMs, "Thread source loss");
      await clickElement(dashboard, '[data-panel="diagnostics"]');
      await poll(async () => {
        const postures = await dashboard.evaluate('({product: document.querySelector("#diagnostic-product-posture").textContent, adapter: document.querySelector("#diagnostic-adapter-posture").textContent, thread: document.querySelector("#diagnostic-thread-posture").textContent, decision: document.querySelector("#diagnostic-decision-posture").textContent})');
        return postures.product === "Diagnostic passed" && postures.adapter === "Unavailable" && postures.thread === "Unavailable" && postures.decision === "Unavailable" ? postures : null;
      }, timeoutMs, "Independent source failure postures");
      checks.push("gateway-loss-clears-live-postures", "product-health-remains-independent");
    }
    const secondaryTextPx = await dashboard.evaluate('parseFloat(getComputedStyle(document.querySelector(".section-kicker")).fontSize)');
    assert.ok(secondaryTextPx >= 12, `Secondary label is still too small: ${secondaryTextPx}px`);
    await dashboard.send("Emulation.setEmulatedMedia", {features: [{name: "prefers-contrast", value: "more"}]});
    const mutedContrast = await dashboard.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--muted").trim()');
    assert.equal(mutedContrast, "#d2ddf4", "Cobalt high-contrast token was not applied.");
    await orb.send("Emulation.setEmulatedMedia", {features: [{name: "prefers-reduced-motion", value: "reduce"}]});
    assert.equal(await orb.evaluate('getComputedStyle(document.querySelector("#orb")).transitionDuration'), "0s");
    checks.push("legible-secondary-text", "high-contrast-and-reduced-motion-preferences");
    await clickElement(dashboard, '[data-panel="appearance"]');
    await clickElement(dashboard, '[data-orb-placement="top-right"]');
    await poll(async () => {
      const preferences = JSON.parse(await readFile(join(profile, "companion.json"), "utf8"));
      return preferences.orbPlacement === "top-right" && preferences.skin === "cobalt" ? preferences : null;
    }, timeoutMs, "Saved preferences before relaunch");
    for (const client of clients) client.close();
    child.kill();
    await poll(() => child.exitCode !== null || child.signalCode !== null, timeoutMs, "First Companion exit");
    port = await freeLocalPort();
    child = spawn(exe, ["--webview-orb"], {
      cwd: dirname(exe),
      env: {
        ...launchEnv,
        ...(evolutionRoot ? {ARE_COMPANION_EVOLUTION_ROOT: evolutionRoot} : {}),
        ...(evolutionSignalLog ? {ARE_COMPANION_EVOLUTION_SIGNAL_LOG: evolutionSignalLog} : {}),
        WEBVIEW2_USER_DATA_FOLDER: profile,
        WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-address=127.0.0.1 --remote-debugging-port=${port}${browserDisableGpu ? " --disable-gpu" : ""}`,
      },
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: false,
    });
    child.stderr.on("data", chunk => { stderr = (stderr + String(chunk)).slice(-8192); });
    const relaunchedOrb = await poll(async () => {
      if (child.exitCode !== null) throw new Error(`Relaunched Companion exited with code ${child.exitCode}`);
      pages = await listPages(port);
      return matchingPage(pages, "orb.html");
    }, timeoutMs, "Relaunched floating orb");
    orb = await Cdp.connect(relaunchedOrb.webSocketDebuggerUrl, timeoutMs);
    clients.push(orb);
    await poll(async () => {
      const position = await orb.evaluate('({ready: document.readyState, skin: document.documentElement.dataset.skin, x: window.screenX, y: window.screenY, left: screen.availLeft, top: screen.availTop, width: screen.availWidth, height: screen.availHeight})');
      return position.ready === "complete" && position.skin === "cobalt" && position.x > position.left + position.width / 2 && position.y < position.top + position.height / 2 ? position : null;
    }, timeoutMs, "Saved skin and corner after relaunch");
    checks.push("saved-skin-and-corner-survive-relaunch");
    return {schema_version: "are.companion-windows-ui-test/v1", ok: true, checks, screenshot: screenshot ?? null, adapter_screenshot: adapterScreenshot ?? null, thread_screenshot: threadScreenshot ?? null, decision_screenshot: decisionScreenshot ?? null, evidence_screenshot: evidenceScreenshot ?? null, appearance_screenshot: appearanceScreenshot ?? null, evolution_screenshot: evolutionScreenshot ?? null, native_narrow_window: nativeNarrowWindow, thread_native_narrow_window: threadNativeNarrowWindow, dashboard: state, authority_effect: "none"};
  } catch (error) {
    const orbErrors = orb ? await orb.evaluate("globalThis.__areUiTestErrors ?? []").catch(() => []) : [];
    const newPage = pages.find(page => !preClickTargetIds.has(page.id));
    let newPageState = null;
    if (newPage?.webSocketDebuggerUrl) {
      const probe = await Cdp.connect(newPage.webSocketDebuggerUrl, 2000).catch(() => null);
      if (probe) {
        newPageState = await probe.evaluate(`({url: location.href, title: document.title, readyState: document.readyState, bodyTextLength: document.body?.innerText.length ?? 0})`).catch(() => null);
        if (screenshot && !existsSync(screenshot)) await saveScreenshot(dashboard ?? probe, screenshot).catch(() => {});
        probe.close();
      }
    }
    if (screenshot && !existsSync(screenshot) && dashboard) await saveScreenshot(dashboard, screenshot).catch(() => {});
    const threadObservation = dashboard ? await dashboard.evaluate(`({status: document.querySelector("#thread-observation-status")?.textContent,
      source: document.querySelector("#thread-observation-source")?.textContent,
      count: document.querySelector("#thread-count")?.textContent,
      range: document.querySelector("#thread-page-range")?.textContent})`).catch(() => null) : null;
    return {schema_version: "are.companion-windows-ui-test/v1", ok: false, checks, error: error.message, pages: pages.map(page => ({title: page.title, url: page.url})), newPageState, orbErrors, stderr: stderr.trim() || null, orb: lastOrbState, dashboard: dashboard ? await dashboardState(dashboard).catch(() => lastDashboardState) : lastDashboardState, threadObservation, screenshot: screenshot && existsSync(screenshot) ? screenshot : null, authority_effect: "none"};
  } finally {
    for (const client of clients) client.close();
    let childExitPending = false;
    if (child && child.exitCode === null && child.signalCode === null) {
      const stopped = new Promise(done => child.once("exit", done));
      child.kill();
      await Promise.race([stopped, pause(5_000)]);
      childExitPending = child.exitCode === null && child.signalCode === null;
    }
    let aclCleanupError;
    if (ledgerReadDenied) {
      try { setReadDeny(deniedLedger, denialAccount, false); }
      catch (error) { aclCleanupError = error; }
    }
    if (adapterFixture) {
      await adapterFixture.transport.close().catch(() => {});
      await adapterFixture.gateway.close().catch(() => {});
      adapterFixture.sessionStore.close();
    }
    if (hostedObservationServer) await new Promise(resolveClose => hostedObservationServer.close(resolveClose));
    await pause(500);
    await rm(profile, {recursive: true, force: true, maxRetries: 8, retryDelay: 250}).catch(() => {});
    if (aclCleanupError) throw aclCleanupError;
    if (childExitPending) throw new Error("Companion UI probe child did not exit before cleanup.");
  }
}

async function testLiveEvolution({exe, evolutionRoot, evolutionScreenshot, adapterExternalSocket, timeoutMs}) {
  const checks = [];
  const profile = await mkdtemp(join(tmpdir(), "are-companion-live-evolution-"));
  const observer = join(dirname(exe), "are", "cyberAlchemy-v2", "implementation", "agent-reasoning-engine",
    "packages", "evolution-runtime", "bin", "observe.mjs");
  const bundledNode = join(dirname(exe), "node", "node.exe");
  const clients = [];
  let child;
  let stderr = "";
  try {
    assert.ok(existsSync(observer) && existsSync(bundledNode), "Bundled Evolution observer is unavailable.");
    const observe = () => {
      const result = spawnSync(bundledNode, [observer, "--json", "--root", evolutionRoot],
        {encoding: "utf8", timeout: 15_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true});
      assert.equal(result.status, 0, `Bundled Evolution observation failed: ${result.error?.message ?? result.stderr}`);
      const record = JSON.parse(result.stdout);
      assert.equal(record.schema_version, "are.evolution-observation/v1");
      assert.equal(record.source, "durable-ledger-and-candidate-registry");
      assert.equal(record.root_status, "present");
      assert.equal(record.evidence_status, "verified");
      assert.equal(record.authority_effect, "none");
      assert.ok(Number.isSafeInteger(record.cycle_count) && record.cycle_count > 0);
      assert.ok(Number.isSafeInteger(record.commit_count) && record.commit_count >= record.cycle_count);
      assert.match(record.projection_digest, /^[a-f0-9]{64}$/);
      return record;
    };
    const before = observe();
    checks.push("existing-ledger-verified-before-launch");
    const port = await freeLocalPort();
    const env = {...process.env};
    const isolatedKeys = ["ARE_COMPANION_NODE", "ARE_COMPANION_ENTRY", "ARE_COMPANION_OBSERVATION_SOCKET",
      "ARE_ADAPTER_OBSERVATION_TOKEN", "ARE_COMPANION_EVOLUTION_ROOT", "ARE_COMPANION_EVOLUTION_SIGNAL_LOG",
      "ARE_COMPANION_PREFERENCES_PATH", "WEBVIEW2_USER_DATA_FOLDER", "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"];
    for (const key of Object.keys(env)) if (isolatedKeys.includes(key.toUpperCase())) delete env[key];
    Object.assign(env, {ARE_COMPANION_EVOLUTION_ROOT: evolutionRoot,
      ARE_COMPANION_PREFERENCES_PATH: join(profile, "companion.json"),
      WEBVIEW2_USER_DATA_FOLDER: join(profile, "webview2"),
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-address=127.0.0.1 --remote-debugging-port=${port}`});
    if (adapterExternalSocket) {
      const entry = join(dirname(exe), "are", "cyberAlchemy-v2", "implementation",
        "agent-reasoning-engine", "bin", "are.mjs");
      assert.ok(existsSync(entry), "Bundled ARE entry is unavailable.");
      Object.assign(env, {ARE_COMPANION_NODE: bundledNode, ARE_COMPANION_ENTRY: entry,
        ARE_COMPANION_OBSERVATION_SOCKET: adapterExternalSocket,
        ARE_ADAPTER_OBSERVATION_TOKEN: process.env.ARE_ADAPTER_OBSERVATION_TOKEN});
    }
    child = spawn(exe, ["--webview-orb"], {cwd: dirname(exe), env,
      stdio: ["ignore", "ignore", "pipe"], windowsHide: false});
    child.stderr.on("data", chunk => { stderr = (stderr + String(chunk)).slice(-8192); });
    const orbPage = await poll(async () => {
      if (child.exitCode !== null) throw new Error(`Companion exited with code ${child.exitCode}`);
      return matchingPage(await listPages(port), "orb.html");
    }, timeoutMs, "Live Evolution floating orb");
    const orb = await Cdp.connect(orbPage.webSocketDebuggerUrl, timeoutMs);
    clients.push(orb);
    await poll(async () => (await orb.evaluate('Boolean(document.querySelector("#orb") && globalThis.__TAURI__?.core?.invoke)')) || null,
      timeoutMs, "Live Evolution orb readiness");
    checks.push("floating-orb-rendered");
    await clickElement(orb, "#orb");
    const dashboardPage = await poll(async () => matchingPage(await listPages(port), "dashboard.html"),
      timeoutMs, "Live Evolution dashboard");
    const dashboard = await Cdp.connect(dashboardPage.webSocketDebuggerUrl, timeoutMs);
    clients.push(dashboard);
    const initial = await poll(async () => {
      const state = await dashboardState(dashboard);
      return state.readyState === "complete" && state.appShellPresent && state.overviewVisible ? state : null;
    }, timeoutMs, "Live Evolution dashboard readiness");
    assert.ok(initial.bodyTextLength >= 200 && initial.appShellWidth >= 600,
      `Dashboard is blank or undersized: ${JSON.stringify(initial)}`);
    checks.push("dashboard-opened-and-not-blank");
    await dashboard.evaluate(`(() => {
      globalThis.__areUiTestErrors = [];
      addEventListener("unhandledrejection", event => globalThis.__areUiTestErrors.push(String(event.reason)));
      return true;
    })()`);
    if (adapterExternalSocket) {
      await clickElement(dashboard, '[data-panel="adapters"]');
      const adapter = await poll(async () => {
        const value = await dashboard.evaluate(`(() => ({
          status: document.querySelector("#adapter-observation-status")?.textContent,
          selectedPath: document.querySelector("#adapter-selected-path-state")?.textContent,
          transport: document.querySelector("#adapter-observation-transport")?.textContent,
          hostControl: document.querySelector("#adapter-host-control-state")?.textContent
        }))()`);
        return value.status === "Observed" ? value : null;
      }, timeoutMs, "Joined live adapter observation");
      assert.equal(adapter.selectedPath, "ready");
      assert.equal(adapter.transport, "Local loopback TCP · development only");
      assert.equal(adapter.hostControl, "unverified");
      checks.push("authenticated-adapter-path-observed-without-task-control");
    }
    await clickElement(dashboard, '[data-panel="evolution"]');
    const rendered = await poll(async () => {
      const value = await dashboard.evaluate(`(() => ({
        status: document.querySelector("#evolution-observation-status")?.textContent,
        panelVisible: !document.querySelector("#panel-evolution")?.hidden,
        cycles: document.querySelector("#evolution-cycle-count")?.textContent,
        commits: document.querySelector("#evolution-commit-count")?.textContent,
        definitions: document.querySelector("#evolution-definition-count")?.textContent,
        cycleRows: document.querySelectorAll("#evolution-cycles .evolution-cycle").length,
        firstCycle: document.querySelector("#evolution-cycles .evolution-cycle summary")?.innerText ?? "",
        phaseRows: document.querySelectorAll("#evolution-coordination .evolution-row").length,
        coordination: document.querySelector("#evolution-coordination")?.innerText ?? "",
        errors: globalThis.__areUiTestErrors ?? []
      }))()`);
      return value.status === "Verified ledger" ? value : null;
    }, timeoutMs, "Live Evolution verified screen");
    assert.equal(rendered.panelVisible, true);
    assert.equal(rendered.cycles, String(before.cycle_count));
    assert.equal(rendered.commits, String(before.commit_count));
    assert.equal(rendered.definitions, String(before.definitions.length));
    assert.ok(rendered.cycleRows > 0 && rendered.firstCycle.trim(), "No recorded cycle is visible.");
    const observedPhaseCount = before.phase_summaries?.length ?? before.coordination_summary?.phase_count;
    assert.ok(Number.isSafeInteger(observedPhaseCount), "Observer did not provide a coordination phase count.");
    assert.ok(rendered.phaseRows >= 2 && rendered.coordination.includes(`${observedPhaseCount} admitted phase`),
      `Verified coordination summary is missing: ${rendered.coordination}`);
    assert.deepEqual(rendered.errors, []);
    checks.push("live-ledger-counts-rendered", "recorded-cycle-visible", "coordination-summary-rendered");
    if (evolutionScreenshot) {
      await saveScreenshot(dashboard, evolutionScreenshot);
      checks.push("live-evolution-screenshot-saved");
    }
    const after = observe();
    assert.equal(after.projection_digest, before.projection_digest,
      "Evolution ledger changed during the live UI probe; the count comparison is inconclusive.");
    checks.push("existing-ledger-projection-unchanged");
    return {schema_version: "are.companion-windows-live-evolution-ui-test/v1", ok: true, checks,
      observed_cycles: rendered.cycles, observed_commits: rendered.commits,
      observed_phases: observedPhaseCount, adapter_path_observed: Boolean(adapterExternalSocket),
      evolution_screenshot: evolutionScreenshot ?? null,
      authority_effect: "none"};
  } catch (error) {
    return {schema_version: "are.companion-windows-live-evolution-ui-test/v1", ok: false,
      checks, error: error.message, stderr: stderr.trim() || null, authority_effect: "none"};
  } finally {
    for (const client of clients) client.close();
    if (child && child.exitCode === null) {
      const stopped = new Promise(done => child.once("exit", done));
      child.kill();
      await Promise.race([stopped, pause(5_000)]);
    }
    await rm(profile, {recursive: true, force: true, maxRetries: 8, retryDelay: 250}).catch(() => {});
  }
}

async function testDashboardOnly({exe, timeoutMs}) {
  const port = await freeLocalPort();
  const profile = await mkdtemp(join(tmpdir(), "are-dashboard-only-"));
  const resourceRoots = [dirname(exe), resolve(dirname(exe), "../..", "resources")];
  const resources = resourceRoots.find(root => existsSync(join(root, "node", "node.exe"))
    && existsSync(join(root, "are", "cyberAlchemy-v2", "implementation", "agent-reasoning-engine", "bin", "are.mjs")));
  const env = {...process.env, WEBVIEW2_USER_DATA_FOLDER: profile,
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-address=127.0.0.1 --remote-debugging-port=${port}`,
    ARE_COMPANION_PREFERENCES_PATH: join(profile, "companion.json")};
  for (const key of ["ARE_COMPANION_NODE", "ARE_COMPANION_ENTRY", "ARE_COMPANION_OBSERVATION_SOCKET", "ARE_ADAPTER_OBSERVATION_TOKEN"]) delete env[key];
  if (resources) {
    env.ARE_COMPANION_NODE = join(resources, "node", "node.exe");
    env.ARE_COMPANION_ENTRY = join(resources, "are", "cyberAlchemy-v2", "implementation", "agent-reasoning-engine", "bin", "are.mjs");
  }
  const child = spawn(exe, ["--dashboard-only"], {cwd: dirname(exe), env,
    stdio: ["ignore", "ignore", "pipe"], windowsHide: false});
  let stderr = "";
  child.stderr.on("data", chunk => { stderr = (stderr + String(chunk)).slice(-4096); });
  let client;
  try {
    const page = await poll(async () => {
      if (child.exitCode !== null) throw new Error(`Companion exited with code ${child.exitCode}: ${stderr}`);
      const pages = await listPages(port);
      assert.equal(matchingPage(pages, "orb.html"), null, "Dashboard-only launch created an orb WebView");
      return matchingPage(pages, "dashboard.html");
    }, timeoutMs, "Dashboard-only WebView2 page");
    client = await Cdp.connect(page.webSocketDebuggerUrl, timeoutMs);
    const state = await poll(async () => {
      const value = await client.evaluate(`({ready:document.readyState,bridge:!!globalThis.__TAURI__?.core?.invoke,
        panels:[...document.querySelectorAll('[data-panel]')].map(item=>item.dataset.panel),
        text:document.body?.innerText?.slice(0,500)})`);
      return value.ready === "complete" && value.bridge && value.panels.length === 7 && value.text.includes("ARE") ? value : null;
    }, timeoutMs, "Dashboard-only rendered navigation");
    for (const panel of state.panels) {
      const visible = await client.evaluate(`document.querySelector('[data-panel=${JSON.stringify(panel)}]').click();
        !document.querySelector('#panel-${panel}').hidden`);
      assert.ok(visible, `Dashboard-only panel did not open: ${panel}`);
    }
    assert.equal(matchingPage(await listPages(port), "orb.html"), null,
      "Dashboard-only launch created an orb WebView after startup");
    if (resources) {
      const product = await poll(async () => {
        const value = await client.evaluate(`({posture:document.querySelector('#diagnostic-product-posture')?.textContent,
          node:document.querySelector('#node-match')?.textContent})`);
        return value.posture === "Diagnostic passed" && value.node === "Exact" ? value : null;
      }, timeoutMs, "Bundled ARE diagnostic");
      assert.equal(product.node, "Exact");
    }
    return {schema_version: "are.companion-windows-dashboard-only-test/v1", ok: true,
      orb_webview: false, panels: state.panels, product_diagnostic: resources ? "passed" : "not-bundled",
      authority_effect: "none"};
  } finally {
    client?.close();
    if (child.exitCode === null) child.kill();
    await pause(500);
    await rm(profile, {recursive: true, force: true, maxRetries: 8, retryDelay: 250}).catch(() => {});
  }
}

const args = parseArgs(process.argv.slice(2));
const result = args.evolutionLiveRoot ? await testLiveEvolution(args)
  : args.dashboardOnly ? await testDashboardOnly(args)
  : args.orbIdleNoDebug ? await testOrbIdleNoDebug(args) : await testUi(args);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ok) process.exitCode = 1;
