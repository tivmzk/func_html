# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소의 코드 작업 시 참고하는 가이드입니다.

## 개요

빌드 시스템, 서버, 패키지 매니저 없는 정적 브라우저 기반 개발자 유틸리티 도구입니다. `func.html`을 브라우저에서 직접 열어 사용합니다.

## 아키텍처 (func_html 메인 도구)

jQuery를 사용하는 단일 페이지 HTML 도구입니다:

- **`func.html`** — 24개 이상의 유틸리티 기능 섹션 선언. 각 섹션은 `.secTit > h3` 제목과 `btnFuncN`, `taFuncN`, `inFuncN` 형식의 ID를 가진 입력/출력 요소로 구성됩니다.
- **`script.js`** — 모든 로직. 로드 시 `[class^=section]` 요소에서 목차를 자동 생성하고, 모든 섹션을 숨긴 뒤 `history.pushState`로 뒤로가기 버튼 네비게이션을 지원합니다. 각 기능은 해당 `btnFuncN` 버튼의 jQuery 클릭 핸들러입니다.
- **`style.css`** — 스타일.
- **`jquery.js`** — jQuery 로컬 번들 (CDN 미사용).

### 코드 생성 템플릿

`controller.java`와 `mapper.xml`은 실제 소스 파일이 아닌 **템플릿 파일**로, `|KEYWORD|`, `|ALIAS|`, `|TABLE_NAME|`, `|NAMESPACE|` 등의 `|PLACEHOLDER|` 토큰을 포함합니다. CRUD 생성기(섹션 21)에서 파일 입력으로 읽어 플레이스홀더를 치환해 완성된 코드를 출력합니다.

플레이스홀더 규칙:
- `|KEYWORD|` — PascalCase 엔티티명 (예: `SpnBplc`)
- `|KEYWORD2|` — camelCase 버전
- `|ALIAS|` — 짧은 접두사 (예: `Sb`)
- `|ALIAS_LOWER|` / `|ALIAS_UPPER|` — 소문자/대문자 변형
- `|NAMESPACE|` — MyBatis 매퍼 네임스페이스 (예: `sb_spnBplc`)
- `|TABLE_NAME|`, `|P_KEY|`, `|P_KEY_SNAKE|`, `|PATH|`, `|DATA_NAME|` — 테이블 및 라우팅 정보

### 대상 프레임워크

생성된 코드는 대전대학교 및 전남 기관에서 사용하는 **nForU v3.2** Spring MVC + MyBatis + Oracle DB 플랫폼을 대상으로 합니다. `commonService` 패턴, `CommonMap`, `CommonAuth`, `SystemSessionInfo`, Oracle rownum 페이징은 모두 해당 프레임워크의 관례입니다.

## 새 유틸리티 기능 추가 방법

1. `func.html`에 `.secTit > h3` 제목과 `btnFuncN`, `taFuncN` 등의 ID를 가진 입력/출력 요소가 있는 `<div class="sectionN">` 블록을 추가합니다.
2. `script.js`에 클릭 핸들러를 추가합니다. 결과는 보통 textarea에 다시 기록되고 `copy()` 헬퍼로 클립보드에 복사됩니다.
3. 목차와 표시/숨김 동작은 자동으로 처리됩니다. 다른 곳 수정 불필요.

## script.js 주요 헬퍼 함수

- `copy(text)` — 텍스트를 클립보드에 복사하고 반환
- `showPopup()` — "실행 완료" 토스트 알림 표시
- `getElem(tag, content, attr)` — HTML 요소 문자열 생성 (`'p|strong'` 같은 파이프 구분 태그 체인 지원)

---

## 대전대_식단/식단_생성.html

대전대학교 홈페이지에 게시할 **주간 식단표 HTML 코드를 생성**하는 독립 도구입니다. 빌드 시스템 없이 브라우저에서 직접 열어 사용합니다.

### 파일 구조

```
대전대_식단/
├── 식단_생성.html   # 현재 사용 버전 (최신)
└── test.txt        # 구버전 초안 (참고용, 사용하지 않음)
```

### 주요 기능

**툴바 버튼**

| 버튼 | 함수 | 설명 |
|------|------|------|
| 테이블 HTML 복사 | `copyTableHTML()` | 현재 식단표를 홈페이지용 HTML로 변환 후 클립보드 복사 |
| HTML 일괄 입력 | `inputHtmlAll()` | 기존 게시된 HTML을 붙여넣어 식단표에 자동 파싱 입력 |
| 엑셀 일괄 입력 | `inputExcelAll()` | 엑셀에서 복사한 탭 구분 데이터를 선택한 식사 행에 입력 |
| 빈칸 제거 | `removeSpace()` | 각 셀에서 빈 줄 및 `-`, `X`, `0`만 있는 줄 제거 |
| 클리어 | `allClear()` | 모든 식단 내용 초기화 |
| 이번주 날짜 | `inputDate()` | 이번 주 월~금 날짜를 `YYYY.MM.DD.` 형식으로 자동 입력 |
| 다음주 날짜 | `inputNextDate()` | 다음 주 월~금 날짜를 `YYYY.MM.DD.` 형식으로 자동 입력 |

**식단표 구조**

- 헤더 행: 구분 + 날짜 5열 (월~금), 날짜는 `<input type="text">`로 직접 편집 가능
- 바디 행: 조식 / 중식\n[Extras Bar] / 석식 (3행 × 5열 textarea)
- 제목 선택: 드롭다운(`혜화문화관`, `2생활관`, `5생활관(HRC)`) 또는 직접 입력

**붙여넣기 자동 입력 (덮어쓰기 모드)**

- 하단 일괄 입력 영역의 "덮어쓰기 여부" 체크박스 활성화 시
- tbody의 특정 textarea에 엑셀 데이터를 붙여넣으면 같은 행의 이후 셀들에 자동 분배 입력됨
- 입력 후 `removeSpace()` 자동 실행

### 출력 HTML 구조

```html
<div>
  <h4 class="tit2">혜화문화관</h4>
  <div class="tbl_st scroll_gr mgt10">
    <table>
      <caption>혜화문화관 식단 내용</caption>
      <colgroup>
        <col style="width: 20%">       <!-- 구분 열 -->
        <col style="width: 16%">       <!-- 날짜 열 (80% / 열 수) -->
        ...
      </colgroup>
      <thead>
        <tr>
          <th style="font-weight: bold">구분</th>
          <th style="font-weight: bold">2026.04.21.</th>
          ...
        </tr>
      </thead>
      <tbody>
        <tr style="height: 150px">
          <th>조식</th>
          <td>메뉴1<br>메뉴2</td>
          ...
        </tr>
        ...
      </tbody>
    </table>
  </div>
</div>
```

- 줄바꿈(`\n`)은 `<br>`로 변환되어 출력됩니다.
- 생성된 HTML은 nForU 홈페이지의 `.tbl_st` CSS 클래스에 맞춰 스타일링됩니다.
- th에는 `font-weight: bold`, tr에는 `height: 150px` 인라인 스타일이 적용됩니다.

### 주요 헬퍼 함수

- `replaceText(str)` — HTML 엔티티(`&amp;`, `&lt;` 등) 및 `<br>` 태그를 일반 텍스트/줄바꿈으로 변환
- `getWeekdayDates(nextWeekAt)` — 이번 주 또는 다음 주 월~금 날짜 배열 반환
- `formatAsYYYYMMDD_Dot(date)` — Date 객체를 `YYYY.MM.DD.` 형식 문자열로 포맷
