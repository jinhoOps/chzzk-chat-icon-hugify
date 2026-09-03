# 스프린트 계약서 (Sprint Contract)

> **계약 ID**: SC-YYYYMMDD-01  
> **담당자**: Developer  
> **검증자**: Evaluator  
> **날짜**: YYYY-MM-DD  

---

## 1. 스프린트 목표 (Objective)
- 구현하고자 하는 핵심 기능 또는 해결할 문제의 요약을 기술합니다.

---

## 2. 완료 기준 (Definition of Done, DoD)
- [ ] 조건 1: 구체적이고 검증 가능한 성공 기준
- [ ] 조건 2: 예외 처리 및 에지 케이스 대응
- [ ] 조건 3: 단위/통합 테스트 통과

---

## 3. 영향 범위 및 수정 파일 (Scope & Blast Radius)
| 파일 경로 | 작업 유형 (생성/수정/삭제) | 변경 목적 |
|---|---|---|
| `path/to/file.ext` | 생성 | 핵심 로직 구현 |
| `tests/path/test.ext` | 생성 | 단위 테스트 |

---

## 4. 기술적 제약 및 규칙 (Technical Constraints)
- 사용해야 할 라이브러리 / 금지된 패턴
- 호환성 유지 항목
- 성능 및 보안 요구사항

---

## 5. 검증 명령 (Verification Commands)
```bash
# 실행할 테스트 또는 린트 명령
npm test # 또는 pytest, go test 등
```

---

## 6. 핸드오프 체크리스트 (Developer Sign-off)
- [ ] 신규 작성된 테스트가 로컬 환경에서 모두 성공함
- [ ] 인접 모듈에 미치는 의도치 않은 변경이 없음
- [ ] Evaluator 검증 준비 완료
