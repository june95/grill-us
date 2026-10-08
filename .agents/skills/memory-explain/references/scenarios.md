# Memory Explain Scenarios

[설명 스킬](../SKILL.md)의 판단 경계를 확인하는 지침 사례다. 아래 입력은 실제 실행 결과가 아니며 가상 상태를 current로 활성화하지 않는다. 사례별 관찰은 이 스킬을 구현·검증하는 Task 보고에 기록한다. 설명만 하는 호출에는 보고·history를 작성하지 않는다.

| Case | 입력 | 읽을 근거 | 예상 설명 | 금지할 부작용 / 한계 |
| :--- | :--- | :--- | :--- | :--- |
| X01 | pending Plan을 설명해줘 | Plan/Phase, task Goal·Implementation·Dependencies·AC | 목표·확정 동작·순서·예정 검증 | 구현/테스트 완료 단정, Task 활성화 금지 |
| X02 | 진행 중 어디까지 됐어? | Task Workflow·Resume Stage와 해당 보고 snapshot | 실제 완료 단계·현재 위치·남은 일, 구현과 검증 분리 | passed 표기만으로 현재 성공 단정, 포인터 이동 금지 |
| X03 | blocked 작업이 왜 막혔어? | Task Blocker, 실패/stale 보고, Next Action | 원인·영향·기록된 재개 행동 | 테스트 재실행, blocker 해소나 skipped로 기록 금지 |
| X04 | done Task와 현재 코드가 달라 | 당시 보고/commit과 현재 관련 코드 | 당시 변경·검증과 현재 drift를 구분 | 과거 done 증거 수정, 현재 정상 동작 단정 금지 |
| X05 | 커밋 없는 done은 실패야? | Commit Policy·Completion Check·명시 none/실제 변경 없음 근거 | 정상 no-commit 완료인지 실제 실패인지 구분 | 빈 commit 생성, commit 없음만으로 실패 단정 금지 |
| X06 | 검증 근거가 누락되거나 stale | 관련 보고 Revision/snapshot/환경과 현재 필요한 읽기 근거 | 확인한 사실·검증 시점·미확인 범위 | 새 테스트 실행, 결과/과거 환경 추정, 상태 쓰기 금지 |
| X07 | 왜 그 대안을 선택했어? 이유 기록 없음 | decision, Decision Summary, Change Log | 기록된 선택과 확인 불가 이유; 추론이면 명시 | 없는 대안·회의·기각 근거를 과거 사실로 창작 금지 |
| X08 | 비활성 또는 완료 Task 경로 명시 | 명시 Task 및 관련 근거만 | 명시 대상 설명; current는 그대로 | 다른 Task 활성화, 불필요한 전체 이력 탐색 금지 |
| X09 | T01이 여러 개 또는 경로 없음 | 대화·current·해당 경로 존재, 필요한 후보 | 모호하면 후보와 질문 하나, 누락이면 사실 설명 | 가짜 Task/경로 생성, 임의 선택·등록 금지 |
| X10 | 활성 작업 없이 마지막 결과 질문 | current Last Completed Task와 실제 Task/report | 마지막 완료 결과·당시 근거 | 완료 Plan 링크를 현재 실행으로 오인 금지 |
| X11 | 비개발자 요약/개발자 인수인계·전후 비교 | 요청 깊이에 필요한 계약·코드·이전 commit | 사용자 동작 또는 path::symbol/흐름·관계·검증 한계 | 이전 자료 없을 때 전후 추측, 실제 위임/전송 금지 |
| X12 | 설명 또는 명시적 HTML 도식 요청 | 관련 기록, HTML 요청이면 기존 visualize | 기본 채팅; 명시 요청일 때만 별도 HTML 산출물 | 자동 visualize, memory/history/current·Git 변경 금지 |
| X13 | ready 또는 prepared intent와 집계 충돌 | Task Completion Check·intent, 필요한 실제 Git tree | ready와 done 구분, 불일치 영향·별도 복구 권고 | intent를 성공으로 추정, 자동 finalize/복구 금지 |

## Walkthrough Method

1. 입력·읽을 근거·예상 설명·금지 부작용을 SKILL.md의 해당 절과 대조한다. 사실·기록된 의도·추론·미확인을 구분하는지 확인한다.
2. 실제 완료 Task를 자료로 쓸 때는 해당 task/report와 확인할 commit을 명시한다. 현재 구현과 당시 결과를 읽기 비교하며 기록을 수정하지 않는다. 가상 pending/blocked/no-commit 사례는 가상이라고 표시한다.
3. 읽기 대조 전후 current, 기존 checkpoint, 사용한 과거 Task/report의 명시 파일 hash 및 Git working/index 상태를 비교한다. 구현 Task 자체의 보고·상태 쓰기는 이 읽기 대조 구간 밖에서 수행한다.
4. 정적 frontmatter/링크 검사, 수동 walkthrough, 실제 모델 실행을 별개로 기록한다. 도구 검사나 문서 대조만으로 실제 모델 부작용 방지·제품 E2E 성공을 주장하지 않는다.

## Limits

스킬은 에이전트용 문서이며 자동 상태 판독기나 실행 sandbox가 아니다. 기록이 오래되거나 없으면 확인 가능한 범위만 설명한다. 이 사례를 검증하려고 운영 current·제품·Git config에 실패 상태를 주입하거나 테스트를 실행하지 않는다. 실제 모델 행동 확인이 필요하면 별도 요청과 안전한 독립 환경이 필요하다.
