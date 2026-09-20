# Gemini & Antigravity Master Router

이 문서는 Antigravity 및 Gemini CLI 환경에서 에이전트가 최상위 지침으로 참조하는 마스터 라우터입니다.
상세한 역할 정의 및 거버넌스 규칙은 [AGENTS.md](AGENTS.md)를 단일 진실 공급원(SSOT)으로 따릅니다.

---

## 📚 필수 선행 문서 (Gemini CLI / Antigravity)

Gemini CLI 또는 Antigravity에서 작업을 시작할 때는 반드시 다음 두 문서를 모두 읽고 적용하십시오.

1. 현재 문서인 `GEMINI.md`
2. 저장소 루트의 [AGENTS.md](AGENTS.md)

`GEMINI.md`는 Gemini CLI와 Antigravity의 진입점 및 빠른 라우터이고, 역할·검증·변경·지식 관리에 대한 상세 규칙과 충돌 해결 기준은 `AGENTS.md`를 따릅니다. 두 문서가 다르게 보일 때는 [AGENTS.md](AGENTS.md)의 최신 규칙과 사용자 지시를 우선 확인하십시오.

---

## ⚡ 빠른 시작 가이드 (Quick Start)

1. **지식 베이스 탐색**: 프로젝트 지형을 파악하려면 먼저 [.gemini/knowledge/wiki/index.md](.gemini/knowledge/wiki/index.md)를 읽으십시오.
2. **협업 프로토콜 준수**: 기능 개발 시 [.gemini/skills/orchestration/SKILL.md](.gemini/skills/orchestration/SKILL.md)의 3단계 협업 파이프라인을 따릅니다:
   - **Plan**: [Planner](.gemini/agents/planner.md)가 인수 조건과 사양을 수립
   - **Develop**: [Developer](.gemini/agents/developer.md)가 [스프린트 계약](.gemini/skills/core-developer/SPRINT_CONTRACT_TEMPLATE.md)을 선언하고 TDD 구현
   - **Evaluate**: [Evaluator](.gemini/agents/evaluator.md)가 독립 검증 수행
3. **지식 복리 축적**: 작업 완료 후 [wiki-librarian](.gemini/skills/wiki-librarian/SKILL.md)에 따라 [.gemini/knowledge/wiki/log.md](.gemini/knowledge/wiki/log.md)에 작업 내역을 기록하십시오.

---

## 🛡️ 핵심 원칙 (Core Rules)

- **Contract First**: 코드를 작성하기 전에 완료 기준(DoD)을 명시합니다.
- **Evidence-Based**: 실제 테스트 실행 결과 등 입증된 증거 없이 작업을 완료했다고 주장하지 않습니다.
- **Compounding Knowledge**: 단편적인 변경에 그치지 않고, 새로 얻은 지식을 위키 노드로 지속적으로 합성합니다.

---
*전체 라우팅 및 세부 원칙은 [AGENTS.md](AGENTS.md)를 참조하십시오.*
