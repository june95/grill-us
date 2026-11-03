# Task: T01 빈 배열 합계

## Metadata

- Plan ID: 2026-11-01-sum
- Phase ID: P01-core
- Task ID: P01-T01
- Type: 버그
- Source: 사용자 요청 "sum([])이 0이어야 한다"
- Blueprint Revision: 1
- Commit Policy: auto

## Status: in_progress

## Goal

`sum([])`가 0을 반환하고, 다른 입력의 합은 그대로 유지한다.

## Scope

- In: `src/sum.js`의 `sum`
- Out: 다른 함수

## Dependencies

- []

## Constraints

### Must
- 기존 합계 동작을 유지한다.

### Must Not
- 테스트 기대값을 바꿔 통과시키지 않는다.

## Implementation

### I01. 초기값 수정

- Related Files:
  - `src/sum.js` :: `sum` — reduce 초기값; modify

## Acceptance Criteria

- [ ] AC1: `npm test`가 exit 0이다(`sum([])`는 0, `sum([1, 2, 3])`은 6).

## Workflow

| Stage | Applicability | Reason / Trigger | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| reference | 해당 없음 | 원인이 코드에 명확함 | skipped | Goal |
| design-guide-update | 해당 없음 | 공유 계약 변경 없음 | skipped | 해당 없음 |
| implementation | 필수 | 초기값 수정 | passed | [implementation.md](implementation.md) |
| review | 해당 없음 | 한 줄 수정 | skipped | 해당 없음 |
| review-action | 필요 시 | actionable finding 발생 | skipped | 해당 없음 |
| test | 필수 | 단위 테스트 통과 확인 | pending | 수행 시 test.md |
| guide-update | 해당 없음 | 안내 영향 없음 | skipped | 해당 없음 |
| refactor | 해당 없음 | 요청 없음 | skipped | 해당 없음 |
| commit-check | 필수 | 커밋 전 점검 | pending | Completion Check |
| commit | 필수 | auto 정책 | pending | 수행 시 commit.md |

## Validation

| Criteria | Command / Method | Cwd | Expected Result |
| :--- | :--- | :--- | :--- |
| AC1 | `npm test` | repo root | exit 0 |

## Commit Message

    fix(sum): return 0 for an empty list

    Plan: 2026-11-01-sum
    Phase: P01-core
    Task: P01-T01

## Completion Check

- Verdict: pending
- Evidence Revision: 없음
- Covered Files / Source Snapshot: 없음
- Acceptance Evidence: 없음
- Applied Stages: implementation passed, test pending
- Blocking Findings: 없음
- Remaining Risks: 없음
- Staging: 아직 수행하지 않음

## Progress

- [x] 구현 또는 조사 목표 완료
- [ ] 적용 검증 완료
- [ ] 공통 품질·완료 정책 판정 완료 (커밋 필요 여부 포함)
- Commit Status: pending
- Commit Hash: 없음
- Resume Stage: test
- Blocker: 없음
- Next Step: test 단계에서 `npm test`를 실행한다.

## Change Log

- 2026-11-01: Revision 1 작성.
