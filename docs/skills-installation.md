# skills CLI 설치 안내 — 전환 준비

현재 공식 설치는 [기존 플러그인 안내](https://github.com/june95/grill-us/blob/main/packaging/README.md)를 따른다. 아래 GitHub 명령은 최종 전환 후 사용할 안내 초안이다. 준비 후보 검증은 공개 주소 반영이나 Claude native 검증 완료를 의미하지 않는다.

## 최종 전환 후 설치

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

공식 항목은 `prj-grill-me`, `prj-memory-intake`, `prj-memory-plan`, `prj-memory-execute`, `prj-memory-review`, `prj-memory-explain`, `prj-memory-wiki`, `prj-page-capture`, `prj-visualize`의9개다. 필요한 공통 문서는 각 스킬 안에 포함하며 다른 스킬 등록을 자동 설치하지 않는다. 후속 작업에 다른 항목이 필요하면 해당 이름을 안내한다.

Codex에서는 `$prj-memory-explain`, Claude Code에서는 `/prj-memory-explain`처럼 선택한다. 스킬/참고 문서가 있는 위치와 작업 프로젝트를 구분하고 `.memory`는 원래 사용자 프로젝트에 보존한다.

## 목록·제거·업데이트

```sh
npx skills@latest list
npx skills@latest remove prj-memory-explain -a codex
npx skills@latest remove prj-memory-explain -a claude-code
```

전역 항목에는 같은 범위의 `-g`를 사용한다. 제거할 이름과 에이전트·scope를 먼저 확인한다. 업데이트는 CLI가 제공하는 `update` 명령을 사용하지만, 이번 로컬 준비 후보 시험은 공개 주소의 원격 업데이트나 무인 갱신 성공을 검증한 것이 아니다. 현재 버전의 help와 실제 결과를 확인한다.

## 기존 plugin 사용자

최종 전환 후 새 public 이름과 실제 읽는 경로를 확인하고 필요할 때 정확한 기존 `grill-us@grill-us` 설치 항목을 직접 제거한다. 기존 프로젝트 `.memory`를 이동하거나 재생성할 필요는 없다. 새 설치를 기존 plugin 설치 성공으로 대신 판단하지 않는다.

## 검증 범위

Windows의 Node26.12.1/skills1.7.4에서 기존 생성물의 실제 단독·전체 설치/정확한 제거·파일 SHA를 확인했고, Codex0.166.0과 Claude2.1.316에서 각 대표 호출3건을 확인했다. Claude는 프로젝트 source를 활성화한 읽기 전용 도구 구성으로 전체9개/단독1개 발견과 설치 문서·참고 문서 읽기를 확인했다. 전환 후보의 수정된 배포 단락은 별도 payload이며 native 영향 검증이 남아 있다.

현재 준비 명령으로 만든 후보의 default/wildcard 검색·명시 public 설치·clone/LF 확인은 개발용 별도 시험이다. 다른 OS/버전·실제 사용자 global native 호출·전체 workflow의 성공을 보장하지 않는다. 실제 저장소의 기본 경로 전환과 기존 plugin 제거는 후속 검증 이후에 수행한다.
