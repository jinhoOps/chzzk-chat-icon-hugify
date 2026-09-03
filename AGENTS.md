# Agent Guide & Repository Router

이 문서는 프로젝트 내에서 작업하는 모든 자율 에이전트와 엔지니어가 자신의 역할에 맞는 기준 문서와 운영 규칙을 즉시 찾기 위한 마스터 라우터입니다.

---

## 1. Start Here (작업 시작 가이드)

1. **역할 식별**: 아래 [Role Routing](#2-role-routing)에서 본인의 역할을 확인하고 지정된 문서만 로드합니다.
2. **상태 점검**: 작업 전 `git status --short`로 작업 트리의 변경 사항을 확인합니다.
3. **계약 선언**: 코드 작성 전 반드시 [Sprint Contract](.gemini/skills/core-developer/SPRINT_CONTRACT_TEMPLATE.md)을 작성하여 완료 기준(DoD)을 명시합니다.
4. **최소 침습 구현**: 범위를 벗어난 인접 모듈의 임의 리팩터링을 지양합니다.
5. **독립 검증**: 변경 표면에 해당하는 테스트 및 검증 명령을 실행하여 증거를 확보합니다.
6. **지식 합성**: 작업 완료 후 사서([wiki-librarian](.gemini/skills/wiki-librarian/SKILL.md)) 프로토콜에 따라 [.gemini/knowledge/wiki/log.md](.gemini/knowledge/wiki/log.md) 및 인덱스를 갱신합니다.

---

## 2. Role Routing (역할별 라우팅)

| 역할 | 참조 문서 / 스킬 | 핵심 책임 |
|---|---|---|
| **Coordinator** | [AGENTS.md](AGENTS.md), [Operating Principles](.gemini/knowledge/wiki/core/operating_principles.md), [Git Status](file:///.) | 작업 분리, 의존성 관리, 검증 및 위험 요소 취합 |
| **Planner** | [.gemini/agents/planner.md](.gemini/agents/planner.md), [Architecture Reference](.gemini/knowledge/wiki/core/architecture_reference.md) | 요구사항 분석, UX/데이터 플로우 정의, 인수 조건(DoD) 수립 |
| **Developer** | [.gemini/agents/developer.md](.gemini/agents/developer.md), [.gemini/skills/core-developer/SKILL.md](.gemini/skills/core-developer/SKILL.md) | 스프린트 계약 체결, 계약 준수 TDD 구현, 회귀 최소화 |
| **Evaluator** | [.gemini/agents/evaluator.md](.gemini/agents/evaluator.md), [.gemini/skills/orchestration/SKILL.md](.gemini/skills/orchestration/SKILL.md) | 계약 기준 독립 검증, 회귀 테스트, 결함 피드백 루프백 |
| **Librarian** | [.gemini/skills/wiki-librarian/SKILL.md](.gemini/skills/wiki-librarian/SKILL.md), [.gemini/knowledge/wiki/index.md](.gemini/knowledge/wiki/index.md) | 지식 합성, 연대기적 로그(`log.md`) 기록, 위키 위생 및 링크 검증 |

---

## 3. Minimum Rules (필수 준수 규칙)

- **Contract First**: 코드를 작성하기 전에 "이 요구사항을 구현하기 위한 테스트 및 완료 기준은 무엇인가?"를 먼저 선언합니다.
- **Single Source of Truth (SSOT)**: 동일한 사실을 여러 문서에 분산 복제하지 않고, 원천 문서 하나를 관리하며 나머지는 링크합니다.
- **Evidence-Based Completion**: 실제 테스트 통과 로그나 린트 결과 등 구체적인 증거 없이 완료를 주장하지 않습니다.
- **Non-destructive Changes**: 사용자의 변경이나 작업 중인 다른 에이전트의 코드를 임의로 덮어쓰거나 파괴하지 않습니다.
- **Compounding Knowledge**: 설계 변경이나 중요한 해결책은 반드시 위키 노드로 축적합니다.

---

## 4. Verification Matrix (검증 매트릭스)

| 변경 표면 | 필수 검증 항목 | 검증 도구 및 방식 |
|---|---|---|
| **문서 / 위키** | 상대 링크 유효성, Frontmatter 형식, 용어 정합성 | 링크 클릭 확인, `log.md` 갱신 점검 |
| **코드 로직** | 단위/통합 테스트, 예외 케이스 처리, 린터/타입체크 | 테스트 러너 (`npm test`, `pytest` 등) |
| **UI / 뷰** | 반응형 레이아웃, 시각적 회귀, 접근성 | 브라우저 뷰포트 점검, 스크린샷 대조 |
| **인프라 / 설정** | 빌드 성공, 의존성 호환성, 환경변수 | 빌드 스크립트 실행 |

---

## 5. Conflict Resolution & Handoff (충돌 해결 및 인계)

문서 또는 지시 사항 간 충돌 시 우선순위:
1. 최신 사용자 지시
2. 공식 활성 요구사항 / 기획서
3. 승인된 스프린트 계약서
4. 위키 핵심 헌법 ([Operating Principles](.gemini/knowledge/wiki/core/operating_principles.md))
5. 현재 코드와 테스트의 실제 동작
6. 과거 Git 커밋 이력 및 아카이브

**작업 완료 인계(Handoff)에 포함할 내용:**
- 변경된 파일 목록 및 핵심 목적
- 실행한 검증 명령 및 실제 결과 (통과 증거)
- 잔여 위험 또는 후속 작업 권고 사항

---

## 6. CodeGraph (코드 지식 그래프 가이드)

저장소에는 `.codegraph/`가 초기화되어 로컬 지식 그래프 인덱스를 관리합니다.
- **용도**: AI 에이전트의 심볼 영향 분석(`codegraph impact`), 호출 관계 탐색(`codegraph callers`/`callees`), 복합 컨텍스트 구축(`codegraph explore`/`context`)에 활용합니다.
- **운영 규칙**: 일반 작업자는 매번 재초기화(`codegraph init`)하지 않으며, 코드 변경 후 인덱스 갱신이 필요할 때는 `codegraph sync`를 사용합니다.
- **Git 위생**: `.codegraph/.gitignore`를 통해 로컬 SQLite DB 및 소켓/로그 파일이 커밋되지 않도록 보호합니다.

---

## 7. Canonical Documents Map (핵심 문서 맵)

- **마스터 지식 인덱스**: [.gemini/knowledge/wiki/index.md](.gemini/knowledge/wiki/index.md)
- **운영 헌법**: [.gemini/knowledge/wiki/core/operating_principles.md](.gemini/knowledge/wiki/core/operating_principles.md)
- **지식 하네스 명세**: [.gemini/knowledge/wiki/core/knowledge_harness.md](.gemini/knowledge/wiki/core/knowledge_harness.md)
- **아키텍처 기준선**: [.gemini/knowledge/wiki/core/architecture_reference.md](.gemini/knowledge/wiki/core/architecture_reference.md)
- **연대기적 감사 로그**: [.gemini/knowledge/wiki/log.md](.gemini/knowledge/wiki/log.md)
