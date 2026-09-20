---
okf_version: "0.1"
type: node
title: "팝업 브랜드 링크 및 앱 메뉴 정리"
description: "브랜드 아이콘을 치지직 채널 링크로 만들고, 하단 바로가기를 작은 앱 메뉴로 정리한다."
tags: [popup, navigation, ui]
timestamp: 2026-09-20T00:00:00Z
---

# 팝업 브랜드 링크 및 앱 메뉴 정리

## Definition of Done

- [ ] 상단 `icon128.png`이 축소 렌더링되며 수땡 치지직 채널을 새 탭으로 연다.
- [ ] 하단 바로가기는 높이 44px 안에 40px 아이콘 4개를 묶은 앱 메뉴 형태다.
- [ ] GitHub 링크는 새 `dev-github.png`를 다른 앱 메뉴 이미지와 같은 방식으로 표시한다.
- [ ] 카카오톡은 채널 URL을 보관하되 사용자 입력으로는 열리지 않는 비활성 버튼이다.
- [ ] 각 링크의 접근성 레이블·새 탭 보안 속성·포커스 스타일을 유지한다.
- [ ] 팝업 회귀 테스트와 정적 검증이 통과한다.

## Scope

- `src/popup.html`
- `src/popup.css`
- `tests/popup.test.js`
