---
name: memory-plan
description: Create or extend a .memory Plan with Phase and independently executable task-folder blueprints from confirmed decisions or a clear request. Use for memory planning without implementation.
---

# Memory Plan

확정 결정 또는 확인된 명확한 요청을 Plan → Phase → Task로 나누어 실행 청사진을 작성한다. [공통 규약](../memory-execute/references/conventions.md)과 [템플릿](../memory-execute/references/templates.md)을 정본으로 사용한다.

## Inputs

- 확정 decision 문서, intake가 확인한 요청·코드 근거, 기존 Plan에 추가할 scope를 받는다.
- 명확한 요청에 형식상 decisions 파일을 요구하지 않는다. 실제 중요한 미결정은 [grill-me](../grill-me/SKILL.md)에 연결하고 해소 후 계획을 확정한다.
- [프로젝트 구조](../memory-execute/references/project-profile.md)와 기존 작업·정본·필요한 코드 근거를 읽는다. 조사에서 확인되는 정보를 재질문하지 않는다.
- 사용자 선택·코드 확인 사실·미확정 가정을 구분하고 기존 결정·reference를 재사용한다. 새로운 기반 설계 변경에는 실제 승인과 영향 정본을 기록한다.

## Golden Rule

생성·갱신 대상은 .memory의 계획·결정·상태·필요한 조사 문서다. 제품 구현, 테스트 코드 작성, 공유 정본 변경, staging·commit을 이 단계에서 수행하지 않는다.

## Granularity

- 일반 작업은 P01 하나가 기본이다. 다른 도메인/레이어의 실질 마일스톤 또는 외부 연동 경계가 있을 때만 여러 Phase로 나눈다.
- 기존 큰 작업을 plan-N으로 나누던 단위는 동일 Plan의 T01/T02로 대응한다. 별도 Task plan.md/plan-N.md를 만들지 않는다.
- 각 T에는 단일 관찰 결과, 독립 완료·검증 기준, 명시한 Dependencies와 커밋 범위를 둔다. 일부러 깨진 빌드를 후속 T로 넘기지 않는다.
- 단독 완료가 안 되는 미세 작업은 한 T의 I01/I02로 묶는다. 파일 수나 문서 길이만으로 Phase를 늘리지 않는다.
- 관련 요청은 기존 목표·scope에 맞는 Phase에 append, 독립 목표는 새 Plan이다. 기존 ID·진행·done 이력은 재번호·재작성하지 않는다. 동일 미완료 요청이나 결과가 여전히 충족된 done 요청은 기존 기록을 재사용하고, 완료 뒤 재발·추가 수정은 새 T로 추적한다.

## Task Contract

상세 정본은 .memory/phases/{plan-id}/{phase}/{T-folder}/task.md다. 요청·완료 조건·구현 계약을 한곳에 둔다. Task 하나로 목표·범위를 이해할 수 있어야 하지만 실행 시 필요한 실제 파일·지침·증거를 읽는 것은 허용한다.

| Section | Required Detail |
| :--- | :--- |
| Metadata / Status | Plan·Phase·Task ID, Source·Type, Revision, Commit Policy, 초기 pending |
| Goal / Scope | 관찰 결과·이유·포함/제외 범위 |
| Decision Summary / Guide Alignment | 확정 선택·코드 근거, Compliant/Approved Design Change/Blocked, 실제 승인·정본 |
| Bug Investigation (버그 수정 Task만) | [공통 계약](../memory-execute/references/conventions.md#bug-investigation)의 최소 재현 근거·실제/기대 결과·독립 재현/원인 수준·한계·다음 검증 |
| Dependencies | 선행 T ID/링크와 필요한 결과 |
| Implementation | path::symbol 또는 문서 heading, 목적, new/modify/read-only, I01/I02 단위; 조사/검증 전용은 절차·산출 근거로 작성 |
| Signatures / Data / Flow | 적용되는 정확한 타입·필드·기본값·nullable·관계·검증·처리·오류·상태·반환 |
| Acceptance Criteria | 관찰 가능한 완료 체크리스트 |
| Workflow | Stage, Applicability, Reason/Trigger, Status, Evidence |
| Validation | 실제 command 또는 수동 방법, cwd, expected result와 대응 criterion; 관련 환경 근거를 실행 시 확인할 범위·이유 |
| Commit Message | 커밋 대상이 있으면 요약과 Plan/Phase/Task trailer; 없으면 해당 없음과 이유 |
| Completion Check / Progress | 초기 pending 판정·commit 상태, 첫 미수행 적용 stage·blocker·next step |
| Change Log | 의미 있는 확정 계약 변경과 이유·날짜 |

문서 작업은 정확한 변경 섹션·의미·참조 계약을 적는다. 적용되지 않는 DTO·API·함수 타입을 억지로 생성하지 않는다. 명령은 실제 프로젝트에서 확인하고 예시 명령을 실행 가능한 것처럼 남기지 않는다.

검증 계획에는 [Environment Evidence](../memory-execute/references/conventions.md#environment-evidence)에 따라 결과에 관련된 runtime/tool·lockfile·manifest·test/build 설정과 비밀 아닌 동작 설정의 확인 범위를 정한다. 모든 항목을 강제하지 않으며 실제 실행 버전·hash·결과는 미리 채우지 않는다. 실행/재사용 시 관련 환경 비교와 영향받은 결과만 재검증할 의무를 적고, 과거 기록 부재의 한계는 완료 조건 영향으로 판단한다.

버그 청사진은 intake/기존 분석의 Bug Investigation을 재사용한다. `reproduced`와 원인 `confirmed`를 자동 연결하지 않고, 실행하지 않은 조사에는 그 수준과 한계를 유지한다. 원인이 미확정이어도 목표·범위·완료 조건·검증 경로가 충분하면 첫 구현 단위에 원인 확인과 검증 경로를 적고 확인 결과에 따른 수정 범위·중요 계약 변경 경계를 명시한다. 등록/계획 중 제품을 수정하거나 회귀 테스트를 새로 작성하지 않으며 nonbug·과거 done 기록에 빈 표를 추가하지 않는다.

## Workflow Selection

분석·기존 테스트 실행도 독립 Task다. Goal/AC에 후보 조사·결과 분류의 완료 기준을 정하고 원인 확정·테스트 통과 목표와 구분한다. 조사 대상 실패와 조사 목적 달성은 [Investigation Outcomes](../memory-execute/references/conventions.md#investigation-outcomes)에 따라 각각 기록하도록 계획한다. Type 문자열만으로 성공·완료 정책을 선택하지 않는다.

planner가 각 stage를 필수/필요 시/해당 없음으로 판단하고 이유·조건을 적는다. 사용자 지시를 우선하며 모든 표 항목을 미평가 placeholder로 남기지 않는다.

- 충분한 기존 조사·결정이 있으면 reference는 해당 없음과 근거 링크로 둔다.
- 승인된 공유 계약 변경은 필요한 design-guide-update를 의존 구현 전에 배치한다.
- 동작·권한·데이터·복잡한 회귀 위험에 맞게 review/test를 필수로 지정하고 프로젝트 검증을 구체화한다.
- 단순 문구 수정은 필요한 diff·문구·링크 확인으로 입증할 수 있다. 별도 review/test 보고서가 불필요하면 생략하되 완료 조건 근거는 남긴다.
- review-action은 actionable finding 조건, guides/refactor는 실제 영향·필요성으로 결정한다. 구현 사실만으로 정본 재작성·코드 정리를 강제하지 않는다.
- 변경 Task의 공통 commit-check는 필수다. commit은 정책·실제 후보에 맞게 정한다. 아직 수행 전인 commit을 점검의 선행 passed 조건으로 만들지 않는다.
- 조사 전용은 reference/test 등 목적에 필요한 단계만 선택하고 불필요한 구현·가이드·리팩터는 이유 있는 skipped로 둔다. 별도 commit-check가 해당 없음이어도 전체 Task 완료 전 Completion Check의 AC·근거·품질·커밋 정책 판정은 필수다.
- auto의 커밋 필요 여부는 Task 범위 Git 변경으로 정한다. 로컬 조사 보고만 남으면 이유와 commit skipped를 기록하고 완료할 수 있다. 테스트 코드/공유 가이드를 작성하면 일반 커밋 정책을 적용한다. none은 사용자 지시와 미커밋 변경을 기록하며, check_only/단독 단계는 자동 done/전진하지 않는다.
- 필수/필요 시는 pending, 해당 없음은 사유 있는 skipped다. 수행된 조사 evidence는 Revision·covered snapshot이 유효하면 재사용한다.
- 완료 기준이 생략으로는 입증되지 않으면 필요한 검증을 유지한다. 미확정 가정으로 정본·blocker를 덮어쓰지 않는다.

## Artifacts

1. Plan: .memory/plans/YYYY-MM-DD-feature.md에 Goal·Source/결정·scope·Phase·순서를 기록한다. 기존 Plan 추가 시 ID·날짜를 유지한다.
2. Phase: .memory/phases/{plan-id}/P01-phase/phase.md에 Tasks(Task,Status,DependsOn,Summary,Blueprint)와 진행률을 둔다.
3. Task: 각 T 폴더의 task.md를 완결된 청사진으로 작성한다. 초기 Status pending, Revision 1, 첫 미수행 적용 단계부터 재개하게 한다.
4. Pointer: 아래 Pointer 규칙에 따라 current/checkpoint를 필요할 때만 갱신한다. 후속 작업을 등록했다고 다른 active 정보를 덮지 않는다.

의미 있는 확정 결정이 reference를 대체하면 관련 부분을 갱신하고 원래 근거·superseded 이력을 보존한다. 청사진 의미 변경은 Revision·Change Log에 반영하며 무관한 가이드 문서를 수정하지 않는다.

## Pointer

- 실제 active Task가 있으면 Plan 추가·새 Plan 생성만으로 current와 기존 checkpoint Position을 변경하지 않는다.
- active가 없으면 첫 실행 가능한 T를 활성화한다. 우선 처리 지시가 있으면 [재개 절차](../memory-execute/references/resume.md)로 이전 위치를 보존한 뒤 전환한다.
- 초기 가짜 링크는 active 없음으로 처리하되, 실제 진행 정보 손상·미해결 commit intent가 확인되면 먼저 복구하며 무작정 덮지 않는다.
- 새 Plan은 대기면 pending, 활성화되면 in_progress다. 완료 Plan에 T를 추가할 때 기존 done T는 보존하고 새 T만 pending; Phase/Plan 요약을 실제 상태로 갱신한다.
- current는 Active Plan/Phase/Task·Stage, Status, Blocker, Next Step, Commit Policy를 담는다. 실재하는 Task 링크를 사용하고 새 active T는 실제 시작 전 pending으로 둔다.
- 쓰기 직전 최신 current를 다시 확인한다. 등록 중 위치가 달라졌으면 새 활성 정보를 보존한다. 상태 파일은 인접 임시 파일에 완성 후 교체한다.

## Report

생성·추가한 Plan/Phase/Task, 파일·심볼, 분할·의존성 이유, 회귀 방지 포인트와 위험, 현재 활성 위치를 설명한다. 다음 실행은 [memory-execute](../memory-execute/SKILL.md)로 안내한다.

완료한 계획 결과는 .memory/history/YYYY-MM-DD.md에 간결히 기록한다. scope 밖 문제는 보고만 하고 임의의 Task를 추가하지 않는다. 실제 테스트·commit은 아직 수행하지 않았음을 구분한다.
