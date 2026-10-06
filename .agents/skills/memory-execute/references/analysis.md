# Task Analysis

reference 단계가 실제 필요하거나 요청된 경우에 읽는다. 이미 충분한 조사·확정 결정이 있으면 Task에 근거를 연결하고 같은 조사를 반복하지 않는다. 경로와 보고 형식은 [공통 규약](conventions.md), [프로젝트 확인](project-profile.md), [템플릿](templates.md)을 따른다.

## Problem

- Task의 요청 결과, 현재 현상, 재현 조건, 완료 조건과 scope를 구분한다. 증상과 원인을 같은 것으로 단정하지 않는다.
- 관련 코드·설정·테스트·기존 이슈·정본을 먼저 읽는다. 원하는 동작이 명확한 버그는 구현 원인을 조사하고 사용자에게 원인을 추측하게 요구하지 않는다.
- 실제 필요한 재현 정보가 없으면 누락 정보 하나를 묻는다. 중요한 동작·계약 분기는 한 질문씩 추천안을 포함하여 확인한다.
- 프로젝트에서 사용하는 용어·패턴을 우선한다. 이 단계에서는 제품 코드나 공유 가이드를 수정하지 않는다.
- 버그는 [Bug Investigation](conventions.md#bug-investigation)의 입력·절차/실제 command·cwd·기대/실제 결과·시도/출처·확인 시각을 정리한다. Reproduction Status와 Cause Confidence는 독립적으로 선택하고, 코드 사실·미확정 후보·관련 path::symbol·환경·한계·다음 검증을 대응한다. 사용자의 자료와 직접 실행한 관찰을 구분한다.

## Evidence

reference.md에 다음을 기록한다.

| Item | Content |
| :--- | :--- |
| Source / Outcome | 원 요청·기존 이슈·기대 결과·완료 조건 |
| Current Context | 관련 파일·심볼·흐름·프로젝트 제약 |
| Findings | 확인된 사실·가설을 구분한 근거와 영향 |
| Options | 현재 계약 안의 권장안, 의미 있는 대안과 이유 |
| Verification | 실제로 입증할 조건과 검증 경로 |
| Open Questions | scope·동작·데이터·순서에 영향을 주는 미결정 |

- 불확실하거나 버전 민감한 외부 동작을 확인해야 할 때만 해당 자료를 조사하고 출처·버전·관련 사실을 남긴다. 로컬에서 확인되는 사실은 직접 읽는다.
- [Stage Report](templates.md)의 Revision·Covered Files·Source Snapshot·시각·결과·다음 행동을 포함한다.
- Task 밖 문제는 별도 발견 사항으로 보고한다. 아직 승인되지 않은 설계 대안을 권장 구현으로 확정하지 않는다.

## Alignment

reference의 정합성은 `Aligned / Approved Design Change / Design Change Required / Blocked`로 표현할 수 있다. Task의 실행 Alignment와 구분한다.

- Aligned는 현재 정본 안의 접근이다. Task의 Compliant를 뒷받침한다.
- Approved Design Change는 명시 승인과 영향 계약·정본 목록이 있는 경우다. 필요한 design-guide-update는 의존 구현 전에 완료해야 한다.
- Design Change Required 또는 Blocked이면 그 문제를 해소하기 전에 제품 구현을 진행하지 않는다. 일반 구현 옵션의 확인을 새로운 기반 설계 변경 승인으로 과대 해석하지 않는다.
- 현재 코드의 drift·외부 best practice·미확정 가정으로 정본과 blocker를 덮어쓰지 않는다. 특정 예시 문서가 없는 것과 실제 필요한 정본이 누락된 것을 구분한다.

## Reference Sync

- 확정된 계획·scope·검증 선택이 reference를 대체하면 해당 결론을 갱신하고 변경 이유·날짜를 적는다. 유용한 과거 분석은 보존하거나 superseded로 표시한다.
- 청사진의 의미 있는 변경은 Blueprint Revision과 Change Log에 반영하고 관련 evidence를 재평가한다. 미확정 가정을 confirmed 결정으로 기록하지 않는다.
- reference 동기화를 정본 가이드 재작성으로 사용하지 않는다. 설계 변경은 별도 승인된 가이드 단계에서 처리한다.
- 실제 동작·scope·원인 확인 조건·검증 경로가 부족하여 실행 가능한 청사진을 만들 수 없으면 그 부족분과 가장 작은 다음 조사·질문을 기록한다.

실행 재현을 하지 않은 코드 조사나 재현 불가 자체는 명확한 버그 등록의 blocker가 아니다. 원하는 동작·scope·완료 조건·검증 경로가 충분하면 확인되지 않은 원인은 그대로 기록하고 원인 확인을 첫 실행 단위로 계획한다. 확인할 근거/조건·그 결과에 따른 수정 범위가 실제로 정해지지 않아 실행 가능한 청사진을 만들 수 없을 때만 그 부족분을 차단 사유로 남긴다. 일반 기능·문서 조사에는 버그 표를 강제하지 않는다.
