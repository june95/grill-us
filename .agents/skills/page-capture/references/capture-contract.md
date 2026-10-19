# Capture Contract

[page-capture](../SKILL.md)의 산출·실패·권한 경계를 소유한다. 호스트별 API와 파일 도구는 현재 제공된 문서로 확인하며 이 문서는 특정 browser adapter나 실행 코드를 번들하지 않는다.

## Capability

- 실제 navigation/interaction/screenshot 도구와 대상 탭, 실제 viewport를 확인할 수단, 파일 저장·열람 수단을 확인한다. 기존 PNG를 읽는 도구만 있다고 새 화면을 촬영할 수 있는 것은 아니다.
- 사용자가 지정한 브라우저/탭과 호스트 선택 규칙이 우선이다. 소유 시험 탭과 기존 사용자 탭을 구분하고 무관한 화면·이력·개인 설정·설치 cache를 탐색하지 않는다.
- screenshot의 실제 반환 포맷과 PNG 저장 수단을 확인한다. native PNG 또는 이미 제공된 인코더로 변환한 PNG를 허용한다. JPEG→PNG는 JPEG 압축을 되돌리지 않으며 변환 사실을 limitations에 남긴다. PNG 저장 수단이 없으면 미완료다. 새 모듈·runtime·MCP를 설치하거나 screenshot을 HTML 재렌더/생성 이미지로 대체하지 않는다.
- 현재 viewport/최종 URL/실제 조작 결과를 확인할 수 없으면 추정값으로 완전한 metadata를 만들지 않는다. 가능한 부분과 미확인을 구분한다. 도구/version이 노출되지 않으면 version을 생략한다.

## Output

기본 산출은 `name.png`와 `name.json`이다. 이름은 안전한 짧은 label·시각·충돌 없는 suffix 등으로 만들고 URL query·입력값·비밀을 파일명에 넣지 않는다. 별도 지정이 없으면 확인한 사용자 project root의 `.memory/captures/`에 쓴다. 공유용 `docs/`나 프로젝트 밖 위치는 사용자가 지정한 경우에만 쓴다.

1. 경로를 절대 경로로 해석하고 기존 component/실제 경계를 확인한다. plugin 설치·source/cache 내부와 그곳을 가리키는 alias/junction에는 쓰지 않는다. 쓰기 경계를 확인하지 못하면 중단한다.
2. PNG와 JSON 모두 기존 파일 유무를 확인한다. 기본 이름이 충돌하면 새 이름을 선택하고, 명시한 경로가 충돌하면 기존 파일을 보존하며 다른 경로를 안내한다. 현재 요청이 명시적으로 허용한 덮어쓰기만 그 범위에서 처리한다.
3. 제공된 파일 도구에 create-new/exclusive 옵션이 있으면 사용한다. 사전 존재 확인만으로 경쟁 상태까지 안전하다고 주장하지 않는다. PNG와 JSON의 두 저장을 단일 원자적 트랜잭션으로 표현하지 않는다.
4. 실제 이미지 bytes를 PNG로 저장하고 파일 서명/포맷·읽기 가능 여부를 확인한다. PNG를 열어 시각 확인한 뒤 실제 metadata를 저장한다. 인코딩이 필요하면 기존 도구만 쓰고 임시 파일은 소유 경로에 둔다. 무관한 사용자 파일을 정리하지 않는다.
5. JSON만 쓰고 없는 PNG를 완성 산출로 링크하지 않는다. PNG만 저장되고 metadata/시각 확인이 실패하면 경로와 실패를 남기고 부분 결과로 보고한다. 실패 흔적을 지우려고 기존 파일을 덮거나 삭제하지 않는다.

사용자가 PNG만 요청하는 등 명시 산출을 바꾸면 그 범위를 우선하며 생략한 metadata를 작성했다고 하지 않는다. 직접 실행으로 `.memory/current.md` 등 workflow 상태를 만들지 않는다.

## Sidecar

아래는 기본 성공 산출의 필수 필드다. 값은 실제 관측값이며 schema 검사가 화면·상태의 정확성을 자동 입증하지 않는다.

| Field | Type / 의미 |
| :--- | :--- |
| capturedAt | ISO8601 string. 실제 캡처 호출 시각이며 예정 시각이 아님 |
| inputUrl / finalUrl | 민감정보를 제거한 실제 요청/최종 URL string. 아래 Sensitive Data 적용 |
| viewport | `{width,height}`. 실제 양의 정수 CSS viewport. 요청값이나 PNG pixel 크기를 무조건 대입하지 않음 |
| fullPage | boolean. 실제로 사용·확인한 캡처 범위. viewport 캡처면 false |
| actions | `{type,target?,completed}[]`. type/안전한 target string과 completed boolean. fill value·credentials·비밀 제외 |
| readiness | `{condition,result}` string. 실제 준비 조건과 `met` 등 관측 결과. 미확인을 충족으로 바꾸지 않음 |
| tool | `{name,version?}` string. 실제 사용 도구명, 노출된 버전만 기록. 변환 도구가 있으면 함께 설명 |
| screenshotPath | 실제 저장 PNG의 파일 경로 string |
| limitations | string[]. 변환·범위·미검증·민감정보·도구 한계 등 실제 제한. 없으면 빈 배열 |

viewport와 이미지 pixel 크기가 다른 경우 DPR/도구의 축소 여부 중 확인한 사실만 설명한다. 전체 페이지 캡처를 지원하지 않는 도구에서 fullPage=true를 기록하지 않는다. 화면 검증 finding은 사실·영향·한계를 별도로 설명하고 metadata를 테스트 통과 판정으로 사용하지 않는다.

다음은 형식 설명용 가상 예제이며 실제 캡처 근거가 아니다.

```json
{
  "capturedAt": "2026-10-19T00:00:00.000Z",
  "inputUrl": "http://localhost:3000/capture",
  "finalUrl": "http://localhost:3000/capture",
  "viewport": {"width": 1280, "height": 720},
  "fullPage": false,
  "actions": [{"type": "click", "target": "상세 보기", "completed": true}],
  "readiness": {"condition": "주문 상세 모달 표시", "result": "met"},
  "tool": {"name": "현재 호스트의 문서화된 browser 도구"},
  "screenshotPath": "project/.memory/captures/example.png",
  "limitations": ["viewport 범위만 촬영한 가상 예제"]
}
```

## Sensitive Data

- URL의 userinfo/credentials와 query·fragment의 token·개인정보를 저장하지 않는다. 기본은 query/fragment 생략이며 필요한 비밀 아닌 값만 확인해 남긴다. path에도 민감 값이 있으면 정제하고, 판단 불가 시 origin 등 안전한 최소 범위와 한계를 남긴다. 보존한 URL이 정제된 값임을 구분한다.
- actions는 동작 종류·안전한 target·실행 여부만 남긴다. 입력값은 기본 생략하며 selector/target 자체에 비밀이 있으면 target도 생략하거나 안전한 label로 바꾼다. 원문 URL·fills를 별도 sidecar 필드나 오류 로그에 복사하지 않는다.
- 이미지에는 metadata 정제로 사라지지 않는 화면 정보가 있다. 비밀번호 마스킹 등 실제 표시를 확인한다. 민감정보가 보이고 안전한 처리·권한이 없으면 공유 가능한 성공 결과로 내놓지 않는다. 승인 범위 밖의 마스킹·DOM 변경·새 이미지 편집 도구를 가정하지 않는다.
- 로그인·인증 자동화를 하지 않는다. 필요한 권한/세션은 사용자 준비로 연결한다. 캡처를 위해 전송·결제·삭제·권한 변경을 자동 수행하지 않는다. 소유 시험 화면에서는 명시된 합성 값만 사용한다.

## Failures

| 관측 | 보고와 재개 조건 |
| :--- | :--- |
| browser/조작/screenshot capability 없음 | 미완료. 필요한 기능과 준비를 설명하며 설치·다른 runtime 생성을 하지 않음 |
| PNG 저장·변환 도구 없음 | JPEG를 PNG로 위장하지 않음. 실제 포맷과 부족한 저장 수단 안내 |
| 준비 timeout / 조작 실패 | 조건·실패한 단계·미확인 상태를 구분. 임의 대기나 다른 화면을 요청 상태로 세지 않음 |
| PNG 저장 실패 | 실제 오류와 생성된 부분만 설명. 없는 PNG나 JSON-only를 완성 결과로 보고하지 않음 |
| metadata 저장 / 이미지 열람·시각 확인 실패 | PNG가 있어도 부분 결과. 실제 파일과 미확인 범위·다음 확인을 남김 |
| 경로·기존 파일 충돌·권한 불명확 | 기존 자료를 보존하며 안전한 경로/재개 조건 안내 |
| 화면/metadata 불일치 또는 민감정보 미처리 | 공유 가능한 성공으로 포장하지 않으며 실제 관측 finding과 노출 한계 구분 |

실패 보고의 시각을 capturedAt으로 꾸며 완전한 sidecar를 만들지 않는다. 이미지가 없는 실패에는 캡처 성공 schema를 채우지 않고 채팅 또는 실행 담당의 해당 단계 evidence로 실제 실패를 남긴다.
