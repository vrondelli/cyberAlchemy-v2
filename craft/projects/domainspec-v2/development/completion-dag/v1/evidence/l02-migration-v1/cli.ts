import { checkedDerive, gitChanges, machineDerive, validateChanged, type Dialect } from './bridge.js';

try {
  const [command, root, selection, range, ...extra] = process.argv.slice(2);
  let result;
  if (command === 'derive' && root && selection && !range && !extra.length) result = checkedDerive(root, selection as Dialect);
  else if (command === 'machine' && root && selection && !range && !extra.length) result = machineDerive(root, selection);
  else if (command === 'changed' && root && selection && range && !extra.length) result = validateChanged(root, selection, gitChanges(root, range));
  else throw Error('Usage: derive FEATURE_DIR DIALECT | machine REPO_ROOT PROFILE | changed REPO_ROOT PROJECT_RELATIVE_PATH GIT_RANGE');
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = ['reject', 'unsupported'].includes(result.status) ? 1 : 0;
} catch (error) {
  console.log(JSON.stringify({status: 'reject', diagnostics: [error instanceof Error ? error.message : String(error)]}));
  process.exitCode = 2;
}
