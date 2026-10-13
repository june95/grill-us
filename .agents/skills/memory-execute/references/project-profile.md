# Project Discovery and Optional Profile

특정 프로젝트의 경로·기술·이슈 추적 도구를 전제로 두지 않는다. [공통 규약](conventions.md)의 로컬 `.memory` 모델을 사용한다.

## Discovery

1. 사용자 명시 대상 경로를 우선 확인한다. 없으면 현재 작업 폴더와 열려 있는 대상 파일의 프로젝트를 확인한다. 여러 프로젝트가 실제로 혼동될 때만 한 질문으로 대상을 확정한다.
2. Git 저장소에서는 `git rev-parse --show-toplevel`, `git branch --show-current`, `git status --short`로 root·branch·기존 변경을 확인한다. 지침에 특정 PC의 절대 경로를 고정하지 않는다.
3. 적용 가능한 AGENTS 등 프로젝트 지침을 읽는다. 이어 `.memory/project.md`가 있으면 확인한다.
4. README와 기존 설계·API·데이터·운영 문서, 관련 코드·manifest·CI·테스트를 필요한 범위에서 확인한다. 정본의 위치와 우선순위는 프로젝트에서 확인한다.
5. 현재 Plan·Task·결정·단계 증거를 재사용한다. 이미 알려진 근거 때문에 같은 코드 전체를 재조사하지 않는다.

Git이 없으면 프로젝트 root를 사용자 지시·실제 작업 폴더에서 확인하고 등록·조사·계획은 수행할 수 있다. Git 커밋이 필수인 Task의 실행에서는 Git 부재를 blocker로 기록한다. 로컬 조사·명시적 no-commit 작업에 가상의 commit을 만들지 않는다.

## Skill Installation and Workspace

스킬의 설치 root와 사용자가 작업하는 프로젝트 root는 별개다. plugin metadata·스킬/참고 문서·runtime 파일을 읽은 디렉터리를 현재 프로젝트로 추정하지 않는다. 설치 cache와 생성된 package는 읽기 전용으로 취급하며 `.memory`, 테스트, 제품 변경이나 실행 상태를 그곳에 작성하지 않는다.

1. 사용자 명시 작업공간을 우선하고 실제 cwd·열린 대상 파일·Git root로 사용자 프로젝트를 확인한다. 도구가 제공한 project 경로도 실제 대상으로 대조하며 plugin 설치 경로 변수는 작업공간 근거로 사용하지 않는다.
2. 등록·계획·실행 기록의 `.memory`는 확인한 사용자 프로젝트 root 기준이다. plugin root에 `.memory`가 없다는 이유로 그곳에 새 기록을 만들거나 기존 사용자 current를 새 pointer로 덮지 않는다.
3. 실제 cwd가 설치 cache/package 내부이거나 대상 프로젝트가 혼동되면 쓰기 전에 한 질문으로 작업공간을 확정한다. 대상이 분명하면 같은 위치를 반복해서 묻지 않는다.
4. 스킬 지침과 내부 참조는 설치된 package에서 읽고, 제품·공유 정본·검증 명령·Git 정책은 사용자 프로젝트에서 발견한다. 사용 프로젝트에 이 저장소의 개발용 scripts/tests나 README/AGENTS 구조를 요구하지 않는다.

공식 배포는 공통 원본에서 생성한 plugin 경로로 제공한다. 저장소 `.agents/skills`는 개발 정본이며 수동으로 복제한 도구별 프로젝트 스킬 폴더를 별도 공식 배포 방식으로 관리하지 않는다. 개발 원본 직접 로딩과 설치 plugin을 같은 시험 세션에서 혼용하지 않는다. 기존 설치본은 자동 삭제·변환·덮어쓰지 않는다.

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
