import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';

const exec = promisify(execFile);
export const LAB = '/home/vrondelli/projects/CyberAlchemy-lab';
export const V4 = `${LAB}/implementation/bindings/ontology-product-event-runtime/v4`;
export const STORE = `${LAB}/.local/ontology-source-runtime-v4-prototype`;
const sha = text => createHash('sha256').update(text).digest('hex');
export const qualified = (p, kind, id) => `${p}:${kind}-${sha(id)}`;
export function parseLossless(text) {
  return JSON.parse(text, (_key, value, context) => typeof value === 'number' &&
    (!Number.isSafeInteger(value)) ? context.source : value);
}
function requireText(value, name) {
  if (typeof value !== 'string' || !value) throw new Error(`Missing ${name}`);
  return value;
}
export function endpoint(p, raw) {
  requireText(raw, 'endpoint');
  const split = raw.indexOf('::');
  if (split < 0) return qualified(p.package_key, 'node', raw);
  const key = p.endpoint_aliases[raw.slice(0, split)];
  if (!key) throw new Error(`Undeclared alias: ${raw}`);
  return qualified(key, 'node', raw.slice(split + 2));
}
export function adapt(manifest, exported) {
  if (exported.authority_effect !== 'none' || manifest.authority_effect !== 'none') throw new Error('Authority effect refused');
  const packages = manifest.packages.map(p => ({key:p.package_key, ontologyId:p.ontology_id,
    path:p.profile.path, owner:p.owner, status:p.source_status}));
  const packageMap = new Map(manifest.packages.map(p => [p.package_key, p]));
  const nodes = [], relations = [], documents = [], views = [];
  const identities = new Set();
  for (const row of exported.records) {
    const p = packageMap.get(row.source_binding.package_key);
    if (!p) throw new Error('Unmapped package');
    const id = row.identity.subject_id;
    if (identities.has(id)) throw new Error('Duplicate identity');
    identities.add(id);
    const raw = row.source_record, binding = row.source_binding;
    const metadata = {packageKey:p.package_key, raw:JSON.stringify(raw, null, 2), binding,
      runtimeLifecycle:row.lifecycle};
    if (row.identity.type_ref === 'source-document') {
      if (typeof raw.content !== 'string') throw new Error('Missing document content');
      if (sha(raw.content) !== raw.content_sha256) throw new Error('Document digest mismatch');
      documents.push({id, path:binding.path, content:raw.content, ...metadata});
      continue;
    }
    if (row.identity.subject_kind === 'node') {
      const sourceId = requireText(raw[p.nodes.id_field], 'node identity');
      if (qualified(p.package_key, 'node', sourceId) !== id) throw new Error('Node identity mismatch');
      nodes.push({id, sourceId, kind:String(raw[p.nodes.type_field] ?? row.identity.type_ref),
        label:String(raw.label ?? raw.title ?? raw.name ?? sourceId.split('.').at(-1)), status:String(raw.status ?? raw.lifecycle_state ?? p.source_status),
        meaning:String(raw.meaning ?? raw.definition_or_claim ?? raw.definition ?? raw.claim ?? raw.intent ?? ''),
        owner_route:p.owner, source_refs:[`${binding.path}#${binding.selector}`],
        boundary:'Event-calculated representation; source ownership unchanged.',
        claim_ceiling:String(raw.claim_ceiling ?? 'Imported source record; no admission or authority inferred.'),
        authority_effect:'none', ...metadata});
    } else if (row.identity.subject_kind === 'relation') {
      const r = p.relations;
      const sourceId = r.id_field === '$tuple' ? `tuple-${sha(JSON.stringify([raw[r.type_field],raw[r.source_field],raw[r.target_field]])+'\n')}` : requireText(raw[r.id_field], 'relation identity');
      if (qualified(p.package_key, 'relation', sourceId) !== id) throw new Error('Relation identity mismatch');
      const direction = r.direction_map[raw.direction ?? 'directed'];
      if (!direction) throw new Error('Unmapped direction');
      relations.push({id, sourceId, type:requireText(raw[r.type_field], 'predicate'),
        source:endpoint(p,raw[r.source_field]), target:endpoint(p,raw[r.target_field]),
        direction, claim:String(raw.claim ?? raw.meaning ?? ''), authority_effect:'none', ...metadata});
    } else throw new Error('Unknown subject kind');
  }
  const nodeIds = new Set(nodes.map(n=>n.id));
  for (const r of relations) if (!nodeIds.has(r.source) || !nodeIds.has(r.target)) throw new Error(`Missing endpoint: ${r.id}`);
  for (const d of documents) {
    const p = packageMap.get(d.packageKey);
    if (/\/views\/[^/]+\.md$/i.test(d.path)) {
      views.push({id:d.id, packageKey:d.packageKey, label:d.path.split('/').at(-1), kind:'document', documentId:d.id, purpose:'Authored Markdown view; displayed without interpreting its prose as graph selectors.'});
    } else if (/(^|\/)views\.json$/i.test(d.path)) {
      const registry = parseLossless(d.content);
      if (!Array.isArray(registry.views)) throw new Error('Malformed view registry');
      for (const [index, v] of registry.views.entries()) {
        const view = {id:`${d.id}#${index}`, packageKey:d.packageKey, label:v.label ?? v.id ?? v.view_id,
          kind:'graph', purpose:v.purpose ?? '', claim:v.claim_ceiling ?? v.allowed_claim ?? '', blockedClaim:v.blocked_claim ?? '',
          documentId:d.id, raw:JSON.stringify(v,null,2), nodeIds:[], relationIds:[], error:null};
        try {
          const allowed = new Set(['id','view_id','label','branch','purpose','node_ids','relation_ids','relation_types','claim_ceiling','allowed_claim','blocked_claim']);
          if (Object.keys(v).some(k=>!allowed.has(k))) throw new Error('Unsupported view field');
          if (!Array.isArray(v.node_ids) || (!Array.isArray(v.relation_ids) && !Array.isArray(v.relation_types))) throw new Error('Unsupported view selectors');
          if (v.relation_ids && v.relation_types) throw new Error('Ambiguous relation selectors');
          for (const values of [v.node_ids, v.relation_ids ?? v.relation_types]) if (values.some(x=>typeof x!=='string')) throw new Error('Non-string view selector');
          view.nodeIds = v.node_ids.map(id=>endpoint(p,id));
          if (view.nodeIds.some(id=>!nodeIds.has(id))) throw new Error('View references missing node');
          if (v.relation_ids) {
            view.relationIds = v.relation_ids.map(id=>qualified(p.package_key,'relation',id));
            const known = new Set(relations.map(r=>r.id));
            if (view.relationIds.some(id=>!known.has(id))) throw new Error('View references missing relation');
          } else {
            const selected = new Set(view.nodeIds);
            view.relationIds = relations.filter(r=>r.packageKey===p.package_key && v.relation_types.includes(r.type) && (selected.has(r.source) || selected.has(r.target))).map(r=>r.id);
          }
        } catch (error) { view.error = error.message; }
        views.push(view);
      }
    }
  }
  return {schema:'workspace-ontology-v4/v1', authorityEffect:'none', head:exported.head,
    packages,nodes,relations,documents,views};
}
export async function readSnapshot({store = STORE} = {}) {
  const before = await readFile(`${store}/HEAD.json`, 'utf8');
  const manifest = JSON.parse(await readFile(`${V4}/source-manifest.json`, 'utf8'));
  const candidate = JSON.parse(await readFile(`${V4}/candidate.json`, 'utf8'));
  const ref = candidate.acceptance_material.find(r=>r.path.endsWith('/source-manifest.json'));
  if (!ref || sha(await readFile(`${V4}/source-manifest.json`)) !== ref.sha256) throw new Error('Manifest candidate drift');
  const {stdout} = await exec(`${V4}/target/release/cal-ontology-source-runtime`, ['export',store], {maxBuffer:128*1024*1024, timeout:60000});
  const after = await readFile(`${store}/HEAD.json`, 'utf8');
  const exported = parseLossless(stdout);
  if (before !== after || exported.head !== JSON.parse(after).digest) throw new Error('Runtime changed during read; refresh again');
  return adapt(manifest, exported);
}
