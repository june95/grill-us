# Project Memory Shared Conventions

Project Memory의 인터뷰, 등록, 계획, 실행이 공유하는 계약이다. 상세 문서 형식은 [templates.md](templates.md), 프로젝트 확인은 [project-profile.md](project-profile.md), 완료·Git 판정은 [commit-check.md](commit-check.md), 재개는 [resume.md](resume.md)를 따른다. 전역 task-* 스킬이나 특정 프로젝트의 문서·폴더를 실행 의존성으로 두지 않는다.

## Rule Ownership

같은 규칙의 상세는 아래 소유 문서 한곳에서 관리한다. 소비 스킬·단계는 고유 절차와 핵심 경계 요약을 남기고 해당 anchor로 연결한다. 형식 예시·시나리오는 이 계약을 설명하는 자료이며 별도 동작 계약을 만들지 않는다.

| 공통 규칙 | 상세 소유자 | 소비자가 남길 요약 |
| :--- | :--- | :--- |
| ID·로컬 경로·상태·활성 위치 | [Paths](#paths), [Task Fields](#task-fields), [State Ownership](#state-ownership) | 실제 대상과 현재/마지막 완료를 구분, 사용자 위치 보존 |
| 등록·분할·확정 선택 | [Registration and Planning](#registration-and-planning), [Change Boundaries](#change-boundaries) | 계획/등록 구현 금지, 미결정만 질문 |
| 단계 선택·단독 실행 경계 | [Workflow](#workflow), [Stage Isolation](#stage-isolation) | 요청한 단계만 수행, 자동 완료/전진 금지 |
| 증거·완료·조사 결과·환경 영향 | [Evidence and Completion](#evidence-and-completion), [Investigation Outcomes](#investigation-outcomes), [Environment Evidence](#environment-evidence) | 실패/stale 보존, 검사 결과와 목적 판정 구분 |
| 보고 의미·일일 이력 | [Reporting](#reporting), [History](#history) | 실제 수행·근거·한계만 보고 |
| 문서 형식 | [templates.md](templates.md#stage-report) | 적용 필드만 실제 자료로 채움 |
| 리뷰 위임·자체 리뷰·finding 처리 | [Review Delegation](review.md#review-delegation) | 적용 review만 기본 위임, 불가 알림·자체 리뷰, finding 보존 |
| 프로젝트·정본·명령 발견 | [project-profile.md](project-profile.md#discovery) | 실제 cwd/정본/명령 확인 |
| 계획의 공유 계약·구현 재량 | [Planning Boundaries](#planning-boundaries) | 공유 경계는 정확히, 내부 구현은 계약 안에서 선택 |
| 결정 작성·호환 읽기 | [Decision Fields](#decision-fields) | 새 결정의 적용 범위 필수, 실제 재검토 조건만 기록, 과거 기록 보존 |
| Git 품질·후보·ignore·staging·intent | [commit-check.md](commit-check.md#quality-gate), [Staging](commit-check.md#staging), [Commit Intent](commit-check.md#commit-intent) | Task 후보와 사용자 index 분리 |
| 재개·전환·복구 알고리즘 | [resume.md](resume.md#stale-evidence), [Switch](resume.md#switch), [Recovery](resume.md#recovery) | 미해결 intent 보존, 실제 결과 확인 후 재개 |

기본 읽기는 요청·존재하는 대상 Task/결정과 이 공통 규약이다. 실행·재개에는 현재 checkpoint와 resume을 확인하고, 선택한 단계의 지침만 추가한다. 형식 작성에는 해당 templates 섹션, 경로/정본/명령이 불명확하면 project-profile, 최종 품질·커밋에는 commit-check를 읽는다. 관련 없는 단계·시나리오 전체를 매번 로드하지 않으며 이미 확인한 같은 내용은 재사용한다.

## Paths

| 역할 | 저장 위치 |
| :--- | :--- |
| 확정 결정 | `.memory/decisions/{decision-id}.md` |
| 전체 로드맵 | `.memory/plans/{plan-id}.md` |
| Phase 현황 | `.memory/phases/{plan-id}/{phase-id}/phase.md` |
| Task 청사진 정본 | `.memory/phases/{plan-id}/{phase-id}/{task-folder}/task.md` |
| 실행한 단계 결과 | 해당 Task 폴더의 단계별 보고서 |
| 전역 활성 위치 | `.memory/current.md` |
| Plan별 재개·커밋 의도 | `.memory/state/{plan-id}.md` |
| 일일 이력 | `.memory/history/YYYY-MM-DD.md` |
| 선택적 프로젝트 설정 | `.memory/project.md` |

- Plan ID는 `YYYY-MM-DD-{slug}`, Phase ID는 `P01-{slug}`, Task 폴더는 `T01-{slug}` 형식이다. 날짜는 새 Plan 생성일이며 기존 Plan 추가 시 바꾸지 않는다.
- 같은 날짜·slug의 Plan ID가 있으면 기존 내용·목표를 먼저 확인한다. 같은 목표는 등록 규칙에 따라 연결/재사용하고 다른 신규 목표가 충돌하면 구별되는 ID를 선택한다. 기존 Plan 파일·ID를 새 요청으로 덮어쓰지 않는다.
- Decision ID는 결정 문서 생성일 기준 `YYYY-MM-DD-{topic}`이며 Plan ID와 독립적이다. Plan 생성 전 인터뷰나 기존 Plan의 후속 결정도 자체 ID를 유지한다. Plan/Task에서 실제 결정 문서를 링크하며 여러 Plan이 같은 결정을 참조할 수 있다. 같은 ID가 있으면 내용과 연결 범위를 먼저 확인하고, 기존 파일명·링크는 이동·통합·재번호하지 않는다.
- Task ID는 Plan 안에서 유일한 `P01-T01` 형식이다. 다른 Plan의 같은 Task ID는 Plan ID와 함께 식별한다.
- 새 커밋 메시지의 마지막 블록은 `Plan: {Plan ID}`, `Phase: {전체 Phase ID}`, `Task: {metadata Task ID}`다. 설명 본문은 이 블록보다 앞에 둔다. Task 폴더명과 Task ID를 구분하며, 과거 메시지의 호환 판정은 [재개 규약](resume.md#commit-message-identity)을 따른다.
- 일반 작업은 단일 Phase를 기본으로 하고 실행 단위는 Task로 나눈다. 큰 작업을 나눌 때 기존 plan-N의 역할은 Phase 내 T가 맡는다.
- task.md에 요청·완료 조건·상세 구현 계약을 함께 둔다. 동일 계약을 별도 Task plan.md 또는 plan-N.md에 복제하지 않는다.
- 보고서와 개인 진행 기록을 프로젝트 공유 설계 문서나 `.github` 작업 디렉터리에 추가하지 않는다. 제품 테스트와 공유 가이드는 해당 프로젝트의 기존 위치를 사용한다.
- 경로와 링크는 작성한 문서 기준 상대 경로를 사용한다. 보고서의 Covered Files는 저장소 기준 상대 경로다. 경로를 쓰기 전에 의도한 프로젝트 안인지 확인한다.
- 기본적으로 `.memory`는 로컬 관리한다. 명시적인 공유 예외는 실제 Git ignore 정책과 함께 확인하며 force-add로 우회하지 않는다.
- `.memory` 경로는 확인한 사용자 작업공간 root 기준이며 plugin 설치/cache 경로와 구분한다. 설치된 스킬·참고 문서는 읽기 전용이고 실제 작업공간 발견/미확인 시 질문은 [Skill Installation and Workspace](project-profile.md#skill-installation-and-workspace)를 따른다. cache 안에 상태를 만들지 않는다.

## Decision Fields

결정 문서는 [Paths](#paths)의 독립 Decision ID와 문서 안의 안정적인 `DNN`으로 식별한다. 새 항목은 `## D01. 제목` 형식으로 쓰며 기존 DNN·파일명·링크를 재번호하거나 다른 문서의 같은 DNN을 하나로 합치지 않는다. 선택·이유·확인 근거와 변경 이력을 보존한다.

| Field | 새 결정 작성 계약 |
| :--- | :--- |
| Chosen | 확정한 선택. 추천안·미답변·가정을 사용자 확정으로 쓰지 않음 |
| Rationale | 기록할 수 있는 이유와 관련 제약. 확인하지 못한 이유를 창작하지 않음 |
| Confirmation | 사용자 선택 / 사용자 명시 요청 / 코드 확인 사실을 구분한 실제 근거 |
| Applies to | 필수이며 비어 있지 않은 설명 문자열. 적용 기능·모듈·상황을 구체적으로 명시하고 프로젝트 전체 적용은 그 근거가 있을 때만 작성 |
| Revisit When | 선택 설명 문자열. 실제 재검토 조건이 있을 때만 작성하며 조건이 없으면 필드 자체를 생략. 빈값·가상 조건을 강제하지 않음 |

새 결정에 적용하며, 기존 결정의 명시 수정은 그 변경 범위에 한정한다. 과거 결정·완료 기록을 일괄 변환하거나 없던 적용 범위·확인 근거를 소급 채우지 않는다. 교육용 결정은 실제 사용자 확정과 구분하여 표시한다.

읽을 때는 현재 `## D01. 제목`과 구형 `## D01 제목`, `Rationale`/`Why`, 강조된 필드 표기 등 실제 표현을 의미에 따라 대응한다. 없는 필드는 **미기록**, 기록은 있으나 현재 적용을 확인하지 못한 경우는 **미확인**으로 구분한다. Applies to가 없다는 이유로 전역 적용을 추정하지 않으며 원문을 읽기 편한 형식으로 저장·변환하지 않는다.

검색 결과는 결정 문서/Decision ID와 DNN, 선택·기록된 이유·적용 범위·재검토 조건(있을 때) 및 실제 출처로 설명한다. 명시된 변경/대체 근거, 연결 Plan, 실제 적용 조건을 함께 대조하고 날짜·검색 순위만으로 정본을 선택하지 않는다. 상충·동일 DNN·누락을 구분하며 검색만으로 결정을 수정하거나 새로 확정하지 않는다. 탐색 순서와 무쓰기 절차는 [memory-explain](../../memory-explain/SKILL.md#decision-search)이 소유한다.

## Task Fields

템플릿의 heading과 metadata key를 유지한다. 다른 기존 문서의 `Depends On`은 Dependencies로 읽을 수 있지만 새 문서는 표준 필드를 사용한다.

| Field | Type / Allowed Values | Constraint |
| :--- | :--- | :--- |
| Plan ID | string | 날짜 접두어를 가진 기존 Plan 식별자 |
| Phase ID | string | `P{2자리}-{slug}` |
| Task ID | string | `P{2자리}-T{2자리}` |
| Plan Status | `pending / in_progress / blocked / done` | Phase·Task의 실제 완료 상태에 근거 |
| Task Status | `pending / in_progress / blocked / done` | heading `## Status: ...`; 준비 완료 판정과 구분 |
| Blueprint Revision | integer >= 1 | scope·구현 계약·완료 조건·검증 의무 변경 시 증가 |
| Type | string | 기능, 버그, 리팩터, 문서, 테스트, 조사, 작업 등; 가능한 값은 직접 추론 |
| Source | string 또는 경로·URL 목록 | 요청·이슈·확정 결정·근거; 외부 tracker는 선택적 |
| Dependencies | Task ID 또는 Task 링크 목록 | 없는 경우 `[]`; 선행 Task 완료 확인 |
| Project Guide Alignment | `Compliant / Approved Design Change / Blocked` | 승인된 설계 변경에는 승인 근거와 영향 정본 기록 |
| Commit Policy | `auto / none / check_only` | 기본 auto; 사용자의 명시적 지시 우선 |
| Stage | 아래 Stage enum | workflow에 단계별 1행 |
| Applicability | `필수 / 필요 시 / 해당 없음` | 적용 이유와 실제 발동 조건 기록 |
| Execution Status | `pending / running / passed / skipped / failed / blocked / stale` | 수행 결과와 적용 여부는 별개 |
| Reason / Trigger | string | 생략 근거·조건·판단 변경 이유 |
| Evidence | 보고서 상대 링크 또는 Task 내 기록 | 수행하지 않은 단계의 빈 파일은 만들지 않음 |
| Evidence Revision | integer 또는 없음 | 해당 증거가 검토한 청사진 Revision |
| Covered Files | repo-relative path 목록 | 실제 검토·검증 대상만; unrelated 파일 포함 금지 |
| Source Snapshot | path별 SHA256·missing·deleted 목록 | 내용 변경 감지; `.memory` 진행 파일 제외 |
| Checked At | ISO 8601 timestamp 또는 없음 | 실제 수행 시각 |
| Resume Stage | Stage enum 또는 없음 | 다음 실제 수행 단계 |
| Blocker | string 또는 없음 | 해결되지 않은 원인과 다음 행동 |

Revision은 계약의 버전이다. 단순 문구 정리, stage 상태·보고 기록·커밋 해시 갱신은 계약 변경이 아니면 증가시키지 않는다. scope 또는 검증 의무를 바꿨다면 Revision을 증가시키고 영향을 받는 증거를 다시 확인한다.

## Registration and Planning

- 관련 목표는 기존 Phase에 새 T, 독립 목표는 새 Plan으로 둔다. 파일 하나가 겹친다는 이유만으로 목표를 합치지 않는다. 동일 미완료 요청은 재사용하고, done 결과가 여전히 충족되면 안내한다. 완료 뒤 재발·추가 수정은 과거 근거를 보존하며 새 T로 기록한다.
- 명확함은 Source·동작·scope·완료 조건·검증 경로로 판단하며 decisions 문서를 형식상 강제하지 않는다. 중요한 동작/권한/API/데이터 결정만 인터뷰로 연결한다. 버그 원인 미확정·재현 불가 자체는 등록 차단이 아니지만 실제 조사/수정 조건이 불충분하면 그 부족분을 남긴다.
- 기본은 P01 하나와 독립 완료·검증 가능한 Task다. 서로 다른 도메인/마일스톤일 때만 Phase를 늘리고 단독 완료할 수 없는 미세 단위는 한 Task의 I01/I02로 묶는다. 후속 Task를 기다리는 aggregate gate나 의도적으로 깨진 구현을 다음 Task로 넘기지 않는다.
- 상세 정본은 task.md 하나다. 실제 path::symbol/문서 절·적용 타입/필드/흐름·AC·Dependencies·command/cwd·workflow·커밋 정책을 실행 가능한 수준으로 적는다. 조사/검증 절차도 Implementation에 쓸 수 있으며 적용되지 않는 API/DTO·버그 표를 강제하지 않는다.
- 분석·테스트 실행의 사전 Goal/AC는 조사·분류인지 원인 확정/검사 통과인지 구분한다. Type만으로 완료나 커밋 생략을 정하지 않는다. 계획/등록에서는 제품·테스트 코드·공유 정본·staging·commit을 변경하지 않는다.
- 등록만으로 기존 활성 위치를 바꾸지 않는다. 활성 없음이면 첫 실행 가능한 Task를 연결하고, 우선 처리 전환은 [Switch](resume.md#switch)의 기존 위치/의도 보존 절차를 따른다. 실제 시작 전 새 Task는 pending이다.

### Planning Boundaries

청사진은 실행자가 구조·공유 계약을 다시 결정하지 않고 구현할 수 있어야 한다. 공개 API, DTO·저장 형식, 공유 모듈의 책임과 인터페이스, 중요한 처리 순서·분기·오류·상태 정책, 완료 조건과 검증 경로를 정확히 정한다. 적용되는 필드·타입·기본값·nullable·관계를 추상적인 목표로 대체하지 않는다.

private helper의 이름·시그니처·함수 분할·변수 타입·동등한 내부 알고리즘은 공유 계약에 필수인 경우를 제외하고 실행자가 선택한다. Related Files에는 실제 파일·심볼/문서 섹션, 역할과 new/modify/read-only를 적되 함수 내부 코드를 계획서에 미리 재현하지 않는다. 계약을 만족하는 내부 선택을 새로운 설계 결정이나 계획 위반으로 취급하지 않는다.

새 Task는 `Constraints` 아래 `Must`와 `Must Not`에 그 작업의 책임·재사용·구체적인 금지 사항을 짧은 목록으로 작성한다. 적용할 제약이 없으면 `없음 — 이유`처럼 근거를 적고 빈 항목이나 전역 규칙의 반복으로 채우지 않는다. 새 파일·추상화는 기존 파일/심볼이 그 책임을 맡기 어려운 구체적인 이유를 남긴다. 가상의 미래 요구나 한 번 쓰는 wrapper 분리만으로 새 구조를 정당화하지 않는다. 실제 중복·복잡성을 줄이는 local helper는 허용한다.

검토는 승인된 계약 준수와 계획 자체의 불필요한 복잡성을 구분한다. 계획이 과설계를 요구한다면 계획 문제로 보고하며, 이를 이유로 실행자가 구조를 임의 변경하지 않는다. 중요한 계약 변경은 [Change Boundaries](#change-boundaries)를 따른다. 새 작성과 명시 수정 범위에 적용하며 과거 완료 Task·사용자 기록을 일괄 변환하지 않는다.

## Bug Investigation

버그 수정이 목적인 새 Task에만 `## Bug Investigation`을 작성한다. Type과 실제 요청·scope로 적용 여부를 판단하며, 일반 기능·문서 Task에는 빈 항목을 만들지 않는다. 완료된 Task나 과거 보고에 이 형식을 소급 추가하지 않는다.

| Field | Type / Allowed Values | 기록 기준 |
| :--- | :--- | :--- |
| Reproduction Status | `reproduced / not_reproduced / unavailable / code_only` | 아래 실제 시도·관찰 수준으로 선택; 성공 기본값 없음 |
| Minimal Input / Preconditions | string | 현상을 구분할 최소 입력·사전 상태; 민감한 값은 제거하거나 안전한 fixture 식별자로 대체 |
| Procedure / Command / Cwd | string | 안전한 절차 또는 실제 존재하는 command/cwd. 예정 방법과 실제 실행을 구분 |
| Expected Result | string | 사용자 기대 동작·완료 기준 |
| Actual Result | string | 실제 관찰·오류 또는 미실행. 발생하지 않은 성공/실패 로그를 생성하지 않음 |
| Attempt / Source | string | 시도 여부·관찰 주체·로그/사용자 자료/코드 출처. 사용자 제공 자료를 에이전트의 직접 실행으로 표현하지 않음 |
| Checked At | ISO 8601 timestamp | 근거를 확인한 시각. 원 관찰·실행 시각이 미상이면 추정하지 않고 구분 |
| Relevant Environment | string 또는 없음 | 확인한 관련 환경·버전만 기록; 미확인 값과 비밀 원문을 채우지 않음 |
| Cause Candidate / Code Location | string 또는 없음 | 원인 후보와 관련 실제 path::symbol/근거. 후보·위치를 확인하지 못하면 그 이유를 적고 경로를 만들지 않음. 복수 후보는 확신·근거를 각각 대응 |
| Cause Confidence | `confirmed / supported / hypothesis / unknown` | 재현 여부와 독립적으로 선택; 아래 근거 수준 적용 |
| Limitation / Next Verification | string | 재현·원인 확인 한계와 실행 시 확인할 방법·의무 |

Reproduction Status는 목표 버그의 관찰 수준이다.

- `reproduced`: 기록한 입력·절차에서 목표 현상이 실제 관찰되었다. 실행/관찰 출처와 적용 환경을 함께 적는다.
- `not_reproduced`: 절차를 실제로 시도했으나 목표 현상이 관찰되지 않았다. 이 결과만으로 버그가 없거나 해결됐다고 단정하지 않는다.
- `unavailable`: 환경·자료·안전한 절차 부족 등으로 목표 재현을 수행하거나 결과를 판단할 수 없다. setup 실패를 제품 버그 재현으로 기록하지 않는다.
- `code_only`: 실행 재현을 시도하지 않고 코드·설정만 조사했다. 직접 확인한 코드 사실과 실행에서 확인하지 못한 부분을 구분한다.

Cause Confidence는 기록한 원인 후보의 근거 수준이다.

- `confirmed`: 후보를 구분하는 재현/통제 확인으로 해당 원인을 입증했다. 버그 재현만으로 원인이 확정되는 것은 아니다.
- `supported`: 직접 코드·설정 근거가 있으나 후보를 구분하는 실행/통제 확인은 부족하다.
- `hypothesis`: 아직 확인되지 않은 가능성이다. 실제 근거와 추가 확인 방법을 적는다.
- `unknown`: 원인 후보를 지지할 근거가 부족하다.

이 값들은 Task Status·workflow 결과가 아니다. `reproduced`는 test passed나 `confirmed`를 뜻하지 않고, `unavailable`/`code_only`도 등록을 자동 차단하지 않는다. 동작·scope·완료 조건·검증 경로가 명확하면 한계를 남기고 원인 확인을 실행의 첫 단위로 계획할 수 있다. 특정 수정안을 단정할 근거가 없으면 실제 확인할 조건과 수정 범위·중요 계약 변경 경계를 적는다. 실행 완료 시에는 원래의 완료 조건과 필수 검증을 충족해야 한다.

조사 결과를 보완할 때 이전 후보·판단 근거는 Change Log 또는 관련 조사 기록에 보존한다. 상태·확신 관찰값 갱신만으로 Revision을 일괄 증가시키지 않으며 구현 계약·scope·검증 의무가 바뀌면 기존 Revision/evidence 규칙을 적용한다.

## Workflow

```text
reference → design-guide-update → implementation → review → review-action
→ test → guide-update → refactor → commit-check → commit
```

| Stage | 적용 판단 | 실행한 경우의 결과 |
| :--- | :--- | :--- |
| reference | 이미 충분한 결정·조사 근거가 있으면 생략 가능 | reference.md |
| design-guide-update | 승인된 정본 계약 변경이면 의존 구현 전에 수행 | design-guide-update.md |
| implementation | 코드·설정·문서 변경; 순수 조사에서는 생략 가능 | implementation.md |
| review | scope·위험·완료 조건에 맞게 지정 | review.md |
| review-action | actionable finding이 있으면 수행 | review-action.md |
| test | 완료 조건을 입증할 검증 수준에 맞게 지정 | test.md |
| guide-update | 검증된 사용법·공유 계약의 영향이 있을 때 | guide-update.md |
| refactor | 요청·실제 정리 필요성이 있을 때만 | 필요하면 final-review.md |
| commit-check | 커밋할 변경 또는 명시적 점검 요청에서는 필수 | task.md의 Completion Check |
| commit | auto 정책과 실제 Git 변경이 있을 때 | commit.md |

workflow 표는 `Stage | Applicability | Reason / Trigger | Status | Evidence` 열을 사용한다.

- 계획 단계에서 AI가 Applicability를 판단하고 이유를 적는다. 필요 시에는 발동 조건을 적는다. 실행 중 새 근거로 판단이 바뀌면 기록하고 사용자의 지시를 우선한다.
- 해당 없음은 이유를 적은 skipped로 초기화한다. 필수와 필요 시는 실행 전 pending이다.
- 필요 시는 실제 조건을 확인해 수행하거나 skipped와 사유로 정리한다. 조건 미평가 상태를 완료로 간주하지 않는다.
- 실패·환경 차단·오래된 증거를 skipped로 바꿔 미완료를 숨기지 않는다. 현재 완료 조건을 막는 finding은 후속 Task 등록만으로 해결되지 않는다.
- passed는 해당 단계의 사전 목적을 충족하고 유효한 Evidence Revision·Source Snapshot과 실제 근거가 있을 때만 사용한다. 검사 대상의 성공 여부와 단계 목적 달성은 아래 Investigation Outcomes에 따라 구분한다. 파일 존재만으로 passed를 만들지 않는다.
- 선행 조건은 이 Task에 적용되는 단계의 증거로 판단한다. 생략한 review.md/test.md/guide-update.md가 없다는 이유만으로 일률 차단하지 않는다.
- 커밋 전 점검은 **선행** 단계만 검사한다. commit-check 자신과 아직 수행 전인 commit의 passed를 미리 요구하지 않는다. Task done 판정은 점검 이후의 커밋 정책 결과까지 확인한다.
- final-review.md는 필수 공통 산출물이 아니다. 최종 품질 판정은 Task의 Completion Check에 기록한다. 의미 있는 리팩토링은 현재 Task 변경 표면과 동작 보존 범위에 한정한다.
- 보고서 자체 verdict와 workflow Status는 다른 의미다. Pass with Issues 등의 보고가 있으면 finding 처리와 완료 조건을 확인해 단계 passed 여부를 판단한다. 수행한 작업 자체의 Needs Changes/Fail/Blocked 또는 현재 완료 조건을 막는 미해결 Critical/High를 통과로 바꾸지 않는다. 조사 대상에서 관측한 실패는 조사 목적 달성과 별도로 보존한다.

### Stage Isolation

명시한 단계 선택이 우선이다. 독립 분석/테스트 Task 전체 실행은 완료 정책까지 수행하지만 기존 Task의 해당 단계만 요청하면 그 단계에서 끝낸다. 실제 의도가 모호할 때만 질문한다.

| 단독 단계 | 허용되는 결과 | 자동 수행하지 않는 일 |
| :--- | :--- | :--- |
| reference | 조사·분석 보고 | 제품/공유 정본 수정 |
| implementation/review-action/refactor | 승인 scope 변경과 최소 검증·보고 | 별도 단계나 커밋·완료·전진 |
| review | 검토 결과·해당 Task metadata | 제품 수정·review-action |
| test | scope 내 테스트 작성/실행·보고 | 선행 구현/리뷰·제품 결함 수정 |
| design-guide-update/guide-update | 요청 모드의 정본/사용 안내 | 제품 구현 |
| commit-check | 품질·후보·현재 index 읽기와 판정 | 코드 수정·staging·commit |
| commit | 유효한 선행 판정에 따른 후보 staging·intent·실제 commit | 부족한 증거를 만드는 전체 workflow |

모든 단독 단계/check_only는 Task done·포인터 전진을 자동 수행하지 않는다. 비활성 대상은 그 결과만 갱신하고 기존 current/checkpoint Position을 보존한다. 의도의 Target Task는 정확히 기록하며 미해결 prepared/failed를 다른 대상으로 덮지 않는다.

단독 test에서 새/변경 테스트가 review에 영향을 주면 stale 사유·대상 파일·재리뷰 Next Action만 남긴다. 검토하지 않은 snapshot을 passed로 바꾸지 않으며 test passed가 review stale를 해소하지 않는다. 실제 재리뷰는 후속 review 요청이나 전체 Task 실행에서 한다. 단독 implementation/review-action/refactor의 최소 검증도 필요한 별도 재리뷰/test를 대신하지 않는다.

단독 commit 성공 뒤 전체 실행으로 재개하면 [Recovery](resume.md#recovery)로 동일 commit을 확인하고 누락 finalize만 수행한다. 성공 결과를 현재 diff 없음이라는 이유로 skipped로 덮지 않는다.

## Evidence and Completion

- 검증의 기록·재사용에는 아래 Environment Evidence를 조건부로 적용한다. Revision·내용 snapshot과 함께 결과에 실제 영향을 주는 환경의 동일성 또는 변경 영향을 확인한다.
- 실행한 보고에는 Task, Stage, Blueprint Revision, Covered Files, Source Snapshot, Checked At, Result, Blockers, Next Action을 포함한다.
- 현재 파일의 SHA256은 `Get-FileHash` 등의 읽기 전용 도구로 확인한다. 새 파일도 포함하고 삭제된 경로는 deleted로 기록한다. 원문·비밀 값 대신 필요한 hash만 기록한다.
- HEAD 식별자는 checkpoint의 Base HEAD와 별도로 기록한다. source snapshot은 covered 파일 내용이므로 커밋으로 HEAD가 달라졌다는 이유만으로 동일 내용의 검증을 무효화하지 않는다.
- 검증 freshness의 working SHA256과 커밋 복구의 staged mode/blob는 역할이 다르다. Candidate Snapshot과 줄바꿈/삭제 대조 절차는 [Staging](commit-check.md#staging) 및 [Recovery](resume.md#recovery)를 따른다.
- 추가 테스트 파일이나 구현 조정이 생기면 실제 변경 scope와 해당 증거를 갱신한다. 변경된 내용에 영향을 받는 단계만 stale로 표시하고 재수행한다.
- Completion Check는 `pending / ready / blocked`를 사용한다. ready에는 현재 Revision·snapshot, 완료 조건별 근거, 적용 단계 판정, 남은 위험, Git 경계를 기록한다.
- ready는 현재 근거로 완료 정책 처리에 진입할 수 있다는 공통 준비 판정이며 done은 아니다. auto이고 Task 범위의 커밋 대상 변경이 있으면 커밋 가능 판정을 포함하며 성공 commit 후 done이다. auto여도 Task 범위 변경이 없으면 이유를 기록하고 commit을 skipped로 처리할 수 있다. 명시적 none도 사용자 지시·남은 미커밋 변경을 기록하고 완료 조건·품질 판정 후 done 가능하다. check_only 및 단계 단독 실행은 자동 finalize하지 않는다.
- 전체 Task 실행은 사전 목표·완료 조건 → 적용 단계의 유효 근거·품질 확인 → Task 범위 Git 변경 및 커밋 정책 처리 → done/finalize 순서다. 별도 commit-check 단계가 해당 없음이어도 공통 품질·완료 정책 판정을 Task의 Completion Check에 남긴다. 새 단계나 enum은 만들지 않는다.
- Git 변경 없음은 Task 범위 후보를 기준으로 판단하며 저장소 전체 clean을 요구하지 않는다. unrelated 사용자 working/index는 보존한다. 조사나 로컬 보고만 만든 Task는 기본 로컬 .memory를 후보로 삼거나 빈 커밋을 만들지 않는다. 테스트 코드·공유 가이드를 작성했다면 그 변경에는 일반 커밋 정책을 적용한다.
- 현재 요청과 해당 Task에 유효한 사용자 커밋 지시가 우선한다. 명시한 커밋 금지는 취소될 때까지 보존하고, 단독 단계 실행을 Task의 auto 정책이 영구 check_only로 바뀐 것으로 해석하지 않는다.

### Reporting

실제로 수행한 단계만 보고하고 [Stage Report](templates.md#stage-report) 형식을 사용한다. 완료/차단 결과는 아래 History에 기록하며, 실행하지 않은 단계의 빈 보고서를 만들지 않는다. 채팅에는 무엇·왜, 실제 검증과 한계, commit/정책 결과·다음 위치/행동, 범위 밖 발견의 영향·권고를 간결히 설명한다. 필요한 짧은 코드/계약 인용은 근거를 돕는 범위로 쓰고 처음 쓰는 패턴/API는 한 줄로 설명한다. 발견이 없으면 특이사항 없음이라고 적는다. 설명만 하는 호출은 보고·이력 작성 의무를 적용하지 않는다.

### Investigation Outcomes

조사 목적이 사전에 명확한 Task는 검사 대상의 결과와 조사 작업의 목표 달성을 분리한다. Type 이름만으로 이 경로를 선택하지 않는다. 기존 보고의 Details/Result 안에 필요할 때 다음 두 항목을 작성한다. 새 상태 enum이나 실행 schema가 아니다.

| Item | 기록 기준 |
| :--- | :--- |
| Observed Result | 실제 command/cwd/exit, 대상 검사 통과·실패·미실행, 원인 분류·근거. 실패 exit와 로그를 성공으로 바꾸지 않음 |
| Objective Assessment | 사전 AC별 충족/미충족, 조사 목적 달성 판정과 근거·한계·후속 권고. workflow Status 및 Task 완료 판정과의 대응 |

예를 들어 사전 목표가 테스트 결과 조사·실패 분류이고 그 근거·한계·권고가 모두 갖춰졌다면, Observed Result에 테스트 실패를 보존하면서 조사 단계 목적은 passed로 판정할 수 있다. 보고 상단 Result에는 조사 목적 달성과 관측 실패를 함께 밝혀 검사 통과로 오해하지 않게 한다. 전체 Task done은 나머지 적용 단계·품질·커밋 정책까지 확인한 뒤다.

통과가 목표인 Task의 실패, 조사 자체가 수행 불가하거나 필수 자료가 부족한 경우는 이 예외가 아니다. 원인 후보·한계 조사가 목표라면 미확정 원인을 사실대로 평가할 수 있지만, 원인 확정이 목표라면 후보만으로 완료하지 않는다. 조사 대상 제품의 Critical/High 발견은 원래 severity와 영향을 보존하여 보고하되, 조사 작업 자체의 결함이나 AC 미달성과 구분한다. 조사 요청만으로 발견 사항 수정·후속 Task 생성까지 실행하지 않는다.

실패 후 목표를 조사로 바꾸거나 필수 failed/blocked/stale를 skipped/passed로 덮어 gate를 우회하지 않는다. 목표 변경은 승인·Revision·영향 증거 재검증을 따르고 이전 실패 근거를 보존한다. 과거 done 보고를 새 형식에 맞추려고 재작성하지 않는다.

### Environment Evidence

검증 명령별로 관련 있는 항목만 기록한다. 모든 명령에 모든 필드를 강제하거나 전체 환경변수·설치 패키지·파일을 수집하지 않는다. 이 항목은 보고 계약이며 새 실행 엔진이나 상태 enum이 아니다.

| Field | 기록 기준 |
| :--- | :--- |
| Tool Versions | 관련 runtime/tool 이름, 읽기 전용 확인 명령과 실제 버전. 미확인 버전을 추정하지 않음 |
| Relevant Files | 관련 lockfile·manifest·test/build 설정의 repo-relative path와 SHA256 또는 missing/deleted. Covered Files/Source Snapshot에 있으면 해당 항목을 참조하며 중복 hash를 별도로 관리하지 않음 |
| Non-secret Settings | 결과에 영향을 주는 비밀 아닌 동작 설정의 확인 가능한 값/요약만. credential·토큰·환경변수 전체 원문 제외 |
| Scope / Reason | 해당 검사와 환경 항목의 관계, 해당 없음·미확인·확인 못함의 이유 |
| Checked At | 실제 환경 근거를 확인한 ISO 8601 시각 |

명령 실행 전에 실제 checkout/cwd와 관련 도구·설정을 확인하고 결과와 함께 기록한다. 재사용 시 현재 값과 비교하여 어떤 검증 결과의 의미가 바뀌는지 판단한다. 관련 runtime·lockfile·runner 설정 변화가 영향을 주면 해당 결과만 stale로 표시하고 필요한 검사만 재수행한다. 변경 사실·영향 판단·재사용 또는 재검증 근거를 보고에 남긴다. 무관한 설정, 동일 bytes의 HEAD/branch 변경, 다른 PC의 경로명 변화만으로 전체 재검증하지 않으며 실제 대상·설정 차이는 별도로 확인한다.

과거 환경 기록이 없으면 현재 확인과 기존 로그로 필요한 사실을 보완하되, 현재 값이 과거에도 같았다고 추정하지 않는다. 기록 부재만으로 일괄 실패시키거나 자동 통과시키지 않는다. 필요한 검증을 새로 수행하거나 대체 근거로 완료 조건을 입증할 수 있는지 판단하고 한계를 기록한다. 필요한 환경 동일성을 입증할 수 없어 완료 조건을 막는 경우에만 blocked로 둔다. 과거 done 증거를 덮어쓰지 않는다.

환경 근거를 얻기 위한 설치·업그레이드·설정 변경은 자동 수행하지 않는다. 단독 단계에서 선행 환경 evidence가 stale이면 사유·대상·Next Action만 남기고 요청하지 않은 단계·제품 수정·commit/finalize를 수행하지 않으며 기존 active Position을 보존한다.

## State Ownership

- 같은 `.memory`를 변경하는 실행 담당은 한 번에 한 명이다. 제품·Git·보고·Task/current/checkpoint/history 쓰기는 실행 담당이 수행하며, 별도 읽기 전용 리뷰어는 결과만 반환한다. Codex/Claude Code 등 도구를 교체할 때 기존 실행을 끝내거나 멈추고 기록을 확인해 순차 재개한다. 단일 current를 유지하며 자동 잠금 엔진·다중 current·자동 worktree 생성으로 구현하지 않는다. 리뷰 권한·결과 기록은 [Review Delegation](review.md#review-delegation)을 따른다.
- Task의 Status·Workflow·Completion Check·Progress가 작업 상태의 정본이다.
- current는 활성 Plan·Phase·Task와 Active Stage·Blocker·Next Step·정책의 책갈피다. 상세 청사진을 중복 보관하지 않는다.
- current의 Checkpoint는 실제 활성 또는 보존한 Plan별 state 링크다. Last Completed Task는 활성 위치와 별개로 마지막 완료의 Plan ID·Task ID, 확인한 commit hash 또는 명시 no-commit/변경 없음 사유, 실제 완료 evidence를 가리킨다. 완료 이력이 없으면 없음으로 기록하고 가짜 경로·hash를 만들지 않는다. 과거 current에 이 정보가 없으면 Task/보고로 확인 가능한 범위만 읽는다.
- Phase의 done count와 Plan의 요약은 Task 실제 상태로 갱신한다. 커밋 실패 전에 done을 쓰지 않는다.
- 새 등록은 기존 활성 작업을 유지한다. 우선 처리 지시가 있을 때만 Task 재개 상태와 Plan checkpoint를 먼저 보존하고 current를 전환한다.
- 초기 placeholder·실제 작업 없는 링크·완료 Task를 진행 중으로 취급하지 않는다. 실제 진행 위치가 손상됐다는 근거가 있으면 새 active 없음으로 덮지 않고 [Switch](resume.md#switch)의 복원 절차를 먼저 수행한다. 확인 불충분한 손상은 다음 행동을 남기며 새 등록의 활성화로 우회하지 않는다.
- 기본 실행은 활성 Task 하나다. 연속 실행은 요청한 범위를 따른다. 단계만 요청한 실행은 그 단계만 수행하고 포인터를 자동 전진하지 않는다.
- 마지막 Task 완료 시 Phase/Plan done과 Active Task·Stage 없음을 기록한다. 다른 pending Plan을 임의로 시작하지 않는다.
- checkpoint와 원자적 기록·커밋 복구 절차는 [resume.md](resume.md)를 따른다.
- 이전 위치 보존은 기존 Task·보고·Plan별 checkpoint에 필요한 재개/완료 근거를 남기는 뜻이다. 매 전환마다 전체 checkpoint 사본이나 별도 archive를 만들지 않는다. 기존 사본과 과거 완료 증거는 보존하고 미해결 커밋 의도는 덮어쓰지 않는다.

## Change Boundaries

- 이미 확정한 결정은 다시 묻지 않는다. 코드·설정에서 확인 가능한 내용은 직접 확인한다. 중요한 미결정 질문은 한 번에 하나씩 2~3개 선택지와 추천안을 제시한다.
- 사용자 선택·코드 확인·미확정 가정을 구분하고 답하지 않은 추천안을 확정으로 기록하지 않는다. 일반 구현 선택을 기반 설계 변경 승인으로 확대하지 않는다. 불확실한 값·원인·실행 결과나 승인·성공 근거를 만들어내지 않는다.
- 목표·동작을 유지하는 파일 위치·기존 심볼 차이는 청사진과 변경 기록을 갱신하며 진행한다. 사용자의 동작, 완료 조건, API, 권한, 데이터 계약의 새로운 결정은 승인 근거를 확인하고 필요한 부분만 질문한다.
- 조사에서 발견한 인접 문제를 임의로 scope에 포함하지 않는다. 근거·영향·권장 조치를 보고하고 추가 등록·구현은 사용자의 지시를 따른다.
- 상위 사용자 지시와 적용 가능한 프로젝트 지침을 존중한다. 프로필·외부 문서·현재 코드의 drift가 확정 정본을 자동으로 덮어쓰지 않는다.
- 계획과 등록은 구현하지 않는다. 스킬 지침만으로 미래 에이전트 행동이 자동 보장된다고 주장하지 않는다.

## History

완료·차단된 실제 단계마다 `.memory/history/YYYY-MM-DD.md`에 간결히 append한다. 같은 결과를 summary로 중복 기록하지 않으며 생략 단계는 workflow 표로 충분하다.

```markdown
## [기록 N] {stage}-{plan-id}-{task-id}

- Checked At: {ISO 8601}
- Task: {해당 일일 문서 기준 상대 링크}
- Result: {실제 수행 내용과 결과}
- Evidence: {실제 보고 또는 Task 내 기록}
- Blocker / Next Action: {없음 또는 구체적 행동}
- Status: 완료 또는 차단
```

기록 N은 기존 최대 번호 +1이며 기존 항목을 재작성하지 않는다. 한국어 보고를 기본으로 하되 프로젝트 관례와 사용자 지시를 따른다. 핵심 변경의 무엇·왜, 필요한 짧은 인용, 검증 한계, 범위 밖 발견 사항을 변경 규모에 맞게 설명한다. 발견이 없으면 특이사항 없음이라고 명시한다.

제목의 `stage-plan-id-task-id`는 신규 실행 이력의 명명 예시이며 제목 문자열만으로 대상을 식별하지 않는다. 본문의 실제 Task 링크·ID·Checked At·Evidence가 식별 근거다. 인터뷰·등록·계획처럼 stage가 아닌 활동은 `activity-{decision-id 또는 plan-id/task-id}`로 명명하고 해당 결정/계획 링크를 남긴다. Task가 없는 인터뷰에 가짜 Task ID를 부여하거나 과거 제목을 새 형식으로 고치지 않는다.
