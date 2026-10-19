# grill-us plugin 호환성 확인

현재 개발 snapshot은 page-capture를 포함한 **0.3.0/8개 스킬**, 명시35개 원본 문서·41개 package 파일입니다. Markdown-only 구성과 특정 호스트의 실제 UI 캡처 성공, 과거 **0.2.0/7개**·**0.1.0/6개** 설치 결과를 구분합니다. 시험 버전은 최소 지원 버전이 아니며 CodeBurn·개발 검증기·브라우저 실행 코드는 배포하지 않습니다.

## 0.3.0 page-capture 호스트 경계

현재 에이전트의 Chrome extension browser API는 JPEG를 반환하고 Windows의 기존 PowerShell7.6.7/System.Drawing으로 PNG를 저장할 수 있었습니다. 소유 fixture의 기본·모달 PNG를1600×865로 저장해 실제 이미지를 열었고 JSON에 실제 CSS viewport1600×865·DPR2·JPEG→PNG 변환·fullPage=false를 구분했습니다. viewport pixel과 device-pixel fidelity를 같다고 주장하지 않습니다. 합성 입력은 마스킹됐고 sidecar에는 fill value와 URL query/fragment를 넣지 않았습니다.

브라우저 제어가 한때 응답하지 않았고 내장 IAB 브라우저는 제공되지 않았습니다. 같은 Chrome의 새 소유 탭에서 제어가 다시 응답한 뒤 CSS viewport375×812/DPR1을 실제 확인해 좁은 화면도 촬영했습니다. 받은 JPEG와 저장 PNG는360×780이며 이 차이·원인 미확인·아래 영역 미포함을 sidecar에 남겼고 요청 크기에 맞춰 이미지를 늘리지 않았습니다. 임시 viewport는1600×865/DPR2로 복구했습니다. 준비 중 화면에서1200ms 조건 timeout도 확인했으며 PNG/JSON은 만들지 않았습니다. 원 연결 실패를 보존하고 복구 원인이나 모든 호스트 지원을 단정하지 않습니다.

직접 캡처는 산출만 쓰고 test 담당이 상태/evidence를 기록합니다. 독립 review/explain은 기존 PNG/JSON만 읽습니다. browser API·viewport·PNG 저장 도구가 없는 세션은 미완료를 안내하며 자동 설치·숨은 대체 runtime·개인 설정 변경·인증 자동화를 하지 않습니다. 이번 개발 snapshot을 개인 canonical 설치나 공개 GitHub 배포로 자동 갱신하지 않습니다.

아래는 이전 버전의 날짜별 실제 결과입니다. 자체 GitHub marketplace의 기록이며 공식 공개 스토어 등록·심사 성공을 뜻하지 않습니다. 2026-10-14 Claude2.1.299의 두 strict manifest 검사 exit0도 당시 형식 검사이며0.3.0 UI 캡처 성공의 근거로 쓰지 않습니다.

## GitHub 0.2.0 명시 업데이트 — 2026-10-15

공개 `june95/grill-us`의 main을 `f293bdacf6bd6e6594dbf7c4b3d638e0f5835f19`에서 **`e8d67c3388a820cc9d2359c4601faed75cc6be75`**로 일반 fast-forward push한 뒤, 기존 `grill-us@grill-us` 설치를 **0.1.0 → 0.2.0**으로 명시 업데이트했습니다. 새 0.2.0 최초 설치나 무인 자동 갱신을 시험한 것은 아닙니다.

| 항목 | Codex CLI | Claude Code CLI |
| :--- | :--- | :--- |
| 실제 버전 / OS | 0.160.1 / Windows | 2.1.300 / Windows |
| source 갱신 | `codex plugin marketplace upgrade grill-us --json` | `claude plugin marketplace update grill-us --json` |
| plugin 업데이트 | marketplace 갱신 후 설치본 0.2.0 확인; add/remove 미실행 | `claude plugin update grill-us@grill-us --scope user --json`, oldVersion 0.1.0 / newVersion 0.2.0 |
| 공개 source 대조 | Git origin은 june95/grill-us, HEAD e8d67c3 | 같은 origin/HEAD |
| 설치 cache | 0.2.0의 38개 파일 hash가 공개 package와 일치 | 0.2.0의 38개 파일 hash가 공개 package와 일치 |
| 새 세션 발견 | `skills/list` 활성 namespace 7개, errors 0 | init plugin 0.2.0과 qualified slash command 7개 |
| 대표 요청 | 설치 cache의 `memory-review` / gpt-6-astra | 설치 cache의 `memory-review` / claude-opus-5-5 |

두 모델은 설치된 0.2.0의 전체 SKILL과 형제 review 규약을 읽고, 계획 없는 가상 계산 코드의 덧셈/곱셈 결함을 High로 반환했습니다. 계획 준수는 해당 없음이며 최소 수정 방향과 권장 검증을 설명했고, 실제 테스트나 코드 수정은 하지 않았습니다. 두 호출은 exit 0이며 fixture 전체 파일(`.git` 포함)·부모 helper·새 설치 cache 변경은 0이었습니다. `--plugin-dir`나 개발 source를 직접 읽는 방법으로 GitHub 설치 결과를 대신하지 않았습니다.

양쪽 무관 설치 목록은 같았고 기존 사용자 세션은 종료·reload하지 않았습니다. Claude 0.1.0 디렉터리는 존재했으나 내부 파일을 읽거나 hash·수동 삭제하지 않았으므로 bytes 동일성을 검증했다는 뜻은 아닙니다. 저장소 tracked 9,737개와 사용자 untracked 73개의 hash가 같고 index는 비어 있었습니다. Claude settings hash는 같았지만 Codex config·Claude 설치 registry·`.claude.json` hash 변화가 관측됐습니다. 설치 registry의 버전 전환은 목록으로 확인했으며 개인 metadata 전체의 보존·변화 원인을 단정하거나 과거 파일로 복원하지 않았습니다.

Claude 답변의 전체 영향 표현은 같은 답변에 기록된 정상 입력 예외보다 넓었습니다. 유효한 결함·수정 방향과 모델의 표현 한계를 구분합니다. 부모가 제공한 hash와 모델의 내용 재읽기를 독립 hash 계산으로 세지 않았고, 실행 담당이 실제 bytes를 대조했습니다. 무쓰기 관측은 사용한 sandbox·제한 file tools와 전후 비교 범위이며 OS 전체 읽기 전용 보장이 아닙니다. 모든 7개 workflow·다른 OS/scope/CLI 버전·향후 자동 업데이트까지 시험한 것은 아닙니다. 이전 `memory-explain` 자동 본문 truncation도 이 리뷰 요청으로 해결됐다고 주장하지 않습니다.

이 결과는 공개 커밋 e8d67c3의 당시 package에 대한 근거입니다. 이후 안내와 생성 README/build metadata의 변경을 새로운 native 업데이트 성공으로 표시하지 않습니다. 스킬·manifest·version의 변경 영향과 필요한 재검증은 아래 절을 따릅니다. 사용자용 명령과 새 세션 적용 절차는 [패키지 사용자 안내](../packaging/README.md)에 있습니다.

## 로컬 0.2.0 변경 계약 검증 — 2026-10-14

| 항목 | Codex CLI | Claude Code CLI |
| :--- | :--- | :--- |
| 실제 버전 / OS | 0.160.1 / Windows | 2.1.299 / Windows |
| 모델 | 기존 선택 gpt-6-astra를 세션에 명시 | 실제 init의 claude-opus-5-5 |
| 로드 | 전용 nonce local marketplace + native `plugin add` | `--plugin-dir`와 정확한 package `--add-dir` |
| 발견 | 설치 전 0 → 설치 후 활성 7, `skills/list` errors 0 | init plugin 0.2.0 + qualified slash command 7 |
| 본문·참조 | 전용 0.2.0 설치 cache의 `skills/` | 지정한 0.2.0 session package의 `skills/` |
| 대표 호출 | R1/R2/P/Dwrite/Dquery 각 1회와 Dquery 본문 보완 1회, 모두 exit 0 | 같은 기본 5개 호출, 모두 exit 0 |

발견한 이름은 `grill-me`, `memory-intake`, `memory-plan`, `memory-execute`, `memory-review`, `memory-explain`, `visualize`입니다. 기존 canonical `grill-us@grill-us`는 세션 설정으로 비활성화했습니다. 개발 저장소 스킬을 직접 읽은 결과를 native 발견으로 세지 않았습니다.

| 사례 | 양쪽 실제 결과 |
| :--- | :--- |
| R1: 계획 없는 파일 리뷰 | 덧셈으로 구현된 곱셈 계약의 결함과 수정·검증 방향 반환, 계획 준수 해당 없음 |
| R2: 비활성 Task + Phase | 출력 계약을 어긴 T01은 Needs Changes, 계획대로 작성한 T02 wrapper는 구현 준수와 계획 복잡성을 구분. Phase는 T01 때문에 Needs Changes |
| P: 계획 작성 | 기존 모듈/테스트·공개 계약·AC·실제 명령을 고정한 단일 pending Task 생성. private helper/동등 알고리즘 재량, 미래 auto 유지 |
| Dwrite: 확정 결정 저장 | checkout 배송비 표시 범위를 `Applies to`에 기록, 합의한 재검토 조건이 없어 `Revisit When` 생략 |
| Dquery: 새·구형·상충 결정 조회 | 구형 `## D01`/`Why`와 새 형식 모두 검색. 문서별 동일 DNN·범위 누락·반대 선택·대체 근거 부재 구분, 최신 날짜만으로 권위 선택 없음 |

R1/R2/Dquery는 fixture 파일 변경 0입니다. P는 새 Plan/Phase/Task와 이력, Dwrite는 새 결정과 이력만 작성했습니다. 모든 호출에서 제품·기존 current/checkpoint·Git HEAD/index/status와 `.git` 전체 파일 bytes, 시험 부모 폴더의 helper/catalog, package와 trial cache 변경은 없었습니다. 부모 폴더 대조는 별도 두 host fixture를 제외하고 각 fixture는 따로 대조했습니다. 실제 테스트·구현·staging·commit·위임은 모델에게 허용하지 않았으며 수행되지 않았습니다.

독립 사전 검토에서 `.git` metadata와 부모 helper 관측 누락이 발견돼 호출 전에 보강했습니다. 소유 fixture의 설정 주석·helper 주석·새 sentinel 변화를 실제 검출하고 원 bytes 복원을 확인한 뒤 재검토를 통과했습니다. Codex 읽기 과정의 `Get-FileHash`·`rg` 부재는 원 오류를 보존하고 파일 읽기로 대체했습니다. 양쪽 모델의 hash 인용은 부모가 제공한 snapshot이며 독립 계산 성공이 아닙니다. 실행 담당이 전체 bytes와 실제 tool 명령을 별도로 대조했습니다.

Codex Dquery는 올바른 조회·무쓰기를 반환했지만 automatic main prompt의 `memory-explain` 본문 truncation 경고가 있었고 전체 SKILL을 재읽지 않았습니다. 원 결과와 한계를 보존한 뒤, 독립 사전 검토를 거친 별도 DqueryRetry에서 같은 전용 native package를 사용해 전체 `memory-explain/SKILL.md`를 UTF-8로 읽도록 했습니다. 실제 command/output 전체가 package 본문과 일치했고 같은 세 결정의 해석과 변경 0을 확인했습니다. 자동 주입 경고는 보완 호출에도 남았으므로 기본 truncation이 해결됐다고 주장하지 않습니다. 원 로그의 비민감 plugin 설정 키 일부는 이메일 필터에 가려져 정확한 trial context와 대조했고, 보완 호출에서는 알려진 두 설정 키만 필터 예외로 두었습니다.

모델 출력의 세부 표현까지 항상 정확함을 보장하지 않습니다. R1의 severity는 Codex High, Claude Critical로 달랐고 Claude의 전체 영향 표현은 실제 입력별 예외보다 넓었습니다. 계획에서는 비number/±0/검증 우선순위의 해석을 밝혔으며 별도 운영 설계 승인으로 삼지 않습니다. 모든 7개 스킬의 전체 workflow, staged diff/commit range의 모든 리뷰 입력, 새 인터뷰·intake·execute·visualize 실행을 다시 시험한 것은 아닙니다. intake에 추가된 공통 계획 경계는 P로, execute의 리뷰 대상 변경은 R1/R2로 해당 계약을 확인했지만 각 진입점의 전체 실행을 대체하지는 않습니다. visualize 본문·참조는 동일하여 아래 과거 근거를 재사용합니다. Claude CLI는 과거 2.1.296에서 2.1.299로 달라졌으므로 미실행 흐름을 현재 버전의 실제 성공으로 표시하지 않습니다.

시험용 Codex identity만 native remove로 제거했고 재조회는 trial 스킬 0/errors 0, 전용 config entry 없음이었습니다. native 제거 뒤 남은 비어 있는 전용 cache root도 경로·소유를 확인하고 제거했습니다. 양쪽 기존 설치 목록과 Codex marketplace 목록, 무관 Codex cache 1,365개가 동일했습니다. Claude는 세션 로드였으므로 설치하지 않았고, 사용 중인 canonical Claude 0.1.0 cache는 읽기·hash·변경·제거 대상으로 삼지 않았습니다. 해당 cache의 보존은 native identity/version/path와 작업 범위로 확인했으며 bytes 동일성 검사를 했다는 뜻은 아닙니다. 소유한 가상 fixture와 호출 근거는 로컬에 보관합니다.

Claude settings/설치 registry hash는 같았으나 Codex config와 `.claude.json` hash는 달라졌습니다. trial entry 제거와 기존 native 목록은 확인했지만 개인 설정 전체의 무관 본문 동일성이나 변화 원인은 단정하지 않습니다. 인증 복사·HOME/CODEX_HOME 재지정·새 로그인·보안 설정 변경·전체 개인 파일 복원은 하지 않았습니다. Codex의 기존 elevated/workspace-write와 Claude 제한 file tools에서 관측한 준수이며 OS 전체 무쓰기를 강제하거나 감시한 결과는 아닙니다.

이 검증 이후 README와 생성 build/owner metadata만 갱신한 최종 package는 호출 당시 bytes와 구분합니다. 스킬·참조·manifest·version은 동일합니다. 문서 갱신을 새로운 native 재설치·공개 GitHub 설치·자동 upgrade 성공으로 표시하지 않습니다.

## GitHub 주소 설치 — 2026-10-14

공개된 `june95/grill-us`의 default branch main, 커밋 **`905e8fd66163c2da77335e6556a9a82666ae9a69`**, package **0.1.0**을 별도 Windows 사용자 프로젝트 두 곳에서 실제 native CLI로 등록·설치했습니다. 수동 ZIP·clone·package 복사·Node 빌드·개발 스킬 직접 로딩 없이 도구가 GitHub source를 받았고, 양쪽 marketplace의 실제 Git origin/HEAD와 설치 cache의 36개 파일 bytes가 공개 package와 일치했습니다.

| 항목 | Codex CLI | Claude Code CLI |
| :--- | :--- | :--- |
| 실제 버전 / OS | 0.160.1 / Windows | 2.1.296 / Windows |
| source 등록 | `codex plugin marketplace add june95/grill-us` | `claude plugin marketplace add june95/grill-us` |
| native 설치 | `codex plugin add grill-us@grill-us` | `claude plugin install grill-us@grill-us --scope user` |
| 실제 발견 | app-server `skills/list` 활성 namespace 6개, errors 0 | 새 세션 init의 plugin 0.1.0 및 slash command 6개 |
| 명시 대표 요청 | `$grill-us:memory-explain` / `codex exec` | `/grill-us:memory-explain` / `claude -p` |
| 실제 본문·참조 | 설치 cache의 SKILL.md·conventions/review/project-profile | 설치 cache의 SKILL.md·scenarios/conventions |
| 설명 경계 | fixture의 done T01와 pending T02·현재 코드·실제 commit diff 구분 | fixture의 done T01와 pending T02·현재 코드·Git refs/log 구분 |
| 전후 대조 | fixture 파일·Git·package bytes 변화 0 | 최종 설명 호출에서 fixture 파일·Git·package bytes 변화 0 |

설치 경로는 각각 `~/.codex/plugins/cache/grill-us/grill-us/0.1.0`과 `~/.claude/plugins/cache/grill-us/grill-us/0.1.0`입니다. Claude는 내부 slash 명령을 대화형으로 실행한 시험 대신 동등한 native CLI 설치를 사용했습니다. init 목록과 cache 읽기 event는 실제 근거이며 별도 `Skill` tool event는 두 Claude 설명 시도 모두 0건입니다. 목록 발견·명시 요청·tool event를 서로 대체하여 주장하지 않습니다.

Claude 최초 설명은 exit 0과 목록 6개·fixture 무쓰기를 확인했지만, 시험의 `--restricted`가 cwd 밖의 cache Read를 거부하여 참조 읽기는 실패했습니다. 원 부분 실패를 보존한 뒤 **정확한 설치 cache 하나만 `--add-dir`에 추가**하고 Read/Glob/Grep/Skill 제한을 유지한 재시험에서 본문·형제 참조 읽기를 확인했습니다. Bash/Write/Edit나 인증·HOME 재지정은 추가하지 않았습니다. Git 근거는 Claude의 파일 도구로 refs/log를 읽었으며 commit diff 실행은 Codex 시험의 근거입니다.

기존 로컬 시험의 다른 5개 대표 흐름은 6개 SKILL.md의 bytes와 같은 CLI 버전을 확인해 재사용했습니다. visualize 참조 7개는 LF 정규화만 달랐고, project-profile의 생성물/정본 설명 변경은 현재 설치 cache 출처·사용 프로젝트 경계 시험과 대조했습니다. 새 GitHub 설치 뒤 모든 모델 흐름이나 모든 설정 조합을 다시 실행한 것은 아닙니다. 모델·개인 기본 설정의 완전한 동일성이나 미래 출력 준수를 보장하지 않습니다.

trial plugin과 marketplace는 정확한 identity의 native uninstall/remove로 제거했고, 양쪽의 무관 native 설치·marketplace 목록과 선택한 설정의 무관 내용은 유지됐습니다. 무관 Codex cache 1,331개도 동일했습니다. Codex 시험 cache와 임시 신뢰 항목·시험으로 처음 생긴 빈 registry는 정리했습니다. 별도 실행 세션이 참조 중인 Claude version cache는 **사용자의 보존 선택에 따라 유지**했으며 이를 삭제 완료로 표시하지 않습니다.

정상 CLI 실행은 개인 상태 파일을 기록할 수 있습니다. `.claude.json`과 marketplace registry의 상태 hash 변화도 관측했고 원인이나 모든 metadata의 동일성을 단정하지 않았습니다. native 목록의 source·identity·기존 설치와 selected 설정 본문의 보존을 확인했으며 개인 상태 전체를 과거 파일로 복원하지 않았습니다. fixture 무쓰기를 개인 상태 전체 무쓰기로 확대하지 않습니다. 사용 중인 cache나 소유성이 불명확한 항목을 강제로 삭제하지 않습니다.

위 0.1.0 시험 직후 안내 문구만 바꿔 생성 README/build 목록을 갱신했던 package는 위 실제 설치 당시 bytes와 구분합니다. 스킬·manifest·catalog·version은 유지하며 안내 변경을 새로운 GitHub 재설치나 자동 upgrade 성공으로 표시하지 않습니다. macOS/Linux·Codex 앱/IDE/웹·구버전·최소 지원 버전·버전 간 자동 upgrade는 미검증입니다.

## 기존 로컬 시험의 표면과 로드 경로

| 항목 | Codex CLI | Claude Code CLI |
| :--- | :--- | :--- |
| 실제 버전 / OS | 0.160.1 / Windows | 2.1.296 / Windows |
| 실제 모델 호출 | `codex exec` | `claude -p` |
| 로드 | 별도 local marketplace + `plugin add` 임시 설치 | `--plugin-dir` 세션 package |
| 실제 목록 | app-server `skills/list`, namespace 6개 / errors 0 | 세션 init의 plugin·slash command 목록 6개 |
| 본문·참조 출처 | 전용 설치 cache의 `skills/` | 지정한 세션 package의 `skills/` |
| 명시 호출 | `$grill-us:<skill>` | `/grill-us:<skill>` |
| 작업 기록 | 가상 사용자 프로젝트 `.memory` | 가상 사용자 프로젝트 `.memory` |
| 리뷰 시험 | 실제 위임 런타임 오류 알림 후 Self | Agent 도구 제한 시 사유 알림 후 Self |

실제 명령의 상세 옵션·prompt·exit·파일 전후 hash는 로컬 Task 증거로 보관합니다. 개인 인증값·이메일·기존 사용자 세션은 공유 문서에 포함하지 않습니다. 지원 안내와 재현용 설치 구성은 [패키지 사용자 안내](../packaging/README.md)에 있습니다. 이 표는 2026-10-13의 로컬 시험이고 GitHub native user 설치는 위 절의 별도 근거입니다. 다른 표면·OS·구버전·버전 간 자동 upgrade는 미검증입니다.

## 대표 흐름과 경계

| 요청 | 확인할 결과 |
| :--- | :--- |
| memory-explain | 기록된 done과 현재 코드/pending 목표 구분, references 읽기, fixture 전체 파일·Git·current/checkpoint 무쓰기 |
| grill-me | 플러그인 본문 선택, 질문 하나와 2~3개 선택지/Recommended, 답변 전 결정 확정·파일 쓰기 없음 |
| memory-intake | 코드 확인 후 관련 새 pending Task 등록, 가상 `.memory`만 수정, 기존 활성 위치 보존 |
| memory-plan | 기존 미완료 Task 재사용·상세 청사진 보완, 구현·테스트·staging·commit 없음 |
| memory-execute --stage review | 비활성 완료 baseline만 리뷰, 발견 보존, 다른 Task 실행·제품/Git 변경·자동 finalize 없이 활성 위치 유지 |
| visualize | plugin references로 명시 HTML만 생성, 제품·`.memory`·Git HEAD/index 보존 |

설명·인터뷰는 파일 변경이 없었고 등록·계획은 fixture `.memory`만 변경했습니다. Codex 등록에서는 current의 선택적 집계가 1/3으로 갱신됐지만 Active Task/Stage와 checkpoint 위치는 유지했습니다. 시험의 완료 T01은 일부 보고·commit 식별 근거가 의도적으로 부족한 synthetic baseline이며, 리뷰가 그 한계를 지적한 결과를 보존합니다. 이 fixture를 실제 제품 전체 workflow 완료의 증거로 쓰지 않습니다.

## 실패와 검증 한계

- Codex 초기 실행은 CLI key 인용 오류와 읽기 명령의 정책 거부로 실패했습니다. 이후 package 본문을 직접 읽은 수동 fallback도 native 성공으로 세지 않았습니다. 실제 임시 설치 후 `skills/list` 6개와 cache 본문 출처를 확인한 호출만 native 근거로 사용합니다.
- Codex `-c` dotted key와 TOML 파일의 quoted table 문법을 혼동하지 마세요. 설치 없는 `plugins.enabled=true`만으로 이 CLI 버전의 스킬 등록을 확인할 수 없었습니다.
- Codex 최초 계획은 이번 등록·계획 단계의 무커밋 제한을 미래 T03의 `Commit Policy: none`으로 확대했습니다. 같은 host의 명시 memory-plan 보완에서 기본 `auto`와 미래 commit pending을 복구했고, 현재 제품/Git/활성 위치는 보존했습니다. 보완 첫 시도의 capacity 오류도 별도 실패로 남겼습니다. 단계 제한과 Task 완료 정책을 별도로 검토하세요. 계획만 하는 현재 호출은 구현·staging·commit 없이 끝내지만, 장래 Task의 기본 `auto`를 영구 `none`으로 바꾸는 사용자 선택을 추정해서는 안 됩니다. 실제 후속 실행도 무커밋을 원하면 그 범위를 따로 명시합니다.
- 이 정책 보완은 OS temp에 빈 Hashtable XML helper를 작성해 요청한 fixture 쓰기 범위를 벗어났습니다. 정책 수정 성공과 범위 실패를 구분했고, 명령·시각·hash가 일치한 파일만 로컬 증거로 이동했습니다. 이후 같은 host의 무쓰기 계획 확인에서는 fixture 변경 0·Git 동일·실제 읽기 명령만 확인했고 해당 외부 helper도 없었습니다. 기본 workspace-write에 임시 경로가 포함될 수 있으므로 fixture 전후 비교만으로 시스템 전체 쓰기를 판정하지 마세요. 마지막 확인은 세션의 temp 추가 허용을 제외하고 모델 shell의 TEMP/TMP/TMPDIR만 fixture 내부로 지정했으며, HOME/인증 경로는 바꾸지 않았습니다. 실제 거부 probe나 모든 OS 쓰기를 감시한 검증은 아닙니다.
- Claude의 Agent 도구 제한은 이 시험의 명시 정책입니다. Codex는 multi_agent=false 설정에도 노출된 위임 도구를 한 차례 호출했고 런타임의 thread context 초기화 오류로 실패한 뒤 알림·Self 리뷰를 수행했습니다. Self fallback 확인을 독립 리뷰 성공이나 host 전체의 위임 불가로 확대하지 않습니다. 별도 실제 제품 workflow의 review는 기본 읽기 전용 위임 계약을 따릅니다.
- Claude 최초 HTML은 차트가 없다는 이유로 필수 Chart.js CDN/animation 설정을 생략했습니다. Codex 최초 HTML도 테마 저장·훅이 빠졌고 파일 생성 뒤 모델 capacity 오류로 exit 1 종료됐습니다. 실패/부분 결과를 보존하고 각 host의 같은 plugin을 명시하여 보완한 뒤 exit 0과 최종 source/구문을 확인했습니다. HTML에 작성하는 browser-local 테마 저장과 실제 host 개인 설정 변경도 구분했습니다. 첫 호출부터 출력 계약을 항상 지킨다는 보장은 없습니다.
- HTML 검사는 source 구조와 inline JS 구문에 한정합니다. 실제 브라우저 DOM/모바일 overflow·PNG 다운로드·인쇄·네트워크·접근성 동작은 미검증입니다. 인터뷰 선택지의 설명 문구나 시각적 세부 품질도 사람의 확인이 필요합니다.
- 무쓰기 요청의 준수와 기술적 sandbox는 구분합니다. Codex는 기존 Windows elevated/workspace-write 설정으로 fixture를 시험하고 전후 hash로 무쓰기를 확인했습니다. 기존 사용자 rules를 제거하지 않았습니다.
- CLI는 정상 실행 중 개인 cache/config·프로젝트 상태·인증 refresh를 기록할 수 있습니다. 실제 `.claude.json` hash 변화는 모델 호출이 없는 구간에서도 관측돼 특정 명령의 원인으로 단정하지 않았습니다. 시험 전용 Codex identity는 native remove로 제거해 cache/설정 항목이 남지 않았고, 제거 전후의 무관 설정 text와 다른 cache 파일 1,330개의 aggregate hash가 일치했습니다. 다른 개인 설정을 과거 전체 파일로 복원하지 않았습니다.

## 패키지와 재검증

본문·형제 references·visualize provenance는 개발 정본과 동일한 bytes로 배포합니다. 사용 안내만 바뀌면 재빌드 후 README와 build metadata를 확인하고, 스킬/manifest bytes가 같으면 영향을 받지 않은 실제 호출 근거를 재사용할 수 있습니다. 스킬 본문·host 버전·권한·로드 경로가 바뀌면 관련 동작을 다시 시험합니다. 정적 manifest 통과만으로 실제 발견·호출을 대체하지 않습니다.

[OpenAI package 문서](https://developers.openai.com/plugins/build/plugins), [Claude CLI 문서](https://code.claude.com/docs/en/cli-reference), [Claude plugin reference](https://code.claude.com/docs/en/plugins-reference)는 외부 형식·옵션의 근거이며 이 저장소의 실제 성공 증거는 위 시험 범위에 한정합니다.
