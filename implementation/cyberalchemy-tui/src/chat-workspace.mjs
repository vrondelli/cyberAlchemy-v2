import {accessSync, chmodSync, constants, existsSync, mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {delimiter, isAbsolute, join, relative, resolve} from "node:path";

function isInside(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}

export function discoverCodingConfig(repositoryRoot, explicitPath) {
  if (explicitPath) return resolve(explicitPath);
  if (!repositoryRoot) return null;
  const candidate = resolve(repositoryRoot, ".cyberalchemy", "coding-agent.json");
  return existsSync(candidate) ? candidate : null;
}

export function discoverExecutable(name, options = {}) {
  const explicit = options.explicitPath ?? null;
  const environment = options.environment ?? process.env;
  const candidates = explicit
    ? [resolve(explicit)]
    : String(environment.PATH ?? "").split(delimiter).filter(Boolean).map((entry) => resolve(entry, name));
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {}
  }
  return null;
}

export function createChatWorkspace(options = {}) {
  if (!options.repositoryRoot) throw new Error("cyberalchemy-chat.repository-root-required");
  const repositoryRoot = resolve(options.repositoryRoot);
  const baseDirectory = resolve(options.baseDirectory ?? tmpdir());
  if (isInside(repositoryRoot, baseDirectory)) throw new Error("cyberalchemy-chat.workspace-inside-repository");
  const workspaceRoot = mkdtempSync(join(baseDirectory, "cyberalchemy-chat-"));
  chmodSync(workspaceRoot, 0o700);
  return Object.freeze({
    workspaceRoot,
    sessionPath: resolve(workspaceRoot, "session.jsonl"),
    proposalDirectory: workspaceRoot,
  });
}
