---
okf_version: "0.1"
type: node
title: "팝업 크기 안내 및 CookieRun 서체 적용"
description: "팝업의 크기 변경 안내와 CookieRun 서체를 적용하고, README 및 릴리스 패키징을 단순화한다."
tags: [popup, font, readme, release]
timestamp: 2026-09-20T00:00:00Z
---

# 팝업 크기 안내 및 CookieRun 서체 적용

## 결정

- 크기 선택을 바꾸면 `크기 변경 시 적용을 위해 새로고침이 필요합니다.` 안내를 팝업 안에 표시한다.
- 팝업의 별도 `크기` 제목은 제거하고, 두 이미지 카드가 선택 영역을 설명하도록 유지한다.
- CookieRun Regular/Bold OTF를 원본 그대로 팝업에 번들한다.
- 글꼴 라이선스 전문과 공식 출처를 `fonts/LICENSE-CookieRun.txt`에 포함한다.
- README는 Chrome 빠른 시작만 펼친 상태로 제공하고, 수동 등록·Whale·업데이트·보안·개발자 정보를 하나의 `<details>`에 넣는다.

## 영향 범위

- `src/popup.html`, `src/popup.js`, `src/popup.css`
- `fonts/`
- `.github/workflows/release.yml`
- `README.md`
- `tests/popup.test.js`, `tests/release_workflow.test.js`

## 검증

- `npm test` — 61/61 통과
- `node --check src/popup.js` 통과
- `git diff --check` 통과
- `codegraph sync` 완료
