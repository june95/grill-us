# Canonical Guide Synchronization

design-guide-update 또는 guide-update가 실제 필요하거나 요청된 경우에 읽는다. [프로젝트 확인](project-profile.md)으로 정본과 권한을 찾고 [공통 규약](conventions.md), [보고 형식](templates.md)을 따른다.

## Authority

- 공유 설계·API·데이터·권한·운영 가이드는 실제 프로젝트의 정본이다. Task 체크리스트·파일 목록·개인 진행·테스트 로그를 그곳에 저장하지 않는다.
- 실제 정본 경로·우선순위·소유자 규칙을 확인한다. 특정 문서 번호·기술·Worker 담당자를 공통 필수 전제로 만들지 않는다.
- 현재 구현이 정본과 다르면 불일치로 기록한다. 구현을 정당화하려고 문서를 임의로 바꾸지 않는다.
- 생성물·외부 원본·과거 기록은 변경 대상인지 확인하고 승인 없이 재작성하지 않는다.

## Design Mode

1. 변경할 공유 계약의 승인 증거와 정확한 영향 범위를 확인한다. 일반 구현 선택이 기반 설계 변경까지 승인한 것은 아니다.
2. 영향받는 실제 schema·DTO·오류·상태·권한·route·운영 절차와 정본 목록을 작성한다. 적용되는 항목만 사용한다.
3. 의존 제품 구현 전에 필요한 정본·계약을 최소 수정하고 관련 링크·이름·필드·상태·승인 범위를 확인한다.
4. 승인·정본·소유자 조건이 부족하면 가이드를 수정하지 않고 Blocked와 필요한 결정·자료를 기록한다.

design-guide-update.md에는 승인 근거, 영향 계약·문서, 변경·미변경 이유, 실제 확인, 남은 불일치를 기록한다. 결과는 `Updated / No Changes / Needs Changes / Blocked`로 표현한다.

## Implementation Mode

- 현재 구현과 완료 조건의 유효 검증 근거를 읽는다. test가 해당 없음이면 Task 내 대체 근거를 확인하며 test.md 부재를 자동 blocker로 만들지 않는다.
- current-scope unresolved Critical/High 또는 실제 계약 충돌이 있으면 구현 또는 승인된 설계 변경으로 돌려보낸다.
- README·사용법·설정·운영 절차가 실제 바뀌었을 때만 갱신한다. 구현했다는 사실만으로 설계 문서를 다시 쓰지 않는다.
- 필요한 가장 작은 수정 뒤 링크·필드·command/cwd·설정·이름을 확인한다. 문서 diff도 Task scope와 snapshot에 포함한다.
- 가이드 변경으로 앞선 review/test가 영향을 받으면 관련 문서 확인·검증만 갱신한다. 전체 테스트를 근거 없이 반복하지 않는다.
- 단독 guide 요청에서 제품 코드를 수정하지 않는다. 구현 결함은 해당 단계로 반환한다.

guide-update.md에 검증 근거, 실제 정본별 영향·갱신 필요, 변경·미변경 내용, 결과·충돌·다음 행동을 기록한다. 결과는 `Updated / No Changes / Needs Changes / Blocked`다.

## No Changes

- 기존 계약을 그대로 구현했고 공유 사용법이 바뀌지 않았다면 정본 수정은 기본적으로 불필요하다.
- 단계가 해당 없음이면 workflow 표에 이유만 남기고 빈 guide 보고서를 생성하지 않는다.
- 실제로 단계 검토를 수행했으나 수정이 필요 없었다면 No Changes 보고는 허용한다. '검토하지 않음'을 No Changes의 검증 완료로 표현하지 않는다.
- report가 있을 때 Revision·Covered Files·Source Snapshot·Checked At·검증·한계를 기록한다. 문서를 변경하지 않아도 검토한 구현 대상의 evidence는 명시한다.
