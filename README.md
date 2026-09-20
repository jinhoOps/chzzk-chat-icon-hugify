# 치지직 이모티콘 커져라! Hugify!

치지직 이모티콘, 커져라! 마우스를 올리면 크게 미리 볼 수 있는 확장 프로그램입니다.

---

## 빠른 시작 · 설치

**Windows 11 + Chrome 기준**입니다. 파일을 미리 내려받거나 개발 도구를 설치할 필요가 없습니다.

1. 시작 메뉴에서 **PowerShell**을 검색해 엽니다.
2. 아래 명령을 복사해 붙여넣고 **Enter**를 누릅니다.

```powershell
irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1 | iex
```

3. 프로필이 여러 개라면 **평소 사용하는 프로필의 번호**를 입력합니다. 하나면 자동 선택됩니다.
4. 확장 관리 화면이 자동으로 열리지 않으면 Chrome 주소창에 아래 주소를 직접 입력합니다: `chrome://extensions/`
5. **개발자 모드**를 켜고 **압축해제된 확장 프로그램을 로드합니다**를 클릭합니다.
6. PowerShell에 표시된 설치 폴더 경로를 폴더 선택 창에 붙여넣고 선택합니다.

이제 같은 프로필의 치지직 페이지를 새로고침하고 이모티콘에 마우스를 올려보세요. **파일 다운로드와 프로필 선택은 설치기가 도와주며, 마지막 등록은 위 5~6단계에서 직접 클릭해야 합니다.**

<details>
<summary>Whale을 사용한다면? — 설치 명령 보기</summary>

위 Chrome 명령 대신 아래 명령을 PowerShell에 붙여넣으세요.
평소 사용하는 Whale 프로필을 선택한 뒤 위 5~6단계로 등록하면 됩니다. 확장 관리 화면이 자동으로 열리지 않으면 Whale 주소창에 아래 주소를 직접 입력하세요: `whale://extensions/`

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1))) -Browser whale
```

</details>

## 더 알아보기

필요한 항목만 눌러 펼쳐보세요.

<details>
<summary>🔄 이미 설치된 버전 갱신하기</summary>

처음 설치할 때와 같은 Chrome 명령을 다시 실행하면 최신 GitHub Release를 자동으로 확인합니다.

- 새 버전이 있으면 최신 파일만 내려받아 기존 설치 폴더를 교체합니다.
- 이미 최신이면 파일을 다시 받지 않습니다.
- 다운로드나 교체에 실패하면 기존 파일을 보존합니다.

파일을 강제로 다시 받거나 설치를 복구하려면 `-Refresh`를 붙이세요. Whale은 `-Browser whale`도 함께 붙입니다. 파일 갱신 뒤 열려 있는 확장 관리 화면에서 Hugify의 **새로고침** 버튼을 누르고 치지직 페이지도 새로고침하세요.

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1))) -Refresh
```
</details>

<details>
<summary>📦 개발자가 새 버전 배포하는 방법</summary>

확장 기능을 수정한 뒤 `manifest.json`과 `package.json`의 버전을 같은 값으로 올리고 태그를 푸시하면 됩니다.

```powershell
# 예: 1.0.0 → 1.0.1
# manifest.json, package.json의 version을 모두 1.0.1로 수정
npm test
git add manifest.json package.json src icons README.md
git commit -m "release: v1.0.1"
git push origin main
git tag v1.0.1
git push origin v1.0.1
```

태그가 `v1.0.1` 형식이면 GitHub Actions가 버전을 확인하고 `hugify-extension.zip` Release를 자동으로 만듭니다. 사용자가 다음에 설치 명령을 실행하면 이 Release를 기준으로 갱신합니다. 태그와 두 manifest의 버전이 다르면 Release 생성을 중단합니다.

</details>

---

<details>
<summary>🛡️ 설치 방식과 보안 설명</summary>

- **원격 코드 투명성**: 위 명령은 GitHub 공식 저장소의 [`install-online.ps1`](https://github.com/jinhoOps/chzzk-chat-icon-hugify/blob/main/install-online.ps1) 스크립트를 다운로드하여 실행합니다. 실행 전 누구나 링크를 통해 원본 코드를 직접 검토하실 수 있습니다.
- **안정적인 영구 설치 경로**: 최신 GitHub Release 자산을 임시 폴더가 아닌 `%LOCALAPPDATA%\ChzzkIconMagnifier\app`에 안전하게 보관합니다. Release가 아직 없으면 `main` 브랜치를 fallback으로 사용합니다.
- **기존 프로필 선택**: 저장된 프로필 이름과 폴더를 읽어 선택한 프로필의 확장 관리 화면을 엽니다. 별도 테스트 프로필을 만들지 않습니다.
- **비침습성 보장**: 관리자 권한이나 Windows 레지스트리 수정을 일절 요구하지 않으며, 기존 일상 브라우저 프로필의 설정이나 개발자 모드를 강제로 변조하지 않습니다.

</details>

<details>
<summary>프로필을 직접 지정하거나 목록에 나오지 않을 때</summary>

프로필이 여러 개면 번호를 입력하고, 취소하려면 `q`를 입력하세요. 프로필이 없으면 브라우저를 먼저 실행한 뒤 다시 시도하세요.

폴더명을 알고 있다면 `-Profile 'Profile 1'`처럼 지정할 수 있습니다:

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1))) -Browser whale -Profile 'Profile 1'
```

사용자 데이터 폴더를 다른 곳에 두었다면 `-UserDataDir 'D:\Browser\User Data'`를 추가하세요. 기존 경로와 프로필만 선택할 수 있습니다.
프로필 정보 파일을 읽지 못하면 `Default`, `Profile 1` 같은 기존 폴더명으로 표시합니다.
이전에 설치기가 만든 별도 창은 닫아도 됩니다. 그 테스트 프로필의 데이터는 자동으로 삭제하지 않습니다.

</details>

---

<details>
<summary>수동 등록 방법 — 평소 쓰던 브라우저에 추가하거나 확대가 안 될 때</summary>

일상적으로 사용하시는 기본 브라우저 프로필에 확장을 상시 등록해두고 싶다면, 아래 명령어로 확장 관리자 페이지를 열고 안내에 따라 1회 등록하시면 됩니다:

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/jinhoOps/chzzk-chat-icon-hugify/main/install-online.ps1))) -Fallback
```

**수동 등록 절차:**

1. 브라우저에서 확장 관리자(`chrome://extensions/` 또는 `whale://extensions/`)가 열립니다. 자동으로 열리지 않으면 해당 주소를 주소창에 직접 입력합니다.
2. 우측 상단의 **[개발자 모드]** 토글을 켭니다.
3. 좌측 상단의 **[압축해제된 확장 프로그램을 로드합니다]**를 클릭합니다.
4. 아래 경로를 복사하여 폴더 선택창에 붙여넣습니다:
   - `C:\Users\<사용자이름>\AppData\Local\ChzzkIconMagnifier\app`
5. 등록이 완료되면 치지직 라이브에서 영구적으로 호버 확대가 작동합니다.

</details>

---

<details>
<summary>💻 로컬 저장소에서 실행하는 방법 (개발자용)</summary>

기존 프로필에 로컬 파일을 등록하려면 `powershell -File install-online.ps1 -InstallDir .`를 사용하세요. Whale은 `-Browser whale`을 붙입니다.

아래 Node 기반 런처는 개발용 별도 프로필 실행입니다. 일반 설치는 위 빠른 시작을 사용하세요:

```cmd
:: CMD 환경
install.cmd                      :: Chrome 자동 실행
install.cmd --browser=whale      :: Whale 실행
install.cmd --fallback           :: 확장 관리자 수동 안내

:: PowerShell 환경
powershell -File install.ps1
powershell -File install.ps1 --browser=whale

:: Node.js 환경
npm run launch                   :: Chrome 실행
npm run launch:whale             :: Whale 실행
npm test                         :: 단위 테스트 실행
```

</details>

---

<details>
<summary>✨ 핵심 기능</summary>

| 기능 | 설명 |
|---|---|
| **이모티콘 확대** | 치지직 채팅 이모티콘에 마우스를 올리면 선명한 원본 이미지를 깔끔한 미리보기로 보여줍니다. 팝업에서는 확대 기능을 켜거나 끌 수 있습니다. |

</details>

---

<details>
<summary>📁 프로젝트 파일 구조 (개발자용)</summary>

```
치지직아이콘/
├── install-online.ps1         # Windows 11 원격 원라이너 부트스트랩 설치기
├── install.cmd                # 로컬 Windows CMD 원클릭 실행 스크립트
├── install.ps1                # 로컬 Windows PowerShell 원클릭 실행 스크립트
├── manifest.json              # Chrome / Whale Extension Manifest V3 메인 설정
├── icons/                     # 확장프로그램 공식 아이콘 파일
├── src/
│   ├── content.js             # 치지직 페이지 내 마우스 호버 감지 및 실시간 툴팁 렌더링
│   ├── content.css            # 툴팁 디자인 및 다크 테마 애니메이션 스타일
│   ├── popup.html             # 설정 팝업 UI (확대 사용 토글)
│   ├── popup.css              # 팝업 다크 모드 스타일
│   ├── popup.js               # 팝업 제어 로직 및 설정 동기화
│   └── utils.js               # 핵심 알고리즘 (고해상도 URL 추출, 툴팁 좌표 연산)
├── tests/
│   ├── utils.test.js          # 핵심 유틸리티 단위 테스트
│   ├── content_logic.test.js  # 사용자 HTML 샘플 호환 및 설정 테스트
│   ├── launcher.test.js       # 브라우저 탐지 및 CLI 인자 단위 테스트
│   └── online_installer.test.js # 원격 부트스트랩 AST/인자/오프라인 검증 테스트
├── scripts/
│   ├── launcher.js            # 브라우저 자동 탐지 및 격리 실행 CLI 엔진
│   └── generate_icons.js      # 무의존성 순수 Node.js PNG 아이콘 생성 스크립트
├── package.json
└── README.md
```

</details>

---

<details>
<summary>🧪 테스트 실행 (개발자용)</summary>

```bash
npm test
```
*Node.js 기본 테스트 러너(`node:test`)로 확장 기능, 설치기, 기존 프로필 선택을 검증합니다.*

</details>
