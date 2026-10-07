import assert from "node:assert/strict";
import {createHash} from "node:crypto";

const hashWire = value => createHash('sha256').update(JSON.stringify(JSON.stringify(value))).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const tag = (value, key) => object(value) && Object.keys(value).length === 1 && Object.hasOwn(value, key);

// Independent protocol witness. No production encoder/decoder is imported.
function recoverSharedValues(roots, dictionary, recursive = false, digestNotation = true) {
  assert.ok(Array.isArray(dictionary) && dictionary.length <= 512);
  let nodes = 0;
  const read = (value, ceiling = dictionary.length, depth = 0) => {
    assert.ok(++nodes <= 8192 && depth <= 32);
    const reference = recursive ? typeof value === 'string' && /^@[0-9]+$/.test(value)
      : tag(value, 'are_shared_value');
    if (reference) {
      const index = recursive ? Number(value.slice(1)) : value.are_shared_value;
      assert.ok(Number.isSafeInteger(index) && index >= 0 && index < ceiling);
      return recursive ? read(dictionary[index], index, depth + 1) : structuredClone(dictionary[index]);
    }
    if (recursive && tag(value, 'literal')) return structuredClone(value.literal);
    if (recursive && digestNotation && typeof value === 'string' && /^~[A-Za-z0-9_-]{43}$/.test(value)) {
      const bytes = Buffer.from(value.slice(1), 'base64url');
      assert.equal(bytes.length, 32); assert.equal(bytes.toString('base64url'), value.slice(1));
      return bytes.toString('hex');
    }
    if (recursive && tag(value, 'object')) {
      assert.ok(Array.isArray(value.object) && value.object.length === 2);
      const [keys, values] = value.object.map(part => read(part, ceiling, depth + 1));
      assert.ok(Array.isArray(keys) && Array.isArray(values) && keys.length === values.length);
      assert.ok(keys.every(key => typeof key === 'string') && new Set(keys).size === keys.length);
      return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
    }
    if (recursive && tag(value, 'delta')) {
      assert.ok(Array.isArray(value.delta) && value.delta.length === 2);
      const base = read(value.delta[0], ceiling, depth + 1), updates = value.delta[1];
      assert.ok(object(base) && Array.isArray(updates) && updates.length % 2 === 0);
      const keys = Object.keys(base), seen = new Set();
      for (let i = 0; i < updates.length; i += 2) {
        const index = updates[i];
        assert.ok(Number.isSafeInteger(index) && index >= 0 && index < keys.length && !seen.has(index));
        seen.add(index);
        Object.defineProperty(base, keys[index], {value: read(updates[i + 1], ceiling, depth + 1),
          enumerable: true, writable: true, configurable: true});
      }
      return base;
    }
    if (tag(value, recursive ? 'parts' : 'are_string_parts')) {
      const parts = read(value[recursive ? 'parts' : 'are_string_parts'], ceiling, depth + 1);
      assert.ok(Array.isArray(parts) && parts.every(part => typeof part === 'string'));
      return parts.join('');
    }
    if (tag(value, recursive ? 'json' : 'are_json_string')) return JSON.stringify(read(value[recursive ? 'json' : 'are_json_string'], ceiling, depth + 1));
    if (Array.isArray(value)) return value.map(part => read(part, ceiling, depth + 1));
    if (object(value)) return Object.fromEntries(Object.entries(value).map(([key, part]) => [key, read(part, ceiling, depth + 1)]));
    return value;
  };
  const result = roots.map(value => read(value));
  assert.ok(Buffer.byteLength(JSON.stringify(result)) <= 65536);
  return result;
}

export function recoverOwnedPlannedSingle(wire) {
  if (wire.schema_version === 'are.dsh-web-model-context/v2') return structuredClone(wire);
  assert.equal(wire.schema_version, 'are.dsh-web-model-context/v3');
  const {shared_plan, shared_values, projection_rules: _rules, expanded_context_digest, ...context} = structuredClone(wire);
  context.schema_version = 'are.dsh-web-model-context/v2';
  [context.selected_items] = recoverSharedValues([context.selected_items], shared_values);
  const summaries = new Map(shared_plan.feature_obligations.map(row => [row.obligation_id, row.summary]));
  context.objective.requirement_snapshot.requirements = context.objective.requirement_snapshot.requirements.map(value => {
    if (typeof value === 'string') return value;
    assert.ok(Array.isArray(value) && value.length === 1 && summaries.has(value[0]));
    return summaries.get(value[0]);
  });
  context.objective.plan_context = shared_plan;
  assert.equal(hashWire(context), expanded_context_digest, 'independent expansion must match the exact original-context digest');
  return context;
}

function reencodeOwnedSingle(context, legacy = false) {
  const projected = structuredClone(context), shared_plan = projected.objective.plan_context;
  delete projected.objective.plan_context;
  projected.schema_version = 'are.dsh-web-model-context/v3';
  const ids = new Map(shared_plan.feature_obligations.map(row => [row.summary, row.obligation_id]));
  projected.objective.requirement_snapshot.requirements = projected.objective.requirement_snapshot.requirements
    .map(value => ids.has(value) ? [ids.get(value)] : value);
  const counts = new Map(), values = [], indices = new Map();
  const count = value => {
    const key = JSON.stringify(value); if (key.length >= 32) counts.set(key, (counts.get(key) ?? 0) + 1);
    if (Array.isArray(value)) value.forEach(count);
    else if (object(value)) Object.values(value).forEach(count);
  };
  projected.selected_items.forEach(count);
  const encode = (value, depth = 0) => {
    const key = JSON.stringify(value), occurrences = counts.get(key) ?? 0;
    const reserved = ['are_shared_value', 'are_string_parts', 'are_json_string', 'are_literal_value', 'are_object',
      'ref', 'literal', 'object', 'parts', 'json', 'delta'].some(name => tag(value, name));
    if (reserved || depth && (occurrences - 1) * key.length > occurrences * 26 + 1) {
      if (!indices.has(key)) {indices.set(key, values.length); values.push(structuredClone(value));}
      return {are_shared_value: indices.get(key)};
    }
    if (Array.isArray(value)) return value.map(part => encode(part, depth + 1));
    if (object(value)) return Object.fromEntries(Object.entries(value).map(([name, part]) => [name, encode(part, depth + 1)]));
    return value;
  };
  projected.selected_items = projected.selected_items.map(value => encode(value));
  return {...projected, shared_plan,
    projection_rules: legacy
      ? 'Req [id] resolves in shared_plan.feature_obligations; restore objective.plan_context=shared_plan. {are_shared_value:i}=shared_values[i] verbatim (nonrecursive); {are_string_parts:[...]} joins resolved parts without separators. No completion/authority.'
      : 'Req[id]:shared_plan.feature_obligations summary; objective.plan_context=shared_plan; are_shared_value i:literal shared_values[i]. No authority/completion.',
    shared_values: values, expanded_context_digest: hashWire(context)};
}

// Deliberately independent of the production encoder/decoder: native provider
// evidence must not pass merely because both sides share an implementation bug.
function recoverPlannedBatch(dispatched, alreadyExpanded = false) {
  const v3 = dispatched.schema_version === 'are.dsh-web-model-context-batch/v3';
  if (v3 && !alreadyExpanded) {
    const [items, template, rows, plan] = recoverSharedValues([dispatched.selected_items,
      dispatched.context_template, dispatched.request_contexts, dispatched.shared_plan], dispatched.shared_values, true,
      dispatched.projection_rules.includes('~BASE64URL'));
    dispatched = {...dispatched, selected_items: items, context_template: template, request_contexts: rows, shared_plan: plan};
  }
  const byDigest = new Map(dispatched.selected_items.map(item => [item.item_digest, item]));
  const summaries = new Map(dispatched.shared_plan.feature_obligations
    .map(item => [item.obligation_id, item.summary]));
  const apply = (base, tree) => {
    if (Object.hasOwn(tree, "replace")) return structuredClone(tree.replace);
    const value = structuredClone(base);
    for (const [key, patch] of Object.entries(tree.fields)) {
      assert.ok(Object.hasOwn(value, key));
      Object.defineProperty(value, key, {value: apply(value[key], patch),
        enumerable: true, writable: true, configurable: true});
    }
    return value;
  };
  return dispatched.request_contexts.map(row => {
    const value = apply(dispatched.context_template, row.replacements);
    value.selected_items = value.selected_items.map(id => {
      assert.ok(byDigest.has(id)); return structuredClone(byDigest.get(id));
    });
    value.objective.requirement_snapshot.requirements = value.objective.requirement_snapshot.requirements
      .map(item => {
        if (typeof item === "string") return item;
        assert.equal(item.length, 1); assert.ok(summaries.has(item[0]));
        return summaries.get(item[0]);
      });
    value.objective.plan_context = structuredClone(dispatched.shared_plan);
    return v3 && row.source_context_schema === 'are.dsh-web-model-context/v3'
      ? reencodeOwnedSingle(value, row.source_rules_version === 'legacy' || !dispatched.projection_rules.includes('~BASE64URL')) : value;
  });
}

// Private test witness: join actual provider bytes to the exact preparation
// retained by each model-entry record. This is not an observer or admission API.
export function assertOwnedModelContexts(state, providerBodies) {
  assert.equal(state.model_entry_observations.length, providerBodies.length);
  return providerBodies.map((body, index) => {
    const entry = state.model_entry_observations[index];
    const bound = entry.preparation_bindings.at(-1);
    assert.ok(bound, "native model entry must retain its preparation binding");
    const retained = state.preparation_observations.find(preparation =>
      preparation.request_digest === bound.request_digest
        && preparation.request_key_digest === bound.request_key_digest);
    assert.ok(retained?.objective_checkpoint, "owned model entry must join a v2 checkpoint");
    const texts = body.messages.filter(message => message.role === "system")
      .flatMap(message => typeof message.content === "string" ? [message.content]
        : (message.content ?? []).map(part => part.text).filter(Boolean));
    const contextText = texts.find(text => text.includes("are.dsh-web-model-context"));
    assert.ok(contextText, "actual provider must receive owned model context");
    assert.ok(Buffer.byteLength(contextText) <= 32768, "native context must retain the unchanged resource ceiling");
    assert.equal(createHash("sha256").update(JSON.stringify(contextText)).digest("hex"), entry.context_digest,
      "the native observation must bind the whole dispatched batch, not merely its last row");
    let dispatched = JSON.parse(contextText);
    if (dispatched.schema_version === 'are.dsh-web-model-context-batch/v3') {
      const [selected_items, context_template, request_contexts, shared_plan] = recoverSharedValues([
        dispatched.selected_items, dispatched.context_template, dispatched.request_contexts, dispatched.shared_plan],
      dispatched.shared_values, true, dispatched.projection_rules.includes('~BASE64URL'));
      dispatched = {...dispatched, selected_items, context_template, request_contexts, shared_plan};
    }
    let context = dispatched;
    if (["are.dsh-web-model-context-batch/v1", "are.dsh-web-model-context-batch/v2", "are.dsh-web-model-context-batch/v3"].includes(dispatched.schema_version)) {
      assert.equal(dispatched.request_contexts.length, entry.preparation_bindings.length);
      if (dispatched.schema_version !== 'are.dsh-web-model-context-batch/v3') assert.equal(new Set(dispatched.selected_items.map(item => item.item_digest)).size,
        dispatched.selected_items.length);
      const byDigest = new Map(dispatched.selected_items.map(item => [item.item_digest, item]));
      const planned = ['are.dsh-web-model-context-batch/v2', 'are.dsh-web-model-context-batch/v3'].includes(dispatched.schema_version)
        ? recoverPlannedBatch(dispatched, true) : null;
      const recovered = dispatched.request_contexts.map((row, rowIndex) => {
        const preparationBinding = entry.preparation_bindings[rowIndex];
        const original = state.preparation_observations.find(preparation =>
          preparation.request_digest === preparationBinding.request_digest
            && preparation.request_key_digest === preparationBinding.request_key_digest);
        assert.ok(original?.objective_checkpoint);
        assert.equal(row.model_context_digest, original.model_context_digest);
        const material = planned?.[rowIndex] ?? {schema_version: row.source_context_schema,
          context_envelope_digest: row.context_envelope_digest, route_id: row.route_id,
          selected_items: row.selected_item_digests.map(digest => {
            assert.ok(byDigest.has(digest), "batch cannot drop a source context item");
            return byDigest.get(digest);
          }), objective: row.objective};
        assert.equal(createHash("sha256").update(JSON.stringify(JSON.stringify(material))).digest("hex"),
          original.model_context_digest, "every batch row must reconstruct exact prepared bytes");
        const expanded = recoverOwnedPlannedSingle(material);
        assert.equal(expanded.objective.objective_binding_digest, original.objective_checkpoint.binding_digest);
        assert.equal(expanded.objective.state_digest, original.objective_checkpoint.objective_state_digest);
        assert.equal(expanded.objective.resolution_digest, original.objective_checkpoint.resolution_digest);
        return expanded;
      });
      context = recovered.at(-1);
    } else {
      assert.equal(createHash("sha256").update(JSON.stringify(contextText)).digest("hex"),
        retained.model_context_digest, "actual provider bytes must match the bound preparation context");
      context = recoverOwnedPlannedSingle(context);
    }
    assert.equal(context.schema_version, "are.dsh-web-model-context/v2");
    assert.equal(context.objective.authority_effect, "none");
    assert.equal(context.objective.objective_binding_digest, retained.objective_checkpoint.binding_digest);
    assert.equal(context.objective.state_digest, retained.objective_checkpoint.objective_state_digest);
    assert.equal(context.objective.resolution_digest, retained.objective_checkpoint.resolution_digest);
    assert.match(retained.objective_checkpoint.checkpoint_digest, /^[0-9a-f]{64}$/u);
    assert.deepEqual(body.tools ?? [], []);
    return {context, preparation: retained, entry};
  });
}
