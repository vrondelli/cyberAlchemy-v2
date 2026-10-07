"""Atomically inspect or replace the non-secret BRL quote in a prepared runtime."""
import argparse
import json
import os
from pathlib import Path
import re
import tempfile
import time


def load(path):
    path=Path(path)
    if path.is_symlink() or not path.is_file() or path.stat().st_size>65536:
        raise ValueError('config-regular-file-required')
    value=json.loads(path.read_text())
    quote=value.get('quoteBrl')
    if not isinstance(quote,dict):raise ValueError('quote-missing')
    return path,value,quote


def status(path,*,now=None):
    _,_,quote=load(path);now=int(time.time()) if now is None else now
    expires=quote.get('expiresAt')
    if expires is None:
        return {'ok':True,'reference':quote.get('reference'),'fixed':True,'expiresAt':None,
                'secondsRemaining':None,'refreshRequired':False}
    if type(expires) is not int or expires<=0:raise ValueError('quote-expiry-invalid')
    return {'ok':expires>now,'reference':quote.get('reference'),'fixed':False,'expiresAt':expires,
            'secondsRemaining':expires-now,'refreshRequired':expires-now<86400}


def replace(path,quote,*,now=None):
    path,value,_=load(path);now=int(time.time()) if now is None else now
    if set(quote)!= {'numerator','denominator','reference','expiresAt'}:
        raise ValueError('quote-fields-invalid')
    if any(type(quote[k]) is not int or not 1<=quote[k]<=100000000 for k in ('numerator','denominator')):
        raise ValueError('quote-rate-invalid')
    if not isinstance(quote['reference'],str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._:+/@-]{7,255}',quote['reference']):
        raise ValueError('quote-reference-invalid')
    if quote['expiresAt'] is not None and (type(quote['expiresAt']) is not int or not now+3600<=quote['expiresAt']<=now+7*86400):
        raise ValueError('quote-expiry-window-invalid')
    value['quoteBrl']=quote
    encoded=(json.dumps(value,indent=2)+'\n').encode()
    mode=path.stat().st_mode&0o777
    descriptor,name=tempfile.mkstemp(prefix='.keld-quote-',dir=path.parent)
    try:
        with os.fdopen(descriptor,'wb') as handle:
            handle.write(encoded);handle.flush();os.fsync(handle.fileno())
        os.chmod(name,mode)
        os.replace(name,path)
        directory=os.open(path.parent,os.O_RDONLY)
        try:os.fsync(directory)
        finally:os.close(directory)
    except BaseException:
        try:os.unlink(name)
        except FileNotFoundError:pass
        raise
    return {'ok':True,'reference':quote['reference'],'fixed':quote['expiresAt'] is None,'expiresAt':quote['expiresAt'],
            'recreateRequired':True,'services':['web','worker']}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('config',type=Path)
    parser.add_argument('--status',action='store_true')
    parser.add_argument('--numerator',type=int)
    parser.add_argument('--denominator',type=int)
    parser.add_argument('--reference')
    parser.add_argument('--expires-at',type=int)
    parser.add_argument('--fixed',action='store_true')
    args=parser.parse_args()
    if args.status:
        if args.fixed or any(x is not None for x in (args.numerator,args.denominator,args.reference,args.expires_at)):
            parser.error('--status does not accept replacement fields')
        result=status(args.config)
    else:
        if any(x is None for x in (args.numerator,args.denominator,args.reference)):
            parser.error('rate and reference fields are required')
        if args.fixed == (args.expires_at is not None):
            parser.error('choose exactly one of --fixed or --expires-at')
        result=replace(args.config,{'numerator':args.numerator,'denominator':args.denominator,
          'reference':args.reference,'expiresAt':None if args.fixed else args.expires_at})
    print(json.dumps(result,separators=(',',':')))
    if not result['ok']:raise SystemExit(1)


if __name__=='__main__':main()
