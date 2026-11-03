# Task: T01 인사말 느낌표

## Metadata

- Plan ID: 2026-11-01-greet
- Phase ID: P01-core
- Task ID: P01-T01
- Type: 기능
- Source: 사용자 요청 "인사말 끝에 느낌표"
- Blueprint Revision: 1
- Commit Policy: auto

## Status: in_progress

## Goal

`greet('Ada')`가 `Hello Ada!`를 반환한다.

## Scope

- In: `src/greet.js`, `test/greet.test.js`
- Out: 다른 파일

## Dependencies

- []

## Constraints

### Must
- 인사말 앞부분은 유지한다.

### Must Not
- 다른 함수를 바꾸지 않는다.

## Implementation

### I01. 느낌표 추가

- Related Files:
  - `src/greet.js` :: `greet` — 반환 문자열; modify
  - `test/greet.test.js` :: 기대값; modify

## Acceptance Criteria

- [x] AC1: `npm test`가 exit 0이다(`greet('Ada')`는 `Hello Ada!`).

## Workflow

| Stage | Applicability | Reason / Trigger | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| reference | 해당 없음 | 요청이 명확함 | skipped | Goal |
| design-guide-update | 해당 없음 | 공유 계약 변경 없음 | skipped | 해당 없음 |
| implementation | 필수 | 반환 문자열 변경 | passed | [implementation.md](implementation.md) |
| review | 해당 없음 | 한 줄 변경 | skipped | 해당 없음 |
| review-action | 필요 시 | actionable finding 발생 | skipped | 해당 없음 |
| test | 필수 | 단위 테스트 | passed | [test.md](test.md) |
| guide-update | 해당 없음 | 안내 영향 없음 | skipped | 해당 없음 |
| refactor | 해당 없음 | 요청 없음 | skipped | 해당 없음 |
| commit-check | 필수 | 커밋 전 점검 | passed | Completion Check |
| commit | 필수 | auto 정책 | pending | 수행 시 commit.md |

## Validation

| Criteria | Command / Method | Cwd | Expected Result |
| :--- | :--- | :--- | :--- |
| AC1 | `npm test` | repo root | exit 0 |

## Commit Message

    feat(greet): end the greeting with an exclamation mark

    Plan: 2026-11-01-greet
    Phase: P01-core
    Task: P01-T01

## Completion Check

- Verdict: ready
- Evidence Revision: 1
- Covered Files / Source Snapshot: `src/greet.js`, `test/greet.test.js`(작업 트리 변경, 아직 stage하지 않음)
- Acceptance Evidence: [test.md](test.md)의 `npm test` exit 0
- Applied Stages: implementation·test·commit-check passed
- Blocking Findings: 없음
- Remaining Risks: 없음
- Staging: 아직 수행하지 않음

## Progress

- [x] 구현 또는 조사 목표 완료
- [x] 적용 검증 완료
- [ ] 공통 품질·완료 정책 판정 완료 (커밋 필요 여부 포함)
- Commit Status: pending
- Commit Hash: 없음
- Resume Stage: commit
- Blocker: 없음
- Next Step: auto 정책으로 commit한 뒤 결과를 확인한다.

## Change Log

- 2026-11-01: Revision 1 작성.
