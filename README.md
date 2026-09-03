# Sandbox (Agent Harness Initialized)

이 저장소는 **에이전트 하네스 엔지니어링(Agent Harness Engineering)** 체계가 초기화된 프로젝트 샌드박스입니다.
AI 에이전트와 인간 개발자가 고도의 신뢰성과 반복 가능성을 바탕으로 자율 협업할 수 있도록 구조화되어 있습니다.

---

## 🏛️ 하네스 아키텍처 구성

```
.
├── AGENTS.md                  # 에이전트 마스터 라우터 및 거버넌스 규약
├── GEMINI.md                  # Gemini/Antigravity 상호 운용 라우터
├── .gemini/
│   ├── agents/                # 특화 서브에이전트 정의
│   │   ├── planner.md         # 요구사항 분석 및 아키텍처 설계
│   │   ├── developer.md       # 계약 우선 TDD 구현
│   │   └── evaluator.md       # 독립 품질 검증 및 회귀 평가
│   ├── skills/                # 자율 실행 협업 스킬
│   │   ├── orchestration/     # Planner -> Developer -> Evaluator 파이프라인
│   │   ├── wiki-librarian/    # OKF v0.1 기반 지식 합성 및 인덱싱
│   │   └── core-developer/    # 스프린트 계약 템플릿 및 DoD 규칙
│   └── knowledge/wiki/        # Open Knowledge Format (OKF v0.1) LLM-Wiki
│       ├── index.md           # 지식 베이스 마스터 토폴로지 맵
│       ├── log.md             # 불변(Append-only) 연대기 감사 로그
│       ├── core/              # 운영 헌법, 지식 하네스 명세, 아키텍처
│       └── archive/           # 만료된 문서 보관소
```

---

## 🚀 워크플로우

1. **시작**: 작업 전 [AGENTS.md](AGENTS.md)의 `Start Here` 섹션과 [Knowledge Index](.gemini/knowledge/wiki/index.md)를 확인합니다.
2. **계약 우선**: 코드를 작성하기 전 [Sprint Contract](.gemini/skills/core-developer/SPRINT_CONTRACT_TEMPLATE.md)을 작성하여 완료 기준을 선언합니다.
3. **오케스트레이션**: [orchestration](.gemini/skills/orchestration/SKILL.md) 스킬에 따라 기획(Planner) → 개발(Developer) → 평가(Evaluator) 사이클을 거칩니다.
4. **지식 복리 축적**: 작업 완료 후 [wiki-librarian](.gemini/skills/wiki-librarian/SKILL.md) 스킬을 통해 [log.md](.gemini/knowledge/wiki/log.md)와 [index.md](.gemini/knowledge/wiki/index.md)를 갱신합니다.
