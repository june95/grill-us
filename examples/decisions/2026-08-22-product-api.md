# Decisions: 쇼핑몰 상품 API

- Date: 2026-08-22
- Decision ID: 2026-08-22-product-api
- Status: Confirmed
- Source: 상품 API 교육용 예시. 아래 선택·이유·적용 범위는 가정이며 실제 사용자 승인·제품 검증을 뜻하지 않는다.

## D01. 인증 방식
- **Chosen**: JWT Bearer 토큰 인증 (Authorization 헤더)
- **Rationale**: MSA 구조 확장을 고려하여 상태 저장이 없는 Stateless 토큰 방식을 채택함.
- **Confirmation**: 교육용 확정 가정; 실제 사용자 선택 기록 아님.
- **Applies to**: 이 상품 API 예시의 인증이 필요한 요청. CRUD Task의 인증 구현은 별도 후속 범위이며 다른 서비스 전체에 적용하는 결정은 아니다.

## D02. 상품 옵션 (Variant) 구조
- **Chosen**: Product 1 : N Variant 관계 (색상/사이즈별 독립 재고 관리)
- **Rationale**: SKU 단위로 가격과 재고를 분리하여 재고 품절 및 옵션별 추가금 처리를 유연하게 지원함.
- **Confirmation**: 교육용 확정 가정; 실제 사용자 선택 기록 아님.
- **Applies to**: 이 상품 API 예시의 Product/Variant 모델과 색상·사이즈별 SKU 가격·재고 처리.

이 예시에는 확정된 재검토 조건이 없으므로 Revisit When 필드를 작성하지 않는다. 새 형식 설명을 위한 교육용 보완이며 사용자의 과거 결정 파일을 소급 변환하라는 뜻은 아니다.
