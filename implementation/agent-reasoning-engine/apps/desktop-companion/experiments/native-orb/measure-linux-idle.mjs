#!/usr/bin/env node
// Uninstalled-package WSLg/X11 development probe. Not an installed-app budget.
import {execFileSync} from "node:child_process";
import {mkdtempSync, readFileSync, readdirSync, rmSync, statSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {performance} from "node:perf_hooks";

const root = resolve(process.argv[2] ?? "");
const seconds = Number(process.argv[3] ?? 15);
const mode = process.argv[4] ?? "dashboard-open";
const pointer = process.argv[5] ? resolve(process.argv[5]) : null;
const companion = join(root, "bin/are-companion");
if (process.platform !== "linux" || process.argv.length > 6
  || !["dashboard-open", "orb-only", "dashboard-close"].includes(mode)
  || (mode === "dashboard-close" && !statSync(pointer ?? "", {throwIfNoEntry: false})?.isFile())
  || (mode !== "dashboard-close" && pointer !== null) || !Number.isInteger(seconds)
  || seconds < 5 || seconds > 120 || !statSync(companion, {throwIfNoEntry: false})?.isFile()
  || !process.env.DISPLAY) {
  throw new Error("Usage: DISPLAY=:0 node measure-linux-idle.mjs <extracted-opt/are-companion> [5..120 seconds] [dashboard-open|orb-only|dashboard-close] [X11-pointer-helper-for-dashboard-close]");
}

const pause = (ms) => new Promise(resolveDelay => setTimeout(resolveDelay, ms));
const testRoot = mkdtempSync(join(tmpdir(), "are-companion-idle-"));
let orbIdentity = null;

function processes() {
  const rows = new Map();
  for (const entry of readdirSync("/proc")) {
    if (!/^[0-9]+$/.test(entry)) continue;
    try {
      const stat = readFileSync(`/proc/${entry}/stat`, "utf8");
      const end = stat.lastIndexOf(") ");
      if (end < 0) continue;
      const fields = stat.slice(end + 2).trim().split(/\s+/);
      rows.set(Number(entry), {pid: Number(entry), name: stat.slice(stat.indexOf("(") + 1, end),
        state: fields[0], ppid: Number(fields[1]), cpu_ticks: Number(fields[11]) + Number(fields[12]),
        birth: fields[19]});
    } catch { /* A process may exit during a read. */ }
  }
  return rows;
}

function matching(rows, name) {
  return [...rows.values()].filter(row => row.name === name);
}

async function waitFor(name, excluded = new Set()) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const rows = matching(processes(), name).filter(row => !excluded.has(`${row.pid}:${row.birth}`));
    if (rows.length === 1) return rows[0];
    if (rows.length > 1) throw new Error(`More than one ${name} process appeared`);
    await pause(250);
  }
  throw new Error(`${name} did not appear`);
}

function descendants(rows, rootIdentity) {
  const rootRow = rows.get(rootIdentity.pid);
  if (!rootRow || rootRow.birth !== rootIdentity.birth) return [];
  const owned = new Set([rootRow.pid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows.values()) {
      if (!owned.has(row.pid) && owned.has(row.ppid)) { owned.add(row.pid); changed = true; }
    }
  }
  return [...owned].map(pid => rows.get(pid));
}

function memory(pid) {
  const status = readFileSync(`/proc/${pid}/status`, "utf8");
  const rss = Number(/^VmRSS:\s+(\d+) kB$/m.exec(status)?.[1] ?? 0);
  let pss = null;
  try { pss = Number(/^Pss:\s+(\d+) kB$/m.exec(readFileSync(`/proc/${pid}/smaps_rollup`, "utf8"))?.[1] ?? NaN); }
  catch { /* PSS can be denied; RSS remains diagnostic. */ }
  return {rss_kib: rss, pss_kib: Number.isFinite(pss) ? pss : null};
}

function sample(expectDashboard = mode === "dashboard-open") {
  // A reaped child may briefly remain as a zero-memory zombie in /proc.
  const rows = descendants(processes(), orbIdentity).filter(row => row.state !== "Z");
  if (expectDashboard && !rows.some(row => row.name === "are-companion")) {
    throw new Error("Owned dashboard exited during measurement");
  }
  if (!expectDashboard && rows.length !== 1) {
    throw new Error("Icon-only measurement still has dashboard descendants");
  }
  let rss = 0, pss = 0, pssComplete = true, ticks = 0;
  const byName = {};
  for (const row of rows) {
    try {
      const result = memory(row.pid);
      rss += result.rss_kib;
      if (result.pss_kib === null) pssComplete = false;
      else pss += result.pss_kib;
      ticks += row.cpu_ticks;
      byName[row.name] = (byName[row.name] ?? 0) + 1;
    } catch { pssComplete = false; }
  }
  return {process_count: rows.length, processes_by_name: byName,
    summed_rss_kib: rss, summed_pss_kib: pssComplete ? pss : null, cpu_ticks: ticks};
}

function launch(env) { execFileSync(companion, [], {env, timeout: 10_000, stdio: "ignore"}); }

async function waitForClosed(prior) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const rows = processes();
    if (prior.every(item => {
      const current = rows.get(item.pid);
      return !current || current.birth !== item.birth || current.state === "Z";
    })) return;
    await pause(250);
  }
  throw new Error("Dashboard or WebKit child survived the X11 window-close event");
}

try {
  const existing = processes();
  if (matching(existing, "are-native-orb").length || matching(existing, "are-companion").length) {
    throw new Error("An ARE Companion process already exists in this PID namespace");
  }
  const env = {...process.env, XDG_CONFIG_HOME: join(testRoot, "config"),
    XDG_DATA_HOME: join(testRoot, "data"), XDG_CACHE_HOME: join(testRoot, "cache"),
    GDK_BACKEND: "x11", WEBKIT_DISABLE_COMPOSITING_MODE: "1"};
  delete env.WEBKIT_INSPECTOR_HTTP_SERVER;
  launch(env);
  orbIdentity = await waitFor("are-native-orb");
  let dashboard = null;
  if (mode !== "orb-only") {
    launch(env);
    dashboard = await waitFor("are-companion");
    if (dashboard.ppid !== orbIdentity.pid) throw new Error("Dashboard is not owned by the native orb");
  }
  await pause(3000);
  let beforeClose = null;
  if (mode === "dashboard-close") {
    beforeClose = sample(true);
    const prior = descendants(processes(), orbIdentity).filter(row => row.pid !== orbIdentity.pid);
    execFileSync(pointer, ["--close-dashboard", String(dashboard.pid)], {env, timeout: 10_000, stdio: "ignore"});
    await waitForClosed(prior);
    await pause(1000);
  }
  const startAt = performance.now();
  const first = sample();
  await pause(seconds * 1000);
  const last = sample();
  const elapsedSeconds = (performance.now() - startAt) / 1000;
  const ticksPerSecond = Number(execFileSync("getconf", ["CLK_TCK"], {encoding: "utf8"}).trim());
  if (!Number.isFinite(ticksPerSecond) || ticksPerSecond <= 0 || last.cpu_ticks < first.cpu_ticks) {
    throw new Error("CPU tick accounting unavailable");
  }
  process.stdout.write(`${JSON.stringify({schema_version: "are.companion-linux-idle-resource/v1",
    package_installed: false, display_backend: "WSLg/X11", mode, observed_seconds: elapsedSeconds,
    ...(beforeClose ? {before_close: beforeClose, ordinary_x11_window_close: true} : {}),
    initial: first, final: last,
    aggregate_cpu_percent_one_core: 100 * (last.cpu_ticks - first.cpu_ticks) / ticksPerSecond / elapsedSeconds,
    measured_descendant_scope: mode === "dashboard-open"
      ? "native orb and all live descendants, including dashboard/WebKit"
      : mode === "dashboard-close"
        ? "native orb and all live descendants after owned dashboard X11 window close"
        : "native orb and all live descendants, with dashboard closed",
    authority_effect: "none"}, null, 2)}\n`);
} finally {
  if (orbIdentity) {
    const row = processes().get(orbIdentity.pid);
    if (row?.birth === orbIdentity.birth) {
      try { process.kill(orbIdentity.pid, "SIGTERM"); } catch { /* Already exited. */ }
      await pause(1000);
    }
  }
  rmSync(testRoot, {recursive: true, force: true});
}
