#!/usr/bin/env python3
"""Run two scripted ARE roles and the real alchLang compiler without KEP."""
import argparse
import base64
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[5]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',nargs='?',type=Path,default=ROOT/'sample.alch',help='your .alch file; defaults to sample.alch')
    args=parser.parse_args()
    with args.source.open('rb') as stream:source=stream.read(65537)
    if not 0<len(source)<=65536:raise ValueError('source must be 1..65536 UTF-8 bytes')
    source.decode('utf8')
    print('Simulation: two scripted ARE roles + real compiler. No KEP or live model.',flush=True)
    print('Running A -> B -> A checks...',flush=True)
    command=[str(REPO/'toolchains/node-typescript/bin/node-env'),'run','--project','projects/domainspec-v2/impl','--',
             'node','--import','tsx','../../../'+str((ROOT/'simulate.ts').relative_to(REPO)),base64.b64encode(source).decode('ascii')]
    run=subprocess.run(command,cwd=REPO,capture_output=True,text=True,timeout=120)
    if run.returncode:raise ValueError(run.stderr.strip() or run.stdout.strip() or 'Node simulation failed')
    result=json.loads(run.stdout)
    if result['status']!='PASS' or not all(result['checks'].values()):raise ValueError('simulation checks failed')
    # Export only into a newly created private temporary directory; never overwrite a user tree.
    files=result['bundle']['files']
    for name,content in files.items():
        if not all(re.fullmatch(r'[A-Za-z0-9_][A-Za-z0-9_.-]*',part) for part in name.split('/')) or not isinstance(content,str):
            raise ValueError('unsafe output filename or contents')
    out=Path(tempfile.mkdtemp(prefix='alchlang-simulation-'))
    (out/'source.alch').write_bytes(source)
    (out/'result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
    for name,content in files.items():
        target=out/'compiled'/name
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(content,encoding='utf8')
    print('\n[1] A packaged this source:\n'+source.decode('utf8'))
    print('[2] B validated the source and compiled it.')
    print(f'[3] B returned {len(files)} files:')
    for name,content in files.items():print(f'    {name} ({len(content.encode("utf8"))} bytes)')
    print('[4] A verified the bundle and every file hash: PASS')
    print('[5] Modified returned file rejected: PASS')
    print('[6] Repeated delivery returned the same bundle: PASS')
    preview=next((name for name in files if name.endswith('.types.ts')),next(iter(files)))
    print('\nGenerated preview: '+preview+'\n'+'\n'.join(files[preview].splitlines()[:30]))
    print('\nPASS — output saved at: '+str(out))
    print('Open compiled/ for the generated files, or result.json for the complete exchange.')
    print('Hashes check integrity here; this simulation does not authenticate a remote agent. Generated code was not executed.')
    return 0

if __name__=='__main__':
    try:raise SystemExit(main())
    except (OSError,ValueError,KeyError,subprocess.SubprocessError) as error:
        print('FAIL: '+str(error),file=sys.stderr);raise SystemExit(1)
