# TDE to EVF L1 candidate

Status: prototype candidate; unapproved
Authority effect: none

This candidate preserves the L0 TDE-neutral obligation and adds an independent
EVF-owned Alloy route for the same exact closed-world reachability property:

```text
one immutable TDE obligation
  -> EVF Souffle route ----\
                            -> non-voting EVF dual-provider join
  -> EVF Alloy route ------/
```

Agreement means only that two exact bounded observations agree. Disagreement,
missing evidence, `unknown`, fixture-only evidence, or an invalid receipt never
becomes success.

## Validate

```bash
python3 validate.py
```

The default validation uses explicitly labelled test doubles for both provider
routes. It proves translation, execution plumbing, parsing, replay,
deliberate-violation handling, and non-voting joins. It cannot produce product
evidence.

Real provider execution requires exact local runtime paths:

```bash
python3 validate.py --use-local-runtimes
```

That option loads `runtime-bindings.local.json`, verifies all three executable
or jar hashes, then executes the ignored repository-local runtimes. Equivalent
explicit paths may still be supplied:

```bash
python3 validate.py \
  --souffle /absolute/path/to/souffle \
  --java /absolute/path/to/java \
  --alloy-jar /absolute/path/to/org.alloytools.alloy.dist-6.2.0.jar
```

The local binaries live under ignored `.formal-tools/`. The runtime-binding
record is evidence of exact availability only; it is not runtime admission.

No result grants product approval, admission, publication, release, deployment,
or external-effect authority.
