<#
.SYNOPSIS
치지직 채팅 아이콘 확대기 - 원격 부트스트랩 설치 및 런처 스크립트

.DESCRIPTION
Git이나 Node.js가 없는 Windows 11 / Windows 10 환경에서도
GitHub main 브랜치의 최신 소스를 %LOCALAPPDATA%의 안정적인 디렉터리에 다운로드/압축해제하고,
Google Chrome 또는 Naver Whale을 확장 로드 격리 프로필로 즉시 실행합니다.

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
브라우저 격리 프로필 디렉터리를 직접 지정합니다. (기본값: %LOCALAPPDATA%\ChzzkIconMagnifier\profile)
#>

[CmdletBinding()]
param(
    [ValidateSet('chrome', 'whale', 'auto')]
    [string]$Browser = 'chrome',
    [switch]$Refresh,
    [switch]$DryRun,
    [switch]$Fallback,
    [string]$InstallDir,
    [string]$ProfileDir
)

# $b 전역/임시 변수를 통한 단축 지정 지원 (예: $b="whale"; irm ... | iex)
if (-not $PSBoundParameters.ContainsKey('Browser') -and (Get-Variable -Name 'b' -Scope Global -ErrorAction SilentlyContinue)) {
    $val = (Get-Variable -Name 'b' -Scope Global).Value
    if ($val -in @('chrome', 'whale', 'auto')) {
        $Browser = $val
    }
}

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
if (-not $ProfileDir) {
    $ProfileDir = Join-Path $env:LOCALAPPDATA "ChzzkIconMagnifier\profile"
}

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

# 3. 브라우저 탐지
$browserInfo = Find-BrowserExe $Browser
if (-not $browserInfo) {
    Write-Host "❌ 요청한 브라우저($Browser)의 실행 파일을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "   기본 경로에 Google Chrome 또는 Naver Whale이 설치되어 있는지 확인해주세요." -ForegroundColor Yellow
    if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.BROWSER_NOT_FOUND }
    return $ExitCodes.BROWSER_NOT_FOUND
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
    Write-Host "- 격리 프로필 위치 : $ProfileDir"
    Write-Host "- 소스 다운로드 필요 여부 : $needsDownload (Refresh: $Refresh)"
    Write-Host "- 모드 : $(if ($Fallback) { 'Fallback (수동 안내)' } else { '--load-extension 격리 프로필 실행' })"
    Write-Host "------------------------------------------------------------------------"
    Write-Host "검증 완료: 브라우저 및 다운로드가 실행되지 않았습니다 (Dry-run).`n" -ForegroundColor Green
    if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.SUCCESS }
    return $ExitCodes.SUCCESS
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

        # 영구 디렉터리로 복사/이동
        if (-not (Test-Path -LiteralPath $InstallDir)) {
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        }
        Copy-Item -Path (Join-Path $extractedRoot.FullName "*") -Destination $InstallDir -Recurse -Force

        Write-Host "✅ 설치 완료: $InstallDir" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ 다운로드 또는 압축 해제 실패: $($_.Exception.Message)" -ForegroundColor Red
        if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.INSTALL_FAILED }
        return $ExitCodes.INSTALL_FAILED
    }
    finally {
        # 임시 다운로드 파일만 정리하고 영구 설치 폴더는 보존
        Remove-Item -LiteralPath $tempZip -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
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

# 5. 브라우저 실행
if ($Fallback) {
    $targetUrl = if ($browserInfo.Type -eq 'whale') { "whale://extensions" } else { "chrome://extensions" }
    Write-Host "`n🚀 [$($browserInfo.Name)] 확장 프로그램 관리 페이지를 여는 중..." -ForegroundColor Cyan
    Start-Process -FilePath $browserInfo.Exe -ArgumentList $targetUrl

    Write-Host "`n========================================================================" -ForegroundColor Cyan
    Write-Host " 💡 [$($browserInfo.Name)] 확장 프로그램 수동 로드 안내 (기존 프로필 영구 등록)" -ForegroundColor Yellow
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "1. 브라우저에서 확장 관리자 페이지($targetUrl)가 열렸습니다."
    Write-Host "2. 우측 상단의 [개발자 모드] 토글 스위치를 켭니다."
    Write-Host "3. 좌측 상단의 [압축해제된 확장 프로그램을 로드합니다] 버튼을 클릭합니다."
    Write-Host "4. 아래 폴더 경로를 복사하여 폴더 선택창에 입력합니다:"
    Write-Host "   👉 $InstallDir" -ForegroundColor Green
    Write-Host "5. 등록이 완료되면 치지직 라이브(https://chzzk.naver.com/live)에서 호버 확장이 즉시 동작합니다!"
    Write-Host "========================================================================`n" -ForegroundColor Cyan
    if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.SUCCESS }
    return $ExitCodes.SUCCESS
}

Write-Host "🚀 [$($browserInfo.Name)] 실행 중..." -ForegroundColor Cyan
Write-Host "🛡️  격리 프로필 사용: $ProfileDir" -ForegroundColor Gray
Write-Host "📌 안내: 기존 브라우저와 충돌 없이 확장을 즉시 띄우기 위해 별도 테스트 프로필로 실행합니다." -ForegroundColor Gray

try {
    if (-not (Test-Path -LiteralPath $ProfileDir)) {
        New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null
    }

    $launchArgs = @(
        "--load-extension=$InstallDir",
        "--user-data-dir=$ProfileDir",
        "--no-first-run",
        "--no-default-browser-check",
        "https://chzzk.naver.com/live"
    )

    $proc = Start-Process -FilePath $browserInfo.Exe -ArgumentList $launchArgs -PassThru
    Write-Host "✅ 브라우저 프로세스가 성공적으로 시작되었습니다 (PID: $($proc.Id))." -ForegroundColor Green
    Write-Host "💡 치지직 라이브 방송 채팅창에서 이모티콘에 마우스를 올려보세요!" -ForegroundColor Cyan
    Write-Host "💡 일상 메인 프로필에 영구 등록하고 싶다면: -Fallback 옵션을 사용하세요." -ForegroundColor Gray

    if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.SUCCESS }
    return $ExitCodes.SUCCESS
}
catch {
    Write-Host "❌ 브라우저 프로세스 실행 실패: $($_.Exception.Message)" -ForegroundColor Red
    if ($MyInvocation.InvocationName -ne '.') { exit $ExitCodes.PROCESS_START_ERROR }
    return $ExitCodes.PROCESS_START_ERROR
}
