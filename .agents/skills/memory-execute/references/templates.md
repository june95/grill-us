# Project Memory Templates

[conventions.md](conventions.md)의 필드·상태를 사용한다. 아래 fenced 문서는 작성 형식이며 placeholder를 실제 요청·코드 근거·명령으로 채운다. 적용되지 않는 API·스키마 항목은 만들지 않는다. 계획만으로 테스트 결과나 커밋 hash를 생성하지 않는다.

## Task

Task 폴더의 task.md가 요청·완료 조건·상세 구현의 정본이다. Blueprint Revision은 의미 있는 계약 변경에만 증가시킨다. Workflow의 적용·조건·초기 상태는 Task별 판단 후 확정한다.

```markdown
# Task: T01 {작업명}

## Metadata

- Plan ID: YYYY-MM-DD-feature
- Phase ID: P01-phase
- Task ID: P01-T01
- Type: {추론한 작업 유형}
- Source: {사용자 요청·기존 이슈·결정·코드 근거}
- Blueprint Revision: 1
- Commit Policy: auto

## Status: pending

## Goal

{관찰 가능한 단일 결과, 대상, 필요한 이유}

## Decision Summary

- {확정 선택과 확인된 코드 사실을 구분하고 관련 결정 링크를 적는다.}

## Scope

- In: {이번 Task 범위}
- Out: {제외 범위}

## Dependencies

- [] 또는 {선행 Task ID와 실제 링크}

## Guide Alignment

- Project Guide Alignment: Compliant
- Guides Reviewed: {적용되는 실제 정본 또는 없음}
- Preserved Constraints: {현재 계약·권한·데이터 경계}
- Approval Evidence: {설계 변경이면 승인 근거}
- Affected Guides: {설계 변경이면 영향 목록}

## Implementation

### I01. {구현 단위}

- Related Files:
  - {repo-relative path} :: {symbol 또는 문서 섹션} — {목적}; new/modify/read-only
- Signatures & Types: {필요한 정확한 인자·반환 타입}
- Data & Schema: {필드·타입·기본값·nullable·관계; 적용되는 경우}
- Execution Flow:
  1. {사전 검증}
  2. {핵심 처리}
  3. {오류·예외·롤백}
  4. {상태 변경·반환}
- 문서 작업이면: {정확한 변경 섹션·의미·참조 계약}

### I02. {필요한 추가 단위}

{관련 파일·구현 내용·회귀 방지 포인트}

## Acceptance Criteria

- [ ] {관찰 가능한 완료 조건}
- [ ] {검증으로 확인할 조건}

## Workflow

| Stage | Applicability | Reason / Trigger | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| reference | {판단} | {이미 조사했다면 근거 위치} | {초기 상태} | {수행 시 reference.md} |
| design-guide-update | {판단} | {승인된 정본 변경 여부} | {초기 상태} | {수행 시 design-guide-update.md} |
| implementation | {판단} | {변경 또는 조사 목표} | {초기 상태} | {수행 시 implementation.md} |
| review | {판단} | {위험·scope} | {초기 상태} | {수행 시 review.md} |
| review-action | 필요 시 | actionable finding 발생 | pending | 수행 시 review-action.md |
| test | {판단} | {완료 조건을 입증할 검증} | {초기 상태} | {수행 시 test.md} |
| guide-update | {판단} | {검증된 공유 사용법·계약 영향} | {초기 상태} | {수행 시 guide-update.md} |
| refactor | {판단} | {요청·실제 정리 필요} | {초기 상태} | {필요하면 final-review.md} |
| commit-check | {판단} | {Git 변경·최종 점검 요청} | {초기 상태} | Completion Check |
| commit | {판단} | {정책과 실제 변경} | {초기 상태} | {수행 시 commit.md} |

## Validation

| Criteria | Command / Method | Cwd | Expected Result |
| :--- | :--- | :--- | :--- |
| {완료 조건} | {정확한 명령 또는 수동 확인} | {실제 실행 위치} | {기대 결과} |

{실행 시 실제 exit/result, Checked At, Revision, Covered Files와 Source Snapshot을 기록한다.}

## Commit Message

    feat(scope): {변경 요약}

    - {구체적 변경}

    Plan: YYYY-MM-DD-feature
    Phase: P01-phase
    Task: P01-T01

## Completion Check

- Verdict: pending
- Evidence Revision: 없음
- Covered Files / Source Snapshot: 없음
- Acceptance Evidence: 없음
- Applied Stages: {선행 단계 적용·실행 결과}
- Blocking Findings: 없음 또는 {해결되지 않은 문제}
- Remaining Risks: {확인하지 못한 영역}
- Staging: 아직 수행하지 않음

## Progress

- [ ] 구현 또는 조사 목표 완료
- [ ] 적용 검증 완료
- [ ] 공통 품질·커밋 점검 완료
- Commit Status: pending
- Commit Hash: 없음
- Resume Stage: {첫 적용 단계}
- Blocker: 없음
- Next Step: {구체적인 다음 행동}

## Change Log

- YYYY-MM-DD: {확정 변경과 이유; scope 안 조정과 사용자 결정 구분}
```

필수/필요 시는 pending, 해당 없음은 사유 있는 skipped로 작성한다. 모든 항목이 `{판단}`인 미완성 표를 실행 청사진으로 남기지 않는다. 작은 작업은 적용되는 섹션만 구체적으로 작성하고, 상세 계약을 요약하다가 다음 실행자가 추측하게 만들지 않는다.

Commit Message의 마지막 세 줄은 metadata와 같은 Plan/Phase/Task 식별자를 사용하는 Git trailer다. 그 뒤에 설명 목록을 붙이지 않는다. 실제 메시지 파일을 `git interpret-trailers --parse`로 확인하며 과거 완료 문서·커밋은 이 템플릿에 맞추려고 재작성하지 않는다.

## Plan

```markdown
# Plan: {기능명}

- Plan ID: YYYY-MM-DD-feature
- Date: YYYY-MM-DD
- Status: pending
- Source / Decisions: {확정 요청·근거 문서 링크}

## Goal

{전체 목표와 관찰 가능한 결과}

## Scope

- In: {포함 범위}
- Out: {제외 범위}

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | pending | {실질 마일스톤} | [P01](../phases/YYYY-MM-DD-feature/P01-phase/phase.md) |

## Dependencies and Sequencing

{Task 순서·의존성·분할 이유, 미결정 중요 사항이 없음에 대한 근거}

## Completion Criteria

- [ ] {Task의 완료 집계와 전체 목표}

## Next Step

{대기 등록 또는 활성화한 첫 Task}
```

## Phase

```markdown
# Phase: P01 {마일스톤}

- Plan: [전체 Plan](../../../plans/YYYY-MM-DD-feature.md)
- Status: pending

## Tasks

| Task | Status | Depends On | Summary | Blueprint |
| :--- | :--- | :--- | :--- | :--- |
| T01 | pending | 없음 | {관찰 가능한 결과} | [T01](./T01-task/task.md) |

## Progress

- done: 0/1
- active: 없음
```

active Plan/Phase는 in_progress로 표시할 수 있어도 Task가 실제 시작하지 않았다면 pending으로 유지한다. Phase 표는 Task의 실제 상태와 맞춘다.

## Current

```markdown
# Current Context

## Active Plan

[기능명](./plans/YYYY-MM-DD-feature.md)

## Active Phase

[P01 마일스톤](./phases/YYYY-MM-DD-feature/P01-phase/phase.md)

## Active Task

[T01 작업명](./phases/YYYY-MM-DD-feature/P01-phase/T01-task/task.md)

## Active Stage

- {실제 다음 Stage 또는 없음}

## Status

- Task Status: pending
- Blocker: 없음
- Commit Policy: auto

## Next Step

{활성 Task의 구체적인 다음 행동}
```

활성 Task가 없으면 Active Task·Active Stage에 `없음`을 적고 가짜 링크를 만들지 않는다. Plan 완료 시 완료한 Plan 링크와 완료 상태는 보존할 수 있다. 다른 Plan 자동 전환은 하지 않는다.

## Checkpoint

기록 위치는 `.memory/state/{plan-id}.md`이며 링크는 이 파일 위치 기준으로 작성한다. [resume.md](resume.md)의 복구 조건을 따른다.

```markdown
# Checkpoint: YYYY-MM-DD-feature

## Position

- Plan: {ID와 상대 링크}
- Phase: {ID와 상대 링크}
- Task: {ID와 상대 링크}
- Active Stage: {Stage 또는 없음}
- Mode: task
- Commit Policy: auto
- Repo: {현재 프로젝트 식별 경로}
- Branch: {현재 branch 또는 detached}
- Blocker: 없음
- Next Step: {구체적 행동}

## Commit Intent

- Status: none
- Task: {이번 커밋 의도의 정확한 Task ID 또는 없음}
- Base HEAD: 없음
- Candidate Paths: []
- Candidate Snapshot: []
- Commit Message: 없음
- Commit Hash: 없음
- Migration Index Deletions: []

## Last Completed Commit

- Task: 없음
- Commit Hash: 없음
- Result: 없음
```

Last Completed Commit과 현재 Commit Intent는 구분한다. 완료 Task의 의도를 다음 Task 의도로 오인하지 않게 Task ID를 기록하고 finalize 후 마지막 성공 결과를 보존한다.

Candidate Snapshot의 각 항목에는 path, added/modified/deleted 상태, 검증한 working-tree SHA256, staged Git mode/blob ID를 기록한다. Git entry는 `git ls-files --stage -- <명시적 후보>`의 stage 0 값이다. 삭제 경로는 mode/blob 없음으로 기록한다. 승인된 memory index 삭제는 로컬 보존 여부를 별도로 기록하고 진행 문서 bytes를 코드 freshness 판단에 넣지 않는다.

## Stage Report

실제 수행 단계의 보고서만 만든다. 필요한 compliance, finding, 검증, 정본 후보, commit audit 표를 아래 증거 필드에 추가한다. 보고서의 고유 verdict가 있으면 workflow 상태와 완료 판정의 대응을 설명한다.

```markdown
# {Stage 결과}

## Evidence

- Task: [청사진](./task.md)
- Stage: {실행 단계}
- Blueprint Revision: {검토한 Revision}
- Checked At: {ISO 8601}
- Result: {실제 결과·해당 단계 verdict}

## Source Snapshot

| Covered File | Snapshot |
| :--- | :--- |
| {repo-relative path} | {SHA256 또는 missing/deleted} |

## Details

{실제 변경·판단·검증 근거, command/cwd/result 또는 필요한 대응표}

## Blockers and Risks

{없음 또는 근거·영향·검증 한계}

## Next Action

{완료 또는 구체적 재개 단계}
```

`.memory` 기본 로컬 관리에서 성공 commit hash는 커밋 후 Task/checkpoint/report에 기록할 수 있다. 공유 예외로 커밋에 포함되는 audit 문서에는 자기 커밋 hash를 미리 넣거나 이를 위해 계속 amend하지 않는다.
