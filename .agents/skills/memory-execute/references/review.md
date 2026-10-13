# Review, Review Action and Optional Refactor

선택한 모드에 해당하는 절만 읽는다. [공통 규약](conventions.md)의 AC/증거·[Stage Isolation](conventions.md#stage-isolation)을 적용하며 과거 finding·실패와 사용자 위치를 보존한다.

## Compliance

- 적용되는 review와 재리뷰는 아래 [Review Delegation](#review-delegation)을 따른다. 실행 담당만 보고·상태를 쓰고 리뷰어는 읽기 전용 결과만 반환한다.
- review는 현재 구현/조사 산출물을 task.md의 Goal·I01/I02·AC·검증 의무와 대조한다. 수행하지 않은 구현 보고를 형식상 강제하지 않고 제품 코드를 수정하지 않는다.
- 계획대로 수행/누락/부분 충족/불명확/범위 밖을 구분한다. 파일/동작 차이는 기록된 조정·승인과 결과 보고를 확인한다.
- 관련 버그·회귀·권한·예외·주석·검증 공백을 찾고 일반 취향이나 무관한 기존 정리를 finding으로 확대하지 않는다.
- 조사 대상 제품 실패와 조사 산출물 자체의 오류는 [Investigation Outcomes](conventions.md#investigation-outcomes)로 구분한다. 통과 목표 실패·필수 근거 부족은 완료 차단이며 후속 등록만으로 해소되지 않는다.
- 필요한 승인·선행 evidence를 확인하고 aggregate gate를 만들지 않는다. review.md에 Pass / Pass with Issues / Needs Changes / Blocked, AC 대응·finding·한계·다음 행동을 [Stage Report](templates.md#stage-report)로 기록한다.

## Review Delegation

### Selection and Authority

- 전체 Task 또는 `--stage review`에서 적용되는 review는 기본적으로 별도 에이전트에게 읽기 전용으로 위임한다. 사용자 자체 리뷰 지시가 우선이며, review가 skipped인 Task에 이 규칙만으로 새 단계를 강제하지 않는다. 실제 변경의 재리뷰도 같은 선택 규칙을 적용한다.
- 현재 환경에서 허용된 내부 위임 기능과 상위 제약을 먼저 확인한다. 새로운 런타임 설치·모델 지정·외부 메시지 전송·자동 worktree 생성은 하지 않는다. 가능하면 읽기 전용 도구/샌드박스를 사용하고 실제 제한 수준을 기록한다. 지시문만으로 제한했다면 쓰기 권한이 기술적으로 차단됐다고 표현하지 않는다.
- 실행 담당 한 명이 Task/current/checkpoint/history·보고·제품·Git 상태를 관리한다. 리뷰어는 아래 입력을 읽고 결과만 반환하며 하위 에이전트에 추가 위임하지 않는다. 단일 writer와 도구 교체는 [State Ownership](conventions.md#state-ownership)을 따른다.

### Request and Result

실행 담당은 대상 Task의 승인 scope·Goal/AC·Revision, 명시 대상 경로와 현재 SHA256 snapshot, 관련 diff·선행 evidence·필요한 정본 링크만 전달한다. 리뷰어 지시문에는 다음 경계를 명시한다.

- 제품·`.memory`·Git·설정 쓰기, staging/commit·외부 전송·추가 위임 금지. 읽기 조회만 허용하며 테스트 실행과 파일 생성·설정 변경 등 부수 효과가 있는 명령을 실행하지 않는다. 기록·검증 실행은 실행 담당에게 반환한다.
- 검토는 [Compliance](#compliance)/[Severity](#severity)를 따라 승인 scope와 AC에 한정한다. 결과를 채팅/도구 반환으로만 제공하며 `review.md`, current, checkpoint, history를 직접 작성하지 않는다.
- 반환 항목: verdict, 유일한 finding ID·severity·계약 항목·path/실제 근거·AC 영향·권고, 검토 파일별 SHA256 snapshot, 실제 검토 범위·제한 수준·미검토/부분 결과. finding이 없으면 없음이라고 명시한다.

실행 담당은 반환 범위·Revision·snapshot·근거와 현재 대상을 대조한다. 검토하지 않은 경로/AC를 통과로 확대하지 않으며 보고의 [조건부 review 필드](templates.md#stage-report)를 채우고 실제 결과에 맞게 workflow/history를 기록한다. 반환 이후 변경된 대상은 [Re-review](#re-review)와 기존 evidence 규칙을 적용한다.

### Fallback and Findings

- 기능 부재·상위 제약·실행 실패·중단·미완료 반환이면 원인·실제 시도·부분 결과를 보존하고, 사용자에게 사유와 자체 리뷰로 계속한다는 사실을 알린 뒤 실행 담당이 부족한 검토를 수행한다. 무한 재시도하지 않는다. Review Mode는 Self로 기록하며 확보된 별도 검토의 범위도 구분하고 독립 리뷰 완료를 주장하지 않는다. 사용자 자체 리뷰 요청은 위임 실패와 구분해 미시도 이유로 기록한다.
- Needs Changes, 실제 finding, 구현/선행 근거의 Blocked 판정은 위임 도구 불가가 아니다. 자체 리뷰로 전환해 해당 결과를 지우거나 통과시키지 않는다. 일부 반환이라도 확보된 finding은 보존하고 [Triage](#triage)·실제 재리뷰·[Quality Gate](commit-check.md#quality-gate)로 처리한다.
- 수정 또는 관련 snapshot 변경은 영향받은 결과를 stale로 판단하고 실제 재리뷰 근거를 추가한다. 원 발견·판정·시도 기록은 보존한다. snapshot 불일치만으로 도구 실패라고 꾸미거나 새 snapshot을 검토 없이 passed로 기록하지 않는다.
- 전체 Task는 기존 승인 scope에서 review-action으로 수정할 수 있다. 단독 review는 결과와 해당 metadata만 기록하고 자동 수정·커밋·완료·포인터 전진을 하지 않는다. 비활성 대상의 기존 active 위치도 보존한다([Stage Isolation](conventions.md#stage-isolation)).

## Severity

| Severity | Practical Impact |
| :--- | :--- |
| Critical | 핵심 흐름/계약을 심각하게 깨뜨려 수용 불가 |
| High | 필수 동작 누락, 위험한 검증 부재, 미승인 범위/계약 변경 |
| Medium | 부분 불일치, 예외 처리·테스트·추적 근거 부족 |
| Low | 완료를 막지 않는 가독성/설명 문제 |
| Info | 관찰·선택적 개선 |

finding은 유일한 ID·severity·계약 항목·실제 근거·영향·권고를 갖는다. severity만으로 새 scope 승인/질문을 정하지 않고 실제 동작·권한과 수정 위험을 판단한다.

## Triage

실제 actionable finding이 있을 때만 review-action을 수행한다. review Blocked는 원인을 먼저 해소한다. 조사 대상의 제품 결함은 자동 수정 대상이 아니며 현재 승인 scope/AC로 분류한다.

| Action | 기준 |
| :--- | :--- |
| Fix now | 명확하고 작고 범위 안이며 검증 가능한 수정 |
| Create task | 조사/큰 수정/추가 scope/소유권 필요, 사용자 등록 허용 확인 |
| Ask | 실제 계약 선택·모호한 scope/근거 |
| No action | 해결/중복/근거 부족/의도적 범위 밖, 이유 기록 |

각 finding의 분류·이유·실제 결과, 확인한 후속 Task 링크·command/result·미해결/재검토 필요를 review-action.md에 남긴다. 원 review를 보존하며 후속 Task 생성 여부는 [Change Boundaries](conventions.md#change-boundaries)를 적용한다. 미해결 완료 차단을 후속 등록으로 통과시키지 않는다. 결과는 Resolved / Partially Resolved / Tasks Created / Blocked로 기록할 수 있다.

## Re-review

영향받은 구현·테스트·보고를 실제 재검토하고 Revision/snapshot·결과·resolution을 원 review의 추가 기록에 둔다. 테스트 실행 성공은 새 테스트의 적합성 검토를 대신하지 않는다. 문서/주석 수정도 의미·scope·관련 검증을 확인한다.

단독 test의 review stale 처리는 [Stage Isolation](conventions.md#stage-isolation)을 따른다. 전체 Task 또는 후속 review에서 실제 재검토하고, review-only 요청은 자동 수정/커밋하지 않는다.

## Refactor

요청/Task 조건이 충족될 때 현재 변경 표면의 동작 보존 정리만 수행한다. 중복·국소 복잡성·이름·타입·의도 설명을 개선하되 이점 없는 cosmetic churn, API/데이터/권한/UI·의존성 의미 변경, untouched 광범위 정리는 하지 않는다.

최소 검증과 영향 재리뷰를 수행한다. 필요하면 final-review.md에 후보/동작 보존 근거·실제 확인·한계를 기록하되 파일 자체를 모든 커밋에 강제하지 않는다. 최종 판정은 [Quality Gate](commit-check.md#quality-gate)를 따른다.
