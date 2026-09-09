import {spawn} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {mkdirSync, openSync, closeSync, fsyncSync, writeFileSync, renameSync, readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const stable = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
export const digest = value => createHash('sha256').update(stable(value)).digest('hex');
export const clone = value => JSON.parse(stable(value));
export const need = (ok, reason) => {if (!ok) throw Error(`recovery.${reason}`);};
export function durable(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  const fd = openSync(temporary, 'wx', 0o600);
  try {writeFileSync(fd, stable(value)); fsyncSync(fd);} finally {closeSync(fd);}
  renameSync(temporary, path);
  const parent = openSync(resolve(path, '..'), 'r');
  try {fsyncSync(parent);} finally {closeSync(parent);}
}
/** Linux prototype store. flock is kernel-owned and survives no abandoned writer lock.
 * The directory is an explicitly supplied private local store, not an untrusted path. */
export async function openStore(directory) {
  need(process.platform === 'linux', 'linux-store-required');
  need(typeof directory === 'string' && directory.length > 0, 'directory-required');
  mkdirSync(directory, {recursive:true, mode:0o700});
  const child = spawn('flock', ['-n', resolve(directory, 'writer.lock'), process.execPath,
    fileURLToPath(new URL('./lock-holder.mjs', import.meta.url))], {stdio:['pipe','pipe','pipe']});
  const exited = new Promise((resolve, reject) => {child.once('exit', resolve); child.once('error', reject);});
  let text = '';
  const ready = new Promise(resolve => child.stdout.on('data', data => {text += data; if (text.includes('locked\n')) resolve(true);}));
  need(await Promise.race([ready, exited.then(() => false)]), 'writer-busy');
  const path = resolve(directory, 'checkpoint.json');
  return {
    load() {
      if (!existsSync(path)) return null;
      const {checksum, value} = JSON.parse(readFileSync(path, 'utf8'));
      need(checksum === digest(value), 'checkpoint-integrity');
      return value;
    },
    save(value) {durable(path, {checksum:digest(value), value});},
    async close() {child.stdin.end(); await exited;}
  };
}
