# What the filesystem boundary does

EVF needs file access. The goal is not zero file access: it is an explicit,
enforced limit on which host files an audit can see and change.

The public `./evf` launcher validates the selected paths and starts Bubblewrap
with a new filesystem view. It mounts the package and selected tool paths
read-only, mounts exactly one audit workspace read-write, supplies disposable
temporary storage, and starts the existing EVF command inside that boundary.
Tool probes, compilation, the Rust runner, its descendants, and the separate
verifier all execute there. `init` and `formal-init` only copy packaged examples
to a new user-selected directory; they do not execute provider code.

## Exact access policy

| Area | Access |
| --- | --- |
| Explicit `--workspace` | Read and write, including the inputs and evidence inside it |
| Extracted kit | Read-only |
| Each explicit `--runtime` directory or regular file | Read-only; whole selected directories are readable |
| Existing `/usr/bin`, `/usr/lib/x86_64-linux-gnu`, `/usr/lib/gcc`, `/usr/libexec/gcc`, `/usr/lib/python3.N`, `/usr/lib64`, `/usr/include`, `/etc/alternatives`, `/etc/ld.so.cache` | Read-only system support; these are trusted host-runtime inputs; the rest of `/usr/lib` is not exposed |
| `/bin`, `/lib`, `/lib64` | Aliases to the corresponding mounted system directories |
| `/tmp` and synthetic home | Disposable sandbox-local storage |
| `/proc` and `/dev` | New process view and minimal sandbox devices, not the host's process/device tree |
| Other host paths, `/run` sockets, host home and other projects | Absent unless an exact subpath is an explicitly permitted kit/workspace/runtime |
| Network and IPC | Separate namespaces; no host network or host service sockets mounted |

Ancestors needed to place an allowed deep path are empty container directories,
not mounts of the host ancestors. Selecting a kit under a home directory does
not expose the rest of that home. System runtime trees are not hermetic or
secret-scanned: do not store confidential data in those intentionally visible
system paths. Use a separate VM if that host-runtime exposure is unacceptable.
An absolute pathname under private `/tmp` can be recreated inside the sandbox;
that new disposable file is not the same-named host file. Denial tests check
the real host sentinel independently rather than treating every successful
temporary-file write as a host escape.

The launcher rejects broad host roots, home roots, overlapping mounts, a
workspace containing a top-level checkout/credential marker, workspace symlinks
and hard-linked files, nested user-tree mounts, and sockets/devices/FIFOs in
selected trees. Runtime symlinks can resolve only within the permitted view.
These checks require the host's selected trees to remain quiescent during
validation and launch; this is not protection against a concurrent host writer
replacing subtrees after the check.

Runtime grants are repeated on the command line. They are never loaded from an
audit specification, tool manifest, environment-variable bypass, or writable
workspace configuration. A provider cannot edit a saved audit file to request
the owner's home directory on the next invocation.

## Isolation and failure behavior

The launcher requests user, mount, PID, network, IPC and UTS namespaces, drops
capabilities, uses a new session, clears inherited environment variables and
closes caller file descriptors. It passes only standard output/error pipes,
null input and a descriptor containing the public launch policy. Bubblewrap
provides `no_new_privs`. Descendants are reaped by the PID namespace and die with
the containing process. Existing EVF child user/network namespaces remain
enabled, so this version does not disable nested user namespaces.

A read-only launch context records the host namespace identities. Python
execution paths check that the required current namespaces differ from those
identities before launching providers. Missing Bubblewrap, missing namespace
support, an invalid path, or a failed mount blocks execution. There is no
`--unsafe`, `--no-sandbox`, or automatic fallback.

The outer process caps captured output and wall-clock time. This is not a full
resource-control system: memory, fork counts and workspace disk usage have no
cgroup quota. The whole toolchain still shares the host kernel. A kernel/runtime
vulnerability is outside this candidate's demonstrated boundary.

## What this does NOT prove

The audit workspace is shared and writable. A malicious provider could corrupt
its inputs, evidence, or other files there. Do not run a provider you distrust
and then treat its own output as authenticated evidence. File-access confinement
and evidence integrity are separate problems. The toolkit, operating system,
Bubblewrap and installed runtimes remain trusted. Do not run as root.

Low-level binaries remain inside `bin/` for EVF's internal use and reproducible
builds. Deliberately executing a raw internal binary instead of `./evf` is
outside this interface's guarantee. This is not a system-wide access policy for
everything the owner might run from a terminal.

The `containment` object returned by the host launcher describes a launched
policy. It is not a signed kernel attestation, not an additional Lean theorem,
and not proof that hostile code cannot forge a result inside the writable audit
workspace. Existing formal claim formats retain their narrower meaning.

## Test the boundary

`python3 -B tests/test_containment.py` is a host-side controller. Its synthetic
probe runs inside the actual namespace and attempts reads/writes outside the
workspace, read-only kit/runtime changes, link-based access, host process/root
access, networking, and descriptor inheritance. Tests also exercise denial
before launch and unavailable-runtime failure. Successful permitted file access
is tested too, so a non-running probe cannot masquerade as containment success.

Run all five real adapter examples afterward: a boundary that prevents the
intended audit from running is not a completed integration. Validation records
are platform- and archive-specific; tests on one host are not a general security
certification. The unresolved earlier TLC setup issue remains separate.

## Design references

Bubblewrap creates the namespace/mount mechanism; EVF owns this particular
allowlist and its tests. The upstream documentation explicitly distinguishes the
mechanism from a complete sandbox policy and describes its limitations:
[Bubblewrap 0.9.0 documentation](https://github.com/containers/bubblewrap/blob/v0.9.0/README.md).
