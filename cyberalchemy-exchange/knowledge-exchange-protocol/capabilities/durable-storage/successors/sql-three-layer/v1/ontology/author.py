#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
def sha(p:Path)->str: return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name:str,value:object)->None:
    p=ROOT/name; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(value,indent=2,sort_keys=True)+'\n')

NODES=[
('CA2-CAP-PROTECT-AND-RECOVER-ENCRYPTED-KNOWLEDGE-MATERIAL','Three-Layer Protection And Recovery Capability','product-capability'),
('CA2-ACTOR-KEP-DST3-CONSUMER','Durable Storage Consumer','actor'),
('CA2-ACTOR-KEP-DST3-RECOVERY-OPERATOR','Recovery Operator','actor'),
('CA2-KEP-DST3-KNOWLEDGE-MATERIAL-OBJECT','Protected Knowledge Material Object','business-object'),
('CA2-KEP-DST3-THREE-LAYER-PROTECTION','Three-Layer Protection','business-state'),
('CA2-KEP-DST3-FAILURE-DOMAIN','Failure Domain','value-object'),
('CA2-KEP-DST3-OPERATIONAL-SQL-LAYER','Operational SQL Layer','system-role'),
('CA2-KEP-DST3-RECOVERY-JOURNAL-LAYER','Recovery Journal Layer','system-role'),
('CA2-KEP-DST3-IMMUTABLE-ARCHIVE-LAYER','Immutable Archive Layer','system-role'),
('CA2-KEP-DST3-RECOVERY-POINT','Recovery Point','value-object'),
('CA2-KEP-DST3-RESTORE-CANDIDATE','Restore Candidate','candidate-evidence'),
('CA2-KEP-DST3-VERIFIED-RESTORATION','Verified Restoration','business-outcome'),
('CA2-KEP-DST3-RECOVERY-EVIDENCE','Recovery Evidence','evidence'),
('CA2-KEP-DST3-SQL-PORTABILITY-CONTRACT','SQL Portability Contract','contract'),
('CA2-KEP-DST3-RECOVERY-POLICY','Recovery Policy','policy'),
('CA2-KEP-DST3-IMMUTABLE-BACKUP-SET','Immutable Backup Set','business-object'),
('CA2-KEP-DST3-POSTGRESQL-ADAPTER','PostgreSQL Adapter','realization'),
('CA2-KEP-DST3-DOCKER-TEST-ENVIRONMENT','Docker Test Environment','environment'),
('CA2-CAP-CONTRACT-KEP-DST3-PROTECTION-INPUT','Protection Input Contract','contract'),
('CA2-CAP-CONTRACT-KEP-DST3-RECOVERY-EVIDENCE','Recovery Evidence Contract','contract'),
('CA2-CAP-POLICY-KEP-DST3-RECOVERY','Recovery Context Policy','policy'),
('CA2-CAP-OBLIGATIONS-KEP-DST3','Three-Layer Recovery Obligations','obligation-registry'),
('CA2-OUT-KEP-DST3-PROTECTION-COMPLETE','Protection Complete','outcome'),
('CA2-OUT-KEP-DST3-RESTORATION-VERIFIED','Restoration Verified','outcome'),
('CA2-OUT-KEP-DST3-RECOVERY-FAILURE-BOUNDED','Recovery Failure Bounded','outcome')]

REL=[
('DST3-REL-CAP-PROTECTS','CA2-CAP-PROTECT-AND-RECOVER-ENCRYPTED-KNOWLEDGE-MATERIAL','protects','CA2-KEP-DST3-KNOWLEDGE-MATERIAL-OBJECT'),
('DST3-REL-PROTECTION-REQUIRES-OP','CA2-KEP-DST3-THREE-LAYER-PROTECTION','requires','CA2-KEP-DST3-OPERATIONAL-SQL-LAYER'),
('DST3-REL-PROTECTION-REQUIRES-JOURNAL','CA2-KEP-DST3-THREE-LAYER-PROTECTION','requires','CA2-KEP-DST3-RECOVERY-JOURNAL-LAYER'),
('DST3-REL-PROTECTION-REQUIRES-ARCHIVE','CA2-KEP-DST3-THREE-LAYER-PROTECTION','requires','CA2-KEP-DST3-IMMUTABLE-ARCHIVE-LAYER'),
('DST3-REL-OP-FAILURE-DOMAIN','CA2-KEP-DST3-OPERATIONAL-SQL-LAYER','belongs-to','CA2-KEP-DST3-FAILURE-DOMAIN'),
('DST3-REL-JOURNAL-FAILURE-DOMAIN','CA2-KEP-DST3-RECOVERY-JOURNAL-LAYER','belongs-to','CA2-KEP-DST3-FAILURE-DOMAIN'),
('DST3-REL-ARCHIVE-FAILURE-DOMAIN','CA2-KEP-DST3-IMMUTABLE-ARCHIVE-LAYER','belongs-to','CA2-KEP-DST3-FAILURE-DOMAIN'),
('DST3-REL-OP-IMPLEMENTS-SQL','CA2-KEP-DST3-OPERATIONAL-SQL-LAYER','implements','CA2-KEP-DST3-SQL-PORTABILITY-CONTRACT'),
('DST3-REL-JOURNAL-IMPLEMENTS-SQL','CA2-KEP-DST3-RECOVERY-JOURNAL-LAYER','implements','CA2-KEP-DST3-SQL-PORTABILITY-CONTRACT'),
('DST3-REL-POSTGRES-REALIZES-SQL','CA2-KEP-DST3-POSTGRESQL-ADAPTER','realizes','CA2-KEP-DST3-SQL-PORTABILITY-CONTRACT'),
('DST3-REL-DOCKER-HOSTS-POSTGRES','CA2-KEP-DST3-DOCKER-TEST-ENVIRONMENT','hosts','CA2-KEP-DST3-POSTGRESQL-ADAPTER'),
('DST3-REL-ARCHIVE-CONTAINS-SET','CA2-KEP-DST3-IMMUTABLE-ARCHIVE-LAYER','contains','CA2-KEP-DST3-IMMUTABLE-BACKUP-SET'),
('DST3-REL-JOURNAL-BOUNDS-POINT','CA2-KEP-DST3-RECOVERY-JOURNAL-LAYER','bounds','CA2-KEP-DST3-RECOVERY-POINT'),
('DST3-REL-POINT-SELECTS-CANDIDATE','CA2-KEP-DST3-RECOVERY-POINT','selects','CA2-KEP-DST3-RESTORE-CANDIDATE'),
('DST3-REL-CANDIDATE-MAY-PRODUCE','CA2-KEP-DST3-RESTORE-CANDIDATE','may-produce','CA2-KEP-DST3-VERIFIED-RESTORATION'),
('DST3-REL-RESTORATION-PRODUCES-EVIDENCE','CA2-KEP-DST3-VERIFIED-RESTORATION','produces','CA2-KEP-DST3-RECOVERY-EVIDENCE'),
('DST3-REL-POLICY-GOVERNS-PROTECTION','CA2-KEP-DST3-RECOVERY-POLICY','governs','CA2-KEP-DST3-THREE-LAYER-PROTECTION'),
('DST3-REL-POLICY-GOVERNS-RESTORATION','CA2-KEP-DST3-RECOVERY-POLICY','governs','CA2-KEP-DST3-VERIFIED-RESTORATION'),
('DST3-REL-CAP-PRODUCES-COMPLETE','CA2-CAP-PROTECT-AND-RECOVER-ENCRYPTED-KNOWLEDGE-MATERIAL','produces','CA2-OUT-KEP-DST3-PROTECTION-COMPLETE'),
('DST3-REL-CAP-PRODUCES-RESTORED','CA2-CAP-PROTECT-AND-RECOVER-ENCRYPTED-KNOWLEDGE-MATERIAL','produces','CA2-OUT-KEP-DST3-RESTORATION-VERIFIED'),
('DST3-REL-CAP-PRODUCES-FAILURE','CA2-CAP-PROTECT-AND-RECOVER-ENCRYPTED-KNOWLEDGE-MATERIAL','produces','CA2-OUT-KEP-DST3-RECOVERY-FAILURE-BOUNDED')]

RULES=[
('DST3-RULE-THREE-DISTINCT-DOMAINS','Protection completes only when all three required layers have pairwise-distinct failure-domain identities.'),
('DST3-RULE-IDENTITY-CLOSURE','Every layer representation verifies to the same qualified byte identity.'),
('DST3-RULE-OPERATIONAL-NOT-BACKUP','Operational SQL success alone never establishes backup or recovery readiness.'),
('DST3-RULE-JOURNAL-APPEND-ONLY','Recovery journal events are immutable and append-only.'),
('DST3-RULE-ARCHIVE-IMMUTABLE','Archive objects and manifests are content-addressed and never overwritten.'),
('DST3-RULE-CANDIDATE-NOT-RESTORED','A restore candidate is never a verified restoration.'),
('DST3-RULE-VERIFY-DESTINATION','Restoration requires destination retrieval and exact verification for the closed object set.'),
('DST3-RULE-SQL-DIALECT-OUTSIDE-IDENTITY','Database dialect, placeholders, binary types, adapter, and connection protocol never enter object identity.'),
('DST3-RULE-POSTGRES-FIRST-NOT-ONLY','PostgreSQL is the first conforming adapter and cannot become the SQL portability contract.'),
('DST3-RULE-FAILURE-NO-PROMOTION','Any missing layer, shared failure domain, mismatch, incomplete set, or unavailable source yields typed failure and no success.'),
('DST3-RULE-SECRETS-EXCLUDED','Plaintext, unwrapped keys, private keys, and credentials are excluded from every layer and evidence record.'),
('DST3-RULE-EVIDENCE-BOUNDED','Protection and recovery claims are bounded to exact realizations, policies, failure domains, object sets, and observation intervals.')]

PROOFS=[
('DST3-PROOF-THREE-DOMAIN-CLOSURE','Show shared failure-domain identities are rejected.'),
('DST3-PROOF-EXACT-THREE-LAYER-WRITE','Show one protection operation writes and verifies the same object identity in all layers.'),
('DST3-PROOF-PRIMARY-RECOVERY','Show operational loss recovers from the journal and verifies the destination.'),
('DST3-PROOF-JOURNAL-FALLBACK','Show operational and journal loss recovers from the immutable archive.'),
('DST3-PROOF-CORRUPTION-REJECTED','Show corrupt candidates never produce restoration success.'),
('DST3-PROOF-ARCHIVE-IMMUTABILITY','Show an existing archive identity cannot be overwritten with changed bytes.'),
('DST3-PROOF-SQL-PORTABILITY','Show core orchestration depends only on database-neutral ports.'),
('DST3-PROOF-POSTGRES-INTEGRATION','Show independent PostgreSQL operational and journal services satisfy their adapter contracts.'),
('DST3-PROOF-RESTORE-EVIDENCE-BOUND','Show recovery evidence binds source, destination, policy, object set, and observation.')]

def main()->None:
    sources=[]
    for source_id,rel,posture in [
      ('DST3-SRC-DEFINITIONS','../definitions/DEFINITIONS.md','accepted-successor-definitions'),
      ('DST3-SRC-DEFINITION-ACCEPTANCE','../decisions/definition-acceptance-001.json','owner-decision'),
      ('DST3-SRC-PRODUCT-CAPABILITY','../product-capability.json','adopted-capability'),
      ('DST3-SRC-PRODUCT-CAPABILITY-ADOPTION','../decisions/product-capability-adoption-001.json','owner-decision'),
      ('DST3-SRC-V1-CONFORMANCE','../../../../runtime/conformance-receipt.json','accepted-predecessor-evidence')]:
        p=(ROOT/rel).resolve(); sources.append({'source_id':source_id,'path':rel,'sha256':sha(p),'posture':posture})
    write('profile.json',{'schema_version':'cav2-kep-dst3-business-ontology-profile/v1','ontology_id':'CA2-ONTOLOGY-KEP-DST-SQL-THREE-LAYER','ontology_type':'business-domain','branch':'business','lifecycle_status':'authored-candidate','authority_effect':'none','external_effect':'none'})
    write('sources.json',{'schema_version':'cav2-kep-dst3-ontology-sources/v1','sources':sources})
    definition_targets=[
      'CA2-KEP-DST3-THREE-LAYER-PROTECTION','CA2-KEP-DST3-FAILURE-DOMAIN',
      'CA2-KEP-DST3-OPERATIONAL-SQL-LAYER','CA2-KEP-DST3-RECOVERY-JOURNAL-LAYER',
      'CA2-KEP-DST3-IMMUTABLE-ARCHIVE-LAYER','CA2-KEP-DST3-RECOVERY-POINT',
      'CA2-KEP-DST3-RESTORE-CANDIDATE','CA2-KEP-DST3-VERIFIED-RESTORATION',
      'CA2-KEP-DST3-RECOVERY-EVIDENCE','CA2-KEP-DST3-SQL-PORTABILITY-CONTRACT',
      'CA2-KEP-DST3-RECOVERY-POLICY','CA2-KEP-DST3-IMMUTABLE-BACKUP-SET']
    write('definition-bindings.json',{'schema_version':'cav2-kep-dst3-definition-bindings/v1','bindings':[{'definition_id':f'DST3-D{i+1}','ontology_node_ids':[target]} for i,target in enumerate(definition_targets)]})
    write('nodes.json',{'schema_version':'cav2-kep-dst3-ontology-nodes/v1','nodes':[{'id':i,'label':l,'role':r,'authority_effect':'none'} for i,l,r in NODES]})
    write('relations.json',{'schema_version':'cav2-kep-dst3-ontology-relations/v1','relations':[{'relation_id':i,'source':s,'relationship':r,'target':t} for i,s,r,t in REL]})
    write('rules.json',{'schema_version':'cav2-kep-dst3-ontology-rules/v1','rules':[{'rule_id':i,'statement':s,'enforcement_state':'candidate'} for i,s in RULES]})
    write('proof-requirements.json',{'schema_version':'cav2-kep-dst3-proof-requirements/v1','proof_requirements':[{'proof_id':i,'statement':s,'evidence_state':'not_evaluable'} for i,s in PROOFS]})
    write('premises.json',{'schema_version':'cav2-kep-dst3-premises/v1','premises':[{'premise_id':'DST3-PREMISE-SQL-ADAPTERS-POSSIBLE','statement':'Multiple SQL dialect adapters can realize one behavior contract without entering object identity.','status':'working-candidate'},{'premise_id':'DST3-PREMISE-LOCAL-DOCKER-EVIDENCE','statement':'Two Docker PostgreSQL services and a host archive can provide bounded local evidence for distinct declared failure domains.','status':'working-candidate'}]})
    write('residue.json',{'schema_version':'cav2-kep-dst3-residue/v1','residue':[{'residue_id':'DST3-RES-PRODUCTION-TOPOLOGY','status':'open'},{'residue_id':'DST3-RES-RPO-RTO','status':'open'},{'residue_id':'DST3-RES-INDEPENDENT-SECURITY-REVIEW','status':'open'}]})

if __name__=='__main__': main()
