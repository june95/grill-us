# Resume, Checkpoint and Recovery

[공통 규약](conventions.md)의 Task 상태와 [커밋 점검](commit-check.md)을 기준으로 이어서 실행한다. 파일 존재만으로 단계를 완료 처리하지 않는다. 실제 형식은 [템플릿](templates.md)을 사용한다.

## Checkpoint Fields

Plan별 `.memory/state/{plan-id}.md`에 아래를 기록한다.

| Field | Type / Constraint |
| :--- | :--- |
| Plan / Phase / Task | ID와 이 checkpoint 기준 상대 링크 |
| Active Stage | Stage enum 또는 없음 |
| Mode | task / stage |
| Commit Policy | auto / none / check_only |
| Repo / Branch | 현재 프로젝트 식별 정보; 실제 대상 확인용 |
| Blocker / Next Step | 실제 차단 원인과 다음 행동 |
| Commit Intent Status | none / prepared / committed / failed |
| Commit Intent Task | 이 커밋 의도의 정확한 Task ID |
| Base HEAD | 커밋 직전 Git SHA 또는 없음 |
| Candidate Paths | 명시적 repo-relative 목록 |
| Candidate Snapshot | 경로별 added/modified/deleted 상태, working-tree hash, staged Git mode/blob ID; 삭제는 entry 없음 |
| Commit Message | Plan/Phase/Task trailer를 포함한 실제 계획 메시지 |
| Commit Hash | 확인한 성공 SHA 또는 없음 |
| Migration Index Deletions | 승인된 index 추적 해제 목록과 로컬 보존 근거 |
| Last Completed Commit | 마지막 성공 Task ID·SHA·결과 |

새 Task로 전진할 때 직전 성공 의도를 다음 Task의 의도로 오인하지 않는다. 마지막 성공 결과는 보존하고 새 의도는 none으로 초기화한다. 불완전한 prepared/failed intent는 해결 전 덮어쓰지 않는다.

## Stale Evidence

1. 명시 Task 경로 또는 current Active Task를 확인하고 Task의 Revision·Status·workflow·Resume Stage를 읽는다.
2. 필요한 관련 파일과 적용 단계의 evidence를 확인한다. placeholder·없는 링크·실제 done Task를 새로 구현하지 않는다.
3. Evidence Revision과 실제 covered 파일 snapshot 및 [Environment Evidence](conventions.md#environment-evidence)를 비교한다. 관련 runtime/tool·lockfile·runner 설정 변경이 결과에 주는 영향을 기록하고 영향받은 결과만 stale로 표시한다. 같은 내용의 HEAD/branch·PC 경로명 변화나 무관한 설정만으로 전체 retest하지 않는다. 실제 checkout/cwd와 대상은 확인한다.
4. 같은 내용의 코드가 커밋되어 HEAD만 바뀐 것은 내용 검증 실패가 아니다. 준비 시 Base HEAD는 commit recovery에 사용하고 내용 유효성은 파일 snapshot으로 판단한다.
5. stale/failed/blocked를 passed나 skipped로 자동 변환하지 않는다. 실제 필요한 단계로 재개한다. 환경·설계 blocker가 해결되지 않으면 근거를 남기고 멈춘다.
6. stage-only 요청은 선행 증거가 부족해도 전체 workflow를 자동 실행하지 않는다. 필요한 다음 행동을 보고한다.

과거 환경 근거가 없으면 현재/기존 로그로 필요한 사실을 확인하되 현재 값을 과거 값으로 간주하지 않는다. 근거 부재만으로 자동 실패/통과하지 않고 재검증 가능성·완료 조건 영향·한계를 기록한다. 필요한 동일성을 입증할 수 없어 완료 조건을 막을 때만 blocked다. 과거 done 기록은 보존하며 단독 단계는 선행 stale의 사유·대상·Next Action만 남기고 요청하지 않은 단계·제품 수정·commit/finalize와 active Position 변경을 수행하지 않는다.

## Switch

- 새 요청 등록은 현재 진행 중 Task를 유지한다. 활성 작업이 없으면 첫 실행 가능한 새 Task를 활성화할 수 있다.
- 사용자 우선 처리 지시가 있으면 old Task Resume Stage·Blocker·Next Step과 Plan checkpoint를 먼저 저장하고 new current를 기록한다.
- 상세 상태는 old Task에 유지한다. current를 전환했다고 해당 작업을 done 또는 blocker 해결로 바꾸지 않는다.
- 등록·전환 실패 중간에 current를 먼저 새 링크로 변경하지 않는다. 같은 Plan에서 여러 Task가 있어도 Task ID와 현재 단계가 모호하지 않아야 한다.

## Recovery

### 커밋 실패 또는 미시도

- none은 아직 준비하지 않은 상태다. Task의 다음 적용 단계로 진행한다.
- failed는 실제 commit 실패다. 원인·staged 상태·후보 내용이 그대로 유효한지 확인하고 필요한 조치를 수행한다. 검증 대상이 바뀌면 먼저 evidence를 갱신한다.
- prepared이고 Base HEAD 이후 성공 근거가 없으면 실제로 커밋하지 않았는지 확인한다. unrelated commit이나 사용자 index 변경을 단정적으로 되돌리지 않는다.

### 성공한 커밋 뒤 로컬 상태 누락

1. intent의 Task ID와 현재 대상이 일치하는지 확인한다.
2. Base HEAD 이후의 commit 중 아래 Commit Message Identity 규칙으로 Plan/Phase/Task가 일치하는 후보를 찾는다. 현재 HEAD가 다르더라도 해당 실제 commit을 확인한다.
3. 후보 commit의 실제 changed path·added/modified/deleted 상태와 `git ls-tree <commit> -- <후보>`의 Git mode/blob ID를 prepared staged entry에 대조한다. 줄바꿈·clean filter 정규화와 shell 텍스트 변환을 거친 로컬 hash를 commit blob 비교에 쓰지 않는다. 삭제 entry는 없어야 하고 승인된 index deletion의 로컬 파일은 보존되어야 한다.
4. 기록된 관련 파일 내용과 현재 작업 트리를 비교한다. 성공 이후 새 scope 변경이 있다면 이미 완료한 commit의 복구와 새로운 변경을 구분한다.
5. 일치가 확인되면 committed SHA를 로컬 기록에 보존한다. 구현·검증·커밋을 다시 하지 않고 누락된 완료/집계/포인터 단계만 복구한다.
6. 확인이 불충분하거나 실제 commit 내용이 검증 snapshot과 다르면 blocked로 기록하고 차이를 설명한다. trailer만으로 성공을 인정하거나 중복 commit을 시도하지 않는다.

단독 commit 실행에서 성공한 경우도 같은 확인을 거쳐 task-mode finalize만 수행한다. 성공 결과를 '지금 diff가 없음'이라는 이유로 skipped로 덮지 않는다.

### Commit Message Identity

- 새 메시지는 마지막 trailer 블록을 `git interpret-trailers --parse`로 읽는다. Plan ID, 전체 Phase ID, metadata Task ID가 각각 정확히 한 번 있어야 한다. checkpoint의 Commit Intent Task도 같은 metadata Task ID를 사용한다.
- 과거 메시지는 Plan/Phase/Task 줄이 본문 중간에 있거나 Task 값이 `T01-slug`인 형식도 복구 대상으로 허용한다. `git show -s --format=%B <commit>`의 전체 메시지에서 독립된 `Plan:`, `Phase:`, `Task:` 줄을 확인한다. 단순 부분 문자열 검색으로 일치를 판정하지 않는다.
- 과거 Task 폴더명을 대응시킬 때 정확한 Plan ID와 전체 Phase ID가 먼저 일치해야 한다. Task 값은 대상의 실제 폴더명 전체와 일치해야 하며, 해당 폴더의 task.md에 기록된 metadata Task ID로 연결한다. 같은 T 번호만 가진 다른 Plan·Phase·slug는 대상이 아니다.
- 전체 메시지에서 세 식별자 중 하나라도 누락되거나 중복·충돌하면 성공으로 인정하지 않는다. prepared 메시지와 실제 메시지의 식별자가 다르거나 대응할 실제 청사진이 없으면 차이를 기록하고 blocked로 둔다. 표준 파싱에 실패했다는 이유만으로 과거 형식이라고 단정하지 않는다.
- 과거 형식 호환은 기존 intent·청사진·메시지의 근거가 있는 복구에만 적용한다. 신규 커밋은 표준 마지막 trailer 블록을 사용한다. 이미 완료된 Task 문서와 과거 커밋을 amend/rewrite하지 않는다.
- 식별자 일치는 후보를 찾는 조건이다. 위 Recovery의 changed paths·A/M/D·staged mode/blob·실제 tree·현재 작업 트리 확인까지 통과해야 committed로 인정한다.

## Completion

- 전체 실행은 품질 판정과 auto commit 성공, 명시적 none, 또는 실제 변경 없음 정책까지 충족했을 때 Task done으로 기록한다.
- stage-only 또는 check_only 요청은 완료 조건을 채웠더라도 자동 포인터 전진을 하지 않는다.
- done Task를 근거로 Phase Tasks 표·done count를 갱신하고 Plan 요약을 갱신한 뒤 current를 다음 Task로 전진한다.
- 다음 Task는 같은 Plan의 순서와 실제 Dependencies를 확인한다. 완료되지 않은 선행 Task를 건너뛰어 검증 실패를 숨기지 않는다.
- 마지막 Task 완료 시 Phase와 Plan done, current Active Task·Active Stage 없음. 다른 pending Plan을 임의로 시작하지 않는다.
- 복구 시 Task 기록과 확인한 Git 결과를 정본으로 삼아 요약을 다시 계산한다. 다른 단계의 blocker를 임의로 지우지 않는다.
- Task·checkpoint·current 기록은 같은 디렉터리의 임시 파일에 완성 내용을 쓴 뒤 교체한다. 원본부터 삭제하지 않는다. 여러 문서의 교체를 단일 트랜잭션이라고 주장하지 않으며 중간 중단은 위 근거로 복구한다.
