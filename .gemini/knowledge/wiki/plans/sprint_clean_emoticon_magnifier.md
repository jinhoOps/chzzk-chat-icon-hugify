# SC-20260920-07: 단일 목적 이모티콘 확대 UI 정리

> **계약 ID**: SC-20260920-07
> **담당자**: Developer
> **검증자**: Evaluator
> **날짜**: 2026-09-20

---

## 1. 스프린트 목표 (Objective)

확장 프로그램을 치지직 이모티콘 호버 확대라는 한 가지 목적에 집중시킨다. 팝업에 남아 있는 픽셀 크기 표기와 크기 선택, 코드 배지, 픽셀 보정, 임시 중지 같은 부가 UI·설정을 제거하고, 고정된 확대 미리보기와 켜기/끄기 토글만 제공한다.

## 2. 완료 기준 (Definition of Done, DoD)

- [x] 팝업에 `px`, 크기 선택, 이모티콘 코드, 픽셀 보정, 임시 중지 UI가 표시되지 않는다.
- [x] 툴팁은 이모티콘 이미지와 접근성용 alt만 표시하며 코드/크기 텍스트를 렌더링하지 않는다.
- [x] 확대 크기는 내부 기본값으로 고정되고 기존 설정 변경 코드와 레거시 저장값 의존성이 제거된다.
- [x] 팝업 스크립트와 content script가 `size`, `showAltBadge`, `crispScaling`, `snoozedUntil`을 읽거나 저장하지 않는다.
- [x] 정적 UI 회귀 테스트와 기존 전체 테스트가 통과한다.
- [x] README 기능 설명이 단일 목적 동작과 일치한다.
- [x] 위키 계획 인덱스와 append-only 감사 로그를 갱신한다.

## 3. 영향 범위 및 수정 파일 (Scope & Blast Radius)

| 파일 경로 | 작업 유형 | 변경 목적 |
|---|---|---|
| `src/popup.html` | 수정 | 단일 토글 중심의 간결한 팝업 |
| `src/popup.js` | 수정 | `enabled` 설정만 동기화 |
| `src/popup.css` | 수정 | 제거된 부가 UI 스타일 삭제 |
| `src/content.js` | 수정 | 고정 확대 및 이미지 전용 툴팁 |
| `src/content.css` | 수정 | 코드 배지·픽셀 보정 스타일 삭제 |
| `src/utils.js` | 수정 | 크기 프리셋/스누즈 설정 제거 |
| `tests/popup.test.js` | 생성 | px 및 부가 UI 회귀 검증 |
| `tests/utils.test.js` | 수정 | 단일 목적 활성화 로직 검증 |
| `tests/content_logic.test.js` | 수정 | 제거된 부가 설정 검증 정리 |
| `README.md` | 수정 | 핵심 기능을 이모티콘 확대 중심으로 정리 |
| `.gemini/knowledge/wiki/index.md` | 수정 | 새 계획 링크 등록 |
| `.gemini/knowledge/wiki/log.md` | 수정 | 변경 결정과 검증 기록 |

## 4. 기술적 제약 및 규칙 (Technical Constraints)

- Manifest V3와 Chrome/Whale 호환성을 유지한다.
- 기존 브라우저 프로필 설치, Release 갱신, 주소 fallback 변경을 되돌리지 않는다.
- 기존 로컬 저장소에 남아 있는 제거된 설정값은 무시하며 사용자 데이터를 삭제하지 않는다.
- DOM 대상 필터링과 고해상도 원본 URL 복원 동작은 유지한다.

## 5. 검증 명령 (Verification Commands)

```powershell
npm test
git diff --check
```

## 6. 핸드오프 체크리스트 (Developer Sign-off)

- [x] 신규 및 기존 테스트가 모두 통과함
- [x] 팝업과 툴팁에서 px/코드/부가 옵션이 제거됨
- [x] README가 실제 단일 목적 UI와 일치함
- [x] 기존 사용자 변경 및 `.codegraph` 로컬 변경을 건드리지 않음
