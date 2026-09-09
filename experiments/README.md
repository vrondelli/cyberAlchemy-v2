# CyberAlchemy v2 Experiments

Status: active private package
Package owner: CyberAlchemy v2 experiment route
Visibility: private
Authority effect: none

This package keeps empirical tests connected to their Project, Goals, Research,
protocol, run evidence, and claim limits. The canonical meaning is
[Experiment (`CAV2-D62`)](../authority/definitions/DEFINITIONS.md#cav2-d62-experiment).

An Experiment document can describe a prepared test without claiming it ran.
Run evidence must exist before `ran(experiment)` is true. Findings or an owner
decision—not the experiment record—state conclusions.

## Current Experiment

- [PythonConstraint Whole Experiment](projects/pythonconstraint-whole/experiments/pythonconstraint-whole/experiment.md)
- [machine record](projects/pythonconstraint-whole/experiments/pythonconstraint-whole/experiment.record.json)
- [ontology view](ontology/experiment-view.json)

The current record has no run references. It is a prepared design tied to the
Project and Goal, not a completed experiment.

## Validate

```bash
python3 cyberAlchemy-v2/experiments/scripts/validate_records.py
```

## Claim Ceiling

This package defines and instantiates an Experiment document type. It does not
authorize or run an experiment, prove a hypothesis, achieve a Goal, publish, or
deploy anything.
