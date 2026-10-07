#!/usr/bin/env python3
"""Seal response-only numeric/string-ID normalization before any gold read."""
import json
from hashlib import sha256
from pathlib import Path
import re
import sys

def main(root):
    assert not (root/'SCORE.json').exists() and not (root/'PREDICTION-SEAL.json').exists()
    output=root/'NORMALIZED-PREDICTIONS.json'
    assert not output.exists()
    result=json.loads((root/'GENERATION-RESULT.json').read_bytes())
    assert result['completed']==32
    packets=[json.loads(line) for line in (root/'PACKETS.jsonl').read_text().splitlines()]
    rows=[]
    for p in packets:
        raw=(root/f"GENERATION-{p['ordinal']:02d}.json").read_bytes()
        response=json.loads(raw);ids=None
        try:
            value=json.loads(response['content'])
            assert set(value)=={'candidate_ids'} and isinstance(value['candidate_ids'],list)
            selected=value['candidate_ids']; normalized=[]
            for item in selected:
                if type(item)==int:
                    normalized.append(item)
                elif isinstance(item,str) and re.fullmatch(r'(?:\d+|\[\d+\])',item):
                    normalized.append(int(item.strip('[]')))
                else:
                    raise ValueError('ambiguous reference')
            assert len(normalized)<=8 and len(set(normalized))==len(normalized)
            assert all(1<=i<=len(p['candidates']) for i in normalized)
            ids=normalized
        except (AssertionError,ValueError,TypeError,KeyError):
            pass
        rows.append({'case_id':p['case_id'],'response_sha256':sha256(raw).hexdigest(),
                     'valid':ids is not None,'ranked_files':[p['candidates'][i-1]['path'] for i in ids] if ids is not None else []})
    data={'schema':'are.defects4j-r1-response-format-repair/v1','posture':'decoder amended after inspecting response formats, before gold; separate diagnostic from frozen strict primary gate',
          'rule':'Accept integer IDs or exact decimal strings optionally enclosed in square brackets; preserve order, range and uniqueness; no retries or choice changes',
          'gold_opened':False,'cases':rows}
    output.write_text(json.dumps(data,indent=2)+'\n')
    print(json.dumps({'valid':sum(r['valid'] for r in rows),'sha256':sha256(output.read_bytes()).hexdigest()}))

if __name__=='__main__':
    main(Path(sys.argv[1]).resolve(strict=True))
