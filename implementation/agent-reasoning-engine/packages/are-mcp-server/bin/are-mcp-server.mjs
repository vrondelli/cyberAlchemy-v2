#!/usr/bin/env node
import {resolve} from "node:path";

import {runAreMcpStdio} from "../index.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const evolutionRoot = argument("--evolution-root") ?? process.env.ARE_EVOLUTION_ROOT ?? null;
const repositoryRoot = argument("--repository-root") ?? process.env.ARE_REPOSITORY_ROOT ?? null;
const developmentLive = process.argv.includes("--development-live");
const known = new Set(["--evolution-root", "--repository-root"]);
const invalid = process.argv.slice(2).some((value, index, values) => value === "--development-live" ? false : value.startsWith("--") ? !known.has(value) || !values[index + 1] || values[index + 1].startsWith("--") : known.has(values[index - 1]) ? false : true);

if (!evolutionRoot || invalid) {
  process.stderr.write("Usage: are-mcp-server --evolution-root <path> [--repository-root <path>] [--development-live]\n");
  process.exit(2);
}

await runAreMcpStdio({
  evolutionRoot: resolve(evolutionRoot),
  repositoryRoot: repositoryRoot ? resolve(repositoryRoot) : undefined,
  developmentLive,
});
