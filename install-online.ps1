[CmdletBinding()]
param(
    [switch]$Refresh,
    [switch]$DryRun,
    [string]$InstallDir,
    [switch]$AutoUpdate,
    [switch]$NoAutoUpdate,
    [switch]$RemoveAutoUpdate
)

# Hugify installer: downloads the latest Release into one fixed folder and explains
# how to register it in Chrome/Whale. It never picks a browser or profile for the user.

$ErrorActionPreference = 'Stop'

# Force TLS 1.2 (PowerShell 5.1 compatibility)
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch {}

# GitHub Repository Information
$RepoOwner  = "jinhoOps"
$RepoName   = "chzzk-chat-icon-hugify"
$RepoBranch = "main"
$RepoUrl    = "https://github.com/jinhoOps/chzzk-chat-icon-hugify"
$ZipUrl     = "https://github.com/jinhoOps/chzzk-chat-icon-hugify/archive/refs/heads/main.zip"
$LatestReleaseApiUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/releases/latest"
$ReleaseAssetName = "hugify-extension.zip"

# Exit Codes
$ExitCodes = @{
    SUCCESS        = 0
    INVALID_ARG    = 1
    INSTALL_FAILED = 3
}

# Auto-update (Windows scheduled task, current user only)
$HugifyRoot = Join-Path $env:LOCALAPPDATA 'ChzzkIconMagnifier'
$AutoUpdateTaskName = 'HugifyAutoUpdate'
$UpdaterScriptPath = Join-Path $HugifyRoot 'updater.ps1'
$UpdateLogPath = Join-Path $HugifyRoot 'update.log'

function Write-UpdateLog([string]$Message) {
    try {
        if (-not (Test-Path -LiteralPath $HugifyRoot)) { New-Item -ItemType Directory -Path $HugifyRoot -Force | Out-Null }
        if ((Test-Path -LiteralPath $UpdateLogPath) -and (Get-Item -LiteralPath $UpdateLogPath).Length -gt 65536) {
            Remove-Item -LiteralPath $UpdateLogPath -Force
        }
        Add-Content -LiteralPath $UpdateLogPath -Value ('[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message) -Encoding UTF8
    } catch {}
}

# Saves this installer (from the given tag) as the local updater script.
# Written with a UTF-8 BOM so Windows PowerShell 5.1 reads Korean text correctly with -File.
function Save-UpdaterScript([string]$Ref) {
    $url = "https://raw.githubusercontent.com/$RepoOwner/$RepoName/$Ref/install-online.ps1"
    $content = Invoke-RestMethod -Uri $url -Headers @{ 'User-Agent' = 'chzzk-chat-icon-hugify-installer' }
    if (-not ($content -is [string]) -or $content -notmatch 'AutoUpdateTaskName') {
        throw "Updater script at $Ref does not support auto-update."
    }
    [void][scriptblock]::Create($content)
    if (-not (Test-Path -LiteralPath $HugifyRoot)) { New-Item -ItemType Directory -Path $HugifyRoot -Force | Out-Null }
    $tempPath = "$UpdaterScriptPath.tmp"
    [IO.File]::WriteAllText($tempPath, $content, (New-Object Text.UTF8Encoding $true))
    Move-Item -LiteralPath $tempPath -Destination $UpdaterScriptPath -Force
}

function Register-AutoUpdateTask {
    $userId = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $arguments = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "{0}" -AutoUpdate' -f $UpdaterScriptPath
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments -WorkingDirectory $HugifyRoot
    $triggers = @(
        (New-ScheduledTaskTrigger -AtLogOn -User $userId),
        (New-ScheduledTaskTrigger -Daily -At '18:00')
    )
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
        -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -MultipleInstances IgnoreNew
    $principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
    Register-ScheduledTask -TaskName $AutoUpdateTaskName -Action $action -Trigger $triggers -Settings $settings `
        -Principal $principal -Description 'Hugify extension auto update (checks GitHub Release)' -Force | Out-Null
}

function Unregister-AutoUpdateTask {
    if (Get-ScheduledTask -TaskName $AutoUpdateTaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $AutoUpdateTaskName -Confirm:$false
    }
    if (Test-Path -LiteralPath $UpdaterScriptPath) { Remove-Item -LiteralPath $UpdaterScriptPath -Force }
}

# 1. Install Directory (fixed, so registration and auto-update always use the same folder)
$usesDefaultInstallDir = -not $InstallDir
if (-not $InstallDir) {
    $InstallDir = Join-Path $env:LOCALAPPDATA "ChzzkIconMagnifier\app"
}

if ($RemoveAutoUpdate) {
    Unregister-AutoUpdateTask
    Write-Host 'Auto update is off. The installed extension files are kept.' -ForegroundColor Green
    Write-Host '자동 업데이트를 껐습니다. 설치된 확장 파일은 그대로 둡니다.'
    return
}

if (-not $AutoUpdate) {
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host " 치지직 이모티콘 커져라! Hugify! 설치" -ForegroundColor Cyan
    Write-Host " 저장소: $RepoUrl" -ForegroundColor Gray
    Write-Host "========================================================================" -ForegroundColor Cyan
}

# 2. Version and Release helpers
function ConvertTo-ReleaseVersion([string]$Value) {
    $normalized = ([string]$Value).Trim()
    if ($normalized.StartsWith('v', [StringComparison]::OrdinalIgnoreCase)) {
        $normalized = $normalized.Substring(1)
    }
    if ($normalized -notmatch '^\d+\.\d+\.\d+(?:\.\d+)?$') {
        throw "Invalid extension version: $Value"
    }
    return [version]$normalized
}

function Get-ValidManifest([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    try {
        $manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $Path | ConvertFrom-Json
        if ($manifest.manifest_version -ne 3 -or -not $manifest.name -or -not $manifest.version) {
            throw 'manifest_version, name, or version is missing.'
        }
        [void](ConvertTo-ReleaseVersion $manifest.version)
        return $manifest
    } catch {
        Write-Warning ("Invalid local manifest; a fresh download will be attempted. {0}" -f $_.Exception.Message)
        return $null
    }
}

function Get-LatestRelease {
    try {
        $headers = @{ 'User-Agent' = 'chzzk-chat-icon-hugify-installer' }
        $release = Invoke-RestMethod -Uri $LatestReleaseApiUrl -Headers $headers
        if (-not $release.tag_name) { throw 'The latest Release has no tag.' }
        if ($release.draft -or $release.prerelease) { throw 'The latest Release is not stable.' }

        $asset = @($release.assets | Where-Object {
            $_.name -eq $ReleaseAssetName -and $_.browser_download_url
        } | Select-Object -First 1)
        if ($asset.Count -ne 1) { throw "Release asset not found: $ReleaseAssetName" }

        [pscustomobject]@{
            Tag = [string]$release.tag_name
            Version = ConvertTo-ReleaseVersion $release.tag_name
            Url = [string]$asset[0].browser_download_url
        }
    } catch {
        Write-Warning ("Release API unavailable; using main branch fallback. {0}" -f $_.Exception.Message)
        return $null
    }
}

function Replace-InstallDirectory([string]$StagingDir, [string]$TargetDir) {
    $targetPath = [IO.Path]::GetFullPath($TargetDir)
    $parentPath = [IO.Path]::GetFullPath((Split-Path -Parent $targetPath))
    $leafName = Split-Path -Leaf $targetPath
    if (-not $leafName -or $leafName -in @('.', '..')) {
        throw "Unsafe installation directory: $TargetDir"
    }
    if (-not (Test-Path -LiteralPath $StagingDir -PathType Container)) {
        throw "Staging directory not found: $StagingDir"
    }
    if (-not (Test-Path -LiteralPath $parentPath -PathType Container)) {
        New-Item -ItemType Directory -Path $parentPath -Force | Out-Null
    }

    $backupPath = Join-Path $parentPath ('.hugify-backup-{0}' -f [Guid]::NewGuid().ToString('N'))
    $hadTarget = Test-Path -LiteralPath $targetPath -PathType Container
    try {
        if ($hadTarget) { Move-Item -LiteralPath $targetPath -Destination $backupPath -Force }
        Move-Item -LiteralPath $StagingDir -Destination $targetPath -Force
        if (Test-Path -LiteralPath $backupPath) {
            Remove-Item -LiteralPath $backupPath -Recurse -Force
        }
    } catch {
        $replacementError = $_.Exception.Message
        try {
            if (Test-Path -LiteralPath $targetPath -PathType Container) {
                Remove-Item -LiteralPath $targetPath -Recurse -Force
            }
            if (Test-Path -LiteralPath $backupPath -PathType Container) {
                Move-Item -LiteralPath $backupPath -Destination $targetPath -Force
            }
        } catch {
            throw "Install replacement failed and rollback failed: $replacementError / $($_.Exception.Message)"
        }
        throw "Install replacement failed; previous files were restored: $replacementError"
    }
}

# 3. Resolve the latest distribution and verify the installed version
$manifestFile = Join-Path $InstallDir "manifest.json"
$manifestData = Get-ValidManifest $manifestFile
$latestRelease = $null
$sourceUrl = $ZipUrl
$sourceLabel = 'main branch fallback'
$sourceVersion = $null

if (-not $DryRun) {
    $latestRelease = Get-LatestRelease
    if ($latestRelease) {
        $sourceUrl = $latestRelease.Url
        $sourceLabel = "GitHub Release $($latestRelease.Tag)"
        $sourceVersion = $latestRelease.Version
    }
} else {
    $sourceLabel = 'main branch fallback (dry-run; Release metadata not requested)'
}

$wasInstalled = [bool]$manifestData
$needsDownload = $Refresh -or (-not $manifestData)
$updateReason = if ($Refresh) { '강제 갱신이 요청되었습니다.' } elseif (-not $manifestData) { '설치 파일이 없거나 유효하지 않습니다.' } else { '현재 설치 버전을 유지합니다.' }
$localVersion = $null
if ($manifestData) {
    try { $localVersion = ConvertTo-ReleaseVersion $manifestData.version }
    catch { $manifestData = $null; $needsDownload = $true; $updateReason = '설치된 버전 정보를 읽을 수 없습니다.' }
}

if ($latestRelease -and $localVersion) {
    if ($latestRelease.Version -gt $localVersion) {
        $needsDownload = $true
        $updateReason = "새 버전 $($latestRelease.Version)이 있어 갱신합니다."
    } elseif ($latestRelease.Version -eq $localVersion) {
        $needsDownload = [bool]$Refresh
        $updateReason = if ($Refresh) { '같은 버전을 강제로 다시 받습니다.' } else { "최신 버전 $($localVersion)이 이미 설치되어 있습니다." }
    } else {
        $needsDownload = $false
        $updateReason = "로컬 버전 $($localVersion)이 Release보다 높아 다운그레이드하지 않습니다."
    }
} elseif ($latestRelease -and -not $localVersion) {
    $needsDownload = $true
    $updateReason = "Release $($latestRelease.Version)을 새로 설치합니다."
}

if ($AutoUpdate) {
    # Only update an existing install from a stable Release; never install fresh or use the branch fallback.
    if (-not $latestRelease) { Write-UpdateLog 'skip: release metadata unavailable'; return }
    if (-not $localVersion) { Write-UpdateLog 'skip: extension is not installed'; return }
    if (-not $needsDownload) { Write-UpdateLog "skip: installed $localVersion, latest $($latestRelease.Version)"; return }
    Write-UpdateLog "update: $localVersion -> $($latestRelease.Version)"
}

if ($DryRun) {
    $autoUpdatePlan = if ($NoAutoUpdate -or -not $usesDefaultInstallDir) { 'off' } else { "scheduled task $AutoUpdateTaskName" }
    Write-Host "`n[DRY RUN] plan:" -ForegroundColor Green
    Write-Host "------------------------------------------------------------------------"
    Write-Host "- Source: $sourceLabel"
    Write-Host "- Download URL: $sourceUrl"
    Write-Host "- Install folder: $InstallDir"
    Write-Host "- Installed version: $($manifestData.version)"
    Write-Host "- Source version: $(if ($sourceVersion) { $sourceVersion } else { 'unknown' })"
    Write-Host "- Download needed: $needsDownload (-Refresh: $Refresh)"
    Write-Host "- Reason: $updateReason"
    Write-Host "- Auto update: $autoUpdatePlan"
    Write-Host "------------------------------------------------------------------------"
    Write-Host "Dry-run complete: nothing was downloaded or changed.`n" -ForegroundColor Green
    return
}

# 4. Download, verify, and atomically replace the install folder
if ($needsDownload) {
    Write-Host "📦 $sourceLabel 에서 확장 파일을 내려받는 중입니다..." -ForegroundColor Yellow
    Write-Host "   URL: $sourceUrl" -ForegroundColor Gray

    $tempZip = Join-Path $env:TEMP "chzzk-magnifier-$([Guid]::NewGuid().ToString('N')).zip"
    $tempDir = Join-Path $env:TEMP "chzzk-extract-$([Guid]::NewGuid().ToString('N'))"
    $stagingDir = Join-Path (Split-Path -Parent $InstallDir) ".hugify-staging-$([Guid]::NewGuid().ToString('N'))"

    try {
        if (Get-Command Invoke-RestMethod -ErrorAction SilentlyContinue) {
            Invoke-RestMethod -Uri $sourceUrl -OutFile $tempZip
        } else {
            Invoke-WebRequest -Uri $sourceUrl -OutFile $tempZip -UseBasicParsing
        }

        if (-not (Test-Path -LiteralPath $tempZip -PathType Leaf)) {
            throw "Downloaded ZIP not found: $tempZip"
        }

        Write-Host "📂 압축을 푸는 중입니다..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        Expand-Archive -LiteralPath $tempZip -DestinationPath $tempDir -Force

        $manifestInArchive = Get-ChildItem -LiteralPath $tempDir -Filter 'manifest.json' -Recurse -File | Select-Object -First 1
        if (-not $manifestInArchive) { throw 'Downloaded archive does not contain manifest.json.' }
        $extractedRoot = Get-Item -LiteralPath (Split-Path -Parent $manifestInArchive.FullName)
        $downloadManifest = Get-ValidManifest (Join-Path $extractedRoot.FullName 'manifest.json')
        if (-not $downloadManifest) { throw 'Invalid extension manifest in downloaded archive.' }

        $downloadVersion = ConvertTo-ReleaseVersion $downloadManifest.version
        if ($sourceVersion -and $downloadVersion -ne $sourceVersion) {
            throw "Release tag and manifest version do not match: $sourceVersion / $downloadVersion"
        }
        if ($localVersion -and $downloadVersion -lt $localVersion) {
            throw "Downloaded version $downloadVersion is older than the installed version $localVersion."
        }

        New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null
        Copy-Item -Path (Join-Path $extractedRoot.FullName "*") -Destination $stagingDir -Recurse -Force
        Replace-InstallDirectory $stagingDir $InstallDir
        $manifestData = Get-ValidManifest $manifestFile
        if (-not $manifestData) { throw 'Installed manifest verification failed after replacement.' }
    }
    catch {
        if ($AutoUpdate) { Write-UpdateLog "fail: $($_.Exception.Message)" }
        Write-Host "❌ 다운로드 또는 갱신 실패: $($_.Exception.Message)" -ForegroundColor Red
        if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.INSTALL_FAILED }
        return $ExitCodes.INSTALL_FAILED
    }
    finally {
        Remove-Item -LiteralPath $tempZip -Force -ErrorAction SilentlyContinue
        $resolvedTemp = [IO.Path]::GetFullPath($tempDir)
        $tempRoot = [IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') + '\'
        if ($resolvedTemp.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path -Leaf $resolvedTemp) -match '^chzzk-extract-[a-f0-9]{32}$') {
            Remove-Item -LiteralPath $resolvedTemp -Recurse -Force -ErrorAction SilentlyContinue
        }
        if ($stagingDir -and (Test-Path -LiteralPath $stagingDir)) {
            Remove-Item -LiteralPath $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# Final manifest.json integrity check
$manifestData = Get-ValidManifest $manifestFile
if (-not $manifestData) {
    Write-Host "❌ manifest.json 검증 실패: 확장 프로그램 파일이 완전하지 않습니다. ($manifestFile)" -ForegroundColor Red
    if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.INSTALL_FAILED }
    return $ExitCodes.INSTALL_FAILED
}

if ($AutoUpdate) {
    Write-UpdateLog "done: installed $($manifestData.version)"
    try { Save-UpdaterScript $latestRelease.Tag }
    catch { Write-UpdateLog "warn: updater refresh failed. $($_.Exception.Message)" }
    return
}

# 5. Keep the extension updated automatically (only for the default install folder).
if ($NoAutoUpdate) {
    try { Unregister-AutoUpdateTask } catch {}
    Write-Host '자동 업데이트를 사용하지 않습니다.' -ForegroundColor Gray
} elseif ($usesDefaultInstallDir) {
    try {
        Save-UpdaterScript $(if ($latestRelease) { $latestRelease.Tag } else { $RepoBranch })
        Register-AutoUpdateTask
        Write-Host '🔄 자동 업데이트를 켰습니다. (로그인할 때, 매일 저녁 6시에 새 버전 확인)' -ForegroundColor Green
    } catch {
        Write-Warning ("자동 업데이트를 켜지 못했습니다. 새 버전은 이 명령을 다시 실행해 받으세요. {0}" -f $_.Exception.Message)
    }
}

# 6. Tell the user exactly where the files are and how to register them.
$copied = $false
try { Set-Clipboard -Value $InstallDir; $copied = $true } catch {}

Write-Host ''
Write-Host "✅ 파일 준비 완료 (버전 $($manifestData.version))" -ForegroundColor Green
Write-Host ''
Write-Host '설치 폴더:' -ForegroundColor Cyan
Write-Host "   $InstallDir" -ForegroundColor Green
if ($copied) { Write-Host '   (이 경로를 클립보드에 복사해 두었습니다.)' -ForegroundColor Gray }
Write-Host ''

if ($wasInstalled -and $needsDownload) {
    Write-Host '이미 브라우저에 등록했다면:' -ForegroundColor Cyan
    Write-Host '   확장 관리 화면에서 Hugify의 새로고침(↻) 버튼을 누르고, 치지직 페이지도 새로고침하세요.'
    Write-Host '   (브라우저를 껐다 켜도 새 버전이 적용됩니다.)'
    Write-Host ''
}

Write-Host '브라우저에 등록하기 (처음 한 번만):' -ForegroundColor Cyan
Write-Host '   1. 평소 쓰는 브라우저 주소창에 입력하세요.  Chrome: chrome://extensions   Whale: whale://extensions'
Write-Host '   2. 개발자 모드를 켭니다.'
Write-Host '   3. [압축해제된 확장 프로그램을 로드합니다] 버튼을 누릅니다.'
Write-Host '   4. 폴더 선택 창 위쪽 주소 칸을 클릭하고 Ctrl+V로 위 설치 폴더 경로를 붙여넣은 뒤 Enter를 누릅니다.'
Write-Host '   5. [폴더 선택]을 누르면 등록 완료입니다. 치지직 페이지를 새로고침하세요.'
Write-Host ''
