# Canonical Guide Synchronization

적용/요청된 design-guide-update 또는 guide-update 모드만 읽는다. 정본 경로·권한은 [Authority](project-profile.md#authority), 의미 변경은 [Change Boundaries](conventions.md#change-boundaries)를 따른다.

## Authority

제품 설계/API/데이터/권한/운영 가이드에는 실제 공유 계약만 둔다. Task 진행·로그는 .memory에 기록한다. 현재 코드 drift를 정당화하려고 정본을 임의 수정하거나 생성물/외부 원본·과거 기록을 재작성하지 않는다.

## Design Mode

1. 변경할 계약의 실제 승인·정확 범위·정본/소유자 조건을 확인한다.
2. 적용되는 schema/DTO/오류/상태/권한/route/운영 영향과 문서 목록을 적는다.
3. 의존 구현 전에 최소 정본 변경을 수행하고 링크·필드·이름·승인 범위를 대조한다.
4. 권한/근거가 부족하면 수정하지 않고 Blocked와 필요한 결정/자료를 남긴다.

design-guide-update.md는 승인·영향·변경/미변경 이유·실제 확인·남은 불일치를 기록한다. verdict는 Updated / No Changes / Needs Changes / Blocked다.

## Implementation Mode

- 현재 구현·유효 검증과 AC를 확인한다. test 생략은 실제 대체 근거로 판단하며 보고서 부재만으로 차단하지 않는다.
- 현재 Task의 미해결 Critical/High·계약 충돌은 구현/승인된 설계 변경으로 돌려보낸다.
- 검증된 공유 사용법/설정/운영 영향만 최소 동기화한다. 구현했다는 이유만으로 정본을 다시 쓰지 않는다.
- 변경한 안내·명령/cwd·링크·필드를 확인하고 [증거 규약](conventions.md#evidence-and-completion)으로 영향 review/test만 갱신한다.
- 단독 가이드 모드는 정본 작업만 수행하고 제품 결함은 해당 단계로 반환한다.

guide-update.md는 검증 근거·정본별 영향/갱신 필요·실제 변경/미변경·충돌·다음 행동을 같은 verdict로 기록한다.

## No Changes

단계 생략은 workflow 사유로 충분하다. 실제 검토 후 수정 불필요라면 No Changes 보고를 만들 수 있지만 미검토를 완료로 표시하지 않는다. [Stage Report](templates.md#stage-report)에 실제 검토한 대상·근거·한계를 남긴다.
