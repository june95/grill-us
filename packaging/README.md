# grill-us plugin

공통 원본에서 생성한 메모리 5개와 visualize의 패키지입니다. 이 문서는 생성 package의 사용자 안내 원본이며 아래 `skills/` 경로는 package root 기준입니다. 개별 스킬 이름은 유지하고 grill-me 별칭은 추가하지 않습니다.

## 검증 상태

Windows에서 Codex CLI **0.160.1**과 Claude Code **2.1.296**의 실제 plugin 목록에 포함 스킬 6개가 발견되는 것을 확인했습니다. 2026-10-14에는 GitHub `june95/grill-us`의 main 커밋 `905e8fd66163c2da77335e6556a9a82666ae9a69`, package **0.1.0**을 양쪽 native 명령으로 설치하고 설치 cache에서 명시 `memory-explain` 호출과 형제 참조 읽기를 확인했습니다. 이는 시험한 버전이며 최소 지원 버전이나 다른 OS·Codex 앱/IDE/웹의 지원을 뜻하지 않습니다. 아래 설치는 사용자가 선택하여 수행하며 vendor 공개 store 게시나 자동 개인 설치를 제공하지 않습니다.

현재 개발 snapshot은 기존 6개 스킬/0.1.0 구성을 유지하며 계획·리뷰 및 결정 작성·검색 지침을 갱신했습니다. 위 native 시험은 당시 공개 커밋의 근거이며, 변경된 지침을 새로 설치하거나 모델로 실행한 검증은 아직 없습니다.

계획은 공개 API·DTO·저장/모듈 경계·중요 흐름·오류·상태·완료 조건과 검증을 고정합니다. 새 Task의 Constraints에는 작업별 Must / Must Not을 적고, 새 파일/추상화가 필요하면 기존 소유 위치에 둘 수 없는 이유를 남깁니다. 계약에 필수로 고정하지 않은 private helper 이름·분할·동등한 알고리즘은 실행자가 선택합니다. 리뷰는 계획 자체의 과설계와 구현의 계약 위반을 구분하며 helper 존재만으로 결함을 만들거나 승인 구조를 자동 재설계하지 않습니다.

새 결정은 `Applies to`에 적용 기능·모듈·상황을 필수로 기록하며 `Revisit When`은 실제 조건이 있을 때만 작성합니다. `memory-explain 상품 모듈의 SKU 재고 결정을 찾아줘`처럼 ID·주제·적용 범위로 요청하면 명시 문서/연결 결정을 우선 읽고 필요한 경우 사용자 프로젝트의 `.memory/decisions`에서 후보를 찾습니다. 구형 기록도 출처·선택·기록된 이유·적용 범위를 구분해 설명하며, 범위 미기록을 전역 적용으로 추정하지 않습니다. 상충 후보는 근거와 함께 보여 주며 검색 보고·결정·상태를 쓰지 않습니다.

## 제공 스킬과 선택

| 스킬 | 사용할 때 | Codex CLI 명시 호출 | Claude Code 명시 호출 |
| :--- | :--- | :--- | :--- |
| grill-me | 중요한 설계 선택을 한 질문씩 확정 | `$grill-us:grill-me` | `/grill-us:grill-me` |
| memory-intake | 명확한 수정·이슈를 등록 | `$grill-us:memory-intake` | `/grill-us:memory-intake` |
| memory-plan | 확정 요청을 Plan/Phase/Task로 분할 | `$grill-us:memory-plan` | `/grill-us:memory-plan` |
| memory-execute | 현재 Task 또는 명시 단계 실행 | `$grill-us:memory-execute` | `/grill-us:memory-execute` |
| memory-explain | 결정 검색·적용 범위·출처와 기록·코드·Git 근거 설명 | `$grill-us:memory-explain` | `/grill-us:memory-explain` |
| visualize | 명시한 HTML 시각화 생성 | `$grill-us:visualize` | `/grill-us:visualize` |

호출 표기는 에이전트에 입력하는 요청이며 터미널 실행 파일이 아닙니다. 동명 개인 스킬이 있으면 namespace를 포함하고, 실제 읽은 경로가 이 plugin의 `skills/`인지 확인합니다. GitHub 설치 시험에서는 양쪽 설치 cache에서 본문·형제 references를 읽었습니다. 기존 로컬 시험의 다른 5개 대표 흐름은 본문·참조·CLI 버전의 변경 영향을 대조해 재사용했으며 GitHub 설치 뒤 모든 요청을 다시 실행한 것은 아닙니다. 모든 이름 충돌 조합이나 암묵적 자동 선택까지 검증한 것도 아닙니다. Claude 표기는 [공식 skills 문서](https://code.claude.com/docs/en/skills)도 참고합니다.

## 저장소 주소로 설치

저장소 main에 공개된 catalog와 완성된 package를 도구가 받아 설치합니다. 위 검증 상태의 공개 커밋에서 양쪽 source 등록·설치·목록 6개와 설치 cache 출처를 실제 확인했습니다. 설치하는 사용자에게 ZIP 다운로드·수동 clone·Node 빌드를 요구하지 않습니다.

Codex CLI에서는 terminal에서 source를 등록하고 설치합니다.

~~~powershell
codex plugin marketplace add june95/grill-us
codex plugin add grill-us@grill-us
cd C:/projects/your-project
codex
~~~

Claude Code에서는 채팅창에 다음 두 요청을 입력한 뒤 새 세션을 시작합니다.

~~~text
/plugin marketplace add june95/grill-us
/plugin install grill-us@grill-us
~~~

위 Claude 채팅 경로와 동등한 native CLI `claude plugin marketplace add june95/grill-us` → `claude plugin install grill-us@grill-us --scope user`로 시험했습니다. `--plugin-dir`로 수동 로드한 결과를 GitHub 설치 성공으로 대체하지 않았습니다.

저장소의 HTTPS Git URL `https://github.com/june95/grill-us.git`도 source로 지정할 수 있습니다. catalog 이름은 `grill-us`, plugin 이름도 `grill-us`여서 selector는 `grill-us@grill-us`입니다. 실제 요청은 위 표의 `$grill-us:<skill>` 또는 `/grill-us:<skill>` 표기를 사용합니다.

업데이트는 source를 새로 고친 뒤 설치된 version/실제 스킬 경로를 확인하세요. Codex는 `codex plugin marketplace upgrade grill-us`, Claude는 `claude plugin marketplace update grill-us`를 사용하고 필요하면 정확한 plugin만 제거·재설치합니다. GitHub 최초 설치는 확인했지만 실제 버전 간 자동 업데이트는 미검증입니다. 개인 catalog/cache·설정이 변경될 수 있으며 다른 설치본을 일괄 제거하지 않습니다. [OpenAI package 문서](https://developers.openai.com/plugins/build/plugins), [Claude 설치 문서](https://code.claude.com/docs/en/discover-plugins)를 함께 확인하세요.

제거할 때도 정확한 identity만 지정합니다. 아래 marketplace 제거는 다른 plugin을 추가하지 않은 개인 catalog에 한정하세요. Claude marketplace 제거는 그 catalog의 설치 항목에도 영향을 줄 수 있습니다.

~~~powershell
codex plugin remove grill-us@grill-us
codex plugin marketplace remove grill-us
claude plugin uninstall grill-us@grill-us --scope user
claude plugin marketplace remove grill-us --scope user
~~~

시험에서 이 native 제거 경로와 설치 목록의 identity 제거를 확인했습니다. 사용 중인 별도 세션은 이전 version cache를 유지할 수 있습니다. 해당 세션을 종료하기 전에 cache를 수동 삭제하거나 사용 표식을 강제로 지우지 마세요. 기존의 동명 설치가 있으면 먼저 출처를 확인하며 일괄 덮어쓰기·제거하지 않습니다.

## 로컬 로드와 설치

먼저 개발 저장소에서 `node scripts/build-plugin.mjs`로 생성한 `dist/grill-us` 전체를 별도 배포 위치에 복사합니다. 이 README만 받은 경우에도 manifest와 `skills/`가 함께 있어야 합니다.

### Claude Code 세션 로드

사용자 프로젝트를 cwd로 두고 생성 package의 절대 경로를 지정합니다. 아래 경로는 사용자의 실제 위치로 바꿉니다.

~~~powershell
cd C:/projects/your-project
claude --plugin-dir C:/plugin-catalog/plugins/grill-us
~~~

세션에서 `/grill-us:memory-explain 현재 작업을 설명해줘`처럼 요청합니다. `--plugin-dir` 세션 로드는 기존 로컬 시험에서 확인한 경로이고, GitHub native user 설치는 위 절에서 별도로 확인했습니다. 버전 간 자동 업데이트는 시험하지 않았습니다. 상세 옵션은 [공식 CLI 문서](https://code.claude.com/docs/en/cli-reference)를 참고합니다.

### Codex CLI 로컬 marketplace

시험한 CLI에서는 enable 설정만 지정하면 미설치 스킬이 목록에 나타나지 않았습니다. 로컬 catalog를 만들고 `plugin add`로 설치한 뒤 사용자 프로젝트에서 호출합니다. 아래 예시는 사용자가 선택한 배포 위치 `C:/plugin-catalog`에 전체 package를 `plugins/grill-us`로 복사한 구성입니다.

`C:/plugin-catalog/.agents/plugins/marketplace.json`:

~~~json
{
  "name": "grill-us-local",
  "plugins": [{
    "name": "grill-us",
    "source": { "source": "local", "path": "./plugins/grill-us" },
    "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
    "category": "Productivity"
  }]
}
~~~

~~~powershell
codex plugin add grill-us@grill-us-local --json -c 'marketplaces.grill-us-local.source="C:/plugin-catalog"' -c 'marketplaces.grill-us-local.source_type="local"' -c 'features.plugins=true'
cd C:/projects/your-project
codex -c 'marketplaces.grill-us-local.source="C:/plugin-catalog"' -c 'marketplaces.grill-us-local.source_type="local"' -c 'plugins.grill-us@grill-us-local.enabled=true' -c 'features.plugins=true'
~~~

세션에서 `$grill-us:memory-explain 현재 작업을 설명해줘`처럼 요청합니다. CLI `-c`의 dotted key는 위처럼 넘기고 문자열 **값**만 TOML 인용합니다. TOML 파일의 quoted table key 표기를 그대로 CLI key에 넣으면 다른 이름으로 해석될 수 있습니다. 설치는 개인 Codex cache와 해당 plugin 설정을 변경합니다. `--ephemeral`은 이 설치 상태를 격리하거나 제거하는 옵션이 아닙니다.

동일 identity를 제거하려면 catalog 경로를 유지한 상태에서 다음 명령을 사용합니다. 시험도 전용 identity의 `plugin add`/`plugin remove` 한 쌍으로 수행합니다. 다른 plugin이나 기존 폴더 사본을 일괄 제거하지 않습니다.

~~~powershell
codex plugin remove grill-us@grill-us-local --json -c 'marketplaces.grill-us-local.source="C:/plugin-catalog"' -c 'marketplaces.grill-us-local.source_type="local"'
~~~

[공식 package 문서](https://developers.openai.com/plugins/build/plugins)와 실제 `codex plugin --help`를 함께 확인하세요. 문서에 있는 다른 표면의 설치 방법이 이 CLI 시험 결과와 같다고 가정하지 않습니다.

## 업데이트와 기존 사본 전환

- 생성 package는 수동 편집하지 않고 개발 정본에서 재빌드합니다. 배포 위치에는 manifest·skills·README를 함께 갱신합니다.
- Claude 세션은 최신 package를 지정해 새로 시작합니다. Codex local 설치본은 같은 catalog의 정확한 identity를 제거한 뒤 최신 package를 다시 설치하고 스킬 목록·cache 버전을 확인합니다. 이 제거/재설치 절차는 현재 CLI의 명령 의미에 따른 안내이며 버전 간 자동 upgrade는 미검증입니다.
- 기존 프로젝트의 `.agents/skills`·`.claude/skills` 등 사본은 사용자가 보존/전환을 결정합니다. 먼저 백업하고 해당 도구의 기존 로딩 설정을 확인한 뒤 같은 본문이 이중 로드되지 않도록 한 경로를 선택합니다. 자동 삭제·덮어쓰기나 `.memory` 이동은 수행하지 않습니다.

## 실행 범위와 한계

대표 시험은 별도 가상 프로젝트에서 설명 무쓰기, 한 질문 인터뷰, 등록·계획의 구현 금지, 비활성 완료 Task의 `--stage review`와 활성 위치 보존, 명시 HTML 생성을 확인합니다. Claude의 위임 도구 제한과 Codex의 실제 위임 런타임 오류에 따른 사유 알림·자체 리뷰는 독립 리뷰 성공과 구분합니다. 실제 제품 전체 workflow·commit recovery·모든 모델 출력의 규약 준수를 보장하는 시험은 아닙니다.

HTML 생성도 출력 계약을 다시 확인하세요. Claude의 최초 출력은 필수 Chart.js를 생략했고, Codex도 테마 저장·훅 누락 및 모델 capacity 오류로 정상 종료하지 못해 각 host에서 명시 보완 호출이 필요했습니다. 보완 후 exit 0과 최종 source/JS 구문을 확인했습니다. 실제 브라우저의 모바일 레이아웃·PNG·인쇄·접근성 검사는 별개입니다. CLI는 정상 실행 중 개인 cache·프로젝트 상태·인증 refresh를 기록할 수 있으며 세션 옵션이 개인 상태 전체의 무쓰기를 보장하지 않습니다.

등록·계획만 하는 호출의 무커밋 제한과 미래 Task의 완료 정책도 구분하세요. Codex 최초 계획에서 현재 단계 제한을 영구 `Commit Policy: none`으로 확대하는 오류를 관측했고, 명시 보완 호출로 기본 `auto`/미래 commit pending을 복구했습니다. 현재 계획은 구현·staging·commit 없이 끝내고, 장래 Task는 사용자 선택이 없으면 공통 기본 `auto`를 따릅니다. 실제 후속 실행도 무커밋을 원하면 그 범위를 따로 명시합니다.

이 정책 보완은 OS temp helper도 작성해 fixture 쓰기 범위를 벗어났습니다. 해당 파일을 증거로 보존·이동한 뒤 같은 host의 무쓰기 계획 확인에서 변경 0과 읽기 명령만 확인했습니다. fixture 전후 hash는 그 안의 변경만 측정하므로 도구 명령과 외부 경로도 대조하세요. workspace-write의 기본 임시 경로 허용과 명령 환경을 확인하고, sandbox 옵션만으로 시스템 전체 무쓰기를 보장한다고 해석하지 않습니다.

## 경로와 작업 기록

설치/cache 경로는 읽기 전용 스킬 위치입니다. `skills/memory-execute/references/project-profile.md`의 작업공간 발견 절차로 **사용자 프로젝트 root**를 확인한 뒤 그곳의 `.memory`에 기록합니다. metadata·runtime 경로를 사용자 프로젝트로 추정하지 않고, 혼동되면 쓰기 전에 질문합니다. 사용자 프로젝트의 지침·정본·Git 정책을 존중하며 특정 README/AGENTS 구조나 개발용 검증기를 요구하지 않습니다.

같은 `.memory`를 변경하는 실행 담당은 한 번에 한 명입니다. 도구를 바꿀 때 기록으로 순차 재개합니다. 적용 review는 기본 읽기 전용 별도 위임이고 불가하면 사유를 알리고 자체 리뷰로 계속합니다. 실제 finding은 대체 절차로 지우지 않고 독립/자체 모드와 한계를 기록합니다. 리뷰어는 결과만 반환하고 실행 담당만 상태·수정·Git을 처리합니다.

기본 설명은 채팅이며, 명시 HTML 요청에만 visualize를 적용합니다. 기록 설명만으로 `.memory`·제품·Git 변경이나 실제 위임을 수행하지 않습니다.

## 배포와 개발 구분

개발 정본은 저장소 `.agents/skills`입니다. 공식 배포는 이 정본과 단일 metadata에서 생성한 plugin입니다. 개발 원본 직접 로딩과 설치 plugin을 같은 시험 세션에서 혼용하지 않습니다. 도구별 프로젝트 폴더 사본은 새 공식 배포 방식으로 관리하지 않고 기존 설치본은 자동 삭제·변환하지 않습니다.

Codex와 Claude의 실제 확인 범위는 위 검증 상태·로컬 경로·실행 한계에 한정합니다. manifest 정적 검사 통과와 실제 모델 호출 성공은 서로 다른 증거입니다. Claude manifest 구성은 [공식 plugin reference](https://code.claude.com/docs/en/plugins-reference)를 참고합니다.

CodeBurn 스킬·런타임, `.memory`, 사용자 검토 HTML, 개발용 scripts/tests, 개인 설정·Git·비밀 파일은 포함하지 않습니다. `build.json`은 명시 파일 목록과 원본 SHA256을 제공하고 `.grill-us-build.json`은 생성기 소유 표식입니다. 생성물은 수동 편집하지 않습니다. 알 수 없는 사용자 파일이나 기존 생성물의 수동 변경이 있으면 재빌드는 덮어쓰지 않고 중단합니다.

visualize의 원 author/license/version 고지는 그대로 보존합니다. `skills/visualize/references/provenance.md`에 확인한 로컬 이력과 미확인 upstream 정보가 있습니다. 원본 일부의 MIT 고지를 패키지 전체 license로 확대하지 않습니다.
