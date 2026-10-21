// 전역 팝업 오픈 함수
function showPopup() {
    document.querySelector('.popup').classList.add('show');
}

// -----------------------------------------------------------------------------
// 공통 유틸리티 함수
// -----------------------------------------------------------------------------

/**
 * HTML 태그를 생성하는 함수
 */
function getElem(tagStr, content = '', attrStr = '') {
    const tags = tagStr.split('|');
    const attrs = attrStr ? attrStr.split('|') : [];

    let openTags = '';
    let closeTags = '';

    tags.forEach((tag, idx) => {
        const attr = attrs[idx] ? ` ${attrs[idx]}` : '';
        openTags += `<${tag}${attr}>`;
    });

    for (let i = tags.length - 1; i >= 0; i--) {
        closeTags += `</${tags[i]}>`;
    }

    return `${openTags}${content}${closeTags}`;
}

/**
 * 클립보드 복사 유틸리티
 */
function copy(str) {
    if (str.endsWith('\n')) {
        str = str.slice(0, -1);
    }

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(str).then(() => showPopup());
    } else {
        const t = document.createElement("textarea");
        document.body.appendChild(t);
        t.value = str;
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
        showPopup();
    }
    return str;
}

/**
 * 문자열 반복
 */
function strMul(str, num) {
    return str.repeat(num);
}

/**
 * 스네이크 케이스 -> 캐멀 케이스 변환
 */
function toCamelCase(str) {
    return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * HTML 정렬 (탭 들여쓰기, 태그는 속성이 길어도 한 줄 유지)
 */
function formatHtml(html) {
    const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    const INLINE = new Set(['a', 'abbr', 'b', 'br', 'button', 'code', 'del', 'em', 'font', 'i', 'img', 'input', 'ins', 'label', 'mark', 's', 'small', 'span', 'strong', 'sub', 'sup', 'textarea', 'u', 'wbr']);
    const RAW = new Set(['script', 'style', 'textarea', 'pre']);
    const AUTO_CLOSE = { li: ['li'], dt: ['dt', 'dd'], dd: ['dt', 'dd'], td: ['td', 'th'], th: ['td', 'th'], tr: ['td', 'th', 'tr'], option: ['option'] };

    // 태그 하나를 읽어 공백(줄바꿈 포함)을 한 칸으로 정리 (따옴표 안은 유지)
    const scanTag = (start) => {
        let out = '', quote = '', prev = '';
        for (let i = start; i < html.length; i++) {
            const ch = html[i];
            if (quote) {
                out += ch;
                if (ch === quote) quote = '';
            } else if (ch === '>') {
                out += ch;
                return { end: i + 1, text: out.replace(/ (\/?>)$/, '$1') };
            } else if ((ch === '"' || ch === "'") && prev === '=') {
                out += ch;
                quote = ch;
            } else if (/\s/.test(ch)) {
                if (!out.endsWith(' ')) out += ' ';
                continue;
            } else {
                out += ch;
            }
            prev = ch;
        }
        return null;
    };

    // 1. 파싱
    const root = { children: [] };
    const stack = [root];
    const top = () => stack[stack.length - 1];
    const tagRe = /<(\/?)([A-Za-z][^\s/>]*)/y;
    let text = '';
    let i = 0;
    const flushText = () => {
        if (text) top().children.push({ type: 'text', value: text });
        text = '';
    };

    while (i < html.length) {
        if (html[i] !== '<') {
            let j = html.indexOf('<', i);
            if (j < 0) j = html.length;
            text += html.slice(i, j);
            i = j;
            continue;
        }

        if (html.startsWith('<!--', i) || html[i + 1] === '!' || html[i + 1] === '?') {
            const isComment = html.startsWith('<!--', i);
            let j = html.indexOf(isComment ? '-->' : '>', i);
            j = j < 0 ? html.length : j + (isComment ? 3 : 1);
            flushText();
            top().children.push({ type: 'comment', value: html.slice(i, j) });
            i = j;
            continue;
        }

        tagRe.lastIndex = i;
        const m = tagRe.exec(html);
        const tag = m && scanTag(i);
        if (!tag) {
            text += '<';
            i++;
            continue;
        }

        flushText();
        const name = m[2];
        const lname = name.toLowerCase();
        i = tag.end;

        if (m[1]) {
            for (let k = stack.length - 1; k > 0; k--) {
                if (stack[k].lname === lname) {
                    stack[k].closed = true;
                    stack.length = k;
                    break;
                }
            }
            continue;
        }

        const autoClose = AUTO_CLOSE[lname] || [];
        while (stack.length > 1 && autoClose.includes(top().lname)) stack.pop();

        const node = { type: 'el', name, lname, open: tag.text, children: [], closed: false, void: false };
        top().children.push(node);

        if (VOID.has(lname) || tag.text.endsWith('/>')) {
            node.void = true;
        } else if (RAW.has(lname)) {
            const closeRe = new RegExp('</' + lname + '[\\s>]', 'gi');
            closeRe.lastIndex = i;
            const cm = closeRe.exec(html);
            const contentEnd = cm ? cm.index : html.length;
            node.raw = html.slice(i, contentEnd);
            node.closed = !!cm;
            const gt = cm ? html.indexOf('>', contentEnd) : -1;
            i = gt < 0 ? html.length : gt + 1;
        } else {
            stack.push(node);
        }
    }
    flushText();

    // 2. 출력
    const closeOf = n => (n.closed ? `</${n.name}>` : '');
    const collapse = s => s.replace(/[ \t\r\n\f]+/g, ' ');
    const trimSp = s => s.replace(/^ +| +$/g, '');
    const isFlat = n => n.type === 'text' || (n.type === 'el' && INLINE.has(n.lname) && n.children.every(isFlat));
    const flat = n => {
        if (n.type === 'text') return collapse(n.value);
        if (n.raw !== undefined) return n.open + n.raw + closeOf(n);
        return n.open + n.children.map(flat).join('') + closeOf(n);
    };
    const dedent = code => {
        const ls = code.replace(/\r/g, '').split('\n');
        while (ls.length && !ls[0].trim()) ls.shift();
        while (ls.length && !ls[ls.length - 1].trim()) ls.pop();
        const min = Math.min(...ls.filter(l => l.trim()).map(l => l.match(/^[ \t]*/)[0].length));
        return ls.map(l => l.slice(min).replace(/\s+$/, ''));
    };

    const renderEl = (n, depth) => {
        const ind = '\t'.repeat(depth);
        if (n.raw !== undefined) {
            if ((n.lname === 'script' || n.lname === 'style') && n.raw.trim()) {
                return [ind + n.open, ...dedent(n.raw).map(l => (l ? ind + '\t' + l : '')), ind + closeOf(n)];
            }
            return [ind + (n.lname === 'pre' ? flat(n) : n.open + closeOf(n))];
        }
        if (n.void) return [ind + n.open];
        if (n.children.every(isFlat)) {
            return [ind + n.open + trimSp(n.children.map(flat).join('')) + closeOf(n)];
        }
        const lines = [ind + n.open, ...render(n.children, depth + 1)];
        if (n.closed) lines.push(ind + closeOf(n));
        return lines;
    };

    const render = (nodes, depth) => {
        const ind = '\t'.repeat(depth);
        const lines = [];
        let run = [];
        const flushRun = () => {
            const s = trimSp(run.map(flat).join(''));
            if (s) lines.push(ind + s);
            run = [];
        };
        nodes.forEach(n => {
            if (isFlat(n)) {
                run.push(n);
                return;
            }
            flushRun();
            if (n.type === 'comment') lines.push(ind + n.value);
            else lines.push(...renderEl(n, depth));
        });
        flushRun();
        return lines;
    };

    return render(root.children, 0).join('\n');
}

/**
 * img 태그 src에 ?v=오늘날짜(YYYYMMDD) 추가/갱신 (같은 날짜면 _2, _3 ... 순번 증가)
 */
function addImgVersion(html) {
    const d = new Date();
    const today = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    const versionUrl = (url) => {
        const hashIdx = url.indexOf('#');
        const hash = hashIdx < 0 ? '' : url.slice(hashIdx);
        const base = hashIdx < 0 ? url : url.slice(0, hashIdx);

        const m = /([?&])v=([^&]*)/.exec(base);
        if (!m) return `${base}${base.includes('?') ? '&' : '?'}v=${today}${hash}`;

        const cur = /^(\d{8})(?:_(\d+))?$/.exec(m[2]);
        let next = today;
        if (cur && cur[1] === today) next = `${today}_${cur[2] ? Number(cur[2]) + 1 : 2}`;

        return base.slice(0, m.index) + `${m[1]}v=${next}` + base.slice(m.index + m[0].length) + hash;
    };

    return html.replace(/<img\b[^>]*>/gi, tag =>
        tag.replace(/(\ssrc\s*=\s*)(["'])(.*?)\2/i, (_, pre, q, url) => `${pre}${q}${versionUrl(url)}${q}`)
    );
}

/**
 * HTML 문법 검사 (태그 열기/닫기 짝, 속성 구문, 중복 id). 문제 목록을 문자열 배열로 반환
 * 반환 배열에는 tagCount(검사한 태그 수)와 edits(닫는 태그 오류의 자동 수정안 [{start, end, text, desc}])가 붙는다
 */
function validateHtml(html) {
    const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    const RAW = new Set(['script', 'style', 'textarea']);

    const lineStarts = [0];
    for (let k = 0; k < html.length; k++) if (html[k] === '\n') lineStarts.push(k + 1);
    const lineOf = (idx) => {
        let lo = 0, hi = lineStarts.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1;
        }
        return lo;
    };
    const pos = (idx) => `${lineOf(idx) + 1}행 ${idx - lineStarts[lineOf(idx)] + 1}열`;
    const lineIndent = (idx) => /^[ \t]*/.exec(html.slice(lineStarts[lineOf(idx)]))[0];

    const errors = [];
    const err = (idx, msg) => errors.push(`${pos(idx)} - ${msg}`);

    // 자동 수정안: 누락된 닫는 태그 삽입 / 짝 없는 닫는 태그 삭제
    const edits = [];
    const eofItems = []; // 파일 끝에 닫아야 할 요소 (안쪽 -> 바깥쪽 순)
    let noEofFix = false;
    const insertCloses = (items, at) => {
        const ls = lineStarts[lineOf(at)];
        const desc = `${pos(at)} 앞에 ${items.map(s => `</${s.name}>`).join('')} 추가`;
        if (!html.slice(ls, at).trim()) {
            edits.push({ start: ls, end: ls, text: items.map(s => `${lineIndent(s.idx)}</${s.name}>\n`).join(''), desc });
        } else {
            edits.push({ start: at, end: at, text: items.map(s => `</${s.name}>`).join(''), desc });
        }
    };
    const deleteTag = (start, endExcl, name) => {
        const ls = lineStarts[lineOf(start)];
        let le = html.indexOf('\n', endExcl);
        le = le < 0 ? html.length : le + 1;
        const desc = `${pos(start)} </${name}> 삭제`;
        if (!html.slice(ls, start).trim() && !html.slice(endExcl, le).trim()) edits.push({ start: ls, end: le, text: '', desc });
        else edits.push({ start, end: endExcl, text: '', desc });
    };

    // 태그 끝(>) 위치 찾기 (속성값 따옴표 안의 > 는 무시). 못 찾으면 -1
    const findTagEnd = (start) => {
        let quote = '', prev = '';
        for (let i = start; i < html.length; i++) {
            const ch = html[i];
            if (quote) {
                if (ch === quote) quote = '';
            } else if (ch === '>') {
                return i;
            } else if ((ch === '"' || ch === "'") && prev === '=') {
                quote = ch;
            } else if (/\s/.test(ch)) {
                continue;
            }
            prev = ch;
        }
        return -1;
    };

    // 속성 구문 검사
    const checkAttrs = (idx, tagName, body) => {
        const seen = new Set();
        const re = /\s*([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/y;
        let p = 0;
        let id = null;
        while (p < body.length) {
            const ws = /^\s*/.exec(body.slice(p))[0].length;
            if (p + ws >= body.length) break;
            if (body[p + ws] === '/' && p + ws === body.length - 1) break;
            re.lastIndex = p;
            const m = re.exec(body);
            if (!m) {
                err(idx, `<${tagName}> 속성 구문 오류: "${body.slice(p).trim().slice(0, 30)}"`);
                break;
            }
            const name = m[1].toLowerCase();
            if (seen.has(name)) err(idx, `<${tagName}> 속성 중복: ${name}`);
            seen.add(name);
            if (name === 'id') id = m[2] ?? m[3] ?? m[4];
            p = re.lastIndex;
            if ((m[2] !== undefined || m[3] !== undefined) && p < body.length && !/[\s\/]/.test(body[p])) {
                err(idx, `<${tagName}> 속성 사이에 공백 없음: ${name}`);
            }
        }
        return id;
    };

    const stack = []; // { lname, name, idx }
    const ids = new Map();
    let tagCount = 0;
    const tagRe = /<(\/?)([A-Za-z][^\s\/>]*)/y;
    let i = 0;

    while (i < html.length) {
        const lt = html.indexOf('<', i);
        if (lt < 0) break;
        i = lt;

        if (html.startsWith('<!--', i)) {
            const j = html.indexOf('-->', i + 4);
            if (j < 0) { err(i, '주석이 닫히지 않음 (-->)'); noEofFix = true; break; }
            i = j + 3;
            continue;
        }
        if (html[i + 1] === '!' || html[i + 1] === '?') {
            const j = html.indexOf('>', i);
            if (j < 0) { err(i, '선언(<! 또는 <?)이 닫히지 않음'); noEofFix = true; break; }
            i = j + 1;
            continue;
        }

        tagRe.lastIndex = i;
        const m = tagRe.exec(html);
        if (!m) {
            // 태그가 아닌 '<' (예: "a < b")
            i++;
            continue;
        }

        const end = findTagEnd(i);
        if (end < 0) {
            err(i, `<${m[2]} 태그가 닫히지 않았거나 속성 따옴표 짝이 맞지 않음`);
            noEofFix = true;
            const next = html.indexOf('<', i + 1);
            if (next < 0) break;
            i = next;
            continue;
        }

        tagCount++;
        const name = m[2];
        const lname = name.toLowerCase();
        const body = html.slice(i + m[0].length, end);
        const tagIdx = i;
        i = end + 1;

        if (m[1]) {
            // 닫는 태그
            if (body.trim()) err(tagIdx, `</${name}> 닫는 태그에 불필요한 내용: "${body.trim()}"`);
            const k = stack.map(s => s.lname).lastIndexOf(lname);
            if (VOID.has(lname)) {
                err(tagIdx, `</${name}> 빈 요소(void)는 닫는 태그를 쓸 수 없음`);
                deleteTag(tagIdx, end + 1, name);
            } else if (k < 0) {
                err(tagIdx, `</${name}> 여는 태그 없이 닫힘`);
                deleteTag(tagIdx, end + 1, name);
            } else {
                const missing = stack.slice(k + 1).reverse();
                missing.forEach(s => err(s.idx, `<${s.name}> 닫는 태그 없음 (${pos(tagIdx)}의 </${name}>에서 닫힘 처리)`));
                if (missing.length) insertCloses(missing, tagIdx);
                stack.length = k;
            }
            continue;
        }

        // 여는 태그
        const selfClosed = /\/\s*$/.test(body);
        const id = checkAttrs(tagIdx, name, body.replace(/\/\s*$/, ''));
        if (id) {
            if (ids.has(id)) err(tagIdx, `id 중복: "${id}" (${pos(ids.get(id))}에서 이미 사용)`);
            else ids.set(id, tagIdx);
        }

        if (VOID.has(lname) || selfClosed) continue;

        if (RAW.has(lname)) {
            const closeRe = new RegExp('</' + lname + '[\\s>]', 'gi');
            closeRe.lastIndex = i;
            const cm = closeRe.exec(html);
            if (!cm) {
                err(tagIdx, `<${name}> 닫는 태그 없음`);
                eofItems.push({ name, idx: tagIdx });
                break;
            }
            const gt = html.indexOf('>', cm.index);
            i = gt < 0 ? html.length : gt + 1;
            continue;
        }

        // 형제 요소가 이어질 때 앞 요소의 닫는 태그 누락 (예: <li>a<li>b)
        const SIBLING_CLOSES = { li: ['li'], dt: ['dt', 'dd'], dd: ['dt', 'dd'], td: ['td', 'th'], th: ['td', 'th'], tr: ['td', 'th', 'tr'], option: ['option'], p: ['p'] };
        const sibling = SIBLING_CLOSES[lname] || [];
        const unclosed = [];
        while (stack.length && sibling.includes(stack[stack.length - 1].lname)) unclosed.push(stack.pop());
        unclosed.forEach(s => err(s.idx, `<${s.name}> 닫는 태그 없음 (${pos(tagIdx)}의 <${name}> 앞에서 닫힘 처리)`));
        if (unclosed.length) insertCloses(unclosed, tagIdx);

        stack.push({ lname, name, idx: tagIdx });
    }

    stack.forEach(s => err(s.idx, `<${s.name}> 닫는 태그 없음`));
    eofItems.push(...stack.slice().reverse());
    if (!noEofFix && eofItems.length) {
        const endsNl = html.endsWith('\n');
        edits.push({
            start: html.length,
            end: html.length,
            text: (endsNl ? '' : '\n') + eofItems.map(s => `${lineIndent(s.idx)}</${s.name}>`).join('\n') + (endsNl ? '\n' : ''),
            desc: `문서 끝에 ${eofItems.map(s => `</${s.name}>`).join('')} 추가`
        });
    }

    errors.sort((a, b) => {
        const pa = a.match(/^(\d+)행 (\d+)열/), pb = b.match(/^(\d+)행 (\d+)열/);
        return pa[1] - pb[1] || pa[2] - pb[2];
    });
    errors.tagCount = tagCount;
    errors.edits = edits;
    return errors;
}

/**
 * 닫는 태그 오류 자동 수정 (누락된 닫는 태그는 감싸는 부모의 닫는 태그 직전에 삽입, 짝 없는 닫는 태그는 삭제)
 * 반환: { html: 수정된 HTML, fixes: 수정 내역 문자열 배열, remaining: 수정 후에도 남은 오류 배열 }
 */
function fixHtml(html) {
    const edits = validateHtml(html).edits;
    let out = html;
    edits
        .map((e, i) => ({ ...e, i }))
        .sort((a, b) => b.start - a.start || b.i - a.i)
        .forEach(e => { out = out.slice(0, e.start) + e.text + out.slice(e.end); });
    return { html: out, fixes: edits.map(e => e.desc), remaining: validateHtml(out) };
}

/**
 * 자주 사용하는 스크립트 템플릿 생성기
 */
function getSelectTcoString(nttQuery, imgQuery, tableQuery, aQuery) {
    return `async function searchTco(pageS, pageE) {
async function getDoc(url) {
console.log(url + ' 조회');
const res = await fetch(url);
if (!res.ok) throw new Error('문제가 발생 : ' + res.status);
const html = await res.text();
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');
return doc;
}

async function collectUrl(pageS, pageE) {
const nttSnList = [];
console.log('게시물 url 수집');
for(let i = pageS; i <= pageE; i++) {
    const url =\`\${location.origin}/\${$('input[name=sysId]').val()}/na/ntt/selectNttList.do?mi=\${$('input[name=mi]').val()}&bbsId=\${$('input[name=bbsId]').val()}&currPage=\${i}\`;
    const doc = await getDoc(url);
    const list = doc.querySelectorAll('${nttQuery}');
    for(let v of list){
        nttSnList.push(v.dataset.id);
    }
}
const uniqueList = [...new Set(nttSnList)];
return uniqueList.map(v => {
    return \`\${location.origin}/\${$('input[name=sysId]').val()}/na/ntt/selectNttInfo.do?mi=\${$('input[name=mi]').val()}&bbsId=\${$('input[name=bbsId]').val()}&nttSn=\${v}\`;
});
}

const urlList = await collectUrl(pageS, pageE);
const results = [];
console.log('게시물 내용 조회');
for(let i = 0; i < urlList.length; i++) {
try{
    const url = urlList[i];
    const doc = await getDoc(url);

    const imgCnt = doc.querySelectorAll('${imgQuery}').length;
    const tabCnt = doc.querySelectorAll('${tableQuery}').length;
    const aCnt = doc.querySelectorAll('${aQuery}').length;
    let result = "";
    if(imgCnt > 0 || tabCnt > 0 || aCnt > 0){
        result += '-------------------------------\\n'+url+'\\n';

        if(imgCnt > 0){
            result += \`\\nimg : \${imgCnt}\\n\`;
            const list = doc.querySelectorAll('${imgQuery}');
            for(var item of list){
                result += item.alt + '\\n--\\n';
            }
        }
        if(tabCnt > 0){
            result += \`\\ncaption (table : \${tabCnt})\\n\`;
            const list = doc.querySelectorAll('${tableQuery} caption');
            for(var item of list){
                result += item.innerText + '\\n';
            }
        }
        if(aCnt > 0){
            result += \`\\n_blank : \${aCnt}\\n\`;
            const list = doc.querySelectorAll('${aQuery}');
            for(var item of list){
                result += item.innerText + ' : ' + item.title + '\\n';
            }
        }

        results.push(result);
    }
}
catch(e){
    console.error(e);
}
}
console.log(results.length > 0 ? results.join('\\n') : '없음');
};
searchTco(1,5);`;
}

// -----------------------------------------------------------------------------
// 이벤트 라이프사이클 (DOM Ready)
// -----------------------------------------------------------------------------
$(function () {
    // 팝업 애니메이션 종료 이벤트 추가
    document.querySelector('.popup').addEventListener('animationend', function () {
        this.classList.remove('show');
    });

    // 검색 이벤트 추가
    $('#srchTxt').on('keyup', function () {
        const txt = $(this).val().toUpperCase().replaceAll(' ', '');
        if (txt === '') {
            $('ul.list a').css('color', '');
            return;
        }
        $('ul.list a').each((_, v) => {
            $(v).css('color', $(v).text().toUpperCase().includes(txt) ? 'red' : '');
        });
    });

    // 목차 동적 생성
    let liHtml = '';
    $('[class^=section]').each((i, v) => {
        const title = $(v).find('.secTit > h3').text();
        liHtml += getElem('li|a', `${i + 1}. ${title}`, `|href="#" data-id="${i}"`) + '\n';
        $(v).attr('id', `${i}`).hide();
    });
    $('body').prepend(getElem('ul', liHtml, 'class="list"'));

    // 컨텐츠 전환 로직
    function loadContent(id) {
        $('[class^=section]').hide();$('.list a').removeClass('active');
        if (id == -1) return;
        $(`.list a[data-id=${id}]`).addClass('active');
        $(`#${id}`).show();
    }

    // 목차 링크 클릭 이벤트
    $('.list').on('click', 'a', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        history.pushState({ page: id }, '', location.href);
        loadContent(id);
    });

    // 뒤로가기 / 앞으로가기 히스토리 이벤트
    window.addEventListener('popstate', function (e) {
        loadContent(e.state ? e.state.page : -1);
    });

    // -------------------------------------------------------------------------
    // 기능 버튼 이벤트 바인딩
    // -------------------------------------------------------------------------

    // Func 1: 중복 제거
    $('#btnFunc1').click(function () {
        const str = $('#taFunc1').val();
        const uniqueLines = Array.from(new Set(str.split('\n'))).join('\n') + '\n';
        $('#taFunc1').val(copy(uniqueLines));
    });

    // Func 2: 차집합 찾기
    $('#btnFunc2').click(function () {
        const op1 = $('#cbFunc2_1:checked').val();
        const op2 = $('#cbFunc2_2:checked').val();

        let arr1 = $('#taFunc2_1').val().split('\n').map(v => v.trim());
        let arr2 = $('#taFunc2_2').val().split('\n').map(v => v.trim());

        if (op1) {
            arr1 = arr1.map(v => v.replaceAll(' ', ''));
            arr2 = arr2.map(v => v.replaceAll(' ', ''));
        }
        if (op2) {
            arr1 = arr1.map(v => v.toUpperCase());
            arr2 = arr2.map(v => v.toUpperCase());
        }

        const set1 = new Set(arr1);
        const set2 = new Set(arr2);

        const diff1 = [...set1].filter(item => !set2.has(item));
        const diff2 = [...set2].filter(item => !set1.has(item));

        let html = getElem('p|strong', '입력1에만 있는 것');
        diff1.forEach(v => html += getElem('p', v));
        html += getElem('p|strong', '입력2에만 있는 것');
        diff2.forEach(v => html += getElem('p', v));

        $('#resultFunc2').empty().append(html).focus();
        showPopup();
    });

    // Func 3: Snake -> Camel
    $('#btnFunc3').click(function () {
        $('#taFunc3').val(copy(toCamelCase($('#taFunc3').val())));
    });

    // Func 4: Camel -> Snake
    $('#btnFunc4').click(function () {
        const data = $('#taFunc4').val();
        const result = data.replace(/([A-Z])/g, '_$1').toUpperCase();$('#taFunc4').val(copy(result));
    });

    // Func 5: Hidden Input 태그 생성
    $('#btnFunc5').click(function () {
        const lines = $('#taFunc5').val().split('\n');
        const result = lines.map(v => `<input type="hidden" id="${v}" name="${v}">`).join('\n') + '\n';
        $('#taFunc5').val(copy(result));
    });

    // Func 6: 좌우 감싸기
    $('#btnFunc6').click(function () {
        const prefix = $('#taFunc6_1').val();
        const lines = $('#taFunc6_2').val().split('\n');
        const suffix = $('#taFunc6_3').val();

        const result = lines.map(v => `${prefix}${v}${suffix}`).join('\n') + '\n';
        $('#taFunc6_2').val(result);
        copy(result);
    });

    // Func 7: 줄바꿈 연속 2개를 1개로
    $('#btnFunc7').click(function () {
        const result = $('#taFunc7').val().replaceAll('\n\n', '\n');
        $('#taFunc7').val(copy(result));
    });

    // Func 8: 웹접근성 테이블 이미지를 텍스트로
    $('#btnFunc8').click(function () {
        const data = $('#taFunc8').val().split('\n\n');
        const list = [];
        let maxY = 0;

        data.forEach((v, i) => {
            const arr = v.split('\n');
            list.push(arr);
            if (arr.length > maxY) maxY = arr.length;
        });

        let result = '';
        for (let i = 0; i < maxY; i++) {
            for (let j = 0; j < list.length; j++) {
                const val = list[j][i] !== undefined ? list[j][i] : '';
                result += val + (j === list.length - 1 ? ' | \n' : ' / ');
            }
        }
        $('#taFunc8').val(copy(result));
    });

    // Func 9 스크립트 복사 이벤트 연동
    $('#btnFunc9_1').click(function () {
        copy(`console.log('----------------- img --------------------');
$('#nttViewForm table .Cnts img').each((i,v)=>console.log(v.alt));
console.log('----------------- table --------------------');
if($('#nttViewForm table .Cnts table caption').length != $('#nttViewForm table .Cnts table').length) console.log('caption 없는 테이블 존재');
$('#nttViewForm table .Cnts table caption').each((i,v)=>console.log(v.innerText));
console.log('----------------- a --------------------');
$('#nttViewForm table .Cnts a').each((i,v)=>console.log(v.innerText+ ' ['+v.target+'] : ' + v.title));`);
    });

    $('#btnFunc9_2').click(function () {
        copy(`console.log('----------------- img --------------------');
$('#nttViewForm img').each((i,v)=>console.log(v.alt));
console.log('----------------- table --------------------');
if($('#nttViewForm > div > div.bbsV_cont table caption').length != $('#nttViewForm > div > div.bbsV_cont table').length) console.log('caption 없는 테이블 존재');
$('#nttViewForm > div > div.bbsV_cont table caption').each((i,v)=>console.log(v.innerText));
console.log('----------------- a --------------------');
$('#nttViewForm > div > div.bbsV_cont a').each((i,v)=>console.log(v.innerText+ ' ['+v.target+'] : ' + v.title));`);
    });

    $('#btnFunc9_3').click(function () {
        copy(`$('#replcFileNmId textarea').each((i,v)=>{
\tvar s = $('#nttSj').val();
\t$(v).val(s.endsWith("사진") ? s + (i+1) : s +' 사진'+(i+1));
});
setTimeout(function(){
    $('.nttUpdate ').click();
}, 0);`);
    });

    $('#btnFunc9_4').click(function () {
        copy(`async function search(urls, date) {
urls = urls.replaceAll('http://', 'https://').split('\\n');
date = new Date(date);
let result = '';
for (const [urlIdx, url] of urls.entries()) {
    console.log(url + ' 조회 ' + '('+(urlIdx+1) + ', ' + urls.length + ')');
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('문제가 발생했습니다: '+response.status);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const test = doc.querySelector('#myTable');
        const test2 = doc.querySelector('.photo_list');
        const test3 = doc.querySelector('.photo_list2');
        let elems = null;

        if(test){
            const th = doc.querySelectorAll('#subContent #myTable thead > tr > th');
            let idx = 0;
            for(let i in th){
                if(th[i].innerText.includes('등록일')){
                    idx = Number(i)+1;
                    break;
                }
            }
            elems = doc.querySelectorAll('#subContent #myTable tr > td:nth-child('+idx+')');
        } else if(test2){
            elems = doc.querySelectorAll('#subContent > div.subContent > div.photo_list > ul > li > a > p > span:nth-child(2)');
        } else if(test3){
            elems = doc.querySelectorAll('#subContent > div.subContent > div.photo_list2 > ul > li > a > dl > dd.date');
        }

        for(let v of elems){
            const datePattern = /\\d{4}\\.\\d{2}\\.\\d{2}/;
            const match = v.innerText.match(datePattern);
            if (match) {
                const curr = new Date(match[0]);
                if(curr >= date){
                    result += url+'\\n';
                    break;
                }
            } else {
                console.log(url + " : 날짜를 찾을 수 없습니다.");
            }
        }
    } catch (error) {
        console.error('Error fetching '+url+' :', error);
    }
}
console.log(result);
}`);
    });

    $('#btnFunc9_5').click(function () {
        copy(`console.log('----------------- img --------------------');
$('.subContent img').each((i,v)=>console.log(v.alt));
console.log('----------------- table --------------------');
if($('.subContent table caption').length != $('.subContent table').length) console.log('caption 없는 테이블 존재');
$('.subContent table caption').each((i,v)=>console.log(v.innerText));
console.log('----------------- a --------------------');
$('.subContent a').each((i,v)=>console.log(v.innerText+ ' ['+v.target+'] : ' + v.title));`);
    });

    $('#btnFunc9_6').click(function () {
        copy(`function mecro(mecroWin, targetUrl) {
const interval = 2300;
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function navigateToUrl(url) { mecroWin.location.href = url; }

function getNextUrl() {
    const next = mecroWin.document.querySelector('#nttViewForm > ul > li.next > a');
    const nttSn = next ? next.dataset.param : '';
    const bbsId = mecroWin.document.querySelector('#bbsId').value;
    const mi = mecroWin.nttViewForm.mi.value;
    const sysId = mecroWin.search.sysId.value;
    return \`\${mecroWin.location.origin}/\${sysId}/na/ntt/selectNttInfo.do?mi=\${mi}&bbsId=\${bbsId}&nttSn=\${nttSn}\`;
}

function collectImageAlts() {
    const imgs = mecroWin.document.querySelectorAll('#nttViewForm img');
    const alts = Array.from(imgs).map(img => img.alt).filter(alt => alt);
    return { alts, hasEmptyAlt: alts.length !== imgs.length };
}

function updateContent(nttSj) {
    const areas = mecroWin.document.querySelectorAll('#replcFileNmId textarea');
    let i = 1;
    for (let area of areas) {
        area.value = nttSj.endsWith('사진') ? \`\${nttSj}\${i}\` : \`\${nttSj} 사진\${i}\`;
        i++;
    }
    mecroWin.RAONKEDITOR.setEditorChangeMode('design', 'editor');
    if (mecroWin.RAONKEDITOR.IsEmpty('editor')) {
        mecroWin.RAONKEDITOR.SetHtmlContents('<p>.</p>', 'editor');
    }
}

async function processPage(url) {
    navigateToUrl(url);
    await wait(interval);

    const { alts, hasEmptyAlt } = collectImageAlts();
    console.log(alts.join('\\n------------------\\n'));

    if (hasEmptyAlt || mecroWin.confirm('수정 합니까?')) {
        mecroWin.document.querySelector('.nttUpdatePage').click();
        await wait(interval);

        const nttSj = mecroWin.document.querySelector('#nttSj').value;
        updateContent(nttSj);
        mecroWin.document.querySelector('.nttUpdate').focus();
        await wait(10);

        mecroWin.document.querySelector('.nttUpdate').click();
        await wait(interval);

        navigateToUrl(url);
        await wait(interval);

        const { alts } = collectImageAlts();
        console.log(alts.join('\\n------------------\\n'));
        if (!mecroWin.document.querySelector('#nttViewForm > ul > li.next > a')) {
            mecroWin.alert('끝');
        } else if (mecroWin.confirm('다음?')) {
            processPage(getNextUrl());
        }
    } else {
        if (!mecroWin.document.querySelector('#nttViewForm > ul > li.next > a')) {
            mecroWin.alert('끝');
        } else {
            processPage(getNextUrl());
        }
    }
}
processPage(targetUrl);
}
mecro(window.open(), location.href);`);
    });

    $('#btnFunc9_7').click(function () {
        copy(getSelectTcoString('#myTable tbody .bbs_tit a', '#nttViewForm img', '#nttViewForm > div > div.bbsV_cont table', '#nttViewForm > div > div.bbsV_cont a[target]:not([target=""])'));
    });

    $('#btnFunc9_8').click(function () {
        copy(`console.log('----------------- img --------------------');
$('.subCntBody  img').each((i,v)=>console.log(v.alt));
console.log('----------------- table --------------------');
if($('.subCntBody table caption').length != $('.subCntBody table').length) console.log('caption 없는 테이블 존재');
$('.subCntBody table caption').each((i,v)=>console.log(v.innerText));
console.log('----------------- a --------------------');
$('.subCntBody a').each((i,v)=>console.log(v.innerText+ ' ['+v.target+'] : ' + v.title));`);
    });

    $('#btnFunc9_9').click(function () {
        copy(getSelectTcoString('.BD_list tbody a.nttInfoBtn', '#nttViewForm table .Cnts img', '#nttViewForm table .Cnts table', '#nttViewForm table .Cnts a[target]:not([target=""])'));
    });

    $('#btnFunc9_10').click(function () {
        copy(`function extractTableData(selector) {
    const table = document.querySelector(selector);
    if (!table) {
        console.error("테이블을 찾을 수 없습니다.");
        return;
    }
    let result = [];
    for (let th of table.getElementsByTagName("th")) { result.push(th.innerText); }
    for (let td of table.getElementsByTagName("td")) { result.push(td.innerText); }
    console.log(result.join("\\n"));
}
extractTableData("");`);
    });

    // Func 10: 두 테이블 순서 맞추기
    let fn10_tb1ValArr = [];
    let fn10_tb2ValArr = [];
    let fn10_maxY = 0;
    let fn10_maxX = 0;

    $('#btnFunc10_1').click(function () {
        const isFirst = $('#tbFunc10_1 thead th').length === 0;
        const cls = isFirst ? 'class="chk"|' : 'class="val"|';
        $('#tbFunc10_1 thead').append(getElem('th|textarea', '', cls));
        $('#tbFunc10_2 thead').append(getElem('th|textarea', '', cls));
    });

    $('#btnFunc10_2').click(function () {
        if (!fn10_tb1ValArr[0] || fn10_tb1ValArr[0].length === 0) {
            alert('테이블 값이 없음');
            return;
        }

        function rearrangeArrays(arr1, arr2) {
            const keyArr = arr2[0];
            const dataMap = {};
            for (let y = 0; y < keyArr.length; y++) {
                const data = [];
                for (let x = 1; x < arr2.length; x++) {
                    data.push(arr2[x][y]);
                }
                dataMap[keyArr[y]] = data.join('|^|');
            }

            const resultArr2 = [];
            const row1 = arr1[0];
            const row2 = [...arr2[0]];

            const newRow2 = new Array(row1.length + 1).fill('');
            let row2Index = 0;

            row1.forEach(item => {
                const indexInRow2 = row2.indexOf(item);
                if (indexInRow2 !== -1) {
                    newRow2[row2Index++] = item;
                    row2[indexInRow2] = null;
                } else {
                    newRow2[row2Index++] = '';
                }
            });

            row2.forEach(item => {
                if (item !== null) newRow2[row2Index++] = item;
            });

            resultArr2.push(newRow2);

            const cnt = arr2.length - 1;
            const dataArr = Array.from({ length: cnt }, () => []);

            newRow2.forEach(v => {
                if (v === '') {
                    for (let i = 0; i < cnt; i++) dataArr[i].push('');
                } else {
                    const data = dataMap[v].split('|^|');
                    for (let i = 0; i < cnt; i++) dataArr[i].push(data[i]);
                }
            });

            for (let i = 0; i < cnt; i++) resultArr2.push(dataArr[i]);
            return [arr1, resultArr2];
        }

        const [newArr1, newArr2] = rearrangeArrays(fn10_tb1ValArr, fn10_tb2ValArr);
        fn10_tb1ValArr = newArr1;
        fn10_tb2ValArr = newArr2;

        fn10_maxY = Math.max(fn10_tb1ValArr[0].length, fn10_tb2ValArr[0].length);
        fn10_maxX = Math.max(fn10_tb1ValArr.length, fn10_tb2ValArr.length);

        printFn10();
        showPopup();
    });

    $('#tbFunc10_1, #tbFunc10_2').on('change', 'thead textarea', function () {
        fn10_tb1ValArr = [];
        fn10_tb2ValArr = [];
        fn10_maxY = 0;

        $('#tbFunc10_1 thead textarea').each((_, v) => {
            const arr = $(v).val().split('\n');
            fn10_tb1ValArr.push(arr);
            fn10_maxY = Math.max(fn10_maxY, arr.length);
        });
        $('#tbFunc10_2 thead textarea').each((_, v) => {
            const arr = $(v).val().split('\n');
            fn10_tb2ValArr.push(arr);
            fn10_maxY = Math.max(fn10_maxY, arr.length);
        });
        fn10_maxX = Math.max(fn10_tb1ValArr.length, fn10_tb2ValArr.length);

        printFn10();
    });

    $('#btnFunc10_3').click(function () {
        let result = '';
        for (let y = 0; y < fn10_maxY; y++) {
            let result1 = '';
            let result2 = '';
            for (let x = 0; x < fn10_maxX; x++) {
                result1 += (fn10_tb1ValArr[x]?.[y] || '') + '\t';
                result2 += (fn10_tb2ValArr[x]?.[y] || '') + '\t';
            }
            result += result1 + '\t' + result2 + '\n';
        }
        copy(result);
    });

    function printFn10() {
        const $tbody1 =$('#tbFunc10_1 tbody').empty();
        const $tbody2 =$('#tbFunc10_2 tbody').empty();

        for (let y = 0; y < fn10_maxY; y++) {
            let result1 = '';
            let result2 = '';
            for (let x = 0; x < fn10_maxX; x++) {
                result1 += getElem('td', fn10_tb1ValArr[x]?.[y] || '');
                result2 += getElem('td', fn10_tb2ValArr[x]?.[y] || '');
            }
            $tbody1.append(getElem('tr', result1));$tbody2.append(getElem('tr', result2));
        }
    }

    // Func 11: 문자열 반복 생성
    $('#tbFunc11').on('paste', '.cpyEvent', function (event) {
        let pastedData = (event.originalEvent || event).clipboardData.getData('text');
        if (!pastedData.includes('\t')) return;

        pastedData = pastedData.trim();
        const list = pastedData.split('\n');
        const ta = $('#tbFunc11 tbody tr textarea').val('');

        list.forEach(v => {
            const tmp = v.replaceAll('\r', '').split('\t');
            tmp.forEach((val, i) => {
                if (ta[i]) {
                    ta[i].value += (ta[i].value === '' ? val : '\n' + val);
                }
            });
        });
        event.preventDefault();
    });

    $('#btnFunc11_1').click(function () {
        const id = $('#tbFunc11 thead th').length;
        $('#tbFunc11 thead tr').append(getElem('th|input', `^${id}^`, `|type="checkbox" title="같은 값 사용(데이터 1개만 입력)"`));
        $('#tbFunc11 tbody tr').append(getElem('td|textarea', '', `|data-id="^${id}^" class="cpyEvent"`));
    });

    $('#btnFunc11_2').click(function () {
        const area = $('#tbFunc11 tbody tr td textarea');
        const chk = $('#tbFunc11 thead tr th input[type="checkbox"]');
        const query = $('#taFunc11').val();

        let result = '';
        const data = [];
        let cnt = 0;

        area.each((_, v) => {
            const list = $(v).val().split('\n');
            cnt = Math.max(cnt, list.length);
            data.push(list);
        });

        for (let i = 0; i < cnt; i++) {
            let q = query;
            for (let j = 0; j < data.length; j++) {
                const targetId = area[j].dataset.id;
                const d = data[j][i];

                if (chk[j].checked) {
                    q = q.replaceAll(targetId, data[j][0]);
                } else if (d) {
                    q = q.replaceAll(targetId, d);
                } else {
                    q = q.replaceAll(targetId, '데이터가 없음');
                }
            }
            result += q + '\n';
        }
        copy(result);
    });

    // Func 12: 문자 변환 (정규식/특수문자 패치)
    $('#btnFunc12').click(function () {
        let before = $('#inFunc12_1').val();
        let after = $('#inFunc12_2').val();

        const parseEscape = str => str.replace(/(?<!\\)\\n/g, '\n')
            .replace(/\\\\n/g, '\\n')
            .replace(/(?<!\\)\\t/g, '\t')
            .replace(/\\\\t/g, '\\t');

        if ($('#chkFunc12').is(':checked')) {
            before = new RegExp(before, 'g');
            after = parseEscape(after);
        } else {
            before = parseEscape(before);
            after = parseEscape(after);
        }

        const result = $('#taFunc12').val().replaceAll(before, after);
        copy(result);
        $('#taFunc12').val(result);
    });

    // Func 13: 날짜 변환
    $('#btnFunc13').click(function () {
        const year = $('#inFunc13').val();
        const dateRegex = /(\d{1,2})[.,\/-](\d{1,2})\.?/;

        const result = $('#taFunc13').val().replaceAll(' ', '').replaceAll('\n\n', '\n').trim().split('\n').map(line => {
            const match = line.match(dateRegex);
            if (match) {
                const month = match[1].padStart(2, '0');
                const day = match[2].padStart(2, '0');
                const date = `${year}/${month}/${day}`;

                if (line.includes('~')) {
                    const endMatch = line.slice(line.indexOf('~')).match(dateRegex);
                    if (endMatch) {
                        const endMonth = endMatch[1].padStart(2, '0');
                        const endDay = endMatch[2].padStart(2, '0');
                        return `${date}\t${year}/${endMonth}/${endDay}`;
                    }
                }
                return `${date}\t${date}`;
            }
            return line;
        }).join('\n');

        copy(result);
        $('#taFunc13').val(result);
    });

    // Func 14: SVN 경로 -> 운영 서버 경로 변환
    $('#btnFunc14').click(function () {
        const lines = $('#taFunc14').val().split('\n');
        const data = lines.map(v => {
            v = v.replaceAll('\\', '/');
            let result = '';
            const ext = v.substring(v.lastIndexOf('.'));

            if (ext === '.java') {
                result = '/webapp/WEB-INF/classes' + v.substring(v.indexOf('/egovframework'), v.lastIndexOf('.')) + '.class';
            } else if (ext === '.xml') {
                result = '/webapp/WEB-INF/classes' + v.substring(v.indexOf('/egovframework'));
            } else {
                result = v.substring(v.indexOf('/webapp/'));
            }

            if (v.startsWith('D ')) {
                result = '-' + result;
            }
            return result;
        });

        const output = data.join('\n');
        $('#taFunc14').val(output);
        copy(output);
    });

    // Func 15: 목록 정렬
    $('#btnFunc15').click(function () {
        let data = $('#taFunc15').val().split('\n');
        const type1 = $('#selFunc15_1').val();
        const type2 = $('#selFunc15_2').val();

        if (type1 === 'char') {
            data.sort();
            if (type2 === 'desc') data.reverse();
        } else if (type1 === 'num') {
            const charArr = data.filter(v => !/^\d+/.test(v));
            const numArr = data.filter(v => /^\d+/.test(v));

            const sortFn = (a, b) => {
                const numA = parseInt(a.match(/^\d+/)?.[0]) || Infinity;
                const numB = parseInt(b.match(/^\d+/)?.[0]) || Infinity;
                if (numA === numB) {
                    return type2 === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
                }
                return type2 === 'asc' ? numA - numB : numB - numA;
            };

            numArr.sort(sortFn);
            charArr.sort();
            if (type2 === 'desc') charArr.reverse();

            data = numArr.concat(charArr);
        }

        const output = data.join('\n');
        $('#taFunc15').val(output);
        copy(output);
    });

    // Func 16: 목록 개수 구하기
    $('#btnFunc16').click(function () {
        $('#pFunc16').text($('#taFunc16').val().split('\n').length + '개');
        showPopup();
    });

    // Func 17: 앞에 붙은 숫자 채우기 (Pad)
    $('#btnFunc17').click(function () {
        const lines = $('#taFunc17').val().split('\n');
        const type = $('[name="rdFunc17"]:checked').val();
        const len = Number($('#inpFunc17_1').val());
        const padChar = $('#inpFunc17_2').val();

        const data = lines.map(v => {
            const num = v.match(/^\d+/)?.[0];
            const text = v.replace(/^\d+/, '');

            if (num !== undefined) {
                return type === 'left' ? num.padStart(len, padChar) + text : num.padEnd(len, padChar) + text;
            }
            return v;
        });

        const output = data.join('\n');
        $('#taFunc17').val(output);
        copy(output);
    });

    // Func 18: 폴더 생성 배치 명령어 생성
    $('#btnFunc18').click(function () {
        let path = $('#inFunc18_1').val().trim();
        if (path) {
            path = path.replaceAll('/', '\\') + '\\';
            path = path.replaceAll('\\\\', '\\');
        }

        const data = $('#taFunc18').val().split('\n').map(v => `mkdir ${path}${v.replaceAll('/', '\\')} \\p`);
        const result = '@echo off\n' + data.join('\n');

        $('#taFunc18').val(result);
        copy(result);
    });

    // Func 19: 문자 추출 (정규식 파싱)
    $('#btnFunc19').click(function () {
        const data = $('#taFunc19_1').val();
        const start = $('#inFunc19_1').val();
        const end = $('#inFunc19_2').val();

        const regex = new RegExp(start + '(.*?)' + end, 'g');
        const matches = [];
        let match;

        while ((match = regex.exec(data)) !== null) {
            matches.push(match[1].trim());
        }

        if (matches.length > 0) {
            const output = matches.join('\n');
            $('#taFunc19_2').val(output);
            copy(output);
        } else {
            $('#taFunc19_2').val("일치하는 값이 없습니다.");
        }
    });

    // Func 20: 연속 숫자 생성
    $('#btnFunc20').click(function () {
        const start = Number($('#inFunc20_1').val());
        const end = Number($('#inFunc20_2').val());
        const result = [];

        for (let i = start; i <= end; i++) {
            result.push(i);
        }
        copy(result.join('\n') + '\n');
    });

    // Func 21: CRUD Mapper 생성기
    $('#btnFunc21_1, #btnFunc21_2').click(function () {
        const isFirst = $(this).attr('id') === 'btnFunc21_1';
        const readFile = isFirst ? $('#fileFunc21_1')[0].files[0] : $('#fileFunc21_2')[0].files[0];

        if (!readFile) {
            alert('파일 먼저 선택');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const fileContent = e.target.result;
            const namespace = $('#inFunc21_1').val();
            const keyword = $('#inFunc21_2').val();
            const keyword2 = keyword.replace(/^./, m => m.toLowerCase());
            const tableName = $('#inFunc21_3').val();
            const alias = $('#inFunc21_4').val();
            const aliasUpper = alias.toUpperCase();
            const aliasLower = alias.toLowerCase();
            const pKey = $('#inFunc21_5').val();
            const dataName = $('#inFunc21_6').val();
            const path = $('#inFunc21_7').val();
            const columns = $('#taFunc21_1').val().split('\n');

            const selectColumns = columns.map((col, i) => `${i === 0 ? '' : '\t\t\t,'}${aliasUpper}.${col}`).join('\n');
            const insertColumns = columns.map((col, i) => `${i === 0 ? '' : '\t\t\t,'}${col}`).join('\n');
            const insertColumns2 = columns.map((col, i) => `${i === 0 ? '' : '\t\t\t,'}#{${toCamelCase(col)}}`).join('\n');
            const updateColumns = columns.map((col, i) => `${i === 0 ? '' : '\t\t\t,'}${col} = #{${toCamelCase(col)}}`).join('\n');

            let result = fileContent
                .replaceAll('|NAMESPACE|', namespace)
                .replaceAll('|KEYWORD|', keyword)
                .replaceAll('|KEYWORD2|', keyword2)
                .replaceAll('|TABLE_NAME|', tableName)
                .replaceAll('|ALIAS_UPPER|', aliasUpper)
                .replaceAll('|ALIAS_LOWER|', aliasLower)
                .replaceAll('|ALIAS|', alias)
                .replaceAll('|P_KEY|', pKey)
                .replaceAll('|P_KEY_SNAKE|', toCamelCase(pKey))
                .replaceAll('|DATA_NAME|', dataName)
                .replaceAll('|PATH|', path)
                .replaceAll('|SELECT_COLUMNS|', selectColumns)
                .replaceAll('|INSERT_COLUMNS|', insertColumns)
                .replaceAll('|INSERT_COLUMNS2|', insertColumns2)
                .replaceAll('|UPDATE_COLUMNS|', updateColumns);

            copy(result);
        };

        reader.onerror = e => console.error('파일 읽기 오류:', e);
        reader.readAsText(readFile);
    });

    // Func 22: URL 파라미터 추출
    $('#btnFunc22').click(function () {
        const urls = $('#taFunc22').val().split('\n');
        const keys = $('#inFunc22').val().split(',');

        const result = urls.map(url => {
            const params = new URLSearchParams(url.split('?')[1] || '');
            return keys.map(key => params.get(key) || '').join('\t');
        });

        copy(result.join('\n'));
    });

    // Func 23: 엑셀 VBA 스크립트 복사
    $('#btnFunc23').click(function () {
        copy(`Sub HighlightCellsBasedOnList()
    Dim list1Range As Range, list2Range As Range, cell As Range, compareCell As Range
    Dim found As Boolean
    
    Set list1Range = Range("A1:A100")
    Set list2Range = Range("B1:B20")
    
    Application.ScreenUpdating = False
    
    For Each cell In list1Range
        found = False
        If Not IsEmpty(cell.Value) Then
            For Each compareCell In list2Range
                If Not IsEmpty(compareCell.Value) Then
                    If InStr(1, cell.Value, compareCell.Value, vbTextCompare) > 0 Then
                        cell.Interior.Color = RGB(255, 255, 0)
                        found = True
                        Exit For
                    End If
                End If
            Next compareCell
            If Not found Then cell.Interior.ColorIndex = xlNone
        End If
    Next cell
    
    Application.ScreenUpdating = True
    MsgBox "완료되었습니다!", vbInformation
End Sub`);
    });

    // Func 24: 회원 등록 SQL 쿼리 생성
    $('#btnFunc24').click(function () {
        const seq = $('#inFunc24_1').val();
        const mberId = $('#inFunc24_2').val();
        const mberNm = $('#inFunc24_3').val();
        const deptCd = $('#inFunc24_4').val();
        const deptNm = $('#inFunc24_5').val();
        const insttNm = $('#inFunc24_6').val();
        const insttCd = $('#inFunc24_7').val();

        const query = [
            `insert into tap_mm_mber_manage values(${seq}, '${mberId}', '${mberNm}', '==', null, null, null, 'cikey', 'certiKey', sysdate, null);`,
            `insert into tap_mm_mber_ty values(${seq}, '${mberId}', 5, '${deptCd}', '${deptNm}', null, null, 'Y', '시스템', 'system', sysdate, 'S', '${insttNm}', '${insttCd}', 'S');`
        ].join('\n');

        copy(query);
    });

    // Func 25: 혜전대 정기정검 조회수 표
    $('#btnFunc25').click(function(){
        const data = $('#taFunc25').val();
        const chunkSize = 17;
        const parsedRows = data
        .trim()
        .split("\n")
        .map(line => {
            const cols = line.split("\t");
            return [cols[1], cols[2]]; // [학과/페이지명, 숫자]
        });

        // 2. 17개씩 묶어서 컬럼 그룹(열) 생성
        const columns = [];
        for (let i = 0; i < parsedRows.length; i += chunkSize) {
            columns.push(parsedRows.slice(i, i + chunkSize));
        }

        // 3. 각 행(row) 순서대로 열 데이터들을 가로로 결합
        const resultRows = [];
        for (let r = 0; r < chunkSize; r++) {
            const rowCells = [];
            columns.forEach(col => {
                if (col[r]) {
                    rowCells.push(col[r][0], col[r][1]);
                }
            });
            resultRows.push(rowCells.join("\t"));
        }

        copy(resultRows.join('\n'));
    });

    // Func 26: HTML 정렬
    $('#btnFunc26').click(function () {
        const val = $('#taFunc26').val();
        if (!val.trim()) return;

        $('#taFunc26').val(copy(formatHtml(val)));
    });

    // Func 27: img src 버전(?v=날짜) 추가/갱신
    $('#btnFunc27').click(function () {
        const val = $('#taFunc27').val();
        if (!val.trim()) return;

        $('#taFunc27').val(copy(addImgVersion(val)));
    });

    // Func 28: HTML 문법 검사
    $('#btnFunc28').click(function () {
        const val = $('#taFunc28_1').val();
        if (!val.trim()) return;

        const errors = validateHtml(val);
        const result = errors.length
            ? `오류 ${errors.length}건\n${errors.join('\n')}`
            : `문제 없음 (태그 ${errors.tagCount}개 검사)`;

        $('#taFunc28_2').val(result);
        $('#resultFunc28').text('');
        showPopup();
    });

    // Func 28: 닫는 태그 오류 자동 수정
    $('#btnFunc28_2').click(function () {
        const val = $('#taFunc28_1').val();
        if (!val.trim()) return;

        const r = fixHtml(val);
        const lines = [r.fixes.length ? `자동 수정 ${r.fixes.length}건` : '자동 수정할 항목 없음', ...r.fixes];
        if (r.remaining.length) lines.push(`수동 확인 필요 ${r.remaining.length}건`, ...r.remaining);

        $('#taFunc28_2').val(copy(r.html));
        $('#resultFunc28').text(lines.join('\n'));
    });
});