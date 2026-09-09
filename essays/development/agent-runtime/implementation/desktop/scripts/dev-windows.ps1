[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

function Require-Command([string]$Name) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($null -eq $command) { throw "Required command is unavailable: $Name" }
    return $command
}

if ([System.Environment]::OSVersion.Platform -ne [System.PlatformID]::Win32NT -or
    -not [System.Environment]::Is64BitProcess -or
    $env:PROCESSOR_ARCHITECTURE -ne "AMD64") {
    throw "The hot-development loop requires a native Windows AMD64 PowerShell process"
}
if ([System.IO.Path]::GetFullPath($PSScriptRoot).StartsWith("\\")) {
    throw "Use the Windows-local source mirror; UNC and WSL-hosted source paths are not supported"
}

$corepack = Require-Command "corepack"
Require-Command "node.exe" | Out-Null
Require-Command "cargo.exe" | Out-Null
Require-Command "rustc.exe" | Out-Null

$nodeVersion = (& node.exe --version).Trim().TrimStart("v")
if ($nodeVersion -ne "26.8.1") { throw "Node 26.8.1 is required; found $nodeVersion" }
$corepackVersion = (& $corepack --version | Out-String).Trim()
if ($corepackVersion -ne "0.36.0") { throw "Corepack 0.36.0 is required; found $corepackVersion" }
$pnpmVersion = (& $corepack pnpm --version | Out-String).Trim()
if ($pnpmVersion -ne "10.34.5") { throw "pnpm 10.34.5 is required; found $pnpmVersion" }
$rustVersion = (& rustc.exe --version | Out-String).Trim()
if (-not $rustVersion.StartsWith("rustc 1.94.0 ")) { throw "Rust 1.94.0 is required; found $rustVersion" }

$tauriRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../src-tauri"))
Push-Location $tauriRoot
try {
    & cargo.exe tauri dev --target x86_64-pc-windows-msvc --config "tauri.windows.conf.json"
    if ($LASTEXITCODE -ne 0) { throw "Windows Tauri hot-development loop failed" }
} finally {
    Pop-Location
}
