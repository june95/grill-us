# 독립 스킬 배포 기술 계약

공식 설치는 [skills CLI 안내](skills-installation.md)를 따른다. 이 문서는 승인된 배포 계약이다. 최종 전환 구현/검증은 T04에서 수행하며 생성 성공을 공개 GitHub 설치 성공으로 표현하지 않는다.

## 원본과 public 이름

편집 정본은 `.agents/skills`와 `packaging/grill-us.json`의 명시 `skillNames`·`sourceFiles`다. 기존 source ID는 내부 주소로 유지하며 public 이름은 `prj-` + source ID다. 공식 10개는 `prj-grill-me`, `prj-memory-intake`, `prj-memory-plan`, `prj-memory-execute`, `prj-memory-review`, `prj-memory-explain`, `prj-memory-tidy`, `prj-memory-wiki`, `prj-page-capture`, `prj-visualize`다.

각 public 폴더의 `SKILL.md` name은 폴더명과 같고 description의 의미와 출처·license 고지를 보존한다. 생성물에는 개발용 `metadata.internal` 표시를 남기지 않는다. 개발 source 10개와 CodeBurn에는 `metadata.internal: true`를 지정한다. 기본 검색/전체 선택은 `skills/`의 public 10개만 노출한다. 명시 internal 선택이나 `INSTALL_INTERNAL_SKILLS` opt-in은 공식 설치 범위 밖이며 internal은 비밀 보호 수단이 아니다. CodeBurn·런타임·개발용 검증기·사용자 기록은 공식 설치 payload에 포함하지 않는다.

## 독립 문서 계약

각 스킬의 필수 문서와 지원 Markdown anchor는 그 스킬의 설치 디렉터리 안에서 해소한다. 필요한 형제 문서는 references에 생성하고 다른 스킬의 등록 항목인 `SKILL.md`로 복제하지 않는다. 명시 allowlist 밖의 로컬 문서와 절대 파일 URI는 거부한다. 공통 문서는 원본 한 곳에서 편집하고 생성물이 자동 반영되도록 한다.

현재 호출 안내·스킬 연결은 public 이름으로 대응한다. 외부 URL·출처·과거 사실·Task/Decision ID·HTML 및 데이터 예제를 무차별 치환하지 않는다. 다른 스킬이 필요한 후속 흐름은 해당 public 이름을 안내하며, 미설치 스킬을 자동 설치하지 않는다.

## 생성 명령

저장소 root에서 실행한다. 사용자는 설치 전에 Node 빌드를 할 필요가 없으며 아래 명령은 배포 유지보수용이다.

| 명령 | 결과 |
| :--- | :--- |
| `node scripts/build-skills.mjs` | ignored `dist/grill-us-skills`에 public 10개 생성 |
| `node scripts/build-skills.mjs --publish` | 같은 생성 규칙으로 tracked `skills/` 생성 |
| `node scripts/build-skills.mjs --check-published` | 현재 source와 `skills/`의 목록·내용·참조를 읽기만 대조 |

source 정책과 같은 소유 fixture에서 실제 설치·필요한 native 영향 검증을 먼저 통과한 뒤 실제 `skills/`를 publish한다. 기존 catalog/plugin과 전용 생성·검사는 그 이후 정리한다. 소유권·불변성·LF/checkout 검사는 새 배포 suite가 이어받는다.

## 오류와 교체

정상 exit는 0, 잘못된 인수·입력·참조·경로 또는 missing/stale/변조/알 수 없는 출력은 exit 1이다. 검사 모드는 파일을 수정하거나 자동 복구하지 않는다. 실제 저장소 출력은 두 지정 경로만 허용하고 테스트는 표식 있는 소유 임시 root에서만 수행한다.

생성기는 입력의 경로 component를 검사하고 symlink/junction을 따라가지 않는다. 임시 출력에 생성·검증한 뒤 소유 표식·실제 목록·파일 SHA와 일치하는 기존 출력만 교체한다. 사용자 추가 파일·빈 디렉터리·수동 변경은 보존하고 오류로 보고한다. 실패 시 기존 정상 출력과 원본을 유지한다.

`build.json`은 formatVersion 1, generator, sourceSnapshot(path→SHA256), files(path/sha256 목록)를 기록한다. 자기 hash의 순환을 피하도록 소유 표식을 별도로 두고 실제 출력·build 목록과 함께 대조한다.

## 검증 경계

생성기 검증은 정확한 이름·개별 필수 문서·지원 anchor·입력/소유권 오류·불변성과 기존 배포 회귀를 다룬다. 실제 설치기의 발견·링크/복사·두 호스트 호출·업데이트·공개 GitHub 주소 설치는 별도 근거가 필요하다. 기존 plugin 설치를 새 경로 성공으로 재사용하지 않는다.

## 최종 전환 전 후보 준비

`node scripts/prepare-skills-cutover.mjs`는 새 소유 OS temp root에 전환 후보를 생성하고 JSON으로 경로를 반환한다. 실제 source·metadata·catalog·기존 plugin은 변경하지 않는다. `--check <candidate-root>`는 원 입력/도구 SHA·후보 목록/내용·public freshness와 참조를 읽기만 확인한다. 정상0, missing/stale/변조·알 수 없는 항목/빈 디렉터리·경로 링크는1이며 자동 복구하지 않는다.

후보에는 명시42개 source 문서와 metadata, 내부 CodeBurn SKILL만 복사한다. 후보 source11개는 internal=true이며 public10개는 숨김 표시를 제거한다. 후보의 project-profile은 최종 배포 계약으로 정렬한다. 후보의 `skills/`는 기존 생성기로 만들고 legacy catalog/plugin·CodeBurn runtime·사용자 기록은 포함하지 않는다. `.git` metadata는 clone 검증을 위해 후보 내용 비교에서 제외한다.

입력은 실제 개발 저장소 또는 표식 있는 OS temp test source만 허용한다. 기존 생성기의 `readSkillInputs(repository)` 검증과 allowlist를 재사용한다. 반환은 `documents: Map<string,string>` 및 `sourceSnapshot: Record<relativePath,SHA256>`이며 원본을 수정하지 않는다. 준비 명령은 임의 출력/적용/삭제 옵션을 제공하지 않는다.

사용자 안내는 [설치 안내](skills-installation.md)에 둔다. 준비 명령은 실제 저장소를 적용/삭제하지 않고 최종 전환 이후에도 독립 후보 검증에 사용한다. 기존 plugin의 당시 호환성 보고는 보존한다. 공개 push·원격 재설치·개인 설치 전환은 별도 사용자 작업이다.
