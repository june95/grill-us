# Memory Review Scenarios

[스킬](../SKILL.md)과 공통 [Review Roles](../../memory-execute/references/review.md#review-roles)/[Review Result](../../memory-execute/references/review.md#review-result)를 대조하는 의미 사례다. 실제 모델 실행 결과나 운영 current로 등록할 자료가 아니다.

| Case | 입력 | 확인할 결과 | 경계 / 한계 |
| :--- | :--- | :--- | :--- |
| R01 | 명시 Task의 현재 구현 | 승인 Goal/AC·Revision·공유 계약과 실제 코드/검증 근거 대조 | 독립 호출은 review.md·Task metadata를 쓰지 않음 |
| R02 | Phase의 T01~T03 검토 | Task별 범위·버전·finding·미검토를 구분, 검토한 항목만 종합 | Task 실행·done 집계·current 전환이나 요청 밖 aggregate gate 없음 |
| R03 | 계획 없는 staged diff | 실제 staged 버전/경로를 식별해 정확성·회귀·복잡성·기존 검증 검토; 계획 준수 해당 없음 | working 파일을 staged 내용으로 오인하거나 Task/AC를 만들지 않음 |
| R04 | 명시 파일 목록, Git 없음 | 해당 bytes/SHA256과 필요한 호출부·타입/테스트를 읽기 검토 | Git/계획 생성 금지, 무관한 파일까지 확대하지 않음 |
| R05 | base/head commit 범위 | 실제 commit ID·변경 경로·해당 버전 내용을 검토 | 현재 working 코드로 과거 commit 판정을 대체하지 않음 |
| R06 | 검토 도중 Task Revision/working bytes 변경 | 기존 버전 결과·finding 보존, 바뀐 범위 미검토·필요 재검토 반환 | 현재 판정 불가능하면 Blocked, 새 snapshot 통과를 꾸미지 않음 |
| R07 | 보고/테스트 근거 없음 또는 파일 접근 실패 | 기존 결과 미확인·coverage 제한과 필수 근거 부족의 영향을 구분 | 직접 테스트/환경 설치로 보완하지 않고 필요한 검증을 권고 |
| R08 | 아래 알려진 결함 fixture | 잘못된 합계와 재현 조건·영향·최소 수정/검증 권고를 finding으로 반환 | 코드 수정·테스트 실행·후속 Task 등록 없음 |
| R09 | 계획이 미래용 registry를 요구, 구현은 그대로 준수 | 계획 자체 과설계와 구현 준수 사실을 구분해 구체 비용을 설명 | 승인 구조 자동 재설계·helper 취향 지적 없음 |
| R10 | memory-execute가 위임한 Task review | 같은 기준으로 한 번 검토하고 실행 담당에게 결과·snapshot 반환 | worker 추가 위임/기록 없음; 실행 담당만 기존 단계 보고 작성 |
| R11 | 직접 memory-review 호출, finding 없음 | 충분히 검토한 범위·한계와 공통 verdict를 채팅 반환 | 독립 호출만으로 workflow review passed·Task done으로 기록하지 않음 |
| R12 | 위임 도구 실패 후 execution의 Self | 실행 담당이 실제 실패/부분 결과 보존·사유 알림 후 같은 기준으로 검토/기록 | 별도 독립리뷰 성공으로 주장하거나 기존 finding을 지우지 않음 |
| R13 | staged/unstaged가 같은 경로,untracked 폴더와 rename이 함께 있음 | 공통 NUL 집계로 범주별 수/전체 합집합·이전 경로를 구분 | staged 대상 버전만 검토하며 집계만으로 untracked 내용까지 읽거나 stage하지 않음 |
| R14 | 현재 변경과 명시 Task의 후보가 일부 겹침 | 관련 경로·실제 diff/commit·귀속 불명확을 구분 | 경로 겹침만으로 작성자/의도·Task 미완료를 단정하지 않음 |
| R15 | 기존 PNG와 capture sidecar 검토 | 실제 이미지·capturedAt/viewport/actions/한계의 일치와 미확인 범위를 읽어 finding/권고 반환 | URL 재방문·브라우저 조작·재캡처·metadata 수정·Task/current/history 쓰기 없음. 이미지 존재를 제품/DB 성공으로 세지 않음 |

## Known Defect Fixture

가상의 계약은 단가 × 수량으로 합계를 구하는 것이다. 다음 코드는 단가 1000·수량 2에서 1002를 반환하여 기대 2000과 다르다. 이는 원문과 산술의 수동 대조이며 코드 실행 결과가 아니다.

~~~javascript
function lineTotal(unitPrice, quantity) {
  return unitPrice + quantity;
}
~~~

예상 finding은 합계 계산 위치와 단가/수량 조건, 금액 오류 영향, 곱셈으로 고칠 방향과 0·1·복수 수량의 검증 권고를 포함한다. severity/verdict는 [공통 기준](../../memory-execute/references/review.md#severity)과 요청한 실제 영향에 따라 판정하며, 이 fixture 자체를 제품의 실제 결함으로 보고하지 않는다.

## Walkthrough

사례의 입력·버전·관찰 근거·예상 반환·무쓰기 경계를 정본/스킬과 읽기 대조한다. 실제 Task/코드를 사용하는 구간은 명시한 대상·current/checkpoint·Git working/index의 전후 동일성을 확인하고, 구현 Task 담당자의 별도 기록 쓰기와 분리한다. 정적 링크/구문 검증, 수동 대조, 실제 모델 요청은 각각의 증거다. 원본/개인 cache·설정에 실패를 주입하거나 실제 모델 무쓰기를 문서 검토만으로 보장하지 않는다.
