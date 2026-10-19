---
name: page-capture
description: Capture an explicitly requested UI state with existing host browser tools, save PNG and sanitized JSON evidence, and report actual conditions and limits. No browser/runtime installation or authentication automation.
---

# Page Capture

명시된 UI 상태를 현재 호스트의 브라우저 도구로 확인하고 PNG와 같은 basename의 JSON을 남긴다. 자연어 요청을 처리하는 지침이며 별도 CLI·브라우저 실행기·Playwright 설치를 제공하지 않는다.

## Resolve Request

1. 대상 URL/탭, 실제 사용자 project root, 출력 위치, 필요한 준비·조작과 viewport/fullPage 요청을 확인한다. 이미 주어진 값은 다시 묻지 않는다. 기본 출력은 사용자 프로젝트의 `.memory/captures/`이며 plugin 설치/cache를 프로젝트로 추정하지 않는다.
2. [Capability](references/capture-contract.md#capability)에 따라 현재 제공된 도구의 문서와 실제 핸들을 확인한다. navigation/interaction/screenshot, 실제 viewport 확인, PNG 저장·파일 열람이 필요하다. 존재하지 않는 API를 가정하거나 새 도구·MCP·브라우저·숨은 runtime을 설치하지 않는다.
3. 독립 `memory-review`/`memory-explain`의 읽기 전용 요청에서는 캡처를 실행하지 않는다. 기존 이미지를 읽어 검토·설명하고 새 캡처는 별도 실행 요청으로 연결한다. 실행 담당이 test 단계에서 호출하면 담당자가 산출을 evidence로 연결한다.

## Capture

1. [Output](references/capture-contract.md#output)의 경로·충돌·저장 조건을 먼저 확인한다. 기존 PNG/JSON 어느 하나라도 있으면 무단 덮어쓰지 않는다.
2. 기본은 현재 실제 viewport다. 크기가 명시되면 문서화된 도구로 적용하고 실제 width/height를 확인한다. 적용 불가·불일치를 요청값으로 기록하지 않는다. 임시 viewport override는 종료/실패 시 원래 상태로 복구한다.
3. 필요한 URL 이동·클릭·입력·스크롤만 요청 범위에서 수행하고 보이는 상태를 확인한다. 로그인·인증 자동화는 하지 않으며 필요한 세션은 사용자가 준비하도록 안내한다. 결제·전송·삭제·권한 변경은 캡처 요청으로 승인됐다고 보지 않는다.
4. 명시 준비 조건을 제한된 시간 안에 확인한다. 조건 미충족·조작 실패를 임의 대기나 다른 상태의 캡처로 성공 처리하지 않는다. 로딩/오류 화면 자체가 요청이면 그 화면의 실제 조건을 확인한다.
5. 민감정보가 화면에 보이는지 확인하고 [Sensitive Data](references/capture-contract.md#sensitive-data)를 적용한다. 실제 screenshot bytes를 PNG로 저장한다. JPEG만 제공되면 기존 PNG 인코딩 도구가 있을 때만 변환하고 이를 한계에 기록한다. 확장자만 바꾸거나 이미지 생성으로 화면을 대체하지 않는다.
6. 실제 파일을 열어 이미지와 요청 상태·viewport·모달을 시각적으로 대조한다. [Sidecar](references/capture-contract.md#sidecar)에 실제 값과 정제한 URL·동작만 기록한다. PNG 저장·JSON 저장·시각 확인은 각각 확인하며 하나라도 실패하면 부분 결과다.

## Return and Boundaries

- 실제 PNG/JSON 경로, 확인한 상태, 필요한 관측 finding과 [실패/한계](references/capture-contract.md#failures)를 설명한다. PNG 존재나 metadata의 성공을 화면 품질·DB 저장·제품 테스트 통과로 확대하지 않는다.
- 직접 호출은 요청 산출과 필요한 디렉터리만 작성한다. Task/Plan/current/checkpoint/history 생성·갱신, staging/commit은 하지 않는다. 기존 보고·상태 기록은 `memory-execute` 실행 담당의 책임이다.
- 내용은 [Reporting](../memory-execute/references/conventions.md#reporting)의 의미 보존 기준으로 작성한다. 필수 capability나 근거가 없으면 미완료와 준비/재개 조건을 남기고 성공을 창작하지 않는다.

[사례](references/scenarios.md)는 의미 경계이며 실제 호스트에서 모든 기능을 검증했다는 뜻이 아니다.
