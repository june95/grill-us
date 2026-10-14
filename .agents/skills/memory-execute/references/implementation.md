# Scoped Implementation

상세 작업 계약은 task.md다. implementation에 필요한 이 지침과 [공통 규약](conventions.md)을 읽으며 상태/증거·단독 단계의 상세는 정본 anchor를 따른다.

## Preconditions

Task scope·AC·Dependencies와 현재 근거를 확인한다. Compliant 또는 실제 승인된 Approved Design Change만 구현하고 필요한 design-guide-update가 먼저 유효해야 한다. 관련 사용자 working/index를 확인해 보존한다. 후속 Task 전체를 기다리는 aggregate gate나 생략 보고서 부재만의 차단은 만들지 않는다.

## Scope

1. 실행 단계는 running으로 기록하고 지정 파일·호출부·근접 suite와 관례만 확인한다.
2. I01/I02에 대응하는 최소 변경을 수행한다. 계획 밖 기능·의존성·광범위 정리를 추가하지 않는다.
3. 범위 안 파일/심볼 조정과 중요한 계약 선택은 [Change Boundaries](conventions.md#change-boundaries), Revision/증거 영향은 [Task Fields](conventions.md#task-fields)를 적용한다.
4. 단독 implementation은 변경·최소 검증·보고까지만 수행한다. 별도 review/test·커밋·완료·전진은 [Stage Isolation](conventions.md#stage-isolation)의 경계를 유지한다.

[Planning Boundaries](conventions.md#planning-boundaries)에 따라 공유 API·DTO·저장/모듈 경계·중요 처리 순서/오류/상태·AC·검증과 Task Constraints를 지킨다. 계약에 필수로 고정하지 않은 private helper 이름·분할·동등한 알고리즘은 실행자가 선택한다. 새 파일/추상화는 기존 소유 위치에 둘 수 없는 이유를 남기며, 계획 자체의 과설계는 계획 문제로 보고하고 승인 구조를 자동 재설계하지 않는다.

## Comments

- 목적이 불명확한 신규/의미 변경 함수에는 짧은 주석/docstring을 둔다. 중요한 인자·반환·부수 효과를 설명하고 명백한 대입/이름은 반복하지 않는다.
- 한국어 설명을 기본으로 하되 프로젝트 JSDoc/docstring·식별자/타입/프로토콜 관례를 유지한다. 문서 변경에 함수 주석이나 untouched 함수 정리를 강제하지 않는다.

## Verification

실제 최소 command/cwd는 [Validation Discovery](project-profile.md#validation-discovery)에서 확인한다. [증거·환경](conventions.md#evidence-and-completion)과 [관측/목적](conventions.md#investigation-outcomes)에 맞춰 결과·한계를 기록한다. 통과 목표 실패를 조사 완료로 재해석하지 않는다.

범위 안 결함은 수정하고 영향 검증만 반복한다. 같은 실패를 새 근거 없이 반복하지 않으며 환경/설계 blocker는 원인·다음 행동을 남긴다. 변경한 구현·테스트·가이드의 관련 review/test evidence를 갱신한다.

## Progress

implementation.md에 I01/I02별 무엇·왜, 실제 대상·핵심 설명·주석 변화·검증·계획 조정/승인·남은 일을 기록한다. [Reporting](conventions.md#reporting)의 실제 범위만 체크하고 passed를 Task done으로 해석하지 않는다. 범위 밖 발견은 권고만 보고한다.
