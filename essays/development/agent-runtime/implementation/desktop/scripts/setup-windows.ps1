[CmdletBinding()]
param(
    [switch]$Install
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$pins = [ordered]@{
    Node = "26.8.1"
    Corepack = "0.36.0"
    Pnpm = "10.34.5"
    Rustup = "1.29.1"
    RustToolchain = "1.94.0-x86_64-pc-windows-msvc"
    BuildTools = "17.14.39"
    WebView2 = "152.0.4191.53"
    TauriCli = "2.11.4"
}

function Get-CommandOrNull([string]$Name) {
    return Get-Command $Name -ErrorAction SilentlyContinue
}

function Invoke-Checked($Command, [string[]]$Arguments, [string]$Failure) {
    $useTemporaryLocation = (Get-Location).Provider.Name -eq "FileSystem" -and (Get-Location).ProviderPath.StartsWith("\\")
    if ($useTemporaryLocation) { Push-Location $env:TEMP }
    try {
        & $Command @Arguments
        $commandExitCode = $LASTEXITCODE
    } finally {
        if ($useTemporaryLocation) { Pop-Location }
    }
    if ($commandExitCode -ne 0) {
        throw "$Failure (exit $commandExitCode)"
    }
}

function Refresh-ProcessPath() {
    $segments = @(
        [Environment]::GetEnvironmentVariable("Path", "Machine"),
        [Environment]::GetEnvironmentVariable("Path", "User"),
        (Join-Path $env:USERPROFILE ".cargo\bin"),
        $env:NVM_HOME,
        $env:NVM_SYMLINK
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    $env:Path = $segments -join ";"
}

function Test-Administrator() {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-Output($Command, [string[]]$Arguments) {
    if ($null -eq $Command) { return $null }
    $useTemporaryLocation = (Get-Location).Provider.Name -eq "FileSystem" -and (Get-Location).ProviderPath.StartsWith("\\")
    if ($useTemporaryLocation) { Push-Location $env:TEMP }
    try {
        $output = & $Command @Arguments 2>$null
        $commandExitCode = $LASTEXITCODE
    } finally {
        if ($useTemporaryLocation) { Pop-Location }
    }
    if ($commandExitCode -ne 0) { return $null }
    return ($output | Out-String).Trim()
}

function Test-WingetVersion([string]$Id, [string]$Version) {
    $winget = Get-CommandOrNull "winget"
    if ($null -eq $winget) { return $false }
    $output = Get-Output $winget @("list", "--id", $Id, "--exact", "--source", "winget", "--accept-source-agreements")
    return $null -ne $output -and $output.Contains($Version)
}

function Install-WingetExact([string]$Id, [string]$Version, [string[]]$ExtraArguments) {
    if (Test-WingetVersion $Id $Version) {
        Write-Host "$Id $Version already present"
        return
    }
    $winget = Get-CommandOrNull "winget"
    if ($null -eq $winget) { throw "winget is required for -Install" }
    $arguments = @(
        "install", "--id", $Id, "--version", $Version, "--exact", "--source", "winget",
        "--silent", "--accept-package-agreements", "--accept-source-agreements"
    ) + $ExtraArguments
    Invoke-Checked $winget $arguments "winget installation failed for $Id $Version"
}

function Get-AuditReceipt() {
    Refresh-ProcessPath
    $node = Get-CommandOrNull "node"
    $nvm = Get-CommandOrNull "nvm"
    $corepack = Get-CommandOrNull "corepack"
    $rustup = Get-CommandOrNull "rustup"
    $rustc = Get-CommandOrNull "rustc"
    $cargo = Get-CommandOrNull "cargo"
    $cl = Get-CommandOrNull "cl"
    $link = Get-CommandOrNull "link"

    $nodeVersion = Get-Output $node @("--version")
    if ($null -ne $nodeVersion) { $nodeVersion = $nodeVersion.TrimStart("v") }
    $corepackVersion = Get-Output $corepack @("--version")
    $pnpmVersion = Get-Output $corepack @("pnpm", "--version")
    $rustupVersion = Get-Output $rustup @("--version")
    $rustVersion = Get-Output $rustc @("--version")
    $tauriVersion = Get-Output $cargo @("tauri", "--version")
    $nvmVersions = Get-Output $nvm @("list")

    $checks = @(
        [ordered]@{ name = "native-windows-amd64"; expected = $true; actual = ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT -and [Environment]::Is64BitProcess -and $env:PROCESSOR_ARCHITECTURE -eq "AMD64") },
        [ordered]@{ name = "administrator"; expected = $(if ($Install) { $true } else { "required-only-for-install" }); actual = $(if ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT) { Test-Administrator } else { $false }) },
        [ordered]@{ name = "nvm-node-pin"; expected = $pins.Node; actual = $nodeVersion; available_in_nvm = ($null -ne $nvmVersions -and $nvmVersions.Contains($pins.Node)) },
        [ordered]@{ name = "corepack-pin"; expected = $pins.Corepack; actual = $corepackVersion },
        [ordered]@{ name = "pnpm-pin"; expected = $pins.Pnpm; actual = $pnpmVersion },
        [ordered]@{ name = "rustup-winget-pin"; expected = $pins.Rustup; actual = $rustupVersion; winget_exact = (Test-WingetVersion "Rustlang.Rustup" $pins.Rustup) },
        [ordered]@{ name = "rust-toolchain-pin"; expected = $pins.RustToolchain; actual = $rustVersion },
        [ordered]@{ name = "vs-build-tools-pin"; expected = $pins.BuildTools; winget_exact = (Test-WingetVersion "Microsoft.VisualStudio.2022.BuildTools" $pins.BuildTools); cl = ($null -ne $cl); link = ($null -ne $link) },
        [ordered]@{ name = "webview2-pin"; expected = $pins.WebView2; winget_exact = (Test-WingetVersion "Microsoft.EdgeWebView2Runtime" $pins.WebView2) },
        [ordered]@{ name = "tauri-cli-pin"; expected = $pins.TauriCli; actual = $tauriVersion }
    )

    $ready = (
        $nodeVersion -eq $pins.Node -and
        $corepackVersion -eq $pins.Corepack -and
        $pnpmVersion -eq $pins.Pnpm -and
        $null -ne $rustupVersion -and $rustupVersion.Contains($pins.Rustup) -and
        $null -ne $rustVersion -and $rustVersion.StartsWith("rustc 1.94.0 ") -and
        (Test-WingetVersion "Microsoft.VisualStudio.2022.BuildTools" $pins.BuildTools) -and
        (Test-WingetVersion "Microsoft.EdgeWebView2Runtime" $pins.WebView2) -and
        $null -ne $tauriVersion -and $tauriVersion.Contains($pins.TauriCli)
    )

    return [ordered]@{
        schema_version = "cav2.essays.windows-setup-audit/v1"
        mode = $(if ($Install) { "install-and-verify" } else { "audit-only" })
        pins = $pins
        checks = $checks
        ready_for_build_attempt = $ready
        build_executed = $false
        new_shell_recommended = [bool]$Install
        authority_effect = "none"
    }
}

$nativeAmd64 = (
    [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT -and
    [Environment]::Is64BitOperatingSystem -and
    [Environment]::Is64BitProcess -and
    $env:PROCESSOR_ARCHITECTURE -eq "AMD64"
)

if ($Install) {
    if (-not $nativeAmd64) { throw "-Install requires a native Windows AMD64 PowerShell process" }
    if (-not (Test-Administrator)) { throw "-Install requires an elevated Administrator PowerShell" }

    $nvm = Get-CommandOrNull "nvm"
    if ($null -eq $nvm) {
        throw "NVM for Windows is required and must be installed separately before -Install"
    }
    $nvmVersions = Get-Output $nvm @("list")
    if ($null -eq $nvmVersions -or -not $nvmVersions.Contains($pins.Node)) {
        Invoke-Checked $nvm @("install", $pins.Node, "64") "NVM could not install Node $($pins.Node)"
    }
    Invoke-Checked $nvm @("use", $pins.Node) "NVM could not activate Node $($pins.Node)"
    Refresh-ProcessPath

    $node = Get-CommandOrNull "node"
    $npm = Get-CommandOrNull "npm"
    if ((Get-Output $node @("--version")).TrimStart("v") -ne $pins.Node) {
        throw "Node $($pins.Node) is not active after nvm use"
    }
    if ($null -eq $npm) { throw "npm is unavailable after activating Node $($pins.Node)" }

    $corepack = Get-CommandOrNull "corepack"
    if ((Get-Output $corepack @("--version")) -ne $pins.Corepack) {
        Invoke-Checked $npm @("install", "--global", "corepack@$($pins.Corepack)") "Corepack installation failed"
        Refresh-ProcessPath
        $corepack = Get-CommandOrNull "corepack"
    }
    if ((Get-Output $corepack @("--version")) -ne $pins.Corepack) {
        throw "Corepack $($pins.Corepack) is not active after installation"
    }
    Invoke-Checked $corepack @("install", "--global", "pnpm@$($pins.Pnpm)") "pnpm activation failed"
    if ((Get-Output $corepack @("pnpm", "--version")) -ne $pins.Pnpm) {
        throw "pnpm $($pins.Pnpm) is not active through Corepack"
    }

    Install-WingetExact "Rustlang.Rustup" $pins.Rustup @()
    Install-WingetExact "Microsoft.VisualStudio.2022.BuildTools" $pins.BuildTools @(
        "--override", "--wait --quiet --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
    )
    Install-WingetExact "Microsoft.EdgeWebView2Runtime" $pins.WebView2 @()
    Refresh-ProcessPath

    $rustup = Get-CommandOrNull "rustup"
    if ($null -eq $rustup) { throw "rustup is unavailable after its pinned winget installation; open a new elevated shell and rerun -Install" }
    Invoke-Checked $rustup @("toolchain", "install", $pins.RustToolchain, "--profile", "minimal") "Pinned Rust toolchain installation failed"
    Invoke-Checked $rustup @("default", $pins.RustToolchain) "Pinned Rust toolchain activation failed"

    $cargo = Get-CommandOrNull "cargo"
    if ($null -eq $cargo) { throw "cargo is unavailable after Rust toolchain activation" }
    $tauriVersion = Get-Output $cargo @("tauri", "--version")
    if ($null -eq $tauriVersion -or -not $tauriVersion.Contains($pins.TauriCli)) {
        Invoke-Checked $cargo @("+$($pins.RustToolchain)", "install", "tauri-cli", "--version", $pins.TauriCli, "--locked") "tauri-cli installation failed"
    }
}

$receipt = Get-AuditReceipt
$receipt | ConvertTo-Json -Depth 8
if ($Install -and -not $receipt.ready_for_build_attempt) {
    throw "Pinned dependency verification is incomplete. Open a new elevated shell, rerun this script without -Install to inspect residue, and do not build yet."
}
