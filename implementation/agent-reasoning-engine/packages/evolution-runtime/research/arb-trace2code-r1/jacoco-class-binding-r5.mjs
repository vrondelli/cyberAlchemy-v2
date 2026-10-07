// Candidate only. Open Questions: evidence/G01-JACOCO-CLASS-IDENTITY-R5.json.
// Independent 32-bit-pair realization of pinned JaCoCo CRC64.classId semantics.
// Primary: https://raw.githubusercontent.com/jacoco/jacoco/v0.8.12/org.jacoco.core/src/org/jacoco/core/internal/data/CRC64.java
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {classInventory as rawInventory} from './jacoco-class-binding-r3b.mjs';

const lowTable = new Uint32Array(256), highTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let low = i, high = 0;
  for (let n = 0; n < 8; n++) {
    const bit = low & 1;
    low = ((low >>> 1) | (high << 31)) >>> 0;
    high = ((high >>> 1) ^ (bit ? 0xd8000000 : 0)) >>> 0;
  }
  lowTable[i] = low; highTable[i] = high;
}

export function classId(bytes) {
  if (bytes.length < 10 || bytes.readUInt32BE(0) !== 0xcafebabe) throw Error('jacoco-r5.class-header');
  let low = 0, high = 0;
  const java9 = bytes[6] === 0 && bytes[7] === 53;
  for (let i = 0; i < bytes.length; i++) {
    const value = java9 && i === 7 ? 52 : bytes[i];
    const ix = (low ^ value) & 255;
    low = (((low >>> 8) | (high << 24)) ^ lowTable[ix]) >>> 0;
    high = ((high >>> 8) ^ highTable[ix]) >>> 0;
  }
  return high.toString(16).padStart(8, '0') + low.toString(16).padStart(8, '0');
}

export function classInventory(root) {
  return rawInventory(root).map(row => {
    const bytes = readFileSync(join(root, row.path));
    if (createHash('sha256').update(bytes).digest('hex') !== row.sha256) throw Error('jacoco-r5.inventory-byte-drift');
    return {...row, class_id: classId(bytes)};
  });
}

export function bindClassInfo(text, inventory, instrumentation) {
  const seen = new Set(), rows = [];
  for (const line of text.split('\n')) {
    if (!line.trim() || line.includes('INST   BRAN') || line.startsWith('[INFO]')) continue;
    const m = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+class 0x([a-f0-9]{16}) ([A-Za-z0-9_$/-]+)$/.exec(line);
    if (!m) throw Error('jacoco-r5.classinfo-shape');
    const file = inventory.find(r => r.path === m[7] + '.class');
    if (!file || seen.has(m[7]) || file.class_id !== m[6]) throw Error('jacoco-r5.classinfo-id-or-membership');
    seen.add(m[7]);
    rows.push({...file, name: m[7], analyzed: true, executable_lines: Number(m[3]), line_coverage_available: true});
  }
  for (const file of inventory) {
    const name = file.path.slice(0, -6);
    if (seen.has(name)) continue;
    // Tool-declared omission is explicit. A generated class may have methods;
    // no line count, non-execution, irrelevance or source-positive claim follows.
    if (!(file.access_flags & 0x1000)) throw Error('jacoco-r5.non-synthetic-analysis-omission');
    seen.add(name);
    rows.push({...file, name, analyzed: false, executable_lines: null, line_coverage_available: false,
      analysis_omission: 'Pinned JaCoCo0.8.12 Analyzer skips ACC_SYNTHETIC. Full compiled SHA256 and computed class ID retained for exact execution binding; generated source-line coverage unavailable, not zero.'});
  }
  for (const name of instrumentation.classes) {
    const row = rows.find(r => r.name === name.replaceAll('.', '/'));
    if (!row || !row.analyzed) throw Error('jacoco-r5.declared-production-type-not-analyzed');
  }
  for (const row of rows) {
    const name = row.name.replaceAll('/', '.');
    if (!instrumentation.classes.some(n => name === n || name.startsWith(n + '$')) && !name.endsWith('.package-info') && name !== 'package-info' && name !== 'module-info') throw Error('jacoco-r5.unmapped-production-class');
  }
  return rows;
}
