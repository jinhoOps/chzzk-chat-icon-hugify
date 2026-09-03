---
okf_version: "0.1"
type: node
title: "Architecture Reference"
description: "Baseline architectural structure, module boundaries, and conventions."
tags: [architecture, structure, conventions]
timestamp: 2026-09-04T00:00:00Z
---

# 아키텍처 참조 명세 (Architecture Reference)

이 문서는 저장소의 기술 스택, 모듈 경계, 디렉토리 구조의 기준선(Baseline)을 정의합니다.

---

## 1. 저장소 구조 (Repository Topology)

```
.
├── AGENTS.md                  # 에이전트 마스터 라우터 및 역할 안내
├── GEMINI.md                  # Gemini/Antigravity 상호 운용 라우터
├── README.md                  # 프로젝트 소개 및 개발 환경 가이드
├── .gemini/                   # 에이전트 하네스 엔지니어링 코어
│   ├── agents/                # 특화 서브에이전트 페르소나 정의
│   ├── skills/                # 자율 실행 스킬 모음
│   └── knowledge/wiki/        # OKF v0.1 기반 LLM-Wiki 지식 베이스
│       ├── index.md           # 마스터 지식 토폴로지 지도
│       ├── log.md             # 연대기적 변경 및 결정 로그
│       ├── core/              # 핵심 원칙 및 아키텍처
│       └── archive/           # 만료된 문서 보관소
└── src/                       # 애플리케이션 소스 코드 (프로젝트 확장 시)
```

---

## 2. 설계 원칙 (Design Principles)

1. **관심사 분리 (Separation of Concerns)**:
   - 데이터 소유권과 UI 뷰 레이어를 명확히 분리합니다.
   - 단일 진실 공급원(SSOT)을 통해 상태 불일치를 방지합니다.

2. **모듈성 및 재사용성 (Modularity)**:
   - 각 모듈은 최소한의 외부 의존성을 갖도록 설계합니다.
   - 공유 유틸리티는 공통 디렉토리에 배치하여 중복 구현을 방지합니다.

3. **추적성 (Traceability)**:
   - 코드 심볼 변경 시 관련 위키 문서와 테스트 코드가 함께 갱신되어 동기화 상태를 유지합니다.

---
*연결 노드:* [Operating Principles](./operating_principles.md), [Knowledge Harness](./knowledge_harness.md), [Index](../index.md)
