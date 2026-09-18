// Versioned source copies with explicit source ancestry. Open questions: README.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
const here = import.meta.dirname, root = resolve(here, '../../../../../..');
const native = resolve(root, 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1');
const hash = text => createHash('sha256').update(text).digest('hex');
const ancestry = [];
for (const name of ['episode.mjs', 'orchestrate.mjs']) {
  const original = readFileSync(resolve(native, name), 'utf8');
  let changed = original.replace(/from (['"])(\.[^'"]+)\1/g, (match, quote, target) => {
    if (name === 'orchestrate.mjs' && target === './episode.mjs') return "from './episode.mjs'";
    let path = relative(here, resolve(native, target));
    if (!path.startsWith('.')) path = './' + path;
    return `from ${quote}${path}${quote}`;
  });
  if (name === 'episode.mjs') {
    const anchor = 'const prompt=stable({messages,tools:promptTools});';
    if (changed.split(anchor).length !== 2) throw Error('native render anchor drift');
    changed = "import {compactRequest} from './representation.mjs';\n" + changed.replace(anchor,
      "const request=limits.compact_representation===true?compactRequest({messages,tools:promptTools}):{messages,tools:promptTools};const prompt=stable(request);");
  }
  writeFileSync(resolve(here, name), changed);
  ancestry.push({ source: relative(root, resolve(native, name)), source_sha256: hash(original), copy: name, copy_sha256: hash(changed), changes: ['relative imports rebound', ...(name === 'episode.mjs' ? ['optional compactRequest before capture and measurement'] : ['use versioned local episode'])] });
}
writeFileSync(resolve(here, 'runtime-ancestry.json'), JSON.stringify({ ancestry, authority_effect: 'none', open_questions_ref: 'README.md' }, null, 2) + '\n');
