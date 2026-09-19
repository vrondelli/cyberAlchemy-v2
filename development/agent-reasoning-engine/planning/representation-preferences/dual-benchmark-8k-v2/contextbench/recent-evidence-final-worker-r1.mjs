// Tokenizer-only supervised H-L final qualification child.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {runRecentEvidenceFinalStage} from './recent-evidence-final-stage-r1.mjs';

const controller = new AbortController();
process.on('SIGTERM', () => controller.abort());
process.on('SIGINT', () => controller.abort());
let input = '';
for await (const chunk of process.stdin) {
  input += chunk;
  if (Buffer.byteLength(input) > 1024 * 1024) process.exit(2);
}
let terminal = null;
let error = null;
try {
  const {config} = JSON.parse(input);
  terminal = await runRecentEvidenceFinalStage({...config, signal: controller.signal});
  if (!terminal.qualified) error = 'qualification-incomplete';
} catch (caught) {
  terminal = caught.result ?? null;
  error = String(caught.message);
}
const output = JSON.stringify({terminal, error});
if (Buffer.byteLength(output) > 8 * 1024 * 1024) process.exit(3);
process.stdout.write(output, () => process.exit(error ? 2 : 0));
