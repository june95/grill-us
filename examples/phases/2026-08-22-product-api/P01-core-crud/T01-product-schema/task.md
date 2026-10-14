# Task: T01 Product 및 Variant 스키마 정의

## Metadata

- Plan ID: 2026-08-22-product-api
- Phase ID: P01-core-crud
- Task ID: P01-T01
- Type: 기능
- Source: 스타터의 상품 API 문서 예시
- Blueprint Revision: 1
- Commit Policy: auto

## Status: pending

## Example Preconditions

실제 앱 소스·DB·test harness가 포함되지 않은 교육용 문서다. 이 파일이나 examples/current.md를 그대로 실제 실행 입력으로 사용하지 않는다. 제품 저장소에서 실제 파일·정본·스택·완전한 DTO·검증 구현과 명령을 조사해 실행 청사진을 확정해야 한다. 아래는 원 예시의 기술 내용과 새 문서 형식이다.

## Scope

- In: Product/Variant 스키마와 유효성 검증의 문서 예시.
- Out: 스타터에서 상품 API 구현·실제 검증·커밋 수행.

## Constraints

### Must

- Product/Variant의 공유 타입과 1:N CASCADE 관계, SKU 유일성 및 가격·재고의 0 이상 정수 제약을 보존한다.
- 실제 제품의 기존 모델·공유 타입·검증 위치를 우선 재사용한다. 아래 new 경로는 모델 소유 파일이 없는 제품을 가정한 예시이며, 기존 소유 위치가 있으면 그 위치를 사용한다.

### Must Not

- 이 Task에서 상품 CRUD·인증 기능이나 범용 모델 레지스트리를 추가하지 않는다.
- private 검증 helper의 이름·분할만으로 계획 위반을 판정하지 않는다.

## Dependencies

- []

## Guide Alignment

- Project Guide Alignment: Compliant (예시의 구조와 기존 도메인 의미).
- 실제 제품 정본에 대한 실행 승인을 의미하지 않음.
- Plan: [상품 API 예시](../../../../plans/2026-08-22-product-api.md)
- Phase: [P01](../phase.md)

## Goal
상품 기본 정보(Product)와 옵션별 독립 재고(Variant) 관리를 위한 1:N 관계의 데이터베이스 모델 스키마 및 유효성 검증 로직 정의

## Decision Summary

- [D02 Variant 구조](../../../../decisions/2026-08-22-product-api.md): SKU별 가격·재고와 Product 1:N Variant.
- 기존 예시의 제약: Product 삭제 시 Variant CASCADE. 실제 데이터베이스·검증 함수 구현은 제품 환경에 맞춰 확정한다.

## Implementation

### I01. Product & Variant 모델 스키마 정의

- Related Files:
  - `src/models/product.ts` :: `Product` — 상품 기본 엔티티 정의; new
  - `src/models/variant.ts` :: `Variant` — 상품 하위 옵션 엔티티 정의; new
  - `src/models/types.ts` :: `ProductStatus, VariantOption` — 공통 타입 정의; new

#### Details
- **Signatures & Types**:
  ```typescript
  export type ProductStatus = 'draft' | 'active' | 'archived';

  export interface Product {
    id: string; // UUID v4
    name: string; // 1~100자
    description?: string;
    status: ProductStatus;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Variant {
    id: string; // UUID v4
    productId: string; // FK -> Product.id
    sku: string; // e.g. "PROD-RED-L" (Unique)
    color: string;
    size: string;
    price: number; // 원화 정수 (>= 0)
    stock: number; // 재고 수량 (>= 0)
  }
  ```
- **Data & Schema Constraints**:
  - `Product.name`: Null 불가, Trim 적용, 빈 문자열 불가
  - `Variant.sku`: Unique 인덱스 적용, 중복 SKU 저장 시 `DuplicateSkuError` 발생
  - `Variant.price`: 0원 이상 정수 제약
  - `Variant.stock`: 0 이상 정수 제약 (음수 불가)
  - `Relation`: Product (1) : Variant (N) — `onDelete: CASCADE`

### I02. 스키마 유효성 검증 유닛 테스트 작성

- Related Files:
  - `tests/models/product.spec.ts` :: `describe('Product Schema Validation')` — 모델 생성 및 검증 테스트; new

#### Details
- **Test Scenarios**:
  1. 유효한 Product 및 Variant 인스턴스 생성 검증
  2. 음수 가격 또는 음수 재고 입력 시 유효성 에러 검증
  3. 필수 필드 누락 시 유효성 에러 검증

## Acceptance Criteria
- [ ] `Product` 및 `Variant` 인터페이스와 유효성 검증 함수가 구현되어야 함
- [ ] 유닛 테스트(`product.spec.ts`)가 에러 없이 모두 통과해야 함

## Workflow

| Stage | Applicability | Reason / Trigger | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| reference | 해당 없음 | 문서 구조 예시의 모델·결정은 위에 포함; 실제 사용 시 별도 조사 | skipped | Decision Summary와 Example Preconditions |
| design-guide-update | 필요 시 | 제품 정본의 승인된 계약 변경이 필요한 경우 | pending | 수행 시 design-guide-update.md |
| implementation | 필수 | 제품 환경에서 확정한 구현 계약 수행 | pending | 수행 시 implementation.md |
| review | 필수 | 모델·API 동작의 계획 준수·회귀 확인 | pending | 수행 시 review.md |
| review-action | 필요 시 | actionable finding 발생 | pending | 수행 시 review-action.md |
| test | 필수 | 실제 모델/API 검증 | pending | 수행 시 test.md |
| guide-update | 필요 시 | 제품 앱의 공유 계약·사용법 영향 | pending | 수행 시 guide-update.md |
| refactor | 필요 시 | 현재 변경의 안전한 정리가 필요한 경우 | pending | 수행 시 final-review.md |
| commit-check | 필수 | 실제 완료 조건·증거·Git 경계 판정 | pending | Completion Check |
| commit | 필요 시 | auto 정책과 실제 제품 변경이 있는 경우 | pending | 수행 시 commit.md |

## Validation

| Criteria | Command / Method | Cwd | Expected Result |
| :--- | :--- | :--- | :--- |
| 모델 제약과 유효성 검증 | pnpm test tests/models/product.spec.ts | 제품 애플리케이션 root; 이 스타터에는 없음 | 명시된 모델/API 조건을 실제 suite로 확인 |

실제 실행 결과는 없음 — 수행하지 않은 검증을 통과로 기록하지 않는다. 명령은 원 예시의 제품 환경을 가정한다. 실제 사용 시 manifest·suite·cwd를 확인해 정확한 명령으로 확정한다. 테스트 개수·성공 로그·commit hash는 실행 후에만 기록한다.

## Commit Message

~~~text
feat(product): add Product and Variant schema definitions

- Define Product and Variant entities with 1:N CASCADE relation
- Add SKU uniqueness and price/stock non-negative constraints
- Add unit tests for schema validation

Plan: 2026-08-22-product-api
Phase: P01-core-crud
Task: P01-T01
~~~

## Completion Check

- Verdict: pending
- Evidence Revision: 없음
- Covered Files / Source Snapshot: 없음
- Acceptance Evidence: 실제 검증 전
- Applied Stages: reference는 예시 근거로 skipped; 필수/조건부 단계는 미수행.
- Blocking Findings: 없음 — 제품 검토를 수행한 결과가 아님.
- Remaining Risks: 실제 앱/검증 환경이 없어 이 예시로 구현·성공을 단정할 수 없음.
- Staging: 수행하지 않음

## Progress

- [ ] 구현 또는 조사 목표 완료
- [ ] 적용 검증 완료
- [ ] 공통 품질·완료 정책 판정 완료 (커밋 필요 여부 포함)
- Commit Status: pending
- Commit Hash: 없음
- Resume Stage: implementation
- Blocker: 문서 예시이며 실제 실행 환경·완전한 구현 계약은 제공하지 않음
- Next Step: 예시 구조를 참고하고 실제 요청은 intake 또는 plan으로 등록

## Change Log

- 2026-08-22: 원본 상품 API 예시 ID.
- 2026-09-30: Task 폴더 형식으로 전환, 가상 완료·검증 기록 제거. 도메인 의미 보존.

- 2026-10-13: 공통 템플릿의 Metadata/Validation/Progress 형식에 정렬. 가상·비실행 경고와 도메인 계약 보존.
