// Read-only diagnosis; never substitutes archived reads for a model selection.
// Open questions: README.md. Outputs contain no gold annotations or source bodies.
import {readFileSync, readdirSync, existsSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {bindDelivery} from './delivery.mjs';
import {selectFinalReads} from './final-selection.mjs';
import {projectObservationsToBase} from './source-map.mjs';
import {sha} from './verify-freeze.mjs';

const [matrixPath, outputRoot, reportPath] = process.argv.slice(2);
if (!reportPath) throw Error('matrix output-root report required');
const matrixBytes = readFileSync(matrixPath), matrix = JSON.parse(matrixBytes), rows = [];
for (const cell of matrix.cells) {
  const root = resolve(outputRoot, cell.cell_id);
  if (!existsSync(resolve(root, 'completed.json'))) {
    rows.push({cell_id: cell.cell_id, status: 'not-completed'});
    continue;
  }
  const bytes = readFileSync(resolve(root, 'result.json')), result = JSON.parse(bytes);
  if (sha(bytes) !== JSON.parse(readFileSync(resolve(root, 'completed.json'))).result_sha256)
    throw Error('provenance.result-integrity');
  if (result.status !== 'final_context_selected') {
    rows.push({cell_id: cell.cell_id, status: result.status, source_result_sha256: sha(bytes), selection: 'absent'});
    continue;
  }
  const selection = selectFinalReads({...result, response_capture: result.response_captures.at(-1)});
  const binding = bindDelivery(result);
  const snapshots = readdirSync(resolve(root, 'snapshots')).filter(x => x.endsWith('.json'))
    .map(x => JSON.parse(readFileSync(resolve(root, 'snapshots', x))));
  const projection = projectObservationsToBase(binding.read_observations, snapshots, resolve(root, 'base'));
  const observations = new Map(binding.read_observations.map(r => [r.id, r]));
  const selected = projection.projections.filter(p => selection.final_read_ids.includes(p.read_id)).map(p => {
    const read = observations.get(p.read_id);
    const earlierBaseReads = binding.read_observations.filter(r => r.path === read.path &&
      r.source_sha256 === p.base_source_sha256 && r.first_confirmed_receipt < read.first_confirmed_receipt);
    return {read_id: read.id, path: read.path, start_line: read.start_line, end_line: read.end_line,
      first_confirmed_receipt: read.first_confirmed_receipt,
      source_sha256: read.source_sha256, base_source_sha256: p.base_source_sha256,
      unmapped_current_lines: p.unmapped_current_lines,
      mapped_fragments: p.fragments,
      earlier_delivered_same_file_base_reads: earlierBaseReads.map(r => ({read_id: r.id,
        start_line: r.start_line, end_line: r.end_line, first_confirmed_receipt: r.first_confirmed_receipt,
        also_selected: selection.final_read_ids.includes(r.id)}))};
  });
  rows.push({cell_id: cell.cell_id, status: result.status, export_error: result.export_error,
    source_result_sha256: sha(bytes), response_capture_sha256: selection.response_capture_sha256,
    selected_read_count: selected.length,
    selected_reads_with_unmapped_lines: selected.filter(r => r.unmapped_current_lines.length).length,
    selected});
}
writeFileSync(reportPath, JSON.stringify({schema_version: 'are.contextbench-provenance-analysis/v1',
  matrix_sha256: sha(matrixBytes), rows,
  claim_ceiling: 'Descriptive source-version diagnosis only. Earlier same-file base reads do not establish equivalent content, retained state, correct selection or native-score credit. No selections or scores are repaired post hoc.',
  benchmark_cleared: false, authority_effect: 'none', open_questions_ref: 'README.md#open-questions'}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(rows.map(({cell_id, status, selected_reads_with_unmapped_lines}) =>
  ({cell_id, status, selected_reads_with_unmapped_lines}))));
