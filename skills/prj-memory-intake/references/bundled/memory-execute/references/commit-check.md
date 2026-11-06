# Common Completion and Commit Check

[공통 규약](conventions.md)을 기준으로 최종 리뷰의 핵심과 Git 경계를 함께 확인한다. 별도 final-review.md가 없는 Task도 완료 조건과 적용 단계의 유효한 증거를 확인해야 한다.

아래는 [완료·정책 의미](conventions.md#evidence-and-completion)를 적용하는 품질/Git 절차다. 커밋 유무와 무관하게 전체 완료 전 판정을 남기며 ready를 done으로 취급하지 않는다.

## Quality Gate

1. 사전에 정한 Task Goal·Scope·Acceptance Criteria·Alignment와 실제 산출물(변경 또는 조사/검증 근거)을 대조한다. 범위 밖 변경, 누락된 완료 조건, 명백한 결함·회귀 위험을 확인한다.
2. commit-check **이전**의 적용 단계만 평가한다. 필수 단계는 passed와 현재 유효한 증거, 필요 시는 조건 평가 후 passed 또는 이유 있는 skipped, 해당 없음은 이유 있는 skipped여야 한다. 아직 수행 전인 commit과 running 상태의 이 점검 자체는 선행 완료 조건이 아니다.
3. [증거·환경](conventions.md#evidence-and-completion)의 현재 Revision/snapshot·변경 영향을 대조한다. 파일 존재만으로 유효하다고 보지 않고 실패·stale를 생략으로 덮지 않는다.
4. Task diff에 테스트·검사를 약하게 만든 변경이 있는지 [검사 약화 기준](review.md#compliance)으로 확인한다. task.md Scope/Constraints의 명시 승인이 없는 약화는 High이므로 blocked다.
5. 현재 산출물의 미해결 Critical/High·미승인 변경·AC 미달성이면 blocked다. 대상 결함과 조사 작업은 [Investigation Outcomes](conventions.md#investigation-outcomes)로 구분하되 후속 등록만으로 완료 차단을 해소하지 않는다. 다른 severity도 AC를 막으면 차단한다.
6. 필요한 정본은 승인된 계약 및 현재 구현·검증과 일치해야 한다. 정본 갱신이 해당 없음이면 그 근거를 읽고 빈 guide-update.md를 요구하지 않는다.
7. Task Completion Check에 `Verdict: ready / blocked`, Revision·snapshot, 완료 조건별 근거, 단계 적용·판정, blocking finding, 남은 검증 한계를 적는다.

공통 점검 자체가 코드 리팩토링을 수행하지 않는다. 수정이 필요하면 적절한 구현·review-action 단계로 반환한다. 수정 후 영향받은 증거를 갱신하고 다시 판정한다. 단계 단독 commit-check 요청이면 발견 사항만 기록하며 다른 단계·staging·commit·포인터 전진을 수행하지 않는다.

## Staging

- 시작 시 [Change Inventory](project-profile.md#change-inventory)의 NUL 집계와 `git --no-optional-locks diff --cached --name-status`로 기존 사용자 변경·index를 확인한다. tracked working·staged·untracked와 Task 관련 후보를 구분하며 디렉터리 축약을 파일 수로 세지 않는다. 집계 결과만으로 무관 untracked를 stage/삭제/ignore하지 않는다.
- Task에 포함되는 명시적 파일 목록을 만든다. 코드·테스트·공유 가이드·설정 등 관련 변경만 포함하며 기본 로컬 `.memory`, 다른 작업, 임시 파일, 비밀 파일, 생성 노이즈는 제외한다.
- 후보마다 `git check-ignore -v --no-index -- <명시적 경로>`를 확인한다. tracked 파일도 검사한다. verbose 출력은 부정 패턴에도 exit 0을 반환하므로 종료 코드만으로 ignored를 판정하지 않는다. 아래 Ignore Result 규칙으로 실제 적용 패턴을 읽는다.
- `git add -- <명시적 파일 목록>`만 사용한다. `git add .`, `git add -A`, `git add -f`, `git add --force`를 사용하지 않는다.
- staging 후 `git diff --cached --name-status`와 각 staged 경로의 ignore 상태를 다시 확인한다. 전환 예외 외에 ignored 내용 추가·수정은 허용하지 않는다.
- `git ls-files --stage -- <후보>`로 stage 0의 Git mode/blob ID를 확인한다. unresolved merge stage가 있으면 차단한다. working-tree SHA256은 검증 freshness, staged Git entry는 실제 commit 내용 복구에 사용하여 줄바꿈·clean filter 차이를 구분한다.
- stage된 변경 내용이 검토·검증한 내용과 같은지 실제 diff와 snapshot으로 확인한다. 후보에 user WIP가 같은 파일에 섞였으면 안전하게 구분할 수 있는지 확인하고 불분명하면 차단한다.
- commit 전에 [Secret Check](#secret-check)로 staged diff를 확인한다. 실제 비밀 값이 있거나 검사를 실행하지 못하면 commit하지 않는다.
- 이미 staged된 unrelated 작업을 전체 커밋에 섞거나 임의로 unstage하지 않는다. 명시적 Task 경로만 커밋할 수 있는 방식을 사용하되 그 방식이 기존 사용자 index와 실제 검토 범위를 보존하는지 확인한다. 안전한 분리가 불가능하면 차단한다.
- 잘못 stage한 경로는 본 실행에서 stage한 것인지 확인하고 index만 복구한다. 로컬 파일·사용자 작업을 삭제하거나 `reset --hard`, 작업 파일 checkout으로 되돌리지 않는다.
- 명시적 요청 없이 push하지 않는다. 비대화식 commit을 사용하고 shell 문자열 연결 대신 실제 메시지 파일 또는 구조화 입력을 사용한다.

### Ignore Result

- exit 0이면 출력의 실제 적용 패턴을 확인한다. 패턴이 이스케이프되지 않은 `!`로 시작하면 제외 해제이며, 그 외 매칭은 ignored다. `\!literal`은 느낌표로 시작하는 이름을 제외하는 일반 패턴이다.
- exit 1이고 출력이 없으면 매칭 없음이다. 1보다 큰 종료 코드, 실행 실패, 예상하지 못한 출력은 오류로 기록하고 해당 후보의 staging을 차단한다.
- 기계 판독은 `git check-ignore -v -z --no-index --stdin`에 명시 경로를 NUL로 구분해 전달한다. 출력은 `source`, `line`, `pattern`, `pathname`의 NUL 구분 4필드 묶음이다. 여러 경로의 전체 종료 코드를 개별 파일 판정으로 사용하지 않는다. 출력 경로와 입력 후보를 대응시키고, 정상 실행에서 출력 없는 경로만 무매칭으로 처리한다. 필드 누락·알 수 없는 경로는 오류다.
- ignored 부모 아래의 자식 예외는 적용되지 않을 수 있다. `.gitignore`에 `!` 줄이 있다는 사실 대신 해당 경로에 대해 Git이 반환한 실제 패턴을 따른다.
- 제외 해제·무매칭은 Git ignore 조건만 충족한다. Task scope, 명시 공유 승인, 기본 로컬 `.memory`, 사용자 index 보존 조건을 별도로 확인하며 `!`를 포괄적인 staging 승인으로 사용하지 않는다.

### Secret Check

staged 내용을 확인한 뒤 commit 전에 아래 명령으로 staged diff를 검사한다. 이 명령은 패턴과 일치한 파일명만 출력하고 값은 출력하지 않는다. `--no-textconv`·`--no-ext-diff`는 저장소 설정의 변환기(textconv)나 외부 diff를 실행하지 않고 원래 staged 내용에서 찾게 한다. 값을 출력하는 형태로 바꾸거나 이 옵션을 빼지 않는다.

`git diff --cached --no-textconv --no-ext-diff -i -G'password|passwd|secret|api[_-]?key|token|private[_-]?key|credential' --name-only`

1. 명령이 실패하거나 실행하지 못했으면 통과로 보지 않는다. exit와 원인을 기록하고 commit을 멈춘다.
2. 출력된 Task 후보 파일은 실행 담당이 해당 줄을 직접 읽어 실제 비밀 값인지, 단어 언급(규칙 설명·변수 이름·placeholder 등)인지 분류한다. 후보가 아닌 기존 사용자 staged 경로가 출력되면 판단하거나 고치지 않고 경로만 알린다.
3. 실제 비밀 값이면 commit하지 않고 Completion Check를 blocked로 둔다. 사용자에게는 파일·줄 위치와 분류만 알린다. 파일을 고치거나 후보에서 자동으로 빼지 않으며, 이 실행이 stage한 경로만 위 규칙대로 index를 되돌릴 수 있다.
4. 단어 언급이면 Completion Check의 Staging 기록에 파일·분류·판단 근거를 값 없이 남기고 진행한다.
5. 보고서·history·채팅에는 비밀 값이나 그 일부를 쓰지 않는다. 파일·줄 위치·분류만 남긴다.
6. 이미 commit되었거나 push된 비밀을 발견하면 history rewrite나 force push를 하거나 지시하지 않는다. 사용자에게 해당 비밀의 교체(rotate)를 먼저 안내한다.

이 검사는 알려진 단어만 찾고 binary 파일은 변환하지 않으므로, 출력이 없다고 비밀이 없다고 보장하지 않는다. 비밀 파일을 후보에서 빼는 위 Staging 규칙은 그대로 적용한다.

## Commit Intent

ready 판정과 staged 내용 확인 후, 커밋하기 전에 다음 두 가지를 먼저 기록한다.

1. 그 Task의 `work/commit-intent.json`(아래 필드, `status: prepared`)
2. task.md Progress의 Commit Status `prepared`

`work/commit-intent.json`은 고정 경로로 찾는다. task.md·보고서에서 링크하지 않는다. 완료 정리 때 지워지기 때문이다.

| Field | Type / Constraint |
| :--- | :--- |
| `status` | `prepared / committed / failed` |
| `plan`, `phase`, `task` | Plan ID, 전체 Phase ID, metadata Task ID |
| `baseHead` | 커밋 직전 HEAD SHA |
| `preparedAt` | ISO 8601 |
| `candidates` | 배열. 항목: `path`(repo-relative), `status`(`A / M / D`), `workingSHA256`, `stagedMode`, `stagedBlob`, `stage`(0). 삭제(D)는 `workingSHA256`·`stagedMode`·`stagedBlob`이 null |
| `migrationIndexDeletions` | 배열. 승인된 index 추적 해제 경로와 로컬 보존 근거 |
| `commitMessage` | 실제 메시지 전문. 마지막 블록에 Plan/Phase/Task trailer |
| `commitMessageSHA256` | 메시지 SHA256 |
| `commitHash` | 확인한 성공 SHA 또는 null |
| `failure` | failed일 때 시각·실제 오류 요약, 아니면 null |

- 정확한 Plan/Phase/Task, Base HEAD, 명시 후보 경로·added/modified/deleted 상태·working-tree hash·staged Git mode/blob ID, 전체 Commit Message, 전환 index deletion 목록을 위 필드로 기록한다.
- Task마다 파일이 따로 있다. 새 Task는 파일 없음(none)에서 시작한다. 미해결 prepared·failed 파일은 덮어쓰지 않는다([Recovery](resume.md#recovery)).
- 새 Commit Message는 설명 본문 뒤 마지막 블록에 Plan/Phase/Task trailer를 각각 한 번 둔다. Plan은 Plan ID, Phase는 전체 Phase ID(예: `P01-core`), Task는 metadata Task ID(예: `P01-T01`)와 정확히 일치해야 한다. Task 폴더명 `T01-slug`를 새 trailer 값으로 쓰지 않는다. `git interpret-trailers --parse`로 실제 메시지의 세 값을 확인한다.
- 커밋 결과가 나오기 전에 report에 committed를 쓰지 않는다. 준비 기록은 prepared다.
- 성공하면 SHA와 실제 변경을 확인한다. 다음 순서로 기록한다.
  1. `work/commit-intent.json`에 `status: committed`와 `commitHash`
  2. commit 보고(`commit.md`): SHA·parent·메시지·trailer·tree 대조·Secret Check·정리 결과
  3. task.md Commit Status `committed`
  4. [작업 파일 정리](#working-file-cleanup)에서 `work/`와 함께 의도 파일을 지운다. 이어 Task done, Phase 집계, Plan 상태, current를 동기화한다.
- 실패하면 `work/commit-intent.json`에 `status: failed`와 `failure`를, task.md Commit Status에 `failed`를 기록한다. 실제 오류·재개 행동을 남기고 Task는 미완료로 둔다. `work/`를 지우지 않고, current를 다음 Task로 옮기지 않는다.
- 성공 후 상태 기록이 끊겼다면 [메시지 호환 규칙](resume.md#commit-message-identity)으로 대상 식별자를 확인하고 commit 파일·내용을 함께 검증해 복구한다. 과거 본문 중간 식별자와 Task 폴더명은 복구에만 허용한다. hash 또는 메시지 식별자만 보고 성공을 추측하지 않는다.
- stage-only commit은 유효한 선행 점검을 요구하며 성공하더라도 포인터 finalize는 별도 전체 실행에서 수행한다.

## No Commit

- 의미는 [Evidence and Completion](conventions.md#evidence-and-completion)을 따른다. none이면 사용자 지시·남은 변경, Task 변경 없음이면 실제 후보 확인·생략 근거를 Completion Check와 workflow에 기록한다. 빈 commit/가상 commit.md는 만들지 않는다.
- check_only는 판정만 남기고 staging·commit·done·전진하지 않는다. unrelated working/index는 생략 판정을 위해 정리하지 않는다.
- 이미 성공한 동일 Task 커밋이 있으면 변경 없음을 새 skipped 결과로 덮지 않는다. 성공 증거를 보존하고 [재개 규약](resume.md)대로 상태만 복구한다.
- 실행하지 않은 commit.md를 생성하지 않는다. 공통 점검과 정책 생략 근거는 Task 표·Completion Check에 기록할 수 있다.

## Working File Cleanup

Task를 완료 처리할 때 이 Task 폴더와 이 Task의 OS 임시 소유 폴더를 정리하고 결과를 남긴다. 묻지 않고 지우며 승인 목록을 만들지 않는다. 무엇을 남기는지는 [Working Files](conventions.md#working-files)의 기록 md·인용 정의를 따른다.

- 시점: 전체 Task 실행에서 성공 commit을 확인했거나 커밋 없는 완료를 판정한 뒤, Task done을 기록하기 전에 한다.
  - 단독 단계와 check_only에서는 정리하지 않는다([Stage Isolation](conventions.md#stage-isolation)).
  - 응답할 사용자가 없는 실행에서도 같은 정리를 한다.
  - `work/commit-intent.json`이 있는데 `status`가 committed가 아니면(prepared·failed·읽을 수 없음) 정리하지 않는다. 미해결 의도로 보고 [Recovery](resume.md#recovery)부터 한다.
- 남기는 것: 기록 md, `evidence/`·`captures/` 안의 인용된 파일.
- 묻지 않고 지우는 것:
  - 이 Task 폴더 안에서 남기는 것을 뺀 모든 항목이다.
    - 기록 md가 아닌 md
    - `work/`
    - `evidence/`·`captures/` 안의 인용되지 않은 파일
    - `evidence/`·`captures/` 밖의 md가 아닌 파일과 폴더
    - 그 결과 비게 된 `evidence/`·`captures/`
  - 이 Task의 OS 임시 소유 폴더. [Working Files](conventions.md#working-files)의 소유 인정 조건을 모두 만족하는 폴더만 해당한다.
- 폴더를 지우는 방식(`work/`, OS 임시 소유 폴더, Task 폴더 안의 그 밖의 폴더):
  - 새 이름을 정한다. 같은 상위 폴더 안에서 원래 이름 뒤에 예측할 수 없는 값을 붙이고, 그 이름이 이미 있으면 다른 값을 쓴다.
  - 옮기기 전에 원래 경로, 정확한 새 경로, 확인할 수 있으면 파일 시스템 식별자를 정리 기록(commit 보고의 Working File Cleanup 항목, 커밋 없는 완료면 Task의 Completion Check)에 먼저 적는다. 중단되어도 다음 정리가 이 기록으로 대상을 찾게 하기 위해서다.
  - 그다음 새 이름으로 옮긴다. 이름 옮기기는 링크를 따라가지 않으므로, 확인 뒤 다른 항목으로 바뀌었다면 바뀐 그 항목이 옮겨진다. 옮기지 못하면 지우지 않는다.
  - 옮긴 이름에서 다시 확인한다. 앞서 확인한 결과를 그대로 쓰지 않는다.
    - OS 임시 소유 폴더: 실제 디렉터리이고, 표시 파일이 일반 파일이며, 표시 파일의 path가 옮기기 전 경로와 같고, nonce와 기록한 식별자가 단계 보고의 값과 같다. 같은 상위 폴더 안에서 옮겼으므로 식별자는 바뀌지 않는다.
    - `work/`와 Task 폴더 안의 폴더: 링크·junction이 아닌 실제 폴더이고, 식별자를 기록했다면 그 값과 같다.
  - 하나라도 다르면 지우지 않고, 원래 경로와 옮긴 경로를 함께 보고한다. 같은 이름의 다른 폴더나, 확인과 옮기기 사이에 바뀐 항목을 지우지 않기 위해서다.
- 항목을 지우는 방식:
  - 항목마다 링크인지 먼저 판별하고(링크 자체를 판별하는 방식), 하위 폴더에 들어가기 직전에도 다시 판별한다. 링크·junction은 대상으로 들어가지 않고 그 항목만 제거한다.
  - 낱개 파일은 링크인지 판별한 뒤 그 항목만 지운다. 폴더는 안이 비었을 때만 지운다.
  - 경로를 다시 해석하며 링크를 따라갈 수 있는 방식(셸 glob 확장, 링크를 따라가는 재귀 삭제 명령 등)은 쓰지 않는다.
  - 강제 옵션을 쓰지 않는다.
    - 강제 옵션은 읽기 전용·숨김·시스템 속성이나 확인 절차를 무시하게 하는 옵션이다(예: PowerShell `-Force`, `rm -f`, `del /f`, `rd /s /q`).
    - 이동·삭제를 담은 명령에는 목록 조회를 포함해 어떤 명령에도 붙이지 않는다.
    - 숨김 항목을 확인해야 하면 이동·삭제가 없는 별도 조회 명령으로 한다. 그 조회가 거절되거나 확인할 수 없으면 그 폴더를 지우지 않고 보고한다.
  - 강제 옵션 없이 지워지지 않는 항목(읽기 전용, 숨김, 접근 거부 등)은 속성·권한을 바꿔 지우지 않는다. 그 항목을 남기고, 비지 않은 상위 폴더도 남긴다.
- 지우지 않고 보고만 하는 경우: 그 항목을 남기고 경로와 이유를 정리 기록에 적는다. 묻지 않고 승인 목록도 만들지 않으며, 남은 항목은 [prj-memory-tidy](../../memory-tidy/guide.md)로 정리하도록 안내한다.
  - 소유 인정 조건이 맞지 않는 OS 임시 폴더
  - [OS 임시 폴더](conventions.md#working-files) 정의 밖(시스템 임시 폴더 등)에 있는 `prj-memory-*` 폴더. 단계 보고에 적힌 이 Task의 폴더여도 소유가 아니다. tidy도 지우지 않으므로 사용자가 직접 지우도록 안내한다.
  - 이름을 옮기지 못했거나, 옮긴 이름에서 다시 확인한 값이 다름
  - 옮기기·지우기에 쓰려는 도구가 링크를 따라가지 않는다는 것을 확인할 수 없음
  - 지우는 도중 예상과 다른 변화(식별 값 불일치, 링크로 바뀐 항목, 알 수 없는 종류의 항목). 이때는 즉시 멈추고 남은 경로와 이유를 보고한다.
  - 강제 옵션 없이 지워지지 않는 항목과 그것이 든 폴더. tidy도 강제 옵션을 쓰지 않으므로, 지워지지 않는 이유(읽기 전용 등)를 함께 적어 사용자가 확인하게 한다.
  - 실행 환경이 정리 명령을 거절함(예: "blocked by policy"). 다른 삭제 명령·도구나 권한 변경으로 다시 시도하지 않는다. 거절 메시지 요약과 남은 경로를 적는다.
- 끊긴 링크: 지운 파일을 가리키던 기록 md의 링크를 정리 기록에 적는다(링크가 있던 파일, 가리키던 경로). 기록 md 본문은 고치지 않는다.
- 위협 범위:
  - 다른 일반 사용자나 같은 사용자 계정의 다른 프로세스가 확인 뒤에 폴더나 하위 항목을 바꾸는 경우는 보호 범위 밖이다. 다른 사용자가 바꿀 수 있는 폴더도 지운다.
  - 이름 옮기기와 재확인은 우연한 충돌과 실수를 줄일 뿐 그런 교체를 막는다고 보장하지 않는다. 이 남는 위험은 받아들인 것이다.
- 지우지 않는 것:
  - 다른 Task와 사용자 파일
  - 기록 md와 인용된 `evidence/`·`captures/` 파일
  - Task 없는 활동의 폴더. 그 활동이 스스로 지운다.
  - `.memory` 밖은 소유가 확인된 OS 임시 폴더만 다룬다.
- 기록: commit 보고에 남긴다. 커밋 없는 완료이면 Task의 Completion Check에 남긴다.
  - 옮기기 전에 적은 원래 경로·새 경로(식별자), 지운 것(분류별 경로·개수·용량), 남긴 것과 이유, 끊긴 링크, 소유 폴더를 배타적 신규 생성으로 만들었는지 적는다.
  - 비밀이 있을 수 있는 값은 적지 않는다.
- 실패:
  - 삭제 실패는 Task 완료를 막지 않는다. 남은 경로와 원인을 기록해 다음 정리 때 다룰 수 있게 한다.
  - 이름을 옮긴 뒤 지우기 전에 완료 처리가 끊겼으면(삭제 실패가 아니라 중단), 재개한 완료 처리에서 정리 기록에 미리 적은 정확한 새 경로만 다룬다. 이름이 비슷한 폴더로 대상을 추정하지 않는다.
    - 다음을 모두 만족하면 묻지 않고 지운다. 기록의 원래 경로가 이 Task의 `work/`, 이 Task 폴더 안의 폴더, 또는 이 Task 단계 보고에 기록된 OS 임시 소유 폴더다. 새 경로가 원래 경로와 같은 상위 폴더에 있다. 옮긴 폴더가 위 재확인 조건을 만족한다. OS 임시 소유 폴더는 표시 파일의 path가 원래 경로와 같다. `work/`와 Task 폴더 안의 폴더는 식별자가 기록되어 있고 옮긴 폴더의 식별자와 같다.
    - 기록이 없으면 지우지 않고 남은 경로로 보고한다. 기록이 있어도 위 조건을 하나라도 확인하지 못하면 지우지 않고 경로와 이유를 보고한다.
  - 같은 완료 처리에서 다시 시도하거나 범위를 넓혀 지우지 않는다.

## Migration Exception

기본 `.memory` 로컬 정책을 적용하면서 **기존 tracked memory를 index에서 제거하는 승인된 전환**은 ignored 내용을 새로 추가하는 행위와 구분한다.

1. `git ls-files -- .memory`로 실제 tracked 목록을 확인하고 명시적 공유 예외를 보호한다.
2. 승인된 개별 경로에 `git rm --cached -- <경로>`를 사용한다. 로컬 파일은 남겨 두며 force 옵션을 사용하지 않는다.
3. staged 상태가 해당 경로의 `D`이고 로컬 파일은 실제로 존재하는지 확인한다. Migration Index Deletions에 경로·승인 근거·보존 여부를 기록한다.
4. 이 index deletion만 전환 커밋에 포함할 수 있다. `.memory` 내용의 A/M을 허용하거나 ignore 우회 전반을 허용하는 예외가 아니다.
5. 평소 사용자 제품 삭제 파일의 staged D는 실제 Task scope와 검증을 따른다. 모든 ignored 경로의 D를 자동 승인하지 않는다.
