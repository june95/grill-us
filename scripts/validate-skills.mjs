import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const tempPrefix = 'grill-skills-check-';
// WHATWG MIME Sniffing의 JavaScript MIME type essence 목록.
// https://mimesniff.spec.whatwg.org/#javascript-mime-type
const javaScriptMimes = new Set([
  'application/ecmascript', 'application/javascript', 'application/x-ecmascript', 'application/x-javascript',
  'text/ecmascript', 'text/javascript', 'text/javascript1.0', 'text/javascript1.1',
  'text/javascript1.2', 'text/javascript1.3', 'text/javascript1.4', 'text/javascript1.5',
  'text/jscript', 'text/livescript', 'text/x-ecmascript', 'text/x-javascript'
]);

/** @typedef {{check:string,file:string|null,line:number|null,message:string,severity:'error'|'info'}} Diagnostic */
/** @typedef {{checked:number,skipped:number,diagnostics:Diagnostic[]}} CheckResult */
const result = () => ({ checked: 0, skipped: 0, diagnostics: [] });
function diagnostic(out, check, file, line, message, severity = 'error') {
  out.diagnostics.push({ check, file, line, message, severity });
  if (severity === 'info') out.skipped++;
}
const within = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};
const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;

/** 정해진 문서 디렉터리만 탐색하며 심볼릭 링크를 따라가지 않는다. */
export function collectDocuments(root) {
  const files = [];
  for (const name of ['AGENTS.md', 'README.md']) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) throw new Error(`필수 문서 없음: ${name}`);
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error(`문서 심볼릭 링크는 탐색하지 않음: ${name}`);
    files.push(file);
  }
  function walk(directory) {
    if (!fs.existsSync(directory)) return;
    if (fs.lstatSync(directory).isSymbolicLink()) throw new Error(`문서 디렉터리 심볼릭 링크: ${directory}`);
    if (!within(fs.realpathSync(root), fs.realpathSync(directory))) throw new Error(`문서 디렉터리가 저장소 밖을 가리킴: ${directory}`);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (['node_modules', '.git', '.memory', '.codeburn'].includes(entry.name)) continue;
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`문서 범위의 심볼릭 링크: ${file}`);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && file.endsWith('.md')) files.push(file);
    }
  }
  walk(path.join(root, 'examples'));
  walk(path.join(root, '.agents', 'skills'));
  return files.sort();
}

/** 필수 frontmatter scalar만 읽으며 범용 YAML 해석을 시도하지 않는다. */
function requiredScalar(raw) {
  const value = raw.trim();
  if (!value || value.startsWith('#')) return '';
  if (value.startsWith('"') || value.startsWith("'")) {
    const quote = value[0];
    for (let i = 1; i < value.length; i++) {
      if (quote === '"' && value[i] === '\\') { i++; continue; }
      if (value[i] !== quote) continue;
      if (quote === "'" && value[i + 1] === "'") { i++; continue; }
      if (value.slice(i + 1).trim() && !/^\s+#/.test(value.slice(i + 1))) throw new Error('인용 문자열 뒤의 지원하지 않는 값');
      const quoted = value.slice(0, i + 1);
      if (quote === "'") return quoted.slice(1, -1).replace(/''/g, "'");
      try { return JSON.parse(quoted); }
      catch { throw new Error('큰따옴표 문자열은 JSON escape 형식만 지원'); }
    }
    throw new Error('닫히지 않은 인용 문자열');
  }
  const plain = value.replace(/\s+#.*$/, '').trim();
  if (/^(?:null|~|true|false|yes|no|on|off|[-+]?(?:\d[\d_]*(?:\.[\d_]*)?|\.[\d_]+)(?:e[-+]?\d+)?|[-+]?\.inf|\.nan|0[xob][\da-f_]+)$/i.test(plain)) {
    throw new Error('필수 필드는 문자열이어야 함; 숫자·boolean·null은 인용 필요');
  }
  if (/^[\[\]{}&*!|>"'%@`]|^-(?:\s|$)|:(?:\s|$)/.test(plain)) throw new Error('지원하지 않는 필수 필드 scalar 표현');
  return plain;
}

/** 스킬 필수 필드·폴더 식별자와 중복 이름을 문서 위치에 대응한다. */
export function checkSkillFrontmatter(root, files) {
  const out = result();
  const names = new Map();
  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    if (!relative.startsWith('.agents/skills/') || path.basename(file) !== 'SKILL.md') continue;
    out.checked++;
    const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
    if (!/^---[ \t]*$/.test(lines[0])) {
      diagnostic(out, 'frontmatter', file, 1, '문서 시작에 frontmatter --- 필요'); continue;
    }
    const end = lines.findIndex((line, index) => index > 0 && /^---[ \t]*$/.test(line));
    if (end === -1) { diagnostic(out, 'frontmatter', file, 1, 'frontmatter 종료 --- 없음'); continue; }
    const fields = new Map();
    for (let i = 1; i < end; i++) {
      const match = lines[i].match(/^(name|description)[ \t]*:[ \t]*(.*)$/);
      if (!match) continue;
      const [, key, raw] = match;
      const fieldLine = i + 1;
      if (fields.has(key)) { diagnostic(out, 'frontmatter', file, fieldLine, `${key} top-level 필드 중복`); continue; }
      fields.set(key, { line: fieldLine, value: null });
      try {
        const block = raw.trim().match(/^([>|])[+-]?(?:[ \t]+#.*)?$/);
        let value;
        if (block) {
          if (key !== 'description') throw new Error('block scalar는 description에서만 지원');
          const body = [];
          let indent;
          while (i + 1 < end && (/^[ \t]/.test(lines[i + 1]) || !lines[i + 1].trim())) {
            const next = lines[++i];
            if (!next.trim()) { body.push(''); continue; }
            if (/^ *\t/.test(next)) throw new Error('block 들여쓰기에 tab 사용 불가');
            const width = next.match(/^ */)[0].length;
            if (indent === undefined) indent = width;
            if (width < indent) throw new Error('block scalar 들여쓰기 불일치');
            body.push(next.slice(indent));
          }
          value = body.join(block[1] === '|' ? '\n' : ' ');
        } else {
          value = requiredScalar(raw);
          if (i + 1 < end && /^[ \t]+\S/.test(lines[i + 1])) throw new Error('필수 scalar의 들여쓴 continuation은 block 형식 필요');
        }
        if (!value.trim()) throw new Error(`${key} 문자열이 비어 있음`);
        fields.set(key, { line: fieldLine, value: value.trim() });
      } catch (error) { diagnostic(out, 'frontmatter', file, fieldLine, `${key}: ${error.message}`); }
    }
    for (const key of ['name', 'description']) {
      if (!fields.has(key)) diagnostic(out, 'frontmatter', file, 1, `${key} top-level 필드 없음`);
    }
    const name = fields.get('name');
    if (name?.value) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name.value)) diagnostic(out, 'frontmatter', file, name.line, 'name은 lower kebab-case 식별자여야 함');
      if (name.value !== path.basename(path.dirname(file))) diagnostic(out, 'frontmatter', file, name.line, 'name과 스킬 디렉터리명 불일치');
      if (names.has(name.value)) diagnostic(out, 'frontmatter', file, name.line, `스킬 name 중복: ${name.value}; 최초 ${path.relative(root, names.get(name.value))}`);
      else names.set(name.value, file);
    }
  }
  return out;
}

/** fence 문자·길이·들여쓰기를 보존해 중첩된 예제의 경계를 구분한다. */
export function readFences(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const fences = [];
  const outside = [...lines];
  let open = null;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (open) {
      outside[i] = '';
      if (match && match[2][0] === open.character && match[2].length >= open.length && match[1].length <= open.indent && !match[3].trim()) {
        fences.push({ ...open, content: open.body.join('\n'), closed: true });
        open = null;
      } else {
        const indent = Math.min(open.indent, lines[i].match(/^ */)[0].length);
        open.body.push(lines[i].slice(indent));
      }
    } else if (match) {
      let previous = i - 1;
      while (previous >= 0 && !lines[previous].trim()) previous--;
      open = {
        character: match[2][0], length: match[2].length, indent: match[1].length,
        language: match[3].trim().split(/\s+/)[0].toLowerCase(), line: i + 1,
        bodyLine: i + 2, preceding: lines[previous] || '', body: []
      };
      outside[i] = '';
    }
  }
  if (open) fences.push({ ...open, content: open.body.join('\n'), closed: false });
  return { fences, outside: outside.join('\n') };
}

// 링크처럼 보이는 inline code는 같은 길이의 공백으로 지워 위치를 유지한다.
function withoutInlineCode(text) {
  return text.replace(/(`+)([\s\S]*?)\1/g, match => match.replace(/[^\n]/g, ' '));
}

/** 괄호가 있는 경로와 angle-bracket 경로/공백/선택적 제목을 읽는다. */
function inlineDestination(text, start) {
  let depth = 1, quote = null, angle = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (char === '\n') return null;
    if (char === '\\') { i++; continue; }
    if (quote) { if (char === quote) quote = null; continue; }
    if (angle) { if (char === '>') angle = false; continue; }
    if (char === '<') { angle = true; continue; }
    if ((char === '"' || char === "'") && /\s/.test(text[i - 1])) { quote = char; continue; }
    if (char === '(') depth++;
    if (char === ')' && --depth === 0) {
      const body = text.slice(start, i).trim();
      const angled = body.match(/^<([^>]+)>/);
      return { target: angled ? angled[1] : body.replace(/\s+["'][\s\S]*$/, ''), end: i + 1 };
    }
  }
  return null;
}

export function checkLinks(root, files) {
  const out = result();
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const { fences, outside } = readFences(source);
    for (const fence of fences) {
      const examples = [...fence.content.matchAll(/\[[^\]]*\]\([^)]+\)/g)].length;
      if (examples) {
        const template = file.split(path.sep).join('/').endsWith('/memory-execute/references/templates.md');
        diagnostic(out, 'links', file, fence.line, `${template ? '템플릿 placeholder/가상 경로' : 'fence 안 예시'} 링크 ${examples}개 제외`, 'info');
      }
    }
    let text = withoutInlineCode(outside);
    const references = new Map();
    for (const m of text.matchAll(/^[ \t]*\[([^\]]+)\]:[ \t]*(<[^>]+>|\S+).*$/gm)) {
      references.set(m[1].trim().toLowerCase(), m[2].replace(/^<|>$/g, ''));
    }
    text = text.replace(/^[ \t]*\[[^\]]+\]:[^\n]*$/gm, match => ' '.repeat(match.length));
    function verify(target, offset) {
      const line = lineAt(text, offset);
      if (!target || target.startsWith('#')) {
        diagnostic(out, 'links', file, line, '문서 내부 anchor 제외', 'info'); return;
      }
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) {
        diagnostic(out, 'links', file, line, '외부 URL/프로토콜 제외', 'info'); return;
      }
      if (/[{}]/.test(target) || /<[^>]+>/.test(target)) {
        diagnostic(out, 'links', file, line, '동적 placeholder 경로 제외', 'info'); return;
      }
      let local;
      try { local = decodeURIComponent(target.split('#')[0]).replace(/\\([ ()[\]<>\\])/g, '$1'); }
      catch { diagnostic(out, 'links', file, line, `잘못된 경로 percent encoding: ${target}`); return; }
      const absolute = path.resolve(path.dirname(file), local);
      if (!within(root, absolute)) {
        diagnostic(out, 'links', file, line, '저장소 밖 경로 제외', 'info'); return;
      }
      out.checked++;
      if (!fs.existsSync(absolute)) diagnostic(out, 'links', file, line, `링크 대상 없음: ${target}`);
      else if (!within(fs.realpathSync(root), fs.realpathSync(absolute))) {
        diagnostic(out, 'links', file, line, '저장소 밖 심볼릭 링크 대상 제외', 'info');
      }
    }
    const used = [];
    for (const m of text.matchAll(/!?\[[^\]\n]*\]\(/g)) {
      const parsed = inlineDestination(text, m.index + m[0].length);
      if (!parsed) { diagnostic(out, 'links', file, lineAt(text, m.index), '닫히지 않은 링크'); continue; }
      used.push([m.index, parsed.end]);
      verify(parsed.target, m.index);
    }
    for (const m of text.matchAll(/!?\[([^\]\n]+)\](?:\[([^\]\n]*)\])?/g)) {
      if (used.some(([a, b]) => m.index >= a && m.index < b)) continue;
      const key = (m[2] || m[1]).trim().toLowerCase();
      if (m[2] !== undefined && !references.has(key)) diagnostic(out, 'links', file, lineAt(text, m.index), `reference 정의 없음: ${key}`);
      else if (references.has(key)) verify(references.get(key), m.index);
    }
  }
  return out;
}

/** 새 trailer와 과거 폴더명 형식을 대상의 정확한 Plan/Phase/Task에 대응한다. */
export function identifyMessage(message, target, { legacy = false } = {}) {
  const fields = {};
  for (const key of ['Plan', 'Phase', 'Task']) {
    const matches = [...message.matchAll(new RegExp(`^${key}:[ \\t]*(.+)$`, 'gm'))];
    if (matches.length !== 1) return { ok: false, reason: `${key} 식별자 누락 또는 중복` };
    fields[key] = matches[0][1].trim();
  }
  if (fields.Plan !== target.plan || fields.Phase !== target.phase) return { ok: false, reason: 'Plan/Phase 불일치' };
  if (fields.Task !== target.task && !(legacy && fields.Task === target.folder)) return { ok: false, reason: 'Task 식별자 불일치' };
  if (!legacy) {
    const paragraphs = message.trim().split(/\r?\n\s*\r?\n/);
    const tail = paragraphs.at(-1).split(/\r?\n/);
    if (paragraphs.length < 2) return { ok: false, reason: '본문과 trailer 사이의 빈 줄 필요' };
    if (tail.length !== 3 || tail.some(line => !/^(Plan|Phase|Task):\s*\S/.test(line))) return { ok: false, reason: '마지막 블록에 세 trailer 필요' };
  }
  return { ok: true, fields };
}

export function checkTaskMessages(root, files) {
  const out = result();
  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const template = relative === '.agents/skills/memory-execute/references/templates.md';
    if (!template && !/^examples\/.*\/task\.md$/.test(relative)) continue;
    out.checked++;
    const source = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const taskSection = template ? source.match(/^## Task\n([\s\S]*?)(?=^## Plan\n)/m) : null;
    const text = taskSection?.[1] || source;
    const lineOffset = taskSection ? lineAt(source, taskSection.index) : 0;
    const metadata = {};
    const metadataLines = {};
    let invalid = false;
    for (const key of ['Plan', 'Phase', 'Task']) {
      const values = [...text.matchAll(new RegExp(`^- ${key} ID: (.+)$`, 'gm'))];
      if (values.length !== 1) {
        diagnostic(out, 'messages', file, lineOffset + 1, `${key} metadata 누락/중복`); invalid = true;
      } else {
        metadata[key.toLowerCase()] = values[0][1].trim();
        metadataLines[key.toLowerCase()] = lineAt(text, values[0].index) + lineOffset;
      }
    }
    if (invalid) continue;
    if (!/^P\d{2}-T\d{2}$/.test(metadata.task)) diagnostic(out, 'messages', file, metadataLines.task, 'metadata Task ID는 P01-T01 형식이어야 함');
    if (!/^P\d{2}-.+/.test(metadata.phase)) diagnostic(out, 'messages', file, metadataLines.phase, 'metadata Phase ID 형식 오류');
    const location = relative.match(/^examples\/phases\/([^/]+)\/(P\d{2}-[^/]+)\/(T\d{2}-[^/]+)\/task\.md$/);
    if (!template && (!location || metadata.plan !== location[1] || metadata.phase !== location[2] || metadata.task !== `${location[2].slice(0, 3)}-${location[3].slice(0, 3)}`)) {
      diagnostic(out, 'messages', file, metadataLines.task, 'metadata와 Plan/Phase/Task 폴더 불일치');
    }
    const section = text.match(/^## Commit Message\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
    if (!section) { diagnostic(out, 'messages', file, lineOffset + 1, 'Commit Message 섹션 없음'); continue; }
    const fence = section[1].match(/(?:~~~|```)text\n([\s\S]*?)\n(?:~~~|```)/);
    const message = fence ? fence[1] : section[1].split('\n').filter(line => line.startsWith('    ') || !line).map(line => line.replace(/^ {4}/, '')).join('\n');
    const verdict = identifyMessage(message, metadata);
    if (!verdict.ok) diagnostic(out, 'messages', file, lineAt(text, section.index) + lineOffset, verdict.reason);
    if (template) diagnostic(out, 'messages', file, 1, '공통 템플릿은 식별자 구조만 검사; 가상 경로 존재 검사 제외', 'info');
  }
  return out;
}

// 인용된 다른 값 안의 id/src/type과 data-*는 실제 해당 속성이 아니다.
function htmlAttributes(text, positions) {
  const attributes = new Map();
  for (const m of text.matchAll(/([^ \t\n\f\r"'<>/=]+)(?:[ \t\n\f\r]*=[ \t\n\f\r]*(?:"([^"]*)"|'([^']*)'|([^ \t\n\f\r"'<>`=]+)))?/g)) {
    const key = m[1].toLowerCase();
    if (!attributes.has(key)) {
      attributes.set(key, m.slice(2).find(value => value !== undefined) || '');
      positions?.set(key, m.index);
    }
  }
  return attributes;
}

const namedIdReferences = new Map(Object.entries({ amp: '&', AMP: '&', lt: '<', LT: '<', gt: '>', GT: '>', quot: '"', QUOT: '"', apos: "'", nbsp: '\u00A0' }));
// HTML numeric character reference의 C1 치환표.
// https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-end-state
const numericIdReplacements = new Map([
  [0x80, 0x20AC], [0x82, 0x201A], [0x83, 0x0192], [0x84, 0x201E], [0x85, 0x2026], [0x86, 0x2020], [0x87, 0x2021],
  [0x88, 0x02C6], [0x89, 0x2030], [0x8A, 0x0160], [0x8B, 0x2039], [0x8C, 0x0152], [0x8E, 0x017D],
  [0x91, 0x2018], [0x92, 0x2019], [0x93, 0x201C], [0x94, 0x201D], [0x95, 0x2022], [0x96, 0x2013], [0x97, 0x2014],
  [0x98, 0x02DC], [0x99, 0x2122], [0x9A, 0x0161], [0x9B, 0x203A], [0x9C, 0x0153], [0x9E, 0x017E], [0x9F, 0x0178]
]);

/** 비교할 ID만 정규화하며 지원하지 않는 named reference는 진단용으로 반환한다. */
function decodeHtmlId(value) {
  const unknown = [...value.matchAll(/&([A-Za-z][A-Za-z0-9]+);/g)].find(m => !namedIdReferences.has(m[1]));
  if (unknown) return { unsupported: unknown[0] };
  return { value: value.replace(/&#(?:[xX][\da-fA-F]+|\d+);?|&(?:amp|AMP|lt|LT|gt|GT|quot|QUOT|nbsp)(?:;|(?![=A-Za-z0-9]))|&apos;/g, reference => {
    if (!reference.startsWith('&#')) return namedIdReferences.get(reference.slice(1).replace(/;$/, ''));
    const digits = reference.slice(2).replace(/;$/, '');
    let code = /^[xX]/.test(digits) ? Number.parseInt(digits.slice(1), 16) : Number.parseInt(digits, 10);
    if (code === 0 || code > 0x10FFFF || (code >= 0xD800 && code <= 0xDFFF)) code = 0xFFFD;
    return String.fromCodePoint(numericIdReplacements.get(code) || code);
  }) };
}

/** HTML fence마다 태그의 ID를 비교하고 raw-text·주석은 태그로 세지 않는다. */
export function checkHtmlIds(files) {
  const out = result();
  for (const file of files) {
    for (const fence of readFences(fs.readFileSync(file, 'utf8')).fences) {
      if (fence.language !== 'html') continue;
      if (!fence.closed) { diagnostic(out, 'html-ids', file, fence.line, '닫히지 않은 HTML fence'); continue; }
      const fragment = fence.preceding.match(/^\s*<!--\s*skill-check:\s*fragment\s*[—:-]\s*(.+?)\s*-->\s*$/);
      if (fragment && fragment[1].trim()) { diagnostic(out, 'html-ids', file, fence.line, `명시 fragment 제외: ${fragment[1].trim()}`, 'info'); continue; }
      if (/skill-check:\s*fragment/.test(fence.preceding)) { diagnostic(out, 'html-ids', file, fence.line, 'fragment 제외에 구체적인 이유 필요'); continue; }
      const ids = new Map();
      const html = fence.content;
      const tags = /<!--[\s\S]*?(?:-->|$)|<![^>]*>|<\?[^>]*>|<\/?([a-z][^ \t\n\f\r/>]*)(?=[ \t\n\f\r/>])((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
      let tag;
      while ((tag = tags.exec(html))) {
        if (!tag[1] || tag[0].startsWith('</')) continue;
        const positions = new Map();
        const attributes = htmlAttributes(tag[2], positions);
        if (attributes.has('id')) {
          const line = fence.bodyLine + lineAt(html, tag.index + tag[1].length + 1 + positions.get('id')) - 1;
          const decoded = decodeHtmlId(attributes.get('id'));
          if (decoded.unsupported) diagnostic(out, 'html-ids', file, line, `지원하지 않는 named reference ${decoded.unsupported}; 이 ID 비교 제외`, 'info');
          else {
            out.checked++;
            if (ids.has(decoded.value)) diagnostic(out, 'html-ids', file, line, `중복 HTML id ${JSON.stringify(decoded.value)}; 최초 ${ids.get(decoded.value)}행`);
            else ids.set(decoded.value, line);
          }
        }
        const name = tag[1].toLowerCase();
        if (name === 'plaintext') break;
        if (['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes'].includes(name)) {
          const end = new RegExp(`</${name}(?=[ \\t\\n\\f\\r/>])(?:[^>"']|"[^"]*"|'[^']*')*>`, 'gi');
          end.lastIndex = tags.lastIndex;
          const close = end.exec(html);
          tags.lastIndex = close ? end.lastIndex : html.length;
        }
      }
    }
  }
  return out;
}

export function checkExamples(files) {
  const out = result();
  function parse(code, file, line, module = false) {
    out.checked++;
    try {
      if (module) {
        const syntax = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: code, encoding: 'utf8', timeout: 15000 });
        if (syntax.error || syntax.status !== 0) throw new Error(syntax.error?.message || syntax.stderr.trim());
      } else new vm.Script(code, { filename: `${file}:${line}` });
    }
    catch (error) { diagnostic(out, 'examples', file, line, `JavaScript 구문 오류: ${error.message}`); }
  }
  for (const file of files) {
    const { fences } = readFences(fs.readFileSync(file, 'utf8'));
    for (const fence of fences) {
      if (!fence.closed) { diagnostic(out, 'examples', file, fence.line, '닫히지 않은 코드 fence'); continue; }
      if (!['js', 'javascript', 'html'].includes(fence.language)) continue;
      const marker = fence.preceding.match(/^\s*<!--\s*skill-check:\s*fragment\s*[—:-]\s*(.+?)\s*-->\s*$/);
      if (marker && marker[1].trim()) {
        diagnostic(out, 'examples', file, fence.line, `명시 fragment 제외: ${marker[1].trim()}`, 'info'); continue;
      }
      if (/skill-check:\s*fragment/.test(fence.preceding)) {
        diagnostic(out, 'examples', file, fence.line, 'fragment 제외에 구체적인 이유 필요'); continue;
      }
      if (fence.language !== 'html') { parse(fence.content, file, fence.bodyLine); continue; }
      const html = fence.content.replace(/<!--[\s\S]*?-->/g, comment => comment.replace(/[^\n]/g, ' '));
      const scriptPattern = /<script(?=[\s>])((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi;
      const scripts = [...html.matchAll(scriptPattern)];
      const remainder = html.replace(scriptPattern, match => match.replace(/[^\n]/g, ' '));
      if (/<script(?=[\s>]|$)/i.test(remainder)) {
        diagnostic(out, 'examples', file, fence.line, '닫히지 않은 HTML script; 설명 조각이면 fragment 사유 필요');
      }
      if (!scripts.length && !/<script(?=[\s>]|$)/i.test(html)) diagnostic(out, 'examples', file, fence.line, 'HTML inline script 없음', 'info');
      for (const m of scripts) {
        const line = fence.bodyLine + lineAt(html, m.index) - 1;
        const attributes = htmlAttributes(m[1]);
        const type = (attributes.get('type') || '').trim().toLowerCase();
        if (attributes.has('src')) { diagnostic(out, 'examples', file, line, '외부 script src는 다운로드/실행하지 않음', 'info'); continue; }
        if (type === 'module') { parse(m[2], file, line, true); continue; }
        if (type && !javaScriptMimes.has(type)) {
          diagnostic(out, 'examples', file, line, `데이터 script (${type}) 제외`, 'info'); continue;
        }
        parse(m[2], file, line);
      }
    }
  }
  return out;
}

export function decodeIgnoreOutput(output) {
  if (!output) return new Map();
  const fields = output.split('\0');
  if (fields.pop() !== '' || fields.length % 4) throw new Error('잘못된 check-ignore NUL 필드');
  const records = new Map();
  for (let i = 0; i < fields.length; i += 4) {
    const [source, line, pattern, file] = fields.slice(i, i + 4);
    if (!source || !/^\d+$/.test(line) || !pattern || !file || records.has(file)) throw new Error('잘못된/중복 ignore record');
    records.set(file, { pattern, ignored: !pattern.startsWith('!') });
  }
  return records;
}

/** OS temp 바로 아래에서 이 실행이 소유한 경로만 정리한다. */
export function cleanupGitDirectory(directory) {
  if (fs.lstatSync(directory).isSymbolicLink()) throw new Error('임시 root 심볼릭 링크는 삭제하지 않음');
  const resolved = fs.realpathSync(directory);
  if (path.dirname(resolved) !== fs.realpathSync(os.tmpdir()) || !path.basename(resolved).startsWith(tempPrefix)) throw new Error('소유한 OS temp 경로가 아님');
  function check(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('임시 저장소의 심볼릭 링크는 정리하지 않음');
      if (entry.isDirectory()) check(path.join(directory, entry.name));
    }
  }
  check(resolved);
  fs.rmSync(resolved, { recursive: true });
}

export function checkGitCases() {
  const out = result();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), tempPrefix));
  const env = { ...process.env };
  // Windows의 대소문자 구분 없는 Git 환경 변수도 원본 repo를 가리키지 못하게 한다.
  for (const key of Object.keys(env)) {
    if (/^GIT_/i.test(key)) delete env[key];
  }
  env.GIT_CONFIG_NOSYSTEM = '1';
  env.GIT_CONFIG_GLOBAL = path.join(directory, 'global.gitconfig');
  fs.writeFileSync(env.GIT_CONFIG_GLOBAL, '');
  const git = (args, options = {}) => spawnSync('git', args, { cwd: directory, env, encoding: 'utf8', timeout: 15000, ...options });
  function requireSuccess(run) { if (run.error || run.status !== 0) throw new Error(run.error?.message || run.stderr || `Git exit ${run.status}`); return run.stdout; }
  function expect(condition, message) { if (!condition) throw new Error(message); }
  try {
    requireSuccess(git(['init', '-q']));
    fs.writeFileSync(path.join(directory, '.gitignore'), '*.txt\n!keep.txt\n\\!literal\nblocked/\n!blocked/keep.txt\nopened/\n!opened/\nopened/*\n!opened/keep.txt\n');
    const files = ['drop.txt', 'keep.txt', 'plain.md', '!literal', 'with space.txt', 'blocked/keep.txt', 'opened/keep.txt'];
    const expected = ['*.txt', '!keep.txt', null, '\\!literal', '*.txt', 'blocked/', '!opened/keep.txt'];
    for (const file of files) {
      fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
      fs.writeFileSync(path.join(directory, file), 'fixture\n');
    }
    const visible = requireSuccess(git(['ls-files', '--others', '--exclude-standard', '-z'])).split('\0');
    files.forEach((file, i) => {
      const run = git(['check-ignore', '-v', '-z', '--no-index', '--stdin'], { input: `${file}\0` });
      expect(!run.error && run.status === (expected[i] === null ? 1 : 0), `ignore 종료 코드: ${file}`);
      const record = decodeIgnoreOutput(run.stdout).get(file);
      expect((record?.pattern || null) === expected[i], `ignore 패턴: ${file}`);
      expect(visible.includes(file) === (!record || !record.ignored), `ignore/untracked 실제 결과: ${file}`);
      out.checked++;
    });
    const batch = git(['check-ignore', '-v', '-z', '--no-index', '--stdin'], { input: `${files.join('\0')}\0` });
    expect(!batch.error && batch.status === 0 && decodeIgnoreOutput(batch.stdout).size === 6, 'mixed NUL batch'); out.checked++;
    requireSuccess(git(['add', '--', 'keep.txt']));
    const tracked = git(['check-ignore', '-v', '-z', '--no-index', '--stdin'], { input: 'keep.txt\0' });
    expect(tracked.status === 0 && decodeIgnoreOutput(tracked.stdout).get('keep.txt')?.ignored === false, 'tracked 부정 예외'); out.checked++;
    const bad = git(['check-ignore', '--invalid-skill-check-option']);
    expect(bad.status > 1, 'Git 명령 오류 인식'); out.checked++;
    expect(Boolean(git(['status'], { cwd: path.join(directory, 'not-existing') }).error), '없는 cwd 오류 인식'); out.checked++;
    const target = { plan: '2026-09-30-project-memory-task-workflow', phase: 'P01-memory-workflow', task: 'P01-T04', folder: 'T04-docs-examples-validation' };
    const standard = `test(skills): fixture\n\nPlan: ${target.plan}\nPhase: ${target.phase}\nTask: ${target.task}\n`;
    const parsed = requireSuccess(git(['interpret-trailers', '--parse'], { input: standard }));
    expect(parsed.trim() === standard.split('\n\n')[1].trim() && identifyMessage(standard, target).ok, '표준 trailer 실제 파싱'); out.checked++;
    const legacy = `docs(memory): fixture\n\nPlan: ${target.plan}\nPhase: ${target.phase}\nTask: ${target.folder}\n\n- Old body after keys\n`;
    expect(requireSuccess(git(['interpret-trailers', '--parse'], { input: legacy })).trim() === '' && identifyMessage(legacy, target, { legacy: true }).ok, '과거 메시지 대응'); out.checked++;
    for (const wrong of [{ ...target, phase: 'P02-other' }, { ...target, folder: 'T04-other' }]) {
      expect(!identifyMessage(legacy, wrong, { legacy: true }).ok, '다른 Phase/slug 거부'); out.checked++;
    }
    expect(!identifyMessage(`${legacy}\nPlan: ${target.plan}\n`, target, { legacy: true }).ok, '중복 식별자 거부'); out.checked++;
  } catch (error) {
    diagnostic(out, 'git', null, null, error.message);
  } finally {
    try { cleanupGitDirectory(directory); }
    catch (error) { diagnostic(out, 'git', null, null, `임시 경로 보존: ${directory}; ${error.message}`); }
  }
  return out;
}

export function main({ root = projectRoot, runRegressionTests = true } = {}) {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 13)) { console.error('Node.js 22.13.0 이상 필요'); return 1; }
  root = path.resolve(root);
  let failed = false;
  if (runRegressionTests) {
    const suite = spawnSync(process.execPath, ['--test', path.join(projectRoot, 'tests', 'validate-skills.test.mjs')], { cwd: projectRoot, encoding: 'utf8', timeout: 60000 });
    process.stdout.write(suite.stdout || '');
    if (suite.error || suite.status !== 0) {
      console.error(suite.error?.message || suite.stderr || '회귀 검사 실패'); failed = true;
    }
  }
  try {
    const files = collectDocuments(root);
    const checks = {
      frontmatter: checkSkillFrontmatter(root, files), links: checkLinks(root, files), messages: checkTaskMessages(root, files),
      examples: checkExamples(files), 'html-ids': checkHtmlIds(files), git: checkGitCases()
    };
    console.log(`Documents: ${files.length}`);
    for (const [name, out] of Object.entries(checks)) {
      const errors = out.diagnostics.filter(d => d.severity === 'error').length;
      console.log(`${name}: checked=${out.checked}, skipped=${out.skipped}, errors=${errors}`);
      for (const d of out.diagnostics) {
        const location = d.file ? `${path.relative(root, d.file)}${d.line ? `:${d.line}` : ''}` : 'isolated Git';
        console.log(`[${d.severity === 'error' ? 'FAIL' : 'SKIP'} ${name}] ${location} ${d.message}`);
      }
      if (errors) failed = true;
    }
  } catch (error) { console.error(`FAIL: ${error.message}`); return 1; }
  console.log(failed ? 'Validation failed.' : 'Validation passed.');
  return failed ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  if (process.argv.length > 2) {
    console.error('사용법: node scripts/validate-skills.mjs (CLI 옵션 없음)');
    process.exitCode = 1;
  } else process.exitCode = main();
}
