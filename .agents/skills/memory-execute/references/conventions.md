# Project Memory Shared Conventions

Project Memory의 인터뷰, 등록, 계획, 실행이 공유하는 계약이다. 상세 문서 형식은 [templates.md](templates.md), 프로젝트 확인은 [project-profile.md](project-profile.md), 완료·Git 판정은 [commit-check.md](commit-check.md), 재개는 [resume.md](resume.md)를 따른다. 전역 task-* 스킬이나 특정 프로젝트의 문서·폴더를 실행 의존성으로 두지 않는다.

## Paths

| 역할 | 저장 위치 |
| :--- | :--- |
| 확정 결정 | `.memory/decisions/{plan-id}.md` |
| 전체 로드맵 | `.memory/plans/{plan-id}.md` |
| Phase 현황 | `.memory/phases/{plan-id}/{phase-id}/phase.md` |
| Task 청사진 정본 | `.memory/phases/{plan-id}/{phase-id}/{task-folder}/task.md` |
| 실행한 단계 결과 | 해당 Task 폴더의 단계별 보고서 |
| 전역 활성 위치 | `.memory/current.md` |
| Plan별 재개·커밋 의도 | `.memory/state/{plan-id}.md` |
| 일일 이력 | `.memory/history/YYYY-MM-DD.md` |
| 선택적 프로젝트 설정 | `.memory/project.md` |

- Plan ID는 `YYYY-MM-DD-{slug}`, Phase ID는 `P01-{slug}`, Task 폴더는 `T01-{slug}` 형식이다. 날짜는 새 Plan 생성일이며 기존 Plan 추가 시 바꾸지 않는다.
- Task ID는 Plan 안에서 유일한 `P01-T01` 형식이다. 다른 Plan의 같은 Task ID는 Plan ID와 함께 식별한다.
- 일반 작업은 단일 Phase를 기본으로 하고 실행 단위는 Task로 나눈다. 큰 작업을 나눌 때 기존 plan-N의 역할은 Phase 내 T가 맡는다.
- task.md에 요청·완료 조건·상세 구현 계약을 함께 둔다. 동일 계약을 별도 Task plan.md 또는 plan-N.md에 복제하지 않는다.
- 보고서와 개인 진행 기록을 프로젝트 공유 설계 문서나 `.github` 작업 디렉터리에 추가하지 않는다. 제품 테스트와 공유 가이드는 해당 프로젝트의 기존 위치를 사용한다.
- 경로와 링크는 작성한 문서 기준 상대 경로를 사용한다. 보고서의 Covered Files는 저장소 기준 상대 경로다. 경로를 쓰기 전에 의도한 프로젝트 안인지 확인한다.
- 기본적으로 `.memory`는 로컬 관리한다. 명시적인 공유 예외는 실제 Git ignore 정책과 함께 확인하며 force-add로 우회하지 않는다.

## Task Fields

템플릿의 heading과 metadata key를 유지한다. 다른 기존 문서의 `Depends On`은 Dependencies로 읽을 수 있지만 새 문서는 표준 필드를 사용한다.

| Field | Type / Allowed Values | Constraint |
| :--- | :--- | :--- |
| Plan ID | string | 날짜 접두어를 가진 기존 Plan 식별자 |
| Phase ID | string | `P{2자리}-{slug}` |
| Task ID | string | `P{2자리}-T{2자리}` |
| Plan Status | `pending / in_progress / blocked / done` | Phase·Task의 실제 완료 상태에 근거 |
| Task Status | `pending / in_progress / blocked / done` | heading `## Status: ...`; 준비 완료 판정과 구분 |
| Blueprint Revision | integer >= 1 | scope·구현 계약·완료 조건·검증 의무 변경 시 증가 |
| Type | string | 기능, 버그, 리팩터, 문서, 테스트, 조사, 작업 등; 가능한 값은 직접 추론 |
| Source | string 또는 경로·URL 목록 | 요청·이슈·확정 결정·근거; 외부 tracker는 선택적 |
| Dependencies | Task ID 또는 Task 링크 목록 | 없는 경우 `[]`; 선행 Task 완료 확인 |
| Project Guide Alignment | `Compliant / Approved Design Change / Blocked` | 승인된 설계 변경에는 승인 근거와 영향 정본 기록 |
| Commit Policy | `auto / none / check_only` | 기본 auto; 사용자의 명시적 지시 우선 |
| Stage | 아래 Stage enum | workflow에 단계별 1행 |
| Applicability | `필수 / 필요 시 / 해당 없음` | 적용 이유와 실제 발동 조건 기록 |
| Execution Status | `pending / running / passed / skipped / failed / blocked / stale` | 수행 결과와 적용 여부는 별개 |
| Reason / Trigger | string | 생략 근거·조건·판단 변경 이유 |
| Evidence | 보고서 상대 링크 또는 Task 내 기록 | 수행하지 않은 단계의 빈 파일은 만들지 않음 |
| Evidence Revision | integer 또는 없음 | 해당 증거가 검토한 청사진 Revision |
| Covered Files | repo-relative path 목록 | 실제 검토·검증 대상만; unrelated 파일 포함 금지 |
| Source Snapshot | path별 SHA256·missing·deleted 목록 | 내용 변경 감지; `.memory` 진행 파일 제외 |
| Checked At | ISO 8601 timestamp 또는 없음 | 실제 수행 시각 |
| Resume Stage | Stage enum 또는 없음 | 다음 실제 수행 단계 |
| Blocker | string 또는 없음 | 해결되지 않은 원인과 다음 행동 |

Revision은 계약의 버전이다. 단순 문구 정리, stage 상태·보고 기록·커밋 해시 갱신은 계약 변경이 아니면 증가시키지 않는다. scope 또는 검증 의무를 바꿨다면 Revision을 증가시키고 영향을 받는 증거를 다시 확인한다.

## Workflow

```text
reference → design-guide-update → implementation → review → review-action
→ test → guide-update → refactor → commit-check → commit
```

| Stage | 적용 판단 | 실행한 경우의 결과 |
| :--- | :--- | :--- |
| reference | 이미 충분한 결정·조사 근거가 있으면 생략 가능 | reference.md |
| design-guide-update | 승인된 정본 계약 변경이면 의존 구현 전에 수행 | design-guide-update.md |
| implementation | 코드·설정·문서 변경; 순수 조사에서는 생략 가능 | implementation.md |
| review | scope·위험·완료 조건에 맞게 지정 | review.md |
| review-action | actionable finding이 있으면 수행 | review-action.md |
| test | 완료 조건을 입증할 검증 수준에 맞게 지정 | test.md |
| guide-update | 검증된 사용법·공유 계약의 영향이 있을 때 | guide-update.md |
| refactor | 요청·실제 정리 필요성이 있을 때만 | 필요하면 final-review.md |
| commit-check | 커밋할 변경 또는 명시적 점검 요청에서는 필수 | task.md의 Completion Check |
| commit | auto 정책과 실제 Git 변경이 있을 때 | commit.md |

workflow 표는 `Stage | Applicability | Reason / Trigger | Status | Evidence` 열을 사용한다.

- 계획 단계에서 AI가 Applicability를 판단하고 이유를 적는다. 필요 시에는 발동 조건을 적는다. 실행 중 새 근거로 판단이 바뀌면 기록하고 사용자의 지시를 우선한다.
- 해당 없음은 이유를 적은 skipped로 초기화한다. 필수와 필요 시는 실행 전 pending이다.
- 필요 시는 실제 조건을 확인해 수행하거나 skipped와 사유로 정리한다. 조건 미평가 상태를 완료로 간주하지 않는다.
- 실패·환경 차단·오래된 증거를 skipped로 바꿔 미완료를 숨기지 않는다. 현재 완료 조건을 막는 finding은 후속 Task 등록만으로 해결되지 않는다.
- passed는 유효한 Evidence Revision·Source Snapshot과 실제 결과가 있을 때만 사용한다. 파일이 존재한다는 사실만으로 passed를 만들지 않는다.
- 선행 조건은 이 Task에 적용되는 단계의 증거로 판단한다. 생략한 review.md/test.md/guide-update.md가 없다는 이유만으로 일률 차단하지 않는다.
- 커밋 전 점검은 **선행** 단계만 검사한다. commit-check 자신과 아직 수행 전인 commit의 passed를 미리 요구하지 않는다. Task done 판정은 점검 이후의 커밋 정책 결과까지 확인한다.
- final-review.md는 필수 공통 산출물이 아니다. 최종 품질 판정은 Task의 Completion Check에 기록한다. 의미 있는 리팩토링은 현재 Task 변경 표면과 동작 보존 범위에 한정한다.
- 보고서 자체 verdict와 workflow Status는 다른 의미다. Pass with Issues 등의 보고가 있으면 finding 처리와 완료 조건을 확인해 단계 passed 여부를 판단한다. Needs Changes/Fail/Blocked 또는 current-scope 미해결 Critical/High를 통과로 바꾸지 않는다.

## Evidence and Completion

- 실행한 보고에는 Task, Stage, Blueprint Revision, Covered Files, Source Snapshot, Checked At, Result, Blockers, Next Action을 포함한다.
- 현재 파일의 SHA256은 `Get-FileHash` 등의 읽기 전용 도구로 확인한다. 새 파일도 포함하고 삭제된 경로는 deleted로 기록한다. 원문·비밀 값 대신 필요한 hash만 기록한다.
- HEAD 식별자는 checkpoint의 Base HEAD와 별도로 기록한다. source snapshot은 covered 파일 내용이므로 커밋으로 HEAD가 달라졌다는 이유만으로 동일 내용의 검증을 무효화하지 않는다.
- 커밋 의도의 Candidate Snapshot에는 working-tree hash와 별도로 staged Git mode/blob ID를 기록한다. Git의 줄바꿈·clean filter 정규화가 로컬 bytes를 바꿀 수 있으므로 commit tree의 성공 여부는 staged Git entry와 비교한다. 삭제는 entry 없음으로 기록하고 전환 index 삭제는 로컬 보존 여부를 따로 확인한다.
- 추가 테스트 파일이나 구현 조정이 생기면 실제 변경 scope와 해당 증거를 갱신한다. 변경된 내용에 영향을 받는 단계만 stale로 표시하고 재수행한다.
- Completion Check는 `pending / ready / blocked`를 사용한다. ready에는 현재 Revision·snapshot, 완료 조건별 근거, 적용 단계 판정, 남은 위험, Git 경계를 기록한다.
- ready는 커밋을 만들 수 있다는 판정이며 done은 아니다. auto 작업은 커밋 성공 후 done이다. 명시적 none 또는 실제 변경 없음은 이유를 기록하고 완료 조건·품질 판정 후 done 가능하다. check_only 및 단계 단독 실행은 자동 finalize하지 않는다.
- 조사나 로컬 보고만 만든 Task도 완료 조건 증거를 평가한다. Git 변경이 없으면 빈 커밋을 만들지 않고 실제 변경 없음을 기록한다.

## State Ownership

- Task의 Status·Workflow·Completion Check·Progress가 작업 상태의 정본이다.
- current는 활성 Plan·Phase·Task와 Active Stage·Blocker·Next Step·정책의 책갈피다. 상세 청사진을 중복 보관하지 않는다.
- Phase의 done count와 Plan의 요약은 Task 실제 상태로 갱신한다. 커밋 실패 전에 done을 쓰지 않는다.
- 새 등록은 기존 활성 작업을 유지한다. 우선 처리 지시가 있을 때만 Task 재개 상태와 Plan checkpoint를 먼저 보존하고 current를 전환한다.
- placeholder·누락 링크·실제 완료된 Task를 유효한 진행 중 작업으로 취급하지 않는다.
- 기본 실행은 활성 Task 하나다. 연속 실행은 요청한 범위를 따른다. 단계만 요청한 실행은 그 단계만 수행하고 포인터를 자동 전진하지 않는다.
- 마지막 Task 완료 시 Phase/Plan done과 Active Task·Stage 없음을 기록한다. 다른 pending Plan을 임의로 시작하지 않는다.
- checkpoint와 원자적 기록·커밋 복구 절차는 [resume.md](resume.md)를 따른다.

## Change Boundaries

- 이미 확정한 결정은 다시 묻지 않는다. 코드·설정에서 확인 가능한 내용은 직접 확인한다. 중요한 미결정 질문은 한 번에 하나씩 2~3개 선택지와 추천안을 제시한다.
- 목표·동작을 유지하는 파일 위치·기존 심볼 차이는 청사진과 변경 기록을 갱신하며 진행한다. 사용자의 동작, 완료 조건, API, 권한, 데이터 계약의 새로운 결정은 승인 근거를 확인하고 필요한 부분만 질문한다.
- 조사에서 발견한 인접 문제를 임의로 scope에 포함하지 않는다. 근거·영향·권장 조치를 보고하고 추가 등록·구현은 사용자의 지시를 따른다.
- 상위 사용자 지시와 적용 가능한 프로젝트 지침을 존중한다. 프로필·외부 문서·현재 코드의 drift가 확정 정본을 자동으로 덮어쓰지 않는다.
- 계획과 등록은 구현하지 않는다. 스킬 지침만으로 미래 에이전트 행동이 자동 보장된다고 주장하지 않는다.

## History

완료·차단된 실제 단계마다 `.memory/history/YYYY-MM-DD.md`에 간결히 append한다. 같은 결과를 summary로 중복 기록하지 않으며 생략 단계는 workflow 표로 충분하다.

```markdown
## [기록 N] {stage}-{plan-id}-{task-id}

- Checked At: {ISO 8601}
- Task: {해당 일일 문서 기준 상대 링크}
- Result: {실제 수행 내용과 결과}
- Evidence: {실제 보고 또는 Task 내 기록}
- Blocker / Next Action: {없음 또는 구체적 행동}
- Status: 완료 또는 차단
```

기록 N은 기존 최대 번호 +1이며 기존 항목을 재작성하지 않는다. 한국어 보고를 기본으로 하되 프로젝트 관례와 사용자 지시를 따른다. 핵심 변경의 무엇·왜, 필요한 짧은 인용, 검증 한계, 범위 밖 발견 사항을 변경 규모에 맞게 설명한다. 발견이 없으면 특이사항 없음이라고 명시한다.
