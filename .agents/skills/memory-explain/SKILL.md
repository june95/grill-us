---
name: memory-explain
description: Explain recorded designs, plans, progress, and completed work from .memory and relevant code or Git evidence. Use for explanation, decision rationale, plan-versus-result comparisons, and explanatory handover requests. Explain only; do not change records, code, or Git state.
---

# Memory Explain

기존 결정·계획·진행·완료 결과를 관련 근거로 설명한다. 기본 출력은 간결한 채팅이며, 기록의 설명과 작업 실행을 구분한다. [공통 규약](../memory-execute/references/conventions.md)의 필드·상태와 [프로젝트 확인](../memory-execute/references/project-profile.md)의 정본 우선순위를 읽기 재사용한다. 실행 workflow와 보고·이력 작성 의무를 설명 호출에 적용하지 않는다.

## Inputs

- 대상(선택): Plan/Phase/Task/decision 경로·ID·주제.
- 관점(선택): 전체, 이유, 계획 대비 결과, 변경 전후, 관계·의존성, 검증.
- 깊이(선택): 짧게, 일반, 비개발자, 개발자 상세.

자연어와 `/memory-explain`, 지원 도구의 `$memory-explain`은 에이전트 요청 형식이며 터미널 CLI나 별도 parser가 아니다. 인수인계 **설명**은 포함하지만 다른 에이전트에게 실제 작업을 위임·전송하는 요청은 이 스킬의 실행 범위가 아니다.

## Resolve Target

1. 사용자가 명시한 대상이 최우선이다. 비활성·완료 Task도 그 자료를 읽으며 current로 전환하지 않는다. Task 번호가 중복되면 Plan/Phase/경로로 구분한다.
2. 대상이 없으면 대화 주제와 `.memory/current.md`의 실제 Active Task/Plan을 확인한다. 활성 작업이 없고 완료 결과를 묻는다면 Last Completed Task와 대응하는 실제 Task·보고를 읽는다. 완료 Plan 링크가 남아 있다는 사실을 활성 실행으로 해석하지 않는다.
   Last Completed Task의 Plan/Task·확인한 commit 또는 no-commit 사유·evidence와 Checkpoint 링크는 활성 위치와 구분한다. 과거 포인터에 이 항목이 없거나 없음이면 관련 Task/보고로 확인 가능한 사실만 설명하고 가짜 완료 정보나 state 경로를 채우지 않는다. 결정은 Plan ID와 같은 파일명을 가정하지 않고 실제 링크의 독립 Decision ID로 읽는다.
3. 여러 후보가 실제로 모호하면 짧은 후보와 필요한 질문 하나를 제시한다. 경로가 없거나 대상이 없으면 확인한 사실과 필요한 대상 정보를 알린다. 가짜 작업·경로·기록을 만들거나 다른 Plan을 활성화하지 않는다.
4. 대상과 연결된 자료만 필요한 깊이로 읽는다. 작은 질문에 전체 `.memory`·Git 이력을 조사하거나 모든 설명 항목을 출력하지 않는다. 관련 파일 검색은 이름·ID·주제 범위로 좁힌다.

## Evidence

| 자료 | 설명에 사용하는 근거 |
| :--- | :--- |
| Plan / Phase | 목표·분할·순서·의존 관계의 요약. 집계와 실제 Task 상태가 다르면 차이를 설명 |
| task.md | 상세 계약·Acceptance Criteria·Implementation·실제 Task/Workflow 상태의 정본 |
| decision / Decision Summary / Change Log | Chosen·Rationale·Confirmation과 변경 이유. 기록된 선택과 추론을 구분 |
| 실행 보고 | 실제 수행 범위·결과·검증 당시 Revision/snapshot·관련 환경·한계 |
| 코드 / Git | 필요한 현재 구현 또는 특정 시점 변경의 읽기 근거. 기록된 실행 의도와 실제 tree를 구분 |

- 중요한 주장 가까이에 실제 자료의 경로·섹션/심볼 또는 확인한 commit을 연결한다. 관련 근거가 없으면 확인 불가로, 논리적으로 추정한 내용은 추론이라고 명시한다. 기록되지 않은 대안·기각 이유를 과거 검토 사실로 만들지 않는다.
- 계획 대비 결과는 Acceptance/Implementation과 보고·코드·commit을 대응하여 일치·변경·미확인 및 기록된 이유를 설명한다. 현재 코드 drift를 과거 의도나 실패로 곧바로 단정하지 않는다.
- 변경 전후를 비교할 때 실제 이전 코드·문서·commit이 있어야 한다. 없으면 현재 확인한 내용과 비교 불가 범위를 밝힌다. 관련 작업·의존 관계도 실제 링크·Dependencies 근거가 있을 때만 포함한다.
- 검증 보고는 당시 command/cwd/실제 result와 범위를 확인한다. 현재 유효성을 주장할 필요가 있을 때만 Revision·covered snapshot·관련 환경을 읽기 비교한다. 환경 기록 부재는 그 한계를 설명하며 현재 값을 과거 값으로 간주하지 않는다. 설명을 위해 테스트를 새로 실행하지 않는다.
- 누락·stale·충돌이 있어도 근거 있는 목표·설계·과거 결과는 설명할 수 있다. 해당 불확실성이 제한하는 주장만 표시한다. 과거 결과나 status를 새로 passed/blocked/stale로 써넣지 않는다.

## Explain by State

Task Status(`pending / in_progress / blocked / done`)와 Workflow Status(`pending / running / passed / skipped / failed / blocked / stale`)는 다르다. `ready`는 완료 정책 처리 준비 판정이며, auto+Task 범위 변경이 있으면 커밋 가능 의미도 포함하지만 `done`은 아니다. 단계 passed가 전체 Task 완료나 현재 제품 정상 동작을 뜻하지 않는다.

조사 Task는 보고의 Observed Result와 Objective Assessment를 읽고 실제 검사 결과와 사전 조사 목표 달성을 구분한다. 조사 완료와 함께 테스트 실패가 보고될 수 있으며 이를 검사 통과로 설명하지 않는다. 통과가 목표인데 실패한 경우나 필수 근거가 부족한 경우를 정상 완료로 단정하지 않는다. auto라도 Task 범위 변경이 없어 커밋을 생략한 정상 완료가 가능하다. 다른 사용자 변경이 남아 있다는 사실과 해당 Task의 커밋 필요 여부도 구분하며 설명 중 상태·보고를 수정하지 않는다.

| 상태 | 설명할 내용 | 단정하지 않을 내용 |
| :--- | :--- | :--- |
| 계획됨 / pending | 목표·확정 동작·이유, 필요한 순서·의존성, 완료 조건·예정 검증 | 구현·검증이 이미 성공했다는 주장 |
| in_progress | 실제 유효한 완료 단계·현재 위치·남은 작업. 구현 존재와 검증 결과 분리 | 파일 존재나 과거 passed만으로 현재 검증 성공 |
| blocked | 기록된 차단 원인·영향·다음 행동, 확인 가능한 진행 범위 | 원인 해소, failed/stale의 skipped 전환 |
| done | 실제 변경·사용법, 당시 검증·한계, 확인한 commit 또는 명시 no-commit/변경 없음 완료 근거 | done 표기만으로 실제 구현·현재 정상 동작·테스트 성공 |

완료 작업은 필요에 맞게 당시 보고·commit과 현재 코드를 대조한다. 현재 확인하지 않았다면 그 사실을 짧게 밝히고 당시 결과로 한정한다. 명시 no-commit 또는 실제 Git 변경 없음의 정상 완료를 커밋 실패로 해석하지 않는다. 반대로 prepared intent나 commit hash 문자열만으로 성공을 확정하지 않는다. 의도·tree·집계 불일치가 보이면 관찰과 영향만 설명하고 복구는 별도 memory-execute 요청으로 연결한다.

## Explanation Depth

목표와 결론을 먼저 말하고 필요한 이유·근거를 이어 설명한다. 기본은 일반·간결이며 다음 내용을 요청에 맞게 선택한다.

- 짧게: 무엇을 위한 작업인지, 현재 상태/결과, 핵심 이유와 필요한 한계.
- 비개발자: 사용자가 보게 될 동작·달라지는 점·가치. 내부 필드·경로 나열은 필요한 근거 링크로 줄인다.
- 개발자 상세: 관련 path::symbol, 처리 흐름·계약, 계획 대비 변경, 검증 범위·한계, 인수인계에 필요한 의존 관계.
- 이유/비교: 기록된 선택과 근거를 먼저 설명하고, 실제 변경 전후와 검증 범위를 자료가 있을 때 덧붙인다.

작은 질문에 모든 상태·검증 표를 형식상 출력하지 않는다. 설명과 함께 새 설계 선택이 필요해져도 이미 확정한 선택을 다시 묻거나 설명 중 자동으로 재설계하지 않는다.

## Boundaries

- 설명만 하는 호출은 읽기 전용이다. `.memory` 보고/일일 이력 append, 계획·상태·Revision 갱신, current/checkpoint 전환·복구, 새 Task 등록, 코드 수정, 테스트 실행, staging/commit/push를 하지 않는다. 읽기 도구로 자료를 확인하며 부수 효과가 있는 실행 명령을 설명 검증에 사용하지 않는다.
- 발견·차이·권고는 채팅에 남긴다. 실제 변경 요청이 별도로 있으면 등록은 memory-intake, 설계 결정은 grill-me, 계획은 memory-plan, 구현·재개·복구는 memory-execute의 해당 범위로 연결한다. 권고 자체를 실행 승인으로 보지 않는다.
- 설명 때문에 과거 계약·보고·snapshot을 고치지 않는다. 기존 사용자 제품 변경·index와 활성 위치를 보존한다. 비밀·토큰·민감한 원문은 설명에 노출하지 않는다.
- 기본 출력은 채팅이다. 사용자가 명시적으로 HTML 시각화를 요청한 경우만 [visualize](../visualize/SKILL.md)를 별도로 적용해 요청한 산출물을 만든다. 산출물은 기본적으로 저장소 밖에 두어 Git working/index 상태를 보존한다. 저장소 안 경로가 별도로 요청되었다면 해당 파일 생성 범위만 별도 변경 요청으로 구분한다. 다른 스킬을 적용해도 memory/current/checkpoint·과거 보고·history를 변경하거나 staging/commit하지 않는다.

## Examples

```text
$memory-explain 현재 계획을 짧게 설명해줘
$memory-explain 마지막으로 완료한 작업은 무엇이 바뀌었어?
memory-explain 이 Task에서 그 설계를 선택한 이유를 설명해줘
memory-explain 이 Plan의 계획과 실제 구현 차이를 알려줘
memory-explain 이 완료 Task를 비개발자가 이해하게 요약해줘
memory-explain 이 Task를 개발자에게 인수인계할 수 있게 흐름과 검증 한계를 설명해줘
memory-explain 이 Plan의 의존 관계를 visualize로 HTML 도식으로 만들어줘
```

상황별 경계 확인에는 [시나리오](references/scenarios.md)를 사용한다. 매 설명마다 이 사례 전체를 읽거나 실행할 필요는 없다.
