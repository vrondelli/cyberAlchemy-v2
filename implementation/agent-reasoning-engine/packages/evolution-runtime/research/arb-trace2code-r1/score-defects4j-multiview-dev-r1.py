#!/usr/bin/env python3
"""Post-seal exposed mapped-file reach comparison; no new model accuracy.

Open Questions: G01-DEFECTS4J-MULTIVIEW-DEV-R1.md.
"""
import json
from hashlib import sha256
from pathlib import Path
import sys

BASE=Path('/home/vlad_/are-benchmark-archive')
def digest(p):return sha256(p.read_bytes()).hexdigest()

def main(screen_path,output):
    assert not output.exists()
    screen=json.loads(screen_path.read_bytes());assert len(screen['cases'])==62
    configs={'r3':('defects4j-caller-dev-r1','defects4j-buggy-source-32-r3','defects4j-trigger-supply-r3/SOURCE-ORDER-32.json',32),
             'r4':('defects4j-caller-r4','defects4j-buggy-source-30-r4','defects4j-trigger-supply-r4/SOURCE-ORDER-30.json',30)}
    contexts={}
    for name,(r,t,m,n) in configs.items():
        root=BASE/r;trees=BASE/t
        assert digest(root/'PACKETS.jsonl')==screen['cohort_packet_sha256'][name]
        score=json.loads((root/'SCORE.json').read_bytes())
        manifest=json.loads((BASE/m).read_bytes());cases={c['case_id']:c for c in manifest['cases']}
        assert len(cases)==n
        contexts[name]=(root,trees,score,cases)
    rows=[];mapping_failures=[]
    assert len({c['case_id'] for c in screen['cases']})==62
    for c in screen['cases']:
        root,trees,score,cases=contexts[c['cohort']];cid=c['case_id'];case=cases[cid]
        label=BASE/'defects4j-metadata-v3.0.1/framework/projects'/case['project']/'modified_classes'/f"{case['bug_id']}.src"
        assert digest(label)==score['gold_label_sha256'][cid]
        tracked=(trees/f'{cid}.paths').read_text().splitlines();gold=set();unmapped=0
        for cls in label.read_text().splitlines():
            if not cls.strip():continue
            suffix=cls.strip().split('$',1)[0].replace('.','/')+'.java'
            matches=[p for p in tracked if p==suffix or p.endswith('/'+suffix)]
            if len(matches)!=1:
                unmapped+=1;mapping_failures.append({'cohort':c['cohort'],'case_id':cid,'class_sha256':sha256(cls.encode()).hexdigest(),'matches':len(matches)})
            else:gold.add(matches[0])
        assert len(c['candidates'])==len(c['control_candidates'])
        assert set(c['base_candidates'])<=set(c['candidates']) and set(c['base_candidates'])<=set(c['control_candidates'])
        rows.append({'cohort':c['cohort'],'case_id':cid,'mapping_complete':unmapped==0,'base':bool(gold & set(c['base_candidates'])),'multiview':bool(gold & set(c['candidates'])),'width_control':bool(gold & set(c['control_candidates'])),'candidate_count':len(c['candidates'])})
    aggregate={name:{'cases':sum(c['cohort']==name for c in rows),**{arm:sum(c[arm] for c in rows if c['cohort']==name) for arm in ['base','multiview','width_control']}} for name in configs}
    criteria={'net_gain_vs_control_ge_2':sum(c['multiview']-c['width_control'] for c in rows)>=2,
              'positive_vs_control_in_each_cohort':all(a['multiview']>a['width_control'] for a in aggregate.values()),
              'no_base_reach_losses':all(not c['base'] or c['multiview'] for c in rows)}
    result={'schema':'are.defects4j-multiview-dev-reach/v1','posture':'exposed mapped-file reach only, not accuracy or confirmation; incomplete labels remain explicit','screen_sha256':digest(screen_path),'implementation_sha256':digest(Path(__file__)),'aggregate':aggregate,'criteria':criteria,'source_pilot_advanced':all(criteria.values()),'mapping_failures':mapping_failures,'candidate_max':max(c['candidate_count'] for c in rows),'cases_numeric':rows}
    with output.open('x') as stream:stream.write(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='cases_numeric'}))

if __name__=='__main__':
    main(Path(sys.argv[1]).resolve(strict=True),Path(sys.argv[2]).resolve())
