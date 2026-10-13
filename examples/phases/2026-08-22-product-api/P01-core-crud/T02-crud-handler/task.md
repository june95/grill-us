# Task: T02 상품 CRUD 핸들러 및 서비스 구현

## Metadata

- Plan ID: 2026-08-22-product-api
- Phase ID: P01-core-crud
- Task ID: P01-T02
- Type: 기능
- Source: 스타터의 상품 API 문서 예시
- Blueprint Revision: 1
- Commit Policy: auto

## Status: pending

## Example Preconditions

실제 앱 소스·DB·test harness가 포함되지 않은 교육용 문서다. 이 파일이나 examples/current.md를 그대로 실제 실행 입력으로 사용하지 않는다. 제품 저장소에서 실제 파일·정본·스택·완전한 DTO·검증 구현과 명령을 조사해 실행 청사진을 확정해야 한다. 아래는 원 예시의 기술 내용과 새 문서 형식이다.

## Scope

- In: 상품 CRUD 핸들러·서비스의 문서 예시.
- Out: 스타터에서 상품 API 구현·실제 검증·커밋 수행.

## Dependencies

- [P01-T01](../T01-product-schema/task.md)

## Guide Alignment

- Project Guide Alignment: Compliant (예시의 구조와 기존 도메인 의미).
- 실제 제품 정본에 대한 실행 승인을 의미하지 않음.
- Plan: [상품 API 예시](../../../../plans/2026-08-22-product-api.md)
- Phase: [P01](../phase.md)

## Goal
상품 등록, 목록 조회(페이징/필터), 단건 조회, 수정, 삭제를 처리하는 컨트롤러 및 서비스 레이어 구현

## Decision Summary

- [D02 Variant 구조](../../../../decisions/2026-08-22-product-api.md): 상품·옵션의 관계와 재고 단위.
- 기존 예시의 처리 계약: 상품·Variant 생성 트랜잭션, 목록 limit 20/offset 0와 상태 필터. 인증 결정 D01의 구현은 이 예시에 포함되지 않은 후속 범위다.

## Implementation

### I01. ProductService 비즈니스 로직 구현

- Related Files:
  - `src/services/product.service.ts` :: `ProductService` — 비즈니스 로직 및 트랜잭션 처리; new
  - `src/dto/product.dto.ts` :: `CreateProductDto, UpdateProductDto, QueryProductDto` — 입출력 DTO; new

#### Details
- **Signatures & Types**:
  ```typescript
  export interface CreateProductDto {
    name: string;
    description?: string;
    variants: Array<{ color: string; size: string; price: number; stock: number; sku: string }>;
  }

  export class ProductService {
    async createProduct(dto: CreateProductDto): Promise<ProductWithVariants>;
    async getProductById(id: string): Promise<ProductWithVariants>;
    async listProducts(query: QueryProductDto): Promise<{ items: Product[]; total: number }>;
    async updateProduct(id: string, dto: UpdateProductDto): Promise<Product>;
    async deleteProduct(id: string): Promise<boolean>;
  }
  ```
- **Execution Flow / Logic**:
  1. `createProduct`:
     - DTO 유효성 검증 ➔ DB 트랜잭션 시작
     - `Product` 레코드 생성 ➔ 각 `Variant`에 `productId` 매핑 후 일괄 생성
     - SKU 중복 발생 시 Rollback 및 `DuplicateSkuException (HTTP 409)` 발생
     - 성공 시 생성된 전체 엔티티 반환
  2. `deleteProduct`:
     - 상품 존재 여부 확인 (미존재 시 `NotFoundException (HTTP 404)`)
     - 삭제 수행 (CASCADE로 하위 Variant 자동 정리)

### I02. ProductController REST API 라우트 구현

- Related Files:
  - `src/controllers/product.controller.ts` :: `ProductController` — HTTP 엔드포인트 라우팅; new

#### Details
- **API Endpoints**:
  - `POST /api/v1/products` ➔ `201 Created` / `400 Bad Request` / `409 Conflict`
  - `GET /api/v1/products` ➔ `200 OK { items: [], total: number }`
  - `GET /api/v1/products/:id` ➔ `200 OK` / `404 Not Found`
  - `PUT /api/v1/products/:id` ➔ `200 OK` / `404 Not Found`
  - `DELETE /api/v1/products/:id` ➔ `204 No Content` / `404 Not Found`

## Acceptance Criteria
- [ ] 상품 및 하위 옵션이 트랜잭션 내에서 원자적으로 생성되어야 함
- [ ] 존재하지 않는 상품 조회/수정/삭제 시 404 에러가 반환되어야 함
- [ ] 전체 API 유닛/통합 테스트가 100% 통과해야 함

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
| CRUD/404·트랜잭션 원자성 | pnpm test tests/controllers/product.controller.spec.ts | 제품 애플리케이션 root; 이 스타터에는 없음 | 명시된 모델/API 조건을 실제 suite로 확인 |

실제 실행 결과는 없음 — 수행하지 않은 검증을 통과로 기록하지 않는다. 명령은 원 예시의 제품 환경을 가정한다. 실제 사용 시 manifest·suite·cwd를 확인해 정확한 명령으로 확정한다. 테스트 개수·성공 로그·commit hash는 실행 후에만 기록한다.

## Commit Message

~~~text
feat(product): implement CRUD controllers and service

- Implement ProductService with transactional batch variant creation
- Add ProductController RESTful endpoints with error handling
- Add controller integration tests for CRUD lifecycle

Plan: 2026-08-22-product-api
Phase: P01-core-crud
Task: P01-T02
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
