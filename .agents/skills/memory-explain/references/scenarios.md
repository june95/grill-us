# Memory Explain Scenarios

[설명 스킬](../SKILL.md)의 판단 경계를 확인하는 지침 사례다. 아래 입력은 실제 실행 결과가 아니며 가상 상태를 current로 활성화하지 않는다. 사례별 관찰은 이 스킬을 구현·검증하는 Task 보고에 기록한다. 설명만 하는 호출에는 보고·history를 작성하지 않는다.

| Case | 입력 | 읽을 근거 | 예상 설명 | 금지할 부작용 / 한계 |
| :--- | :--- | :--- | :--- | :--- |
| X01 | pending Plan을 설명해줘 | Plan/Phase, task Goal·Implementation·Dependencies·AC | 목표·확정 동작·순서·예정 검증 | 구현/테스트 완료 단정, Task 활성화 금지 |
| X02 | 진행 중 어디까지 됐어? | Task Workflow·Resume Stage와 해당 보고 snapshot | 실제 완료 단계·현재 위치·남은 일, 구현과 검증 분리 | passed 표기만으로 현재 성공 단정, 포인터 이동 금지 |
| X03 | blocked 작업이 왜 막혔어? | Task Blocker, 실패/stale 보고, Next Action | 원인·영향·기록된 재개 행동 | 테스트 재실행, blocker 해소나 skipped로 기록 금지 |
| X04 | done Task와 현재 코드가 달라 | 당시 보고/commit과 현재 관련 코드 | 당시 변경·검증과 현재 drift를 구분 | 과거 done 증거 수정, 현재 정상 동작 단정 금지 |
| X05 | 커밋 없는 done은 실패야? | Commit Policy·Completion Check·명시 none/실제 변경 없음 근거 | 정상 no-commit 완료인지 실제 실패인지 구분 | 빈 commit 생성, commit 없음만으로 실패 단정 금지 |
| X06 | 검증 근거가 누락되거나 stale | 관련 보고 Revision/snapshot/환경과 현재 필요한 읽기 근거 | 확인한 사실·검증 시점·미확인 범위 | 새 테스트 실행, 결과/과거 환경 추정, 상태 쓰기 금지 |
| X07 | 왜 그 대안을 선택했어? 이유 기록 없음 | decision, Decision Summary, Change Log | 기록된 선택과 확인 불가 이유; 추론이면 명시 | 없는 대안·회의·기각 근거를 과거 사실로 창작 금지 |
| X08 | 비활성 또는 완료 Task 경로 명시 | 명시 Task 및 관련 근거만 | 명시 대상 설명; current는 그대로 | 다른 Task 활성화, 불필요한 전체 이력 탐색 금지 |
| X09 | T01이 여러 개 또는 경로 없음 | 대화·current·해당 경로 존재, 필요한 후보 | 모호하면 후보와 질문 하나, 누락이면 사실 설명 | 가짜 Task/경로 생성, 임의 선택·등록 금지 |
| X10 | 활성 작업 없이 마지막 결과 질문 | current Last Completed Task와 실제 Task/report | 마지막 완료 결과·당시 근거 | 완료 Plan 링크를 현재 실행으로 오인 금지 |
| X11 | 비개발자 요약/개발자 인수인계·전후 비교 | 요청 깊이에 필요한 계약·코드·이전 commit | 사용자 동작 또는 path::symbol/흐름·관계·검증 한계 | 이전 자료 없을 때 전후 추측, 실제 위임/전송 금지 |
| X12 | 설명 또는 명시적 HTML 도식 요청 | 관련 기록, HTML 요청이면 기존 visualize | 기본 채팅; 명시 요청일 때만 별도 HTML 산출물 | 자동 visualize, memory/history/current·Git 변경 금지 |
| X13 | ready 또는 prepared intent와 집계 충돌 | Task Completion Check·intent, 필요한 실제 Git tree | ready와 done 구분, 불일치 영향·별도 복구 권고 | intent를 성공으로 추정, 자동 finalize/복구 금지 |

## Decision Search Cases

[Decision Fields](../../memory-execute/references/conventions.md#decision-fields)와 [Decision Search](../SKILL.md#decision-search)를 함께 대조한다. 다음은 의미 검토용 입력이며 실제 모델 실행 결과가 아니다.

| Case | 입력 / 근거 | 예상 설명 | 금지할 부작용 / 한계 |
| :--- | :--- | :--- | :--- |
| D01 | 새 결정의 Chosen/Rationale/Confirmation과 구체적인 Applies to, 재검토 조건 없음 | 적용 범위를 명시하고 Revisit When 없이도 유효한 작성으로 설명 | 빈 필드·가상 재검토 조건 추가 금지 |
| D02 | 명시 Decision ID 또는 Plan/Task가 연결한 문서의 `## D02. 제목` | 명시 문서/연결을 먼저 읽고 문서ID+DNN·선택·이유·적용 범위·출처 제시 | current 활성 Task를 대신 설명하거나 전체 memory 검색 금지 |
| D03 | 아래 구형 `## D01 제목` / Why, Applies to 없음 | Why를 기록된 이유로 읽고 적용 범위는 미기록으로 표시 | 형식 변환·새 필드 쓰기·전역 적용 추정 금지 |
| D04 | SKU 재고 같은 주제·모듈 요청, 명시 링크 없음 | 확인한 작업공간 decisions의 파일 목록/literal 검색 후 후보 본문과 적용 조건 확인 | cache·다른 프로젝트 검색, 새 색인 DB·검색 보고 저장 금지 |
| D05 | 서로 다른 결정 문서의 같은 D01 | 각 문서/Decision ID+D01로 구별해 후보 설명. 실제 대상 선택이 모호할 때만 질문 하나 | 번호만으로 병합하거나 최근 날짜만으로 선택 금지 |
| D06 | 같은 상황에 상충하는 두 결정, 대체 근거 없음 | 각 선택·출처·연결 Plan·적용 조건과 미해결 충돌 설명 | 검색 순위로 정본 선정·결정 수정·자동 인터뷰 시작 금지 |
| D07 | 나중 결정이 이전 결정을 특정 조건에서 대체한다고 명시 | 원문 대체 근거와 그 조건 안에서의 적용 관계를 설명 | 날짜만의 대체 추정, 조건 밖까지 전역 적용 금지 |
| D08 | 검색 범위 안 일치 후보 없음 / 디렉터리 부재 / 읽기 실패 | 확인한 범위·검색어·없음 또는 접근 한계를 각각 구분 | 검색 실패를 결정 부재로 단정, Task 자동 등록 금지 |
| D09 | 선택은 있지만 이유 없음, 또는 범위는 있지만 현재 적용 불명 | 이유 미기록과 현재 적용 미확인을 구분해 출처와 설명 | 기각 대안·이유·조건 창작, 상태/원문 보정 금지 |
| D10 | rg 미제공 / 현재 cwd가 plugin cache | 호스트 파일 도구로 같은 decisions 범위 탐색 / 실제 사용자 root 확인 후 검색 | 도구 설치·cache에 기록 생성·알려진 root 반복 조사 금지 |
| D11 | 구체적 Applies to와 실제 Revisit When이 기록된 후보 | 두 필드를 원문 근거와 함께 설명; 조건 충족 여부는 별도 확인 | 선택 필드의 존재만으로 조건 충족이나 결정 폐기 단정 금지 |

구형 호환 읽기용 가상 원문이다. 사용자 파일로 저장하거나 현재 결정으로 등록하지 않는다.

~~~markdown
## D01 재고 단위
- Chosen: SKU별 재고
- Why: 색상·사이즈별 품절을 독립적으로 처리하기 위해서.
~~~

현재 교육용 결정의 강조된 Chosen/Rationale 필드도 같은 의미로 읽는다. 과거 파일에서 Applies to·Confirmation·ID metadata가 없으면 누락 사실을 말하고 실제 파일 경로와 DNN으로 출처를 식별한다.

## Change Inventory Cases

아래 수치는 가상 입력의 예상 결과이며 현재 프로젝트의 실행 결과가 아니다. [공통 집계](../../memory-execute/references/project-profile.md#change-inventory)를 따른다.

| Case | 입력 | 예상 설명 | 금지/한계 |
| :--- | :--- | :--- | :--- |
| X20 | untracked 폴더 안 71개와 HTML 2개, tracked/index 변경 없음 | working 0/staged 0/untracked 73,전체 73 | 짧은 status 3줄을 3파일 또는 변경 없음으로 설명하지 않음 |
| X21 | 같은 경로에 index와 worktree 변경이 모두 있음 | working 1/staged 1,전체 1 | 범주 합을 전체 수로 쓰지 않음 |
| X22 | staged rename/copy,공백·한글·개행 경로 | NUL 쌍의 대상 경로 1개와 이전 경로 보조 표시 | 공백/줄/화살표로 이름을 분해하지 않음; 실제 OS 지원 범위와 합성 framing 검증 구분 |
| X23 | Git 부재/명령 거부/출력 잘림 | 전체 집계 미확인 또는 부분 확인과 원 오류 | 변경 0/가짜 repo 생성/설정 수정으로 덮지 않음 |
| X24 | Task done과 현재 untracked 참고 자료가 함께 있음 | Task 당시 완료 근거와 현재 변경 범주·귀속을 각각 설명 | untracked를 작성 주체/현재 Task 증거로 단정하거나 done을 되돌리지 않음 |

## Walkthrough Method

상태/증거/완료 의미는 [공통 규약](../../memory-execute/references/conventions.md#rule-ownership), 설명 자체의 읽기 경계·깊이·근거 선택은 [설명 스킬](../SKILL.md#boundaries)이 소유한다. 아래 사례는 정본과 소비 지침의 대응을 대조하는 자료다.

1. 입력·읽을 근거·예상 설명·금지 부작용을 SKILL.md의 해당 절과 대조한다. 사실·기록된 의도·추론·미확인을 구분하는지 확인한다.
2. 실제 완료 Task를 자료로 쓸 때는 해당 task/report와 확인할 commit을 명시한다. 현재 구현과 당시 결과를 읽기 비교하며 기록을 수정하지 않는다. 가상 pending/blocked/no-commit 사례는 가상이라고 표시한다.
3. 읽기 대조 전후 current, 기존 checkpoint, 사용한 과거 Task/report의 명시 파일 hash 및 Git working/index 상태를 비교한다. 구현 Task 자체의 보고·상태 쓰기는 이 읽기 대조 구간 밖에서 수행한다.
4. 정적 frontmatter/링크 검사, 수동 walkthrough, 실제 모델 실행을 별개로 기록한다. 도구 검사나 문서 대조만으로 실제 모델 부작용 방지·제품 E2E 성공을 주장하지 않는다.
5. 결정 검색은 명시 결정/연결을 우선 읽고 부족할 때만 확인한 decisions 안을 탐색하는지 D01~D11과 대조한다. 현재 교육 예시·구형 가상 원문·상충/누락 사례를 구분한다. 실제 과거 결정을 읽는 구간은 해당 결정/current/checkpoint와 Git 상태를 전후 비교하고 검색 보고·새 결정을 작성하지 않는다.

## Limits

스킬은 에이전트용 문서이며 자동 상태 판독기나 실행 sandbox가 아니다. 기록이 오래되거나 없으면 확인 가능한 범위만 설명한다. 이 사례를 검증하려고 운영 current·제품·Git config에 실패 상태를 주입하거나 테스트를 실행하지 않는다. 실제 모델 행동 확인이 필요하면 별도 요청과 안전한 독립 환경이 필요하다.
