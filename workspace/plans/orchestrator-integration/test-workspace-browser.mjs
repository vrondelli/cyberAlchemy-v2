// Open questions and acceptance limits: T7-ACCEPTANCE.md.
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSchedulerFixture} from './scheduler-fixture.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const staticRoot = resolve(process.argv[2] ?? resolve(here, '../../runtime/dist-dashboard'));
const output = resolve(process.argv[3] ?? resolve(here, 't7a-evidence/browser'));
mkdirSync(dirname(output), {recursive: true});
const fixture = await createSchedulerFixture(staticRoot);
try {
  await new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [resolve(here, '../../runtime/scripts/browser-acceptance.mjs')], {
      stdio: 'inherit',
      env: {...process.env, WORKSPACE_BASE_URL: fixture.app.origin, WORKSPACE_BROWSER_OUTPUT: output, WORKSPACE_EXPECT_ONTOLOGY_UNAVAILABLE: '1'},
    });
    const timeout = setTimeout(() => child.kill('SIGTERM'), 180_000);
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', (code, signal) => {
      clearTimeout(timeout);
      if (code === 0) resolveRun();
      else reject(new Error(`Workspace browser acceptance failed: ${signal ?? code}`));
    });
  });
  if (fixture.calls.length) throw new Error('Unexpected scheduler mutation during Workspace navigation');
} finally {
  await fixture.close();
}
