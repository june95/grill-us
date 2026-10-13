---
name: memory-intake
description: Register a clear change, bug, or issue as a .memory task without implementation. Use for task intake and 이슈 등록; route material unresolved design choices to grill-me.
---

# Memory Intake

명확한 요청을 근거와 함께 기존/새 Plan에 등록한다. 등록은 실행 가능한 청사진까지이며 제품/테스트 코드·공유 정본·staging·commit은 변경하지 않는다. [공통 규약](../memory-execute/references/conventions.md)을 읽고 전역 task-*는 호출하지 않는다.

## Input

수정·버그·이슈, Plan/Task 경로와 선택적 우선 처리 지시를 받는다. Type/tracker/초기 상태를 확인 가능하면 다시 묻지 않는다. 외부 이슈·메시지 전송은 이 단계 범위가 아니다.

## Inspect

1. [Discovery](../memory-execute/references/project-profile.md#discovery)로 실제 대상·정본·suite/명령을 찾고 current·관련 Plan/Task·코드를 읽는다.
2. [analysis](../memory-execute/references/analysis.md#problem)로 Source·기대 동작·scope·AC·검증 경로를 확인한다. 원하는 동작이 명확한 버그는 코드 조사부터 하며 원인을 사용자에게 추측하게 하지 않는다.
3. 버그의 [Bug Investigation](../memory-execute/references/conventions.md#bug-investigation)을 실제 관찰 수준으로 작성한다. 재현과 원인 확신을 독립 판단하고 로그 출처·환경·한계를 보존한다.
4. 등록 중 제품/테스트/설정/index를 바꾸는 재현 명령은 실행하지 않는다. 부족한 재현 정보나 중요한 실제 결정만 질문한다.

## Clarity Gate

[Registration and Planning](../memory-execute/references/conventions.md#registration-and-planning)의 명확함 기준을 적용한다. 중요한 미결정은 [grill-me](../grill-me/SKILL.md)로 해소한 뒤 청사진을 확정한다. 추천안·미확정 원인·실행하지 않은 결과를 확정으로 기록하지 않는다.

원인 미확정/재현 불가만으로 명확한 버그 등록을 막지 않는다. 첫 실행의 확인 조건·수정 범위·중요 계약 변경 경계를 계획하고 필요한 실제 동작 선택이 부족할 때만 인터뷰한다.

## Placement

공통 등록 규칙에 따라 관련 목표는 기존 Phase의 새 T, 독립 목표는 새 Plan으로 둔다. 동일 pending은 재사용하고 완료 뒤 새 수정은 과거 증거를 보존해 새 T로 기록한다. 실제 배치가 완료/순서를 바꾸고 모호할 때만 필요한 선택 하나를 묻는다.

## Registration

1. [memory-plan](../memory-plan/SKILL.md#task-contract)의 계약으로 Plan/Phase/folder/task.md를 작성한다. 기존 Phase 최대 T 다음 번호와 [Paths](../memory-execute/references/conventions.md#paths)의 실제 ID/링크를 사용한다.
2. 조사 근거가 충분하면 Task와 결정 링크로 재사용하며 reference.md는 상세 기록이 필요한 경우만 만든다. 독립 분석/테스트도 사전 조사 목표·산출물을 명시한 Task로 등록 가능하다.
3. 버그 Task는 조사 근거와 수정 전/후 검증 조건을 계획하고, nonbug/과거 done에는 빈 버그 표를 소급 추가하지 않는다. 명령·조건부 단계·커밋 정책을 stub 없이 작성하되 실제 코드는 실행 단계에 둔다.

## Activation

[State Ownership](../memory-execute/references/conventions.md#state-ownership)과 [Switch](../memory-execute/references/resume.md#switch)를 적용한다. 기존 active·checkpoint·미해결 intent를 보호하고 활성 없음이면 선행 조건을 충족한 첫 Task만 연결한다.

실제 진행 링크가 손상된 경우 먼저 복원하며, 확인 불충분한 손상을 초기 placeholder로 간주해 새 active로 덮지 않는다.

쓰기 직전 current가 바뀌었는지 다시 확인한다. 전환 전 이전 재개/마지막 완료 근거를 보존하며 가짜 링크나 새로운 archive 사본을 만들지 않는다.

## Report

[Reporting](../memory-execute/references/conventions.md#reporting)으로 배치·분할·workflow·근거·활성화 여부·다음 행동을 설명한다. 버그는 실제 재현/원인 수준·한계·첫 검증을 짧게 보고하고 [memory-execute](../memory-execute/SKILL.md)를 안내한다.

[History](../memory-execute/references/conventions.md#history)에 등록 결과를 기록한다. planner가 같은 생성 결과를 기록했다면 별도 배치/활성화 판단이 있을 때만 추가하고 범위 밖 작업을 자동 등록하지 않는다.
