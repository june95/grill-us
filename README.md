# Project Memory Starter Kit

요구사항·설계 결정·구현·검증을 사용자 프로젝트의 로컬 `.memory`에 기록하고 이어서 작업하는 Codex·Claude Code 스킬9개입니다.

## 설치

Node.js와 npx가 필요합니다. 시험한 skills CLI1.7.4는 Node.js22.20 이상을 요구합니다.

~~~sh
npx skills@latest add june95/grill-us
~~~

스킬과 에이전트를 선택합니다. 기본은 현재 프로젝트이며 `-g`는 사용자 전역 설치입니다. 이 전환은 공개 push 전이므로 GitHub 주소의 새 snapshot 제공 여부는 공개 반영 후 별도 확인해야 합니다.

| 공개 스킬 | 사용할 때 |
| :--- | :--- |
| [prj-grill-me](.agents/skills/grill-me/SKILL.md) | 중요한 설계 선택을 한 질문씩 확정 |
| [prj-memory-intake](.agents/skills/memory-intake/SKILL.md) | 명확한 수정·버그·이슈 등록 |
| [prj-memory-plan](.agents/skills/memory-plan/SKILL.md) | Plan·Phase·Task 청사진 작성 |
| [prj-memory-execute](.agents/skills/memory-execute/SKILL.md) | 현재 Task 또는 지정 단계 실행·검증·완료 |
| [prj-memory-review](.agents/skills/memory-review/SKILL.md) | 파일·diff·commit·Task 독립 무쓰기 리뷰 |
| [prj-memory-explain](.agents/skills/memory-explain/SKILL.md) | 결정·계획·진행·완료 설명 |
| [prj-memory-wiki](.agents/skills/memory-wiki/SKILL.md) | 명시 문서 수집·출처 기반 질의 |
| [prj-page-capture](.agents/skills/page-capture/SKILL.md) | 기존 호스트 도구로 PNG·JSON 증거 캡처 |
| [prj-visualize](.agents/skills/visualize/SKILL.md) | 명시 HTML 시각화 생성 |

~~~sh
npx skills@latest add june95/grill-us --skill prj-memory-explain -a codex
npx skills@latest add june95/grill-us --skill prj-memory-explain -a claude-code
~~~

Codex에서는 `$prj-memory-explain`, Claude Code에서는 `/prj-memory-explain`처럼 요청합니다. 각 스킬은 필수 참고 문서를 포함하며 다른 스킬을 자동 설치하지 않습니다. 설치 경로는 읽기 전용 문서 위치이고 기록은 실제 사용자 프로젝트의 `.memory`에 둡니다.

목록·업데이트·제거·기존 plugin 전환은 [설치 안내](docs/skills-installation.md), 실제 확인 버전·범위와 한계는 [skills 호환성](docs/skills-compatibility.md), 이전 plugin의 당시 결과는 [과거 보고](docs/plugin-compatibility.md)를 참고합니다. 최종 후보의 두 호스트 native 호출을 확인했으며 공개 주소 재설치는 별도입니다.

## 배포 저장소 관리

편집 정본은 `.agents/skills`와 `packaging/grill-us.json`의 명시 allowlist입니다. source 폴더/name은 기존 내부 ID를 유지하고 source9개와 CodeBurn은 internal로 숨깁니다. 설치 대상은 생성한 `skills/prj-*`입니다. CodeBurn runtime·개인 기록·개발용 도구는 공식 payload에 포함하지 않습니다.

~~~sh
node scripts/build-skills.mjs
node scripts/build-skills.mjs --publish
node scripts/build-skills.mjs --check-published
node scripts/validate-skills.mjs
~~~

기본 출력은 ignored `dist/grill-us-skills`, Git 배포 snapshot은 `skills/`입니다. 생성물을 직접 편집하지 않습니다. 읽기 전용 freshness·파일 소유권·LF/checkout·실제 설치 검사는 [기술 계약](docs/skills-distribution.md)에 있습니다. 소비자는 저장소 빌드 없이 설치합니다. 설치한 프로젝트에는 이 저장소의 개발용 검증기를 요구하지 않습니다. 자동 push는 수행하지 않습니다.

## 시작 경로

~~~text
명확한 수정·이슈 → prj-memory-intake → Plan/Phase/Task 등록 → prj-memory-execute
중요한 설계 분기 → prj-grill-me → 결정 확정 → prj-memory-plan → prj-memory-execute
기록된 설계·계획·진행·완료 결과 질문 → prj-memory-explain → 읽기 전용 설명
~~~

명확함은 변경 규모뿐 아니라 코드 근거·범위·완료 조건·검증 경로로 판단합니다. 작은 수정에도 권한·데이터·API 의미의 미결정이 있으면 해당 부분을 확인합니다. 원하는 동작이 명확한 버그의 원인은 코드에서 조사하며, 필요한 재현 정보만 질문합니다.

새 버그 Task에는 [Bug Investigation](.agents/skills/memory-execute/references/conventions.md#bug-investigation)을 남깁니다. 최소 입력·안전한 절차/실제 명령과 cwd, 기대/실제 결과, 시도·출처·확인 시각, 확인한 환경, 원인 후보·확신·한계·다음 검증을 기록합니다. 재현 상태(`reproduced`/`not_reproduced`/`unavailable`/`code_only`)와 원인 확신(`confirmed`/`supported`/`hypothesis`/`unknown`)은 별도로 판단합니다. 재현했다는 사실만으로 원인 확정이나 테스트 통과를 뜻하지 않습니다.

원인이 미확정이거나 재현하지 못했어도 기대 동작·범위·완료 조건·검증 방법이 명확하면 확인 한계와 첫 원인 확인 단위를 포함해 등록할 수 있습니다. 등록 중에는 제품 수정이나 새 테스트를 작성하지 않으며, 기능·문서 Task와 과거 완료 기록에는 빈 버그 표를 추가하지 않습니다. 확인하지 못한 원인 위치·환경·실행 결과는 추측으로 채우지 않습니다.

인터뷰는 질문 하나씩 2~3개 선택지와 추천안을 제공합니다. 이미 확정한 선택과 코드에서 확인할 내용을 반복해서 묻지 않습니다. 등록·계획 단계에서는 제품 코드를 구현하거나 Git 커밋을 만들지 않습니다.

## 정본과 읽기 범위

공통 상세 규칙은 [Rule Ownership](.agents/skills/memory-execute/references/conventions.md#rule-ownership)에 연결된 소유 문서 한곳에서 관리합니다. 상태·증거·완료 의미는 공통 규약, Git 절차는 commit-check, 재개·복구는 resume, 형식은 templates, 실제 경로·정본·명령 발견은 project-profile입니다. 각 스킬·단계에는 고유 절차와 핵심 제한 요약을 남깁니다.

요청과 존재하는 Task/결정·공통 규약부터 읽고, 실행·재개에는 현재 checkpoint와 resume을 확인합니다. 이후 선택한 단계 지침과 필요한 템플릿 섹션만 추가합니다. 관련 없는 단계·시나리오 전체를 매번 읽을 필요는 없습니다. 요약으로 실패/단독 실행/사용자 index 같은 경계를 생략하지 않으며, 상태 판정과 실제 근거는 정본에 따라 확인합니다.

## 사용 예시

~~~text
/prj-memory-intake README의 설치 경로 설명을 현재 구조에 맞게 수정
/prj-memory-intake 저장 버튼을 눌러도 입력값이 유지되지 않아. 버그 조사 근거와 검증 방법을 포함해 등록해줘.
/prj-grill-me 인증 정책 변경
/prj-memory-plan 확정한 기능명
/prj-memory-execute
current 보고 이어서 해줘
~~~

일반 기능은 P01 하나에 T01/T02로 나눕니다. 다른 실질 마일스톤이 있을 때만 Phase를 늘립니다. 상세 구현은 각 Task 폴더의 task.md 하나에 담고, Task 간 의존성을 명시합니다.

관련 요청은 기존 Plan에 추가하고 독립 목표는 새 Plan을 만듭니다. 같은 미완료 요청은 재사용하며, 완료 뒤 재발·추가 수정은 과거 기록을 보존하고 새 Task로 추적합니다.

버그 등록 보고는 실제 확인 수준을 함께 설명합니다. 예를 들어 실행하지 않고 코드만 조사했다면 "code_only, 원인 후보는 코드 근거 있음(supported), 실행 재현 미확인; 첫 단위에서 안전한 기존 검증 방법으로 확인"처럼 적습니다. 이 문구는 보고 형식 예시이며 실제 결과에 맞게 바꿉니다. 사용자 제공 로그와 에이전트의 직접 실행도 구분합니다.

설명은 대상과 원하는 깊이를 자연어로 지정합니다. 기본은 간결한 채팅이며, 명시한 비활성·완료 Task도 현재 작업을 전환하지 않고 설명합니다.

~~~text
$prj-memory-explain 현재 계획을 짧게 설명해줘
$prj-memory-explain 마지막 완료 Task는 무엇이 바뀌었어?
prj-memory-explain 이 설계를 선택한 이유를 알려줘
prj-memory-explain 이 Plan의 계획과 실제 구현 차이를 설명해줘
prj-memory-explain 이 완료 작업을 비개발자에게 요약해줘
prj-memory-explain 이 Task의 흐름과 검증 한계를 개발자 인수인계용으로 설명해줘
prj-memory-explain 이 Plan의 의존 관계를 prj-visualize로 HTML 도식으로 만들어줘
~~~

계획은 예정 동작으로, 완료 작업은 당시 구현·검증·커밋 또는 no-commit 근거로 설명합니다. 완료 기록과 현재 코드가 다를 수 있으며, 기록되지 않은 이유나 확인하지 못한 결과는 추측으로 채우지 않습니다. 변경 전후·관련 작업·검증 한계는 근거가 있을 때 포함합니다. [설명 시나리오](.agents/skills/memory-explain/references/scenarios.md)는 정적 검사·수동 대조와 실제 모델 행동 검증의 차이도 안내합니다.

설명만 요청하면 보고·이력·current·checkpoint·제품·Git을 수정하거나 테스트를 실행하지 않습니다. 상태 불일치는 설명하고 복구는 별도 실행 요청으로 연결합니다. HTML은 명시적으로 요청할 때만 [prj-visualize](.agents/skills/visualize/SKILL.md)를 적용하며, 기본 산출물은 저장소 밖에 두어 기존 기록과 Git 상태를 보존합니다.

## 전체 실행과 부분 실행

기본 실행은 현재 Task 하나입니다. Task별로 필수/필요 시/해당 없음 단계를 지정하고 생략 이유를 기록합니다. 실행한 단계만 보고서를 생성합니다. 사전에 정한 완료 조건과 유효 근거·공통 품질을 확인한 뒤 커밋 정책을 처리하고 Task를 완료합니다. `ready`는 이 정책 처리 준비 상태이며 `done`과 다릅니다.

| 정책·변경 상태 | 전체 Task의 완료 경로 |
| :--- | :--- |
| auto + Task 범위의 공유 변경 있음 | 검토·검증·성공 커밋 후 done |
| auto + Task 범위 Git 변경 없음 | 변경 없음 근거와 commit skipped 기록 후 done 가능; 빈 커밋 없음 |
| none (사용자 커밋 금지) | 품질 충족·사용자 지시·남은 미커밋 변경 기록 후 done 가능 |
| check_only 또는 단독 단계 실행 | 요청 결과만 기록; 자동 done·포인터 전진 없음 |

Git 변경 여부는 해당 Task의 후보로 판단합니다. 다른 사용자 변경이나 staged 파일이 남아 있어도 그것을 포함해 커밋하거나 임의로 없애지 않습니다. 기본 로컬 `.memory` 보고만 작성했다면 커밋 대상이 생기는 것은 아닙니다. 별도 commit-check 단계가 해당 없음이어도 전체 완료 전 공통 품질·정책 판정은 남깁니다.

~~~text
/prj-memory-execute --stage review
/prj-memory-execute --stage test
/prj-memory-execute --stage commit-check
현재 Task 테스트만 실행해줘
T01부터 T03까지 순서대로 진행해줘
현재 Task 구현과 검증만 하고 커밋은 하지 마
~~~

분석이나 기존 테스트 실행 자체를 독립 Task로 등록할 수 있습니다. 예를 들어 "분석 전용 T01 전체 진행"은 그 Task의 완료 판정까지 수행하지만, "T01의 분석 단계만" 또는 `--stage reference`는 해당 단계까지만 수행합니다. 명시적인 단계 선택이 우선이며, 두 뜻이 모호한 경우에만 확인합니다.

**검사 결과와 조사 완료는 구분합니다.** 사전 목표가 "기존 테스트 결과를 조사하고 실패를 분류"하는 것이라면 실제 실패·근거·한계·후속 권고를 갖춰 조사 Task를 완료할 수 있습니다. 보고의 `Observed Result`에는 실패 exit와 관측 결과를 그대로 남기고, `Objective Assessment`에는 조사 완료 조건의 충족 여부를 적습니다. 상단 결과와 설명에도 "조사 완료, 대상 테스트 실패"를 함께 표시합니다.

목표가 "테스트를 모두 통과시키기"라면 실패한 채 완료할 수 없습니다. 필수 조사 로그가 없거나 원인 확정이 목표인데 후보만 확보한 경우도 마찬가지입니다. 실패 후 목표를 바꾸거나 실패 기록을 숨겨 완료 처리하지 않습니다. 테스트 코드를 새로 작성했다면 공유 변경이 있으므로 일반 커밋 정책을 적용합니다. [네 가지 미니 청사진과 완료 사례](.agents/skills/memory-execute/references/scenarios.md#investigation-task-blueprints)에서 분석 전용·기존 테스트 조사·테스트 코드 작성·명시 no-commit을 비교할 수 있습니다.

단계 단독 요청은 해당 범위만 수행합니다. 부족한 선행 증거를 만들기 위해 전체 workflow를 자동 실행하지 않습니다. 리뷰만은 제품 코드를 수정하지 않고, 테스트만은 필요한 테스트를 작성·실행할 수 있지만 제품 결함은 보고합니다. 커밋 점검만은 staging·커밋·완료·포인터 전진을 하지 않습니다.

테스트만 실행하면서 새 테스트를 추가했다면 영향받은 리뷰를 `stale`로 표시하고 재리뷰 대상을 남깁니다. 재리뷰는 후속 리뷰 요청이나 전체 Task 실행에서 수행합니다. 테스트가 통과해도 기존 리뷰의 snapshot을 검토 없이 갱신하지 않습니다.

적용 review와 재리뷰는 기본적으로 별도 에이전트에게 읽기 전용으로 위임합니다. 사용자 자체 리뷰 지시가 우선이며, 도구 부재·실패·미완료이면 사유를 알리고 자체 리뷰로 계속합니다. 보고에는 독립/자체 리뷰, 실제 시도·부분 결과·snapshot과 제한 수준을 구분합니다. Needs Changes나 확보한 finding은 대체 사유로 지우지 않습니다. 자세한 절차는 [Review Delegation](.agents/skills/memory-execute/references/review.md#review-delegation)을 따르며, skipped review를 새로 강제하거나 단독 review에서 자동 수정·완료하지 않습니다.

같은 `.memory`를 변경하는 실행 담당은 한 번에 한 명입니다. 리뷰어는 결과만 반환하고 실행 담당만 보고·상태·제품·Git을 변경합니다. Codex/Claude Code 등 도구를 교체할 때 이전 실행을 끝내거나 멈추고 기록으로 순차 재개합니다. 단일 current를 유지하는 지침이며 자동 잠금이나 쓰기 권한의 기술적 차단을 제공하지 않습니다([State Ownership](.agents/skills/memory-execute/references/conventions.md#state-ownership)).

새 요청 등록만으로 기존 활성 위치를 바꾸지 않습니다. 우선 처리 지시가 있으면 이전 재개 위치를 먼저 보존한 뒤 전환합니다. 커밋 실패나 검증 차단은 현재 Task에 남기며, 성공 커밋 뒤 기록이 끊기면 실제 커밋 내용을 확인해 상태를 복구합니다.

검증 전에는 실제 작업 경로와 결과에 영향을 주는 도구·runtime 버전, lockfile·테스트 설정을 확인하고 [Environment Evidence](.agents/skills/memory-execute/references/conventions.md#environment-evidence)에 기록합니다. 관련 항목만 남기며 설정 파일 hash는 기존 Source Snapshot을 참조하고, 비밀 값이나 환경변수 전체 원문은 수집하지 않습니다. 근거 수집을 위해 도구 설치·업그레이드·설정을 자동 변경하지 않습니다.

이전 결과를 재사용할 때는 코드와 관련 환경을 비교합니다. 예를 들어 runner 설정 변경이 테스트 결과에 영향을 주면 해당 검사만 다시 수행합니다. 무관한 설정이나 동일 내용의 HEAD·branch·PC 경로명 변화만으로 전체 검증을 반복하지 않습니다. 과거 환경 기록이 없으면 확인 가능한 근거와 한계를 남기고 필요한 새 검증 등을 판단하며, 기록 부재만으로 자동 통과하거나 일괄 차단하지 않습니다. 테스트만·커밋 점검만 요청했는데 선행 근거가 오래되었다면 사유와 다음 행동을 남기고 요청 범위를 유지합니다.

## 저장 구조

~~~text
.memory/
├── decisions/YYYY-MM-DD-topic.md       # Plan과 독립적인 Decision ID
├── plans/YYYY-MM-DD-feature.md
├── phases/YYYY-MM-DD-feature/
│   └── P01-core/
│       ├── phase.md
│       ├── T01-first/
│       │   ├── task.md
│       │   └── 실제 실행한 단계의 결과 문서
│       └── T02-next/
│           └── task.md
├── current.md
├── state/YYYY-MM-DD-feature.md
├── history/YYYY-MM-DD.md
└── project.md                         # 선택적 프로젝트 설정
~~~

- task.md는 상세 계약·workflow·완료 조건의 정본입니다.
- current는 활성 위치, state는 재개·커밋 의도, Phase/Plan은 실제 Task 상태의 요약입니다.
- 결정 문서는 생성일·주제로 독립 ID를 갖습니다. Plan 생성 전 인터뷰나 기존 Plan의 후속 결정도 파일명을 유지하고 Plan/Task에서 실제 경로를 링크합니다. 여러 Plan이 같은 결정을 참조할 수 있으며, 기존 파일·링크를 옮기거나 합치지 않습니다.
- current의 Checkpoint는 실제 활성 또는 보존한 Plan state 링크이고, Last Completed Task는 마지막 완료의 Plan/Task·확인한 커밋 또는 no-commit 사유·완료 근거입니다. 활성 Task가 없어도 보존한 state 링크는 남길 수 있습니다. 완료 이력이나 참조할 state가 없으면 없음으로 적습니다.
- 이전 위치는 기존 Task·보고·Plan별 state로 보존합니다. 성공 커밋 의도를 초기화하기 전에 Task의 커밋 보고와 마지막 성공 정보를 남기며, 미해결 prepared/failed 의도는 덮어쓰지 않습니다. 매 전환 archive 사본을 만들지 않고 기존 사본은 유지합니다.
- memory-explain은 이 기록을 읽어 설명하며 설명 결과를 보고·history로 자동 저장하지 않습니다.
- 코드·계약·관련 검증 환경 변경 뒤에는 영향을 받은 증거의 최신성을 확인합니다.
- 제품 테스트와 공유 가이드는 해당 프로젝트의 기존 디렉터리에 둡니다.
- 특정 정본·앱 경로를 강제하지 않습니다. [선택적 프로필](.agents/skills/memory-execute/references/project-profile.md)이 없으면 기존 구조를 확인합니다.

.memory는 기본적으로 Git 공유·백업되지 않습니다. 다른 PC에서 이어가려면 필요한 폴더를 별도 백업·복사합니다. 문서를 Git으로 공유할 경우 명시한 예외 범위와 실제 ignore 정책을 일치시키고, 기존 진행 정보를 공개 기록으로 넣을지 검토합니다.

## 예시와 검증 범위

[상품 API Plan](examples/plans/2026-08-22-product-api.md), [Phase](examples/phases/2026-08-22-product-api/P01-core-crud/phase.md), [Task 청사진](examples/phases/2026-08-22-product-api/P01-core-crud/T01-product-schema/task.md), [포인터 예시](examples/current.md)를 통해 형식을 볼 수 있습니다.

상품 API 소스·DB·테스트 harness는 포함되어 있지 않습니다. 예시의 명령은 가정한 제품 환경용이며 실제 성공·커밋 기록이 아닙니다. 예시를 그대로 활성 작업으로 실행하지 않고, 실제 제품 저장소에서 구현 계약과 검증 명령을 먼저 확정합니다. 과거 날짜는 예시의 원 ID이며 새 Plan에는 생성일을 사용합니다.

[검증 시나리오](.agents/skills/memory-execute/references/scenarios.md)는 선택적 단계·재개·사용자 변경 보존 등의 판단 기준을 설명합니다. 파일·링크·Git 검사와 수동 walkthrough는 실제 모델 자동 실행이나 상품 API 테스트 성공과 구분합니다.

## 로컬 스킬 검증

Node.js 22.20.0 이상과 Git·네트워크가 필요합니다. 저장소 root에서 다음 명령 하나로 다섯 suite의 회귀·실제 npx 설치·스킬 발동 경계와 문서·격리 Git 검사를 실행합니다. 검증기는 이 저장소의 개발·배포용이며 설치 대상 프로젝트의 `.memory`를 검사하거나 공식 스킬에 검사 도구를 추가하지 않습니다. 지원·제외 범위의 정본은 [validation-scope.md](.agents/skills/memory-execute/references/validation-scope.md)입니다.

~~~powershell
node scripts/validate-skills.mjs
~~~

성공은 exit 0, 검사 실패·도구 오류는 exit 1입니다. 다른 디렉터리에서는 스크립트의 절대 경로를 지정하면 됩니다. CLI 옵션은 없습니다. 검사 결과에는 종류별 검사 수·제외 진단 수·오류 수와 제외/실패의 파일·행·사유가 표시됩니다. fence 안 링크 여러 개는 하나의 제외 진단에 개수를 함께 표시합니다.

- **문서:** AGENTS.md, README.md, examples·docs·packaging·.agents/skills·skills 아래 Markdown을 검사합니다. .memory, .git, .codeburn, node_modules와 심볼릭 링크 디렉터리는 탐색하지 않습니다.
- **스킬 frontmatter:** .agents/skills 및 public skills 안의 SKILL.md에서 시작/종료 `---`, top-level `name`/`description`의 누락·중복·빈값을 검사합니다. `name`은 lower kebab-case이며 부모 스킬 디렉터리명과 일치하고 다른 스킬과 중복되지 않아야 합니다. UTF-8 BOM과 CRLF를 지원하며 들여쓴 metadata 필드는 필수 필드로 세지 않습니다.
- **지원 scalar:** 한 줄 plain/quoted 문자열과 description의 `>`/`|` block(`+`/`-` 포함)을 지원합니다. 작은따옴표의 `''`와 큰따옴표의 JSON escape를 처리합니다. 숫자·boolean·null형 값은 인용해야 합니다. 필수 필드의 array/object/tag/anchor/alias, 일반 문자열의 들여쓴 continuation, block의 tab/불일치 들여쓰기 등 지원하지 않는 표현은 오류로 표시합니다. 전체 YAML 문법이나 나머지 metadata의 유효성을 검사하는 파서는 아닙니다.
- **링크·anchor:** 실제 inline/reference 상대 파일과 지원 Markdown 제목을 확인합니다. 같은 파일 `#fragment`, 다른 파일 `file.md#fragment`, Unicode 제목·중복 suffix·percent encoding을 지원합니다. 깨진 지원 anchor는 실패로 표시합니다. fence/inline code 예시·외부 URL·동적 placeholder·저장소 밖·사용자 `.memory` 대상은 제외하며, raw HTML/복잡한 제목 등 미확인 fragment도 제외 사유를 남깁니다.
- **메모리 예제 구조:** 공통 템플릿의 heading·Metadata·Progress·표 열과 교육용 Task/Current/Plan/Phase를 대조합니다. 기준 템플릿 손상, 필수 항목 누락·중복, 상태·소속·요약 집계 drift, 비활성 Task의 잔존 Stage를 검출합니다. Bug Investigation은 버그 Task에만 필요합니다. 실제 제품 파일·검증 결과·사용자 기록의 진위는 검사하지 않습니다.
- **작업 식별자:** 상품 Task 예제와 공통 Task 템플릿의 metadata·폴더·메시지 마지막 Plan/Phase/Task 블록을 대조합니다. 로컬 완료 기록을 마이그레이션하지 않습니다.
- **예제 구문:** 완성형 js/javascript와 HTML의 classic inline script는 vm.Script로 검사합니다. module inline script는 Node의 --check --input-type=module로 지원하며 import를 해결하거나 코드를 실행하지 않습니다. src와 데이터 MIME script는 제외합니다.
- **classic MIME:** [WHATWG JavaScript MIME 목록](https://mimesniff.spec.whatwg.org/#javascript-mime-type)에 있는 과거 alias도 구문 검사 대상으로 포함합니다.
- **설명 조각:** 직전 줄에 `<!-- skill-check: fragment — 구체적인 이유 -->`를 붙인 코드 조각만 명시 제외합니다. 완성형 실행 예제의 오류를 이 표식으로 숨기지 않습니다.
- **HTML ID:** 각 html fence 안의 시작 태그에서 같은 ID를 찾아 중복 속성의 파일/행·최초 행을 표시합니다. 서로 다른 fence는 독립적이며 속성명은 대소문자를 구분하지 않고 ID 값은 구분합니다. 태그/속성 구분에는 HTML ASCII 공백만 사용하고 NBSP 등은 이름/값의 일부로 유지합니다. comments, script/style 및 기타 raw-text 내용, quoted 속성 안의 문자열과 data-id는 ID로 오인하지 않습니다. 빈/boolean id도 비교하지만 일반 HTML 문법 오류까지 검사하지는 않습니다.
- **ID 문자 참조:** 숫자 참조(잘못된 범위의 replacement와 C1 치환 포함)는 [HTML 규칙](https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-end-state)에 따라 한 번만 정규화합니다. named reference는 `amp`/`lt`/`gt`/`quot`와 해당 대문자형, `apos`/`nbsp`를 지원합니다. 다른 named reference가 있으면 해당 ID만 정보 진단과 함께 비교에서 제외합니다. 전체 entity 표, 실제 DOM 트리·namespace·스크립트의 동적 ID 변화는 검사 범위가 아닙니다.
- **Git:** OS 임시 저장소에서 ignore 부정 패턴·부모 제외·NUL 출력·tracked 경로·오류와 표준/과거 메시지 식별을 확인합니다. commit-check 문서의 secret 검사 명령을 정확히 하나 추출해 shell 없이 실행하고, 가짜 값을 stage하면 파일명만 나오고 값은 나오지 않는지, 저장소에 설정된 textconv 변환기를 실행하지 않는지, 깨끗하면 stdout·stderr가 모두 비는지 확인합니다. 임시 저장소의 명시 파일만 staging하고 소유 경로를 확인한 뒤 정리합니다. 실제 프로젝트의 index·config·current를 변경하지 않습니다.
- **스킬 발동 경계:** `evals/routing`의 영어 trigger case로 공개 스킬 9개의 발동 순위, negative의 owner, description 쌍 유사도(0.75 이상 실패), 트리거 문구를 단어 겹침 근사로 검사합니다. 한국어 요청과 실제 모델의 발동은 판단하지 않습니다([Skill Routing](.agents/skills/memory-execute/references/validation-scope.md#skill-routing)).

회귀 검사만 실행하려면 `node --test tests/validate-skills.test.mjs tests/build-skills.test.mjs tests/repository-skills.test.mjs tests/skills-install.test.mjs tests/skill-routing.test.mjs`를 사용합니다. 전체 검사는 격리 npx 통합 시험을 포함해 네트워크와 skills CLI1.7.4 다운로드가 필요합니다. 시험한 환경은 Node26.12.1·Windows이며 전체 검사는 Node22.20 이상을 요구합니다. Native 모델 호출은 별도 시험입니다.

실제 모델을 호출하는 개발용 측정은 회귀에 들어가지 않으므로 필요할 때 따로 실행합니다. 행동 eval(`node scripts/eval-skill-behavior.mjs --model <id>`)이 하는 일은 다음과 같습니다.

- 대상: prj-memory-execute, prj-memory-review, prj-grill-me의 압박 시나리오 5개.
- 방식: 임시 Git 저장소에서 단일 턴으로 실행합니다. 작업공간을 결정적으로 먼저 검사하고, 그다음 실행 기록을 비신뢰 데이터로 채점합니다.

주의할 점:

- 모델 호출 비용이나 구독 사용 한도를 쓰므로, 먼저 `--dry-run`으로 계획과 최악 비용을 확인하세요.
- 결과는 확률적이어서 한 번 실행한 결과가 규칙 준수를 보장하지 않습니다.
- 하네스 자체는 `node --test tests/behavior-eval.test.mjs`로 모델 호출 없이 확인합니다.

동작·판정·한계는 [On-demand Behavior Eval](.agents/skills/memory-execute/references/validation-scope.md#on-demand-behavior-eval)에, 실제 발동 측정은 [On-demand Routing Measurement](.agents/skills/memory-execute/references/validation-scope.md#on-demand-routing-measurement)에 있습니다.

결과 종류는 `frontmatter`, `public-frontmatter`, `links`, `messages`, `examples`, `html-ids`, `memory-examples`, `git`입니다. 이 명령은 지원 범위의 필수 scalar·ID·정적 구문·파일/제목 참조·예제 형식·격리 Git 동작을 검사합니다. 제외 진단은 부분 확인이며 미확인 대상을 성공으로 세지 않습니다. 전체 Markdown renderer, HTML 렌더링, 접근성 전반, 생성된 UI 동작, 실제 모델 workflow 실행, commit tree를 포함한 중단 복구 성공은 별도 검증이 필요합니다.

## 독립 스킬 생성과 검사

생성기·명시 allowlist·오류/소유권·불변성·LF와 checkout 계약은 [배포 기술 계약](docs/skills-distribution.md)에 둡니다. 실제 주소 설치에 필요한 `skills/` snapshot을 Git에 포함하며, default 로컬 빌드는 `dist/grill-us-skills`입니다. 기존 `dist/grill-us` ignore 규칙은 남아 있는 과거 로컬 산출물이 노출되지 않도록 보존합니다.

생성기 회귀는 `node --test tests/build-skills.test.mjs`, 실제 검색·설치·단독 파일 대조·제거 및 consumer clone 검사는 `tests/repository-skills.test.mjs`와 `tests/skills-install.test.mjs`입니다. 정상/실패 소유권·알 수 없는 파일/빈 디렉터리·링크·변조 보호를 포함하며 모델의 전체 workflow나 공개 주소 설치를 보장하지 않습니다.

## 추가 도구

CodeBurn과 visualize는 필요할 때 독립적으로 사용할 수 있습니다.

토큰 사용량 조회와 MCP 설정은 [CodeBurn 안내](CODEBURN-SETUP.md), [번들 README](.codeburn/README.md)를 참고합니다.

~~~powershell
& .\.codeburn\codeburn.ps1 sessions -p today --provider copilot --no-pager
& .\.codeburn\install.ps1
~~~

시각화는 [visualize 스킬](.agents/skills/visualize/SKILL.md)로 요청합니다.

visualize는 이 저장소의 수정본을 정본으로 관리합니다. 원 author/license/version 고지, 확인한 로컬 변경과 미확인 upstream 정보는 [출처 기록](.agents/skills/visualize/references/provenance.md)에 구분합니다. 외부 업데이트는 차이를 검토해 승인 범위의 필요한 부분만 반영하며, 개인 설치본이나 외부·전역 원본을 자동 변경하지 않습니다.

~~~text
/prj-visualize 설명할 내용
~~~
