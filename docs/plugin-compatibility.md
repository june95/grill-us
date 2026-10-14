# grill-us plugin 호환성 확인

2026-10-13에 생성 package 0.1.0을 개발 저장소 밖의 별도 Windows 가상 프로젝트에서 실제 CLI와 모델 요청으로 시험했습니다. 포함 스킬은 `grill-me`, `memory-intake`, `memory-plan`, `memory-execute`, `memory-explain`, `visualize` 6개이며 CodeBurn은 포함하지 않습니다. 현재 확인한 버전은 최소 지원 버전이 아닙니다.

현재 개발 snapshot에서는 6개 스킬/0.1.0 metadata를 유지한 채 공유 계약·내부 구현 재량·Constraints·리뷰 지침을 갱신했습니다. 아래 시험은 당시 공개 커밋/본문에 대한 역사적 근거이며 현재 변경 지침의 native 재설치·모델 행동 검증으로 확대하지 않습니다. 현재 변경은 문서 대조·정적 회귀·생성물 freshness로 검증하며 새 native 검증은 별도 작업입니다.

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

이후 안내 문구만 바꿔 생성 README/build 목록을 갱신한 package는 위 실제 설치 당시 bytes와 구분합니다. 스킬·manifest·catalog·version은 유지하며 안내 변경을 새로운 GitHub 재설치나 자동 upgrade 성공으로 표시하지 않습니다. macOS/Linux·Codex 앱/IDE/웹·구버전·최소 지원 버전·버전 간 자동 upgrade는 미검증입니다.

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
