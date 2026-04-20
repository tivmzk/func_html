# /add-func — func.html에 새 유틸리티 기능 추가

이 스킬은 `func.html`과 `script.js`에 새 유틸리티 기능 섹션을 추가한다.

## Step 1: 다음 기능 번호 파악

`func.html`을 읽어 현재 가장 높은 FuncN 번호를 찾는다.
`id="btnFunc(\d+)"` 패턴으로 검색 후, 최대값 + 1이 새 번호(N)가 된다.

## Step 2: 기능 내용 파악

사용자가 args로 기능 설명을 전달했으면 그대로 사용한다.
없으면 사용자에게 아래 항목을 질문한다:
- 기능 제목 (h3에 들어갈 텍스트)
- 입력 형태 (아래 레이아웃 유형 중 선택)
- 버튼 이름 ("실행" 또는 "복사" 등)
- 기능 로직 설명

## Step 3: 레이아웃 유형 선택

기능 성격에 따라 HTML 구조를 결정한다:

**section1 (기본형)** — 입력 textarea 1개, 결과를 같은 textarea에 덮어씀. 가장 많이 쓰임.
```html
<div class="section1">
	<div class="secTit">
		<h3>기능 제목</h3>
		<button type="button" id="btnFuncN">실행</button>
	</div>
	<textarea id="taFuncN"></textarea>
</div>
```

**section1 (입력 + textarea)** — 추가 옵션 input이 있는 경우. inFuncN_1, inFuncN_2 등 사용.
```html
<div class="section1">
	<div class="secTit">
		<h3>기능 제목</h3>
		<button type="button" id="btnFuncN">실행</button>
	</div>
	<input id="inFuncN_1" type="text" placeholder="옵션 설명" />
	<textarea id="taFuncN"></textarea>
</div>
```

**section2 (비교형)** — 두 개의 입력을 비교하거나 교차하는 경우.
```html
<div class="section2">
	<div class="secTit">
		<h3>기능 제목</h3>
		<button type="button" id="btnFuncN">실행</button>
	</div>
	<div class="div">
		<div>
			<h4>입력1</h4>
			<textarea id="taFuncN_1"></textarea>
		</div>
		<div>
			<h4>입력2</h4>
			<textarea id="taFuncN_2"></textarea>
		</div>
	</div>
	<div id="resultFuncN"></div>
</div>
```

**section4 (테이블형)** — 결과를 테이블로 표시하는 경우.
```html
<div class="section4">
	<div class="secTit">
		<h3>기능 제목</h3>
		<div>
			<button type="button" id="btnFuncN_1">추가</button>
			<button type="button" id="btnFuncN_2">실행</button>
		</div>
	</div>
	<textarea id="taFuncN"></textarea>
	<div class="div">
		<table id="tbFuncN">
			<thead><tr></tr></thead>
			<tbody><tr></tr></tbody>
		</table>
	</div>
</div>
```

## Step 4: func.html 수정

`</body>` 바로 앞, 마지막 `</div>` 다음에 새 섹션 HTML을 삽입한다.
탭 들여쓰기를 기존 코드와 동일하게 유지한다 (탭 문자 사용).

## Step 5: script.js 수정

`script.js`의 마지막 헬퍼 함수(`toCamelCase`) 정의 **바로 앞**에 클릭 핸들러를 추가한다.

기본 핸들러 패턴:
```js
$('#btnFuncN').click(function () {
    var val = $('#taFuncN').val();
    if (!val.trim()) return;

    var lines = val.split('\n');
    var result = '';

    // 기능 로직

    $('#taFuncN').val(copy(result));
    showPopup();
});
```

규칙:
- 결과를 textarea에 다시 쓸 때는 `copy(result)`로 클립보드에도 복사한다
- 입력이 비었으면 `if (!val.trim()) return;`으로 조기 반환한다
- 줄 단위 처리는 `val.split('\n')`으로 배열화 후 처리한다
- `showPopup()`은 `copy()` 호출 시 자동 실행되므로 별도 호출 불필요
- 기존 헬퍼 함수 활용: `copy()`, `showPopup()`, `getElem()`, `toCamelCase()`, `strMul()`

## Step 6: 완료 보고

추가된 내용을 아래 형식으로 보고한다:
- 섹션 번호: FuncN
- func.html: 삽입한 HTML 요약
- script.js: 추가한 핸들러 요약
- 사용 방법: 브라우저에서 어떻게 쓰는지 한 줄 설명
