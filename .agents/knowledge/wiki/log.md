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
