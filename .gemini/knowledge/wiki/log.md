# 📜 Knowledge Audit Log

이 파일은 지식 습득, 아키텍처 결정, 주요 변경 내역을 시간 순으로 기록하는 불변(Append-only) 감사 추적 로그입니다.
형식: `## [YYYY-MM-DD] <operation> | <title>`

---

## [2026-09-04] harness-init | Agent Harness 환경 초기화

- **작업 내용**: 프로젝트 표준 에이전트 하네스(Agent Harness) 아키텍처 구축
  - 루트 라우터 `AGENTS.md` 및 `GEMINI.md` 배포
  - 자율 협업 스킬 (`orchestration`, `wiki-librarian`, `core-developer`) 구성
  - 다중 서브에이전트 페르소나 (`planner`, `developer`, `evaluator`) 정의
  - Open Knowledge Format (OKF v0.1) 기반 LLM-Wiki 토폴로지 구조화
- **영향 파일**: `AGENTS.md`, `GEMINI.md`, `.gemini/`, `.agents/`
- **상태**: 정상 가동 준비 완료

---

## [2026-09-04] setup | CodeGraph CLI 설치 및 프로젝트 인덱스 초기화 완료

- **작업 내용**: AI 코딩 에이전트의 코드베이스 심볼 분석 및 영향도 평가를 위해 CodeGraph 인프라 연동
  - CLI 글로벌 버전 확인 및 에이전트 MCP 바인딩 갱신 (`codegraph install -y`)
  - 저장소 내 CodeGraph 프로젝트 초기화 (`codegraph init -y`)
  - `.codegraph/.gitignore`를 통한 로컬 인덱스 DB(`codegraph.db`) 커밋 차단 및 Git 위생 준수
  - `AGENTS.md` 및 지식 하네스에 CodeGraph 운영 가이드라인 반영
- **영향 파일**: `.codegraph/.gitignore`, `AGENTS.md`, `log.md`
- **상태**: 인덱스 정상 초기화 완료 (`codegraph status` 검증 통과)

---

## [2026-09-20] feat | 치지직 채팅 아이콘 확대 크롬 확장프로그램 (Manifest V3) 구현

- **작업 내용**: 치지직 라이브 방송(`chzzk.naver.com/live/*`) 채팅창 및 이모티콘 팝업 아이콘 마우스 호버 확대 확장프로그램 개발
  - 스프린트 계약 체결 (`plans/sprint_chzzk_icon_magnifier.md`, DoD 수립)
  - 네이버 pstatic 썸네일 파라미터(`?type=f60_60`) 스트리핑 알고리즘으로 초고해상도 원본 복원 기능 구현
  - 10초 임시 비활성화(Snooze) 및 실시간 카운트다운 타이머, 상시 ON/OFF 토글 구현
  - 확대 크기 옵션(원본 60x60, 추천 확대 90x90, 대형 120x120) 및 픽셀 보정 모드 구현
  - 다크 테마 기반 뷰포트 경계 이탈 방지 플로팅 툴팁 렌더링 (`src/content.js`, `src/content.css`)
  - Chrome Extension Manifest V3 규격 및 팝업 UI (`src/popup.html`, `src/popup.css`, `src/popup.js`) 완성
  - 무의존성 순수 Node.js PNG 에셋 생성기 (`scripts/generate_icons.js`)로 16/48/128px 아이콘 제작
  - 17개 단위 테스트 (`tests/*.test.js`) 구축 및 전원 통과
- **영향 파일**: `manifest.json`, `src/*`, `icons/*`, `tests/*`, `scripts/*`, `package.json`, `README.md`, `log.md`
- **상태**: 구현 및 검증 완료 (`npm test` 17/17 통과)

---

## [2026-09-20] feat | Windows 원클릭 브라우저 런처(Chrome/Whale) 및 Fallback 구현

- **작업 내용**: Windows 환경에서 웹스토어 등록 없이 로컬 압축해제 확장을 1줄 명령으로 즉시 실행/설치하는 브라우저 런처 개발
  - 스프린트 계약 체결 (`plans/sprint_chzzk_launcher.md`, DoD 수립)
  - Google Chrome 및 Naver Whale 실행 파일 자동 탐지 (`auto`, `chrome`, `whale`)
  - 사용자 기본 프로필/레지스트리 훼손 없이 보안 친화적 격리 프로필(`--user-data-dir`) 및 `--load-extension` 결합 실행
  - `--fallback` 옵션: 브라우저 확장 관리자(`chrome://extensions`, `whale://extensions`) 열람 및 터미널 수동 로드 단계별 가이드 안내
  - `install.cmd` 및 `install.ps1` 원클릭 래퍼 스크립트 작성 (공백 및 한글 유니코드 경로 지원)
  - CLI 인자 파싱 및 오류 처리, 표준 종료 코드(0~4) 지원
  - 18개 런처 단위 테스트 (`tests/launcher.test.js`) 구축, 전체 35개 테스트 전원 통과
- **영향 파일**: `scripts/launcher.js`, `install.cmd`, `install.ps1`, `tests/launcher.test.js`, `package.json`, `README.md`, `log.md`
- **상태**: 구현 및 검증 완료 (`npm test` 35/35 통과, dry-run 검증 완료)

---

## [2026-09-20] fix | 런처 기본 브라우저 자동 탐지 우선순위 조정 (Chrome -> Whale)

- **작업 내용**: 기본 동작 및 `--browser=auto` 시 탐지 우선순위를 Google Chrome 우선 탐지, 미설치 시 Naver Whale 폴백으로 조정
  - `scripts/launcher.js` 내 `detectBrowser('auto')` 탐지 순서 변경 (`chrome` -> `whale`) 및 도움말 텍스트 갱신
  - `tests/launcher.test.js` 테스트 케이스 갱신 (동시 설치 환경 시 Chrome 우선 선택 및 단독 설치 시 Whale 선택 검증)
  - `README.md` 설명 갱신
  - `install.cmd` 및 `install.ps1`의 `--dry-run --browser=auto` 검증 통과 (Google Chrome 자동 선택 확인)
- **영향 파일**: `scripts/launcher.js`, `tests/launcher.test.js`, `README.md`, `log.md`
- **상태**: 36/36 테스트 전원 통과

---

## [2026-09-20] feat | Windows 11 원격 원라이너 부트스트랩 설치기 및 README 전면 개편

- **작업 내용**: GitHub README에서 작업 폴더/Git/Node 없이 1줄 명령으로 설치 및 실행 가능한 부트스트랩 인프라 구축
  - 스프린트 계약 체결 (`plans/sprint_chzzk_online_installer.md`, DoD 수립)
  - `install-online.ps1` 개발: Windows PowerShell 5.1/7.x 호환, GitHub `main` 브랜치 소스를 `%LOCALAPPDATA%\ChzzkIconMagnifier\app`에 안정적으로 설치 후 Chrome/Whale 격리 프로필 실행
  - 갱신 옵션(`-Refresh`), 모의 실행(`-DryRun`), 수동 안내(`-Fallback`) 지원
  - 관리자 권한/레지스트리 수정 배제, 사용자 기존 기본 프로필 변조 배제 (보안 비침습 원칙 준수)
  - `README.md` 전면 개편: Windows 11 + Chrome 기본 원라이너 및 Whale 전용 코드블럭, 원격 코드 투명성 및 격리 프로필 동작 원리 명시
  - `install.ps1`에 Node 미설치 시 네이티브 PowerShell 자동 폴백 실행 로직 보강
  - `tests/online_installer.test.js` 7개 단위 테스트 추가 (정적 URL 검증, AST 파싱, 오프라인 dry-run)
- **영향 파일**: `install-online.ps1`, `install.ps1`, `tests/online_installer.test.js`, `README.md`, `log.md`
- **상태**: 43/43 테스트 전원 통과, dry-run 검증 완료

---

## [2026-09-20] chore | 원격 저장소 명칭 확정 변경 반영 (chzzk-chat-icon-hugify)

- **작업 내용**: GitHub 원격 저장소 공식 명칭을 `chzzk-chat-icon-hugify`로 확정 반영
  - `install-online.ps1`: `RepoName`, `RepoUrl`, `ZipUrl`, `RawBaseUrl` 갱신
  - `README.md`: 원격 부트스트랩 원라이너, Whale 코드블럭, 원격 코드 검토 링크 등 모든 URL 갱신
  - `tests/online_installer.test.js`: URL 및 저장소 명칭 정합성 검증 테스트 갱신
  - `package.json`: 패키지명 갱신 (`chzzk-chat-icon-hugify`)
  - 스프린트 계약서 (`plans/sprint_chzzk_online_installer.md`) SSOT URL 갱신
  - `git grep`을 통해 잔존 구 저장소명 URL 0건 확인 및 단위 테스트 43/43 전원 통과 확인
- **영향 파일**: `install-online.ps1`, `README.md`, `tests/online_installer.test.js`, `package.json`, `plans/sprint_chzzk_online_installer.md`, `log.md`
- **상태**: 43/43 테스트 전원 통과, Git 커밋 완료

---

## [2026-09-20] fix | 채팅 입력창 및 프로필 호버 배제 필터 강화 & 이모티콘 코드 뱃지 기본 비활성화

- **작업 내용**: 실제 치지직 채팅 입력 영역 DOM 스니펫 반영 및 사용자 UI 피로도 개선
  - 프로필 이미지(`_profile_`, `_setting_button_`, `type=f160`), 채팅 입력 에디터(`pre._input_`, `[contenteditable]`), 탭/카테고리(`_category_`, `_menu_`, flicking), 도네이션/도구 버튼(`_donation_`, `_tools_`) 철저 배제
  - 이모티콘 선택 영역(`#emoji_area`, `ul._list_`), `_emoticon_` 버튼 클래스, `{:코드:}` 패턴 및 유효한 이모티콘 URL 기반 정밀 타겟팅 로직 구축 (`src/utils.js`, `src/content.js`)
  - 이모티콘 이름({:코드:}) 표시 옵션(`showAltBadge`) 기본값을 `false`로 변경 (`DEFAULT_SETTINGS`, `popup.html`, `popup.js`, `content.js`)
  - 실제 사용자 HTML 스니펫 기반 회귀 테스트 추가 및 단위 테스트 모의 DOM CSS 셀렉터 매칭 고도화 (`tests/content_logic.test.js`, `tests/utils.test.js`)
- **영향 파일**: `src/utils.js`, `src/content.js`, `src/popup.html`, `src/popup.js`, `tests/content_logic.test.js`, `tests/utils.test.js`, `.gemini/knowledge/wiki/log.md`
- **상태**: 45/45 테스트 전원 통과 완료

---

## [2026-09-20] docs | README 빠른 시작과 부가 설명 접기

- **작업 내용**: README 상단에는 Windows 11 Chrome 기본 명령과 Whale 명령만 우선 노출하고, 갱신/보안/수동 등록/개발자용 내용을 HTML `<details>` 접기 영역으로 정리
- **추가 정합성 수정**: 최신 테스트 수를 45개로 갱신
- **설치 안내 간소화**: 첫 화면에 PowerShell 열기와 Chrome 설치 명령을 배치하고, Whale 설치 및 모든 추가 설명은 기본적으로 접힌 상태로 제공
- **영향 파일**: `README.md`, `.gemini/knowledge/wiki/log.md`

---

## [2026-09-20] fix | 확대 툴팁 하단 px 크기 태그 제거 및 높이 보정

- **작업 내용**: 마우스 호버 확대 툴팁에서 불필요한 크기 라벨(예: `90×90px`) 제거
  - `src/content.js`: `tooltipTag`(`chzzk-mag-size-tag`) 생성/주입 및 텍스트 갱신 로직 완전 제거
  - `src/content.js`: 크기 태그 제거 및 `showAltBadge` 상태를 반영한 툴팁 높이(`tooltipHeight`) 정밀 계산 보정
  - `src/content.css`: 사용되지 않는 `.chzzk-mag-size-tag` 스타일 규칙 제거
- **영향 파일**: `src/content.js`, `src/content.css`, `.gemini/knowledge/wiki/log.md`
- **상태**: 툴팁 DOM 간소화 완료, 단위 테스트 38/38 통과 (관련 테스트 suites)

---

## [2026-09-20] fix | 원격 설치기의 기존 브라우저 프로필 선택

- 원격 설치 명령은 기존 Chrome/Whale 프로필을 탐색하고 복수일 때 번호를 입력받는다. 단일 프로필은 자동 선택한다.
- `-Profile`과 `-UserDataDir`로 기존 경로 지정 지원. 새 프로필 생성과 자동 확장 로드 대신 선택한 프로필의 확장 관리 화면에서 최종 등록 안내.
- README 빠른 시작에 개발자 모드와 폴더 선택 단계를 명시. 상세 사용법은 접힌 영역 유지.
- 검증: `npm test` 51/51 통과. 프로필 목록/한글·공백 경로/취소/없는 프로필/손상된 Local State/명시 선택/DryRun 검증. 브라우저 실행은 모킹했으며 실제 UI 등록은 자동 검증하지 않음.
- 계약: [기존 프로필 설치 지원](./plans/sprint_existing_profile.md).

## [2026-09-20] decision | README 브랜드 문구 변경

- 사용자 요청에 따라 README 제목을 `커져라! Hugify!`로 바꾸고 소개 문구를 통일했다.
- 설치 명령, 저장소 주소, 확장 프로그램 코드는 변경하지 않는다.

## [2026-09-20] feature | GitHub Release 기반 최신 버전 갱신

- 원격 설치기가 `releases/latest`의 `hugify-extension.zip`과 로컬 `manifest.json` 버전을 비교하도록 확장했다.
- 새 버전이 있을 때만 내려받고, `-Refresh`는 같은 버전도 강제 재설치한다. Release API가 없으면 기존 `main.zip` fallback을 유지한다.
- 다운로드 파일은 manifest 검증 후 staging에서 기존 설치 폴더와 교체하고, 교체 실패 시 backup 복구를 시도한다.
- `.github/workflows/release.yml`은 `vX.Y.Z` 태그와 `manifest.json`/`package.json` 버전을 확인한 뒤 확장 런타임 ZIP을 GitHub Release로 만든다.
- `README.md`에 사용자 갱신과 태그 기반 배포 절차를 추가했다. 이름 표기는 `치지직 이모티콘 커져라! Hugify!`로 유지한다.
- 검증: `npm test` 58/58 통과, Release ZIP 교체 통합 테스트 통과, Chrome/Whale dry-run 및 PowerShell AST 통과.
- 계약: [Release 기반 최신 버전 갱신](./plans/sprint_release_update.md).

---

## [2026-09-20] fix | Whale 프로필 우선순위(Profile 1 기본값) 및 Enter 즉시 선택 지원

- **작업 내용**: 네이버 웨일 브라우저 선택 시 실사용 로그인 프로필(`Profile 1`)을 1순위로 표시하고 Enter 키로 기본 선택하도록 개선
  - `install-online.ps1`: `Get-ExistingProfiles`에 `-BrowserType` 매개변수를 추가하여 브라우저가 `whale`인 경우 `Profile 1`을 `Default`보다 우선 정렬 (Whale은 실제 네이버 로그인 계정이 `Profile 1`에 위치하고 `Default`는 초기 미로그인 스텁인 특성 반영)
  - `install-online.ps1`: `Select-ExistingProfile`에서 프롬프트를 `프로필 번호 (기본값: 1, 취소: q)`로 개선하고 빈 입력(Enter) 시 1번 항목(`Profile 1` 또는 기본 프로필)을 자동 선택하도록 지원
  - `tests/profile_installer.test.js`: Whale의 Profile 1 우선순위 및 Enter 기본값 선택, Chrome의 Default 우선순위 보존 단위 테스트 추가
- **검증**: `npm test` 58/58 전체 테스트 통과

---

## [2026-09-20] fix | 원격 설치기 UTF-8 BOM 제거 및 대화형 브라우저 선택(Chrome/Whale) 지원

- **작업 내용**: 원라인 부트스트랩 명령(`irm ... | iex`) 실행 시 PowerShell 5.1 구문 파싱 예외 해결 및 브라우저 선택 편의성 제공
  - `install-online.ps1`: UTF-8 BOM(`\uFEFF`) 제거로 `irm | iex` 및 `[scriptblock]::Create` 실행 시 토큰 파싱 에러(식 또는 문에서 예기치 않은 param/CmdletBinding 토큰) 원천 해결
  - `install-online.ps1`: 스크립트 상단 주석 및 내부 주석을 ASCII로 정제하여 PowerShell 5.1 파일 시스템 ANSI 코드페이지(CP949) 오프셋 불일치 현상 방지
  - `install-online.ps1`: 브라우저 옵션(-Browser) 미지정 시 Chrome과 Whale이 동시 설치되어 있으면 대화형 선택 메뉴(1. Chrome, 2. Whale)를 제공하도록 개선 ($b 단축 변수도 계속 지원)
  - `tests/online_installer.test.js`: UTF-8 BOM 부재 검증 및 `[scriptblock]::Create` 유효성 검증 테스트 추가
- **영향 파일**: `install-online.ps1`, `tests/online_installer.test.js`, `.gemini/knowledge/wiki/log.md`
- **상태**: 52/52 전체 테스트 통과 완료

---

## [2026-09-20] docs | Gemini CLI 및 Antigravity 선행 문서 안내

- `GEMINI.md`에 작업 시작 시 `GEMINI.md`와 저장소 루트 `AGENTS.md`를 모두 읽고 적용하라는 절차를 명시했다.
- `GEMINI.md`는 진입점·빠른 라우터로 유지하고, 상세 운영 규칙의 SSOT는 `AGENTS.md`로 유지한다.

## [2026-09-20] fix | 확장 관리 페이지 실행 보강 및 직접 주소 fallback

- `install-online.ps1`이 선택한 기존 Chrome/Whale 프로필에서 확장 관리 페이지를 새 창으로 열도록 `--new-window` 실행 인자를 추가했다.
- 브라우저가 이미 실행 중이거나 내부 커맨드라인 URL 전달에 실패할 때를 대비해 설치기 출력에 Chrome/Whale 확장 관리 직접 주소를 함께 표시한다. 실제 실행 중인 Whale에서도 이 fallback 경로를 확인했다.
- README 빠른 시작과 디스코드 공유용 설치 문서에 자동 이동 실패 시 주소창에 직접 입력할 경로를 추가했다.
- `tests/profile_installer.test.js`, `tests/online_installer.test.js`에 새 창 인자와 브라우저별 fallback 주소 검증을 추가했다.
- 계약: [확장 관리 페이지 실행 보강 및 직접 주소 fallback](./plans/sprint_extension_manager_fallback.md).

---

## [2026-09-20] refactor | 단일 목적 이모티콘 확대 UI 정리

- 팝업에서 `px` 크기 표기, 크기 선택, 이모티콘 코드 배지, 픽셀 보정, 10초 임시 중지 기능을 제거하고 확대 사용 토글만 남겼다.
- 콘텐츠 툴팁은 고정된 내부 크기의 이미지와 접근성용 alt만 렌더링하며, 기존 고해상도 원본 복원과 대상 필터링은 유지한다.
- 레거시 저장값은 삭제하지 않고 무시하도록 `enabled` 단일 설정으로 정리했다.
- `tests/popup.test.js` 정적 회귀 검증을 추가하고 `npm test` 57/57, `git diff --check`, JavaScript 구문 검사를 통과했다.
- 계약: [단일 목적 이모티콘 확대 UI 정리](./plans/sprint_clean_emoticon_magnifier.md).

---

## [2026-09-20] fix | Hugify 브랜딩 및 제공 아이콘 적용

- 사용자가 제공한 투명 이모티콘 이미지를 확장 프로그램 아이콘 `16/48/128` 에셋으로 리사이즈해 적용했다.
- `manifest.json`, `package.json`, 런처 도움말의 사용자 노출 명칭을 `치지직 이모티콘 커져라! Hugify!` 기준으로 통일하고 `확대기` 표기를 제거했다.
- `tests/branding.test.js`에서 manifest 브랜딩과 PNG 실제 크기를 회귀 검증하도록 추가했다.
- 계약: [Hugify 브랜딩 및 아이콘 교체](./plans/sprint_brand_icon_cleanup.md).

---

## [2026-09-20] release | Hugify v1.0.1 배포 완료

- `manifest.json`, `package.json`, 팝업 표시 버전을 `1.0.1`로 일치시켰다.
- `v1.0.1` 태그를 `main`에 푸시하고 GitHub Actions Release workflow를 성공적으로 완료했다.
- Release asset `hugify-extension.zip`이 생성되어 최신 설치 명령에서 사용할 수 있다.
