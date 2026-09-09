import {isDeepStrictEqual} from 'node:util';
export function scoreResponse(gold, text) {
  if (typeof text !== 'string') return {passed:false,reason:'response_not_text'};
  let value; try { value=JSON.parse(text); } catch { return {passed:false,reason:'invalid_json'}; }
  const ok = isDeepStrictEqual(normalize(value), normalize(gold.expected));
  return {passed:ok,reason:ok?'exact_json_match':'answer_mismatch'};
}
function normalize(v) {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = normalize(v[k]);
    return o;
  }
  return v;
}
