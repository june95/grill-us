# Page Capture Scenarios

[스킬](../SKILL.md)과 [계약](capture-contract.md)의 의미 대조 사례다. 정적 문서만으로 실제 PNG 저장·모델 행동·모든 호스트 지원을 주장하지 않는다.

| Case | 입력 / 상태 | 확인할 결과와 경계 |
| :--- | :--- | :--- |
| C01 | 소유 화면의 기본 캡처 | 현재 viewport와 실제 PNG/JSON, 파일 열람·시각 확인. 화면/DB 테스트 통과로 확대하지 않음 |
| C02 | 필요한 클릭 후 모달 상태 | 실제 표시 확인 뒤 촬영, actions에 안전한 target·completed만 기록 |
| C03 | 375×812 등 명시 크기 | 실제 적용 값 확인, fullPage 범위와 PNG pixel 차이 구분, 종료 시 임시 override reset |
| C04 | URL query·합성 password 입력 | 정제한 URL, fill value 없는 actions, 이미지에 실제 비밀이 보이지 않는지 확인 |
| C05 | PNG 또는 JSON 한쪽 이름 충돌 | 기존 파일 보존. 새 기본 이름 또는 명시 경로 변경 안내, 무단 overwrite 없음 |
| C06 | plugin/cache 경로 또는 경계 alias | 쓰기 전 경계 확인 후 거부. 기존 설치본·개인 설정·소스 변경 없음 |
| C07 | browser API 없는 CLI 세션 | 정직한 미완료/준비 안내. 도구·MCP 설치나 가짜 PNG/성공 sidecar 없음 |
| C08 | JPEG만 제공 / PNG 인코더 부재 | 기존 인코더가 있으면 실제 변환과 한계 기록, 없으면 미완료. 확장자 변경·생성 이미지 대체 금지 |
| C09 | 준비 조건이 제한 시간 내 나타나지 않음 | timeout을 관측하고 캡처 성공으로 세지 않음. 요청한 상태와 실제 상태 구분 |
| C10 | PNG는 있지만 JSON 저장/시각 확인 실패 | 부분 산출 경로·실패·다음 확인. 전체 성공으로 보고하지 않음 |
| C11 | 실제 PNG 파일 저장 실패 | 도구 부재·준비 실패와 구분, 만들어지지 않은 PNG를 링크하지 않음 |
| C12 | review/explain이 기존 PNG/JSON을 읽음 | 기존 산출만 읽고 finding/설명 반환, 재캡처·Task/current/history·Git 쓰기 없음 |

실제 시험에서는 소유 화면과 합성 입력을 사용하고 조건·도구/version(노출 시)·호출·전후 파일/설치 경계·이미지·metadata를 대조한다. 실패한 원 결과와 미검증 환경을 보존하며 무조건 재시도하거나 지원 범위를 일반화하지 않는다.
