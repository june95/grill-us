# Review, Review Action and Optional Refactor

선택한 모드에 해당하는 절만 읽는다. [공통 규약](conventions.md)의 AC/증거·[Stage Isolation](conventions.md#stage-isolation)을 적용하며 과거 finding·실패와 사용자 위치를 보존한다.

## Compliance

- review는 현재 구현/조사 산출물을 task.md의 Goal·I01/I02·AC·검증 의무와 대조한다. 수행하지 않은 구현 보고를 형식상 강제하지 않고 제품 코드를 수정하지 않는다.
- 계획대로 수행/누락/부분 충족/불명확/범위 밖을 구분한다. 파일/동작 차이는 기록된 조정·승인과 결과 보고를 확인한다.
- 관련 버그·회귀·권한·예외·주석·검증 공백을 찾고 일반 취향이나 무관한 기존 정리를 finding으로 확대하지 않는다.
- 조사 대상 제품 실패와 조사 산출물 자체의 오류는 [Investigation Outcomes](conventions.md#investigation-outcomes)로 구분한다. 통과 목표 실패·필수 근거 부족은 완료 차단이며 후속 등록만으로 해소되지 않는다.
- 필요한 승인·선행 evidence를 확인하고 aggregate gate를 만들지 않는다. review.md에 Pass / Pass with Issues / Needs Changes / Blocked, AC 대응·finding·한계·다음 행동을 [Stage Report](templates.md#stage-report)로 기록한다.

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
