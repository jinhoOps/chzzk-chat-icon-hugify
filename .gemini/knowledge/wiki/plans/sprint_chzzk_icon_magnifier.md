# 스프린트 계약서 (Sprint Contract)

> **계약 ID**: SC-20260920-01  
> **담당자**: Developer  
> **검증자**: Evaluator  
> **날짜**: 2026-09-20  

---

## 1. 스프린트 목표 (Objective)
- 치지직(`https://chzzk.naver.com/live/*`) 방송 채팅 이모티콘 팝업 및 채팅창 내 아이콘에 마우스를 올렸을 때, 아이콘을 확대해서 보여주는 크롬 확장프로그램(Chrome Extension Manifest V3) 구현.
- 사용자가 요청한 핵심 제어 기능 제공:
  1. 마우스 호버 시 실시간 확대 툴팁 표시
  2. 10초 임시 비활성화 버튼 (Snooze 10s) 및 카운트다운
  3. 영구 활성화/비활성화 토글 스위치 (ON/OFF)
  4. 확대 크기 옵션: 원본(60x60px), 확대(90x90px), 대형(120x120px)
  5. 고해상도 원본 자동 감지(썸네일 쿼리스트링 처리) 및 폰트/스타일 최적화

---

## 2. 완료 기준 (Definition of Done, DoD)
- [ ] Chrome Extension Manifest V3 규격 준수 (`manifest.json`)
- [ ] 치지직 라이브 방송 페이지(`chzzk.naver.com/live/*`)에서 이모티콘 호버 감지 및 툴팁 렌더링 동작
- [ ] 팝업(Extension Popup) UI에서:
  - 마스터 활성화/비활성화 토글 작동 및 상태 저장(`chrome.storage`)
  - 10초 비활성화 버튼 클릭 시 즉시 비활성화 및 10초 카운트다운 UI 제공
  - 확대 크기 라디오 선택 (60x60, 90x90, 120x120) 즉시 반영
- [ ] 툴팁 UI:
  - 치지직 다크 테마에 어울리는 현대적 플로팅 디자인
  - 화면 가장자리(뷰포트) 경계 이탈 방지 자동 플립/오프셋 계산
  - alt 텍스트(이모티콘 코드) 함께 표시
  - 원본 이미지 URL(`nng-phinf.pstatic.net` 등) 썸네일 해제 알고리즘 적용
- [ ] 단위 테스트(`node:test`)를 통해 핵심 로직(URL 변환, 스누즈 만료 판정, 크기 프리셋, 경계 계산) 검증 성공
- [ ] 확장프로그램 아이콘 에셋(16, 48, 128px) 포함
- [ ] GitHub 레포지토리 생성 및 연동 가이드 문서화

---

## 3. 영향 범위 및 수정 파일 (Scope & Blast Radius)
| 파일 경로 | 작업 유형 | 변경 목적 |
|---|---|---|
| `.gemini/knowledge/wiki/plans/sprint_chzzk_icon_magnifier.md` | 생성 | 스프린트 계약서 선언 |
| `manifest.json` | 생성 | Chrome Extension Manifest V3 설정 |
| `src/content.js` | 생성 | 치지직 DOM 이모티콘 호버 감지, 툴팁 표시 및 위치 계산, 스누즈 제어 |
| `src/content.css` | 생성 | 확대 툴팁 스타일 및 다크 테마 애니메이션 |
| `src/popup.html` | 생성 | 확장프로그램 팝업 설정 UI |
| `src/popup.css` | 생성 | 팝업 스타일링 |
| `src/popup.js` | 생성 | 팝업 이벤트 처리 및 chrome.storage 동기화 |
| `src/utils.js` | 생성 | URL 변환, 옵션 기본값, 타이머 유틸 함수 (테스트 가능 모듈) |
| `icons/icon16.png`, `48.png`, `128.png` | 생성 | 확장프로그램 아이콘 에셋 |
| `package.json` | 생성 | 테스트 및 빌드 스크립트 정의 |
| `tests/utils.test.js` | 생성 | 핵심 유틸리티 로직 단위 테스트 |
| `README.md` | 수정 | 확장프로그램 설치 방법, 사용법 및 GitHub 연동 안내 |

---

## 4. 기술적 제약 및 규칙 (Technical Constraints)
- Chrome Extension Manifest V3 표준 준수.
- Chzzk의 CSS 클래스명이 해시 기반(`_emoticon_1dr17_172`, `_contents_jao35_54`)으로 동적 변경될 수 있으므로, 부분 속성 셀렉터(`[class*="_emoticon_"]`, `#popup_contents`, `img[src*="emoji"]` 등) 및 `mouseover`/`pointerover` 이벤트 위임을 사용하여 내구성을 확보할 것.
- 외부 무단 스크립트 로드 금지(Manifest V3 CSP 준수).
- 설정값은 `chrome.storage.sync` 또는 `chrome.storage.local`을 사용하여 실시간 동기화.

---

## 5. 검증 명령 (Verification Commands)
```bash
npm test
```

---

## 6. 핸드오프 체크리스트 (Developer Sign-off)
- [ ] 모든 단위 테스트 통과
- [ ] Manifest 유효성 및 구문 오류 없음
- [ ] 사용 설명서 및 GitHub 설정 안내 완료
