# Project Memory Validation Scenarios

변경한 workflow를 확인할 때만 읽는다. 기본 실행마다 이 문서 전체를 로드하지 않는다. 실제 규칙은 [공통 규약](conventions.md), [커밋 점검](commit-check.md), [재개](resume.md), [등록](../../memory-intake/SKILL.md), [계획](../../memory-plan/SKILL.md), [실행](../SKILL.md)을 따른다.

## Cases

| ID | Input / Precondition | Operation Scope | Expected Output / State | Decision / Evidence | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| S01 | 대상 파일·변경 문구·완료 확인이 명확 | intake 등록 | 완결된 T 청사진; 질문·제품 구현 없음 | 명확한 요청+코드 근거; decisions 파일 형식상 강제 안 함 | 지침 walkthrough |
| S02 | 권한/API 의미 선택 미확정 | 중요한 분기 인터뷰 | 한 질문·2~3옵션·추천안; executable Task 확정 보류 | 추천안을 사용자 선택으로 기록하지 않음 | 지침 walkthrough |
| S03 | expected 동작은 명확, 버그 원인 불명 | 코드 조사·필요 재현 확인 | 원인을 코드에서 좁힘; 실제 누락 정보만 질문 | 원인 불명과 제품 결정 불명을 구분 | 지침 walkthrough |
| S04 | 기존 Plan과 같은 목표, 다른 T active | 해당 Phase append | 새 T pending, 기존 current·checkpoint Position 유지 | 목표·scope·Source 비교, 기존 번호 유지 | 지침 walkthrough |
| S05 | 독립 목표, 다른 Plan active | 새 Plan 등록 | new Plan pending, active 위치 유지 | 파일 일부 중복만으로 목표를 합치지 않음 | 지침 walkthrough |
| S06 | 사용자 우선 처리 지시 | 등록·전환 | old Task 재개 정보 저장 후 new pointer; 즉시 구현 없음 | old 상태 먼저 보존, 새 작업 deps 확인 | 지침 walkthrough |
| S07 | 같은 Source·scope의 미완료 T | 중복 등록 | existing T 재사용, 중복 ID·폴더 없음 | done 결과가 여전히 충족되면 기록 안내; 재발·새 수정은 과거 보존+새 T | 지침 walkthrough |
| S08 | review/test 해당 없음, 대체 AC 근거 충분 | 전체 실행·점검 | skipped 사유만 표, 빈 report 없음; 품질 판정 가능 | 생략과 실제 미완료를 구분 | 지침 walkthrough |
| S09 | 필수 test failed | 실패 기록 | commit·done·pointer advance 차단 | 실패를 skipped로 덮지 않음, 범위 안 수정/환경 원인 구분 | 지침 walkthrough |
| S10 | passed 뒤 covered 코드·계약 변경 | evidence 재평가 | 영향 evidence stale, 관련 단계만 재검증 | Revision·파일 snapshot 비교, 동일 내용 HEAD 변경만으로 무효화 안 함 | 지침 walkthrough |
| S11 | review/test/commit-check만 요청 | 지정 stage | 전체 workflow·commit·전진 자동 실행 없음 | review 제품 수정 없음; 단독 test에서 새 테스트 추가 시 review stale·재리뷰 대상만 기록; check staging도 없음 | 지침 walkthrough |
| S12 | prepared intent 후 commit command 실패 | 실제 실패 처리 | intent failed, Task 미완료, 현재 pointer 유지 | 실패를 성공으로 미리 기록하지 않음 | 지침 walkthrough; 실제 실패 주입은 별도 안전한 임시 repo가 필요한 경우만 |
| S13 | commit 성공, checkpoint prepared | 성공 확인·복구 | 새 실행 전에 trailer+tree 확인, finalize만 복구 | staged mode/blob와 실제 tree 비교; working hash와 Git 정규화 구분 | 지침 walkthrough; 실제 commit evidence는 실제 도구 확인 |
| S14 | 특정 docs·앱 디렉터리 없음 | 프로젝트 탐색 | 실제 정본·manifest·suite 사용 | 예시 경로 부재만으로 blocker 생성 안 함 | 지침 walkthrough |
| S15 | unrelated staged 파일 또는 same-file WIP | 후보 선별 | 사용자 작업 보존, 안전한 분리 불가하면 blocker | 전체 index commit·임의 unstage·되돌리기 없음 | 지침 walkthrough |
| S16 | memory ignore, 과거 tracked current | 승인된 local 전환 | 내용 추가 없음, index D만 허용·local 파일 보존 | force-add 금지, 삭제 상태·로컬 존재 확인 | 실제 도구 확인 가능한 경계+walkthrough |
| S17 | 마지막 T 완료, 다른 Plan pending | finalize | Plan/Phase done, Active Task·Stage 없음 | 다른 Plan 임의 시작 없음, Last Commit 보존 | 지침 walkthrough; 현재 Plan 실제 종료 확인 |
| S18 | 사용자 no-commit 지시 | 품질 판정·정책 준수 | 명시 skipped commit, Git commit 없음; Task mode에서 완료 가능 | stage-only/check_only는 자동 완료·전진 없음 | 지침 walkthrough |
| S19 | path/내부 이름 차이 또는 API·권한 의미 변경 | 청사진 조정 | 전자는 기록·필요 Revision 갱신, 후자는 실제 승인 확인 | 이미 확정한 결정 재질문 없음, 범위 확대 금지 | 지침 walkthrough |
| S20 | 일반 ignored·무매칭·부정 예외·escaped 느낌표·공백 경로 | 후보 ignore 검사 | 실제 적용 패턴으로 ignored/허용/오류 구분 | verbose exit 0만으로 차단하지 않음; NUL 4필드로 경로 대응; 허용과 scope 승인은 별개 | 임시 repo의 check-ignore와 ls-files 결과 비교 |
| S21 | ignored 부모 아래 자식 예외 또는 부모 제외 해제 | 후보 ignore 검사 | Git이 실제 반환한 부모/자식 패턴 적용 | ! 줄이 있다는 이유만으로 자식을 허용하지 않음 | 임시 repo 실제 명령 |
| S22 | 새 템플릿·Task 메시지 | trailer 검사 | 마지막 블록의 Plan/Phase/metadata Task ID 각각 1개 | 폴더명을 새 Task trailer에 사용하지 않음 | git interpret-trailers --parse |
| S23 | 과거 본문 중간 식별자·Task 폴더명, 동일 T 번호의 다른 Phase, 중복 키 | commit 복구 후보 식별 | 정확한 Plan/Phase/폴더→metadata 대응만 허용, 충돌은 차단 | 실제 tree·staged entry 비교를 생략하지 않으며 과거 commit/done 문서 보존 | 실제 과거 메시지 확인 + 지침 walkthrough |
| S24 | 새 테스트로 이전 review가 영향받음 | 전체 Task 또는 단독 test | 전체는 실제 재리뷰 후 snapshot 갱신; 단독은 review stale와 Next Action | test passed와 review stale를 별도 기록; 단독 요청의 active Position 보존 | 두 모드 지침 walkthrough |
| S25 | SKILL.md 필수 필드 누락·중복·빈값·타입/이름 오류 또는 정상 scalar/block | 로컬 frontmatter 검사 | 정상 지원 표현 통과; 잘못된 필드 file/line 오류; nested metadata는 top-level로 오인하지 않음 | 필수 문자열/폴더 이름만 확인하며 전체 YAML parser로 주장하지 않음 | 실패/정상 회귀 fixture와 CLI exit 0/1 확인 |
| S26 | 한 HTML fence의 ID 중복 또는 comments/rawtext/quoted attr/entity/별도 fence | 로컬 HTML ID 검사 | 중복 속성 위치와 최초 행; 지원 범위 밖 named entity는 비교 제외 정보 진단 | fence별 token/ID 검사와 실제 DOM/rendering을 구분; 원문 수정 없음 | 실패/정상 회귀 fixture와 실제 문서 검사 |
| S27 | 같은 입력·절차에서 버그 현상 관찰, 원인은 분리 확인 전 | 버그 intake | reproduced 및 실제 원인 근거 수준을 별도 기록 | 재현이 confirmed/test passed를 뜻하지 않음; 자료·주체·환경·시각 구분 | 지침 walkthrough |
| S28 | 코드에서 후보·path::symbol만 확인, 실행 재현 미시도 | 버그 intake/planning | code_only와 supported/hypothesis 등 실제 후보 수준·한계·다음 검증 | 미실행 성공/실패 로그를 쓰지 않고 수정 전/후 확인 경로 계획 | 지침 walkthrough |
| S29 | 환경·자료 또는 안전한 절차 부족, 기대 동작·scope·검증 경로는 명확 | 버그 intake/planning | unavailable 사유를 남기고 원인 확인을 첫 실행 단위로 등록 가능 | 한계 자체로 무조건 차단하지 않으며 실행 완료 검증 의무는 유지 | 지침 walkthrough |
| S30 | 실제 절차를 시도했으나 목표 현상 관찰 안 됨 | 버그 intake | not_reproduced와 실제 결과·환경·확신·추가 검증 기록 | 버그 없음/해결 완료로 단정하지 않음; 새 Task/current 정책 유지 | 지침 walkthrough |
| S31 | 버그의 기대 권한/동작 정책에 중요한 미결정 | intake → grill-me | 부족한 분기 한 질문과 2~3개 추천 포함 선택지; 실행 청사진 확정 보류 | 원인 조사 부족과 제품 결정 부족을 구분 | 지침 walkthrough |
| S32 | 기능·문서 Task 또는 과거 done Task | 조건부 형식 적용 확인 | nonbug에는 Bug Investigation 빈 표 없음; 과거 done 증거 불변 | Type/실제 scope로 판단, 소급 마이그레이션/Revision 일괄 증가 없음 | 지침 walkthrough |

## Review Delegation Cases

아래는 [Review Delegation](review.md#review-delegation) 계약의 수동 대조 사례다. 실제 위임 성공과 불가 경로의 walkthrough 결과를 보고에서 구분하며 운영 도구·설정을 훼손해 실패를 만들지 않는다.

| Case | 입력 | 확인할 결과와 경계 | 수준 |
| :--- | :--- | :--- | :--- |
| R01 | 적용 review, 허용 내부 위임 기능 있음 | Task/AC/Revision·경로/snapshot/diff 전달, 읽기 전용 결과 반환, 실행 담당만 보고·상태 기록; 기술 제한 수준 명시 | 실제 가능한 위임 + 지침 대조 |
| R02 | 기능 부재·상위 제한·호출 실패 또는 사용자 자체 리뷰 요청 | 전자는 원인·시도·알림 후 Self, 후자는 사용자 요청으로 미시도 구분; 독립 성공 주장·무한 재시도 없음 | 지침 walkthrough |
| R03 | 중단·미완료 반환, 일부 finding 확보 | 원인/부분 결과 보존·알림, Self로 부족 검토; finding은 triage/재리뷰/gate에서 유지 | 지침 walkthrough |
| R04 | Needs Changes/finding 또는 구현 근거 Blocked | 도구 불가로 취급하거나 자체 리뷰로 지우지 않음; 전체 Task만 승인 scope 수정, 완료 차단 유지 | 지침 walkthrough |
| R05 | 반환 후 대상 snapshot 변경 | 영향 결과 stale, 원 발견 보존·기본 위임 선택에 따른 실제 재리뷰; 새 snapshot 자동 passed 없음 | 지침 walkthrough |
| R06 | --stage review 또는 비활성 Task review | 기본 위임/불가 절차 동일, 실행 담당 보고·metadata만; 수정/commit/done/전진 없음, 기존 active 보존 | 지침 walkthrough |

## Validation Environment Cases

| Case | 입력 | 확인할 결과와 경계 | 수준 |
| :--- | :--- | :--- | :--- |
| E01 | 동일 Revision/source/관련 환경, HEAD만 변경 | 환경 비교 근거를 남겨 결과 재사용; 전체 retest 없음 | 지침 walkthrough |
| E02 | 해당 검사의 lockfile 또는 runner 설정 변경 | Relevant Files snapshot 비교 후 영향받은 검사만 stale/재수행 | 지침 walkthrough |
| E03 | 무관한 설정·파일 또는 PC 경로명/branch만 변경 | 실제 checkout/cwd·대상 내용 확인; 무관 변경만으로 stale 없음 | 지침 walkthrough |
| E04 | 관련 runtime/tool 버전 차이 | 버전 차이가 결과 의미에 주는 영향과 판단 근거 기록; 영향 있는 검사만 재검증 | 지침 walkthrough |
| E05 | 과거 Environment Evidence 없음 | 현재/기존 로그 보완과 한계 기록; 현재 값을 과거 값으로 추정하지 않음. 새 검증/대체 근거로 AC 충족 가능하면 진행, 필요한 동일성 미입증이 AC를 막으면 blocked | 지침 walkthrough |
| E06 | 단독 test/commit-check에서 선행 환경 근거 stale | 사유·대상·Next Action 기록; 선행 단계·제품 수정·commit/finalize 자동 실행 및 active Position 변경 없음 | 두 모드 지침 walkthrough |
| E07 | 비밀 설정 또는 버전 도구 부재 | 비밀 아닌 동작 요약·확인 불가 이유만 기록; env 전체/토큰 수집 및 자동 설치·업그레이드·설정 변경 없음 | 지침 walkthrough |
| E08 | 설정 파일이 Source Snapshot에 이미 포함 | Relevant Files에서 같은 snapshot 참조; 다른 hash 사본 관리 없음, missing/deleted는 사실대로 기록 | 지침 walkthrough |

## Investigation Task Blueprints

아래 네 가지는 가상 미니 청사진이며 실제 실행 결과·활성 Task가 아니다. 공통 규약의 단계 이름과 상태를 그대로 사용한다. 어떤 유형도 Type 문자열만으로 자동 통과하지 않는다.

| Blueprint | Goal / 사전 AC | 적용 단계와 생략 이유 | Commit Policy / 완료 경로 | 전체 실행과 단독 단계 |
| :--- | :--- | :--- | :--- | :--- |
| B01 분석 전용 | 지연 원인 후보·관련 코드 근거·확신·한계·다음 확인을 정리. 원인 확정/수정은 목표 아님 | reference 필수, review는 근거 정합성 확인에 필수. 제품 수정·검사 실행·가이드 영향 없어 implementation/test/design-guide-update/guide-update/refactor 생략. actionable finding 없으면 review-action 생략 | auto, 로컬 보고만이면 commit skipped. 커밋 대상·별도 점검 요청이 없어 commit-check 단계 생략 가능하나 Completion Check의 AC/품질/정책 판정은 수행 | Task 전체는 AC/품질 충족 후 done 가능; --stage reference는 분석 결과만 기록하고 done/전진 없음 |
| B02 기존 테스트 조사 | 지정 suite 실행, 실제 실패 분류·근거·한계·권고 정리. 필수 실행 로그와 분류 근거 확보 | test 필수. 이미 검토된 기존 suite를 읽기 실행하고 코드/테스트를 변경하지 않아 별도 review/review-action은 생략하며, 조사 산출물 정합성은 공통 품질 판정에서 확인. 충분한 사전 조사로 reference 생략; 수정/가이드 영향 없어 implementation/design-guide-update/guide-update/refactor 생략 | auto, 관측 실패 보존·조사 목적 달성 판정 후 공통 품질 확인. Task 변경 없으면 commit skipped; 별도 commit-check는 B01과 같은 이유로 생략 가능 | 전체는 사전 조사 AC 충족 시 done 가능. 같은 검사가 실패해도 통과 목표 Task라면 미완료. --stage test는 조사 성공 여부와 무관하게 자동 done 없음 |
| B03 테스트 코드 작성 | 누락 회귀를 검출하는 테스트 작성 및 지정 검증 통과 | implementation/review/test/commit-check/commit 필수. 조사·정본 근거 충분해 reference/design-guide-update 생략, 사용법 영향 없어 guide-update 생략, 별도 정리 없어 refactor 생략. review-action은 finding 있을 때 | auto, 테스트 코드 공유 변경을 검토·검증하고 커밋 성공 뒤 done. 실패는 조사 완료로 전환 불가 | 전체는 완료 정책 처리까지; --stage test는 테스트 결과·필요 review stale 기록만, 커밋/전진 없음 |
| B04 명시 no-commit | 요청한 문서 수정과 링크 검증, 사용자가 커밋 금지 | implementation/review/test/commit-check 필수. 기존 계약 내 수정이라 design-guide-update 생략, 별도 조사/가이드 동기화/리팩터 불필요하여 reference/guide-update/refactor 생략. finding 없으면 review-action 생략 | none, 품질 충족과 사용자 지시·미커밋 변경 기록, commit skipped. 빈 commit.md 생성 없음 | 전체는 사유 있는 정책 완료 뒤 done 가능; --stage commit-check는 ready라도 done/전진 없음 |

각 사례는 실제 적용 이유가 있을 때만 사용한다. 특히 B02의 review 생략은 새 테스트/제품 변경 없는 기존 suite 조사에 한정한다. 필수 선행 evidence가 부족한 실행을 예외로 통과시키는 뜻이 아니다.

## Completion Cases

| Case | 입력 / 대조 | 기대 판정·보존 경계 | 수준 |
| :--- | :--- | :--- | :--- |
| C01 | 원인 후보 조사 vs 원인 확정 목표, 후보만 확보 | 전자는 근거·한계 AC로 평가, 후자는 확정 미충족이면 완료 불가 | 지침 walkthrough |
| C02 | 사전 테스트 조사 목표 충족, 대상 검사 exit 1 | Observed Result는 Fail/exit 1 보존, Objective Assessment는 조사 AC 충족; workflow passed가 검사 통과 아님 | 지침 walkthrough |
| C03 | 같은 exit 1이나 목표가 검사 통과 | test 실패 및 AC 미충족으로 완료 불가 | 지침 walkthrough |
| C04 | 도구/환경 실패로 필수 로그·근거 없음 | 사유·영향·다음 행동, 필수 AC 미충족을 조사 완료로 포장 금지 | 지침 walkthrough |
| C05 | auto, Task는 로컬 조사 보고뿐, unrelated staged 존재 | Task 후보 기준 변경 없음, commit skipped·공통 판정 후 전체 완료 가능. index 보존·전체 commit 금지 | 지침 walkthrough; 실제 사용자 index 조작 없음 |
| C06 | 테스트 코드 작성 공유 변경 있음 | auto 일반 검증·리뷰·성공 commit 필요 | 지침 walkthrough |
| C07 | none, 품질 충족한 미커밋 변경 | 사용자 지시·남은 변경 기록 후 전체 완료 가능 | 지침 walkthrough |
| C08 | --stage test 또는 check_only에서 목적 달성 | stage-only/check_only는 ready/결과만 기록, 자동 done/포인터 전진 없음 | 지침 walkthrough |
| C09 | 실패 후 목표를 조사로 완화 또는 후속 Task로 이전 | 승인/Revision/재검증 없이 실패 gate 우회 금지. 기존 실패 보존 | 지침 walkthrough |
| C10 | old done·prepared intent·환경 변경 뒤 재개 | 과거 계약 불변, 성공 tree 확인 복구 및 영향 증거 최신성 규칙 유지 | 지침 walkthrough |

## Expected State

표의 expected는 시험할 계약이며 실행 결과가 아니다. case별 실제 관찰·근거·확인 수준을 Task report에 기록한다. 상태/증거/완료의 상세는 [공통 규약](conventions.md#rule-ownership), 비활성 대상·단독 단계의 Position 보존은 [Stage Isolation](conventions.md#stage-isolation)을 대조한다. skipped/passed/failed를 근거 없이 바꾸거나 ready를 done으로 해석하지 않는다.

## Verification Level

E01~E08은 환경 변화에 대한 문서 판단 경계다. 실제 runtime 변경 실험이나 모델 실행 성공을 뜻하지 않는다. 수행 보고에는 case별 관찰과 관련 Environment Evidence를 기록한다.
이 저장소 root의 `node scripts/validate-skills.mjs`는 회귀 fixture와 공유 Markdown의 필수 스킬 frontmatter·파일/제목 anchor·Task 메시지·HTML fence ID·완성형 예제 구문·메모리 예제 구조, 임시 저장소의 Git 사례를 실행한다. S20~S22는 실제 Git 명령으로, S23의 표준/과거 식별·다른 Phase/slug·중복 키 및 S25/S26의 검출/오탐 경계는 fixture로 확인한다. S23의 실제 commit tree 복구와 S11/S24의 에이전트 상태 전이는 수동 walkthrough 또는 실제 실행 증거가 필요하다.

외부 URL·placeholder·지원 밖 anchor·명시 코드 fragment·외부/데이터 script는 출력에 제외 사유를 남긴다. 지원 Markdown anchor는 실제 제목과 비교하고, 메모리 형식 검사는 examples에만 적용한다. module inline script는 Node의 구문 검사로 지원한다. 검사 성공을 실제 모델/브라우저/제품 테스트 성공으로 표현하지 않는다. 검증기의 회귀 검사만은 `node --test tests/validate-skills.test.mjs`로 실행한다.

| Level | What It Establishes |
| :--- | :--- |
| Static scalar/link/message/HTML ID/example check | 지원하는 필수 문자열·스킬 이름·파일/제목 링크·메시지·fence 내 ID·JS 구문·교육용 메모리 형식의 정합성 |
| Git status/ignore/index/tree check | 실제 local 정책·후보·commit 내용과 기록 일치 |
| Manual walkthrough | 입력·상태·요청 범위에 대한 지침의 일관성과 판단 경계 |
| Actual model/product execution | 실제로 수행한 경우에만 해당 입력·환경·관찰·한계를 별도로 기록 |

완료 조건을 입증하는 최소 관련 검증을 사용한다. 변경이 없는 case를 단계가 바뀌었다는 이유로 반복하지 않는다. 새 변경·실패·미해결 위험이 있는 부분만 재검토한다.

## Plugin Package Cases

이 저장소의 개발용 `node scripts/build-plugin.mjs`와 `tests/build-plugin.test.mjs`로 확인한다. 생성 package는 개발 검증기·CodeBurn·사용자 `.memory`를 포함하지 않으며 설치/실제 호출은 별도 host 검증이다. 런타임 문서의 root 발견은 [Skill Installation and Workspace](project-profile.md#skill-installation-and-workspace)를 따른다.

| Case | 입력 | 확인할 결과 / 경계 | 수준 |
| :--- | :--- | :--- | :--- |
| K01 | 단일 metadata와 6개 스킬/명시 sourceFiles | 세 manifest identity/version 일치, 본문 bytes/hash 보존, 같은 입력의 재생성 동일 | 생성기 회귀 |
| K02 | CodeBurn/기록/개인 파일 또는 scope·sourceFiles 변조 | 목록 밖 파일 제외, 누락·중복·탈출 입력 실패 | 생성기 회귀 |
| K03 | 깨진 링크/anchor 또는 package 밖·파일URI 참조 | 실패하고 이전 생성물 보존, runtime 예시와 실제 문서 참조 구분 | 생성기 회귀 |
| K04 | source/root/임의 출력 경로·junction/symlink | 쓰기·따라가기 거부, 대상 sentinel 보존 | 생성기 회귀; 실제 OS의 생성 권한/대체 확인 수준 기록 |
| K05 | 기존 출력에 알 수 없는 파일/빈폴더/수동 수정 | 덮어쓰기·삭제하지 않고 실패. 소유 표식/실제내용 일치만 교체·cleanup | 생성기 회귀 |
| K06 | module import 또는 잘못된 CLI 입력 | import 부수효과 없음, CLI 성공0/실패1 | 생성기 회귀 |
| K07 | plugin cache에서 스킬을 읽고 사용자 프로젝트 작업 | cache 읽기만, 실제 userroot의 .memory/정본/Git 사용. 미확인은 질문 | 지침 대조; 실제 host 검증과 구분 |
| K08 | 생성·static manifest 통과, host 발견/호출 미시도 | static 성공만 기록, 지원표면/최소버전·설치성공 추정 없음 | 공식 manifest/CLI 정적 확인 + 지침 대조 |

## Planning and Review Boundaries

[Planning Boundaries](conventions.md#planning-boundaries)의 의미를 사람이 대조하는 사례다. 형식 회귀나 실제 모델 실행과 구분한다.

| Case | 입력 | 확인할 결과 / 경계 | 수준 |
| :--- | :--- | :--- | :--- |
| P01 | Product DTO의 필수 name을 optional로 바꾸거나 SKU 중복 409를 400으로 변경 | 공유 타입/오류 계약 변경이므로 중요한 선택 확인과 승인된 정본 선반영 필요. 내부 재량으로 처리하지 않음 | 수동 의미 대조 |
| P02 | 같은 DTO·오류·트랜잭션·반환을 유지하며 private 검증 helper 이름/분할이나 동등한 탐색 알고리즘 변경 | 계약에 필수로 고정한 선택이 아니면 실행 재량. helper 존재나 계획과 이름이 다르다는 사실만으로 finding을 만들지 않음 | 수동 의미 대조 |
| P03 | 기존 ProductService로 처리 가능한데 한 번 위임하는 파일과 미래용 registry를 승인 근거 없이 추가 | 소유 위치를 나눌 필요와 이점 없이 호출 경로·수정 지점만 늘리는 구체 비용을 지적. Task 재사용 제약을 어겼다면 구현 문제 | 수동 의미 대조 |
| P04 | 승인 계획 자체가 같은 미래용 registry를 요구하며 구현이 그대로 따름 | 계획의 과설계 문제와 구현 준수 사실을 구분해 보고. 계획 문제만으로 승인 구조를 자동 재설계하지 않고 필요한 결정으로 연결 | 수동 의미 대조 |
| P05 | 현재 템플릿/교육 Task에서 Constraints 또는 Must / Must Not을 삭제하거나 목록을 비움 | 기존 validator의 해당 형식 진단 실패. 유효한 작업별 목록 또는 없음과 이유는 허용 | 격리 fixture 회귀 |

## Limitations

frontmatter 검사는 한 줄 plain/quoted 필수 문자열과 description block만 지원한다. 전체 YAML/metadata 해석은 하지 않는다. HTML ID는 fence마다 태그 속성을 비교하며 numeric/common named reference만 정규화한다. 지원하지 않는 named reference는 해당 ID 비교를 제외하고 이유를 표시한다. 실제 DOM 트리/namespace/동적 ID, 전체 entity 표·HTML 문법·접근성·렌더링은 별도 확인 대상이다. 정확한 scalar/anchor/예제 구조 지원 범위는 패키지 내부 문서인 [validation-scope.md](validation-scope.md)에 기록한다.

이 저장소에는 상품 API 앱·테스트 harness와 자동 workflow 실행 엔진이 없다. 문서 예시·case 표·수동 검토를 앱 테스트나 모델 forward-run 성공으로 표현하지 않는다.

실제 active current를 fake 시나리오 pointer로 덮어쓰거나 운영 저장소의 hook·config를 바꿔 실패를 주입하지 않는다. 필요한 Git 실험은 승인된 범위의 별도 임시 저장소에서 수행하고, 수행하지 않은 결과는 보고하지 않는다. 외부 서비스·메시지·push를 검증의 부수 효과로 실행하지 않는다.
