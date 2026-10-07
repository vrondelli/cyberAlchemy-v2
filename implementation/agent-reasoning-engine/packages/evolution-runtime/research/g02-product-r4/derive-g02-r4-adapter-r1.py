#!/usr/bin/env python3
"""Derive a bounded G02 four-repository/tmpfs adapter without model calls."""

import hashlib
import json
import shutil
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-product-replication-tools-r2'
PRIOR = Path('/opt/are-benchmark-runs/g02-nodebb-09eb-r1/code')
OUTPUT = BASE / 'g02-product-replication-tools-r4-adapter-r1'
ORIGINAL = {
    'prepare-prospective.mjs': '9e2d5466ce8559eaaaa42b63a5b433e495b4c381b6dda5e51e85a3204847f312',
    'run-and-score-pair.mjs': '2bb06f0a5fd8d3d68d0cba8c18211d2a938a1dec23f95bc2ffa19b55e0cb2a0e',
    'run-prospective-are.mjs': 'b7eb0ffd4463f67f332abad4e07a09533f4b1a10daa1080542ac668475afcc4e',
    'seal-prospective.mjs': '9e60956d82d6f60f74555831e14dff3e04bd28ff5f780e7be08c2c8205364f32',
    'run_fixed_pair.py': '632d52d7b7ba8f4462a286e8212f293f6648ec66e38c2a58e0b14146f5802aeb',
    'run_go.py': '4056e4cf3c2b4fbc5e1da4406c46cbc5ab7c550cfc69145bb67a4b92444a0c32',
    'run_dsh_control.py': '2a428b881bcfcfdcf9ae2739abe9604ae91ca607765eaadbbdd9f0062630fe0f',
}
R3 = '/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926'
R4 = '/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929'
RUNS = '/tmp/are-g02-r4-runs'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_path(name):
    return (PRIOR if name.endswith('.py') else SOURCE) / name


def replace_once(content, before, after, label):
    count = content.count(before)
    if count != 1:
        raise ValueError(f'g02-r4-adapter.{label}:expected-one-found-{count}')
    return content.replace(before, after)


def transform(name, value):
    if name.endswith('.mjs'):
        value = replace_once(value,
            "const root='/opt/are-benchmark-runs/g02-cross-layer-'+suffix;",
            f"const root='{RUNS}/g02-cross-layer-'+suffix;", f'{name}.run-root')
    if name == 'prepare-prospective.mjs':
        value = replace_once(value,
            "  'element-hq/element-web':'elementweb',\n",
            "  'element-hq/element-web':'elementweb',\n"
            "  'ansible/ansible':'ansible',\n"
            "  'future-architect/vuls':'vuls',\n", 'repository-map')
        value = replace_once(value,
            "mkdirSync(root,{recursive:false,mode:0o700});",
            f"mkdirSync('{RUNS}',{{recursive:true,mode:0o700}});\n"
            "mkdirSync(root,{recursive:false,mode:0o700});", 'tmpfs-parent')
        value = replace_once(value,
            "cpSync(join(prior,'code'),join(root,'code'),{recursive:true,force:true});",
            "cpSync(join(prior,'code'),join(root,'code'),{recursive:true,force:true});\n"
            "for(const name of ['run_fixed_pair.py','run_go.py','run_dsh_control.py'])\n"
            "  copyFileSync(join(tools,name),join(root,'code',name));", 'python-overlays')
        value = replace_once(value,
            f"const cache='{R3}/cache/'+cacheName;",
            "const cacheBase=['ansible/ansible','future-architect/vuls'].includes(repository)?\n"
            f"  '{R4}':'{R3}';\n"
            "const cache=cacheBase+'/cache/'+cacheName;", 'cache-base')
        value = replace_once(value,
            "  cache:cacheName,experiment_id:'g02-cross-layer-'+suffix,container_name:'are-g02-cross-layer-'+suffix};",
            "  cache:cacheName,cache_base:cacheBase,experiment_id:'g02-cross-layer-'+suffix,container_name:'are-g02-cross-layer-'+suffix};",
            'cache-binding')
        value = replace_once(value,
            "'code/base-overlay.mjs','code/run_dsh_control.py'])",
            "'code/base-overlay.mjs','code/run_fixed_pair.py','code/run_go.py','code/run_dsh_control.py'])",
            'source-hashes')
    elif name == 'run-and-score-pair.mjs':
        value = replace_once(value,
            "join(repo,'cache',binding.cache)",
            "join(binding.cache_base,'cache',binding.cache)", 'host-cache-binding')
    elif name == 'run-prospective-are.mjs':
        value = replace_once(value,
            "replace(`${prior}/evidence:/evidence`,`${root}/evidence:/evidence`);",
            "replace(`${prior}/evidence:/evidence`,`${root}/evidence:/evidence`);\n"
            f"replace('{R3}/cache:/cache:ro',`${{binding.cache_base}}/cache:/cache:ro`);",
            'container-cache-binding')
    elif name == 'run_fixed_pair.py':
        value = replace_once(value,
            "root.parent != Path('/opt/are-benchmark-runs')",
            f"root.parent != Path('{RUNS}')", 'tmpfs-root-guard')
        value = replace_once(value,
            "        runner.CACHE = binding['cache']\n",
            "        runner.CACHE = binding['cache']\n"
            "        runner.CACHE_BASE = Path(binding['cache_base'])\n", 'dsh-cache-base')
        value = replace_once(value,
            "    runner.ROOT = root\n    runner.NAME = binding['container_name']",
            "    runner.ROOT = root\n    runner.CACHE_BASE = Path(binding['cache_base'])\n"
            "    runner.NAME = binding['container_name']", 'are-cache-base')
        value = replace_once(value,
            "str(runner.BASE / 'cache/flipt')",
            "str(runner.CACHE_BASE / 'cache/flipt')", 'are-probe-source')
        value = replace_once(value,
            "str(runner.BASE / 'cache' / binding['cache'])",
            "str(runner.CACHE_BASE / 'cache' / binding['cache'])", 'are-probe-target')
    elif name == 'run_go.py':
        value = replace_once(value,
            f"BASE = pathlib.Path('{R3}')",
            f"BASE = pathlib.Path('{R3}')\nCACHE_BASE = BASE", 'are-cache-default')
        value = replace_once(value,
            "if shutil.disk_usage(ROOT).free < 8 * 1024**3:",
            "if shutil.disk_usage(ROOT).free < 3 * 1024**3:", 'are-tmpfs-floor')
        value = replace_once(value,
            "str(BASE / 'cache/flipt')",
            "str(CACHE_BASE / 'cache/flipt')", 'are-host-cache')
        value = replace_once(value,
            "str(BASE / 'cache') + ':/cache:ro'",
            "str(CACHE_BASE / 'cache') + ':/cache:ro'", 'are-container-cache')
    elif name == 'run_dsh_control.py':
        value = replace_once(value,
            f"BASE_ROOT = pathlib.Path('{R3}')",
            f"BASE_ROOT = pathlib.Path('{R3}')\nCACHE_BASE = BASE_ROOT", 'dsh-cache-default')
        value = replace_once(value,
            "if shutil.disk_usage(ROOT).free < 8 * 1024**3:",
            "if shutil.disk_usage(ROOT).free < 3 * 1024**3:", 'dsh-tmpfs-floor')
        count = value.count("BASE_ROOT / 'cache' / CACHE")
        if count != 2:
            raise ValueError(f'g02-r4-adapter.dsh-cache-count:{count}')
        value = value.replace("BASE_ROOT / 'cache' / CACHE", "CACHE_BASE / 'cache' / CACHE")
    return value


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('check', 'build'):
        raise ValueError('usage: derive-g02-r4-adapter-r1.py check|build')
    for name, expected in ORIGINAL.items():
        path = source_path(name)
        if sha(path) != expected:
            raise ValueError(f'g02-r4-adapter.source-drift:{name}')
    derived = {name: transform(name, source_path(name).read_text())
               for name in ORIGINAL}
    if sys.argv[1] == 'check':
        print(json.dumps({'status': 'check-passed-no-write',
                          'files': len(derived),
                          'sha256': {name: hashlib.sha256(value.encode()).hexdigest()
                                     for name, value in derived.items()}}))
        return
    if OUTPUT.exists():
        raise ValueError('g02-r4-adapter.output-exists')
    shutil.copytree(SOURCE, OUTPUT)
    for name, value in derived.items():
        (OUTPUT / name).write_text(value)
    manifest = {'schema_version': 'are.g02-r4-adapter-source/v1',
                'posture': 'versioned-candidate-no-model-dispatch',
                'source_sha256': ORIGINAL, 'builder_sha256': sha(Path(__file__)),
                'output_root': str(OUTPUT),
                'run_root': RUNS,
                'cache_roots': {'existing_repositories': R3, 'ansible_vuls': R4},
                'tmpfs_start_floor_bytes': 3 * 1024**3,
                'output_sha256': {name: sha(OUTPUT / name) for name in ORIGINAL},
                'open_questions': ['Do no-model syntax and cache-binding checks pass?',
                                   'Can one full pair remain within tmpfs and root-disk reserves?']}
    target = OUTPUT / 'ADAPTER-SOURCE.json'
    with target.open('x') as stream:
        json.dump(manifest, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'built-no-model', 'manifest_sha256': sha(target),
                      'files': len(derived)}))


if __name__ == '__main__':
    main()
