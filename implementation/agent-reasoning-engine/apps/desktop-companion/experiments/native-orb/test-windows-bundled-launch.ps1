param(
    [Parameter(Mandatory = $true)][string]$OrbExe,
    [Parameter(Mandatory = $true)][string]$DashboardExe,
    [switch]$AbruptParentLoss
)

$ErrorActionPreference = 'Stop'
$orbPath = (Resolve-Path -LiteralPath $OrbExe).Path
$dashboardPath = (Resolve-Path -LiteralPath $DashboardExe).Path
$expectedOrb = Join-Path (Split-Path -Parent $dashboardPath) 'native-orb\are-native-orb.exe'
if ($orbPath -ne $expectedOrb) { throw 'The native orb is not bundled beside this dashboard executable.' }
$knownOrbIds = @(Get-Process -Name 'are-native-orb' -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$knownDashboardIds = @(Get-Process -Name 'are-companion' -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$preferenceDirectory = Join-Path $env:TEMP ('are-bundled-orb-prefs-' + [guid]::NewGuid().ToString('N'))
[void][System.IO.Directory]::CreateDirectory($preferenceDirectory)
$preferencePath = Join-Path $preferenceDirectory 'companion.json'
[System.IO.File]::WriteAllText($preferencePath, '{"skin":"cobalt","orbPlacement":"center"}', [System.Text.UTF8Encoding]::new($false))
$priorPreferencePath = $env:ARE_COMPANION_PREFERENCES_PATH
$env:ARE_COMPANION_PREFERENCES_PATH = $preferencePath

Add-Type @'
using System;
using System.Runtime.InteropServices;
[StructLayout(LayoutKind.Sequential)]
public struct AreBundledOrbRect { public int Left, Top, Right, Bottom; }
public static class AreBundledOrbInput {
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr window, out AreBundledOrbRect rect);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr window);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
    [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
}
'@

function Find-NewProcess([string]$name, [string]$path, [int[]]$knownIds) {
    return Get-Process -Name $name -ErrorAction SilentlyContinue |
        Where-Object { $_.Path -eq $path -and $_.Id -notin $knownIds } |
        Select-Object -First 1
}

function Wait-NewProcess([string]$name, [string]$path, [int[]]$knownIds, [string]$phase) {
    for ($attempt = 0; $attempt -lt 80; $attempt++) {
        $found = Find-NewProcess $name $path $knownIds
        if ($found) { return $found }
        Start-Sleep -Milliseconds 250
    }
    throw "No new $name process appeared at the exact packaged path during $phase."
}

function Wait-Window([System.Diagnostics.Process]$process) {
    for ($attempt = 0; $attempt -lt 80; $attempt++) {
        $process.Refresh()
        if ($process.MainWindowHandle -ne [IntPtr]::Zero) { return $process.MainWindowHandle }
        Start-Sleep -Milliseconds 250
    }
    throw "Process $($process.Id) did not open a window."
}

function Click-Window([IntPtr]$handle) {
    $rect = New-Object AreBundledOrbRect
    if (-not [AreBundledOrbInput]::GetWindowRect($handle, [ref]$rect)) { throw 'Orb window bounds are unavailable.' }
    [void][AreBundledOrbInput]::SetForegroundWindow($handle)
    [void][AreBundledOrbInput]::SetCursorPos(($rect.Left + $rect.Right) / 2, ($rect.Top + $rect.Bottom) / 2)
    Start-Sleep -Milliseconds 100
    [AreBundledOrbInput]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
    [AreBundledOrbInput]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
}

$orb = $null
$dashboard = $null
$reopened = $null
$focusSentinel = $null
try {
    $launcher = Start-Process -FilePath $dashboardPath -PassThru
    if (-not $launcher.WaitForExit(10000) -or $launcher.ExitCode -ne 0) {
        throw "The packaged launcher failed: hasExited=$($launcher.HasExited) exitCode=$($launcher.ExitCode)"
    }
    $orb = Wait-NewProcess 'are-native-orb' $orbPath $knownOrbIds 'initial-launch'
    $orbHandle = Wait-Window $orb
    $rect = New-Object AreBundledOrbRect
    $orbSized = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        $orb.Refresh()
        $orbHandle = $orb.MainWindowHandle
        if ($orbHandle -ne [IntPtr]::Zero -and [AreBundledOrbInput]::GetWindowRect($orbHandle, [ref]$rect) -and
            ($rect.Right - $rect.Left) -eq 84 -and ($rect.Bottom - $rect.Top) -eq 84) {
            $orbSized = $true
            break
        }
        Start-Sleep -Milliseconds 100
    }
    if (-not $orbSized) { throw "The packaged native orb was not 84x84: width=$($rect.Right - $rect.Left) height=$($rect.Bottom - $rect.Top)" }
    $orb.Refresh()
    $orbCpuBefore = $orb.TotalProcessorTime.TotalSeconds
    Start-Sleep -Seconds 10
    $orb.Refresh()
    if ($orb.HasExited) { throw 'The packaged native orb exited during its idle resource sample.' }
    $orbIdlePrivateBytes = [long]$orb.PrivateMemorySize64
    $orbIdleCpuSeconds = [math]::Max(0, $orb.TotalProcessorTime.TotalSeconds - $orbCpuBefore)

    $activationLauncher = Start-Process -FilePath $dashboardPath -PassThru
    if (-not $activationLauncher.WaitForExit(10000) -or $activationLauncher.ExitCode -ne 0) {
        throw 'A repeated packaged launch did not activate the existing orb.'
    }
    $dashboard = Wait-NewProcess 'are-companion' $dashboardPath ($knownDashboardIds + @($launcher.Id, $activationLauncher.Id)) 'repeated-launch-activation'
    $dashboardHandle = Wait-Window $dashboard
    $focusLauncher = Start-Process -FilePath $dashboardPath -PassThru
    if (-not $focusLauncher.WaitForExit(10000) -or $focusLauncher.ExitCode -ne 0) {
        throw 'A repeated packaged launch did not exit successfully.'
    }
    Start-Sleep -Milliseconds 300
    $newOrbs = @(Get-Process -Name 'are-native-orb' -ErrorAction SilentlyContinue |
        Where-Object { $_.Path -eq $orbPath -and $_.Id -notin $knownOrbIds })
    if ($newOrbs.Count -ne 1 -or $newOrbs[0].Id -ne $orb.Id) {
        throw 'A repeated packaged launch created another native orb.'
    }
    Add-Type -AssemblyName System.Windows.Forms
    $focusSentinel = New-Object System.Windows.Forms.Form
    $focusSentinel.Text = 'ARE launcher focus test'
    $focusSentinel.StartPosition = 'Manual'
    $focusSentinel.Location = New-Object System.Drawing.Point(20, 20)
    $focusSentinel.Size = New-Object System.Drawing.Size(220, 80)
    $focusSentinel.Show()
    [System.Windows.Forms.Application]::DoEvents()
    $sentinelForeground = $false
    for ($attempt = 0; $attempt -lt 10; $attempt++) {
        Click-Window $focusSentinel.Handle
        [System.Windows.Forms.Application]::DoEvents()
        if ([AreBundledOrbInput]::GetForegroundWindow() -eq $focusSentinel.Handle) { $sentinelForeground = $true; break }
        Start-Sleep -Milliseconds 100
    }
    if (-not $sentinelForeground) { throw 'Could not establish a non-dashboard foreground window for the launcher-focus test.' }
    $foreground = $false
    $refocusLauncher = Start-Process -FilePath $dashboardPath -PassThru
    if (-not $refocusLauncher.WaitForExit(10000) -or $refocusLauncher.ExitCode -ne 0) {
        throw 'A further packaged launch did not signal dashboard focus.'
    }
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if ([AreBundledOrbInput]::GetForegroundWindow() -eq $dashboardHandle) { $foreground = $true; break }
        Start-Sleep -Milliseconds 100
    }
    $duplicates = @(Get-Process -Name 'are-companion' -ErrorAction SilentlyContinue |
        Where-Object { $_.Path -eq $dashboardPath -and $_.Id -notin ($knownDashboardIds + @($launcher.Id, $activationLauncher.Id, $focusLauncher.Id, $refocusLauncher.Id)) })
    if ($duplicates.Count -ne 1 -or $duplicates[0].Id -ne $dashboard.Id) {
        throw 'A second click created a duplicate packaged dashboard.'
    }
    if (-not $foreground) { throw 'The repeated launcher did not focus the owned dashboard.' }
    $focusSentinel.Close()
    $focusSentinel.Dispose()
    $focusSentinel = $null
    Click-Window $orbHandle

    if ($AbruptParentLoss) {
        Stop-Process -Id $orb.Id -Force -ErrorAction Stop
        if (-not $dashboard.WaitForExit(10000)) { throw 'The dashboard survived abrupt packaged-orb loss.' }
        [pscustomobject]@{
            schema_version = 'are.bundled-native-orb-windows-test/v1'
            launcher_exited = $true
            orb_84x84 = $true
            orb_idle_private_bytes = $orbIdlePrivateBytes
            orb_idle_cpu_seconds_10s = $orbIdleCpuSeconds
            duplicate_orb_prevented = $true
            dashboard_opened = $true
            dashboard_opened_by_repeated_launcher = $true
            duplicate_dashboard_prevented = $true
            foreground_focus = $true
            abrupt_orb_loss = $true
            owned_dashboard_exited = $true
            authority_effect = 'none'
        } | ConvertTo-Json -Compress
        return
    }

    [void][AreBundledOrbInput]::SendMessage($dashboardHandle, 0x10, [IntPtr]::Zero, [IntPtr]::Zero)
    if (-not $dashboard.WaitForExit(10000)) { throw 'The first packaged dashboard did not close.' }
    for ($activation = 0; $activation -lt 5; $activation++) {
        Click-Window $orbHandle
        for ($attempt = 0; $attempt -lt 8; $attempt++) {
            $reopened = Find-NewProcess 'are-companion' $dashboardPath ($knownDashboardIds + @($launcher.Id, $dashboard.Id))
            if ($reopened) { break }
            Start-Sleep -Milliseconds 250
        }
        if ($reopened) { break }
    }
    if (-not $reopened) { throw 'The packaged orb did not reopen its dashboard after five clicks.' }
    [void](Wait-Window $reopened)
    [void][AreBundledOrbInput]::SendMessage($orbHandle, 0x10, [IntPtr]::Zero, [IntPtr]::Zero)
    if (-not $orb.WaitForExit(10000)) { throw 'The packaged native orb did not close.' }
    if (-not $reopened.WaitForExit(10000)) { throw 'The reopened dashboard survived normal packaged-orb close.' }
    [pscustomobject]@{
        schema_version = 'are.bundled-native-orb-windows-test/v1'
        launcher_exited = $true
        orb_84x84 = $true
        orb_idle_private_bytes = $orbIdlePrivateBytes
        orb_idle_cpu_seconds_10s = $orbIdleCpuSeconds
        duplicate_orb_prevented = $true
        dashboard_opened = $true
        dashboard_opened_by_repeated_launcher = $true
        duplicate_dashboard_prevented = $true
        foreground_focus = $true
        dashboard_reopened_after_close = $true
        owned_dashboard_exited = $true
        authority_effect = 'none'
    } | ConvertTo-Json -Compress
} finally {
    if ($focusSentinel) { $focusSentinel.Close(); $focusSentinel.Dispose() }
    if ($reopened) { Stop-Process -Id $reopened.Id -ErrorAction SilentlyContinue }
    if ($dashboard) { Stop-Process -Id $dashboard.Id -ErrorAction SilentlyContinue }
    if ($orb) { Stop-Process -Id $orb.Id -ErrorAction SilentlyContinue }
    $env:ARE_COMPANION_PREFERENCES_PATH = $priorPreferencePath
}
