---
okf_version: "0.1"
type: node
title: "Sprint Contract — v1.1.2 footer polish"
description: "Plan for the v1.1.2 footer polish and disabled Kakao shortcut guidance."
tags: [sprint, release, popup, footer]
timestamp: 2026-09-20T22:27:05Z
---

# Sprint Contract — v1.1.2 footer polish

## Objective

Keep the Kakao shortcut unavailable while showing `오픈카톡 예정` on hover, and ship the pending footer spacing fix as version 1.1.2.

## Definition of Done

- [ ] The disabled Kakao button has a hover title of `오픈카톡 예정` and cannot navigate.
- [ ] The footer is 48px high while its icon assets remain 40px.
- [ ] `manifest.json` and `package.json` both declare 1.1.2.
- [ ] Automated tests, syntax check, whitespace check, and the release workflow pass.

## Scope

| File | Change |
| --- | --- |
| `src/popup.html` | Kakao hover guidance |
| `src/popup.css` | Allow hover on disabled shortcut while retaining disabled styling |
| `src/popup.js` | Suppress disabled shortcut navigation |
| `tests/popup.test.js` | Static popup contract coverage |
| `manifest.json`, `package.json` | Patch version bump |
