# 정보 손실 없이 기록하기

아래 입력·결과·로그·경로·ID는 작성 방법을 비교하기 위한 **합성 자료**다. 실제 프로젝트에서 명령을 실행하거나 Task를 완료한 근거가 아니다. 기존 상품 API 예제와 과거 완료 기록은 변경하지 않는다. 상세 기준은 [Reporting](../.agents/skills/memory-execute/references/conventions.md#reporting)에 있다.

## 합성 원문

- 대상은 `2026-10-19-import-retry / P01-import / P01-T01`이다. 현재 단계는 test이며 Task는 in_progress다.
- `src/imports/order loader.mjs::loadOrder`는 외부 전송에서 `ETIMEDOUT`이 발생할 때만 최초 요청 뒤 최대 2회 재시도한다. 대기는 순서대로 200 ms, 400 ms다. HTTP 400은 재시도하지 않는다. 응답 형식과 저장 schema는 변경하지 않는다.
- 담당 실행자가 제공한 합성 로그에는 cwd `C:/work/order import`에서 `node --test "tests/order retry.test.mjs"`가 exit 1로 끝났고, 5개 중 4개 통과·1개 실패했다고 적혀 있다. 실패 항목은 `HTTP 400 does not retry`다. 왜 재시도했는지는 이 로그로 확인하지 못했다.
- `node --test "tests/order live.test.mjs"`는 staging 서비스 접근 권한이 없어 실행하지 않았다. 현재 정적 코드 확인만으로 이 검사를 통과했다고 할 수 없다.
- 다음 행동은 HTTP 400 분기와 호출부를 확인하는 것이다. staging 접근 권한이 확인된 뒤에만 live 검사를 실행한다. push나 데이터 migration은 요청하지 않았다.

## 의미가 사라진 작성

> API수정/테스트완료. 네트워크문제해결. 다음배포.

이 문장은 띄어쓰기를 없앴고, 실패·미실행·재시도 조건·한계를 지웠다. 확인하지 않은 원인과 배포 행동도 추가했다.

## 사실을 보존한 단계 보고 발췌

> **합성 자료 기준: 검사 실패, Task 진행 중.** `P01-T01`의 test 단계다. `loadOrder`는 `ETIMEDOUT`에만 최초 요청 뒤 최대 2회 재시도하며 200 ms, 400 ms 순서로 기다린다. HTTP 400은 재시도하지 않고 응답 형식·저장 schema는 유지한다. 대상 파일은 `src/imports/order loader.mjs`다.
>
> 제공된 합성 로그에서 cwd `C:/work/order import`의 `node --test "tests/order retry.test.mjs"`는 exit 1이었다. 5개 중 4개 통과했고 `HTTP 400 does not retry` 1개가 실패했다. 원인은 미확인이다. 직접 실행한 결과로 표현하지 않는다.
>
> `node --test "tests/order live.test.mjs"`는 staging 접근 권한이 없어 미실행이다. 정적 확인으로 통과를 대신하지 않는다. 먼저 HTTP 400 분기와 호출부를 확인하고, 권한이 확인된 뒤 live 검사를 실행한다. push·데이터 migration은 수행하지 않는다. 전체 식별자는 `2026-10-19-import-retry / P01-import / P01-T01`이다.

이 발췌는 작성 내용만 보여 준다. 실제 단계 보고의 Task·Revision·snapshot·Checked At 등은 실제 근거가 있을 때 [Stage Report](../.agents/skills/memory-execute/references/templates.md#stage-report)로 작성한다. 합성 로그를 실제 관측이나 성공 근거로 등록하지 않는다.

## current에 둘 요약

> `P01-T01` / test 진행 중. retry 검사는 제공된 합성 로그에서 실패했고 live 검사는 권한 부족으로 미실행이다. 상세 조건·명령·출처는 위 단계 보고 발췌에 있다. 다음은 HTTP 400 분기·호출부 확인이며 live 검사는 staging 권한 확인 뒤 실행한다.

실제 current에서는 이 문서의 발췌 대신 해당 프로젝트의 실제 Task/보고에 링크한다. 같은 상세 로그와 계약을 다시 복사하거나 이 예시를 활성 포인터로 저장하지 않는다.

## 사실 대응표

표의 문구 유무만 세지 않고 원문과 보고의 의미를 직접 대조한다. current는 상세 보고와 함께 읽으며 상세 사실 전체를 반복하지 않는다.

| 원문에서 필요한 사실 | 보고에서 보존한 의미 | 잘못 줄였을 때의 영향 |
| :--- | :--- | :--- |
| 대상 ID·test·in_progress | 전체 식별자, test 단계, Task 진행 중 | 다른 작업이나 done으로 오인 |
| `ETIMEDOUT`에만, 최초 뒤 최대 2회 | 조건·상한·최초 요청과 재시도의 구분 | 모든 오류 재시도 또는 총 요청 수 혼동 |
| 200 ms → 400 ms | 숫자·단위·순서 유지 | 지연 동작 변경 |
| HTTP 400 재시도 금지, 응답/schema 유지 | 부정·변경 경계 유지 | 예외 및 범위 누락 |
| 정확한 파일·공백 경로·명령 인용부호 | path·cwd·인자가 보존됨 | 잘못된 파일/명령으로 재개 |
| 제공된 합성 로그, exit 1, 4/5, 실패명 | 출처·관측 수준·실패 수·항목 유지 | 직접 실행 또는 통과로 오인 |
| 원인 미확인, live 미실행/권한 부족 | 미확인과 미실행 이유 유지 | 근거 없는 원인·검증 성공 추가 |
| 분기/호출부 확인 후, 권한 확인 뒤 live | 행동 순서와 재개 조건 유지 | 즉시 live 실행 또는 배포로 확대 |
| push/migration 요청 없음 | 수행하지 않는 경계 유지 | 권한 밖 행동 추가 |

이 대응은 문서의 합성 예제에 대한 의미 대조다. 실제 모델 실행이나 모든 요약의 정확성, host prompt truncation 해결을 입증하지 않는다.
