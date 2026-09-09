#!/usr/bin/env python3
"""Author the two zero-authority Essays agent-runtime ontology candidates."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[5]
AUTH = REPO / "cyberAlchemy-v2/essays/capabilities/agent-runtime/authority-ontology"
ARCH = REPO / "cyberAlchemy-v2/essays/development/agent-runtime/architecture-properties"


def enc(value):
    return json.dumps(value, indent=2, sort_keys=True) + "\n"


def source(source_id, path, selectors):
    data = (REPO / path).read_bytes()
    return {"source_id": source_id, "path": path, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "selectors": selectors, "authority_effect": "none"}


def node(i, label, role, meaning):
    return {"id": i, "label": label, "role": role, "meaning": meaning, "authority_effect": "none"}


def rel(i, kind, src, dst, meaning):
    return {"id": i, "type": kind, "source": src, "target": dst, "meaning": meaning, "authority_effect": "none"}


VALIDATOR = '''#!/usr/bin/env python3
import hashlib,json
from pathlib import Path
p=Path(__file__).resolve().parent.parent
repo=p.parents[4]
profile=json.loads((p/'PROFILE.json').read_text())
sources=json.loads((p/'SOURCES.json').read_text())['sources']
errors=[]
for s in sources:
 q=repo/s['path']
 if not q.is_file() or hashlib.sha256(q.read_bytes()).hexdigest()!=s['sha256'] or q.stat().st_size!=s['size_bytes']:
  errors.append('source-drift:'+s['source_id']); continue
 text=q.read_text()
 for selector in s['selectors']:
  if selector not in text: errors.append('selector-missing:'+s['source_id']+':'+selector)
files=profile['material_files']
records={name:json.loads((p/name).read_text()) for name in files if name.endswith('.json')}
def walk(v):
 if isinstance(v,dict):
  return all((k!='authority_effect' or x=='none') and walk(x) for k,x in v.items())
 if isinstance(v,list): return all(walk(x) for x in v)
 return True
if not all(walk(v) for v in records.values()): errors.append('authority-effect')
if 'NODES.json' in records:
 ids={x['id'] for x in records['NODES.json']['nodes']}
 for r in records['RELATIONS.json']['relations']:
  if r['source'] not in ids or r['target'] not in ids: errors.append('relation-endpoint:'+r['id'])
 for v in records['VIEWS.json']['views']:
  if not set(v['node_ids'])<=ids: errors.append('view-node:'+v['view_id'])
if 'ELEMENT-TYPES.json' in records:
 types={x['type_id'] for x in records['ELEMENT-TYPES.json']['element_types']}
 props={x['property_id'] for x in records['PROPERTIES.json']['properties']}
 for c in records['CONSTRAINTS.json']['constraints']:
  if c['subject_type'] not in types or c['property_ref'] not in props: errors.append('constraint-ref:'+c['constraint_id'])
h=hashlib.sha256()
for name in sorted(files): h.update(name.encode()+b'\\0'+(p/name).read_bytes()+b'\\0')
out={'schema_version':'cav2.essays.ontology.validation/v1','ontology_id':profile['ontology_id'],'overall':'BLOCK' if errors else 'PASS','material_digest':h.hexdigest(),'source_count':len(sources),'errors':errors,'authority_effect':'none','claim_ceiling':'Structurally validated private candidate only; no admission, implementation, conformance, merge, release, deployment, or external effect.'}
print(json.dumps(out,indent=2,sort_keys=True))
raise SystemExit(1 if errors else 0)
'''


def write_package(root, files):
    root.mkdir(parents=True, exist_ok=True)
    (root / "scripts").mkdir(exist_ok=True)
    (root / "schemas").mkdir(exist_ok=True)
    files["scripts/validate.py"] = VALIDATOR
    files["schemas/ontology.schema.json"] = enc({"$schema": "https://json-schema.org/draft/2020-12/schema", "title": "Essays candidate ontology package", "type": "object"})
    profile = json.loads(files["PROFILE.json"])
    profile["material_files"] = sorted(files)
    files["PROFILE.json"] = enc(profile)
    for name, text in files.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)


authority_sources = [
    source("SRC-OBLIGATIONS", "cyberAlchemy-v2/essays/capabilities/agent-runtime/obligations/agent-runtime.obligations.json", ["CAP-OBL-ESSAYS-AR-014-CAPABILITY-DENY-DEFAULT", "CAP-OBL-ESSAYS-AR-018-SECRET-HANDLES"]),
    source("SRC-AUTH-PAIRING-DPOP", "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-remote-authentication/selection.json", ["OPT-AUTH-PAIRING-DPOP"]),
    source("SRC-AUTH-SCOPED-LEASES", "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-remote-capabilities/selection.json", ["OPT-REMOTE-CAP-SCOPED-LEASES"]),
    source("SRC-AUTH-BROWSER-GRANTS", "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-browser-effect-policy/selection.json", ["OPT-BROWSER-EFFECT-SCOPED-GRANTS"]),
    source("SRC-APPROVAL-TIMING", "cyberAlchemy-v2/goals/projects/essays/decisions/essays-writing-capability-ontology/selection.json", ["exact-pre-merge-candidate"]),
]
authority_nodes = [
    node("AUTH-WORK-OWNER", "Work Owner", "actor", "The only actor that may accept editorial proposals or grant scoped effects."),
    node("AUTH-RUNTIME-ACTOR", "Authenticated Runtime Actor", "actor", "An identified local or remote actor; authentication alone grants no authority."),
    node("AUTH-GRANT", "Scoped Grant", "authority", "A deny-by-default operation grant bound to owner, actor, target, scope, and expiry."),
    node("AUTH-LEASE", "Capability Lease", "authority", "A revocable, expiring remote capability derived from a scoped grant."),
    node("AUTH-PROPOSAL", "Agent Proposal", "proposal", "Non-mutating content offered for Work Owner disposition."),
    node("AUTH-EFFECT-ENVELOPE", "Effect Envelope", "effect", "The complete authorization and replay boundary for one potentially external action."),
    node("AUTH-BROWSER-ACTION", "Browser Action Request", "effect", "A supervised browser operation proposed inside an effect envelope."),
    node("AUTH-CREDENTIAL-HANDLE", "Protected Credential Handle", "secret", "An opaque scoped reference that prevents credentials entering ordinary content or evidence."),
    node("AUTH-EFFECT-RECEIPT", "Effect Receipt", "evidence", "A provenance-bound certain, failed, or uncertain effect outcome."),
    node("AUTH-UNCERTAIN-EFFECT", "Uncertain Effect", "state", "An ambiguous dispatched effect that prohibits implicit retry until reconciliation."),
    node("AUTH-REVOCATION", "Revocation", "authority", "An owner action that invalidates a grant or lease before expiry."),
]
authority_relations = [
    rel("AUTH-R01", "issues", "AUTH-WORK-OWNER", "AUTH-GRANT", "The Work Owner issues the scoped grant."),
    rel("AUTH-R02", "constrains", "AUTH-GRANT", "AUTH-RUNTIME-ACTOR", "The grant constrains one authenticated actor."),
    rel("AUTH-R03", "derives", "AUTH-GRANT", "AUTH-LEASE", "A remote lease derives no authority beyond its grant."),
    rel("AUTH-R04", "produces", "AUTH-RUNTIME-ACTOR", "AUTH-PROPOSAL", "An actor may produce a non-mutating proposal."),
    rel("AUTH-R05", "envelopes", "AUTH-EFFECT-ENVELOPE", "AUTH-BROWSER-ACTION", "Every browser action is enclosed by an exact effect boundary."),
    rel("AUTH-R06", "requires", "AUTH-EFFECT-ENVELOPE", "AUTH-GRANT", "An external effect requires a current scoped grant."),
    rel("AUTH-R07", "references", "AUTH-EFFECT-ENVELOPE", "AUTH-CREDENTIAL-HANDLE", "Effects reference secrets only through protected handles."),
    rel("AUTH-R08", "produces", "AUTH-BROWSER-ACTION", "AUTH-EFFECT-RECEIPT", "Dispatch produces an effect receipt."),
    rel("AUTH-R09", "may_become", "AUTH-EFFECT-RECEIPT", "AUTH-UNCERTAIN-EFFECT", "Ambiguous dispatch is preserved as uncertain."),
    rel("AUTH-R10", "invalidates", "AUTH-REVOCATION", "AUTH-GRANT", "Revocation invalidates the grant."),
    rel("AUTH-R11", "invalidates", "AUTH-REVOCATION", "AUTH-LEASE", "Revocation invalidates derived leases."),
]
authority_views = [
    {"view_id": "actor-and-grant", "node_ids": ["AUTH-WORK-OWNER","AUTH-RUNTIME-ACTOR","AUTH-GRANT","AUTH-LEASE","AUTH-REVOCATION"]},
    {"view_id": "proposal-and-acceptance", "node_ids": ["AUTH-WORK-OWNER","AUTH-RUNTIME-ACTOR","AUTH-PROPOSAL"]},
    {"view_id": "browser-effect-envelope", "node_ids": ["AUTH-WORK-OWNER","AUTH-GRANT","AUTH-EFFECT-ENVELOPE","AUTH-BROWSER-ACTION","AUTH-EFFECT-RECEIPT"]},
    {"view_id": "credential-boundary", "node_ids": ["AUTH-EFFECT-ENVELOPE","AUTH-CREDENTIAL-HANDLE"]},
    {"view_id": "revocation-and-expiry", "node_ids": ["AUTH-GRANT","AUTH-LEASE","AUTH-REVOCATION"]},
    {"view_id": "uncertain-effect-reconciliation", "node_ids": ["AUTH-BROWSER-ACTION","AUTH-EFFECT-RECEIPT","AUTH-UNCERTAIN-EFFECT","AUTH-WORK-OWNER"]},
]
for v in authority_views:
    v["relation_ids"] = [r["id"] for r in authority_relations if r["source"] in v["node_ids"] and r["target"] in v["node_ids"]]
    v["authority_effect"] = "none"
write_package(AUTH, {
    "PROFILE.json": enc({"schema_version":"cav2.essays.agent-runtime.authority-ontology.profile/v1","ontology_id":"cav2.essays.agent-runtime.authority-governance.v1","ontology_type":"authority-governance","branch":"business","status":"candidate-development-pre-merge-approval-pending","package_owner":"Essays Project owner","visibility":"private","authority_effect":"none"}),
    "SOURCES.json": enc({"schema_version":"cav2.essays.agent-runtime.authority-ontology.sources/v1","sources":authority_sources,"authority_effect":"none"}),
    "NODES.json": enc({"nodes":authority_nodes,"authority_effect":"none"}),
    "RELATIONS.json": enc({"relations":authority_relations,"authority_effect":"none"}),
    "VIEWS.json": enc({"views":authority_views,"authority_effect":"none"}),
    "RESIDUE.json": enc({"residue":[{"residue_id":"AUTH-RES-001","status":"open","statement":"Security-owner gates on pairing, remote leases, browser effects, credentials, and signed manifests remain pending before corresponding effects.","authority_effect":"none"},{"residue_id":"AUTH-RES-002","status":"open","statement":"No runtime enforcement or hostile conformance evidence exists.","authority_effect":"none"}],"authority_effect":"none"}),
    "README.md": "# Essays Agent-runtime Authority/Security Ontology\n\nZero-authority candidate defining grants, leases, proposals, effect envelopes, protected credentials, revocation, expiry, and uncertain-effect reconciliation. Candidate authoring does not satisfy pending security/effect-owner gates. Owner approval is due only for the exact pre-merge candidate.\n",
})

architecture_sources = [
    source("SRC-OBLIGATIONS", "cyberAlchemy-v2/essays/capabilities/agent-runtime/obligations/agent-runtime.obligations.json", ["CAP-OBL-ESSAYS-AR-002-SINGLE-AUTHORITY", "CAP-OBL-ESSAYS-AR-019-BOUNDED-RESOURCES"]),
    source("SRC-RUNTIME-BUDGET", "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-performance-budgets/selection.json", ["OPT-RUNTIME-BUDGET-LEAN-INTERACTIVE"]),
    source("SRC-BROWSER-BUDGET", "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-browser-budgets/selection.json", ["OPT-BROWSER-BUDGET-LEAN-CONTROLLED"]),
    source("SRC-PROCESS-TOPOLOGY", "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-process-topology/selection.json", ["OPT-PT-SERVICE-DAEMON"]),
    source("SRC-STORAGE", "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-storage/selection.json", ["OPT-ST-SQLITE"]),
]
types = [{"type_id":x,"label":y,"authority_effect":"none"} for x,y in [("ARCH-SEMANTIC-KERNEL","Semantic kernel"),("ARCH-APPLICATION-SERVICE","Application service"),("ARCH-DURABLE-STORE","Durable store"),("ARCH-CLIENT-ADAPTER","Client adapter"),("ARCH-EFFECT-SUPERVISOR","Effect supervisor"),("ARCH-EXTENSION-HOST","Extension host")]]
properties = [{"property_id":i,"label":l,"value_type":t,"authority_effect":"none"} for i,l,t in [
    ("PROP-SINGLE-WRITER","Single accepted-state writer","boolean"),("PROP-DETERMINISTIC-REDUCER","Deterministic transition reduction","boolean"),("PROP-EXPECTED-REVISION","Expected revision enforcement","boolean"),("PROP-DURABLE-BEFORE-ACK","Durable before acknowledgement","boolean"),("PROP-IDEMPOTENT-REPLAY","Idempotent request replay","boolean"),("PROP-CLIENT-PARITY","Transport-neutral client parity","boolean"),("PROP-DENY-DEFAULT","Default-deny capabilities","boolean"),("PROP-UNCERTAIN-EFFECT","Explicit uncertain-effect state","boolean"),("PROP-REPLACEABLE-ADAPTERS","Replaceable adapters","boolean"),("PROP-LEAN-INTERACTIVE-BUDGET","Lean interactive resource budget","budget"),("PROP-LEAN-BROWSER-BUDGET","Lean controlled browser budget","budget")]]
constraints_data = [
    ("CON-SINGLE-WRITER","ARCH-SEMANTIC-KERNEL","PROP-SINGLE-WRITER","true"),("CON-DETERMINISM","ARCH-SEMANTIC-KERNEL","PROP-DETERMINISTIC-REDUCER","true"),("CON-REVISION","ARCH-APPLICATION-SERVICE","PROP-EXPECTED-REVISION","true"),("CON-DURABILITY","ARCH-DURABLE-STORE","PROP-DURABLE-BEFORE-ACK","true"),("CON-IDEMPOTENCY","ARCH-APPLICATION-SERVICE","PROP-IDEMPOTENT-REPLAY","true"),("CON-PARITY","ARCH-CLIENT-ADAPTER","PROP-CLIENT-PARITY","true"),("CON-DENY","ARCH-EXTENSION-HOST","PROP-DENY-DEFAULT","true"),("CON-UNCERTAIN","ARCH-EFFECT-SUPERVISOR","PROP-UNCERTAIN-EFFECT","true"),("CON-REPLACEABLE","ARCH-CLIENT-ADAPTER","PROP-REPLACEABLE-ADAPTERS","true"),("CON-RUNTIME-BUDGET","ARCH-APPLICATION-SERVICE","PROP-LEAN-INTERACTIVE-BUDGET","selected-profile"),("CON-BROWSER-BUDGET","ARCH-EFFECT-SUPERVISOR","PROP-LEAN-BROWSER-BUDGET","selected-profile")]
constraints=[{"constraint_id":i,"subject_type":s,"property_ref":p,"operator":"equals","expected_value":v,"on_unknown":"unsupported","authority_effect":"none"} for i,s,p,v in constraints_data]
views=[{"view_id":v,"constraint_ids":ids,"authority_effect":"none"} for v,ids in [("semantic-consistency",["CON-SINGLE-WRITER","CON-DETERMINISM","CON-REVISION"]),("durability-and-replay",["CON-DURABILITY","CON-IDEMPOTENCY"]),("client-parity",["CON-PARITY"]),("capability-isolation",["CON-DENY"]),("effect-safety",["CON-UNCERTAIN"]),("replaceability",["CON-REPLACEABLE"]),("performance-budgets",["CON-RUNTIME-BUDGET","CON-BROWSER-BUDGET"])]]
write_package(ARCH, {
    "PROFILE.json": enc({"schema_version":"cav2.essays.agent-runtime.architecture-properties.profile/v1","ontology_id":"cav2.essays.agent-runtime.architecture-properties.v1","ontology_type":"architecture-property","branch":"system","status":"candidate-development-pre-merge-approval-pending","package_owner":"Essays runtime owner","visibility":"private","authority_effect":"none"}),
    "SOURCES.json": enc({"schema_version":"cav2.essays.agent-runtime.architecture-properties.sources/v1","sources":architecture_sources,"authority_effect":"none"}),
    "ELEMENT-TYPES.json": enc({"element_types":types,"authority_effect":"none"}),
    "PROPERTIES.json": enc({"properties":properties,"authority_effect":"none"}),
    "CONSTRAINTS.json": enc({"constraints":constraints,"authority_effect":"none"}),
    "OBSERVATION-PROJECTIONS.json": enc({"projections":[],"authority_effect":"none","claim_limit":"No implementation observations exist before implementation."}),
    "VIEWS.json": enc({"views":views,"authority_effect":"none"}),
    "RESIDUE.json": enc({"residue":[{"residue_id":"ARCH-RES-001","status":"open","statement":"Negative fixtures and implementation observations do not exist yet.","authority_effect":"none"},{"residue_id":"ARCH-RES-002","status":"open","statement":"Selected budgets are candidate constraints, not measured runtime performance.","authority_effect":"none"}],"authority_effect":"none"}),
    "README.md": "# Essays Agent-runtime Architecture Properties\n\nCandidate architecture-property ontology for semantic consistency, durability and replay, client parity, capability isolation, effect safety, replaceability, and selected resource budgets. Empty observation projections preserve the pre-implementation evidence boundary.\n",
})
print(AUTH)
print(ARCH)
