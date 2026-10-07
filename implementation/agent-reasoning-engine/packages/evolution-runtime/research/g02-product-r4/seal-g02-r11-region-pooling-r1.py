"""Source only. Open Questions: G02-R11-REGION-POOLING-EXPOSED-R1.md."""
import json
import runpy
import subprocess
import time
from collections import Counter
from hashlib import sha256
from pathlib import Path

ROOT = Path('/home/vlad_/are-benchmark-archive')
OUT = ROOT/'g02-r11-region-pooling-exposed-r1-20261006'
HERE = Path(__file__).parent
TOKENIZER = HERE/'seal-g02-r11-multiview-file-card-exposed-r1.py'
terms = runpy.run_path(str(TOKENIZER))['terms']
api = runpy.run_path(str(HERE/'region-pooling-r1.py'))
digest = lambda b: sha256(b).hexdigest()


def git(base, *args):
    return subprocess.check_output(['git','-c',f'safe.directory={base}','-C',str(base),*args])


def main():
    assert not OUT.exists()
    pb = (ROOT/'g02-r11-baseline-delta-packets-exposed-r1-20261005/PACKETS.json').read_bytes()
    ub = (ROOT/'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json').read_bytes()
    assert digest(pb) == '050acc7b183a8f6db8cdc4f7bab8561b1c381e9a3ce59c01d1928930947357a7'
    assert digest(ub) == '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
    packets, union = json.loads(pb)['ordered_packets'], json.loads(ub)['rows']
    assert len(packets) == len(union) == 12
    protocol = (HERE.parents[1]/'evidence/G02-R11-REGION-POOLING-EXPOSED-R1.md').read_bytes()
    rows = []
    for ordinal, (p,u) in enumerate(zip(packets,union),1):
        started = time.monotonic()
        assert p['ordinal'] == u['ordinal'] == ordinal and p['instance_id'] == u['instance_id']
        raw = ROOT/f'g02-product-replication-r11-20261002/pairs/{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw'
        base = raw/'sources/session/base'
        assert git(base,'rev-parse','HEAD').decode().strip() == u['base_commit']
        assert not git(base,'diff','--name-only','HEAD')
        prediction = (raw/'policy-pruning/prediction.json').read_bytes()
        pred = json.loads(prediction); assert pred['instance_id'] == p['instance_id']
        selected = set(pred['traj_data']['pred_files']); delivered = set(u['delivered_paths'])
        query = Counter(terms(p['issue'])); whole = []; regions = []; manifest = {}; excluded = Counter()
        for name in git(base,'ls-tree','-r','-z','--name-only','HEAD').split(b'\0'):
            if not name:
                continue
            try:
                rel = name.decode('utf-8')
            except UnicodeError:
                excluded['path_encoding'] += 1; continue
            assert not Path(rel).is_absolute() and '..' not in Path(rel).parts
            file = base/rel
            if file.is_symlink() or not file.is_file() or not file.resolve().is_relative_to(base.resolve()):
                excluded['nonregular'] += 1; continue
            if file.stat().st_size > 4*1024*1024:
                excluded['over_4_mib'] += 1; continue
            data = file.read_bytes()
            if b'\0' in data:
                excluded['nul'] += 1; continue
            try:
                body = data.decode('utf-8')
            except UnicodeError:
                excluded['encoding'] += 1; continue
            manifest[rel] = digest(data)
            path_terms = terms(rel); lines = body.splitlines()
            # Retain full lengths but only query counts: exact BM25 with bounded memory.
            def compact(tokens):
                counter = Counter(t for t in tokens if t in query)
                counter['<nonquery>'] = len(tokens)-sum(counter.values())
                return counter
            whole.append((rel,1,len(lines),compact(path_terms+terms(body))))
            for start,end,text in api['windows'](lines):
                regions.append((rel,start,end,compact(path_terms+terms(text))))
        treatment = [x for x in api['rank'](regions,query) if x['path'] not in selected|delivered][:3]
        control = [x for x in api['rank'](whole,query) if x['path'] not in selected|delivered][:len(treatment)]
        assert len(treatment) == len(control)
        rows.append({'ordinal':ordinal,'repo':p['repo'],'instance_id':p['instance_id'],'base_commit':u['base_commit'],
                     'issue_sha256':digest(p['issue'].encode()),'prediction_sha256':digest(prediction),
                     'selected_paths':sorted(selected),'delivered_paths':sorted(delivered),
                     'source_sha256':manifest,'excluded':dict(excluded),'region_count':len(regions),
                     'proposals':treatment,'controls':control,'elapsed_s':time.monotonic()-started})
        print(json.dumps({'ordinal':ordinal,'files':len(manifest),'regions':len(regions),'elapsed_s':rows[-1]['elapsed_s']}),flush=True)
    result = {'schema':'are.g02-region-pooling-source/v1','posture':'exposed source only, not native score',
              'protocol_sha256':digest(protocol),'packets_sha256':digest(pb),'union_sha256':digest(ub),
              'implementation_sha256':digest(Path(__file__).read_bytes()),
              'ranker_sha256':digest((HERE/'region-pooling-r1.py').read_bytes()),'tokenizer_sha256':digest(TOKENIZER.read_bytes()),
              'rows':rows,'open_questions_owner':'G02-R11-REGION-POOLING-EXPOSED-R1.md'}
    OUT.mkdir(mode=0o700)
    for name,data in [('PROTOCOL.md',protocol),('SOURCE-SEAL.json',(json.dumps(result,indent=2)+'\n').encode())]:
        with (OUT/name).open('xb') as stream:
            stream.write(data)
    print(json.dumps({'terminal':True,'sha256':digest((OUT/'SOURCE-SEAL.json').read_bytes())}))


if __name__ == '__main__':
    main()
