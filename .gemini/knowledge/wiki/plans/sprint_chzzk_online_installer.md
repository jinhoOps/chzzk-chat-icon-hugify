# 스프린트 계약서 (Sprint Contract)

> **계약 ID**: SC-20260920-03  
> **담당자**: Developer  
> **검증자**: Evaluator  
> **날짜**: 2026-09-20  

---

## 1. 스프린트 목표 (Objective)
- 사용자가 로컬 폴더나 Git 설치 없이 GitHub README의 코드블럭 1줄만 복사하여 Windows 11 + Google Chrome(기본) 및 Naver Whale에 확장프로그램을 즉시 다운로드/설치/실행할 수 있는 원격 부트스트랩 스크립트(`install-online.ps1`) 및 README 개편.
- 저장소 기준: `https://github.com/jinhoOps/chzzk-chat-icon-hugify` (기본 브랜치: `main`).

---

## 2. 완료 기준 (Definition of Done, DoD)
- [ ] Windows 11 + Google Chrome을 기본 타겟으로 명시하고, Git/Node 없이 실행 가능한 PowerShell 5.1 호환 원격 원라이너 제공
- [ ] Naver Whale 전용 1줄 명령(`-Browser whale`) 별도 코드블럭 제공
- [ ] `install-online.ps1`:
  - 기본 브라우저: `chrome`, 옵션: `whale`, `auto`
  - GitHub `main` 브랜치 소스를 `%LOCALAPPDATA%\ChzzkIconMagnifier\app` 안정적 영구 디렉터리에 설치 (임시 폴더 즉시 삭제로 인한 확장 참조 끊김 방지)
  - `-Refresh` 옵션 지원 (최신 코드 재다운로드/갱신)
  - `-DryRun`, `-Fallback` 옵션 지원
  - 다운로드 실패, manifest.json 누락, 미지원 브라우저에 대한 명확한 에러 메시지 및 표준 Exit Code (0~4) 반환
  - 관리자 권한/레지스트리 수정 배제, 사용자 기존 기본 프로필 변조 배제 (보안 존중)
- [ ] 로컬 진입점(`install.cmd`, `install.ps1`, `npm run launch`) 유지 및 README 내 로컬 실행 가이드 병기
- [ ] README 내 원격 코드 실행 투명성, GitHub 원격 코드 사전 검토 안내, 격리 프로필(`--user-data-dir`) 및 `--load-extension` 동작 원리/한계 명시
- [ ] 실제 네트워크를 호출하지 않는 원격 부트스트랩 단위 테스트(`tests/online_installer.test.js`) 구축 및 기존 `npm test` 전원 통과
- [ ] Git working tree clean 유지 및 커밋 완료

---

## 3. 영향 범위 및 수정 파일 (Scope & Blast Radius)
| 파일 경로 | 작업 유형 | 변경 목적 |
|---|---|---|
| `.gemini/knowledge/wiki/plans/sprint_chzzk_online_installer.md` | 생성 | 스프린트 계약서 선언 |
| `install-online.ps1` | 생성 | Windows PowerShell 5.1+ 원격 부트스트랩 설치 및 런처 스크립트 |
| `install.ps1` | 수정 | Node.js 미설치 환경 대비 네이티브 PowerShell 폴백 실행 지원 강화 |
| `tests/online_installer.test.js` | 생성 | 부트스트랩 스크립트 정적 AST 구문 검증, URL 정합성, 인자/경로 단위 테스트 |
| `README.md` | 수정 | Windows 11 + Chrome/Whale 1줄 설치 섹션 및 원격 보안 안내 전면 개편 |
| `.gemini/knowledge/wiki/index.md` | 수정 | 스프린트 계약서 등록 |
| `.gemini/knowledge/wiki/log.md` | 수정 | 지식 감사 추적 로그 갱신 |

---

## 4. 기술적 제약 및 규칙 (Technical Constraints)
- Windows PowerShell 5.1 기본 탑재 모듈(`Invoke-RestMethod`, `Invoke-WebRequest`, `Expand-Archive`, `Start-Process`)만 사용.
- GitHub 원격 주소 SSOT: `https://github.com/jinhoOps/chzzk-chat-icon-hugify` / `main`.
- 레지스트리 수정이나 관리자 권한 요구 절대 금지.
- 네트워크 요청을 포함하는 모의 테스트는 오프라인/mock으로 격리 수행.

---

## 5. 검증 명령 (Verification Commands)
```bash
npm test
powershell -File install-online.ps1 -DryRun -Browser chrome
powershell -File install-online.ps1 -DryRun -Browser whale
```

---

## 6. 핸드오프 체크리스트 (Developer Sign-off)
- [ ] 모든 단위 테스트 통과 (기존 36개 + 신규 부트스트랩 테스트)
- [ ] install-online.ps1 dry-run 및 정적 검증 완료
- [ ] README 1줄 명령어 및 투명성 안내 반영 완료
- [ ] Git 커밋 완료 및 working tree clean
