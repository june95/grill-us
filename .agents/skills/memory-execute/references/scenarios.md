# Project Memory Validation Scenarios

변경한 workflow를 확인할 때만 읽는다. 기본 실행마다 이 문서 전체를 로드하지 않는다. 실제 규칙은 [공통 규약](conventions.md), [커밋 점검](commit-check.md), [재개](resume.md), [등록](../../memory-intake/SKILL.md), [계획](../../memory-plan/SKILL.md), [실행](../SKILL.md)을 따른다.

## Reuse Before Feature Planning

[Planning Boundaries](conventions.md#planning-boundaries)의 새 기능·화면 계획에 적용한다. 아래 정상/위반 쌍은 지침의 의미를 대조하는 walkthrough이며 실제 모델 행동 검증이나 자동 의미 검사를 뜻하지 않는다.

| Case | 입력 / 전제 | 정상 결과 | 위반 대조 |
| :--- | :--- | :--- | :--- |
| RE01 | 새 기능에 필요한 동작·계약을 만족하는 기존 함수와 호출부가 있음 | 관련 범위와 정의·호출부를 확인하고 후보 파일·심볼·사용처·재사용 이유를 남김 | 후보를 확인하지 않거나 적합한 후보를 무시하고 동일 기능을 신규 작성 |
| RE02 | 새 화면의 요구 일부를 기존 UI 컴포넌트 또는 동일 역할의 UI 조합(검색·필터·목록 등)이 담당하며 확장 가능 | 실제 화면의 사용 맥락을 확인하고 확장 부분·기존 호출자 보존 경계·영향을 기록 | 조합을 조사에서 누락하거나, 확장이라면서 기존 호출자의 동작 변화를 검토하지 않거나 요청 밖 공통화로 확대 |
| RE03 | 비슷하게 보이지만 책임·동작·공유 계약이 다른 UI 후보가 있음 | 후보와 실제 사용처의 차이를 근거로 신규 작성을 선택; 신규 작성 자체로 추가 승인 요구 없음 | 외형만 보고 공통화 강제, 또는 부적합 이유 없이 신규 작성 |
| RE04 | 관련 경로·개념을 성공적으로 탐색했지만 후보를 찾지 못함 | 탐색 범위·결과·한계를 기록하고 신규 작성; 후보·사용처를 꾸미지 않음 | 범위를 적지 않고 저장소 전체에 후보가 없다고 단정하거나 전체 저장소 조사를 강제 |
| RE05 | 검색 명령 실패·접근 불가·출력 잘림으로 필요한 근거 미확보 | 후보 없음과 구별하고 필요한 범위를 재확인; 중요한 계약 판단이 불가능하면 다음 확인을 남겨 청사진 확정 보류 | 실패를 후보 없음으로 바꾸거나 미확인 근거로 청사진 확정 |
| RE06 | 새 기능·화면이 아닌 문구 수정 또는 과거 완료 Task | 재사용 확인의 빈 항목을 강제하지 않고 기존 완료 기록 보존 | 모든 문서·버그 Task에 빈 재사용 표 추가 또는 과거 완료 기록 일괄 변환 |

## Cases

| ID | Input / Precondition | Operation Scope | Expected Output / State | Decision / Evidence | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| S01 | 대상 파일·변경 문구·완료 확인이 명확 | intake 등록 | 완결된 T 청사진; 질문·제품 구현 없음 | 명확한 요청+코드 근거; decisions 파일 형식상 강제 안 함 | 지침 walkthrough |
| S02 | 권한/API 의미 선택 미확정 | 중요한 분기 인터뷰 | 한 질문·2~3옵션·추천안; executable Task 확정 보류 | 추천안을 사용자 선택으로 기록하지 않음 | 지침 walkthrough |
| S03 | expected 동작은 명확, 버그 원인 불명 | 코드 조사·필요 재현 확인 | 원인을 코드에서 좁힘; 실제 누락 정보만 질문 | 원인 불명과 제품 결정 불명을 구분 | 지침 walkthrough |
| S04 | 기존 Plan과 같은 목표, 다른 T active | 해당 Phase append | 새 T pending, 기존 current와 활성 Task 유지 | 목표·scope·Source 비교, 기존 번호 유지 | 지침 walkthrough |
| S05 | 독립 목표, 다른 Plan active | 새 Plan 등록 | new Plan pending, active 위치 유지 | 파일 일부 중복만으로 목표를 합치지 않음 | 지침 walkthrough |
| S06 | 사용자 우선 처리 지시 | 등록·전환 | old Task 재개 정보 저장 후 new pointer; 즉시 구현 없음 | old 상태 먼저 보존, 새 작업 deps 확인 | 지침 walkthrough |
| S07 | 같은 Source·scope의 미완료 T | 중복 등록 | existing T 재사용, 중복 ID·폴더 없음 | done 결과가 여전히 충족되면 기록 안내; 재발·새 수정은 과거 보존+새 T | 지침 walkthrough |
| S08 | review/test 해당 없음, 대체 AC 근거 충분 | 전체 실행·점검 | skipped 사유만 표, 빈 report 없음; 품질 판정 가능 | 생략과 실제 미완료를 구분 | 지침 walkthrough |
| S09 | 필수 test failed | 실패 기록 | commit·done·pointer advance 차단 | 실패를 skipped로 덮지 않음, 범위 안 수정/환경 원인 구분 | 지침 walkthrough |
| S10 | passed 뒤 covered 코드·계약 변경 | evidence 재평가 | 영향 evidence stale, 관련 단계만 재검증 | Revision·파일 snapshot 비교, 동일 내용 HEAD 변경만으로 무효화 안 함 | 지침 walkthrough |
| S11 | review/test/commit-check만 요청 | 지정 stage | 전체 workflow·commit·전진 자동 실행 없음 | review 제품 수정 없음; 단독 test에서 새 테스트 추가 시 review stale·재리뷰 대상만 기록; check staging도 없음 | 지침 walkthrough |
| S12 | prepared intent 후 commit command 실패 | 실제 실패 처리 | intent failed, Task 미완료, 현재 pointer 유지 | 실패를 성공으로 미리 기록하지 않음 | 지침 walkthrough; 실제 실패 주입은 별도 안전한 임시 repo가 필요한 경우만 |
| S13 | commit 성공, task.md Commit Status prepared와 `work/commit-intent.json` prepared | 성공 확인·복구 | 새 실행 전에 trailer+tree 확인, finalize만 복구 | staged mode/blob와 실제 tree 비교; working hash와 Git 정규화 구분 | 지침 walkthrough; 실제 commit evidence는 실제 도구 확인 |
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
| S33 | current가 150줄을 넘고, 템플릿 밖 절에 완료 기록과 메모가 섞임 | 다음 상태 쓰기(current 압축) | 원문을 history에 먼저 보존 → 압축 기록(전후 줄 수·SHA256) → 원자적 교체 → 확인 기록. current는 템플릿 절만 | 기존 history·state 수정 없음, archive 없음, 위치·상태 변경 없음 | 지침 walkthrough |
| S34 | 보류 위치의 보류 사유·재개 조건이 current에만 있고 보류한 Task의 task.md에는 위치만 있음 | current 압축 3단계 | 보류 사유·재개 조건 원문을 history에 먼저 보존하고 Status 링크 줄에 그 기록도 연결. 보존을 확인하지 못하면 줄이지 않음 | 링크로 줄이는 내용도 원문 보존 대상 | 지침 walkthrough |
| S35 | 템플릿 밖 내용에 완료가 근거로 확인되지 않은 위치가 있음 | current 압축 2단계 | 완료 기록으로 옮기지 않고 보류 위치로 Status 링크, 확인할 일을 Next Step에 적음 | 미확인 위치를 완료로 분류하지 않음 | 지침 walkthrough |
| S36 | 압축 기록은 있고 교체 확인이 없음, current SHA256이 기록의 교체할 내용 값과 같음 | 다음 current 쓰기 전 확인 | 확인 기록만 덧붙임. 크기 조건보다 먼저 확인 | 교체 완료를 SHA256으로 확인 | 지침 walkthrough |
| S37 | 같은 상황에서 current SHA256이 교체할 내용 값과 다름 | 다음 current 쓰기 전 확인 | 교체 여부 확인 불가로 기록(현재 SHA256, 교체 전 값과 같은지). 완료나 미교체로 단정하지 않고 지금 current로 조건과 원문 보존부터 다시. 이미 추가한 원문은 다시 추가하지 않음 | 불확실한 결과를 완료나 미교체로 기록하지 않음 | 지침 walkthrough |
| S38 | 교체가 끝난 뒤 확인 기록 전에 중단됐고, 그 뒤 다른 상태 쓰기로 current가 바뀜 | 다음 current 쓰기 전 확인 | 해시가 달라 확인 불가로 기록하고 그 압축은 끝난 것으로 봄. current가 이미 조건 밖이면 압축하지 않음. 지난 압축 기록은 고치지 않음 | 확인 불가 기록이 같은 대조의 반복을 막음 | 지침 walkthrough |

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
| R07 | 위임 리뷰 2단계 입력 | 1단계에는 계약·diff·반증 증거만, 2단계에 구현 보고·검증 결과; 1단계 finding을 유지·조정으로 해소·계약 오독으로 분류하고 지우지 않음 | 지침 walkthrough |
| R08 | 고위험 Task, 기본·보안 리뷰어 병렬 중 보안 리뷰어만 실패 | 성공한 결과는 보존하고 보안 관점만 알림 후 Self로 보완; ID 접두·Review Mode를 리뷰어별 기록, 더 엄격한 verdict 적용 | 지침 walkthrough |
| R09 | 2단계에서 계약 오독으로 분류된 finding | Clarify contract로 계약 문구 보강 권고, 구현 수정 없음; 의미 변경이면 Revision·승인 절차 | 지침 walkthrough |

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
| C11 | 승인 없이 테스트를 skip한 diff가 후보에 있음 | 검사 약화 High로 commit-check blocked. task.md Scope/Constraints의 명시 승인이 있을 때만 허용 | 지침 walkthrough |
| C12 | secret 검사에 후보 문서가 걸렸고 해당 줄은 규칙 설명의 단어 언급 | 값 없이 파일·분류·판단 근거를 Completion Check에 남기고 진행. 후보 자동 제외·수정 없음 | 지침 walkthrough |
| C13 | secret 검사에 걸린 후보 줄이 실제 비밀 값 | commit하지 않고 blocked, 파일·줄 위치·분류만 알림. 보고·history에 값 없음. 이미 commit·push됐으면 rotate 우선 안내, history rewrite·force push 없음 | 지침 walkthrough |
| C14 | 버그 Task, 기존 테스트 수단으로 재현 가능 | 수정 전 실패 command·exit를 근거로 남기고, 수정 후 같은 테스트 통과와 회귀 확인. 재현 불가면 사유 기록 후 진행. reproduced만으로 confirmed 아님 | 지침 walkthrough |
| C15 | validator 규칙을 추가했고 검사 명령이 timeout으로 끝남 | 미실행은 통과 아님. 위반 fixture 실패와 정상 대조군 통과를 실제 실행으로 확인해야 AC 근거 | 지침 walkthrough; git 범주의 secret 명령 검사 |
| C16 | 완료 정리 때 OS 임시 소유 폴더 자리에 같은 이름·표시 형식의 다른 폴더가 있고 nonce가 단계 보고와 다름 | 소유가 아니므로 지우지 않고 경로와 이유를 보고. 완료는 막지 않음 | 지침 walkthrough |
| C17 | 지우는 도중 하위 폴더가 junction·심볼릭 링크로 바뀌어 있음 | 링크 항목만 제거하고 대상은 따라가지 않음. 예상과 다른 변화이므로 즉시 멈추고 남은 경로를 보고 | 지침 walkthrough |
| C18 | 쓰려는 삭제 도구가 링크를 따라가지 않는지 확인할 수 없음 | 자동 삭제하지 않고 남긴 경로와 이유를 정리 기록에 적음. 묻지 않고, 남은 항목은 prj-memory-tidy로 안내 | 지침 walkthrough |
| C19 | 단독 test 단계에서 OS 임시 소유 폴더를 만들어 씀 | 지우지 않고 경로·nonce를 보고에 남김. 전체 Task 완료 처리 때 정리 | 지침 walkthrough |
| C20 | 처음 확인 뒤 이름을 옮기기 전에 소유 폴더가 다른 폴더나 링크로 바뀜 | 옮긴 이름에서 다시 확인할 때 종류·nonce·식별자가 달라 지우지 않음. 원래 경로와 옮긴 경로를 보고. 완료는 막지 않음 | 지침 walkthrough |
| C21 | 옮긴 이름에서 확인을 마친 뒤 같은 사용자의 다른 프로세스가 하위 항목을 바꿈 | 보호 범위 밖의 받아들인 위험. 지우는 도중 드러난 변화는 즉시 멈추고 보고하며, 드러나지 않은 교체를 막았다고 보고하지 않음 | 지침 walkthrough |
| C22 | OS 임시 폴더가 다른 사용자도 쓸 수 있고 sticky bit가 없음 | 권한은 판정 조건이 아님. 소유 인정 조건과 이름 옮긴 뒤 재확인이 맞으면 묻지 않고 지움. 다른 사용자의 교체 가능성은 받아들인 위험 | 지침 walkthrough |
| C23 | sticky 공용 임시 폴더 아래 소유 폴더가 0700이 아니고 다른 사용자가 그 안에 쓸 수 있음 | 권한은 판정 조건이 아님. 소유·재확인이 맞으면 묻지 않고 지움. 권한을 바꾸지 않음 | 지침 walkthrough |
| C24 | 프로젝트 경로의 상위 폴더가 Authenticated Users에게 수정(삭제 포함) 권한을 물려줌 | 권한은 판정 조건이 아님. `work/`를 이름 옮기기·재확인·링크 미추적으로 묻지 않고 지움. 완료는 막지 않음 | 지침 walkthrough |
| C25 | 사용자별 TEMP 아래 기본 권한(사용자·SYSTEM·Administrators)으로 만든 소유 폴더, 하위 항목은 물려받은 권한뿐 | 대조 사례: C22와 같은 결과. 소유·재확인이 맞으면 묻지 않고 지움 | 지침 walkthrough |
| C26 | 이름을 옮긴 뒤 지우기 전에 중단됨. 같은 Task 폴더에 사용자가 만든 `work-backup`도 있음 | 정리 기록에 미리 적은 정확한 새 경로만 같은 조건(기록했다면 식별자도)으로 확인해 다룸. `work-backup`처럼 이름만 비슷한 폴더는 대상이 아님 | 지침 walkthrough |
| C27 | 원래 이름 뒤에 값이 붙은 폴더가 있으나 정리 기록에 옮기기 전 기록이 없음 | 대상을 추정하지 않고 지우지 않음. 남은 경로로 보고 | 지침 walkthrough |
| C28 | 다른 일반 사용자가 소유한 sticky(1777) 상위 폴더 아래, 현재 사용자 소유 0700 폴더 | 상위 폴더 소유자는 판정 조건이 아님. 소유·재확인이 맞으면 묻지 않고 지움. 그 소유자의 교체 가능성은 받아들인 위험 | 지침 walkthrough |
| C29 | root 소유 `/tmp`(1777) 아래 현재 사용자 소유 0700 소유 폴더 | 대조 사례: C28과 같은 결과. 소유·재확인이 맞으면 묻지 않고 지움 | 지침 walkthrough |
| C30 | 지울 폴더 안에 다른 일반 사용자가 소유한 하위 항목이 있음(POSIX에서 0700이 아닌 폴더, 또는 Windows에서 권한은 물려받음) | 하위 항목 소유자는 판정 조건이 아님. 링크를 따라가지 않고 지우며, 지우는 도중 종류·식별 값이 달라지면 즉시 멈추고 보고 | 지침 walkthrough |
| C31 | 0700이 아닌 `work/`(0755) 안에 그룹·다른 사용자 쓰기 권한이 있는 일반 파일(0666)이 있음. 대조: 하위 항목이 모두 현재 사용자 소유 0644·0755 | 권한은 판정 조건이 아님. 두 경우 모두 묻지 않고 지움 | 지침 walkthrough |
| C32 | 중단 복구 때 정리 기록 파일을 다른 일반 사용자가 바꿀 수 있음, 또는 기록의 새 경로가 같은 상위 폴더의 `work-backup`을 가리키고 `work/` 식별자가 없음 | 기록 파일의 권한은 판정 조건이 아님. 식별자가 없거나 옮긴 폴더와 다르면 지우지 않고 경로와 이유를 보고(묻지 않음). `work-backup`은 대상이 아님 | 지침 walkthrough |
| C33 | 대조: 원래 경로가 이 Task의 `work/`, 새 경로가 같은 상위 폴더, 기록한 식별자가 옮긴 폴더와 같음(기록 파일의 권한과 무관) | 재개한 완료 처리에서 묻지 않고 지움 | 지침 walkthrough |
| C34 | Task 폴더 바로 아래의 `snapshot.json`을 `review.md`가 링크함(인용됐지만 `evidence/` 밖) | 묻지 않고 지우고, 끊긴 링크(`review.md` → `snapshot.json`)를 정리 기록에 적음. `review.md` 본문은 고치지 않음 | 지침 walkthrough |
| C35 | `task.md` Workflow 표에 커스텀 단계 `deployment` 행이 있고 Evidence 열이 `deployment.md`를 링크함 | 기록 md라 남김 | 지침 walkthrough |
| C36 | Workflow 링크가 없는 `review-request.md`·`execution-checkpoint.md`가 Task 폴더 바로 아래에 있음 | 기록 md가 아니므로 묻지 않고 지움. 기록 md가 링크했다면 끊긴 링크로 기록 | 지침 walkthrough |
| C37 | `evidence/`에 `test.md`가 인용한 `summary.json`과, `evidence-hashes.json` 안에만 이름이 있는 `raw.json`이 있음 | `summary.json`은 남기고 `raw.json`은 지움. md가 아닌 색인 안의 이름은 인용이 아님 | 지침 walkthrough |
| C38 | 남아 있는 옛 Plan state의 Commit Intent(Previous Intent)가 `evidence/commit-intent.json`을 링크하고, Task 보고서는 링크하지 않음 | 옛 state가 인용하므로 남김 | 지침 walkthrough |
| C39 | 응답할 사용자가 없는 실행에서 Task를 완료함 | 같은 정리를 묻지 않고 수행하고 기록. 질문·승인 대기 없음 | 지침 walkthrough |
| C40 | 표시 파일의 project가 다른 프로젝트인 OS 임시 `prj-memory-*` 폴더 | 이 Task 소유가 아니므로 지우지 않고 보고만 함(묻지 않음) | 지침 walkthrough |
| C41 | 조사 Task가 240줄 로그의 측정 근거를 남김. 조건(requests=100)에 맞는 분이 9개이고, 실패한 검사의 오류 줄이 3줄 있음 | `.memory`에는 건수·지표·범위(예: 차단 205분, 최대 100건/분, requests=100인 분 9개·11:30~12:25)와 대표 표본 5줄 이하만 남김. 9분의 시각을 목록으로 나열하지 않고, 표나 목록으로 바꿔 옮긴 값도 표본으로 셈. 실패 판단에 필요한 오류 줄 3줄은 상한과 별도로 인용함 | 지침 walkthrough |
| C42 | 커밋은 성공했고 commit 보고를 쓰기 전에 세션이 끊김. task.md Commit Status prepared, `work/commit-intent.json` prepared | Git 대조(trailer·changed path·A/M/D·mode/blob·tree)를 통과하면 의도 파일에 committed와 SHA, commit 보고, task.md committed 순서로 기록하고 완료 정리에서 `work/`를 지움. 다시 커밋하지 않음 | 지침 walkthrough |
| C43 | `git commit`이 hook 오류로 실패함 | 의도 파일 `status: failed`와 `failure`, task.md failed를 기록. Task는 미완료이고 `work/`를 지우지 않으며 current를 전진하지 않음 | 지침 walkthrough |
| C44 | 진행 중인 옛 Plan의 `.memory/state/{plan-id}.md`에 Commit Intent prepared가 있고 Task에는 의도 파일이 없음 | state 내용으로 그 Task의 `work/commit-intent.json`을 만들고 task.md Commit Status를 prepared로 맞춘 뒤 Recovery를 따름. state 파일은 고치지 않고, 옮긴 사실과 출처 경로를 task.md·history에 남김 | 지침 walkthrough |
| C45 | 새 Plan을 등록하고 Task를 실행해 커밋까지 함 | `.memory/state/`에 새 파일이 생기지 않음. 재개 근거는 current·task.md·`work/commit-intent.json`뿐이고 완료 뒤 의도 파일은 남지 않음 | 지침 walkthrough; 행동 eval `newMemoryFiles` |
| C46 | 옛 current의 Status에 `Checkpoint: [state](./state/x.md)` 줄이 있고, 그 Plan에 보류한 Task가 있음 | 다음 상태 쓰기 때 Checkpoint 줄을 지우고 보류한 Task 링크 한 줄로 바꿈. 가리키던 state 파일은 남아 있으므로 원문 보존 대상이 아님 | 지침 walkthrough |
| C47 | 옛 state의 Commit Intent prepared(P01-T01)를 이관해 복구·완료했고 Plan은 진행 중. 다음에 P01-T02를 재개 | 같은 출처의 이관 기록이 T01 task.md·history에 있고 T01이 done이고 Commit Status committed라 해결된 의도로 보고 다시 옮기지 않음. T02에는 의도 파일을 만들지 않음 | 지침 walkthrough |
| C48 | 옛 state 이관 중 `work/commit-intent.json`만 만들고 task.md를 갱신하기 전에 끊김 | 재개 때 파일을 덮어쓰지 않음. 파일과 옛 의도의 Base HEAD·후보·메시지가 같으면 Commit Status·이관 기록만 맞추고, 다르면 blocked | 지침 walkthrough |
| C49 | 이관한 의도를 복구한 뒤 같은 Task에 새 커밋 의도가 생김(옛 state에는 옛 prepared가 그대로 남음) | 이관 기록이 있으므로 옛 의도를 다시 적용하지 않고 새 의도 파일을 덮어쓰지 않음 | 지침 walkthrough |
| C50 | commit 보고에 SHA·대조를 기록하고 Commit Status committed, 완료 정리로 `work/`(의도 파일 포함)를 지운 직후 끊김. Task는 아직 done이 아님 | 의도 파일 없이 commit 보고의 SHA·trailer를 Git에서 확인하고, 정리 중단 복구 뒤 done·집계·포인터만 복구. 다시 커밋하지 않음 | 지침 walkthrough |
| C51 | 진행 중인 옛 Plan의 state에 Commit Intent prepared가 있고, 그 Commit Intent Task는 done인데 task.md Commit Status가 prepared(기록 충돌) | 해결로 보지 않고 이관하지도 않음. blocked로 두고 차이를 기록함. tidy도 이 state를 정리 가능으로 보지 않음 | 지침 walkthrough |
| C52 | 진행 중인 옛 Plan의 state에 Commit Intent prepared가 있고, 그 Task는 done인데 과거 형식이라 Commit Status 필드가 없음. commit 보고에 SHA가 있고 trailer가 대상과 같으며, 그 보고에 성공 대조(changed path·mode/blob·tree) 기록이 있거나 옛 의도의 후보 snapshot으로 Recovery 내용 대조를 통과함 | committed로 보고 해결된 의도로 처리해 이관하지 않음. 확인 결과와 근거를 history에만 남기고 과거 task.md는 고치지 않음. 다음 Task 재개는 막지 않음 | 지침 walkthrough |
| C53 | C52와 같은데 다음 중 하나: commit 보고에 SHA가 없음, trailer가 다름, 내용 대조 근거가 없음(보고에 대조 기록이 없고 후보 snapshot도 없음), commit의 changed path나 mode/blob이 후보와 다름 | 해결로 보지 않고 blocked. trailer만으로 성공을 인정하지 않고 차이를 기록함 | 지침 walkthrough |
| C54 | Windows에서 작업 폴더가 필요하고 `[System.IO.Path]::GetTempPath()`가 사용자 임시 폴더(`…\AppData\Local\Temp\`)를 줌 | 그 바로 아래에 `prj-memory-{plan-id}-{task-id}-…` 소유 폴더를 만들고 경로·nonce를 단계 보고에 적음. `%SystemRoot%`로 위치를 조합하지 않음 | 지침 walkthrough |
| C55 | 사용자 임시 폴더를 얻지 못하거나 얻은 경로가 `%SystemRoot%\Temp`·`%SystemRoot%\SystemTemp`처럼 Windows 디렉터리 아래 | OS 임시 소유 폴더를 만들지 않음. 호스트 세션 scratch가 있으면 그곳, 없으면 작업 파일 없이 요약만 남기고 이유를 단계 보고에 적음. scratch가 현재 사용자 전용인지 보장할 수 없으면 리뷰 응답 원문 같은 비밀이 담길 수 있는 원본은 scratch에도 저장하지 않고 요약만 남김 | 지침 walkthrough |
| C56 | 완료 정리 때 이 Task 단계 보고에 적힌 소유 폴더가 `C:\Windows\Temp` 아래에 있음(이 규칙 전에 만든 폴더), 표시 파일·nonce는 맞음 | OS 임시 폴더 정의 밖이라 소유가 아님. 옮기거나 지우지 않고 경로·이유를 정리 기록에 적고 사용자가 직접 지우도록 안내함. 완료는 막지 않음 | 지침 walkthrough |
| C57 | 완료 정리 때 `work/`에 읽기 전용 파일이 있어 강제 옵션 없이 지워지지 않음 | 속성을 바꾸거나 `-Force`로 다시 지우지 않음. 그 파일과 `work/`(옮긴 이름)를 남기고 경로·이유(읽기 전용)를 정리 기록에 적음. 완료는 막지 않음 | 지침 walkthrough |
| C58 | 완료 정리 명령이 실행 환경에서 "blocked by policy"로 거절됨 | 다른 삭제 명령·도구나 권한 변경으로 다시 시도하지 않음. 거절 메시지 요약과 남은 경로를 정리 기록에 적고 남은 항목을 tidy로 안내함. 완료는 막지 않음 | 지침 walkthrough |
| C59 | 숨김 항목까지 세려고 이동·삭제 명령 안에 `Get-ChildItem -Force`를 넣으려 함 | 넣지 않음. 숨김 항목은 이동·삭제가 없는 별도 조회 명령으로 확인하고, 그 조회가 거절되거나 확인할 수 없으면 그 폴더를 지우지 않고 보고함 | 지침 walkthrough |
| C60 | Task 없는 활동(예: grill-me 인터뷰)이 끝날 때 자기 작업 폴더를 지우는 명령이 "blocked by policy"로 거절되고, 읽기 전용 파일도 하나 있음 | 다른 삭제 명령·도구, 강제 옵션, 속성·권한 변경으로 다시 시도하지 않음. 남긴 경로와 이유(거절 요약, 읽기 전용)를 그 활동의 history 기록이나 채팅 보고에 적음 | 지침 walkthrough |

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

## Standalone Review Integration

독립 [prj-memory-review](../../memory-review/SKILL.md)의 [사례](../../memory-review/references/scenarios.md)로 Task/Phase·일반파일/diff/commit·drift·알려진결함을 대조한다. 직접/worker 호출은 결과만 반환하고 execution 담당이 기존 review 단계의 보고·상태를 기록한다. 새스킬 추가로 중복 review·Phase완료gate를 만들지 않으며 기존 위임불가 알림후Self·finding보존·단독단계경계를 유지한다.

## Plugin Package Cases

이 저장소의 개발용 `node scripts/build-plugin.mjs`와 `tests/build-plugin.test.mjs`로 확인한다. 생성 package는 개발 검증기·CodeBurn·사용자 `.memory`를 포함하지 않으며 설치/실제 호출은 별도 host 검증이다. 런타임 문서의 root 발견은 [Skill Installation and Workspace](project-profile.md#skill-installation-and-workspace)를 따른다.

| Case | 입력 | 확인할 결과 / 경계 | 수준 |
| :--- | :--- | :--- | :--- |
| K01 | 단일 metadata와 7개 스킬/0.2.0/명시 sourceFiles | 세 manifest identity/version 일치, 본문 bytes/hash 보존, 같은 입력의 재생성 동일 | 생성기 회귀 |
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

## Bounded Exploration Cases

[공통 탐색](project-profile.md#bounded-exploration)의 의미 대조 사례이며 실제 모델 실행 성공을 뜻하지 않는다.

| Case | 입력 | 확인할 결과 / 경계 | 수준 |
| :--- | :--- | :--- | :--- |
| E01 | 파일/Related Files가 명확한 intake·plan | 해당 파일과 필요한 지침/호출부/검증 위치부터 확인,무관한 vendor·전체 source hash 탐색 없음 | 실제 tool trace로 범위 대조 |
| E02 | 기능 개념만 있고 정확한 심볼 위치는 모름 | 소유 모듈에서 후보를 좁히고 실제 정의/조건/호출 관계를 확인 | 후보 요약/검색 순위만으로 단정하지 않음 |
| E03 | 심볼/의미 도구 미제공 또는 rg 실행 파일 없음 | 이미 있는 호스트 검색·파일 읽기로 필요한 근거 확보,부재와 성공한 검색 없음 구분 | 새 도구 설치·전역 설정 변경 금지 |
| E04 | 일부 발췌/잘린 검색·파일 출력 | 부분 근거를 명시하고 관련 패턴/행을 다시 읽어 누락 확인 | 합성 발췌/실제 host 출력 잘림의 coverage를 구분 |
| E05 | 좁은 범위에서 근거를 찾지 못함 | 필요 이유를 남겨 관련 모듈/상위 범위로 확장,미확인도 보고 | 숨김/ignored·.git·무관 의존성 전체 확장 금지 |
| E06 | 기존 source snapshot/조사 근거가 있음 | 현재 핵심 정의·호출부와 필요한 사실만 대조하여 재사용 | intake/plan은제품구현없음,review/explain은기록쓰기없음 |

## Limitations

frontmatter 검사는 한 줄 plain/quoted 필수 문자열과 description block만 지원한다. 전체 YAML/metadata 해석은 하지 않는다. HTML ID는 fence마다 태그 속성을 비교하며 numeric/common named reference만 정규화한다. 지원하지 않는 named reference는 해당 ID 비교를 제외하고 이유를 표시한다. 실제 DOM 트리/namespace/동적 ID, 전체 entity 표·HTML 문법·접근성·렌더링은 별도 확인 대상이다. 정확한 scalar/anchor/예제 구조 지원 범위는 패키지 내부 문서인 [validation-scope.md](validation-scope.md)에 기록한다.

이 저장소에는 상품 API 앱·테스트 harness와 자동 workflow 실행 엔진이 없다. 문서 예시·case 표·수동 검토를 앱 테스트나 모델 forward-run 성공으로 표현하지 않는다.

실제 active current를 fake 시나리오 pointer로 덮어쓰거나 운영 저장소의 hook·config를 바꿔 실패를 주입하지 않는다. 필요한 Git 실험은 승인된 범위의 별도 임시 저장소에서 수행하고, 수행하지 않은 결과는 보고하지 않는다. 외부 서비스·메시지·push를 검증의 부수 효과로 실행하지 않는다.
