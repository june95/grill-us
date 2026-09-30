# Common Completion and Commit Check

[공통 규약](conventions.md)을 기준으로 최종 리뷰의 핵심과 Git 경계를 함께 확인한다. 별도 final-review.md가 없는 Task도 완료 조건과 적용 단계의 유효한 증거를 확인해야 한다.

## Quality Gate

1. Task Goal·Scope·Acceptance Criteria·Alignment와 현재 관련 변경을 대조한다. 범위 밖 변경, 누락된 완료 조건, 명백한 결함·회귀 위험을 확인한다.
2. commit-check **이전**의 적용 단계만 평가한다. 필수 단계는 passed와 현재 유효한 증거, 필요 시는 조건 평가 후 passed 또는 이유 있는 skipped, 해당 없음은 이유 있는 skipped여야 한다. 아직 수행 전인 commit과 running 상태의 이 점검 자체는 선행 완료 조건이 아니다.
3. Evidence Revision, 실제 Covered Files·Source Snapshot을 확인한다. 문서가 존재한다는 이유만으로 유효하다고 보지 않는다. 실패·환경 차단·stale 증거를 생략으로 덮지 않는다.
4. unresolved current-scope Critical/High, 승인되지 않은 계약 변경, 충족하지 못한 완료 조건이 있으면 blocked다. 후속 Task로 옮긴 사실만으로 blocking finding을 해소하지 않는다. 다른 수준의 finding도 완료 조건을 막으면 차단한다.
5. 필요한 정본은 승인된 계약 및 현재 구현·검증과 일치해야 한다. 정본 갱신이 해당 없음이면 그 근거를 읽고 빈 guide-update.md를 요구하지 않는다.
6. Task Completion Check에 `Verdict: ready / blocked`, Revision·snapshot, 완료 조건별 근거, 단계 적용·판정, blocking finding, 남은 검증 한계를 적는다.

공통 점검 자체가 코드 리팩토링을 수행하지 않는다. 수정이 필요하면 적절한 구현·review-action 단계로 반환한다. 수정 후 영향받은 증거를 갱신하고 다시 판정한다. 단계 단독 commit-check 요청이면 발견 사항만 기록하며 다른 단계·staging·commit·포인터 전진을 수행하지 않는다.

## Staging

- 시작 시 `git status --short`와 `git diff --cached --name-status`로 기존 사용자 변경·index를 확인한다.
- Task에 포함되는 명시적 파일 목록을 만든다. 코드·테스트·공유 가이드·설정 등 관련 변경만 포함하며 기본 로컬 `.memory`, 다른 작업, 임시 파일, 비밀 파일, 생성 노이즈는 제외한다.
- 후보마다 `git check-ignore -v --no-index -- <명시적 경로>`를 확인한다. tracked 파일도 검사한다. verbose 출력은 부정 패턴에도 exit 0을 반환하므로 종료 코드만으로 ignored를 판정하지 않는다. 아래 Ignore Result 규칙으로 실제 적용 패턴을 읽는다.
- `git add -- <명시적 파일 목록>`만 사용한다. `git add .`, `git add -A`, `git add -f`, `git add --force`를 사용하지 않는다.
- staging 후 `git diff --cached --name-status`와 각 staged 경로의 ignore 상태를 다시 확인한다. 전환 예외 외에 ignored 내용 추가·수정은 허용하지 않는다.
- `git ls-files --stage -- <후보>`로 stage 0의 Git mode/blob ID를 확인한다. unresolved merge stage가 있으면 차단한다. working-tree SHA256은 검증 freshness, staged Git entry는 실제 commit 내용 복구에 사용하여 줄바꿈·clean filter 차이를 구분한다.
- stage된 변경 내용이 검토·검증한 내용과 같은지 실제 diff와 snapshot으로 확인한다. 후보에 user WIP가 같은 파일에 섞였으면 안전하게 구분할 수 있는지 확인하고 불분명하면 차단한다.
- 이미 staged된 unrelated 작업을 전체 커밋에 섞거나 임의로 unstage하지 않는다. 명시적 Task 경로만 커밋할 수 있는 방식을 사용하되 그 방식이 기존 사용자 index와 실제 검토 범위를 보존하는지 확인한다. 안전한 분리가 불가능하면 차단한다.
- 잘못 stage한 경로는 본 실행에서 stage한 것인지 확인하고 index만 복구한다. 로컬 파일·사용자 작업을 삭제하거나 `reset --hard`, 작업 파일 checkout으로 되돌리지 않는다.
- 명시적 요청 없이 push하지 않는다. 비대화식 commit을 사용하고 shell 문자열 연결 대신 실제 메시지 파일 또는 구조화 입력을 사용한다.

### Ignore Result

- exit 0이면 출력의 실제 적용 패턴을 확인한다. 패턴이 이스케이프되지 않은 `!`로 시작하면 제외 해제이며, 그 외 매칭은 ignored다. `\!literal`은 느낌표로 시작하는 이름을 제외하는 일반 패턴이다.
- exit 1이고 출력이 없으면 매칭 없음이다. 1보다 큰 종료 코드, 실행 실패, 예상하지 못한 출력은 오류로 기록하고 해당 후보의 staging을 차단한다.
- 기계 판독은 `git check-ignore -v -z --no-index --stdin`에 명시 경로를 NUL로 구분해 전달한다. 출력은 `source`, `line`, `pattern`, `pathname`의 NUL 구분 4필드 묶음이다. 여러 경로의 전체 종료 코드를 개별 파일 판정으로 사용하지 않는다. 출력 경로와 입력 후보를 대응시키고, 정상 실행에서 출력 없는 경로만 무매칭으로 처리한다. 필드 누락·알 수 없는 경로는 오류다.
- ignored 부모 아래의 자식 예외는 적용되지 않을 수 있다. `.gitignore`에 `!` 줄이 있다는 사실 대신 해당 경로에 대해 Git이 반환한 실제 패턴을 따른다.
- 제외 해제·무매칭은 Git ignore 조건만 충족한다. Task scope, 명시 공유 승인, 기본 로컬 `.memory`, 사용자 index 보존 조건을 별도로 확인하며 `!`를 포괄적인 staging 승인으로 사용하지 않는다.

## Commit Intent

ready 판정과 staged 내용 확인 후, [resume.md](resume.md)의 checkpoint에 prepared intent를 먼저 기록한다.

- 정확한 Plan/Phase/Task, Base HEAD, 명시 후보 경로·added/modified/deleted 상태·working-tree hash·staged Git mode/blob ID, 전체 Commit Message, 전환 index deletion 목록을 기록한다.
- 새 Commit Message는 설명 본문 뒤 마지막 블록에 Plan/Phase/Task trailer를 각각 한 번 둔다. Plan은 Plan ID, Phase는 전체 Phase ID(예: `P01-core`), Task는 metadata Task ID(예: `P01-T01`)와 정확히 일치해야 한다. Task 폴더명 `T01-slug`를 새 trailer 값으로 쓰지 않는다. `git interpret-trailers --parse`로 실제 메시지의 세 값을 확인한다.
- 커밋 결과가 나오기 전에 report에 committed를 쓰지 않는다. 준비 기록은 prepared다.
- 성공하면 SHA와 실제 변경을 확인하고 intent/report를 committed로 갱신한다. 이어 Task done, Phase 집계, Plan 상태, current를 동기화한다.
- 실패하면 failed와 실제 오류·재개 행동을 기록하고 Task는 미완료로 둔다. current를 다음 Task로 옮기지 않는다.
- 성공 후 상태 기록이 끊겼다면 [메시지 호환 규칙](resume.md#commit-message-identity)으로 대상 식별자를 확인하고 commit 파일·내용을 함께 검증해 복구한다. 과거 본문 중간 식별자와 Task 폴더명은 복구에만 허용한다. hash 또는 메시지 식별자만 보고 성공을 추측하지 않는다.
- stage-only commit은 유효한 선행 점검을 요구하며 성공하더라도 포인터 finalize는 별도 전체 실행에서 수행한다.

## No Commit

- `none`: 사용자 지시에 따라 commit을 생략한다. Task 완료 조건과 품질 판정은 수행하고 명시 생략 사유·남은 미커밋 변경을 기록한 뒤 전체 실행에서 done 처리할 수 있다.
- `check_only`: 품질·커밋 가능 상태만 점검한다. staging, commit, Task done, 포인터 전진을 자동 수행하지 않는다.
- 실제 Git 변경 없음: 로컬 조사·보고만 있으면 빈 commit을 만들지 않는다. 변경 없음과 완료 근거를 기록하고 전체 실행에서 finalize할 수 있다.
- 이미 성공한 동일 Task 커밋이 있으면 변경 없음을 새 skipped 결과로 덮지 않는다. 성공 증거를 보존하고 [재개 규약](resume.md)대로 상태만 복구한다.
- 실행하지 않은 commit.md를 생성하지 않는다. 공통 점검과 정책 생략 근거는 Task 표·Completion Check에 기록할 수 있다.

## Migration Exception

기본 `.memory` 로컬 정책을 적용하면서 **기존 tracked memory를 index에서 제거하는 승인된 전환**은 ignored 내용을 새로 추가하는 행위와 구분한다.

1. `git ls-files -- .memory`로 실제 tracked 목록을 확인하고 명시적 공유 예외를 보호한다.
2. 승인된 개별 경로에 `git rm --cached -- <경로>`를 사용한다. 로컬 파일은 남겨 두며 force 옵션을 사용하지 않는다.
3. staged 상태가 해당 경로의 `D`이고 로컬 파일은 실제로 존재하는지 확인한다. Migration Index Deletions에 경로·승인 근거·보존 여부를 기록한다.
4. 이 index deletion만 전환 커밋에 포함할 수 있다. `.memory` 내용의 A/M을 허용하거나 ignore 우회 전반을 허용하는 예외가 아니다.
5. 평소 사용자 제품 삭제 파일의 staged D는 실제 Task scope와 검증을 따른다. 모든 ignored 경로의 D를 자동 승인하지 않는다.
