# Resume and Recovery

[공통 규약](conventions.md)의 Task 상태와 [커밋 점검](commit-check.md)을 기준으로 이어서 실행한다. 파일 존재만으로 단계를 완료 처리하지 않는다. 실제 형식은 [템플릿](templates.md)을 사용한다.

## Resume Order

재개 근거는 다음 순서로 읽는다. Plan별 state는 두지 않는다([State Ownership](conventions.md#state-ownership)).

1. current의 Active Task·Active Stage. current가 손상됐으면 phase.md의 in_progress Task와 그 task.md로 위치를 복원한다([Switch](#switch)).
2. 대상 task.md의 Status·Workflow·Resume Stage·Blocker·Next Step·Commit Status.
3. Commit Status가 prepared·failed면 그 Task의 `work/commit-intent.json`([Commit Intent](commit-check.md#commit-intent)). committed인데 Task가 done이 아니면 commit 보고([커밋 확인 뒤 완료 처리 중단](#커밋-확인-뒤-완료-처리-중단)).
4. 의도가 있으면 Git과 대조한다([Recovery](#recovery)).

진행 중인 옛 Plan에 옛 state가 남아 있으면 [옛 Plan state](#legacy-plan-state)를 먼저 확인한다.

## Commit Intent File

커밋 의도 파일의 필드와 기록 순서는 [Commit Intent](commit-check.md#commit-intent)가 정한다.

- 파일은 Task마다 따로 있다. 다음 Task의 의도와 섞이지 않는다. 새 Task는 파일 없음(none)에서 시작한다.
- 불완전한 prepared·failed 의도는 해결 전 덮어쓰지 않는다.
- 성공을 확인한 SHA·대상·실제 tree 대조 근거는 그 Task의 commit 보고에 남긴 뒤 완료 정리에서 파일을 지운다.
- no-commit 완료는 그 Task의 정책 사유·Completion Check와 current의 Last Completed Task로 보존한다.
- Task/보고가 상세 근거이고 의도 파일은 커밋이 끝날 때까지의 재개 상태다.

## Legacy Plan State

이전 규칙의 `.memory/state/{plan-id}.md`가 남아 있는 진행 중 Plan을 재개할 때 적용한다. state 파일은 읽기만 하고 고치지 않는다.

옛 state는 고치지 않으므로 그 안의 prepared·failed도 계속 남는다. 그래서 옮기기 전에 이미 옮겼거나 해결된 것인지 먼저 본다.

1. 그 Plan의 state를 읽는다.
2. 이미 옮긴 것은 다시 옮기지 않는다. 대상 Task의 task.md Progress나 history에 같은 출처 state 경로의 이관 기록이 있으면 그 항목(위치·의도)을 건너뛴다.
3. Position(Task·Active Stage·Blocker·Next Step)이 task.md와 다르면 Task 보고와 Git 근거로 대조한다. 확인된 값만 task.md에 옮긴다.
4. Commit Intent가 prepared·failed이면, 그 의도의 Task(Commit Intent Task)에만 아래 순서로 적용한다. 다른 Task에 옮기지 않는다.
   - 그 Task의 task.md Commit Status가 committed·skipped이면 해결된 의도다. 옮기지 않는다(tidy의 옛 state 판정과 같은 기준).
   - 그 Task가 done인데 Commit Status가 prepared·failed면 기록이 충돌한다. 해결로 보지 않고 옮기지도 않으며 blocked로 둔다.
   - 그 Task가 done인데 Commit Status 필드가 없으면(과거 형식) 그 Task의 commit 보고·Completion Check와 Git을 대조한다.
     - committed로 보려면 두 가지가 모두 필요하다.
       - commit 보고에 SHA가 있고 그 commit의 Plan/Phase/Task가 대상과 같다([Commit Message Identity](#commit-message-identity)). 식별자 일치는 후보를 찾는 조건일 뿐이다.
       - 내용 대조 근거가 있다. commit 보고에 그 commit의 성공 대조(changed path·A/M/D·mode/blob·tree)가 기록되어 있거나, 옛 의도의 후보 snapshot으로 [Recovery](#recovery)의 내용 대조를 지금 통과해야 한다.
     - 정책 사유가 있는 커밋 없는 완료(Completion Check)면 skipped로 본다.
     - committed·skipped로 확인되면 해결된 의도로 처리하고 옮기지 않는다.
     - 확인 결과와 근거는 history에만 남긴다. 과거 done Task의 task.md는 고치지 않는다. 이 기록이 2단계의 재이관 방지 근거다.
     - 근거가 부족하거나 서로 다르면 blocked로 둔다.
   - 그 Task에 이미 `work/commit-intent.json`이 있으면 덮어쓰지 않는다. 그 파일과 옛 의도의 Base HEAD·후보·메시지가 같으면 이관이 중간에 끊긴 것이므로 task.md Commit Status와 이관 기록만 맞춘다. 다르면 blocked로 둔다.
   - 둘 다 아니면 옛 의도 내용(연결된 의도 파일이 있으면 그 내용)으로 `work/commit-intent.json`을 만들고 task.md Commit Status를 같은 값으로 맞춘다. 그다음 [Recovery](#recovery)를 따른다.
5. 옮긴 사실과 출처 state 경로를 task.md Progress와 history에 남긴다. 이 기록이 2단계의 재이관 방지 근거다.
6. 근거가 서로 충돌하거나 부족하면 blocked로 두고 새 위치로 덮지 않는다.

done Plan의 옛 state는 재개 대상이 아니다. 정리는 [prj-memory-tidy](../../memory-tidy/guide.md)의 승인으로만 한다.

## Stale Evidence

1. 명시 Task 경로 또는 current Active Task를 확인하고 Task의 Revision·Status·workflow·Resume Stage를 읽는다.
2. 필요한 관련 파일과 적용 단계의 evidence를 확인한다. placeholder·없는 링크·실제 done Task를 새로 구현하지 않는다.
3. [Evidence and Completion](conventions.md#evidence-and-completion)의 Revision/snapshot 및 관련 환경을 현재 대상과 비교하고 영향받은 결과만 stale로 판정한다. 실제 checkout/cwd를 확인하며 HEAD/경로 이름만 바뀐 동일 내용은 무효화하지 않는다.
4. 같은 내용의 코드가 커밋되어 HEAD만 바뀐 것은 내용 검증 실패가 아니다. 준비 시 Base HEAD는 commit recovery에 사용하고 내용 유효성은 파일 snapshot으로 판단한다.
5. stale/failed/blocked를 passed나 skipped로 자동 변환하지 않는다. 실제 필요한 단계로 재개한다. 환경·설계 blocker가 해결되지 않으면 근거를 남기고 멈춘다.
6. stage-only 요청은 선행 증거가 부족해도 전체 workflow를 자동 실행하지 않는다. 필요한 다음 행동을 보고한다.

과거 환경 근거 부재는 [Environment Evidence](conventions.md#environment-evidence)의 AC 영향·한계 판단을 따른다. 임의 실패/통과를 만들지 않으며 단독 단계의 부족한 선행 근거는 [Stage Isolation](conventions.md#stage-isolation)에 따라 다음 행동만 남긴다.

review 중단 재개는 실제 반환·미완료 여부와 대상 snapshot을 확인하고 [Review Delegation](review.md#review-delegation)의 불가 알림·자체 리뷰 또는 실제 재리뷰 절차를 따른다. 부분 finding·이전 판정을 보존하며 중단을 passed로 바꾸지 않는다. 도구 교체는 [State Ownership](conventions.md#state-ownership)의 단일 writer와 순차 재개 경계를 지킨다.

## Switch

- 전환 전에 단순 초기 placeholder와 실제 진행 링크 손상을 구분한다. 실재 진행 근거가 있으면 기존 Task·보고·phase.md·`work/commit-intent.json`과 필요한 실제 Git 결과를 대조해 이전 위치/재개 단계/미해결 intent를 먼저 복원한다. 근거가 불충분하거나 충돌하면 손상·필요한 다음 확인을 기록하고 새 active로 덮지 않는다. 이는 기존 위치 복구이며 새 Task 생성/완료 추정이 아니다.
- 새 요청 등록은 현재 진행 중 Task를 유지한다. 활성 작업이 없으면 첫 실행 가능한 새 Task를 활성화할 수 있다.
- 사용자 우선 처리 지시가 있으면 old Task의 Resume Stage·Blocker·Next Step을 task.md에 먼저 저장하고 new current를 기록한다. 보류한 위치는 current Status에 그 Task 링크 한 줄로만 남기고, 전환 메모를 current에 쌓지 않는다([Current Compaction](#current-compaction)).
- 상세 상태는 old Task에 유지한다. current를 전환했다고 해당 작업을 done 또는 blocker 해결로 바꾸지 않는다.
- 이 저장은 기존 Task·보고의 갱신이며 매 전환의 전체 사본 생성 의무가 아니다. 별도 archive 경로는 추가하지 않고 기존 사본은 그대로 둔다. 같은 Plan의 새 Task로 전진할 때도 이전 성공 근거 보존과 미해결 intent 차단을 먼저 확인한다.
- 등록·전환 실패 중간에 current를 먼저 새 링크로 변경하지 않는다. 같은 Plan에서 여러 Task가 있어도 Task ID와 현재 단계가 모호하지 않아야 한다.

## Recovery

### 커밋 실패 또는 미시도

근거는 task.md Commit Status와 그 Task의 `work/commit-intent.json`이다.

- pending(의도 파일 없음)은 아직 준비하지 않은 상태다. Task의 다음 적용 단계로 진행한다.
- Commit Status가 prepared·failed인데 의도 파일이 없거나 읽을 수 없으면 성공·실패를 추정하지 않는다. Base HEAD 이후 Git 기록을 확인하고 blocked로 남긴다.
- failed는 실제 commit 실패다. 원인·staged 상태·후보 내용이 그대로 유효한지 확인하고 필요한 조치를 수행한다. 검증 대상이 바뀌면 먼저 evidence를 갱신한다.
- prepared이고 Base HEAD 이후 성공 근거가 없으면 실제로 커밋하지 않았는지 확인한다. unrelated commit이나 사용자 index 변경을 단정적으로 되돌리지 않는다.

### 성공한 커밋 뒤 로컬 상태 누락

1. 의도 파일의 `task`와 현재 대상이 일치하는지 확인한다.
2. Base HEAD 이후의 commit 중 아래 Commit Message Identity 규칙으로 Plan/Phase/Task가 일치하는 후보를 찾는다. 현재 HEAD가 다르더라도 해당 실제 commit을 확인한다.
3. 후보 commit의 실제 changed path·added/modified/deleted 상태와 `git ls-tree <commit> -- <후보>`의 Git mode/blob ID를 prepared staged entry에 대조한다. 줄바꿈·clean filter 정규화와 shell 텍스트 변환을 거친 로컬 hash를 commit blob 비교에 쓰지 않는다. 삭제 entry는 없어야 하고 승인된 index deletion의 로컬 파일은 보존되어야 한다.
4. 기록된 관련 파일 내용과 현재 작업 트리를 비교한다. 성공 이후 새 scope 변경이 있다면 이미 완료한 commit의 복구와 새로운 변경을 구분한다.
5. 일치가 확인되면 committed SHA를 의도 파일·commit 보고·task.md에 기록한다([Commit Intent](commit-check.md#commit-intent)의 성공 순서). 구현·검증·커밋을 다시 하지 않고 누락된 완료/집계/포인터 단계만 복구한다.
6. 확인이 불충분하거나 실제 commit 내용이 검증 snapshot과 다르면 blocked로 기록하고 차이를 설명한다. trailer만으로 성공을 인정하거나 중복 commit을 시도하지 않는다.

### 커밋 확인 뒤 완료 처리 중단

task.md Commit Status가 committed이고 commit 보고에 확인한 SHA와 대조 결과가 있는데, Task가 아직 done이 아니면 적용한다. 의도 파일은 완료 정리에서 이미 지워졌거나 이름이 바뀌었을 수 있다.

1. commit 보고의 SHA가 실제로 있는지, 그 commit의 Plan/Phase/Task trailer가 대상과 같은지 확인한다([Commit Message Identity](#commit-message-identity)). 성공 대조(changed path·mode/blob·tree)는 commit 보고에 이미 기록되어 있으므로 다시 요구하지 않는다.
2. 확인되면 구현·검증·커밋을 다시 하지 않는다. [작업 파일 정리](commit-check.md#working-file-cleanup)의 중단 복구(commit 보고의 옮기기 전 기록)로 남은 정리를 마친 뒤 done·Phase 집계·Plan·current 단계만 복구한다.
3. `work/commit-intent.json`이 아직 남아 있고 `status`가 committed면 정리 대상이다. committed가 아니면 commit 보고와 충돌하므로 blocked로 둔다.
4. SHA가 없거나 trailer가 다르면 blocked로 두고 차이를 기록한다.

단독 commit 실행에서 성공한 경우도 같은 확인을 거쳐 task-mode finalize만 수행한다. 성공 결과를 '지금 diff가 없음'이라는 이유로 skipped로 덮지 않는다.

### Commit Message Identity

- 새 메시지는 마지막 trailer 블록을 `git interpret-trailers --parse`로 읽는다. Plan ID, 전체 Phase ID, metadata Task ID가 각각 정확히 한 번 있어야 한다. 의도 파일의 `task`도 같은 metadata Task ID를 사용한다.
- 과거 메시지는 Plan/Phase/Task 줄이 본문 중간에 있거나 Task 값이 `T01-slug`인 형식도 복구 대상으로 허용한다. `git show -s --format=%B <commit>`의 전체 메시지에서 독립된 `Plan:`, `Phase:`, `Task:` 줄을 확인한다. 단순 부분 문자열 검색으로 일치를 판정하지 않는다.
- 과거 Task 폴더명을 대응시킬 때 정확한 Plan ID와 전체 Phase ID가 먼저 일치해야 한다. Task 값은 대상의 실제 폴더명 전체와 일치해야 하며, 해당 폴더의 task.md에 기록된 metadata Task ID로 연결한다. 같은 T 번호만 가진 다른 Plan·Phase·slug는 대상이 아니다.
- 전체 메시지에서 세 식별자 중 하나라도 누락되거나 중복·충돌하면 성공으로 인정하지 않는다. prepared 메시지와 실제 메시지의 식별자가 다르거나 대응할 실제 청사진이 없으면 차이를 기록하고 blocked로 둔다. 표준 파싱에 실패했다는 이유만으로 과거 형식이라고 단정하지 않는다.
- 과거 형식 호환은 기존 intent·청사진·메시지의 근거가 있는 복구에만 적용한다. 신규 커밋은 표준 마지막 trailer 블록을 사용한다. 이미 완료된 Task 문서와 과거 커밋을 amend/rewrite하지 않는다.
- 식별자 일치는 후보를 찾는 조건이다. 위 Recovery의 changed paths·A/M/D·staged mode/blob·실제 tree·현재 작업 트리 확인까지 통과해야 committed로 인정한다.

## Completion

- [완료 의미](conventions.md#evidence-and-completion)와 [Quality Gate](commit-check.md#quality-gate)로 준비·커밋 정책 결과를 확인한 전체 실행만 finalize한다. 관측 실패/조사 목적은 구분하며 stage-only/check_only는 자동 done·전진하지 않는다.
- 성공 commit 또는 커밋 없는 완료를 확인한 뒤 Task done을 기록하기 전에 [작업 파일 정리](commit-check.md#working-file-cleanup)를 한다. 정리 실패와 남긴 항목은 기록하고 done을 막지 않는다.
- done Task를 근거로 Phase Tasks 표·done count를 갱신하고 Plan 요약을 갱신한 뒤 current를 다음 Task로 전진한다. 이전 Last Completed Task는 그 Task의 commit 보고·history에 남아 있으므로 current에 "이전 완료"로 쌓지 않는다. current를 쓸 때 [Current Compaction](#current-compaction) 조건을 확인한다.
- 다음 Task는 같은 Plan의 순서와 실제 Dependencies를 확인한다. 완료되지 않은 선행 Task를 건너뛰어 검증 실패를 숨기지 않는다.
- 마지막 Task 완료 시 Phase와 Plan done, current Active Task·Active Stage 없음. 다른 pending Plan을 임의로 시작하지 않는다.
- 복구 시 Task 기록과 확인한 Git 결과를 정본으로 삼아 요약을 다시 계산한다. 다른 단계의 blocker를 임의로 지우지 않는다.
- Task·의도 파일·current 기록은 같은 디렉터리의 임시 파일에 완성 내용을 쓴 뒤 교체한다. 원본부터 삭제하지 않는다. 여러 문서의 교체를 단일 트랜잭션이라고 주장하지 않으며 중간 중단은 위 근거로 복구한다.


## Current Compaction

current를 쓰는 실행은 상태를 쓸 때 이 절차를 확인하고, 해당하면 묻지 않고 압축한다. memory-execute·memory-intake·memory-plan처럼 current를 쓰는 모든 스킬이 대상이다. 읽기 전용 스킬은 current를 쓰지 않으므로 압축하지 않는다.

- 먼저 확인: history에서 가장 나중의 current 압축 기록에 교체 확인 기록이나 확인 불가 기록이 없으면 아래 중단 뒤 재개부터 한다. 크기 조건보다 먼저 본다. 압축·확인·확인 불가 기록은 Result를 "current 압축"으로 시작해 찾을 수 있게 한다.
- 조건: current가 150줄을 넘거나, [Current 템플릿](templates.md#current) 밖의 절·항목이 있을 때.
- 순서:
  1. 분류: 템플릿 밖 내용을 항목별로 나눈다. 활성 위치, 보류 위치(다른 Plan의 재개 위치), 미해결 commit intent, 완료 기록, 그 밖의 메모다.
  2. 남길 형태: 활성 위치는 템플릿 절에 둔다. 보류 위치와 미해결 intent는 Status에 그 Task 링크로 한 줄씩 줄인다. 옛 current의 Checkpoint 줄은 지운다. 그 줄이 보류 위치나 미해결 intent를 가리켰으면 그 Task 링크 한 줄로 바꾼다. 가리키던 옛 state 파일은 남아 있으므로 원문 보존 대상이 아니다. Task·Git 근거로 완료가 확인되지 않은 위치는 완료 기록으로 옮기지 않고 보류 위치로 남기며, 확인할 일을 Next Step에 적는다.
  3. 원문 보존: current에서 지우거나 줄이는 모든 내용이 대상이다. 옮기는 항목뿐 아니라, 링크로 줄이는 보류 위치·intent의 세부 내용(보류 사유, 재개 조건, intent 세부)도 포함한다.
     - history·Task 보고에 같은 사실이 있는지 확인한다. 없거나 같은지 애매하면 오늘 history에 원문 그대로 먼저 추가한다. 원문 보존이며 결과 요약의 중복 기록이 아니다.
     - 링크로 줄인 항목의 원문을 history에 추가했으면, Status의 그 링크 줄에 history 기록도 함께 연결한다.
     - 보존을 확인할 수 없는 항목은 줄이거나 옮기지 않고 그대로 둔다.
  4. 압축 기록: 교체하기 전에 오늘 history에 남긴다. 교체 전 current의 줄 수와 SHA256, 교체할 내용의 줄 수와 SHA256, 옮기거나 줄인 항목 수, 원문을 추가한 기록을 적는다.
  5. 교체: current를 원자적으로 교체한다([Completion](#completion)의 임시 파일 방식).
  6. 교체 확인: 교체된 current의 SHA256이 4단계의 교체할 내용 값과 같은지 확인하고, history에 확인 기록을 새로 덧붙인다.
- 중단 뒤 재개:
  - 4단계 기록은 있는데 6단계 확인이 없으면, current의 SHA256을 그 기록의 교체할 내용 값과 대조한다.
  - 같으면 교체는 끝난 것이다. 확인 기록만 덧붙인다.
  - 다르면 교체 여부를 확인할 수 없다. 교체 뒤 다른 쓰기로 current가 바뀌었을 수도 있기 때문이다. 완료로도 미교체로도 단정하지 않는다. 확인 불가 기록(현재 SHA256, 교체 전 값과 같은지)을 history에 남기고, 지금 current로 조건과 원문 보존부터 다시 본다.
  - 확인 기록이나 확인 불가 기록이 있으면 그 압축은 끝난 것으로 보고 다시 대조하지 않는다.
  - 4단계 전에 끊겼으면 current 원본이 그대로이므로 처음부터 다시 한다.
  - 어느 경우든 이미 history에 추가한 원문은 3단계 확인에서 찾히므로 다시 추가하지 않는다.
- 원문을 잃지 않는다. 기존 history 기록은 고치거나 지우지 않고(확인은 새 기록으로 덧붙인다), 남아 있는 옛 state의 내용도 지우지 않는다. 별도 archive 사본은 만들지 않는다.
- 압축은 기록 정리다. 위치 전환, Task 상태 변경, 완료 판정을 하지 않는다.
