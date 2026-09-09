# Windows x86-64 adapter candidate

This package binds an authored Windows adapter to the current Essays agent-runtime system ontology and selected implementation bytes. It does not change `OPT-PLATFORM-LINUX-X64-FIRST`: Windows remains a deferred platform.

The candidate derives local process identity from the Windows process-token user SID and fails closed if the SID cannot be obtained. It keeps framed JSON platform-neutral, excludes the Unix listener on Windows, and explicitly leaves Windows named-pipe parity unimplemented. The Tauri override requests MSI and NSIS bundles, the mechanically derived ICO, WebView2 `embedBootstrapper`, and downgrade refusal.

The dependency bootstrap and builder support Windows PowerShell 5.1 and PowerShell 7. Run them from a Windows-local checkout such as `C:\src\domainspec-core`; the builder deliberately rejects UNC and WSL-hosted source paths because native command shims and bundlers are not proven reliable there.

Audit without changing the machine:

```powershell
.\cyberAlchemy-v2\essays\development\agent-runtime\implementation\desktop\scripts\setup-windows.ps1
```

The audit emits a JSON receipt and never installs dependencies or runs the build. To install the exact dependency set, open an elevated Administrator shell and opt in explicitly:

```powershell
.\cyberAlchemy-v2\essays\development\agent-runtime\implementation\desktop\scripts\setup-windows.ps1 -Install
```

The installer is idempotent and pins Node 26.8.1 through the existing NVM for Windows installation, Corepack 0.36.0, pnpm 10.34.5, Rustup 1.29.1, Rust `1.94.0-x86_64-pc-windows-msvc` with the minimal profile, Visual Studio Build Tools 2022 17.14.39 with VCTools and recommended Windows SDK components, WebView2 Runtime 152.0.4191.53, and tauri-cli 2.11.4. It uses winget and npm only after `-Install`; it does not run the application build.

After installation, close the elevated shell, open a new ordinary Windows shell, rerun the audit, and require `ready_for_build_attempt: true`. Then build explicitly:

```powershell
.\cyberAlchemy-v2\essays\development\agent-runtime\implementation\desktop\scripts\build-windows.ps1
```

The minimal frontend source closure contains both `cyberAlchemy-v2/essays/runtime` and `cyberAlchemy-v2/workspace/runtime` at their current relative paths. The Workspace links the Essays package, but a Workspace-only install does not materialize the Essays package's Milkdown dependencies. The builder therefore runs the Essays frozen install first, then the Workspace frozen install and implementation build.

The builder initializes the official Visual Studio environment through `vswhere.exe` and `VsDevCmd.bat` when necessary. It verifies all build-facing pins, installs both frontend dependency sets with their frozen lockfiles, runs locked Rust tests and checks, and requests MSI and NSIS bundles without signing or deployment.

Validate byte and posture closure from the repository root:

```sh
python3 cyberAlchemy-v2/essays/development/agent-runtime/conformance/implementation-binding/windows-adapter/scripts/validate.py
```

Linux-host checks establish only candidate self-consistency. `RESIDUE.json` enumerates the native Windows build, packaging, install, WebView2, accessibility, SQLite, relaunch, and conformance evidence that is still absent.
