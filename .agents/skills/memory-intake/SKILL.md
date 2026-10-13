---
name: memory-intake
description: Register a clear change, bug, or issue as a .memory task without implementation. Use for task intake and 이슈 등록; route material unresolved design choices to grill-me.
---

# Memory Intake

명확한 요청을 코드 근거와 함께 기존/새 Plan에 등록한다. 등록은 완결된 실행 청사진 생성까지 포함하며 제품 구현·staging·commit은 하지 않는다. 전역 task-* 출력 규칙을 호출하지 않는다.

## Input

명확한 수정 내용, 버그·이슈 설명, 기존 Plan/Task 경로, 선택적 우선 처리 지시를 받는다. Type·tracker·초기 상태를 추론할 수 있으면 다시 묻지 않는다. 외부 이슈 등록·메시지 전송은 이 스킬의 작업이 아니다.

## Inspect

1. [프로젝트 확인](../memory-execute/references/project-profile.md)으로 대상·정본·테스트 구조를 찾고 current, 기존 Plan·Phase·Task, 필요한 코드를 읽는다.
2. [분석 지침](../memory-execute/references/analysis.md)으로 요청 Source, 실제 현상·기대 결과, scope, 완료 조건, 검증 경로를 확인한다.
3. 원하는 동작이 명확하지만 버그 원인이 모르면 코드 조사부터 한다. 재현에 필요한 정보가 실제 부족할 때만 누락 정보 하나를 질문한다. 원인을 사용자에게 추측하게 요구하지 않는다.
4. 사용자 선택·확인된 코드 사실·미확정 가정을 구분한다. 기존 결정·조사를 재사용하고 승인이나 테스트 성공을 만들어내지 않는다.
5. 버그는 [Bug Investigation](../memory-execute/references/conventions.md#bug-investigation)에 따라 최소 입력·안전한 절차/실제 command와 cwd, 기대/실제 결과, 시도·관찰 주체·출처·확인 시각을 정리한다. 확인한 관련 환경과 원인 후보 path::symbol, Reproduction Status·Cause Confidence·한계·다음 검증을 연결한다. 기존 재현 명령도 제품·테스트·공유 문서·설정/index를 변경하는 경우 등록 단계에서 실행하지 않는다.

실제 목표 현상을 관찰한 근거가 있어야 `reproduced`이며, 원인 후보를 구분한 근거가 있어야 `confirmed`다. 코드만 조사했으면 `code_only`와 해당 원인 근거 수준을 사용하고, 시도했으나 현상이 없으면 `not_reproduced`, 환경·자료·안전한 절차가 부족하면 `unavailable`로 기록한다. 두 축을 독립적으로 판단하며 관찰하지 않은 성공/실패를 채우지 않는다.

## Clarity Gate

- scope·동작·완료 조건·검증 경로가 충분하면 확정 요청과 코드 근거를 planning 입력으로 사용한다. decisions 파일을 형식상 강제하지 않는다.
- 동작·권한·데이터·API·rollout 등 중요한 미결정이 남으면 조사 결과와 그 항목만 [grill-me](../grill-me/SKILL.md)에 연결한다. 질문은 하나씩 2~3개 선택지·추천안을 제시한다.
- 미결정이 해소되기 전에 executable Task를 확정하지 않는다. 기본 추천안을 사용자가 선택한 것으로 기록하지 않는다.
- 원인 미확정이나 재현 불가만으로 명확한 버그 등록을 막지 않는다. scope·완료 조건·검증 경로가 충분하면 한계와 원인 확인을 첫 실행 단위로 계획하고, 확인 결과에 따른 수정 범위·중요 계약 변경 경계를 적는다. 동작 선택이 실제 부족한 경우에는 기존 인터뷰 규칙을 따른다.

## Placement

- 기존 Plan의 Goal·Scope·Source·관련 파일과 현재 결과를 비교한다. 같은 미완료 요청은 기존 Task를 재사용한다. done 요청의 결과가 현재도 충족되면 완료 기록을 안내하며 중복 생성하지 않는다. 재발·새 변경·추가 수정이 필요하면 과거 done 계약·증거를 보존하고 새 T로 등록한다.
- 같은 목표의 수정·후속 작업은 해당 Phase에 새 T를 추가하고, 독립 목표는 새 Plan/P01/T01로 만든다. 단순히 파일 하나가 겹친다는 이유로 별개 목표를 같은 Plan에 넣지 않는다.
- 여러 후보 중 배치가 실제 완료·순서를 바꾼다면 필요한 선택 하나를 묻는다. 명시한 Plan이 있으면 우선하되 scope 충돌은 확인한다.
- 기존 계약 변경은 이미 명시된 사용자 지시와 범위를 확인하고 누락된 결정만 질문한다. completed Task의 과거 계약을 재작성하지 않고 새 T로 추적한다.

## Registration

분석·기존 테스트 실행 자체를 목표로 하는 요청도 독립 Task로 등록할 수 있다. 사전 Goal/AC에 조사·결과 분류의 산출물과 필요한 근거·한계를 적고 원인 확정/검사 통과 목표와 구분한다. Type만으로 성공·커밋 생략을 정하지 않으며, 조사 요청을 제품 수정·후속 자동 등록으로 확대하지 않는다.

1. [memory-plan](../memory-plan/SKILL.md)의 공통 계획 절차로 Plan·Phase·folder/task.md를 생성한다. 관련 문서 번호는 그대로 두고 Phase의 기존 최대 T 번호 다음을 사용한다.
2. 신규 Plan은 생성일 YYYY-MM-DD-feature ID를 사용한다. 기존 Plan에 추가하면 ID·날짜를 유지한다. 같은 날짜 slug 충돌은 기존 의미를 확인하고 다른 요청에는 구별되는 이름을 쓴다.
3. [공통 규약](../memory-execute/references/conventions.md)의 상세 작업(구현 또는 조사/검증 절차)·Dependencies·workflow·완료 조건·검증 경로를 작성한다. 커밋 대상이 없으면 Commit Message는 해당 없음과 이유로 기록하며, 공유 변경을 계획하면 실제 메시지를 적는다. stub만 남기고 실행하게 만들지 않는다.
4. 상세 조사 기록이 필요한 경우에만 reference.md를 만들고, 이미 충분한 근거는 Task와 결정 링크로 재사용한다. 해당 없음 단계의 빈 보고서는 생성하지 않는다.
5. 새 버그 Task는 [조건부 템플릿](../memory-execute/references/templates.md#task)의 Bug Investigation에 조사 결과를 보존한다. nonbug에는 빈 버그 표를 만들지 않고, 이미 완료된 Task에는 소급 추가하지 않는다. 수정 전 실패/수정 후 기대 동작을 입증할 회귀 검증 경로를 적되 제품 수정·새 테스트 작성은 실행 단계에 둔다.

## Activation

- current의 실제 Task·stage·status와 checkpoint를 확인한다. placeholder·누락 링크·명확한 완료 상태는 정상적인 활성 작업으로 간주하지 않는다. 손상된 진행 링크가 실제 작업을 가리켰다는 근거가 있으면 먼저 복구하고 덮어쓰지 않는다.
- active 작업이 있으면 새 Task pending으로 등록하고 current와 기존 checkpoint Position을 그대로 둔다. 같은 활성 Plan에 append해도 active T와 재개 stage는 유지한다.
- active 작업이 없으면 첫 실행 가능한 새 T를 활성화한다. 의존성이 미완료인 T를 억지로 active로 만들지 않는다.
- 우선 처리 지시가 있으면 [재개 규약](../memory-execute/references/resume.md)에 따라 old Task 위치·stage·blocker·next step을 먼저 보존한 뒤 new pointer를 쓴다.
- 등록·포인터 쓰기 전에 최신 current를 다시 확인한다. 등록 중 활성 위치가 달라졌으면 새 위치를 보존하며 배치를 재평가한다. 진행 정보를 먼저 삭제하지 않는다.

## Report

Plan/Phase/Task 링크, 배치·분할 이유, 적용 workflow, 질문/확정 근거, 활성화 여부와 다음 행동을 설명한다. [memory-execute](../memory-execute/SKILL.md) 실행이 다음 단계임을 안내한다.

버그 등록 보고에는 실제 재현 수준·원인 확신과 확인 한계·다음 검증을 짧게 포함한다. 예: "코드 조사만 수행(code_only), 후보는 직접 코드 근거 있음(supported); 실행 재현은 미확인, 첫 단위에서 기존 검증 명령으로 확인." 이 예시는 실제 실행 결과가 아니며 실제 근거에 맞게 바꾼다.

작업 이력은 .memory/history/YYYY-MM-DD.md에 간단히 남긴다. planner가 같은 생성 결과를 기록했다면 intake는 별도의 배치·활성화 판단이 있을 때만 요약을 추가한다. scope 밖 발견은 사실·영향·권고만 보고하고 임의로 등록·구현하지 않는다.
