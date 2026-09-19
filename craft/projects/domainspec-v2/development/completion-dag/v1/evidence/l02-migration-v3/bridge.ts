import { lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { selectChanges, validateChanged as previousValidate, type Change } from '../l02-migration-v1/bridge.js';
export { checkedDerive, gitChanges, machineDerive } from '../l02-migration-v2/bridge.js';

function noAliases(root: string, path: string) {
  if (!path || isAbsolute(path) || path.includes('\\') || path.split('/').some(p => !p || p === '.' || p === '..')) throw Error(`invalid repository-relative path: ${path}`);
  let current = root;
  for (const part of path.split('/')) {
    current = join(current, part);
    if (lstatSync(current).isSymbolicLink()) throw Error(`unsupported symlink in validation path: ${path}`);
  }
}
function supportedSelection(root: string, projectPath: string, changes: readonly Change[]) {
  if (realpathSync(root) !== resolve(root)) throw Error('unsupported symlink in repository root; use its canonical path');
  noAliases(root, `${projectPath}/spec/features`);
  const selection = selectChanges(root, `${projectPath}/spec/features`, changes);
  for (const file of selection.files) noAliases(root, file);
}
export function validateChanged(root: string, projectPath: string, changes: readonly Change[]) {
  supportedSelection(root, projectPath, changes);
  const result = previousValidate(root, projectPath, changes);
  supportedSelection(root, projectPath, changes);
  return result;
}
