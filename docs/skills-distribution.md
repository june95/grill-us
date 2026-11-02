# 독립 스킬 배포 기술 계약

현재 공식 설치는 [기존 플러그인 안내](../packaging/README.md)를 따른다. 이 문서는 승인된 skills CLI 전환을 준비하는 생성기의 계약이다. 실제 CLI·Codex·Claude 설치와 저장소 기본 경로 전환은 별도 검증이며, 생성 성공을 공개 설치 성공으로 표현하지 않는다.

## 원본과 public 이름

편집 정본은 `.agents/skills`와 `packaging/grill-us.json`의 명시 `skillNames`·`sourceFiles`다. 기존 source ID는 내부 주소로 유지하며 public 이름은 `prj-` + source ID다. 공식 9개는 `prj-grill-me`, `prj-memory-intake`, `prj-memory-plan`, `prj-memory-execute`, `prj-memory-review`, `prj-memory-explain`, `prj-memory-wiki`, `prj-page-capture`, `prj-visualize`다.

각 public 폴더의 `SKILL.md` name은 폴더명과 같고 description의 의미와 출처·license 고지를 보존한다. 생성물에는 개발용 `metadata.internal` 표시를 남기지 않는다. CodeBurn·런타임·개발용 검증기·사용자 기록은 설치 payload에 포함하지 않는다.

## 독립 문서 계약

각 스킬의 필수 문서와 지원 Markdown anchor는 그 스킬의 설치 디렉터리 안에서 해소한다. 필요한 형제 문서는 references에 생성하고 다른 스킬의 등록 항목인 `SKILL.md`로 복제하지 않는다. 명시 allowlist 밖의 로컬 문서와 절대 파일 URI는 거부한다. 공통 문서는 원본 한 곳에서 편집하고 생성물이 자동 반영되도록 한다.

현재 호출 안내·스킬 연결은 public 이름으로 대응한다. 외부 URL·출처·과거 사실·Task/Decision ID·HTML 및 데이터 예제를 무차별 치환하지 않는다. 다른 스킬이 필요한 후속 흐름은 해당 public 이름을 안내하며, 미설치 스킬을 자동 설치하지 않는다.

## 생성 명령

저장소 root에서 실행한다. 사용자는 설치 전에 Node 빌드를 할 필요가 없으며 아래 명령은 배포 유지보수용이다.

| 명령 | 결과 |
| :--- | :--- |
| `node scripts/build-skills.mjs` | ignored `dist/grill-us-skills`에 public 9개 생성 |
| `node scripts/build-skills.mjs --publish` | 같은 생성 규칙으로 tracked `skills/` 생성 |
| `node scripts/build-skills.mjs --check-published` | 현재 source와 `skills/`의 목록·내용·참조를 읽기만 대조 |

전환 준비 단계에서는 실제 저장소의 publish를 실행하지 않는다. 소유 fixture에서 두 출력의 일치와 검사를 확인한 후 실제 설치 검증·기본 경로 전환으로 진행한다. 현재 플러그인의 catalog·생성물은 그때까지 보존한다.

## 오류와 교체

정상 exit는 0, 잘못된 인수·입력·참조·경로 또는 missing/stale/변조/알 수 없는 출력은 exit 1이다. 검사 모드는 파일을 수정하거나 자동 복구하지 않는다. 실제 저장소 출력은 두 지정 경로만 허용하고 테스트는 표식 있는 소유 임시 root에서만 수행한다.

생성기는 입력의 경로 component를 검사하고 symlink/junction을 따라가지 않는다. 임시 출력에 생성·검증한 뒤 소유 표식·실제 목록·파일 SHA와 일치하는 기존 출력만 교체한다. 사용자 추가 파일·빈 디렉터리·수동 변경은 보존하고 오류로 보고한다. 실패 시 기존 정상 출력과 원본을 유지한다.

`build.json`은 formatVersion 1, generator, sourceSnapshot(path→SHA256), files(path/sha256 목록)를 기록한다. 자기 hash의 순환을 피하도록 소유 표식을 별도로 두고 실제 출력·build 목록과 함께 대조한다.

## 검증 경계

생성기 검증은 정확한 이름·개별 필수 문서·지원 anchor·입력/소유권 오류·불변성과 기존 배포 회귀를 다룬다. 실제 설치기의 발견·링크/복사·두 호스트 호출·업데이트·공개 GitHub 주소 설치는 별도 근거가 필요하다. 기존 plugin 설치를 새 경로 성공으로 재사용하지 않는다.
