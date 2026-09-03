---
name: core-developer
description: 계약 우선(Contract-First) 개발 원칙에 따라 스프린트 계약을 체결하고, TDD 기반의 기능 구현 및 리팩터링을 수행하는 개발자 스킬.
---

# `core-developer` Skill

이 스킬은 프로젝트 내에서 안정적이고 예측 가능한 기능 구현을 보장하기 위해 **계약 우선(Contract-First)** 접근 방식을 준수하는 개발 워크플로우를 정의합니다.

---

## 1. 계약 우선 원칙 (Contract-First Approach)

코드를 작성하기 전, 반드시 **스프린트 계약서(Sprint Contract)**를 작성하여 완료 기준(Definition of Done, DoD)을 명시하고 합의합니다.

1. **완료 기준 사전 정의**: "무엇을 테스트할 것인가?", "어떤 조건이 충족되어야 완료인가?"를 먼저 선언합니다.
2. **최소 침습 구현**: 계약에 명시된 범위에 집중하며, 인접 영역에 대한 임의의 광범위한 리팩터링을 지양합니다.
3. **영향도 및 결함 반경(Blast Radius) 통제**: 변경 대상 모듈과 파일 목록을 사전에 명시하여 사이드 이펙트를 예방합니다.

---

## 2. 작업 순서

```
[Planner 산출물 검토]
         |
         v
[스프린트 계약서 작성] --> SPRINT_CONTRACT_TEMPLATE.md 활용
         |
         v
[테스트 코드 작성 (TDD)]
         |
         v
[기능 구현 및 검증]
         |
         v
[Evaluator에게 검증 핸드오프]
```

---

## 3. 스프린트 계약 템플릿

상세 작성 템플릿은 [SPRINT_CONTRACT_TEMPLATE.md](./SPRINT_CONTRACT_TEMPLATE.md)를 참조하십시오.
