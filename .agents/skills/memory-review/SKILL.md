---
name: memory-review
description: Review an explicit Task, Phase, file list, diff, or commit range and return evidence-based findings without writing files or state. Support code review without a plan; do not create tasks, run tests, fix code, or delegate. Use memory-execute for workflow review reports and state updates.
---

# Memory Review

요청 범위를 읽기 전용으로 검토하고 결과만 반환한다. [Review Roles](../memory-execute/references/review.md#review-roles), [Compliance](../memory-execute/references/review.md#compliance), [Severity](../memory-execute/references/review.md#severity), [Review Result](../memory-execute/references/review.md#review-result)를 공통 기준으로 사용한다. 별도 verdict/severity나 실행 workflow를 정의하지 않는다.

## Inputs

실제 repository/worktree와 Task/Phase 또는 명시 파일 목록·diff·commit/base-head를 받는다. 대화에서 대상이 명확하면 재질문하지 않는다. 어느 저장소/버전/변경 범위인지 실제로 모호할 때만 후보와 질문 하나로 확인한다. 일반 코드 리뷰에 Task·Plan·current를 요구하거나 만들지 않는다.

## Resolve Scope

1. [작업공간 경계](../memory-execute/references/project-profile.md#skill-installation-and-workspace)에 따라 실제 대상 root를 확인하고 알려진 경로를 재사용한다. plugin/cache를 제품 작업공간으로 추정하지 않는다.
2. Task는 명시 task.md의 Goal/Scope/AC/Dependencies·Revision 및 관련 정본·구현 근거를 읽는다. Phase는 해당 표의 실제 Task 링크와 요청 범위를 읽고 Task별 검토 대상/근거/미검토를 구분한다. 비활성·완료 대상도 current로 전환하지 않는다.
3. 일반 코드 요청은 파일 또는 diff의 base/head, staged/working 범위와 요청된 untracked 파일을 구분한다. 전체 변경 수와 Task 귀속은 [Change Inventory](../memory-execute/references/project-profile.md#change-inventory)로 확인한다. staged 검토 범위를 집계에 나타난 모든 untracked 내용 검토로 확대하지 않는다. Git 대상은 실제 commit ID와 변경 경로를 확인하고, Git 없는 파일 요청은 실제 bytes snapshot으로 식별한다. 제공된 patch만 있고 파일/호출부를 읽을 수 없으면 그 제한을 알린다.
4. 계획이 없는 범위에서는 계획 준수를 **해당 없음**으로 둔다. 코드·명시 요구·프로젝트 정본에 근거해 검토하며 가상의 AC나 승인을 만들어 적용하지 않는다. 필요한 호출부·타입·기존 테스트는 읽을 수 있지만 무관한 전체 저장소로 범위를 확장하지 않는다.

## Inspect and Return

1. 검토 전 실제 대상의 Revision/commit/diff 범위와 파일별 SHA256(없음/삭제 포함)을 확인한다. commit 리뷰는 해당 commit의 파일 내용, working 리뷰는 실제 working bytes를 검토하며 서로 대신하지 않는다.
2. 공통 Compliance로 정확성·회귀·예외·책임/재사용·불필요한 복잡성·기존 검증 충분성을 확인한다. 계획이 요구한 과설계와 구현의 계약 위반을 구분하고 helper 이름이나 개인 취향만으로 finding을 만들지 않는다. 기존 테스트 결과/보고는 출처·시점·대상 snapshot을 읽어 확인하며 직접 실행하지 않는다.
3. Review Result에 따라 verdict, 실제 범위·검토 버전·파일 snapshot·계획 준수 적용 여부, finding과 관측한 검증·미수행/coverage 한계를 반환한다. finding에는 유일 ID·severity·파일 위치/근거·발생 조건/영향·최소 수정 방향·권장 검증을 포함한다. 없으면 없다고 명시하되 충분히 보지 못한 범위를 통과로 표현하지 않는다.
4. 반환 전에 관련 버전/working bytes를 다시 비교한다. drift가 있으면 검토했던 버전의 부분 결과·finding을 보존하고 바뀐 범위는 미검토로 남긴다. 현재 대상 판정이 불가능하면 공통 Blocked 의미를 적용하며 검토 없이 새 snapshot으로 통과를 갱신하지 않는다.

## Boundaries and Workflow Use

직접 호출과 위임 worker 모두 제품·`.memory`·보고/history/current/checkpoint·Git·개인 설정을 쓰지 않는다. 테스트/빌드/설치·코드 수정·staging/commit/push·복구·새 Task 등록·자동 활성화·후속 실행·추가 리뷰어 위임을 하지 않는다. 기존 자료가 없거나 결함을 발견해도 이 경계를 유지하고 필요한 조치만 반환한다. 읽기 도구의 실제 권한 제한 수준을 밝히며 지시문만으로 OS 쓰기 차단이나 모든 부작용 방지를 주장하지 않는다.

`memory-execute`가 위임하면 전달된 scope·Task Revision·diff/snapshot을 기준으로 같은 검토를 한 번 수행해 실행 담당에게 반환한다. 실행 담당만 공통 [Review Delegation](../memory-execute/references/review.md#review-delegation)에 따라 결과를 대조해 기존 review.md/Task metadata를 기록한다. worker가 다시 위임하거나 기록하지 않는다. `memory-execute --stage review`는 별도 실행 요청이며 기존 보고·상태 기록은 허용하지만 자동 수정·커밋·완료·포인터 전진은 하지 않는다.

## Examples

~~~text
memory-review 이 Task의 현재 구현을 검토해줘: {task.md 경로}
memory-review 이 Phase의 T01~T03을 검토해줘: {phase.md 경로}
memory-review 현재 저장소의 staged diff만 검토해줘
memory-review {base commit}부터 {head commit}까지 변경을 검토해줘
memory-review 이 파일과 필요한 호출부를 검토해줘: {파일 목록}
~~~

[시나리오](references/scenarios.md)는 관련 경계 확인에만 사용한다. 일반 코드에도 쓸 수 있는 무쓰기 진입점의 절차를 이 파일에 두며, 공통 검토 기준은 review.md를 재사용한다.
