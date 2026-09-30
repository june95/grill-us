# Review, Review Action and Optional Refactor

선택한 review, review-action 또는 refactor 모드에 해당하는 절만 적용한다. Task 계약·현재 변경과 [공통 규약](conventions.md), [증거 최신성](resume.md)을 기준으로 한다.

## Compliance

- review는 현재 Task의 구현 또는 해당 목표의 증거가 있는지 확인하고 제품 코드를 수정하지 않는다. 적용되지 않은 implementation 보고서를 형식상 강제하지 않는다.
- Goal·구현 단위·완료 조건·검증 의무를 현재 파일·diff·결과에 대응시킨다. 계획대로 수행, 누락, 부분 충족, 불분명, scope 밖 변경을 구분한다.
- 파일·행동이 청사진과 다른 경우 기록된 조정·승인과 실제 내용을 확인한다. 구현 결과 보고가 실제 변경을 정확히 설명하는지 확인한다.
- 현재 Task에 영향을 주는 버그·회귀·권한·예외·주석·검증 공백을 확인한다. 일반 취향이나 관련 없는 기존 코드 정리는 finding으로 확대하지 않는다.
- 필요한 정본 승인·선행 Task와 현재 evidence를 확인한다. 같은 Plan의 후속 Task가 미완료라는 이유만으로 독립적인 현재 Task 리뷰를 막지 않는다.
- review.md에 `Pass / Pass with Issues / Needs Changes / Blocked`, 대응표, finding과 검증 한계, 다음 행동을 적고 [보고 증거](templates.md)를 포함한다.

## Severity

| Severity | Practical Impact |
| :--- | :--- |
| Critical | 핵심 흐름·계약을 심각하게 깨뜨려 수용할 수 없음 |
| High | 필수 동작 누락, 위험한 검증 부재, 승인되지 않은 범위·계약 변경 |
| Medium | 부분 불일치, 예외 처리·테스트·추적 근거 부족 |
| Low | 수용을 막지 않는 작은 가독성·설명 문제 |
| Info | 확인·관찰·선택적 개선 |

finding에는 유일한 ID, 심각도, 관련 계약 항목, 실제 근거, 영향, 권장 조치를 기록한다. 심각도 자체가 새 scope 승인이나 별도 확인의 유일한 기준은 아니다. 실제 권한·동작 결정과 수정 위험을 판단한다.

## Triage

review-action은 실제 actionable finding이 있을 때 수행한다. review가 Blocked이면 먼저 blocker를 해소하며 무조건 제품 수정을 시작하지 않는다.

| Action | Criteria |
| :--- | :--- |
| Fix now | 명확하고 작고 scope 안이며 현재 검증 가능한 수정 |
| Create task | 조사·큰 수정·추가 scope·소유권이 필요한 후속 작업; 사용자 지시/등록 허용 범위 확인 |
| Ask | 실제 제품·계약 선택 또는 모호한 scope·근거 |
| No action | 이미 해결, 중복, 근거 부족, 의도적 범위 밖; 이유 기록 |

- finding마다 하나의 처리와 이유·결과를 기록한다. 안전한 범위 안 수정은 적용하고 영향을 받는 evidence를 갱신한다.
- 원 review 근거는 보존한다. resolution은 review-action.md에, 재검토는 review의 추가 기록에 둔다. 실패·계획 이탈을 지워 통과처럼 만들지 않는다.
- 후속 작업의 배치는 기존 Plan 목표·scope와 의존성을 비교하고 Task 폴더 계약을 따른다. 사용자가 요청하지 않은 외부 이슈·메시지를 전송하거나 별도 작업 디렉터리 관례를 도입하지 않는다.
- 범위 밖 새 작업은 영향·권고를 먼저 보고하고 사용자 지시 전에 등록·구현을 확대하지 않는다. 현재 완료 조건을 막는 finding은 후속 Task로 기록했다는 이유로 통과하지 않는다.
- review-action.md에 classification, 실제 수정, 확인된 Task 링크, command/result, 미해결·재검토 필요 여부를 기록한다. 결과는 `Resolved / Partially Resolved / Tasks Created / Blocked`로 표시할 수 있다.

## Re-review

- 수정된 구현·테스트·보고 계약에 영향을 받는 부분을 다시 검토한다. 이전 snapshot과 달라졌는데 기존 Pass를 그대로 사용하지 않는다.
- 코드 수정은 필요한 테스트와 기록을 갱신한다. 문서·주석 수정도 scope·의미·관련 command를 확인한다.
- 새 테스트 파일은 실제 변경 scope에 포함하여 테스트 내용을 검토한다. 테스트 실행 성공만으로 새 테스트의 적합성 검토를 대신하지 않는다.
- 단독 test에서 새 테스트가 추가되어 review가 stale인 경우, 실제 재리뷰는 후속 review 요청 또는 전체 Task 실행에서 수행한다. 단독 test 중에는 stale 사유·대상·다음 행동만 남긴다.
- 재검토에 Revision·snapshot·결과·finding resolution을 추가한다. 원 review의 역사 근거를 보존한다.
- 단독 review 요청은 발견 사항과 다음 행동만 남긴다. review-action·제품 수정·commit을 자동 수행하지 않는다.

## Refactor

- refactor는 사용자 요청 또는 Task 필요 시 조건이 충족됐을 때만 수행한다. 현재 Task 변경 표면의 동작 보존 정리에 한정한다.
- 새 중복 로직·복잡한 국소 분기·이름·타입 표현·의도 설명을 개선하되 의미 있는 이점이 없는 cosmetic churn은 피한다.
- API·데이터·권한·UI 흐름·의존성 의미 변경이나 untouched 코드의 광범위한 정리를 리팩토링으로 숨기지 않는다.
- 안전한 정리 뒤 가장 작은 관련 검증과 필요한 재검토를 수행한다. 실제 영향을 받은 review/test/guide 증거를 갱신한다.
- 별도 기록이 필요하면 final-review.md에 수행·미수행 후보, 동작 보존 근거, 실제 검증·한계를 적는다. 리팩토링 또는 이 파일의 존재를 모든 커밋에 강제하지 않는다.
- 최종 완료 판정은 [공통 커밋 점검](commit-check.md)의 Task Completion Check에서 수행한다.
