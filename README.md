# 치지직 이모티콘 커져라! Hugify!

치지직 채팅 이모티콘에 마우스를 올리면 크게 미리 볼 수 있는 브라우저 확장 프로그램입니다.

## 설치하기

**Windows + Chrome 또는 Whale** 기준입니다. 처음 한 번만 하면 되고, 3분 정도 걸려요.

### 1단계. 설치 명령 실행하기

1. 키보드의 **Windows 키**를 누르고 `powershell`이라고 입력한 뒤 **Enter**를 누릅니다.
   파란색(또는 검은색) 창이 열리면 됩니다.
2. 아래 회색 상자 오른쪽 위의 **복사 버튼**(📋)을 눌러 명령을 복사합니다.

```powershell
irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1 | iex
```

3. PowerShell 창에 **마우스 오른쪽 버튼을 한 번 클릭**하면 붙여넣어집니다. (Ctrl+V도 됩니다.)
4. **Enter**를 누르고 잠시 기다립니다.
5. 아래처럼 `✅ 파일 준비 완료`가 보이면 성공입니다. 설치 폴더 경로는 **자동으로 복사**되어 있어요.

```text
✅ 파일 준비 완료 (버전 1.4.0)

설치 폴더:
   C:\Users\(내 이름)\AppData\Local\ChzzkIconMagnifier\app
   (이 경로를 클립보드에 복사해 두었습니다.)
```

> PowerShell 창은 등록이 끝날 때까지 닫지 말고 두세요. 경로를 다시 복사해야 할 때 창에서 확인할 수 있습니다.

### 2단계. 브라우저에 등록하기

1. 평소 쓰는 브라우저 주소창에 아래 주소를 입력하고 **Enter**를 누릅니다.
   - Chrome: `chrome://extensions`
   - Whale: `whale://extensions`
2. **개발자 모드**를 켭니다. (Chrome은 화면 오른쪽 위, Whale은 왼쪽 메뉴 아래에 있어요.)
3. 새로 생긴 **압축해제된 확장 프로그램을 로드합니다** 버튼을 누릅니다.
4. 폴더 선택 창이 열리면, 창 **맨 위의 주소 칸**을 한 번 클릭합니다.
5. **Ctrl+V**로 복사된 경로를 붙여넣고 **Enter**를 누릅니다.
6. 오른쪽 아래 **폴더 선택** 버튼을 누릅니다.
7. 목록에 **치지직 이모티콘 커져라! Hugify!**가 나타나면 끝입니다! 🎉

치지직 방송 페이지를 새로고침하고 이모티콘에 마우스를 올려보세요. 브라우저 오른쪽 위 **퍼즐 아이콘**(🧩)에서 Hugify 옆 핀을 눌러 두면 설정 팝업을 열기 쉽습니다.

## 업데이트

**따로 할 일이 없습니다.** 설치할 때 자동 업데이트도 함께 켜져서, Windows에 로그인할 때와 매일 저녁 6시에 새 버전을 확인해 조용히 받아 둡니다. 브라우저를 다시 켜면 새 버전이 적용됩니다.

새 버전을 지금 바로 받고 싶다면 1단계의 설치 명령을 한 번 더 실행하고, `chrome://extensions`(Whale은 `whale://extensions`)에서 Hugify의 **새로고침(↻)** 버튼을 누르세요.

## 잘 안 될 때

- **빨간 글씨 오류가 나와요** → 인터넷 연결을 확인하고 설치 명령을 한 번 더 실행해 보세요.
- **폴더 선택 창에 붙여넣기가 안 돼요** → PowerShell 창에 보이는 `설치 폴더` 경로를 마우스로 드래그해 복사(Ctrl+C)한 뒤 다시 붙여넣으세요.
- **확대가 안 돼요** → 치지직 페이지를 새로고침하고, Hugify 팝업의 **ON** 표시를 확인하세요.
- **PowerShell을 쓰기 어려워요** → 아래 **직접 설치하기**를 펼쳐 보세요.

<details>
<summary><b>직접 설치하기 (PowerShell을 쓰기 어려운 경우)</b></summary>

### 1. 파일 받기

[최신 버전 다운로드 페이지](https://github.com/jinhoOps/chzzk-chat-icon-hugify/releases/latest)에서 **`hugify-extension.zip`**을 눌러 받습니다.

### 2. 압축 풀기

1. 받은 `hugify-extension.zip`을 마우스 오른쪽 버튼으로 누르고 **모두 압축 풀기**를 고른 뒤, 그대로 **압축 풀기**를 누릅니다.
2. `hugify-extension` 폴더가 생깁니다. 이 폴더를 **문서** 폴더로 끌어다 옮깁니다.
3. 옮긴 폴더를 열었을 때 `manifest.json` 파일이 바로 보이면 맞습니다.

> ⚠️ 이 폴더는 **지우거나 옮기지 마세요.** 브라우저가 이 폴더에서 확장 프로그램을 읽습니다.

### 3. 브라우저에 등록하기

위 [2단계. 브라우저에 등록하기](#2단계-브라우저에-등록하기)와 같습니다. 폴더 선택 창에서는 경로를 붙여넣는 대신 문서 폴더의 `hugify-extension` 폴더를 고르면 됩니다.

### 업데이트 (직접 설치한 경우)

자동 업데이트는 PowerShell로 설치했을 때만 켜집니다. 직접 설치했다면 새 버전이 나왔을 때 Hugify 팝업에 **새 버전 알림**이 뜹니다.

1. 알림의 **업데이트하기** 버튼을 누르면 업데이트 화면이 열립니다.
2. **업데이트하기**를 누릅니다.
3. **처음 한 번만** 폴더 선택 창이 열립니다. 설치한 `hugify-extension` 폴더를 고르고, "파일 수정 허용" 질문에 **수정 허용**을 누릅니다.
4. 새 파일로 바뀐 뒤 확장 프로그램이 다시 시작되고, 열려 있던 치지직 탭은 자동으로 새로고침됩니다.

버튼 업데이트가 안 되면 zip을 다시 받아 설치 폴더의 내용을 덮어쓴 뒤, 확장 관리 화면에서 Hugify의 **새로고침(↻)** 버튼을 누르세요.

> 설치 폴더가 기억나지 않으면 확장 관리 화면에서 Hugify의 **세부정보**를 열고 **소스** 항목의 경로를 확인하세요.

</details>

<details>
<summary>PowerShell 설치 옵션과 보안</summary>

- 설치 스크립트는 브라우저나 프로필을 고르지 않고, 브라우저를 직접 실행하지도 않습니다. 정해진 폴더(`%LOCALAPPDATA%\ChzzkIconMagnifier\app`)에 파일만 준비하고 등록 방법을 알려 줍니다.
- 관리자 권한과 Windows 레지스트리 수정을 요구하지 않습니다. 스크립트 원본은 [`install-online.ps1`](https://github.com/jinhoOps/chzzk-chat-icon-hugify/blob/main/install-online.ps1)에서 확인할 수 있습니다.
- 자동 업데이트는 현재 사용자 권한의 Windows 예약 작업(`HugifyAutoUpdate`) 하나로 동작합니다. 설치한 Release와 같은 버전의 스크립트를 `%LOCALAPPDATA%\ChzzkIconMagnifier\updater.ps1`에 저장해 실행하고, 기록은 같은 폴더의 `update.log`에 남깁니다. 정식 Release만 받고, 낮은 버전으로는 바꾸지 않습니다.
- 자동 업데이트를 끄려면 `-RemoveAutoUpdate`, 처음부터 켜지 않으려면 `-NoAutoUpdate`, 같은 버전을 다시 받으려면 `-Refresh`를 붙입니다.

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1))) -RemoveAutoUpdate
```

</details>

<details>
<summary>개발자용</summary>


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
