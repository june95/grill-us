---
name: memory-execute
description: Execute or resume a .memory task using its selected workflow stages, or run only a requested review, test, or commit check. Use for memory-execute and current 보고 이어서 requests.
---

# Memory Execute

Task 폴더의 task.md를 계약으로 선택한 단계만 실행한다. 기본 단위는 Task 하나다. 시작 시 [공통 규약](references/conventions.md)과 [재개 규약](references/resume.md)을 확인하며 전역 task-*를 호출하지 않는다. 상세 규칙의 소유자와 최소 읽기는 [Rule Ownership](references/conventions.md#rule-ownership)을 따른다.

## Inputs

~~~text
/memory-execute
/memory-execute --stage review
/memory-execute --stage test --task .memory/phases/<plan>/<phase>/<task>/task.md
/memory-execute --stage commit-check
현재 보고 이어서 해줘
T01부터 T03까지 순서대로 진행해줘
현재 Task 구현과 검증만 하고 커밋은 하지 마
~~~

별도 CLI가 아닌 에이전트 요청이다. --stage 또는 분석만/구현만/리뷰만/리뷰 지적 처리만/테스트만/가이드 갱신만/리팩토링만/커밋 점검만/커밋만은 해당 stage-mode다. 명시 단계가 우선이며 독립 분석/테스트 Task 전체 실행 요청은 task-mode다. 실제 의도가 모호할 때만 질문한다. 가이드의 설계 선반영/구현 후 동기화 모드도 Task와 요청으로 확인한다.

## Resolve Task

1. 명시 Task 경로가 우선, 없으면 current의 실제 Active Task를 읽는다. 누락/가짜 링크/활성 Task 없음이면 임의로 Task를 만들지 않고 등록·계획 요청을 안내한다.
2. Task·Revision·Dependencies·승인·기존 working/index·checkpoint/intent를 확인한다. 프로젝트가 불명확할 때만 [Discovery](references/project-profile.md#discovery)를 추가로 읽는다.
3. 이미 done이면 실제 성공 근거를 확인하고 반복 구현/커밋하지 않는다. 명시 사후 단계는 검토할 버전을 확인하며 새 scope는 별도 등록으로 연결한다.
4. 우선 처리 전환은 [Switch](references/resume.md#switch), 비활성 Task의 단독 단계는 [Stage Isolation](references/conventions.md#stage-isolation)을 따른다. 과거 완료와 활성 위치를 보존한다.

## Stage Selection

| Stage | 실행할 때 읽을 지침 | 가까이 유지할 경계 |
| :--- | :--- | :--- |
| reference | [analysis.md](references/analysis.md) | 근거 조사, 제품/공유 정본 수정 없음 |
| design-guide-update | [guides.md](references/guides.md#design-mode) | 승인된 계약을 의존 구현 전에 |
| implementation | [implementation.md](references/implementation.md) | Task scope 구현·최소 검증 |
| review | [memory-review](../memory-review/SKILL.md), [Compliance](references/review.md#compliance), [Review Delegation](references/review.md#review-delegation) | 같은 기준으로 읽기 전용 위임, 실행 담당이 기존 review.md/Task 상태 기록 |
| review-action | [review.md](references/review.md#triage) | 실제 finding만 분류·처리 |
| test | [testing.md](references/testing.md) | 필요한 검증, 단독 요청의 제품 자동 수정 없음 |
| guide-update | [guides.md](references/guides.md#implementation-mode) | 검증된 공유 안내 영향만 |
| refactor | [review.md](references/review.md#refactor) | 현재 변경의 동작 보존 |
| commit-check / commit | [commit-check.md](references/commit-check.md) | 최종 품질·명시 후보·실제 결과 확인 |

적용/상태는 [Workflow](references/conventions.md#workflow), 증거 최신성은 [Evidence and Completion](references/conventions.md#evidence-and-completion)을 따른다. 필수 실패·blocked·stale를 skipped로 덮지 않고, 실행하지 않은 빈 보고서는 만들지 않는다. 유효한 같은 결과는 재사용하되 관련 환경 영향도 확인한다.

## Task Mode

1. 새 단계/staging/commit 전에 intent의 실제 결과부터 확인한다. 이미 성공한 같은 commit이면 [Recovery](references/resume.md#recovery)로 tree를 확인하고 누락 finalize만 복구한다.
2. 아직 필요한 첫 적용 단계의 선행 근거와 승인을 확인하고 running으로 기록한다. 해당 지침만 읽어 수행하며 실제 결과·현재 Revision/snapshot/관련 환경 근거를 남긴다.
   적용 review와 재리뷰는 기본 위임하며 사용자 자체 리뷰 지시가 우선이다. 실행 담당만 결과·상태를 기록하고 위임 불가 시 사유 알림 후 자체 리뷰로 계속한다. 실제 finding/Needs Changes는 대체 사유가 아니다([Review Delegation](references/review.md#review-delegation)).
   리뷰어에게 memory-review와 공통 기준·명시 대상/Revision·diff/snapshot을 제공한다. 반환한 범위·버전을 대조해 기존 review 단계에 반영하며 리뷰를 중복 추가하지 않는다. 직접 memory-review 호출의 무쓰기 결과 반환과 이 단계의 기록 책임을 구분한다.
3. 승인 범위 결함은 수정 단계로 돌아가 해결하고 영향받은 증거를 갱신한다. 조사 전용의 대상 실패는 [Investigation Outcomes](references/conventions.md#investigation-outcomes)로 보존하며 자동 수정/후속 등록하지 않는다.
4. 범위 안 조정은 기록하고, 중요한 새 동작/계약 선택은 [Change Boundaries](references/conventions.md#change-boundaries)를 따른다. 환경·설계 blocker는 원인·재개 행동을 남기고 멈춘다.
5. [Quality Gate](references/commit-check.md#quality-gate)로 AC·근거·최종 품질을 판정한다. ready는 done이 아니다. Task 범위 변경과 사용자 정책에 따라 [Staging](references/commit-check.md#staging), [Commit Intent](references/commit-check.md#commit-intent) 또는 [No Commit](references/commit-check.md#no-commit)을 처리한다.
6. 성공 commit/명시 none/Task 변경 없음 정책을 실제로 확인한 뒤 Task done → Phase/Plan 집계 → current를 갱신한다. 실패하면 현재 Task에 머무른다.
7. 한 Task에서 끝내며 연속 요청만 그 범위로 진행한다. 다음 Task는 실제 시작 전 pending, 마지막 Task 후 Active Task/Stage는 없음이다. 다른 pending Plan을 임의로 시작하지 않는다.

## Stage Mode

[Stage Isolation](references/conventions.md#stage-isolation)의 해당 행만 적용한다. 선행 근거가 부족하면 다음 행동을 남기며 다른 단계로 자동 확대하지 않는다. review는 보고만, test는 필요한 테스트 작성/실행을 할 수 있으나 제품 결함은 보고한다. commit-check는 읽기/판정만이고 commit은 유효한 선행 증거로 실제 커밋만 수행한다.

단독 test의 새 테스트는 영향 review stale·대상·다음 행동만 남긴다. 별도 재리뷰나 검토하지 않은 snapshot의 passed 갱신을 하지 않는다. 단독 단계는 Task done·포인터 전진하지 않으며 비활성 대상의 기존 active Position을 보존한다.

## Commit and Resume

사용자 지시의 지속·우선순위와 커밋 없는 완료 의미는 [Evidence and Completion](references/conventions.md#evidence-and-completion)을 따른다. Task 후보와 사용자 index를 분리하고 기본 로컬 .memory는 stage하지 않는다. 실제 ignore/staged entry/메시지 확인은 commit-check, 중단·성공 뒤 복구와 원자적 기록은 resume의 절차를 사용한다. prepared/failed를 덮어쓰거나 성공을 현재 diff 없음으로 지우지 않는다.

## Report

[Reporting](references/conventions.md#reporting)과 [Stage Report](references/templates.md#stage-report)로 실제 수행만 기록한다. 채팅에는 완료 범위·검증/한계·commit 결과·다음 행동과 범위 밖 발견을 간결히 설명한다.
