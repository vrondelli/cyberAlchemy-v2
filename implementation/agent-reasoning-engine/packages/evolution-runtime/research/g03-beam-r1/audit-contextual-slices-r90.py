"""Independent selected-source/byte-budget binding; pinned helper witness semantics.
Open Questions: evidence/G03-CONTEXTUAL-STATE-SLICES-R90.json.
"""
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path
import re

HERE=Path(__file__).parent
ROOT=Path('/home/vlad_/are-benchmark-archive/g03-contextual-state-slices-r90-20261007')
PACK=Path('/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48')

def sha(data):
    return hashlib.sha256(data).hexdigest()

def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    result=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

def main():
    freeze=json.loads((ROOT/'FREEZE.json').read_bytes())
    for path,pin in freeze['inputs'].items():
        assert sha(Path(path).read_bytes())==pin,'input-drift'
    assert sha((HERE/'screen-contextual-slices-r90.py').read_bytes())==freeze['source_sha256']
    assert sha((HERE/'../../evidence/G03-CONTEXTUAL-STATE-SLICES-R90.json').read_bytes())==freeze['protocol_sha256']
    writer_path=HERE/'../arb-trace2code-r1/audit-jacoco-project-capacity-r6.py'
    assert sha(writer_path.read_bytes())==freeze['writer_sha256']
    for name,pin in freeze['helper_sha256'].items():
        assert sha((HERE/name).read_bytes())==pin,'helper-drift'
    trajectories={}
    for entry in json.loads((PACK/'MANIFEST.json').read_bytes())['entries']:
        compressed=(PACK/'trajectories'/(entry['id']+'.json.gz')).read_bytes()
        plain=gzip.decompress(compressed)
        assert sha(compressed)==entry['compressed_sha256'] and sha(plain)==entry['plain_sha256']
        trajectories[entry['id']]=json.loads(plain)
    assert len(trajectories)==200 and sum(len(t['states']) for t in trajectories.values())==5095
    screen=module('r90_screen',HERE/'screen-contextual-slices-r90.py')
    helper=module('r90_r88',HERE/'screen-index-retrieval-r88b.py')
    groups=module('r90_groups',HERE/'screen-lme-v2-ui-groups-r61.py')
    result=json.loads((ROOT/'RESULT.json').read_bytes())
    selection_bytes=(ROOT/'PRE-AUDIT-SELECTION.json').read_bytes()
    assert sha(selection_bytes)==result['selection_sha256']
    assert sha((ROOT/'FREEZE.json').read_bytes())==result['freeze_sha256']
    selections=json.loads(selection_bytes)
    question_path=next(Path(p) for p in freeze['inputs'] if p.endswith('QUESTIONS-TEXT-ONLY.json'))
    questions={q['id']:q['question'] for q in json.loads(question_path.read_bytes())}
    facts={r['question_id']:r for r in json.loads((PACK/'TYPED-SOURCE-FACTS-R80.json').read_bytes())['rows']}
    assert len(selections)==26 and {r['question_id'] for r in selections}==set(questions)
    counts={'raw':0,'contextual':0}
    max_bytes=0
    selected_slices=0
    for selection,outcome in zip(selections,result['rows']):
        qid=selection['question_id']
        assert outcome['question_id']==qid and selection['question_sha256']==sha(questions[qid].encode())
        fact=facts[qid]
        known=fact['status'] in {'directly_supported','contradicts_premise'}
        for ref in fact['source_refs'] if known else []:
            helper.verify_witness(ref,trajectories,groups)
        for arm,rows in selection['arms'].items():
            size=len(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode())
            assert size<=32000,'whole-rendered-evidence-budget'
            max_bytes=max(max_bytes,size)
            seen=set()
            for row in rows:
                selected_slices+=1
                trajectory=trajectories[row['trajectory_id']]
                state_indices=[s['state_index'] for s in trajectory['states']]
                i=state_indices.index(row['state_index'])
                state=trajectory['states'][i]
                tree=str(state.get('accessibility_tree') or '')
                lines=tree.splitlines()
                lo,hi=row['start_line'],row['end_line']
                assert 0<=lo<=hi<len(lines)
                text='\n'.join(lines[lo:hi+1])
                assert text==row['text'] and sha(text.encode())==row['source_sha256'] and sha(tree.encode())==row['state_tree_sha256']
                assert row['complete_state_scope']==(lo==0 and hi==len(lines)-1)
                assert row['oversized_source_line']==(len(text.encode())>6000)
                context=json.dumps({'goal':str(trajectory.get('goal') or ''),'page_titles':re.findall(r"RootWebArea '([^']+)'",tree),
                    'observed_preceding_action':str(trajectory['states'][i-1].get('action') or '') if i else None,
                    'observed_current_action':str(state.get('action') or '')},ensure_ascii=False)
                assert row['context']==context
                assert row['preceding_state_index']==(trajectory['states'][i-1]['state_index'] if i else None)
                key=(sha(text.encode()),context)
                assert key not in seen,'duplicate-evidence'
                seen.add(key)
            reached={r['trajectory_id'] for r in fact['source_refs'] if screen.source_ref_reached(r,rows,trajectories,groups)} if known else set()
            minimum=2 if fact['operator'] in {'ordered_between','ordered_successor'} else 1
            hit=len(reached)>=minimum if known else None
            assert outcome['reach'][arm]==hit
            counts[arm]+=hit is True
    assert counts['raw']==result['raw_known_witness_reach'] and counts['contextual']==result['contextual_known_witness_reach']
    passed=counts['contextual']==7 and counts['contextual']-counts['raw']>=2
    assert result['status']==('bounded-source-witness-qualified' if passed else 'bounded-source-witness-rejected')
    audit={'status':'passed','result_sha256':sha((ROOT/'RESULT.json').read_bytes()),'auditor_sha256':sha(Path(__file__).read_bytes()),
        'all26_retained':True,'all200_canonical_hashes_verified':True,'source_states':5095,'selected_slices_bound':selected_slices,
        'max_rendered_evidence_utf8_bytes':max_bytes,'known_witness_reach':counts,
        'limitations':'Independent source-byte/budget/metadata reconciliation; witness semantics reuse pinned screen/group helpers. No ranking reproduction or independent semantic QA judgment.',
        'provider_calls':0,'reference_reads':0,'authority_effect':'none','open_questions_owner':'G03-CONTEXTUAL-STATE-SLICES-R90.json'}
    data=(json.dumps(audit,indent=2)+'\n').encode()
    module('r90_writer',writer_path).save_exclusive(ROOT/'AUDIT.json',data)
    print(json.dumps(audit|{'audit_sha256':sha(data)}))

if __name__=='__main__':
    main()
