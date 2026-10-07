# Project Discovery and Optional Profile

특정 프로젝트의 경로·기술·이슈 추적 도구를 전제로 두지 않는다. [공통 규약](conventions.md)의 로컬 `.memory` 모델을 사용한다.

## Discovery

1. 사용자 명시 대상 경로를 우선 확인한다. 없으면 현재 작업 폴더와 열려 있는 대상 파일의 프로젝트를 확인한다. 여러 프로젝트가 실제로 혼동될 때만 한 질문으로 대상을 확정한다.
2. Git 저장소에서는 `git rev-parse --show-toplevel`, `git branch --show-current`, `git status --short`로 root·branch·기존 변경을 확인한다. 지침에 특정 PC의 절대 경로를 고정하지 않는다.
3. 적용 가능한 AGENTS 등 프로젝트 지침을 읽는다. 이어 `.memory/project.md`가 있으면 확인한다.
4. README와 기존 설계·API·데이터·운영 문서, 관련 코드·manifest·CI·테스트를 필요한 범위에서 확인한다. 정본의 위치와 우선순위는 프로젝트에서 확인한다.
5. 현재 Plan·Task·결정·단계 증거를 재사용한다. 이미 알려진 근거 때문에 같은 코드 전체를 재조사하지 않는다.

Git이 없으면 프로젝트 root를 사용자 지시·실제 작업 폴더에서 확인하고 등록·조사·계획은 수행할 수 있다. Git 커밋이 필수인 Task의 실행에서는 Git 부재를 blocker로 기록한다. 로컬 조사·명시적 no-commit 작업에 가상의 commit을 만들지 않는다.

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

- 명령 실행 전 실제 checkout/cwd와 결과에 관련된 runtime/tool 버전·lockfile·manifest·test/build 설정을 읽어 [Environment Evidence](conventions.md#environment-evidence)로 기록한다. 관련 없는 항목은 수집하지 않으며 비밀 아닌 설정 요약만 남긴다.
- 존재하는 읽기 전용 버전 명령과 관련 파일 hash를 사용한다. 확인 불가 사유를 기록하며 값을 얻기 위해 도구 설치·업그레이드·설정을 자동 변경하지 않는다. 경로명/branch 변화와 실제 대상·환경 내용 변화를 구분한다.
- 현재 manifest의 scripts, 언어별 프로젝트 설정, CI와 README를 확인해 최소 관련 command와 cwd를 선택한다.
- 테스트 파일은 기존 suite·이름·fixture 관례를 따른다. 프로젝트의 실행 가능한 테스트를 `.memory` 안에 새 harness로 만들지 않는다.
- 위험과 완료 조건에 맞는 static/unit/integration/E2E를 선택한다. 새 테스트는 검증할 의미 있는 동작·회귀 위험이 있을 때 작성한다.
- 문서 수정은 필요한 문구·링크·구문·diff 검사가 완료 근거가 될 수 있다. 특정 앱 명령을 실행한 것처럼 기록하지 않는다.
- 검증 기록은 command, cwd, 실제 exit/result, 대상 Revision·파일 snapshot, 생략·차단 사유를 포함한다. 같은 대상의 유효한 결과는 재사용한다.
- 없는 명령을 추측해서 성공으로 기록하지 않는다. 환경·서비스·credential 문제가 실제 검증을 막으면 그 제약과 가장 가까운 대체 확인을 구분해 기록한다.
