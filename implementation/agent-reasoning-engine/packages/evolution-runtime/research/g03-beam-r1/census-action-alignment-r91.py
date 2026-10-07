"""Question-blind empirical action/control alignment; not causal certification.
Open Questions: evidence/G03-ACTION-ALIGNMENT-R91.json.
"""
from collections import Counter
import gzip
import hashlib
import json
from pathlib import Path
import re

PACK=Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')
MANIFEST_PIN='454397fc11ee0385e3f36672d15db7b5ececfa8fc839ba4990bd0290c226d2cc'
ACTION=re.compile(r"^(click|select_option|fill|press|hover)\(['\"]([^'\"]+)['\"](?:,|\))")
CONTROL=re.compile(r"(?m)^\s*\[([A-Za-z0-9]+)\] ([A-Za-z][A-Za-z0-9]*) '([^'\n]{1,180})'")

def sha(data):
    return hashlib.sha256(data).hexdigest()

def binding(action, previous, current):
    match=ACTION.match(action)
    if not match:
        return 'unsupported-action-syntax',None
    target=match.group(2)
    before=[(m.group(2),m.group(3)) for m in CONTROL.finditer(previous) if m.group(1)==target]
    after=[(m.group(2),m.group(3)) for m in CONTROL.finditer(current) if m.group(1)==target]
    if len(before)>1 or len(after)>1:
        return 'ambiguous-control-id',match.group(1)
    if before and after:
        return ('both-same-label' if before==after else 'both-different-label'),match.group(1)
    return ('previous-only' if before else 'current-only' if after else 'neither'),match.group(1)

def census():
    mb=(PACK/'MANIFEST.json').read_bytes()
    assert sha(mb)==MANIFEST_PIN,'manifest-drift'
    counts=Counter()
    kinds=Counter()
    rows=[]
    for entry in json.loads(mb)['entries']:
        compressed=(PACK/'trajectories'/(entry['id']+'.json.gz')).read_bytes()
        plain=gzip.decompress(compressed)
        assert sha(compressed)==entry['compressed_sha256'] and sha(plain)==entry['plain_sha256']
        trajectory=json.loads(plain)
        assert set(trajectory)<={'id','domain','environment','goal','states'}
        local=Counter()
        states=trajectory['states']
        counts['trajectories']+=1
        counts['states']+=len(states)
        if not str(states[0].get('action') or ''):
            counts['first_state_action_empty']+=1
        for i,state in enumerate(states):
            action=str(state.get('action') or '')
            if not action:
                counts['empty_action_states']+=1
                continue
            previous=str(states[i-1].get('accessibility_tree') or '') if i else ''
            current=str(state.get('accessibility_tree') or '')
            outcome,kind=binding(action,previous,current)
            counts['action_states']+=1
            counts[outcome]+=1
            local[outcome]+=1
            if kind:
                kinds[kind]+=1
        rows.append({'trajectory_id':entry['id'],'source_sha256':entry['plain_sha256'],'counts':dict(local)})
    assert counts['trajectories']==200 and counts['states']==5095 and counts['action_states']==4895
    return {'status':'canonical-question-blind-action-target-census','manifest_sha256':MANIFEST_PIN,
            'runner_sha256':sha(Path(__file__).read_bytes()),'counts':dict(counts),'parsed_action_kinds':dict(kinds),'rows':rows,
            'limitations':'Exact single-target regex subset only. IDs matching both states may be persistent or reused; matching ID/label is not causal proof. Unsupported/ambiguous/unmatched remain explicit; no drop or successful-procedure claim.',
            'provider_calls':0,'question_reference_or_confirmation_reads':0,'authority_effect':'none',
            'open_questions_owner':'G03-ACTION-ALIGNMENT-R91.json'}

if __name__=='__main__':
    print(json.dumps(census()))
