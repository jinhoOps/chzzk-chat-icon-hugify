# 치지직 이모티콘 커져라! Hugify!

치지직 채팅 이모티콘에 마우스를 올리면 크게 미리 볼 수 있는 브라우저 확장 프로그램입니다.

## 빠른 시작 · 설치

**Windows 11 + Chrome 또는 Whale 기준**입니다.

1. 시작 메뉴에서 **PowerShell**을 검색해 엽니다.
2. 아래 명령을 복사해 붙여넣고 **Enter**를 누릅니다.

```powershell
irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1 | iex
```

3. 브라우저 선택 메시지가 나오면 평소 사용하는 브라우저를 선택합니다. 프로필이 여러 개라면 평소 사용하는 프로필 번호를 선택합니다.
4. 확장 관리 화면이 자동으로 열리지 않으면 주소창에 Chrome은 `chrome://extensions/`, Whale은 `whale://extensions/`를 입력합니다.
5. **개발자 모드**를 켜고 **압축해제된 확장 프로그램을 로드합니다**를 클릭합니다.
6. PowerShell에 표시된 설치 폴더를 폴더 선택 창에 붙여넣고 선택합니다.

등록이 끝나면 같은 브라우저 프로필의 치지직 페이지를 새로고침하고 이모티콘에 마우스를 올려보세요.

<details>
<summary>기타 안내 보기</summary>

### 수동 등록 방법

설치 후 등록 화면이 열리지 않거나 평소 사용하는 브라우저에 직접 추가하려면 아래 주소를 사용합니다.

- Chrome: `chrome://extensions/`
- Whale: `whale://extensions/`

개발자 모드를 켠 뒤 **압축해제된 확장 프로그램을 로드합니다**를 선택하고, 설치기가 알려준 폴더를 지정합니다.

### 업데이트 방법

빠른 시작의 설치 명령을 다시 실행하면 최신 GitHub Release를 확인합니다. 새 버전이 있으면 설치 파일을 갱신하고, 확장 관리 화면에서 Hugify의 **새로고침** 버튼을 누른 뒤 치지직 페이지도 새로고침하세요.

같은 버전을 다시 받거나 설치를 복구하려면 `-Refresh`를 붙입니다.

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1))) -Refresh
```

### 설치 방식과 보안

- 위 명령은 GitHub 저장소의 [`install-online.ps1`](https://github.com/jinhoOps/chzzk-chat-icon-hugify/blob/main/install-online.ps1)를 내려받아 실행합니다. 실행 전 원본 코드를 직접 확인할 수 있습니다.
- 확장 파일은 `%LOCALAPPDATA%\ChzzkIconMagnifier\app`에 저장합니다.
- 기존 브라우저 프로필을 읽어 선택한 프로필로 확장 관리 화면을 엽니다. 별도 테스트 프로필을 만들지 않습니다.
- 관리자 권한과 Windows 레지스트리 수정을 요구하지 않습니다. 마지막 확장 등록은 사용자가 직접 클릭합니다.

### 개발자용

```powershell
npm test
```

새 버전을 배포할 때는 `manifest.json`과 `package.json`의 버전을 맞춘 뒤 `vX.Y.Z` 태그를 푸시합니다. GitHub Actions가 버전을 확인하고 `hugify-extension.zip`을 Release로 만듭니다.

```powershell
npm test
git add manifest.json package.json src icons fonts README.md
git commit -m "release: v1.2.0"
git push origin main
git tag v1.2.0
git push origin v1.2.0
```

CookieRun 서체는 팝업 UI에 원본 파일 그대로 번들하며, 사용 조건은 [`fonts/LICENSE-CookieRun.txt`](fonts/LICENSE-CookieRun.txt)에 기록했습니다. 공식 라이선스도 함께 확인하세요: [CookieRun FONT LICENSE](https://www.cookierunfont.com/static/download/License_ko_en.pdf)

</details>
