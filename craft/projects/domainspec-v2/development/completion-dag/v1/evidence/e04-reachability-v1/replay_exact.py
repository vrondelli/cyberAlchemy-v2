"""Successor replay check after correcting the source fixture, with original failure retained."""
import json
import campaign as c
import producer

def load(p):return json.loads(p.read_text())

def main():
    a=c.HERE/'positive-chain';b=c.HERE/'replay-exact'
    ah=load(a/'handle.json');bh=load(b/'handle.json')
    checks={}
    for role in ['positive_graph','negative_graph','identity_map','query','source_manifest','compiler_certificate']:
        checks[role+'-equal']=load(a/'transfer'/ah['body']['roles'][role])==load(b/'transfer'/bh['body']['roles'][role])
    ag=load(a/'trusted/compiled_graph.json');bg=load(b/'trusted/compiled_graph.json')
    checks['distinct-source-stores']=ag.pop('project_root')!=bg.pop('project_root')
    checks['compiled-graph-equal-except-location']=ag==bg
    ar=json.loads(load(c.HERE/'processes/positive-chain-consume.json')['stdout'])
    br=json.loads(load(c.HERE/'processes/replay-exact-consume.json')['stdout'])
    checks['condition-results-equal']=[(x['id'],x['result'],x['reason_code']) for x in ar['conditions']]==[(x['id'],x['result'],x['reason_code']) for x in br['conditions']]
    raw_names=lambda h:{h['body']['roles'][k] for k in ['positive_raw_1','positive_raw_2','negative_raw_1','negative_raw_2']}
    checks['disjoint-native-records']=raw_names(ah).isdisjoint(raw_names(bh))
    checks['native-runs-passed']=all(load(p/'trusted/run-result.json')['status']=='passed' for p in [a,b])
    c.save(c.HERE/'semantic-replay-exact.json',{'id':'native-exact-source-replay','test_result':'PASS' if all(checks.values()) else 'BLOCK','checks':checks,
        'prior_failure':{'path':'semantic-replay.json','sha256':producer.sha((c.HERE/'semantic-replay.json').read_bytes())},
        'repair':'Fresh replay from byte-identical authored sources; no weakened provenance comparison or candidate source change',
        'claim_ceiling':'Same-host independent source/evidence stores and native/consumer processes; no cross-host claim',
        'authority_effect':'none'})
    print(checks)

if __name__=='__main__':main()
