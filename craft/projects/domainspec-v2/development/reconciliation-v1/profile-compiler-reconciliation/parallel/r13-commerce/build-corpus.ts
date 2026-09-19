import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {crossGeneratorPublicFixture} from '../../../../../impl/cli/test/helpers/cross-generator-public.ts';

// Candidate construction only. The imported helper owns unique temporary files;
// no nativeWorkflow/nativePlan or external provider is called here.
// Open questions: RESULT.md and scenarios.json.
const scalar = (name = 'UInt64'): any => ({kind: 'scalar', name});
const named = (selector: string): any => ({kind: 'named', selector});
const at = (root: string, ...properties: string[]): any => ({op: 'path', root, properties});
const property = (owner: string, name: string, type: any, identity = false): any => ({
  ontology_property: owner + '#' + name, name, type, identity, meaning: name,
  cardinality: type.kind === 'optional' ? 'optional' : type.kind === 'list' ? 'many' : type.kind === 'set' ? 'many-unique' : 'one'
});

export function buildCorpus() {
  const cleanup: (() => void)[] = [];
  try {
    const f = crossGeneratorPublicFixture({after(fn: () => void) {cleanup.push(fn);}} as any);
    const read = (p: string) => JSON.parse(fs.readFileSync(path.join(f.source, p), 'utf8'));
    const write = (p: string, v: unknown) => {
      const file = path.join(f.source, p); fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, JSON.stringify(v, null, 2) + '\n');
    };
    const manifests: Record<string, any> = {
      commerce: read('specs/commerce/feature.json'),
      billing: {schema_version: 'domainspec.feature/v1', feature_id: 'billing', nodes: [], edges: []}
    };
    const node = (feature: string, id: string, kind: string, body: any) => {
      if (!manifests[feature].nodes.includes(id)) manifests[feature].nodes.push(id);
      write('specs/' + feature + '/nodes/' + id + '.json', {
        schema_version: 'domainspec.node/v1', feature_id: feature, node_id: id, kind, body: {description: id, ...body}
      });
    };
    const edge = (feature: string, from: string, relationship: string, to: string) => {
      const id = from + '-' + relationship + '-' + to;
      manifests[feature].edges.push(id);
      write('specs/' + feature + '/edges/' + id + '.json', {
        schema_version: 'domainspec.edge/v1', feature_id: feature, edge_id: id,
        relationship, source_node_id: from, target_node_id: to, scope: 'feature'
      });
    };
    const selection: any = structuredClone(f.selection);
    selection.module_root = 'commerce-corpus';
    const allowed = read('specs/commerce/nodes/allowed.json');
    allowed.body.description = 'Explicit order quantity is below the candidate processing limit.';
    allowed.body.typed_contract.expression = {op: 'lt', left: at('value'), right: {op: 'literal', type: 'UInt64', value: '100'}};
    write('specs/commerce/nodes/allowed.json', allowed);
    node('billing', 'customer', 'Entity', {
      description: 'Billing customer identity is nominally distinct from commerce customer.',
      fields: ['id', 'name'], typed_contract: {schema_version: 'domainspec.typed-record/v1',
        ontology_node: 'R13-BILLING-CUSTOMER', properties: [
          property('R13-BILLING-CUSTOMER', 'id', scalar(), true),
          property('R13-BILLING-CUSTOMER', 'name', scalar('String'))
        ]}
    });
    selection.factories.push({selector: 'billing:customer', base_validators: [
      {rule: 'commerce:positive', arguments: [{parameter: 'value', field: 'id'}]}
    ], extensions: []});
    const order = read('specs/commerce/nodes/order.json');
    order.body.description = 'Order snapshot owns its embedded commerce customer and values; billing customer is only an identity reference.';
    order.body.fields.push('billing_customer_id', 'tags');
    order.body.typed_contract.properties.push(
      property('TEST-ORDER', 'billing_customer_id', scalar()),
      property('TEST-ORDER', 'tags', {kind: 'set', element: scalar('String')})
    );
    write('specs/commerce/nodes/order.json', order);
    selection.field_bindings.push({owner: 'commerce:order', field: 'billing_customer_id',
      kind: 'identity-reference', target: 'billing:customer', projection: ['id']});

    // Explicit state replacement shares one transaction with the existing outbox
    // events. Replacement is a declared action binding, not an invented edge verb.
    for (const id of ['perform', 'undo']) {
      const operation = read('specs/commerce/nodes/' + id + '.json');
      operation.body.writes = ['order-state'];
      operation.body.description = id === 'perform'
        ? 'Persist one validated order snapshot and one posted occurrence atomically.'
        : 'Apply the explicitly supplied compensation snapshot and released occurrence atomically.';
      write('specs/commerce/nodes/' + id + '.json', operation);
      selection.operations.find((o: any) => o.selector === 'commerce:' + id).writes = [
        {slot: 'order-state', target: 'commerce:order', mode: 'replace', value: at('amount')}
      ];
      selection.operations.find((o: any) => o.selector === 'commerce:' + id).guards[0].arguments[0].value =
        at('amount', 'TEST-ORDER#money', 'TEST-MONEY#quantity');
    }
    const lifecycle = read('specs/commerce/nodes/lifecycle.json');
    lifecycle.body.typed_contract.transitions[0].output_intents = [
      {slot: 'confirmation', event_ref: 'commerce:posted'},
      {slot: 'audit', event_ref: 'commerce:posted'}
    ];
    write('specs/commerce/nodes/lifecycle.json', lifecycle);
    const flow = read('specs/commerce/nodes/flow.json');
    flow.body.description = 'Four order-snapshot occurrences; declared compensation values and dependency order, with no durable recovery claim.';
    flow.body.typed_contract.compensations[0].depends_on = ['undo-second'];
    write('specs/commerce/nodes/flow.json', flow);
    // Compensation consumes an explicit caller-provided pre-operation snapshot,
    // rather than pretending a successful forward result is its inverse.
    const workflow = selection.workflows[0];
    workflow.inputs.push({name: 'before', type: named('commerce:order')});
    for (const c of workflow.compensations) c.arguments[0].value = {op: 'input', name: 'before', properties: []};
    workflow.event_inputs = [];
    for (const call of workflow.steps) {
      const name = 'post_' + call.step_id;
      workflow.event_inputs.push({name, event_ref: 'commerce:posted'});
      call.events = [{parameter: 'notice_input', input: name}];
    }
    for (const call of workflow.compensations) {
      const name = call.compensation_id.replaceAll('-', '_');
      workflow.event_inputs.push({name, event_ref: 'commerce:released'});
      call.events = [{parameter: 'notice_input', input: name}];
    }

    for (const feature of ['commerce', 'billing']) {
      node(feature, 'total', 'Calculation', {
        description: feature === 'commerce' ? 'Exact subtotal after explicit discount.' : 'Exact billing fee; same node name, distinct feature identity.',
        inputs: ['gross', 'adjustment'],
        typed_contract: {schema_version: 'domainspec.typed-calculation/v2',
          ontology_calculation: 'R13-' + feature.toUpperCase() + '-TOTAL',
          inputs: [{name: 'gross', type: scalar()}, {name: 'adjustment', type: scalar()}],
          result: scalar(), division_rounding: 'reject',
          expression: {op: feature === 'commerce' ? 'subtract' : 'add',
            left: {op: 'input', name: 'gross'}, right: {op: 'input', name: 'adjustment'}}}
      });
    }
    node('commerce', 'find', 'Query', {
      description: 'Read order identity and billing identity without computation or persistence lookup of referenced customer.',
      reads: ['commerce:order'],
      typed_contract: {schema_version: 'domainspec.typed-query/v1', ontology_query: 'R13-FIND',
        source: 'commerce:order', inputs: [], filter: null, projection: ['id', 'billing_customer_id'],
        order_by: null, limit: null}
    });
    edge('commerce', 'find', 'reads', 'order');
    node('billing', 'find', 'Query', {
      description: 'Same query name resolves to the billing customer only.',
      reads: ['billing:customer'],
      typed_contract: {schema_version: 'domainspec.typed-query/v1', ontology_query: 'R13-BILLING-FIND',
        source: 'billing:customer', inputs: [], filter: null, projection: ['id', 'name'],
        order_by: null, limit: null}
    });
    edge('billing', 'find', 'reads', 'customer');
    node('commerce', 'api', 'Interface', {
      description: 'Named order read boundary; no implicit transport or provider.',
      typed_contract: {schema_version: 'domainspec.typed-interface/v1', ontology_interface: 'R13-API',
        boundary_kind: 'external', version_policy: {schema_version: 'domainspec.interface-version-policy/v1',
          mode: 'backward', direction: 'consumer-to-provider', provider_version: '1.0.0'},
        contracts: [{contract_id: 'response', ontology_contract: 'R13-RESPONSE', fields: [
          {name: 'id', ontology_field: 'R13-RESPONSE#id', meaning: 'Order identity', type: scalar()},
          {name: 'net', ontology_field: 'R13-RESPONSE#net', meaning: 'Explicit commerce calculation result', type: scalar()},
          {name: 'fee', ontology_field: 'R13-RESPONSE#fee', meaning: 'Explicit billing calculation result', type: scalar()}
        ]}],
        operations: [{operation_id: 'find', operation_ref: 'commerce:find', request: scalar(),
          result: {kind: 'contract', contract_id: 'response'}}]}
    });
    edge('commerce', 'api', 'exposes', 'find');
    node('commerce', 'summary', 'Mapping', {
      description: 'Map supplied order and two explicit Calculation result values into a named public result.',
      target: 'commerce:api',
      typed_contract: {schema_version: 'domainspec.typed-mapping/v3', ontology_mapping: 'R13-SUMMARY',
        inputs: [{name: 'order', type: named('commerce:order'), use: null},
          {name: 'net', type: scalar(), use: null}, {name: 'fee', type: scalar(), use: null}],
        target: {kind: 'contract', interface_selector: 'commerce:api', contract_id: 'response'},
        target_use: {interface_selector: 'commerce:api', operation_id: 'find', side: 'result'},
        fields: [{target: 'id', value: at('order', 'TEST-ORDER#id'), default: null},
          {target: 'net', value: at('net'), default: null}, {target: 'fee', value: at('fee'), default: null}], total: true}
    });
    edge('commerce', 'summary', 'maps', 'api');
    // No Calculation -> Mapping relationship is invented: dataflow is explicit
    // in the consumer scenario manifest, not a new canonical graph verb.
    const project = read('project.json');
    project.project_id = 'r13-commerce-candidate'; project.features = ['commerce', 'billing'];
    write('project.json', project);
    for (const [feature, manifest] of Object.entries(manifests)) write('specs/' + feature + '/feature.json', manifest);
    const files: Record<string, unknown> = {};
    function collect(dir: string) {
      for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) collect(file);
        else files[path.relative(f.source, file)] = JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    }
    collect(f.source);
    return {files, selection};
  } finally {
    for (const fn of cleanup.reverse()) fn();
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url)
  process.stdout.write(JSON.stringify(buildCorpus()));
