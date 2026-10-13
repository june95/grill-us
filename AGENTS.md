# Project Memory Workflow Rules

작업 기록은 기본 로컬 `.memory`에 두고 [공통 규약](.agents/skills/memory-execute/references/conventions.md)을 따른다. 상위 사용자 지시와 실제 프로젝트 정본을 우선한다.

## Entry Points

| Request | Skill | Outcome |
| :--- | :--- | :--- |
| 명확한 수정·버그·이슈 등록 | [memory-intake](.agents/skills/memory-intake/SKILL.md) | 근거 조사 후 기존/새 Plan에 Task 등록 |
| 설계 검토·중요한 미결정 | [grill-me](.agents/skills/grill-me/SKILL.md) | 한 질문씩 선택·이유 확정 |
| 확정 요청의 작업 분할 | [memory-plan](.agents/skills/memory-plan/SKILL.md) | Plan → Phase → Task 청사진 |
| 현재 작업·지정 단계 실행 | [memory-execute](.agents/skills/memory-execute/SKILL.md) | 구현·검증·완료 판정·재개 |
| 설계·계획·진행·완료 설명 | [memory-explain](.agents/skills/memory-explain/SKILL.md) | 기록·코드·Git 근거의 읽기 전용 설명 |

## Essential Boundaries

- 명확한 요청에 인터뷰를 강제하지 않는다. 확정된 선택은 재질문하지 않고 코드 사실은 직접 확인한다. 중요한 미결정은 한 질문씩 2~3개 선택지와 추천안을 제시한다.
- 등록·계획은 제품/테스트 코드·공유 정본 변경·staging·commit을 하지 않는다. 상세 계약은 Task 폴더의 task.md 하나다. 결정 문서는 독립 ID의 실제 링크로 연결한다.
- 기본 실행은 Task 하나, 연속 실행은 사용자 범위에 따른다. 단독 단계는 선택한 작업만 수행하고 요청하지 않은 단계/수정/커밋이나 Task 완료·포인터 전진을 자동 수행하지 않는다. 단계에 허용되는 작업·최소 검증은 공통 규약의 Stage Isolation을 따른다.
- 사전 AC와 유효 근거로 판정하고 실패·차단·stale를 숨기지 않는다. 조사 목적 달성과 실제 검사 결과는 구분한다. ready는 done이 아니며 전체 완료 전 공통 품질·커밋 정책 결과를 확인한다.
- current는 활성 위치, Task/보고는 상세 상태, Plan별 state는 재개·intent다. 기존 위치·마지막 완료 근거·과거 done 기록과 미해결 intent를 보존하며 매 전환 archive 사본은 만들지 않는다.
- 같은 `.memory`의 실행·상태 쓰기는 한 명만 수행하고 도구 교체는 순차 재개한다. 적용 review는 기본 읽기 전용 별도 위임, 불가 시 사유 알림 후 자체 리뷰이며 사용자 자체 리뷰 지시가 우선이다. 리뷰어는 결과만 반환하고 실행 담당이 기록·수정한다. 실제 finding을 대체 절차로 지우지 않고 독립/자체 리뷰를 구분한다([Review Delegation](.agents/skills/memory-execute/references/review.md#review-delegation)).
- Git은 Task 후보와 사용자 working/index를 분리하고 `.memory`를 기본 제외한다. force-add·무관 변경 폐기·자동 push/외부 메시지를 수행하지 않는다.
- plugin 설치 경로는 읽기 전용 스킬 위치이며 `.memory`는 확인한 사용자 프로젝트 root에 둔다. cache/metadata 위치를 작업공간으로 추정하지 않는다. 공식 배포는 생성 plugin이고 `.agents/skills`는 개발 정본이다([작업공간 경계](.agents/skills/memory-execute/references/project-profile.md#skill-installation-and-workspace)).
- 설명만 하는 호출은 memory/history/current/checkpoint·제품·Git을 쓰거나 테스트를 실행하지 않는다. 당시 완료 근거와 현재 코드를 구분하고 불일치·복구 권고만 설명한다.

## Canonical References

필요한 진입점과 해당 단계만 읽는다. 상세 소유권·기본 읽기 기준은 [Rule Ownership](.agents/skills/memory-execute/references/conventions.md#rule-ownership), 단계 경계는 [Stage Isolation](.agents/skills/memory-execute/references/conventions.md#stage-isolation)이다. 문서 형식은 [templates](.agents/skills/memory-execute/references/templates.md), 대상/정본/명령 발견은 [project-profile](.agents/skills/memory-execute/references/project-profile.md), Git 점검은 [commit-check](.agents/skills/memory-execute/references/commit-check.md), 재개·복구는 [resume](.agents/skills/memory-execute/references/resume.md)을 따른다.

실행 보고는 무엇·왜, 실제 검증과 한계, commit/정책 결과·다음 행동, 범위 밖 발견을 간결히 설명한다. 발견이 없으면 특이사항 없음으로 적는다.
