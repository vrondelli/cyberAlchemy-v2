# Repository Rust and C toolchain

Rust, Cargo, a C/C++ compiler driver, development headers and a linker are shared
operational prerequisites for repository builds. This setup resolves the native
linker failure observed during ISB-03; it does not advance service implementation
or change DomainSpec authority. Open product work remains ISB-04.

The repository default is **Rust 1.98.1**, selected by
[../../rust-toolchain.toml](../../rust-toolchain.toml). Nested Rust toolchain files
and explicit operator overrides retain precedence. The Ubuntu 26.04 x86_64
installation uses **GCC 15.2.0** and **GNU binutils 2.46**. Package versions and
SHA-256 hashes are recorded in [lock.json](lock.json).

From the repository root:

```sh
python3 tools/toolchain/bootstrap.py
tools/toolchain/run python3 tools/toolchain/doctor.py
tools/toolchain/run cargo test --manifest-path path/to/Cargo.toml
```

`run` preserves the working directory, arguments and exit status. It adds the
shared compiler and Cargo directories to PATH, and defaults CC/CXX to the shared
drivers. It respects explicitly supplied CC/CXX and Rust overrides. To use it
from a sibling checkout or a script, invoke this same launcher by absolute path.
It needs Python 3, not Node, and works in a non-login shell with a minimal PATH.

On this machine the bootstrap also installs command symlinks into `~/.local/bin`,
which is already on PATH. Ordinary `cargo`, `rustc`, `cc`, `gcc`, `c++`, `g++`,
`cpp` and `make` commands therefore work across this user's repository sessions.
The launcher is the explicit, reliable entrypoint for CI or environments that
omit that directory. No process can retroactively change another process's PATH.

## Installation and ownership

- Rust is managed by the existing rustup installation under `${CARGO_HOME:-~/.cargo}`
  and `${RUSTUP_HOME:-~/.rustup}`. Bootstrap installs the exact pinned release,
  rustfmt and clippy, preserving the global default. A new host without rustup
  must install it from its official distribution at https://rustup.rs first.
- GCC, headers and binutils live under
  `${XDG_DATA_HOME:-~/.local/share}/cyberalchemy/toolchains/<installation_id>`.
  The exact ID is in `lock.json`; `installation.json` binds the package lock.
- The bootstrap downloads exact versions through the host's configured APT
  repositories, checks every archive against the recorded hash, and extracts
  into a staging directory before publishing the installation. It executes no
  package maintainer scripts and makes no system package changes.
- Compiler wrappers provide the private sysroot and helper-library locations.
  Installed host glibc, libgcc and libstdc++ runtime libraries remain dependencies;
  this is an Ubuntu host toolchain, not a hermetic cross compiler. The compiler's
  library environment is confined to compiler processes.
- Reruns reuse a matching installation. An incomplete/different installation
  rejects. The bootstrap never overwrites unrelated user commands; it can move
  symlinks belonging to its own prior installation to the current locked one.
- System-wide installation was unavailable because sudo requires interactive
  authentication. The user-owned installation requires no sudo or shell-profile
  edits. Binaries stay outside Git; the setup, versions and verification remain
  in this repository. Other OS/architecture combinations reject explicitly.

`doctor.py` compiles, links and executes C, C++ and Rust, then runs an offline
Cargo project whose build script compiles a C static archive and links it into
Rust. Run it through the launcher. [verification.json](verification.json) records
the local result and the recovered DomainSpec composition test.

## Optional Solana compiler

The [Solana toolchain](solana/README.md) supplies pinned SBF build tools through
`tools/toolchain/run tools/toolchain/solana/run`. It preserves the native compiler
and global Rust selection.

## Optional Linux desktop dependencies

The user-owned [desktop lock](desktop-lock.json) provides GTK 3, WebKitGTK 4.1,
pkg-config and their resolved package dependencies for the current Ubuntu 26.04
x86_64 host. This complements the shared compiler; it does not replace it.

```sh
python3 tools/toolchain/bootstrap-desktop.py
tools/toolchain/run-desktop pkg-config --libs gtk+-3.0 webkit2gtk-4.1
tools/toolchain/run-desktop python3 tools/toolchain/doctor-desktop.py
tools/toolchain/run-desktop cargo build -j 2 --locked --manifest-path essays/development/agent-runtime/implementation/desktop/src-tauri/Cargo.toml --features wdio
```

Bootstrap downloads exact package archives over HTTPS, verifies the lock's SHA-256
values against the payload, and extracts them without maintainer scripts or
system package changes. Payloads are cached under the user's shared toolchain
directory. Each lock selects a separate immutable installation path; a matching
installation receipt is reused. The wrapper scopes library and pkg-config paths
to its child command and invokes the existing `tools/toolchain/run` launcher.
Nested Rust pins and the compiler lock remain unchanged. Exact installed runtime
filenames needed by extracted development symlinks are linked into the private
overlay and recorded in `host-library-bindings.json`; no host library is edited.

The overlay omits glibc linker scripts and `libc.a`: those belong to the shared
compiler sysroot. Leaving `libc.a` without its companion linker script can silently
embed static glibc in a dynamic desktop executable and crash before main. The
desktop doctor checks a Rust executable with the overlay search path, requires
a shared `libc.so.6` dependency, and executes it.

This is a host-compatible overlay, not a hermetic sysroot: installed Ubuntu
runtime libraries and `/usr/share/pkgconfig` data metadata (including
`shared-mime-info.pc`) remain host prerequisites. The lock was resolved against
the current host's package state. A different host must validate the full native
build rather than treating `pkg-config --modversion` as sufficient evidence.

### Running the private WebKit build

Use `tools/toolchain/run-desktop-webview COMMAND ...` for desktop execution.
WebKit helper paths are compiled as system paths. This wrapper uses bubblewrap
and a temporary library-directory overlay to mount the private helpers at those
paths for the child process only. The host system path remains absent. Home,
/tmp and devices retain normal access; this wrapper is path relocation, not an
application security sandbox. Native test isolation is owned by the smoke
runner's temporary database and XDG directories. User namespaces, bubblewrap's
overlay support, and an available display are required; no fallback disables
WebKit's sandbox or installs files into /usr.

### Playwright WebKit compatibility overlay

The accessibility matrix uses Playwright's pinned headless WebKit revision 2248.
Its Ubuntu 24.04 build needs several older SONAMEs that Ubuntu 26.04 no longer
installs. [webkit-lock.json](webkit-lock.json) records the exact compatibility
archives. The bootstrap verifies and extracts them beside the existing desktop
toolchain without running package scripts or changing the system:

```sh
python3 tools/toolchain/bootstrap-webkit.py
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 \
WORKSPACE_WEBKIT_EXECUTABLE="$PWD/tools/toolchain/run-webkit" \
TEST_BROWSERS=webkit node workspace/plans/orchestrator-integration/test-browser-matrix.mjs
```

`run-webkit` supplies the locked libraries and the existing desktop overlay only
to the browser process. It rejects a missing pinned browser revision or lock
receipt. Skipping Playwright's host validator is safe only through this wrapper:
the validator inspects the system package database and cannot see user-local
libraries. A successful launch and complete browser journey are still required.

## Open Questions

- Additional OS/architecture installations need their own tested package lock.
- A machine-wide package installation can be selected later if required; the
  current setup is shared by this OS user, not every system account.
- New tools such as OpenSSL development headers, cross targets or desktop SDKs
  remain project-specific dependencies; this installation does not claim them.
