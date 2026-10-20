# Wiki Document Templates

[memory-wiki](../SKILL.md)의 파일 형식이다. 아래 `{...}`는 실제 확인한 값으로 바꾸며 예시가 실행 성공·정책 승인 근거가 아니다. 원문 날짜/업무 권위 등 선택 필드는 미확인일 때 가짜 값을 채우지 않는다. 링크는 해당 문서 기준 실제 상대 경로를 사용한다.

## Manifest

위치: `source-manifests/{import-id}.md`. import-id/source-id는 기존 자료와 충돌 없이 정하고 재번호하지 않는다. 한 import에는 여러 파일이 있을 수 있다.

```markdown
# Source Manifest: {import-id}

- Mode: ingest 또는 refresh
- Imported At: {실제 ISO8601 시각}

## Completed Sources

| Source ID | Original Path | Copied Path | Imported At | SHA256 |
| :--- | :--- | :--- | :--- | :--- |
| {안정적source-id} | {실제 원문 경로} | {sources 사본 상대 링크} | {실제 시각} | {원본/사본과 같은 SHA256} |

## Version Relations

{변경 source의 이전 ID/manifest 링크. 업무 정책 대체 여부는 별도 근거 없으면 미확인}

## Incomplete / Skipped

{실패·미지원 경로/이유/다음 행동. 없으면 없음}
```

hash/복사 확인 출처·시점을 필요한 경우 덧붙인다. 기존 완료 manifest는 불변으로 보존하고 이후 현재성 정보는 source-map/관련 topic에 기록한다.

## Topic

위치: `topics/{slug}.md`. 기존 관련 주제에는 누적 내용을 보존하며 병합한다.

```markdown
# {주제}

## Summary

{근거가 있는 내용의 의미를 보존한 요약}

## Claims/Sources

| Claim | Scope / Status | Sources |
| :--- | :--- | :--- |
| {기록 사실/추론을 구분한 주장} | {적용 범위·정책/제안/미확인} | {source-id와 원문/사본 링크} |

## Contradictions

{상반된 주장·범위 차이·승인/대체 미확인과 양쪽 출처. 없으면 없음}

## Open Questions

{확인하지 못한 권위/범위/원문 현재성. 없으면 없음}

## Last Checked

{실제 확인 시각과 확인한 범위; 원문 날짜는 확인한 경우만 별도 표기}
```

## Answer

위치: 명시 save-answer의 새 `answers/{slug}.md`.

```markdown
# {답변 제목}

## Question

{실제 질문}

## Answer

{실제 근거로 답변. 기록 사실·추론을 구분}

## Sources

{실제 확인한 topic/원문 사본 링크. 없으면 자료 부재와 확인 범위}

## Uncertainty

{상충·권위/범위/현재성 미확인·부분 읽기 등. 없으면 없음}

## Created At

{실제 ISO8601 시각}
```

## Index, Source Map and Log

- `index.md`: 실제 topics와 저장된 Answers 링크를 유지한다. query만으로 파일/목록을 만들지 않는다.
- `source-map.md`: source-id → Original Path / Copied Path / manifest / 관련 topics를 연결한다. 같은 원문의 version 관계와 원문 부재/현재성 미확인·확인 시각을 보존하며 권위를 자동 선택하지 않는다.
- `log.md`: 명시 write 모드·실제 시각·추가/재사용/미완료·변경 주제/답변·다음 행동을 append한다. 기본 query는 기록하지 않는다. 동일 입력 no-op이면 불필요한 중복 이력을 쓰지 않아도 된다.

원문 사본은 `sources/{import-id}/{relative-path}`에 원본 bytes로 보존한다. 실제 주장 출처가 텍스트를 읽은 것인지 hash만 확인한 것인지 구분하고, 실패 항목에 완전한 source 필드를 가상으로 채우지 않는다.
