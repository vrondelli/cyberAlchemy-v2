#!/usr/bin/env python3
"""Recover the pinned provider, without installing packages. Questions: README.md."""
import hashlib
from pathlib import Path
import subprocess
import urllib.request

URL = 'https://github.com/diffblue/cbmc/releases/download/cbmc-6.11.0/ubuntu-24.04-cbmc-6.11.0-Linux.deb'
DEB_SHA = 'b3721aa541038384d7801ea3aeabbcddc3e8845ac8f1cbff637cf8dec7481ac8'
BIN_SHA = 'a62af25d27425610608221d79c202f993efe1d5a85cece186119bec196382995'

def setup():
    cache = Path(__file__).resolve().parent / '.cache'
    cache.mkdir(exist_ok=True)
    deb = cache / 'cbmc-6.11.0.deb'
    if not deb.exists():
        partial = cache / 'cbmc.download'
        with urllib.request.urlopen(URL, timeout=60) as src, partial.open('wb') as out:
            while chunk := src.read(1024 * 1024):
                out.write(chunk)
        if hashlib.sha256(partial.read_bytes()).hexdigest() != DEB_SHA:
            raise ValueError('CBMC package hash mismatch')
        partial.rename(deb)
    if hashlib.sha256(deb.read_bytes()).hexdigest() != DEB_SHA:
        raise ValueError('Cached CBMC package hash mismatch')
    binary = cache / 'cbmc/usr/bin/cbmc'
    if not binary.exists():
        subprocess.run(['dpkg-deb', '-x', str(deb), str(cache / 'cbmc')], check=True)
    if hashlib.sha256(binary.read_bytes()).hexdigest() != BIN_SHA:
        raise ValueError('CBMC binary hash mismatch')
    return binary

if __name__ == '__main__':
    print(setup())
