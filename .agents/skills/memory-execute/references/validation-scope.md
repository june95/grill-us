# Local Skill Validation Scope

이 문서는 저장소 개발·배포 검증기의 지원·제외 범위 정본이다. 검사기는 설치할 플러그인에 포함하지 않으며 사용자 프로젝트의 README/AGENTS 구조나 `.memory`를 검사하는 도구가 아니다. 스킬 사용자가 별도 검사기를 설치할 필요는 없다.

## Command and Targets

저장소 root에서 `node scripts/validate-skills.mjs`를 실행한다. Node.js 22.13.0 이상과 Git이 필요하며 추가 패키지나 CI는 요구하지 않는다. 회귀 검사만은 `node --test tests/validate-skills.test.mjs`다. 공개 CLI에 옵션은 없고 export된 `main({root, runRegressionTests})`의 root 인자는 저장소 소유 테스트 fixture용이다.

탐색 대상은 root AGENTS.md/README.md, examples, .agents/skills의 Markdown이다. `.memory`, `.codeburn`, node_modules, .git은 탐색하지 않는다. symlink를 따라 저장소 밖을 읽지 않으며 임시 Git 실험은 검증기 소유 OS 임시 경로에서만 수행한다. 어떤 원본 문서·사용자 index·설정을 수정하지 않는다.

## Result Categories

| 종류 | 확인 범위 |
| :--- | :--- |
| frontmatter | SKILL.md 필수 문자열·이름과 폴더 대응·중복 |
| links | 지원 로컬 파일 및 Markdown 제목 anchor, source file/line 진단 |
| messages | 예제/템플릿의 Plan·Phase·Task 식별과 terminal trailer |
| examples | 완성형 JavaScript/HTML inline script 구문, 실행하지 않고 파싱 |
| html-ids | 한 HTML fence의 중복 ID와 지원 entity 정규화 |
| memory-examples | 교육용 Task/Current/Plan/Phase의 형식과 요약 관계 |
| git | 격리 저장소 ignore·trailer 동작 |

지원 범위의 오류는 exit 1, 오류가 없으면 exit 0이다. 제외 진단이 있는 항목은 부분 확인이며 checked로 성공을 세지 않는다. 검사 성공은 실제 모델 실행·제품 테스트·브라우저 렌더링 성공을 뜻하지 않는다.

## Markdown Links and Anchors

- inline/reference 링크, 괄호·공백 경로, percent encoding을 지원한다. `#fragment`는 같은 파일, `file.md#fragment`는 대상 파일의 제목을 확인한다. 빈 `#`는 문서 시작이다. 잘못된 encoding과 지원 제목에 없는 anchor는 오류다.
- 제목은 fence·유효한 시작 frontmatter·HTML comment 밖의 0~3칸 들여쓰기 ATX와 일반 paragraph의 setext를 지원한다. 제목의 inline code·강조·단순 Markdown 링크는 표시 텍스트로 읽는다.
- slug는 소문자화, Unicode 문자/숫자/결합 기호와 underscore/hyphen 보존, 그 외 구두점 제거, 공백을 hyphen으로 치환한다. 중복과 이미 사용한 suffix를 피하며 `-1`, `-2` 순으로 확장한다. 전체 GitHub/CommonMark renderer 호환을 주장하지 않는다.
- 외부 URL·동적 placeholder·fence 안 가상 경로·저장소 밖 링크·`.memory` 대상은 제외한다. Markdown 외 파일의 fragment도 제외한다.
- raw HTML id/heading, nested list/blockquote heading, custom heading 속성, 지원 밖 named entity 등은 완전하게 해석하지 않는다. 이런 구문이 있는 문서에서 지원 제목으로 확인되지 않은 fragment는 이유 있는 제외로 남긴다. 확인 가능한 일반 제목은 계속 검사하며 미확인 fragment를 성공으로 계산하지 않는다.

## Memory Example Structure

사용자 `.memory` 대신 examples/current.md, examples/plans/*.md, examples/phases 아래 phase.md/task.md만 대상으로 한다. 다른 이름의 일반 예제는 이 구조 검사 대상이 아니다.

- templates.md의 Task/Current/Plan/Phase markdown fence에서 heading·Metadata·Progress 필드와 Workflow/Validation/요약 표의 열을 읽는다. 최소 필수 계약의 누락·중복·표 손상이나 기준 파일 부재는 실패로 처리한다. 템플릿이 손상되어 검사가 약해지는 것을 허용하지 않는다.
- Task의 필수 top-level heading/Metadata·Progress, Commit Policy와 Task Status·Revision, 폴더 ID, 표 헤더/행 열 개수를 확인한다. legacy `commit`이나 Execution metadata의 재등장을 검출한다.
- Bug Investigation은 버그 Type일 때 필요하다. 일반 Task에 억지로 강제하지 않으며 Example Preconditions·추가 설명 섹션·적용되지 않는 API/DTO 세부는 허용한다.
- Current의 Checkpoint/Last Completed Task, 없음 또는 근거 필드의 형식, 활성 Task와 Plan/Phase/상태 연결을 확인한다. Active Stage는 기존 단계 이름 또는 없음이며, 활성 Task가 없으면 Stage도 없음이어야 한다. 실제 커밋 성공이나 no-commit 완료의 진위는 정적 형식만으로 입증하지 않는다.
- Plan/Phase 표의 대상 예제 링크·ID·명시 상태와 Phase done 집계를 대조한다. Phase의 Task 소속, Plan의 Phase 소속과 Phase 상단의 Plan backlink도 확인한다. 교육 예제가 가정한 제품 명령·파일의 존재, 테스트 결과, 도메인 구현은 검증하지 않는다.

## Other Limits

frontmatter는 한 줄 plain/quoted scalar와 description block의 제한된 표현을 지원하며 전체 YAML/metadata parser가 아니다. HTML ID는 fence별 태그 속성을 검사하고 numeric/common named reference만 정규화한다. 지원 밖 named reference는 비교를 제외한다. 실제 DOM/namespace/동적 ID·전체 entity 표·접근성·렌더링은 별도 확인 대상이다.

검증기의 회귀 fixture·수동 지침 대조·실제 host/model 실행은 각각의 증거로 기록한다. 재개/실행 사례의 판단 경계는 [scenarios.md](scenarios.md)를 참조한다.
