---
name: wiki-librarian
description: Open Knowledge Format (OKF) v0.1 규격에 따라 프로젝트 지식을 계층적으로 수집·합성·인덱싱하고, 지식의 복리 축적(Compounding)과 위키 위생을 관리하는 사서 스킬.
---

# `wiki-librarian` Skill

이 스킬은 프로젝트를 **Open Knowledge Format (OKF) v0.1** 규격에 기반한 지능형 지식 베이스(LLM-Wiki)로 운영하는 사서(Librarian)의 워크플로우를 정의합니다.
단순한 메모 기록을 넘어 지식이 유기적으로 연결되고 복리로 누적되도록 관리합니다.

---

## 1. 🏛️ 지식의 3대 계층 (Architectural Layers)

1. **Raw Sources (`/raw/` 또는 사용자 프롬프트)**:
   - 가공되지 않은 사용자 요청, 외부 레퍼런스, 원시 데이터.
   - 수정 불가능한 불변 데이터로 취급합니다.
2. **The Wiki (`.gemini/knowledge/wiki/`)**:
   - OKF 규격에 따라 구조화된 마크다운 문서군 (`core/`, `phases/`, `archive/`).
   - 지속적으로 정제되고 합성되는 프로젝트의 집단 지성입니다.
3. **The Schema (`AGENTS.md`, `index.md`, `SKILL.md`)**:
   - 에이전트와 위키가 준수해야 할 운영 규약 및 헌법입니다.

---

## 2. 🔄 핵심 운영 프로세스 (Operations)

### 1) 지식 수집 및 합성 (Ingest & Synthesize)
새로운 작업(기능 개발, 버그 수정, 아키텍처 결정)이 완료되면:
- **영향도 분석**: 새로운 지식이 기존 문서의 어느 영역에 영향을 미치는지 파악합니다.
- **모순 해소**: 과거의 가설이나 기술 사양과 상충되는 경우, 최신 사실을 기반으로 기존 문서를 업데이트합니다.
- **상호 연결**: 고립된 페이지를 만들지 않고, 항상 표준 마크다운 상대 경로 링크(`[표시 이름](./relative_path.md)`)로 연결합니다.

### 2) 연대기적 감사 로그 (Chronological Logging)
- `.gemini/knowledge/wiki/log.md`에 append-only 형식으로 기록합니다.
- 형식: `## [YYYY-MM-DD] <operation> | <작업 제목>`
  - `<operation>`: `ingest`, `refactor`, `decision`, `archive` 등

### 3) 지식 검증 (Lint)
- **Frontmatter 검증**: 최상단에 `okf_version`, `type`, `title`, `description`, `tags`, `timestamp` 포함 여부 확인.
- **링크 무결성**: 상대 링크가 깨지지 않았는지, Obsidian 전용 링크(`[[...]]`) 대신 표준 마크다운 상대 링크를 사용하는지 점검.
- **고아 페이지 점검**: 인덱스나 다른 문서에서 링크되지 않은 페이지가 없는지 확인.

### 4) 위키 위생 관리 (Wiki Hygiene & Archive)
- 만료되거나 대체된 과거 기획서/기록은 삭제하지 않고 `archive/` 디렉토리로 이동합니다.
- 이동된 문서 상단에 `[DEPRECATED]` 배너와 현재 유효한 최신 문서 링크를 명시합니다.
- `index.md`를 갱신하여 언제나 프로젝트의 최신 지도를 유지합니다.

---

## 3. OKF v0.1 Frontmatter 템플릿

```markdown
---
okf_version: "0.1"
type: node
title: "문서 제목"
description: "핵심 요약 (1~2문장)"
tags: [tag1, tag2]
timestamp: YYYY-MM-DDTHH:MM:SSZ
---
```
