# Project Memory Starter Kit

요구사항·설계 결정·구현 청사진·검증 결과를 파일로 남기고, 다음 작업을 이어갈 위치를 관리하는 에이전트 스킬 묶음입니다. 핵심 진입점은 네 개입니다.

| 스킬 | 사용할 때 | 결과 |
| :--- | :--- | :--- |
| [memory-intake](.agents/skills/memory-intake/SKILL.md) | 명확한 수정·버그·이슈를 등록할 때 | 코드 조사 후 기존/새 Plan에 Task 등록 |
| [grill-me](.agents/skills/grill-me/SKILL.md) | 설계 검토나 중요한 미결정이 있을 때 | 한 질문씩 선택·이유 확정 |
| [memory-plan](.agents/skills/memory-plan/SKILL.md) | 확정 요청을 실행 단위로 나눌 때 | Plan·Phase·Task 청사진 작성 |
| [memory-execute](.agents/skills/memory-execute/SKILL.md) | 현재 Task 또는 지정 단계만 수행할 때 | 구현·검증·완료 판정·재개 |

스킬은 에이전트가 따르는 업무 지침입니다. 별도 workflow 실행 프로그램이나 제품 앱을 포함하지 않습니다.

## 다른 프로젝트에 적용하기

1. 대상 프로젝트의 .agents/skills 아래에 grill-me, memory-intake, memory-plan, memory-execute 폴더를 복사합니다. memory-execute의 references도 함께 복사합니다. 기존 같은 이름의 스킬이 있다면 내용을 확인해 통합합니다.
2. [AGENTS.md](AGENTS.md)의 프로젝트 메모리 규칙을 대상 지침에 반영합니다. 대상 프로젝트의 기존 지침과 정본 우선순위를 보존합니다.
3. 대상 .gitignore에 다음 기본 로컬 정책을 추가합니다. 기존 ignore 규칙은 유지합니다.

~~~gitignore
/.memory/
~~~

.memory는 첫 등록·계획 때 생성됩니다. 추적되는 [공통 템플릿](.agents/skills/memory-execute/references/templates.md)을 사용하므로 이 저장소의 개인 메모리를 복사할 필요는 없습니다.

이미 .memory 파일이 Git tracked 상태라면 ignore만 추가해도 추적이 해제되지 않습니다. 실제 목록과 공유 예외를 확인한 뒤 승인된 파일만 index에서 제거하여 로컬 사본을 보존합니다.

~~~powershell
git ls-files -- .memory
# 아래는 실제로 tracked인 파일 하나에 대한 예시
git rm --cached -- .memory/current.md
~~~

스킬 호출 표기는 사용하는 에이전트 도구에 맞춥니다. 아래 /스킬명은 작업 요청 예시이며, 도구가 $스킬명 또는 자연어 지정을 지원하면 그 방식으로 같은 스킬을 선택할 수 있습니다.

## 시작 경로

~~~text
명확한 수정·이슈 → memory-intake → Plan/Phase/Task 등록 → memory-execute
중요한 설계 분기 → grill-me → 결정 확정 → memory-plan → memory-execute
~~~

명확함은 변경 규모뿐 아니라 코드 근거·범위·완료 조건·검증 경로로 판단합니다. 작은 수정에도 권한·데이터·API 의미의 미결정이 있으면 해당 부분을 확인합니다. 원하는 동작이 명확한 버그의 원인은 코드에서 조사하며, 필요한 재현 정보만 질문합니다.

새 버그 Task에는 [Bug Investigation](.agents/skills/memory-execute/references/conventions.md#bug-investigation)을 남깁니다. 최소 입력·안전한 절차/실제 명령과 cwd, 기대/실제 결과, 시도·출처·확인 시각, 확인한 환경, 원인 후보·확신·한계·다음 검증을 기록합니다. 재현 상태(`reproduced`/`not_reproduced`/`unavailable`/`code_only`)와 원인 확신(`confirmed`/`supported`/`hypothesis`/`unknown`)은 별도로 판단합니다. 재현했다는 사실만으로 원인 확정이나 테스트 통과를 뜻하지 않습니다.

원인이 미확정이거나 재현하지 못했어도 기대 동작·범위·완료 조건·검증 방법이 명확하면 확인 한계와 첫 원인 확인 단위를 포함해 등록할 수 있습니다. 등록 중에는 제품 수정이나 새 테스트를 작성하지 않으며, 기능·문서 Task와 과거 완료 기록에는 빈 버그 표를 추가하지 않습니다. 확인하지 못한 원인 위치·환경·실행 결과는 추측으로 채우지 않습니다.

인터뷰는 질문 하나씩 2~3개 선택지와 추천안을 제공합니다. 이미 확정한 선택과 코드에서 확인할 내용을 반복해서 묻지 않습니다. 등록·계획 단계에서는 제품 코드를 구현하거나 Git 커밋을 만들지 않습니다.

## 사용 예시

~~~text
/memory-intake README의 설치 경로 설명을 현재 구조에 맞게 수정
/memory-intake 저장 버튼을 눌러도 입력값이 유지되지 않아. 버그 조사 근거와 검증 방법을 포함해 등록해줘.
/grill-me 인증 정책 변경
/memory-plan 확정한 기능명
/memory-execute
current 보고 이어서 해줘
~~~

일반 기능은 P01 하나에 T01/T02로 나눕니다. 다른 실질 마일스톤이 있을 때만 Phase를 늘립니다. 상세 구현은 각 Task 폴더의 task.md 하나에 담고, Task 간 의존성을 명시합니다.

관련 요청은 기존 Plan에 추가하고 독립 목표는 새 Plan을 만듭니다. 같은 미완료 요청은 재사용하며, 완료 뒤 재발·추가 수정은 과거 기록을 보존하고 새 Task로 추적합니다.

버그 등록 보고는 실제 확인 수준을 함께 설명합니다. 예를 들어 실행하지 않고 코드만 조사했다면 "code_only, 원인 후보는 코드 근거 있음(supported), 실행 재현 미확인; 첫 단위에서 안전한 기존 검증 방법으로 확인"처럼 적습니다. 이 문구는 보고 형식 예시이며 실제 결과에 맞게 바꿉니다. 사용자 제공 로그와 에이전트의 직접 실행도 구분합니다.

## 전체 실행과 부분 실행

기본 실행은 현재 Task 하나입니다. Task별로 필수/필요 시/해당 없음 단계를 지정하고 생략 이유를 기록합니다. 실행한 단계만 보고서를 생성합니다. 적용되는 검증과 공통 최종 품질 점검을 충족한 뒤 커밋하며, 성공 또는 명시적 no-commit 완료 정책을 확인한 후 다음 Task로 전진합니다.

~~~text
/memory-execute --stage review
/memory-execute --stage test
/memory-execute --stage commit-check
현재 Task 테스트만 실행해줘
T01부터 T03까지 순서대로 진행해줘
현재 Task 구현과 검증만 하고 커밋은 하지 마
~~~

단계 단독 요청은 해당 범위만 수행합니다. 부족한 선행 증거를 만들기 위해 전체 workflow를 자동 실행하지 않습니다. 리뷰만은 제품 코드를 수정하지 않고, 테스트만은 필요한 테스트를 작성·실행할 수 있지만 제품 결함은 보고합니다. 커밋 점검만은 staging·커밋·완료·포인터 전진을 하지 않습니다.

테스트만 실행하면서 새 테스트를 추가했다면 영향받은 리뷰를 `stale`로 표시하고 재리뷰 대상을 남깁니다. 재리뷰는 후속 리뷰 요청이나 전체 Task 실행에서 수행합니다. 테스트가 통과해도 기존 리뷰의 snapshot을 검토 없이 갱신하지 않습니다.

새 요청 등록만으로 기존 활성 위치를 바꾸지 않습니다. 우선 처리 지시가 있으면 이전 재개 위치를 먼저 보존한 뒤 전환합니다. 커밋 실패나 검증 차단은 현재 Task에 남기며, 성공 커밋 뒤 기록이 끊기면 실제 커밋 내용을 확인해 상태를 복구합니다.

## 저장 구조

~~~text
.memory/
├── decisions/YYYY-MM-DD-feature.md
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
- 코드·계약 변경 뒤에는 관련 검증 증거의 최신성을 확인합니다.
- 제품 테스트와 공유 가이드는 해당 프로젝트의 기존 디렉터리에 둡니다.
- 특정 정본·앱 경로를 강제하지 않습니다. [선택적 프로필](.agents/skills/memory-execute/references/project-profile.md)이 없으면 기존 구조를 확인합니다.

.memory는 기본적으로 Git 공유·백업되지 않습니다. 다른 PC에서 이어가려면 필요한 폴더를 별도 백업·복사합니다. 문서를 Git으로 공유할 경우 명시한 예외 범위와 실제 ignore 정책을 일치시키고, 기존 진행 정보를 공개 기록으로 넣을지 검토합니다.

## 예시와 검증 범위

[상품 API Plan](examples/plans/2026-08-22-product-api.md), [Phase](examples/phases/2026-08-22-product-api/P01-core-crud/phase.md), [Task 청사진](examples/phases/2026-08-22-product-api/P01-core-crud/T01-product-schema/task.md), [포인터 예시](examples/current.md)를 통해 형식을 볼 수 있습니다.

상품 API 소스·DB·테스트 harness는 포함되어 있지 않습니다. 예시의 명령은 가정한 제품 환경용이며 실제 성공·커밋 기록이 아닙니다. 예시를 그대로 활성 작업으로 실행하지 않고, 실제 제품 저장소에서 구현 계약과 검증 명령을 먼저 확정합니다. 과거 날짜는 예시의 원 ID이며 새 Plan에는 생성일을 사용합니다.

[검증 시나리오](.agents/skills/memory-execute/references/scenarios.md)는 선택적 단계·재개·사용자 변경 보존 등의 판단 기준을 설명합니다. 파일·링크·Git 검사와 수동 walkthrough는 실제 모델 자동 실행이나 상품 API 테스트 성공과 구분합니다.

## 로컬 스킬 검증

Node.js 22.13.0 이상과 Git이 필요합니다. 저장소 root에서 다음 명령 하나로 검증기의 회귀 검사와 실제 문서·격리 Git 검사를 실행합니다.

~~~powershell
node scripts/validate-skills.mjs
~~~

성공은 exit 0, 검사 실패·도구 오류는 exit 1입니다. 다른 디렉터리에서는 스크립트의 절대 경로를 지정하면 됩니다. CLI 옵션은 없습니다. 검사 결과에는 종류별 검사 수·제외 진단 수·오류 수와 제외/실패의 파일·행·사유가 표시됩니다. fence 안 링크 여러 개는 하나의 제외 진단에 개수를 함께 표시합니다.

- **문서:** AGENTS.md, README.md, examples와 .agents/skills 아래 Markdown을 검사합니다. .memory, .git, .codeburn, node_modules와 심볼릭 링크 디렉터리는 탐색하지 않습니다.
- **스킬 frontmatter:** .agents/skills 안의 SKILL.md에서 시작/종료 `---`, top-level `name`/`description`의 누락·중복·빈값을 검사합니다. `name`은 lower kebab-case이며 부모 스킬 디렉터리명과 일치하고 다른 스킬과 중복되지 않아야 합니다. UTF-8 BOM과 CRLF를 지원하며 들여쓴 metadata 필드는 필수 필드로 세지 않습니다.
- **지원 scalar:** 한 줄 plain/quoted 문자열과 description의 `>`/`|` block(`+`/`-` 포함)을 지원합니다. 작은따옴표의 `''`와 큰따옴표의 JSON escape를 처리합니다. 숫자·boolean·null형 값은 인용해야 합니다. 필수 필드의 array/object/tag/anchor/alias, 일반 문자열의 들여쓴 continuation, block의 tab/불일치 들여쓰기 등 지원하지 않는 표현은 오류로 표시합니다. 전체 YAML 문법이나 나머지 metadata의 유효성을 검사하는 파서는 아닙니다.
- **링크:** 실제 inline/reference 상대 파일 링크와 이미지 대상의 존재를 확인합니다. fence/inline code 안의 예시, 외부 URL, 동적 placeholder, 저장소 밖 경로, 내부 anchor는 제외 이유를 표시합니다. heading/anchor의 정확한 대응은 수동 확인 대상입니다.
- **작업 식별자:** 상품 Task 예제와 공통 Task 템플릿의 metadata·폴더·메시지 마지막 Plan/Phase/Task 블록을 대조합니다. 로컬 완료 기록을 마이그레이션하지 않습니다.
- **예제 구문:** 완성형 js/javascript와 HTML의 classic inline script는 vm.Script로 검사합니다. module inline script는 Node의 --check --input-type=module로 지원하며 import를 해결하거나 코드를 실행하지 않습니다. src와 데이터 MIME script는 제외합니다.
- **classic MIME:** [WHATWG JavaScript MIME 목록](https://mimesniff.spec.whatwg.org/#javascript-mime-type)에 있는 과거 alias도 구문 검사 대상으로 포함합니다.
- **설명 조각:** 직전 줄에 `<!-- skill-check: fragment — 구체적인 이유 -->`를 붙인 코드 조각만 명시 제외합니다. 완성형 실행 예제의 오류를 이 표식으로 숨기지 않습니다.
- **HTML ID:** 각 html fence 안의 시작 태그에서 같은 ID를 찾아 중복 속성의 파일/행·최초 행을 표시합니다. 서로 다른 fence는 독립적이며 속성명은 대소문자를 구분하지 않고 ID 값은 구분합니다. 태그/속성 구분에는 HTML ASCII 공백만 사용하고 NBSP 등은 이름/값의 일부로 유지합니다. comments, script/style 및 기타 raw-text 내용, quoted 속성 안의 문자열과 data-id는 ID로 오인하지 않습니다. 빈/boolean id도 비교하지만 일반 HTML 문법 오류까지 검사하지는 않습니다.
- **ID 문자 참조:** 숫자 참조(잘못된 범위의 replacement와 C1 치환 포함)는 [HTML 규칙](https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-end-state)에 따라 한 번만 정규화합니다. named reference는 `amp`/`lt`/`gt`/`quot`와 해당 대문자형, `apos`/`nbsp`를 지원합니다. 다른 named reference가 있으면 해당 ID만 정보 진단과 함께 비교에서 제외합니다. 전체 entity 표, 실제 DOM 트리·namespace·스크립트의 동적 ID 변화는 검사 범위가 아닙니다.
- **Git:** OS 임시 저장소에서 ignore 부정 패턴·부모 제외·NUL 출력·tracked 경로·오류와 표준/과거 메시지 식별을 확인합니다. 임시 저장소의 명시 파일만 staging하고 소유 경로를 확인한 뒤 정리합니다. 실제 프로젝트의 index·config·current를 변경하지 않습니다.

회귀 검사만 실행하려면 `node --test tests/validate-skills.test.mjs`를 사용합니다. 추가 패키지 설치와 CI 설정은 필요하지 않습니다. 구현 시 확인한 환경은 Node v26.5.1과 Git 2.53.0.windows.2이며, 최소 지원 버전 전부를 시험한 것은 아닙니다.

결과 종류는 `frontmatter`, `links`, `messages`, `examples`, `html-ids`, `git`입니다. 이 명령은 지원 범위의 필수 scalar·ID·정적 구문·파일 참조·격리 Git 동작을 검사합니다. 제외 진단이 있는 검사는 해당 범위에서 부분 확인한 결과입니다. HTML 렌더링, 접근성 전반, 생성된 UI 동작, 실제 모델 workflow 실행, commit tree를 포함한 중단 복구 성공은 별도 검증이 필요합니다.

## 추가 도구

CodeBurn과 visualize는 필요할 때 독립적으로 사용할 수 있습니다.

토큰 사용량 조회와 MCP 설정은 [CodeBurn 안내](CODEBURN-SETUP.md), [번들 README](.codeburn/README.md)를 참고합니다.

~~~powershell
& .\.codeburn\codeburn.ps1 sessions -p today --provider copilot --no-pager
& .\.codeburn\install.ps1
~~~

시각화는 [visualize 스킬](.agents/skills/visualize/SKILL.md)로 요청합니다.

~~~text
/visualize 설명할 내용
~~~
