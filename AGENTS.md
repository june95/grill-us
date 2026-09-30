# Project Memory Workflow Rules

## Project Memory 전환 규칙 — 우선 적용

사용자가 확정한 통합 설계에 따라 아래 공통 계약을 먼저 적용합니다. 이 절과 공통 정본이 기존 3단계 설명의 단일 Task 파일, 모든 단계 강제, 검증 직후 완료, 청사진 커밋 규칙보다 우선합니다.

- [공통 규약](.agents/skills/memory-execute/references/conventions.md): Phase 아래 `T01-{작업명}/task.md`를 상세 청사진 정본으로 사용합니다. 기존 큰 작업의 plan-N 분할 역할은 Phase 내 Task로 대응합니다.
- [템플릿](.agents/skills/memory-execute/references/templates.md): Task마다 workflow의 `필수 / 필요 시 / 해당 없음`과 적용 이유를 기록합니다. 생략한 단계는 표에 이유를 남기고 빈 보고서는 만들지 않습니다.
- [프로젝트 확인](.agents/skills/memory-execute/references/project-profile.md): 특정 정본·테스트 경로를 강제하지 않고 실제 프로젝트의 지침과 구조를 확인합니다.
- [공통 커밋 점검](.agents/skills/memory-execute/references/commit-check.md): 선행 적용 단계의 유효한 증거와 최종 품질을 확인합니다. 별도 final-review.md는 항상 필요한 파일이 아닙니다. 커밋 성공 또는 명시적 no-commit 완료 정책을 확인한 후 Task를 done으로 기록합니다.
- [재개 규약](.agents/skills/memory-execute/references/resume.md): 등록만으로 기존 활성 작업을 바꾸지 않습니다. 요청한 단계만 실행하는 경우 전체 workflow·커밋·포인터 전진을 자동 수행하지 않습니다. 범위 안 구현 조정은 기록하며 진행하고 중요한 동작·계약 변경만 질문합니다.
- `.memory/`는 특별한 공유 예외가 없으면 로컬 관리합니다. Task 청사진·보고·current를 Git에 추가하지 않습니다. 기존 추적 파일의 승인된 index 제거는 로컬 파일을 보존하며 처리합니다.
- 구현에서는 활성 청사진을 우선 읽고 필요한 공통 규약·관련 파일·현재 단계의 증거를 추가로 확인합니다. "Task만 읽기"를 최신 코드·검증 근거 확인 금지로 해석하지 않습니다.

당신은 아래 3가지 단계(명령어)에 따라 순차적으로 작업해야 합니다.

---

## [1단계: 인터뷰] `/grill-me <기능명>`

코딩을 시작하기 전에 애매한 요구사항과 아키텍처 결정을 확정합니다.

1. **한 번에 딱 1개씩 질문하세요.** (질문 폭탄 금지)
2. **질문할 때 추천 답안(Recommended)과 2~3개 선택지를 함께 제시하세요.**
3. 기존 코드베이스를 뒤져서 알 수 있는 내용은 묻지 말고 직접 확인하세요.
4. 모든 설계 분기가 확정되면 `.memory/decisions/YYYY-MM-DD-{기능명}.md` 파일로 저장하고 종료합니다.

---

## [2단계: 계획] `/memory-plan <기능명>`

`decisions/`를 바탕으로 계획을 물리적 파일로 쪼갭니다.
**(이 단계에서는 절대로 코드를 치지 마세요!)**

1. 전체 로드맵을 `.memory/plans/YYYY-MM-DD-{기능명}.md`로 작성합니다.
2. 각 Phase 폴더(`phases/YYYY-MM-DD-{기능명}/P01.../`)를 만들고 `phase.md`를 생성합니다.
3. 각 Task 파일(`T01...md`)에 아래 내용을 포함한 상세 청사진을 작성합니다:
   - 수정할 파일 경로 및 심볼(클래스/함수)
   - 모델 스키마, 필드명, 타입
   - 검증 커맨드 (테스트 명령어)
   - 커밋 메시지 (Plan: YYYY-MM-DD-{기능명} 헤더 포함)
4. `.memory/current.md`를 생성하여 첫 번째 Task(P01-T01)를 가리키게 세팅합니다.

---

## [3단계: 순차 실행] `/memory-execute` 또는 `"current 보고 이어서 해줘"`

`.memory/current.md` 포인터를 기준으로 작업을 1개씩 순차 구현합니다.

1. `.memory/current.md`를 읽고 현재 `Active Task` 청사진 파일을 확인합니다.
2. 청사진에 지정된 파일에 코드를 구현하고 검증 커맨드를 실행합니다.
3. 테스트 통과 시:
   - Task 파일의 `Status`를 `done`으로 변경
   - Git 커밋 (청사진에 적힌 커밋 메시지 사용)
   - 상위 `phase.md`의 진행률 갱신
   - `.memory/current.md`의 `Active Task`를 다음 Task로 전진
