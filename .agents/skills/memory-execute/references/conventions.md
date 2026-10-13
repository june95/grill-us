# Project Memory Shared Conventions

Project Memory의 인터뷰, 등록, 계획, 실행이 공유하는 계약이다. 상세 문서 형식은 [templates.md](templates.md), 프로젝트 확인은 [project-profile.md](project-profile.md), 완료·Git 판정은 [commit-check.md](commit-check.md), 재개는 [resume.md](resume.md)를 따른다. 전역 task-* 스킬이나 특정 프로젝트의 문서·폴더를 실행 의존성으로 두지 않는다.

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
- Decision ID는 결정 문서 생성일 기준 `YYYY-MM-DD-{topic}`이며 Plan ID와 독립적이다. Plan 생성 전 인터뷰나 기존 Plan의 후속 결정도 자체 ID를 유지한다. Plan/Task에서 실제 결정 문서를 링크하며 여러 Plan이 같은 결정을 참조할 수 있다. 같은 ID가 있으면 내용과 연결 범위를 먼저 확인하고, 기존 파일명·링크는 이동·통합·재번호하지 않는다.
- Task ID는 Plan 안에서 유일한 `P01-T01` 형식이다. 다른 Plan의 같은 Task ID는 Plan ID와 함께 식별한다.
- 새 커밋 메시지의 마지막 블록은 `Plan: {Plan ID}`, `Phase: {전체 Phase ID}`, `Task: {metadata Task ID}`다. 설명 본문은 이 블록보다 앞에 둔다. Task 폴더명과 Task ID를 구분하며, 과거 메시지의 호환 판정은 [재개 규약](resume.md#commit-message-identity)을 따른다.
- 일반 작업은 단일 Phase를 기본으로 하고 실행 단위는 Task로 나눈다. 큰 작업을 나눌 때 기존 plan-N의 역할은 Phase 내 T가 맡는다.
- task.md에 요청·완료 조건·상세 구현 계약을 함께 둔다. 동일 계약을 별도 Task plan.md 또는 plan-N.md에 복제하지 않는다.
- 보고서와 개인 진행 기록을 프로젝트 공유 설계 문서나 `.github` 작업 디렉터리에 추가하지 않는다. 제품 테스트와 공유 가이드는 해당 프로젝트의 기존 위치를 사용한다.
- 경로와 링크는 작성한 문서 기준 상대 경로를 사용한다. 보고서의 Covered Files는 저장소 기준 상대 경로다. 경로를 쓰기 전에 의도한 프로젝트 안인지 확인한다.
- 기본적으로 `.memory`는 로컬 관리한다. 명시적인 공유 예외는 실제 Git ignore 정책과 함께 확인하며 force-add로 우회하지 않는다.

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

## Evidence and Completion

- 검증의 기록·재사용에는 아래 Environment Evidence를 조건부로 적용한다. Revision·내용 snapshot과 함께 결과에 실제 영향을 주는 환경의 동일성 또는 변경 영향을 확인한다.
- 실행한 보고에는 Task, Stage, Blueprint Revision, Covered Files, Source Snapshot, Checked At, Result, Blockers, Next Action을 포함한다.
- 현재 파일의 SHA256은 `Get-FileHash` 등의 읽기 전용 도구로 확인한다. 새 파일도 포함하고 삭제된 경로는 deleted로 기록한다. 원문·비밀 값 대신 필요한 hash만 기록한다.
- HEAD 식별자는 checkpoint의 Base HEAD와 별도로 기록한다. source snapshot은 covered 파일 내용이므로 커밋으로 HEAD가 달라졌다는 이유만으로 동일 내용의 검증을 무효화하지 않는다.
- 커밋 의도의 Candidate Snapshot에는 working-tree hash와 별도로 staged Git mode/blob ID를 기록한다. Git의 줄바꿈·clean filter 정규화가 로컬 bytes를 바꿀 수 있으므로 commit tree의 성공 여부는 staged Git entry와 비교한다. 삭제는 entry 없음으로 기록하고 전환 index 삭제는 로컬 보존 여부를 따로 확인한다.
- 추가 테스트 파일이나 구현 조정이 생기면 실제 변경 scope와 해당 증거를 갱신한다. 변경된 내용에 영향을 받는 단계만 stale로 표시하고 재수행한다.
- Completion Check는 `pending / ready / blocked`를 사용한다. ready에는 현재 Revision·snapshot, 완료 조건별 근거, 적용 단계 판정, 남은 위험, Git 경계를 기록한다.
- ready는 현재 근거로 완료 정책 처리에 진입할 수 있다는 공통 준비 판정이며 done은 아니다. auto이고 Task 범위의 커밋 대상 변경이 있으면 커밋 가능 판정을 포함하며 성공 commit 후 done이다. auto여도 Task 범위 변경이 없으면 이유를 기록하고 commit을 skipped로 처리할 수 있다. 명시적 none도 사용자 지시·남은 미커밋 변경을 기록하고 완료 조건·품질 판정 후 done 가능하다. check_only 및 단계 단독 실행은 자동 finalize하지 않는다.
- 전체 Task 실행은 사전 목표·완료 조건 → 적용 단계의 유효 근거·품질 확인 → Task 범위 Git 변경 및 커밋 정책 처리 → done/finalize 순서다. 별도 commit-check 단계가 해당 없음이어도 공통 품질·완료 정책 판정을 Task의 Completion Check에 남긴다. 새 단계나 enum은 만들지 않는다.
- Git 변경 없음은 Task 범위 후보를 기준으로 판단하며 저장소 전체 clean을 요구하지 않는다. unrelated 사용자 working/index는 보존한다. 조사나 로컬 보고만 만든 Task는 기본 로컬 .memory를 후보로 삼거나 빈 커밋을 만들지 않는다. 테스트 코드·공유 가이드를 작성했다면 그 변경에는 일반 커밋 정책을 적용한다.

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

- Task의 Status·Workflow·Completion Check·Progress가 작업 상태의 정본이다.
- current는 활성 Plan·Phase·Task와 Active Stage·Blocker·Next Step·정책의 책갈피다. 상세 청사진을 중복 보관하지 않는다.
- current의 Checkpoint는 실제 활성 또는 보존한 Plan별 state 링크다. Last Completed Task는 활성 위치와 별개로 마지막 완료의 Plan ID·Task ID, 확인한 commit hash 또는 명시 no-commit/변경 없음 사유, 실제 완료 evidence를 가리킨다. 완료 이력이 없으면 없음으로 기록하고 가짜 경로·hash를 만들지 않는다. 과거 current에 이 정보가 없으면 Task/보고로 확인 가능한 범위만 읽는다.
- Phase의 done count와 Plan의 요약은 Task 실제 상태로 갱신한다. 커밋 실패 전에 done을 쓰지 않는다.
- 새 등록은 기존 활성 작업을 유지한다. 우선 처리 지시가 있을 때만 Task 재개 상태와 Plan checkpoint를 먼저 보존하고 current를 전환한다.
- placeholder·누락 링크·실제 완료된 Task를 유효한 진행 중 작업으로 취급하지 않는다.
- 기본 실행은 활성 Task 하나다. 연속 실행은 요청한 범위를 따른다. 단계만 요청한 실행은 그 단계만 수행하고 포인터를 자동 전진하지 않는다.
- 마지막 Task 완료 시 Phase/Plan done과 Active Task·Stage 없음을 기록한다. 다른 pending Plan을 임의로 시작하지 않는다.
- checkpoint와 원자적 기록·커밋 복구 절차는 [resume.md](resume.md)를 따른다.
- 이전 위치 보존은 기존 Task·보고·Plan별 checkpoint에 필요한 재개/완료 근거를 남기는 뜻이다. 매 전환마다 전체 checkpoint 사본이나 별도 archive를 만들지 않는다. 기존 사본과 과거 완료 증거는 보존하고 미해결 커밋 의도는 덮어쓰지 않는다.

## Change Boundaries

- 이미 확정한 결정은 다시 묻지 않는다. 코드·설정에서 확인 가능한 내용은 직접 확인한다. 중요한 미결정 질문은 한 번에 하나씩 2~3개 선택지와 추천안을 제시한다.
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
