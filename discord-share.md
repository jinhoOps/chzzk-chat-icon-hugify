# 치지직 이모티콘 커져라! Hugify!

치지직 채팅 이모티콘에 마우스를 올리면 크게 미리 볼 수 있는 Chrome / Whale 확장 프로그램입니다.

## 빠른 시작 · 설치

**Windows 11 + Chrome 기준**입니다.

1. 시작 메뉴에서 **PowerShell**을 검색해 엽니다.
2. 아래 명령을 복사해 붙여넣고 **Enter**를 누릅니다.

```powershell
irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1 | iex
```

3. 프로필이 여러 개라면 **평소 사용하는 프로필의 번호**를 입력합니다.
4. 확장 관리 화면이 자동으로 열리지 않으면 Chrome 주소창에 `chrome://extensions/`를 직접 입력합니다.
5. **개발자 모드**를 켭니다.
6. **압축해제된 확장 프로그램을 로드합니다**를 클릭합니다.
7. PowerShell에 표시된 설치 폴더를 선택합니다.

마지막으로 치지직 페이지를 새로고침하면 사용할 수 있습니다.

## Whale 사용자

Chrome 명령 대신 아래 명령을 사용하세요.

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1))) -Browser whale
```

프로필을 선택한 뒤 Chrome과 동일하게 개발자 모드에서 확장 프로그램을 등록하면 됩니다.

웨일 확장 관리 화면이 자동으로 열리지 않으면 주소창에 아래 경로를 직접 입력하세요.

```text
whale://extensions/
```

## 설치 후 업데이트

처음 설치할 때와 같은 명령을 다시 실행하면 최신 버전을 확인합니다.

```powershell
irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1 | iex
```

GitHub: https://github.com/jinhoOps/chzzk-chat-icon-hugify
