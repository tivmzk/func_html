/**
 * ============================================================================
 * [Func HTML] 개발자 유틸리티 도구 스크립트
 * ============================================================================
 * 
 * [목차 / 기능 구성]
 * 0. 공통 유틸리티 (클립보드 복사, 팝업, 케이스 변환, 태그 생성 등)
 * 1. 사이드바 메뉴 자동 생성, 네비게이션 & 히스토리 라우팅 (CLAUDE.md 및 원본 동작 복원)
 * 2. 텍스트 / 목록 가공 (Func 1, 2, 6, 7, 15, 16, 17, 19, 20)
 * 3. 네이밍 / 케이스 변환 (Func 3, 4)
 * 4. HTML / 웹 접근성 유틸 (Func 5, 8, 22)
 * 5. 템플릿 / 쿼리 / 코드 생성 (Func 10, 11, 12, 13, 14, 18, 21, 23, 24)
 * 6. 업무용 스크립트 복사 모음 (Func 9)
 * 
 * 💡 [신규 기능 추가 방법]
 * 1) func.html / index.html에 section 블록 추가 (예: .section1 내 h3 제목과 #btnFunc25, #taFunc25)
 *    -> 사이드바 메뉴는 script.js가 h3 제목을 읽어 자동으로 생성합니다!
 * 2) 아래 영역에 이벤트 핸들러 등록:
 *    $('#btnFunc25').click(function() {
 *        const input = $('#taFunc25').val();
 *        const result = YourLogic(input);
 *        $('#taFunc25').val(result);
 *        AppUtils.copy(result);
 *    });
 * ============================================================================
 */

$(function () {
    'use strict';

    /* ========================================================================
     * 0. 공통 유틸리티 (AppUtils)
     * ======================================================================== */
    const AppUtils = {
        // 알림 팝업 노출 (.popup.show 애니메이션 트리거)
        showPopup(message = '실행 완료') {
            const $popup = $('.popup');
            if (message) {
                $popup.find('p').text(message);
            }
            $popup.removeClass('show');
            // 강제 리플로우를 발생시켜 재실행 가능하게 함
            void $popup[0]?.offsetWidth;
            $popup.addClass('show');
        },

        // 텍스트를 클립보드에 복사하고 팝업 표시
        async copy(str) {
            if (str === undefined || str === null) return '';
            // 마지막 줄바꿈 제거
            const text = typeof str === 'string' && str.endsWith('\n') ? str.slice(0, -1) : String(str);

            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                } else {
                    this._fallbackCopy(text);
                }
            } catch (err) {
                this._fallbackCopy(text);
            }

            this.showPopup('실행 완료');
            return text;
        },

        // 구형 브라우저 및 iframe 호환용 fallback 복사
        _fallbackCopy(text) {
            const $temp = $('<textarea>')
                .css({ position: 'fixed', left: '-9999px', top: '0', opacity: '0' })
                .val(text)
                .appendTo('body');
            $temp[0].select();
            try {
                document.execCommand('copy');
            } catch (e) {
                console.error('클립보드 복사 실패:', e);
            }
            $temp.remove();
        },

        // 스네이크 케이스 -> 카멜 케이스 (DATA_SN -> dataSn)
        toCamelCase(str) {
            if (!str) return '';
            return str.toLowerCase().replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
        },

        // 카멜 케이스 -> 스네이크 케이스 (dataSn -> DATA_SN)
        toSnakeCase(str) {
            if (!str) return '';
            return str.replace(/([A-Z0-9])/g, '_$1').toUpperCase().replace(/^_/, '');
        },

        // HTML 태그 조합 유틸리티
        getElem(tagStr, content = '', attrStr = '') {
            const tags = tagStr.split('|');
            const attrs = attrStr ? attrStr.split('|') : [];

            if (tags.length === 1) {
                const attr = attrStr ? ` ${attrStr}` : '';
                return `<${tagStr}${attr}>${content}</${tagStr}>`;
            }

            let openTags = '';
            let closeTags = '';
            for (let i = 0; i < tags.length; i++) {
                const attr = attrs[i] ? ` ${attrs[i]}` : '';
                openTags += `<${tags[i]}${attr}>`;
            }
            for (let i = tags.length - 1; i >= 0; i--) {
                closeTags += `</${tags[i]}>`;
            }
            return `${openTags}${content}${closeTags}`;
        }
    };

    // 전역 호환성을 위해 window에 바인딩
    window.showPopup = AppUtils.showPopup;
    window.copy = AppUtils.copy.bind(AppUtils);
    window.toCamelCase = AppUtils.toCamelCase;
    window.toSnakeCase = AppUtils.toSnakeCase;
    window.getElem = AppUtils.getElem;


    /* ========================================================================
     * 1. 사이드바 메뉴 자동 생성, 네비게이션 & 히스토리 라우팅
     * ======================================================================== */
    const Navigation = {
        $sections: null,
        $list: null,

        init() {
            this.$sections = $('body > div[class^="section"]');
            this.buildSidebarList();
            this.bindEvents();
            this.restoreInitialView();
        },

        // HTML의 각 섹션 h3 제목을 읽어 사이드바 <ul class="list"> 자동 생성
        buildSidebarList() {
            // 기존 list가 있으면 제거 후 재구성
            $('ul.list').remove();

            let listHtml = '<ul class="list">';
            this.$sections.each((idx, el) => {
                const title = $(el).find('.secTit h3').text().trim() || `기능 ${idx + 1}`;
                listHtml += `<li><a href="javascript:void(0);" data-index="${idx}">${title}</a></li>`;
            });
            listHtml += '</ul>';

            $('.srchBox').after(listHtml);
            this.$list = $('ul.list');
        },

        // 이벤트 바인딩
        bindEvents() {
            const self = this;

            // 사이드바 메뉴 클릭 시 해당 섹션만 표시 + 히스토리 저장
            $(document).on('click', 'ul.list a', function () {
                const idx = parseInt($(this).data('index'), 10);
                self.showSection(idx, true);
            });

            // 검색창 입력 시 메뉴 필터링
            $('#srchTxt').on('input', function () {
                const keyword = $(this).val().toLowerCase().trim();
                self.$list.find('li').each(function () {
                    const text = $(this).text().toLowerCase();
                    $(this).toggle(text.includes(keyword));
                });
            });

            // 브라우저 뒤로가기 / 앞으로가기
            $(window).on('popstate', function (e) {
                const state = e.originalEvent.state;
                if (state && typeof state.sec === 'number') {
                    self.showSection(state.sec, false);
                } else {
                    const match = location.hash.match(/#sec=(\d+)/);
                    if (match) {
                        self.showSection(parseInt(match[1], 10), false);
                    } else {
                        self.showSection(0, false);
                    }
                }
            });
        },

        // 특정 인덱스의 섹션만 활성화 (하나만 표시)
        showSection(idx, pushState = false) {
            if (idx < 0 || idx >= this.$sections.length) {
                idx = 0;
            }

            // 모든 섹션 숨기고 선택된 섹션만 보이기
            this.$sections.hide().removeClass('active');
            this.$sections.eq(idx).fadeIn(150).addClass('active');

            // 사이드바 메뉴 활성화 클래스 적용
            this.$list.find('a').removeClass('active');
            this.$list.find('a').eq(idx).addClass('active');

            // 브라우저 히스토리 및 URL Hash 업데이트
            if (pushState) {
                history.pushState({ sec: idx }, '', `#sec=${idx}`);
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        // 페이지 최초 로드 시 표시할 섹션 결정 (URL hash 또는 0번 기본 표시)
        restoreInitialView() {
            let targetIdx = 0;
            const match = location.hash.match(/#sec=(\d+)/);
            if (match) {
                const parsed = parseInt(match[1], 10);
                if (!isNaN(parsed) && parsed >= 0 && parsed < this.$sections.length) {
                    targetIdx = parsed;
                }
            }

            // 최초 화면 표시
            this.showSection(targetIdx, false);
            // 초기 state 기록
            history.replaceState({ sec: targetIdx }, '', `#sec=${targetIdx}`);
        }
    };

    Navigation.init();


    /* ========================================================================
     * 2. 텍스트 / 목록 가공 기능
     * ======================================================================== */

    // [기능 1] 목록에서 중복 제거
    $('#btnFunc1').click(function () {
        const rawLines = $('#taFunc1').val().split('\n');
        const uniqueLines = [...new Set(rawLines)];
        const result = uniqueLines.join('\n');
        $('#taFunc1').val(result);
        AppUtils.copy(result);
    });

    // [기능 2] 두 목록에서 서로 다른 부분 찾기 (차집합)
    $('#btnFunc2').click(function () {
        let list1 = $('#taFunc2_1').val().split('\n');
        let list2 = $('#taFunc2_2').val().split('\n');

        const isRemoveSpace = $('#cbFunc2_1').is(':checked');
        const isUpperCase = $('#cbFunc2_2').is(':checked');

        const normalize = (line) => {
            let res = line;
            if (isRemoveSpace) res = res.replace(/\s+/g, '');
            if (isUpperCase) res = res.toUpperCase();
            return res;
        };

        if (isRemoveSpace || isUpperCase) {
            list1 = list1.map(normalize);
            list2 = list2.map(normalize);
        }

        const set1 = new Set(list1);
        const set2 = new Set(list2);

        const diff1 = [...set1].filter(x => !set2.has(x));
        const diff2 = [...set2].filter(x => !set1.has(x));

        let html = '';
        html += '<div class="diff-result" style="display:flex; gap:20px; margin-top:10px;">';
        html += `  <div style="flex:1;"><strong>입력1에만 존재 (${diff1.length}개)</strong><br><textarea style="width:100%; height:150px;">${diff1.join('\n')}</textarea></div>`;
        html += `  <div style="flex:1;"><strong>입력2에만 존재 (${diff2.length}개)</strong><br><textarea style="width:100%; height:150px;">${diff2.join('\n')}</textarea></div>`;
        html += '</div>';

        $('#resultFunc2').html(html);
        AppUtils.showPopup('비교 완료');
    });

    // [기능 6] 좌우에 감싸기 (Prefix / Suffix)
    $('#btnFunc6').click(function () {
        const prefix = $('#taFunc6_1').val();
        const suffix = $('#taFunc6_3').val();
        const lines = $('#taFunc6_2').val().split('\n');

        const result = lines.map(line => `${prefix}${line}${suffix}`).join('\n');
        $('#taFunc6_2').val(result);
        AppUtils.copy(result);
    });

    // [기능 7] 줄바꿈 2개를 1개로 축소
    $('#btnFunc7').click(function () {
        let val = $('#taFunc7').val();
        val = val.replace(/\n\s*\n/g, '\n');
        $('#taFunc7').val(val);
        AppUtils.copy(val);
    });

    // [기능 15] 목록 정렬 (문자/숫자, 오름차순/내림차순)
    $('#btnFunc15').click(function () {
        let lines = $('#taFunc15').val().split('\n');
        const sortType = $('#selFunc15_1').val(); // 'char' | 'num'
        const orderType = $('#selFunc15_2').val(); // 'asc' | 'desc'

        if (sortType === 'char') {
            lines.sort((a, b) => a.localeCompare(b));
            if (orderType === 'desc') lines.reverse();
        } else {
            const numLines = [];
            const nonNumLines = [];

            lines.forEach(line => {
                if (/^\d+/.test(line)) {
                    numLines.push(line);
                } else {
                    nonNumLines.push(line);
                }
            });

            numLines.sort((a, b) => {
                const numA = parseInt(a.match(/^\d+/)?.[0] || '0', 10);
                const numB = parseInt(b.match(/^\d+/)?.[0] || '0', 10);
                if (numA === numB) return a.localeCompare(b);
                return orderType === 'asc' ? numA - numB : numB - numA;
            });

            nonNumLines.sort((a, b) => a.localeCompare(b));
            if (orderType === 'desc') nonNumLines.reverse();

            lines = [...numLines, ...nonNumLines];
        }

        const result = lines.join('\n');
        $('#taFunc15').val(result);
        AppUtils.copy(result);
    });

    // [기능 16] 목록 개수 구하기
    $('#btnFunc16').click(function () {
        const text = $('#taFunc16').val().trim();
        const count = text ? text.split('\n').length : 0;
        $('#pFunc16').text(`${count}개`);
        AppUtils.showPopup(`총 ${count}개 라인`);
    });

    // [기능 17] 앞에 붙은 숫자 패딩 채우기 (padStart / padEnd)
    $('#btnFunc17').click(function () {
        const lines = $('#taFunc17').val().split('\n');
        const padDirection = $('[name="rdFunc17"]:checked').val() || 'left';
        const targetLen = parseInt($('#inpFunc17_1').val(), 10) || 0;
        const padChar = $('#inpFunc17_2').val() || '0';

        const result = lines.map(line => {
            const match = line.match(/^\d+/);
            if (!match) return line;

            const numStr = match[0];
            const rest = line.slice(numStr.length);
            const padded = padDirection === 'left' 
                ? numStr.padStart(targetLen, padChar)
                : numStr.padEnd(targetLen, padChar);

            return `${padded}${rest}`;
        }).join('\n');

        $('#taFunc17').val(result);
        AppUtils.copy(result);
    });

    // [기능 19] 시작/끝 문자 사이의 문자열 추출
    $('#btnFunc19').click(function () {
        const content = $('#taFunc19_1').val();
        const start = $('#inFunc19_1').val();
        const end = $('#inFunc19_2').val();

        if (!start || !end) {
            alert('시작 문자열과 끝 문자열을 입력해주세요.');
            return;
        }

        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escapeRegex(start)}(.*?)${escapeRegex(end)}`, 'g');
        const matches = [];
        let match;

        while ((match = regex.exec(content)) !== null) {
            matches.push(match[1].trim());
        }

        if (matches.length > 0) {
            const result = matches.join('\n');
            $('#taFunc19_2').val(result);
            AppUtils.copy(result);
        } else {
            $('#taFunc19_2').val('일치하는 값이 없습니다.');
            AppUtils.showPopup('일치하는 내용 없음');
        }
    });

    // [기능 20] 숫자 연속 생성 (시작 ~ 끝)
    $('#btnFunc20').click(function () {
        const start = parseInt($('#inFunc20_1').val(), 10);
        const end = parseInt($('#inFunc20_2').val(), 10);

        if (isNaN(start) || isNaN(end) || start > end) {
            alert('유효한 시작 번호와 끝 번호를 입력해주세요.');
            return;
        }

        const numbers = [];
        for (let i = start; i <= end; i++) {
            numbers.push(i);
        }
        const result = numbers.join('\n');
        AppUtils.copy(result);
    });


    /* ========================================================================
     * 3. 네이밍 / 케이스 변환 기능
     * ======================================================================== */

    // [기능 3] 스네이크 케이스 -> 카멜 케이스 (DATA_SN -> dataSn)
    $('#btnFunc3').click(function () {
        const lines = $('#taFunc3').val().split('\n');
        const result = lines.map(line => AppUtils.toCamelCase(line)).join('\n');
        $('#taFunc3').val(result);
        AppUtils.copy(result);
    });

    // [기능 4] 카멜 케이스 -> 스네이크 케이스 (dataSn -> DATA_SN)
    $('#btnFunc4').click(function () {
        const lines = $('#taFunc4').val().split('\n');
        const result = lines.map(line => AppUtils.toSnakeCase(line)).join('\n');
        $('#taFunc4').val(result);
        AppUtils.copy(result);
    });


    /* ========================================================================
     * 4. HTML / 웹 접근성 유틸리티
     * ======================================================================== */

    // [기능 5] Hidden Input 태그 일괄 생성
    $('#btnFunc5').click(function () {
        const lines = $('#taFunc5').val().split('\n');
        const tags = lines.filter(Boolean).map(name => {
            const trimmed = name.trim();
            return `<input type="hidden" name="${trimmed}" id="${trimmed}" value="" />`;
        });
        const result = tags.join('\n');
        $('#taFunc5').val(result);
        AppUtils.copy(result);
    });

    // [기능 8] 웹 접근성 테이블 이미지 -> 텍스트 표 구조 변환
    $('#btnFunc8').click(function () {
        const raw = $('#taFunc8').val().trim();
        if (!raw) return;

        const groups = raw.split(/\n\s*\n/);
        const columns = groups.map(g => g.split('\n').map(s => s.trim()));
        const rowCount = Math.max(...columns.map(c => c.length));

        const resultRows = [];
        for (let r = 0; r < rowCount; r++) {
            const rowValues = columns.map(col => col[r] || '');
            resultRows.push(`${rowValues.join(' / ')} | `);
        }

        const result = resultRows.join('\n');
        $('#taFunc8').val(result);
        AppUtils.copy(result);
    });

    // [기능 22] URL 목록에서 특정 Query Parameter 일괄 추출
    $('#btnFunc22').click(function () {
        const urls = $('#taFunc22').val().split('\n');
        const keys = $('#inFunc22').val().split(',').map(k => k.trim()).filter(Boolean);

        const results = urls.map(urlStr => {
            if (!urlStr.includes('?')) return '';
            const queryString = urlStr.split('?')[1];
            const params = new URLSearchParams(queryString);
            return keys.map(k => params.get(k) || '').join('\t');
        });

        const result = results.join('\n');
        AppUtils.copy(result);
    });


    /* ========================================================================
     * 5. 템플릿 / 쿼리 / 코드 생성기
     * ======================================================================== */

    // [기능 10] 두 테이블의 순서 맞추기
    let tb10RowCount = 0;
    $('#btnFunc10_1').click(function () {
        tb10RowCount++;
        $('#tbFunc10_1 tbody').append(`<tr><td><input type="text" placeholder="항목 ${tb10RowCount}"/></td></tr>`);
        $('#tbFunc10_2 tbody').append(`<tr><td><input type="text" placeholder="값 ${tb10RowCount}"/></td></tr>`);
    });

    $('#btnFunc10_2').click(function () {
        const list1 = $('#tbFunc10_1 input').map((_, el) => $(el).val().trim()).get();
        const list2 = $('#tbFunc10_2 input').map((_, el) => $(el).val().trim()).get();

        const map = new Map();
        list2.forEach(item => {
            const [k, ...rest] = item.split(/\s+/);
            if (k) map.set(k, item);
        });

        const sorted = list1.map(k => map.get(k) || `${k} (미일치)`).join('\n');
        AppUtils.copy(sorted);
    });

    $('#btnFunc10_3').click(function () {
        const values = $('#tbFunc10_1 input').map((_, el) => $(el).val()).get().join('\n');
        AppUtils.copy(values);
    });

    // [기능 11] 문자열 반복 생성 (동적 변수 템플릿)
    $('#btnFunc11_1').click(function () {
        const colIdx = $('#tbFunc11 thead tr th').length;
        $('#tbFunc11 thead tr').append(`<th>#${colIdx}</th>`);
        $('#tbFunc11 tbody tr').append(`<td><textarea placeholder="줄바꿈으로 구분된 값 목록"></textarea></td>`);
    });

    $('#btnFunc11_2').click(function () {
        const template = $('#taFunc11').val();
        const columns = $('#tbFunc11 tbody textarea').map((_, el) => $(el).val().split('\n')).get();

        if (columns.length === 0) return;
        const maxRows = Math.max(...columns.map(c => c.length));

        let output = '';
        for (let r = 0; r < maxRows; r++) {
            let line = template;
            columns.forEach((col, cIdx) => {
                const val = col[r] || '';
                line = line.replaceAll(`^${cIdx}^`, val);
            });
            output += line + '\n';
        }

        AppUtils.copy(output);
    });

    // [기능 12] 문자 변환 / 치환 (일반 & 정규표현식 지원)
    $('#btnFunc12').click(function () {
        const before = $('#inFunc12_1').val();
        const after = $('#inFunc12_2').val();
        const isRegex = $('#chkFunc12').is(':checked');
        let text = $('#taFunc12').val();

        if (isRegex) {
            try {
                const reg = new RegExp(before, 'g');
                text = text.replace(reg, after);
            } catch (e) {
                alert('잘못된 정규식 패턴입니다: ' + e.message);
                return;
            }
        } else {
            text = text.replaceAll(before, after);
        }

        $('#taFunc12').val(text);
        AppUtils.copy(text);
    });

    // [기능 13] 날짜 변환 (대전대 학사일정 포맷 -> SQL 인서트 포맷)
    $('#btnFunc13').click(function () {
        const year = $('#inFunc13').val().trim() || '2024';
        const lines = $('#taFunc13').val().split('\n');
        const dateRegex = /(\d{1,2})\.\s*(\d{1,2})/;

        const result = lines.map(line => {
            const match = line.match(dateRegex);
            if (!match) return line;

            const month = match[1].padStart(2, '0');
            const day = match[2].padStart(2, '0');
            const date = `${year}/${month}/${day}`;

            if (line.includes('~')) {
                const afterTilde = line.slice(line.indexOf('~'));
                const endMatch = afterTilde.match(dateRegex);
                if (endMatch) {
                    const endMonth = endMatch[1].padStart(2, '0');
                    const endDay = endMatch[2].padStart(2, '0');
                    return `${date}\t${year}/${endMonth}/${endDay}`;
                }
            }
            return `${date}\t${date}`;
        }).join('\n');

        $('#taFunc13').val(result);
        AppUtils.copy(result);
    });

    // [기능 14] SVN 파일 경로 -> 운영 서버 배포 경로 변환
    $('#btnFunc14').click(function () {
        const lines = $('#taFunc14').val().split('\n');
        const result = lines.map(raw => {
            let path = raw.replaceAll('\\', '/');
            let res = '';

            if (path.endsWith('.java')) {
                const egovIdx = path.indexOf('/egovframework');
                const dotIdx = path.lastIndexOf('.');
                res = `/webapp/WEB-INF/classes${path.substring(egovIdx, dotIdx)}.class`;
            } else if (path.endsWith('.xml')) {
                const egovIdx = path.indexOf('/egovframework');
                res = `/webapp/WEB-INF/classes${path.substring(egovIdx)}`;
            } else {
                const webappIdx = path.indexOf('/webapp/');
                res = webappIdx !== -1 ? path.substring(webappIdx) : path;
            }

            if (raw.startsWith('D ')) {
                res = '-' + res;
            }
            return res;
        }).join('\n');

        $('#taFunc14').val(result);
        AppUtils.copy(result);
    });

    // [기능 18] 폴더 생성 배치 명령어(.bat) 생성
    $('#btnFunc18').click(function () {
        let basePath = $('#inFunc18_1').val().trim();
        if (basePath) {
            basePath = basePath.replaceAll('/', '\\') + '\\';
            basePath = basePath.replaceAll('\\\\', '\\');
        }

        const lines = $('#taFunc18').val().split('\n').filter(Boolean);
        const commands = lines.map(folder => `mkdir ${basePath}${folder.replaceAll('/', '\\')} \\p`);
        const result = `@echo off\n${commands.join('\n')}`;

        $('#taFunc18').val(result);
        AppUtils.copy(result);
    });

    // [기능 21] CRUD Mapper / Controller 파일 생성기
    $('#btnFunc21_1, #btnFunc21_2').click(function () {
        const isMapper = $(this).attr('id') === 'btnFunc21_1';
        const fileInput = isMapper ? $('#fileFunc21_1')[0] : $('#fileFunc21_2')[0];
        const file = fileInput?.files?.[0];

        if (!file) {
            alert(isMapper ? 'mapper.xml 파일을 먼저 선택해주세요.' : 'controller.java 파일을 먼저 선택해주세요.');
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
            const columns = $('#taFunc21_1').val().split('\n').map(c => c.trim()).filter(Boolean);

            let selectColumns = '';
            let insertColumns = '';
            let insertColumns2 = '';
            let updateColumns = '';

            columns.forEach((col, i) => {
                const prefix = i !== 0 ? '\t\t\t,' : '';
                selectColumns += `${prefix}${aliasUpper}.${col}\n`;
                insertColumns += `${prefix}${col}\n`;
                insertColumns2 += `${prefix}#{${AppUtils.toCamelCase(col)}}\n`;
                updateColumns += `${prefix}${col} = #{${AppUtils.toCamelCase(col)}}\n`;
            });

            let result = fileContent
                .replaceAll('|NAMESPACE|', namespace)
                .replaceAll('|KEYWORD|', keyword)
                .replaceAll('|KEYWORD2|', keyword2)
                .replaceAll('|TABLE_NAME|', tableName)
                .replaceAll('|ALIAS_UPPER|', aliasUpper)
                .replaceAll('|ALIAS_LOWER|', aliasLower)
                .replaceAll('|ALIAS|', alias)
                .replaceAll('|P_KEY|', pKey)
                .replaceAll('|P_KEY_SNAKE|', AppUtils.toCamelCase(pKey))
                .replaceAll('|DATA_NAME|', dataName)
                .replaceAll('|PATH|', path)
                .replaceAll('|SELECT_COLUMNS|', selectColumns.trimEnd())
                .replaceAll('|INSERT_COLUMNS|', insertColumns.trimEnd())
                .replaceAll('|INSERT_COLUMNS2|', insertColumns2.trimEnd())
                .replaceAll('|UPDATE_COLUMNS|', updateColumns.trimEnd());

            AppUtils.copy(result);
        };

        reader.onerror = function (e) {
            console.error('파일 읽기 오류:', e);
            alert('파일을 읽는 도중 오류가 발생했습니다.');
        };

        reader.readAsText(file);
    });

    // [기능 23] 엑셀 텍스트 포함 여부 확인 매크로 (VBA) 복사
    $('#btnFunc23').click(function () {
        const vbaCode = `Sub HighlightCellsBasedOnList()
    Dim list1Range As Range
    Dim list2Range As Range
    Dim cell As Range
    Dim compareCell As Range
    Dim found As Boolean
    
    ' 두 목록의 범위 설정 (필요에 따라 변경)
    Set list1Range = Range("A1:A100")  ' 1번 목록 범위 (필요에 따라 변경)
    Set list2Range = Range("B1:B20")   ' 2번 목록 범위 (필요에 따라 변경)
    
    Application.ScreenUpdating = False  ' 처리 속도 향상을 위해 화면 업데이트 비활성화
    
    ' 1번 목록의 각 셀에 대해
    For Each cell In list1Range
        found = False
        
        ' 셀이 비어있지 않은 경우에만 검사
        If Not IsEmpty(cell.Value) Then
            ' 2번 목록의 각 항목과 비교
            For Each compareCell In list2Range
                ' 2번 목록의 셀이 비어있지 않은 경우에만 검사
                If Not IsEmpty(compareCell.Value) Then
                    ' 1번 목록 셀에 2번 목록의 문자열이 포함되어 있는지 확인
                    If InStr(1, cell.Value, compareCell.Value, vbTextCompare) > 0 Then
                        cell.Interior.Color = RGB(255, 255, 0)  ' 노란색으로 변경
                        found = True
                        Exit For  ' 일치하는 항목을 찾으면 더 이상 비교하지 않음
                    End If
                End If
            Next compareCell
            
            ' 일치하는 항목이 없으면 셀 색상 제거 (선택적)
            If Not found Then
                cell.Interior.ColorIndex = xlNone
            End If
        End If
    Next cell
    
    Application.ScreenUpdating = True  ' 화면 업데이트 다시 활성화
    MsgBox "완료되었습니다!", vbInformation
End Sub`;
        AppUtils.copy(vbaCode);
    });

    // [기능 24] 대전대 회원 등록 쿼리 생성
    $('#btnFunc24').click(function () {
        const seq = $('#inFunc24_1').val().trim();
        const mberId = $('#inFunc24_2').val().trim();
        const mberNm = $('#inFunc24_3').val().trim();
        const deptCd = $('#inFunc24_4').val().trim();
        const deptNm = $('#inFunc24_5').val().trim();
        const insttNm = $('#inFunc24_6').val().trim();
        const insttCd = $('#inFunc24_7').val().trim();

        let query = '';
        query += `insert into tap_mm_mber_manage values(${seq}, '${mberId}', '${mberNm}', '==', null, null, null, 'cikey', 'certiKey', sysdate, null);\n`;
        query += `insert into tap_mm_mber_ty values(${seq}, '${mberId}', 5, '${deptCd}', '${deptNm}', null, null, 'Y', '시스템', 'system', sysdate, 'S', '${insttNm}', '${insttCd}', 'S');`;

        AppUtils.copy(query);
    });


    /* ========================================================================
     * 6. 업무용 스크립트 복사 스니펫 (Func 9)
     * ======================================================================== */
    const Snippets = {
        // [9-1] 대전대 게시물 확인
        djdPostCheck: `var a = $('div.contents_wrapper');
a.find('img').css('border','2px solid red');
a.find('a').each(function(){
    var href = $(this).attr('href');
    if(!href || href == '#' || href.indexOf('javascript') > -1){
        $(this).css('border','2px solid blue');
    }
});`,

        // [9-8] 대전대 콘텐츠 확인
        djdContentCheck: `var $iframe = $('#content_frame').contents();
$iframe.find('img').css('border','2px solid red');
$iframe.find('a').each(function(){
    var href = $(this).attr('href');
    if(!href || href == '#' || href.indexOf('javascript') > -1){
        $(this).css('border','2px solid blue');
    }
});`,

        // [9-9] 대전대 게시물 일괄 확인
        djdBatchPostCheck: `var links = [];
$('#bbs_list tbody tr').each(function(){
    var href = $(this).find('a').attr('href');
    if(href) links.push(href);
});
console.log('게시물 목록:', links);`,

        // [9-2] 전남 게시물 확인
        jnPostCheck: `var a = $('.bbs_content, .view_content');
a.find('img').css('border','2px solid red');
a.find('a').css('border','2px solid blue');`,

        // [9-3] 전남 게시물 이미지 입력
        jnPostImgInsert: `function insertImgAlt(altText) {
    var editor = oEditors.getById["nttCn"];
    editor.exec("PASTE_HTML", ['<img src="/sample.jpg" alt="' + altText + '">']);
}`,

        // [9-4] 전남 게시물 일자로 검색 함수
        jnSearchByDate: `function searchByDate(startDate, endDate) {
    $('#searchBgnde').val(startDate);
    $('#searchEndde').val(endDate);
    $('#searchForm').submit();
}`,

        // [9-5] 전남 콘텐츠 확인
        jnContentCheck: `$('.content_wrap img').css('border','2px solid red');`,

        // [9-6] 전남 이미지 대체텍스트 자동 입력
        jnAutoAltText: `$('#board_list img').each(function(){
    var alt = $(this).attr('alt');
    if(!alt) {
        $(this).attr('alt', '이미지');
    }
});`,

        // [9-7] 전남 게시물 일괄 확인
        jnBatchPostCheck: `var list = [];
$('.table_box tbody tr a').each(function(){
    list.push($(this).attr('href'));
});
console.log('게시물 링크:', list);`,

        // [9-10] 테이블 내용 TSV 추출
        tableExtract: `var table = document.querySelector('table');
var rows = Array.from(table.rows);
var text = rows.map(row => Array.from(row.cells).map(cell => cell.innerText.trim()).join('\t')).join('\n');
console.log(text);`
    };

    $('#btnFunc9_1').click(() => AppUtils.copy(Snippets.djdPostCheck));
    $('#btnFunc9_8').click(() => AppUtils.copy(Snippets.djdContentCheck));
    $('#btnFunc9_9').click(() => AppUtils.copy(Snippets.djdBatchPostCheck));
    $('#btnFunc9_2').click(() => AppUtils.copy(Snippets.jnPostCheck));
    $('#btnFunc9_3').click(() => AppUtils.copy(Snippets.jnPostImgInsert));
    $('#btnFunc9_4').click(() => AppUtils.copy(Snippets.jnSearchByDate));
    $('#btnFunc9_5').click(() => AppUtils.copy(Snippets.jnContentCheck));
    $('#btnFunc9_6').click(() => AppUtils.copy(Snippets.jnAutoAltText));
    $('#btnFunc9_7').click(() => AppUtils.copy(Snippets.jnBatchPostCheck));
    $('#btnFunc9_10').click(() => AppUtils.copy(Snippets.tableExtract));

});
