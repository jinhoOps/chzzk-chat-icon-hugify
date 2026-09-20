# 스프린트 계약서 (Sprint Contract)

> **계약 ID**: SC-20260920-02  
> **담당자**: Developer  
> **검증자**: Evaluator  
> **날짜**: 2026-09-20  

---

## 1. 스프린트 목표 (Objective)
- Windows 환경에서 사용자가 웹스토어 등록 없이 로컬 압축해제 확장프로그램을 한 줄 명령으로 실행/설치할 수 있는 브라우저 런처(`install.cmd`, `install.ps1`, `scripts/launcher.js`) 구현.
- 대상 브라우저: Google Chrome, Naver Whale.
- 브라우저 보안 및 비침습 원칙을 준수하며, 격리 프로필을 통한 `--load-extension` 실행 및 수동 설치 fallback 지원.

---

## 2. 완료 기준 (Definition of Done, DoD)
- [ ] Chrome 및 Whale 실행 파일 자동 탐지 (`auto`, `chrome`, `whale` 옵션 지원)
- [ ] 사용자 기본 프로필/레지스트리 훼손 없이, 보안 친화적 격리 프로필(`--user-data-dir`) 및 `--load-extension` 인자 조합 생성
- [ ] `--fallback` 모드 지원: `chrome://extensions` 또는 `whale://extensions` 열람 및 단계별 한글 수동 로드 안내
- [ ] Windows 원클릭/원라인 진입점 제공: `install.cmd`, `install.ps1` (공백 및 한글 경로 완벽 지원)
- [ ] CLI 옵션 완비: `--browser`, `--dry-run`, `--fallback`, `--help`, 명확한 에러 메시지 및 표준 Exit Code (0~4) 반환
- [ ] 실제 브라우저를 띄우지 않고 탐지/인자/예외를 검증하는 단위 테스트(`tests/launcher.test.js`) 작성 및 기존 테스트 유지
- [ ] README.md에 Chrome/Whale별 한 줄 실행 명령 및 브라우저 프로세스/프로필 관련 동작 원리와 한계 명시

---

## 3. 영향 범위 및 수정 파일 (Scope & Blast Radius)
| 파일 경로 | 작업 유형 | 변경 목적 |
|---|---|---|
| `.gemini/knowledge/wiki/plans/sprint_chzzk_launcher.md` | 생성 | 스프린트 계약서 선언 |
| `scripts/launcher.js` | 생성 | 브라우저 탐지, 인자 생성, 실행 및 fallback 처리 Node CLI |
| `install.cmd` | 생성 | Windows CMD 원클릭/원라인 실행 스크립트 |
| `install.ps1` | 생성 | Windows PowerShell 원클릭/원라인 실행 스크립트 |
| `tests/launcher.test.js` | 생성 | 런처 단위 테스트 (인자 파싱, 경로 탐지 mock, CLI 검증) |
| `package.json` | 수정 | `launch`, `launch:chrome`, `launch:whale` 스크립트 등록 |
| `README.md` | 수정 | 한 줄 실행 가이드, Chrome/Whale 옵션, 동작 원리/한계 문서화 |

---

## 4. 기술적 제약 및 규칙 (Technical Constraints)
- 레지스트리 수정 금지, 기존 기본 프로필 파일 임의 조작 금지.
- Chromium 엔진의 특성상 이미 실행 중인 프로세스가 있으면 `--load-extension` 플래그가 무시되므로, 전용 테스트 프로필(`--user-data-dir`)을 활용하고 한계 및 fallback을 투명하게 안내할 것.
- Windows 파일 경로의 공백과 유니코드(한글) 인코딩 안전성 보장.

---

## 5. 검증 명령 (Verification Commands)
```bash
npm test
node scripts/launcher.js --dry-run --browser=auto
node scripts/launcher.js --dry-run --browser=chrome
node scripts/launcher.js --dry-run --browser=whale
node scripts/launcher.js --help
```

---

## 6. 핸드오프 체크리스트 (Developer Sign-off)
- [ ] 모든 단위 테스트 통과 (기존 17개 + 신규 런처 테스트)
- [ ] Chrome 및 Whale 실제 탐지 확인 및 dry-run 검증 완료
- [ ] cmd/ps1 래퍼 스크립트 구문 및 한글 경로 처리 확인
