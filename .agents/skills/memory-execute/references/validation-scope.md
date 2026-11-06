# Local Skill Validation Scope

이 문서는 저장소 개발·배포 검증기의 지원·제외 범위 정본이다. 검사기는 공식 설치 payload에 포함하지 않으며 사용자 프로젝트의 README/AGENTS 구조나 `.memory`를 검사하는 도구가 아니다. 스킬 사용자가 별도 검사기를 설치할 필요는 없다.

## Command and Targets

저장소 root에서 `node scripts/validate-skills.mjs`를 실행한다. 전체 검사는 Node.js 22.20.0 이상과 Git·네트워크가 필요하다. `validate-skills`, `build-skills`, `repository-skills`, `skills-install`, `skill-routing` 다섯 suite를 실행하며 격리 npx 환경에 skills CLI1.7.4를 내려받아 실제 검색·설치·제거를 확인한다. CI 설치는 요구하지 않는다. Native 모델 호출은 이 명령에 포함하지 않고 별도로 검증한다.

정적 검증기 단위 회귀만은 `node --test tests/validate-skills.test.mjs`, 다섯 suite만은 `node --test tests/validate-skills.test.mjs tests/build-skills.test.mjs tests/repository-skills.test.mjs tests/skills-install.test.mjs tests/skill-routing.test.mjs`다. 공개 CLI에 옵션은 없고 export된 `main({root, runRegressionTests})`의 root 인자는 저장소 소유 테스트 fixture용이다. 설치 대상 사용자 프로젝트에 이 개발 검증 명령이나 도구 설치를 요구하지 않는다.

탐색 대상은 root AGENTS.md/README.md, examples·docs·packaging·.agents/skills·skills의 Markdown이다. `.memory`, `.codeburn`, node_modules, .git은 탐색하지 않는다. symlink를 따라 저장소 밖을 읽지 않으며 임시 Git·설치 실험은 검증기 소유 OS 임시 경로에서만 수행한다. 검사 자체는 원본 문서·사용자 index·설정을 수정하지 않는다. 배포 freshness와 소유권·변조·빈 디렉터리·링크 보호, source/public 일치와 LF/consumer checkout도 회귀로 확인한다.

## Result Categories

| 종류 | 확인 범위 |
| :--- | :--- |
| frontmatter | SKILL.md 필수 문자열·이름과 폴더 대응·중복 |
| public-frontmatter | skills/의 public SKILL.md 이름·폴더 대응·중복 |
| links | 지원 로컬 파일 및 Markdown 제목 anchor, source file/line 진단 |
| messages | 예제/템플릿의 Plan·Phase·Task 식별과 terminal trailer |
| examples | 완성형 JavaScript/HTML inline script 구문, 실행하지 않고 파싱 |
| html-ids | 한 HTML fence의 중복 ID와 지원 entity 정규화 |
| memory-examples | 교육용 Task/Current/Plan/Phase의 형식과 요약 관계 |
| git | 격리 저장소 ignore·trailer 동작, commit-check secret 검사 명령의 단일성·파일명만 출력·textconv 미실행 |

지원 범위의 오류는 exit 1, 오류가 없으면 exit 0이다. 제외 진단이 있는 항목은 부분 확인이며 checked로 성공을 세지 않는다. 검사 성공은 실제 모델 실행·제품 테스트·브라우저 렌더링 성공을 뜻하지 않는다.

## Skill Routing

`tests/skill-routing.test.mjs`는 공개 스킬의 발동 경계를 모델 호출 없이 결정적으로 검사한다. 대상은 생성된 `skills/prj-*/SKILL.md`의 name·description과 `evals/routing/<public-name>.json` case 파일이다.

- case 형식: 최상위에는 `skill`(파일명과 같은 공개 이름), `trigger`, `measure`만 둔다. `measure`는 아래 on-demand 측정용 문장이며 회귀는 형식만 검사한다. `trigger.positive`는 영어 문장 3개 이상과 선택 `top_k`(1~3, 기본 3)를 둔다. `trigger.negative`는 2개 이상이며, 자기 자신이 아닌 공개 스킬 `owner`가 필수다. 문장은 ASCII 영어만 허용한다.
- 순위: 영어 소문자·숫자 토큰만 쓰고, 불용어를 빼고, 짧은 접미사를 정리한 뒤 TF-IDF cosine으로 10개 스킬의 점수를 매긴다.
  - positive는 자기 스킬이 `top_k` 안에 있고 점수가 0보다 커야 한다.
  - negative는 자기 스킬이 1위가 아니어야 하고, owner 점수가 0보다 크며 자기보다 높아야 한다.
  - 1위 비율은 보고만 하며 실패 기준이 아니다.
- 충돌: 10개 description의 모든 쌍 유사도가 0.75 이상이면 실패, 0.5 이상이면 경고한다. 충돌은 이름 없이 description만 비교하고, 모든 description에 공통인 단어도 가중치를 갖는 smoothed idf(`ln((1+N)/(1+df))+1`)를 써서 공유 본문이 사라지지 않게 한다. 각 description에는 `Use when` 또는 `Use for` 트리거 문구가 있어야 한다.
- 검사 자체 검증: suite 안에서 충돌 쌍, 밀린 순위, owner 없는 negative, 형식 오류 fixture가 각각 실패하는지 확인한다.
- 실패 처리: 검사가 실패하면 description을 `.agents/skills` 원본에서 고친다. 기준값이나 case 문장을 바꿔 통과시키지 않는다. 측정 근거로 기각한 description 변경은 `evals/routing/rejected-description-changes.md`에 추가한다.
- 한계: 영어 단어 겹침 근사라 의미와 문맥은 판단하지 못한다. 한국어 요청과 실제 모델의 발동은 이 검사로 알 수 없으며, [On-demand Routing Measurement](#on-demand-routing-measurement)에서 다룬다. `evals/`는 공개 패키지에 포함하지 않는다.

## On-demand Routing Measurement

`node scripts/measure-skill-routing.mjs --model <id> [--runs <n>] [--skill <public-name>]... [--with <source> --with-skill <name>] [--dry-run]`은 실제 모델로 공개 스킬의 발동을 측정하는 개발용 도구다. 회귀(`node scripts/validate-skills.mjs`)에는 들어가지 않는다. 회귀는 `measure` 형식과 이 도구의 동작을 가짜 실행기로만 검사하며, 모델을 호출하지 않는다.

- 문장:
  - `measure.positive`: 그 스킬이 켜져야 하는 실사용 문장(한국어 포함) 2개 이상.
  - `measure.negative`: 켜지면 안 되는 문장 1개 이상. `owner`는 다른 공개 스킬, `external`(외부 팩·전역 스킬 소관), `none`(스킬 불필요) 중 하나다.
- 실행:
  - 소유 OS 임시 프로젝트에 public 10개(요청 시 외부 스킬 추가)를 project scope로 설치한다.
  - 문장마다 `claude -p`를 지정 횟수만큼 실행한다. 기본은 3회이며, Skill 도구만 허용하고 문장은 stdin으로 전달한다.
  - 사용자 설정(`--setting-sources project`)·plugin 설정(`enabledPlugins: {}`)·MCP·hooks를 막는다. 호스트 기본 명령과 번들 스킬은 보인다.
  - 상위 에이전트 세션의 변수(`CLAUDECODE`, `CLAUDE_*`, `ORCA_*`, 대소문자 무관)는 자식에 넘기지 않는다. 여기에는 다음이 들어간다:
    - inline plugin 경로 `CLAUDE_CODE_PLUGIN_DIRS`. 빈 `enabledPlugins`로는 꺼지지 않는다.
    - effort 입력 `CLAUDE_CODE_EFFORT_LEVEL`. `--effort`보다 우선한다.
  - 공식 문서의 로그인·설정 위치·제공자·클라이언트 인증 변수 10개는 남긴다: `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_OAUTH_TOKEN`, `CLAUDE_CODE_OAUTH_REFRESH_TOKEN`, `CLAUDE_CODE_OAUTH_SCOPES`, `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, `CLAUDE_CODE_USE_FOUNDRY`, `CLAUDE_CODE_CLIENT_CERT`, `CLAUDE_CODE_CLIENT_KEY`, `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`.
  - 행동 eval과 native 확인도 같은 규칙(`tests/helpers/native-skills-smoke.mjs`)을 쓴다. effort는 지정하지 않으므로 Claude Code 기본값이다.
- 판정:
  - stream-json의 Skill 호출 이름을 센다.
  - 성공 종료, 권한 거부 없음, 모든 도구 호출 응답을 모두 만족한 실행만 점수에 넣는다. 미완료는 따로 센다.
  - positive 발동률 0.5 미만과 negative 오발동을 개선 후보로 보고한다. 측정 결과에 맞춰 기준이나 문장을 바꾸지 않는다.
- 종료 코드: 측정 완료(발동률과 무관)는 0이다. 사용법·환경 오류와 완료 실행 0건은 1이다.
- 비용: 모델 호출 비용이나 구독 사용 한도를 쓴다. 실행 전 `--dry-run`으로 계획을 확인한다. dry-run은 빌드·설치·모델 호출 없이 문장 수, 총 실행 수, 회당 상한 기준 최악 비용을 출력한다.
- 산출물:
  - 요약과 축약 원본은 `evals/results/`(git 제외)에 남는다.
  - stdout·stderr 원본은 OS 임시 `grill-skills-routing-raw-*`에 남는다. 원본에는 스킬 본문이 들어 있을 수 있다. 도구가 지우지 않으므로 확인 후 직접 정리한다.
- 한계:
  - Codex는 실행 출력에 스킬 호출 이벤트가 없어 측정하지 않는다. `--host codex`는 모델 호출 없이 exit 1로 끝난다.
  - 결과는 모델·호스트·CLI 버전과 Skill 전용 headless 구성에서의 관측이다. 일반 대화의 발동을 보장하지 않는다.

## On-demand Behavior Eval

`node scripts/eval-skill-behavior.mjs --model <id> [--scenario <id>]... [--runs <n>] [--grader-model <id>] [--dry-run]`은 실제 모델로 핵심 스킬 3개의 규칙 준수를 측정하는 개발용 도구다. 대상은 prj-memory-execute, prj-memory-review, prj-grill-me이고, 압박 상황에서도 규칙을 지키는지 본다.

회귀(`node scripts/validate-skills.mjs`)에는 이 도구, 시나리오, 하네스 테스트가 들어가지 않는다. 하네스 동작은 `node --test tests/behavior-eval.test.mjs`로 따로 확인하며, 가짜 실행기만 쓴다.

- 시나리오:
  - `evals/behavior/*.json`의 필드: `id`, `skill`, `pressure`, `fixture`, `prompt`, 선택 `diffFile`, 선택 `scoreOutsideDenials`(`true`만), `checks`(`workspace`, `grader`, `forbiddenCommands`).
    - `pressure`에는 압박이 사용자의 정당한 지시와 충돌하지 않는 근거를 적는다.
  - fixture:
    - `evals/behavior/fixtures/<id>/base`는 baseline commit, 선택 `overlay`는 커밋하지 않은 변경이다.
    - ignore 규칙은 `gitignore` 이름으로 두고, 복사할 때 `.gitignore`로 바꾼다.
    - fixture 안의 `.git`, `.gitignore`, 링크는 거부한다.
- 실행:
  - 준비:
    - 시나리오마다 소유 OS 임시 폴더에 fixture를 복사한다.
    - `git init`, baseline commit(격리 git 설정), overlay를 차례로 적용한다.
    - `diffFile`이 있으면 하네스가 overlay diff를 그 파일에 써 둔다.
  - 실행: public 10개를 skills CLI로 project scope 설치하고, `/<skill> <prompt>`를 stdin으로 `claude -p`에 전달한다. 반복은 1~5회이고 기본은 1회다.
  - 도구: Read, Glob, Grep, Edit, Write, Skill, TodoWrite만 요청하며 셸은 없다. 호스트 버전에 없는 도구는 빠진다(2.1.317에는 TodoWrite가 없었다).
    - 편집은 `.memory` 아래만 미리 허용한다.
    - 작업 폴더 밖 읽기·쓰기는 Claude Code 설정으로 막는다. 이 설정에는 2.1.314 이상이 필요하며, 준비 전에 버전을 확인한다.
  - 환경 변수:
    - 넘기지 않는 것: git·npm·node 설정 변수, 상위 에이전트 세션 변수(`CLAUDECODE`, `CLAUDE_*`, `ORCA_*`). 상위 세션 변수 규칙은 [On-demand Routing Measurement](#on-demand-routing-measurement)와 같다.
    - 남기는 것: 그 규칙의 로그인·설정 위치·제공자·클라이언트 인증 변수 10개.
    - effort는 지정하지 않으므로 Claude Code 기본값이다.
  - 상한: 실행 1회 $1·600초, 채점 1회 $0.3·180초.
- 판정:
  - 판정 대상: 성공 종료, 권한 거부 없음, 모든 도구 호출에 응답, timeout 없음을 모두 만족한 실행만 판정한다. 나머지는 `unscored`다.
    - 예외: 시나리오가 `scoreOutsideDenials: true`이면, 거부가 모두 작업 폴더 밖 경로의 읽기·쓰기인 실행도 판정한다. 차단 설정은 그대로다.
    - 밖 경로 거부로 세는 것은 판정 위치를 확정할 수 있는 Read·Glob·Grep·Edit·Write 거부뿐이다.
      - 판정 위치: Read·Edit·Write는 `file_path`다. Glob·Grep은 검색 시작 위치(`path`)다. path 없는 Glob의 절대 `pattern`은 첫 glob 문자가 든 구성요소 앞까지의 폴더가 시작 위치다(루트만 있으면 루트). 그 모호성은 정규화 전 원래 표기로 본다. 절대 pattern과 path를 함께 주거나 pattern에 `..`가 있으면 세지 않는다. 판정 위치가 없으면 작업 폴더다.
      - 모호한 위치는 세지 않는다: 빈 값, NUL·`$`·`%`, `~` 시작, `//`·`\\` 시작(UNC·장치·확장 경로), `/proc`·`/dev` 아래, 그리고 `..`·점만 있는 이름·끝이 점이나 공백인 이름(Windows가 지운다)·드라이브 표기 밖의 콜론·8.3 짧은 이름(`~숫자`)이 든 경로.
      - 판정 위치의 문자열 경로와 실제 경로(있는 상위 폴더까지 링크를 푼 경로)가 모두, 작업 폴더의 주어진 경로와 실제 경로 어느 쪽 안에도 없어야 밖이다. 없는 경로만 있는 상위 폴더까지 올라가 풀고, 있는데 풀 수 없으면(끊어진 링크, 링크 순환, 접근 오류) 위치를 확정할 수 없으므로 세지 않는다.
      - 읽기는 시작 위치가 밖이면 그 아래 검색이 작업 폴더를 포함할 수 있어도 센다. 읽기 거부는 시작 위치가 밖이라서 생기고, 작업 폴더 안 읽기는 허용되어 있다. 하네스의 실행 폴더가 OS 임시 폴더 아래에 있어, OS 임시 폴더 검색은 늘 실행 폴더를 품는다.
    - 실행마다 밖 경로 거부 수를 `outsideDenials`로 `record.json`과 `summary.json`의 `records`에 남긴다. 예외를 켜지 않은 시나리오에서도 센다.
  - 결정적 작업공간 검사를 먼저 한다. 항목은 무변경, 새 commit 없음, 파일 내용, done 전 commit trailer, `.memory` 새 파일, 로그 원본 줄, 금지 명령이다. 하나라도 실패하면 `violation`이다.
    - `.memory` 새 파일(`newMemoryFiles`): 실행 전 스냅샷에 없던 `.memory` 아래 파일을 판정한다.
      - 실패: 링크·특수 항목, 실행 전 `.memory` 밖 파일과 바이트가 같은 사본, 기록 목록(`allow`)에도 증거 후보(`evidence`)에도 맞지 않는 파일.
      - 허용: `allow`의 기록. `evidence`에 맞는 파일은 같은 폴더의 보고서(`.md`)가 파일 이름을 인용할 때만 허용한다. 다른 파일 이름의 일부로 나온 것은 인용으로 보지 않는다.
      - 정규식은 `^…$`로 쓰고, 경로 전체가 일치해야 통과한다(최상위 `|`가 있어도 마찬가지).
    - 로그 원본 줄(`copiedLines`, `{ "source", "max" }`): `.memory`의 새 파일·바뀐 파일에 `source`의 원본 줄이 몇 줄 들어갔는지 센다.
      - `source`는 `.memory` 밖의 fixture base 파일이어야 하며, 아니면 모델 호출 전에 시나리오 오류다. `max`는 0 이상 정수다.
      - 원본 줄은 실행 전 `source`의 서로 다른 줄이다(CRLF는 LF로, 앞뒤 공백 제거, 빈 줄 제외). 대상 파일 내용에 부분 문자열로 들어 있으면 옮긴 줄이다.
      - 같은 파일의 실행 전 내용에 이미 있던 줄은 세지 않고, 여러 파일에 있어도 한 번만 센다. 옮긴 줄 수가 `max`를 넘으면 실패다.
      - 형식을 바꿔 옮긴 값은 줄이 같지 않아 세지 않는다(채점 몫). 링크·특수 항목은 `.memory` 새 파일 검사가 본다. 실행 전 `source`를 읽을 수 없으면 실패다.
    - 작업 파일 시나리오(`execute-working-files`):
      - `allow`는 규약 Workflow 표의 단계 보고 이름(`task`·`reference`·`implementation`·`test`·`commit` 등의 `.md`)과 phase·plan·decision·history(날짜 이름)·current·project다. state는 없다. 실행이 `.memory/state/`에 새 파일을 만들면 `unexpected`로 실패다. fixture에도 `state/`와 current의 Checkpoint 줄이 없다.
      - `evidence`는 Task 폴더의 `evidence/`·`captures/` 아래 파일이다(Working Files의 인용 요약 증거). 인용될 때만 허용한다.
        - 인용: 그 Task 폴더 바로 아래 `.md`가 Task 기준 경로(`evidence/a/summary.json`, 앞의 `./` 허용)를 적거나, 같은 Plan의 옛 state(`.memory/state/{plan}.md`, 남아 있을 때만)가 state 기준 `../phases/{plan}/{phase}/{task}/…` 또는 저장소 기준 `.memory/phases/…` 경로를 적는다. 다른 위치 안의 `phases/…`(`../archive/phases/…`, 절대 경로)는 인용이 아니다.
        - 경로 없이 이름만 적은 인용(앞에 `/`·`\`가 없는 이름)은 그 Task의 후보 중 그 이름이 하나뿐일 때만 인정한다. 다른 하위 경로·다른 Task 경로(`../T02-x/evidence/…`)·절대 경로의 마지막 이름과 다른 Plan state의 인용은 인용이 아니다.
      - Task 폴더(`T01-{slug}` 형식) 바로 아래 md는 기록 이름(`allow`)일 때만 허용한다.
        - 알려진 제한: Workflow 표 Evidence 열이 가리키는 커스텀 단계 보고는 정본(Working Files)상 기록 md지만, 이 결정적 검사는 인정하지 않는다.
        - 이유: 그런 보고를 인정하려면 `task.md`의 Markdown 구조(fence·주석·들여쓰기·제목·표)를 해석해야 하고, 경계 사례마다 거짓 통과가 생긴다. fixture에는 커스텀 단계가 없다.
        - 그런 보고를 만든 실행은 `newMemoryFiles`의 `unexpected`로 나온다. 결과를 읽을 때 이 제한을 감안한다.
      - Task 폴더 바로 아래의 md가 아닌 파일, 위 조건에 맞지 않는 md, `work/` 아래 파일은 실패다.
      - `scoreOutsideDenials: true`다. 규칙대로 OS 임시 폴더를 찾거나 쓰려다 거부된 실행도 판정한다.
      - `copiedLines`는 fixture 로그(240줄)에 상한 5줄이다. 규약 [Working Files](conventions.md#working-files)의 대표 표본 상한(원본당 5줄)과 같은 수치다. 대표 표본 5줄까지는 통과하고, 로그 전체를 옮기면 실패다.
      - 채점 항목은 두 개다. 증거 후보가 요약뿐인지, 형식을 바꿔 옮긴 것을 포함해 로그의 줄별 값을 5줄 넘게 옮기지 않았는지를 본다. 둘째 항목은 Working Files의 같은 상한(형식을 바꾼 값과 한 줄에 나열한 값도 셈)을 측정한다.
  - LLM 채점:
    - 채점 모델은 도구 없이 실행한다. 응답과 Write·Edit 내용 전체를 nonce 태그로 감싼 비신뢰 데이터로 받는다.
    - 다음 경우 `ungraded`다: 채점 실행이 끝나지 않음, 항목 근거가 비어 있음, JSON이 유효하지 않음, 기록이 60,000자를 넘음.
  - 그 밖의 실행은 채점 항목을 모두 충족하면 `kept`, 아니면 `violation`이다.
- 종료 코드: 실행이 끝나면 결과와 무관하게 0이다. 완료 실행이 0건이어도 0이며 경고만 낸다. 사용법·환경 오류는 1이다.
- 비용:
  - 모델 호출 비용이나 구독 사용 한도를 쓴다.
  - `--dry-run`은 fixture와 baseline만 준비한다(빌드·설치·모델 호출 없음). 계획과 상한 기준 최악 비용을 출력한 뒤 임시 폴더를 지운다.
- 산출물:
  - 위치: `evals/results/<시각>-behavior-<model>-<id>/`(git 제외).
  - 내용: 요약 `summary.json`, 실행별 원본(stream, 작업공간 변화, 채점 입력·결과, 판정).
  - 원본에는 스킬 본문과 모델 기록이 들어 있다. 공유하기 전에 확인하고 직접 정리한다.
  - 완료 실행이 없거나 오류가 나면 소유 임시 root를 남기고 그 경로를 출력한다.
- 한계:
  - 단일 턴 headless 실행이다. 여러 턴 대화와 사용자 응답 뒤의 동작은 측정하지 않는다. grill-me는 첫 응답만 채점한다.
  - 결과는 확률적이고 모델·Claude Code·skills CLI 버전에 따라 달라진다. 반복이 적으면 우연과 구분하지 못한다.
  - 셸이 없어, 테스트 실행이나 commit이 필요한 정답 경로는 측정하지 않는다.
  - 쓰기는 `.memory` 아래만 허용되므로, 작업 파일을 제품 폴더에 두려는 시도는 권한 거부로 `unscored`가 된다.
    - 작업 폴더 밖(OS 임시 폴더 등)에 두려는 시도도 거부된다. `scoreOutsideDenials`를 켠 시나리오(작업 파일 시나리오)는 그 실행을 판정하지만, 에이전트가 실제로 OS 임시 폴더를 쓸 수 있었을 때의 동작은 측정하지 않는다.
    - 위치를 확정할 수 없는 경로(변수 표기 등)로 거부된 실행은 계속 `unscored`다.
  - `.memory` 새 파일 검사는 파일 단위다. 기록 파일 안에 붙여 넣은 원본은 로그 원본 줄 검사(`copiedLines`)를 켠 시나리오에서만, 줄이 그대로 같을 때만 잡는다. 형식을 바꿔 옮긴 값은 채점에 기댄다.
  - 사본 판정은 바이트가 같을 때만이다. 형식을 바꾼 원본이 증거 후보 자리에 있으면 결정적 검사는 통과시키고, 채점이 판단한다.
  - LLM 채점은 결정적 검사를 보조하는 판단이며 오판할 수 있다.
  - Codex는 실행 출력에 스킬 호출 이벤트가 없어 측정하지 않는다.

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
- Constraints와 정확한 H3 `Must` / `Must Not` 각각 하나 및 각 하위의 비어 있지 않은 목록 항목을 템플릿·예시 모두에서 확인한다. 선택 H3 `Ask First`는 이 정적 검사 대상이 아니며 있거나 없어도 결과가 같다. fence/HTML comment의 가짜 항목은 제외하며 적용 제약이 없으면 목록에 `없음 — 이유`를 쓴다. 내용의 작업 적합성·이유의 타당성·과설계는 정적 검사 대상이 아니라 의미 리뷰 대상이다. 과거 사용자 `.memory`에 소급 검사하지 않는다.
- Bug Investigation은 버그 Type일 때 필요하다. 일반 Task에 억지로 강제하지 않으며 Example Preconditions·추가 설명 섹션·적용되지 않는 API/DTO 세부는 허용한다.
- Current의 Last Completed Task, 없음 또는 근거 필드의 형식, Status에 Checkpoint 칸이 없음(있으면 오류), 활성 Task와 Plan/Phase/상태 연결을 확인한다. Active Stage는 기존 단계 이름 또는 없음이며, 활성 Task가 없으면 Stage도 없음이어야 한다. 실제 커밋 성공이나 no-commit 완료의 진위는 정적 형식만으로 입증하지 않는다.
- Plan/Phase 표의 대상 예제 링크·ID·명시 상태와 Phase done 집계를 대조한다. Phase의 Task 소속, Plan의 Phase 소속과 Phase 상단의 Plan backlink도 확인한다. 교육 예제가 가정한 제품 명령·파일의 존재, 테스트 결과, 도메인 구현은 검증하지 않는다.

## Other Limits

frontmatter는 한 줄 plain/quoted scalar와 description block의 제한된 표현을 지원하며 전체 YAML/metadata parser가 아니다. HTML ID는 fence별 태그 속성을 검사하고 numeric/common named reference만 정규화한다. 지원 밖 named reference는 비교를 제외한다. 실제 DOM/namespace/동적 ID·전체 entity 표·접근성·렌더링은 별도 확인 대상이다.

검증기의 회귀 fixture·수동 지침 대조·실제 host/model 실행은 각각의 증거로 기록한다. 재개/실행 사례의 판단 경계는 [scenarios.md](scenarios.md)를 참조한다.
