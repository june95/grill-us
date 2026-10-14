---
name: memory-explain
description: Find and explain recorded decisions, designs, plans, progress, and completed work from .memory and relevant code or Git evidence. Use for decision lookup by ID, topic or scope, rationale, plan-versus-result comparisons, and explanatory handover requests. Read only; do not change records, code, or Git state.
---

# Memory Explain

결정·계획·진행·완료 결과를 근거로 간결하게 설명한다. [공통 규약](../memory-execute/references/conventions.md)의 상태/증거 의미를 읽기 재사용하고 실행 workflow·보고/history 쓰기 의무를 적용하지 않는다.

## Inputs

선택적 대상(Plan/Phase/Task/decision 경로·ID·주제), 관점(전체/이유/차이/전후/관계/검증), 깊이(짧게/일반/비개발자/개발자 상세)를 받는다. 자연어·/memory-explain·지원 도구의 $memory-explain은 요청 표기이며 CLI가 아니다. 인수인계 설명은 포함하지만 실제 에이전트 위임·전송은 별도 요청이다.

결정 검색은 Decision ID, 문서와 DNN, 주제·키워드, 연결 Plan/Task, 적용 모듈·상황으로 요청할 수 있다. 별도 검색 스킬·CLI·색인 DB를 요구하지 않는다.

## Resolve Target

1. 명시 대상이 우선이다. 비활성/완료 Task도 그 자료를 읽으며 current로 전환하지 않는다. 중복 T 번호는 Plan/Phase/실제 경로로 구분한다.
2. 대상이 없으면 대화와 current의 실제 Active Task/Plan을 확인한다. 완료 설명은 [State Ownership](../memory-execute/references/conventions.md#state-ownership)의 Last Completed Task/Checkpoint와 실제 근거를 읽는다. 누락 항목은 확인 가능한 Task/보고로 한정하고 가짜 완료나 state 경로를 만들지 않는다. 결정은 실제 독립 ID 링크로 읽는다.
3. 모호하면 후보와 질문 하나, 대상/경로가 없으면 누락 사실과 필요한 정보를 알린다. 다른 Plan을 활성화하거나 전체 memory/Git 이력을 불필요하게 조사하지 않는다.

결정을 찾는 요청은 아래 Decision Search를 적용한다. 주제·키워드가 명시됐는데도 current의 활성 Task로 대상을 바꾸지 않는다. 이미 확인한 같은 작업공간·자료를 반복 조사하지 않는다.

## Decision Search

1. 명시 결정 경로/Decision ID 또는 Plan/Task에 실제로 연결된 결정을 먼저 읽는다. `D01`만으로 문서를 식별하지 않으며 같은 DNN은 문서/Decision ID와 함께 구분한다. 오래된 파일에 ID metadata가 없으면 실제 파일 경로를 출처로 쓰고 누락을 알린다.
2. 자료가 부족하면 [작업공간 경계](../memory-execute/references/project-profile.md#skill-installation-and-workspace)로 확인한 사용자 프로젝트의 `.memory/decisions` 안에서만 추가 후보를 찾는다. 설치/cache나 다른 프로젝트를 검색하지 않는다. 이미 확인한 root는 재사용하고 혼동될 때만 확인한다.
3. `rg`가 있으면 해당 디렉터리에 한정한 파일 목록과 literal 검색을 사용한다. ignored/hidden인 로컬 memory도 포함하도록 `rg --files --hidden --no-ignore -- .memory/decisions`, `rg -n -F --hidden --no-ignore -e '검색어' -- .memory/decisions`처럼 사용하며 실제 입력은 shell 인자로 안전하게 전달한다. 목록에서 파일명/ID를 찾고 본문에서 주제·적용 모듈·관련 표현을 좁혀 읽는다. `rg`가 없으면 호스트의 파일 목록·읽기·검색 도구로 같은 범위를 확인하며 설치하거나 별도 parser를 만들지 않는다.
4. 일치한 줄만으로 판정하지 않고 후보 결정의 제목·선택·이유·적용 조건과 관련 변경/대체 근거·Plan 연결을 읽는다. [Decision Fields](../memory-execute/references/conventions.md#decision-fields)의 현재/구형 제목·필드 호환 읽기를 적용한다. 적용 범위가 없으면 미기록으로 표시하고 전역 적용을 추정하지 않는다.
5. 후보별로 실제 문서/Decision ID와 DNN, 선택, 기록된 이유, 적용 범위, 재검토 조건(있을 때), 출처 링크를 채팅에 설명한다. 날짜·검색 점수만으로 정본을 고르지 않는다. 명시된 대체 관계가 있으면 그 근거와 적용 조건을 함께 제시하고 상충 결정은 병렬로 구분한다. 대상 선택이 실제로 모호할 때만 후보와 질문 하나를 제시한다.
6. 결과가 없으면 확인한 범위·검색어와 일치 후보 없음을 말한다. 파일/디렉터리 부재·읽기 실패·이유 미기록은 검색 결과 없음과 구분한다. 미확인 범위를 전체 결정 부재로 확대하지 않는다. 검색 결과나 보고서·history/current/checkpoint/결정을 저장하지 않고 테스트·위임·복구·Task 등록도 실행하지 않는다.

## Evidence

| 자료 | 설명 근거 |
| :--- | :--- |
| Plan / Phase | 전체 목표·분할·순서·의존 요약, 실제 Task와의 집계 차이 |
| task.md | 상세 계약·AC·Implementation·실제 상태 |
| decision / Decision Summary / Change Log | 문서/Decision ID·DNN별 선택·기록된 이유·확인·적용 범위·조건부 재검토·변경/대체 근거 |
| 실행 보고 | 당시 수행·검증 범위/환경·snapshot·한계 |
| 코드 / Git | 필요한 현재 구현 또는 특정 시점 변경, 실제 tree와 의도 구분 |

중요 주장 가까이에 실제 path/절/심볼·확인한 commit을 연결한다. 기록된 이유·선택과 추론/미확인을 구분하고 없는 대안·기각 이유를 창작하지 않는다. 계획 대비 결과는 AC/Implementation과 보고·코드·commit으로 일치/변경/미확인 및 기록된 이유를 대응한다.

전후 비교에는 실제 이전 자료가 필요하고 관계/Dependencies도 실제 링크가 있어야 한다. 현재 코드 drift를 과거 실패/의도로 단정하지 않는다. 현재 유효성을 주장할 때만 [증거·환경](../memory-execute/references/conventions.md#evidence-and-completion)을 읽기 비교하며 테스트를 새로 실행하지 않는다. 누락/stale/충돌은 제한하는 주장에만 한계를 밝히고 상태를 고치지 않는다.

## Explain by State

[Task Fields](../memory-execute/references/conventions.md#task-fields)와 [완료 의미](../memory-execute/references/conventions.md#evidence-and-completion)를 따른다. ready와 done, 단계 목적 달성과 제품 성공은 다르다. [Investigation Outcomes](../memory-execute/references/conventions.md#investigation-outcomes)에 따라 조사 완료와 관측 검사 실패를 함께 설명한다.

| 상태 | 설명할 내용 | 단정하지 않을 내용 |
| :--- | :--- | :--- |
| pending | 목표·확정 동작/이유·순서·AC·예정 검증 | 구현/검증 성공 |
| in_progress | 유효한 완료 단계·현재 위치·남은 일, 구현과 검증 분리 | 파일 존재만으로 현재 성공 |
| blocked | 차단 원인·영향·기록된 다음 행동 | 원인 해소/실패 생략 |
| done | 실제 변경·사용법·당시 검증/한계·commit 또는 no-commit 근거 | done만으로 현재 정상 동작 |

완료는 필요한 당시 보고/commit과 현재 코드로 대조한다. 현재 미확인이면 당시 결과로 한정하고, 정상 no-commit을 실패로 해석하지 않는다. prepared/hash 문자열만으로 성공을 확정하거나 불일치를 자동 복구하지 않고 별도 memory-execute 요청으로 연결한다.

리뷰 설명은 [Review Delegation](../memory-execute/references/review.md#review-delegation)의 실제 Review Mode·Reviewer·Attempt·Fallback Reason·Reviewed Snapshot·Limitations를 읽어 독립/자체 리뷰와 부분 결과를 구분한다. 기록이 없으면 미확인으로 한정하고 독립 검토를 추정하지 않는다. 실행 담당만 상태를 쓴다는 [State Ownership](../memory-execute/references/conventions.md#state-ownership)을 설명하되 설명 호출에서 리뷰 위임이나 상태 쓰기를 새로 수행하지 않는다.

## Explanation Depth

목표와 결론을 먼저 설명한다. 기본은 일반·간결, 비개발자는 사용자 동작/가치, 개발자 상세는 path::symbol·흐름/계약·검증 한계·의존 관계를 포함한다. 이유/비교는 기록된 근거를 우선하고 자료가 없는 비교는 제한한다. 작은 질문에 모든 항목을 출력하거나 설명 중 자동 재설계하지 않는다.

## Boundaries

설명 호출은 읽기 전용이다. memory/history/current/checkpoint·Revision·제품·Git 쓰기, 새 Task 등록, 테스트 실행, staging/commit/push·복구를 하지 않는다. 발견·차이·권고는 채팅에만 남기며 실제 변경 요청이면 적절한 기존 진입점으로 연결한다. 사용자 working/index와 과거 증거를 보존하고 비밀 원문을 노출하지 않는다.

결정 검색도 같은 경계를 따른다. 후보를 설명하기 위해 원문을 새 형식으로 변환하거나 적용 범위·재검토 조건을 추정해 채우지 않는다. 검색 결과가 불확실하다는 이유로 자동 인터뷰·새 결정 저장을 시작하지 않는다.

기본 출력은 채팅이다. 명시 HTML 요청만 [visualize](../visualize/SKILL.md)를 별도로 적용한다. 기본 산출물은 저장소 밖에 두고 저장소 안 경로가 명시되면 그 파일 생성 범위만 구분한다. 시각화 요청도 memory/과거 보고/history 변경이나 staging/commit 권한을 부여하지 않는다.

## Examples

~~~text
$memory-explain 현재 계획을 짧게 설명해줘
$memory-explain 마지막 완료 작업은 무엇이 바뀌었어?
memory-explain 설계를 선택한 이유와 계획 대비 결과를 알려줘
memory-explain 비개발자 요약 또는 개발자 인수인계용 흐름·검증 한계를 설명해줘
memory-explain 의존 관계를 visualize로 HTML 도식으로 만들어줘
memory-explain 상품 모듈의 SKU별 재고 결정을 찾아 이유와 적용 범위를 알려줘
memory-explain 2026-08-22-product-api 문서의 D02와 연결된 Plan을 설명해줘
~~~

[시나리오](references/scenarios.md)는 관련 경계를 확인할 때만 읽으며 매 호출 전체를 로드하지 않는다.
