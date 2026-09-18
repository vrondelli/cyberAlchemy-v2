import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, relative, resolve} from 'node:path';

const project = resolve(import.meta.dirname, '..');
const forbiddenPath = /(?:coding-agent-runtime|evolution-runtime|read-only-tools|sandbox|verifier|agent\.mjs)/;

function dependencies(start) {
  const seen = new Set(), builtins = [];
  const visit = input => {
    const file = resolve(input);
    if (seen.has(file) || !existsSync(file)) return;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]/g)) {
      const specifier = match[1];
      if (specifier.startsWith('node:')) {builtins.push({file, specifier}); continue;}
      if (!specifier.startsWith('.')) continue;
      let target = resolve(dirname(file), specifier);
      if (!existsSync(target) && existsSync(`${target}.mjs`)) target += '.mjs';
      visit(target);
    }
  };
  visit(resolve(project, start));
  return {files: [...seen], builtins};
}

test('public chat production closure contains no process, executor, secret-provider, or agent implementation', () => {
  const closure = dependencies('server/chat-server.mjs');
  const violations = [
    ...closure.builtins.filter(item => item.specifier === 'node:child_process').map(item => `${relative(project, item.file)} -> ${item.specifier}`),
    ...closure.files.filter(file => forbiddenPath.test(file)).map(file => relative(project, file)),
  ];
  assert.deepEqual(violations, []);
  const filesystemImports = closure.builtins.filter(item => item.specifier === 'node:fs' || item.specifier === 'node:fs/promises')
    .map(item => relative(project, item.file)).sort();
  assert.deepEqual(filesystemImports, [
    '../../../implementation/agent-reasoning-engine/packages/request-decision-router/src/profile-loader.mjs',
    'server/chat-server.mjs',
  ]);
  assert.ok(closure.files.some(file => file.endsWith('/server/broker-client.mjs')));
  assert.ok(!closure.files.some(file => file.endsWith('/server/glm.mjs') || file.endsWith('/server/broker-server.mjs')));
});
