#!/usr/bin/env python3
"""Validate an exact extracted candidate; retain logs and never overwrite a run."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tarfile
import time


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(args):
    archive = Path(args.archive).resolve(strict=True)
    output = Path(args.output).absolute()
    output.mkdir()  # Existing evidence, even an empty directory, is preserved.
    extraction = output / 'extracted'
    extraction.mkdir()
    logdir = output / 'logs'
    logdir.mkdir()
    temporary = output / 'temporary'
    temporary.mkdir()
    report = {'schema_version': 'evf.containment-package-validation/v1-candidate',
              'archive': str(archive), 'sha256': sha(archive), 'size_bytes': archive.stat().st_size,
              'status': 'running', 'checks': [], 'test_total': 0, 'authority_effect': 'none'}
    def save():
        (output / 'RESULT.json').write_text(json.dumps(report, indent=2) + '\n')
    def run(label, argv, tests=0, json_result=False):
        print('RUNNING ' + label, flush=True)
        began = time.monotonic()
        environment = dict(os.environ, PYTHONDONTWRITEBYTECODE='1', TMPDIR=str(temporary))
        try:
            result = subprocess.run(list(map(str, argv)), cwd=kit, stdin=subprocess.DEVNULL,
                                    capture_output=True, env=environment, timeout=1800)
            stdout, stderr, code = result.stdout, result.stderr, result.returncode
        except subprocess.TimeoutExpired as error:
            stdout, stderr, code = error.stdout or b'', error.stderr or b'', 124
        (logdir / (label + '.stdout')).write_bytes(stdout)
        (logdir / (label + '.stderr')).write_bytes(stderr)
        (logdir / (label + '.command.json')).write_text(json.dumps(list(map(str, argv)), indent=2) + '\n')
        row = {'id': label, 'status': 'passed' if code == 0 else 'failed', 'exit_code': code,
               'seconds': round(time.monotonic() - began, 3),
               'stdout_sha256': hashlib.sha256(stdout).hexdigest(), 'stderr_sha256': hashlib.sha256(stderr).hexdigest()}
        if tests:
            observed = re.findall(rb'Ran (\d+) tests? in ', stdout + stderr)
            row['expected_tests'] = tests
            row['observed_tests'] = list(map(int, observed))
            if observed != [str(tests).encode()]:
                row['status'] = 'failed'
            if row['status'] == 'passed':
                report['test_total'] += tests
        report['checks'].append(row)
        save()
        if row['status'] != 'passed':
            raise RuntimeError(label + ' did not pass; retained logs at ' + str(logdir))
        print('PASSED ' + label, flush=True)
        return json.loads(stdout) if json_result else None
    try:
        with tarfile.open(archive) as tar:
            seen = set()
            for member in tar.getmembers():
                parts = Path(member.name).parts
                if not member.isfile() or parts[0] != 'evf-audit-kit-0.4.0' or '..' in parts or member.name in seen:
                    raise RuntimeError('Unsafe or duplicate archive entry')
                seen.add(member.name)
                target = extraction.joinpath(*parts)
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open('xb') as stream:
                    stream.write(tar.extractfile(member).read())
                target.chmod(member.mode)
        kit = extraction / 'evf-audit-kit-0.4.0'
        manifest = json.loads((kit / 'KIT-MANIFEST.json').read_text())
        if manifest['version'] != '0.4.0-candidate' or len(manifest['files']) + 1 != len(seen):
            raise RuntimeError('Manifest version or file denominator mismatch')
        for item in manifest['files']:
            file = kit / item['path']
            if not file.resolve().is_relative_to(kit) or sha(file) != item['sha256'] or file.stat().st_size != item['size_bytes']:
                raise RuntimeError('Archive integrity mismatch: ' + item['path'])
        report['archive_files'] = len(seen)
        report['checks'].append({'id': 'archive-integrity', 'status': 'passed', 'files': len(seen)})
        entry = [sys.executable, '-B', kit / 'evf']
        allowlist = [arg for path in args.runtime for arg in ('--runtime', path)]
        workspace = output / 'audit'
        run('doctor', entry + ['doctor'], json_result=True)
        run('historical-projections', [sys.executable, '-B', kit / 'check_examples.py'], json_result=True)
        run('containment', [sys.executable, '-B', kit / 'tests/test_containment.py'], tests=22)
        run('core-cli', [sys.executable, '-B', kit / 'tests/test_cli.py'], tests=14)
        run('formal-init', entry + ['formal-init', workspace], json_result=True)
        tool_flags = [value for name in ('souffle', 'alloy', 'java', 'cbmc', 'lean', 'tlc', 'cc')
                      for value in ('--' + name, getattr(args, name))]
        binding = run('formal-tools', entry + allowlist + ['formal-tools', '--workspace', workspace, '--trust-local-tools', *tool_flags], json_result=True)
        lock = binding['tools']
        report['tools_manifest'] = lock
        for suite, count in (('test_formal.py', 28), ('test_tlc.py', 20), ('test_tlc_live.py', 12), ('test_formal_live.py', 8)):
            extra = ['--java', args.java, '--tlc', args.tlc] if suite == 'test_tlc_live.py' else ['--tools', lock] if suite == 'test_formal_live.py' else []
            run(suite.removesuffix('.py'), entry + allowlist + ['contained-test', '--workspace', workspace, '--suite', suite, *extra], tests=count)
        result = run('five-provider-audit', entry + allowlist + ['formal-run', '--workspace', workspace, '--tools', lock, '--trust-local-providers'], json_result=True)
        if result['status'] != 'passed' or result['supported_claims'] != result['required_claims'] or result['required_claims'] != 5:
            raise RuntimeError('Expected five supported example claims')
        verified = run('five-provider-verification', entry + allowlist + ['formal-verify', '--workspace', workspace, '--claims', result['formal_claims']], json_result=True)
        if verified['verdict'] != 'passed' or verified['claims_verified'] != 5:
            raise RuntimeError('Expected five verified claims')
        report.update(status='passed', formal_claims=result['formal_claims'], bundle_digest=verified['bundle_digest'],
                      bundle_sha256=sha(Path(result['formal_claims'])), checks_ran_sequentially=True)
    except (OSError, ValueError, KeyError, RuntimeError, subprocess.SubprocessError, tarfile.TarError) as error:
        report.update(status='failed', reason=str(error), remaining_checks='not_evaluable; stopped at the first causal failure')
    finally:
        save()
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 2


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', required=True)
    parser.add_argument('--output', required=True, help='New validation directory; never overwritten')
    parser.add_argument('--runtime', action='append', default=[])
    for name in ('souffle', 'alloy', 'java', 'cbmc', 'lean', 'tlc', 'cc'):
        parser.add_argument('--' + name, required=True)
    sys.exit(validate(parser.parse_args()))
