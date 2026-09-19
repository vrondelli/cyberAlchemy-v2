#!/usr/bin/env python3
"""Run one command against the O00 source and immutable tool image."""
import os,sys,subprocess
from pathlib import Path
W=Path('/home/vrondelli/projects/domainspec-v2-c04-f01-successor')
T=Path(__file__).resolve().parent
IMAGE='sha256:ec7f87fd5731fb7441d91d37abcd388df7ac38ad1f03e880b608aec034bd77f7'
if len(sys.argv)<2:raise SystemExit('Usage: run.py COMMAND [ARGS...]')
for child in ['tmp','npm-cache','pnpm-store','cargo-home']:(T/child).mkdir(exist_ok=True)
gitdir=Path('/home/vrondelli/projects/domainspec-core/.git')
args=['docker','run','--rm','--network','host','--user',f'{os.getuid()}:{os.getgid()}','--group-add',str(Path('/var/run/docker.sock').stat().st_gid)]
for src,dst,ro in [(W,W,False),(T,T,False),(gitdir,gitdir,True),(Path('/var/run/docker.sock'),Path('/var/run/docker.sock'),False),(Path('/home/vrondelli/.rustup/toolchains/1.94.0-x86_64-unknown-linux-gnu'),Path('/opt/o00/rust'),True),(Path('/home/vrondelli/.elan/toolchains/leanprover--lean4---v4.33.1'),Path('/opt/o00/lean'),True)]:
 args+=['--mount',f'type=bind,src={src},dst={dst}'+(',readonly' if ro else '')]
env={'PATH':f'{W}/projects/domainspec-v2/impl/node_modules/.bin:/opt/o00/rust/bin:/opt/o00/lean/bin:/opt/node-toolchain/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin','TMPDIR':str(T/'tmp'),'CARGO_HOME':str(T/'cargo-home'),'NPM_CONFIG_CACHE':str(T/'npm-cache'),'npm_config_cache':str(T/'npm-cache'),'npm_config_audit':'false','npm_config_fund':'false','npm_config_update_notifier':'false','GIT_OPTIONAL_LOCKS':'0','GIT_CONFIG_COUNT':'1','GIT_CONFIG_KEY_0':'safe.directory','GIT_CONFIG_VALUE_0':str(W),'PYTHONDONTWRITEBYTECODE':'1'}
for k,v in env.items():args+=['--env',k+'='+v]
args+=['--workdir',str(W/'projects/domainspec-v2/impl/cli'),IMAGE,*sys.argv[1:]]
raise SystemExit(subprocess.call(args))
