# SC-20260920-06: 확장 관리 페이지 실행 보강 및 직접 주소 fallback

> **계약 ID**: SC-20260920-06
> **담당자**: Developer
> **검증자**: Evaluator
> **날짜**: 2026-09-20

---

## 1. 스프린트 목표 (Objective)

Windows 원격 설치기가 기존에 선택한 Chrome/Whale 프로필에서 확장 관리 페이지를 새 창으로 열도록 실행 인자를 보강한다. 이미 브라우저가 실행 중이거나 브라우저가 내부 커맨드라인 URL을 전달하지 못하는 경우에도 사용자가 주소창에 직접 입력해 설치를 계속할 수 있도록 Chrome과 Whale의 확장 관리 주소를 빠른 시작에 명시한다.

## 2. 완료 기준 (Definition of Done, DoD)

- [ ] `install-online.ps1`이 선택한 기존 프로필을 유지하면서 확장 관리 페이지를 새 창에서 열도록 실행 인자와 URL을 구성한다.
- [ ] 설치 완료 안내에 브라우저별 직접 입력 주소를 출력한다.
- [ ] README 빠른 시작과 디스코드 공유 문서에 자동 이동 실패 시의 직접 주소를 안내한다.
- [ ] Chrome/Whale 실행 인자와 주소 안내를 검증하는 테스트가 추가되고 전체 테스트가 통과한다.
- [ ] PowerShell AST, Chrome/Whale dry-run, diff 위생 검증이 통과한다.
- [ ] 위키 계획 인덱스와 append-only 감사 로그를 갱신한다.

## 3. 영향 범위 및 수정 파일 (Scope & Blast Radius)

| 파일 경로 | 작업 유형 | 변경 목적 |
|---|---|---|
| `install-online.ps1` | 수정 | 선택 프로필의 확장 관리 페이지 새 창 실행 및 직접 주소 안내 |
| `tests/profile_installer.test.js` | 수정 | Chrome/Whale 실행 인자와 fallback 출력 검증 |
| `tests/online_installer.test.js` | 수정 | 주소 상수와 새 창 실행 계약 검증 |
| `README.md` | 수정 | 빠른 시작에 Chrome/Whale 직접 주소 추가 |
| `discord-share.md` | 수정 | 공유용 설치 절차의 직접 주소 추가 |
| `.gemini/knowledge/wiki/plans/sprint_extension_manager_fallback.md` | 생성 | 본 스프린트 계약 |
| `.gemini/knowledge/wiki/index.md` | 수정 | 새 계획 링크 등록 |
| `.gemini/knowledge/wiki/log.md` | 수정 | 변경 결정과 검증 기록 |

## 4. 기술적 제약 및 규칙 (Technical Constraints)

- Windows PowerShell 5.1/7.x 기본 기능만 사용한다.
- `--user-data-dir`와 `--profile-directory`로 선택한 기존 프로필을 계속 사용하며 새 사용자 데이터 폴더를 만들지 않는다.
- 관리자 권한, 레지스트리 변경, 사용자 브라우저 데이터 삭제를 수행하지 않는다.
- 자동 URL 이동이 실패해도 설치 폴더와 선택 프로필 정보가 안내되도록 한다.
- 기존 Release 갱신, `-Browser`, `-Profile`, `-UserDataDir`, `-DryRun` 동작을 회귀시키지 않는다.

## 5. 검증 명령 (Verification Commands)

```powershell
npm test
powershell -NoProfile -File install-online.ps1 -DryRun -Browser chrome
powershell -NoProfile -File install-online.ps1 -DryRun -Browser whale
git diff --check
```

## 6. 핸드오프 체크리스트 (Developer Sign-off)

- [ ] 신규 및 기존 테스트가 모두 통과함
- [ ] 선택 프로필과 새 창 실행 인자가 로그로 확인됨
- [ ] README와 디스코드 공유 문서가 실제 주소와 일치함
- [ ] 기존 사용자 변경 및 `.codegraph` 로컬 변경을 건드리지 않음
- [ ] 커밋과 `origin/main` 푸시가 완료됨
