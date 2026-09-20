[CmdletBinding()]
param(
    [ValidateSet('chrome', 'whale', 'auto')]
    [string]$Browser = 'chrome',
    [switch]$Refresh,
    [switch]$DryRun,
    [switch]$Fallback,
    [string]$InstallDir,
    [string]$ProfileDir,
    [string]$Profile,
    [string]$UserDataDir
)

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
$RawBaseUrl = "https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main"
$LatestReleaseApiUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/releases/latest"
$ReleaseAssetName = "hugify-extension.zip"

# Exit Codes
$ExitCodes = @{
    SUCCESS             = 0
    INVALID_ARG         = 1
    BROWSER_NOT_FOUND   = 2
    INSTALL_FAILED      = 3
    PROCESS_START_ERROR = 4
}

# 1. Install Directory
if (-not $InstallDir) {
    $InstallDir = Join-Path $env:LOCALAPPDATA "ChzzkIconMagnifier\app"
}
if ($ProfileDir) { throw 'ProfileDir is no longer supported. Use -Profile and -UserDataDir for existing profiles.' }

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host " 치지직 이모티콘 커져라! Hugify! 원격 설치 런처" -ForegroundColor Cyan
Write-Host " 저장소: $RepoUrl (Branch: $RepoBranch)" -ForegroundColor Gray
Write-Host "========================================================================" -ForegroundColor Cyan

# 2. Find Browser Executable
function Find-BrowserExe ([string]$target) {
    $progFiles    = $env:ProgramFiles
    $progFilesX86 = ${env:ProgramFiles(x86)}
    $localApp     = $env:LOCALAPPDATA

    $chromePaths = @(
        (Join-Path $progFiles "Google\Chrome\Application\chrome.exe"),
        (Join-Path $progFilesX86 "Google\Chrome\Application\chrome.exe"),
        (Join-Path $localApp "Google\Chrome\Application\chrome.exe")
    )
    $whalePaths = @(
        (Join-Path $progFiles "Naver\Naver Whale\Application\whale.exe"),
        (Join-Path $progFilesX86 "Naver\Naver Whale\Application\whale.exe"),
        (Join-Path $localApp "Naver\Naver Whale\Application\whale.exe")
    )

    if ($target -eq 'chrome') {
        foreach ($p in $chromePaths) {
            if (Test-Path -LiteralPath $p) { return @{ Type = 'chrome'; Name = 'Google Chrome'; Exe = $p } }
        }
        return $null
    }
    if ($target -eq 'whale') {
        foreach ($p in $whalePaths) {
            if (Test-Path -LiteralPath $p) { return @{ Type = 'whale'; Name = 'Naver Whale'; Exe = $p } }
        }
        return $null
    }
    if ($target -eq 'auto') {
        # auto: Chrome first, then Whale
        foreach ($p in $chromePaths) {
            if (Test-Path -LiteralPath $p) { return @{ Type = 'chrome'; Name = 'Google Chrome'; Exe = $p } }
        }
        foreach ($p in $whalePaths) {
            if (Test-Path -LiteralPath $p) { return @{ Type = 'whale'; Name = 'Naver Whale'; Exe = $p } }
        }
        return $null
    }
    return $null
}

function Get-ExistingProfiles([string]$Root, [string]$BrowserType = '') {
    $cache = $null
    $statePath = Join-Path $Root 'Local State'
    if (Test-Path -LiteralPath $statePath) {
        try { $cache = (Get-Content -Raw -Encoding UTF8 -LiteralPath $statePath | ConvertFrom-Json).profile.info_cache }
        catch { Write-Warning 'Cannot read Local State. Using existing profile folders.' }
    }
    if (-not (Test-Path -LiteralPath $Root -PathType Container)) { return @() }
    $items = @()
    foreach ($folder in (Get-ChildItem -LiteralPath $Root -Directory | Sort-Object Name)) {
        if ($folder.Name -notmatch '^(Default|Profile \d+)$') { continue }
        if (-not (Test-Path -LiteralPath (Join-Path $folder.FullName 'Preferences'))) { continue }
        $label = $folder.Name
        if ($cache) {
            $entry = $cache.PSObject.Properties[$folder.Name]
            if ($entry -and $entry.Value.name) { $label = [string]$entry.Value.name }
        }
        $items += [pscustomobject]@{ Directory=$folder.Name; Name=$label }
    }
    # Whale: prioritize signed-in profile (Profile 1) over unauthenticated Default
    if ($BrowserType -eq 'whale' -and $items.Count -gt 1) {
        $items = @($items | Sort-Object {
            if ($_.Directory -eq 'Profile 1') { 0 }
            elseif ($_.Directory -ne 'Default') { 1 }
            else { 2 }
        })
    }
    return $items
}

function Select-ExistingProfile($Profiles, [string]$Requested, [switch]$Preview) {
    if ($Requested) {
        $matches = @($Profiles | Where-Object { $_.Directory -eq $Requested })
        if ($matches.Count -ne 1) { throw "Existing profile not found: $Requested" }
        return $matches[0]
    }
    if ($Profiles.Count -eq 0) {
        if ($Preview) { return $null }
        throw '기존 프로필이 없습니다. 브라우저를 먼저 실행하거나 -UserDataDir로 기존 경로를 지정하세요.'
    }
    if ($Profiles.Count -eq 1) { return $Profiles[0] }
    Write-Host '사용할 브라우저 프로필을 선택하세요:'
    for ($i=0; $i -lt $Profiles.Count; $i++) {
        Write-Host ('{0}. {1} [{2}]' -f ($i+1), $Profiles[$i].Name, $Profiles[$i].Directory)
    }
    if ($Preview) { return $null }
    while ($true) {
        $answer = Read-Host '프로필 번호 (기본값: 1, 취소: q)'
        if ($answer -eq 'q') { throw 'Cancelled.' }
        if ($answer -eq '' -or $answer -eq '1') { return $Profiles[0] }
        $number = 0
        if ([int]::TryParse($answer, [ref]$number) -and $number -ge 1 -and $number -le $Profiles.Count) { return $Profiles[$number-1] }
        Write-Host '목록에 있는 번호를 입력해주세요.'
    }
}

# Version and Release helpers
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

# $b variable shortcut support (e.g. $b="whale"; irm ... | iex)
if (-not $PSBoundParameters.ContainsKey('Browser') -and $b -and ($b -in @('chrome', 'whale', 'auto'))) {
    $Browser = $b
}

# Interactive browser selection if not explicitly specified via CLI
if (-not $PSBoundParameters.ContainsKey('Browser') -and -not $b) {
    $chromeDetected = Find-BrowserExe 'chrome'
    $whaleDetected  = Find-BrowserExe 'whale'

    if ($chromeDetected -and $whaleDetected) {
        if (-not $DryRun) {
            Write-Host '설치할 브라우저를 선택하세요:' -ForegroundColor Cyan
            Write-Host '1. Google Chrome'
            Write-Host '2. Naver Whale'
            while ($true) {
                $choice = Read-Host '브라우저 번호 (기본값: 1, 취소: q)'
                if ($choice -eq 'q') { throw 'Cancelled.' }
                if ($choice -eq '' -or $choice -eq '1') {
                    $Browser = 'chrome'
                    break
                }
                if ($choice -eq '2') {
                    $Browser = 'whale'
                    break
                }
                Write-Host '1 또는 2를 입력해주세요.' -ForegroundColor Yellow
            }
        }
    } elseif ($whaleDetected -and -not $chromeDetected) {
        $Browser = 'whale'
    }
}

$browserInfo = Find-BrowserExe $Browser
if (-not $browserInfo) {
    Write-Host "❌ 요청한 브라우저($Browser)의 실행 파일을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "   기본 경로에 Google Chrome 또는 Naver Whale이 설치되어 있는지 확인해주세요." -ForegroundColor Yellow
    if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.BROWSER_NOT_FOUND }
    return $ExitCodes.BROWSER_NOT_FOUND
}


if (-not $UserDataDir) {
    $relativeRoot = if ($browserInfo.Type -eq 'whale') { 'Naver\Naver Whale\User Data' } else { 'Google\Chrome\User Data' }
    $UserDataDir = Join-Path $env:LOCALAPPDATA $relativeRoot
}
$UserDataDir = [IO.Path]::GetFullPath($UserDataDir)
$profiles = @(Get-ExistingProfiles $UserDataDir -BrowserType $browserInfo.Type)
try { $selectedProfile = Select-ExistingProfile $profiles $Profile -Preview:$DryRun }
catch { throw $_ }
$targetUrl = if ($browserInfo.Type -eq 'whale') { 'whale://extensions/' } else { 'chrome://extensions/' }
$launchArgs = @()
if ($selectedProfile) {
    if ($UserDataDir.Contains('"')) { throw 'Invalid user data path.' }
    $launchArgs = @(
        '--new-window',
        ('--user-data-dir="{0}"' -f $UserDataDir),
        ('--profile-directory="{0}"' -f $selectedProfile.Directory),
        $targetUrl
    )
}

# 4. Resolve the latest distribution and verify the installed version
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

if ($DryRun) {
    Write-Host "`n[DRY RUN] 모의 실행 계획:" -ForegroundColor Green
    Write-Host "------------------------------------------------------------------------"
    Write-Host "- 선택된 브라우저 : $($browserInfo.Name) ($($browserInfo.Type))"
    Write-Host "- 브라우저 실행파일 : $($browserInfo.Exe)"
    Write-Host "- 배포 채널 : $sourceLabel"
    Write-Host "- 원격 소스 다운로드 URL : $sourceUrl"
    Write-Host "- 앱 설치 위치 : $InstallDir"
    Write-Host "- Existing profile root: $UserDataDir"
    Write-Host "- Profile: $($selectedProfile.Directory)"
    Write-Host "- Arguments: $($launchArgs -join ' ')"
    if (-not $selectedProfile) { Write-Host "Profile selection required during installation." }
    Write-Host "- 설치된 버전 : $($manifestData.version)"
    Write-Host "- 소스 버전 : $(if ($sourceVersion) { $sourceVersion } else { 'unknown' })"
    Write-Host "- 소스 다운로드 필요 여부 : $needsDownload (-Refresh: $Refresh)"
    Write-Host "- 판단 : $updateReason"
    Write-Host "- Mode: Register extension in existing profile"
    Write-Host "------------------------------------------------------------------------"
    Write-Host "검증 완료: 브라우저 및 다운로드가 실행되지 않았습니다 (Dry-run).`n" -ForegroundColor Green
    return
}

if ($needsDownload) {
    Write-Host "📦 $sourceLabel 에서 최신 확장 파일을 내려받는 중입니다..." -ForegroundColor Yellow
    Write-Host "   URL: $sourceUrl" -ForegroundColor Gray

    $tempZip = Join-Path $env:TEMP "chzzk-magnifier-$([Guid]::NewGuid().ToString('N')).zip"
    $tempDir = Join-Path $env:TEMP "chzzk-extract-$([Guid]::NewGuid().ToString('N'))"
    $stagingDir = Join-Path (Split-Path -Parent $InstallDir) ".hugify-staging-$([Guid]::NewGuid().ToString('N'))"

    try {
        # Download the Release asset or the main branch fallback archive.
        if (Get-Command Invoke-RestMethod -ErrorAction SilentlyContinue) {
            Invoke-RestMethod -Uri $sourceUrl -OutFile $tempZip
        } else {
            Invoke-WebRequest -Uri $sourceUrl -OutFile $tempZip -UseBasicParsing
        }

        if (-not (Test-Path -LiteralPath $tempZip -PathType Leaf)) {
            throw "다운로드된 ZIP 파일을 찾을 수 없습니다: $tempZip"
        }

        Write-Host "📂 소스 코드 압축을 푸는 중입니다..." -ForegroundColor Yellow
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

        Write-Host "파일 준비 완료: $InstallDir (버전 $($manifestData.version))" -ForegroundColor Green
    }
    catch {
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
} else {
    Write-Host "✅ 설치 파일을 그대로 사용합니다: $InstallDir" -ForegroundColor Green
    Write-Host "   $updateReason" -ForegroundColor Gray
}

# Final manifest.json integrity check
$manifestData = Get-ValidManifest $manifestFile
if (-not $manifestData) {
    Write-Host "❌ manifest.json 검증 실패: 확장 프로그램 파일이 완전하지 않습니다 ($manifestFile)" -ForegroundColor Red
    if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.INSTALL_FAILED }
    return $ExitCodes.INSTALL_FAILED
}


# Open the selected existing profile. Registration is completed by the user.
try {
    Start-Process -FilePath $browserInfo.Exe -ArgumentList $launchArgs -ErrorAction Stop | Out-Null
} catch { throw "Could not open the browser: $($_.Exception.Message)" }

Write-Host ("Profile: {0} [{1}]" -f $selectedProfile.Name, $selectedProfile.Directory)
Write-Host '확장 관리 페이지가 자동으로 열리지 않으면 주소창에 직접 입력하세요:' -ForegroundColor Yellow
Write-Host ("확장 관리 주소: {0}" -f $targetUrl) -ForegroundColor Green
Write-Host '1. 열린 확장 관리 화면에서 [개발자 모드]를 켜세요.'
Write-Host '2. [압축해제된 확장 프로그램을 로드합니다]를 클릭하세요.'
Write-Host '3. 폴더 선택 창의 주소창에 아래 경로를 붙여넣고 선택하세요:'
Write-Host $InstallDir -ForegroundColor Green
Write-Host '4. 선택한 프로필에서 치지직 페이지를 새로고침하세요.'
Write-Host '파일 준비 완료. 위 브라우저 등록 단계까지 진행하면 설치가 끝납니다.'
