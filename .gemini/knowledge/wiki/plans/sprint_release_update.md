# SC-20260920-05: Release 기반 최신 버전 갱신

> **계약 ID**: SC-20260920-05
> **담당자**: Developer
> **검증자**: Evaluator
> **날짜**: 2026-09-20

---

## 1. 스프린트 목표 (Objective)

현재 `main.zip`을 다시 받는 방식의 원격 설치기를 GitHub Release 기반으로 확장한다. 사용자는 기존 README 원라이너를 다시 실행하면 최신 안정 버전을 자동 확인하고, 새 버전일 때만 기존 설치 폴더를 안전하게 교체할 수 있어야 한다.

Release가 아직 없거나 GitHub API를 사용할 수 없는 환경에서는 기존 `main.zip` 부트스트랩으로 되돌아가 기존 설치 경로를 유지한다.

---

## 2. 완료 기준 (Definition of Done, DoD)

- [ ] `install-online.ps1`이 최신 Release의 `manifest.json` 버전과 로컬 설치 버전을 비교한다.
- [ ] 최신 버전이면 다운로드하지 않고, `-Refresh`이면 같은 버전도 강제로 다시 받는다.
- [ ] Release API/자산이 없거나 실패하면 `main.zip`으로 호환 설치를 계속한다.
- [ ] 다운로드·압축 해제·manifest 검증 후 staging 디렉터리에서 기존 앱을 백업하고 교체하며, 실패 시 이전 설치를 복구한다.
- [ ] GitHub Actions가 `vX.Y.Z` 태그와 `manifest.json` 버전을 검증하고 확장 파일 ZIP을 Release 자산으로 만든다.
- [ ] README에 일반 갱신 방법과 개발자가 버전을 올리고 태그를 푸시하는 방법을 접힌 영역으로 문서화한다.
- [ ] 원격 설치기 정적/PowerShell 구문/오프라인 프로필 테스트와 신규 Release 워크플로 검증이 통과한다.
- [ ] 변경 기록과 인덱스를 갱신하고 `main`에 커밋·푸시한다.

---

## 3. 영향 범위 및 수정 파일 (Scope & Blast Radius)

| 파일 경로 | 작업 유형 | 변경 목적 |
|---|---|---|
| `install-online.ps1` | 수정 | Release 조회, 버전 비교, fallback, 안전한 교체 |
| `.github/workflows/release.yml` | 생성 | 태그 기반 확장 ZIP Release 자동 생성 |
| `tests/online_installer.test.js` | 수정 | Release/fallback/버전 갱신 계약 검증 |
| `tests/release_workflow.test.js` | 생성 | GitHub Actions 패키징·태그 검증 정적 테스트 |
| `README.md` | 수정 | 사용자 갱신 및 개발자 배포 절차 문서화 |
| `.gemini/knowledge/wiki/plans/sprint_release_update.md` | 생성 | 본 스프린트 계약 |
| `.gemini/knowledge/wiki/index.md` | 수정 | 새 계획 링크 등록 |
| `.gemini/knowledge/wiki/log.md` | 수정 | 변경 결정과 검증 기록 |

---

## 4. 기술적 제약 및 규칙 (Technical Constraints)

- Windows PowerShell 5.1 기본 제공 기능만 사용한다.
- 설치 디렉터리는 기존 `%LOCALAPPDATA%\\ChzzkIconMagnifier\\app`를 유지한다.
- 사용자 브라우저 프로필, 레지스트리, 관리자 권한은 변경하지 않는다.
- Release 자산은 `manifest.json`, `icons/`, `src/`만 포함한다.
- 네트워크를 호출하는 테스트는 mock 또는 오프라인 dry-run으로 격리한다.
- 기존 브라우저 프로필 선택과 `-Browser`, `-Profile`, `-UserDataDir`, `-DryRun`, `-Fallback` 동작을 회귀시키지 않는다.

---

## 5. 검증 명령 (Verification Commands)

```bash
npm test
powershell -NoProfile -File install-online.ps1 -DryRun -Browser chrome
powershell -NoProfile -File install-online.ps1 -DryRun -Browser whale
git diff --check
```

---

## 6. 핸드오프 체크리스트 (Developer Sign-off)

- [ ] 신규 테스트 및 기존 테스트가 모두 통과함
- [ ] Release가 없는 저장소에서도 설치기 fallback이 유지됨
- [ ] 기존 앱 교체 실패 시 백업 복구 경로가 검증됨
- [ ] README·위키가 실제 동작과 일치함
- [ ] 커밋과 `origin/main` 푸시가 완료됨
