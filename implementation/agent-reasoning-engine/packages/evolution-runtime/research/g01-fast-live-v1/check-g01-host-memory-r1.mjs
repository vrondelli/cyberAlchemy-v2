// Read-only host-memory gate for prospective G01 campaigns. It cannot replace
// a successful actual-layout source-index rehearsal under live service load.
import {spawnSync} from "node:child_process";

const GIB = 1024 ** 3;
export const MIN_AVAILABLE_BYTES = 4 * GIB;

export function parseMeminfo(source) {
  const values = new Map();
  for (const line of source.split("\n")) {
    const match = /^([A-Za-z_()]+):\s+(\d+) kB$/.exec(line.trim());
    if (match) values.set(match[1], Number(match[2]) * 1024);
  }
  const required = ["MemTotal", "MemAvailable", "Shmem", "SwapTotal", "SwapFree"];
  if (required.some(key => !Number.isSafeInteger(values.get(key)))) {
    throw Error("g01-host-memory.meminfo-incomplete");
  }
  return Object.fromEntries(required.map(key => [key, values.get(key)]));
}

export function assessHostMemory(meminfo, minimumAvailable = MIN_AVAILABLE_BYTES) {
  if (!Number.isSafeInteger(minimumAvailable) || minimumAvailable <= 0) {
    throw Error("g01-host-memory.invalid-floor");
  }
  const memory = typeof meminfo === "string" ? parseMeminfo(meminfo) : meminfo;
  if (!memory || !["MemTotal", "MemAvailable", "Shmem", "SwapTotal", "SwapFree"]
    .every(key => Number.isSafeInteger(memory[key]) && memory[key] >= 0) ||
    memory.MemAvailable > memory.MemTotal || memory.SwapFree > memory.SwapTotal) {
    throw Error("g01-host-memory.invalid-values");
  }
  return {
    status: memory.MemAvailable >= minimumAvailable ? "provisional-pass" : "fail-low-memory",
    mem_total_bytes: memory.MemTotal,
    mem_available_bytes: memory.MemAvailable,
    shmem_bytes: memory.Shmem,
    swap_total_bytes: memory.SwapTotal,
    swap_free_bytes: memory.SwapFree,
    minimum_available_bytes: minimumAvailable,
    shortfall_bytes: Math.max(0, minimumAvailable - memory.MemAvailable),
    next_gate: "Run a no-model index rehearsal on the exact future overlay layout under current service load; this byte floor alone does not establish campaign readiness",
    model_calls: 0,
    authority_effect: "none"
  };
}

if (process.argv[1] === import.meta.filename) {
  if (process.argv.length !== 3 || process.argv[2] !== "--check-vps") {
    throw Error("g01-host-memory.arguments");
  }
  const child = spawnSync("ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10",
    "root@187.77.163.194", "cat /proc/meminfo"], {encoding: "utf8", maxBuffer: 100_000,
    timeout: 20_000});
  if (child.error || child.status !== 0) {
    throw Error(`g01-host-memory.ssh:${child.error?.code ?? child.stderr?.slice(-200)}`);
  }
  console.log(JSON.stringify(assessHostMemory(child.stdout)));
}
