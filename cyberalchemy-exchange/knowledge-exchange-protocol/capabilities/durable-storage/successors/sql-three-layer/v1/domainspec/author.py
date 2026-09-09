#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent;FEATURE='sql-three-layer-recovery'
def write(path:Path,value:object):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,indent=2,sort_keys=True)+'\n')
NODES={
'knowledge-material-object':('Entity','Immutable encrypted object protected across recovery layers',['object_kind','byte_identity']),
'qualified-byte-identity':('Value Object','Domain-separated exact-byte identity shared by every representation',['domain','algorithm','version','digest']),
'failure-domain':('Value Object','Exact common-failure boundary for one layer realization',['failure_domain_id','dependencies']),
'operational-sql-layer':('Interface','Database-neutral normal read/write layer implemented by one SQL adapter',['put','get','delete']),
'recovery-journal-layer':('Interface','Append-only recovery event layer on a distinct SQL failure domain',['append','find']),
'immutable-archive-layer':('Interface','SQL-independent content-addressed immutable backup layer',['archive','load']),
'recovery-point':('Value Object','Deterministic recovery frontier and required object set',['policy_version','frontier','object_identities']),
'restore-candidate':('Entity','Untrusted bytes reconstructed from a recovery source',['source_layer','identity','bytes']),
'verified-restoration':('Event','Complete destination retrieval and exact verification for the closed object set',['destination','object_set','evidence_id']),
'recovery-evidence':('Entity','Bounded record of source, destination, policy, objects, results, and observation',['evidence_id','source','destination','policy','objects','result']),
'sql-portability-contract':('Interface','Database-neutral behavioral port separated from dialect adapters',['persist','retrieve','journal','restore']),
'recovery-policy':('Policy','Requires three distinct domains, ordered fallback, retention, and verification',['required_layers','recovery_order','verification']),
'immutable-backup-set':('Entity','Canonical manifest plus closed content-addressed encrypted object set',['manifest_identity','policy','objects']),
'postgresql-adapter':('Mapping','First SQL dialect realization of the portability contract',['driver','dialect','migration']),
'docker-test-environment':('Entity','Bounded local environment with independent PostgreSQL services and archive path',['image','services','volumes']),
'protection-input-contract':('Value Object','Closed input for three-layer protection',['object_kind','bytes','policy','layer_bindings']),
'recovery-evidence-contract':('Value Object','Closed evidence output for protection or restoration',['layers','domains','objects','verification','observation']),
'three-layer-obligations':('Rule','Pairwise domain distinction, exact identity closure, immutability, and verified restore are mandatory',['rule_ids']),
'protect-three-layers':('Operation','Write and verify operational SQL, journal, and immutable archive representations before success',['input','receipts']),
'recover-from-journal':('Operation','Reconstruct a candidate from journal and restore then verify operational SQL',['recovery_point','candidate','destination']),
'recover-from-archive':('Operation','Reconstruct a candidate from immutable archive when earlier layers cannot satisfy recovery',['backup_set','candidate','destination']),
'verify-restoration':('Operation','Retrieve destination bytes and verify complete identity and context closure',['candidate','destination','evidence']),
'protection-state':('State Machine','Protection progresses only after each required layer verifies',['unprotected','operational-written','journaled','archived','protected']),
'protection-complete':('Event','All three distinct layers verified the same object identity',['identity','domains']),
'restoration-verified':('Event','Destination object set retrieved and verified',['object_set','evidence']),
'recovery-failure':('Event','Typed recovery failure with no success promotion',['failure_kind','source','candidate']),
'durable-storage-recovery-capability':('Interface','SQL-portable three-layer protection and recovery boundary',['protect','recover','verify']),
'recovery-system-mapping':('Mapping','Projection from admitted business meaning into system roles',['business_ontology','system_ontology'])}
EDGES=[
('capability-exposes-protect','exposes','durable-storage-recovery-capability','protect-three-layers'),('capability-exposes-journal-recovery','exposes','durable-storage-recovery-capability','recover-from-journal'),('capability-exposes-archive-recovery','exposes','durable-storage-recovery-capability','recover-from-archive'),('capability-exposes-verify','exposes','durable-storage-recovery-capability','verify-restoration'),
('policy-applies-protect','applies','recovery-policy','protect-three-layers'),('policy-applies-journal-recovery','applies','recovery-policy','recover-from-journal'),('policy-applies-archive-recovery','applies','recovery-policy','recover-from-archive'),('obligations-enforce-protect','enforces','three-layer-obligations','protect-three-layers'),('obligations-enforce-verify','enforces','three-layer-obligations','verify-restoration'),
('protect-reads-input','reads','protect-three-layers','protection-input-contract'),('protect-writes-operational','writes','protect-three-layers','operational-sql-layer'),('protect-writes-journal','writes','protect-three-layers','recovery-journal-layer'),('protect-writes-archive','writes','protect-three-layers','immutable-archive-layer'),('protect-produces-complete','produces','protect-three-layers','protection-complete'),
('journal-recovery-produces-candidate','produces','recover-from-journal','restore-candidate'),('archive-recovery-produces-candidate','produces','recover-from-archive','restore-candidate'),('verify-produces-restored','produces','verify-restoration','restoration-verified'),('verify-produces-failure','produces','verify-restoration','recovery-failure'),
('postgres-maps-sql-contract','maps','postgresql-adapter','sql-portability-contract'),('docker-contains-postgres','contains','docker-test-environment','postgresql-adapter'),('archive-contains-backup-set','contains','immutable-archive-layer','immutable-backup-set'),('mapping-maps-capability','maps','recovery-system-mapping','durable-storage-recovery-capability')]
DEF_TARGETS=['protection-state','failure-domain','operational-sql-layer','recovery-journal-layer','immutable-archive-layer','recovery-point','restore-candidate','verified-restoration','recovery-evidence','sql-portability-contract','recovery-policy','immutable-backup-set']
ONTOLOGY_TARGETS={
'CA2-CAP-PROTECT-AND-RECOVER-ENCRYPTED-KNOWLEDGE-MATERIAL':['durable-storage-recovery-capability','protect-three-layers'],
'CA2-ACTOR-KEP-DST3-CONSUMER':['durable-storage-recovery-capability'],'CA2-ACTOR-KEP-DST3-RECOVERY-OPERATOR':['recovery-evidence'],
'CA2-KEP-DST3-KNOWLEDGE-MATERIAL-OBJECT':['knowledge-material-object'],'CA2-KEP-DST3-THREE-LAYER-PROTECTION':['protection-state'],'CA2-KEP-DST3-FAILURE-DOMAIN':['failure-domain'],'CA2-KEP-DST3-OPERATIONAL-SQL-LAYER':['operational-sql-layer'],'CA2-KEP-DST3-RECOVERY-JOURNAL-LAYER':['recovery-journal-layer'],'CA2-KEP-DST3-IMMUTABLE-ARCHIVE-LAYER':['immutable-archive-layer'],'CA2-KEP-DST3-RECOVERY-POINT':['recovery-point'],'CA2-KEP-DST3-RESTORE-CANDIDATE':['restore-candidate'],'CA2-KEP-DST3-VERIFIED-RESTORATION':['verified-restoration'],'CA2-KEP-DST3-RECOVERY-EVIDENCE':['recovery-evidence'],'CA2-KEP-DST3-SQL-PORTABILITY-CONTRACT':['sql-portability-contract'],'CA2-KEP-DST3-RECOVERY-POLICY':['recovery-policy'],'CA2-KEP-DST3-IMMUTABLE-BACKUP-SET':['immutable-backup-set'],'CA2-KEP-DST3-POSTGRESQL-ADAPTER':['postgresql-adapter'],'CA2-KEP-DST3-DOCKER-TEST-ENVIRONMENT':['docker-test-environment'],'CA2-CAP-CONTRACT-KEP-DST3-PROTECTION-INPUT':['protection-input-contract'],'CA2-CAP-CONTRACT-KEP-DST3-RECOVERY-EVIDENCE':['recovery-evidence-contract'],'CA2-CAP-POLICY-KEP-DST3-RECOVERY':['recovery-policy'],'CA2-CAP-OBLIGATIONS-KEP-DST3':['three-layer-obligations'],'CA2-OUT-KEP-DST3-PROTECTION-COMPLETE':['protection-complete'],'CA2-OUT-KEP-DST3-RESTORATION-VERIFIED':['restoration-verified'],'CA2-OUT-KEP-DST3-RECOVERY-FAILURE-BOUNDED':['recovery-failure']}
RULE_TARGETS=['three-layer-obligations','qualified-byte-identity','protection-state','recovery-journal-layer','immutable-archive-layer','restore-candidate','verify-restoration','sql-portability-contract','postgresql-adapter','recovery-failure','protection-input-contract','recovery-evidence']
PROOF_TARGETS=[['failure-domain','protect-three-layers'],['protect-three-layers','protection-complete'],['recover-from-journal','verify-restoration'],['recover-from-archive','verify-restoration'],['restore-candidate','recovery-failure'],['immutable-archive-layer','immutable-backup-set'],['sql-portability-contract'],['postgresql-adapter','docker-test-environment'],['recovery-evidence','recovery-evidence-contract']]
def main():
 ndir=ROOT/f'specs/{FEATURE}/nodes';edir=ROOT/f'specs/{FEATURE}/edges'
 for node,(kind,desc,fields) in NODES.items():write(ndir/f'{node}.json',{'schema_version':'domainspec.node/v1','node_id':node,'feature_id':FEATURE,'kind':kind,'body':{'description':desc,'fields':fields}})
 for eid,rel,src,tgt in EDGES:write(edir/f'{eid}.json',{'schema_version':'domainspec.edge/v1','edge_id':eid,'feature_id':FEATURE,'relationship':rel,'source_node_id':src,'target_node_id':tgt,'scope':'feature'})
 write(ROOT/'project.json',{'schema_version':'domainspec.project/v1','project_id':'knowledge-exchange-protocol','features':[FEATURE],'cross_feature_edges':[]})
 write(ROOT/f'specs/{FEATURE}/feature.json',{'schema_version':'domainspec.feature/v1','feature_id':FEATURE,'nodes':list(NODES),'edges':[e[0] for e in EDGES]})
 rules=json.loads((ROOT/'../ontology/rules.json').resolve().read_text())['rules'];proofs=json.loads((ROOT/'../ontology/proof-requirements.json').resolve().read_text())['proof_requirements']
 binding={'schema_version':'cav2-kep-dst3-domainspec-binding/v1','binding_id':'CA2-BINDING-KEP-DST3-DOMAINSPEC-001','lifecycle_status':'authored-candidate','route_id':'CA2-ROUTE-IMPLEMENT','ontology_id':'CA2-ONTOLOGY-KEP-DST-SQL-THREE-LAYER','feature_id':FEATURE,'predecessors':{'ontology_admission':{'path':'../decisions/ontology-admission-001.json','sha256':'d1c01721f3d4dfd0dfc63d5bd0393c111360029a442120673af3e142b799531e','material_digest':'9e53ca7eb812c6c6d5ca5816ed11e1da6b2b2c9e1279b329a9e83e0bc8eeca63'}},'definition_mappings':{f'DST3-D{i+1}':[target] for i,target in enumerate(DEF_TARGETS)},'ontology_node_mappings':ONTOLOGY_TARGETS,'ontology_rule_mappings':{r['rule_id']:RULE_TARGETS[i] for i,r in enumerate(rules)},'proof_requirement_mappings':{p['proof_id']:PROOF_TARGETS[i] for i,p in enumerate(proofs)},'authority_effect':'none','external_effect':'none','claim_limit':'Authored DomainSpec v2 source only; no compiled system, implementation, production topology, deployment, or external effect.'}
 write(ROOT/'binding.json',binding)
if __name__=='__main__':main()
