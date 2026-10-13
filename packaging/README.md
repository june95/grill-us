# grill-us plugin

공통 원본에서 생성한 메모리 5개와 visualize의 패키지입니다. 이 문서는 생성 package의 사용자 안내 원본이며 아래 `skills/` 경로는 package root 기준입니다. 개별 스킬 이름은 유지하고 grill-me 별칭은 추가하지 않습니다.

## 검증 상태

이 단계에서는 패키지 생성·참조·회귀 및 manifest의 정적 타당성을 확인합니다. **Codex·Claude Code의 실제 발견·호출과 최소 지원 버전은 후속 T02 검증 전 미확인**입니다. 현재 로컬 CLI 버전을 최소 지원 버전으로 단정하지 않습니다. 공개 marketplace에 게시하거나 개인 설정·설치본을 자동 변경하지 않습니다.

## 제공 스킬과 선택

| 스킬 | 사용할 때 | Claude 문서상의 호출 표기 |
| :--- | :--- | :--- |
| grill-me | 중요한 설계 선택을 한 질문씩 확정 | `/grill-us:grill-me` |
| memory-intake | 명확한 수정·이슈를 등록 | `/grill-us:memory-intake` |
| memory-plan | 확정 요청을 Plan/Phase/Task로 분할 | `/grill-us:memory-plan` |
| memory-execute | 현재 Task 또는 명시 단계 실행 | `/grill-us:memory-execute` |
| memory-explain | 기록·코드·Git 근거로 설명 | `/grill-us:memory-explain` |
| visualize | 명시한 HTML 시각화 생성 | `/grill-us:visualize` |

Claude의 plugin namespace 표기는 [공식 skills 문서](https://code.claude.com/docs/en/skills)를 근거로 하며 이 패키지의 실제 호출 성공은 아직 확인하지 않았습니다. Codex에서는 사용하는 표면의 plugin 선택/스킬 목록에서 **grill-us**를 명시해 선택합니다. `grill-us 플러그인의 memory-execute로 현재 Task 진행`처럼 이름을 포함해 요청할 수 있지만, 특정 표면의 정확한 표시·호출 구문과 동명 공존은 T02에서 실제 확인합니다. 다른 동명 grill-me를 이 패키지의 스킬로 오인하지 않습니다.

## 경로와 작업 기록

설치/cache 경로는 읽기 전용 스킬 위치입니다. `skills/memory-execute/references/project-profile.md`의 작업공간 발견 절차로 **사용자 프로젝트 root**를 확인한 뒤 그곳의 `.memory`에 기록합니다. metadata·runtime 경로를 사용자 프로젝트로 추정하지 않고, 혼동되면 쓰기 전에 질문합니다. 사용자 프로젝트의 지침·정본·Git 정책을 존중하며 특정 README/AGENTS 구조나 개발용 검증기를 요구하지 않습니다.

같은 `.memory`를 변경하는 실행 담당은 한 번에 한 명입니다. 도구를 바꿀 때 기록으로 순차 재개합니다. 적용 review는 기본 읽기 전용 별도 위임이고 불가하면 사유를 알리고 자체 리뷰로 계속합니다. 실제 finding은 대체 절차로 지우지 않고 독립/자체 모드와 한계를 기록합니다. 리뷰어는 결과만 반환하고 실행 담당만 상태·수정·Git을 처리합니다.

기본 설명은 채팅이며, 명시 HTML 요청에만 visualize를 적용합니다. 기록 설명만으로 `.memory`·제품·Git 변경이나 실제 위임을 수행하지 않습니다.

## 배포와 개발 구분

개발 정본은 저장소 `.agents/skills`입니다. 공식 배포는 이 정본과 단일 metadata에서 생성한 plugin입니다. 개발 원본 직접 로딩과 설치 plugin을 같은 시험 세션에서 혼용하지 않습니다. 도구별 프로젝트 폴더 사본은 새 공식 배포 방식으로 관리하지 않고 기존 설치본은 자동 삭제·변환하지 않습니다.

Codex는 [공식 package 안내](https://developers.openai.com/plugins/build/plugins)의 지원 표면/승인한 plugin 경로를, Claude는 [공식 plugin 안내](https://code.claude.com/docs/en/plugins-reference)의 plugin 경로를 사용합니다. 설치·호출 시험의 구체 경로와 성공 범위는 T02가 확정합니다. 여기의 정적 성공만으로 이미 설치됐거나 동작한다고 표현하지 않습니다.

CodeBurn 스킬·런타임, `.memory`, 사용자 검토 HTML, 개발용 scripts/tests, 개인 설정·Git·비밀 파일은 포함하지 않습니다. `build.json`은 명시 파일 목록과 원본 SHA256을 제공하고 `.grill-us-build.json`은 생성기 소유 표식입니다. 생성물은 수동 편집하지 않습니다. 알 수 없는 사용자 파일이나 기존 생성물의 수동 변경이 있으면 재빌드는 덮어쓰지 않고 중단합니다.

visualize의 원 author/license/version 고지는 그대로 보존합니다. `skills/visualize/references/provenance.md`에 확인한 로컬 이력과 미확인 upstream 정보가 있습니다. 원본 일부의 MIT 고지를 패키지 전체 license로 확대하지 않습니다.
