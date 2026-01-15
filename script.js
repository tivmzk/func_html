function showPopup() {
    document.querySelector('.popup').classList.add('show');
}
$(function () {
    // 팝업 이벤트 추가
    document.querySelector('.popup').addEventListener('animationend', function() {
        this.classList.remove('show');
    });
    // 검색 이벤트 추가
    $('#srchTxt').keyup(function (e) {
        var txt = $(this).val().toUpperCase().replaceAll(' ', '');
        $('ul.list a').each((i, v) => {
            if(txt == ''){
                $(v).css('color', 'black');
            }
            else if($(v).text().includes(txt)){
                $(v).css('color', 'red');
            }
            else{
                $(v).css('color', 'black');
            }
        });
    });

    // 목차 추가
    var li = '';
    $('[class^=section]').each((i, v) => {
        li += getElem('li|a', (i+1) + '. ' + $(v).find('.secTit > h3').text(), `|href="#" data-id="${i}"`) + '\n';
        $(v).attr('id', `${i}`);
        $(v).hide();
    });

    $('body').prepend(getElem('ul', li, 'class="list"'));

    function loadContent(id) {
        $('[class^=section]').hide();    
        $('.list a').removeClass('active');
        if(id == -1) return;
        $(`.list a[data-id=${id}]`).addClass('active');
        $(`#${id}`).show();
    }

    $('.list').on('click', 'a', function (e) {
        // $('.list a').removeClass('active');
        // $(this).addClass('active');
        // $('[class^=section]').hide();
        const id = $(this).data('id');
        // $(`#${id}`).show();

        // 뒤로가기 기능
        const state = {page:id};
        history.pushState(state, '', location.href);
        loadContent(id);
        e.preventDefault();
    });
    window.addEventListener('popstate', function (e) {
        if (e.state) {
            // event.state는 pushState에서 저장한 객체입니다.
            loadContent(e.state.page); // 상태에 따라 콘텐츠 로드
        } else {
            loadContent(-1); // 기본 콘텐츠 로드
        }
    });

    // 목록에서 중복 제거
    $('#btnFunc1').click(function () {
        var str = $('#taFunc1').val();
        var s = new Set();
        var r = '';
        str.split('\n').forEach(v => {
            s.add(v);
        });
        s.forEach(v => {
            r += v + '\n';
        });
        $('#taFunc1').val(copy(r));
    });
    // 두 목록에서 다른 부분 찾기
    $('#btnFunc2').click(function () {
        var op1 = $('#cbFunc2_1:checked').val();
        var op2 = $('#cbFunc2_2:checked').val();
        var arr1 = $('#taFunc2_1').val().split('\n').map(v => v.trim());
        var arr2 = $('#taFunc2_2').val().split('\n').map(v => v.trim());

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

        // 차집합을 구합니다.
        const difference1 = [...set1].filter(item => !set2.has(item));
        const difference2 = [...set2].filter(item => !set1.has(item));

        var s = '';
        s += getElem('p|strong', '입력1에만 있는 것');
        difference1.forEach(v => s += getElem('p', v));
        s += getElem('p|strong', '입력2에만 있는 것');
        difference2.forEach(v => s += getElem('p', v));
        $('#resultFunc2').empty();
        $('#resultFunc2').append(s);
        $('#resultFunc2').focus();
    });
    // 스네이크 케이스 -> 캐멀 케이스
    $('#btnFunc3').click(function () {
        var data = $('#taFunc3').val();
        data = data.toLowerCase();
        var result = data.replace(/_([a-z])/g, function (match, letter) {
            return letter.toUpperCase();
        });
        $('#taFunc3').val(copy(result));
    });
    // 캐멀 케이스 -> 스네이크 케이스
    $('#btnFunc4').click(function () {
        var data = $('#taFunc4').val();

        var result = data.replace(/([A-Z])/g, function (match, letter) {
            return '_' + letter;
        });
        result = result.toUpperCase();
        $('#taFunc4').val(copy(result));
    });
    // hidden input 태그 생성
    $('#btnFunc5').click(function () {
        var data = $('#taFunc5').val().split('\n');
        var result = '';
        data.forEach(v => {
            result += `<input type="hidden" id="${v}" name="${v}">\n`;
        });
        $('#taFunc5').val(copy(result));
    });
    // 좌우에 감싸기
    $('#btnFunc6').click(function () {
        var data1 = $('#taFunc6_1').val();
        var data2 = $('#taFunc6_2').val().split('\n');
        var data3 = $('#taFunc6_3').val();
        var result = '';
        data2.forEach(v => {
            result += `${data1}${v}${data3}\n`;
        });
        $('#taFunc6_1').val('');
        $('#taFunc6_3').val('');
        $('#taFunc6_2').val(result);
        copy(result);
    });
    // 줄바꿈 2개를 1개로
    $('#btnFunc7').click(function () {
        var result = $('#taFunc7').val().replaceAll('\n\n', '\n');

        $('#taFunc7').val(copy(result));
    });
    // 웹접근성 테이블 이미지를 텍스트로
    $('#btnFunc8').click(function () {
        var data = $('#taFunc8').val().split('\n\n');
        var result = '';
        var list = [];
        var maxY = 0;

        data.forEach((v, i) => {
            list.push(v.split('\n'));
            maxY = maxY < list[i].length ? list[i].length : maxY;
        });

        for (var i = 0; i < maxY; i++) {
            for (var j = 0; j < list.length; j++) {
                result += list[j][i] + (j == list.length - 1 ? ' | \n' : ' / ');
            }
        }

        result = result.replaceAll('undefined', '');

        $('#taFunc8').val(copy(result));
    });
    // 자주 사용하는 스크립트
    function getSelectTcoString(nttQuery, imgQuery, tableQuery, aQuery){
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
    // 웹접근성 대전대 게시물 확인
    $('#btnFunc9_1').click(function () {
        copy(`console.log('----------------- img --------------------');
            $('#nttViewForm table .Cnts img').each((i,v)=>console.log(v.alt));
            console.log('----------------- table --------------------');
            if($('#nttViewForm table .Cnts table caption').length != $('#nttViewForm table .Cnts table').length) console.log('caption 없는 테이블 존재');
            $('#nttViewForm table .Cnts table caption').each((i,v)=>console.log(v.innerText));
            console.log('----------------- a --------------------');
            $('#nttViewForm table .Cnts a').each((i,v)=>console.log(v.innerText+ ' ['+v.target+'] : ' + v.title));`.replace(/ {2,}/g, ''));
    });
    // 웹접근성 전남 게시물 확인
    $('#btnFunc9_2').click(function () {
        copy(`console.log('----------------- img --------------------');
            $('#nttViewForm img').each((i,v)=>console.log(v.alt));
            console.log('----------------- table --------------------');
            if($('#nttViewForm > div > div.bbsV_cont table caption').length != $('#nttViewForm > div > div.bbsV_cont table').length) console.log('caption 없는 테이블 존재');
            $('#nttViewForm > div > div.bbsV_cont table caption').each((i,v)=>console.log(v.innerText));
            console.log('----------------- a --------------------');
            $('#nttViewForm > div > div.bbsV_cont a').each((i,v)=>console.log(v.innerText+ ' ['+v.target+'] : ' + v.title));`.replace(/ {2,}/g, ''));
    });
    // 웹접근성 전남 게시물 이미지 입력
    $('#btnFunc9_3').click(function () {
        copy(`$('#replcFileNmId textarea').each((i,v)=>{
            \tvar s = $('#nttSj').val();
            \t$(v).val(s.endsWith("사진") ? s + (i+1) : s +' 사진'+(i+1));
            });
            setTimeout(function(){
                $('.nttUpdate ').click();
            }, 0);`.replace(/ {2,}/g, ''));
    });
    // 웹접근성 전남 일자로 최근 등록된 게시물 검색
    $('#btnFunc9_4').click(function () {
        copy(`async function search(urls, date) {
        urls = urls.replaceAll('http://', 'https://');
        urls = urls.split('\\n');
        date = new Date(date);
        result = '';
        for (const [urlIdx, url] of urls.entries()) {
            console.log(url + ' 조회 ' + '('+(urlIdx+1) + ', ' + urls.length + ')');
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('문제가 발생했습니다: '+response.status);
                }
                const html = await response.text();

                // HTML 문자열을 DOM 객체로 변환
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                var test = doc.querySelector('#myTable');
                var test2 = doc.querySelector('.photo_list');
                var test3 = doc.querySelector('.photo_list2');
                var elems = null;

                if(test){
                    var th = doc.querySelectorAll('#subContent #myTable thead > tr > th');
                    var idx = 0;
                    for(var i in th){
                        if(th[i].innerText.includes('등록일')){
                            idx = Number(i)+1;
                            break;
                        }
                    }
                    // id로 요소 조회
                    elems = doc.querySelectorAll('#subContent #myTable tr > td:nth-child('+idx+')');
                }
                else if(test2){
                    // id로 요소 조회
                    elems = doc.querySelectorAll('#subContent > div.subContent > div.photo_list > ul > li > a > p > span:nth-child(2)');
                }
                else if(test3){
                    elems = doc.querySelectorAll('#subContent > div.subContent > div.photo_list2 > ul > li > a > dl > dd.date');
                }

                for(var v of elems){
                    const datePattern = /\\d{4}\\.\\d{2}\\.\\d{2}/;
                    const match = v.innerText.match(datePattern);

                    if (match) {
                        var curr = new Date(match[0]);
                        if(curr >= date){
                            result += url+'\\n';
                            break;
                        }
                    } else {
                        console.log(url + " : 날짜를 찾을 수 없습니다.");
                    }
                    
                };
            } catch (error) {
                console.error('Error fetching '+url+' :', error);
            }
        }

        console.log(result);
    }`);
    });
    // 웹접근성 전남 콘텐츠 확인
    $('#btnFunc9_5').click(function () {
        copy(`console.log('----------------- img --------------------');
$('.subContent img').each((i,v)=>console.log(v.alt));
console.log('----------------- table --------------------');
if($('.subContent table caption').length != $('.subContent table').length) console.log('caption 없는 테이블 존재');
$('.subContent table caption').each((i,v)=>console.log(v.innerText));
console.log('----------------- a --------------------');
$('.subContent a').each((i,v)=>console.log(v.innerText+ ' ['+v.target+'] : ' + v.title));`);
    });

    // 전남 웹접근성 이미지 게시물 자동확인 및 입력
    $('#btnFunc9_6').click(function () {
        copy(`function mecro(mecroWin, targetUrl) {
const interval = 2300;

// 페이지 이동 후 지정된 시간만 기다리기 위한 함수
function wait(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}

// URL로 이동하는 함수
function navigateToUrl(url) {
mecroWin.location.href = url;
}

// 다음 URL을 생성하는 함수
function getNextUrl() {
const next = mecroWin.document.querySelector('#nttViewForm > ul > li.next > a');
const nttSn = next ? next.dataset.param : '';
const bbsId = mecroWin.document.querySelector('#bbsId').value;
const mi = mecroWin.nttViewForm.mi.value;
const sysId = mecroWin.search.sysId.value;

return \`\${mecroWin.location.origin}/\${sysId}/na/ntt/selectNttInfo.do?mi=\${mi}&bbsId=\${bbsId}&nttSn=\${nttSn}\`;
}

// 이미지 alt 속성을 수집하는 함수
function collectImageAlts() {
const imgs = mecroWin.document.querySelectorAll('#nttViewForm img');
const alts = Array.from(imgs).map(img => img.alt).filter(alt => alt);
return { alts, hasEmptyAlt: alts.length !== imgs.length };
}

// 내용을 업데이트하는 함수
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

// 페이지를 처리하는 메인 함수
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
    }
    else if (mecroWin.confirm('다음?')) {
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
    
    // 전남 한페이지 게시물 확인
    $('#btnFunc9_7').click(function(){
        copy(getSelectTcoString('#myTable tbody .bbs_tit a', '#nttViewForm img', '#nttViewForm > div > div.bbsV_cont table', '#nttViewForm > div > div.bbsV_cont a[target]:not([target=""])'));
    });

    // 대전대 콘텐츠 확인
    $('#btnFunc9_8').click(function(){
        copy(`console.log('----------------- img --------------------');
            $('.subCntBody  img').each((i,v)=>console.log(v.alt));
            console.log('----------------- table --------------------');
            if($('.subCntBody table caption').length != $('.subCntBody table').length) console.log('caption 없는 테이블 존재');
            $('.subCntBody table caption').each((i,v)=>console.log(v.innerText));
            console.log('----------------- a --------------------');
            $('.subCntBody a').each((i,v)=>console.log(v.innerText+ ' ['+v.target+'] : ' + v.title));`.replace(/ {2,}/g, ''));
    });

    // 대전대 한페이지 게시물 확인
    $('#btnFunc9_9').click(function(){
        copy(getSelectTcoString('.BD_list tbody a.nttInfoBtn', '#nttViewForm table .Cnts img', '#nttViewForm table .Cnts table', '#nttViewForm table .Cnts a[target]:not([target=""])'));
    });

    $('#btnFunc9_10').click(function(){
       copy(`function extractTableData(selector) {
    const table = document.querySelector(selector);
    if (!table) {
        console.error("테이블을 찾을 수 없습니다.");
        return;
    }

    let result = [];

    // 모든 th 요소 추출
    const headers = table.getElementsByTagName("th");
    for (let th of headers) {
        result.push(th.innerText);
    }

    // 모든 td 요소 추출
    const cells = table.getElementsByTagName("td");
    for (let td of cells) {
        result.push(td.innerText);
    }

    // 내용을 \\n으로 구분하여 출력
    const output = result.join("\\n");
    console.log(output);
}

// 함수 호출 예시
extractTableData("");`); 
    });

    // 두 테이블의 순서 맞추기
    var fn10_tb1ValArr = [];
    var fn10_tb2ValArr = [];
    var fn10_maxY = 0;
    var fn10_maxX = 0;
    // 컬럼 추가
    $('#btnFunc10_1').click(function () {
        if ($('#tbFunc10_1 thead th').length == 0) {
            $('#tbFunc10_1 thead').append(getElem('th|textarea', '', 'class="chk"|'));
            $('#tbFunc10_2 thead').append(getElem('th|textarea', '', 'class="chk"|'));
        }
        else {
            $('#tbFunc10_1 thead').append(getElem('th|textarea'));
            $('#tbFunc10_2 thead').append(getElem('th|textarea'));
        }
    });
    // 두 테이블의 순서 맞추기 실행
    $('#btnFunc10_2').click(function () {
        if (fn10_tb1ValArr[0] == undefined || fn10_tb1ValArr[0].length == 0) {
            alert('테이블 값이 없음');
            return;
        }

        function rearrangeArrays(arr1, arr2) {
            var keyArr = arr2[0];
            var dataMap = {};
            for (var y = 0; y < keyArr.length; y++) {
                var data = [];
                for (var x = 1; x < arr2.length; x++) {
                    data.push(arr2[x][y]);
                }
                dataMap[keyArr[y]] = data.join('|^|');
            }

            const resultArr2 = [];

            const row1 = arr1[0];
            const row2 = arr2[0];

            // 결과 배열 초기화
            const newRow1 = [...row1, '']; // arr1의 원소와 빈값 추가
            const newRow2 = new Array(row1.length + 1).fill(''); // arr2의 빈 배열 초기화

            let row2Index = 0; // row2의 인덱스

            // arr1 기준으로 arr2의 순서 변경
            row1.forEach(item => {
                const indexInRow2 = row2.indexOf(item);
                if (indexInRow2 !== -1) {
                    newRow2[row2Index++] = item; // arr2에 item 추가
                    row2[indexInRow2] = null; // 이미 추가한 item은 null로 변경
                } else {
                    newRow2[row2Index++] = ''; // arr1에만 있는 값은 빈값 추가
                }
            });

            // arr2의 남은 값은 맨 뒤로 이동
            row2.forEach(item => {
                if (item !== null) {
                    newRow2[row2Index++] = item; // 남은 값 추가
                }
            });

            resultArr2.push(newRow2); // 결과 arr2에 추가

            const cnt = arr2.length - 1;
            const dataArr = [];
            for (var i = 0; i < cnt; i++) {
                dataArr.push([]);
            }
            newRow2.forEach(v => {
                if (v == '') {
                    for (var i = 0; i < cnt; i++) {
                        dataArr[i].push(v);
                    }
                }
                else {
                    var data = dataMap[v].split('|^|');
                    for (var i = 0; i < cnt; i++) {
                        dataArr[i].push(data[i]);
                    }
                }
            });
            for (var i = 0; i < cnt; i++) {
                resultArr2.push(dataArr[i]);
            }

            return [arr1, resultArr2];
        }

        var [newArr1, newArr2] = rearrangeArrays(fn10_tb1ValArr, fn10_tb2ValArr);
        fn10_tb1ValArr = newArr1;
        fn10_tb2ValArr = newArr2;
        fn10_maxY = fn10_maxY < fn10_tb1ValArr[0].length ? fn10_tb1ValArr[0].length : fn10_maxY;
        fn10_maxY = fn10_maxY < fn10_tb2ValArr[0].length ? fn10_tb2ValArr[0].length : fn10_maxY;
        fn10_maxX = fn10_tb1ValArr.length > fn10_tb2ValArr.length ? fn10_tb1ValArr.length : fn10_tb2ValArr.length;
        printFn10();
    });
    // 입력 감시해서 테이블 출력
    $('#tbFunc10_1, #tbFunc10_2').on('change', 'thead textarea', function () {
        fn10_tb1ValArr = [];
        fn10_tb2ValArr = [];
        fn10_maxY = 0;
        fn10_maxX = 0;

        $('#tbFunc10_1 thead textarea').each((i, v) => {
            var arr = $(v).val().split('\n');
            fn10_tb1ValArr.push(arr);
            fn10_maxY = fn10_maxY < arr.length ? arr.length : fn10_maxY;
        });
        $('#tbFunc10_2 thead textarea').each((i, v) => {
            var arr = $(v).val().split('\n');
            fn10_tb2ValArr.push(arr);
            fn10_maxY = fn10_maxY < arr.length ? arr.length : fn10_maxY;
        });
        fn10_maxX = fn10_tb1ValArr.length > fn10_tb2ValArr.length ? fn10_tb1ValArr.length : fn10_tb2ValArr.length;

        printFn10();
    });
    // 데이터 엑셀이 붙여넣기 할 수 있게 복사하기, 
    $('#btnFunc10_3').click(function () {
        var result = '';
        for (let y = 0; y < fn10_maxY; y++) {
            var result1 = '';
            var result2 = '';
            for (let x = 0; x < fn10_maxX; x++) {
                var v1 = fn10_tb1ValArr[x] ? fn10_tb1ValArr[x][y] : '';
                result1 += v1 + '\t';
                var v2 = fn10_tb2ValArr[x] ? fn10_tb2ValArr[x][y] : '';
                result2 += v2 + '\t';
            }
            result += result1 + '\t' + result2 + '\n';
        }
        result = result.replaceAll('undefined', '');
        copy(result);
    });
    // 테이블 출력
    function printFn10() {
        var tbody1 = $('#tbFunc10_1 tbody');
        var tbody2 = $('#tbFunc10_2 tbody');
        tbody1.empty();
        tbody2.empty();

        for (let y = 0; y < fn10_maxY; y++) {
            var result1 = '';
            var result2 = '';
            for (let x = 0; x < fn10_maxX; x++) {
                var v1 = fn10_tb1ValArr[x] ? fn10_tb1ValArr[x][y] : '';
                result1 += getElem('td', v1);
                var v2 = fn10_tb2ValArr[x] ? fn10_tb2ValArr[x][y] : '';
                result2 += getElem('td', v2);
            }
            tbody1.append(getElem('tr', result1.replaceAll('undefined', '')));
            tbody2.append(getElem('tr', result2.replaceAll('undefined', '')));
        }
    }

    // 문자열 반복 생성
    // 데이터 한번에 입력
    $('#tbFunc11').on('paste', '.cpyEvent', function (event) {
        var pastedData = (event.originalEvent || event).clipboardData.getData('text');
        if (!pastedData.includes('\t')) {
            return;
        }
        pastedData = pastedData.trim();
        var list = pastedData.split('\n');
        var ta = $('#tbFunc11 tbody tr textarea');
        ta.val('');

        list.forEach(v => {
            var tmp = v.replaceAll('\r', '').split('\t');
            for (var i = 0; i < tmp.length; i++) {
                if (ta[i]) {
                    ta[i].value += (ta[i].value == '' ? tmp[i] : '\n' + tmp[i]);
                }
            }
        });
        event.preventDefault();
    });
    // 데이터 추가
    $('#btnFunc11_1').click(function () {
        var id = $('#tbFunc11 thead th').length;
        $('#tbFunc11 thead tr').append(getElem('th|input', `^${id}^`, `|type="checkbox" title="같은 값 사용(데이터 1개만 입력)"`));
        $('#tbFunc11 tbody tr').append(getElem('td|textarea', '', `|data-id="^${id}^" class="cpyEvent"`));
    });
    // 문자열 반복 생성 실행
    $('#btnFunc11_2').click(function () {
        var area = $('#tbFunc11 tbody tr td textarea');
        var chk = $('#tbFunc11 thead tr th input[type="checkbox"]');
        const query = $('#taFunc11').val();
        var result = '';
        var data = [];
        var cnt = 0;

        area.each((i, v) => {
            var list = $(v).val().split('\n');
            cnt = cnt < list.length ? list.length : cnt;
            data.push(list);
        });

        for (var i = 0; i < cnt; i++) {
            var q = query;
            for (var j = 0; j < data.length; j++) {
                var d = data[j][i];
                if (chk[j].checked) {
                    q = q.replaceAll(area[j].dataset.id, data[j][0]);
                }
                else if (d) {
                    q = q.replaceAll(area[j].dataset.id, d);
                }
                else {
                    q = q.replaceAll(area[j].dataset.id, '데이터가 없음');
                }
            }
            result += q + '\n';
        }

        copy(result);
    });
    // 문자 변환
    $('#btnFunc12').click(function () {
        var before = $('#inFunc12_1').val();
        var after = $('#inFunc12_2').val();

        if($('#chkFunc12').is(':checked')) {
            before = new RegExp(before, 'g');
            after = after.replace(/(?<!\\)\\n/g, '\n').replace(/\\\\n/g, '\\n').replace(/(?<!\\)\\t/g, '\t').replace(/\\\\t/g, '\\t');
        }
        else{
            before = before.replace(/(?<!\\)\\n/g, '\n').replace(/\\\\n/g, '\\n').replace(/(?<!\\)\\t/g, '\t').replace(/\\\\t/g, '\\t');
            after = after.replace(/(?<!\\)\\n/g, '\n').replace(/\\\\n/g, '\\n').replace(/(?<!\\)\\t/g, '\t').replace(/\\\\t/g, '\\t');
        }

        var result = $('#taFunc12').val().replaceAll(before, after);
        copy(result);
        $('#taFunc12').val(result);
    });
    // 날짜 변환(대전대 학사일정 한글파일 포맷을 수정)
    $('#btnFunc13').click(function () {
        const year = $('#inFunc13').val();
        const months = {
            '1': '01', '2': '02', '3': '03', '4': '04', '5': '05',
            '6': '06', '7': '07', '8': '08', '9': '09', '10': '10',
            '11': '11', '12': '12',
            '01':'01', '02':'02', '03':'03', '04':'04', '05':'05',
            '06':'06', '07':'07', '08':'08', '09':'09'
        };

        var result = $('#taFunc13').val().replaceAll(' ', '').replaceAll('\n\n', '\n').trim().split('\n').map(line => {
            const match = line.match(/(\d+)\.(\d+)\./);
            if (match) {
                const month = months[match[1]];
                const day = match[2].padStart(2, '0');
                const date = `${year}/${month}/${day}`;

                if (line.includes('~')) {
                    const endMatch = line.match(/~(\d+)\.(\d+)\./);
                    if (endMatch) {
                        const endMonth = months[endMatch[1]];
                        const endDay = endMatch[2].padStart(2, '0');
                        return `${date}\t${year}/${endMonth}/${endDay}`;
                    }
                }
                return `${date}\t${date}`;
            }
            return line; // 변환할 수 없는 형식은 그대로 반환
        }).join('\n');

        copy(result);
        $('#taFunc13').val(result);
    });
    // svn 파일 경로를 운영 서버 경로로 수정
    $('#btnFunc14').click(function () {
        var data = $('#taFunc14').val().split('\n');
        data = data.map(v => {
            v = v.replaceAll('\\', '/');
            var result = '';
            if(v.substring(v.lastIndexOf('.'), v.length) == '.java'){
                // 자바 파일
                result = '/webapp/WEB-INF/classes'+v.substring(v.indexOf('/egovframework'), v.lastIndexOf('.'))+'.class';
            }
            else if(v.substring(v.lastIndexOf('.'), v.length) == '.xml'){
                // mapper 파일
                result = '/webapp/WEB-INF/classes'+v.substring(v.indexOf('/egovframework'), v.length);
            }
            else{
                // jsp 파일
                result = v.substring(v.indexOf('/webapp/'), v.length);
            }
            if(v.indexOf('D ') == 0){
                result = '-' + result;
            }
            return result;
        });
        $('#taFunc14').val(data.join('\n'));
        copy($('#taFunc14').val());
    });

    // 목록 정렬
    $('#btnFunc15').click(function () {
        var data = $('#taFunc15').val().split('\n');
        // 숫자 문자
        var type1 = $('#selFunc15_1').val();
        // 오름차 내림차
        var type2 = $('#selFunc15_2').val();

        if(type1 == 'char'){
            if(type2 == 'asc'){
                data.sort();
            }
            else if(type2 == 'desc'){
                data.sort().reverse();
            }
        }
        else if(type1 == 'num'){
            var charArr = data.filter(v => {
                const match = v.match(/^\d+/);
                return match ? false : true;
            });
            var numArr = data.filter(v => {
                const match = v.match(/^\d+/);
                return match ? true : false;
            });
            if(type2 == 'asc'){
                numArr.sort((a, b) => {
                    const numA = parseInt(a.match(/^\d+/)?.[0]) || Infinity; // 앞의 숫자 추출
                    const numB = parseInt(b.match(/^\d+/)?.[0]) || Infinity; // 앞의 숫자 추출

                    if (numA === numB) {
                        return a.localeCompare(b); // 숫자가 같으면 문자열 순으로 정렬
                    }
                    return numA - numB; // 숫자 순으로 정렬
                });
                charArr.sort();
                data = numArr.concat(charArr);
            }
            else if(type2 == 'desc'){
                numArr.sort((a, b) => {
                    const numA = parseInt(a.match(/^\d+/)?.[0]) || Infinity; // 앞의 숫자 추출
                    const numB = parseInt(b.match(/^\d+/)?.[0]) || Infinity; // 앞의 숫자 추출

                    if (numA === numB) {
                        return b.localeCompare(a); // 숫자가 같으면 문자열 순으로 정렬
                    }
                    return numB - numA; // 숫자 순으로 정렬
                });
                charArr.sort().reverse();
                data = numArr.concat(charArr);
            }
        }
        
        $('#taFunc15').val(data.join('\n'));
        copy($('#taFunc15').val());
    });

    // 목록 개수 구하기
    $('#btnFunc16').click(function () {
        $('#pFunc16').text($('#taFunc16').val().split('\n').length + '개');
    });

    // 앞에 붙은 숫자 채우기
    $('#btnFunc17').click(function () {
        var data = $('#taFunc17').val().split('\n');
        var type = $('[name="rdFunc17"]:checked').val();
        var len = $('#inpFunc17_1').val();
        var char = $('#inpFunc17_2').val();
        data = data.map(v => {
            var num = v.match(/^\d+/)?.[0];
            v = v.replace(/^\d+/, '');
            if(num != undefined){
                if(type == 'left'){
                    return num.padStart(len, char)+v;
                }
                else if(type == 'right'){
                    return num.padEnd(len, char)+v;
                }
            }
            else{
                return v;
            }
        });
        $('#taFunc17').val(data.join('\n'));
        copy($('#taFunc17').val());
    });

    // 폴더 생성 배치 명령어 생성
    $('#btnFunc18').click(function(){
        var path = $('#inFunc18_1').val().trim();
        if(path){
            path = path.replaceAll('/', '\\') + '\\';
            path = path.replaceAll('\\\\', '\\');
        }
        const data = $('#taFunc18').val().split('\n').map(v => {
            return 'mkdir ' + path + v.replaceAll('/', '\\') + ' \\p';
        });
        var result = '@echo off\n'+data.join('\n');
        $('#taFunc18').val(result);
        copy($('#taFunc18').val());
    });

    // 문자 추출
    $('#btnFunc19').click(function(){
        const data = $('#taFunc19_1').val();
        const start = $('#inFunc19_1').val();
        const end = $('#inFunc19_2').val();
        let regex = new RegExp(start + '(.*?)' + end, 'g');
        let matches = [];
        let match;
        
        while ((match = regex.exec(data)) !== null) {
            matches.push(match[1].trim()); // 시작과 끝 문자열 사이의 내용 추가
        }

        // 결과 출력
        if(matches.length > 0){
            $('#taFunc19_2').val(matches.join('\n'));
            copy($('#taFunc19_2').val());
        }
        else{
            $('#taFunc19_2').val("일치하는 값이 없습니다.");
        }
    });

    // 숫자 생성
    $('#btnFunc20').click(function(){
        const start = Number($('#inFunc20_1').val());
        const end = Number($('#inFunc20_2').val());
        let result = '';
        for(let i = start; i <= end; i++){
            result += i + '\n';
        }
        copy(result);
    });

    // CRUD Mapper 생성기
    $('#btnFunc21_1, #btnFunc21_2').click(function(){
        var readFile = null;
        if($(this).attr('id') == 'btnFunc21_1'){
            readFile = $('#fileFunc21_1')[0].files[0];
        }
        else if($(this).attr('id') == 'btnFunc21_2'){
            readFile = $('#fileFunc21_2')[0].files[0];
        }
        
        if(readFile){
            const reader = new FileReader();

          reader.onload = function(e) {
            const fileContent = e.target.result;
            const namespace = $('#inFunc21_1').val();
            const keyword = $('#inFunc21_2').val();
            const keyword2 = keyword.replace(/^./, match => match.toLowerCase());
            const tableName = $('#inFunc21_3').val();
            const alias = $('#inFunc21_4').val();
            const aliasUpper = alias.toUpperCase();
            const aliasLower = alias.toLowerCase();
            const pKey = $('#inFunc21_5').val();
            const dataName = $('#inFunc21_6').val();
            const path = $('#inFunc21_7').val();
            const columns = $('#taFunc21_1').val().split('\n');
            let selectColumns = '';
            let insertColumns = '';
            let insertColumns2 = '';
            let updateColumns = '';

            for(let i = 0; i < columns.length; i++){
               const col = columns[i];
               if(i != 0){
                    selectColumns += '\t\t\t,';
                    insertColumns += '\t\t\t,';
                    insertColumns2 += '\t\t\t,';
                    updateColumns += '\t\t\t,';
               }
               selectColumns += aliasUpper + '.' + col;
               insertColumns += col;
               insertColumns2 += `#{${toCamelCase(col)}}`;
               updateColumns += `${col} = #{${toCamelCase(col)}}`;
               if(i != columns.length - 1){
                    selectColumns += '\n';
                    insertColumns += '\n';
                    insertColumns2 += '\n';
                    updateColumns += '\n';
               }
            }

            let result = fileContent;
            result = result.replaceAll('|NAMESPACE|', namespace);
            result = result.replaceAll('|KEYWORD|', keyword);
            result = result.replaceAll('|KEYWORD2|', keyword2);
            result = result.replaceAll('|TABLE_NAME|', tableName);
            result = result.replaceAll('|ALIAS_UPPER|', aliasUpper);
            result = result.replaceAll('|ALIAS_LOWER|', aliasLower);
            result = result.replaceAll('|ALIAS|', alias);
            result = result.replaceAll('|P_KEY|', pKey);
            result = result.replaceAll('|P_KEY_SNAKE|', toCamelCase(pKey));
            result = result.replaceAll('|DATA_NAME|', dataName);
            result = result.replaceAll('|PATH|', path);
            result = result.replaceAll('|SELECT_COLUMNS|', selectColumns);
            result = result.replaceAll('|INSERT_COLUMNS|', insertColumns);
            result = result.replaceAll('|INSERT_COLUMNS2|', insertColumns2);
            result = result.replaceAll('|UPDATE_COLUMNS|', updateColumns);

            copy(result);
          };

          reader.onerror = function(e) {
            console.error('파일 읽기 오류:', e);
          };

          reader.readAsText(readFile);
        }
        else{
            alert('파일 먼저 선택');
        }
    });

    // URL에서 파라미터 추출
    $('#btnFunc22').click(function(){
        const urls = $('#taFunc22').val();
        let result = [];
        let keys = $('#inFunc22').val().split(',');
        for(var url of urls.split('\n')){
            const params = new URLSearchParams(url.split('?')[1]);
            const temp = [];
            for(const key of keys){
                temp.push(params.get(key));
            }
            result.push(temp.join('\t'));
        }
        copy(result.join('\n'));
    });

    // 엑셀 텍스트 포함 여부 확인
    $('#btnFunc23').click(function(){
        copy(`Sub HighlightCellsBasedOnList()
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
End Sub`);
    });

    // 버튼 클릭 시 팝업 출력
    $('button').click(function () {
        showPopup();
    });
    // HTML 태그 생성
    function getElem(teg, str, attr) {
        var tags = teg.split('|');
        var attrs = attr ? attr.split('|') : '';
        if (str == undefined) {
            str = '';
        }

        if (tags.length == 1) {
            if (attr) {
                return `<${teg} ${attr}>${str}</${teg}>`;
            }
            else {
                return `<${teg}>${str}</${teg}>`;
            }
        }
        else {
            var result = '';
            for (var i = 0; i < tags.length; i++) {
                var a = attrs[i] ? ' ' + attrs[i] : '';
                result += `<${tags[i]}${a}>`;
            }
            result += str;
            for (var i = tags.length - 1; i >= 0; i--) {
                result += `</${tags[i]}>`;
            }

            return result;
        }
    }
    // 문자열 복사해서 클립보드에 넣기
    function copy(str) {
        if (str.slice(-1) == '\n') {
            str = str.slice(0, -1);
        }
        const t = document.createElement("textarea");
        document.body.appendChild(t);
        t.value = str;
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
        return str;
    }
    // 문자열 반복
    function strMul(str, num) {
        var r = '';
        for (var i = 0; i < num; i++) {
            r += str;
        }
        return r;
    }
    // 캬멜 케이스로 수정
    function toCamelCase(str){
        str = str.toLowerCase();
        var result = str.replace(/_([a-z])/g, function (match, letter) {
            return letter.toUpperCase();
        });
        return result;
    }
});