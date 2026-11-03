# Task Analysis

reference를 실행할 때만 읽는다. 충분한 기존 조사·결정은 재사용한다. [공통 규약](conventions.md), 경로 확인이 필요하면 [Discovery](project-profile.md#discovery), 보고 작성에는 [Stage Report](templates.md#stage-report)를 사용한다.

## Problem

- 요청 결과·현재 현상·기대 동작·scope·AC를 분리하고 관련 코드/설정/기존 자료로 조사한다. 증상과 원인은 같다고 단정하지 않는다.
- 버그 관찰은 [Bug Investigation](conventions.md#bug-investigation)에 따른다. 직접 관측·사용자 자료·후보와 확신을 구분하고 필요한 재현 정보만 질문한다.
- 중요한 선택은 [Change Boundaries](conventions.md#change-boundaries)를 적용한다. 명확한 버그 원인은 코드로 조사하며 제품/공유 정본을 수정하지 않는다.

## Evidence

코드 근거를 찾을 때는 [Bounded Exploration](project-profile.md#bounded-exploration)을 따른다. 명시 파일과 기존 조사에서 출발하고, 개념/심볼 검색 후보를 실제 정의·조건·호출부로 확인한다. 결과 없음·도구 부재·권한 오류·출력 잘림을 서로 다른 관측으로 기록하며 미확인 부분을 구현 결론으로 채우지 않는다.

reference.md에는 다음 조사 산출물을 남긴다.

| Item | 내용 |
| :--- | :--- |
| Source / Outcome | 원 요청·기대 결과·사전 완료 조건 |
| Current Context | 실제 파일/심볼·흐름·제약 |
| Findings | 사실·가설·근거·영향 |
| Options | 현재 계약 안의 권장안·의미 있는 대안과 이유 |
| Verification | 입증할 조건과 실제 검증 경로 |
| Open Questions | scope/동작/순서 등에 필요한 미결정 |

[Investigation Outcomes](conventions.md#investigation-outcomes)로 관측과 사전 목적 달성을 구분한다. 후보 조사 목표와 원인 확정 목표는 다르며, 필수 근거 부족을 완료로 포장하지 않는다. [증거·보고](conventions.md#evidence-and-completion)에 실제 수행 범위·한계를 기록한다.

불확실한 외부 동작은 필요한 출처/버전을 확인하고 로컬 사실은 직접 읽는다. 범위 밖 발견은 권고만 보고하며 승인되지 않은 대안을 구현으로 확정하지 않는다.

## Alignment

조사 verdict는 Aligned / Approved Design Change / Design Change Required / Blocked이며 Task 실행 Alignment와 구분한다. 앞의 둘은 기존 정본 안 또는 실제 승인 근거가 있는 접근이다. 뒤의 둘은 필요한 설계 문제를 해소하기 전 제품 구현을 진행하지 않는다.

설계 변경 필요라는 조사 결론만으로 조사 목표 달성을 부정하거나 구현을 승인하지 않는다. 정본 권한은 [Authority](project-profile.md#authority), 완료 의미는 공통 규약을 따른다.

## Reference Sync

새 확정 결론이 이전 분석을 대체하면 날짜/이유와 superseded 근거를 보존한다. 청사진 의미 변경의 Revision/증거 재평가는 [Task Fields](conventions.md#task-fields)를 따른다. reference 갱신으로 정본을 임의 재작성하지 않는다.

실제 확인 조건·수정 범위가 부족하면 필요한 다음 조사를 남긴다. 재현 불가만으로 명확한 등록을 막지 않으며 단독 reference는 다른 단계·완료를 자동 수행하지 않는다.
