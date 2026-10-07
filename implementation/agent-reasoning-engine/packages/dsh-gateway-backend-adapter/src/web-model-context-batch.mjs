import {createHash} from "node:crypto";
import {verifyReasoningPlanContext} from "../../reasoning-state-runtime/plan-context.mjs";
import {verifyRequirementSnapshot} from "../../request-intent-runtime/index.mjs";

const SCHEMA = "are.dsh-web-model-context-batch/v2";
const ENCODING = "shared-plan-requirements-and-source-items/ordered-replacements-v1";
const wireDigest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const copy = value => JSON.parse(JSON.stringify(value));
const exact = (value, keys) => isObject(value)
  && Object.keys(value).sort().join(",") === [...keys].sort().join(",");
const fail = () => {throw new Error("dsh-web.model-context-batch-invalid");};
const LEGACY_SINGLE_RULES = 'Req [id] resolves in shared_plan.feature_obligations; restore objective.plan_context=shared_plan. {are_shared_value:i}=shared_values[i] verbatim (nonrecursive); {are_string_parts:[...]} joins resolved parts without separators. No completion/authority.';
const SINGLE_RULES = 'Req[id]:shared_plan.feature_obligations summary; objective.plan_context=shared_plan; are_shared_value i:literal shared_values[i]. No authority/completion.';
const BATCH_RULES = 'Rows separate; no authority/completion. "@N":shared_values[N], backward recursive refs; "~BASE64URL":32-byte SHA256 hex. {literal:v}:v; {object:[keys,values]}:ordered fields; {delta:[base,[i,v,...]]}:replace field i; {parts:[...]}:join; {json:v}:JSON.stringify(v). Apply replacements; sources:selected_items; req [id]:shared_plan summaries; objective.plan_context=shared_plan.';
const LEGACY_BATCH_RULES = BATCH_RULES.replace('; "~BASE64URL":32-byte SHA256 hex', '');
const isBatchReference = value => typeof value === 'string' && /^@[0-9]+$/.test(value);
const isDigestNotation = value => typeof value === 'string' && /^~[A-Za-z0-9_-]{43}$/.test(value);
const DIGEST_FIELDS = new Set(['item_digest', 'source_digest', 'parent_plan_digest', 'plan_context_digest',
  'previous_plan_context_digest', 'context_envelope_digest', 'model_context_digest', 'state_digest',
  'resolution_digest', 'snapshot_digest', 'objective_state_digest', 'objective_binding_digest', 'requirement_continuity_digest']);
const stringParts = value => {
  if (typeof value !== 'string' || value.length < 512 || !value.includes('\n')) return null;
  const parts = value.match(/[^\n]*\n|[^\n]+$/g);
  return parts.length > 1 ? parts : null;
};
function jsonStringBody(value) {
  if (typeof value !== 'string' || value.length < 512 || !['{', '['].includes(value[0])) return null;
  try {
    const body = JSON.parse(value);
    return JSON.stringify(body) === value ? body : null;
  } catch {return null;}
}
export function validModelContextSizeDiagnostic(value) {
  return exact(value, ['kind', 'expanded_bytes', 'compact_bytes', 'limit_bytes'])
    && value.kind === 'model-context-over-budget' && value.limit_bytes === 32768
    && ['expanded_bytes', 'compact_bytes'].every(key => Number.isSafeInteger(value[key]) && value[key] > 0 && value[key] <= 512 * 1024);
}

function shareSourceValues(items, {segments = false, recursiveTable = false} = {}) {
  const counts = new Map();
  const strings = new Set();
  const shapes = new Map(), bases = new Map(), building = new Set();
  let visited = 0, encodedNodes = 0;
  const visit = (value, depth = 0) => {
    if (depth > 32 || ++visited > 8192) fail();
    const key = JSON.stringify(value);
    if (key.length >= (recursiveTable ? 12 : 32)) counts.set(key, (counts.get(key) ?? 0) + 1);
    if (recursiveTable && typeof value === 'string' && value.length >= 24) strings.add(value);
    const parts = segments ? stringParts(value) : null;
    if (parts) parts.forEach(part => visit(part, depth + 1));
    const body = segments ? jsonStringBody(value) : null;
    if (body !== null) visit(body, depth + 1);
    if (Array.isArray(value)) value.forEach(item => visit(item, depth + 1));
    else if (isObject(value)) {
      if (recursiveTable && Object.keys(value).length >= 4) {
        const shape = JSON.stringify(Object.keys(value));
        if (!shapes.has(shape)) shapes.set(shape, []);
        shapes.get(shape).push(value);
      }
      if (recursiveTable && Object.keys(value).length >= 2) visit(Object.keys(value), depth + 1);
      Object.values(value).forEach(item => visit(item, depth + 1));
    }
  };
  items.forEach(value => visit(value));
  const fragments = new Set();
  // Include path/identifier atoms embedded in prose, such as both copies of a
  // Markdown link. Text remains verbatim; this is not tokenization for a model.
  for (const text of [...strings]) {
    for (const match of text.matchAll(/[A-Za-z0-9_-]+(?:[./:#][A-Za-z0-9_-]+)+/g)) {
      if (match[0].length >= 24 && fragments.size < 256) fragments.add(match[0]);
    }
  }
  for (const reverse of [false, true]) {
    const ordered = [...strings].map(value => reverse ? [...value].reverse().join('') : value).sort();
    for (let i = 1; i < ordered.length && fragments.size < 256; i++) {
      let end = 0;
      while (end < ordered[i].length && end < ordered[i - 1].length && ordered[i][end] === ordered[i - 1][end]) end++;
      if (end >= 24) {
        const text = ordered[i].slice(0, end);
        fragments.add(reverse ? [...text].reverse().join('') : text);
      }
    }
  }
  const orderedFragments = [...fragments].sort((a, b) => b.length - a.length);
  for (const fragment of orderedFragments) {
    const count = [...strings].reduce((sum, text) => sum + (text.includes(fragment) ? counts.get(JSON.stringify(text)) ?? 1 : 0), 0);
    counts.set(JSON.stringify(fragment), Math.max(count, counts.get(JSON.stringify(fragment)) ?? 0));
  }
  const table = [], ids = new Map();
  const encodeValue = (value, depth = 0, allowFragments = true, digestField = false, metadata = true) => {
    if (depth > 32 || ++encodedNodes > 8192) fail();
    const key = JSON.stringify(value);
    const count = counts.get(key) ?? 0;
    const literal = ['are_shared_value', 'are_string_parts', 'are_json_string', 'are_literal_value', 'are_object', 'ref', 'literal', 'object', 'parts', 'json', 'delta']
      .some(tag => exact(value, [tag]));
    if (literal || recursiveTable && (isBatchReference(value) || isDigestNotation(value))) {
      if (recursiveTable) return {literal: copy(value)};
      if (!ids.has(key)) {ids.set(key, table.length); table.push(copy(value));}
      return {are_shared_value: ids.get(key)};
    }
    if (!recursiveTable && depth > 0 && (count - 1) * key.length > count * 26 + 1) {
      if (!ids.has(key)) {ids.set(key, table.length); table.push(copy(value));}
      return {are_shared_value: ids.get(key)};
    }
    if (recursiveTable && ids.has(key)) return `@${ids.get(key)}`;
    const body = segments ? jsonStringBody(value) : null;
    const parts = segments ? stringParts(value) : null;
    let encoded;
    if (body !== null) encoded = {[recursiveTable ? 'json' : 'are_json_string']: encodeValue(body, depth + 1, true, false, false)};
    else if (parts && parts.some(part => {
      const count = counts.get(JSON.stringify(part)) ?? 0;
      return (count - 1) * JSON.stringify(part).length > count * 26 + 1;
    })) encoded = {[recursiveTable ? 'parts' : 'are_string_parts']: parts.map(part => encodeValue(part, depth + 1, true, false, metadata))};
    else if (Array.isArray(value)) encoded = value.map(item => encodeValue(item, depth + 1, true, false, metadata));
    else if (isObject(value)) {
      const fields = Object.entries(value).map(([key, item]) => [key, encodeValue(item, depth + 1, true,
        metadata && (DIGEST_FIELDS.has(key) || digestField && key === 'replace'), metadata && key !== 'content')]);
      encoded = Object.fromEntries(fields);
      if (recursiveTable && fields.length >= 2) {
        const keys = encodeValue(fields.map(([key]) => key), depth + 1);
        const positional = {object: [keys, fields.map(([, item]) => item)]};
        if (JSON.stringify(positional).length < JSON.stringify(encoded).length) encoded = positional;
      }
      const shape = JSON.stringify(Object.keys(value)), members = shapes.get(shape);
      if (recursiveTable && members?.length >= 3 && !building.has(shape)) {
        if (!bases.has(shape)) {
          const prototype = Object.fromEntries(Object.keys(value).map(key => {
            const variants = new Map();
            for (const member of members) {
              const variant = JSON.stringify(member[key]);
              variants.set(variant, (variants.get(variant) ?? 0) + 1);
            }
            const chosen = [...variants].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0];
            return [key, JSON.parse(chosen)];
          }));
          building.add(shape);
          const base = encodeValue(prototype, depth + 1, true, false, metadata);
          building.delete(shape);
          bases.set(shape, {index: table.length, prototype}); table.push(base);
        }
        const base = bases.get(shape), changes = [];
        fields.forEach(([key, item], index) => {
          if (JSON.stringify(value[key]) !== JSON.stringify(base.prototype[key])) changes.push(index, item);
        });
        const delta = {delta: [`@${base.index}`, changes]};
        if (JSON.stringify(delta).length < JSON.stringify(encoded).length) encoded = delta;
      }
    }
    else encoded = value;
    // Only known fingerprint fields use this notation. It preserves every bit
    // and never encodes prose, requirements or arbitrary source payload strings.
    const compactDigest = recursiveTable && metadata && digestField && typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
    if (compactDigest) encoded = `~${Buffer.from(value, 'hex').toString('base64url')}`;
    if (recursiveTable && allowFragments && typeof value === 'string' && !compactDigest) {
      const fragment = orderedFragments.find(part => part.length < value.length && value.includes(part));
      if (fragment) {
        const index = value.indexOf(fragment), parts = [value.slice(0, index), fragment, value.slice(index + fragment.length)].filter(Boolean);
        const oldLength = table.length, oldKeys = new Set(ids.keys());
        const candidate = {parts: parts.map(part => encodeValue(part, depth + 1, false))};
        const allocation = table.slice(oldLength).reduce((sum, entry) => sum + JSON.stringify(entry).length + 1, 0);
        // Pay a proportional share of newly introduced dictionary entries.
        // Refuse fragments that increase the readable representation.
        if (JSON.stringify(candidate).length + allocation / Math.max(1, counts.get(JSON.stringify(fragment)) ?? 1)
          < JSON.stringify(encoded).length) encoded = candidate;
        else {
          table.length = oldLength;
          for (const key of ids.keys()) if (!oldKeys.has(key)) ids.delete(key);
        }
      }
    }
    // Intern children first so every dictionary edge points backward. Calculate
    // profitability from the encoded value, not its already-shared expansion.
    if (recursiveTable && depth > 0 && (count - 1) * JSON.stringify(encoded).length > count * 6 + 1) {
      const index = table.length;
      ids.set(key, index); table.push(encoded);
      return `@${index}`;
    }
    return encoded;
  };
  let result = items.map(value => encodeValue(value));
  if (recursiveTable) {
    const used = new Set();
    const mark = value => {
      if (exact(value, ['literal'])) return;
      if (isBatchReference(value)) {
        const index = Number(value.slice(1));
        if (!used.has(index)) {used.add(index); mark(table[index]);}
      } else if (Array.isArray(value)) value.forEach(mark);
      else if (isObject(value)) Object.values(value).forEach(mark);
    };
    result.forEach(mark);
    const mapping = new Map([...used].sort((a, b) => a - b).map((index, next) => [index, next]));
    const remap = value => {
      if (exact(value, ['literal'])) return value;
      if (isBatchReference(value)) return `@${mapping.get(Number(value.slice(1)))}`;
      if (Array.isArray(value)) return value.map(remap);
      if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, remap(item)]));
      return value;
    };
    result = result.map(remap);
    const retained = [...mapping.keys()].map(index => remap(table[index]));
    table.splice(0, table.length, ...retained);
  }
  if (table.length > 512) fail();
  return {items: result, values: table};
}

function restoreSourceValues(items, values, {recursiveTable = false, digestNotation = true} = {}) {
  if (!Array.isArray(values) || values.length > 512) fail();
  let nodes = 0;
  const restore = (value, depth = 0, ceiling = values.length) => {
    if (depth > 32 || ++nodes > 8192) fail();
    if (recursiveTable ? isBatchReference(value) : exact(value, ['are_shared_value'])) {
      const index = recursiveTable ? Number(value.slice(1)) : value.are_shared_value;
      if (!Number.isSafeInteger(index) || index < 0 || index >= ceiling) fail();
      return recursiveTable ? restore(values[index], depth + 1, index) : copy(values[index]);
    }
    if (recursiveTable && exact(value, ['literal'])) return copy(value.literal);
    if (recursiveTable && digestNotation && isDigestNotation(value)) {
      const bytes = Buffer.from(value.slice(1), 'base64url');
      if (bytes.length !== 32 || bytes.toString('base64url') !== value.slice(1)) fail();
      return bytes.toString('hex');
    }
    if (recursiveTable && exact(value, ['delta'])) {
      if (!Array.isArray(value.delta) || value.delta.length !== 2 || !Array.isArray(value.delta[1])
        || value.delta[1].length % 2 || value.delta[1].length > 256) fail();
      const base = restore(value.delta[0], depth + 1, ceiling);
      if (!isObject(base)) fail();
      const keys = Object.keys(base), seen = new Set();
      for (let i = 0; i < value.delta[1].length; i += 2) {
        const index = value.delta[1][i];
        if (!Number.isSafeInteger(index) || index < 0 || index >= keys.length || seen.has(index)) fail();
        seen.add(index);
        Object.defineProperty(base, keys[index], {value: restore(value.delta[1][i + 1], depth + 1, ceiling),
          enumerable: true, writable: true, configurable: true});
      }
      return base;
    }
    if (recursiveTable && exact(value, ['object'])) {
      if (!Array.isArray(value.object) || value.object.length !== 2) fail();
      const [keys, fields] = value.object.map(part => restore(part, depth + 1, ceiling));
      if (!Array.isArray(keys) || !Array.isArray(fields) || keys.length !== fields.length
        || keys.length > 128 || keys.some(key => typeof key !== 'string') || new Set(keys).size !== keys.length) fail();
      return Object.fromEntries(keys.map((key, i) => [key, fields[i]]));
    }
    if (exact(value, [recursiveTable ? 'parts' : 'are_string_parts'])) {
      const sourceParts = value[recursiveTable ? 'parts' : 'are_string_parts'];
      if (!Array.isArray(sourceParts) || sourceParts.length > 4096) fail();
      const parts = sourceParts.map(part => restore(part, depth + 1, ceiling));
      if (parts.some(part => typeof part !== 'string')) fail();
      const text = parts.join('');
      if (Buffer.byteLength(text) > 65536) fail();
      return text;
    }
    if (exact(value, [recursiveTable ? 'json' : 'are_json_string'])) {
      const text = JSON.stringify(restore(value[recursiveTable ? 'json' : 'are_json_string'], depth + 1, ceiling));
      if (Buffer.byteLength(text) > 65536) fail();
      return text;
    }
    if (Array.isArray(value)) return value.map(item => restore(item, depth + 1, ceiling));
    if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, restore(item, depth + 1, ceiling)]));
    return value;
  };
  const result = items.map(value => restore(value));
  // Expansion is internal integrity verification, never a larger wire limit.
  if (Buffer.byteLength(JSON.stringify(result)) > 65536) fail();
  return result;
}

export function compactDshPlannedModelContext(context, {projection_rules = SINGLE_RULES} = {}) {
  if (![SINGLE_RULES, LEGACY_SINGLE_RULES].includes(projection_rules)) fail();
  if (!exact(context, ['schema_version', 'context_envelope_digest', 'route_id', 'selected_items', 'objective'])
    || context.schema_version !== 'are.dsh-web-model-context/v2'
    || !verifyReasoningPlanContext(context.objective?.plan_context).ok
    || !verifyRequirementSnapshot(context.objective?.requirement_snapshot)) fail();
  const compact = copy(context), shared_plan = compact.objective.plan_context;
  const ids = new Map(shared_plan.feature_obligations.map(row => [row.summary, row.obligation_id]));
  delete compact.objective.plan_context;
  compact.objective.requirement_snapshot.requirements = compact.objective.requirement_snapshot.requirements
    .map(value => ids.has(value) ? [ids.get(value)] : value);
  compact.schema_version = 'are.dsh-web-model-context/v3';
  const sources = shareSourceValues(compact.selected_items);
  compact.selected_items = sources.items;
  Object.assign(compact, {shared_plan, projection_rules,
    shared_values: sources.values,
    expanded_context_digest: wireDigest(JSON.stringify(context))});
  if (Buffer.byteLength(JSON.stringify(compact)) > 32768) {
    throw Object.assign(new Error('dsh-web.model-context-too-large'), {size_diagnostic: {
      kind: 'model-context-over-budget', expanded_bytes: Buffer.byteLength(JSON.stringify(context)),
      compact_bytes: Buffer.byteLength(JSON.stringify(compact)), limit_bytes: 32768}});
  }
  return compact;
}

export function reconstructDshPlannedModelContext(compact) {
  if (Buffer.byteLength(JSON.stringify(compact) ?? '') > 32768
    || !exact(compact, ['schema_version', 'context_envelope_digest', 'route_id', 'selected_items',
      'objective', 'shared_plan', 'projection_rules', 'shared_values', 'expanded_context_digest'])
    || compact.schema_version !== 'are.dsh-web-model-context/v3' || ![SINGLE_RULES, LEGACY_SINGLE_RULES].includes(compact.projection_rules)
    || !verifyReasoningPlanContext(compact.shared_plan).ok
    || !Array.isArray(compact.selected_items) || compact.selected_items.length > 64) fail();
  const {shared_plan, shared_values, projection_rules: _rules, expanded_context_digest, ...context} = copy(compact);
  context.schema_version = 'are.dsh-web-model-context/v2';
  context.selected_items = restoreSourceValues(context.selected_items, shared_values);
  if (!isObject(context.objective) || Object.hasOwn(context.objective, 'plan_context')) fail();
  const values = new Map(shared_plan.feature_obligations.map(row => [row.obligation_id, row.summary]));
  const snapshot = context.objective.requirement_snapshot;
  if (!isObject(snapshot) || !Array.isArray(snapshot.requirements) || snapshot.requirements.length > 64) fail();
  snapshot.requirements = snapshot.requirements.map(value => {
    if (typeof value === 'string') return value;
    if (!Array.isArray(value) || value.length !== 1 || !values.has(value[0])) fail();
    return values.get(value[0]);
  });
  if (!verifyRequirementSnapshot(snapshot)) fail();
  context.objective.plan_context = shared_plan;
  if (wireDigest(JSON.stringify(context)) !== expanded_context_digest) fail();
  return context;
}

// Replace a whole parent when its key order changes. Otherwise replacements
// retain the original insertion order, including nested snapshot fields.
function replacements(base, next, depth = 0) {
  if (depth > 16) fail();
  if (JSON.stringify(base) === JSON.stringify(next)) return {fields: {}};
  if (isObject(base) && isObject(next)
    && JSON.stringify(Object.keys(base)) === JSON.stringify(Object.keys(next))) {
    const changed = {fields: Object.fromEntries(Object.keys(base)
      .filter(key => JSON.stringify(base[key]) !== JSON.stringify(next[key]))
      .map(key => [key, replacements(base[key], next[key], depth + 1)]))};
    const whole = {replace: next};
    return JSON.stringify(whole).length < JSON.stringify(changed).length ? whole : changed;
  }
  return {replace: next};
}

function applyReplacements(base, changes, depth = 0, budget = {nodes: 0}) {
  if (depth > 16 || ++budget.nodes > 512) fail();
  if (exact(changes, ["replace"])) return copy(changes.replace);
  if (!exact(changes, ["fields"]) || !isObject(changes.fields) || !isObject(base)) fail();
  const value = copy(base);
  for (const [key, change] of Object.entries(changes.fields)) {
    if (!key || Buffer.byteLength(key) > 256 || !Object.hasOwn(value, key)) fail();
    Object.defineProperty(value, key, {value: applyReplacements(value[key], change, depth + 1, budget),
      enumerable: true, writable: true, configurable: true});
  }
  return value;
}

function encode(context, plan) {
  const encoded = copy(context);
  if (JSON.stringify(context.objective?.plan_context) !== JSON.stringify(plan)) fail();
  delete encoded.objective.plan_context;
  const ids = new Map(plan.feature_obligations.map(item => [item.summary, item.obligation_id]));
  const snapshot = encoded.objective.requirement_snapshot;
  if (!verifyRequirementSnapshot(snapshot)) fail();
  snapshot.requirements = snapshot.requirements.map(text => ids.has(text)
    ? [ids.get(text)] : text);
  encoded.selected_items = encoded.selected_items.map(item => item.item_digest);
  return encoded;
}

function decode(encoded, plan, byDigest) {
  const context = copy(encoded);
  if (!exact(context, ["schema_version", "context_envelope_digest", "route_id", "selected_items", "objective"])
    || context.schema_version !== "are.dsh-web-model-context/v2"
    || !isObject(context.objective) || Object.hasOwn(context.objective, "plan_context")
    || !Array.isArray(context.selected_items) || context.selected_items.length > 64) fail();
  context.selected_items = context.selected_items.map(id => {
    if (!byDigest.has(id)) fail();
    return copy(byDigest.get(id));
  });
  const values = new Map(plan.feature_obligations.map(item => [item.obligation_id, item.summary]));
  const snapshot = context.objective.requirement_snapshot;
  if (!isObject(snapshot) || !Array.isArray(snapshot.requirements) || snapshot.requirements.length > 64) fail();
  snapshot.requirements = snapshot.requirements.map(value => {
    if (typeof value === "string") return value;
    if (!Array.isArray(value) || value.length !== 1 || !values.has(value[0])) fail();
    return values.get(value[0]);
  });
  if (!verifyRequirementSnapshot(snapshot)) fail();
  // The closed planned projection emits the plan as its last field. Refuse
  // any input that cannot be exactly reconstructed with that source order.
  context.objective.plan_context = copy(plan);
  return context;
}

/** Structural references, never compression requiring tools or omitted text.
 * All plan/source/requirement values remain readable in the system context.
 * Each replacement tree is relative to the template, not the preceding row;
 * each row remains a separate prepared request, not one merged objective.
 */
export function composeDshPlannedModelContextBatch(modelContexts) {
  if (!Array.isArray(modelContexts) || modelContexts.length < 2 || modelContexts.length > 16
    || modelContexts.some(value => typeof value !== "string" || Buffer.byteLength(value) > 32768)) fail();
  const originals = modelContexts.map(value => JSON.parse(value));
  const compactRows = originals.some(context => context.schema_version === 'are.dsh-web-model-context/v3');
  const contexts = originals.map(context => context.schema_version === 'are.dsh-web-model-context/v3'
    ? reconstructDshPlannedModelContext(context) : context);
  const plan = contexts[0].objective?.plan_context;
  if (!verifyReasoningPlanContext(plan).ok) fail();
  const items = new Map();
  for (const context of contexts) {
    if (context.schema_version !== "are.dsh-web-model-context/v2" || !Array.isArray(context.selected_items)) fail();
    for (const item of context.selected_items) {
      if (typeof item?.item_digest !== "string"
        || items.has(item.item_digest) && JSON.stringify(items.get(item.item_digest)) !== JSON.stringify(item)) fail();
      items.set(item.item_digest, item);
    }
  }
  const template = encode(contexts[0], plan);
  const batch = {schema_version: compactRows ? 'are.dsh-web-model-context-batch/v3' : SCHEMA, context_encoding: ENCODING,
    projection_rules: "Rows are separate requests, not completion or authority. Apply each replacement tree to the template. Source IDs resolve in selected_items; [obligation_id] requirement entries resolve to shared_plan.feature_obligations summaries. Restore shared_plan as objective.plan_context.",
    shared_plan: plan, selected_items: [...items.values()], context_template: template,
    request_contexts: contexts.map((context, index) => ({model_context_digest: wireDigest(modelContexts[index]),
      ...(compactRows ? {source_context_schema: originals[index].schema_version} : {}),
      ...(originals[index].schema_version === 'are.dsh-web-model-context/v3'
        && originals[index].projection_rules === LEGACY_SINGLE_RULES ? {source_rules_version: 'legacy'} : {}),
      replacements: replacements(template, encode(context, plan))}))};
  if (compactRows) {
    const sources = shareSourceValues([batch.selected_items, batch.context_template, batch.request_contexts, batch.shared_plan], {segments: true, recursiveTable: true});
    [batch.selected_items, batch.context_template, batch.request_contexts, batch.shared_plan] = sources.items;
    batch.shared_values = sources.values;
    batch.projection_rules = BATCH_RULES;
  }
  if (Buffer.byteLength(JSON.stringify(batch)) > 32768) throw Object.assign(new Error("dsh-web.model-context-too-large"),
    {size_diagnostic: {kind: 'model-context-over-budget', expanded_bytes: modelContexts.reduce((sum, value) => sum + Buffer.byteLength(value), 0),
      compact_bytes: Buffer.byteLength(JSON.stringify(batch)), limit_bytes: 32768}});
  const recovered = reconstructDshPlannedModelContextBatch(batch);
  if (recovered.some((context, index) => JSON.stringify(context) !== modelContexts[index])) fail();
  return batch;
}

/** Integrity decoding for dispatch verification and private tests, not an
 * observer or a public browser admission/configuration API. */
export function reconstructDshPlannedModelContextBatch(batch) {
  const compactRows = batch?.schema_version === 'are.dsh-web-model-context-batch/v3';
  if (Buffer.byteLength(JSON.stringify(batch) ?? "") > 32768
    || !exact(batch, ["schema_version", "context_encoding", "projection_rules", "shared_plan",
    "selected_items", "context_template", "request_contexts", ...(compactRows ? ['shared_values'] : [])])
    || !compactRows && batch.schema_version !== SCHEMA || batch.context_encoding !== ENCODING
    || typeof batch.projection_rules !== "string" || Buffer.byteLength(batch.projection_rules) > 512
    || compactRows && ![BATCH_RULES, LEGACY_BATCH_RULES].includes(batch.projection_rules)
    || !compactRows && !verifyReasoningPlanContext(batch.shared_plan).ok
    || !Array.isArray(batch.selected_items) || batch.selected_items.length > 1024
    || !Array.isArray(batch.request_contexts) || batch.request_contexts.length < 2
    || batch.request_contexts.length > 16) fail();
  const byDigest = new Map();
  const [items, template, requests, sharedPlan] = compactRows
    ? restoreSourceValues([batch.selected_items, batch.context_template, batch.request_contexts, batch.shared_plan], batch.shared_values,
      {recursiveTable: true, digestNotation: batch.projection_rules === BATCH_RULES})
    : [batch.selected_items, batch.context_template, batch.request_contexts, batch.shared_plan];
  if (!verifyReasoningPlanContext(sharedPlan).ok) fail();
  for (const item of items) {
    if (typeof item?.item_digest !== "string" || byDigest.has(item.item_digest)) fail();
    byDigest.set(item.item_digest, item);
  }
  return requests.map(row => {
    const legacyRules = compactRows && (batch.projection_rules === LEGACY_BATCH_RULES || row.source_rules_version === 'legacy');
    if (!exact(row, ["model_context_digest", "replacements", ...(compactRows ? ['source_context_schema'] : []),
      ...(Object.hasOwn(row, 'source_rules_version') ? ['source_rules_version'] : [])])) fail();
    if (Object.hasOwn(row, 'source_rules_version') && (!compactRows || row.source_context_schema !== 'are.dsh-web-model-context/v3'
      || row.source_rules_version !== 'legacy')) fail();
    if (compactRows && !['are.dsh-web-model-context/v2', 'are.dsh-web-model-context/v3'].includes(row.source_context_schema)) fail();
    const expanded = decode(applyReplacements(template, row.replacements), sharedPlan, byDigest);
    const context = compactRows && row.source_context_schema === 'are.dsh-web-model-context/v3'
      ? compactDshPlannedModelContext(expanded, {projection_rules: legacyRules ? LEGACY_SINGLE_RULES : SINGLE_RULES}) : expanded;
    if (wireDigest(JSON.stringify(context)) !== row.model_context_digest) fail();
    return context;
  });
}
