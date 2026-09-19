# Key and Door Toy Game

This directory is disposable refinement evidence. It is not a production DomainSpec compiler or a minted project outside the run boundary.

Run from the repository root:

```bash
python3 projects/domainspec-v2/development/refinement-runs/20260714-minted-project-node-package-toy-game/stages/S06-invoke-design-toy-game/toy-game/run_tournament.py
```

The script compiles layouts A/B/C, repeats the builds byte-for-byte, runs eight negative cases, and writes `EVIDENCE.json` plus `generated/` outputs. The compiler reads the current DomainSpec kind and relationship registries only to verify pinned digests and exact endpoint signatures.

Authority rule: edit `candidates/` to change toy semantics. Delete and regenerate `generated/`; never repair a candidate by hand-editing generated graph or Markdown.

