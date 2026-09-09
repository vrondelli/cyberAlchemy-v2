import {isDeepStrictEqual} from 'node:util';
export function scoreResponse(gold, text) {
  if (typeof text !== 'string') return {passed:false,reason:'response_not_text'};
  let value; try { value=JSON.parse(text); } catch { return {passed:false,reason:'invalid_json'}; }
  const passed=isDeepStrictEqual(value,gold.expected);
  return {passed,reason:passed?'exact_json_match':'answer_mismatch'};
}
