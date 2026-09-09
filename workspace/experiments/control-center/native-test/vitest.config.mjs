import base from '../../../runtime/vitest.config.ts';
import {readCandidate, validate} from '../candidates/cc-003/validate.mjs';

const result = validate();
if (!result.selected_runtime_prerequisites_pass) throw new Error(JSON.stringify(result));
const selected = readCandidate().legacy_binding;
export default {
  ...base,
  plugins: [...base.plugins, {
    name: 'explicit-cc003-manifest-test-selection',
    enforce: 'pre',
    resolveId(source, importer) {
      if (importer?.endsWith('/src/domain/implementation-manifest.test.ts') && source === '../../IMPLEMENTATION-MANIFEST.candidate.json') return '\0cc003-selected-manifest';
    },
    load(id) { if (id === '\0cc003-selected-manifest') return `export default ${JSON.stringify(selected)};`; },
  }],
};
