---
okf_version: "0.1"
type: node
title: "Operating Principles"
description: "Core operating principles, quality standards, and verification guidelines for the repository."
tags: [governance, principles, quality, git, verification]
timestamp: 2026-09-04T00:00:00Z
---

# 프로젝트 운영 원칙 (Operating Principles)

이 문서는 저장소 내에서 작업하는 모든 에이전트와 개발자가 준수해야 할 기본 운영 헌법입니다.

---

## 1. 핵심 원칙 (Core Tenets)

1. **계약 우선 (Contract First)**:
   - 구현 코드를 작성하기 전에 목표, 범위, 검증 가능한 완료 기준(DoD)을 명시적으로 선언합니다.
   - [SPRINT_CONTRACT_TEMPLATE](../../skills/core-developer/SPRINT_CONTRACT_TEMPLATE.md)을 활용하여 작업 계약을 체결합니다.

2. **단일 진실 공급원 (Single Source of Truth, SSOT)**:
   - 코드, 기획, 데이터 계약 간의 충돌 시 우선순위 사다리를 준수합니다.
   - 중복 정의를 피하고, 문서는 원천 문서를 링크하여 인용합니다.

3. **증거 기반 완료 (Evidence-Based Completion)**:
   - 실제 테스트 실행 결과, 린트 출력, 빌드 성공 증거 없이 완료를 선언하지 않습니다.
   - 추측성 완료 보고를 엄격히 금지합니다.

4. **비파괴적 변경 및 기준선 보호**:
   - 현재 정상 작동 중인 제품 기준선(Baseline)을 임의로 훼손하지 않습니다.
   - 사용자 또는 다른 작업자의 변경 사항을 존중하고 보존합니다.

---

## 2. 작업 흐름 및 핸드오프 (Handoff Protocol)

```
[요구사항] -> [Planner: 기획/스펙] -> [Developer: 계약 및 구현] -> [Evaluator: 독립 검증] -> [Librarian: 지식 인덱싱]
```

- **Planner**: 사용자 요구사항 분석, 범위 획정, 수용 조건(Acceptance Criteria) 정의
- **Developer**: 스프린트 계약 선언, 최소 침습 구현, 단위 테스트 작성 및 통과
- **Evaluator**: 계약 기준 독립 검증, 회귀 영향 평가, 승인 또는 결함 루프백
- **Librarian**: 변경된 아키텍처 및 결정 사항을 위키에 합성, `log.md` 및 `index.md` 갱신

---

## 3. 검증 매트릭스 (Verification Standards)

| 변경 대상 | 필수 검증 항목 |
|---|---|
| **문서 / 위키** | 상대 링크 유효성 검사, Frontmatter 정합성, 용어 일관성 |
| **코드 로직** | 단위/통합 테스트 통과, 타입 체커 및 린터 무결성 |
| **UI / 컴포넌트** | 반응형 레이아웃, 시각적 회귀 방지, 접근성 검증 |
| **인프라 / 설정** | 빌드 성공 및 환경 호환성 검증 |

---

## 4. 우선순위 사다리 (Precedence Order)

문서 간 또는 지시 사항 간 충돌 발생 시:
1. 최신 사용자 지시
2. 공식 활성 요구사항 / PRD
3. 승인된 스프린트 계약
4. 위키 핵심 헌법 (`core/`)
5. 현재 코드 및 테스트의 실제 동작
6. 과거 Git 이력 및 아카이브 문서

---
*연결 노드:* [Knowledge Harness](./knowledge_harness.md), [Architecture Reference](./architecture_reference.md), [Index](../index.md)
