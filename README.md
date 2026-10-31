# 치지직 이모티콘 커져라! Hugify!

치지직 채팅 이모티콘에 마우스를 올리면 크게 미리 볼 수 있는 브라우저 확장 프로그램입니다.

## 설치하기 (처음 한 번)

**Chrome 또는 Whale**에서 쓸 수 있습니다. 두 방법 중 편한 쪽을 고르세요.

| | 방법 1. 직접 압축 풀기 (기본) | 방법 2. PowerShell 한 줄 설치 |
|---|---|---|
| 준비 | zip 받아서 압축 풀기 | 명령 한 줄 붙여넣기 |
| 설치 위치 | 내가 고른 폴더 (문서 폴더 권장) | `%LOCALAPPDATA%\ChzzkIconMagnifier\app` (자동) |
| 업데이트 | 팝업의 **업데이트하기** 버튼 | **자동** (로그인할 때, 매일 저녁 6시) |

두 방법 모두 마지막에 브라우저에서 [폴더를 등록](#브라우저에-등록하기)하는 단계는 같습니다.

### 방법 1. 직접 압축 풀기

1. [최신 버전 다운로드 페이지](https://github.com/jinhoOps/chzzk-chat-icon-hugify/releases/latest)에서 **`hugify-extension.zip`**을 눌러 받습니다.
2. 받은 `hugify-extension.zip`을 마우스 오른쪽 버튼으로 누르고 **모두 압축 풀기**를 고른 뒤, 그대로 **압축 풀기**를 누릅니다.
3. `hugify-extension` 폴더가 생깁니다. 이 폴더를 **문서** 폴더로 끌어다 옮깁니다.
4. 옮긴 폴더를 열었을 때 `manifest.json` 파일이 바로 보이면 맞습니다. 이 폴더를 [브라우저에 등록](#브라우저에-등록하기)하세요.

> ⚠️ 이 폴더는 **지우거나 옮기지 마세요.** 브라우저가 이 폴더에서 확장 프로그램을 읽습니다. 다운로드 폴더는 나중에 정리하다 지우기 쉬우니 문서 폴더를 권장합니다.

### 방법 2. PowerShell로 설치하기

1. 시작 메뉴에서 **PowerShell**을 검색해 엽니다.
2. 아래 명령을 복사해 붙여넣고 **Enter**를 누릅니다.

```powershell
irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1 | iex
```

3. 최신 버전을 받아 아래 폴더에 풀고, **이 경로를 클립보드에 복사**해 둡니다. 화면에 등록 방법도 함께 나옵니다.

```text
%LOCALAPPDATA%\ChzzkIconMagnifier\app
```

4. 이어서 [브라우저에 등록](#브라우저에-등록하기)하세요. 폴더를 고를 때 경로를 붙여넣기(Ctrl+V)만 하면 됩니다.

### 브라우저에 등록하기

1. 평소 쓰는 브라우저 주소창에 아래 주소를 입력하고 Enter를 누릅니다.
   - Chrome: `chrome://extensions`
   - Whale: `whale://extensions`
2. 화면 오른쪽 위(Whale은 왼쪽 메뉴 아래)의 **개발자 모드**를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 누릅니다.
4. 폴더 선택 창에서 설치 폴더를 고릅니다.
   - 방법 1: 문서 폴더의 `hugify-extension` 폴더
   - 방법 2: 창 위쪽 **주소 칸**을 클릭하고 **Ctrl+V**(복사된 경로)를 붙여넣은 뒤 Enter
5. **폴더 선택**을 누르고, 목록에 **치지직 이모티콘 커져라! Hugify!**가 나타나면 완료입니다.

치지직 페이지를 새로고침하고 이모티콘에 마우스를 올려보세요. 브라우저 오른쪽 위 퍼즐 아이콘에서 Hugify를 고정해 두면 설정 팝업을 열기 쉽습니다.

## 업데이트하기

### 방법 1로 설치했다면: 버튼으로 업데이트

새 버전이 나오면 Hugify 팝업에 **새 버전 알림**이 뜹니다.

1. 알림의 **업데이트하기** 버튼을 누르면 업데이트 화면이 열립니다.
2. **업데이트하기**를 누릅니다.
3. **처음 한 번만** 폴더 선택 창이 열립니다. 설치할 때 고른 `hugify-extension` 폴더를 선택하고, "파일 수정 허용" 질문에 **수정 허용**을 누릅니다.
4. 새 파일을 받아 바꾼 뒤 확장 프로그램이 다시 시작되고, 열려 있던 치지직 탭은 자동으로 새로고침됩니다.

다음부터는 버튼만 누르면 됩니다. 브라우저를 다시 켠 뒤에는 "수정 허용"을 한 번 더 물어볼 수 있습니다.

### 방법 2로 설치했다면: 자동 업데이트

따로 할 일이 없습니다. Windows에 로그인할 때와 매일 저녁 6시에 새 버전을 확인해 조용히 받아 둡니다. 브라우저를 다시 켜거나 치지직 탭을 모두 닫으면 새 버전이 적용됩니다.

바로 받고 싶으면 설치 명령을 다시 실행한 뒤, 확장 관리 화면에서 Hugify의 **새로고침(↻)** 버튼을 누르세요. 팝업의 **업데이트하기** 버튼도 쓸 수 있습니다. 이때 폴더는 `%LOCALAPPDATA%\ChzzkIconMagnifier\app`을 고르면 됩니다.

> 설치 폴더가 기억나지 않으면 확장 관리 화면에서 Hugify의 **세부정보**를 열고 **소스** 항목의 경로를 확인하세요.

<details>
<summary>기타 안내 보기</summary>

### 버튼 업데이트가 안 될 때

[최신 버전 다운로드 페이지](https://github.com/jinhoOps/chzzk-chat-icon-hugify/releases/latest)에서 zip을 받아, 설치 폴더의 내용을 새 파일로 덮어씁니다. 그런 다음 확장 관리 화면에서 Hugify의 **새로고침(↻)** 버튼을 누르고 치지직 페이지도 새로고침하세요.

### PowerShell 설치 옵션과 보안

- 설치 스크립트는 브라우저나 프로필을 고르지 않고, 브라우저를 직접 실행하지도 않습니다. 정해진 폴더에 파일만 준비하고 등록 방법을 알려 줍니다.
- 관리자 권한과 Windows 레지스트리 수정을 요구하지 않습니다. 스크립트 원본은 [`install-online.ps1`](https://github.com/jinhoOps/chzzk-chat-icon-hugify/blob/main/install-online.ps1)에서 확인할 수 있습니다.
- 자동 업데이트는 현재 사용자 권한의 Windows 예약 작업(`HugifyAutoUpdate`) 하나로 동작합니다. 설치한 Release와 같은 버전의 스크립트를 `%LOCALAPPDATA%\ChzzkIconMagnifier\updater.ps1`에 저장해 실행하고, 기록은 같은 폴더의 `update.log`에 남깁니다. 정식 Release만 받고, 낮은 버전으로는 바꾸지 않습니다.
- 자동 업데이트를 끄려면 `-RemoveAutoUpdate`, 처음부터 켜지 않으려면 `-NoAutoUpdate`, 같은 버전을 다시 받으려면 `-Refresh`를 붙입니다.

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1))) -RemoveAutoUpdate
```

### 개발자용

```powershell
npm test
```

새 버전을 배포할 때는 `manifest.json`과 `package.json`의 버전을 맞춘 뒤 `vX.Y.Z` 태그를 푸시합니다. GitHub Actions가 버전을 확인하고 `hugify-extension.zip`을 Release로 만듭니다.

```powershell
npm test
git add manifest.json package.json src icons fonts README.md
git commit -m "release: vX.Y.Z"
git push origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

CookieRun 서체는 팝업 UI에 원본 파일 그대로 번들하며, 사용 조건은 [`fonts/LICENSE-CookieRun.txt`](fonts/LICENSE-CookieRun.txt)에 기록했습니다. 공식 라이선스도 함께 확인하세요: [CookieRun FONT LICENSE](https://www.cookierunfont.com/static/download/License_ko_en.pdf)

</details>
