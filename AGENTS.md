# Project Memory Workflow Rules

작업 기록은 .memory에 두고 프로젝트 스킬의 공통 계약을 따른다. 명확한 요청의 등록과 설계 인터뷰를 구분하며, 계획·등록 단계에서는 제품 구현을 하지 않는다.

## Entry Points

| Request | Skill | Outcome |
| :--- | :--- | :--- |
| 명확한 수정·버그·이슈 등록 | [memory-intake](.agents/skills/memory-intake/SKILL.md) | 코드 조사 후 기존/새 Plan에 실행 가능한 Task 등록 |
| 설계 검토·중요한 미결정 | [grill-me](.agents/skills/grill-me/SKILL.md) | 한 질문씩 결정 확정·근거 보존 |
| 확정 결정·요청의 작업 분할 | [memory-plan](.agents/skills/memory-plan/SKILL.md) | Plan → Phase → Task 청사진 생성 |
| 현재 작업·지정 단계 실행 | [memory-execute](.agents/skills/memory-execute/SKILL.md) | 적용 단계 실행·검증·완료 판정·재개 |
| 설계·계획·진행·완료 결과 설명 | [memory-explain](.agents/skills/memory-explain/SKILL.md) | 관련 기록·코드·Git 근거를 읽고 이유·상태·결과 설명 |

필요한 진입점으로 시작한다. 모든 요청에 인터뷰를 강제하지 않는다. 실제 미결정이 생기면 한 질문씩 2~3개 선택지와 Recommended를 제시하고, 코드에서 확인할 내용이나 확정된 선택은 다시 묻지 않는다.

memory-explain은 기존 네 작업 진입점을 보조하는 설명 전용 진입점이다. 설명만 하는 호출에서는 `.memory` 보고·일일 이력 작성 의무를 적용하지 않으며 기록·current·checkpoint·제품·Git 상태를 변경하거나 테스트를 실행하지 않는다. 상태 불일치나 미해결 commit intent는 사실·영향·권고를 채팅에 설명하고 복구는 별도 실행 요청으로 연결한다. 과거 완료 근거와 현재 코드 상태를 구분하며 기록을 수정해 일치시키지 않는다.

## Planning and Registration

1. 요청·코드·실제 정본의 근거로 scope, 완료 조건, 검증 경로를 확인한다. 특정 프로젝트 문서·테스트 경로·이슈 tracker를 강제하지 않는다.
2. 관련 목표의 기존 Plan에는 해당 Phase의 새 T를 추가하고 독립 목표는 새 Plan을 만든다. 동일 미완료 요청은 재사용하되 완료 뒤 재발·추가 수정은 과거 done 증거를 보존하며 새 T로 기록한다. 기존 계약을 바꾸는 중요한 미결정은 먼저 해소한다.
3. 일반 작업은 P01 하나를 기본으로 한다. 기존 큰 작업의 plan-N 분할은 Phase 내 Task로 대응하며, 각 T는 독립적인 완료·검증 기준과 Dependencies를 가진다.
4. 상세 정본은 .memory/phases/{plan-id}/{phase}/{T-folder}/task.md다. 요청과 상세 계획을 별도 task/plan 문서에 중복 보관하지 않는다.
5. 청사진에 파일·심볼/문서 섹션, 타입·필드·실행 흐름 등 적용되는 상세 정보, 완료 조건, 실제 command/cwd, workflow 표, Plan/Phase/Task 커밋 메시지를 적는다.
6. AI가 단계별 필수/필요 시/해당 없음과 근거를 지정한다. 생략은 Task 표에 기록하고 실행한 단계만 보고서를 만든다. 등록·계획은 구현·staging·commit하지 않는다.

결정은 생성일·주제의 독립 Decision ID로 저장하고 Plan/Task에서 실제 문서를 링크한다. 여러 Plan이 같은 결정을 참조할 수 있으며 기존 파일명·링크를 이동·통합하지 않는다.

분석·기존 테스트 실행도 독립 Task로 계획할 수 있다. 사전 완료 조건에 결과 조사·분류가 목적인지, 원인 확정·테스트 통과가 목적인지 구분한다. 제품 구현과 커밋 메시지는 실제 적용될 때만 구체화한다.

## Active Work and Resume

- 등록만으로 기존 current나 활성 checkpoint Position을 바꾸지 않는다. 활성 작업이 없으면 실행 가능한 첫 Task를 활성화한다.
- 우선 처리 지시가 있으면 이전 Task의 재개 위치를 보존한 뒤 전환한다. completed Task의 과거 계약·증거를 조용히 수정하지 않고 후속 수정은 새 T로 기록한다.
- current는 활성 위치와 다음 행동, Task는 상세 상태의 정본이다. Phase/Plan 진행률은 실제 Task 상태에서 계산한다.
- current의 Checkpoint와 Last Completed Task는 활성 위치와 구분한다. 실제 보존 state·확인한 완료 근거 또는 없음/no-commit 사유를 기록하며 가짜 링크·SHA를 만들지 않는다.
- 이전 위치는 기존 Task·보고·Plan별 state로 보존하고 매 전환 archive 사본을 만들지 않는다. 성공 의도 초기화 전 완료 근거를 보존하며 미해결 prepared/failed는 덮어쓰지 않고 기존 사본은 유지한다.
- 기본 실행은 Task 하나다. 연속 실행은 요청한 범위를 따르며 다른 pending Plan을 임의로 시작하지 않는다.

## Execution and Commit

1. 새 실행 전에 Task의 Dependencies·승인·기존 intent를 확인한다. 성공한 같은 commit이 있으면 실제 tree를 검증하고 누락된 finalize만 복구한다.
2. 선택한 workflow만 수행한다. 필수 실패·차단·stale 증거를 생략으로 덮지 않는다. 대상 변경 뒤 영향받은 evidence를 갱신한다.
3. 공통 점검으로 선행 적용 단계·완료 조건·최종 품질·Git 경계를 확인한다. 별도 final-review.md는 모든 커밋의 필수 파일이 아니다.
4. ready 뒤 명시 후보·prepared intent로 commit하고 성공 또는 명시 no-commit 완료 정책을 확인한 뒤 Task done → Phase/Plan → current를 갱신한다. 실패하면 현재 Task에 머무른다.
5. --stage review/test/commit-check 등은 요청 단계만 수행한다. 부족한 선행 단계를 자동 실행하거나 Task를 자동 완료·전진하지 않는다. commit-check만은 코드 수정·staging·commit도 하지 않는다.
6. 비활성 Task의 단독 단계는 해당 결과만 갱신하고 active Position을 보존한다. 범위 안 구현 조정은 기록하며 진행하고 중요한 사용자 동작·계약 변경은 확인한다.
7. unrelated 사용자 변경·index를 보존한다. 제품 테스트와 공유 가이드는 기존 프로젝트 위치에 두며 자동 push·외부 메시지를 수행하지 않는다.

모든 전체 Task는 완료 조건·유효 근거·공통 품질을 확인한 뒤 커밋 정책을 처리하고 done으로 판정한다. ready는 이 정책 처리 준비 상태다. auto라도 Task 범위의 Git 변경이 없으면 사유를 남기고 빈 커밋 없이 완료할 수 있으며, unrelated 변경은 그대로 보존한다. 단독 단계/check_only는 자동 완료하지 않는다.

조사 목적 Task는 실제 검사 실패와 조사 목표 달성을 별도로 기록한다. 사전 조사 목표를 충족하면 관측 실패를 보존한 채 완료 가능하지만, 통과 목표의 실패나 필수 조사 근거 부족에는 적용하지 않는다. 실패 후 목표를 완화하거나 failed/stale를 숨겨 완료하지 않는다. 발견 사항의 자동 수정·추가 등록도 하지 않는다.

## Local Storage and Shared References

- .memory는 특별한 명시 공유 예외가 없으면 Git에서 제외한다. 기존 tracked memory의 index 해제는 승인 범위에서 로컬 파일을 보존하여 처리한다. force-add하지 않는다.
- [공통 규약](.agents/skills/memory-execute/references/conventions.md): 필드·상태·경로·증거·범위·이력.
- [템플릿](.agents/skills/memory-execute/references/templates.md): 청사진·현황·포인터·보고 형식.
- [프로젝트 확인](.agents/skills/memory-execute/references/project-profile.md): 선택적 프로필과 실제 구조 탐색.
- [커밋 점검](.agents/skills/memory-execute/references/commit-check.md): 품질 판정·명시 후보·Git intent.
- [재개](.agents/skills/memory-execute/references/resume.md): checkpoint·stale·실패·성공 후 복구.

실행 보고에는 무엇·왜, 검증과 한계, commit·다음 행동, 범위 밖 발견을 간결히 설명한다. 발견이 없으면 특이사항 없음으로 적는다.
