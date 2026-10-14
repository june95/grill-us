---
name: memory-plan
description: Create or extend a .memory Plan with Phase and independently executable task-folder blueprints from confirmed decisions or a clear request. Use for memory planning without implementation.
---

# Memory Plan

확정 결정이나 명확한 요청을 Plan → Phase → Task 청사진으로 작성한다. [공통 규약](../memory-execute/references/conventions.md), [템플릿](../memory-execute/references/templates.md)을 먼저 확인하며 공유 정본/제품/테스트 코드·staging·commit은 변경하지 않는다.

## Inputs

- decision 또는 조사한 Source·scope·AC를 받고 필요한 실제 파일/정본/명령을 [Discovery](../memory-execute/references/project-profile.md#discovery)로 확인한다.
- 중요한 미결정만 [grill-me](../grill-me/SKILL.md)에 연결한다. 명확한 요청에 decisions 파일을 형식상 강제하거나 확정 선택을 다시 묻지 않는다.
- 기존 근거를 재사용하되 확인되지 않은 가정·승인·성공을 채우지 않는다.

## Golden Rule

계획 결과는 .memory에만 작성한다. 제품 구현·새 테스트·공유 정본 수정·staging·commit은 실행 단계의 일이다.

## Granularity

[Registration and Planning](../memory-execute/references/conventions.md#registration-and-planning)에 따라 기본 P01 하나와 독립 완료 가능한 Task로 나눈다. 관련 목표는 기존 Phase에 추가, 독립 목표는 새 Plan이며 동일 미완료 요청은 재사용한다. 과거 done 기록은 보존하고 새 수정은 새 T다.

## Task Contract

상세 정본은 folder/task.md 하나다. 다음 실행자가 추측하지 않도록 적용 정보만 구체화한다. 형식은 templates의 Task, 상태/ID는 [Task Fields](../memory-execute/references/conventions.md#task-fields)를 따른다.

| Section | 필요한 상세 |
| :--- | :--- |
| Metadata / Status | Plan/Phase/Task ID, Source·Type, Revision·정책, 초기 pending |
| Goal / Scope | 단일 관찰 결과·이유·포함/제외 |
| Constraints | 작업별 Must / Must Not: 책임·재사용·필요한 금지 사항; 적용 없음이면 짧은 이유 |
| Decision Summary / Alignment | 확정 선택·코드 사실, 실제 정본·승인/보존 경계 |
| Bug Investigation | 버그 Task만 기존 [조사 근거](../memory-execute/references/conventions.md#bug-investigation) 재사용 |
| Dependencies | 선행 ID·실제 링크·필요 결과 |
| Implementation | path::symbol/문서 heading, 목적·new/modify/read-only, 독립 I01/I02 |
| Signatures / Data / Flow | 공유 경계의 정확 타입·필드·기본값·nullable·관계·중요 흐름·오류·반환; 계약에 필수인 내부 선택만 고정 |
| Acceptance Criteria | 사전에 정한 관찰 가능한 완료 기준 |
| Workflow | 단계 적용 이유/조건과 초기 상태 |
| Validation | 실제 command/수동 방법, cwd·기대 결과·criterion, 관련 환경 확인 범위 |
| Commit Message | 커밋 대상이면 실제 메시지/trailer, 없으면 해당 없음과 이유 |
| Completion Check / Progress | 초기 pending 판정·commit 상태·첫 미수행 단계·blocker·다음 행동 |
| Change Log | 의미 있는 계약 변경·이유·날짜 |

조사/테스트 실행 자체도 Implementation 절차로 쓸 수 있다. 관측 실패와 조사 목적은 [Investigation Outcomes](../memory-execute/references/conventions.md#investigation-outcomes)로 구분하며, 원인 미확정 버그는 첫 실행 단위의 원인 확인·검증 조건·수정 범위와 중요 계약 변경 경계를 적는다.

[Planning Boundaries](../memory-execute/references/conventions.md#planning-boundaries)에 따라 공유 계약·AC·검증은 고정하고 private helper 이름·분할·동등한 알고리즘은 실행 재량으로 둔다. 새 파일/추상화에는 기존 소유 위치에 둘 수 없는 구체적인 이유를 적는다.

## Workflow Selection

AI가 [Workflow](../memory-execute/references/conventions.md#workflow)의 필수/필요 시/해당 없음과 이유를 선택한다. 승인된 공유 계약 변경은 design-guide-update를 의존 구현 전에 배치한다. 위험·AC에 맞는 review/test와 실제 영향의 guide/refactor만 적용하며 단순 문구 변경은 필요한 대체 근거로 검증할 수 있다.

생략으로 AC를 입증할 수 없으면 필요한 검증을 유지한다. 아직 실행할 버전/hash/결과를 미리 채우지 않고 [Environment Evidence](../memory-execute/references/conventions.md#environment-evidence)의 관련 확인 범위만 계획한다. 공유 변경에는 commit-check가 필요하며, 커밋 유무와 무관하게 전체 완료의 공통 품질·정책 판정을 남긴다.

적용 review는 [Review Delegation](../memory-execute/references/review.md#review-delegation)의 기본 읽기 전용 위임과 불가 알림 후 자체 리뷰를 계획한다. 사용자 자체 리뷰 지시가 우선이며 이 규칙만으로 skipped review를 필수로 바꾸지 않는다. 실행 담당 한 명만 상태·보고를 쓰며 실제 시도·판정은 실행 전에 성공으로 채우지 않는다.

## Artifacts

1. [Paths](../memory-execute/references/conventions.md#paths)에 맞춰 Plan(목표·scope·순서) → Phase(Tasks·실제 집계) → Task(상세 계약)를 작성한다. 독립 Decision ID의 기존 문서를 링크하며 같은 Plan/Task 계약을 별도 plan-N에 복제하지 않는다.
2. 초기 Task는 pending/Revision 1이며 첫 적용 단계로 재개 위치를 지정한다. reference를 새 결론이 대체하면 원 근거를 보존하며 의미 변경의 Revision/증거 영향은 공통 규약을 적용한다.
3. 아래 Pointer로 current/checkpoint를 필요할 때만 갱신한다.

## Pointer

[State Ownership](../memory-execute/references/conventions.md#state-ownership)과 [Switch](../memory-execute/references/resume.md#switch)를 따른다. 등록만으로 기존 active를 바꾸지 않으며 active 없음일 때 실행 가능한 첫 Task를 연결한다. 실제 진행 링크 손상은 먼저 복원하고 미확인 손상·미해결 intent는 새 active로 덮지 않는다. 전환 전 기존 위치/마지막 완료를 보존한다.

쓰기 직전 최신 current를 다시 확인하고 새 Task는 시작 전 pending으로 둔다. current의 실제 Checkpoint·Last Completed Task/없음 표현을 유지하며 상태 쓰기는 [Completion](../memory-execute/references/resume.md#completion)의 원자적 기록 방식으로 수행한다.

## Report

[Reporting](../memory-execute/references/conventions.md#reporting)과 [History](../memory-execute/references/conventions.md#history)를 따른다. Plan/Phase/Task·적용 파일·분할/의존 이유·회귀 경계·활성 위치를 설명하고 다음은 [memory-execute](../memory-execute/SKILL.md)로 안내한다. 실제 구현·테스트·커밋은 계획 성공으로 대신하지 않는다.
