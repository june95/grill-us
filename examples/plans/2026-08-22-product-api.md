# Plan: 쇼핑몰 상품 API 구축

- Plan ID: 2026-08-22-product-api
- Date: 2026-08-22
- Status: pending
- Source / Decisions: [원본 결정 예시](../decisions/2026-08-22-product-api.md)

## Example Notice

Plan/Phase/Task의 문서 구조를 보여주는 예시다. 실제 상품 앱 소스·테스트가 포함되어 있지 않고 구현·검증·커밋을 수행한 기록도 아니다. 이 예시를 실제 활성 작업으로 자동 등록하지 않는다.

## Goal

상품 등록·조회·수정·삭제(CRUD)와 색상/사이즈별 Variant 가격·재고 관리를 설명하는 RESTful API 계획 예시.

## Scope

- In: 코어 모델·CRUD 문서 예시.
- Deferred: JWT Bearer 인증 가드·권한 통합은 결정 D01에 남아 있는 후속 범위다. 이 예시에 실행 가능한 인증 Phase는 없다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | pending | 코어 모델 스키마와 CRUD API | [P01](../phases/2026-08-22-product-api/P01-core-crud/phase.md) |

## Dependencies and Sequencing

T01 모델 스키마 이후 T02 CRUD를 구성하는 문서 예시다. 실제 제품 저장소의 작업 계약과 명령은 별도로 확인해야 한다. 위 결정 파일은 이 예시에서 Plan과 같은 이름을 사용하지만 일반 규약은 독립 Decision ID와 실제 링크로 연결한다.

## Completion Criteria

- [ ] 실제 제품 환경에서 T01/T02의 완료 조건·검증·커밋 정책을 충족.

## Next Step

문서 형식만 참고한다. 예시를 활성 작업으로 사용하지 않고 실제 요청을 intake/plan으로 등록한다.

## Execution Progress

- done: 0/2
- 실제 활성 Task: 없음
