import {need} from './transport.mjs';
const str = {type: 'string'};
const arr = {type: 'array', items: str};
const object = (properties, required = []) => ({type: 'object', properties, required, additionalProperties: false});
export const SCHEMAS = {
  'list-files': object({prefix: str}),
  'read-file': object({path: str}, ['path']),
  'search-text': object({query: {...str, minLength: 1}, paths: arr}, ['query']),
  'repository-map': object({}),
  'run-command': object({command: {...arr, minItems: 1}}, ['command']),
  'read-context-evidence': object({digest: {...str, pattern: '^[a-f0-9]{64}$'}, offset: {type: 'integer', minimum: 0}, max_chars: {type: 'integer', minimum: 1, maximum: 1024}}, ['digest']),
  'read-inspection-evidence': object({call_id: {...str, minLength: 1}, offset: {type: 'integer', minimum: 0}, max_chars: {type: 'integer', minimum: 1, maximum: 1024}}, ['call_id'])
};
const pageSchema=object({path:str,offset:{type:'integer',minimum:0}},['path']);
export function toolDefinitions(names,paged=false) {
  return names.map(name => {
    need(Object.hasOwn(SCHEMAS, name), 'tool-schema-unavailable');
    const description = name === 'read-inspection-evidence'
      ? 'Recover archived source text using the original successful read-file call_id from inspection progress. Page with offset and max_chars (UTF-16 characters, at most 1024); next_offset identifies the next page. No new file read occurs.'
      : `ARE ${name}. Arguments and scope are validated locally.`;
    return {type: 'function', function: {name, description, parameters: paged&&name==='read-file'?pageSchema:SCHEMAS[name]}};
  });
}
function matches(value, schema) {
  if (schema.type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value)
    && schema.required.every(key => Object.hasOwn(value, key))
    && Object.keys(value).every(key => Object.hasOwn(schema.properties, key) && matches(value[key], schema.properties[key]));
  if (schema.type === 'array') return Array.isArray(value) && value.length >= (schema.minItems ?? 0) && value.every(v => matches(v, schema.items));
  if (schema.type === 'integer') return Number.isSafeInteger(value) && value >= (schema.minimum ?? 0) && value <= (schema.maximum ?? Number.MAX_SAFE_INTEGER);
  return typeof value === 'string' && !value.includes('\0') && value.length >= (schema.minLength ?? 0) && (!schema.pattern || new RegExp(schema.pattern).test(value));
}
// Validate the entire batch before executing any call. IDs remain opaque.
export function validateCalls(calls, allowed, seen, verification_command,paged=false) {
  need(Array.isArray(calls) && calls.length > 0 && calls.length <= 8, 'tool-calls-invalid');
  const ids = new Set(seen);
  return calls.map(call => {
    need(call?.type === 'function' && typeof call.id === 'string' && call.id.length > 0 && call.id.length <= 256 && !ids.has(call.id), 'duplicate-or-invalid-tool-id');
    ids.add(call.id);
    const name = call.function?.name;
    need(allowed.includes(name) && Object.hasOwn(SCHEMAS, name), 'tool-denied');
    let args; try { args = typeof call.function.arguments === 'string' ? JSON.parse(call.function.arguments) : call.function.arguments; } catch { need(false, 'tool-arguments-invalid'); }
    need(matches(args, paged&&name==='read-file'?pageSchema:SCHEMAS[name]), 'tool-arguments-invalid');
    if (name === 'run-command') need(JSON.stringify(args.command) === JSON.stringify(verification_command), 'command-not-exact');
    return {id: call.id, name, arguments: args};
  });
}
