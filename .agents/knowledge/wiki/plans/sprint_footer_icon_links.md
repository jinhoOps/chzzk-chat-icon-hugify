---
okf_version: "0.1"
type: node
title: "팝업 하단 아이콘 링크 3종"
description: "수땡 치지직 라이브, Discord, Hugify GitHub 저장소로 이동하는 아이콘 링크를 팝업 하단에 제공한다."
tags: [popup, links, accessibility]
timestamp: 2026-09-20T00:00:00Z
---

# 팝업 하단 아이콘 링크 3종

## Definition of Done

- [ ] 하단 바로가기 영역에 제공된 이미지 3개가 가로로 표시된다.
- [ ] 치지직 라이브, Discord 초대, GitHub 저장소 URL이 각각 새 탭으로 열린다.
- [ ] 각 링크에 접근성 레이블과 키보드 포커스 표시가 있다.
- [ ] 기존 단일 방송 링크 마크업과 CSS가 남지 않는다.
- [ ] 팝업 회귀 테스트와 정적 검증이 통과한다.

## Scope

- `src/popup.html`
- `src/popup.css`
- `tests/popup.test.js`
- `icons/suttaeng_chzzklive.png`
- `icons/suttaeng_discord.png`
- `icons/dev-github.png`
