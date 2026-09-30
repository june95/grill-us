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
| S11 | review/test/commit-check만 요청 | 지정 stage | 전체 workflow·commit·전진 자동 실행 없음 | review 제품 수정 없음; test 새 테스트 범위·재리뷰; check staging도 없음 | 지침 walkthrough |
| S12 | prepared intent 후 commit command 실패 | 실제 실패 처리 | intent failed, Task 미완료, 현재 pointer 유지 | 실패를 성공으로 미리 기록하지 않음 | 지침 walkthrough; 실제 실패 주입은 별도 안전한 임시 repo가 필요한 경우만 |
| S13 | commit 성공, checkpoint prepared | 성공 확인·복구 | 새 실행 전에 trailer+tree 확인, finalize만 복구 | staged mode/blob와 실제 tree 비교; working hash와 Git 정규화 구분 | 지침 walkthrough; 실제 commit evidence는 실제 도구 확인 |
| S14 | 특정 docs·앱 디렉터리 없음 | 프로젝트 탐색 | 실제 정본·manifest·suite 사용 | 예시 경로 부재만으로 blocker 생성 안 함 | 지침 walkthrough |
| S15 | unrelated staged 파일 또는 same-file WIP | 후보 선별 | 사용자 작업 보존, 안전한 분리 불가하면 blocker | 전체 index commit·임의 unstage·되돌리기 없음 | 지침 walkthrough |
| S16 | memory ignore, 과거 tracked current | 승인된 local 전환 | 내용 추가 없음, index D만 허용·local 파일 보존 | force-add 금지, 삭제 상태·로컬 존재 확인 | 실제 도구 확인 가능한 경계+walkthrough |
| S17 | 마지막 T 완료, 다른 Plan pending | finalize | Plan/Phase done, Active Task·Stage 없음 | 다른 Plan 임의 시작 없음, Last Commit 보존 | 지침 walkthrough; 현재 Plan 실제 종료 확인 |
| S18 | 사용자 no-commit 지시 | 품질 판정·정책 준수 | 명시 skipped commit, Git commit 없음; Task mode에서 완료 가능 | stage-only/check_only는 자동 완료·전진 없음 | 지침 walkthrough |
| S19 | path/내부 이름 차이 또는 API·권한 의미 변경 | 청사진 조정 | 전자는 기록·필요 Revision 갱신, 후자는 실제 승인 확인 | 이미 확정한 결정 재질문 없음, 범위 확대 금지 | 지침 walkthrough |

## Expected State

- 표의 expected는 시험할 계약이며 실제 실행 결과가 아니다. Task report에 case별 실제 관찰·근거·결과와 확인 수준을 기록한다.
- 상태 정본은 Task의 workflow·Completion Check다. current는 활성 위치, checkpoint는 복구 정보, Phase/Plan은 집계다.
- skipped에는 이유, passed에는 유효 증거, failed/blocked/stale에는 재개 행동이 필요하다.
- ready는 Git 실행 전 판정이다. 실제 성공 commit 또는 명시 완료 정책을 확인한 뒤 done과 pointer 전진을 기록한다.
- 단독 stage 요청에서 현재 활성 Task가 아닌 대상은 해당 결과만 갱신하고 active Position을 보존한다.

## Verification Level

| Level | What It Establishes |
| :--- | :--- |
| Static file/link/frontmatter check | 실제 파일·이름·링크·형식·범용 경로의 정합성 |
| Git status/ignore/index/tree check | 실제 local 정책·후보·commit 내용과 기록 일치 |
| Manual walkthrough | 입력·상태·요청 범위에 대한 지침의 일관성과 판단 경계 |
| Actual model/product execution | 실제로 수행한 경우에만 해당 입력·환경·관찰·한계를 별도로 기록 |

완료 조건을 입증하는 최소 관련 검증을 사용한다. 변경이 없는 case를 단계가 바뀌었다는 이유로 반복하지 않는다. 새 변경·실패·미해결 위험이 있는 부분만 재검토한다.

## Limitations

이 저장소에는 상품 API 앱·테스트 harness와 자동 workflow 실행 엔진이 없다. 문서 예시·case 표·수동 검토를 앱 테스트나 모델 forward-run 성공으로 표현하지 않는다.

실제 active current를 fake 시나리오 pointer로 덮어쓰거나 운영 저장소의 hook·config를 바꿔 실패를 주입하지 않는다. 필요한 Git 실험은 승인된 범위의 별도 임시 저장소에서 수행하고, 수행하지 않은 결과는 보고하지 않는다. 외부 서비스·메시지·push를 검증의 부수 효과로 실행하지 않는다.
