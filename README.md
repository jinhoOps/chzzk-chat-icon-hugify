# 🔍 치지직 채팅 아이콘 확대기 (CHZZK Emoticon Magnifier)

> 치지직(CHZZK) 방송 채팅창 및 이모티콘 팝업에서 아이콘을 채팅에 전송하기 전에 **마우스 호버만으로 크고 선명하게 미리 확인**할 수 있는 크롬 / 네이버 웨일 확장프로그램입니다.

---

## ⚡ Windows 한 줄 실행 런처 (추천)

Chrome 웹 스토어 등록이나 복잡한 절차 없이, **명령어 한 줄로 브라우저를 즉시 띄워 확장을 확인**할 수 있습니다.  
공백이나 한글이 포함된 경로에서도 완벽하게 동작합니다.

### 1. 기본 실행 (자동 감지: Naver Whale 우선 → Google Chrome)
```cmd
:: CMD 환경
install.cmd

:: PowerShell 환경
powershell -File install.ps1

:: 또는 npm 스크립트
npm run launch
```

### 2. 브라우저 지정 실행
```cmd
:: Naver Whale로 실행
install.cmd --browser=whale
npm run launch:whale

:: Google Chrome으로 실행
install.cmd --browser=chrome
npm run launch:chrome
```

### 3. 상시 메인 프로필 등록 안내 모드 (Fallback)
확장 관리자 페이지(`chrome://extensions` 또는 `whale://extensions`)를 열고 터미널에 수동 등록 단계를 안내합니다:
```cmd
install.cmd --fallback
npm run launch:fallback
```

---

## 🛡️ 브라우저 동작 원리 및 프로세스 한계 안내

Chromium 기반 브라우저(Google Chrome, Naver Whale)의 보안 및 프로세스 아키텍처 특성은 다음과 같습니다:

1. **격리 프로필(`--user-data-dir`) 사용 이유**
   - 이미 메인 Chrome/Whale이 실행 중인 상태에서 기본 프로필로 `--load-extension`을 호출하면, 기존 브라우저 프로세스가 새 명령을 흡수하면서 보안상 확장 로드 플래그를 **무시**합니다.
   - 따라서 본 런처는 사용자의 기존 프로필이나 레지스트리를 전혀 건드리지 않고, 전용 격리 프로필(`%LOCALAPPDATA%\ChzzkIconMagnifier\profile`)을 생성하여 **기존 브라우저가 켜져 있어도 충돌 없이 확장이 즉시 로드**되도록 안전하게 구동합니다.

2. **메인 일상 프로필에 영구 설치하고 싶은 경우**
   - 격리 프로필이 아닌 평소 쓰던 기본 브라우저 창에 항상 두고 사용하고 싶다면, `install.cmd --fallback`을 실행하여 브라우저 확장 관리자에서 [압축해제된 확장 프로그램을 로드합니다] 버튼으로 이 폴더를 1회 등록해 주시면 됩니다.

---

## ✨ 핵심 기능

1. **마우스 호버 실시간 확대 미리보기**
   - 치지직 라이브 방송(`https://chzzk.naver.com/live/*`)의 이모티콘 팝업 및 채팅 내 아이콘에 마우스를 올리면 자동으로 확대 툴팁이 뜹니다.
   - 네이버 CDN(`pstatic.net`)의 썸네일 축소 쿼리스트링(`?type=f60_60`)을 실시간으로 감지/제거하여 **흐릿하지 않은 원본 고해상도 이미지(256px+)**로 선명하게 표시합니다.
   - 이모티콘 고유 코드명(예: `{:slp1:}`)을 툴팁 하단에 함께 안내합니다.

2. **⏸️ 10초 임시 비활성화 (Snooze 10s)**
   - 채팅을 빠르게 연타하거나 이모티콘을 가리지 않고 빠르게 선택하고 싶을 때 **10초 동안만 확대를 일시 중지**할 수 있습니다.
   - 팝업 창에 실시간 잔여 시간 카운트다운 및 **[즉시 재개]** 버튼을 제공합니다.
   - **단축키 지원**: 치지직 화면에서 언제든 `Alt + Z`를 누르면 10초 비활성화 / 즉시 재개가 토글됩니다.

3. **🛑 상시 활성화 / 중지(비활성화) 토글**
   - 팝업 상단의 마스터 토글 스위치로 기능을 언제든 켜고 끌 수 있습니다.
   - 브라우저 스토리지에 설정이 영구 저장되어 새로고침 후에도 유지됩니다.

4. **📏 확대 크기 3단계 옵션**
   - **원본 (60×60px)**: 기본 원본 규격
   - **확대 (90×90px)**: 원본 대비 +50% 확대 (가장 시인성이 뛰어난 기본 권장값)
   - **대형 (120×120px)**: 원본 대비 2배 대형 확대
   - **픽셀 보정(Pixelated) 옵션**: 픽셀 도트 아트 스타일 이모티콘을 번짐 없이 선명하게 볼 수 있는 보정 모드 지원

---

## 💻 CLI 옵션 및 종료 코드 (Exit Codes)

```text
[사용법]
  install.cmd [옵션]
  powershell -File install.ps1 [옵션]
  node scripts/launcher.js [옵션]

[옵션]
  --browser=<auto|chrome|whale>, -b <값>
      실행할 브라우저를 선택합니다 (기본값: auto)
  --fallback
      확장 관리자 페이지를 열고 터미널에 수동 등록 가이드를 안내합니다.
  --dry-run
      실제 브라우저를 실행하지 않고 탐지된 경로와 실행 인자만 출력합니다.
  --profile-dir=<경로>
      격리 테스트 프로필 디렉터리를 직접 지정합니다.
  --url=<URL>
      시작 시 열릴 주소를 지정합니다 (기본값: https://chzzk.naver.com/live)
  --help, -h
      도움말을 표시합니다.

[종료 코드]
  0: 정상 실행 또는 Dry-run / Help
  1: 잘못된 인자 (Unknown options, invalid browser)
  2: 브라우저 실행 파일 미발견
  3: manifest.json 미발견
  4: 프로세스 spawn 실행 오류
```

---

## 📁 프로젝트 파일 구조

```
치지직아이콘/
├── install.cmd                # Windows CMD 원클릭 실행 스크립트
├── install.ps1                # Windows PowerShell 원클릭 실행 스크립트
├── manifest.json              # Chrome/Whale Extension Manifest V3 메인 설정
├── icons/                     # 확장프로그램 공식 아이콘 (16, 48, 128px)
├── src/
│   ├── content.js             # 치지직 페이지 내 마우스 호버 감지 및 실시간 툴팁 렌더링
│   ├── content.css            # 툴팁 디자인 및 다크 테마 애니메이션 스타일
│   ├── popup.html             # 설정 팝업 UI (토글, 10초 스누즈, 크기 선택)
│   ├── popup.css              # 팝업 다크 모드 스타일
│   ├── popup.js               # 팝업 제어 로직 및 실시간 타이머 동기화
│   └── utils.js               # 핵심 알고리즘 (고해상도 URL 추출, 툴팁 좌표 연산)
├── tests/
│   ├── utils.test.js          # 핵심 유틸리티 단위 테스트
│   ├── content_logic.test.js  # 사용자 HTML 샘플 호환 및 스누즈 테스트
│   └── launcher.test.js       # 브라우저 탐지 및 CLI 인자 단위 테스트
├── scripts/
│   ├── launcher.js            # 브라우저 자동 탐지 및 격리 실행 CLI 엔진
│   └── generate_icons.js      # 무의존성 순수 Node.js PNG 아이콘 생성 스크립트
├── package.json
└── README.md
```

---

## 🧪 테스트 실행

```bash
npm test
```
*Node.js 내장 테스트 러너(`node:test`)를 사용하여 외부 무거운 종속성 없이 **35개 전체 검증 테스트가 0.4초 이내로 통과**합니다.*
