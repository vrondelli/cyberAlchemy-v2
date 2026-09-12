#!/usr/bin/env python3
"""Launch a fresh local owner and export its verified replay. Questions: PLAN.md."""
import argparse
import json
from pathlib import Path
import subprocess

from worker import HERE, binding, canonical, validate
from build import CA2, ORCHESTRATOR, LAUNCHER, check_source


def render(report, destination):
    # Read the exact worker bytes; never roundtrip a floating-point replay through Rust.
    world = json.loads(Path(report['world_output']).read_text())['result']
    data = json.dumps({'frames': world['frames'], 'traces': world['traces'],
                       'verified': report['verification']['status'], 'constructed': world['constructed']},
                      ensure_ascii=False).replace('<', '\\u003c')
    template = (HERE / 'replay-template.html').read_text()
    destination.write_text(template.replace('/*REPLAY_DATA*/null', data))


def launch(output, ticks):
    check_source()
    b = binding(ticks); validate('binding', b)
    output = Path(output).resolve(); output.mkdir(parents=True, exist_ok=False)
    (output / 'binding.json').write_bytes(canonical(b) + b'\n')
    command = [str(LAUNCHER), str(ORCHESTRATOR / 'target/debug/world_contracts'),
               str(HERE / 'worker.py'), str(output / 'binding.json'), str(output / 'owner'), 'run']
    run = subprocess.run(command, capture_output=True, text=True, cwd=CA2)
    (output / 'driver.log').write_text(run.stdout + run.stderr)
    if run.returncode:
        raise RuntimeError('WORLD_DRIVER_FAILED:' + run.stderr.strip())
    report = json.loads(run.stdout)
    (output / 'result.json').write_text(json.dumps(report, indent=2) + '\n')
    render(report, output / 'replay.html')
    return report


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--ticks', type=int, default=100)
    args = p.parse_args()
    print(json.dumps(launch(args.output, args.ticks), indent=2))
