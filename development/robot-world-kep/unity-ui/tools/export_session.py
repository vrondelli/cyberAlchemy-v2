"""Export the exact retained demo as an array-based Unity presentation session.

This is a local fixture adapter, not a general RWO run importer or KEP verifier.
Open questions: ../PLAN.md, Q-UI2; fresh-run integration belongs to checkpoint 04.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEX = re.compile(r'^[0-9a-f]{64}$')
MAX_BYTES = 16 * 1024 * 1024

def integer(value, name, minimum=0):
    if type(value) is not int or value < minimum:
        raise ValueError('Invalid integer: ' + name)
    return value

def text(value, name):
    if not isinstance(value, str) or not value or len(value) > 256:
        raise ValueError('Invalid text: ' + name)
    return value

def texts(value, name):
    if not isinstance(value, list): raise ValueError('Expected list: ' + name)
    return [text(v, name) for v in value]

def vector(value, name, length=None):
    if not isinstance(value, list) or not value or len(value) > 128:
        raise ValueError('Invalid vector: ' + name)
    if length is not None and len(value) != length: raise ValueError('Vector dimension: ' + name)
    if any(type(v) not in (int, float) or not math.isfinite(v) for v in value):
        raise ValueError('Non-finite vector: ' + name)
    return value

def project(replay, catalog):
    if not isinstance(replay, dict) or replay.get('mode') != 'recorded-scripted-policy':
        raise ValueError('Unsupported replay mode')
    frames = replay.get('frames')
    if not isinstance(frames, list) or not 1 <= len(frames) <= 100000:
        raise ValueError('Invalid frame count')
    out, previous, world_id, owners = [], (-1, -1), None, None
    for f in frames:
        tick = integer(f['tick'], 'tick'); revision = integer(f['revision'], 'revision')
        if tick < previous[0] or revision <= previous[1]: raise ValueError('Non-monotonic replay')
        previous = tick, revision
        wid = text(f['world_id'], 'world_id')
        if world_id is not None and wid != world_id: raise ValueError('Mixed worlds')
        world_id = wid
        if not isinstance(f['robots'], dict) or not f['robots']: raise ValueError('Missing robots')
        current_owners = {text(k,'robot id'):text(v['owner'],'owner') for k,v in f['robots'].items()}
        if owners is not None and current_owners != owners: raise ValueError('Agent identity changed')
        owners = current_owners
        agents = []
        for rid, r in sorted(f['robots'].items()):
            energy = integer(r['energy'], 'energy')
            if energy > 100: raise ValueError('Energy out of bounds')
            memory = vector(r['memory'], 'memory')
            agents.append({'id':rid,'owner':r['owner'],'position':vector(r['position'],'position',2),
                'energy':energy,'cargo':integer(r['cargo'],'cargo'),'memory':memory,
                'prior':vector(r['prior'],'prior',len(memory))})
        out.append({'tick':tick,'revision':revision,'worldId':wid,'built':integer(f['built'],'built'),
            'resource':integer(f['resource'],'resource'),'stock':integer(f['stock'],'stock'),
            'knowledge':texts(f['knowledge'],'knowledge'),'robots':agents})
    if not isinstance(catalog,list): raise ValueError('Catalog must be an array')
    offers=[]; identities=set()
    for c in catalog:
        cid=text(c['capability_id'],'capability_id'); version=text(c['version'],'version')
        if not HEX.fullmatch(version): raise ValueError('Invalid capability version')
        if (cid,version) in identities: raise ValueError('Duplicate capability version')
        identities.add((cid,version))
        offers.append({'capabilityId':cid,'version':version,'kind':text(c['kind'],'kind'),
          'artifactType':text(c['artifact_type'],'artifact_type'),'domain':text(c['domain'],'domain'),
          'effect':text(c['effect'],'effect'),'byteCount':integer(c['byte_count'],'byte_count'),
          'contributors':texts(c['contributors'],'contributors'),'consumers':texts(c['consumers'],'consumers')})
    return {'schemaVersion':'robot-world.unity-session/v1-prototype','mode':replay['mode'],
        'provenance':'retained local demo fixture; not live KEP','frames':out,'catalog':offers}

def export(output: Path):
    registry=json.loads((ROOT/'SOURCE-REGISTER.json').read_text())
    selected={s['source_id']:s for s in registry['local_sources']}
    values={}; hashes={}
    for name in ('replay','catalog'):
        record=selected[name]; path=Path(record['path'])
        if path.stat().st_size>MAX_BYTES: raise ValueError('Source too large')
        raw=path.read_bytes(); sha=hashlib.sha256(raw).hexdigest()
        if sha != record['sha256']: raise ValueError('Selected source drift: '+name)
        values[name]=json.loads(raw);hashes[name]=sha
    data=project(values['replay'],values['catalog'])
    data['sourceReplaySha256']=hashes['replay'];data['sourceCatalogSha256']=hashes['catalog']
    raw=(json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n').encode()
    if len(raw)>MAX_BYTES: raise ValueError('Projected session too large')
    output.mkdir(parents=True,exist_ok=False)
    (output/'session.json').write_bytes(raw)
    manifest={'schemaVersion':'robot-world.unity-session-manifest/v1-prototype','fileName':'session.json',
        'sha256':hashlib.sha256(raw).hexdigest(),'byteCount':len(raw),'frameCount':len(data['frames']),
        'sourceReplaySha256':hashes['replay'],'sourceCatalogSha256':hashes['catalog'],
        'scope':'selected demo fixture only; hashes identify content, not network trust or authorization'}
    (output/'session-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    target=args.output.resolve()
    if not target.is_relative_to(ROOT.resolve()): parser.error('Output must be inside unity-ui')
    print(json.dumps(export(target),indent=2))
