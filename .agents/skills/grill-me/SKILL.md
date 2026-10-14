---
name: grill-me
description: Resolve material requirements and design choices one question at a time, then preserve confirmed decisions in .memory. Use for explicit design interviews or unresolved choices from intake or planning.
---

# Grill Me

설계 인터뷰나 intake/planner의 중요한 미결정만 해소한다. 명확한 수정에 인터뷰를 강제하거나 이미 확정된 선택을 다시 묻지 않는다. [공통 규약](../memory-execute/references/conventions.md)을 확인한다.

## Inputs

요청·기존 Plan/결정·조사 근거를 읽고 필요한 실제 코드는 [Discovery](../memory-execute/references/project-profile.md#discovery)로 확인한다. 관련 자료만 읽으며 불필요하게 전체 저장소를 다시 조사하지 않는다.

## Interview Guidelines

[Change Boundaries](../memory-execute/references/conventions.md#change-boundaries)의 선택/근거 구분을 적용한다. 한 질문씩 2~3개 구체적 선택지와 Recommended 추천안·이유를 제시하고 답하지 않은 추천안은 확정하지 않는다.

실제 scope·동작·권한·API·데이터·오류·외부 의존성 분기를 의존 순서대로 묻는다. 코드 사실은 직접 확인하고 적용되지 않는 주제를 형식상 질문하지 않는다. 원하는 동작이 명확한 버그는 원인 조사부터 하며 사용자에게 원인을 추측하게 하지 않는다.

## Evidence

선택을 기존 정본·코드 제약과 연결하고 사용자 확정·코드 확인·미확정 가정을 구분한다. 새 근거가 과거 분석을 대체하면 원 근거를 보존한다. 범위 밖 발견은 영향·권고만 보고하며 제품 수정·후속 Task 등록을 하지 않는다.

## Termination

중요한 분기가 해소되면 종료하며 불필요한 질문을 만들지 않는다. 확정 결정은 [Paths](../memory-execute/references/conventions.md#paths)의 독립 Decision ID 문서에 저장하고 기존 연결 문서에는 선택·이유·날짜를 추가한다. 과거 파일/링크는 유지한다.

[Decision Fields](../memory-execute/references/conventions.md#decision-fields)에 따라 새 결정에는 적용 기능·모듈·상황을 `Applies to`로 반드시 적는다. 아래 예시는 재검토 조건이 없는 경우다. 실제 조건이 있을 때만 `Revisit When`을 추가하고 빈 항목이나 가상의 조건을 만들지 않는다. 기존 결정의 명시 수정은 그 범위에 한정하며 과거 기록을 일괄 변환하지 않는다.

~~~markdown
# Decisions: {기능명}

- Date: YYYY-MM-DD
- Decision ID: YYYY-MM-DD-topic
- Status: Confirmed
- Source: {사용자 지시·연결 Plan·조사 근거}

## D01. {결정 주제}
- Chosen: {확정 선택}
- Rationale: {이유와 관련 제약}
- Confirmation: 사용자 선택 / 사용자 명시 요청 / 코드 확인 사실
- Applies to: {이 결정이 적용되는 기능·모듈·상황과 필요한 조건}
~~~

미해결 중요한 결정은 Confirmed로 저장하지 않는다. 제품/공유 정본·staging·commit·active 전환은 하지 않으며 다음은 [memory-plan](../memory-plan/SKILL.md) 또는 기존 등록 맥락의 [memory-intake](../memory-intake/SKILL.md)로 안내한다.

## Learning Notes

[Reporting](../memory-execute/references/conventions.md#reporting)으로 핵심 선택·이유·근거·한계·범위 밖 발견을 설명한다. 실제 결정 저장/추가만 [History](../memory-execute/references/conventions.md#history)에 기록하고 기존 active 위치를 보존한다.
