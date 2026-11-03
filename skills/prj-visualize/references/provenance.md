# Maintained Visualize Source

이 저장소의 `.agents/skills/visualize/` 수정본이 정본이다. 외부 원본을 자동 추적·교체하거나 개인 설치본을 동기화하지 않는다. 현재 출력 계약은 [SKILL](../SKILL.md), 전체 출력 템플릿은 [skeleton](skeleton.md)이며 참고 문서는 상황별로 읽는다.

## Attribution and Verification

| 항목 | 확인한 근거 / 한계 |
| :--- | :--- |
| 원 author 고지 | 초기 import와 현재 frontmatter의 `metadata.author: careerhackeralex`. 저장소에 보존된 출처 표기이며 외부 저자 신원 검증은 아님 |
| 원 license 고지 | 초기 import와 현재의 `license: MIT` 유지. 외부 원본의 별도 license 파일·전체 고지는 이 자료만으로 확인하지 못함 |
| 원 version 고지 | 초기 import와 현재의 `metadata.version: 0.3.0` 유지. 이 값은 가져온 원본의 표기이며 현재 로컬 변경을 포함한 배포 버전으로 추정하지 않음 |
| 원 저장소 / 문서 URL | **unknown**. 이 스킬의 저장된 metadata·관련 references·로컬 import 이력에 출처 repository URL이 없으며 저자 이름으로 주소를 만들어내지 않음 |
| upstream commit SHA | **unknown**. 초기 로컬 commit을 upstream SHA로 사용하지 않음 |
| 최초 로컬 import | `e5c4656f6cc8cdc90ea3a087d73a5f8111d6abba` (`init commit`). visualize 및 references를 함께 저장한 로컬 Git 근거 |

위 정보는 `git show e5c4656:.agents/skills/visualize/SKILL.md`와 `git log -- .agents/skills/visualize`로 확인했다. 외부 업데이트 내용을 이번 정리에 가져오지 않았다. 이후 원 URL·upstream SHA를 확보하면 원문과의 실제 대응 및 확인 시점·한계를 기록하고 unknown을 근거로 보완한다.

## Local Changes

| 로컬 근거 | 변경 범위 |
| :--- | :--- |
| `e5c4656f6cc8cdc90ea3a087d73a5f8111d6abba` | 최초 로컬 import. 이 시점 이전 변경 여부나 upstream 동일성은 미확인 |
| `2c09d9c` (`fix(visualize): repair and consolidate chart examples`) | 단일 ChartManager/lifecycle 예제, 초기화·재시도·destroy 실패 경계, 코드 예제/관련 디자인 안내 정리 |
| `f73a36c6e2b388d7c3efc388afa70869e1cf1c04` (`fix(visualize): align skeleton markup print and theme examples`) | 단일 `main-content`, 메뉴 인쇄 선택자, class 기반 테마·저장값 복원·다른 root class 보존·단일 theme hook 정렬 |
| 이번 정리 | 긴 형식/Chart.js/디버깅 예제와 인접 맥락을 [recipes](recipes.md)로 이동, 상황별 참조 지도·출처/업데이트 안내, rubric와 역사 메모의 역할 구분. Chart.js/테마/메뉴/출력 정책과 예제 코드는 유지 |

이번 정리의 실제 commit은 로컬 Git 이력으로 확인한다. 문서가 포함될 자기 commit SHA를 미리 생성하거나 hash 기록을 위해 amend하지 않는다.

## Reference Roles

- [SKILL](../SKILL.md): trigger·필수 출력 경계·기본 절차·상황별 읽기 지도.
- [skeleton](skeleton.md): 매 출력에서 복사할 전체 HTML과 단일 초기화의 정본. [menu](menu.md)는 해당 구성요소를 교체·조정할 때의 참고이며 두 번째 메뉴를 추가하지 않는다.
- [recipes](recipes.md): 형식별 레시피와 하나의 완성형 chart lifecycle·관련 디버깅 예제. 필요한 절과 그 인접 변수/DOM/CSS/설정 맥락을 함께 읽는다.
- [eval](eval.md): 수동 품질 rubric. 자동 실행 프로토콜·배포/외부 전송 권한이 아니다.
- [Anthropic skill guide notes](anthropic-skill-guide-notes.md): import 당시 저장된 출처·설계 메모. 원문 검증이나 현재 스킬의 의무를 대신하지 않는다.
- design-system/types/animations/css-techniques/libraries: 필요한 디자인·패턴을 선택하는 참고. 예제는 SKILL/skeleton의 테마·top-level `var`·단일 lifecycle·인쇄·접근성 경계에 맞춰 통합한다.

## Selective Update Procedure

1. 외부 업데이트가 필요하면 원 URL/버전/SHA·license 고지와 현재 로컬 기준을 먼저 확인한다. 출처가 미확인이면 차이·동일성을 확인됐다고 주장하지 않는다.
2. 외부와 로컬의 차이를 읽어 조사하고, 필요한 변경과 유지할 로컬 수정을 구분한다. 기존 동작의 새로운 선택은 사용자 승인 범위에서 결정한다.
3. 승인된 변경만 별도 작업 범위로 반영한다. Chart.js 포함/lifecycle·class 기반 dark/light·theme 저장값·메뉴/PNG/print·단일 main과 예제 맥락을 보존한다.
4. 영향 코드/예제의 구문·ID·링크와 동작 경계를 검증하고, 실제 렌더링/모델 실행을 했다면 그 범위와 한계를 구분한다. 원 attribution·license와 로컬 변경 근거를 함께 갱신한다.

자동 fetch/업데이트·외부 원본 수정·개인 설치본 덮어쓰기·전역 visualize 수정은 이 절차에 포함하지 않는다. 저장소 검증기는 개발용이며 사용 프로젝트에 별도 프로그램/특정 구조를 요구하지 않는다.
