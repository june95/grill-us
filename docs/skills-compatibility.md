# skills CLI 호환성

2026-11-03 Windows의 로컬 저장소와 소유 임시 consumer에서 확인한 결과다. 공식 public 이름은 모두 prj-이며 [설치 안내](skills-installation.md)를 따른다. **공개 push와 GitHub 주소 재설치는 수행하지 않았다.** 이 로컬 결과를 `npx skills@latest add june95/grill-us`의 공개 snapshot 설치 성공으로 해석하지 않는다. 이전 plugin의 당시 결과는 [과거 보고](plugin-compatibility.md)에 보존한다.

## 대상과 환경

| 항목 | 실제 확인 범위 |
| :--- | :--- |
| OS / Node / Git | Windows, Node26.12.1, Git2.53.0.windows.2 |
| skills CLI | 실제 npx1.7.4, engines Node22.20+, 별도 임시 home/cache 및 project scope |
| native 호스트 | Codex0.166.0, Claude Code2.1.316 |
| 모델 | Codex 기본 모델/effort low(모델명 별도 미확인), Claude claude-opus-5-5/low |
| 최종 build.json SHA256 | 487ee1bf951a3f77ecbbc3d112e6af0f4f14be395c515cc40e40f8d2c1286791 |
| 설치 payload | source40개 문서+metadata의 명시 allowlist, 설치 문서285개, manifest/owner 포함287개 |

## 검색·설치·생성물

최종 정책의 candidate와 실제 repo root에서 기본/와일드카드 검색은 정확히 public9개를 반환했다. 두 에이전트 각각 기본 또는 와일드카드 전체 설치·명시 prj-memory-explain 단독 설치·목록·정확한 이름 제거와 생성물 bytes를 대조했다. T02의 각9개 단독/전체 링크·복사 검사와 T04 새 회귀는 소유 temp에서 실행했고 개인 설치를 갱신하지 않았다.

각 단독 설치는 자기 안의 필수 Markdown/anchor를 해소한다. source ID는 기존 내부 주소이고 source9개와 CodeBurn의 internal 표시는 기본 CLI 후보에서 숨긴다. 명시 internal 선택/환경 opt-in은 공식 설치 범위 밖이며 보안 경계가 아니다. CodeBurn descriptor의 internal 두 줄 외 runtime/업무 코드는 바꾸지 않았다.

full validator124/124, 오류0으로 통과했다. source/public frontmatter10/9개, 지원 링크2768개, 예제209개·HTML ID160개, 교육 메모리5개·격리 Git16개를 확인했다. 외부 URL/동적 placeholder/미지원 fragment와 실제 HTML 렌더링은 이 정적 성공에 포함하지 않는다. 리뷰 수정 후 독립 closure·재현성/readonly freshness·양쪽 autocrlf clone·실제 repo 설치와 최종 snapshot 회귀5/5도 통과했다.

## 실제 native 호출

| 호출 | Codex | Claude Code |
| :--- | :--- | :--- |
| prj-memory-explain 단독 | 기록 없음 설명, 생성 없음 | 기록 없음 설명, 생성 없음 |
| prj-memory-review 전체 설치 | 합성 average([])의 NaN finding, 무쓰기·테스트 없음 | 같은 요구 불일치 finding, 무쓰기·테스트 없음 |
| prj-grill-me 전체 설치 | 질문1개·선택지3개·추천·미확정, 저장 없음 | 같은 인터뷰 경계, 저장 없음 |

설치된 전체 SKILL과 적용 공통 참조·변경된 Skill Installation and Workspace 절의 실제 성공 출력에 근거한다. Codex app-server의 project 발견은 전체9개/단독1개, Claude init은 설명1개/리뷰·인터뷰9개였다. 양쪽 설치 위치와 사용자 프로젝트 .memory를 구분하고 fixture 파일/빈 디렉터리·Git head/index/status·source payload의 전후 동등성을 확인했다.

삭제 전 검증 build SHA는1134b48a579411923362edf22dae73e5df8e9b86f4087d2391f5850724b82d70이었다. 이후 리뷰에서 개발용 validation-scope 안내를 수정해 sourceSnapshot/build SHA가 바뀌었다. 그 문서는 public closure에 포함되지 않아 실제 설치 문서285개는 전부 동일하며, native6건을 동일 bytes의 근거로 재사용했다. 옛 결과를 새 파일 호출로 바꾸지 않았다.

## 실제 발동 측정

2026-11-03 `node scripts/measure-skill-routing.mjs --model claude-sonnet-5-5 --runs 3`으로 실제 모델이 고르는 스킬을 측정했다. 실행은 `--skill` 묶음 5개로 나눴다.

| 항목 | 실제 확인 범위 |
| :--- | :--- |
| 호스트·모델 | Claude Code 2.1.317 headless(`claude -p`), claude-sonnet-5-5 |
| 설치 | skills CLI 1.7.4로 소유 임시 프로젝트에 public 9개만 project scope 설치, 외부 팩 없음 |
| 문장 | `evals/routing/*.json`의 `measure` 한국어 문장 29개(positive 18, negative 11), 문장당 3회, 총 87회 |
| 실행 구성 | Skill 도구만 허용, 문장은 stdin 전달, 사용자 설정·plugin 설정·MCP·hooks 차단. 호스트 기본 명령과 번들 스킬은 보임. 당시에는 상위 세션의 환경 변수를 그대로 넘겼다(아래 "측정 당시 조건") |
| 결과 | 87회 모두 완료. positive 53/54 발동(문장별 최저 2/3), negative 자기 스킬 오발동 0/33 |
| 비용 | Claude Code가 보고한 API 요금 환산 $2.73 |

- 발동률이 절반 미만인 positive와 오발동한 negative는 없었다. 측정에 맞춰 description을 바꾸지 않았다.
- 호스트 번들 스킬과 겹침:
  - 대시보드 시각화 요청 3회 모두 Claude Code 번들 `dataviz`가 켜졌다. `prj-visualize`는 그중 1회만 함께 켜졌다.
  - 작업 재개 요청 1회에는 번들 `update-config`가 함께 켜졌다.
  - 공존 안내는 [설치 안내](skills-installation.md)의 "다른 스킬과 함께 쓸 때" 절에 있다.
- 대상 내용 없이 요청만 받은 일부 negative(diff 리뷰, 회의록 인포그래픽)는 owner 스킬도 켜지지 않았다.
- 측정 당시 조건(2026-11-04 확인, 결과는 바꾸지 않음):
  - 측정은 Claude Code 세션 안에서 실행했고, 측정 도구는 그 세션의 환경 변수를 자식 `claude`에 그대로 넘겼다.
  - 그래서 `CLAUDE_CODE_PLUGIN_DIRS`로 지정된 inline plugin(`orca-agent-view`)이 자식에도 로드됐을 가능성이 높다. 이 plugin은 빈 `enabledPlugins`로는 꺼지지 않는다.
  - 당시 원본 init은 지워져 확인할 수 없다. 같은 방식으로 실행한 행동 eval 첫 실행에서는 로드가 관측됐다.
  - hooks는 꺼져 있었고, 이 plugin은 스킬·명령을 더하지 않았다.
  - effort는 기본값이었을 가능성이 높다. 공식 문서상 effort 입력은 `CLAUDE_CODE_EFFORT_LEVEL`이고, 같은 세션 환경에서 이 변수는 설정되어 있지 않았다. `CLAUDE_EFFORT`는 하위 프로세스에 현재 값을 알리는 출력 변수다.
  - 재측정은 하지 않았다(사용자 결정).
  - 지금 측정 도구는 상위 에이전트 세션의 변수(`CLAUDECODE`, `CLAUDE_*`, `ORCA_*`)를 넘기지 않는다. 로그인·제공자 변수는 남긴다.
- 한계:
  - 발동은 확률적이다. 모델, Claude Code, skills CLI 버전에 따라 달라진다.
  - Skill 도구만 허용한 headless 구성이라 일반 대화와 다를 수 있다.
  - 외부 팩 공존은 측정하지 않았다.
  - Codex는 실행 출력에 스킬 호출 이벤트가 없어 자동 측정하지 않았다. SKILL.md를 읽는 shell 명령만 보이며, 이것은 발동과 같지 않다.
- 회귀 검사(`node scripts/validate-skills.mjs`)는 모델을 호출하지 않는다. 측정 방법과 산출물 위치는 [Validation Scope](../.agents/skills/memory-execute/references/validation-scope.md#on-demand-routing-measurement)에 있다.

### 2026-11-04 prj-memory-tidy 추가 뒤 측정

공개 스킬이 10개가 된 뒤(0.6.0) `node scripts/measure-skill-routing.mjs --model claude-sonnet-5-5 --runs 3 --skill prj-memory-tidy --skill prj-memory-explain --skill prj-memory-execute --skill prj-memory-review`로 한 번에 측정했다. 측정 범위와 비용은 실행 전에 사용자에게 확인받았다.

| 항목 | 실제 확인 범위 |
| :--- | :--- |
| 호스트·모델 | Claude Code 2.1.318 headless(`claude -p`), claude-sonnet-5-5 |
| 설치 | skills CLI 1.7.4로 소유 임시 프로젝트에 public 10개만 project scope 설치, 외부 팩 없음 |
| 문장 | tidy·explain·execute·review의 `measure` 한국어 문장 16개(positive 8, negative 8), 문장당 3회, 총 48회. negative 중 3개는 owner가 tidy다(explain·execute·review case에 하나씩) |
| 실행 구성 | Skill 도구만 허용, 문장은 stdin 전달, 사용자 설정·plugin 설정·MCP·hooks 차단. 상위 에이전트 세션의 변수(`CLAUDECODE`, `CLAUDE_*`, `ORCA_*`)는 넘기지 않았다. 호스트 기본 명령과 번들 스킬은 보였지만 켜진 경우는 없었다 |
| 결과 | 48회 모두 완료. positive 24/24 발동(문장마다 3/3), negative 자기 스킬 오발동 4/24 |
| 비용 | Claude Code가 보고한 API 요금 환산 $1.78(48회 모두 보고) |

- tidy:
  - positive 2개는 모두 3/3 발동했다.
  - tidy case의 negative 2개(결정 이유 설명은 explain 소관, Task를 끝내며 그 Task의 작업 파일 정리는 execute 소관)에서 tidy는 0/6이었다. owner는 각각 3/3 켜졌다.
  - explain·execute·review case에 넣은 tidy owner negative 3개에서는 tidy가 9/9 켜졌다.
- 오발동(개선 후보로만 기록하고 description은 바꾸지 않았다):
  - explain: ".memory 전체를 점검해서 남은 작업 파일 목록을 보여 줘."(owner tidy)에서 3/3 켜졌다. 같은 실행에서 tidy도 3/3 켜졌다.
  - explain: "새로운 캐시 정책을 결정해야 해. 질문하면서 정해 줘."(owner grill-me)에서 1/3 켜졌다. grill-me는 3/3 켜졌다. 2026-11-03 측정에서는 이 문장의 오발동이 없었다.
  - execute·review case의 tidy owner negative에서는 자기 스킬 오발동이 없었다.
- 함께 켜진 경우: execute positive "현재 작업 이어서 진행해 줘." 3회 중 1회에 explain이 함께 켜졌다.
- execute case의 "이 diff만 읽기 전용으로 리뷰해서 문제점만 알려줘."(owner review)에서는 2회 아무 스킬도 켜지지 않았고 1회 review가 켜졌다. 2026-11-03의 관측(대상 내용 없는 diff 리뷰 요청)과 비슷하다.
- 한계:
  - 2026-11-03 측정과 범위, Claude Code 버전, 환경 변수 조건이 다르다. 두 결과를 그대로 비교하지 않는다.
  - 문장당 3회라 1/3 차이는 우연과 구분하지 못한다.
  - 나머지 공개 스킬(grill-me·intake·plan·wiki·page-capture·visualize)은 이번에 다시 재지 않았다.
  - 위 측정의 한계(확률적 발동, Skill 전용 headless, 외부 팩 미측정, Codex 미측정)는 같다.

### 2026-11-05 prj-memory-explain 제외 문구 측정

explain description 끝에 "Not for auditing or cleaning up .memory files; use memory-tidy."를 더한 뒤(0.6.1) `node scripts/measure-skill-routing.mjs --model claude-sonnet-5-5 --runs 3 --skill prj-memory-explain --skill prj-memory-tidy`로 측정했다. 2026-11-04 측정에서 explain이 `.memory` 점검 요청에도 함께 켜진 것을 줄이려는 변경이다. 측정 범위와 비용은 실행 전에 사용자에게 확인받았다.

| 항목 | 실제 확인 범위 |
| :--- | :--- |
| 호스트·모델 | Claude Code 2.1.318 headless(`claude -p`), claude-sonnet-5-5 |
| 설치 | skills CLI 1.7.4로 소유 임시 프로젝트에 public 10개만 project scope 설치, 외부 팩 없음 |
| 문장 | explain·tidy의 `measure` 한국어 문장 8개(positive 4, negative 4), 문장당 3회, 총 24회 |
| 실행 구성 | 2026-11-04 측정과 같다(Skill 도구만 허용, 문장은 stdin 전달, 사용자 설정·plugin 설정·MCP·hooks 차단, 상위 에이전트 세션 변수 미전달) |
| 결과 | 24회 모두 완료. positive 12/12 발동, negative 자기 스킬 오발동 2/12 |
| 비용 | Claude Code가 보고한 API 요금 환산 $1.33(24회 모두 보고) |

| 문장 | owner | 2026-11-04 | 2026-11-05 |
| :--- | :--- | :--- | :--- |
| explain positive "D05 결정이 왜 나왔고 어디에 적용되는지 설명해 줘." | 없음 | explain 3/3 | explain 3/3 |
| explain positive "지금까지 진행 상황이랑 계획 대비 실제 결과를 비교해서 알려줘." | 없음 | explain 3/3 | explain 3/3 |
| explain negative "새로운 캐시 정책을 결정해야 해. 질문하면서 정해 줘." | grill-me | explain 1/3, grill-me 3/3 | explain 0/3, grill-me 3/3 |
| explain negative ".memory 전체를 점검해서 남은 작업 파일 목록을 보여 줘." | tidy | explain 3/3, tidy 3/3 | explain 2/3, tidy 3/3 |
| tidy positive ".memory에 남은 작업 파일이나 인용되지 않은 파일이 있는지 점검해 줘." | 없음 | tidy 3/3 | tidy 3/3 |
| tidy positive ".memory 점검 목록에서 내가 승인한 작업 파일만 정리해 줘." | 없음 | tidy 3/3 | tidy 3/3(1회는 호스트 기본 스킬 `update-config`도 켜짐) |
| tidy negative "이 결정을 선택한 이유를 기록에서 찾아 설명해 줘." | explain | tidy 0/3, explain 3/3 | tidy 0/3, explain 3/3 |
| tidy negative "현재 Task를 끝내면서 그 Task의 작업 파일도 정리해 줘." | execute | tidy 0/3, execute 3/3 | tidy 0/3, execute 3/3 |

- 판정: 채택. 측정 전에 정한 조건을 모두 충족했다.
  - 결정적 발동 검사(`tests/skill-routing.test.mjs`)를 통과했다(실패 0, 경고 없음). explain~tidy description 유사도는 0.109에서 0.217로 올랐다.
  - 24회가 모두 완료됐다.
  - tidy owner 문장의 explain 오발동이 3/3에서 2/3으로, explain negative 오발동 합계가 4/6에서 2/6으로 줄었다.
  - explain positive 6/6과 tidy positive 6/6을 유지했다.
- 한계:
  - 문장당 3회라 1/3 차이는 우연과 구분하지 못한다. tidy 점검 요청에서 explain은 여전히 3회 중 2회 함께 켜진다.
  - explain·tidy 밖의 스킬 묶음(예: execute positive에서 explain이 함께 켜지던 2026-11-04 관측)은 다시 재지 않았다.
  - 위 측정의 한계(확률적 발동, Skill 전용 headless, 외부 팩 미측정, Codex 미측정)는 같다.

## 관측 실패와 한계

- 최초 Claude 호출은 넓은 Glob 결과가100/110개로 잘려 strict scope parser가 실패로 판정했다. 원 결과를 보존하고 좁은 조회를 명시한 별도6건을 통과시켰다. 실패를 parser 완화로 통과시키지 않았다.
- Codex 기본 PowerShell 읽기는 한글 mojibake가 생겨 UTF8로 다시 읽었다. Get-FileHash 부재는 읽기 전용 .NET SHA로 보완했다. 부모가 실제 명령/UTF8 출력과 설치 문서를 대조했으며 모델의 경로 언급만으로 읽기 성공을 인정하지 않았다.
- Claude는 project source와 Read/Glob/Grep/Skill allowlist, 쓰기/쉘/위임/network deny, hooks/auto memory/MCP 제한으로 시험했다. restricted 모드는 파일 기반 스킬을 숨겨 사용하지 않았다. 상속된 orca-agent-view 등 런타임 확장은 관측돼 모든 plugin 비활성화를 주장하지 않는다. 이 관측은 상위 세션의 환경 변수를 그대로 넘기던 때의 조건이다. 2026-11-04부터 native 확인은 상위 에이전트 세션의 변수(`CLAUDECODE`, `CLAUDE_*`, `ORCA_*`)를 넘기지 않는다. 로그인·제공자 변수는 남기며, 다시 실행해 확인하지는 않았다.
- 기존 로그인은 native CLI가 사용했으며 인증 파일을 복제하지 않았다. native CLI는 자체 runtime/개인 metadata를 기록할 수 있다. fixture/Git/payload 보존은 시스템 전체의 무쓰기나 개인 상태 전체 보존을 뜻하지 않는다.
- 다른 OS/CLI 버전, global native 호출, 모든9개 workflow의 실제 수행·UI/PNG·전체 commit recovery, 공개 주소 설치·remote update·무인 갱신은 미검증이다. 최신 CLI의 동작 변경은 별도 확인한다. 시험1.7.4의 check는 update alias이므로 읽기 전용 검사로 권장하지 않는다.
