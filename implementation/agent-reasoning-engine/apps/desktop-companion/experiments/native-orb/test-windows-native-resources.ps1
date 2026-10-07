param(
    [Parameter(Mandatory = $true)][string]$OrbExe,
    [Parameter(Mandatory = $true)][string]$DashboardExe,
    [ValidateRange(1, 8)][int]$Cycles = 3
)

$ErrorActionPreference = 'Stop'
$orbPath = (Resolve-Path -LiteralPath $OrbExe).Path
$dashboardPath = (Resolve-Path -LiteralPath $DashboardExe).Path
if ($orbPath -ne (Join-Path (Split-Path -Parent $dashboardPath) 'native-orb\are-native-orb.exe')) {
    throw 'The orb and dashboard must come from the same extracted package.'
}
$existingOrbIds = @(Get-Process -Name 'are-native-orb' -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -eq $orbPath } | ForEach-Object { $_.Id })
$existingDashboardIds = @(Get-Process -Name 'are-companion' -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -eq $dashboardPath } | ForEach-Object { $_.Id })
if ($existingOrbIds.Count -or $existingDashboardIds.Count) {
    throw 'An exact-package orb or dashboard is already running; refuse to sample another session.'
}

$testRoot = Join-Path $env:TEMP ('are-native-resources-' + [guid]::NewGuid().ToString('N'))
[void][System.IO.Directory]::CreateDirectory($testRoot)
$oldPreferences = $env:ARE_COMPANION_PREFERENCES_PATH
$oldWebViewProfile = $env:WEBVIEW2_USER_DATA_FOLDER
$oldBrowserArguments = $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS
$env:ARE_COMPANION_PREFERENCES_PATH = Join-Path $testRoot 'companion.json'
$env:WEBVIEW2_USER_DATA_FOLDER = Join-Path $testRoot 'webview2'
Remove-Item Env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS -ErrorAction SilentlyContinue

Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class AreNativeResourceWindow {
    [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
}
'@

$script:tracked = @{}
$orb = $null
$dashboard = $null
$success = $false

function Wait-ExactProcess([string]$name, [string]$path, [int[]]$exclude) {
    for ($attempt = 0; $attempt -lt 80; $attempt++) {
        $matches = @(Get-Process -Name $name -ErrorAction SilentlyContinue |
            Where-Object { $_.Path -eq $path -and $_.Id -notin $exclude })
        if ($matches.Count -eq 1) { return $matches[0] }
        if ($matches.Count -gt 1) { throw "Multiple new $name processes appeared at the exact path." }
        Start-Sleep -Milliseconds 250
    }
    throw "No new $name process appeared at the exact path."
}

function Wait-Window([System.Diagnostics.Process]$process) {
    for ($attempt = 0; $attempt -lt 80; $attempt++) {
        $process.Refresh()
        if ($process.HasExited) { throw "Process $($process.Id) exited before opening its window." }
        if ($process.MainWindowHandle -ne [IntPtr]::Zero) { return $process.MainWindowHandle }
        Start-Sleep -Milliseconds 250
    }
    throw "Process $($process.Id) did not open a window."
}

function Start-Launcher([string]$path) {
    $launcher = Start-Process -FilePath $path -PassThru
    if (-not $launcher.WaitForExit(10000) -or $launcher.ExitCode -ne 0) {
        throw 'The extracted dashboard launcher failed to exit successfully.'
    }
}

function Get-ExactSnapshot([int]$orbPid) {
    $all = @(Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, ExecutablePath)
    $root = @($all | Where-Object { $_.ProcessId -eq $orbPid -and $_.ExecutablePath -eq $orbPath })
    if ($root.Count -ne 1) { throw 'The exact test orb disappeared or changed executable.' }
    $ids = @($orbPid)
    for ($index = 0; $index -lt $ids.Count; $index++) {
        $parentId = $ids[$index]
        foreach ($child in $all) {
            if ($child.ParentProcessId -eq $parentId -and $ids -notcontains $child.ProcessId) {
                $ids += [int]$child.ProcessId
            }
        }
    }
    $rows = @()
    foreach ($id in $ids) {
        $meta = $all | Where-Object ProcessId -EQ $id | Select-Object -First 1
        try {
            $process = Get-Process -Id $id -ErrorAction Stop
            $birth = $process.StartTime.ToUniversalTime().Ticks
            if ($script:tracked.ContainsKey($id) -and $script:tracked[$id].birth -ne $birth) {
                throw "Tracked process ID $id was reused during sampling."
            }
            $script:tracked[$id] = @{ birth = $birth; name = $meta.Name }
            $rows += [pscustomobject]@{ pid = $id; birth = $birth; name = $meta.Name;
                detached = $false; private_bytes = [long]$process.PrivateMemorySize64;
                working_set_bytes = [long]$process.WorkingSet64; cpu_seconds = [double]$process.CPU }
        } catch [Microsoft.PowerShell.Commands.ProcessCommandException] { }
    }
    # A WebView2 child may outlive its dashboard parent. Retain already observed
    # descendants by exact PID and creation time so close-state cost is not lost.
    foreach ($id in @($script:tracked.Keys)) {
        if ($ids -contains $id) { continue }
        try {
            $process = Get-Process -Id $id -ErrorAction Stop
            if ($process.StartTime.ToUniversalTime().Ticks -ne $script:tracked[$id].birth) { continue }
            $rows += [pscustomobject]@{ pid = $id; birth = $script:tracked[$id].birth;
                name = $script:tracked[$id].name; detached = $true;
                private_bytes = [long]$process.PrivateMemorySize64;
                working_set_bytes = [long]$process.WorkingSet64; cpu_seconds = [double]$process.CPU }
        } catch [Microsoft.PowerShell.Commands.ProcessCommandException] { }
    }
    return $rows
}

function Measure-ExactTree([int]$orbPid) {
    $before = @(Get-ExactSnapshot $orbPid)
    Start-Sleep -Seconds 10
    $after = @(Get-ExactSnapshot $orbPid)
    $prior = @{}
    foreach ($row in $before) { $prior["$($row.pid):$($row.birth)"] = $row.cpu_seconds }
    $cpu = 0.0
    foreach ($row in $after) {
        $key = "$($row.pid):$($row.birth)"
        if ($prior.ContainsKey($key)) { $cpu += [math]::Max(0, $row.cpu_seconds - $prior[$key]) }
    }
    return [pscustomobject]@{
        process_count = $after.Count
        private_bytes = [long](($after | Measure-Object private_bytes -Sum).Sum)
        working_set_bytes = [long](($after | Measure-Object working_set_bytes -Sum).Sum)
        cpu_seconds_10s = [math]::Round($cpu, 6)
        detached_process_count = @($after | Where-Object detached).Count
        process_names = @($after | ForEach-Object name)
    }
}

try {
    Start-Launcher $dashboardPath
    $orb = Wait-ExactProcess 'are-native-orb' $orbPath @()
    [void](Wait-Window $orb)
    Start-Sleep -Seconds 3
    $idle = Measure-ExactTree $orb.Id
    $rows = @()
    for ($cycle = 1; $cycle -le $Cycles; $cycle++) {
        Start-Launcher $dashboardPath
        $dashboard = Wait-ExactProcess 'are-companion' $dashboardPath @()
        $window = Wait-Window $dashboard
        Start-Sleep -Seconds 5
        $opened = Measure-ExactTree $orb.Id
        if (-not [AreNativeResourceWindow]::PostMessage($window, 0x10, [IntPtr]::Zero, [IntPtr]::Zero)) {
            throw "Dashboard close request failed in cycle $cycle."
        }
        if (-not $dashboard.WaitForExit(10000)) { throw "Dashboard did not close in cycle $cycle." }
        $dashboard = $null
        Start-Sleep -Seconds 3
        $closed = Measure-ExactTree $orb.Id
        $rows += [pscustomobject]@{ cycle = $cycle; dashboard_open = $opened;
            dashboard_closed = $closed; closed_above_initial_orb_private_bytes = $closed.private_bytes - $idle.private_bytes }
    }
    $orbWindow = Wait-Window $orb
    if (-not [AreNativeResourceWindow]::PostMessage($orbWindow, 0x10, [IntPtr]::Zero, [IntPtr]::Zero)) {
        throw 'Native orb close request failed.'
    }
    if (-not $orb.WaitForExit(10000)) { throw 'Native orb did not close.' }
    $orb = $null
    Start-Sleep -Seconds 2
    $survivors = @()
    foreach ($id in @($script:tracked.Keys)) {
        try {
            $process = Get-Process -Id $id -ErrorAction Stop
            if ($process.StartTime.ToUniversalTime().Ticks -eq $script:tracked[$id].birth) { $survivors += $id }
        } catch [Microsoft.PowerShell.Commands.ProcessCommandException] { }
    }
    if ($survivors.Count) { throw "Test-owned descendant processes survived orb close: $($survivors -join ',')" }
    $success = $true
    [pscustomobject]@{ schema_version = 'are.native-orb-windows-resource-cycles/v1'; ok = $true;
        cycles = $Cycles; sample_interval_seconds = 10; observation_mode = 'extracted-unconfigured-development';
        orb_idle = $idle; cycle_samples = $rows; exact_process_tree = $true;
        orphaned_descendants = 0; authority_effect = 'none' } | ConvertTo-Json -Compress -Depth 8
} finally {
    if ($dashboard) { Stop-Process -Id $dashboard.Id -ErrorAction SilentlyContinue }
    if ($orb) { Stop-Process -Id $orb.Id -ErrorAction SilentlyContinue }
    foreach ($id in @($script:tracked.Keys)) {
        try {
            $process = Get-Process -Id $id -ErrorAction Stop
            if ($process.StartTime.ToUniversalTime().Ticks -eq $script:tracked[$id].birth) {
                Stop-Process -Id $id -ErrorAction SilentlyContinue
            }
        } catch [Microsoft.PowerShell.Commands.ProcessCommandException] { }
    }
    $env:ARE_COMPANION_PREFERENCES_PATH = $oldPreferences
    $env:WEBVIEW2_USER_DATA_FOLDER = $oldWebViewProfile
    $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = $oldBrowserArguments
    if ($success) { Remove-Item -LiteralPath $testRoot -Recurse -Force -ErrorAction SilentlyContinue }
}
