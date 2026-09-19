# EVF 0.4: filesystem-contained audit package

This candidate adds a mandatory Bubblewrap boundary to the portable EVF CLI.
It preserves the five formal adapters and executable-only workflow, including
tool-version checks, compilation, audit execution, and independent verification.

The deliverable is [the 0.4.0 archive](artifacts/evf-audit-kit-0.4.0-linux-x86_64.tar.gz)
with [SHA256SUMS](artifacts/SHA256SUMS). After extraction, start with its README
and [containment guide](template/CONTAINMENT.md).

Only the selected audit workspace is a persistent writable host mount.
The kit, explicit runtime paths and listed system support paths are read-only;
other home/project files and host services are hidden. Missing isolation blocks
execution. Runtime access is granted explicitly on each command, not by a file
that an audit provider can edit.

Important limit: providers can still change files inside the audit workspace.
Containment protects the surrounding host; it does not authenticate malicious
provider output. Kernel exploits, resource exhaustion, concurrent host changes
to selected trees, and operation on other platforms remain outside the tested
claim. The earlier intermittent TLC issue remains unresolved.

## Construction and validation

`assemble.py prepare` layers the authored `template/` files onto the immutable
0.3.0 archive. The Rust core is unchanged. `assemble.py sync` updates only the
unarchived prototype; `assemble.py archive` refuses to replace an existing
archive. The five historical example projections are inherited unchanged from
0.3.0 and are not presented as containment evidence.

`validate_archive.py` extracts into a new directory, checks every manifest entry,
runs the denial probes and regression suites, then performs a fresh five-tool
audit and verification. It retains commands, stdout, stderr, and a RESULT.json.
Supply explicit runtime roots/files and the tool paths shown in the kit README.
The archive-bound results and limitations are recorded in VALIDATION.json.

This work is local product construction and test evidence, not product approval,
commit/push, recipient delivery, open-source licensing, or production activation.
Earlier packages, original EVF sources, CRABS and unrelated work are preserved.
