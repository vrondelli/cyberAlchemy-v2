// Tokenizer-only supervised child for populated H-L request qualification.
import {runRecentPopulatedStage} from './recent-evidence-populated-stage-r1.mjs';
const controller = new AbortController();
process.on('SIGTERM', () => controller.abort());
process.on('SIGINT', () => controller.abort());
let input = '';
for await (const chunk of process.stdin) {
  input += chunk;
  if (Buffer.byteLength(input) > 1024 * 1024) process.exit(2);
}
let terminal = null, error = null;
try {
  const {config} = JSON.parse(input);
  terminal = await runRecentPopulatedStage({...config, signal: controller.signal});
  if (!terminal.qualified) error = 'qualification-incomplete';
} catch (failure) {
  terminal = failure.result ?? null;
  error = String(failure.message);
}
const output = JSON.stringify({terminal, error});
if (Buffer.byteLength(output) > 12 * 1024 * 1024) process.exit(3);
process.stdout.write(output, () => process.exit(error ? 2 : 0));
