---
name: memory-execute
description: Execute or resume a .memory task using its selected workflow stages, or run only a requested review, test, or commit check. Use for memory-execute and current 보고 이어서 requests.
---

# Memory Execute

Task 폴더의 task.md를 계약으로 실행하고, 적용 단계의 현재 유효한 증거와 공통 완료 판정을 확인한다. 기본 실행 단위는 Task 하나다. 전역 task-*를 호출하지 않으며 단계별 지침은 필요한 경우에만 읽는다.

## Inputs

```text
/memory-execute
/memory-execute --stage review
/memory-execute --stage test --task .memory/phases/<plan>/<phase>/<task>/task.md
/memory-execute --stage commit-check
current 보고 이어서 해줘
현재 Task 테스트만 실행해줘
T01부터 T03까지 순서대로 진행해줘
현재 Task 구현과 검증만 하고 커밋은 하지 마
```

이 표기는 에이전트 요청 형식이며 별도 CLI가 아니다. `--stage` 또는 "분석만 / 구현만 / 리뷰만 / 리뷰 지적 처리만 / 테스트만 / 가이드 갱신만 / 리팩토링만 / 커밋 점검만 / 커밋만"은 해당 단계만 수행한다. 가이드 모드는 승인된 설계 변경 전 반영인지 구현 후 동기화인지 Task와 요청에서 확인한다. 실제 선택이 모호할 때만 질문한다.

## Resolve Task

1. 명시된 Task 경로를 우선하고 없으면 .memory/current.md의 Active Task를 사용한다. 없는 경로·가짜 초기 링크·활성 Task 없음이면 작업을 임의 생성하지 않고 등록·계획 요청을 안내한다.
2. 대상 task.md와 [공통 규약](references/conventions.md)을 읽고, [재개 규약](references/resume.md)으로 checkpoint·Revision·현재 단계·커밋 결과를 확인한다. 프로젝트 구조가 필요하면 [프로젝트 확인](references/project-profile.md)을 읽는다.
3. 관련 파일·Task scope·완료 조건·Dependencies·정본 승인·기존 사용자 변경을 확인한다. 같은 Plan의 모든 후속 Task가 완료될 때까지 현재 Task를 기다리는 aggregate gate를 사용하지 않는다.
4. 명시적 비활성 Task의 단계만 요청한 경우 대상 결과만 갱신한다. current와 기존 활성 Task의 checkpoint Position을 바꾸지 않는다. 우선 처리·전환 지시가 있으면 이전 재개 위치를 먼저 보존한다.
5. 이미 done인 Task는 성공 기록을 확인하고 새로 구현·커밋하지 않는다. 명시적 사후 단계 요청은 해당 검토 범위·버전을 확인하고 과거 완료 증거를 조용히 덮어쓰지 않는다. 새 scope는 새 작업 등록으로 연결한다.

## Stage Selection

| Stage | Read When Executing | Key Boundary |
| :--- | :--- | :--- |
| reference | [analysis.md](references/analysis.md) | 근거 조사; 제품 구현·정본 재작성 없음 |
| design-guide-update | [guides.md](references/guides.md)의 Design Mode | 승인된 정본 변경을 의존 구현 전에 |
| implementation | [implementation.md](references/implementation.md) | 선택한 Task scope의 구현·최소 검증 |
| review | [review.md](references/review.md)의 Compliance/Severity | 계획 대비 검토; 제품 코드 수정 없음 |
| review-action | [review.md](references/review.md)의 Triage/Re-review | finding별 안전한 수정·후속 처리 |
| test | [testing.md](references/testing.md) | 필요한 테스트·검증; 단독 요청에서 제품 자동 수정 없음 |
| guide-update | [guides.md](references/guides.md)의 Implementation Mode | 실제 검증된 공유 계약·사용법 영향만 반영 |
| refactor | [review.md](references/review.md)의 Refactor | 현재 Task 변경 표면의 동작 보존 정리 |
| commit-check / commit | [commit-check.md](references/commit-check.md) | 최종 품질·명시 Git 후보·의도·성공 검증 |

- applicability는 `필수 / 필요 시 / 해당 없음`, 상태는 `pending / running / passed / skipped / failed / blocked / stale`다. 두 값을 혼동하지 않는다.
- 필요 시의 실제 조건을 평가한다. 해당 없음과 실행하지 않기로 확정한 조건부 단계는 이유 있는 skipped로 기록하고 빈 보고서를 생성하지 않는다.
- 보고서 파일 부재만으로 차단하지 않는다. 적용되는 실제 선행 증거가 부족하거나 필수 실패·stale·blocker가 있으면 해당 원인을 기록한다.
- 사용자 지시로 optional stage를 수행하면 실제 적용 이유를 남긴다. 실패·차단을 생략으로 바꿔 완료하지 않는다.
- evidence는 Revision과 covered 파일 snapshot에 맞아야 한다. 코드·테스트·상세 계약 변경에 영향받은 결과만 stale로 표시하고 재확인한다. HEAD만 바뀐 동일 내용의 증거는 무효화하지 않는다.
- 검증 전 실제 checkout/cwd와 관련 도구·설정을 확인하고 [Environment Evidence](references/conventions.md#environment-evidence)를 결과에 기록한다. 재사용 시 관련 환경도 비교하여 영향받은 결과만 재검증한다. 과거 기록 부재는 한계·완료 조건 영향으로 판단하며 자동 통과/일괄 차단하지 않는다.

## Task Mode

1. 새 단계·staging·commit 전에 Task와 기존 prepared/committed/failed intent의 실제 결과부터 확인한다. 성공한 동일 commit이 확인되면 누락된 finalize만 복구하고 새 단계·커밋을 반복하지 않는다. 그 외에는 아직 필요한 첫 적용 단계를 찾아 선행 의존성과 정본 승인을 확인한다. 환경·설계 blocker는 원인·재개 행동을 기록하고 멈춘다.
2. running으로 기록한 뒤 해당 단계 지침만 읽어 수행하고 실제 결과·Revision·covered snapshot 및 관련 환경 근거를 기록한다. 유효한 이전 결과는 환경 변경 영향까지 확인해 재사용한다. 근거 수집을 위해 설치·업그레이드·설정을 자동 변경하지 않는다.
3. 범위 안 구현 결함은 해당 수정 단계로 돌아가 해결한다. 새 근거 없이 같은 실패를 반복하는 루프를 만들지 않는다. 코드 조정·테스트 작성·가이드 변경 뒤 필요한 관련 review/test 증거를 갱신한다.
4. 파일 위치·기존 함수명 등의 비기능 조정은 청사진·변경 기록에 반영한다. 사용자 동작·완료 조건·API·권한·데이터의 새로운 결정은 승인 근거를 확인하고 필요한 질문 하나를 한다.
5. [공통 커밋 점검](references/commit-check.md)으로 선행 적용 단계, 완료 조건, 최종 품질·정본·검증 한계와 Git 경계를 평가한다. `ready`는 done이 아니며 별도 final-review.md가 필수인 것도 아니다.
6. auto이면 명시적 후보만 staging하고 prepared 의도를 저장한 뒤 청사진 메시지로 commit한다. 실제 commit tree와 의도를 확인한 다음에만 성공으로 기록한다. 실패하면 현재 Task와 blocker를 유지한다.
7. 명시적 no-commit 또는 실제 Git 변경 없음은 이유와 남은 상태를 기록하고 완료 조건·품질 판정 후 finalize한다. check_only는 점검 결과만 남긴다.
8. 성공한 동일 commit이 이미 있으면 내용을 검증하고 누락된 finalize만 복구한다. Task done → Phase 집계 → Plan 요약 → current를 순서대로 갱신한다. 다음 Task는 실제 시작 전 pending이며 마지막 Task 후 Active Task·Stage는 없음이다.
9. 기본 한 Task에서 끝낸다. 연속 요청이 있으면 요청한 범위 내에서 각 Task별 검증·점검·커밋 후 순차 진행하고 차단 시 멈춘다. 다른 pending Plan을 임의로 시작하지 않는다.

## Stage Mode

- 지정한 단계만 수행한다. 선행 증거가 부족하면 필요한 다음 행동을 보고하고 다른 stage를 자동 실행하지 않는다.
- review는 보고·해당 Task metadata만 갱신한다. test는 scope 안 필요한 테스트 작성·실행과 결과 기록이 가능하나 제품 결함 수정은 다음 행동으로 남긴다.
- 단독 test에서 새 테스트나 수정으로 review가 영향을 받으면 stale 사유·대상 파일·재리뷰 Next Action만 기록한다. 별도 review를 실행하거나 검토하지 않은 snapshot을 passed로 갱신하지 않는다. test 자체의 성공과 남은 review stale는 구분하고 기존 current/checkpoint Position을 보존한다.
- commit-check는 quality·후보·현재 index를 읽고 결과를 기록할 뿐 코드 수정·staging·commit·Task done·포인터 전진을 하지 않는다.
- commit은 기존 공통 판정과 선행 증거가 현재 내용에 유효할 때 관련 후보 staging·의도·commit만 수행한다. 부족한 증거를 만들기 위해 전체 workflow를 실행하지 않는다.
- review-action·implementation·refactor의 최소 검증은 선택한 단계의 작업에 포함된다. 필요한 별도 재리뷰·test stage는 stale/next action으로 남긴다.
- 결과를 갱신해도 자동 finalize하지 않는다. 단독 commit 성공 뒤 전체 실행으로 재개하면 같은 commit을 검증하고 finalize만 하며, 이미 성공한 결과를 '지금 diff 없음'으로 skipped로 덮지 않는다.
- 비활성 Task의 단계 결과와 그 활성 위치를 분리한다. commit intent의 정확한 Target Task를 기록하되 기존 checkpoint Position은 보존한다. 해결되지 않은 prepared/failed intent를 다른 대상의 의도로 덮어쓰지 않는다.

## Commit and Resume

- 이번 요청의 명시적 정책과 해당 Task에 유효하게 기록된 사용자 지시를 우선한다. 단계 단독 실행이 Task의 auto 정책을 영구 check_only로 바꾼다는 뜻은 아니다. 사용자가 해당 Task의 commit을 금지한 지시는 취소되기 전까지 보존한다.
- 후보·staged 경로를 ignore 검사하고 명시적 파일만 사용한다. 다른 사용자 index를 전체 commit하거나 임의로 없애지 않는다. same-file 혼합이 불분명하면 차단한다.
- 기본 로컬 .memory 내용은 stage하지 않는다. 명시 승인된 기존 memory index 삭제만 [전환 예외](references/commit-check.md)의 로컬 보존 조건으로 처리한다.
- prepared snapshot에는 working-tree freshness와 staged Git mode/blob ID를 구분한다. commit 성공 후 pointer 쓰기가 끊기면 [resume.md](references/resume.md)의 trailer·실제 tree 비교로 복구한다.
- 상태 문서는 인접 임시 파일에 완성 내용을 쓴 뒤 교체한다. 여러 파일 교체가 단일 트랜잭션이라고 가정하지 않으며 Task·확인한 Git 결과로 집계를 복구한다.

## Report

실행한 단계만 Task 폴더에 [보고 템플릿](references/templates.md) 형식으로 기록하고 이력을 간단히 append한다. 채팅에는 다음을 포함한다.

- 완료 단계/Task, 실제 command 검증과 한계, commit 여부·hash, 다음 활성 위치와 행동.
- 파일별 핵심 무엇·왜와 필요한 짧은 코드·계약 인용. 새 패턴은 한 줄로 설명한다.
- 이어서 작업할 때 필요한 부수 효과·제약·검증하지 못한 영역.
- 범위 밖 발견 사항의 영향·권장 조치. 없으면 특이사항 없음.

변경 규모에 맞게 간결히 보고한다. 이미 요청한 연속 범위에 대해 재승인을 반복하지 않는다.
