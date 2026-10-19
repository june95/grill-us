# Project Memory Templates

[conventions.md](conventions.md)의 필드·상태를 사용한다. 아래 fenced 문서는 작성 형식이며 placeholder를 실제 요청·코드 근거·명령으로 채운다. 적용되지 않는 API·스키마 항목은 만들지 않는다. 계획만으로 테스트 결과나 커밋 hash를 생성하지 않는다.

새 기록은 [Reporting](conventions.md#reporting)에 따라 자연스러운 문장과 띄어쓰기로 작성한다. 조건·부정·예외·실패·출처와 정확한 command/cwd/path/ID를 보존하며, 필요한 사실이 없는 짧은 요약이나 불필요한 빈 표로 대체하지 않는다. 아래 형식을 이유로 과거 완료 기록을 변환하지 않는다.

## Task

task.md의 상세 계약·Revision은 [Task Fields](conventions.md#task-fields), 단계 선택은 [Workflow](conventions.md#workflow)를 따른다. 아래는 해당 계약을 채우는 형식이다.

Implementation에는 적용 작업을 적는다. 분석 전용이면 조사 절차·산출 근거, 테스트 실행 전용이면 대상·명령·결과 분류 절차로 구체화하며 제품 구현을 강제하지 않는다. Goal/AC에는 조사 결과 정리가 목표인지, 원인 확정이나 테스트 통과가 목표인지 사전에 명시한다. 커밋 대상이 없는 Task는 Commit Message에 `해당 없음`과 이유만 적어도 된다. 공유 변경이 있는 Task에는 아래 실제 메시지 형식을 사용한다.

아래 Bug Investigation은 [공통 버그 조사 계약](conventions.md#bug-investigation)에 따라 버그 수정 Task에만 채운다. 일반 기능·문서 Task에서는 해당 섹션 전체를 제외하며, 과거 완료 기록에 빈 표를 소급 추가하지 않는다.

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

{관찰 가능한 단일 결과, 대상, 필요한 이유와 결과를 제한하는 조건}

## Decision Summary

- {확정 선택과 확인된 코드 사실을 구분하고 관련 결정 링크를 적는다.}

## Bug Investigation

{버그 수정 Task인 경우에만 실제 근거로 작성. 다른 Task에서는 이 섹션을 제거한다.}

- Reproduction Status: {reproduced / not_reproduced / unavailable / code_only 중 실제 수준}
- Cause Confidence: {confirmed / supported / hypothesis / unknown 중 후보의 근거 수준}

| Item | Evidence |
| :--- | :--- |
| Minimal Input / Preconditions | {최소 입력·사전 상태; 비밀 값 없이 안전한 fixture/요약} |
| Procedure / Command / Cwd | {실제 존재하는 절차·명령·cwd; 실행 또는 예정 여부} |
| Expected Result | {사용자가 기대하는 동작} |
| Actual Result | {관찰한 현상·오류 또는 미실행; 임의 성공/실패 로그 없음} |
| Attempt / Source | {시도 여부·관찰 주체·실제 자료/코드 출처} |
| Checked At | {근거를 실제 확인한 ISO 시각; 원 실행 시각 미상은 구분} |
| Relevant Environment | {확인한 관련 환경·버전 또는 미확인/해당 없음의 이유} |
| Cause Candidate / Code Location | {후보·실제 path::symbol·근거 또는 확인하지 못한 이유; 복수 후보면 각각 대응} |
| Limitation / Next Verification | {확인 한계와 실행 시 검증할 조건·방법} |

## Scope

- In: {이번 Task 범위}
- Out: {제외 범위}

## Dependencies

- [] 또는 {선행 Task ID와 실제 링크}

## Constraints

### Must
- {이 작업의 책임·재사용·반드시 지킬 공유 계약; 없으면 없음과 이유}

### Must Not
- {이 작업에서 금지할 동작·불필요한 구조; 없으면 없음과 이유}

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
- Signatures & Types: {공개 API·공유 모듈 경계의 정확한 인자·반환 타입; private helper는 계약에 필수인 경우만 고정}
- Data & Schema: {필드·타입·기본값·nullable·관계; 적용되는 경우}
- Execution Flow:
  1. {사전 검증}
  2. {핵심 처리}
  3. {조건·부정·오류·예외·롤백; 적용되는 경우}
  4. {상태 변경·반환}
- 문서 작업이면: {정확한 변경 섹션·의미·참조 계약}

### I02. {필요한 추가 단위}

{관련 파일·구현 내용·회귀 방지 포인트; 새 파일/추상화가 필요하면 기존 소유 위치에 둘 수 없는 이유}

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
- [ ] 공통 품질·완료 정책 판정 완료 (커밋 필요 여부 포함)
- Commit Status: pending
- Commit Hash: 없음
- Resume Stage: {첫 적용 단계}
- Blocker: 없음
- Next Step: {구체적인 다음 행동}

## Change Log

- YYYY-MM-DD: {확정 변경과 이유; scope 안 조정과 사용자 결정 구분}
```

단계 상태는 공통 Workflow로 정하고 미평가 `{판단}`을 실행 청사진에 남기지 않는다. 작은 작업도 적용 계약을 실행 가능한 상세로 채운다. [계획 경계](conventions.md#planning-boundaries)에 따라 공유 계약은 정확히 적고, 동등한 내부 구현은 실행자에게 맡긴다. Constraints는 해당 작업의 제약만 적으며 과거 완료 기록에 소급하여 강제하지 않는다.

실제 메시지는 [Commit Intent](commit-check.md#commit-intent)의 마지막 metadata trailer 형식/파싱을 적용한다. 커밋 없는 Task에는 이유만 기록하고 가상 메시지/빈 커밋을 만들지 않는다. 공통 완료 의미는 [Evidence and Completion](conventions.md#evidence-and-completion)을 따르며 과거 문서를 새 형식으로 재작성하지 않는다.

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
- Checkpoint: {실제 Plan별 state 링크 또는 없음}

## Last Completed Task

{완료 이력이 없으면 없음. 있으면 아래 항목을 실제 근거로 작성한다.}

- Plan: {마지막 완료 Plan ID}
- Task: {마지막 완료 metadata Task ID}
- Commit: {확인한 성공 SHA 또는 no-commit/변경 없음과 사유}
- Evidence: {실제 완료 보고 또는 Task Completion Check 링크}

## Next Step

{활성 Task의 구체적인 다음 행동과 필요한 재개 조건; 상세 계약·로그는 Task/보고 링크로 연결}
```

활성 Task가 없으면 Active Task·Active Stage에 `없음`을 적고 가짜 링크를 만들지 않는다. Plan 완료 시 완료한 Plan 링크와 완료 상태는 보존할 수 있다. 다른 Plan 자동 전환은 하지 않는다.

각 항목의 의미·보존은 [State Ownership](conventions.md#state-ownership)을 따른다. 활성 Task 없음과 보존 state 링크는 구분하고, 완료 이력이 없으면 Last Completed Task는 없음이다. no-commit은 SHA 대신 사유·실제 완료 근거를 연결한다.

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

현재 의도와 직전 성공은 [Checkpoint Fields](resume.md#checkpoint-fields)로 구분·보존한다. 미해결 의도는 덮어쓰지 않으며 archive 사본을 자동 생성하지 않는다.

Candidate Snapshot 형식은 path·A/M/D·working SHA256·staged mode/blob다. 실제 entry/삭제·승인된 memory 추적 해제의 확인 절차는 [Staging](commit-check.md#staging) 및 [Recovery](resume.md#recovery)를 따른다.

## Stage Report

이 파일 형식은 workflow 실행 담당의 기록용이다. 독립 memory-review/worker는 [공통 반환 계약](review.md#review-result)에 따라 채팅/도구로 결과만 반환하며 이 보고 파일을 만들지 않는다. 실행 담당은 반환 대상·Revision/commit/diff·snapshot을 확인해 기존 review 보고에 반영한다.

실제 수행한 단계의 [Reporting](conventions.md#reporting) 형식이다. 고유 verdict/목적 판정과 workflow 상태의 대응을 설명하고 필요한 finding·검증·commit audit만 추가한다.

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

{무엇을 왜 변경/판단했는지, source와 실제 확인 수준, 조건·예외·실패를 포함한 command/cwd/result. 예정·미실행은 구분하고 필요한 경우에만 표를 사용한다.}

{review 보고에만 아래 항목을 실제 시도 근거로 작성한다. 다른 단계에서는 제거한다. 재리뷰도 해당 시도와 검토 snapshot을 구분해 추가한다.}

- Review Mode: {Delegated / Self}
- Reviewer: {식별 가능한 내부 도구·리뷰어 ID 또는 실행 담당 역할}
- Attempt: {위임 시도 여부·실제 호출/완료/실패/중단·부분 반환 근거; 미시도이면 이유}
- Fallback Reason: {위임 불가 사유·사용자 알림 근거 또는 없음; 사용자 자체 리뷰 요청은 구분}
- Reviewed Snapshot: {위 Source Snapshot 참조 또는 시도별 path/SHA256; 현재 대상과 일치 확인}
- Limitations: {실제 도구/샌드박스 제한 수준·지침만의 제한, 부분 결과·미검토 범위}

{조사 목적 Task에서 검사 결과와 목표 달성이 다를 수 있으면 아래 항목을 작성한다. 해당하지 않으면 제거한다.}

- Observed Result: {실제 command/cwd/exit와 관측 실패/통과/미실행, 분류·근거}
- Objective Assessment: {사전 AC별 충족/미충족, 조사 목적 판정·한계·후속 권고, workflow Status와 대응}

{상단 Result에도 조사 목적 판정과 관측 실패를 구분해 요약한다. 실제 실패를 passed로 표기하지 않으며, 통과 목표 실패나 필수 조사 근거 부족을 완료로 처리하지 않는다.}

## Environment Evidence

{검증 결과에 관련된 항목만 작성한다. 적용되지 않으면 이유를 적고 빈 필드 나열은 제거한다.}

- Tool Versions: {관련 도구·runtime, 읽기 명령, 실제 버전 또는 미확인 이유}
- Relevant Files: {관련 설정 path → 위 Source Snapshot 참조 또는 SHA256/missing/deleted; 중복 hash 관리 금지}
- Non-secret Settings: {확인한 비밀 아닌 동작 설정 요약 또는 해당 없음의 이유}
- Scope / Reason: {검사와의 관계, 재사용 시 현재/기존 값 비교·변경 영향·재사용/재검증 판단과 한계}
- Checked At: {실제 환경 확인 시각}

## Blockers and Risks

{없음 또는 근거·영향·검증 한계}

## Next Action

{완료 또는 구체적 재개 단계}
```

`.memory` 기본 로컬 관리에서 성공 commit hash는 커밋 후 Task/checkpoint/report에 기록할 수 있다. 공유 예외로 커밋에 포함되는 audit 문서에는 자기 커밋 hash를 미리 넣거나 이를 위해 계속 amend하지 않는다.
