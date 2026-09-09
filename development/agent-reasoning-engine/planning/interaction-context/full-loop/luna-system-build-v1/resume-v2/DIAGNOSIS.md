# Acceptance timeout diagnosis and repair

ARE attempt 2 emits literal backslash-n bytes after its startup JSON. The old
harness selected a readable stdout pipe, then called readline without a deadline.
Readability does not imply a complete line; readline blocked until the 240-second
outer timeout killed acceptance.

New startup reader uses select with one absolute deadline and bounded os.read
chunks. EOF, oversized lines and literal backslash-n terminators become explicit
failures. Every functional check also has a 15-second deadline and emits progress.
Regression fixtures cover a valid line, literal escape, partial line and closed
stdout with a still-live process. All four passed within their time bounds.

Rechecking unchanged candidates: ARE finished in 3.6 seconds with 1/12 functional
checks passed and its own tests passed. Summary retained 12/12 and own tests PASS.
The result demonstrates why model-authored tests alone are insufficient here.
No candidate code was repaired by the parent. The resumed model receives the
actual test failures. Frozen earlier runs and source hashes remain unchanged.
