// Read-only receipt census. Never traverses fixtures, references or provider payloads.
// Open Questions: evidence/G01-JACOCO-PROJECT-CAPACITY-R5-INTERRUPTION.json.
import {readFileSync, readdirSync, lstatSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function record(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error('census.not-regular-file');
  const bytes = readFileSync(path);
  return {bytes: bytes.length, sha256: digest(bytes)};
}
export function census(root) {
  const freezePath = join(root, 'FREEZE.json');
  const freeze = JSON.parse(readFileSync(freezePath));
  const ids = freeze.cases.map(c => c.case_id);
  if (new Set(ids).size !== ids.length || ids.some(id => !/^[A-Za-z0-9_-]+$/.test(id))) throw Error('census.case-identities');
  const cases = ids.map(case_id => {
    const directory = join(root, case_id);
    if (!existsSync(directory)) return {case_id, disposition: 'not-started', files: {}};
    if (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink()) throw Error('census.case-directory');
    const files = {};
    // Deliberately excludes fixture directories and arbitrary payload files.
    for (const name of readdirSync(directory).sort()) {
      if (!/^(?:RESULT|STARTED|BOUND-CLASSINFO|CLASSES-BEFORE|CLASSES-AFTER|INSTRUMENTATION|[A-Z-]+-RECEIPT)\.json$/.test(name)
          && !/^coverage\.(?:exec|xml)$/.test(name)) continue;
      files[name] = record(join(directory, name));
    }
    let disposition = 'started-without-terminal-result', reported_status = null;
    if (files['RESULT.json']) {
      try {
        const result = JSON.parse(readFileSync(join(directory, 'RESULT.json')));
        reported_status = result.status;
        disposition = result.case_id === case_id && result.freeze_sha256 === record(freezePath).sha256
          && ['terminal-jacoco-execution-complete', 'terminal-jacoco-case-failed'].includes(result.status)
          ? 'parseable-bound-terminal-receipt-not-execution-audit' : 'invalid-terminal-receipt';
      } catch { disposition = 'invalid-terminal-receipt'; }
    }
    return {case_id, disposition, reported_status, files};
  });
  let status_snapshot = null;
  if (existsSync(join(root, 'STATUS.json'))) status_snapshot = {file: record(join(root, 'STATUS.json')), value: JSON.parse(readFileSync(join(root, 'STATUS.json')))};
  const last = status_snapshot?.value?.last;
  const actual = cases.find(c => c.case_id === last?.case_id)?.files?.['RESULT.json'];
  return {root, freeze: record(freezePath), expected: ids.length, cases, status_snapshot,
    status_last_result_hash_matches_current_bytes: last ? last.result_sha256 === actual?.sha256 : null,
    campaign_terminal_present: existsSync(join(root, 'CAMPAIGN-TERMINAL.json')),
    claim_ceiling: 'Receipt census only. No execution audit, reconstructed result, retry, quality or superiority claim.',
    open_questions_owner: 'G01-JACOCO-PROJECT-CAPACITY-R5-INTERRUPTION.json'};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw Error('census.exact-root-required');
  console.log(JSON.stringify(census(resolve(process.argv[2])), null, 2));
}
