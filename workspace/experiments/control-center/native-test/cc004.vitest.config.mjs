import base from '../../../runtime/vitest.config.ts';
import {readCandidate, validate} from '../candidates/cc-004/validate.mjs';

const result = validate();
if (!result.selected_runtime_prerequisites_pass) throw new Error(JSON.stringify(result));
const selected = readCandidate().legacy_binding;
export default {
  ...base,
  plugins: [...base.plugins, {
    name: 'explicit-cc004-manifest-test-selection',
    enforce: 'pre',
    resolveId(source, importer) {
      if (importer?.endsWith('/src/domain/implementation-manifest.test.ts') && source === '../../IMPLEMENTATION-MANIFEST.candidate.json') return '\0cc004-selected-manifest';
    },
    load(id) { if (id === '\0cc004-selected-manifest') return `export default ${JSON.stringify(selected)};`; },
  }],
};
