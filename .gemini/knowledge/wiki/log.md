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
