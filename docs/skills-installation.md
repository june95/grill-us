# skills CLI 설치 안내

승인된 공식 설치 경로는 skills CLI와 public `prj-*` 10개다. 이 변경은 아직 공개 push 전이며 아래 GitHub 주소가 새 snapshot을 제공하는지는 공개 반영 후 별도 확인해야 한다. 로컬 후보 검증을 공개 주소 설치 성공으로 해석하지 않는다.

## 설치

Node.js와 npx가 필요하다. 시험한 skills CLI 1.7.4는 Node.js 22.20 이상을 요구한다. 별도 저장소 빌드는 필요하지 않다.

```sh
npx skills@latest add june95/grill-us
```

설치할 스킬과 에이전트를 선택한다. 기본은 현재 프로젝트이며 `-g`는 사용자 전역 설치다. 공식 지원 대상은 Codex와 Claude Code다. 다른 에이전트는 이번 호환성 확인 범위에 포함하지 않는다.

개별 선택 예시:

```sh
npx skills@latest add june95/grill-us --skill prj-memory-explain -a codex
npx skills@latest add june95/grill-us --skill prj-memory-explain -a claude-code
```

공식 항목은 `prj-grill-me`, `prj-memory-intake`, `prj-memory-plan`, `prj-memory-execute`, `prj-memory-review`, `prj-memory-explain`, `prj-memory-tidy`, `prj-memory-wiki`, `prj-page-capture`, `prj-visualize`의10개다. 필요한 공통 문서는 각 스킬 안에 포함하며 다른 스킬 등록을 자동 설치하지 않는다. 후속 작업에 다른 항목이 필요하면 해당 이름을 안내한다.

Codex에서는 `$prj-memory-explain`, Claude Code에서는 `/prj-memory-explain`처럼 선택한다. 스킬/참고 문서가 있는 위치와 작업 프로젝트를 구분하고 `.memory`는 원래 사용자 프로젝트에 보존한다.

## 목록·제거·업데이트

```sh
npx skills@latest list
npx skills@latest remove prj-memory-explain -a codex
npx skills@latest remove prj-memory-explain -a claude-code
```

전역 목록·제거에는 같은 범위의 `-g`를 사용한다. 제거할 이름과 에이전트·scope를 먼저 확인한다. 설치는 기본 링크 모드와 `--copy`를 선택할 수 있다. Codex 프로젝트 설치는 `.agents/skills`, Claude Code는 `.claude/skills`의 실제 경로와 이름을 확인한다.

~~~sh
npx skills@latest update prj-memory-explain --project
npx skills@latest update prj-memory-explain --global
~~~

시험한1.7.4의 실제 help/코드는 이름 선택과 project/global update를 제공한다. `check`도 같은 update 함수로 연결되므로 **읽기 전용 업데이트 검사로 안내하지 않는다.** 최신 CLI는 `--help`와 실제 결과를 확인한다. 로컬 source의 설치 시험은 공개 GitHub source의 원격 업데이트나 무인 갱신을 검증하지 않는다. 업데이트 명령은 선택한 scope의 다른 에이전트 연결에도 영향을 줄 수 있으므로 설치 source와 목록을 먼저 확인한다.

## 기존 plugin 사용자

새 public 이름과 실제 읽는 경로를 확인하고 필요할 때 정확한 기존 `grill-us@grill-us` 설치 항목을 직접 제거한다. 기존 프로젝트 `.memory`를 이동하거나 재생성할 필요는 없다. 새 설치를 기존 plugin 설치 성공으로 대신 판단하지 않는다.

~~~sh
codex plugin remove grill-us@grill-us
claude plugin uninstall grill-us@grill-us --scope user
~~~

위 identity와 scope로 설치했던 사용자만 직접 실행한다. 다른 scope/사본은 먼저 설치 목록과 경로를 확인한다. marketplace 전체 제거·cache 강제 삭제·기존 세션 종료는 요구하지 않는다. 옛 이름은 `$grill-us:memory-explain` / `/grill-us:memory-explain`, 새 이름은 `$prj-memory-explain` / `/prj-memory-explain`이다. 마지막 안내용 plugin 릴리스를 추가하지 않는다.

## 다른 스킬과 함께 쓸 때

Claude Code와 Codex는 설치된 스킬의 description을 보고 요청마다 스킬을 스스로 고른다. 역할이 비슷한 스킬이 함께 있으면 의도와 다른 스킬이 켜지거나 여러 스킬이 함께 켜질 수 있다.

- 특정 스킬을 확실히 쓰려면 이름으로 직접 부른다. Claude Code는 `/prj-visualize`, Codex는 `$prj-visualize`처럼 쓴다.
- 시각화·캡처·리뷰처럼 역할이 겹치는 외부 팩이나 전역 스킬을 함께 설치하면 자동 선택이 겹칠 수 있다.
  - 호스트에 기본으로 들어 있는 스킬도 마찬가지다.
  - 2026-11-03 측정에서는 대시보드 시각화 요청 3회 모두 Claude Code 번들 `dataviz`가 켜졌다. `prj-visualize`는 그중 1회만 함께 켜졌다.
- 같은 이름을 프로젝트와 사용자 전역(`-g`)에 함께 설치했을 때 어느 쪽을 읽는지는 확인하지 않았다. 한 scope에만 두는 것을 권장한다.
- 측정 근거와 한계는 [호환성 안내](https://github.com/june95/grill-us/blob/main/docs/skills-compatibility.md)의 "실제 발동 측정" 절에 있다. 이 저장소는 외부 팩의 description이나 본문을 저장하지 않는다.

## 검증 범위

Windows의 Node26.12.1/skills1.7.4에서 최종 후보의 기본·전체 검색9개와 두 에이전트의 전체/단독 설치 bytes를 대조했다. Codex0.166.0·Claude2.1.316의 설명·리뷰·인터뷰 각3건에서 설치된 전체 SKILL, 자체 참고 문서와 변경된 설치/작업공간 절을 읽고 fixture·Git·payload 변경이 없음을 확인했다. 실제 저장소의 최종 회귀 결과는 [호환성 안내](https://github.com/june95/grill-us/blob/main/docs/skills-compatibility.md)에 구분한다.

위 수치는 공개 스킬이 9개였던 당시 결과다. 0.6.0에서 추가한 `prj-memory-tidy`는 이 native 호출 확인에 들지 않았다. 로컬 회귀(`node scripts/validate-skills.mjs`)는 고정한 skills CLI로 10개의 단독·전체 설치를 대조한다. `prj-memory-tidy`의 실제 발동은 아직 측정하지 않았다.

공식 public10개는 `skills/` 생성물이며 개발 source10개와 CodeBurn의 internal 표시는 기본 검색에서 숨기는 정책이다. 명시 internal 요청/opt-in은 공식 설치 범위 밖이며 비밀 보호 수단이 아니다. 다른 OS/CLI 버전·global native 호출·전체 workflow·공개 주소 설치/업데이트는 별도 검증이다. 기존 plugin의 당시 결과를 새 방식 성공으로 확대하지 않는다.
