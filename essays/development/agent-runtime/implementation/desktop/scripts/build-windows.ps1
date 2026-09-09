[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

function Require-Command([string]$Name) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        throw "Required command is unavailable: $Name"
    }
    return $command
}

function Require-Corepack() {
    $command = Get-Command "corepack" -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        throw "Corepack is not bundled with Node 26.8.1. Install an owner-approved Corepack version explicitly (for example: npm install --global corepack@<approved-version>) and rerun; this script does not install global packages."
    }
    return $command
}

function Initialize-MsvcEnvironment() {
    if ($null -ne (Get-Command "cl.exe" -ErrorAction SilentlyContinue) -and
        $null -ne (Get-Command "link.exe" -ErrorAction SilentlyContinue)) {
        return
    }

    $vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
    if (-not (Test-Path -LiteralPath $vswhere -PathType Leaf)) {
        throw "MSVC is not initialized and vswhere.exe is unavailable. Run setup-windows.ps1 -Install in an elevated shell, then open a new shell."
    }
    $installationPath = (& $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($installationPath)) {
        throw "Visual Studio Build Tools with the VCTools workload was not found"
    }
    $vsDevCmd = Join-Path $installationPath "Common7\Tools\VsDevCmd.bat"
    if (-not (Test-Path -LiteralPath $vsDevCmd -PathType Leaf)) {
        throw "VsDevCmd.bat was not found under the selected Visual Studio installation"
    }

    $environmentLines = & cmd.exe /d /s /c "`"$vsDevCmd`" -arch=x64 -host_arch=x64 >nul && set"
    if ($LASTEXITCODE -ne 0) { throw "VsDevCmd.bat failed to initialize the MSVC environment" }
    foreach ($line in $environmentLines) {
        $separator = $line.IndexOf("=")
        if ($separator -gt 0) {
            [Environment]::SetEnvironmentVariable($line.Substring(0, $separator), $line.Substring($separator + 1), "Process")
        }
    }
}

if ([System.Environment]::OSVersion.Platform -ne [System.PlatformID]::Win32NT -or
    -not [System.Environment]::Is64BitOperatingSystem -or
    -not [System.Environment]::Is64BitProcess -or
    $env:PROCESSOR_ARCHITECTURE -ne "AMD64") {
    throw "This candidate builder requires a native Windows x86-64 process"
}
if ([System.IO.Path]::GetFullPath($PSScriptRoot).StartsWith("\\")) {
    throw "The Windows build requires a Windows-local checkout on a drive path such as C:\src\domainspec-core; UNC and WSL-hosted source paths are not supported."
}

Require-Command "node.exe" | Out-Null
$corepackCommand = Require-Corepack
Require-Command "cargo.exe" | Out-Null
Require-Command "rustc.exe" | Out-Null
Require-Command "rustup.exe" | Out-Null
Require-Command "cargo-tauri.exe" | Out-Null
Initialize-MsvcEnvironment
Require-Command "cl.exe" | Out-Null
Require-Command "link.exe" | Out-Null

$nodeVersion = (& node.exe --version).Trim().TrimStart("v")
if ($nodeVersion -ne "26.8.1") {
    throw "Node 26.8.1 is required; found $nodeVersion"
}

$corepackVersion = (& $corepackCommand --version | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $corepackVersion -ne "0.36.0") {
    throw "Corepack 0.36.0 is required; found $corepackVersion"
}

$pnpmVersionOutput = & $corepackCommand pnpm --version
if ($LASTEXITCODE -ne 0) {
    throw "Corepack could not resolve pnpm 10.34.5"
}
$pnpmVersion = ($pnpmVersionOutput | Out-String).Trim()
if ($pnpmVersion -ne "10.34.5") {
    throw "pnpm 10.34.5 is required through Corepack; found $pnpmVersion"
}

$rustVersion = (& rustc.exe --version | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $rustVersion.StartsWith("rustc 1.94.0 ")) {
    throw "Rust 1.94.0 is required; found $rustVersion"
}
$tauriVersion = (& cargo.exe tauri --version | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $tauriVersion.Contains("2.11.4")) {
    throw "tauri-cli 2.11.4 is required; found $tauriVersion"
}

$target = "x86_64-pc-windows-msvc"
$installedTargets = @(& rustup.exe target list --installed)
if ($installedTargets -notcontains $target) {
    throw "Rust target is not installed: $target"
}

$workspaceRuntime = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "../../../../../../workspace/runtime")
)
$essaysRuntime = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "../../../../../runtime")
)
$implementationRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../.."))
$tauriRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../src-tauri"))

Push-Location $essaysRuntime
try {
    & $corepackCommand pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw "Frozen Essays dependency installation failed" }
} finally {
    Pop-Location
}

Push-Location $workspaceRuntime
try {
    & $corepackCommand pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw "Frozen Workspace dependency installation failed" }
    & $corepackCommand pnpm run build:implementation
    if ($LASTEXITCODE -ne 0) { throw "Workspace implementation build failed" }
} finally {
    Pop-Location
}

& cargo.exe test --locked --manifest-path (Join-Path $implementationRoot "Cargo.toml") --target $target
if ($LASTEXITCODE -ne 0) { throw "Rust tests failed" }
& cargo.exe check --locked --manifest-path (Join-Path $implementationRoot "Cargo.toml") --all-targets --target $target
if ($LASTEXITCODE -ne 0) { throw "Rust check failed" }

Push-Location $tauriRoot
try {
    & cargo.exe tauri build --target $target --config "tauri.windows.conf.json" -- --locked
    if ($LASTEXITCODE -ne 0) { throw "Windows Tauri bundle failed" }
} finally {
    Pop-Location
}

Write-Host "Windows x86-64 candidate bundles built locally; no signing or deployment was performed."
