function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = canon(v[k]);
    return o;
  }
  return v;
}
export function scoreResponse(gold, text) {
  if (typeof text !== 'string') return {passed:false,reason:'response_not_text'};
  let value; try { value=JSON.parse(text); } catch { return {passed:false,reason:'invalid_json'}; }
  const equal = JSON.stringify(canon(value)) === JSON.stringify(canon(gold.expected));
  return {passed:equal,reason:equal?'exact_json_match':'answer_mismatch'};
}
