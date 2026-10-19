# Task Testing

test가 적용되거나 요청됐을 때만 읽는다. [공통 규약](conventions.md)과 [Validation Discovery](project-profile.md#validation-discovery)를 사용한다.

## Discovery

- 사전 AC·현재 구현·finding과 실제 suite/fixture/명령을 확인한다. 해당 검사에 필요한 [Environment Evidence](conventions.md#environment-evidence)를 실행 전에 읽고 기록한다.
- 적용 선행 구현/리뷰는 유효한 evidence가 필요하다. review 생략은 실제 이유·Task 근거로 판단하며 파일 부재만으로 차단하지 않는다. 단독 test는 부족한 선행 단계를 자동 실행하지 않는다.

## Coverage

[Investigation Outcomes](conventions.md#investigation-outcomes)에 따라 검사 통과 목표와 결과 조사 목표를 구분한다. 각 AC/회귀 위험에 방법을 연결하고 유효 결과는 재사용한다.

새 테스트는 의미 있는 오류/회귀를 검출할 때 기존 suite에 추가하며 .memory에 제품 harness를 만들지 않는다. 새/변경 테스트가 review에 영향을 주면 내용을 실제 재리뷰해야 한다. 단독 test는 review stale·대상·다음 행동만 남기고 검토하지 않은 snapshot을 passed로 갱신하지 않는다.

## Levels

| Level | 선택 기준 |
| :--- | :--- |
| Static / Basic | 관련 typecheck/lint/build/import 또는 문서·링크·구문 |
| Unit | 변경 동작·예외·회귀를 좁게 입증 |
| Integration | 구성 요소·API·서비스 경계 영향 |
| E2E | 전체 흐름 확인이 필요하고 안전한 로컬 tooling 존재 |

위험과 AC를 입증하는 최소 수준을 선택한다. 단계 이름 때문에 충분한 검사를 반복/확대하지 않으며 새 변경·실패·미해결 위험만 추가 확인한다.

## UI Evidence

명시 UI 상태의 캡처가 필요한 test 담당은 현재 호스트 capability가 있을 때 [page-capture](../../page-capture/SKILL.md)를 적용할 수 있다. 실제 PNG와 같은 basename의 정제된 JSON, 화면/viewport/준비·조작·한계를 읽어 Task의 검증 근거에 연결한다. 저장된 이미지를 열어 실제 상태를 확인하며 이미지나 metadata 존재만으로 제품 테스트 통과를 선언하지 않는다.

직접 capture는 요청 산출만 쓰고, test.md·Task/current/history 기록은 기존 실행 담당이 맡는다. browser/PNG 저장 수단 부재·준비/조작/저장 실패와 시각적 finding을 구분한다. PNG가 없는 경우 정적 검사로 실제 캡처 성공을 대체하지 않는다. 독립 review/explain에게 증거를 읽으라고 전달한 것을 재캡처 권한으로 해석하지 않는다.

## Failures

- 제품 실패·setup 실패·환경 blocker·생략을 구분하고 하위 실패가 막는 검사는 Blocked로 남긴다. 독립 확인은 계속할 수 있다.
- 단독 test는 제품 결함을 보고한다. 전체 Task도 사전 scope에 수정이 있을 때만 구현으로 돌아가며 조사 전용은 대상 결함/권고만 남긴다.
- 파괴적 setup·production 변경·불명확한 credential은 평범한 로컬 검증으로 실행하지 않는다. 실제 승인/안전한 입력을 확인하고 비밀을 노출하지 않는다.
- 필수 검증이 불가하면 한계·AC 영향·가까운 대체 확인을 기록한다. 대체로 AC를 충족하지 못하면 blocked를 유지한다. 실패 후 목표를 완화해 완료하지 않는다.

## Evidence

test.md의 Pass / Pass with Issues / Fail / Blocked는 해당 목적의 결과다. [Stage Report](templates.md#stage-report)에 AC coverage·새/변경 테스트·실제 command/cwd/exit·제약·다음 행동을 기록한다. 조사 목적에는 관측 실패와 Objective Assessment를 함께 표시해 검사 통과로 오해하지 않게 한다.

증거/환경 재사용은 [Evidence and Completion](conventions.md#evidence-and-completion), test-only의 review stale·포인터 보존은 [Stage Isolation](conventions.md#stage-isolation)을 따른다. 실제 명령·수동 대조·모델 실행을 구분하며 test passed만으로 Task done/commit/전진하지 않는다.
