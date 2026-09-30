---
name: grill-me
description: Resolve material requirements and design choices one question at a time, then preserve confirmed decisions in .memory. Use for explicit design interviews or unresolved choices from intake or planning.
---

# Grill Me

사용자가 요청한 설계 인터뷰 또는 intake/planner가 남긴 중요한 미결정 분기를 해소한다. 명확한 수정에 인터뷰를 강제하지 않으며, 질문을 늘리기 위해 이미 확정된 선택을 다시 묻지 않는다.

## Inputs

기능·설계 요청, 기존 Plan/결정 문서, 조사 근거와 남은 분기를 받는다. [프로젝트 확인](../memory-execute/references/project-profile.md)으로 실제 지침·정본·관련 코드를 필요한 만큼 읽고 기존 결정을 확인한다.

## Interview Guidelines

1. 한 번에 질문 하나만 한다. 매 질문에 2~3개의 구체적인 선택지와 Recommended 추천안·이유를 제시한다.
2. 코드·설정·manifest·기존 정본에서 확인할 내용은 직접 확인한다. 사용자가 이미 고른 선택을 다시 승인받지 않는다.
3. scope·동작·모델·API·권한·오류·외부 의존성·예외의 실제 분기를 의존 순서로 확인한다. 해당 작업에 적용되지 않는 주제를 형식상 질문하지 않는다.
4. 명시적 사용자 선택, 확인된 코드 사실, 미확정 가정을 구분한다. 답하지 않은 추천안을 사용자 확정으로 기록하지 않는다.
5. 실제 정본 변경은 승인 근거와 범위를 확인한다. 일반 구현 옵션 선택을 기반 설계 변경 승인으로 확대하지 않는다.
6. 이미 원하는 동작이 명확한 버그의 원인 조사는 코드로 수행한다. 실제 재현 정보나 중요한 동작 선택이 부족할 때만 해당 내용을 묻는다.

## Evidence

- 결정을 기존 scope·정본·코드 제약과 연결하고 이유를 기록한다.
- 새 결정이 기존 분석을 대체하면 해당 근거를 보존·추가하며 원 기록을 지워 역사적 판단을 바꾸지 않는다.
- scope 밖 발견은 사실·영향·권고만 보고한다. 임의의 결정 포함·후속 Task 생성·제품 구현을 수행하지 않는다.
- [공통 규약](../memory-execute/references/conventions.md)의 로컬 저장·범위·이력 원칙을 따른다.

## Termination

중요한 분기가 모두 해소되면 종료한다. 추가 질문이 없으면 명확한 요청·확인 근거를 요약하며 형식적인 질문을 만들지 않는다.

의미 있는 확정 결정이 있으면 .memory/decisions/YYYY-MM-DD-feature.md로 저장한다. 기존 연결 결정 문서는 관련 선택·이유·날짜를 추가하며 과거 근거를 보존한다.

~~~markdown
# Decisions: {기능명}

- Date: YYYY-MM-DD
- Status: Confirmed
- Source: {사용자 지시·연결한 Plan·조사 근거}

## D01. {결정 주제}
- Chosen: {확정 선택}
- Rationale: {선택 이유와 관련 제약}
- Confirmation: 사용자 선택 / 사용자 명시 요청 / 코드 확인 사실
~~~

미해결 중요한 결정이 있으면 Confirmed로 저장하지 않는다. 제품 구현·staging·commit·active pointer 전환은 하지 않는다. 다음 단계는 [memory-plan](../memory-plan/SKILL.md)의 계획 작성 또는 기존 등록 맥락의 [memory-intake](../memory-intake/SKILL.md)로 안내한다.

## Learning Notes

핵심 결정과 선택 이유, 기존 코드·정본의 제약, 범위 밖 발견을 간결히 설명한다. 사용자 선택과 코드에서 확인한 사실을 구분하며 전문 용어는 필요한 곳에서 한 번 풀어 쓴다. 발견이 없으면 특이사항 없음으로 적는다.

실제 결정 저장·추가 결과를 .memory/history/YYYY-MM-DD.md에 간단히 기록한다. 기존 active 작업·재개 상태는 보존한다.
