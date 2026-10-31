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

## [2026-10-31] release | v1.2.0 채팅창 이모티콘 확대 토글

- **작업 내용**: 팝업에 "채팅창 이모티콘도 확대" 토글 추가 (`chatArea` 설정, 기본 ON)
  - OFF면 이모티콘 선택창(`#popup_contents`, `#emoji_area`) 안에서만 확대
  - 새로고침 없이 `chrome.storage.onChanged`로 즉시 반영
- **영향 파일**: `src/content.js`, `src/utils.js`, `src/popup.html`, `src/popup.js`, `src/popup.css`, `tests/*`, `manifest.json`, `package.json`
- **검증**: `npm test` 62/62 통과. 실제 치지직 페이지 확인은 미실시

---

## [2026-10-31] release | v1.2.1 팝업 새 버전 알림

- **배경**: 압축해제 확장이라 브라우저 자동 업데이트가 안 됨. 사용자가 새 버전을 놓치지 않게 알림 추가
- **작업 내용**: 팝업을 열면 GitHub `releases/latest` 태그와 설치 버전을 비교해 새 버전 배너 표시
  - 업데이트 명령(`install-online.ps1`) 복사 버튼과 릴리즈 링크 제공
  - 결과를 `chrome.storage.local.updateCheck`에 6시간 캐시 (비인증 API 한도 60회/시간 대응)
  - GitHub API가 `Access-Control-Allow-Origin: *`라 추가 권한 불필요. 실패 시 조용히 무시
- **영향 파일**: `src/popup.html`, `src/popup.js`, `src/popup.css`, `tests/popup.test.js`, `manifest.json`, `package.json`
- **검증**: `npm test` 64/64 통과

---

## [2026-10-31] release | v1.3.0 자동 업데이트 (예약 작업)

- **배경**: 압축해제 확장은 브라우저가 자동 업데이트하지 않음. 확장은 자기 폴더에 쓸 수 없으므로 외부(예약 작업)가 파일을 교체
- **결정**: 예약 작업(A) 채택. 파일 접근 API(B)는 매번 권한 확인과 숨김 폴더 선택 부담, Release zip이 CORS로 막힘. Native Messaging(C)은 레지스트리 필요
- **설치 스크립트** (`install-online.ps1`)
  - 기본 설치 폴더일 때 사용자 권한 예약 작업 `HugifyAutoUpdate` 등록 (로그인 시 + 매일 18:00)
  - 작업은 `%LOCALAPPDATA%\ChzzkIconMagnifier\updater.ps1`(설치한 Release 태그의 스크립트, UTF-8 BOM 저장)을 `-AutoUpdate`로 실행
  - `-AutoUpdate`: 프롬프트/브라우저 실행 없음, 정식 Release만, 기존 설치만 갱신, 다운그레이드 금지, `update.log`에 기록
  - `-NoAutoUpdate`, `-RemoveAutoUpdate`로 끄기
- **확장** (`src/background.js`): 30분마다·브라우저 시작·탭 닫힘 시 디스크의 manifest 버전을 확인, 더 높고 치지직 탭이 없으면 `chrome.runtime.reload()`
- **함정**: PowerShell 5.1은 BOM 없는 스크립트를 `-File`로 실행하면 ANSI로 읽음. 한글 바로 뒤 따옴표(예: `'등록 안 함'`)가 파싱을 깨뜨림 → ANSI 파싱 회귀 테스트 추가
- **검증**: `npm test` 74/74 통과. 비관리자 권한으로 시험용 예약 작업 등록·실행(1.0.0 → 1.2.1 갱신, 결과 0)·해제 확인
- **미검증**: 실제 브라우저에서 `background.js`의 디스크 manifest 재읽기와 자동 reload 동작

---

## [2026-10-31] release | v1.4.0 채팅 이모티콘 확대 수정, 설치·업데이트 정리

- **채팅 이모티콘 감지 수정**: 채팅 속 이모티콘은 `alt=""`, 버튼 클래스 `_button_<hash>_N`이라 기존 규칙(alt `{:코드:}`, emoticon 클래스, 선택창 내부)에 모두 걸리지 않았음. `[class*="_chatting_message_"]` 안 + 이모티콘 URL(`/glive/icon/`, `/emoji/`)이면 인정. `[class*="_nickname_"]`(팬·치트키 배지)는 제외. 클래스 해시는 빌드마다 바뀌므로 접두어로만 매칭
- **설치 스크립트 단순화**: 브라우저·프로필 선택과 브라우저 실행 제거. 항상 `%LOCALAPPDATA%\ChzzkIconMagnifier\app`에 설치하고 경로를 클립보드에 복사, Chrome/Whale 등록 단계 출력. 예약 작업은 이 고정 경로만 갱신
- **README**: PowerShell 설치를 기본으로 친절하게 안내, 직접 압축 풀기 설치는 접힌 영역으로
- **버튼 업데이트(직접 설치용)**: `src/update.html` + `update-core.js`. File System Access로 설치 폴더를 고르면 Release 태그의 파일을 raw.githubusercontent에서 받아 덮어쓰고 `chrome.runtime.reload()`. Release zip은 최종 리다이렉트에 CORS 헤더가 없어 사용 불가. 고른 폴더의 manifest name/version이 실행 중인 확장과 같아야 함. 전부 받은 뒤 쓰기, manifest.json은 마지막
- **설정 안내**: 어떤 설정이든 처음 바꿀 때 한 번만 새로고침 안내 (`refreshNoticeSeen`)
- **검증**: `npm test` 82/82. 채팅 확대는 사용자가 Whale에서 확인. 설치 스크립트는 실제 Release로 임시 폴더 설치 확인
- **미검증**: 버튼 업데이트의 실제 브라우저 동작(폴더 선택·수정 허용·덮어쓰기·재시작)
