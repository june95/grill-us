# Scoped Implementation

implementation 단계에 필요한 지침이다. 상세 구현 계약은 현재 Task의 task.md이고 결과는 같은 폴더의 implementation.md에 둔다. [공통 규약](conventions.md)과 [증거·재개](resume.md)를 따른다.

## Preconditions

- Task의 scope, 완료 조건, 구현 단위, Dependencies, Alignment가 실행 가능한지 확인한다. 선행 Task는 실제 done이어야 한다.
- Compliant 또는 승인 근거가 있는 Approved Design Change만 구현한다. 실제 정본을 바꾸는 경우 필요한 design-guide-update 증거가 있어야 한다.
- 적용되지 않은 reference나 guide 보고서 부재를 일률적인 blocker로 만들지 않는다. 필요한 계약 근거가 실제로 없거나 충돌할 때 차단한다.
- 같은 Plan의 후속 Task를 모두 구현해야 현재 Task를 리뷰할 수 있다는 aggregate gate를 사용하지 않는다.
- 제품 변경 전 기존 사용자 working/index 변경을 확인하고 보존한다.

## Scope

1. 현재 Task를 in_progress로 기록하고 필요한 단계만 running으로 표시한다. 지정된 파일·호출부·근접 테스트와 관례를 필요한 만큼 읽는다.
2. 구현 단위에 대응하는 최소 변경을 수행한다. 계획 밖 기능·의존성 변경·범위 밖 정리를 추가하지 않는다.
3. 파일 위치·기존 심볼 차이처럼 목표·동작을 유지하는 조정은 청사진과 결과 기록을 갱신한다. 의미 있는 계약 변경이면 Revision을 증가시키고 영향을 받는 evidence를 재평가한다.
4. 사용자 동작·완료 조건·API·권한·데이터의 새로운 선택이 필요하면 필요한 질문만 한다. 이미 승인된 계약을 구현하는 일은 승인받지 않은 새로운 계약 변경과 구분한다.
5. 단계 단독 implementation 요청도 같은 scope를 따른다. 구현·최소 검증·결과 기록 후 다른 workflow나 commit·pointer advance를 자동 수행하지 않는다.

## Comments

- 새 함수 또는 의미 있게 바뀐 함수의 목적이 불명확하면 함수 위에 짧은 주석/docstring을 추가·갱신한다.
- 중요한 인자·반환·부수 효과를 설명하며 명백한 대입이나 함수 이름을 반복하지 않는다. 기존 프로젝트의 JSDoc/docstring 관례를 따른다.
- 한국어 설명과 보고를 기본으로 하되 사용자 지시와 프로젝트 언어 관례를 우선한다. 식별자·타입·프로토콜·annotation tag는 원래 표기를 유지한다.
- 단순 문서 변경에 함수 주석을 강제하거나 untouched 함수를 주석만으로 광범위하게 바꾸지 않는다.

## Verification

- 사전 작업 목표를 기준으로 [관측 결과와 목표 평가](conventions.md#investigation-outcomes)를 구분한다. 구현/통과 목표의 검증 실패를 조사 완료로 재해석하지 않는다. 순수 조사 Task는 implementation 단계 없이 적용 reference/test 및 공통 완료 판정으로 구성할 수 있다.
- 청사진에 지정된 command/cwd와 완료 조건을 확인한다. 명령이 없으면 [프로젝트 구조](project-profile.md)에서 가장 작은 관련 검증을 찾아 근거와 함께 기록한다.
- 실행 전 실제 cwd와 관련 도구·설정을 확인하고 실제 command·exit/result·검증 대상·한계를 적는다. [Environment Evidence](conventions.md#environment-evidence)에 관련 버전·설정 근거를 기록하고 동일 Revision·snapshot 및 환경 변경 영향까지 확인한 유효 결과는 재사용한다.
- 범위 안 구현 결함은 수정하고 영향받은 검증을 반복한다. 같은 실패에 새 근거 없는 수정만 반복하지 않는다. 환경·서비스·credential blocker는 원인과 다음 행동을 기록하고 멈춘다.
- 변경된 구현·테스트·공유 문서는 관련 기존 review/test/guide 증거를 stale로 만들 수 있다. 영향받은 대상만 갱신한다.

## Progress

- implementation.md에는 구현 단위별 무엇·왜, 실제 파일·짧은 핵심 설명, 주석 변화, 검증, 계획 조정·승인, 남은 일을 적는다. [Stage Report](templates.md)의 증거 필드를 사용한다.
- 체크리스트는 실제 완료·검증한 항목만 표시한다. implementation passed는 Task done과 다르다.
- 실패·차단은 해당 stage 및 Task에 원인을 기록한다. 다른 단계의 blocker를 임의로 지우지 않는다.
- 범위 밖 발견은 영향·권장 조치만 보고하고 사용자 지시 전에 구현 또는 후속 Task 생성을 확대하지 않는다.
