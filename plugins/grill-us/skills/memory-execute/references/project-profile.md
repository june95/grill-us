# Project Discovery and Optional Profile

특정 프로젝트의 경로·기술·이슈 추적 도구를 전제로 두지 않는다. [공통 규약](conventions.md)의 로컬 `.memory` 모델을 사용한다.

## Discovery

1. 사용자 명시 대상 경로를 우선 확인한다. 없으면 현재 작업 폴더와 열려 있는 대상 파일의 프로젝트를 확인한다. 여러 프로젝트가 실제로 혼동될 때만 한 질문으로 대상을 확정한다.
2. Git 저장소에서는 `git --no-optional-locks rev-parse --show-toplevel`, `git --no-optional-locks branch --show-current`로 root·branch를 확인한다. 기존 변경과 파일 수는 아래 [Change Inventory](#change-inventory)로 구분한다. 지침에 특정 PC의 절대 경로를 고정하지 않는다.
3. 적용 가능한 AGENTS 등 프로젝트 지침을 읽는다. 이어 `.memory/project.md`가 있으면 확인한다.
4. README와 기존 설계·API·데이터·운영 문서, 관련 코드·manifest·CI·테스트를 필요한 범위에서 확인한다. 코드·문서 내용 탐색은 [Bounded Exploration](#bounded-exploration)로 좁히고, 정본의 위치와 우선순위는 프로젝트에서 확인한다.
5. 현재 Plan·Task·결정·단계 증거를 재사용한다. 이미 알려진 근거 때문에 같은 코드 전체를 재조사하지 않는다.

Git이 없으면 프로젝트 root를 사용자 지시·실제 작업 폴더에서 확인하고 등록·조사·계획은 수행할 수 있다. Git 커밋이 필수인 Task의 실행에서는 Git 부재를 blocker로 기록한다. 로컬 조사·명시적 no-commit 작업에 가상의 commit을 만들지 않는다.

## Bounded Exploration

이 절은 등록·계획·분석에서 내용을 찾는 공통 절차다. 내용 탐색이 독립 review/explain에 필요할 때도 기존 무쓰기 경계를 유지한다. 전체 Git 상태를 읽는 Change Inventory와 코드 전체를 열람하는 일은 구분한다.

1. **출발 범위:** 사용자 명시 파일/경로, Task Related Files, 기존 reference의 정확한 위치를 먼저 읽는다. 필요한 프로젝트 지침은 대상 파일의 상위 디렉터리와 확인한 root에서 찾는다. AGENTS를 찾으려고 전체 vendor/의존성 트리를 재귀 탐색하지 않는다. 기존 profile·README에서 소유 모듈을 알면 그 범위부터 시작한다.
2. **파일명/문자열:** 알려진 파일은 직접 읽고, 위치만 찾을 때는 제한 경로의 `rg --files`·literal `rg -F`를 우선한다. 정규식이 필요하면 그 목적을 구분한다. 결과의 파일·행은 후보이며 실제 정의/관련 조건을 읽어 확인한다. 쉘에서 경로·검색 문자열을 안전하게 인자로 넘기며 개행·공백을 경로 구분자로 해석하지 않는다.
3. **심볼 관계:** 현재 호스트에 이미 노출된 심볼 도구가 있으면 정의/참조/구현/호출 관계에 활용한다. 없으면 제한한 exact 검색과 호출부 읽기로 같은 근거를 확인한다. 특정 MCP/CLI 이름을 가정하거나 탐색을 위해 설치·전역 설정 변경을 하지 않는다.
4. **개념 탐색:** 위치를 모를 때는 알려진 소유 모듈의 README·파일명·관련 용어부터 좁힌다. 이미 사용 가능한 의미 검색 도구는 선택적으로 이용하고, 결과를 실제 파일/심볼/호출부와 재대조한다. 검색 순위나 요약만으로 실행 흐름·정본을 확정하지 않는다.
5. **확장:** 현재 후보 → 관련 모듈 → 필요한 상위 범위 순으로, 무엇을 못 찾았고 왜 넓혀야 하는지 짧게 설명한 뒤 확장한다. 정확한 파일 요청에서 무관한 repo-wide 파일 목록/내용 검색/전수 hash를 선행 조건으로 만들지 않는다. 넓은 검색의 기본 대상에서 `.git/`, `node_modules/`, `vendor/`, 확인된 생성물을 제외하고, 사용자 명시 대상이면 필요한 부분만 예외로 읽는다.
6. **숨김/제외 경로:** Git ignore 기본 동작을 유지한다. 명시한 `.memory`나 특정 ignored 자료가 필요한 경우에만 해당 경로로 hidden/no-ignore 범위를 제한한다. 아무 결과가 없다는 이유로 전체 저장소의 숨김·비밀 파일을 무조건 펼치지 않는다.
7. **실패와 부분 출력:** 성공한 검색의 결과 없음, 도구 미제공/실행 파일 부재, 권한 거부, 명령 실패, 출력 잘림을 별도로 보고한다. 도구가 없으면 이미 있는 호스트 검색/파일 도구로 대체한다. 잘린 출력에서 보이지 않는 내용을 ‘없음’으로 판정하지 않고 파일·패턴·행 범위를 좁혀 재조회한다. 제공된 일부 발췌문도 전체 source나 현재 코드의 근거로 대신하지 않는다. 필요한 근거를 확보하지 못하면 미확인과 다음 확인을 남긴다.
8. **재사용과 보고:** 같은 source snapshot의 기존 근거는 재사용하고 현재 관련 정의/호출부와 핵심 사실을 확인한다. 무관한 모든 파일의 hash나 과거 이력 전수 읽기를 요구하지 않는다. 답변/청사진에 실제 확인 파일·심볼·조건·호출 관계와 미확인 범위를 연결한다. 탐색 사실을 구현·테스트 실행 성공으로 바꾸지 않는다.

이 절은 새 검색 엔진·sandbox·상태 schema를 추가하지 않는다. 상위 사용자 지시/호스트 정책과 기존 구현 금지·쓰기 권한이 우선이며, 도구 부재가 권한 확대나 필수 근거 생략의 사유는 아니다.

## Change Inventory

전체 변경 현황·파일 개수·Task 귀속을 설명하거나 staging 경계를 정할 때 다음 읽기 전용 조회를 사용한다.

~~~text
git --no-optional-locks status --porcelain=v1 -z --untracked-files=all
~~~

1. 명령의 실제 cwd·성공 exit·완전한 출력을 먼저 확인한다. 조회 실패, Git 부재, 잘린 출력은 **미확인/부분 확인**이다. 성공한 빈 결과와 구분하며 변경 0개로 대체하지 않는다.
2. 출력은 NUL 구분 레코드로 읽는다. 일반 항목은 `XY path`이고, rename/copy는 첫 레코드의 **대상 경로 다음에 이전 경로가 별도 NUL 항목**으로 온다. X 또는 Y에 R/C가 있으면 뒤의 이전 경로를 소비한다. 사람이 보는 줄 수·공백·`->`로 경로를 분리하지 않고 파일명을 trim/재해석하지 않는다. 공백·한글·개행·따옴표가 있어도 해당 경로 하나를 보존한다. NUL을 보존하는 호스트 도구나 일회성 읽기 계산을 쓰며 영구 parser/helper를 프로젝트에 만들지 않는다.
3. `??`는 untracked다. 일반 tracked 항목은 X(index)가 공백이 아니면 staged, Y(worktree)가 공백이 아니면 tracked working 변경으로 집계한다. 두 범주에 동시에 속한 파일은 각 범주에 포함하되 **전체 합계는 대상 경로의 합집합**으로 한 번만 센다. rename/copy의 이전 경로는 보조 정보이며 별도 변경 파일로 더하지 않는다. unmerged 상태는 충돌로 따로 밝히고 정상 staging/commit 준비로 해석하지 않는다.
4. `git status --short`의 `folder/` 한 줄을 파일 하나로 세지 않는다. 위 명령은 ignored 파일을 무조건 펼치는 명령이 아니며, 서브모듈은 부모 저장소의 항목으로 표시될 수 있다. 내부 파일까지 센 결과나 OS 전체 변경 수로 확대하지 않는다. 예상 밖 형식·불완전한 rename 쌍이 있으면 추정 집계 대신 한계를 보고한다.
5. **범주별 개수, 전체 고유 경로 수, 확인 범위**를 설명한다. 예: tracked working 0, staged 0, untracked 73이면 전체 73개이며 “미커밋 변경 없음”이 아니다. 한 파일이 staged와 unstaged에 함께 있으면 각각 1개, 전체는 1개다.
6. Task의 후보 경로·실제 diff/commit·기존 기록과 대조하여 관련·무관·귀속 불명확을 구분한다. 후보와 겹치는 사실만으로 작성 주체·의도를 확정하지 않는다. untracked를 자동으로 현재 Task 산출물이나 사용자가 작성한 파일로 단정하지 않는다. 파일 개수와 Task done/미완료는 별개이며, 집계만으로 Task를 생성·완료 취소·전환하지 않는다.

독립 설명/리뷰는 상태를 확인하기 위해 add/reset/checkout/clean/init·보고/current 쓰기를 하지 않는다. 원래 있던 사용자 변경과 index를 유지한다. Git 없는 명시 파일 검토는 파일 근거로 계속할 수 있지만 저장소 전체 집계는 미확인으로 남긴다.

## Skill Installation and Workspace

스킬의 설치 root와 사용자가 작업하는 프로젝트 root는 별개다. plugin metadata·스킬/참고 문서·runtime 파일을 읽은 디렉터리를 현재 프로젝트로 추정하지 않는다. 설치 cache와 생성된 package는 읽기 전용으로 취급하며 `.memory`, 테스트, 제품 변경이나 실행 상태를 그곳에 작성하지 않는다.

1. 사용자 명시 작업공간을 우선하고 실제 cwd·열린 대상 파일·Git root로 사용자 프로젝트를 확인한다. 도구가 제공한 project 경로도 실제 대상으로 대조하며 plugin 설치 경로 변수는 작업공간 근거로 사용하지 않는다.
2. 등록·계획·실행 기록의 `.memory`는 확인한 사용자 프로젝트 root 기준이다. plugin root에 `.memory`가 없다는 이유로 그곳에 새 기록을 만들거나 기존 사용자 current를 새 pointer로 덮지 않는다.
3. 실제 cwd가 설치 cache/package 내부이거나 대상 프로젝트가 혼동되면 쓰기 전에 한 질문으로 작업공간을 확정한다. 대상이 분명하면 같은 위치를 반복해서 묻지 않는다.
4. 스킬 지침과 내부 참조는 설치된 package에서 읽고, 제품·공유 정본·검증 명령·Git 정책은 사용자 프로젝트에서 발견한다. 사용 프로젝트에 이 저장소의 개발용 scripts/tests나 README/AGENTS 구조를 요구하지 않는다.

공식 배포는 공통 원본에서 생성한 plugin 경로로 제공한다. 저장소 `.agents/skills`는 개발 정본이며 수동으로 복제한 도구별 프로젝트 스킬 폴더를 별도 공식 배포 방식으로 관리하지 않는다. 개발 원본 직접 로딩과 설치 plugin을 같은 시험 세션에서 혼용하지 않는다. 기존 설치본은 자동 삭제·변환·덮어쓰지 않는다.

이 저장소의 배포 관리에서는 ignored `dist/grill-us`를 로컬 빌드로, tracked `plugins/grill-us`를 Git 배포 snapshot으로 구분한다. 양쪽은 `.agents/skills`·packaging 정본에서 생성하며 snapshot을 새 편집 정본으로 취급하지 않는다. 배포 입력/생성물은 LF로 유지하고 `node scripts/build-plugin.mjs --publish` 및 `--check-published`로 갱신/무쓰기 최신성을 확인한다. 이 명령·Git 추적 예외는 이 배포 저장소에 한정하며 설치 대상 사용자 프로젝트에 요구하지 않는다.

## Optional Profile

`.memory/project.md`는 선택적인 Markdown 설정이다. 파일 없이도 Discovery로 동작한다. 설정을 만들거나 바꿀 필요가 없다면 빈 설정을 생성하지 않는다.

```markdown
# Project Profile

## Guide Paths
- {프로젝트 기준 상대 경로}

## Test Roots
- {기존 테스트 디렉터리 상대 경로}

## Validation Commands
| Command | Cwd | Purpose |
| :--- | :--- | :--- |
| {실제 명령} | {프로젝트 기준 상대 디렉터리} | {검증 목적} |

## Tracker
- 없음 또는 {사용 중인 도구·기존 이슈 식별 방식}

## Memory Share Exceptions
- 없음 또는 {명시적으로 Git 공유하기로 한 .memory 상대 경로}
```

| Field | Type | Default |
| :--- | :--- | :--- |
| Guide Paths | list[path] | Discovery로 관련 정본 확인 |
| Test Roots | list[path] | 실제 기존 suite 확인 |
| Validation Commands | list[{command,cwd,purpose}] | manifest·CI·README에서 확인 |
| Tracker | string 또는 없음 | 없음; 의무 등록 질문 없음 |
| Memory Share Exceptions | list[path] | `[]`, `.memory` 로컬 |

프로필은 실행 코드나 승인 우회 장치가 아니다. command·cwd·path가 현재 프로젝트에 맞는지 읽어서 검토한 뒤 사용한다. 경로 존재를 확인하고 source root를 벗어나는 쓰기·삭제·이동을 임의로 수행하지 않는다.

## Authority

- 상위 사용자 지시와 적용 가능한 프로젝트 지침을 우선한다. 프로필은 실제 경로와 명령의 보조 정보다.
- 현재 코드가 정본과 다르면 drift로 기록한다. 외부 best practice나 새 프로필로 공유 계약을 자동 재정의하지 않는다.
- 설계 변경에는 명시적 승인 근거, 영향 계약·문서 목록, 의존 구현 전에 필요한 정본 반영을 기록한다.
- 정본이나 소유자 검토 규칙이 실제로 있는 프로젝트에서는 존중한다. 존재하지 않는 특정 문서 번호·역할·데이터베이스·프레임워크를 강제하지 않는다.
- 필요한 실제 계약이 누락·충돌하여 판단할 수 없을 때 차단한다. 예시 경로가 없다는 이유만으로 차단하지 않는다.
- 공유 예외가 선언돼 있어도 Git ignore 상태를 확인한다. 내용 추가를 위해 force-add하지 않는다. 예외 적용이 필요하면 명시된 공유 범위와 기존 ignore 정책을 먼저 일치시킨다.

## Validation Discovery

- 현재 manifest의 scripts, 언어별 프로젝트 설정, CI와 README를 확인해 최소 관련 command와 cwd를 선택한다.
- 실제 checkout/cwd·관련 도구/설정은 [Environment Evidence](conventions.md#environment-evidence)로 확인·기록한다. 비밀/전체 환경 수집이나 근거 수집을 위한 자동 설치·설정 변경은 하지 않는다.
- 테스트 파일은 기존 suite·이름·fixture 관례를 따른다. 프로젝트의 실행 가능한 테스트를 `.memory` 안에 새 harness로 만들지 않는다.
- 위험과 완료 조건에 맞는 static/unit/integration/E2E를 선택한다. 새 테스트는 검증할 의미 있는 동작·회귀 위험이 있을 때 작성한다.
- 문서 수정은 필요한 문구·링크·구문·diff 검사가 완료 근거가 될 수 있다. 특정 앱 명령을 실행한 것처럼 기록하지 않는다.
- 기록/재사용 기준은 [Evidence and Completion](conventions.md#evidence-and-completion), 위험별 검증 수준은 [testing](testing.md#levels)을 따른다. 실제 실행 범위와 한계를 구분한다.
- 없는 명령을 추측해서 성공으로 기록하지 않는다. 환경·서비스·credential 문제가 실제 검증을 막으면 그 제약과 가장 가까운 대체 확인을 구분해 기록한다.
