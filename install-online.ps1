<#
.SYNOPSIS
치지직 채팅 아이콘 확대기 - 원격 부트스트랩 설치 및 런처 스크립트

.DESCRIPTION
Git이나 Node.js가 없는 Windows 11 / Windows 10 환경에서도
GitHub main 브랜치의 최신 소스를 %LOCALAPPDATA%의 안정적인 디렉터리에 다운로드/압축해제하고,
Google Chrome 또는 Naver Whale의 기존 프로필에서 확장 등록 화면을 엽니다.

.PARAMETER Browser
실행할 브라우저를 선택합니다 ('chrome', 'whale', 'auto'). 기본값: 'chrome'

.PARAMETER Refresh
이미 설치된 소스가 있더라도 GitHub에서 최신 소스를 다시 다운로드하여 갱신합니다.

.PARAMETER DryRun
실제 다운로드나 브라우저 실행 없이 계획된 경로와 인자만 출력하고 검증합니다.

.PARAMETER Fallback
브라우저의 확장 프로그램 관리자 페이지를 열고 수동 설치 가이드를 터미널에 안내합니다.

.PARAMETER InstallDir
확장 프로그램이 설치될 로컬 디렉터리를 직접 지정합니다. (기본값: %LOCALAPPDATA%\ChzzkIconMagnifier\app)

.PARAMETER ProfileDir
이전 옵션입니다. 기존 프로필 선택에는 -Profile, -UserDataDir를 사용하세요.
#>

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

# TLS 1.2 강제 활성화 (PowerShell 5.1 호환)
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch {}

# GitHub 원격 저장소 정보
$RepoOwner  = "jinhoOps"
$RepoName   = "chzzk-chat-icon-hugify"
$RepoBranch = "main"
$RepoUrl    = "https://github.com/jinhoOps/chzzk-chat-icon-hugify"
$ZipUrl     = "https://github.com/jinhoOps/chzzk-chat-icon-hugify/archive/refs/heads/main.zip"
$RawBaseUrl = "https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main"

# 종료 코드 정의
$ExitCodes = @{
    SUCCESS             = 0
    INVALID_ARG         = 1
    BROWSER_NOT_FOUND   = 2
    INSTALL_FAILED      = 3
    PROCESS_START_ERROR = 4
}

# 1. 안정적인 설치 디렉터리 결정
if (-not $InstallDir) {
    $InstallDir = Join-Path $env:LOCALAPPDATA "ChzzkIconMagnifier\app"
}
if ($ProfileDir) { throw 'ProfileDir is no longer supported. Use -Profile and -UserDataDir for existing profiles.' }

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host " 🔍 치지직 채팅 아이콘 확대기 (CHZZK Icon Magnifier) 원격 설치 런처" -ForegroundColor Cyan
Write-Host " 저장소: $RepoUrl (Branch: $RepoBranch)" -ForegroundColor Gray
Write-Host "========================================================================" -ForegroundColor Cyan

# 2. 브라우저 실행 파일 후보 경로 탐색 함수
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
        # auto: Chrome 우선 탐지 -> Whale 폴백
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


function Get-ExistingProfiles([string]$Root) {
    $cache = $null
    $statePath = Join-Path $Root 'Local State'
    if (Test-Path -LiteralPath $statePath) {
        try { $cache = (Get-Content -Raw -Encoding UTF8 -LiteralPath $statePath | ConvertFrom-Json).profile.info_cache }
        catch { Write-Warning 'Cannot read Local State. Using existing profile folders.' }
    }
    if (-not (Test-Path -LiteralPath $Root -PathType Container)) { return }
    foreach ($folder in (Get-ChildItem -LiteralPath $Root -Directory | Sort-Object Name)) {
        if ($folder.Name -notmatch '^(Default|Profile \d+)$') { continue }
        if (-not (Test-Path -LiteralPath (Join-Path $folder.FullName 'Preferences'))) { continue }
        $label = $folder.Name
        if ($cache) {
            $entry = $cache.PSObject.Properties[$folder.Name]
            if ($entry -and $entry.Value.name) { $label = [string]$entry.Value.name }
        }
        [pscustomobject]@{ Directory=$folder.Name; Name=$label }
    }
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
        $answer = Read-Host '프로필 번호 (취소: q)'
        if ($answer -eq 'q') { throw 'Cancelled.' }
        $number = 0
        if ([int]::TryParse($answer, [ref]$number) -and $number -ge 1 -and $number -le $Profiles.Count) { return $Profiles[$number-1] }
        Write-Host '목록에 있는 번호를 입력해주세요.'
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
$profiles = @(Get-ExistingProfiles $UserDataDir)
try { $selectedProfile = Select-ExistingProfile $profiles $Profile -Preview:$DryRun }
catch { throw $_ }
$targetUrl = if ($browserInfo.Type -eq 'whale') { 'whale://extensions/' } else { 'chrome://extensions/' }
$launchArgs = @()
if ($selectedProfile) {
    if ($UserDataDir.Contains('"')) { throw 'Invalid user data path.' }
    $launchArgs = @(
        ('--user-data-dir="{0}"' -f $UserDataDir),
        ('--profile-directory="{0}"' -f $selectedProfile.Directory),
        $targetUrl
    )
}

# 4. 소스 코드 설치 또는 확인
$manifestFile = Join-Path $InstallDir "manifest.json"
$needsDownload = $Refresh -or (-not (Test-Path -LiteralPath $manifestFile))

if ($DryRun) {
    Write-Host "`n[DRY RUN] 모의 실행 계획:" -ForegroundColor Green
    Write-Host "------------------------------------------------------------------------"
    Write-Host "- 선택된 브라우저 : $($browserInfo.Name) ($($browserInfo.Type))"
    Write-Host "- 브라우저 실행파일 : $($browserInfo.Exe)"
    Write-Host "- 원격 소스 다운로드 URL : $ZipUrl"
    Write-Host "- 앱 설치 위치 : $InstallDir"
    Write-Host "- Existing profile root: $UserDataDir"
    Write-Host "- Profile: $($selectedProfile.Directory)"
    Write-Host "- Arguments: $($launchArgs -join ' ')"
    if (-not $selectedProfile) { Write-Host "Profile selection required during installation." }
    Write-Host "- 소스 다운로드 필요 여부 : $needsDownload (Refresh: $Refresh)"
    Write-Host "- Mode: Register extension in existing profile"
    Write-Host "------------------------------------------------------------------------"
    Write-Host "검증 완료: 브라우저 및 다운로드가 실행되지 않았습니다 (Dry-run).`n" -ForegroundColor Green
    return
}

if ($needsDownload) {
    Write-Host "📦 GitHub에서 최신 소스 코드를 내려받는 중입니다..." -ForegroundColor Yellow
    Write-Host "   URL: $ZipUrl" -ForegroundColor Gray

    $tempZip = Join-Path $env:TEMP "chzzk-magnifier-$([Guid]::NewGuid().ToString('N')).zip"
    $tempDir = Join-Path $env:TEMP "chzzk-extract-$([Guid]::NewGuid().ToString('N'))"

    try {
        # PowerShell 5.1/7.x 호환 다운로드
        if (Get-Command Invoke-RestMethod -ErrorAction SilentlyContinue) {
            Invoke-RestMethod -Uri $ZipUrl -OutFile $tempZip
        } else {
            Invoke-WebRequest -Uri $ZipUrl -OutFile $tempZip -UseBasicParsing
        }

        if (-not (Test-Path -LiteralPath $tempZip)) {
            throw "다운로드된 ZIP 파일을 찾을 수 없습니다: $tempZip"
        }

        # 압축 해제
        Write-Host "📂 소스 코드 압축을 푸는 중입니다..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        Expand-Archive -LiteralPath $tempZip -DestinationPath $tempDir -Force

        # GitHub ZIP 내부의 루트 폴더 탐색 (chzzk-chat-icon-hugify-main)
        $extractedRoot = Get-ChildItem -LiteralPath $tempDir | Where-Object { $_.PSIsContainer } | Select-Object -First 1
        if (-not $extractedRoot) {
            $extractedRoot = Get-Item -LiteralPath $tempDir
        }

        $downloadManifest = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $extractedRoot.FullName 'manifest.json') | ConvertFrom-Json
        if ($downloadManifest.manifest_version -ne 3 -or -not $downloadManifest.name) { throw 'Invalid extension manifest.' }
        # 영구 디렉터리로 복사/이동
        if (-not (Test-Path -LiteralPath $InstallDir)) {
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        }
        Copy-Item -Path (Join-Path $extractedRoot.FullName "*") -Destination $InstallDir -Recurse -Force

        Write-Host "파일 준비 완료: $InstallDir" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ 다운로드 또는 압축 해제 실패: $($_.Exception.Message)" -ForegroundColor Red
        if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.INSTALL_FAILED }
        return $ExitCodes.INSTALL_FAILED
    }
    finally {
        # 임시 다운로드 파일만 정리하고 영구 설치 폴더는 보존
        Remove-Item -LiteralPath $tempZip -Force -ErrorAction SilentlyContinue
        $resolvedTemp = [IO.Path]::GetFullPath($tempDir)
        $tempRoot = [IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') + '\'
        if ($resolvedTemp.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path -Leaf $resolvedTemp) -match '^chzzk-extract-[a-f0-9]{32}$') {
            Remove-Item -LiteralPath $resolvedTemp -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "✅ 이미 설치된 확장 프로그램 소스를 사용합니다: $InstallDir" -ForegroundColor Green
    Write-Host "   (최신 코드로 갱신하려면 -Refresh 옵션을 사용하세요)" -ForegroundColor Gray
}

# manifest.json 최종 무결성 검증
if (-not (Test-Path -LiteralPath $manifestFile)) {
    Write-Host "❌ manifest.json 검증 실패: 확장 프로그램 파일이 완전하지 않습니다 ($manifestFile)" -ForegroundColor Red
    if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.INSTALL_FAILED }
    return $ExitCodes.INSTALL_FAILED
}


# Open the selected existing profile. Registration is completed by the user.
$manifestData = Get-Content -Raw -Encoding UTF8 -LiteralPath $manifestFile | ConvertFrom-Json
if ($manifestData.manifest_version -ne 3 -or -not $manifestData.name) { throw 'Invalid extension manifest.' }
try {
    Start-Process -FilePath $browserInfo.Exe -ArgumentList $launchArgs -ErrorAction Stop | Out-Null
} catch { throw "Could not open the browser: $($_.Exception.Message)" }

Write-Host ("Profile: {0} [{1}]" -f $selectedProfile.Name, $selectedProfile.Directory)
Write-Host '1. 열린 확장 관리 화면에서 [개발자 모드]를 켜세요.'
Write-Host '2. [압축해제된 확장 프로그램을 로드합니다]를 클릭하세요.'
Write-Host '3. 폴더 선택 창의 주소창에 아래 경로를 붙여넣고 선택하세요:'
Write-Host $InstallDir -ForegroundColor Green
Write-Host '4. 선택한 프로필에서 치지직 페이지를 새로고침하세요.'
Write-Host '파일 준비 완료. 위 브라우저 등록 단계까지 진행하면 설치가 끝납니다.'
