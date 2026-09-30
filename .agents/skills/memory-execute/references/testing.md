# Task Testing

test 단계가 적용되거나 사용자가 요청한 경우에 읽는다. [프로젝트 확인](project-profile.md), [공통 규약](conventions.md), [보고 템플릿](templates.md)을 사용한다.

## Discovery

- Task 완료 조건·검증 의무·현재 구현·해결된 finding과 실제 테스트 구조를 확인한다.
- manifest·CI·README의 command/cwd, 근접 suite·fixture·이름을 따른다. 특정 앱 디렉터리나 테스트 프레임워크를 강제하지 않는다.
- 적용되는 선행 구현·리뷰의 유효 evidence가 필요하다. review가 해당 없음이면 승인된 생략 이유와 Task 내 근거를 읽으며 review.md 부재만으로 차단하지 않는다.
- 필요한 선행 증거가 실제 부족하면 test report에 blocker를 기록한다. 단독 test 요청에서 선행 구현·리뷰를 자동 수행하지 않는다.

## Coverage

- 각 완료 조건·회귀 위험을 검증 방법과 연결한다. 유효한 기존 결과가 있으면 재사용한다.
- 새로운 테스트가 의미 있게 오류·회귀를 잡을 때 기존 프로젝트 suite에 추가한다. 구현을 그대로 반복하는 검사나 불필요한 대형 suite를 만들지 않는다.
- 제품 실행 테스트를 Task 문서 폴더의 새 harness로 옮기지 않는다. Task 폴더에는 보고·비실행 증거만 둔다.
- test 단계에서 테스트를 작성하면 그 파일도 Task 변경에 포함한다. 관련 review snapshot을 갱신하고 실제 테스트 내용을 필요한 범위에서 재검토한다.

## Levels

| Level | Selection |
| :--- | :--- |
| Static / Basic | 관련 typecheck/lint/build/import/문서·링크·구문 확인 |
| Unit | 변경 동작·예외·회귀를 좁게 입증하는 기존/필요한 새 테스트 |
| Integration | 실제 구성 요소·API·서비스 경계가 영향을 받는 경우 |
| E2E | 전체 사용자 흐름의 확인이 필요하고 안전한 로컬 tooling이 있는 경우 |

변경 위험과 완료 조건에 맞는 수준을 선택한다. 이미 충분한 검증을 단계 이름 때문에 확대·반복하지 않는다. 새 변경·실패·미해결 위험이 생기면 필요한 확인을 추가한다.

## Failures

- 제품 실패, 테스트 설정 실패, 환경 blocker, 의도적 생략을 구분한다. 필수 실패를 생략으로 바꿔 완료하지 않는다.
- 하위 실패가 막는 상위 검사는 Blocked로 기록하고 독립적으로 가능한 확인은 수행할 수 있다.
- 단독 test 단계에서는 제품 결함을 보고하고 구현을 자동 수정하지 않는다. 전체 Task 모드에서는 범위 안 수정 단계로 돌아가 영향받은 검증을 갱신한다.
- 파괴적 setup·production 변경·불명확한 credential 사용을 평범한 로컬 검증으로 실행하지 않는다. 실제 필요한 승인·안전한 입력 경로를 확인한다. 비밀 값을 보고나 채팅에 남기지 않는다.
- 필수 검증을 실행할 수 없으면 실제 한계·영향·가장 가까운 대체 확인을 기록한다. 대체가 완료 조건을 충족하지 못하면 blocked 상태를 유지한다.

## Evidence

test.md에 `Pass / Pass with Issues / Fail / Blocked`, 완료 조건별 coverage, 새·수정 테스트 파일, command/cwd/실제 exit/result, 생략·환경 제약, 다음 행동을 적는다.

- 수행한 범위의 Revision·Covered Files·Source Snapshot·Checked At을 기록한다.
- 수동 walkthrough·실제 command 실행·자동 모델/제품 테스트를 구분한다. 예시 command나 예정 결과를 실행한 성공처럼 쓰지 않는다.
- test passed는 Task done·commit·포인터 전진을 의미하지 않는다. 전체 완료는 공통 판정과 실행 모드에 따른다.
